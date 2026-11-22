# -*- coding: utf-8 -*-
"""Revisión previa a publicar.

    python3 sitio.py comprobar              construye una copia limpia del sitio en una carpeta temporal y la revisa
    python3 sitio.py comprobar --dist       revisa la carpeta dist/ tal como está

Errores (impiden publicar, el programa termina con código 1):
    enlaces o recursos que no existen, enlaces vacíos («#»), títulos o descripciones vacíos, páginas sin un único <h1>,
    imágenes sin atributo alt, JSON-LD inválido, textos de plantilla sin rellenar («ESCRIBE…», «{{…}}», lorem ipsum),
    referencias url() de CSS rotas, ids repetidos y, en producción, falta de canonical, noindex o sitemap incompleto,
    y, en producción, datos del titular sin completar («[COMPLETAR POR EL TITULAR]» en las páginas legales).
Avisos (conviene mirarlos, no bloquean): títulos o descripciones demasiado cortos o largos, elementos sin pagina.html
    y que el entorno siga en «preproduccion».
"""
from __future__ import annotations

import json
import re
import shutil
import sys
import tempfile
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

from . import seguridad
from .nucleo import RAIZ, ErrorProyecto, leer_json
from .paginas import Constructor
from .plantilla import ErrorPlantilla

# En HTML se buscan también llaves de plantilla sin resolver; en CSS/JS/SVG no (ahí «{{» puede salir en un comentario).
TEXTO_RELLENO_HTML = re.compile(r"\bESCRIBE\b|\{\{|(?i:lorem ipsum dolor)")
TEXTO_RELLENO = re.compile(r"\bESCRIBE\b|(?i:lorem ipsum dolor)")
MARCA_PENDIENTE = 'class="pendiente"'
EXTENSIONES_TEXTO = {".html", ".css", ".js", ".json", ".svg", ".xml", ".txt", ".webmanifest"}
BASE = "https://sitio.local"
# Seguridad: lo único ajeno que una página puede cargar es el código de AdSense (y solo con publicidad activa) y su botón de anuncio en línea.
SCRIPT_ADSENSE = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
PUSH_ADSENSE = "(adsbygoogle = window.adsbygoogle || []).push({});"
# Código que en el navegador convierte texto en código o en HTML. En el JavaScript propio del sitio no debe aparecer (lo ajeno, vendor/, queda fuera).
SUMIDEROS_JS = re.compile(r"\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\b|\beval\s*\(|new\s+Function\b|"
                          r"setAttribute\(\s*['\"]style['\"]|createElement\(\s*['\"](?:style|iframe)['\"]|\bsrcdoc\b|javascript:")
# Archivos que no deben acabar en el servidor: copias, código fuente, mapas de depuración, secretos, comprimidos.
SUFIJOS_PROHIBIDOS = (".bak", ".old", ".orig", ".sql", ".log", ".ini", ".env", ".py", ".md", ".map", ".zip", ".tar", ".gz", ".sh", ".pyc", "~")


@dataclass
class Resultado:
    errores: list = field(default_factory=list)
    avisos: list = field(default_factory=list)
    paginas: int = 0

    def error(self, donde: str, texto: str):
        self.errores.append(f"{donde}: {texto}")

    def aviso(self, donde: str, texto: str):
        self.avisos.append(f"{donde}: {texto}" if donde else texto)

    @property
    def correcto(self) -> bool:
        return not self.errores


class _Lector(HTMLParser):
    """Recoge de una página lo que hay que revisar."""

    def __init__(self, host: str = ""):
        super().__init__(convert_charrefs=True)
        self.host = host
        self.titulo, self._en_titulo = "", False
        self.meta: dict[str, str] = {}
        self.canonical = None
        self.h1 = self.main = 0
        self.lang = None
        self.jsonld: list[str] = []
        self._en_jsonld, self._buf = False, []
        self.referencias: list[tuple[str, str, str]] = []   # (etiqueta, atributo, valor)
        self.ids: list[str] = []
        self.img_sin_alt = 0
        self._profundidad_oculta = 0   # dentro de <script>/<style> no se busca texto de relleno en el marcado visible
        self.csp = None                                 # contenido de <meta http-equiv="Content-Security-Policy">
        self.inseguro: list[str] = []                   # cosas que la política de contenido (CSP) bloquearía o que abren una puerta
        self.scripts_en_linea: list[str] = []
        self._en_script_en_linea, self._buf_script = False, []

    def _revisar_seguridad(self, tag, a):
        for k, v in a.items():
            if k.startswith("on"):
                self.inseguro.append(f"<{tag}> lleva el manejador en línea «{k}» (usa addEventListener en un archivo .js)")
            elif k == "style":
                self.inseguro.append(f"<{tag}> lleva un estilo en línea (style=…); pasa ese estilo a una clase del CSS")
            elif k in ("href", "src", "action", "formaction", "data", "srcdoc") and v.strip().lower().startswith(("javascript:", "data:text/html", "vbscript:")):
                self.inseguro.append(f"<{tag}> lleva una dirección ejecutable en «{k}»")
        if tag in ("iframe", "object", "embed", "applet", "base", "frame"):
            self.inseguro.append(f"el sitio no usa <{tag}> y la política de contenido lo prohíbe")
        elif tag == "style":
            self.inseguro.append("hay un bloque <style> en línea; el CSS va en archivos .css")
        elif tag == "form" and urlsplit(a.get("action", "")).netloc:
            self.inseguro.append("un formulario envía datos a otro dominio")
        elif tag == "meta" and a.get("http-equiv", "").lower() == "content-security-policy":
            self.csp = a.get("content", "")
        elif tag == "a" and a.get("target", "").lower() == "_blank" and "noopener" not in a.get("rel", "").lower():
            self.inseguro.append(f"enlace con target=\"_blank\" sin rel=\"noopener\": {a.get('href', '')}")
        if tag in ("script", "link", "img", "source", "audio", "video", "track") and not (tag == "link" and a.get("rel", "").lower() in ("canonical", "alternate", "author", "me", "next", "prev")):
            destino = a.get("src") or (a.get("href") if tag == "link" else "")
            if destino and urlsplit(destino).netloc not in ("", self.host) and not destino.startswith(SCRIPT_ADSENSE):
                self.inseguro.append(f"<{tag}> carga un recurso de otro dominio ({urlsplit(destino).netloc}); todo debe ser del propio sitio")

    def handle_starttag(self, tag, atributos):
        a = {k: (v if v is not None else "") for k, v in atributos}
        self._revisar_seguridad(tag, a)
        if tag == "script" and "src" not in a and a.get("type") != "application/ld+json":
            self._en_script_en_linea, self._buf_script = True, []
        if "id" in a:
            self.ids.append(a["id"])
        if tag == "html":
            self.lang = a.get("lang")
        elif tag == "title":
            self._en_titulo = True
        elif tag == "meta":
            clave = a.get("name") or a.get("property")
            if clave:
                self.meta[clave] = a.get("content", "")
        elif tag == "h1":
            self.h1 += 1
        elif tag == "main":
            self.main += 1
        elif tag == "img":
            if "alt" not in a:
                self.img_sin_alt += 1
            if "src" in a:
                self.referencias.append(("img", "src", a["src"]))
        elif tag == "a" and "href" in a:
            self.referencias.append(("a", "href", a["href"]))
        elif tag == "link" and "href" in a:
            if a.get("rel", "").lower() == "canonical":
                self.canonical = a["href"]
            else:
                self.referencias.append(("link", "href", a["href"]))
        elif tag == "script":
            if a.get("type") == "application/ld+json":
                self._en_jsonld, self._buf = True, []
            if "src" in a:
                self.referencias.append(("script", "src", a["src"]))
        elif tag == "use":
            ref = a.get("href", a.get("xlink:href"))
            if ref is not None:
                self.referencias.append(("use", "href", ref))
        elif tag == "source":
            if "src" in a:
                self.referencias.append(("source", "src", a["src"]))

    def handle_endtag(self, tag):
        if tag == "title":
            self._en_titulo = False
        elif tag == "script" and self._en_jsonld:
            self._en_jsonld = False
            self.jsonld.append("".join(self._buf))
        elif tag == "script" and self._en_script_en_linea:
            self._en_script_en_linea = False
            self.scripts_en_linea.append("".join(self._buf_script).strip())

    def handle_data(self, datos):
        if self._en_titulo:
            self.titulo += datos
        if self._en_jsonld:
            self._buf.append(datos)
        if self._en_script_en_linea:
            self._buf_script.append(datos)


def _leer_pagina(ruta: Path, host: str = "") -> _Lector:
    lector = _Lector(host)
    lector.feed(ruta.read_text(encoding="utf-8"))
    lector.close()
    return lector


def _url_de(dist: Path, archivo: Path) -> str:
    """Ruta pública de un html de dist: /recursos/x/ para recursos/x/index.html, /404.html para 404.html."""
    rel = archivo.relative_to(dist).as_posix()
    if rel.endswith("index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


class Revisor:
    def __init__(self, dist: Path, cfg: dict):
        self.dist, self.cfg = Path(dist), cfg
        self.host = urlsplit(cfg["url"]).netloc
        self.res = Resultado()
        self._cache: dict[Path, _Lector] = {}
        self._usados: set[Path] = set()   # archivos de dist/ a los que apunta alguna página o CSS

    # ---------------------------------------------------------------- utilidades
    def _destino(self, ruta_url: str) -> Path | None:
        """Archivo de dist que sirve una ruta pública, o None si no existe."""
        ruta = unquote(ruta_url).lstrip("/")
        candidatos = [self.dist / ruta / "index.html"] if (ruta == "" or ruta.endswith("/")) else [self.dist / ruta, self.dist / ruta / "index.html"]
        for c in candidatos:
            if c.is_file():
                return c
        return None

    def _ids_de(self, archivo: Path) -> set[str]:
        if archivo.suffix == ".html":
            if archivo not in self._cache:
                self._cache[archivo] = _leer_pagina(archivo)
            return set(self._cache[archivo].ids)
        if archivo.suffix == ".svg":
            return set(re.findall(r'\bid="([^"]+)"', archivo.read_text(encoding="utf-8")))
        return set()

    def _comprobar_referencia(self, donde: str, base: str, etiqueta: str, valor: str, ids_propios: set[str]):
        valor = valor.strip()
        if etiqueta == "a" and valor in ("", "#"):
            self.res.error(donde, "hay un enlace vacío (href=\"#\"). Un botón que no lleva a ninguna parte no debe existir.")
            return
        if valor == "":
            self.res.error(donde, f"<{etiqueta}> con una dirección vacía.")
            return
        if valor.lower().startswith(("javascript:", "data:", "mailto:", "tel:", "blob:")):
            if valor.lower().startswith("javascript:"):
                self.res.error(donde, "enlace «javascript:»: usa un <button> con su script.")
            return
        partes = urlsplit(urljoin(BASE + base, valor)) if not valor.lower().startswith(("http://", "https://", "//")) else urlsplit(valor)
        if partes.netloc and partes.netloc not in (urlsplit(BASE).netloc, self.host):
            return   # enlace a otro sitio: sin red no se puede comprobar
        if valor.startswith("#"):
            if valor[1:] not in ids_propios:
                self.res.error(donde, f"el enlace «{valor}» apunta a un id que no existe en la página.")
            return
        destino = self._destino(partes.path)
        if destino is None:
            self.res.error(donde, f"«{valor}» no existe en el sitio (<{etiqueta}>).")
            return
        self._usados.add(destino)
        if partes.fragment and destino.suffix in (".html", ".svg") and partes.fragment not in self._ids_de(destino):
            self.res.error(donde, f"«{valor}»: el archivo existe pero no tiene el id «{partes.fragment}».")

    # ---------------------------------------------------------------- una página
    def _pagina(self, archivo: Path):
        url = _url_de(self.dist, archivo)
        donde = url
        lector = _leer_pagina(archivo, self.host)
        self._cache[archivo] = lector
        produccion = self.cfg["entorno"] == "produccion"
        es_404 = archivo.name == "404.html"

        if not lector.lang:
            self.res.error(donde, "<html> no lleva el atributo lang.")
        titulo = " ".join(lector.titulo.split())
        if not titulo:
            self.res.error(donde, "el <title> está vacío.")
        elif len(titulo) > 65:
            self.res.aviso(donde, f"el título mide {len(titulo)} caracteres; Google suele cortarlo a partir de unos 60.")
        elif len(titulo) < 12:
            self.res.aviso(donde, f"el título es muy corto ({len(titulo)} caracteres).")
        desc = " ".join(lector.meta.get("description", "").split())
        if not desc:
            self.res.error(donde, "falta la meta description.")
        elif len(desc) > 165:
            self.res.aviso(donde, f"la descripción mide {len(desc)} caracteres; se cortará en los resultados (máximo recomendado, 160).")
        elif len(desc) < 50 and not es_404:
            self.res.aviso(donde, f"la descripción es corta ({len(desc)} caracteres); aprovecha hasta 160.")
        if lector.h1 != 1:
            self.res.error(donde, f"debe haber exactamente un <h1> y hay {lector.h1}.")
        if lector.main != 1:
            self.res.error(donde, f"debe haber exactamente un <main> y hay {lector.main}.")
        if lector.img_sin_alt:
            self.res.error(donde, f"{lector.img_sin_alt} imagen(es) sin atributo alt (si es decorativa, alt=\"\").")
        repetidos = sorted({i for i in lector.ids if lector.ids.count(i) > 1})
        if repetidos:
            self.res.error(donde, "ids repetidos: " + ", ".join(repetidos) + ".")

        robots = lector.meta.get("robots", "")
        if es_404:
            if "noindex" not in robots:
                self.res.error(donde, "la página 404 debe llevar noindex.")
        else:
            if not lector.canonical:
                self.res.error(donde, "falta <link rel=\"canonical\">.")
            elif not lector.canonical.startswith(self.cfg["url"].rstrip("/") + "/"):
                self.res.error(donde, f"el canonical «{lector.canonical}» no empieza por la URL del sitio ({self.cfg['url']}).")
            # «noindex, follow» es la forma deliberada (ficha con "indexar": false); «noindex, nofollow» es preproducción o un olvido
            if produccion and "noindex" in robots and "nofollow" in robots:
                self.res.error(donde, "en producción la página lleva noindex y Google no la indexará.")
            if not lector.meta.get("og:title") or not lector.meta.get("og:image"):
                self.res.error(donde, "faltan las etiquetas Open Graph (og:title / og:image).")
            imagen = lector.meta.get("og:image", "")
            if imagen and urlsplit(imagen).netloc == self.host:
                destino_og = self._destino(urlsplit(imagen).path)
                if destino_og is None:
                    self.res.error(donde, f"og:image apunta a «{imagen}», que no existe.")
                else:
                    self._usados.add(destino_og)

        for texto in lector.jsonld:
            try:
                datos = json.loads(texto)
            except json.JSONDecodeError as e:
                self.res.error(donde, f"JSON-LD no válido: {e.msg} (columna {e.colno}).")
                continue
            if not isinstance(datos, dict) or "@context" not in datos or not ({"@type", "@graph"} & set(datos)):
                self.res.error(donde, "JSON-LD sin @context o sin @type/@graph.")

        self._seguridad_pagina(donde, lector)

        ids = set(lector.ids)
        for etiqueta, _, valor in lector.referencias:
            self._comprobar_referencia(donde, url, etiqueta, valor, ids)

    def _seguridad_pagina(self, donde: str, lector: _Lector):
        carga_google = any(v == SCRIPT_ADSENSE or v.startswith(SCRIPT_ADSENSE + "?") for _, _, v in lector.referencias)
        esperada = seguridad.csp_meta(carga_google)
        if lector.csp is None:
            self.res.error(donde, "seguridad: falta la política de contenido (<meta http-equiv=\"Content-Security-Policy\">).")
        elif lector.csp != esperada:
            self.res.error(donde, "seguridad: la política de contenido de la página no es la que genera el sitio" +
                           (" (la página carga el código de Google y debería llevar la que lo admite)." if carga_google else "."))
        for texto in lector.scripts_en_linea:
            if not (texto == PUSH_ADSENSE and carga_google):
                self.res.error(donde, "seguridad: hay un <script> en línea; la política de contenido lo bloquearía. Pásalo a un archivo .js.")
        for problema in dict.fromkeys(lector.inseguro):
            self.res.error(donde, "seguridad: " + problema + ".")

    # ---------------------------------------------------------------- recursos
    def _css(self, archivo: Path):
        base = "/" + archivo.parent.relative_to(self.dist).as_posix() + "/"
        texto = archivo.read_text(encoding="utf-8")
        for m in re.finditer(r"url\(\s*(['\"]?)([^)'\"]+)\1\s*\)|@import\s+(['\"])([^'\"]+)\3", texto):
            valor = (m.group(2) or m.group(4) or "").strip()
            if not valor or valor.startswith(("data:", "#", "http://", "https://")):
                continue
            ruta = urlsplit(urljoin(BASE + base, valor)).path
            destino = self._destino(ruta)
            if destino is None:
                self.res.error("/" + archivo.relative_to(self.dist).as_posix(), f"CSS: «{valor}» no existe.")
            else:
                self._usados.add(destino)

    def _rellenos(self, archivo: Path):
        if "/herramientas/generador-lorem-ipsum/" in "/" + archivo.relative_to(self.dist).as_posix():
            return                                     # la herramienta que genera ese texto lo lleva a propósito
        texto = archivo.read_text(encoding="utf-8")
        patron = TEXTO_RELLENO_HTML if archivo.suffix == ".html" else TEXTO_RELLENO
        for n, linea in enumerate(texto.splitlines(), 1):
            m = patron.search(linea)
            if m:
                self.res.error("/" + archivo.relative_to(self.dist).as_posix(),
                               f"línea {n}: queda texto de plantilla sin rellenar («{m.group(0)}»). Es de un elemento que no has terminado.")
                break

    # ---------------------------------------------------------------- sitio
    def _robots_y_sitemap(self, paginas: list[Path]):
        produccion = self.cfg["entorno"] == "produccion"
        robots = self.dist / "robots.txt"
        mapa = self.dist / "sitemap.xml"
        if not robots.is_file():
            self.res.error("/robots.txt", "falta.")
        if not mapa.is_file():
            self.res.error("/sitemap.xml", "falta.")
            return
        if not produccion:
            self.res.aviso("", "el entorno es «preproduccion»: las páginas llevan noindex, robots.txt prohíbe rastrear y el sitemap está vacío. "
                               "Antes de publicar, cambia «entorno» a «produccion» en config/sitio.json.")
            return
        if robots.is_file():
            txt = robots.read_text(encoding="utf-8")
            if re.search(r"(?im)^\s*Disallow:\s*/\s*$", txt):
                self.res.error("/robots.txt", "en producción bloquea todo el sitio (Disallow: /).")
            if "Sitemap:" not in txt:
                self.res.error("/robots.txt", "falta la línea Sitemap:.")
        try:
            localizaciones = set(re.findall(r"<loc>([^<]+)</loc>", mapa.read_text(encoding="utf-8")))
        except OSError:
            localizaciones = set()
        esperadas = set()
        for archivo in paginas:
            if archivo.name == "404.html":
                continue
            lector = self._cache.get(archivo)
            if lector is not None and "noindex" in lector.meta.get("robots", ""):
                continue                      # página con "indexar": false: a propósito no está en el sitemap
            esperadas.add(self.cfg["url"].rstrip("/") + _url_de(self.dist, archivo))
        for falta in sorted(esperadas - localizaciones):
            self.res.error("/sitemap.xml", f"no incluye {falta}.")
        for sobra in sorted(localizaciones - esperadas):
            self.res.error("/sitemap.xml", f"incluye {sobra}, que no es una página del sitio.")

    def revisar(self) -> Resultado:
        if not self.dist.is_dir():
            self.res.error(str(self.dist), "no existe. Construye primero el sitio: python3 sitio.py construir")
            return self.res
        paginas = sorted(self.dist.rglob("*.html"))
        for archivo in paginas:
            self._pagina(archivo)
        self.res.paginas = len(paginas)
        for archivo in sorted(self.dist.rglob("*")):
            if not archivo.is_file() or archivo.suffix not in EXTENSIONES_TEXTO:
                continue
            if archivo.suffix == ".css":
                self._css(archivo)
            if archivo.suffix in (".html", ".css", ".js", ".json", ".svg"):
                self._rellenos(archivo)
        self._pendientes(paginas)
        self._sin_usar()
        self._robots_y_sitemap(paginas)
        self._seguridad_sitio()
        return self.res

    def _seguridad_sitio(self):
        """Archivos de cabeceras del servidor, nada prohibido publicado y JavaScript propio sin sumideros de inyección."""
        politicas = {seguridad.csp_cabecera(False), seguridad.csp_cabecera(True)}
        esperadas = {n: v for n, v in seguridad.cabeceras(False) if n != "Content-Security-Policy"}
        headers = self.dist / "_headers"
        htaccess = self.dist / ".htaccess"
        for archivo, formato in ((headers, "  {n}: {v}"), (htaccess, 'Header always set {n} "{v}"')):
            if not archivo.is_file():
                self.res.error("/" + archivo.name, "seguridad: falta este archivo de cabeceras del servidor (se genera al construir).")
                continue
            texto = archivo.read_text(encoding="utf-8")
            if not any(formato.format(n="Content-Security-Policy", v=p).strip() in texto for p in politicas):
                self.res.error("/" + archivo.name, "seguridad: no lleva la política de contenido (CSP) del sitio.")
            for n, v in esperadas.items():
                if formato.format(n=n, v=v).strip() not in texto:
                    self.res.error("/" + archivo.name, f"seguridad: falta la cabecera «{n}» con el valor del sitio.")
        for archivo in sorted(self.dist.rglob("*")):
            if not archivo.is_file():
                continue
            rel = "/" + archivo.relative_to(self.dist).as_posix()
            nombre = archivo.name.lower()
            if nombre.endswith(SUFIJOS_PROHIBIDOS) or (nombre.startswith(".") and nombre != ".htaccess") or "/.git/" in rel:
                self.res.error(rel, "seguridad: este archivo no debe publicarse (copia, código fuente, mapa, secreto u oculto).")
            elif archivo.suffix == ".js" and "/vendor/" not in rel:
                for n, linea in enumerate(archivo.read_text(encoding="utf-8").splitlines(), 1):
                    m = SUMIDEROS_JS.search(linea)
                    if m:
                        self.res.error(rel, f"seguridad, línea {n}: «{m.group(0)}» convierte texto en código o HTML; la política de contenido lo prohíbe y es la vía clásica de inyección.")
                        break

    def _pendientes(self, paginas: list[Path]):
        """Datos del titular sin completar. En preproducción basta el aviso que ya da la construcción; en producción es un error
        porque publicaría un aviso legal con huecos."""
        if self.cfg["entorno"] != "produccion":
            return
        con_marca = ["/" + p.relative_to(self.dist).as_posix() for p in paginas if MARCA_PENDIENTE in p.read_text(encoding="utf-8")]
        if con_marca:
            self.res.error("", "faltan datos del titular («[COMPLETAR POR EL TITULAR]») en " + ", ".join(con_marca)
                           + ". Rellena config/titular.json antes de publicar (ver docs/LEGAL-PENDIENTE.md).")

    def _sin_usar(self):
        """Archivos de assets/ (los comunes a todo el sitio) que ninguna página ni CSS usa: peso muerto que se publica sin motivo.
        Solo se mira assets/ porque ahí toda referencia está en HTML o CSS; los archivos de cada elemento pueden usarse desde su JavaScript."""
        base = self.dist / "assets"
        if not base.is_dir():
            return
        for archivo in sorted(base.rglob("*")):
            if archivo.is_file() and archivo not in self._usados and not archivo.name.upper().startswith("LICENCIA"):
                self.res.aviso("/" + archivo.relative_to(self.dist).as_posix(),
                               "ninguna página ni CSS usa este archivo, pero se publica. Bórralo si sobra.")


def comprobar(raiz: Path = RAIZ, usar_dist: bool = False) -> Resultado:
    """Revisa el proyecto. Sin usar_dist construye una copia limpia en una carpeta temporal (así no se revisa nada viejo)."""
    raiz = Path(raiz)
    cfg = leer_json(raiz / "config" / "sitio.json")
    if usar_dist:
        res = Revisor(raiz / "dist", cfg).revisar()
        return res
    temporal = Path(tempfile.mkdtemp(prefix="comprobar-"))
    try:
        constructor = Constructor(raiz, temporal / "dist")
        informe = constructor.construir()
        res = Revisor(temporal / "dist", constructor.cfg).revisar()
        for aviso in informe.avisos:
            res.aviso("", aviso)
        return res
    finally:
        shutil.rmtree(temporal, ignore_errors=True)


def principal(args: list) -> int:
    try:
        res = comprobar(usar_dist="--dist" in args)
    except (ErrorProyecto, ErrorPlantilla) as e:
        print(f"\nNo se ha podido construir el sitio para revisarlo:\n  {e}\n", file=sys.stderr)
        return 1
    for e in res.errores:
        print(f"ERROR  {e}")
    for a in res.avisos:
        print(f"AVISO  {a}")
    print(f"\n{res.paginas} páginas revisadas: {len(res.errores)} errores, {len(res.avisos)} avisos.")
    if res.errores:
        print("Hay errores: arréglalos antes de publicar.")
        return 1
    if res.avisos:
        print("Sin errores, pero antes de publicar resuelve los avisos de arriba (los de «preproduccion» y «titular» son los que impiden que el sitio esté listo).")
    else:
        print("Sin errores: el sitio está listo para publicar.")
    return 0

# -*- coding: utf-8 -*-
"""Construye el sitio: portada, listados, fichas, 404, robots y sitemap.

Todas las páginas pasan por dos plantillas: la de su contenido (portada/portada.html, <seccion>/listado.html,
<seccion>/ficha.html…) y el marco común (comun/marco.html: cabecera, pie, <head>).
"""
from __future__ import annotations

import shutil
import unicodedata
from dataclasses import dataclass, field
from datetime import date
from html import escape
from pathlib import Path

from . import seo
from .estilos import paquete_comun, paquete_portada, paquete_seccion
from .legal import leer_publicidad, leer_titular
from .nucleo import ErrorProyecto, fecha_larga, hash_corto, leer_json, plural, ruta_relativa, sin_ocultos
from .plantilla import Plantillas
from .scripts import script_comun, script_seccion
from .secciones import DIFICULTADES, Elemento, Seccion, descubrir

CAMPOS_CONFIG = ("nombre", "lema", "url", "idioma", "entorno", "portada", "mundos", "novedades_en_portada")


@dataclass
class Informe:
    paginas: list = field(default_factory=list)        # (url, tipo)
    avisos: list = field(default_factory=list)
    secciones: list = field(default_factory=list)      # (slug, publicados, proximos, borradores)

    def resumen(self) -> str:
        n = {}
        for _, tipo in self.paginas:
            n[tipo] = n.get(tipo, 0) + 1
        lineas = [f"Páginas generadas: {len(self.paginas)} "
                  f"(portada {n.get('portada', 0)}, listados {n.get('listado', 0)}, elementos {n.get('elemento', 0)}, 404 {n.get('404', 0)})."]
        for slug, pub, pro, bor in self.secciones:
            extra = []
            if pro:
                extra.append(f"{pro} próximamente")
            if bor:
                extra.append(f"{bor} en borrador, sin publicar")
            lineas.append(f"  {slug}: {pub} publicados" + (f" ({', '.join(extra)})" if extra else ""))
        for a in self.avisos:
            lineas.append(f"AVISO: {a}")
        return "\n".join(lineas)


def _normalizar(texto: str) -> str:
    """Minúsculas y sin acentos (la ñ se conserva), para que el buscador encuentre «cancion» al escribir «canción»."""
    marcada = unicodedata.normalize("NFD", texto.replace("ñ", "\u0001").replace("Ñ", "\u0001"))
    return "".join(c for c in marcada if unicodedata.category(c) != "Mn").replace("\u0001", "ñ").casefold()


class Constructor:
    def __init__(self, raiz: Path, salida: Path):
        self.raiz, self.salida = Path(raiz), Path(salida)
        self.informe = Informe()
        self._sitemap: list = []

    # ------------------------------------------------------------ configuración
    def _config(self) -> dict:
        ruta = self.raiz / "config" / "sitio.json"
        cfg = leer_json(ruta)
        donde = ruta_relativa(ruta, self.raiz)
        for clave in CAMPOS_CONFIG:
            if clave not in cfg:
                raise ErrorProyecto(f"{donde}: falta «{clave}».")
        if cfg["entorno"] not in ("preproduccion", "produccion"):
            raise ErrorProyecto(f"{donde}: «entorno» debe ser «preproduccion» o «produccion».")
        if not str(cfg["url"]).startswith("https://"):
            raise ErrorProyecto(f"{donde}: «url» debe empezar por https:// (por ejemplo https://trabajoyjuego.es).")
        for clave in ("titulo", "descripcion"):
            if not isinstance(cfg["portada"].get(clave), str) or not cfg["portada"][clave].strip():
                raise ErrorProyecto(f"{donde}: falta «portada» → «{clave}».")
        if not cfg["mundos"] or any(not {"id", "nombre", "frase"} <= set(m) for m in cfg["mundos"]):
            raise ErrorProyecto(f"{donde}: «mundos» debe ser una lista de objetos con «id», «nombre» y «frase».")
        return cfg

    # ------------------------------------------------------------ construcción
    def construir(self) -> Informe:
        self.cfg = self._config()
        self.secciones = descubrir(self.raiz, self.cfg["mundos"])
        self.titular = leer_titular(self.raiz)
        self.publicidad = leer_publicidad(self.raiz, self.cfg)
        self.informe.avisos.extend(self.publicidad["avisos"])
        self.plantillas = Plantillas(self.raiz)
        self.salida.mkdir(parents=True, exist_ok=True)
        self.paquetes = {"comun": paquete_comun(self.raiz), "portada": paquete_portada(self.raiz)}
        for s in self.secciones:
            self.paquetes[s.slug] = paquete_seccion(s, self.raiz)
        self.scripts = {s.slug: script_seccion(s, self.raiz) for s in self.secciones}
        if any(s.buscador for s in self.secciones):
            self.scripts["filtro"] = script_comun("filtro", self.raiz)
        if self.publicidad["activa"]:
            self.scripts["consentimiento"] = script_comun("consentimiento", self.raiz)
        self._copiar_recursos()
        self._portada()
        for s in self.secciones:
            self._listado(s)
            self.informe.secciones.append((s.slug, len(s.publicados), len(s.proximos),
                                          len(s.borradores)))
            for e in s.publicados:
                self._elemento(e)
            self._copiar_datos(s)
        self._no_encontrada()
        self._ads_txt()
        if not self.titular["completo"]:
            self.informe.avisos.append("Faltan datos del titular en config/titular.json (" + ", ".join(self.titular["faltan"]) +
                                       "): las páginas legales muestran «[COMPLETAR POR EL TITULAR]». Hay que rellenarlos antes de publicar.")
        (self.salida / "robots.txt").write_text(seo.robots_txt(self.cfg), encoding="utf-8")
        (self.salida / "sitemap.xml").write_text(seo.sitemap_xml(self.cfg, self._sitemap), encoding="utf-8")
        return self.informe

    def _copiar_recursos(self):
        css = self.salida / "assets" / "css"
        css.mkdir(parents=True, exist_ok=True)
        for p in self.paquetes.values():
            if p:
                (css / p.archivo).write_text(p.texto, encoding="utf-8")
        for origen in sin_ocultos(self.raiz / "comun" / "img"):
            if origen.is_file():
                destino = self.salida / ("favicon.ico" if origen.name == "favicon.ico" else f"assets/img/{origen.name}")
                destino.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(origen, destino)
        js = self.salida / "assets" / "js"
        for sc in self.scripts.values():
            if sc:
                js.mkdir(parents=True, exist_ok=True)
                (js / sc.archivo).write_text(sc.texto, encoding="utf-8")
        fuentes = self.raiz / "comun" / "fuentes"
        (self.salida / "assets" / "fonts").mkdir(parents=True, exist_ok=True)
        for origen in sin_ocultos(fuentes):
            if origen.suffix in (".woff", ".woff2") or origen.name.startswith("LICENCIA"):
                shutil.copy2(origen, self.salida / "assets" / "fonts" / origen.name)

    def _copiar_datos(self, s: Seccion):
        """<sección>/datos/ (por ejemplo juegos/datos/palabras.json) se publica tal cual en <sección>/datos/."""
        origen = s.carpeta / "datos"
        if not origen.is_dir():
            return
        for p in sorted(origen.rglob("*")):
            if p.is_file() and not any(parte.startswith((".", "_")) for parte in p.relative_to(origen).parts):
                destino = self.salida / s.slug / "datos" / p.relative_to(origen)
                destino.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(p, destino)

    def _ads_txt(self):
        """ads.txt: solo existe cuando hay publicidad activa, con el identificador real del editor (nunca uno inventado)."""
        if self.publicidad["activa"]:
            (self.salida / "ads.txt").write_text(f"google.com, {self.publicidad['editor']}, DIRECT, f08c47fec0942fa0\n", encoding="utf-8")

    # ------------------------------------------------------------ datos compartidos
    def _legales(self, raiz: str) -> tuple:
        """Enlaces legales del pie (secciones con ubicacion «pie») y la dirección de la configuración de cookies."""
        enlaces, cookies = [], ""
        for s in self.secciones:
            if s.ubicacion != "pie":
                continue
            for e in s.publicados:
                enlaces.append({"titulo": e.titulo, "href": raiz + e.url})
                if e.slug == "politica-de-cookies":
                    cookies = raiz + e.url + "#configurar"
        return enlaces, cookies

    def _nav(self, raiz: str, actual: str) -> list:
        nav, anterior = [], None
        for s in (x for x in self.secciones if x.ubicacion == "menu"):
            nav.append({"titulo": s.titulo, "href": raiz + s.url, "mundo": s.mundo, "actual": s.slug == actual,
                        "cambio": anterior is not None and anterior != s.mundo})
            anterior = s.mundo
        return nav

    def _mundos_pie(self, raiz: str) -> list:
        grupos = []
        for m in self.cfg["mundos"]:
            secs = [{"titulo": s.titulo, "href": raiz + s.url} for s in self.secciones if s.mundo == m["id"] and s.ubicacion == "menu"]
            if secs:
                grupos.append({"id": m["id"], "nombre": m["nombre"], "secciones": secs})
        return grupos

    def _tarjeta(self, e: Elemento, raiz: str, mostrar_seccion: bool) -> dict:
        t = e.tema
        categoria = next((c["nombre"] for c in e.seccion.categorias if c["id"] == e.categoria), "")
        dif_texto, dif_nivel = DIFICULTADES.get(e.dificultad, ("", 0))
        return {
            "categoria": e.categoria, "categoria_nombre": categoria, "dificultad": e.dificultad, "dificultad_texto": dif_texto,
            "dificultad_nivel": dif_nivel, "duracion": e.duracion, "accion": e.seccion.accion,
            "busqueda": _normalizar(" ".join([e.titulo, e.descripcion, categoria, *e.etiquetas])),
            "titulo": e.titulo, "descripcion": e.descripcion, "publicado": e.publicado,
            "href": raiz + e.url if e.publicado else "", "mundo": e.seccion.aspecto,
            "seccion_titulo": e.seccion.titulo, "mostrar_seccion": mostrar_seccion,
            "fecha_iso": e.fecha.isoformat() if e.fecha else "", "fecha_texto": fecha_larga(e.fecha) if e.fecha else "",
            "tema": bool(t),
            "tema_css": f"--t-fondo:{t['fondo']};--t-texto:{t['texto']};--t-acento:{t['acento']}" if t else "",
        }

    # ------------------------------------------------------------ escritura de una página
    def _pagina(self, url: str, plantilla: str, datos: dict, *, titulo: str, descripcion: str, mundo: str, tipo: str,
                seccion: str = "", item: str = "", css_extra: tuple = (), js_extra: tuple = (), jsonld: tuple = (),
                main_attrs: str = "", raiz: str | None = None, indexable: bool = True, og_tipo: str = "website",
                fecha: date | None = None, paquetes: tuple = (), scripts: tuple = ()):
        archivo = url if url.endswith(".html") else url + "index.html"
        if raiz is None:
            raiz = "../" * url.count("/")
        produccion = seo.es_produccion(self.cfg)
        hrefs_css = [f"{raiz}assets/css/{p.archivo}?v={p.version}" for p in (self.paquetes["comun"], *paquetes) if p]
        js_extra = [f"{raiz}assets/js/{self.scripts[n].archivo}?v={self.scripts[n].version}" for n in scripts if self.scripts.get(n)] + list(js_extra)
        canonical = seo.absoluta(self.cfg, url) if indexable else ""
        pagina = {
            "titulo": titulo, "descripcion": descripcion, "canonical": canonical,
            "robots": "" if (produccion and indexable) else "noindex, nofollow",
            "og": indexable, "og_tipo": og_tipo, "og_imagen": seo.absoluta(self.cfg, "assets/img/og.png"),
            "css": hrefs_css + list(css_extra), "js": list(js_extra), "jsonld": [seo.jsonld(j) for j in jsonld],
            "mundo": mundo, "seccion": seccion, "item": item, "main_attrs": main_attrs,
        }
        legales, cookies = self._legales(raiz)
        base = {
            "sitio": {"nombre": self.cfg["nombre"], "lema": self.cfg["lema"], "idioma": self.cfg["idioma"],
                      "anio": date.today().year, "locale": self.cfg["idioma"] + "_ES"},
            "raiz": raiz, "inicio": raiz or "./", "nav": self._nav(raiz, seccion), "mundos_pie": self._mundos_pie(raiz), "pagina": pagina,
            "legales": legales, "hay_legales": bool(legales), "cookies_href": cookies, "titular": self.titular,
            "publicidad": self.publicidad if tipo != "404" else {**self.publicidad, "activa": False, "bloque_listado": "", "bloque_juego": ""},
        }
        datos_total = {**base, **datos}
        contenido = self.plantillas.renderizar(plantilla, datos_total)
        html = self.plantillas.renderizar("comun/marco", {**datos_total, "contenido": contenido})
        destino = self.salida / archivo
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(html, encoding="utf-8")
        self.informe.paginas.append((url, tipo))
        if indexable:
            self._sitemap.append((url, fecha))

    # ------------------------------------------------------------ portada
    def _portada(self):
        # Lo más reciente primero. Si varios comparten fecha (p. ej. los juegos o herramientas publicados el mismo día), manda el «orden» de su ficha
        # y, a igualdad, el título: así «Lo último» no depende del alfabeto sino de lo que el titular haya querido destacar.
        publicados = sorted((e for s in self.secciones if s.ubicacion == "menu" for e in s.publicados),
                            key=lambda e: (-e.fecha.toordinal(), e.orden if e.orden is not None else 10**6, e.titulo.casefold()))
        n = int(self.cfg["novedades_en_portada"])
        novedades = [self._tarjeta(e, "", True) for e in publicados[:n]]
        raiz = ""
        mundos = []
        for i, m in enumerate(self.cfg["mundos"]):
            secs = []
            for s in self.secciones:
                if s.mundo != m["id"] or s.ubicacion != "menu":
                    continue
                cuenta = plural(len(s.publicados), s.singular, s.plural) if s.publicados else "Próximamente"
                secs.append({"href": raiz + s.url, "titulo": s.titulo, "resumen": s.resumen, "cuenta": cuenta})
            mundos.append({"id": m["id"], "nombre": m["nombre"], "frase": m["frase"], "primera": i == 0, "secciones": secs})
        ultima = max((e.fecha for e in publicados), default=None)
        explorar = self._explorar(raiz)
        datos = {
            "mundos": mundos, "novedades": novedades, "hay_novedades": bool(novedades),
            "explorar": explorar, "hay_explorar": bool(explorar),
            "vacio": {"titulo": "Todavía no hay nada publicado",
                      "texto": "Las herramientas, guías, juegos y tests nuevos aparecerán aquí según se vayan publicando.",
                      "mundo": "inicio"},
        }
        p = self.cfg["portada"]
        self._pagina("", "portada/portada", datos, titulo=p["titulo"], descripcion=p["descripcion"], mundo="inicio",
                     tipo="portada", jsonld=(seo.organizacion_jsonld(self.cfg),), fecha=ultima,
                     paquetes=(self.paquetes["portada"],))

    # ------------------------------------------------------------ listado de una sección
    def _explorar(self, raiz: str) -> list:
        """Índice de la portada: por cada sección del menú con categorías, sus categorías con los elementos publicados de cada una.
        Una sección o categoría sin nada publicado no aparece (nunca se enseña un hueco ni un enlace que no lleve a nada)."""
        bloques = []
        for s in self.secciones:
            if s.ubicacion != "menu" or not s.categorias or not s.publicados:
                continue
            grupos = []
            for c in s.categorias:
                items = [e for e in s.publicados if e.categoria == c["id"]]
                if not items:
                    continue
                # Con buscador, el enlace de la categoría abre el listado ya filtrado (?categoria=…); sin él, abre el listado entero.
                href = raiz + s.url + (f"?categoria={c['id']}" if (s.buscador and s.publicados) else "")
                grupos.append({"nombre": c["nombre"], "href": href, "cuenta": plural(len(items), s.singular, s.plural),
                               "items": [{"titulo": e.titulo, "href": raiz + e.url} for e in items]})
            if grupos:
                bloques.append({"id": s.slug, "titulo": s.titulo, "href": raiz + s.url, "mundo": s.aspecto,
                                "total": plural(len(s.publicados), s.singular, s.plural), "grupos": grupos})
        return bloques

    def _datos_seccion(self, s: Seccion, raiz: str) -> dict:
        return {"titulo": s.titulo, "slug": s.slug, "descripcion": s.descripcion, "singular": s.singular, "plural": s.plural,
                "mundo": s.mundo, "aspecto": s.aspecto, "href": raiz + s.url}

    def _listado(self, s: Seccion):
        raiz = "../"
        items = [self._tarjeta(e, raiz, False) for e in s.elementos if e.estado in ("publicado", "proximamente")]
        datos = {
            "seccion": self._datos_seccion(s, raiz), "items": items, "hay_items": bool(items),
            "vacio": {"titulo": "Todavía no hay nada aquí", "texto": s.vacio, "mundo": s.aspecto},
            "migas": [{"texto": "Inicio", "href": raiz}, {"texto": s.titulo, "href": ""}],
            "filtros": self._filtros(s),
        }
        if s.agrupar and s.categorias:
            ids = {c["id"] for c in s.categorias}
            bloques = [(c["id"], c["nombre"]) for c in s.categorias]
            if any(t.get("categoria") not in ids for t in items):
                bloques.append(("", "Otras"))
            datos["grupos"] = [{"id": i or "otras", "nombre": n, "items": g, "cuenta": plural(len(g), s.singular, s.plural)}
                               for i, n in bloques for g in [[t for t in items if (t.get("categoria") if t.get("categoria") in ids else "") == i]] if g]
            datos["hay_grupos"] = bool(datos["grupos"])
        grafo = {"@context": "https://schema.org", "@type": "CollectionPage", "name": s.titulo, "description": s.descripcion,
                 "url": seo.absoluta(self.cfg, s.url), "inLanguage": self.cfg["idioma"],
                 "isPartOf": {"@id": seo.absoluta(self.cfg, "") + "#sitio"}}
        if s.publicados:
            grafo["mainEntity"] = {"@type": "ItemList", "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "url": seo.absoluta(self.cfg, e.url), "name": e.titulo}
                for i, e in enumerate(s.publicados)]}
        migas = seo.migas_jsonld(self.cfg, [("Inicio", ""), (s.titulo, s.url)])
        self._pagina(s.url, f"{s.slug}/listado", datos, titulo=f"{s.titulo} | {self.cfg['nombre']}", descripcion=s.descripcion,
                     mundo=s.aspecto, tipo="listado", seccion=s.slug, jsonld=(grafo, migas),
                     fecha=max((e.fecha for e in s.publicados), default=None), paquetes=(self.paquetes[s.slug],),
                     scripts=("filtro",) if (s.buscador and s.publicados) else ())

    def _filtros(self, s: Seccion) -> dict:
        """Datos del buscador y los filtros del listado (se muestran solo con JavaScript; sin él se ve la lista entera)."""
        visibles = [e for e in s.elementos if e.estado in ("publicado", "proximamente")]
        cats = [{"id": c["id"], "nombre": c["nombre"], "cuenta": sum(1 for e in visibles if e.categoria == c["id"])} for c in s.categorias]
        cats = [c for c in cats if c["cuenta"]]
        difs = {e.dificultad for e in visibles if e.dificultad}
        return {"activos": bool(s.buscador and s.publicados), "categorias": cats, "hay_categorias": bool(cats),
                "dificultades": [{"id": k, "nombre": v[0]} for k, v in DIFICULTADES.items() if k in difs], "hay_dificultades": bool(difs),
                "total": len(visibles), "singular": s.singular, "plural": s.plural}

    # ------------------------------------------------------------ página de un elemento
    def _copiar_elemento(self, e: Elemento, destino: Path):
        def copiar(origen: Path, dest: Path, nivel: int):
            for p in sin_ocultos(origen):
                if nivel == 0 and p.name in ("ficha.json", "pagina.html"):
                    continue
                if nivel == 0 and p.name == "index.html":
                    raise ErrorProyecto(f"{ruta_relativa(p, self.raiz)}: «index.html» lo genera el sitio a partir de pagina.html. "
                                        "Renombra ese archivo a pagina.html (solo el contenido, sin <html> ni <head>).")
                if p.is_dir():
                    copiar(p, dest / p.name, nivel + 1)
                else:
                    dest.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(p, dest / p.name)
        copiar(e.carpeta, destino, 0)

    def _jsonld_elemento(self, e: Elemento) -> dict:
        s, url = e.seccion, seo.absoluta(self.cfg, e.url)
        tipo = s.schema["tipo"]
        comun = {"@context": "https://schema.org", "@type": tipo, "name": e.titulo, "description": e.descripcion, "url": url,
                 "inLanguage": self.cfg["idioma"], "isAccessibleForFree": True}
        if tipo == "Article":
            return {"@context": "https://schema.org", "@type": "Article", "headline": e.titulo, "description": e.descripcion,
                    "datePublished": e.fecha.isoformat(), "dateModified": e.fecha.isoformat(), "mainEntityOfPage": url,
                    "inLanguage": self.cfg["idioma"], "image": seo.absoluta(self.cfg, "assets/img/og.png"),
                    "author": {"@id": seo.absoluta(self.cfg, "") + "#organizacion"},
                    "publisher": {"@id": seo.absoluta(self.cfg, "") + "#organizacion"}}
        if tipo == "WebApplication":
            comun["operatingSystem"] = "Any"
            if s.schema.get("categoria"):
                comun["applicationCategory"] = s.schema["categoria"]
        comun["datePublished"] = e.fecha.isoformat()
        return comun

    def _elemento(self, e: Elemento):
        s = e.seccion
        raiz = "../../"
        cuerpo = (e.carpeta / "pagina.html").read_text(encoding="utf-8").lstrip("﻿") if e.tiene_pagina else ""
        if not e.tiene_pagina:
            self.informe.avisos.append(f"{ruta_relativa(e.carpeta, self.raiz)} no tiene pagina.html: su página solo mostrará el título y la descripción.")
        if s.aspecto == "libre" and "<h1" not in cuerpo.lower():
            cuerpo = f'<h1 class="solo-lectores">{escape(e.titulo)}</h1>\n' + cuerpo
        css_extra, js_extra = [], []
        if s.dinamico:
            datos_cuerpo = {"sitio": {"nombre": self.cfg["nombre"], "url": self.cfg["url"], "idioma": self.cfg["idioma"]},
                            "titular": self.titular, "publicidad": self.publicidad, "raiz": raiz,
                            "item": {"slug": e.slug, "titulo": e.titulo, "fecha_texto": fecha_larga(e.fecha)}}
            cuerpo = self.plantillas.renderizar_texto(cuerpo, datos_cuerpo, ruta_relativa(e.carpeta / "pagina.html", self.raiz))
        if e.tiene_css:
            css_extra.append(f"app.css?v={hash_corto((e.carpeta / 'app.css').read_bytes())}")
        if e.tiene_js:
            js_extra.append(f"app.js?v={hash_corto((e.carpeta / 'app.js').read_bytes())}")
        main_attrs = ""
        if e.tema:
            t = e.tema
            main_attrs = f'class="con-tema" style="--t-fondo:{t["fondo"]};--t-texto:{t["texto"]};--t-acento:{t["acento"]}"'
        datos = {
            "seccion": self._datos_seccion(s, raiz),
            "item": {"slug": e.slug, "titulo": e.titulo, "descripcion": e.descripcion, "fecha_iso": e.fecha.isoformat(),
                     "fecha_texto": fecha_larga(e.fecha), "etiquetas": e.etiquetas, "hay_etiquetas": bool(e.etiquetas),
                     "categoria_nombre": next((c["nombre"] for c in s.categorias if c["id"] == e.categoria), ""),
                     "dificultad": e.dificultad, "dificultad_texto": DIFICULTADES.get(e.dificultad, ("", 0))[0],
                     "dificultad_nivel": DIFICULTADES.get(e.dificultad, ("", 0))[1], "duracion": e.duracion},
            "cuerpo": cuerpo, "tiene_cuerpo": bool(cuerpo.strip()),
            "migas": [{"texto": "Inicio", "href": raiz}, {"texto": s.titulo, "href": raiz + s.url}, {"texto": e.titulo, "href": ""}],
        }
        migas = seo.migas_jsonld(self.cfg, [("Inicio", ""), (s.titulo, s.url), (e.titulo, e.url)])
        self._copiar_elemento(e, self.salida / e.url)
        self._pagina(e.url, f"{s.slug}/ficha", datos, titulo=f"{e.titulo} | {self.cfg['nombre']}", descripcion=e.descripcion,
                     mundo=s.aspecto, tipo="elemento", seccion=s.slug, item=e.slug, css_extra=tuple(css_extra),
                     js_extra=tuple(js_extra), jsonld=(self._jsonld_elemento(e), migas), main_attrs=main_attrs,
                     og_tipo="article" if s.schema["tipo"] == "Article" else "website", fecha=e.fecha,
                     paquetes=(self.paquetes[s.slug],),
                     scripts=(s.slug,) + (("consentimiento",) if s.dinamico and self.publicidad["activa"] else ()))

    # ------------------------------------------------------------ 404
    def _no_encontrada(self):
        self._pagina("404.html", "comun/no-encontrada/no-encontrada", {}, titulo=f"Página no encontrada | {self.cfg['nombre']}",
                     descripcion="La página que buscas no existe o ha cambiado de dirección. Vuelve a la portada o elige una sección.",
                     mundo="libre", tipo="404", raiz="/", indexable=False)

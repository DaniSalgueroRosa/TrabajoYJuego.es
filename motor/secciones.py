# -*- coding: utf-8 -*-
"""Descubre las secciones (carpetas con seccion.json) y los elementos que has metido dentro (carpetas con ficha.json).

CONTRATO DE CARPETAS
    <seccion>/seccion.json             define la sección (título, descripción, aspecto…)
    <seccion>/<elemento>/ficha.json    ficha del elemento  (el nombre de la carpeta es su dirección web)
    <seccion>/<elemento>/pagina.html   el contenido de su página (opcional)
    <seccion>/<elemento>/app.css|app.js   su estilo y su código (opcionales, se enlazan solos)
    cualquier otro archivo de la carpeta (imágenes, sonidos…) se copia junto a la página
    Las carpetas que empiezan por «_» o «.» se ignoran (por ejemplo «_plantilla»).
"""
from __future__ import annotations

import difflib
import re
import unicodedata
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

from .nucleo import (ErrorProyecto, es_slug, leer_json, parsear_fecha, ruta_relativa, sin_ocultos, sugerir_slug)

ESTADOS = ("publicado", "proximamente", "borrador")
MUNDOS_VALIDOS_APARIENCIA = ("libre",)          # además de los mundos definidos en config/sitio.json
CAMPOS_SECCION = {"titulo", "singular", "plural", "descripcion", "resumen", "mundo", "aspecto", "orden", "vacio",
                  "ordenar_por", "schema", "categorias", "buscador", "agrupar", "accion", "ubicacion", "dinamico", "anuncios"}
CAMPOS_FICHA = {"titulo", "descripcion", "fecha", "estado", "etiquetas", "tema", "categoria", "dificultad", "duracion", "orden"}
DIFICULTADES = {"facil": ("Fácil", 1), "media": ("Media", 2), "dificil": ("Difícil", 3)}
UBICACIONES = ("menu", "pie")
CARPETAS_DE_APOYO = {"datos"}      # dentro de una sección: se copian tal cual a la web y no son elementos
CAMPOS_TEMA = {"fondo", "texto", "acento"}
_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
RESERVADAS = {"comun", "portada", "motor", "pruebas", "docs", "config", "dist", "assets"}


@dataclass
class Elemento:
    seccion: "Seccion"
    slug: str
    carpeta: Path
    titulo: str
    descripcion: str
    fecha: date | None
    estado: str
    etiquetas: list
    tema: dict | None
    tiene_pagina: bool
    tiene_css: bool
    tiene_js: bool
    categoria: str = ""
    dificultad: str = ""
    duracion: str = ""
    orden: int | None = None

    @property
    def url(self) -> str:                     # relativa a la raíz del sitio, con barra final
        return f"{self.seccion.slug}/{self.slug}/"

    @property
    def publicado(self) -> bool:
        return self.estado == "publicado"


@dataclass
class Seccion:
    slug: str
    carpeta: Path
    titulo: str
    singular: str
    plural: str
    descripcion: str
    resumen: str
    mundo: str
    aspecto: str
    orden: int
    vacio: str
    ordenar_por: str
    schema: dict
    categorias: list = field(default_factory=list)     # [{"id": "palabras", "nombre": "Palabras"}]
    buscador: bool = False                             # el listado ofrece buscar y filtrar
    agrupar: bool = False                              # el listado muestra los elementos en bloques, uno por categoría
    accion: str = ""                                   # texto del botón de las tarjetas («Jugar»)
    ubicacion: str = "menu"                            # «menu» (cabecera, portada y pie) o «pie» (solo enlaces del pie, p. ej. lo legal)
    dinamico: bool = False                             # las pagina.html se procesan como plantilla (datos del titular, publicidad…)
    anuncios: bool = False                             # las fichas admiten un anuncio dentro de su texto (solo si hay publicidad activa)
    elementos: list = field(default_factory=list)

    @property
    def url(self) -> str:
        return f"{self.slug}/"

    @property
    def publicados(self) -> list:
        return [e for e in self.elementos if e.publicado]

    @property
    def proximos(self) -> list:
        return [e for e in self.elementos if e.estado == "proximamente"]

    @property
    def borradores(self) -> list:
        return [e for e in self.elementos if e.estado == "borrador"]


# ---------------------------------------------------------------- utilidades
def _sin_acentos(t: str) -> str:
    return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().casefold()


def _exigir_texto(datos: dict, clave: str, donde: str, minimo: int = 1) -> str:
    valor = datos.get(clave)
    if not isinstance(valor, str) or len(valor.strip()) < minimo:
        raise ErrorProyecto(f"{donde}: falta «{clave}» (un texto" + (f" de al menos {minimo} caracteres" if minimo > 1 else "") + ").")
    return valor.strip()


def _comprobar_campos(datos: dict, permitidos: set, donde: str):
    for clave in datos:
        if clave not in permitidos:
            parecidos = difflib.get_close_matches(clave, permitidos, n=1)
            ayuda = f" ¿Querías poner «{parecidos[0]}»?" if parecidos else ""
            raise ErrorProyecto(f"{donde}: el campo «{clave}» no existe.{ayuda} Campos válidos: {', '.join(sorted(permitidos))}.")


def luminancia(hex_: str) -> float:
    canales = [int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    canales = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in canales]
    return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2]


def contraste(a: str, b: str) -> float:
    la, lb = sorted((luminancia(a), luminancia(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


# ---------------------------------------------------------------- lectura
def leer_seccion(carpeta: Path, mundos: list) -> Seccion:
    ruta = carpeta / "seccion.json"
    donde = ruta_relativa(ruta)
    d = leer_json(ruta)
    _comprobar_campos(d, CAMPOS_SECCION, donde)
    ids = [m["id"] for m in mundos]
    mundo = _exigir_texto(d, "mundo", donde)
    if mundo not in ids:
        raise ErrorProyecto(f"{donde}: «mundo» es «{mundo}» y debe ser uno de: {', '.join(ids)} (están definidos en config/sitio.json).")
    aspecto = d.get("aspecto", mundo)
    if aspecto not in ids + list(MUNDOS_VALIDOS_APARIENCIA):
        raise ErrorProyecto(f"{donde}: «aspecto» es «{aspecto}» y debe ser uno de: {', '.join(ids + list(MUNDOS_VALIDOS_APARIENCIA))}.")
    if not isinstance(d.get("orden"), int):
        raise ErrorProyecto(f"{donde}: «orden» debe ser un número entero (1, 2, 3…): es la posición en el menú.")
    ordenar = d.get("ordenar_por", "fecha")
    if ordenar not in ("fecha", "titulo", "orden"):
        raise ErrorProyecto(f"{donde}: «ordenar_por» debe ser «fecha», «titulo» u «orden» (este último usa el número «orden» de cada ficha).")
    categorias = _leer_categorias(d.get("categorias", []), donde)
    for clave in ("buscador", "agrupar", "dinamico", "anuncios"):
        if not isinstance(d.get(clave, False), bool):
            raise ErrorProyecto(f"{donde}: «{clave}» debe ser true o false.")
    if "accion" in d and (not isinstance(d["accion"], str) or not d["accion"].strip()):
        raise ErrorProyecto(f"{donde}: «accion» debe ser un texto corto, por ejemplo «Jugar».")
    ubicacion = d.get("ubicacion", "menu")
    if ubicacion not in UBICACIONES:
        raise ErrorProyecto(f"{donde}: «ubicacion» debe ser «menu» o «pie».")
    schema = d.get("schema", {"tipo": "WebPage"})
    if not isinstance(schema, dict) or not isinstance(schema.get("tipo"), str):
        raise ErrorProyecto(f"{donde}: «schema» debe ser un objeto con «tipo», por ejemplo {{\"tipo\": \"WebApplication\", \"categoria\": \"GameApplication\"}}.")
    return Seccion(
        slug=carpeta.name, carpeta=carpeta,
        titulo=_exigir_texto(d, "titulo", donde), singular=_exigir_texto(d, "singular", donde),
        plural=_exigir_texto(d, "plural", donde), descripcion=_exigir_texto(d, "descripcion", donde, 40),
        resumen=_exigir_texto(d, "resumen", donde), mundo=mundo, aspecto=aspecto, orden=d["orden"],
        vacio=_exigir_texto(d, "vacio", donde), ordenar_por=ordenar, schema=schema, categorias=categorias,
        buscador=bool(d.get("buscador", False)), agrupar=bool(d.get("agrupar", False)), accion=d.get("accion", "").strip(), ubicacion=ubicacion,
        dinamico=bool(d.get("dinamico", False)), anuncios=bool(d.get("anuncios", False)))


def _leer_categorias(valor, donde: str) -> list:
    if not isinstance(valor, list):
        raise ErrorProyecto(f"{donde}: «categorias» debe ser una lista como [{{\"id\": \"palabras\", \"nombre\": \"Palabras\"}}].")
    vistos = set()
    for c in valor:
        if not isinstance(c, dict) or set(c) != {"id", "nombre"} or not isinstance(c["id"], str) or not isinstance(c["nombre"], str) or not c["nombre"].strip():
            raise ErrorProyecto(f"{donde}: cada categoría necesita exactamente «id» y «nombre», por ejemplo {{\"id\": \"palabras\", \"nombre\": \"Palabras\"}}.")
        if not es_slug(c["id"]):
            raise ErrorProyecto(f"{donde}: el id de categoría «{c['id']}» solo puede llevar minúsculas sin acentos, números y guiones (¿«{sugerir_slug(c['id'])}»?).")
        if c["id"] in vistos:
            raise ErrorProyecto(f"{donde}: la categoría «{c['id']}» está repetida.")
        vistos.add(c["id"])
    return [{"id": c["id"], "nombre": c["nombre"].strip()} for c in valor]


def leer_elemento(seccion: Seccion, carpeta: Path) -> Elemento:
    slug = carpeta.name
    donde_carpeta = ruta_relativa(carpeta)
    if not es_slug(slug):
        raise ErrorProyecto(
            f"{donde_carpeta}: el nombre de la carpeta es la dirección web de la página y solo puede tener minúsculas sin acentos, "
            f"números y guiones. Renómbrala, por ejemplo, a «{sugerir_slug(slug)}».")
    ruta = carpeta / "ficha.json"
    if not ruta.is_file():
        raise ErrorProyecto(
            f"{donde_carpeta}: falta ficha.json. Cada carpeta dentro de «{seccion.slug}» necesita su ficha "
            f"(copia la de {seccion.slug}/_plantilla/ficha.json). Si esta carpeta no es un elemento, empieza su nombre por «_» para que se ignore.")
    donde = ruta_relativa(ruta)
    d = leer_json(ruta)
    _comprobar_campos(d, CAMPOS_FICHA, donde)
    estado = d.get("estado", "publicado")
    if estado not in ESTADOS:
        raise ErrorProyecto(f"{donde}: «estado» es «{estado}» y debe ser uno de: {', '.join(ESTADOS)}.")
    titulo = _exigir_texto(d, "titulo", donde)
    fecha = None
    if estado == "publicado":
        descripcion = _exigir_texto(d, "descripcion", donde, 40)
        if "fecha" not in d:
            raise ErrorProyecto(f"{donde}: falta «fecha» (AAAA-MM-DD). Se usa para ordenar y para el mapa del sitio.")
        fecha = parsear_fecha(d["fecha"], donde)
    else:
        descripcion = d.get("descripcion", "") if isinstance(d.get("descripcion", ""), str) else ""
        if estado == "proximamente":
            descripcion = _exigir_texto(d, "descripcion", donde)
        if "fecha" in d:
            fecha = parsear_fecha(d["fecha"], donde)
    etiquetas = d.get("etiquetas", [])
    if not isinstance(etiquetas, list) or not all(isinstance(e, str) and e.strip() for e in etiquetas):
        raise ErrorProyecto(f"{donde}: «etiquetas» debe ser una lista de textos, por ejemplo [\"rápido\", \"palabras\"].")
    tema = d.get("tema")
    if tema is not None:
        tema = _validar_tema(tema, donde)
    categoria = _leer_categoria(d, seccion, estado, donde)
    dificultad = d.get("dificultad", "")
    if dificultad and dificultad not in DIFICULTADES:
        raise ErrorProyecto(f"{donde}: «dificultad» es «{dificultad}» y debe ser una de: {', '.join(DIFICULTADES)}.")
    duracion = d.get("duracion", "")
    if not isinstance(duracion, str):
        raise ErrorProyecto(f"{donde}: «duracion» debe ser un texto corto, por ejemplo «3 min».")
    orden = d.get("orden")
    if orden is not None and (not isinstance(orden, int) or isinstance(orden, bool) or orden < 0):
        raise ErrorProyecto(f"{donde}: «orden» debe ser un número entero (0, 1, 2…).")
    return Elemento(
        seccion=seccion, slug=slug, carpeta=carpeta, titulo=titulo, descripcion=descripcion, fecha=fecha, estado=estado,
        etiquetas=[e.strip() for e in etiquetas], tema=tema,
        tiene_pagina=(carpeta / "pagina.html").is_file(), tiene_css=(carpeta / "app.css").is_file(),
        tiene_js=(carpeta / "app.js").is_file(), categoria=categoria, dificultad=dificultad, duracion=duracion.strip(), orden=orden)


def _leer_categoria(d: dict, seccion: Seccion, estado: str, donde: str) -> str:
    categoria = d.get("categoria", "")
    ids = [c["id"] for c in seccion.categorias]
    if not isinstance(categoria, str):
        raise ErrorProyecto(f"{donde}: «categoria» debe ser un texto con el id de una categoría.")
    if categoria:
        if not ids:
            raise ErrorProyecto(f"{donde}: la sección «{seccion.slug}» no define categorías. Añádelas en {seccion.slug}/seccion.json (campo «categorias») o quita «categoria» de la ficha.")
        if categoria not in ids:
            parecidos = difflib.get_close_matches(categoria, ids, n=1)
            ayuda = f" ¿Querías poner «{parecidos[0]}»?" if parecidos else ""
            raise ErrorProyecto(f"{donde}: la categoría «{categoria}» no existe en {seccion.slug}/seccion.json.{ayuda} Las que hay: {', '.join(ids)}.")
    elif ids and estado == "publicado":
        raise ErrorProyecto(f"{donde}: falta «categoria». Esta sección tiene: {', '.join(ids)}.")
    return categoria


def _validar_tema(tema, donde: str) -> dict:
    if not isinstance(tema, dict):
        raise ErrorProyecto(f"{donde}: «tema» debe ser un objeto con «fondo», «texto» y «acento».")
    _comprobar_campos(tema, CAMPOS_TEMA, donde + " → tema")
    for clave in sorted(CAMPOS_TEMA):
        if clave not in tema or not isinstance(tema[clave], str) or not _HEX.match(tema[clave]):
            raise ErrorProyecto(f"{donde} → tema: «{clave}» debe ser un color con formato #RRGGBB (por ejemplo #1D3A34).")
    ratio = contraste(tema["texto"], tema["fondo"])
    if ratio < 4.5:
        raise ErrorProyecto(
            f"{donde} → tema: el texto ({tema['texto']}) sobre el fondo ({tema['fondo']}) tiene un contraste de {ratio:.1f}:1 y el mínimo "
            "para que se lea bien es 4.5:1. Oscurece uno de los dos colores.")
    return {k: tema[k].upper() for k in CAMPOS_TEMA}


def ordenar(elementos: list, criterio: str) -> list:
    publicados = [e for e in elementos if e.publicado]
    proximos = [e for e in elementos if e.estado == "proximamente"]
    if criterio == "titulo":
        publicados.sort(key=lambda e: _sin_acentos(e.titulo))
    elif criterio == "orden":
        publicados.sort(key=lambda e: (e.orden if e.orden is not None else 10**6, -e.fecha.toordinal(), _sin_acentos(e.titulo)))
    else:
        publicados.sort(key=lambda e: (-e.fecha.toordinal(), _sin_acentos(e.titulo)))
    proximos.sort(key=lambda e: _sin_acentos(e.titulo))
    borradores = sorted((e for e in elementos if e.estado == "borrador"), key=lambda e: _sin_acentos(e.titulo))
    return publicados + proximos + borradores   # los borradores se conservan solo para poder contarlos en el informe


def descubrir(raiz: Path, mundos: list) -> list:
    """Devuelve las secciones ordenadas, con sus elementos ya leídos y validados."""
    secciones: list[Seccion] = []
    for carpeta in sin_ocultos(raiz):
        if not carpeta.is_dir() or carpeta.name.startswith("_"):
            continue
        if (carpeta / "seccion.json").is_file():
            secciones.append(leer_seccion(carpeta, mundos))
        elif (carpeta / "ficha.json").is_file() and carpeta.name not in RESERVADAS:
            raise ErrorProyecto(
                f"La carpeta «{carpeta.name}» tiene ficha.json pero está suelta en la raíz del proyecto. "
                "Muévela dentro de la sección que le corresponde (herramientas, recursos, juegos o tests).")
    if not secciones:
        raise ErrorProyecto("No hay ninguna sección: busco carpetas que tengan un archivo seccion.json.")
    ordenes = {}
    for s in secciones:
        if s.orden in ordenes:
            raise ErrorProyecto(f"«{ordenes[s.orden]}» y «{s.slug}» tienen el mismo «orden» ({s.orden}) en su seccion.json.")
        ordenes[s.orden] = s.slug
    secciones.sort(key=lambda s: s.orden)
    for s in secciones:
        elementos = [leer_elemento(s, c) for c in sin_ocultos(s.carpeta)
                     if c.is_dir() and not c.name.startswith("_") and c.name not in CARPETAS_DE_APOYO]
        s.elementos = ordenar(elementos, s.ordenar_por)
    return secciones

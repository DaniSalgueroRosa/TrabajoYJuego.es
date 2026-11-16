# -*- coding: utf-8 -*-
"""Utilidades comunes del generador: errores legibles, lectura de ficheros, fechas y rutas.

Regla de oro del motor: cuando algo está mal en una carpeta que has metido tú, el mensaje dice
QUÉ fichero, QUÉ falla y CÓMO se arregla, en español y sin jerga.
"""
from __future__ import annotations

import hashlib
import json
import re
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]

_SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class ErrorProyecto(Exception):
    """Algo del proyecto está mal y la persona que lo mantiene puede arreglarlo. El texto ya va explicado."""


def ruta_relativa(ruta: Path, base: Path = RAIZ) -> str:
    """Ruta con barras normales, relativa al proyecto, para los mensajes."""
    try:
        return Path(ruta).resolve().relative_to(base.resolve()).as_posix()
    except ValueError:
        return Path(ruta).as_posix()


def leer_texto(ruta: Path) -> str:
    try:
        return Path(ruta).read_text(encoding="utf-8")
    except FileNotFoundError:
        raise ErrorProyecto(f"Falta el archivo {ruta_relativa(ruta)}.")
    except UnicodeDecodeError:
        raise ErrorProyecto(f"{ruta_relativa(ruta)} no está guardado como UTF-8. Guárdalo de nuevo con esa codificación.")


def leer_json(ruta: Path) -> dict:
    texto = leer_texto(ruta)
    try:
        datos = json.loads(texto)
    except json.JSONDecodeError as e:
        raise ErrorProyecto(
            f"{ruta_relativa(ruta)}: el JSON no es válido (línea {e.lineno}, columna {e.colno}): {e.msg}. "
            "Suele ser una coma de más o de menos, o unas comillas sin cerrar.")
    if not isinstance(datos, dict):
        raise ErrorProyecto(f"{ruta_relativa(ruta)}: debe contener un objeto entre llaves {{ }}.")
    return datos


def hash_corto(datos: bytes | str) -> str:
    if isinstance(datos, str):
        datos = datos.encode("utf-8")
    return hashlib.sha1(datos).hexdigest()[:8]


def es_slug(texto: str) -> bool:
    return bool(_SLUG.match(texto))


def sugerir_slug(texto: str) -> str:
    """Propone un nombre de carpeta válido a partir de uno que no lo es."""
    import unicodedata
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-") or "elemento"


def parsear_fecha(texto: str, donde: str) -> date:
    try:
        return date.fromisoformat(texto)
    except (TypeError, ValueError):
        raise ErrorProyecto(f"{donde}: «fecha» debe ser una fecha real con formato AAAA-MM-DD (por ejemplo 2026-11-13); has puesto «{texto}».")


def fecha_larga(d: date) -> str:
    return f"{d.day} de {MESES[d.month - 1]} de {d.year}"


def plural(n: int, singular: str, plural_: str) -> str:
    return f"{n} {singular if n == 1 else plural_}"


def sin_ocultos(carpeta: Path):
    """Archivos y carpetas de una carpeta, sin los ocultos (.algo) ni los de sistema o caché."""
    for p in sorted(Path(carpeta).iterdir(), key=lambda x: x.name):
        if p.name.startswith(".") or p.name in {"__pycache__", "Thumbs.db", "desktop.ini"}:
            continue
        yield p

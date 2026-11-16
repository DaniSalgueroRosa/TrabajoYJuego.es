# -*- coding: utf-8 -*-
"""Crea un .zip con el proyecto (sin dist/, cachés ni archivos del sistema).

    python3 sitio.py paquete                 trabajoyjuego-v2.zip en la carpeta de al lado del proyecto
    python3 sitio.py paquete --dist          zip de dist/ (el sitio ya construido, listo para subir al hosting)
    python3 sitio.py paquete <archivo.zip>   con otro nombre o ruta
    python3 sitio.py paquete juegos.zip --vista-previa
                                             el proyecto y, al lado, la carpeta vista-previa/ con el sitio ya construido
                                             (solo para mirarlo con Live Server sin Python; no es lo que se sube al hosting)
"""
from __future__ import annotations

import sys
import zipfile
from pathlib import Path

from .nucleo import RAIZ

IGNORAR_CARPETAS = {"dist", "dist.tmp", "dist.old", "__pycache__", ".git", "node_modules", ".pytest_cache"}
IGNORAR_ARCHIVOS = {".DS_Store", "Thumbs.db"}
IGNORAR_SUFIJOS = (".pyc", ".pyo", ".zip")


def _incluir(ruta: Path, raiz: Path, solo_dist: bool) -> bool:
    partes = ruta.relative_to(raiz).parts
    if solo_dist:
        return not (set(partes) & IGNORAR_ARCHIVOS)
    if set(partes[:-1]) & IGNORAR_CARPETAS or partes[0] in IGNORAR_CARPETAS:
        return False
    return ruta.name not in IGNORAR_ARCHIVOS and not ruta.name.endswith(IGNORAR_SUFIJOS)


def empaquetar(raiz: Path = RAIZ, destino: Path | None = None, solo_dist: bool = False, vista_previa: bool = False) -> tuple[Path, int]:
    """Devuelve (ruta del zip, número de archivos). Los nombres dentro del zip van con barras normales y en orden.
    Con vista_previa se construye el sitio y se añade, fuera de la carpeta del proyecto, como «vista-previa/»."""
    raiz = Path(raiz).resolve()
    if vista_previa and not solo_dist:
        from .construir import construir
        construir(raiz)
    origen = raiz / "dist" if solo_dist else raiz
    if not origen.is_dir():
        raise FileNotFoundError("No existe dist/. Primero: python3 sitio.py construir")
    nombre = "trabajoyjuego-v2-dist.zip" if solo_dist else "trabajoyjuego-v2.zip"
    destino = Path(destino) if destino else raiz.parent / nombre
    destino = destino.resolve()
    carpeta_raiz = "" if solo_dist else raiz.name + "/"
    archivos = sorted(p for p in origen.rglob("*") if p.is_file() and p != destino and _incluir(p, origen, solo_dist))
    previa = []
    if vista_previa and not solo_dist:
        dist = raiz / "dist"
        previa = sorted(p for p in dist.rglob("*") if p.is_file() and not (set(p.relative_to(dist).parts) & IGNORAR_ARCHIVOS))
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in archivos:
            z.write(p, carpeta_raiz + p.relative_to(origen).as_posix())
        for p in previa:
            z.write(p, "vista-previa/" + p.relative_to(raiz / "dist").as_posix())
    return destino, len(archivos) + len(previa)


def principal(args: list) -> int:
    solo_dist = "--dist" in args
    vista_previa = "--vista-previa" in args
    otros = [a for a in args if not a.startswith("--")]
    try:
        zip_, n = empaquetar(destino=Path(otros[0]) if otros else None, solo_dist=solo_dist, vista_previa=vista_previa)
    except FileNotFoundError as e:
        print(e, file=sys.stderr)
        return 1
    print(f"{n} archivos en {zip_} ({zip_.stat().st_size / 1024:.0f} KB)")
    return 0

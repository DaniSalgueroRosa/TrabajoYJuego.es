# -*- coding: utf-8 -*-
"""Construye el sitio en dist/. Primero lo hace en una carpeta temporal y solo si todo va bien reemplaza dist/,
así un error nunca deja la web a medias."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

from .nucleo import RAIZ, ErrorProyecto
from .paginas import Constructor
from .plantilla import ErrorPlantilla


def construir(raiz: Path = RAIZ, salida: Path | None = None):
    """Devuelve el Informe. Lanza ErrorProyecto o ErrorPlantilla (con mensaje claro) si algo está mal."""
    raiz = Path(raiz)
    salida = Path(salida) if salida else raiz / "dist"
    temporal = salida.with_name(salida.name + ".tmp")
    anterior = salida.with_name(salida.name + ".old")
    for carpeta in (temporal, anterior):
        if carpeta.exists():
            shutil.rmtree(carpeta)
    try:
        informe = Constructor(raiz, temporal).construir()
    except Exception:
        shutil.rmtree(temporal, ignore_errors=True)
        raise
    if salida.exists():
        salida.rename(anterior)
    temporal.rename(salida)
    shutil.rmtree(anterior, ignore_errors=True)
    return informe


def principal(args: list) -> int:
    try:
        informe = construir()
    except (ErrorProyecto, ErrorPlantilla) as e:
        print(f"\nNo se ha podido construir el sitio:\n  {e}\n", file=sys.stderr)
        return 1
    print(informe.resumen())
    print("Listo: el sitio está en la carpeta dist/")
    return 0

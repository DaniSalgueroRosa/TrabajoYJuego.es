# -*- coding: utf-8 -*-
"""Ejecuta todas las pruebas automáticas.

    python3 sitio.py probar                 pruebas de Python (motor, carpetas, revisión, contraste de la paleta)
    python3 sitio.py probar --navegador     además, pruebas en Chrome real: sin errores de consola, sin desbordes en móvil,
                                            contraste del texto ya pintado, foco con teclado y efectos de la portada y,
                                            sobre el sitio real, la portada (índice por categoría e información), los juegos y las herramientas
                                            (arrancan, se juegan de principio a fin, no guardan nada) y las páginas legales
                                            (necesita Chrome o Chromium y Node 22; se salta con un aviso si no los encuentra)
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def _python() -> int:
    cargador = unittest.TestLoader()
    suite = cargador.discover(str(RAIZ / "pruebas"), pattern="test_*.py", top_level_dir=str(RAIZ))
    resultado = unittest.TextTestRunner(verbosity=1).run(suite)
    return 0 if resultado.wasSuccessful() else 1


def _con_servidor(raiz: Path, scripts: list, etiqueta: str) -> int:
    """Construye la copia, la sirve en un puerto libre y lanza cada script de Node contra ella. Devuelve 0, 1 (fallos) o 2 (sin Chrome)."""
    import os
    from motor.construir import construir
    from motor.servir import servir_carpeta

    construir(raiz)
    codigo = 0
    with servir_carpeta(raiz / "dist") as puerto:
        print(f"\nNAVEGADOR · {etiqueta}: http://127.0.0.1:{puerto}/")
        for script in scripts:
            print(f"--- {script.name}")
            r = subprocess.run(["node", str(script)], env={**os.environ, "PUERTO": str(puerto)})
            if r.returncode == 2:
                return 2
            codigo = max(codigo, r.returncode)
    return codigo


def _navegador() -> int:
    if not shutil.which("node"):
        print("\nNAVEGADOR: omitido, no encuentro Node (hace falta Node 22 o superior).")
        return 0
    from pruebas.ejemplos import copiar_proyecto, crear_ejemplos

    temporal = Path(tempfile.mkdtemp(prefix="tyj-navegador-"))
    try:
        # 1) Sitio de ejemplo (no es el real): contrato de carpetas, contraste, foco, efectos de la portada.
        raiz = copiar_proyecto(temporal / "ejemplos")
        crear_ejemplos(raiz)
        codigo = _con_servidor(raiz, [RAIZ / "pruebas" / "navegador.mjs"], "copia con ejemplos")
        if codigo == 2:
            print("NAVEGADOR: omitido, no encuentro Chrome ni Chromium.")
            return 0
        # 2) Sitio real: los juegos y lo legal, tal como se publican.
        real = copiar_proyecto(temporal / "real", conservar=("juegos", "legal"))
        scripts = [RAIZ / "pruebas" / "juegos" / "humo.mjs"] + sorted(
            p for p in (RAIZ / "pruebas" / "juegos").glob("*.mjs") if p.name not in ("humo.mjs", "ayudas.mjs"))
        scripts += [RAIZ / "pruebas" / "portada.mjs", RAIZ / "pruebas" / "legal.mjs"]
        codigo = max(codigo, _con_servidor(real, scripts, "sitio real: portada, juegos y páginas legales"))
        # 3) Sitio real: las herramientas y sus guías. humo.mjs abre las 120 en móvil, tablet y escritorio; los demás scripts las usan
        #    con casos concretos (PDF, imágenes, audio con micrófono simulado, QR y códigos de barras, calendarios, tiempo…).
        reales = copiar_proyecto(temporal / "herramientas", conservar=("herramientas", "recursos"))
        scripts = [RAIZ / "pruebas" / "herramientas" / "humo.mjs"] + sorted(
            p for p in (RAIZ / "pruebas" / "herramientas").glob("*.mjs") if p.name not in ("humo.mjs", "ayudas.mjs"))
        codigo = max(codigo, _con_servidor(reales, scripts, "sitio real: herramientas y guías"))
        # 4) Sitio real: los tests (se juegan de verdad en Chrome; humo.mjs abre todos en escritorio y móvil con contraste).
        tests = copiar_proyecto(temporal / "tests", conservar=("tests",))
        scripts = [RAIZ / "pruebas" / "tests" / "humo.mjs"] + sorted(
            p for p in (RAIZ / "pruebas" / "tests").glob("*.mjs") if p.name not in ("humo.mjs", "ayudas.mjs"))
        return max(codigo, _con_servidor(tests, scripts, "sitio real: tests"))
    finally:
        shutil.rmtree(temporal, ignore_errors=True)


def principal(args: list) -> int:
    codigo = _python()
    if "--navegador" in args:
        codigo = max(codigo, _navegador())
    print("\nTodas las pruebas han pasado." if codigo == 0 else "\nHay pruebas que fallan.")
    return codigo

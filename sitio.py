#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Punto de entrada único de TrabajoYJuego.

En Windows el comando suele ser «py sitio.py …» o «python sitio.py …» en vez de «python3 …».

    python3 sitio.py               (sin nada más) lo mismo que «servir»: es lo que hace el botón ▶ de VS Code
    python3 sitio.py servir        ver el sitio en http://localhost:8080 (se reconstruye solo al guardar y abre el navegador)
    python3 sitio.py construir     generar la carpeta dist/ (lo que se sube al hosting)
    python3 sitio.py comprobar     revisar dist/ antes de publicar (enlaces, títulos, descripciones, marcas sin rellenar…)
    python3 sitio.py probar        ejecutar todas las pruebas automáticas
    python3 sitio.py paquete       crear un .zip con el proyecto (--dist: el sitio construido; --vista-previa: el proyecto y el sitio para mirarlo sin Python)
"""
import sys
from pathlib import Path

# Con esto funciona también si se lanza en modo aislado (python3 -I) o desde otra carpeta.
sys.path.insert(0, str(Path(__file__).resolve().parent))

AYUDA = __doc__


def preparar_consola():
    """En Windows la consola puede no ser UTF-8; así los mensajes con acentos y «» nunca rompen el programa."""
    for flujo in (sys.stdout, sys.stderr):
        try:
            flujo.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass


def main(argv):
    preparar_consola()
    if sys.version_info < (3, 11):
        v = ".".join(str(n) for n in sys.version_info[:3])
        print(f"Este proyecto necesita Python 3.11 o superior y tienes la {v}.\n"
              "Instala una versión reciente desde https://www.python.org/downloads/ (en Windows, marca «Add python.exe to PATH»).")
        return 1
    if len(argv) < 2:
        argv = [argv[0], "servir"]      # el botón ▶ de VS Code lanza el archivo sin argumentos
    if argv[1] in ("-h", "--help", "ayuda"):
        print(AYUDA)
        return 0
    orden, resto = argv[1], argv[2:]
    if orden == "servir":
        from motor.servir import principal
    elif orden == "construir":
        from motor.construir import principal
    elif orden == "comprobar":
        from motor.comprobar import principal
    elif orden == "probar":
        from pruebas.todo import principal
    elif orden == "paquete":
        from motor.empaquetar import principal
    else:
        print(f"No conozco la orden «{orden}».\n\n{AYUDA}")
        return 2
    return principal(resto)


if __name__ == "__main__":
    sys.exit(main(sys.argv))

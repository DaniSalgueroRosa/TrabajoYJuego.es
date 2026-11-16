# -*- coding: utf-8 -*-
"""JavaScript compartido: se agrupa igual que el CSS (ver estilos.py) y lleva ?v= para que el navegador no use una copia vieja.

    assets/js/<sección>.js     todos los .js que están directamente dentro de la carpeta de una sección (juegos/*.js).
                               Los cargan las páginas de cada elemento de esa sección, ANTES de su propio app.js.
                               Se suman por orden alfabético: cada archivo debe poder cargarse sin depender de que otro ya esté.
    assets/js/filtro.js        comun/filtro/filtro.js: buscador y filtros de los listados (solo si una sección tiene «buscador»)
    assets/js/consentimiento.js  comun/consentimiento/consentimiento.js: botón para cambiar el consentimiento (solo con publicidad activa)
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .nucleo import hash_corto, ruta_relativa


@dataclass
class Script:
    nombre: str
    texto: str
    version: str

    @property
    def archivo(self) -> str:
        return f"{self.nombre}.js"


def _unir(rutas: list, raiz: Path) -> str:
    partes = []
    for r in rutas:
        cuerpo = Path(r).read_text(encoding="utf-8").strip()
        partes.append(f"/* ===== {ruta_relativa(r, raiz)} ===== */\n{cuerpo}\n")
    return "\n;\n".join(partes)


def _script(nombre: str, rutas: list, raiz: Path):
    if not rutas:
        return None
    texto = _unir(rutas, raiz)
    return Script(nombre, texto, hash_corto(texto))


def script_seccion(seccion, raiz: Path):
    return _script(seccion.slug, sorted(p for p in seccion.carpeta.glob("*.js") if p.is_file()), raiz)


def script_comun(nombre: str, raiz: Path):
    ruta = Path(raiz) / "comun" / nombre / f"{nombre}.js"
    return _script(nombre, [ruta] if ruta.is_file() else [], raiz)

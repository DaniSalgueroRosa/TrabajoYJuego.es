# -*- coding: utf-8 -*-
"""Agrupa el CSS de cada parte en paquetes y les pone versión (?v=) para que el navegador no use una copia vieja.

Cada parte del sitio guarda su CSS al lado de su HTML. Al construir, se juntan así:
    comun.css      tokens + base + fuentes + el CSS de todo lo que hay en comun/     (lo cargan TODAS las páginas)
    portada.css    portada/portada.css + el de cada parte de la portada             (solo la portada)
    <seccion>.css  los .css que están directamente en la carpeta de la sección      (listado y fichas de esa sección)
    app.css        el de cada elemento, que se enlaza solo desde su propia página
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .nucleo import hash_corto, ruta_relativa

PRIMEROS_COMUN = ("tokens.css", "base.css", "fuentes/fuentes.css")


@dataclass
class Paquete:
    nombre: str
    texto: str
    version: str

    @property
    def archivo(self) -> str:
        return f"{self.nombre}.css"


def _unir(rutas: list, raiz: Path) -> str:
    partes = []
    for r in rutas:
        cuerpo = Path(r).read_text(encoding="utf-8").strip()
        partes.append(f"/* ===== {ruta_relativa(r, raiz)} ===== */\n{cuerpo}\n")
    return "\n".join(partes)


def _paquete(nombre: str, rutas: list, raiz: Path, extra: str = ""):
    if not rutas:
        return None
    texto = _unir(rutas, raiz) + extra
    return Paquete(nombre, texto, hash_corto(texto))


def paquete_comun(raiz: Path, extra: str = "") -> Paquete:
    """«extra» es CSS generado al construir (los colores de los temas) y va al final del paquete."""
    base = raiz / "comun"
    primeros = [base / p for p in PRIMEROS_COMUN]
    resto = sorted((p for p in base.rglob("*.css") if p not in primeros), key=lambda p: p.relative_to(base).as_posix())
    return _paquete("comun", [p for p in primeros if p.is_file()] + resto, raiz, extra)


def id_tema(tema: dict) -> str:
    """Identificador estable de una combinación de colores de tema (data-tema="…")."""
    return "t" + hash_corto(f"{tema['fondo']}{tema['texto']}{tema['acento']}")[:6]


def css_temas(temas: list) -> str:
    """Una regla por combinación de colores. Así ninguna página lleva estilos en línea y la política de contenido (CSP) puede prohibirlos.
    Los colores ya están validados como #RRGGBB al leer cada ficha.json."""
    unicos = {id_tema(t): t for t in temas}
    if not unicos:
        return ""
    reglas = [f'[data-tema="{i}"] {{ --t-fondo: {t["fondo"]}; --t-texto: {t["texto"]}; --t-acento: {t["acento"]}; }}' for i, t in sorted(unicos.items())]
    return "\n/* ===== temas de los tests (se genera al construir) ===== */\n" + "\n".join(reglas) + "\n"


def paquete_portada(raiz: Path):
    base = raiz / "portada"
    principal = base / "portada.css"
    resto = sorted((p for p in base.rglob("*.css") if p != principal), key=lambda p: p.relative_to(base).as_posix())
    return _paquete("portada", ([principal] if principal.is_file() else []) + resto, raiz)


def paquete_seccion(seccion, raiz: Path):
    rutas = sorted(p for p in seccion.carpeta.glob("*.css") if p.is_file())
    return _paquete(seccion.slug, rutas, raiz)

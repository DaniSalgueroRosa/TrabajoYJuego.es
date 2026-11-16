# -*- coding: utf-8 -*-
"""Motor de plantillas mínimo (subconjunto de Mustache), sin dependencias.

Sintaxis que entiende:

    {{nombre}}            valor con los caracteres HTML escapados
    {{{nombre}}}  {{&nombre}}   valor tal cual (HTML ya preparado)
    {{a.b.c}}             ruta dentro de los datos
    {{.}}                 el elemento actual dentro de una lista de textos
    {{#cosa}}…{{/cosa}}   lista: se repite por elemento · objeto: se entra en él · verdadero: se muestra una vez
    {{^cosa}}…{{/cosa}}   se muestra solo si «cosa» está vacía, es falsa o es 0
    {{> carpeta/parte}}   inserta el archivo carpeta/parte.html (con los mismos datos)
    {{! comentario }}

Es ESTRICTO a propósito: si una plantilla pide un dato que no existe, falla diciendo archivo, línea y
qué datos hay disponibles, en vez de dejar un hueco vacío en la página sin que nadie se entere.
"""
from __future__ import annotations

import re
from html import escape
from pathlib import Path

LIMITE_PARCIALES = 16

_ETIQUETA = re.compile(
    r"\{\{\{\s*(?P<triple>[^{}]+?)\s*\}\}\}"
    r"|\{\{\s*(?P<signo>[#^/>!&])?\s*(?P<nombre>[^{}]*?)\s*\}\}",
    re.S,
)


class ErrorPlantilla(Exception):
    """La plantilla o sus datos están mal. El mensaje incluye archivo y línea."""


# ---------------------------------------------------------------- análisis
def _linea(fuente: str, posicion: int) -> int:
    return fuente.count("\n", 0, posicion) + 1


def _linea_sola(fuente: str, ini: int, fin: int):
    """Si la etiqueta ocupa ella sola una línea, devuelve (inicio_linea, fin_linea_con_salto) para borrarla entera."""
    ls = fuente.rfind("\n", 0, ini) + 1
    le = fuente.find("\n", fin)
    if le == -1:
        le_texto, fin_linea = len(fuente), len(fuente)
    else:
        le_texto, fin_linea = le, le + 1
    if fuente[ls:ini].strip() == "" and fuente[fin:le_texto].strip() == "":
        return ls, fin_linea
    return None


def analizar(fuente: str, origen: str) -> list:
    """Convierte el texto en un árbol de nodos. Nodos: ('t', texto) · ('v', nombre, crudo, línea) ·
    ('s', nombre, hijos, invertida, línea) · ('p', nombre, línea)."""
    raiz: list = []
    pila = [(None, raiz, 0)]  # (nombre abierto, lista de hijos, línea de apertura)
    pos = 0
    for m in _ETIQUETA.finditer(fuente):
        triple, signo, nombre = m.group("triple"), m.group("signo"), (m.group("nombre") or "")
        ini, fin = m.span()
        linea = _linea(fuente, ini)
        corte_ini, corte_fin = ini, fin
        if signo in ("#", "^", "/", "!") and not triple:
            sola = _linea_sola(fuente, ini, fin)
            if sola and sola[0] >= pos:
                corte_ini, corte_fin = sola
        if corte_ini > pos:
            pila[-1][1].append(("t", fuente[pos:corte_ini]))
        pos = corte_fin

        if triple:
            pila[-1][1].append(("v", triple.strip(), True, linea))
        elif signo == "!":
            continue
        elif signo == "&":
            _exigir_nombre(nombre, origen, linea)
            pila[-1][1].append(("v", nombre, True, linea))
        elif signo == ">":
            _exigir_nombre(nombre, origen, linea)
            pila[-1][1].append(("p", nombre, linea))
        elif signo in ("#", "^"):
            _exigir_nombre(nombre, origen, linea)
            hijos: list = []
            pila[-1][1].append(("s", nombre, hijos, signo == "^", linea))
            pila.append((nombre, hijos, linea))
        elif signo == "/":
            if len(pila) == 1:
                raise ErrorPlantilla(f"{origen}, línea {linea}: hay un {{{{/{nombre}}}}} que no cierra nada.")
            abierto, _, linea_ap = pila.pop()
            if abierto != nombre:
                raise ErrorPlantilla(
                    f"{origen}, línea {linea}: se esperaba {{{{/{abierto}}}}} (abierto en la línea {linea_ap}) y hay {{{{/{nombre}}}}}.")
        else:
            _exigir_nombre(nombre, origen, linea)
            pila[-1][1].append(("v", nombre, False, linea))
    if len(pila) > 1:
        abierto, _, linea_ap = pila[-1]
        raise ErrorPlantilla(f"{origen}, línea {linea_ap}: {{{{#{abierto}}}}} no tiene su {{{{/{abierto}}}}}.")
    if pos < len(fuente):
        raiz.append(("t", fuente[pos:]))
    return raiz


def _exigir_nombre(nombre: str, origen: str, linea: int):
    if not nombre:
        raise ErrorPlantilla(f"{origen}, línea {linea}: hay una etiqueta {{{{ }}}} vacía.")


# ---------------------------------------------------------------- datos
_FALTA = object()


def _buscar(nombre: str, pila: list):
    """Busca «nombre» de la capa más interna a la más externa. Devuelve _FALTA si no existe."""
    if nombre == ".":
        return pila[-1]
    partes = nombre.split(".")
    for capa in reversed(pila):
        if isinstance(capa, dict) and partes[0] in capa:
            valor = capa[partes[0]]
            for p in partes[1:]:
                if isinstance(valor, dict) and p in valor:
                    valor = valor[p]
                else:
                    return _FALTA
            return valor
    return _FALTA


def _disponibles(pila: list) -> str:
    claves: list[str] = []
    for capa in reversed(pila):
        if isinstance(capa, dict):
            for k in capa:
                if k not in claves:
                    claves.append(k)
    return ", ".join(claves[:24]) + ("…" if len(claves) > 24 else "")


def _verdadero(valor) -> bool:
    if valor is None or valor is False or valor == 0 or valor == "":
        return False
    if isinstance(valor, (list, tuple, dict)) and len(valor) == 0:
        return False
    return True


# ---------------------------------------------------------------- motor
class Plantillas:
    """Carga plantillas desde una carpeta raíz (los parciales se piden como «carpeta/archivo», sin .html)."""

    def __init__(self, raiz: Path):
        self.raiz = Path(raiz)
        self._cache: dict[str, list] = {}

    def _cargar(self, nombre: str, desde: str = "") -> list:
        if nombre not in self._cache:
            ruta = (self.raiz / (nombre + ".html")).resolve()
            try:
                ruta.relative_to(self.raiz.resolve())
            except ValueError:
                raise ErrorPlantilla(f"{desde}: la parte «{nombre}» apunta fuera del proyecto.")
            if not ruta.is_file():
                raise ErrorPlantilla(f"{desde}: no encuentro la parte «{nombre}» (busco {nombre}.html).")
            self._cache[nombre] = analizar(ruta.read_text(encoding="utf-8"), nombre + ".html")
        return self._cache[nombre]

    def renderizar(self, nombre: str, datos: dict) -> str:
        arbol = self._cargar(nombre, "plantilla")
        return self._pintar(arbol, [datos], nombre + ".html", 0)

    def renderizar_texto(self, texto: str, datos: dict, origen: str = "texto") -> str:
        return self._pintar(analizar(texto, origen), [datos], origen, 0)

    def _pintar(self, nodos: list, pila: list, origen: str, profundidad: int) -> str:
        if profundidad > LIMITE_PARCIALES:
            raise ErrorPlantilla(f"{origen}: las partes se incluyen unas a otras en círculo (más de {LIMITE_PARCIALES} niveles).")
        salida: list[str] = []
        for nodo in nodos:
            tipo = nodo[0]
            if tipo == "t":
                salida.append(nodo[1])
            elif tipo == "v":
                _, nombre, crudo, linea = nodo
                valor = self._valor(nombre, pila, origen, linea)
                if isinstance(valor, (list, tuple, dict)) or isinstance(valor, bool):
                    raise ErrorPlantilla(
                        f"{origen}, línea {linea}: «{nombre}» no es un texto o número (es {type(valor).__name__}). "
                        f"Usa {{{{#{nombre}}}}}…{{{{/{nombre}}}}} para recorrerlo o mostrarlo condicionalmente.")
                texto = "" if valor is None else str(valor)
                salida.append(texto if crudo else escape(texto, quote=True))
            elif tipo == "s":
                _, nombre, hijos, invertida, linea = nodo
                valor = self._valor(nombre, pila, origen, linea)
                if invertida:
                    if not _verdadero(valor):
                        salida.append(self._pintar(hijos, pila, origen, profundidad))
                elif isinstance(valor, (list, tuple)):
                    for elemento in valor:
                        salida.append(self._pintar(hijos, pila + [elemento], origen, profundidad))
                elif isinstance(valor, dict):
                    if valor:
                        salida.append(self._pintar(hijos, pila + [valor], origen, profundidad))
                elif _verdadero(valor):
                    salida.append(self._pintar(hijos, pila, origen, profundidad))
            elif tipo == "p":
                _, nombre, linea = nodo
                arbol = self._cargar(nombre, f"{origen}, línea {linea}")
                salida.append(self._pintar(arbol, pila, nombre + ".html", profundidad + 1))
        return "".join(salida)

    @staticmethod
    def _valor(nombre: str, pila: list, origen: str, linea: int):
        valor = _buscar(nombre, pila)
        if valor is _FALTA:
            raise ErrorPlantilla(
                f"{origen}, línea {linea}: la plantilla pide «{nombre}» pero esa información no existe. "
                f"Hay disponible: {_disponibles(pila)}.")
        return valor

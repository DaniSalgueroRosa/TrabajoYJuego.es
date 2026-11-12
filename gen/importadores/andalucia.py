# -*- coding: utf-8 -*-
"""
Importador de Andalucía: lee la «Resolución de 24 de julio de 2026 … distribución horaria … grados D y E»
(curso 2026/2027, Anexo I) y escribe  comunidades/andalucia/ciclos.json.

El anexo da HORAS SEMANALES por curso y módulo, no horas totales. Las horas totales se calculan como
horas semanales × semanas de curso (por defecto 32; se puede cambiar con --semanas). Con 32 semanas salen
las cifras de los currículos que usa el alumnado: 3 h → 96 h (Lenguajes de marcas), 6 h → 192 h (Bases de datos).

Uso:
    python3 -I gen/importadores/andalucia.py RUTA/AL/PDF.pdf [--semanas 32] [--salida comunidades/andalucia/ciclos.json]
Necesita la herramienta `pdftotext` (poppler-utils). Solo importa grado D medio y superior.
"""
import argparse
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import RAIZ, SIGLA, ALIAS, fold, slug, id_de, sentence_case, escribir_ciclos  # noqa: E402

RUIDO = ("Es copia auténtica", "Puede verificar la integridad", "a la dirección https", "FIRMADO POR", "VERIFICACIÓN")


def limpiar_modulo(nombre):
    nombre = sentence_case(re.sub(r"\s+", " ", nombre).strip()).rstrip(".")
    nombre = re.sub(r"\s+(GS|GM|GB)$", r" (\1)", nombre)
    return nombre


def leer_texto(pdf):
    return subprocess.run(["pdftotext", "-layout", pdf, "-"], check=True, capture_output=True, text=True).stdout.splitlines()


def parsear(lineas):
    """Devuelve una lista de ciclos con sus filas [codigo, nombre, curso, horas_semanales]."""
    ciclos = []
    actual = None
    col1 = col2 = None
    en_anexo_ii = False
    esperando_nombre = False
    for linea in lineas:
        if "ANEXO II" in linea:
            en_anexo_ii = True
        if en_anexo_ii or any(r in linea for r in RUIDO) or not linea.strip():
            continue
        m = re.match(r"^\s*(Ciclo formativo|Curso de especialización):\s+(.*?)\s+Horas:\s*(\d+)\s*$", linea)
        if m:
            actual = {"nombre": m.group(2).strip(), "tipo": m.group(1), "horas": int(m.group(3)), "filas": [],
                      "familia": "", "grado": ""}
            ciclos.append(actual)
            col1 = col2 = None
            esperando_nombre = False
            continue
        if actual is None:
            continue
        m = re.match(r"^\s*Familia Profesional:\s+(.*?)\s{2,}Grado:\s*(.*?)\s*$", linea)
        if m:
            actual["familia"], actual["grado"] = m.group(1).strip(), m.group(2).strip()
            continue
        if re.match(r"^\s*Código\s+Módulo", linea):
            if "1º" in linea and "2º" in linea:
                col1, col2 = linea.index("1º"), linea.index("2º")
            else:
                col1 = col2 = None      # cursos de especialización: una sola columna de horas, no se importan
            continue
        if col1 is None:
            # nombre de ciclo que continúa en la línea siguiente (p. ej. «… Moldeo de Metales y» / «Polímeros»)
            if actual and not actual["grado"] and not actual["filas"] and not linea.strip().startswith("Distribución"):
                actual["nombre"] += " " + linea.strip()
            continue
        m = re.match(r"^\s*([A-Z0-9]{4,6})\s+(.*?)\s{2,}(\d+)\s*$", linea)
        if m:
            columna = m.start(3)
            curso = 1 if abs(columna - col1) <= abs(columna - col2) else 2
            actual["filas"].append([m.group(1), m.group(2).strip(), curso, int(m.group(3))])
            continue
        m = re.match(r"^\s{6,}(\S.*)$", linea)
        if m and actual["filas"] and not linea.strip().startswith("Distribución"):
            actual["filas"][-1][1] += " " + m.group(1).strip()   # el nombre del módulo sigue en la línea de abajo
    return ciclos


def construir(ciclos, semanas):
    salida, ids = [], set()
    omitidos = []
    for c in ciclos:
        if c["tipo"] != "Ciclo formativo" or c["grado"] not in ("D Medio", "D Superior"):
            continue
        if c["horas"] != 2000:      # los ciclos de 3 años (2540 h) tienen 3 columnas de curso: la calculadora aún no los admite
            omitidos.append("%s (%d h)" % (c["nombre"], c["horas"]))
            continue
        superior = c["grado"] == "D Superior"
        nombre = sentence_case(re.sub(r"\s+", " ", c["nombre"]))
        familias = [f.strip() for f in c["familia"].split("/")]
        cid = id_de(nombre, superior)
        assert cid not in ids, ("id duplicado", cid)
        ids.add(cid)
        modulos = {"1": [], "2": []}
        semanal = {1: 0, 2: 0}
        for codigo, mod, curso, h in c["filas"]:
            modulos[str(curso)].append([limpiar_modulo(mod), h * semanas, h])
            semanal[curso] += h
        d = {"id": cid, "nombre": nombre, "grado": "superior" if superior else "medio", "familia": familias[0],
             "semanal": semanal}
        if len(familias) > 1:
            d["familia2"] = familias[1]
        if cid in SIGLA:
            d["sigla"] = SIGLA[cid]
        if nombre in ALIAS:
            d["alias"] = ALIAS[nombre]
        d["modulos"] = modulos
        salida.append(d)
    return salida, omitidos


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf")
    ap.add_argument("--semanas", type=int, default=32)
    ap.add_argument("--salida", default=os.path.join(RAIZ, "comunidades", "andalucia", "ciclos.json"))
    a = ap.parse_args()
    ciclos, omitidos = construir(parsear(leer_texto(a.pdf)), a.semanas)
    for c in ciclos:
        for curso in (1, 2):
            assert c["semanal"][curso] == 30, ("las horas semanales de un curso no suman 30", c["id"], curso, c["semanal"])
    escribir_ciclos(ciclos, a.salida)
    if omitidos:
        print("omitidos por tener 3 cursos:", "; ".join(omitidos))
    print("ciclos importados:", len(ciclos),
          "| superior:", sum(1 for c in ciclos if c["grado"] == "superior"),
          "| medio:", sum(1 for c in ciclos if c["grado"] == "medio"))


if __name__ == "__main__":
    main()

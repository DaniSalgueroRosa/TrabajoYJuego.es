# -*- coding: utf-8 -*-
"""
Crea la carpeta de una comunidad nueva, lista para rellenar.

    python3 gen/nueva_comunidad.py valencia
    python3 gen/nueva_comunidad.py "Región de Murcia" --carpeta murcia

Crea  comunidades/<carpeta>/comunidad.json  (con el porcentaje de faltas, la nota y las fuentes que ya teníamos
investigados de esa comunidad) y  comunidades/<carpeta>/ciclos.json  (vacío). Después:
  1. Rellena ciclos.json con los ciclos y las horas de los módulos de esa comunidad (mira Andalucía como ejemplo).
  2. Añade en comunidad.json la sección "horas" (de qué documento salen las horas).
  3. Ejecuta  python3 gen/construir.py : crea datos.js, añade la comunidad a las calculadoras y regenera las páginas.
"""
import argparse
import json
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from porcentajes_investigados import COMUNIDADES, buscar  # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def slug(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("comunidad", help="nombre o id de la comunidad (por ejemplo: valencia, 'Región de Murcia', mur)")
    ap.add_argument("--carpeta", help="nombre de la carpeta (por defecto, el nombre de la comunidad sin tildes)")
    a = ap.parse_args()

    base = buscar(a.comunidad)
    nombre = base["nombre"] if base else a.comunidad
    carpeta = a.carpeta or slug(nombre.split("(")[0])
    destino = os.path.join(RAIZ, "comunidades", carpeta)
    if os.path.exists(destino):
        raise SystemExit("Ya existe comunidades/%s. No la toco." % carpeta)
    os.makedirs(destino)

    meta = {"id": carpeta, "nombre": nombre.split(" (")[0] if base else nombre}
    if base:
        if base.get("alias"):
            meta["alias"] = base["alias"]
        meta.update({"porcentaje": base["pct"], "origen": base["origen"], "cuentan": base["cuentan"]})
        if base.get("pct_curso"):
            meta["porcentajeCurso"] = {str(k): v for k, v in base["pct_curso"].items()}
        if base.get("norma"):
            meta["norma"] = base["norma"]
        meta["nota"] = base["nota"]
        if base.get("matricula"):
            meta["matricula"] = base["matricula"]
        meta["fuentes"] = [{"t": t, "u": u} for t, u in base["fuentes"]]
    else:
        meta.update({"porcentaje": 15, "origen": "sin-datos", "cuentan": "centro",
                     "nota": "Escribe aquí qué dice la normativa de la comunidad sobre las faltas.", "fuentes": []})
    meta["horas"] = {"fuente": "ESCRIBE AQUÍ el documento de donde salen las horas de los módulos", "enlaces": [],
                     "nota": "Escribe aquí cómo se han calculado las horas, si hace falta."}
    meta["trimestres"] = {"1": 3, "2": 3}

    with open(os.path.join(destino, "comunidad.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
        f.write("\n")
    with open(os.path.join(destino, "ciclos.json"), "w", encoding="utf-8") as f:
        f.write("[]\n")
    print("Creada comunidades/%s con comunidad.json (%s) y ciclos.json vacío." % (
        carpeta, "con los datos que ya teníamos" if base else "en blanco"))
    print("Siguiente paso: rellena ciclos.json y la sección \"horas\" de comunidad.json; luego  python3 gen/construir.py")


if __name__ == "__main__":
    main()

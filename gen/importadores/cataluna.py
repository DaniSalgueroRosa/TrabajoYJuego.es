# -*- coding: utf-8 -*-
"""
Importador de Cataluña: lee el PDF «Carga horaria por módulo de los ciclos formativos de grado medio y superior de
Cataluña» y escribe  comunidades/cataluna/ciclos.json.

Cómo es el documento (y por qué se importa así):
  * Cada ciclo suma 2000 h: 1485 h en el centro + 515 h de estada en la empresa, repartidas dentro de los módulos.
    Cada fila trae  Total = Centro + Empresa.
  * Las horas de CENTRO casi siempre son múltiplos de 33 (horas semanales × 33 semanas): son las de tu horario en el
    instituto. Esas son las que usa la calculadora de faltas. Las horas totales del módulo se guardan en la cuarta
    posición de cada fila.
  * La columna «Curso» casi siempre dice «Centro»: la Generalitat no fija en qué curso va cada módulo, lo decide cada
    instituto. Solo Itinerari personal I (1.º) y Itinerari personal II, Projecte intermodular y optativo (2.º) tienen
    curso. Los módulos «Centro» se escriben en las dos listas (1.º y 2.º) y cada alumno quita los que no cursa.
  * Cada fila de ciclos.json es  [nombre, horas de centro, horas semanales, horas totales].
  * Los nombres de los módulos se dejan en catalán, como aparecen en el horario. Los ciclos usan el nombre castellano y el
    mismo id que en las demás comunidades (así la calculadora de notas los muestra una sola vez).

Comprobaciones al importar: cada ciclo suma 2000 h en total, 1485 h en el centro y 515 h en la empresa, y en cada módulo
Total = Centro + Empresa.

Uso:
    python3 -I gen/importadores/cataluna.py RUTA/AL/PDF.pdf [--salida comunidades/cataluna/ciclos.json]
Necesita la herramienta `pdftotext` (poppler-utils). Ciclos que no cuadran (Disseny en fabricació mecànica) se omiten.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import RAIZ, SIGLA, ALIAS, slug, id_de, escribir_ciclos  # noqa: E402

SEMANAS = 33          # las horas de centro del documento suelen ser múltiplos de 33 (= horas semanales × 33 semanas)

# Nombre del ciclo en el documento (catalán) → nombre castellano y grado (se omiten los ciclos no incluidos)
CICLOS = {
    # grado medio
    "Gestió administrativa": ("Gestión administrativa", "medio"),
    "Preimpressió digital": ("Preimpresión digital", "medio"),
    "Construcció": ("Construcción", "medio"),
    "Instal·lacions elèctriques i automàtiques": ("Instalaciones eléctricas y automáticas", "medio"),
    "Instal·lacions de telecomunicacions": ("Instalaciones de telecomunicaciones", "medio"),
    "Fusteria i moble": ("Carpintería y mueble", "medio"),
    "Instal·lació i moblament": ("Instalación y amueblamiento", "medio"),
    "Sistemes microinformàtics i xarxes": ("Sistemas microinformáticos y redes", "medio"),
    "Instal·lacions de producció de calor": ("Instalaciones de producción de calor", "medio"),
    "Instal·lacions frigorífiques i de climatització": ("Instalaciones frigoríficas y de climatización", "medio"),
    "Manteniment electromecànic": ("Mantenimiento electromecánico", "medio"),
    "Operacions de laboratori": ("Operaciones de laboratorio", "medio"),
    # grado superior
    "Administració i finances": ("Administración y finanzas", "superior"),
    "Administració i finances (perfil Assegurances)": ("Administración y finanzas (perfil Seguros)", "superior"),
    "Assistència a la direcció": ("Asistencia a la dirección", "superior"),
    "Disseny i edició de publicacions impreses i multimèdia": (
        "Diseño y edición de publicaciones impresas y multimedia", "superior"),
    "Disseny i gestió de la producció gràfica": ("Diseño y gestión de la producción gráfica", "superior"),
    "Organització i control d'obres de construcció": ("Organización y control de obras de construcción", "superior"),
    "Projectes d'edificació": ("Proyectos de edificación", "superior"),
    "Projectes d'obra civil": ("Proyectos de obra civil", "superior"),
    "Automatització i robòtica industrial": ("Automatización y robótica industrial", "superior"),
    "Manteniment electrònic": ("Mantenimiento electrónico", "superior"),
    "Sistemes de telecomunicacions i informàtics": ("Sistemas de telecomunicaciones e informáticos", "superior"),
    "Sistemes electrotècnics i automatitzats": ("Sistemas electrotécnicos y automatizados", "superior"),
    "Eficiència energètica i energia solar tèrmica": ("Eficiencia energética y energía solar térmica", "superior"),
    "Energies renovables": ("Energías renovables", "superior"),
    "Construccions metàl·liques": ("Construcciones metálicas", "superior"),
    "Programació de la producció en fabricació mecànica": (
        "Programación de la producción en fabricación mecánica", "superior"),
    "Disseny i moblament": ("Diseño y amueblamiento", "superior"),
    "Administració de sistemes informàtics en xarxa (ASIX)": (
        "Administración de sistemas informáticos en red", "superior"),
    "Desenvolupament d'aplicacions multiplataforma (DAM)": (
        "Desarrollo de aplicaciones multiplataforma", "superior"),
    "Desenvolupament d'aplicacions web (DAW)": ("Desarrollo de aplicaciones web", "superior"),
    "Desenvolupament de projectes d'instal·lacions tèrmiques i de fluids": (
        "Desarrollo de proyectos de instalaciones térmicas y de fluidos", "superior"),
    "Manteniment d'instal·lacions tèrmiques i de fluids": (
        "Mantenimiento de instalaciones térmicas y de fluidos", "superior"),
    "Mecatrònica industrial": ("Mecatrónica industrial", "superior"),
    "Fabricació de productes farmacèutics, biotecnològics i afins": (
        "Fabricación de productos farmacéuticos, biotecnológicos y afines", "superior"),
    "Química industrial": ("Química industrial", "superior"),
    "Laboratori d'anàlisi i de control de qualitat": ("Laboratorio de análisis y control de calidad", "superior"),
}
# Ciclos del documento que se dejan fuera porque sus cifras no cuadran
OMITIDOS = ["Disseny en fabricació mecànica"]
# Palabras para buscar el ciclo escribiendo en catalán (se suman a las siglas y alias de siempre)
ALIAS_CAT = {
    "Administración de sistemas informáticos en red": "ASIX",
    "Sistemas microinformáticos y redes": "SMX",
    "Administración y finanzas (perfil Seguros)": "asseguranses assegurances seguros AF",
    "Proyectos de edificación": "rehabilitacio restauracio rehabilitación restauración",
}
FAMILIAS = {
    "Administració i gestió": "Administración y Gestión",
    "Arts gràfiques": "Artes Gráficas",
    "Edificació i obra civil": "Edificación y Obra Civil",
    "Electricitat i electrònica": "Electricidad y Electrónica",
    "Energia i aigua": "Energía y Agua",
    "Fabricació mecànica": "Fabricación Mecánica",
    "Fusta, moble i suro": "Madera, Mueble y Corcho",
    "Informàtica i comunicacions": "Informática y Comunicaciones",
    "Instal·lació i manteniment": "Instalación y Mantenimiento",
    "Química": "Química",
}

FILA = re.compile(r"^\s*(\w{4}|—)\s+(\S.*?)\s{2,}(\d+)\s+(\d+)\s+(\d+)\s+(Centro|1\.º|2\.º)\s*$")
TOTAL = re.compile(r"^\s*Total del ciclo\s+(\d+)\s+(\d+)\s+(\d+)\s*$")
RUIDO = ("Page ", "Carga horaria por m", "Cód.", "Fuente")


def nfc(s):
    return unicodedata.normalize("NFC", s)


def leer_texto(pdf):
    out = subprocess.run(["pdftotext", "-layout", pdf, "-"], check=True, capture_output=True, text=True).stdout
    return [nfc(l.rstrip()) for l in out.splitlines()]


def parsear(lineas):
    """Devuelve [{cat, familia, filas:[[codigo, nombre, total, centro, empresa, curso]], total:(t,c,e)}]."""
    ciclos, actual, grado_ok = [], None, False
    previas = []               # últimas líneas con texto antes de «Fuente»
    for linea in lineas:
        s = linea.strip()
        if not s:
            continue
        if s.startswith("Grado medio") or s.startswith("Grado superior"):
            grado_ok = True
            previas = []
            continue
        if not grado_ok:
            continue
        if s.startswith("Pendiente en grado") or s.startswith("Fuentes y notas"):
            actual = None
            if s.startswith("Fuentes y notas"):
                break
            continue
        if s.startswith("Page ") or s.startswith("Carga horaria por m"):
            continue
        if s == "Fuente":
            nombre = previas[-1]
            anterior = previas[-2] if len(previas) > 1 else ""
            actual = {"cat": nombre, "filas": [], "total": None, "familia": FAMILIAS.get(anterior)}
            if actual["familia"] is None and ciclos:
                actual["familia"] = ciclos[-1]["familia"]
            ciclos.append(actual)
            previas = []
            continue
        if actual is not None and not actual["total"]:
            m = FILA.match(linea)
            if m:
                cod, nombre, t, c, e, curso = m.groups()
                actual["filas"].append([cod, nombre, int(t), int(c), int(e), curso])
                continue
            m = TOTAL.match(linea)
            if m:
                actual["total"] = tuple(int(x) for x in m.groups())
                continue
            if s.startswith("Cód."):
                continue
            if actual["filas"]:
                actual["filas"][-1][1] += " " + s        # el nombre del módulo sigue en la línea de abajo
            continue
        previas.append(s)
        previas = previas[-3:]
    return ciclos


def limpiar_nombre(n):
    deducido = "no figura a la fitxa" in n
    n = re.sub(r"\s*\((?:no figura a la fitxa[^)]*)\)", "", n)
    n = re.sub(r"\s+", " ", n).strip()
    return n, deducido


def conocidos():
    """{id: entrada} de los ciclos que ya tienen las demás comunidades (nombre, familia, sigla y alias que se muestran)."""
    out = {}
    base = os.path.join(RAIZ, "comunidades")
    for carpeta in sorted(os.listdir(base)):
        ruta = os.path.join(base, carpeta, "ciclos.json")
        if carpeta == "cataluna" or not os.path.isfile(ruta):
            continue
        with open(ruta, encoding="utf-8") as f:
            for c in json.load(f):
                out.setdefault(c["id"], c)
    return out


def construir(ciclos):
    ya = conocidos()
    salida, deducidos, omitidos, ids = [], [], [], set()
    for c in ciclos:
        c["cat"] = re.sub(r"\s*\(també el perfil[^)]*\)", "", c["cat"])      # «Projectes d'edificació (també el perfil …)»
        if c["cat"] not in CICLOS:
            omitidos.append(c["cat"])
            continue
        nombre_es, grado = CICLOS[c["cat"]]
        superior = grado == "superior"
        cid = id_de(nombre_es, superior)
        assert cid not in ids, ("id duplicado", cid)
        ids.add(cid)
        t = tuple(sum(f[i] for f in c["filas"]) for i in (2, 3, 4))
        assert t == (2000, 1485, 515), ("las horas del ciclo no suman 2000 = 1485 + 515", c["cat"], t)
        assert t == c["total"], ("la suma no coincide con la fila «Total del ciclo»", c["cat"], t, c["total"])
        modulos = {"1": [], "2": []}
        for cod, nom, total, centro, empresa, curso in c["filas"]:
            assert total == centro + empresa, ("Total ≠ Centro + Empresa", c["cat"], nom)
            nom, dedu = limpiar_nombre(nom)
            if dedu:
                deducidos.append("%s: %s" % (nombre_es, nom))
            fila = [nom, centro, round(centro / SEMANAS, 1), total]
            for k in ("1", "2"):
                if curso == "Centro" or curso == k + ".º":
                    modulos[k].append(list(fila))
        base = ya.get(cid, {})
        d = {"id": cid, "nombre": base.get("nombre", nombre_es), "grado": grado,
             "familia": base.get("familia", c["familia"])}
        if base.get("familia2"):
            d["familia2"] = base["familia2"]
        if cid in SIGLA:
            d["sigla"] = SIGLA[cid]
        alias = " ".join(x for x in (ALIAS.get(nombre_es), ALIAS_CAT.get(nombre_es), c["cat"].split(" (")[0].lower()) if x)
        d["alias"] = alias
        d["modulos"] = modulos
        salida.append(d)
    return salida, deducidos, omitidos


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf")
    ap.add_argument("--salida", default=os.path.join(RAIZ, "comunidades", "cataluna", "ciclos.json"))
    a = ap.parse_args()
    ciclos = parsear(leer_texto(a.pdf))
    salida, deducidos, omitidos = construir(ciclos)
    escribir_ciclos(salida, a.salida)
    print("ciclos importados:", len(salida), "| superior:", sum(1 for c in salida if c["grado"] == "superior"),
          "| medio:", sum(1 for c in salida if c["grado"] == "medio"))
    if omitidos:
        print("omitidos (no están en la lista o no cuadran):", "; ".join(omitidos))
    if deducidos:
        print("módulos que el documento marca como deducidos (%d):" % len(deducidos))
        for d in deducidos:
            print("  -", d)


if __name__ == "__main__":
    main()

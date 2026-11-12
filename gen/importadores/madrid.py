# -*- coding: utf-8 -*-
"""
Importador de la Comunidad de Madrid: lee las «tablas de grado medio» y «tablas de grado superior» publicadas en
comunidad.madrid (una página por ciclo) y escribe  comunidades/madrid/ciclos.json.

Cada tabla da, por módulo, la DURACIÓN DEL CURRÍCULO EN HORAS (las horas totales reales, sin cálculos) y las horas
semanales de 1º o de 2º. Aquí no hay que multiplicar nada: las horas que ves en la calculadora son las del documento.
Comprobaciones al importar: cada curso suma 30 horas semanales y todos los módulos suman las horas del ciclo (2000).

Uso:
    python3 -I gen/importadores/madrid.py tablas_grado_medio.pdf tablas_grado_superior.pdf [--salida comunidades/madrid/ciclos.json]
Necesita la herramienta `pdftotext` (poppler-utils). Se pueden pasar uno o los dos PDF.
Los ciclos de más de 2000 horas (3 cursos o doble titulación) se omiten: la calculadora trabaja con 1º y 2º.
"""
import argparse
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import RAIZ, SIGLA, ALIAS, fold, slug, id_de, escribir_ciclos, nombres_conocidos  # noqa: E402

# Familias profesionales (con sus mayúsculas) y erratas del documento. Se buscan sobre el texto sin tildes.
FAMILIAS = [
    "Actividades Físicas y Deportivas", "Administración y Gestión", "Agraria", "Artes Gráficas", "Comercio y Marketing",
    "Edificación y Obra Civil", "Electricidad y Electrónica", "Energía y Agua", "Fabricación Mecánica",
    "Hostelería y Turismo", "Imagen Personal", "Imagen y Sonido", "Industrias Alimentarias", "Industrias Extractivas",
    "Informática y Comunicaciones", "Instalación y Mantenimiento", "Madera, Mueble y Corcho", "Marítimo-Pesquera",
    "Química", "Sanidad", "Seguridad y Medio Ambiente", "Servicios Socioculturales y a la Comunidad",
    "Textil, Confección y Piel", "Transporte y Mantenimiento de Vehículos", "Vidrio y Cerámica",
]
ERRATAS = {"admnistracion": "administracion"}      # «ADMNISTRACIÓN Y GESTIÓN» en la tabla de grado medio


def familias_de(texto):
    """«COMERCIO Y MÁRKETING Y HOSTELERÍA Y TURISMO» → ['Comercio y Marketing', 'Hostelería y Turismo']."""
    plano = fold(texto)
    for mal, bien in ERRATAS.items():
        plano = plano.replace(mal, bien)
    halladas = []
    for nombre in sorted(FAMILIAS, key=lambda n: -len(n)):
        m = re.search(r"(?<![a-z])" + re.escape(fold(nombre)) + r"(?![a-z])", plano)
        if m:
            halladas.append((m.start(), nombre))
            plano = plano[:m.start()] + " " * (m.end() - m.start()) + plano[m.end():]
    resto = re.sub(r"[\s/,]+|\by\b", "", plano)
    assert not resto, ("familia desconocida", texto, resto)
    return [n for _, n in sorted(halladas)]


def nombre_ciclo(mayusculas, conocidos):
    """«ANIMACIONES 3D, JUEGOS Y ENTORNOS INTERACTIVOS» → «Animaciones 3D, juegos y entornos interactivos»."""
    limpio = re.sub(r"\s+", " ", mayusculas).strip()
    if slug(limpio) in conocidos:               # el mismo ciclo ya existe en otra comunidad: se escribe igual
        return conocidos[slug(limpio)]
    bajo = limpio.lower()
    return bajo[:1].upper() + bajo[1:]


def leer_texto(pdf):
    return subprocess.run(["pdftotext", "-layout", pdf, "-"], check=True, capture_output=True, text=True).stdout


CIFRAS = r"(?:\d+|-)(?:\s+(?:\d+|-))*"
FILA = re.compile(r"^\s*(\d{4}|CMO)\s+(\S.*?)(?:\s{2,}(" + CIFRAS + r"))?\s*$")   # código, nombre y, casi siempre, las cifras
SOLO_CIFRAS = re.compile(r"^\s+(" + CIFRAS + r")\s*$")   # cifras en una línea aparte (el nombre ocupa dos líneas)


def parsear_pagina(lineas):
    """Un ciclo por página. Devuelve None si la página no es de un ciclo."""
    familia = grado = None
    horas_ciclo = None
    nombre_lineas = []
    estado = "cabecera"
    col1 = col2 = None
    con_ects = False
    filas = []
    totales = None
    for linea in lineas:
        t = linea.strip()
        if not t:
            continue
        if estado == "cabecera":
            m = re.match(r"^Familia profesional:\s*(.*)$", t)
            if m:
                familia = m.group(1)
                continue
            m = re.match(r"^Ciclo Formativo:?\s*(.*)$", t)
            if m:
                nombre_lineas = [m.group(1)]
                continue
            if t.startswith("Doble titulación"):
                nombre_lineas = [t]
                continue
            m = re.match(r"^Grado:\s*(\S+)\s+Duración:\s*(\d+)\s*horas", t)
            if m:
                grado, horas_ciclo = m.group(1), int(m.group(2))
                estado = "tabla"
                continue
            if nombre_lineas:                    # el nombre del ciclo sigue en la línea de abajo
                nombre_lineas.append(t)
            continue
        # estado == "tabla"
        if "Curso 1º" in linea and "Curso 2º" in linea:
            col1, col2 = linea.index("Curso 1º"), linea.index("Curso 2º")
            continue
        if "ECTS" in linea:
            con_ects = True
        if t.startswith("HORAS TOTALES"):
            totales = [int(x) for x in re.findall(r"\d+", t)]
            break
        m = FILA.match(linea)
        if m:
            filas.append({"codigo": m.group(1), "nombre": m.group(2), "cifras": None})
            if m.group(3):
                filas[-1]["cifras"] = (m.group(3).split(), m.start(3) + m.group(3).rindex(m.group(3).split()[-1]))
            continue
        m = SOLO_CIFRAS.match(linea)
        if m and filas and filas[-1]["cifras"] is None:
            filas[-1]["cifras"] = (m.group(1).split(), m.start(1) + m.group(1).rindex(m.group(1).split()[-1]))
            continue
        if filas and not re.match(r"^(Código|Duración|del|currículo|\(horas|semanales|P á g i n a)", t):
            filas[-1]["nombre"] += " " + t            # el nombre del módulo sigue en la línea de abajo
    if grado is None or not filas:
        return None
    resultado = []
    for f in filas:
        assert f["cifras"], ("módulo sin cifras", nombre_lineas, f["nombre"])
        cifras, col = f["cifras"]
        esperadas = 3 if con_ects else 2               # horas, [créditos ECTS], horas semanales
        if len(cifras) == esperadas:
            curso = 1 if abs(col - col1) <= abs(col - col2) else 2
            semanal = int(cifras[-1])
        else:                                          # sin horas semanales: el proyecto intermodular, al final de 2º
            curso, semanal = 2, 0
        resultado.append([f["codigo"], f["nombre"], curso, int(cifras[0]), semanal])
    filas = resultado
    return {"familia": familia, "nombre": " ".join(nombre_lineas), "grado": grado, "horas": horas_ciclo,
            "filas": filas, "totales": totales}


def parsear(texto):
    ciclos = []
    for pagina in texto.split("\x0c"):
        c = parsear_pagina(pagina.splitlines())
        if c:
            ciclos.append(c)
    return ciclos


def limpiar_modulo(nombre):
    nombre = re.sub(r"\s+", " ", nombre).strip()
    return "Módulo optativo" if nombre == "Módulo profesional optativo" else nombre


def construir(ciclos, conocidos):
    salida, ids, omitidos = [], set(), []
    for c in ciclos:
        if c["nombre"].startswith("Doble titulación") or c["horas"] != 2000:
            omitidos.append("%s (%d h)" % (re.sub(r"\s+", " ", c["nombre"]).strip().capitalize(), c["horas"]))
            continue
        superior = c["grado"] == "Superior"
        assert c["grado"] in ("Medio", "Superior"), c["grado"]
        nombre = nombre_ciclo(c["nombre"], conocidos)
        cid = id_de(nombre, superior)
        assert cid not in ids, ("id duplicado", cid)
        ids.add(cid)
        modulos = {"1": [], "2": []}
        semanal = {1: 0, 2: 0}
        for codigo, mod, curso, h, s in c["filas"]:
            modulos[str(curso)].append([limpiar_modulo(mod), h, s])
            semanal[curso] += s
        # Comprobaciones contra los totales que imprime el propio documento
        assert sum(f[3] for f in c["filas"]) == c["horas"], (nombre, "los módulos no suman las horas del ciclo",
                                                              sum(f[3] for f in c["filas"]), c["horas"])
        assert c["totales"] and c["totales"][0] == c["horas"] and c["totales"][1:] == [semanal[1], semanal[2]], (
            nombre, "las horas semanales no coinciden con la fila «HORAS TOTALES»", c["totales"], semanal)
        familias = familias_de(c["familia"])
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
    ap.add_argument("pdf", nargs="+", help="tablas de grado medio y/o de grado superior")
    ap.add_argument("--salida", default=os.path.join(RAIZ, "comunidades", "madrid", "ciclos.json"))
    a = ap.parse_args()
    # Los nombres de ciclo se escriben igual que en las demás comunidades (sin contar los de esta misma)
    conocidos = {k: v for k, v in nombres_conocidos().items()}
    ciclos = []
    for pdf in a.pdf:
        ciclos += parsear(leer_texto(pdf))
    salida, omitidos = construir(ciclos, conocidos)
    ids = [c["id"] for c in salida]
    assert len(ids) == len(set(ids)), "hay ciclos repetidos entre los PDF"
    escribir_ciclos(salida, a.salida)
    if omitidos:
        print("omitidos (más de 2000 horas):", "; ".join(omitidos))
    print("ciclos importados:", len(salida),
          "| superior:", sum(1 for c in salida if c["grado"] == "superior"),
          "| medio:", sum(1 for c in salida if c["grado"] == "medio"))


if __name__ == "__main__":
    main()

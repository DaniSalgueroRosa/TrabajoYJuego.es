# -*- coding: utf-8 -*-
"""
Código que comparten los importadores de comunidades (gen/importadores/<comunidad>.py).

Lo importante: un mismo ciclo tiene el MISMO id en todas las comunidades (nombre sin tildes + "-gm" o "-gs").
Así la calculadora de notas, que no depende de la comunidad, lo muestra una sola vez, y las siglas y las palabras
de búsqueda (SIGLA y ALIAS) se escriben una vez aquí.
"""
import json
import os
import re
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Siglas que se muestran junto al nombre y palabras que la gente usa para buscar (no se muestran)
SIGLA = {
    "sistemas-microinformaticos-y-redes-gm": "SMR",
    "administracion-de-sistemas-informaticos-en-red-gs": "ASIR",
    "desarrollo-de-aplicaciones-multiplataforma-gs": "DAM",
    "desarrollo-de-aplicaciones-web-gs": "DAW",
}
ALIAS = {
    "Gestión administrativa": "GA administrativo",
    "Administración y finanzas": "AF",
    "Asistencia a la dirección": "secretariado",
    "Cuidados auxiliares de enfermería": "TCAE auxiliar enfermeria",
    "Emergencias sanitarias": "TES ambulancias",
    "Farmacia y parafarmacia": "farmacia",
    "Higiene bucodental": "dentista bucodental",
    "Laboratorio clínico y biomédico": "LCB",
    "Imagen para el diagnóstico y medicina nuclear": "IDMN rayos radiologia",
    "Anatomía patológica y citodiagnóstico": "APC",
    "Documentación y administración sanitarias": "DAS",
    "Acondicionamiento físico": "TAFAD",
    "Enseñanza y animación sociodeportiva": "TAFAD EAS",
    "Educación infantil": "TSEI infantil",
    "Integración social": "TSIS",
    "Animación sociocultural y turística": "ASCT TSASCT",
    "Atención a personas en situación de dependencia": "APSD dependencia",
    "Marketing y publicidad": "MKT",
    "Actividades comerciales": "AC",
    "Transporte y logística": "TL",
    "Instalaciones eléctricas y automáticas": "IEA electricidad",
    "Sistemas electrotécnicos y automatizados": "SEA",
    "Automatización y robótica industrial": "ARI",
    "Mantenimiento electromecánico": "MEM",
    "Electromecánica de vehículos automóviles": "EVA mecanica coches",
    "Mecatrónica industrial": "MI",
    "Cocina y gastronomía": "cocinero cocina",
    "Servicios en restauración": "camarero sala",
    "Estética y belleza": "EB",
    "Peluquería y cosmética capilar": "PCC",
    "Producción de audiovisuales y espectáculos": "PAE",
    "Realización de proyectos audiovisuales y espectáculos": "RPAE",
    "Animaciones 3D, juegos y entornos interactivos": "A3D videojuegos",
    "Iluminación, captación y tratamiento de imagen": "ICTI fotografia",
    "Sonido para audiovisuales y espectáculos": "SAE",
    "Vídeo, disc-jockey y sonido": "VDJ dj",
    "Prevención de riesgos profesionales": "PRP",
    "Educación y control ambiental": "ECA",
}


def fold(s):
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", fold(s)).strip("-")


def sentence_case(nombre):
    """«Acceso y Conservación en Instalaciones Deportivas» → «Acceso y conservación en instalaciones deportivas»."""
    palabras = nombre.split()
    out = []
    for i, p in enumerate(palabras):
        partes = p.split("-")
        nuevas = []
        for j, q in enumerate(partes):
            titulo = re.fullmatch(r"[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+", q) is not None
            nuevas.append(q.lower() if titulo and not (i == 0 and j == 0) else q)
        out.append("-".join(nuevas))
    return " ".join(out)


# Ciclos que una comunidad escribe con un nombre algo distinto: comparten id para que cuenten como el mismo ciclo.
# {slug del nombre tal como lo escribe la comunidad: slug que se usa para el id}
ID_EQUIVALENTES = {
    "aceites-de-oliva-y-vinos": "aceite-de-oliva-y-vinos",
    "direccion-de-servicios-de-restauracion": "direccion-de-servicios-en-restauracion",
}


def id_de(nombre, superior):
    """Id de un ciclo: nombre sin tildes + «-gs» (grado superior) o «-gm» (grado medio)."""
    s = slug(nombre)
    return ID_EQUIVALENTES.get(s, s) + ("-gs" if superior else "-gm")


def nombres_conocidos():
    """{slug del nombre: nombre} de los ciclos que ya tienen las demás comunidades, para escribir igual el mismo ciclo."""
    out = {}
    base = os.path.join(RAIZ, "comunidades")
    if not os.path.isdir(base):
        return out
    for carpeta in sorted(os.listdir(base)):
        ruta = os.path.join(base, carpeta, "ciclos.json")
        if carpeta.startswith(("_", ".")) or not os.path.isfile(ruta):
            continue
        with open(ruta, encoding="utf-8") as f:
            for c in json.load(f):
                out.setdefault(slug(c["nombre"]), c["nombre"])
    return out


def escribir_ciclos(ciclos, ruta):
    """Escribe ciclos.json con un ciclo por línea (fácil de leer y de comparar)."""
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as f:
        f.write("[\n" + ",\n".join("  " + json.dumps(c, ensure_ascii=False, separators=(",", ":")) for c in ciclos) + "\n]\n")

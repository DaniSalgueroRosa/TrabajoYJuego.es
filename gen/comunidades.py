# -*- coding: utf-8 -*-
"""
Carga, valida y convierte a JavaScript las carpetas de  comunidades/<carpeta>/.

Una comunidad = una carpeta con dos archivos que se editan a mano:

  comunidad.json   porcentaje de faltas, qué faltas cuentan, norma, nota, fuentes y de dónde salen las horas
                   ("idioma": "ca" si los nombres de los módulos no están en castellano; la calculadora de notas lo avisa)
                   ("horas": {"fuente": texto, "enlaces": [{"t": texto, "u": https://…}], "semanas": n, "nota": texto})
  ciclos.json      lista de ciclos de esa comunidad, cada uno con sus módulos y horas por curso

y uno que se GENERA (no lo edites):

  datos.js         lo carga el navegador; lo crea  python3 gen/construir.py

Formato de ciclos.json (una lista):
  {"id": "desarrollo-de-aplicaciones-web-gs", "nombre": "Desarrollo de aplicaciones web", "grado": "superior" | "medio",
   "familia": "Informática y Comunicaciones", "sigla": "DAW" (opcional), "alias": "palabras para buscar" (opcional),
   "trimestres": {"1": 3, "2": 3} (opcional; si falta, el de comunidad.json),
   "modulos": {"1": [["Nombre del módulo", horas totales], ...], "2": [...]}}
Un curso sin módulos de aula se escribe con una lista vacía []. No incluyas la FCT.
Los campos que no reconoce el sitio (por ejemplo «semanal» o la tercera cifra de cada módulo) se ignoran.
"""
import json
import os
import re

ORIGEN_ETIQUETA = {
    "norma": "Dato de la normativa",
    "indicio": "Dato de documentos de centros o sindicatos",
    "centro": "Lo fija cada centro",
    "sin-datos": "Sin verificar",
}

CUENTAN_TEXTO = {
    "todas": "Cuentan justificadas e injustificadas",
    "injust": "Solo cuentan las injustificadas",
    "centro": "Depende del centro",
}

CARPETA = "comunidades"


def _leer(ruta):
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def validar(meta, ciclos, carpeta):
    """Comprueba una comunidad y avisa con un mensaje claro de lo que esté mal."""
    def falla(msg):
        raise SystemExit("comunidades/%s: %s" % (carpeta, msg))

    if meta.get("id") != carpeta:
        falla('el "id" de comunidad.json debe ser igual al nombre de la carpeta (%r)' % carpeta)
    if not re.fullmatch(r"[a-z0-9-]+", carpeta):
        falla("el nombre de la carpeta solo puede tener minúsculas sin tildes, números y guiones")
    for campo in ("nombre", "porcentaje", "origen", "cuentan", "nota"):
        if campo not in meta:
            falla('falta "%s" en comunidad.json' % campo)
    if meta["origen"] not in ORIGEN_ETIQUETA:
        falla('"origen" debe ser uno de %s' % ", ".join(ORIGEN_ETIQUETA))
    if meta["cuentan"] not in CUENTAN_TEXTO:
        falla('"cuentan" debe ser uno de %s' % ", ".join(CUENTAN_TEXTO))
    if not (isinstance(meta["porcentaje"], (int, float)) and 1 <= meta["porcentaje"] <= 100):
        falla('"porcentaje" debe estar entre 1 y 100')
    for fu in meta.get("fuentes", []):
        if not str(fu.get("u", "")).startswith("https://"):
            falla("todas las fuentes necesitan una dirección que empiece por https://")
    if meta["origen"] in ("norma", "indicio") and not meta.get("fuentes"):
        falla('con origen "%s" hay que indicar al menos una fuente' % meta["origen"])
    horas = meta.get("horas")
    if horas is not None and not horas.get("fuente"):
        falla('"horas" necesita una "fuente" (de dónde salen las horas de los módulos)')
    for en in (horas or {}).get("enlaces", []):
        if not en.get("t") or not str(en.get("u", "")).startswith("https://"):
            falla('cada enlace de "horas" necesita un "t" (texto) y un "u" que empiece por https://')

    if "ESCRIBE AQUÍ" in json.dumps(meta, ensure_ascii=False):
        falla('completa los textos que dicen "ESCRIBE AQUÍ" en comunidad.json')
    ids = set()
    for c in ciclos:
        cid = c.get("id", "?")
        if cid in ids:
            falla("ciclo repetido: %s" % cid)
        ids.add(cid)
        for campo in ("id", "nombre", "grado", "familia", "modulos"):
            if campo not in c:
                falla('el ciclo %s no tiene "%s"' % (cid, campo))
        if c["grado"] not in ("medio", "superior"):
            falla('el ciclo %s: "grado" debe ser "medio" o "superior"' % cid)
        for curso in ("1", "2"):
            if curso not in c["modulos"]:
                falla("el ciclo %s no tiene la lista de módulos del curso %s (puede ir vacía: [])" % (cid, curso))
            nombres = set()
            for fila in c["modulos"][curso]:
                nombre, h = fila[0], fila[1]
                if not isinstance(h, int) or not (1 <= h <= 1200):
                    falla("el ciclo %s, módulo %r: las horas deben ser un número entero entre 1 y 1200" % (cid, nombre))
                if (nombre, curso) in nombres:
                    falla("el ciclo %s repite el módulo %r en el curso %s" % (cid, nombre, curso))
                nombres.add((nombre, curso))


def cargar(raiz):
    """Lista de comunidades (una por carpeta de comunidades/ que tenga comunidad.json), ordenada por nombre."""
    base = os.path.join(raiz, CARPETA)
    out = []
    if not os.path.isdir(base):
        return out
    for carpeta in sorted(os.listdir(base)):
        ruta = os.path.join(base, carpeta)
        if carpeta.startswith(("_", ".")) or not os.path.isfile(os.path.join(ruta, "comunidad.json")):
            continue
        meta = _leer(os.path.join(ruta, "comunidad.json"))
        ciclos_json = os.path.join(ruta, "ciclos.json")
        ciclos = _leer(ciclos_json) if os.path.isfile(ciclos_json) else []
        validar(meta, ciclos, carpeta)
        c = dict(meta)
        c["pct"] = meta["porcentaje"]
        c["pct_curso"] = meta.get("porcentajeCurso") or {}
        c["fuentes"] = [(f["t"], f["u"]) for f in meta.get("fuentes", [])]
        c["carpeta"] = carpeta
        c["ciclos"] = ciclos
        out.append(c)
    out.sort(key=lambda c: c["nombre"].lower())
    return out


def datos_js(c):
    """Contenido de comunidades/<id>/datos.js: lo que carga el navegador."""
    meta = {k: c[k] for k in ("id", "nombre", "porcentaje", "origen", "cuentan", "nota") if k in c}
    for k in ("alias", "norma", "matricula", "idioma", "porcentajeCurso", "horas", "fuentes"):
        if c.get(k):
            meta[k] = c[k]
    trim_defecto = c.get("trimestres") or {"1": 3, "2": 3}
    lista, modulos = [], {}
    for ci in c["ciclos"]:
        d = {k: ci[k] for k in ("id", "nombre", "grado", "familia", "familia2", "sigla", "alias") if k in ci}
        lista.append(d)
        modulos[ci["id"]] = {
            "trimestres": ci.get("trimestres") or trim_defecto,
            "modulos": {curso: [[f[0], f[1]] for f in ci["modulos"][curso]] for curso in ("1", "2")},
        }
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
    lineas = [
        "/* =========================================================",
        "   FP Cuenta · comunidades/%s/datos.js" % c["id"],
        "   GENERADO por gen/construir.py a partir de comunidad.json y ciclos.json de esta carpeta. No lo edites a mano.",
        "   ========================================================= */",
        "(function () {",
        "  var D = (window.FP_DATA = window.FP_DATA || {});",
        "  (D.comunidades = D.comunidades || []).push(" + dump(meta) + ");",
        "  (D.ciclos = D.ciclos || {})[" + dump(c["id"]) + "] = [",
    ]
    lineas += ["    " + dump(x) + "," for x in lista]
    lineas += ["  ];", "  (D.modulos = D.modulos || {})[" + dump(c["id"]) + "] = {"]
    lineas += ["    " + dump(k) + ": " + dump(v) + "," for k, v in modulos.items()]
    lineas += ["  };", "})();", ""]
    return "\n".join(lineas)


if __name__ == "__main__":
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for c in cargar(raiz):
        n_mod = sum(len(ci["modulos"]["1"]) + len(ci["modulos"]["2"]) for ci in c["ciclos"])
        print("%-12s %3d ciclos, %4d módulos, límite %s %%" % (c["id"], len(c["ciclos"]), n_mod, c["porcentaje"]))

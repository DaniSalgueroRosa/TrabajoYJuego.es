# -*- coding: utf-8 -*-
"""Datos del titular (config/titular.json) y de la publicidad (config/publicidad.json).

Ninguno de los dos archivos inventa nada: lo que falta aparece en las páginas como «[COMPLETAR POR EL TITULAR]»
resaltado, y el comprobador (python3 sitio.py comprobar) impide publicar en producción mientras quede alguno.

La publicidad solo se enciende cuando se cumplen TRES cosas a la vez: «activa» está en true, hay un identificador de
editor real (ca-pub-…) y el entorno es «produccion». Así una copia de pruebas nunca carga código de anuncios.
"""
from __future__ import annotations

import re
from html import escape
from pathlib import Path

from .nucleo import ErrorProyecto, leer_json, ruta_relativa

PENDIENTE = "[COMPLETAR POR EL TITULAR]"
MARCA_PENDIENTE = f'<mark class="pendiente">{PENDIENTE}</mark>'
OBLIGATORIOS = ("nombre", "nif", "domicilio", "email", "alojamiento")
OPCIONALES = ("telefono", "registro")
CAMPOS_TITULAR = set(OBLIGATORIOS) | set(OPCIONALES)
ETIQUETAS = {"nombre": "nombre o razón social", "nif": "NIF o identificación fiscal", "domicilio": "domicilio",
             "email": "correo electrónico", "alojamiento": "proveedor de alojamiento web"}
_CLIENTE = re.compile(r"^ca-pub-\d{16}$")
_BLOQUE = re.compile(r"^\d{6,15}$")
_EMAIL = re.compile(r"^[^@\s<>\"']+@[^@\s<>\"']+\.[^@\s<>\"']+$")
BLOQUES = ("listado", "juego")


def _comprobar_campos(datos: dict, permitidos: set, donde: str):
    import difflib
    for clave in datos:
        if clave.startswith("_"):      # «_ayuda» y similares: comentarios para quien edita el archivo
            continue
        if clave not in permitidos:
            parecidos = difflib.get_close_matches(clave, permitidos, n=1)
            ayuda = f" ¿Querías poner «{parecidos[0]}»?" if parecidos else ""
            raise ErrorProyecto(f"{donde}: el campo «{clave}» no existe.{ayuda} Campos válidos: {', '.join(sorted(permitidos))}.")


def leer_titular(raiz: Path) -> dict:
    """Devuelve los datos listos para las plantillas: valores ya escapados y con el marcador donde falten."""
    ruta = Path(raiz) / "config" / "titular.json"
    d = leer_json(ruta) if ruta.is_file() else {}
    donde = ruta_relativa(ruta, raiz)
    _comprobar_campos(d, CAMPOS_TITULAR, donde)
    valores = {}
    for clave in CAMPOS_TITULAR:
        v = d.get(clave, "")
        if not isinstance(v, str):
            raise ErrorProyecto(f"{donde}: «{clave}» debe ser un texto.")
        valores[clave] = v.strip()
    if valores["email"] and not _EMAIL.match(valores["email"]):
        raise ErrorProyecto(f"{donde}: «email» no parece un correo electrónico válido ({valores['email']}).")
    faltan = [ETIQUETAS[c] for c in OBLIGATORIOS if not valores[c]]
    salida = {c: (escape(valores[c]) if valores[c] else MARCA_PENDIENTE) for c in OBLIGATORIOS}
    if valores["email"]:
        salida["email"] = f'<a href="mailto:{escape(valores["email"], quote=True)}">{escape(valores["email"])}</a>'
    for c in OPCIONALES:
        salida[c] = escape(valores[c])
        salida["tiene_" + c] = bool(valores[c])
    salida["tiene_email"] = bool(valores["email"])
    salida["completo"] = not faltan
    salida["faltan"] = faltan
    return salida


def leer_publicidad(raiz: Path, cfg: dict) -> dict:
    ruta = Path(raiz) / "config" / "publicidad.json"
    d = leer_json(ruta) if ruta.is_file() else {}
    donde = ruta_relativa(ruta, raiz)
    _comprobar_campos(d, {"activa", "cliente", "bloques"}, donde)
    solicitada = d.get("activa", False)
    if not isinstance(solicitada, bool):
        raise ErrorProyecto(f"{donde}: «activa» debe ser true o false.")
    cliente = d.get("cliente", "")
    if not isinstance(cliente, str):
        raise ErrorProyecto(f"{donde}: «cliente» debe ser un texto.")
    cliente = cliente.strip()
    bloques = d.get("bloques", {})
    if not isinstance(bloques, dict):
        raise ErrorProyecto(f"{donde}: «bloques» debe ser un objeto con los números de bloque de anuncios.")
    _comprobar_campos(bloques, set(BLOQUES), donde + " → bloques")
    for nombre, valor in bloques.items():
        if nombre.startswith("_"):
            continue
        if not isinstance(valor, str) or (valor.strip() and not _BLOQUE.match(valor.strip())):
            raise ErrorProyecto(f"{donde} → bloques: «{nombre}» debe ser el número del bloque de anuncios tal como aparece en AdSense "
                                f"(solo cifras, entre 6 y 15), o estar vacío.")
    if cliente and not _CLIENTE.match(cliente):
        raise ErrorProyecto(f"{donde}: «cliente» debe tener la forma ca-pub-0000000000000000 (ca-pub- y 16 cifras); es el identificador de editor "
                            "que te da AdSense. Déjalo vacío hasta que tengas la cuenta aprobada.")
    if solicitada and not cliente:
        raise ErrorProyecto(f"{donde}: «activa» está en true pero falta «cliente» (tu identificador ca-pub-…). Sin él no hay anuncios que cargar: "
                            "pon «activa» en false hasta que AdSense apruebe tu cuenta.")
    produccion = cfg.get("entorno") == "produccion"
    activa = solicitada and bool(cliente) and produccion
    avisos = []
    if solicitada and not produccion:
        avisos.append("config/publicidad.json tiene «activa» en true, pero el entorno es «preproduccion»: no se carga ningún anuncio en esta copia.")
    if activa and not any(bloques.get(b, "").strip() for b in BLOQUES):
        avisos.append("La publicidad está activa pero ningún bloque tiene número: solo funcionarán los anuncios automáticos de AdSense, "
                      "que no controlan su posición (desactívalos en AdSense y rellena «bloques»).")
    return {
        "activa": activa, "cliente": cliente if activa else "", "editor": cliente.replace("ca-", "", 1) if activa else "",
        "bloque_listado": bloques.get("listado", "").strip() if activa else "",
        "bloque_juego": bloques.get("juego", "").strip() if activa else "",
        "avisos": avisos,
    }

"""Colocación del anuncio que va DENTRO del texto de una ficha (juego, herramienta, test o guía).

Los huecos del final de la ficha y de los listados viven en las plantillas (comun/anuncio/). El del texto no puede escribirse en una plantilla
porque el texto de cada ficha es suyo (su pagina.html), así que el motor lo coloca justo antes de un encabezado «h2» que cumpla tres cosas:

  1. Va después de bastante texto: así el anuncio queda lejos de los controles del juego, la herramienta o el test (que están antes del texto)
     y se ve cuando la persona ya está leyendo, no en la primera pantalla.
  2. Quedan después bastante texto más, para que no se junte con el anuncio del final de la página.
  3. El encabezado está en el nivel principal del texto, nunca dentro de una lista, una tabla o un desplegable.

Si ningún encabezado cumple, no se coloca este anuncio (queda el del final). Nunca se toca el texto en sí: solo se inserta el bloque.
"""
import re
from html import unescape

MIN_ANTES = 400        # caracteres de texto visible entre el comienzo del texto y el anuncio
MIN_DESPUES = 400      # caracteres de texto visible entre el anuncio y el final de la ficha

_INICIO_TEXTO = re.compile(r'<div\s+class="(?:juego-texto|herr-texto|tt-texto)"[^>]*>')
_H2 = re.compile(r"<h2[\s>]", re.I)
_ETIQUETA = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(/?)>")
_COMENTARIO = re.compile(r"<!--.*?-->", re.S)
_SIN_CIERRE = {"br", "hr", "img", "input", "meta", "link", "source", "wbr", "area", "col", "embed", "param", "track"}


_DESPLEGABLE = re.compile(r"<details\b[^>]*>(.*?)</details>", re.S | re.I)
_RESUMEN = re.compile(r"<summary\b[^>]*>.*?</summary>", re.S | re.I)


def _largo_texto(html: str) -> int:
    """Caracteres de texto que se ven de verdad: de un desplegable cerrado solo cuenta su resumen."""
    limpio = re.sub(r"<(script|style)\b.*?</\1>", " ", _COMENTARIO.sub(" ", html), flags=re.S | re.I)
    limpio = _DESPLEGABLE.sub(lambda m: " ".join(_RESUMEN.findall(m.group(1))), limpio)
    return len(" ".join(unescape(re.sub(r"<[^>]+>", " ", limpio)).split()))


def _profundidad(html: str) -> int:
    """Cuántas etiquetas siguen abiertas al final de este fragmento (0 = estamos en el nivel principal)."""
    n = 0
    for m in _ETIQUETA.finditer(_COMENTARIO.sub("", html)):
        cierra, nombre, solo = m.group(1), m.group(2).lower(), m.group(3)
        if nombre in _SIN_CIERRE or solo:
            continue
        n += -1 if cierra else 1
    return n


def posicion_en_texto(cuerpo: str):
    """Índice del cuerpo donde insertar el anuncio, o None si no hay un sitio adecuado."""
    m = _INICIO_TEXTO.search(cuerpo)
    inicio = m.end() if m else 0
    for h in _H2.finditer(cuerpo, inicio):
        p = h.start()
        if _largo_texto(cuerpo[inicio:p]) < MIN_ANTES:
            continue
        if _largo_texto(cuerpo[p:]) < MIN_DESPUES:
            break
        if _profundidad(cuerpo[inicio:p]) != 0:
            continue
        return p
    return None


def insertar(cuerpo: str, anuncio: str) -> str:
    p = posicion_en_texto(cuerpo)
    if p is None:
        return cuerpo
    return cuerpo[:p] + anuncio.strip() + "\n\n" + cuerpo[p:]

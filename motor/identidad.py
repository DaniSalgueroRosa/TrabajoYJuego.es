# -*- coding: utf-8 -*-
"""Genera la identidad visual: tipografías, logotipos, favicon e imagen para redes.

    python3 -I motor/identidad.py

Se ejecuta UNA vez (o si cambias colores o tipografías). Escribe en:
    comun/fuentes/*.woff      Heros (texto y mundo «Trabajo», recortada al alfabeto latino) y Cuadritos (letra de
                              píxeles propia para el mundo «Juego», dibujada aquí mismo, celda a celda)
    comun/img/*               logo.svg, logo-claro.svg, favicon.svg/.ico (el isotipo), apple-touch-icon.png, og.png

El sitio NO necesita este script para construirse: usa los archivos que deja escritos, ya incluidos en el proyecto.
Necesita las fuentes TeX Gyre Heros (vienen con TeX Live; otra carpeta con la variable TEXGYRE), fontTools, Pillow y
rsvg-convert.
"""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile
from pathlib import Path

from fontTools import subset
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

RAIZ = Path(__file__).resolve().parent.parent
CARPETA_FUENTES = Path(os.environ.get("TEXGYRE", "/usr/share/texmf/fonts/opentype/public/tex-gyre"))
SALIDA_FUENTES = RAIZ / "comun" / "fuentes"
SALIDA_IMG = RAIZ / "comun" / "img"

# Mismos valores que comun/tokens.css (si cambias uno, cambia el otro y vuelve a ejecutar esto)
PIZARRA = "#1D3A34"
PAPEL_TRABAJO = "#E4EDE8"
SANDIA = "#FF5A7D"
SANDIA_TEXTO = "#C21E4A"
LIMON = "#E6F14A"
TINTA = "#14201C"
TIZA = "#EAF2EE"

HEROS = {
    "heros-400.woff": "texgyreheros-regular.otf",
    "heros-400-cursiva.woff": "texgyreheros-italic.otf",
    "heros-700.woff": "texgyreheros-bold.otf",
}
UNICODES = (list(range(0x20, 0x7F)) + list(range(0xA0, 0x100))
            + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x20AC, 0x2022])


def escribir(ruta: Path, texto: str):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(texto, encoding="utf-8")


# =============================================================== CUADRITOS (letra de píxeles)
# Cada letra es una cuadrícula de 5 columnas × 7 filas; «#» es un píxel encendido. Solo hay mayúsculas: las
# minúsculas del texto se dibujan con la misma forma (como en las máquinas recreativas). Los acentos se añaden
# encima por código, así que cualquier vocal acentuada, Ñ y Ü salen sin dibujarlas una a una.
CELDA = 100          # unidades por píxel (la tipografía mide 1000 unidades de alto, así que 1 em = 10 píxeles)
AVANCE = 600         # 5 píxeles de letra + 1 de separación
AVANCE_ESPACIO = 400

G = {
    "A": ".###.|#...#|#...#|#####|#...#|#...#|#...#",
    "B": "####.|#...#|#...#|####.|#...#|#...#|####.",
    "C": ".###.|#...#|#....|#....|#....|#...#|.###.",
    "D": "####.|#...#|#...#|#...#|#...#|#...#|####.",
    "E": "#####|#....|#....|####.|#....|#....|#####",
    "F": "#####|#....|#....|####.|#....|#....|#....",
    "G": ".###.|#...#|#....|#.###|#...#|#...#|.###.",
    "H": "#...#|#...#|#...#|#####|#...#|#...#|#...#",
    "I": ".###.|..#..|..#..|..#..|..#..|..#..|.###.",
    "J": "..###|...#.|...#.|...#.|...#.|#..#.|.##..",
    "K": "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",
    "L": "#....|#....|#....|#....|#....|#....|#####",
    "M": "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#",
    "N": "#...#|##..#|#.#.#|#.#.#|#..##|#...#|#...#",
    "O": ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
    "P": "####.|#...#|#...#|####.|#....|#....|#....",
    "Q": ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#",
    "R": "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
    "S": ".####|#....|#....|.###.|....#|....#|####.",
    "T": "#####|..#..|..#..|..#..|..#..|..#..|..#..",
    "U": "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
    "V": "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
    "W": "#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#",
    "X": "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
    "Y": "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",
    "Z": "#####|....#|...#.|..#..|.#...|#....|#####",
    "0": ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",
    "1": "..#..|.##..|..#..|..#..|..#..|..#..|.###.",
    "2": ".###.|#...#|....#|...#.|..#..|.#...|#####",
    "3": ".###.|#...#|....#|..##.|....#|#...#|.###.",
    "4": "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.",
    "5": "#####|#....|####.|....#|....#|#...#|.###.",
    "6": "..##.|.#...|#....|####.|#...#|#...#|.###.",
    "7": "#####|....#|...#.|..#..|.#...|.#...|.#...",
    "8": ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
    "9": ".###.|#...#|#...#|.####|....#|...#.|.##..",
    ".": ".....|.....|.....|.....|.....|.....|..#..",
    ",": ".....|.....|.....|.....|.....|..#..|.#...",
    ":": ".....|.....|..#..|.....|.....|..#..|.....",
    ";": ".....|.....|..#..|.....|.....|..#..|.#...",
    "!": "..#..|..#..|..#..|..#..|..#..|.....|..#..",
    "?": ".###.|#...#|....#|...#.|..#..|.....|..#..",
    "¿": "..#..|.....|..#..|.#...|#....|#...#|.###.",
    "¡": "..#..|.....|..#..|..#..|..#..|..#..|..#..",
    "-": ".....|.....|.....|.###.|.....|.....|.....",
    "—": ".....|.....|.....|#####|.....|.....|.....",
    "+": ".....|..#..|..#..|#####|..#..|..#..|.....",
    "=": ".....|.....|#####|.....|#####|.....|.....",
    "/": "....#|....#|...#.|..#..|.#...|#....|#....",
    "(": "...#.|..#..|.#...|.#...|.#...|..#..|...#.",
    ")": ".#...|..#..|...#.|...#.|...#.|..#..|.#...",
    "'": "..#..|..#..|.....|.....|.....|.....|.....",
    '"': ".#.#.|.#.#.|.....|.....|.....|.....|.....",
    "&": ".##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#",
    "%": "##..#|##..#|...#.|..#..|.#...|#..##|#..##",
    "*": ".....|..#..|#.#.#|.###.|#.#.#|..#..|.....",
    "€": "..###|.#...|####.|.#...|####.|.#...|..###",
    "•": ".....|.....|.###.|.###.|.###.|.....|.....",
    "…": ".....|.....|.....|.....|.....|.....|#.#.#",
    "·": ".....|.....|.....|..#..|.....|.....|.....",
    "«": ".....|...#.|..#..|.#...|..#..|...#.|.....",
    "»": ".....|.#...|..#..|...#.|..#..|.#...|.....",
    "█": "#####|#####|#####|#####|#####|#####|#####",
    "▶": "#....|##...|###..|####.|###..|##...|#....",
    "♥": ".....|.#.#.|#####|#####|.###.|..#..|.....",
    " ": ".....|.....|.....|.....|.....|.....|.....",
}
# (carácter, base, acento): el acento ocupa las dos filas por encima de las mayúsculas
ACENTOS = {
    "agudo": ("...#.", "..#.."),
    "grave": (".#...", "..#.."),
    "circunflejo": ("..#..", ".#.#."),
    "diéresis": (None, ".#.#."),
    "tilde": (".##.#", "#..#."),
}
COMPUESTOS = {}
for _vocal, _marcas in {"A": "ÁÀÂÄ", "E": "ÉÈÊË", "I": "ÍÌÎÏ", "O": "ÓÒÔÖ", "U": "ÚÙÛÜ"}.items():
    for _c, _acento in zip(_marcas, ("agudo", "grave", "circunflejo", "diéresis")):
        COMPUESTOS[_c] = (_vocal, _acento)
COMPUESTOS["Ñ"] = ("N", "tilde")
# Formas alternativas: dibujan lo mismo que otro carácter
ALIAS = {"“": '"', "”": '"', "‘": "'", "’": "'", "–": "-", " ": " ", "×": "X"}


def filas(clave_o_dibujo: str):
    filas_ = clave_o_dibujo.split("|")
    assert len(filas_) == 7 and all(len(f) == 5 for f in filas_), clave_o_dibujo
    return filas_


def pixeles(dibujo: str, acento: str | None = None) -> set:
    """Conjunto de píxeles (columna, altura) encendidos. La altura 0 es la línea base."""
    encendidos = set()
    for i, fila in enumerate(filas(dibujo)):
        for c, ch in enumerate(fila):
            if ch == "#":
                encendidos.add((c, 6 - i))
    if acento:
        arriba, abajo = ACENTOS[acento]
        for altura, fila in ((9, arriba), (8, abajo)):
            for c, ch in enumerate(fila or ""):
                if ch == "#":
                    encendidos.add((c, altura))
    return encendidos


def glifo_de_pixeles(encendidos: set):
    """Un cuadrado por píxel; los vecinos se solapan 1 unidad para que no queden costuras al pintar."""
    pluma = TTGlyphPen(None)
    for (c, h) in sorted(encendidos):
        x0, y0 = c * CELDA, h * CELDA
        x1 = x0 + CELDA + (1 if (c + 1, h) in encendidos else 0)
        y1 = y0 + CELDA + (1 if (c, h + 1) in encendidos else 0)
        pluma.moveTo((x0, y0)); pluma.lineTo((x0, y1)); pluma.lineTo((x1, y1)); pluma.lineTo((x1, y0)); pluma.closePath()
    return pluma.glyph()


def fuente_cuadritos() -> TTFont:
    formas: dict[str, set] = {}           # carácter → píxeles
    for ch, dibujo in G.items():
        formas[ch] = pixeles(dibujo)
    for ch, (base, acento) in COMPUESTOS.items():
        formas[ch] = pixeles(G[base], acento)
    cmap, glifos, metricas, orden = {}, {".notdef": glifo_de_pixeles(pixeles(G["█"]) - {(2, 3)})}, {".notdef": (AVANCE, 0)}, [".notdef"]

    def anadir(ch: str, encendidos: set):
        nombre = f"uni{ord(ch):04X}"
        orden.append(nombre)
        glifos[nombre] = glifo_de_pixeles(encendidos)
        metricas[nombre] = (AVANCE_ESPACIO if ch == " " else AVANCE, min((c for c, _ in encendidos), default=0) * CELDA)
        cmap[ord(ch)] = nombre

    for ch, encendidos in formas.items():
        anadir(ch, encendidos)
        if ch.isalpha() and ch.upper() == ch:        # la minúscula usa la misma forma
            minuscula = ch.lower()
            if minuscula != ch:
                anadir(minuscula, encendidos)
    for alias, destino in ALIAS.items():
        anadir(alias, formas[destino])

    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(orden)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glifos)
    fb.setupHorizontalMetrics(metricas)
    fb.setupHorizontalHeader(ascent=1000, descent=-100)
    fb.setupNameTable({"familyName": "Cuadritos", "styleName": "Regular",
                       "uniqueFontIdentifier": "Cuadritos-Regular", "fullName": "Cuadritos Regular",
                       "psName": "Cuadritos-Regular", "version": "Version 1.0",
                       "copyright": "Creada para TrabajoYJuego. Sin restricciones de uso en este proyecto."})
    fb.setupOS2(sTypoAscender=1000, sTypoDescender=-100, sTypoLineGap=0, usWinAscent=1000, usWinDescent=100,
                sxHeight=700, sCapHeight=700, achVendID="TYJ ")
    fb.setupPost()
    return fb.font


# =============================================================== tipografías
def tipografias():
    SALIDA_FUENTES.mkdir(parents=True, exist_ok=True)
    for destino, origen in HEROS.items():
        ruta = CARPETA_FUENTES / origen
        if not ruta.is_file():
            sys.exit(f"No encuentro {ruta}. Instala TeX Gyre o indica su carpeta con la variable TEXGYRE.")
        opciones = subset.Options()
        opciones.layout_features = ["kern", "liga"]
        opciones.hinting = False
        opciones.notdef_outline = True
        opciones.name_IDs = ["*"]
        opciones.flavor = "woff"
        fuente = subset.load_font(str(ruta), opciones)
        sub = subset.Subsetter(opciones)
        sub.populate(unicodes=UNICODES)
        sub.subset(fuente)
        subset.save_font(fuente, str(SALIDA_FUENTES / destino), opciones)
        print(f"  {destino}  {(SALIDA_FUENTES / destino).stat().st_size / 1024:.1f} KB")
    pixel = fuente_cuadritos()
    pixel.flavor = "woff"
    pixel.save(str(SALIDA_FUENTES / "cuadritos-400.woff"))
    print(f"  cuadritos-400.woff  {(SALIDA_FUENTES / 'cuadritos-400.woff').stat().st_size / 1024:.1f} KB")
    escribir(SALIDA_FUENTES / "LICENCIA.txt",
             "HEROS: los archivos heros-*.woff son versiones modificadas (recortadas al alfabeto latino y con los archivos\n"
             "renombrados) de TeX Gyre Heros, © 2006-2016 TeX Gyre team (GUST e-foundry), distribuida bajo la\n"
             "GUST Font License, versión 1.0:\n"
             "https://www.gust.org.pl/projects/e-foundry/licenses/GUST-FONT-LICENSE.txt\n"
             "Se ha cambiado el nombre de los archivos, como exige la licencia para las versiones modificadas.\n\n"
             "CUADRITOS: tipografía de píxeles creada para TrabajoYJuego (la genera motor/identidad.py, letra a letra).\n"
             "No procede de ninguna otra fuente y no tiene restricciones de uso en este proyecto.\n")


# =============================================================== texto → trazos
class Letras:
    def __init__(self, fuente: TTFont):
        self.fuente = fuente
        self.glifos = fuente.getGlyphSet()
        self.cmap = fuente.getBestCmap()
        self.upm = fuente["head"].unitsPerEm

    @classmethod
    def de_archivo(cls, nombre: str):
        return cls(TTFont(str(CARPETA_FUENTES / nombre)))

    def anchura(self, texto: str, tam: float, espaciado: float = 0.0) -> float:
        total = 0.0
        for c in texto:
            total += self.glifos[self.cmap[ord(c)]].width + espaciado * self.upm
        return total * tam / self.upm

    def trazo(self, texto: str, tam: float, x: float, y_base: float, espaciado: float = 0.0) -> str:
        escala, cursor, partes = tam / self.upm, 0.0, []
        for c in texto:
            nombre = self.cmap[ord(c)]
            pluma = SVGPathPen(self.glifos)
            self.glifos[nombre].draw(TransformPen(pluma, (escala, 0, 0, -escala, x + cursor * escala, y_base)))
            d = pluma.getCommands()
            if d:
                partes.append(d)
            cursor += self.glifos[nombre].width + espaciado * self.upm
        return " ".join(partes)


def etiquetas_svg(ancho, alto, cuerpo, titulo):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {ancho:.0f} {alto:.0f}" width="{ancho:.0f}" height="{alto:.0f}" '
            f'role="img" aria-label="{titulo}">\n  <title>{titulo}</title>\n{cuerpo}</svg>\n')


def insignia(cx, cy, r, letras_y: Letras, tam_y, relleno=LIMON, trazo=TINTA, grosor=2.5):
    """Círculo limón con la «y» de unión."""
    ancho_y = letras_y.anchura("y", tam_y)
    y = letras_y.trazo("y", tam_y, cx - ancho_y / 2, cy + tam_y * 0.26)
    return (f'  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{relleno}" stroke="{trazo}" stroke-width="{grosor}"/>\n'
            f'  <path d="{y}" fill="{trazo}"/>\n')


# =============================================================== logotipos
def logos(heros: Letras, pixel: Letras):
    tam, base, alto = 40, 38, 52
    ancho_t = heros.anchura("Trabajo", tam, -0.02)
    r, hueco = 17, 9
    cx = ancho_t + hueco + r
    x_juego = cx + r + hueco
    ancho_j = pixel.anchura("JUEGO", tam) - 0.1 * tam          # sin la separación final
    ancho = x_juego + ancho_j

    def logo(color_trabajo, color_juego):
        return etiquetas_svg(
            ancho + 4, alto,
            '  <g transform="translate(2 0)">\n'
            f'  <path d="{heros.trazo("Trabajo", tam, 0, base, -0.02)}" fill="{color_trabajo}"/>\n'
            + insignia(cx, 24.5, r, heros, 27)
            + f'  <path d="{pixel.trazo("JUEGO", tam, x_juego, base)}" fill="{color_juego}"/>\n  </g>\n',
            "TrabajoYJuego")

    escribir(SALIDA_IMG / "logo.svg", logo(PIZARRA, SANDIA_TEXTO))
    escribir(SALIDA_IMG / "logo-claro.svg", logo(TIZA, SANDIA))

    # Isotipo: papel de un lado, pantalla del otro, y la «y» en el centro
    iso = (f'  <rect width="64" height="64" rx="12" fill="{PAPEL_TRABAJO}"/>\n'
           f'  <path d="M32 0h20a12 12 0 0 1 12 12v40a12 12 0 0 1-12 12H32z" fill="{TINTA}"/>\n'
           f'  <rect x="1.5" y="1.5" width="61" height="61" rx="10.5" fill="none" stroke="{PIZARRA}" stroke-width="3"/>\n'
           + insignia(32, 32, 17, heros, 30))
    escribir(SALIDA_IMG / "favicon.svg", etiquetas_svg(64, 64, iso, "TrabajoYJuego"))
    print("  logo.svg, logo-claro.svg, favicon.svg")


# =============================================================== imágenes de mapa de bits
def a_png(svg: Path, destino: Path, ancho: int, alto: int | None = None):
    orden = ["rsvg-convert", "-w", str(ancho)] + (["-h", str(alto)] if alto else []) + ["-o", str(destino), str(svg)]
    subprocess.run(orden, check=True)


def imagen_redes(heros: Letras, pixel: Letras):
    ancho, alto = 1200, 630
    centro, margen_exterior, hueco_central = 600, 56, 104
    disponible = centro - margen_exterior - hueco_central
    tam = 100 * disponible / heros.anchura("Trabajo", 100, -0.03)
    # Letra de píxeles: la mayor con celda de número entero de píxeles que cabe en su mitad
    celda = int((disponible / (pixel.anchura("JUEGO", 100) - 10)) * 10)
    tam_px = celda * 10
    base = 315 + tam * 0.36
    ancho_t = heros.anchura("Trabajo", tam, -0.03)
    cuerpo = (f'  <rect width="{ancho}" height="{alto}" fill="{PAPEL_TRABAJO}"/>\n'
              f'  <rect x="{centro}" width="{centro}" height="{alto}" fill="{TINTA}"/>\n'
              f'  <path d="{heros.trazo("Trabajo", tam, centro - hueco_central - ancho_t, base, -0.03)}" fill="{PIZARRA}"/>\n'
              f'  <path d="{pixel.trazo("JUEGO", tam_px, centro + hueco_central, 315 + 3.5 * celda)}" fill="{SANDIA}"/>\n'
              + insignia(centro, 315, 76, heros, 118, LIMON, TINTA, 8))
    svg = etiquetas_svg(ancho, alto, cuerpo, "TrabajoYJuego")
    with tempfile.TemporaryDirectory() as tmp:
        origen = Path(tmp) / "og.svg"
        origen.write_text(svg, encoding="utf-8")
        a_png(origen, SALIDA_IMG / "og.png", ancho, alto)
    print(f"  og.png (1200×630)")


def iconos_png():
    from PIL import Image
    with tempfile.TemporaryDirectory() as tmp:
        grande = Path(tmp) / "isotipo-256.png"
        a_png(SALIDA_IMG / "favicon.svg", grande, 256, 256)
        Image.open(grande).convert("RGBA").save(SALIDA_IMG / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
        # Icono de iPhone/iPad: cuadrado a sangre (el sistema redondea las esquinas)
        cuadrado = Path(tmp) / "cuadrado.svg"
        texto = (SALIDA_IMG / "favicon.svg").read_text(encoding="utf-8")
        texto = texto.replace('rx="12"', 'rx="0"').replace("a12 12 0 0 1 12 12v40a12 12 0 0 1-12 12", "h12v64")
        texto = texto.replace('rx="10.5"', 'rx="0"')
        cuadrado.write_text(texto, encoding="utf-8")
        a_png(cuadrado, SALIDA_IMG / "apple-touch-icon.png", 180, 180)
    print("  favicon.ico, apple-touch-icon.png")


if __name__ == "__main__":
    print("Tipografías:")
    tipografias()
    heros_bold = Letras.de_archivo("texgyreheros-bold.otf")
    pixel_ = Letras(TTFont(str(SALIDA_FUENTES / "cuadritos-400.woff")))
    print("Logotipos:")
    logos(heros_bold, pixel_)
    print("Imágenes:")
    imagen_redes(heros_bold, pixel_)
    iconos_png()
    print("Hecho.")

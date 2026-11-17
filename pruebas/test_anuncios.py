# -*- coding: utf-8 -*-
"""Pruebas de la COLOCACIÓN de los anuncios (motor/anuncios.py y las plantillas), sobre el sitio real con publicidad simulada.

Lo que vigilan:
  · el anuncio del texto se inserta solo entre dos apartados, tras bastante texto visible y con bastante texto después;
    nunca dentro de un párrafo, una lista, una tabla o un desplegable;
  · en TODAS las fichas del sitio: exactamente un banner de cabecera (por encima de todo el contenido, antes del título), como mucho un anuncio
    en el texto y exactamente uno al final; el del texto cuelga directamente del bloque de texto
    (o del cuerpo de la guía) y le sigue un encabezado; ninguno queda dentro del juego, la herramienta o el test, ni dentro de un botón, formulario,
    lista, tabla o desplegable;
  · la inmensa mayoría de las fichas lleva el del texto (las que tienen muy poco texto se quedan solo con el del final);
  · los cuatro listados llevan el banner de cabecera antes del título, uno entre las tarjetas y otro al final;
  · la portada lleva un solo anuncio, justo debajo del bloque «Trabajo | Juego» y antes de «Lo último»; lo legal y la 404, ninguno;
  · sin publicidad activa no queda ni un rastro en todo el sitio.

El identificador que se usa aquí es de pruebas (en una copia temporal, nunca en el proyecto). Ejecutar: python3 pruebas/test_anuncios.py
"""
import json
import shutil
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from motor import anuncios  # noqa: E402
from motor.paginas import Constructor  # noqa: E402
from pruebas.ejemplos import copiar_proyecto  # noqa: E402

SECCIONES = ("juegos", "herramientas", "tests", "recursos")
CONTENEDORES_TEXTO = {"juego-texto", "herr-texto", "tt-texto", "ficha-cuerpo"}
PROHIBIDOS = {"ul", "ol", "table", "details", "button", "form", "p", "li", "summary", "label", "select", "textarea", "canvas", "svg"}
PARRAFO = "<p>" + "Una frase de texto normal para llenar el apartado con contenido que se pueda leer. " * 6 + "</p>\n"


def apartados(n, relleno=PARRAFO):
    return "".join(f"<h2>Apartado {i}</h2>\n{relleno}" for i in range(1, n + 1))


class Colocacion(unittest.TestCase):
    """La regla pura, sobre trozos de HTML."""

    def donde(self, cuerpo):
        p = anuncios.posicion_en_texto(cuerpo)
        return None if p is None else cuerpo[p:p + 30]

    def test_se_pone_antes_del_primer_apartado_que_deja_texto_antes_y_despues(self):
        cuerpo = f'<div class="juego"></div><div class="juego-texto">{apartados(5)}</div>'
        self.assertEqual(self.donde(cuerpo), "<h2>Apartado 2</h2>\n<p>Una fra")

    def test_no_se_pone_junto_al_juego_aunque_haya_encabezado_al_principio(self):
        cuerpo = f'<div class="juego-texto">{apartados(5)}</div>'
        self.assertNotIn("Apartado 1", self.donde(cuerpo))

    def test_con_poco_texto_no_se_pone(self):
        self.assertIsNone(self.donde('<div class="juego-texto"><h2>Uno</h2><p>Corto.</p><h2>Dos</h2><p>Corto.</p></div>'))

    def test_si_no_queda_texto_despues_no_se_pone(self):
        cuerpo = f'<div class="juego-texto">{apartados(1)}<h2>Preguntas</h2><details><summary>¿A?</summary><p>B.</p></details></div>'
        self.assertIsNone(self.donde(cuerpo))

    def test_el_texto_de_un_desplegable_cerrado_no_cuenta(self):
        largo = "x" * 3000
        cuerpo = f'<div class="juego-texto">{apartados(1)}<h2>Preguntas</h2><details><summary>¿A?</summary><p>{largo}</p></details></div>'
        self.assertIsNone(self.donde(cuerpo))

    def test_no_se_pone_dentro_de_un_desplegable_ni_de_una_lista(self):
        dentro = f'<div class="juego-texto">{apartados(1)}<details><summary>A</summary><h2>Dentro</h2>{PARRAFO}{PARRAFO}</details></div>'
        self.assertIsNone(self.donde(dentro))

    def test_en_una_guia_sin_bloque_de_texto_cuenta_desde_el_principio(self):
        cuerpo = PARRAFO + apartados(3)
        self.assertEqual(self.donde(cuerpo), "<h2>Apartado 1</h2>\n<p>Una fra")

    def test_insertar_no_cambia_el_texto_original(self):
        cuerpo = f'<div class="juego-texto">{apartados(5)}</div>'
        salida = anuncios.insertar(cuerpo, "<aside>AD</aside>")
        self.assertEqual(salida.replace("<aside>AD</aside>\n\n", ""), cuerpo)
        self.assertEqual(salida.count("<aside>AD</aside>"), 1)


class Arbol(HTMLParser):
    """Recoge, para cada anuncio, quién es su padre, qué ancestros tiene y qué etiqueta le sigue."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.pila, self.anuncios, self._ultimo = [], [], None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        clases = (a.get("class") or "").split()
        if self._ultimo is not None and "siguiente" not in self._ultimo and self._ultimo["nivel"] == len(self.pila):
            self._ultimo["siguiente"] = tag
        if tag == "aside" and "anuncio" in clases:
            self._ultimo = {"posicion": a.get("data-posicion"), "padre": self.pila[-1] if self.pila else None,
                            "ancestros": [x[0] for x in self.pila], "clases_ancestros": [c for x in self.pila for c in x[1]],
                            "nivel": len(self.pila)}
            self.anuncios.append(self._ultimo)
        if tag not in ("br", "img", "hr", "input", "meta", "link", "source", "wbr"):
            self.pila.append((tag, clases))

    def handle_endtag(self, tag):
        for i in range(len(self.pila) - 1, -1, -1):
            if self.pila[i][0] == tag:
                del self.pila[i:]
                break


class SitioReal(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._tmp = Path(tempfile.mkdtemp(prefix="tyj-anuncios-"))
        raiz = copiar_proyecto(cls._tmp / "p", conservar=SECCIONES + ("legal",))
        cls.raiz = raiz

        def cfg(archivo, **c):
            ruta = raiz / "config" / archivo
            d = json.loads(ruta.read_text(encoding="utf-8"))
            d.update(c)
            ruta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
        cfg("sitio.json", entorno="produccion")
        cfg("publicidad.json", activa=True, cliente="ca-pub-1234567890123456", bloques={"general": "1234567890"})
        cls.dist = raiz / "dist"
        Constructor(raiz, cls.dist).construir()
        cls.fichas = {s: sorted((cls.dist / s).glob("*/index.html")) for s in SECCIONES}

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls._tmp, ignore_errors=True)

    def arbol(self, ruta):
        a = Arbol()
        a.feed(Path(ruta).read_text(encoding="utf-8"))
        return a

    def test_hay_fichas_de_las_cuatro_secciones(self):
        for s, lista in self.fichas.items():
            self.assertGreater(len(lista), 10, s)

    def test_cada_ficha_lleva_cabecera_uno_al_final_y_como_mucho_uno_en_el_texto(self):
        sin_texto = []
        for s, lista in self.fichas.items():
            for f in lista:
                pos = [x["posicion"] for x in self.arbol(f).anuncios]
                self.assertEqual(pos.count("cabecera"), 1, f"{f}: {pos}")
                self.assertEqual(pos.count("final"), 1, f"{f}: {pos}")
                self.assertLessEqual(pos.count("texto"), 1, f"{f}: {pos}")
                self.assertEqual(len(pos), pos.count("cabecera") + pos.count("final") + pos.count("texto"), f"{f}: {pos}")
                if "texto" not in pos:
                    sin_texto.append(f.parent.name)
        total = sum(len(l) for l in self.fichas.values())
        self.assertLessEqual(len(sin_texto), total * 0.03, f"demasiadas fichas sin anuncio en el texto ({len(sin_texto)}/{total}): {sin_texto}")

    def test_el_del_texto_cuelga_del_bloque_de_texto_y_le_sigue_un_encabezado(self):
        for s, lista in self.fichas.items():
            for f in lista:
                for x in self.arbol(f).anuncios:
                    if x["posicion"] != "texto":
                        continue
                    self.assertTrue(CONTENEDORES_TEXTO & set(x["padre"][1]), f"{f}: padre {x['padre']}")
                    self.assertEqual(x["siguiente"], "h2", f"{f}: le sigue {x['siguiente']}")

    def test_ningun_anuncio_esta_dentro_de_un_control_un_texto_o_el_area_de_juego(self):
        for s, lista in self.fichas.items():
            for f in lista:
                for x in self.arbol(f).anuncios:
                    self.assertFalse(PROHIBIDOS & set(x["ancestros"]), f"{f}: ancestros {x['ancestros']}")
                    for c in ("juego", "pantalla", "tt-app", "panel", "tt-cab", "ficha-cabecera", "herr-privacidad"):
                        self.assertNotIn(c, x["clases_ancestros"], f"{f}: dentro de «{c}»")

    def test_el_banner_de_cabecera_va_el_primero_de_la_pagina_y_antes_de_cualquier_titulo(self):
        """Es lo primero que se ve al entrar y queda por encima del título, es decir, lejos del juego, la herramienta o el test."""
        paginas = [f for lista in self.fichas.values() for f in lista] + [self.dist / s / "index.html" for s in SECCIONES]
        for f in paginas:
            html = f.read_text(encoding="utf-8")
            self.assertEqual(html.count('data-posicion="cabecera"'), 1, f)
            antes = html[html.index("<main"):html.index('data-posicion="cabecera"')]
            self.assertNotIn("<h1", antes, f)
            self.assertNotIn("<ul", antes, f)
            self.assertNotIn("<button", antes, f)
            self.assertNotIn("<form", antes, f)
            # es un banner fino: formato horizontal y sin ancho adaptable a toda la pantalla
            tag = html[html.index('data-posicion="cabecera"'):]
            tag = tag[tag.index("<ins"):tag.index("</ins>")]
            self.assertIn('data-ad-format="horizontal"', tag, f)
            self.assertIn('data-full-width-responsive="false"', tag, f)

    def test_la_portada_lleva_un_solo_banner_entre_el_bloque_principal_y_lo_ultimo(self):
        html = (self.dist / "index.html").read_text(encoding="utf-8")
        self.assertEqual(html.count('<aside class="anuncio'), 1)
        self.assertEqual(html.count('data-posicion="portada"'), 1)
        self.assertGreater(html.index('data-posicion="portada"'), html.rindex('class="hero-mitad', 0, html.index('data-posicion="portada"')))
        self.assertGreater(html.index('id="novedades-titulo"'), html.index('data-posicion="portada"'))
        self.assertGreater(html.index('data-posicion="portada"'), html.index('id="hero-titulo"'))
        entre = html[html.rindex("</section>", 0, html.index('data-posicion="portada"')):html.index('data-posicion="portada"')]
        self.assertNotIn("<a ", entre)

    def test_los_cuatro_listados_llevan_uno_entre_las_tarjetas_y_otro_al_final(self):
        for s in SECCIONES:
            html = (self.dist / s / "index.html").read_text(encoding="utf-8")
            self.assertEqual(html.count('data-posicion="listado"'), 2, s)
            primero = html.index('data-posicion="listado"')
            self.assertIn("<li data-categoria", html[:primero], s)
            self.assertIn("<li data-categoria", html[primero:], s)
            self.assertGreater(html.rindex('data-posicion="listado"'), html.rindex("<li data-categoria"), s)

    def test_ni_lo_legal_ni_la_404_llevan_anuncios(self):
        rutas = ["404.html"] + [str(p.relative_to(self.dist)) for p in (self.dist / "legal").rglob("index.html")]
        for r in rutas:
            self.assertNotIn('class="anuncio', (self.dist / r).read_text(encoding="utf-8"), r)

    def test_el_texto_de_la_ficha_no_se_ha_tocado(self):
        """Quitando el anuncio, la página sale idéntica a la construida sin publicidad."""
        sin = self._tmp / "sin"
        raiz = copiar_proyecto(sin / "p", conservar=SECCIONES + ("legal",))
        p = raiz / "config" / "sitio.json"
        d = json.loads(p.read_text(encoding="utf-8"))
        d["entorno"] = "produccion"
        p.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
        Constructor(raiz, raiz / "dist").construir()
        import re
        for s in SECCIONES:
            for f in self.fichas[s][:6]:
                con = f.read_text(encoding="utf-8")
                libre = (raiz / "dist" / f.relative_to(self.dist)).read_text(encoding="utf-8")
                con = re.sub(r"\s*<div class=\"contenedor anuncio-marco\">.*?</aside>\s*</div>", "", con, flags=re.S)
                con = re.sub(r"\s*<aside class=\"anuncio.*?</aside>", "", con, flags=re.S)
                con = re.sub(r"\s*<script async src=\"https://pagead2[^>]*></script>", "", con)
                con = re.sub(r"\s*<meta name=\"google-adsense-account\"[^>]*>", "", con)
                norm = lambda h: re.sub(r"\s+", " ", re.sub(r"<link rel=\"stylesheet\"[^>]*>|<script src=[^>]*></script>", "", h))
                self.assertEqual(norm(con), norm(libre), str(f))


if __name__ == "__main__":
    unittest.main(verbosity=1)

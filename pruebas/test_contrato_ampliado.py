# -*- coding: utf-8 -*-
"""Pruebas de lo que la ampliación añadió al contrato de carpetas (ver docs/CARPETAS.md):

  · categorías y dificultad de cada elemento, con errores que dicen qué valores valen;
  · ordenar por «orden», buscador y filtros del listado;
  · la carpeta «datos/» de una sección, que se publica tal cual;
  · los .js y .css sueltos de una sección, que se agrupan en un solo archivo y se cargan antes del app.js de cada elemento;
  · secciones con «dinamico» (plantillas con {{…}}) y con «ubicacion: pie» (solo enlaces del pie);
  · datos estructurados (JSON-LD) de un juego.

Cada prueba trabaja en una copia temporal del proyecto sin los elementos reales.
Ejecutar: python3 pruebas/test_contrato_ampliado.py
"""
import json
import re
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from motor.comprobar import comprobar  # noqa: E402
from motor.nucleo import ErrorProyecto  # noqa: E402
from motor.paginas import Constructor  # noqa: E402
from pruebas.ejemplos import copiar_proyecto, escribir, ficha  # noqa: E402

DESCRIPCION = "Una descripción lo bastante larga para pasar la comprobación de longitud mínima."


class Base(unittest.TestCase):
    def setUp(self):
        self._tmp = Path(tempfile.mkdtemp(prefix="tyj-contrato-"))
        self.raiz = copiar_proyecto(self._tmp / "proyecto")
        self.dist = self.raiz / "dist"

    def tearDown(self):
        shutil.rmtree(self._tmp, ignore_errors=True)

    def construir(self):
        return Constructor(self.raiz, self.dist).construir()

    def leer(self, ruta):
        return (self.dist / ruta).read_text(encoding="utf-8")

    def juego(self, slug, pagina="<div class=\"juego\"><p>Hola.</p></div>\n", **campos):
        datos = {"titulo": slug.replace("-", " ").title(), "fecha": "2026-11-01", "descripcion": DESCRIPCION,
                 "categoria": "logica", "dificultad": "media", "duracion": "2 min"}
        datos.update(campos)
        ficha(self.raiz, "juegos", slug, datos)
        if pagina is not None:
            escribir(self.raiz / "juegos" / slug / "pagina.html", pagina)

    def modificar_seccion(self, seccion, **cambios):
        ruta = self.raiz / seccion / "seccion.json"
        d = json.loads(ruta.read_text(encoding="utf-8"))
        d.update(cambios)
        ruta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")


class CategoriasYDificultad(Base):
    def test_la_categoria_es_obligatoria_y_el_error_lista_las_validas(self):
        ficha(self.raiz, "juegos", "sin-categoria", {"titulo": "Sin categoría", "fecha": "2026-11-01", "descripcion": DESCRIPCION})
        with self.assertRaises(ErrorProyecto) as e:
            self.construir()
        mensaje = str(e.exception)
        self.assertIn("categoria", mensaje)
        for valida in ("palabras", "logica", "cultura-general", "matematicas", "memoria", "geografia", "habilidad", "arcade"):
            self.assertIn(valida, mensaje)

    def test_una_categoria_desconocida_se_rechaza(self):
        self.juego("raro", categoria="deportes")
        with self.assertRaises(ErrorProyecto) as e:
            self.construir()
        self.assertIn("deportes", str(e.exception))

    def test_una_dificultad_desconocida_se_rechaza(self):
        self.juego("raro", dificultad="imposible")
        with self.assertRaises(ErrorProyecto) as e:
            self.construir()
        self.assertIn("dificultad", str(e.exception))

    def test_la_tarjeta_lleva_categoria_dificultad_y_busqueda(self):
        self.juego("uno", categoria="memoria", dificultad="dificil", etiquetas=["ritmo"])
        self.construir()
        listado = self.leer("juegos/index.html")
        self.assertRegex(listado, r'<li data-categoria="memoria" data-dificultad="dificil" data-busqueda="[^"]*ritmo[^"]*">')
        self.assertIn("Dificultad: </span>Difícil", listado)

    def test_los_chips_son_todos_mas_las_categorias_que_tienen_juegos(self):
        self.juego("uno", categoria="memoria")
        self.construir()
        listado = self.leer("juegos/index.html")
        self.assertEqual(len(re.findall(r"data-filtro-categoria=", listado)), 2)   # «Todos» + la única categoría en uso
        self.juego("dos", categoria="arcade")
        self.juego("tres", categoria="palabras")
        self.construir()
        self.assertEqual(len(re.findall(r"data-filtro-categoria=", self.leer("juegos/index.html"))), 4)
        self.assertIn('data-filtro-texto', listado)
        self.assertIn('data-filtro-dificultad', listado)

    def test_el_formulario_de_filtros_solo_se_muestra_con_javascript(self):
        self.juego("uno")
        self.construir()
        self.assertRegex(self.leer("juegos/index.html"), r"<form class=\"filtros\"[^>]*\bhidden\b")

    def test_la_ficha_muestra_categoria_dificultad_y_duracion(self):
        self.juego("uno", categoria="matematicas", dificultad="facil", duracion="3 min")
        self.construir()
        pagina = self.leer("juegos/uno/index.html")
        self.assertIn("Matemáticas", pagina)
        self.assertIn("Fácil", pagina)
        self.assertIn("3 min", pagina)


class OrdenDelListado(Base):
    def test_juegos_se_ordenan_por_el_campo_orden(self):
        self.juego("zeta", titulo="Zeta", orden=1, fecha="2026-01-01")
        self.juego("alfa", titulo="Alfa", orden=3, fecha="2026-12-01")
        self.juego("beta", titulo="Beta", orden=2, fecha="2026-06-01")
        self.construir()
        listado = self.leer("juegos/index.html")
        posiciones = [listado.index(f">{t}</a>") for t in ("Zeta", "Beta", "Alfa")]
        self.assertEqual(posiciones, sorted(posiciones))

    def test_a_igual_orden_desempata_el_titulo(self):
        self.juego("b-juego", titulo="Bravo", orden=5)
        self.juego("a-juego", titulo="Alfa", orden=5)
        self.construir()
        listado = self.leer("juegos/index.html")
        self.assertLess(listado.index(">Alfa</a>"), listado.index(">Bravo</a>"))

    def test_las_demas_secciones_siguen_ordenadas_por_fecha(self):
        for slug, fecha in (("vieja", "2026-01-05"), ("nueva", "2026-10-05")):
            ficha(self.raiz, "recursos", slug, {"titulo": slug.title(), "fecha": fecha, "descripcion": DESCRIPCION})
            escribir(self.raiz / "recursos" / slug / "pagina.html", "<p>Texto.</p>\n")
        self.construir()
        listado = self.leer("recursos/index.html")
        self.assertLess(listado.index(">Nueva</a>"), listado.index(">Vieja</a>"))


class DatosYScriptsDeSeccion(Base):
    def test_la_carpeta_datos_se_publica_tal_cual(self):
        escribir(self.raiz / "juegos/datos/lista.json", '{"a": [1, 2, 3]}\n')
        escribir(self.raiz / "juegos/datos/sub/otra.txt", "hola")
        self.construir()
        self.assertEqual(self.leer("juegos/datos/lista.json"), '{"a": [1, 2, 3]}\n')
        self.assertEqual(self.leer("juegos/datos/sub/otra.txt"), "hola")

    def test_los_js_sueltos_de_la_seccion_se_agrupan_y_van_antes_que_el_app_js(self):
        escribir(self.raiz / "juegos/aaa.js", "window.AAA = 1;\n")
        escribir(self.raiz / "juegos/zzz.js", "window.ZZZ = 2;\n")
        self.juego("uno")
        escribir(self.raiz / "juegos/uno/app.js", "window.UNO = 3;\n")
        self.construir()
        pagina = self.leer("juegos/uno/index.html")
        self.assertLess(pagina.index("assets/js/juegos.js"), pagina.index('src="app.js'))
        paquete = self.leer("assets/js/juegos.js")
        self.assertLess(paquete.index("window.AAA"), paquete.index("window.ZZZ"))
        self.assertNotIn("window.UNO", paquete)

    def test_los_css_sueltos_de_la_seccion_se_agrupan_en_orden_alfabetico(self):
        escribir(self.raiz / "juegos/b.css", ".b { color: blue; }\n")
        escribir(self.raiz / "juegos/a.css", ".a { color: red; }\n")
        self.juego("uno")
        self.construir()
        css = self.leer("assets/css/juegos.css")
        self.assertLess(css.index(".a {"), css.index(".b {"))

    def test_los_archivos_de_apoyo_del_juego_se_publican_junto_a_su_pagina(self):
        self.juego("uno")
        escribir(self.raiz / "juegos/uno/preguntas.json", '{"p": []}\n')
        self.construir()
        self.assertTrue((self.dist / "juegos/uno/preguntas.json").is_file())

    def test_un_js_o_json_de_un_juego_no_aparece_si_el_juego_es_borrador(self):
        ficha(self.raiz, "juegos", "borrador", {"titulo": "Borrador", "estado": "borrador"})
        escribir(self.raiz / "juegos/borrador/preguntas.json", "{}")
        self.construir()
        self.assertFalse((self.dist / "juegos/borrador").exists())


class SeccionesDinamicasYDePie(Base):
    def test_un_juego_no_dinamico_conserva_las_llaves_literales(self):
        self.juego("uno", pagina="<p>{{ esto es texto }}</p>\n")
        self.construir()
        self.assertIn("{{ esto es texto }}", self.leer("juegos/uno/index.html"))

    def test_una_seccion_dinamica_sustituye_datos_y_escapa(self):
        self.modificar_seccion("juegos", dinamico=True)
        self.juego("uno", pagina="<p>{{sitio.nombre}}</p><p>{{{titular.nombre}}}</p>\n")
        self.construir()
        pagina = self.leer("juegos/uno/index.html")
        self.assertIn("<p>TrabajoYJuego</p>", pagina)
        self.assertIn('<mark class="pendiente">[COMPLETAR POR EL TITULAR]</mark>', pagina)

    def test_una_variable_desconocida_en_una_seccion_dinamica_es_un_error_claro(self):
        self.modificar_seccion("juegos", dinamico=True)
        self.juego("uno", pagina="<p>{{no.existe}}</p>\n")
        with self.assertRaises(Exception) as e:
            self.construir()
        self.assertIn("no.existe", str(e.exception))

    def test_una_seccion_de_pie_no_sale_en_el_menu_ni_en_lo_ultimo_pero_si_en_el_pie_y_en_la_informacion_de_la_portada(self):
        self.modificar_seccion("recursos", ubicacion="pie")
        ficha(self.raiz, "recursos", "texto", {"titulo": "Texto de pie", "fecha": "2026-11-01", "descripcion": DESCRIPCION})
        escribir(self.raiz / "recursos/texto/pagina.html", "<p>Hola.</p>\n")
        self.construir()
        portada = self.leer("index.html")
        cabecera = portada[:portada.index("</header>")]
        self.assertNotIn("recursos/", cabecera)
        principal = portada[portada.index("<main"):portada.index("</main>")]
        for parte in ("hero", "novedades"):   # ni en las mitades de la portada ni entre las novedades
            inicio = principal.index(f'class="{parte}"')
            self.assertNotIn("recursos/texto", principal[inicio:principal.index("</section>", inicio)])
        inicio = principal.index('class="informacion"')   # solo en el bloque de información, junto a las demás páginas de pie
        self.assertIn("recursos/texto/", principal[inicio:principal.index("</section>", inicio)])
        self.assertIn("recursos/texto/", portada[portada.index("<footer"):])
        # y, en producción, en el sitemap
        d = json.loads((self.raiz / "config/sitio.json").read_text(encoding="utf-8"))
        d["entorno"] = "produccion"
        (self.raiz / "config/sitio.json").write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
        self.construir()
        self.assertIn("<loc>https://trabajoyjuego.es/recursos/texto/</loc>", self.leer("sitemap.xml"))

    def test_ubicacion_invalida(self):
        self.modificar_seccion("recursos", ubicacion="lateral")
        with self.assertRaises(ErrorProyecto) as e:
            self.construir()
        self.assertIn("ubicacion", str(e.exception))


class PlantillaDeJuego(Base):
    def test_la_plantilla_copiada_y_rellenada_se_publica_sin_errores(self):
        """juegos/_plantilla es lo primero que copiará quien añada el juego 21: tiene que construir y pasar la revisión."""
        destino = self.raiz / "juegos" / "mi-juego"
        shutil.copytree(self.raiz / "juegos" / "_plantilla", destino)
        f = json.loads((destino / "ficha.json").read_text(encoding="utf-8"))
        f.update(titulo="Mi juego", descripcion="Un juego de prueba copiado de la plantilla para comprobar que funciona tal cual.",
                 estado="publicado", categoria="habilidad", etiquetas=["demo"])
        (destino / "ficha.json").write_text(json.dumps(f, ensure_ascii=False), encoding="utf-8")
        pagina = destino / "pagina.html"
        pagina.write_text(pagina.read_text(encoding="utf-8").replace("ESCRIBE: ", "").replace("ESCRIBE", "texto"), encoding="utf-8")
        res = comprobar(self.raiz)
        self.assertEqual(res.errores, [], res.errores)

    def test_la_plantilla_sin_rellenar_no_se_publica_ni_estorba(self):
        self.construir()
        self.assertFalse((self.dist / "juegos" / "_plantilla").exists())
        self.assertNotIn("ESCRIBE", self.leer("juegos/index.html"))


class DatosEstructurados(Base):
    def test_un_juego_declara_aplicacion_web_gratuita_y_migas(self):
        self.juego("uno", titulo="Uno")
        self.construir()
        bloques = [json.loads(b) for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', self.leer("juegos/uno/index.html"), re.S)]
        tipos = {b["@type"] for b in bloques}
        self.assertEqual(tipos, {"WebApplication", "BreadcrumbList"})
        app = next(b for b in bloques if b["@type"] == "WebApplication")
        self.assertEqual(app["applicationCategory"], "GameApplication")
        self.assertTrue(app["isAccessibleForFree"])
        self.assertEqual(app["url"], "https://trabajoyjuego.es/juegos/uno/")
        # sin inventar valoraciones ni reseñas
        texto = json.dumps(bloques)
        self.assertNotIn("aggregateRating", texto)
        self.assertNotIn("review", texto.lower())
        self.assertNotIn("offers", texto)

    def test_no_hay_datos_estructurados_de_faq_inventados(self):
        self.juego("uno", pagina="<details><summary>¿Cómo se juega?</summary><p>Así.</p></details>\n")
        self.construir()
        self.assertNotIn("FAQPage", self.leer("juegos/uno/index.html"))

    def test_cada_pagina_tiene_canonical_y_title_y_description_unicos(self):
        self.juego("uno", titulo="Uno", descripcion=DESCRIPCION + " Primero.")
        self.juego("dos", titulo="Dos", descripcion=DESCRIPCION + " Segundo.")
        self.construir()
        titulos, descripciones = set(), set()
        for slug in ("uno", "dos"):
            html = self.leer(f"juegos/{slug}/index.html")
            self.assertIn(f'<link rel="canonical" href="https://trabajoyjuego.es/juegos/{slug}/">', html)
            titulos.add(re.search(r"<title>(.*?)</title>", html).group(1))
            descripciones.add(re.search(r'<meta name="description" content="(.*?)"', html).group(1))
        self.assertEqual(len(titulos), 2)
        self.assertEqual(len(descripciones), 2)

    def test_el_sitio_con_juegos_pasa_la_revision(self):
        self.juego("uno")
        self.juego("dos")
        res = comprobar(self.raiz)
        self.assertEqual(res.errores, [], res.errores)


if __name__ == "__main__":
    unittest.main()

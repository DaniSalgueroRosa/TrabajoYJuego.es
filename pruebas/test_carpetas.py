# -*- coding: utf-8 -*-
"""Pruebas del contrato de carpetas: «meter una carpeta en una sección basta».
Cada prueba trabaja en una copia temporal del proyecto, nunca en el proyecto real.

Ejecutar: python3 pruebas/test_carpetas.py
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

SECCIONES = ("herramientas", "recursos", "juegos", "tests")
DESCRIPCION = "Una descripción lo bastante larga para pasar la comprobación de longitud mínima."


class Base(unittest.TestCase):
    def setUp(self):
        self._tmp = Path(tempfile.mkdtemp(prefix="tyj-prueba-"))
        self.raiz = copiar_proyecto(self._tmp / "proyecto")
        self.dist = self.raiz / "dist"

    def tearDown(self):
        shutil.rmtree(self._tmp, ignore_errors=True)

    # --- ayudas
    def construir(self):
        return Constructor(self.raiz, self.dist).construir()

    def leer(self, ruta: str) -> str:
        return (self.dist / ruta).read_text(encoding="utf-8")

    def elemento(self, seccion, slug, pagina="<p>Contenido de prueba.</p>\n", **campos):
        datos = {"titulo": "Elemento de prueba", "fecha": "2026-11-01", "descripcion": DESCRIPCION}
        if seccion == "juegos":
            datos["categoria"] = "logica"      # en «juegos» la categoría es obligatoria (lo dice juegos/seccion.json)
        if seccion == "herramientas":
            datos["categoria"] = "texto"       # ídem en «herramientas» (diez categorías)
        if seccion == "tests":
            datos["categoria"] = "velocidad-clics"   # y en «tests» (cinco categorías)
        datos.update(campos)
        ficha(self.raiz, seccion, slug, datos)
        if pagina is not None:
            escribir(self.raiz / seccion / slug / "pagina.html", pagina)

    def modificar_json(self, ruta: str, **cambios):
        p = self.raiz / ruta
        d = json.loads(p.read_text(encoding="utf-8"))
        d.update(cambios)
        p.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")

    def error(self, *fragmentos):
        """Construye y exige un ErrorProyecto cuyo mensaje contenga todos los fragmentos."""
        with self.assertRaises(ErrorProyecto) as e:
            self.construir()
        mensaje = str(e.exception)
        for f in fragmentos:
            self.assertIn(f, mensaje)
        return mensaje


class SitioVacio(Base):
    def test_construye_solo_con_portada_y_listados_vacios(self):
        informe = self.construir()
        tipos = sorted(t for _, t in informe.paginas)
        # 4 listados de las secciones del menú + el de «legal» (sin elementos, porque la copia de prueba no lleva los reales)
        self.assertEqual(tipos, ["404", "listado", "listado", "listado", "listado", "listado", "portada"])
        for s in SECCIONES:
            self.assertTrue((self.dist / s / "index.html").is_file(), s)
            self.assertIn('class="vacio"', self.leer(f"{s}/index.html"))

    def test_las_plantillas_de_cada_seccion_no_se_publican(self):
        self.construir()
        for s in SECCIONES:
            self.assertFalse((self.dist / s / "_plantilla").exists())
        self.assertNotIn("ESCRIBE", "".join(p.read_text(encoding="utf-8") for p in self.dist.rglob("*.html")))

    def test_el_sitio_vacio_pasa_la_revision(self):
        res = comprobar(self.raiz)
        self.assertEqual(res.errores, [])


class MeterUnaCarpeta(Base):
    def test_funciona_en_las_cuatro_secciones(self):
        for s in SECCIONES:
            with self.subTest(seccion=s):
                self.elemento(s, "cosa-uno", titulo=f"Cosa de {s}")
        self.construir()
        for s in SECCIONES:
            pagina = self.leer(f"{s}/cosa-uno/index.html")
            self.assertIn(f"Cosa de {s}", pagina)
            self.assertIn(f'href="../{s}/cosa-uno/"', self.leer(f"{s}/index.html"))
            self.assertNotIn('class="vacio"', self.leer(f"{s}/index.html"))
        portada = self.leer("index.html")
        for s in SECCIONES:
            self.assertIn(f"{s}/cosa-uno/", portada)   # aparece en «Lo último»

    def test_ejemplo_del_encargo_juego1_en_juegos(self):
        self.elemento("juegos", "juego1", titulo="Juego 1")
        escribir(self.raiz / "juegos/juego1/app.css", "#x { color: red; }\n")
        escribir(self.raiz / "juegos/juego1/app.js", "console.log('hola');\n")
        informe = self.construir()
        self.assertIn(("juegos/juego1/", "elemento"), informe.paginas)
        pagina = self.leer("juegos/juego1/index.html")
        self.assertRegex(pagina, r'href="app\.css\?v=[0-9a-f]{8}"')
        self.assertRegex(pagina, r'src="app\.js\?v=[0-9a-f]{8}"')
        self.assertTrue((self.dist / "juegos/juego1/app.css").is_file())
        self.assertTrue((self.dist / "juegos/juego1/app.js").is_file())

    def test_los_archivos_de_apoyo_se_copian(self):
        self.elemento("juegos", "juego1")
        escribir(self.raiz / "juegos/juego1/sprite.svg", '<svg xmlns="http://www.w3.org/2000/svg"/>')
        escribir(self.raiz / "juegos/juego1/sonidos/bip.txt", "no es un sonido, pero sirve de prueba")
        self.construir()
        self.assertTrue((self.dist / "juegos/juego1/sprite.svg").is_file())
        self.assertTrue((self.dist / "juegos/juego1/sonidos/bip.txt").is_file())
        self.assertFalse((self.dist / "juegos/juego1/ficha.json").exists())   # la ficha no se publica

    def test_la_version_cambia_cuando_cambia_el_css(self):
        self.elemento("juegos", "juego1")
        escribir(self.raiz / "juegos/juego1/app.css", "a { color: red; }\n")
        self.construir()
        v1 = re.search(r"app\.css\?v=(\w+)", self.leer("juegos/juego1/index.html")).group(1)
        escribir(self.raiz / "juegos/juego1/app.css", "a { color: blue; }\n")
        self.construir()
        v2 = re.search(r"app\.css\?v=(\w+)", self.leer("juegos/juego1/index.html")).group(1)
        self.assertNotEqual(v1, v2)

    def test_las_rutas_son_relativas_a_la_profundidad(self):
        self.elemento("recursos", "guia")
        self.construir()
        pagina = self.leer("recursos/guia/index.html")
        self.assertIn('href="../../assets/css/comun.css?v=', pagina)
        self.assertNotIn('href="/assets', pagina)

    def test_ordenado_de_mas_nuevo_a_mas_antiguo(self):
        self.elemento("recursos", "vieja", titulo="Guía vieja", fecha="2026-01-05")
        self.elemento("recursos", "nueva", titulo="Guía nueva", fecha="2026-10-05")
        self.construir()
        listado = self.leer("recursos/index.html")
        self.assertLess(listado.index("Guía nueva"), listado.index("Guía vieja"))

    def test_borrador_se_ignora_por_completo(self):
        ficha(self.raiz, "juegos", "a-medias", {"titulo": "Sin acabar", "estado": "borrador"})
        informe = self.construir()
        self.assertFalse((self.dist / "juegos/a-medias").exists())
        self.assertNotIn("Sin acabar", self.leer("juegos/index.html"))
        self.assertIn(("juegos", 0, 0, 1), informe.secciones)

    def test_proximamente_sale_en_el_listado_sin_enlace_ni_pagina(self):
        ficha(self.raiz, "juegos", "luego", {"titulo": "Llega pronto", "estado": "proximamente", "descripcion": DESCRIPCION})
        self.construir()
        listado = self.leer("juegos/index.html")
        self.assertIn("Llega pronto", listado)
        self.assertNotIn("/luego/", listado)
        self.assertFalse((self.dist / "juegos/luego").exists())

    def test_carpetas_con_guion_bajo_o_punto_se_ignoran(self):
        escribir(self.raiz / "juegos/_ideas/notas.txt", "cualquier cosa")
        escribir(self.raiz / "juegos/.oculta/ficha.json", "esto ni siquiera es JSON")
        self.construir()
        self.assertFalse((self.dist / "juegos/_ideas").exists())

    def test_el_tema_llega_a_la_tarjeta_y_a_la_pagina(self):
        self.elemento("tests", "violeta", titulo="Test violeta", pagina='<h1>Test violeta</h1><p>Hola</p>',
                      tema={"fondo": "#2B1B4A", "texto": "#FFFFFF", "acento": "#FFB400"})
        self.construir()
        self.assertIn("--t-fondo:#2B1B4A", self.leer("tests/index.html"))
        pagina = self.leer("tests/violeta/index.html")
        self.assertIn("con-tema", pagina)
        self.assertIn("--t-fondo:#2B1B4A", pagina)

    def test_test_sin_h1_recibe_uno_invisible_y_con_h1_no(self):
        self.elemento("tests", "sin-titulo", titulo="Sin título propio", pagina="<p>Solo texto.</p>")
        self.elemento("tests", "con-titulo", titulo="Con título propio", pagina="<h1>Mi titular</h1><p>Texto.</p>")
        self.construir()
        sin = self.leer("tests/sin-titulo/index.html")
        con = self.leer("tests/con-titulo/index.html")
        self.assertEqual(sin.count("<h1"), 1)
        self.assertIn('<h1 class="solo-lectores">Sin título propio</h1>', sin)
        self.assertEqual(con.count("<h1"), 1)
        self.assertNotIn("solo-lectores\">Con título propio", con)

    def test_elemento_sin_pagina_html_avisa(self):
        self.elemento("juegos", "vacio", pagina=None)
        informe = self.construir()
        self.assertTrue(any("pagina.html" in a for a in informe.avisos), informe.avisos)


class ErroresDeCarpetas(Base):
    def test_falta_ficha_json(self):
        escribir(self.raiz / "juegos/sin-ficha/pagina.html", "<p>hola</p>")
        self.error("juegos/sin-ficha", "falta ficha.json", "_")

    def test_nombre_de_carpeta_invalido_propone_otro(self):
        self.elemento("juegos", "Mi Juego Mejor")
        self.error("mi-juego-mejor")

    def test_json_roto_indica_linea(self):
        escribir(self.raiz / "juegos/roto/ficha.json", '{\n  "titulo": "Roto",\n}\n')
        self.error("juegos/roto/ficha.json", "línea")

    def test_campo_desconocido_sugiere_el_correcto(self):
        self.elemento("juegos", "tipo", titol="Con errata")
        self.error("titol", "titulo")

    def test_fecha_con_formato_incorrecto(self):
        self.elemento("juegos", "fecha-mala", fecha="10/11/2026")
        self.error("fecha", "AAAA-MM-DD")

    def test_publicado_sin_fecha(self):
        ficha(self.raiz, "juegos", "sin-fecha", {"titulo": "Sin fecha", "descripcion": DESCRIPCION})
        self.error("falta «fecha»")

    def test_descripcion_demasiado_corta(self):
        self.elemento("juegos", "corta", descripcion="Muy corta")
        self.error("descripcion")

    def test_estado_invalido(self):
        self.elemento("juegos", "raro", estado="listo")
        self.error("estado", "publicado")

    def test_tema_con_poco_contraste(self):
        self.elemento("tests", "gris", tema={"fondo": "#FFFFFF", "texto": "#EEEEEE", "acento": "#000000"})
        self.error("contraste", "4.5")

    def test_tema_con_color_mal_escrito(self):
        self.elemento("tests", "color", tema={"fondo": "rojo", "texto": "#000000", "acento": "#000000"})
        self.error("#RRGGBB")

    def test_elemento_suelto_en_la_raiz(self):
        ficha(self.raiz, ".", "juego1", {"titulo": "Suelto", "fecha": "2026-11-01", "descripcion": DESCRIPCION})
        self.error("juego1", "suelta")

    def test_index_html_dentro_de_un_elemento(self):
        self.elemento("juegos", "choca")
        escribir(self.raiz / "juegos/choca/index.html", "<p>no debería estar</p>")
        self.error("index.html")

    def test_dos_secciones_con_el_mismo_orden(self):
        orden = json.loads((self.raiz / "juegos/seccion.json").read_text(encoding="utf-8"))["orden"]
        self.modificar_json("tests/seccion.json", orden=orden)
        self.error("orden")

    def test_seccion_con_mundo_inexistente(self):
        self.modificar_json("juegos/seccion.json", mundo="espacio")
        self.error("mundo", "trabajo")

    def test_campo_desconocido_en_seccion(self):
        self.modificar_json("juegos/seccion.json", colour="rojo")
        self.error("colour")


class Revision(Base):
    """El comprobador de «sitio.py comprobar» tiene que detectar de verdad lo que dice detectar."""

    def revisar(self):
        return comprobar(self.raiz)

    def assertDetecta(self, res, *fragmentos):
        todos = "\n".join(res.errores)
        for f in fragmentos:
            self.assertIn(f, todos)

    def test_enlace_roto(self):
        self.elemento("recursos", "guia", pagina='<p><a href="../no-existe/">roto</a></p>')
        self.assertDetecta(self.revisar(), "no-existe")

    def test_enlace_vacio(self):
        self.elemento("recursos", "guia", pagina='<p><a href="#">no hace nada</a></p>')
        self.assertDetecta(self.revisar(), "enlace vacío")

    def test_ancla_inexistente(self):
        self.elemento("recursos", "guia", pagina='<p><a href="#fantasma">ir</a></p>')
        self.assertDetecta(self.revisar(), "fantasma")

    def test_imagen_sin_alt(self):
        self.elemento("recursos", "guia", pagina='<p><img src="../../assets/img/logo.svg"></p>')
        self.assertDetecta(self.revisar(), "alt")

    def test_dos_h1(self):
        self.elemento("tests", "doble", pagina="<h1>Uno</h1><h1>Dos</h1>")
        self.assertDetecta(self.revisar(), "exactamente un <h1>")

    def test_texto_de_plantilla_sin_rellenar(self):
        self.elemento("juegos", "a-medias", pagina="<p>ESCRIBE aquí el contenido</p>")
        self.assertDetecta(self.revisar(), "sin rellenar")

    def test_referencia_css_rota(self):
        self.elemento("juegos", "juego1")
        escribir(self.raiz / "juegos/juego1/app.css", "#a { background: url(fondo-que-no-existe.png); }\n")
        self.assertDetecta(self.revisar(), "fondo-que-no-existe.png")

    def test_json_ld_invalido(self):
        self.elemento("recursos", "guia", pagina='<script type="application/ld+json">{ no es json }</script>')
        self.assertDetecta(self.revisar(), "JSON-LD")

    def test_ids_repetidos(self):
        self.elemento("recursos", "guia", pagina='<p id="x">a</p><p id="x">b</p>')
        self.assertDetecta(self.revisar(), "ids repetidos")

    def test_avisa_de_archivos_comunes_que_nadie_usa(self):
        escribir(self.raiz / "comun/img/sobrante.svg", '<svg xmlns="http://www.w3.org/2000/svg"/>')
        res = self.revisar()
        self.assertEqual(res.errores, [])
        self.assertTrue(any("sobrante.svg" in a for a in res.avisos), res.avisos)

    def test_el_sitio_limpio_no_tiene_archivos_sobrantes(self):
        # filtro.js y juegos.js solo se cargan cuando hay elementos que los usan, así que el sitio de prueba lleva uno en cada sección.
        for s in SECCIONES:
            self.elemento(s, "uno")
        res = self.revisar()
        self.assertEqual([a for a in res.avisos if "ninguna página ni CSS" in a], [])

    def test_preproduccion_avisa_y_produccion_exige_sitemap_completo(self):
        self.elemento("recursos", "guia")
        res = self.revisar()
        self.assertEqual(res.errores, [])
        self.assertTrue(any("preproduccion" in a for a in res.avisos))
        # Pasamos a producción: sin noindex, con sitemap con todas las páginas y sin aviso de entorno.
        self.modificar_json("config/sitio.json", entorno="produccion")
        res = self.revisar()
        self.assertEqual(res.errores, [], res.errores)
        self.assertFalse(any("preproduccion" in a for a in res.avisos))
        self.construir()
        self.assertNotIn("noindex", self.leer("recursos/guia/index.html"))
        self.assertIn("noindex", self.leer("404.html"))
        self.assertIn("<loc>https://trabajoyjuego.es/recursos/guia/</loc>", self.leer("sitemap.xml"))
        self.assertIn("Sitemap: https://trabajoyjuego.es/sitemap.xml", self.leer("robots.txt"))
        self.assertNotIn("Disallow: /\n", self.leer("robots.txt"))

    def test_preproduccion_bloquea_buscadores(self):
        self.elemento("recursos", "guia")
        self.construir()
        for pagina in ("index.html", "recursos/guia/index.html", "404.html"):
            self.assertIn("noindex", self.leer(pagina), pagina)
        self.assertIn("Disallow: /", self.leer("robots.txt"))
        self.assertNotIn("<loc>", self.leer("sitemap.xml"))


if __name__ == "__main__":
    unittest.main(verbosity=2)

# -*- coding: utf-8 -*-
"""Pruebas del motor de plantillas. Ejecutar: python3 pruebas/test_plantilla.py"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from motor.plantilla import ErrorPlantilla, Plantillas  # noqa: E402


def r(texto, datos):
    return Plantillas(Path(tempfile.gettempdir())).renderizar_texto(texto, datos)


class Variables(unittest.TestCase):
    def test_escapa_html(self):
        self.assertEqual(r("{{x}}", {"x": '<b>"a" & \'b\'</b>'}), "&lt;b&gt;&quot;a&quot; &amp; &#x27;b&#x27;&lt;/b&gt;")

    def test_crudo(self):
        self.assertEqual(r("{{{x}}}|{{&x}}", {"x": "<i>a</i>"}), "<i>a</i>|<i>a</i>")

    def test_ruta_con_puntos(self):
        self.assertEqual(r("{{a.b.c}}", {"a": {"b": {"c": 7}}}), "7")

    def test_none_es_vacio(self):
        self.assertEqual(r("[{{x}}]", {"x": None}), "[]")

    def test_falta_dato_da_error_claro(self):
        with self.assertRaises(ErrorPlantilla) as e:
            r("hola\n{{titulo}}", {"nombre": "x"})
        msg = str(e.exception)
        self.assertIn("línea 2", msg)
        self.assertIn("«titulo»", msg)
        self.assertIn("nombre", msg)

    def test_lista_en_variable_simple_es_error(self):
        with self.assertRaises(ErrorPlantilla):
            r("{{x}}", {"x": [1, 2]})

    def test_booleano_en_variable_simple_es_error(self):
        with self.assertRaises(ErrorPlantilla):
            r("{{x}}", {"x": True})

    def test_comentario(self):
        self.assertEqual(r("a{{! esto no sale }}b", {}), "ab")


class Secciones(unittest.TestCase):
    def test_lista_de_objetos(self):
        self.assertEqual(r("{{#xs}}<{{n}}>{{/xs}}", {"xs": [{"n": 1}, {"n": 2}]}), "<1><2>")

    def test_lista_de_textos_con_punto(self):
        self.assertEqual(r("{{#xs}}{{.}},{{/xs}}", {"xs": ["a", "b"]}), "a,b,")

    def test_lista_vacia_y_inversa(self):
        self.assertEqual(r("{{#xs}}A{{/xs}}{{^xs}}vacío{{/xs}}", {"xs": []}), "vacío")

    def test_condicional_verdadero_y_falso(self):
        self.assertEqual(r("{{#v}}sí{{/v}}{{^v}}no{{/v}}", {"v": True}), "sí")
        self.assertEqual(r("{{#v}}sí{{/v}}{{^v}}no{{/v}}", {"v": ""}), "no")
        self.assertEqual(r("{{#v}}sí{{/v}}{{^v}}no{{/v}}", {"v": 0}), "no")

    def test_objeto_abre_contexto(self):
        self.assertEqual(r("{{#o}}{{a}}{{/o}}", {"o": {"a": "x"}}), "x")

    def test_busca_en_capas_exteriores(self):
        self.assertEqual(r("{{#xs}}{{n}}{{sitio}} {{/xs}}", {"sitio": "S", "xs": [{"n": 1}, {"n": 2}]}), "1S 2S ")

    def test_anidadas(self):
        d = {"g": [{"t": "A", "i": [{"n": 1}, {"n": 2}]}, {"t": "B", "i": []}]}
        self.assertEqual(r("{{#g}}{{t}}:{{#i}}{{n}}{{/i}}{{^i}}-{{/i}};{{/g}}", d), "A:12;B:-;")

    def test_lineas_solas_no_dejan_huecos(self):
        plantilla = "<ul>\n{{#xs}}\n  <li>{{.}}</li>\n{{/xs}}\n</ul>\n"
        self.assertEqual(r(plantilla, {"xs": ["a", "b"]}), "<ul>\n  <li>a</li>\n  <li>b</li>\n</ul>\n")

    def test_etiquetas_en_la_misma_linea_no_se_recortan(self):
        self.assertEqual(r("<a {{#v}}x{{/v}}>", {"v": True}), "<a x>")

    def test_cierre_sin_abrir(self):
        with self.assertRaises(ErrorPlantilla) as e:
            r("a\n{{/x}}", {})
        self.assertIn("línea 2", str(e.exception))

    def test_cierre_equivocado(self):
        with self.assertRaises(ErrorPlantilla) as e:
            r("{{#a}}\n{{/b}}", {"a": True})
        self.assertIn("{{/a}}", str(e.exception))

    def test_seccion_sin_cerrar(self):
        with self.assertRaises(ErrorPlantilla) as e:
            r("{{#a}}hola", {"a": True})
        self.assertIn("no tiene su", str(e.exception))

    def test_etiqueta_vacia(self):
        with self.assertRaises(ErrorPlantilla):
            r("{{ }}", {})


class Parciales(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.raiz = Path(self.tmp.name)
        (self.raiz / "a").mkdir()
        (self.raiz / "a" / "parte.html").write_text("[{{x}}]", encoding="utf-8")
        (self.raiz / "a" / "bucle1.html").write_text("{{> a/bucle2}}", encoding="utf-8")
        (self.raiz / "a" / "bucle2.html").write_text("{{> a/bucle1}}", encoding="utf-8")
        (self.raiz / "a" / "con-error.html").write_text("ok\n{{falta}}", encoding="utf-8")
        self.p = Plantillas(self.raiz)

    def tearDown(self):
        self.tmp.cleanup()

    def test_parcial_usa_los_mismos_datos(self):
        (self.raiz / "marco.html").write_text("<{{> a/parte}}>", encoding="utf-8")
        self.assertEqual(self.p.renderizar("marco", {"x": 5}), "<[5]>")

    def test_parcial_dentro_de_lista(self):
        (self.raiz / "marco.html").write_text("{{#xs}}{{> a/parte}}{{/xs}}", encoding="utf-8")
        self.assertEqual(self.p.renderizar("marco", {"xs": [{"x": 1}, {"x": 2}]}), "[1][2]")

    def test_parcial_inexistente(self):
        (self.raiz / "marco.html").write_text("{{> a/nada}}", encoding="utf-8")
        with self.assertRaises(ErrorPlantilla) as e:
            self.p.renderizar("marco", {})
        self.assertIn("a/nada", str(e.exception))

    def test_circulo_se_detecta(self):
        with self.assertRaises(ErrorPlantilla) as e:
            self.p.renderizar("a/bucle1", {})
        self.assertIn("círculo", str(e.exception))

    def test_error_en_parcial_nombra_el_parcial(self):
        (self.raiz / "marco.html").write_text("{{> a/con-error}}", encoding="utf-8")
        with self.assertRaises(ErrorPlantilla) as e:
            self.p.renderizar("marco", {})
        self.assertIn("a/con-error.html, línea 2", str(e.exception))

    def test_no_sale_de_la_carpeta(self):
        (self.raiz / "marco.html").write_text("{{> ../fuera}}", encoding="utf-8")
        with self.assertRaises(ErrorPlantilla):
            self.p.renderizar("marco", {})


if __name__ == "__main__":
    unittest.main(verbosity=1)

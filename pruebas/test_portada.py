# -*- coding: utf-8 -*-
"""Pruebas de la portada con el contenido real: el índice «por categoría» y el bloque «Información y transparencia».

Lo que vigilan:
  · el índice enlaza todos los juegos publicados (hoy 50), cada uno una vez, agrupados por su categoría, con la cuenta correcta y en el orden de sus fichas;
  · una categoría sin juegos publicados no aparece (nunca un hueco ni un enlace que no lleve a nada) y la cuenta se actualiza;
  · «Lo último» desempata las fechas iguales por el «orden» de la ficha, no por el alfabeto;
  · el bloque de información enlaza las seis páginas legales y dice la verdad sobre la publicidad en cada caso (activa o no);
  · sin juegos o sin páginas legales la portada se construye igual, sin bloques vacíos;
  · el sitio con todo pasa la revisión de producción (enlaces, incluidos los «?categoria=», títulos, marcas sin rellenar).

Cada prueba trabaja en una copia temporal del proyecto. Ejecutar: python3 pruebas/test_portada.py
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
from motor.paginas import Constructor  # noqa: E402
from pruebas.ejemplos import copiar_proyecto  # noqa: E402

LEGALES = ["aviso-legal", "politica-de-privacidad", "politica-de-cookies", "condiciones-de-uso", "publicidad-y-transparencia", "contacto"]
TITULAR = {"nombre": "Titular de Prueba S.L.", "nif": "B00000000", "domicilio": "Calle de la Prueba 1, 28000 Madrid",
           "email": "prueba@ejemplo.test", "telefono": "", "registro": "", "alojamiento": "Hosting de Prueba S.A."}
PUBLICIDAD = {"activa": True, "cliente": "ca-pub-1234567890123456", "bloques": {"listado": "1111111111", "juego": "2222222222"}}


def trozo(html: str, clase: str) -> str:
    """El <section> de la portada que tiene esa clase (hasta su cierre; los bloques no anidan otras secciones)."""
    inicio = html.index(f'class="{clase}')
    return html[inicio:html.index("</section>", inicio)]


class Base(unittest.TestCase):
    conservar = ("juegos", "legal")

    def setUp(self):
        self._tmp = Path(tempfile.mkdtemp(prefix="tyj-portada-"))
        self.raiz = copiar_proyecto(self._tmp / "proyecto", conservar=self.conservar)
        self.dist = self.raiz / "dist"

    def tearDown(self):
        shutil.rmtree(self._tmp, ignore_errors=True)

    def config(self, archivo, /, **cambios):
        ruta = self.raiz / "config" / archivo
        d = json.loads(ruta.read_text(encoding="utf-8"))
        d.update(cambios)
        ruta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")

    def construir(self):
        return Constructor(self.raiz, self.dist).construir()

    def portada(self) -> str:
        html = (self.dist / "index.html").read_text(encoding="utf-8")
        return html[html.index("<main"):html.index("</main>")]

    def fichas_de(self, seccion: str) -> dict:
        """slug → ficha de los elementos publicados de una sección real."""
        fichas = {}
        for f in sorted((self.raiz / seccion).glob("*/ficha.json")):
            d = json.loads(f.read_text(encoding="utf-8"))
            if d.get("estado", "publicado") == "publicado":
                fichas[f.parent.name] = d
        return fichas


class IndicePorCategoria(Base):
    def setUp(self):
        super().setUp()
        self.construir()
        self.explorar = trozo(self.portada(), "explorar")
        self.juegos = self.fichas_de("juegos")

    def test_enlaza_todos_los_juegos_una_vez_cada_uno(self):
        self.assertGreaterEqual(len(self.juegos), 50)
        hrefs = re.findall(r'href="(juegos/[a-z0-9-]+/)"', self.explorar)
        self.assertEqual(sorted(hrefs), sorted(f"juegos/{s}/" for s in self.juegos))
        for h in hrefs:
            self.assertTrue((self.dist / h / "index.html").is_file(), h)

    def test_cada_categoria_agrupa_sus_juegos_con_la_cuenta_correcta_y_en_el_orden_de_las_fichas(self):
        categorias = {}
        for slug, d in self.juegos.items():
            categorias.setdefault(d["categoria"], []).append((d.get("orden", 10**6), slug))
        self.assertEqual(self.explorar.count('class="explorar-grupo-titulo"'), len(categorias))
        self.assertEqual(len(categorias), 8)
        for cat, lista in categorias.items():
            with self.subTest(categoria=cat):
                self.assertIn(f'href="juegos/?categoria={cat}"', self.explorar)
                inicio = self.explorar.index(f'href="juegos/?categoria={cat}"')
                grupo = self.explorar[inicio:self.explorar.index("</ul>", inicio)]
                esperado = [f"juegos/{s}/" for _, s in sorted(lista)]
                self.assertEqual(re.findall(r'href="(juegos/[a-z0-9-]+/)"', grupo), esperado)
                n = len(lista)
                self.assertIn(f'<p class="explorar-cuenta">{n} {"juego" if n == 1 else "juegos"}</p>', self.explorar[inicio:inicio + 400])

    def test_el_enlace_general_dice_cuantos_juegos_hay(self):
        self.assertIn(f'<a href="juegos/">Ver {len(self.juegos)} juegos</a>', self.explorar)

    def test_el_bloque_tiene_titulo_accesible_y_jerarquia_de_encabezados(self):
        m = re.search(r'aria-labelledby="([^"]+)"', self.explorar)
        self.assertIsNotNone(m)
        self.assertIn(f'<h2 id="{m.group(1)}"', self.explorar)
        self.assertIn("Juegos por categoría", self.explorar)
        self.assertNotIn("<h1", self.explorar)
        self.assertEqual(self.explorar.count("<h2"), 1)

    def test_el_mundo_del_bloque_es_el_de_la_seccion(self):
        self.assertIn('data-mundo="juego"', self.explorar)

    def test_el_listado_de_juegos_tiene_los_filtros_que_el_enlace_de_categoria_espera(self):
        listado = (self.dist / "juegos/index.html").read_text(encoding="utf-8")
        for cat in {d["categoria"] for d in self.juegos.values()}:
            self.assertIn(f'data-filtro-categoria="{cat}"', listado)
        self.assertIn("URLSearchParams", (next((self.dist / "assets/js").glob("filtro*.js"))).read_text(encoding="utf-8"))


class CategoriaSinJuegos(Base):
    def pasar_a_borrador(self, categoria: str, conservando: int = 0) -> tuple[int, int]:
        """Pasa a borrador los juegos de una categoría (menos los primeros «conservando»). Devuelve (total publicados, los que quedan de la categoría)."""
        fichas = sorted(self.raiz.glob("juegos/*/ficha.json"))
        propios = [f for f in fichas if json.loads(f.read_text(encoding="utf-8")).get("categoria") == categoria]
        self.assertGreaterEqual(len(propios), 2, categoria)
        for f in propios[conservando:]:
            d = json.loads(f.read_text(encoding="utf-8"))
            d["estado"] = "borrador"
            f.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
        publicados = len(self.fichas_de("juegos"))
        return publicados, conservando

    def test_una_categoria_sin_juegos_publicados_no_aparece_y_la_cuenta_baja(self):
        # al pasar a borrador todos los juegos de «Memoria», la categoría entera desaparece del índice
        antes = len(self.fichas_de("juegos"))
        publicados, _ = self.pasar_a_borrador("memoria")
        self.assertLess(publicados, antes)
        self.construir()
        explorar = trozo(self.portada(), "explorar")
        self.assertNotIn("categoria=memoria", explorar)
        self.assertNotIn("memoria-visual", explorar)
        self.assertEqual(explorar.count('class="explorar-grupo-titulo"'), 7)
        self.assertIn(f"Ver {publicados} juegos", explorar)
        self.assertNotIn("<ul class=\"explorar-items\">\n        </ul>", explorar)

    def test_con_un_solo_juego_la_cuenta_va_en_singular(self):
        self.pasar_a_borrador("memoria", conservando=1)
        self.construir()
        self.assertIn('<p class="explorar-cuenta">1 juego</p>', trozo(self.portada(), "explorar"))

    def test_sin_buscador_el_enlace_de_categoria_abre_el_listado_entero(self):
        ruta = self.raiz / "juegos/seccion.json"
        d = json.loads(ruta.read_text(encoding="utf-8"))
        d["buscador"] = False
        ruta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
        self.construir()
        explorar = trozo(self.portada(), "explorar")
        self.assertNotIn("?categoria=", explorar)
        self.assertIn('<a href="juegos/">Palabras</a>', explorar)


class LoUltimo(Base):
    def test_las_fechas_iguales_se_desempatan_por_el_orden_de_la_ficha_y_no_por_el_alfabeto(self):
        self.construir()
        juegos = self.fichas_de("juegos")
        esperado = [f"juegos/{s}/" for s, d in sorted(juegos.items(), key=lambda kv: (kv[1]["fecha"] != max(x["fecha"] for x in juegos.values()), kv[1].get("orden", 10**6), kv[1]["titulo"].casefold()))[:6]]
        novedades = trozo(self.portada(), "novedades")
        self.assertEqual(re.findall(r'class="tarjeta-enlace" href="([^"]+)"', novedades), esperado)
        nuevos = [d for d in juegos.values() if d["fecha"] == max(x["fecha"] for x in juegos.values())]
        primero = min(nuevos, key=lambda d: (d.get("orden", 10**6), d["titulo"].casefold()))
        self.assertEqual(esperado[0], "juegos/" + next(s for s, d in juegos.items() if d is primero) + "/")   # el de menor «orden» entre los más recientes: el primero que se enseña


class InformacionYTransparencia(Base):
    def test_enlaza_las_seis_paginas_legales_y_lo_dice_con_titulo_accesible(self):
        self.construir()
        info = trozo(self.portada(), "informacion")
        for slug in LEGALES:
            with self.subTest(pagina=slug):
                self.assertIn(f'<a href="legal/{slug}/">', info)
                self.assertTrue((self.dist / "legal" / slug / "index.html").is_file())
        self.assertIn("Información y transparencia", info)
        self.assertEqual(info.count("<h2"), 1)
        self.assertIn('aria-labelledby="informacion-legales-titulo"', info)
        self.assertIn('id="informacion-legales-titulo"', info)

    def test_dice_que_no_hay_registro_ni_se_guardan_las_partidas(self):
        self.construir()
        info = trozo(self.portada(), "informacion")
        self.assertIn("Sin registro", info)
        self.assertIn("No hay cuentas ni formularios", info)
        self.assertIn("desaparece al recargar la página", info)

    def test_sin_publicidad_activa_dice_que_no_hay_anuncios_y_no_nombra_a_google(self):
        self.construir()
        info = trozo(self.portada(), "informacion")
        self.assertIn("Ahora mismo no muestra anuncios ni carga elementos de terceros.", info)
        self.assertNotIn("AdSense", info)
        self.assertNotIn("Configurar cookies", info)

    def test_con_publicidad_activa_dice_que_hay_anuncios_marcados_y_enlaza_la_configuracion(self):
        self.config("sitio.json", entorno="produccion")
        self.config("titular.json", **TITULAR)
        self.config("publicidad.json", **PUBLICIDAD)
        self.construir()
        info = trozo(self.portada(), "informacion")
        self.assertIn("publicidad de Google AdSense", info)
        self.assertIn("etiqueta «Publicidad»", info)
        self.assertIn('<a href="legal/politica-de-cookies/#configurar">Configurar cookies</a>', info)
        self.assertNotIn("Ahora mismo no muestra anuncios", info)

    def test_con_publicidad_configurada_pero_sin_entorno_de_produccion_sigue_diciendo_que_no_hay_anuncios(self):
        self.config("publicidad.json", **PUBLICIDAD)   # entorno de preproducción: no se carga nada de Google
        self.construir()
        info = trozo(self.portada(), "informacion")
        self.assertIn("Ahora mismo no muestra anuncios", info)
        self.assertNotIn("AdSense", info)


class SinJuegosNiLegal(Base):
    conservar = ()

    def test_sin_contenido_la_portada_se_construye_sin_bloques_vacios(self):
        self.construir()
        principal = self.portada()
        self.assertNotIn('class="explorar', principal)            # ninguna sección con categorías y algo publicado
        self.assertNotIn('class="informacion-legales"', principal)  # ninguna página legal publicada
        self.assertIn("Sin registro", principal)                    # lo demás del bloque de información sí está
        self.assertNotIn("{{", principal)
        self.assertNotIn("<ul>\n      </ul>", principal)


class SoloLegal(Base):
    conservar = ("legal",)

    def test_sin_juegos_no_hay_indice_pero_si_informacion(self):
        self.construir()
        principal = self.portada()
        self.assertNotIn('class="explorar', principal)
        for slug in LEGALES:
            self.assertIn(f'href="legal/{slug}/"', trozo(principal, "informacion"))


class RevisionDeProduccion(Base):
    def test_el_sitio_completo_pasa_la_revision_con_los_datos_del_titular(self):
        self.config("sitio.json", entorno="produccion")
        self.config("titular.json", **TITULAR)
        res = comprobar(self.raiz)
        self.assertEqual(res.errores, [], res.errores)

    def test_la_portada_no_trae_nada_de_terceros(self):
        self.construir()
        principal = self.portada()
        self.assertEqual(re.findall(r'(?:href|src)="(https?://[^"]+)"', principal), [])


if __name__ == "__main__":
    unittest.main()

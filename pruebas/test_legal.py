# -*- coding: utf-8 -*-
"""Pruebas del apartado legal y de la publicidad.

Lo que vigilan:
  · las seis páginas legales existen, se enlazan desde el pie y la de cookies tiene el ancla «configurar»;
  · si faltan datos del titular se ve «[COMPLETAR POR EL TITULAR]» y NO se inventa nada; en producción el comprobador lo impide;
  · mientras la publicidad no esté activa (o falte el identificador, o el entorno sea preproducción) no sale ni una línea de código de
    anuncios, ni de consentimiento, ni un identificador; los textos legales cambian para decir la verdad en cada caso;
  · con la publicidad activa salen el script de AdSense, los bloques reservados con su etiqueta «Publicidad», ads.txt y el botón
    de consentimiento.

Cada prueba trabaja en una copia temporal del proyecto con los elementos legales reales (conservar=("legal",)).
Ejecutar: python3 pruebas/test_legal.py
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

PAGINAS = ["aviso-legal", "politica-de-privacidad", "politica-de-cookies", "condiciones-de-uso", "publicidad-y-transparencia", "contacto"]
TITULAR = {"nombre": "Titular de Prueba S.L.", "nif": "B00000000", "domicilio": "Calle de la Prueba 1, 28000 Madrid",
           "email": "prueba@ejemplo.test", "telefono": "", "registro": "", "alojamiento": "Hosting de Prueba S.A."}
CLIENTE = "ca-pub-1234567890123456"
PUBLICIDAD = {"activa": True, "cliente": CLIENTE, "bloques": {"listado": "1111111111", "juego": "2222222222"}}
DESCRIPCION = "Una descripción lo bastante larga para pasar la comprobación de longitud mínima."


class Base(unittest.TestCase):
    def setUp(self):
        self._tmp = Path(tempfile.mkdtemp(prefix="tyj-legal-"))
        self.raiz = copiar_proyecto(self._tmp / "proyecto", conservar=("legal",))
        self.dist = self.raiz / "dist"

    def tearDown(self):
        shutil.rmtree(self._tmp, ignore_errors=True)

    def config(self, archivo, /, **cambios):
        ruta = self.raiz / "config" / archivo
        d = json.loads(ruta.read_text(encoding="utf-8"))
        d.update(cambios)
        ruta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")

    def titular_completo(self):
        self.config("titular.json", **TITULAR)

    def produccion(self):
        self.config("sitio.json", entorno="produccion")

    def juego(self, slug="juego-uno"):
        ficha(self.raiz, "juegos", slug, {"titulo": "Juego de prueba", "fecha": "2026-11-01", "descripcion": DESCRIPCION, "categoria": "logica"})
        escribir(self.raiz / "juegos" / slug / "pagina.html", "<div class=\"juego\"><p>Hola.</p></div>\n")

    def construir(self):
        return Constructor(self.raiz, self.dist).construir()

    def leer(self, ruta):
        return (self.dist / ruta).read_text(encoding="utf-8")

    def todo_el_html(self):
        return "\n".join(p.read_text(encoding="utf-8") for p in self.dist.rglob("*.html"))


class PaginasLegales(Base):
    def test_las_seis_paginas_existen_y_tienen_un_solo_h1(self):
        self.construir()
        for slug in PAGINAS:
            with self.subTest(pagina=slug):
                html = self.leer(f"legal/{slug}/index.html")
                self.assertEqual(html.count("<h1"), 1)
                self.assertIn("Última actualización", html)
                self.assertNotIn("{{", html)
        self.assertTrue((self.dist / "legal/index.html").is_file())

    def test_el_pie_de_todas_las_paginas_enlaza_las_seis_y_las_cookies(self):
        self.juego()
        self.construir()
        for ruta in ("index.html", "juegos/index.html", "juegos/juego-uno/index.html", "legal/aviso-legal/index.html", "404.html"):
            with self.subTest(pagina=ruta):
                html = self.leer(ruta)
                pie = html[html.index("<footer"):]
                for slug in PAGINAS:
                    self.assertIn(f"legal/{slug}/", pie)
                self.assertIn("legal/politica-de-cookies/#configurar", pie)
                self.assertIn("Configurar cookies", pie)

    def test_la_pagina_de_cookies_tiene_el_ancla_que_enlaza_el_pie(self):
        self.construir()
        self.assertIn('id="configurar"', self.leer("legal/politica-de-cookies/index.html"))

    def test_las_paginas_legales_no_salen_en_el_menu_ni_como_novedad_pero_si_en_el_bloque_de_informacion_de_la_portada(self):
        self.juego()
        self.construir()
        portada = self.leer("index.html")
        cabecera = portada[:portada.index("</header>")]
        self.assertNotIn("legal/", cabecera)
        principal = portada[portada.index("<main"):portada.index("</main>")]
        # no son una sección más de la portada: ni en las mitades «Trabajo | Juego» ni entre «Lo último»
        for parte in ("hero", "novedades"):
            inicio = principal.index(f'class="{parte}"')
            self.assertNotIn("legal/", principal[inicio:principal.index("</section>", inicio)], parte)
        # pero el bloque «Información y transparencia» lleva a las seis
        inicio = principal.index('class="informacion"')
        bloque = principal[inicio:principal.index("</section>", inicio)]
        for slug in PAGINAS:
            self.assertIn(f'href="legal/{slug}/"', bloque)

    def test_estan_en_el_sitemap_en_produccion(self):
        self.produccion()
        self.titular_completo()
        self.construir()
        mapa = self.leer("sitemap.xml")
        for slug in PAGINAS:
            self.assertIn(f"<loc>https://trabajoyjuego.es/legal/{slug}/</loc>", mapa)

    def test_el_sitio_con_lo_legal_pasa_la_revision_con_los_datos_completos(self):
        self.produccion()
        self.titular_completo()
        res = comprobar(self.raiz)
        self.assertEqual(res.errores, [], res.errores)

    def test_los_enlaces_internos_de_los_textos_legales_no_estan_rotos(self):
        self.titular_completo()
        res = comprobar(self.raiz)
        self.assertEqual([e for e in res.errores if "/legal/" in e], [])


class DatosDelTitular(Base):
    def test_sin_datos_se_ve_la_marca_y_no_se_inventa_nada(self):
        informe = self.construir()
        self.assertTrue(any("titular" in a for a in informe.avisos), informe.avisos)
        for slug in ("aviso-legal", "politica-de-privacidad", "contacto"):
            html = self.leer(f"legal/{slug}/index.html")
            self.assertIn('<mark class="pendiente">[COMPLETAR POR EL TITULAR]</mark>', html)
        # el aviso legal advierte además de que no debe publicarse así
        self.assertIn("faltan datos del titular", self.leer("legal/aviso-legal/index.html"))

    def test_con_los_datos_se_escriben_y_desaparece_la_marca(self):
        self.titular_completo()
        informe = self.construir()
        self.assertFalse(any("titular" in a for a in informe.avisos), informe.avisos)
        self.assertNotIn('class="pendiente"', self.todo_el_html())
        aviso = self.leer("legal/aviso-legal/index.html")
        for dato in ("Titular de Prueba S.L.", "B00000000", "Calle de la Prueba 1, 28000 Madrid", "prueba@ejemplo.test"):
            self.assertIn(dato, aviso)
        self.assertIn("Hosting de Prueba S.A.", self.leer("legal/politica-de-privacidad/index.html"))

    def test_telefono_y_registro_solo_salen_si_se_rellenan(self):
        self.titular_completo()
        self.construir()
        aviso = self.leer("legal/aviso-legal/index.html")
        self.assertNotIn("Teléfono", aviso)
        self.assertNotIn("Datos registrales", aviso)
        self.config("titular.json", telefono="+34 600 000 000", registro="Registro Mercantil de Prueba, tomo 1")
        self.construir()
        aviso = self.leer("legal/aviso-legal/index.html")
        self.assertIn("+34 600 000 000", aviso)
        self.assertIn("Registro Mercantil de Prueba", aviso)

    def test_los_datos_se_escapan(self):
        self.titular_completo()
        self.config("titular.json", nombre='<script>alert(1)</script> & Cía')
        self.construir()
        aviso = self.leer("legal/aviso-legal/index.html")
        self.assertNotIn("<script>alert(1)</script>", aviso)
        self.assertIn("&lt;script&gt;", aviso)

    def test_el_correo_no_se_publica_como_enlace_mailto_inventado(self):
        self.construir()
        self.assertNotIn("mailto:", self.todo_el_html())

    def test_en_preproduccion_los_datos_pendientes_solo_avisan(self):
        res = comprobar(self.raiz)
        self.assertEqual(res.errores, [], res.errores)
        self.assertTrue(any("titular" in a for a in res.avisos))

    def test_en_produccion_los_datos_pendientes_impiden_publicar(self):
        self.produccion()
        res = comprobar(self.raiz)
        self.assertTrue(any("COMPLETAR POR EL TITULAR" in e for e in res.errores), res.errores)

    def test_un_dato_obligatorio_a_medias_cuenta_como_pendiente(self):
        self.titular_completo()
        self.config("titular.json", nif="   ")
        informe = self.construir()
        self.assertTrue(any("NIF" in a for a in informe.avisos), informe.avisos)
        self.assertIn('class="pendiente"', self.leer("legal/aviso-legal/index.html"))


class SinPublicidad(Base):
    """Lo que debe pasar mientras AdSense no esté aprobado: nada de nada."""

    def comprobar_sin_rastro(self):
        todo = self.todo_el_html()
        for rastro in ("adsbygoogle", "googlesyndication", "ca-pub-", "data-ad-client", "googlefc", 'class="anuncio"', "consentimiento.js"):
            self.assertNotIn(rastro, todo, rastro)
        self.assertFalse((self.dist / "ads.txt").exists())
        for p in (self.dist / "assets").rglob("*.js"):
            self.assertNotIn("googlesyndication", p.read_text(encoding="utf-8"))

    def test_por_defecto_no_hay_nada(self):
        self.juego()
        self.construir()
        self.comprobar_sin_rastro()

    def test_activa_pero_en_preproduccion_no_carga_nada_y_avisa(self):
        self.juego()
        self.config("publicidad.json", **PUBLICIDAD)
        informe = self.construir()
        self.assertTrue(any("preproduccion" in a for a in informe.avisos), informe.avisos)
        self.comprobar_sin_rastro()

    def test_activa_en_produccion_pero_sin_cliente_es_un_error_claro(self):
        self.produccion()
        self.config("publicidad.json", activa=True, cliente="")
        with self.assertRaises(ErrorProyecto) as e:
            self.construir()
        self.assertIn("cliente", str(e.exception))

    def test_un_cliente_con_formato_incorrecto_se_rechaza(self):
        self.produccion()
        for malo in ("pub-123", "ca-pub-12345", "ca-pub-12345678901234567", "CA-PUB-1234567890123456", "ca-pub-1234 5678 9012 3456"):
            with self.subTest(cliente=malo):
                self.config("publicidad.json", activa=True, cliente=malo)
                with self.assertRaises(ErrorProyecto):
                    self.construir()

    def test_un_bloque_con_letras_se_rechaza(self):
        self.produccion()
        self.config("publicidad.json", activa=True, cliente=CLIENTE, bloques={"listado": "abc", "juego": ""})
        with self.assertRaises(ErrorProyecto):
            self.construir()

    def test_los_textos_legales_dicen_que_no_hay_publicidad_ni_cookies(self):
        self.titular_completo()
        self.construir()
        cookies = self.leer("legal/politica-de-cookies/index.html")
        self.assertIn("no carga cookies ni elementos de terceros", cookies)
        self.assertNotIn("data-consentimiento", cookies)
        publicidad = self.leer("legal/publicidad-y-transparencia/index.html")
        self.assertIn("no muestra anuncios", publicidad)
        privacidad = self.leer("legal/politica-de-privacidad/index.html")
        self.assertNotIn("Google LLC", privacidad)
        self.assertIn("no se carga publicidad", privacidad)

    def test_el_listado_y_el_juego_no_reservan_hueco_de_anuncio(self):
        self.juego()
        self.construir()
        self.assertNotIn("anuncio", self.leer("juegos/juego-uno/index.html").replace("anuncios", ""))
        self.assertNotIn('class="anuncio', self.leer("juegos/index.html"))


class ConPublicidad(Base):
    def preparar(self, bloques=None):
        self.produccion()
        self.titular_completo()
        self.config("publicidad.json", **dict(PUBLICIDAD, **({"bloques": bloques} if bloques is not None else {})))
        self.juego()
        return self.construir()

    def test_el_script_sale_en_todas_las_paginas_con_el_identificador_real(self):
        self.preparar()
        for ruta in ("index.html", "juegos/index.html", "juegos/juego-uno/index.html", "legal/aviso-legal/index.html"):
            with self.subTest(pagina=ruta):
                self.assertIn(f"adsbygoogle.js?client={CLIENTE}", self.leer(ruta))

    def test_ads_txt_lleva_el_identificador_de_editor(self):
        self.preparar()
        self.assertEqual(self.leer("ads.txt"), "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n")

    def test_los_bloques_reservados_llevan_etiqueta_y_su_numero(self):
        self.preparar()
        juego = self.leer("juegos/juego-uno/index.html")
        listado = self.leer("juegos/index.html")
        self.assertIn('data-ad-slot="2222222222"', juego)
        self.assertIn('data-ad-slot="1111111111"', listado)
        for html in (juego, listado):
            self.assertIn("Publicidad<", html)
            self.assertIn(f'data-ad-client="{CLIENTE}"', html)

    def test_el_anuncio_del_juego_va_despues_del_juego_y_del_boton_de_volver(self):
        self.preparar()
        html = self.leer("juegos/juego-uno/index.html")
        fin_del_juego = html.index("<p>Hola.</p></div>")
        self.assertGreater(html.index('class="anuncio"'), fin_del_juego)
        volver = [m.start() for m in re.finditer(r'href="\.\./"', html)]
        if volver:
            self.assertGreater(html.index('class="anuncio"'), min(volver))
        self.assertEqual(html.count('class="anuncio"'), 1)

    def test_sin_numero_de_bloque_avisa_de_los_anuncios_automaticos(self):
        informe = self.preparar(bloques={"listado": "", "juego": ""})
        self.assertTrue(any("bloque" in a for a in informe.avisos), informe.avisos)
        self.assertNotIn('class="anuncio"', self.leer("juegos/juego-uno/index.html"))

    def test_el_boton_de_consentimiento_solo_esta_en_las_cookies(self):
        self.preparar()
        cookies = self.leer("legal/politica-de-cookies/index.html")
        self.assertRegex(cookies, r"<button[^>]*data-consentimiento[^>]*hidden")
        self.assertIn("consentimiento", cookies[cookies.index("<script"):] if "<script" in cookies else cookies)
        self.assertNotIn("consentimiento.js", self.leer("juegos/juego-uno/index.html"))
        self.assertNotIn("consentimiento.js", self.leer("index.html"))

    def test_los_textos_legales_describen_la_publicidad_real(self):
        self.preparar()
        cookies = self.leer("legal/politica-de-cookies/index.html")
        self.assertIn("Google", cookies)
        self.assertIn("aceptar, rechazar o configurar", cookies)
        self.assertNotIn("no carga cookies ni elementos de terceros", cookies)
        privacidad = self.leer("legal/politica-de-privacidad/index.html")
        self.assertIn("Google LLC y Google Ireland Limited", privacidad)
        publicidad = self.leer("legal/publicidad-y-transparencia/index.html")
        self.assertIn("se financia con publicidad de Google AdSense", publicidad)
        self.assertNotIn("garantiza", publicidad.lower())

    def test_el_sitio_pasa_la_revision_en_produccion(self):
        self.preparar()
        res = comprobar(self.raiz)
        self.assertEqual(res.errores, [], res.errores)

    def test_no_hay_ningun_id_de_google_en_el_codigo_fuente_del_proyecto(self):
        """El proyecto no debe llevar identificadores inventados (el ejemplo de formato ca-pub-0000000000000000 de los mensajes de error sí vale)."""
        real = Path(__file__).resolve().parent.parent
        for ruta in list(real.rglob("*.html")) + list(real.rglob("*.json")) + list(real.rglob("*.js")) + list(real.rglob("*.py")):
            if "dist" in ruta.parts or "pruebas" in ruta.parts or "__pycache__" in ruta.parts:
                continue
            texto = ruta.read_text(encoding="utf-8", errors="ignore")
            self.assertIsNone(re.search(r"ca-pub-(?!0{16})\d{16}", texto), f"{ruta}: identificador de editor escrito a mano")
            self.assertIsNone(re.search(r"(?<!ca-)pub-(?!0{16})\d{16}", texto), f"{ruta}: identificador de editor escrito a mano")


if __name__ == "__main__":
    unittest.main()

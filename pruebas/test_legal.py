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
PUBLICIDAD = {"activa": True, "cliente": CLIENTE, "bloques": {"cabecera": "6666666666", "portada": "7777777777", "listado": "1111111111", "texto": "2222222222", "final": "3333333333"}}
CON_DATOS_PERSONALES = {"aviso-legal", "politica-de-privacidad", "contacto"}   # páginas con NIF y domicilio: no se indexan
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

    def juego_con_texto(self, slug="juego-uno", apartados=5):
        """Un juego con el texto explicativo de verdad: varios apartados con párrafos, y al final las preguntas frecuentes."""
        ficha(self.raiz, "juegos", slug, {"titulo": "Juego de prueba", "fecha": "2026-11-01", "descripcion": DESCRIPCION, "categoria": "logica"})
        parrafo = "<p>" + ("Este párrafo explica una parte del juego con palabras sencillas para que se pueda leer sin prisa. " * 4) + "</p>\n"
        cuerpo = '<div class="juego" data-juego="x"><div class="pantalla"><button type="button">Jugar</button></div></div>\n\n<div class="juego-texto">\n'
        for i in range(1, apartados):
            cuerpo += f"  <h2>Apartado {i}</h2>\n  " + parrafo + "  " + parrafo
        cuerpo += "  <h2>Preguntas frecuentes</h2>\n  <details><summary>¿Una?</summary><p>Sí, una respuesta.</p></details>\n  <details><summary>¿Otra?</summary><p>No, otra respuesta.</p></details>\n</div>\n"
        escribir(self.raiz / "juegos" / slug / "pagina.html", cuerpo)

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
            if slug in CON_DATOS_PERSONALES:          # estas tres llevan «indexar: false» (ver PrivacidadDelTitular)
                self.assertNotIn(f"/legal/{slug}/", mapa)
            else:
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


class PrivacidadDelTitular(Base):
    """El NIF y el domicilio solo pueden verse en las páginas legales, y esas páginas no se ofrecen a los buscadores."""
    NIF = "B00000000"
    DOMICILIO = "Calle de la Prueba 1, 28000 Madrid"

    def preparar(self):
        self.produccion()
        self.titular_completo()
        self.juego_con_texto()
        self.construir()

    def paginas_con_los_datos(self):
        return {p.relative_to(self.dist).as_posix() for p in self.dist.rglob("*")
                if p.is_file() and p.suffix in {".html", ".xml", ".txt", ".json", ".js"}
                and (self.NIF in p.read_text(encoding="utf-8", errors="ignore") or self.DOMICILIO in p.read_text(encoding="utf-8", errors="ignore"))}

    def test_nif_y_domicilio_solo_salen_en_las_tres_paginas_legales(self):
        self.preparar()
        esperadas = {f"legal/{s}/index.html" for s in CON_DATOS_PERSONALES}
        self.assertEqual(self.paginas_con_los_datos() - esperadas, set(), "el NIF o el domicilio aparecen fuera de las páginas legales")
        self.assertTrue(self.paginas_con_los_datos(), "el titular debería identificarse en alguna página legal (LSSI, art. 10)")

    def test_nif_y_domicilio_no_entran_en_el_buscador_ni_en_otros_indices(self):
        self.preparar()
        for ruta in self.dist.rglob("*"):
            if ruta.is_file() and ruta.suffix in {".json", ".js", ".xml", ".txt"}:
                texto = ruta.read_text(encoding="utf-8", errors="ignore")
                self.assertNotIn(self.NIF, texto, ruta.name)
                self.assertNotIn(self.DOMICILIO, texto, ruta.name)

    def test_las_paginas_con_datos_piden_no_ser_indexadas_pero_si_seguir_enlaces(self):
        self.preparar()
        for slug in CON_DATOS_PERSONALES:
            html = self.leer(f"legal/{slug}/index.html")
            self.assertRegex(html, r'<meta name="robots" content="noindex, follow">', slug)

    def test_no_estan_en_el_sitemap_y_el_resto_de_paginas_si_se_indexan(self):
        self.preparar()
        mapa = self.leer("sitemap.xml")
        for slug in CON_DATOS_PERSONALES:
            self.assertNotIn(f"/legal/{slug}/", mapa)
        for slug in set(PAGINAS) - CON_DATOS_PERSONALES:
            self.assertIn(f"/legal/{slug}/", mapa)
            self.assertNotIn("noindex", self.leer(f"legal/{slug}/index.html"))
        self.assertNotIn("noindex", self.leer("index.html"))

    def test_robots_txt_no_cierra_el_sitio_porque_el_noindex_va_en_la_pagina(self):
        self.preparar()
        self.assertNotIn("Disallow: /legal", self.leer("robots.txt"))   # si se bloqueara, Google no vería el noindex

    def test_la_revision_de_produccion_no_se_queja_de_esas_paginas(self):
        self.preparar()
        res = comprobar(self.raiz)
        self.assertEqual([e for e in res.errores], [], res.errores)

    def test_quitando_indexar_la_pagina_vuelve_al_sitemap(self):
        self.produccion()
        self.titular_completo()
        self.juego_con_texto()
        ruta = self.raiz / "legal" / "contacto" / "ficha.json"
        d = json.loads(ruta.read_text(encoding="utf-8"))
        d.pop("indexar", None)
        ruta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
        self.construir()
        self.assertIn("/legal/contacto/", self.leer("sitemap.xml"))
        self.assertNotIn("noindex", self.leer("legal/contacto/index.html"))

    def test_indexar_solo_acepta_verdadero_o_falso(self):
        self.juego_con_texto()
        ruta = self.raiz / "legal" / "contacto" / "ficha.json"
        d = json.loads(ruta.read_text(encoding="utf-8"))
        d["indexar"] = "no"
        ruta.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
        with self.assertRaises(ErrorProyecto):
            self.construir()


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
        self.config("publicidad.json", activa=True, cliente=CLIENTE, bloques={"listado": "abc", "final": ""})
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
        self.assertIn("saldrá solo en estas posiciones", publicidad)
        self.assertNotIn("Los anuncios salen solo", publicidad)
        privacidad = self.leer("legal/politica-de-privacidad/index.html")
        self.assertNotIn("Google LLC", privacidad)
        self.assertIn("no se carga publicidad", privacidad)

    def test_el_listado_y_el_juego_no_reservan_hueco_de_anuncio(self):
        self.juego_con_texto()
        self.construir()
        self.assertNotIn("anuncio", self.leer("juegos/juego-uno/index.html").replace("anuncios", ""))
        self.assertNotIn('class="anuncio', self.leer("juegos/index.html"))


class Verificacion(Base):
    """Para pedir la revisión, AdSense necesita ver tu identificador en la web ANTES de aprobarla. Con «activa» en false y «cliente» relleno, en
    producción, el sitio publica solo ads.txt y la etiqueta meta de cuenta: texto, no código; sin anuncios, sin script y sin consentimiento."""

    def preparar(self, **cambios):
        self.produccion()
        self.titular_completo()
        self.config("publicidad.json", activa=False, cliente=CLIENTE, **cambios)
        self.juego_con_texto()
        return self.construir()

    def test_publica_ads_txt_y_la_etiqueta_meta_y_nada_mas_de_google(self):
        self.preparar()
        self.assertEqual(self.leer("ads.txt"), "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n")
        etiqueta = f'<meta name="google-adsense-account" content="{CLIENTE}">'
        for ruta in ("index.html", "juegos/index.html", "juegos/juego-uno/index.html", "legal/aviso-legal/index.html"):
            self.assertIn(etiqueta, self.leer(ruta), ruta)
        self.assertNotIn(etiqueta, self.leer("404.html"))
        todo = self.todo_el_html()
        for rastro in ("adsbygoogle", "googlesyndication", "data-ad-client", "googlefc", 'class="anuncio', "consentimiento.js"):
            self.assertNotIn(rastro, todo, rastro)
        for p in (self.dist / "assets").rglob("*.js"):
            self.assertNotIn("googlesyndication", p.read_text(encoding="utf-8"))

    def test_los_textos_legales_siguen_diciendo_que_no_hay_anuncios(self):
        self.preparar()
        self.assertIn("no muestra anuncios", self.leer("legal/publicidad-y-transparencia/index.html"))
        self.assertIn("no carga cookies ni elementos de terceros", self.leer("legal/politica-de-cookies/index.html"))
        self.assertNotIn("data-consentimiento", self.leer("legal/politica-de-cookies/index.html"))
        self.assertIn("Ahora mismo no muestra anuncios", self.leer("index.html"))

    def test_en_preproduccion_no_sale_nada(self):
        self.config("publicidad.json", activa=False, cliente=CLIENTE)
        self.juego_con_texto()
        self.construir()
        self.assertNotIn("ca-pub-", self.todo_el_html())
        self.assertFalse((self.dist / "ads.txt").exists())

    def test_sin_cliente_no_sale_nada_aunque_sea_produccion(self):
        self.produccion()
        self.titular_completo()
        self.juego_con_texto()
        self.construir()
        self.assertNotIn("google-adsense-account", self.todo_el_html())
        self.assertFalse((self.dist / "ads.txt").exists())

    def test_con_la_publicidad_activa_tambien_sale_la_etiqueta_y_ads_txt(self):
        self.produccion()
        self.titular_completo()
        self.config("publicidad.json", **PUBLICIDAD)
        self.juego_con_texto()
        self.construir()
        self.assertIn(f'content="{CLIENTE}"', self.leer("index.html"))
        self.assertTrue((self.dist / "ads.txt").exists())

    def test_el_sitio_pasa_la_revision(self):
        self.preparar()
        res = comprobar(self.raiz)
        self.assertEqual(res.errores, [], res.errores)


class ConPublicidad(Base):
    def preparar(self, bloques=None, texto_largo=False):
        self.produccion()
        self.titular_completo()
        self.config("publicidad.json", **dict(PUBLICIDAD, **({"bloques": bloques} if bloques is not None else {})))
        self.juego_con_texto() if texto_largo else self.juego()
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
        self.preparar(texto_largo=True)
        juego = self.leer("juegos/juego-uno/index.html")
        listado = self.leer("juegos/index.html")
        self.assertEqual(re.findall(r'data-posicion="texto"[\s\S]*?data-ad-slot="(\d+)"', juego), ["2222222222"])
        self.assertEqual(re.findall(r'data-posicion="final"[\s\S]*?data-ad-slot="(\d+)"', juego), ["3333333333"])
        self.assertIn('data-ad-slot="1111111111"', listado)
        for html in (juego, listado):
            self.assertIn("Publicidad<", html)
            self.assertIn(f'data-ad-client="{CLIENTE}"', html)

    def test_el_anuncio_del_final_va_despues_del_juego_y_del_boton_de_volver(self):
        self.preparar(texto_largo=True)
        html = self.leer("juegos/juego-uno/index.html")
        fin_del_juego = html.index("Jugar</button></div></div>")
        final = html.index('data-posicion="final"')
        self.assertGreater(final, fin_del_juego)
        volver = [m.start() for m in re.finditer(r'<a [^>]*>Volver a todos los juegos</a>', html)]
        self.assertEqual(len(volver), 2)
        self.assertGreater(final, max(volver))
        self.assertEqual(html.count('class="anuncio anuncio--final"'), 1)

    def test_el_anuncio_del_texto_va_entre_dos_apartados_y_lejos_del_juego(self):
        self.preparar(texto_largo=True)
        html = self.leer("juegos/juego-uno/index.html")
        self.assertEqual(html.count('data-posicion="texto"'), 1)
        pos = html.index('<aside class="anuncio anuncio--texto"')
        fin_del_juego = html.index("Jugar</button></div></div>")
        antes = html[fin_del_juego:pos]
        self.assertGreater(len(re.sub(r"<[^>]+>", "", antes).split()), 40, "tiene que haber bastante texto entre el juego y el anuncio")
        # justo antes hay un párrafo cerrado y justo después un encabezado: no corta ningún apartado por la mitad
        self.assertRegex(html[:pos].rstrip()[-6:], r"</p>")
        despues = re.sub(r"^\s*<aside.*?</aside>\s*", "", html[pos:], flags=re.S)
        self.assertTrue(despues.lstrip().startswith("<h2"), despues[:80])
        # y no es el último apartado (las preguntas frecuentes quedan después, con el anuncio del final)
        self.assertLess(pos, html.index("Preguntas frecuentes"))

    def test_nunca_hay_mas_de_un_anuncio_por_posicion_y_ninguno_cerca_de_los_controles(self):
        self.preparar(texto_largo=True)
        html = self.leer("juegos/juego-uno/index.html")
        self.assertEqual(html.count('class="anuncio '), 3)   # cabecera (antes del título), texto y final
        self.assertEqual(html.count('data-posicion="cabecera"'), 1)
        inicio_juego, fin_juego = html.index('<div class="juego"'), html.index("Jugar</button></div></div>")
        for m in re.finditer(r'class="anuncio ', html):
            self.assertFalse(inicio_juego < m.start() < fin_juego)

    def test_sin_texto_suficiente_solo_queda_el_anuncio_del_final(self):
        self.preparar()          # el juego de prueba corto: «<p>Hola.</p>»
        html = self.leer("juegos/juego-uno/index.html")
        self.assertNotIn('data-posicion="texto"', html)
        self.assertEqual(html.count('data-posicion="final"'), 1)

    def test_el_listado_largo_lleva_un_anuncio_entre_las_tarjetas_y_otro_al_final(self):
        self.produccion()
        self.titular_completo()
        self.config("publicidad.json", **PUBLICIDAD)
        for i in range(20):
            self.juego_con_texto(f"juego-{i:02d}")
        self.construir()
        html = self.leer("juegos/index.html")
        self.assertEqual(html.count('data-posicion="listado"'), 2)
        primero = html.index('data-posicion="listado"')
        self.assertEqual(html[:primero].count("<li data-categoria"), 12)
        self.assertGreater(html[primero:].count("<li data-categoria"), 0)
        self.assertGreater(html.rindex('data-posicion="listado"'), html.rindex("<li data-categoria"))

    def test_un_listado_corto_solo_lleva_el_anuncio_del_final(self):
        self.preparar()
        html = self.leer("juegos/index.html")
        self.assertEqual(html.count('data-posicion="listado"'), 1)

    def test_con_un_bloque_general_lo_usan_todos_los_huecos_sin_numero_propio(self):
        informe = self.preparar(bloques={"general": "4444444444", "final": "5555555555"}, texto_largo=True)
        juego = self.leer("juegos/juego-uno/index.html")
        self.assertEqual(re.findall(r'data-posicion="texto"[\s\S]*?data-ad-slot="(\d+)"', juego), ["4444444444"])
        self.assertEqual(re.findall(r'data-posicion="final"[\s\S]*?data-ad-slot="(\d+)"', juego), ["5555555555"])
        self.assertIn('data-ad-slot="4444444444"', self.leer("juegos/index.html"))
        self.assertEqual(re.findall(r'data-posicion="cabecera"[\s\S]*?data-ad-slot="(\d+)"', juego), ["4444444444"])
        self.assertEqual(re.findall(r'data-posicion="portada"[\s\S]*?data-ad-slot="(\d+)"', self.leer("index.html")), ["4444444444"])
        self.assertFalse(any("bloque" in a for a in informe.avisos), informe.avisos)

    def test_el_banner_de_la_portada_usa_su_numero_y_si_no_el_de_cabecera(self):
        self.preparar(bloques={"general": "4444444444", "cabecera": "8888888888", "portada": "9999999999"})
        self.assertEqual(re.findall(r'data-posicion="portada"[\s\S]*?data-ad-slot="(\d+)"', self.leer("index.html")), ["9999999999"])
        self.assertEqual(re.findall(r'data-posicion="cabecera"[\s\S]*?data-ad-slot="(\d+)"', self.leer("juegos/juego-uno/index.html")), ["8888888888"])
        self.preparar(bloques={"general": "4444444444", "cabecera": "8888888888"})
        self.assertEqual(re.findall(r'data-posicion="portada"[\s\S]*?data-ad-slot="(\d+)"', self.leer("index.html")), ["8888888888"])

    def test_los_banners_de_arriba_son_finos_y_van_antes_que_el_titulo(self):
        self.preparar()
        for ruta in ("index.html", "juegos/index.html", "juegos/juego-uno/index.html"):
            with self.subTest(pagina=ruta):
                html = self.leer(ruta)
                banner = re.search(r'<aside class="anuncio anuncio--(?:cabecera|portada)"[\s\S]*?</aside>', html).group(0)
                self.assertIn('data-ad-format="horizontal"', banner)
                self.assertIn('data-full-width-responsive="false"', banner)
                self.assertIn("Publicidad", banner)
        juego = self.leer("juegos/juego-uno/index.html")
        self.assertLess(juego.index('data-posicion="cabecera"'), juego.index("<h1"))

    def test_sin_numero_de_bloque_avisa_de_los_anuncios_automaticos(self):
        informe = self.preparar(bloques={})
        self.assertTrue(any("ningún bloque" in a for a in informe.avisos), informe.avisos)
        self.assertNotIn('class="anuncio', self.leer("juegos/juego-uno/index.html"))

    def test_un_hueco_sin_numero_y_sin_general_avisa_y_se_queda_vacio(self):
        informe = self.preparar(bloques={"final": "5555555555"}, texto_largo=True)
        self.assertTrue(any("texto" in a and "listado" in a for a in informe.avisos), informe.avisos)
        juego = self.leer("juegos/juego-uno/index.html")
        self.assertNotIn('data-posicion="texto"', juego)
        self.assertIn('data-posicion="final"', juego)

    def test_los_anuncios_no_salen_en_las_paginas_legales_ni_en_la_404_y_la_portada_solo_lleva_su_banner(self):
        self.preparar(texto_largo=True)
        for ruta in ("404.html", "legal/index.html", "legal/aviso-legal/index.html", "legal/publicidad-y-transparencia/index.html"):
            with self.subTest(pagina=ruta):
                self.assertNotIn('<aside class="anuncio', self.leer(ruta))
        portada = self.leer("index.html")
        self.assertEqual(portada.count('<aside class="anuncio'), 1)
        self.assertEqual(portada.count('data-posicion="portada"'), 1)

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
        # el texto dice las posiciones reales, en presente, y que lo legal y la 404 no llevan anuncios (la portada sí lleva su banner)
        self.assertIn("Los anuncios salen solo en estas posiciones", publicidad)
        self.assertNotIn("saldrá solo", publicidad)
        for frase in ("Un banner fino bajo el menú", "Un banner fino en la portada", "Dentro del texto", "Al final", "En los listados",
                      "No hay anuncios en las páginas legales"):
            self.assertIn(frase, publicidad)

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

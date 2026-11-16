# -*- coding: utf-8 -*-
"""Pruebas de la sección TESTS (los 30 tests de aptitud, reflejos y habilidad y los de utilidades, personalidad, relaciones y cultura pop).

Vigilan lo que el encargo exige a cada test:
  · ficha completa (categoría de seccion.json, duración, descripción de 40 a 160 caracteres, título que quepa en <title>, colores de «tema»);
  · el orden del encargo (el número de cada ficha es su posición en la lista de 30);
  · texto propio para buscadores: al menos 4 apartados, preguntas frecuentes, aviso sin JavaScript y 220 palabras, sin frases largas repetidas;
  · NINGÚN test guarda nada en el dispositivo ni llama a servidores (la misma regla que los juegos);
  · las piezas de cálculo de tests/base.js (estadística, ventanas de tiempo, rangos) dan los resultados correctos.

Ejecutar: python3 pruebas/test_tests_datos.py
"""
import json
import re
import shutil
import subprocess
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TESTS = RAIZ / "tests"
sys.path.insert(0, str(RAIZ))

# El orden del encargo: para los 30 primeros, la posición en esta lista es el «orden» de la ficha.
ORDEN = [
    # Velocidad y clics
    "test-de-velocidad-de-cliqueo", "click-jitter", "click-de-kohi", "cps-con-clic-derecho", "prueba-de-la-barra-espaciadora",
    # Ratón y teclado
    "prueba-del-mouse", "polling-rate-del-mouse", "test-de-scroll-del-mouse", "giros-de-raton", "arrastrar-y-hacer-clic", "test-de-tipeo-ppm",
    # Reacción y puntería
    "test-de-tiempo-de-reaccion", "reaccion-auditiva", "test-de-punteria", "entrenador-de-punteria", "coordinacion-mano-ojo", "apm-acciones-por-minuto",
    # Vista y oído
    "diferenciacion-de-colores", "tono-de-color", "sensibilidad-a-los-colores", "vision-del-color", "prueba-de-audicion-edad-auditiva", "test-de-ritmo",
    # Memoria y percepción
    "memoria-verbal", "memoria-numerica", "memoria-a-corto-plazo", "percepcion-del-tiempo", "dibuja-un-circulo-perfecto", "edad-cerebral",
    "razonamiento-visual-espacial",
]
# Los demás llevan el número que les dio el encargo (faltan los 33 a 41, de inteligencia, y el 51).
NUEVOS = {
    "test-de-velocidad-de-internet": 31, "ia-vs-cuadros-reales": 32,
    "test-de-edad-mental": 42, "test-de-los-16-tipos-de-personalidad": 43, "test-de-pureza-de-rice": 44, "test-soldado-poeta-o-rey": 45,
    "test-del-color-del-alma": 46, "test-de-la-brujula-de-talentos": 47, "test-de-color-de-personalidad": 48,
    "test-del-hemisferio-cerebral-dominante": 49, "reloj-de-la-muerte": 50,
    "test-le-gusto": 52, "test-le-gusto-a-el-tambien": 53, "test-estoy-enamorado": 54, "calculadora-de-amor": 55, "test-de-orientacion-sexual": 56,
    "test-omegaverse": 57, "test-lesbico": 58, "test-homosexual": 59, "test-bisexual": 60, "test-trans": 61,
    "test-de-naruto": 62, "test-de-dragon-ball": 63, "test-de-jujutsu-kaisen": 64, "test-de-haikyu": 65, "test-de-jojos-bizarre-adventure": 66,
    "test-de-percy-jackson": 67, "test-de-juego-de-tronos": 68, "test-del-universo-dc": 69, "test-de-south-park": 70,
    "test-de-nivel-de-vocabulario-de-espanol": 80, "test-de-jerga-espanola": 81, "test-internacional-de-espanol": 82, "test-de-errores-ortograficos-comunes": 83,
    "test-de-nivel-de-vocabulario-de-ingles": 84, "test-de-nivel-de-vocabulario-de-frances": 85, "test-de-nivel-de-vocabulario-de-ruso": 86,
    "test-de-nivel-de-vocabulario-de-japones": 87, "test-de-donde-vienes": 88,
}
NUMERO = {slug: i + 1 for i, slug in enumerate(ORDEN)}
NUMERO.update(NUEVOS)
DEFECTO = {"velocidad-clics": 5, "raton-teclado": 6, "reaccion-punteria": 6, "vista-oido": 6, "memoria-percepcion": 7,
           "utilidades": 2, "personalidad": 9, "relaciones": 10, "cultura-pop": 40, "series-cine": 40,
           "espanol": 4, "otros-idiomas": 5}
# Tests que necesitan imágenes del titular: hasta que las haya salen como «próximamente» (ver docs/TEST-IA-VS-CUADROS.md).
NECESITAN_IMAGENES = {"ia-vs-cuadros-reales"}
# Los únicos que piden archivos al propio sitio (nunca a otro): el de velocidad y el de imágenes.
PIDEN_AL_MISMO_SITIO = {"test-de-velocidad-de-internet", "ia-vs-cuadros-reales"}


def existentes():
    return [p.name for p in sorted(TESTS.iterdir()) if p.is_dir() and (p / "ficha.json").is_file() and not p.name.startswith("_")]


def cargar(slug):
    return json.loads((TESTS / slug / "ficha.json").read_text(encoding="utf-8"))


class FichasYOrden(unittest.TestCase):
    def test_los_tests_existentes_son_del_encargo(self):
        self.assertTrue(existentes(), "no hay ningún test")
        self.assertEqual(set(existentes()) - set(NUMERO), set(), "hay tests que no están en el encargo")

    def test_el_orden_de_cada_ficha_es_su_posicion_en_el_encargo(self):
        for slug in existentes():
            self.assertEqual(cargar(slug)["orden"], NUMERO[slug], slug)

    def test_cada_ficha_esta_completa(self):
        categorias = {c["id"] for c in json.loads((TESTS / "seccion.json").read_text(encoding="utf-8"))["categorias"]}
        self.assertEqual(categorias, set(DEFECTO))
        for slug in existentes():
            f = cargar(slug)
            with self.subTest(test=slug):
                self.assertEqual(f["estado"], "proximamente" if slug in NECESITAN_IMAGENES and f["estado"] != "publicado" else "publicado")
                self.assertIn(f["categoria"], categorias)
                self.assertTrue(f["duracion"].strip())
                self.assertTrue(40 <= len(f["descripcion"]) <= 160, f"descripción de {len(f['descripcion'])} caracteres")
                self.assertLessEqual(len(f["titulo"]), 44, "el <title> pasaría de 60 caracteres")
                self.assertTrue(f["etiquetas"])
                self.assertEqual(set(f["tema"]), {"fondo", "texto", "acento"})

    def test_titulos_y_descripciones_son_distintos(self):
        for campo in ("titulo", "descripcion"):
            valores = [cargar(s)[campo] for s in existentes()]
            self.assertEqual(len(set(valores)), len(valores), campo)

    def test_las_categorias_completas_tienen_el_numero_del_encargo(self):
        """Cuando una categoría está entera (todos sus tests), su cuenta coincide con la del encargo."""
        cuenta = {}
        for slug in existentes():
            cuenta[cargar(slug)["categoria"]] = cuenta.get(cargar(slug)["categoria"], 0) + 1
        for categoria, n in cuenta.items():
            self.assertLessEqual(n, DEFECTO[categoria], categoria)


class TextoYArchivos(unittest.TestCase):
    def test_cada_test_tiene_texto_propio_con_apartados_y_preguntas_frecuentes(self):
        for slug in existentes():
            html = (TESTS / slug / "pagina.html").read_text(encoding="utf-8")
            with self.subTest(test=slug):
                self.assertGreaterEqual(html.count("<h2"), 4, "el texto para Google necesita al menos cuatro apartados")
                self.assertIn("<details", html, "faltan las preguntas frecuentes")
                self.assertIn("<noscript", html, "falta el aviso para quien no tiene JavaScript")
                self.assertEqual(html.count("<h1"), 1)
                palabras = len(re.sub(r"<[^>]+>", " ", html).split())
                self.assertGreaterEqual(palabras, 220, f"solo {palabras} palabras de texto")
                self.assertIn('id="tt-app"', html)
                self.assertIn(f'data-test="{slug}"', html)

    def test_los_textos_no_se_repiten_entre_tests(self):
        vistas = {}
        for slug in existentes():
            html = (TESTS / slug / "pagina.html").read_text(encoding="utf-8")
            texto = re.sub(r"<[^>]+>", "\n", html)
            for frase in re.split(r"(?<=[.!?])\s+", texto):
                frase = " ".join(frase.split())
                if len(frase) >= 80:
                    self.assertNotIn(frase, vistas, f"frase repetida en {slug} y {vistas.get(frase)}: «{frase[:60]}…»")
                    vistas[frase] = slug

    def test_cada_test_tiene_su_app_js_y_usa_el_punto_de_montaje(self):
        for slug in existentes():
            with self.subTest(test=slug):
                js = (TESTS / slug / "app.js").read_text(encoding="utf-8")
                # Los de cuestionario y lista de casillas montan sus piezas con el motor (que llama a TT.app() por dentro).
                self.assertTrue(any(x in js for x in ("TT.app()", "TT.cuestionario(", "TT.lista(", "TT.quiz(")), "no monta nada en #tt-app")

    def test_no_quedan_textos_de_relleno_ni_css_vacios(self):
        for slug in existentes():
            for archivo in (TESTS / slug).glob("*"):
                if archivo.suffix in (".html", ".js", ".css", ".json"):
                    texto = archivo.read_text(encoding="utf-8")
                    self.assertNotRegex(texto, r"\bESCRIBE\b|(?i:lorem ipsum)|TODO|FIXME", str(archivo))
            css = TESTS / slug / "app.css"
            if css.is_file():
                self.assertTrue(css.read_text(encoding="utf-8").strip(), f"{css} está vacío: bórralo")


class SinGuardarNada(unittest.TestCase):
    BASE = (r"localStorage|sessionStorage|indexedDB|openDatabase|document\.cookie|cookieStore|caches\.|serviceWorker|navigator\.storage|"
            r"BroadcastChannel|XMLHttpRequest|WebSocket|sendBeacon|new\s+Image\s*\(|\beval\s*\(|new\s+Function\s*\(|document\.write|https?://")
    PROHIBIDO = re.compile(BASE + r"|\bfetch\s*\(")
    PROHIBIDO_SALVO_FETCH = re.compile(BASE)

    def test_ningun_script_guarda_datos_ni_pide_nada_a_la_red(self):
        encontrados = []
        for ruta in list(TESTS.glob("*.js")) + list(TESTS.glob("*/app.js")):
            if ruta.parent.name == "_plantilla":
                continue
            texto = re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), ruta.read_text(encoding="utf-8"), flags=re.S)
            regla = self.PROHIBIDO_SALVO_FETCH if ruta.parent.name in PIDEN_AL_MISMO_SITIO else self.PROHIBIDO
            for n, linea in enumerate(texto.splitlines(), 1):
                limpia = re.sub(r"//.*$", "", linea)                       # los comentarios pueden nombrarlo para explicar la regla
                if regla.search(limpia):
                    encontrados.append(f"{ruta.relative_to(RAIZ)}:{n}: {linea.strip()[:90]}")
        self.assertEqual(encontrados, [])


class PeticionesAlMismoSitio(unittest.TestCase):
    """El test de velocidad y el de imágenes usan fetch, pero solo con rutas relativas (el propio sitio) y sin caché."""

    def test_solo_rutas_relativas_y_sin_cache(self):
        for slug in PIDEN_AL_MISMO_SITIO:
            texto = (TESTS / slug / "app.js").read_text(encoding="utf-8")
            llamadas = [l for l in texto.splitlines() if re.search(r"\bfetch\s*\(", l) and not l.strip().startswith(("/*", "//", "*"))]
            with self.subTest(test=slug):
                self.assertTrue(llamadas, "se esperaba alguna petición")
                for linea in llamadas:
                    self.assertNotRegex(linea, r"https?:|//[a-z]", linea)
                    self.assertIn("no-store", linea, "las peticiones deben ir sin caché del navegador")

    def test_el_archivo_de_prueba_de_velocidad_pesa_lo_que_dice(self):
        self.assertEqual((TESTS / "test-de-velocidad-de-internet" / "prueba.bin").stat().st_size, 1048576)

    def test_el_banco_de_imagenes_esta_completo_si_el_test_se_publica(self):
        for slug in NECESITAN_IMAGENES:
            if cargar(slug)["estado"] != "publicado":
                continue
            carpeta = TESTS / slug
            banco = json.loads((carpeta / "banco.json").read_text(encoding="utf-8"))["imagenes"]
            self.assertGreaterEqual(len(banco), 12, "hacen falta al menos 12 imágenes para que cada partida cambie")
            self.assertGreaterEqual(len([b for b in banco if b["tipo"] == "real"]), 6)
            self.assertGreaterEqual(len([b for b in banco if b["tipo"] == "ia"]), 6)
            for b in banco:
                self.assertIn(b["tipo"], ("real", "ia"))
                self.assertTrue((carpeta / b["archivo"]).is_file(), f"falta la imagen {b['archivo']}")
                for campo in ("titulo", "autor", "fuente", "licencia"):
                    self.assertTrue(str(b.get(campo, "")).strip(), f"{b['archivo']}: falta «{campo}»")


@unittest.skipUnless(shutil.which("node"), "hace falta Node para ejecutar base.js")
class PiezasDeCalculo(unittest.TestCase):
    """Las funciones puras de tests/base.js, ejecutadas con Node (sin navegador)."""

    def calcular(self, expresion):
        codigo = (f"(0, eval)(require('fs').readFileSync({json.dumps(str(TESTS / 'base.js'))}, 'utf8'));"
                  f"console.log(JSON.stringify({expresion}));")
        r = subprocess.run(["node", "-e", codigo], capture_output=True, text=True, check=True)
        return json.loads(r.stdout)

    def test_estadistica(self):
        self.assertEqual(self.calcular("TT.media([1,2,3,4])"), 2.5)
        self.assertEqual(self.calcular("TT.mediana([5,1,3])"), 3)
        self.assertEqual(self.calcular("TT.mediana([4,1,3,2])"), 2.5)
        self.assertEqual(self.calcular("TT.desviacion([2,4,4,4,5,5,7,9])"), 2)
        self.assertEqual(self.calcular("TT.percentil([1,2,3,4,5], 0.5)"), 3)
        self.assertEqual(self.calcular("TT.media([])"), 0)

    def test_ventana_de_tiempo(self):
        self.assertEqual(self.calcular("TT.ventanaMax([0, 0.1, 0.2, 0.9, 1.0, 1.05, 3], 1)"), 5)
        self.assertEqual(self.calcular("TT.ventanaMax([0, 1, 2, 3], 1)"), 1)
        self.assertEqual(self.calcular("TT.ventanaMax([], 1)"), 0)
        self.assertEqual(self.calcular("TT.intervalos([0, 0.5, 2])"), [0.5, 1.5])

    def test_rangos_y_formato(self):
        tabla = "[[0,'A'],[4,'B'],[8,'C']]"
        self.assertEqual(self.calcular(f"TT.rango(3.99, {tabla}).nombre"), "A")
        self.assertEqual(self.calcular(f"TT.rango(4, {tabla}).nombre"), "B")
        self.assertEqual(self.calcular(f"TT.rango(99, {tabla}).nombre"), "C")
        self.assertEqual(self.calcular("TT.fmt(5, 2)"), "5,00")
        self.assertEqual(self.calcular("TT.fmt(1234.5, 1)"), "1234,5")
        self.assertEqual(self.calcular("TT.fmt(NaN, 1)"), "—")
        self.assertEqual(self.calcular("TT.barajar([1,2,3,4,5]).sort().join()"), "1,2,3,4,5")


if __name__ == "__main__":
    unittest.main()

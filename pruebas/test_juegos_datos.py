# -*- coding: utf-8 -*-
"""Pruebas del CONTENIDO de los 81 juegos: que los archivos JSON de preguntas, acertijos, palabras, mapas… estén bien formados.
Así, al añadir una pregunta o un acertijo a mano, un error (una opción repetida, una respuesta que no está entre las opciones,
una palabra de longitud equivocada) salta aquí y no delante de un jugador.

También vigilan las reglas del encargo para los juegos:
  · cada juego trae su ficha completa, su texto original para Google (varios apartados y preguntas frecuentes) y su botón de volver;
  · NINGÚN juego guarda nada en el dispositivo (ni localStorage, sessionStorage, IndexedDB, cookies ni cachés), ni llama a servidores
    de terceros; los datos solo se leen de archivos estáticos del propio sitio.

Ejecutar: python3 pruebas/test_juegos_datos.py
"""
import json
import re
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
JUEGOS = RAIZ / "juegos"
sys.path.insert(0, str(RAIZ))

ORDEN_DEL_ENCARGO = [
    "palabra-infinita", "una-entre-un-millon", "conexiones", "que-palabra-soy", "el-intruso", "mente-matematica", "quien-soy",
    "memoria-visual", "acertijos", "mayor-menor", "cultura-general", "donde-esta", "palabras-encadenadas", "velocidad-mental",
    "detecta-el-patron", "el-impostor", "ordena-la-historia", "reflejos", "2048", "el-superviviente",
    # segunda tanda (orden 21 a 50)
    "sudoku", "buscaminas", "banderas", "serpiente", "ahorcado", "tres-en-raya", "cuatro-en-raya", "capitales", "test-de-clics", "parejas",
    "bloques-que-caen", "ladrillos", "repite-la-secuencia", "recuerda-el-numero", "anagramas", "sopa-de-letras", "torre-de-hanoi", "apaga-las-luces",
    "puzle-deslizante", "codigo-secreto",
    "las-cifras", "test-de-mecanografia", "tablas-de-multiplicar", "provincias-de-espana", "verdadero-o-falso", "quiz-de-ciencia", "quiz-de-historia",
    "refranes", "faltas-de-ortografia", "sinonimos-y-antonimos",
]

# Juegos añadidos después del encargo de los 50 (orden 51 en adelante): primero los 9 sueltos (51–59) y después la tanda de 10 (60–69:
# cinco de fútbol y cinco variados) y la tanda de 12 de fútbol (70–81: diez de cultura y adivinar y dos para jugar).
AMPLIACION = ["piedra-papel-o-tijera", "adivina-el-numero", "juego-del-nim", "tabla-de-schulte", "inundacion",
             "laberinto", "el-24", "ordena-los-frascos", "encuentra-el-color",
             "quiz-de-futbol", "que-futbolista-soy", "tanda-de-penaltis", "estadios-de-futbol", "reglas-del-futbol",
             "hundir-la-flota", "nonogramas", "reversi", "pilla-al-topo", "raquetas",
             "adivina-el-once", "futbolista-oculto", "camino-de-clubes", "apodos-de-clubes", "balon-de-oro", "goleadores-historicos",
             "entrenador-campeon", "intruso-del-club", "de-que-pais-es-el-club", "ahorcado-de-futbol", "tiro-libre", "regates"]
TODOS = ORDEN_DEL_ENCARGO + AMPLIACION
CATEGORIAS = {"futbol", "palabras", "logica", "cultura-general", "matematicas", "memoria", "geografia", "habilidad", "arcade"}


def cargar(ruta: str) -> dict:
    return json.loads((JUEGOS / ruta).read_text(encoding="utf-8"))


def norm(t: str) -> str:
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", t.lower()) if unicodedata.category(c) != "Mn").strip()


class CatalogoDeJuegos(unittest.TestCase):
    def test_estan_los_cincuenta_juegos_con_el_orden_del_encargo(self):
        self.assertEqual(len(ORDEN_DEL_ENCARGO), 50)
        self.assertEqual(len(set(ORDEN_DEL_ENCARGO)), 50)
        fichas = {}
        for slug in TODOS:
            ruta = JUEGOS / slug / "ficha.json"
            self.assertTrue(ruta.is_file(), f"falta juegos/{slug}/ficha.json")
            fichas[slug] = json.loads(ruta.read_text(encoding="utf-8"))
        for n, slug in enumerate(ORDEN_DEL_ENCARGO, 1):
            self.assertEqual(fichas[slug]["orden"], n, slug)
        existentes = {p.name for p in JUEGOS.iterdir() if p.is_dir() and (p / "ficha.json").is_file() and not p.name.startswith("_")}
        for n, slug in enumerate(AMPLIACION, 51):
            self.assertEqual(cargar(f"{slug}/ficha.json")["orden"], n, slug)
        self.assertEqual(existentes, set(ORDEN_DEL_ENCARGO) | set(AMPLIACION), "hay juegos que no están en el encargo ni en la ampliación, o faltan")

    def test_cada_ficha_esta_completa(self):
        for slug in ORDEN_DEL_ENCARGO + AMPLIACION:
            f = cargar(f"{slug}/ficha.json")
            with self.subTest(juego=slug):
                self.assertEqual(f["estado"], "publicado")
                self.assertIn(f["categoria"], CATEGORIAS)
                self.assertIn(f["dificultad"], ("facil", "media", "dificil"))
                self.assertTrue(f["duracion"].strip())
                self.assertTrue(40 <= len(f["descripcion"]) <= 160, f"descripción de {len(f['descripcion'])} caracteres")
                self.assertTrue(f["etiquetas"])

    def test_las_descripciones_son_distintas(self):
        descripciones = [cargar(f"{s}/ficha.json")["descripcion"] for s in ORDEN_DEL_ENCARGO + AMPLIACION]
        self.assertEqual(len(set(descripciones)), len(descripciones))
        titulos = [cargar(f"{s}/ficha.json")["titulo"] for s in ORDEN_DEL_ENCARGO + AMPLIACION]
        self.assertEqual(len(set(titulos)), len(titulos))

    def test_se_usan_las_nueve_categorias(self):
        usadas = {cargar(f"{s}/ficha.json")["categoria"] for s in ORDEN_DEL_ENCARGO + AMPLIACION}
        self.assertEqual(usadas, CATEGORIAS)

    def test_cada_juego_tiene_texto_propio_con_apartados_y_preguntas_frecuentes(self):
        for slug in TODOS:
            html = (JUEGOS / slug / "pagina.html").read_text(encoding="utf-8")
            with self.subTest(juego=slug):
                self.assertGreaterEqual(html.count("<h2"), 4, "el texto para Google necesita al menos cuatro apartados")
                self.assertIn("<details", html, "faltan las preguntas frecuentes")
                self.assertIn("<noscript", html, "falta el aviso para quien no tiene JavaScript")
                palabras = len(re.sub(r"<[^>]+>", " ", html).split())
                self.assertGreaterEqual(palabras, 220, f"solo {palabras} palabras de texto")

    def test_los_textos_no_se_repiten_entre_juegos(self):
        """Contenido original por juego: ninguna frase larga puede aparecer idéntica en dos juegos."""
        vistas = {}
        for slug in TODOS:
            html = (JUEGOS / slug / "pagina.html").read_text(encoding="utf-8")
            texto = re.sub(r"<[^>]+>", "\n", html)
            for frase in re.split(r"(?<=[.!?])\s+", texto):
                frase = " ".join(frase.split())
                if len(frase) >= 80:
                    self.assertNotIn(frase, vistas, f"frase repetida en {slug} y {vistas.get(frase)}: «{frase[:60]}…»")
                    vistas[frase] = slug

    def test_cada_juego_tiene_su_app_js_y_su_contenedor(self):
        for slug in TODOS:
            with self.subTest(juego=slug):
                self.assertTrue((JUEGOS / slug / "app.js").is_file())
                html = (JUEGOS / slug / "pagina.html").read_text(encoding="utf-8")
                self.assertRegex(html, r'<div class="pantalla[^"]*" id="[a-z0-9]+"')

    def test_no_quedan_app_css_vacios_ni_textos_de_relleno(self):
        for slug in TODOS:
            for archivo in (JUEGOS / slug).glob("*"):
                if archivo.suffix in (".html", ".js", ".css", ".json"):
                    texto = archivo.read_text(encoding="utf-8")
                    self.assertNotRegex(texto, r"\bESCRIBE\b|(?i:lorem ipsum)|TODO|FIXME", str(archivo))
            css = JUEGOS / slug / "app.css"
            if css.is_file():
                self.assertTrue(css.read_text(encoding="utf-8").strip(), f"{css} está vacío: bórralo")


class SinGuardarNada(unittest.TestCase):
    """Regla del encargo: todo vive en la memoria de la pestaña."""

    PROHIBIDO = re.compile(
        r"localStorage|sessionStorage|indexedDB|openDatabase|document\.cookie|cookieStore|caches\.|serviceWorker|navigator\.storage|"
        r"BroadcastChannel|XMLHttpRequest|WebSocket|sendBeacon|new\s+Image\s*\(|\beval\s*\(|new\s+Function\s*\(|document\.write")

    def archivos_js(self):
        yield from JUEGOS.glob("*.js")
        yield from JUEGOS.glob("*/app.js")
        yield from (RAIZ / "comun").rglob("*.js")

    def test_ningun_script_guarda_datos_en_el_dispositivo(self):
        encontrados = []
        for ruta in self.archivos_js():
            texto = ruta.read_text(encoding="utf-8")
            # se quitan los comentarios: ahí sí se puede decir «no usa localStorage»
            sin_comentarios = re.sub(r"/\*.*?\*/|(?<![:\"'])//[^\n]*", "", texto, flags=re.S)
            for m in self.PROHIBIDO.finditer(sin_comentarios):
                encontrados.append(f"{ruta.relative_to(RAIZ)}: {m.group(0)}")
        self.assertEqual(encontrados, [])

    def test_las_peticiones_solo_van_a_archivos_del_propio_sitio(self):
        for ruta in self.archivos_js():
            texto = ruta.read_text(encoding="utf-8")
            for m in re.finditer(r"fetch\(([^)]*)\)", texto):
                self.assertNotRegex(m.group(1), r"https?://", f"{ruta}: fetch a una dirección externa")
        for slug in TODOS:
            html = (JUEGOS / slug / "pagina.html").read_text(encoding="utf-8")
            self.assertNotRegex(html, r'(src|href)="https?://[^"]*"(?![^>]*rel="noopener)', f"{slug}: recurso externo sin rel=noopener")
            self.assertNotRegex(html, r"<script|<iframe|<form", f"{slug}: no debe llevar scripts, iframes ni formularios propios")


class PalabrasDelJuegoDeLetras(unittest.TestCase):
    def test_longitudes_y_unicidad(self):
        longitudes = cargar("datos/palabras.json")["longitudes"]
        self.assertEqual(sorted(longitudes), ["4", "5", "6", "7"])
        for n, grupo in longitudes.items():
            with self.subTest(letras=n):
                todas = grupo["soluciones"] + grupo["validas"]
                self.assertEqual(len(todas), len(set(todas)), "palabras repetidas")
                self.assertTrue(all(len(p) == int(n) for p in todas), "hay palabras de otra longitud")
                self.assertTrue(all(p == p.lower() and re.fullmatch(r"[a-záéíóúüñ]+", p) for p in todas), "caracteres no permitidos")
                self.assertGreaterEqual(len(grupo["soluciones"]), 200)

    def test_las_palabras_de_la_palabra_infinita_y_encadenadas_existen_en_la_lista(self):
        self.assertTrue((JUEGOS / "datos/palabras.json").is_file())
        for slug in ("palabra-infinita", "palabras-encadenadas"):
            js = (JUEGOS / slug / "app.js").read_text(encoding="utf-8")
            self.assertIn("palabras.json", js, slug)


class PreguntasYAcertijos(unittest.TestCase):
    def test_cultura_general(self):
        preguntas = cargar("cultura-general/preguntas.json")["preguntas"]
        self.assertGreaterEqual(len(preguntas), 60)
        enunciados = [p["p"] for p in preguntas]
        self.assertEqual(len(enunciados), len(set(enunciados)), "preguntas repetidas")
        for p in preguntas:
            with self.subTest(pregunta=p["p"][:40]):
                self.assertEqual(len(p["o"]), 4)
                self.assertEqual(len({norm(o) for o in p["o"]}), 4, "opciones repetidas")
                self.assertIn(p["c"], range(4))
                self.assertTrue(p["e"].strip() and p["t"].strip())

    def test_acertijos(self):
        acertijos = cargar("acertijos/acertijos.json")["acertijos"]
        self.assertGreaterEqual(len(acertijos), 30)
        self.assertEqual(len({a["p"] for a in acertijos}), len(acertijos))
        for a in acertijos:
            with self.subTest(acertijo=a["p"][:40]):
                self.assertTrue(a["r"] and all(r.strip() for r in a["r"]))
                self.assertTrue(a["pista"].strip() and a["e"].strip())
                # la respuesta no debe aparecer escrita en el enunciado ni en la pista
                for r in a["r"]:
                    if len(r) >= 5:
                        self.assertNotIn(norm(r), norm(a["pista"]), "la pista regala la respuesta")

    def test_que_palabra_soy(self):
        palabras = cargar("que-palabra-soy/palabras.json")["palabras"]
        self.assertGreaterEqual(len(palabras), 30)
        self.assertEqual(len({p["d"] for p in palabras}), len(palabras))
        for p in palabras:
            with self.subTest(descripcion=p["d"][:40]):
                self.assertTrue(p["r"] and p["e"].strip())
                for r in p["r"]:
                    self.assertNotIn(norm(r), norm(p["d"]).split(), "la descripción contiene la respuesta")

    def test_quien_soy(self):
        elementos = cargar("quien-soy/personajes.json")["elementos"]
        self.assertGreaterEqual(len(elementos), 20)
        self.assertEqual(len({e["n"] for e in elementos}), len(elementos))
        for e in elementos:
            with self.subTest(personaje=e["n"]):
                self.assertGreaterEqual(len(e["p"]), 4, "al menos cuatro pistas")
                self.assertIn(e["n"], e["r"])
                for pista in e["p"][:-1]:
                    for r in e["r"]:
                        if len(r) >= 5:
                            self.assertNotIn(norm(r), norm(pista), "una pista intermedia regala el nombre")

    def test_el_intruso(self):
        conjuntos = cargar("el-intruso/conjuntos.json")["conjuntos"]
        self.assertGreaterEqual(len(conjuntos), 40)
        for c in conjuntos:
            with self.subTest(tema=c["t"], intruso=c["i"]):
                self.assertGreaterEqual(len(c["g"]), 3)
                self.assertNotIn(norm(c["i"]), [norm(x) for x in c["g"]])
                self.assertEqual(len(c["g"]), len(set(map(norm, c["g"]))))
                self.assertTrue(c["e"].strip())

    def test_el_impostor(self):
        conjuntos = cargar("el-impostor/afirmaciones.json")["conjuntos"]
        self.assertGreaterEqual(len(conjuntos), 20)
        for c in conjuntos:
            with self.subTest(tema=c["t"], falsa=c["f"][:30]):
                self.assertGreaterEqual(len(c["v"]), 3)
                self.assertNotIn(c["f"], c["v"])
                self.assertTrue(c["e"].strip())

    def test_conexiones(self):
        puzzles = cargar("conexiones/puzzles.json")["puzzles"]
        self.assertGreaterEqual(len(puzzles), 10)
        self.assertEqual(len({p["id"] for p in puzzles}), len(puzzles))
        for p in puzzles:
            with self.subTest(puzzle=p["id"]):
                self.assertEqual(len(p["grupos"]), 4)
                palabras = [w for g in p["grupos"] for w in g["p"]]
                self.assertEqual(len(palabras), 16)
                self.assertEqual(len({norm(w) for w in palabras}), 16, "una palabra está repetida en el puzle")
                for g in p["grupos"]:
                    self.assertEqual(len(g["p"]), 4)
                    self.assertTrue(g["n"].strip() and g["e"].strip())
                self.assertEqual(len({g["n"] for g in p["grupos"]}), 4)

    def test_ordena_la_historia(self):
        conjuntos = cargar("ordena-la-historia/cronologias.json")["conjuntos"]
        self.assertGreaterEqual(len(conjuntos), 12)
        for c in conjuntos:
            with self.subTest(tema=c["t"]):
                anios = [e["a"] for e in c["e"]]
                self.assertGreaterEqual(len(anios), 5, "cada ronda necesita 5 hechos")
                self.assertEqual(len(anios), len(set(anios)), "dos hechos del mismo año no se pueden ordenar")
                self.assertTrue(all(isinstance(a, int) for a in anios))
                nombres = [e["n"] for e in c["e"]]
                self.assertEqual(len(nombres), len(set(nombres)))


class UnaEntreUnMillon(unittest.TestCase):
    def test_preguntas_con_rareza(self):
        """«n» es «la daría 1 de cada n personas»: cuanto mayor, más rara y más puntos. No hace falta que estén ordenadas."""
        datos = cargar("una-entre-un-millon/preguntas.json")
        umbrales = [n[0] for n in datos["niveles"]]
        self.assertEqual(umbrales, sorted(umbrales))
        self.assertEqual(umbrales[0], 0)
        self.assertEqual(len({p["id"] for p in datos["preguntas"]}), len(datos["preguntas"]))
        for p in datos["preguntas"]:
            with self.subTest(pregunta=p["pregunta"]):
                self.assertGreaterEqual(len(p["respuestas"]), 15)
                # una misma respuesta no puede estar en dos entradas distintas (las formas con y sin tilde de UNA entrada sí valen)
                por_entrada = [{norm(t) for t in r["t"]} for r in p["respuestas"]]
                todas = [x for formas in por_entrada for x in formas]
                self.assertEqual(len(todas), len(set(todas)), "una misma respuesta aparece en dos entradas")
                for r in p["respuestas"]:
                    self.assertTrue(isinstance(r["n"], int) and r["n"] >= 1)
                    self.assertTrue(r["t"] and all(t.strip() for t in r["t"]))
                self.assertGreaterEqual(max(r["n"] for r in p["respuestas"]), 1000, "falta alguna respuesta rara que dé puntos altos")


def alias_ambiguos(jugadores) -> dict:
    """Alias (sin tildes ni mayúsculas) que sirven para dos jugadores distintos. Repetir un alias dentro del MISMO jugador no cuenta."""
    por_alias = {}
    for j in jugadores:
        for a in j["r"]:
            por_alias.setdefault(norm(a), set()).add(j["n"])
    return {a: n for a, n in por_alias.items() if len(n) > 1}


class DatosDeFutbol(unittest.TestCase):
    """Los diez juegos de fútbol 70–79 leen JSON propio: sin duplicados que hagan ambigua una respuesta y con las cifras coherentes."""

    def test_adivina_el_once(self):
        onces = cargar("adivina-el-once/onces.json")["onces"]
        self.assertEqual(len(onces), 9)
        for o in onces:
            with self.subTest(final=o["t"]):
                self.assertEqual(sum(len(f) for f in o["filas"]), 11, "un once tiene once jugadores")
                self.assertEqual(len(o["filas"][0]), 1, "la primera fila es el portero")
                nombres = [j["n"] for f in o["filas"] for j in f]
                self.assertEqual(len(nombres), len(set(nombres)))
                self.assertEqual(alias_ambiguos([j for f in o["filas"] for j in f]), {}, "un apellido sirve para dos jugadores del mismo once")
                for j in (j for f in o["filas"] for j in f):
                    self.assertTrue(j["r"] and norm(j["n"]) in {norm(a) for a in j["r"]} or any(norm(a) in norm(j["n"]) for a in j["r"]))
                self.assertTrue(all(o[k] for k in ("e", "v", "res", "f")))

    def test_futbolista_oculto(self):
        lista = cargar("futbolista-oculto/futbolistas.json")["futbolistas"]
        self.assertGreaterEqual(len(lista), 80)
        self.assertEqual(len({norm(j["n"]) for j in lista}), len(lista))
        self.assertEqual(alias_ambiguos(lista), {}, "un alias sirve para dos futbolistas")
        for j in lista:
            with self.subTest(jugador=j["n"]):
                self.assertIn(j["pos"], {"Portero", "Defensa", "Centrocampista", "Delantero"})
                self.assertTrue(1920 <= j["y"] <= 2010 and j["p"].strip())
                self.assertTrue(all(isinstance(j[k], bool) for k in ("m", "c", "b")))
        self.assertGreaterEqual(sum(j["b"] for j in lista), 10)

    def test_camino_de_clubes(self):
        lista = cargar("camino-de-clubes/caminos.json")["jugadores"]
        self.assertGreaterEqual(len(lista), 50)
        self.assertEqual(len({norm(j["n"]) for j in lista}), len(lista))
        self.assertEqual(alias_ambiguos(lista), {}, "un alias sirve para dos futbolistas")
        cadenas = [tuple(j["c"]) for j in lista]
        self.assertEqual(len(cadenas), len(set(cadenas)), "dos futbolistas con exactamente la misma cadena de clubes: la ronda sería ambigua")
        for j in lista:
            with self.subTest(jugador=j["n"]):
                self.assertGreaterEqual(len(j["c"]), 2)
                self.assertTrue(all(c.strip() for c in j["c"]) and all(a != b for a, b in zip(j["c"], j["c"][1:])), "dos clubes seguidos iguales")
                self.assertIn(j["pos"], {"portero", "defensa", "centrocampista", "delantero"})

    def test_apodos_de_clubes(self):
        lista = cargar("apodos-de-clubes/apodos.json")["apodos"]
        self.assertGreaterEqual(len(lista), 60)
        apodos = [norm(x["a"]) for x in lista]
        self.assertEqual(len(apodos), len(set(apodos)), "un apodo aparece dos veces: sería ambiguo")
        for x in lista:
            self.assertTrue(x["a"].strip() and x["c"].strip() and x["p"].strip())
        self.assertGreaterEqual(len({x["c"] for x in lista}), 40)

    def test_balon_de_oro(self):
        lista = cargar("balon-de-oro/premios.json")["premios"]
        anios = [x["a"] for x in lista]
        self.assertEqual(anios, sorted(set(anios)))
        self.assertEqual(anios[0], 1956)
        self.assertNotIn(2020, anios, "en 2020 no se entregó")
        self.assertEqual(set(range(1956, anios[-1] + 1)) - set(anios), {2020})
        cuenta = {}
        for x in lista:
            cuenta[x["n"]] = cuenta.get(x["n"], 0) + 1
        self.assertEqual(cuenta["Lionel Messi"], 8)
        self.assertEqual(cuenta["Cristiano Ronaldo"], 5)

    def test_goleadores_historicos(self):
        datos = cargar("goleadores-historicos/goleadores.json")
        temporadas = [x["t"] for x in datos["pichichi"]]
        self.assertEqual(len(temporadas), len(set(temporadas)))
        self.assertEqual(temporadas[0], "2004-05")
        for a, b in zip(temporadas, temporadas[1:]):
            self.assertEqual(int(b[:4]), int(a[:4]) + 1, "faltan temporadas seguidas del Pichichi")
        anios = [x["t"] for x in datos["mundiales"]]
        self.assertEqual(anios, sorted(set(anios)))
        self.assertNotIn(1994, anios, "en 1994 hubo dos máximos goleadores")
        for x in datos["pichichi"] + datos["mundiales"]:
            self.assertTrue(isinstance(x["g"], int) and 4 <= x["g"] <= 60 and x["n"].strip())

    def test_entrenador_campeon(self):
        lista = cargar("entrenador-campeon/campeones.json")["campeones"]
        self.assertEqual(lista[0]["t"], "1992-93")
        temporadas = [x["t"] for x in lista]
        self.assertEqual(len(temporadas), len(set(temporadas)))
        for a, b in zip(temporadas, temporadas[1:]):
            self.assertEqual(int(b[:4]), int(a[:4]) + 1)
        self.assertTrue(all(x["c"].strip() and x["e"].strip() for x in lista))

    def test_intruso_del_club(self):
        grupos = cargar("intruso-del-club/grupos.json")["grupos"]
        self.assertGreaterEqual(len(grupos), 12)
        self.assertEqual(len({g["t"] for g in grupos}), len(grupos))
        for g in grupos:
            with self.subTest(grupo=g["t"]):
                self.assertGreaterEqual(len(g["m"]), 6)
                self.assertEqual(len({norm(n) for n in g["m"]}), len(g["m"]))
                intrusos = {norm(f["n"]) for f in g["f"]}
                self.assertGreaterEqual(len(intrusos), 3)
                self.assertFalse(intrusos & {norm(n) for n in g["m"]}, "un intruso también está en el grupo")
                self.assertTrue(all(f["e"].strip() for f in g["f"]))

    def test_de_que_pais_es_el_club(self):
        lista = cargar("de-que-pais-es-el-club/clubes.json")["clubes"]
        self.assertGreaterEqual(len(lista), 90)
        self.assertEqual(len({norm(x["n"]) for x in lista}), len(lista))
        for x in lista:
            self.assertTrue(x["n"].strip() and x["p"].strip() and x["c"].strip())
        self.assertGreaterEqual(len({x["p"] for x in lista}), 15)

    def test_ahorcado_de_futbol(self):
        lista = cargar("ahorcado-de-futbol/palabras.json")["palabras"]
        self.assertGreaterEqual(len(lista), 100)
        palabras = [norm(x["p"]) for x in lista]
        self.assertEqual(len(palabras), len(set(palabras)))
        for x in lista:
            with self.subTest(palabra=x["p"]):
                self.assertRegex(norm(x["p"]), r"^[a-z]{4,14}$", "solo letras y sin espacios")
                self.assertIn(x["t"], {"Jugador", "Club", "Estadio", "Selección", "Término"})


class MayorMenorYMapa(unittest.TestCase):
    def test_mayor_o_menor(self):
        for c in cargar("mayor-menor/datos.json")["categorias"]:
            with self.subTest(categoria=c["id"]):
                nombres = [i[0] for i in c["items"]]
                valores = [i[1] for i in c["items"]]
                self.assertEqual(len(nombres), len(set(nombres)))
                self.assertGreaterEqual(len(set(valores)), 12, "pocos valores distintos para jugar muchas rondas")
                self.assertTrue(c["unidad"].strip())
                self.assertTrue(all(isinstance(v, (int, float)) for v in valores))

    def test_donde_esta(self):
        lugares = cargar("donde-esta/lugares.json")["lugares"]
        self.assertGreaterEqual(len(lugares), 40)
        self.assertEqual(len({l["n"] for l in lugares}), len(lugares))
        for l in lugares:
            with self.subTest(lugar=l["n"]):
                self.assertTrue(-60 <= l["lat"] <= 84, "fuera de la zona que dibuja el mapa (84° N a 60° S)")
                self.assertTrue(-180 <= l["lon"] <= 180)
                self.assertTrue(l["t"].strip())

    def test_el_mapa_son_poligonos_validos(self):
        mapa = cargar("donde-esta/mapa.json")
        self.assertGreaterEqual(len(mapa["tierras"]), 30)
        for zona in ("tierras", "mares"):
            for nombre, puntos in mapa[zona].items():
                with self.subTest(zona=zona, nombre=nombre):
                    self.assertGreaterEqual(len(puntos), 3)
                    for lon, lat in puntos:
                        self.assertTrue(-180 <= lon <= 180 and -90 <= lat <= 90, f"punto fuera de rango: {lon}, {lat}")


class DatosDeLaSegundaTanda(unittest.TestCase):
    """Los archivos JSON de los juegos 21 a 50: sin duplicados, sin opciones repetidas y con la respuesta donde toca."""

    def quiz_con_correcta_primera(self, ruta: str, minimo: int):
        preguntas = cargar(ruta)["preguntas"]
        self.assertGreaterEqual(len(preguntas), minimo)
        enunciados = [p["p"] for p in preguntas]
        self.assertEqual(len(enunciados), len(set(enunciados)), "preguntas repetidas")
        for p in preguntas:
            with self.subTest(pregunta=p["p"][:40]):
                self.assertEqual(len(p["o"]), 4)
                self.assertEqual(len({norm(o) for o in p["o"]}), 4, "opciones repetidas")
                self.assertEqual(p["c"], 0, "la respuesta correcta va siempre la primera: el juego baraja al mostrarla")
                self.assertTrue(p["e"].strip() and p["t"].strip())

    def test_quiz_de_futbol(self):
        self.quiz_con_correcta_primera("quiz-de-futbol/preguntas.json", 60)

    def test_reglas_del_futbol(self):
        self.quiz_con_correcta_primera("reglas-del-futbol/preguntas.json", 40)

    def test_que_futbolista_soy(self):
        jugadores = cargar("que-futbolista-soy/futbolistas.json")["futbolistas"]
        self.assertGreaterEqual(len(jugadores), 30)
        self.assertEqual(len({j["n"] for j in jugadores}), len(jugadores), "futbolistas repetidos")
        for j in jugadores:
            with self.subTest(futbolista=j["n"]):
                self.assertEqual(len(j["p"]), 5, "cinco pistas, de la más difícil a la más fácil")
                self.assertTrue(all(x.strip() and x.strip().endswith(".") for x in j["p"]), "cada pista es una frase terminada en punto")
                self.assertGreaterEqual(len(j["r"]), 2, "hacen falta el apellido y el nombre completo como respuestas")
                self.assertIn(norm(j["n"]), [norm(x) for x in j["r"]], "el nombre completo debe aceptarse")
                # ninguna pista puede contener el nombre ni el apellido (los apodos, en cambio, pueden ser una pista más)
                nombres = [t for t in norm(j["n"]).replace("-", " ").split() if len(t) >= 4 and t not in ("jose", "luis", "juan", "paul", "carlos", "cesar", "pedro")]
                for pista in j["p"]:
                    palabras = norm(pista).replace("«", " ").replace("»", " ").replace(",", " ").replace(".", " ").split()
                    for t in nombres:
                        self.assertNotIn(t, palabras, f"la pista «{pista[:50]}…» nombra al futbolista ({t})")

    def test_estadios_de_futbol(self):
        estadios = cargar("estadios-de-futbol/estadios.json")["estadios"]
        self.assertGreaterEqual(len(estadios), 50)
        self.assertEqual(len({e["n"] for e in estadios}), len(estadios), "estadios repetidos")
        for e in estadios:
            with self.subTest(estadio=e["n"]):
                self.assertTrue(e["n"].strip() and e["c"].strip() and e["p"].strip())
                self.assertTrue(e["e"] is None or e["e"].strip())
                self.assertTrue(e["d"] is None or e["d"].strip().endswith("."))
        self.assertGreaterEqual(len({e["c"] for e in estadios}), 25, "las falsas respuestas de ciudad necesitan variedad")
        self.assertGreaterEqual(len({e["e"] for e in estadios if e["e"]}), 25, "las falsas respuestas de equipo necesitan variedad")

    def test_quiz_de_ciencia(self):
        self.quiz_con_correcta_primera("quiz-de-ciencia/preguntas.json", 60)

    def test_quiz_de_historia(self):
        self.quiz_con_correcta_primera("quiz-de-historia/preguntas.json", 60)

    def test_verdadero_o_falso(self):
        afirmaciones = cargar("verdadero-o-falso/afirmaciones.json")["afirmaciones"]
        self.assertGreaterEqual(len(afirmaciones), 60)
        self.assertEqual(len({a["p"] for a in afirmaciones}), len(afirmaciones), "afirmaciones repetidas")
        verdaderas = sum(1 for a in afirmaciones if a["v"] is True)
        falsas = sum(1 for a in afirmaciones if a["v"] is False)
        self.assertEqual(verdaderas + falsas, len(afirmaciones), "«v» debe ser verdadero o falso, nada más")
        self.assertGreaterEqual(min(verdaderas, falsas), 25, "el juego reparte 7 u 8 verdaderas por partida: necesita bastantes de cada tipo")
        for a in afirmaciones:
            with self.subTest(afirmacion=a["p"][:40]):
                self.assertTrue(a["p"].strip().endswith("."))
                self.assertTrue(a["e"].strip() and a["t"].strip())

    def test_refranes(self):
        refranes = cargar("refranes/refranes.json")["refranes"]
        self.assertGreaterEqual(len(refranes), 60)
        self.assertEqual(len({r["p"] for r in refranes}), len(refranes), "comienzos de refrán repetidos")
        self.assertEqual(len({norm(r["p"] + " " + r["o"][0]) for r in refranes}), len(refranes), "refranes repetidos")
        for r in refranes:
            with self.subTest(refran=r["p"]):
                self.assertEqual(len(r["o"]), 4)
                self.assertEqual(len({norm(o) for o in r["o"]}), 4, "finales repetidos")
                self.assertEqual(r["c"], 0)
                self.assertTrue(r["e"].strip().endswith("."))

    def test_faltas_de_ortografia(self):
        preguntas = cargar("faltas-de-ortografia/preguntas.json")["preguntas"]
        self.assertGreaterEqual(len(preguntas), 40)
        claves = [(q["p"], q["o"][0]) for q in preguntas]
        self.assertEqual(len(claves), len(set(claves)), "preguntas repetidas")
        huecos = [q for q in preguntas if "___" in q["p"]]
        palabras = [q for q in preguntas if q["p"] == "Palabra bien escrita:"]
        self.assertEqual(len(huecos) + len(palabras), len(preguntas), "toda pregunta es de hueco (___) o «Palabra bien escrita:»")
        self.assertGreaterEqual(len(huecos), 15)
        self.assertGreaterEqual(len(palabras), 15)
        for q in preguntas:
            with self.subTest(pregunta=q["p"][:40] + " " + q["o"][0]):
                self.assertEqual(len(q["o"]), 4)
                self.assertEqual(len(set(q["o"])), 4, "opciones repetidas")
                self.assertEqual(q["c"], 0)
                self.assertTrue(q["e"].strip())
                if "___" in q["p"]:
                    self.assertEqual(q["p"].count("___"), 1)
        # una palabra bien escrita no puede aparecer también como opción mal escrita de otra pregunta idéntica
        correctas = {q["o"][0] for q in palabras}
        for q in palabras:
            self.assertFalse(correctas & set(q["o"][1:]), f"«{q['o'][0]}»: una opción incorrecta es la forma correcta de otra pregunta")

    def test_sinonimos_y_antonimos(self):
        preguntas = cargar("sinonimos-y-antonimos/palabras.json")["preguntas"]
        self.assertGreaterEqual(len(preguntas), 50)
        self.assertEqual({q["k"] for q in preguntas}, {"sinonimo", "antonimo"})
        self.assertGreaterEqual(sum(1 for q in preguntas if q["k"] == "sinonimo"), 20)
        self.assertGreaterEqual(sum(1 for q in preguntas if q["k"] == "antonimo"), 20)
        claves = [(q["k"], norm(q["p"])) for q in preguntas]
        self.assertEqual(len(claves), len(set(claves)), "la misma palabra repetida con el mismo tipo de pregunta")
        for q in preguntas:
            with self.subTest(palabra=q["p"], tipo=q["k"]):
                self.assertEqual(len(q["o"]), 4)
                self.assertEqual(len({norm(o) for o in q["o"]}), 4, "opciones repetidas")
                self.assertNotIn(norm(q["p"]), {norm(o) for o in q["o"]}, "la propia palabra no puede ser una opción")
                self.assertEqual(q["c"], 0)
                self.assertTrue(q["e"].strip())

    def test_provincias_de_espana(self):
        provincias = cargar("provincias-de-espana/provincias.json")["provincias"]
        self.assertEqual(len(provincias), 50, "España tiene 50 provincias")
        self.assertEqual(len({p["n"] for p in provincias}), 50)
        comunidades = {}
        for p in provincias:
            self.assertTrue(p["n"].strip() and p["ca"].strip() and p["cap"].strip())
            comunidades.setdefault(p["ca"], []).append(p["n"])
        self.assertEqual(len(comunidades), 17, "España tiene 17 comunidades autónomas")
        esperado = {"Andalucía": 8, "Aragón": 3, "Asturias": 1, "Islas Baleares": 1, "Canarias": 2, "Cantabria": 1, "Castilla y León": 9,
                    "Castilla-La Mancha": 5, "Cataluña": 4, "Comunidad Valenciana": 3, "Extremadura": 2, "Galicia": 4, "Comunidad de Madrid": 1,
                    "Región de Murcia": 1, "Navarra": 1, "País Vasco": 3, "La Rioja": 1}
        self.assertEqual({c: len(v) for c, v in comunidades.items()}, esperado)
        # el juego necesita 4 respuestas distintas para cada tipo de pregunta
        self.assertGreaterEqual(sum(1 for p in provincias if p["cap"] != p["n"]), 8, "pocas capitales con nombre distinto: no salen las preguntas de capital")
        self.assertGreaterEqual(sum(1 for c in comunidades.values() if len(c) > 1), 10)

    def test_banderas(self):
        banderas = cargar("banderas/banderas.json")["banderas"]
        self.assertGreaterEqual(len(banderas), 40)
        self.assertEqual(len({b["n"] for b in banderas}), len(banderas), "países repetidos")
        for b in banderas:
            with self.subTest(pais=b["n"]):
                self.assertEqual(len(b["v"]), 2)
                self.assertTrue(b["d"].strip())
                self.assertTrue(b["f"], "una bandera sin formas no se dibuja")

    def test_capitales(self):
        paises = cargar("capitales/paises.json")["paises"]
        self.assertGreaterEqual(len(paises), 100)
        self.assertEqual(len({p["p"] for p in paises}), len(paises), "países repetidos")
        self.assertGreaterEqual(len({p["r"] for p in paises}), 5, "faltan regiones")
        for p in paises:
            with self.subTest(pais=p["p"]):
                self.assertTrue(p["p"].strip() and p["c"].strip() and p["r"].strip())
                self.assertNotEqual(norm(p["p"]), "")
        capitales = [norm(p["c"]) for p in paises]
        self.assertEqual(len(capitales), len(set(capitales)), "dos países con la misma capital: las opciones se confundirían")

    def test_sopa_de_letras(self):
        temas = cargar("sopa-de-letras/temas.json")["temas"]
        self.assertGreaterEqual(len(temas), 9)
        self.assertEqual(len({t["id"] for t in temas}), len(temas))
        for t in temas:
            with self.subTest(tema=t["id"]):
                self.assertGreaterEqual(len(t["palabras"]), 12, "hacen falta palabras de sobra para elegir")
                self.assertEqual(len(set(t["palabras"])), len(t["palabras"]), "palabras repetidas")
                for w in t["palabras"]:
                    self.assertRegex(w, r"^[A-ZÑ]{3,12}$", "solo mayúsculas sin tilde, de 3 a 12 letras (la rejilla más grande es de 12×12)")
                # la rejilla fácil es de 9×9: el juego descarta las palabras más largas, y deben quedar suficientes
                self.assertGreaterEqual(sum(1 for w in t["palabras"] if len(w) <= 9), 10, "pocas palabras de 9 letras o menos para la rejilla fácil")

    def test_textos_de_mecanografia(self):
        textos = cargar("test-de-mecanografia/textos.json")["textos"]
        self.assertGreaterEqual(len(textos), 40)
        self.assertEqual(len(set(textos)), len(textos), "textos repetidos")
        for t in textos:
            with self.subTest(texto=t[:40]):
                self.assertTrue(90 <= len(t) <= 175, f"{len(t)} caracteres")
                self.assertNotIn("  ", t, "dos espacios seguidos")
                self.assertEqual(t, t.strip())
                self.assertRegex(t, r"[.!?]$")
        self.assertTrue(any(re.search(r"[áéíóúñ]", t) for t in textos), "tienen que llevar tildes y eñes, como el español real")


if __name__ == "__main__":
    unittest.main()

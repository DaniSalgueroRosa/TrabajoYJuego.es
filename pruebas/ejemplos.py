# -*- coding: utf-8 -*-
"""Elementos de EJEMPLO para probar el sitio con contenido. Solo existen en copias temporales (nunca dentro del proyecto):
sirven para comprobar que meter una carpeta en una sección basta para que aparezca, y para ver cómo queda el sitio lleno.

    python3 pruebas/ejemplos.py <carpeta_destino>     crea una copia del proyecto con ejemplos y la construye
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PARTES = ["comun", "portada", "config", "herramientas", "recursos", "juegos", "tests", "legal"]


def copiar_proyecto(destino: Path, conservar: tuple = ()) -> Path:
    """Copia el proyecto a una carpeta temporal SIN los elementos reales de las secciones (los juegos, las herramientas, las páginas legales…):
    así cada prueba parte de un sitio vacío y no depende del contenido que haya en cada momento. Se conservan los archivos de la
    sección (seccion.json, plantillas, componentes, datos/) y la carpeta _plantilla. Con «conservar» se mantienen los elementos de
    las secciones que se nombren (p. ej. conservar=("legal",) para probar las páginas legales de verdad)."""
    destino = Path(destino)
    if destino.exists():
        shutil.rmtree(destino)
    destino.mkdir(parents=True)

    def ignorar(carpeta, nombres):
        ruta = Path(carpeta)
        fuera = set(shutil.ignore_patterns("__pycache__", ".*")(carpeta, nombres))
        if ruta.parent == RAIZ and ruta.name in conservar:
            return fuera
        if ruta.parent == RAIZ and ruta.name in PARTES and ruta.name not in ("comun", "portada", "config"):
            for n in nombres:
                if (ruta / n / "ficha.json").is_file() and not n.startswith("_"):
                    fuera.add(n)
        return fuera

    for parte in PARTES:
        shutil.copytree(RAIZ / parte, destino / parte, ignore=ignorar)
    return destino


def escribir(ruta: Path, texto: str):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(texto, encoding="utf-8")


def ficha(raiz: Path, seccion: str, slug: str, datos: dict):
    """Escribe la ficha de un elemento. «recursos» y «tests» declaran categorías desde que tienen elementos agrupados, pero las pruebas de
    contrato escriben sus ejemplos sin ellas: si falta «categoria» se le pone la primera. En «juegos» y «herramientas» no se
    toca, porque hay pruebas que comprueban justo que una ficha sin categoría se rechaza."""
    conf = raiz / seccion / "seccion.json"
    if seccion in ("recursos", "tests") and "categoria" not in datos and conf.is_file():
        categorias = json.loads(conf.read_text(encoding="utf-8")).get("categorias") or []
        if categorias:
            datos = {**datos, "categoria": categorias[0]["id"]}
    escribir(raiz / seccion / slug / "ficha.json", json.dumps(datos, ensure_ascii=False, indent=2) + "\n")


def crear_ejemplos(raiz: Path):
    # --- Juegos
    ficha(raiz, "juegos", "serpiente", {
        "titulo": "Serpiente", "fecha": "2026-11-10", "etiquetas": ["un jugador", "clásico"], "categoria": "arcade",
        "descripcion": "Come manzanas, crece y no te choques con tu propia cola ni con las paredes del tablero."})
    escribir(raiz / "juegos/serpiente/pagina.html", """<div class="pantalla" id="serpiente">
  <canvas id="lienzo" width="480" height="320" aria-label="Tablero de la serpiente"></canvas>
  <p><button class="boton-retro" type="button" id="empezar">Empezar</button></p>
</div>
<p>Muévete con las flechas del teclado.</p>
""")
    escribir(raiz / "juegos/serpiente/app.js", """document.getElementById('empezar').addEventListener('click', function () {
  var c = document.getElementById('lienzo').getContext('2d');
  c.fillStyle = '#E6F14A'; c.fillRect(40, 40, 20, 20); c.fillRect(60, 40, 20, 20); c.fillRect(80, 40, 20, 20);
  c.fillStyle = '#FF5A7D'; c.fillRect(200, 120, 20, 20);
  document.body.setAttribute('data-jugando', 'si');
});
""")
    escribir(raiz / "juegos/serpiente/app.css", "#serpiente canvas { background: #14201C; width: 100%; max-width: 480px; }\n")
    escribir(raiz / "juegos/serpiente/sprite.svg", '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8"/></svg>')
    ficha(raiz, "juegos", "memoria", {
        "titulo": "Memoria de parejas", "estado": "proximamente", "categoria": "memoria",
        "descripcion": "Encuentra todas las parejas de cartas con el menor número de intentos."})
    ficha(raiz, "juegos", "borrador-secreto", {"titulo": "Todavía a medias", "estado": "borrador"})

    # --- Herramientas
    ficha(raiz, "herramientas", "contador-de-palabras", {
        "titulo": "Contador de palabras", "fecha": "2026-11-12", "etiquetas": ["texto", "escritura"], "categoria": "texto", "orden": 51,
        "descripcion": "Pega un texto y cuenta al instante palabras, caracteres y frases, sin enviar nada a ningún servidor."})
    escribir(raiz / "herramientas/contador-de-palabras/pagina.html", """<div class="panel" id="contador">
  <label class="campo">Tu texto
    <textarea id="texto" rows="8"></textarea>
  </label>
  <p style="margin-top:1rem"><button class="boton" type="button" id="contar">Contar</button></p>
  <p id="resultado" role="status"></p>
</div>
""")
    escribir(raiz / "herramientas/contador-de-palabras/app.js", """document.getElementById('contar').addEventListener('click', function () {
  var t = document.getElementById('texto').value.trim();
  document.getElementById('resultado').textContent = (t ? t.split(/\\s+/).length : 0) + ' palabras';
});
""")
    ficha(raiz, "herramientas", "conversor-de-unidades", {
        "titulo": "Conversor de unidades", "fecha": "2026-11-02", "etiquetas": ["medidas"], "categoria": "conversores", "orden": 31,
        "descripcion": "Convierte longitudes, pesos y temperaturas entre sistemas de medida con un solo clic."})
    escribir(raiz / "herramientas/conversor-de-unidades/pagina.html", '<div class="panel"><p>Conversor.</p></div>\n')

    # --- Recursos
    ficha(raiz, "recursos", "elegir-una-contrasena", {
        "titulo": "Cómo elegir una contraseña que no se olvide", "fecha": "2026-11-08", "etiquetas": ["seguridad"],
        "descripcion": "Un método sencillo para crear contraseñas largas, distintas para cada sitio y fáciles de recordar."})
    escribir(raiz / "recursos/elegir-una-contrasena/pagina.html", """<p>Una contraseña larga gana siempre a una contraseña rara. La razón es matemática y se explica en un minuto.</p>
<h2>Piensa en frases, no en palabras</h2>
<p>Elige cuatro palabras sin relación entre sí y únelas. Es más fácil de recordar y mucho más difícil de adivinar.</p>
<ul><li>Una frase por cada sitio importante.</li><li>Un gestor de contraseñas para el resto.</li></ul>
<h2>Qué evitar</h2>
<p>Fechas de cumpleaños, nombres de mascotas y cualquier cosa que aparezca en tus redes sociales.</p>
<blockquote>Largas, distintas y tuyas.</blockquote>
""")
    ficha(raiz, "recursos", "organizar-la-semana", {
        "titulo": "Organizar la semana en veinte minutos", "fecha": "2026-10-28",
        "descripcion": "Un repaso rápido cada domingo para decidir qué importa de verdad y dejar el resto fuera del calendario."})
    escribir(raiz / "recursos/organizar-la-semana/pagina.html", "<p>Texto de la guía.</p>\n")

    # --- Tests: cada uno con su aspecto
    ficha(raiz, "tests", "que-planificador-eres", {
        "titulo": "¿Qué tipo de planificador eres?", "fecha": "2026-11-11", "etiquetas": ["personalidad"],
        "descripcion": "Seis preguntas rápidas para descubrir cómo organizas tu tiempo y qué truco te encaja mejor.",
        "tema": {"fondo": "#2B1B4B", "texto": "#F6F0FF", "acento": "#FFB703"}})
    escribir(raiz / "tests/que-planificador-eres/pagina.html", """<section class="mi-test contenedor">
  <h1>¿Qué tipo de planificador eres?</h1>
  <p class="mi-test-lead">Responde sin pensarlo mucho: no hay respuestas malas.</p>
  <button class="mi-test-boton" type="button">Empezar</button>
</section>
""")
    escribir(raiz / "tests/que-planificador-eres/app.css", """.mi-test { padding-block: 4rem; }
.mi-test h1 { font-family: Georgia, serif; font-style: italic; font-size: clamp(2.4rem, 7vw, 5rem); color: var(--t-acento); }
.mi-test-lead { margin-top: 1rem; font-size: 1.3rem; max-width: 30rem; }
.mi-test-boton { margin-top: 2rem; padding: 0.9rem 1.6rem; border: 0; border-radius: 999px; background: var(--t-acento); color: #2B1B4B; font: 700 1.1rem system-ui; cursor: pointer; }
""")
    ficha(raiz, "tests", "cuanto-sabes-de-colores", {
        "titulo": "¿Cuánto sabes de colores?", "fecha": "2026-10-30", "etiquetas": ["cultura"],
        "descripcion": "Diez preguntas para comprobar si distingues un granate de un burdeos y un turquesa de un cian.",
        "tema": {"fondo": "#FFE3C2", "texto": "#3A1D00", "acento": "#D2541A"}})
    escribir(raiz / "tests/cuanto-sabes-de-colores/pagina.html", '<section class="contenedor" style="padding-block:4rem"><p>Test sin título propio: el sitio añade uno invisible.</p></section>\n')
    ficha(raiz, "tests", "sin-tema", {
        "titulo": "Test sin tema", "fecha": "2026-10-20",
        "descripcion": "Un test que no define colores propios y usa el aspecto neutro de la zona de tests."})
    escribir(raiz / "tests/sin-tema/pagina.html", '<section class="contenedor" style="padding-block:3rem"><h1>Test sin tema</h1><p>Aspecto neutro.</p></section>\n')


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    sys.path.insert(0, str(RAIZ))
    from motor.construir import construir
    destino = copiar_proyecto(Path(sys.argv[1]))
    crear_ejemplos(destino)
    print(construir(destino).resumen())
    print(f"Copia con ejemplos construida en {destino}/dist")

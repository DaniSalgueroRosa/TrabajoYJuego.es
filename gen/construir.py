# -*- coding: utf-8 -*-
"""
Genera las páginas de FP Cuenta (todas menos las que cambias a mano) y los archivos técnicos.

  index.html                                    ← cuerpos/portada.html
  calculadora-faltas/calculadora-faltas.html    ← cuerpos/calculadora-faltas.html
  calculadora-notas/calculadora-notas.html      ← cuerpos/calculadora-notas.html
  normativa/normativa-faltas.html               (sale de comunidades/<comunidad>/comunidad.json)
  comunidades/<comunidad>/datos.js              (lo carga el navegador; sale de comunidad.json y ciclos.json)
  informacion/…  sobre-nosotros, contacto, aviso-legal, politica-de-privacidad, politica-de-cookies
  404.html, robots.txt, sitemap.xml, ads.txt

Cabecera, pie, aviso de cookies y las etiquetas <link>/<script> de cada página se escriben aquí, una sola vez:
si cambias el menú o el pie, cambia NAV o footer() y ejecuta de nuevo.

Cada carpeta de comunidades/ con un comunidad.json es una comunidad disponible: no hay que tocar nada más aquí.

Uso:  python3 -I construir.py        (desde cualquier carpeta; escribe en la carpeta que contiene a gen/)
Los datos de la persona titular están como marcadores (<mark class="placeholder">):
búscalos con  grep -rn 'class="placeholder"' ..  y sustitúyelos antes de publicar.
"""
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comunidades import cargar, datos_js, ORIGEN_ETIQUETA, CUENTAN_TEXTO  # noqa: E402

OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMUNIDADES = cargar(OUT)          # una por carpeta de comunidades/
if not COMUNIDADES:
    raise SystemExit("No hay ninguna comunidad: crea comunidades/<carpeta>/comunidad.json (mira LEEME.md).")
DOMAIN = "https://www.tudominio.es"
UPDATED_TXT = "12 de noviembre de 2026"
UPDATED_ISO = "2026-11-12"
REVIEW_TXT = "noviembre de 2026"

esc = html.escape


def leer_configuracion():
    """Lee compartido/configuracion.js, el único sitio donde se escribe el ID de AdSense y el modo de consentimiento."""
    ruta = os.path.join(OUT, "compartido", "configuracion.js")
    with open(ruta, encoding="utf-8") as f:
        js = f.read()

    def valor(clave, por_defecto=""):
        m = re.search(r"^\s*%s\s*:\s*'([^']*)'" % clave, js, re.M)
        return m.group(1).strip() if m else por_defecto

    ads = valor("adsenseClient")
    if ads and not re.fullmatch(r"ca-pub-\d{10,20}", ads):
        raise SystemExit("compartido/configuracion.js: adsenseClient debe tener la forma 'ca-pub-1234567890123456' (tiene %r)." % ads)
    modo = valor("consentimiento", "propio")
    if modo not in ("propio", "google"):
        raise SystemExit("compartido/configuracion.js: consentimiento debe ser 'propio' o 'google' (tiene %r)." % modo)
    if modo == "google" and not ads:
        print("Aviso: consentimiento 'google' sin adsenseClient: se usa el aviso propio hasta que escribas el ID.", file=sys.stderr)
        modo = "propio"
    return ads, modo, valor("themeKey", "fpcuenta-tema-v1")


ADSENSE_ID, CONSENTIMIENTO, TEMA_KEY = leer_configuracion()
GOOGLE_CMP = CONSENTIMIENTO == "google"      # el mensaje de consentimiento lo muestra Google, no el aviso propio
TEMA_CLARO = "#f2f5fa"                       # = --paper en claro
TEMA_OSCURO = "#0d1530"                      # = --paper en oscuro

# Frases de los textos legales que cambian según quién pida el permiso de los anuncios
if GOOGLE_CMP:
    ANUNCIOS_SOLO_CON_PERMISO = "que se muestran según lo que elijas en el mensaje de consentimiento de Google"
else:
    ANUNCIOS_SOLO_CON_PERMISO = "que solo se cargan si aceptas las cookies de publicidad"


def lista_es(items):
    """['A', 'B', 'C'] → 'A, B y C'."""
    items = list(items)
    return ", ".join(items[:-1]) + " y " + items[-1] if len(items) > 1 else "".join(items)


def tenemos():
    """Frase que dice qué comunidades hay ahora mismo (se actualiza sola al añadir carpetas en comunidades/)."""
    nombres = [esc(c["nombre"]) for c in COMUNIDADES]
    if len(nombres) == 1:
        return "Por ahora tenemos una comunidad: %s." % nombres[0]
    return "Por ahora tenemos %d comunidades: %s." % (len(nombres), lista_es(nombres))


def ph(text):
    """Marcador que hay que sustituir antes de publicar."""
    return '<mark class="placeholder">%s</mark>' % esc(text)


OWNER_NAME = ph("[Nombre y apellidos o razón social de la persona titular]")
OWNER_ID = ph("[NIF o CIF]")
OWNER_ADDR = ph("[Domicilio postal]")
OWNER_MAIL = ph("contacto@tudominio.es")
HOSTING = ph("[Proveedor de alojamiento web]")
FORM_PROVIDER = ph("[Proveedor del formulario, si usas uno]")

# ---------------------------------------------------------------- plantillas

LOGO = ('<svg class="brand-mark" viewBox="0 0 32 32" width="%d" height="%d" aria-hidden="true" focusable="false">'
        '<g fill="none" stroke-linecap="round" stroke-width="3">'
        '<path stroke="currentColor" d="M8 8v16M13.5 8v16M19 8v16M24.5 8v16"/>'
        '<path stroke="var(--red)" d="M4.5 22.5 28 9.5"/></g></svg>')

FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' "
           "rx='7' fill='%231c3faa'/%3E%3Cg fill='none' stroke-linecap='round' stroke-width='3'%3E%3Cpath stroke='white' "
           "d='M8 8v16M13.5 8v16M19 8v16M24.5 8v16'/%3E%3Cpath stroke='%23ff8a9a' d='M4.5 22.5 28 9.5'/%3E%3C/g%3E%3C/svg%3E")

# Cada página tiene una clave. RUTAS dice dónde vive su archivo; ASSETS, qué CSS y JS carga (rutas desde la raíz).
RUTAS = {
    "inicio": "index.html",
    "faltas": "calculadora-faltas/calculadora-faltas.html",
    "notas": "calculadora-notas/calculadora-notas.html",
    "normativa": "normativa/normativa-faltas.html",
    "sobre": "informacion/sobre-nosotros.html",
    "contacto": "informacion/contacto.html",
    "aviso": "informacion/aviso-legal.html",
    "privacidad": "informacion/politica-de-privacidad.html",
    "cookies": "informacion/politica-de-cookies.html",
    "404": "404.html",
}
# Nombre corto usado dentro de los textos (href="contacto.html") → clave. Se reescribe solo al generar.
ARCHIVOS = {
    "index.html": "inicio", "calculadora-faltas.html": "faltas", "calculadora-notas.html": "notas",
    "normativa-faltas.html": "normativa", "sobre-nosotros.html": "sobre", "contacto.html": "contacto",
    "aviso-legal.html": "aviso", "politica-de-privacidad.html": "privacidad", "politica-de-cookies.html": "cookies",
    "404.html": "404",
}

BASE_CSS = "compartido/base.css"
CALC_CSS = ["compartido/base.css", "compartido/combobox.css", "compartido/calculadoras.css"]
COMUN_JS = ["compartido/configuracion.js", "compartido/comun.js"]
DATOS_JS = ["comunidades/%s/datos.js" % c["carpeta"] for c in COMUNIDADES] + ["compartido/datos.js"]
ASSETS = {
    "inicio": ([BASE_CSS, "portada/portada.css"], COMUN_JS + ["portada/portada.js"]),
    "faltas": (CALC_CSS + ["calculadora-faltas/calculadora-faltas.css"],
               COMUN_JS + DATOS_JS + ["compartido/combobox.js", "calculadora-faltas/calculadora-faltas.js"]),
    "notas": (CALC_CSS + ["calculadora-notas/calculadora-notas.css"],
              COMUN_JS + DATOS_JS + ["datos/ra.js", "compartido/combobox.js", "calculadora-notas/calculadora-notas.js"]),
    "normativa": ([BASE_CSS, "normativa/normativa.css"], COMUN_JS),
}
ASSETS_POR_DEFECTO = ([BASE_CSS], COMUN_JS)

# Menú: (clave de página, texto, #ancla opcional)
NAV = [
    ("faltas", "Faltas", ""),
    ("notas", "Notas", ""),
    ("normativa", "Normativa", ""),
    ("inicio", "Preguntas", "#preguntas"),
    ("inicio", "Sugerencias", "#sugerencias"),
]

_ENLACE = re.compile(r'href="(%s)(#[^"]*)?"' % "|".join(re.escape(k) for k in ARCHIVOS))


def base_de(clave):
    """Prefijo para llegar a la raíz desde la página: '' en la raíz, '../' en una carpeta, '/' en la 404."""
    if clave == "404":
        return "/"
    return "../" * RUTAS[clave].count("/")


def reescribir(texto, base):
    """Convierte href="contacto.html#x" en la ruta real desde la página actual."""
    return _ENLACE.sub(lambda m: 'href="%s%s%s"' % (base, RUTAS[ARCHIVOS[m.group(1)]], m.group(2) or ""), texto)


def header(current, base=""):
    items = []
    for clave, label, anchor in NAV:
        cur = ' aria-current="page"' if (clave == current and not anchor) else ""
        items.append('          <li><a href="%s%s%s"%s>%s</a></li>' % (base, RUTAS[clave], anchor, cur, label))
    return """  <a class="skip-link" href="#contenido">Saltar al contenido</a>

  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="%(base)sindex.html" aria-label="FP Cuenta, ir al inicio">
        %(logo)s
        <span class="brand-name">FP Cuenta</span>
      </a>

      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu-principal">
        <span class="sr-only">Menú</span>
        <span class="nav-toggle-bars" aria-hidden="true"></span>
      </button>

      <nav class="site-nav" id="menu-principal" aria-label="Principal">
        <ul>
%(items)s
        </ul>
      </nav>

      <button class="theme-toggle" type="button" aria-pressed="false" aria-label="Modo oscuro" title="Cambiar entre modo claro y oscuro">
        <svg class="icon-luna" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        <svg class="icon-sol" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </button>
    </div>
  </header>
""" % dict(base=base, logo=LOGO % (30, 30), items="\n".join(items))


def footer(base=""):
    return """  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div class="footer-about">
        <a class="brand" href="%(b)sindex.html" aria-label="FP Cuenta, ir al inicio">
          %(logo)s
          <span class="brand-name">FP Cuenta</span>
        </a>
        <p>
          Proyecto independiente para el alumnado de Formación Profesional. No está vinculado al Ministerio de Educación,
          a ninguna consejería ni a ningún centro educativo.
        </p>
      </div>

      <nav aria-labelledby="pie-herramientas">
        <h2 class="footer-title" id="pie-herramientas">Herramientas</h2>
        <ul>
          <li><a href="%(b)s%(faltas)s">Calculadora de faltas</a></li>
          <li><a href="%(b)s%(notas)s">Calculadora de notas</a></li>
          <li><a href="%(b)s%(normativa)s">Normativa por comunidad</a></li>
          <li><a href="%(b)sindex.html#sugerencias">Buzón de sugerencias</a></li>
        </ul>
      </nav>

      <nav aria-labelledby="pie-info">
        <h2 class="footer-title" id="pie-info">Información</h2>
        <ul>
          <li><a href="%(b)s%(sobre)s">Sobre nosotros</a></li>
          <li><a href="%(b)s%(contacto)s">Contacto</a></li>
          <li><a href="%(b)s%(aviso)s">Aviso legal</a></li>
          <li><a href="%(b)s%(privacidad)s">Política de privacidad</a></li>
          <li><a href="%(b)s%(cookies)s">Política de cookies</a></li>
          <li><button type="button" class="link-button" data-open-cookies>Configurar cookies</button></li>
        </ul>
      </nav>
    </div>

    <div class="wrap">
      <p class="copyright">© <span id="year">2026</span> FP Cuenta. Todos los derechos reservados.</p>
    </div>
  </footer>

  <div class="cookie-banner" id="cookie-banner" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-text" hidden>
    <h2 id="cookie-title">Tu decisión sobre las cookies</h2>
    <p id="cookie-text">
      Guardamos tu elección en tu navegador. Con tu permiso, Google AdSense usará cookies para mostrar anuncios.
      Puedes cambiarla cuando quieras desde el pie de página.
      <a href="%(b)s%(cookies)s">Más información</a>
    </p>
    <div class="cookie-actions">
      <button type="button" class="btn btn-secondary" data-consent="reject">Rechazar</button>
      <button type="button" class="btn btn-secondary" data-consent="accept">Aceptar</button>
    </div>
  </div>
""" % dict(b=base, logo=LOGO % (26, 26), **{k: RUTAS[k] for k in
           ("faltas", "notas", "normativa", "sobre", "contacto", "aviso", "privacidad", "cookies")})


def escribir(ruta, contenido):
    destino = os.path.join(OUT, ruta)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "w", encoding="utf-8") as f:
        f.write(contenido)


if ADSENSE_ID:
    # Google comprueba que el sitio es tuyo leyendo el HTML: por eso va fija en el <head>, aunque el script de anuncios
    # solo se cargue con permiso.
    META_ADSENSE = '  <meta name="google-adsense-account" content="%s">\n' % ADSENSE_ID
else:
    META_ADSENSE = """  <!--
    ADSENSE: escribe tu ID en compartido/configuracion.js (adsenseClient) y ejecuta de nuevo gen/construir.py:
    aquí aparecerá solo la metaetiqueta  <meta name="google-adsense-account" content="ca-pub-...">
  -->
"""


def anuncio(nombre):
    """Hueco para un bloque de anuncios. Está oculto: comun.js lo muestra solo si hay ID, bloque configurado y permiso."""
    return """    <div class="wrap">
      <aside class="anuncio" data-anuncio="%s" aria-label="Publicidad" hidden>
        <p class="anuncio-etiqueta">Publicidad</p>
        <div class="anuncio-hueco"></div>
      </aside>
    </div>""" % nombre


def componer(clave, title, description, main, robots="index, follow, max-image-preview:large", jsonld=None):
    """Compone una página completa a partir de su <main>."""
    ruta = RUTAS[clave]
    base = base_de(clave)
    css, js = ASSETS.get(clave, ASSETS_POR_DEFECTO)
    url = DOMAIN + "/" + ("" if clave == "inicio" else ruta)
    indexable = not robots.startswith("noindex")
    canonical = '  <link rel="canonical" href="%s">\n' % url if indexable else ""
    og_url = '  <meta property="og:url" content="%s">\n' % url if indexable else ""
    ld = ""
    if jsonld:
        ld = '\n  <script type="application/ld+json">\n%s\n  </script>\n' % json.dumps(
            dict({"@context": "https://schema.org"}, url=url, inLanguage="es-ES", **jsonld),
            ensure_ascii=False, indent=2)
    head = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>%(title)s | FP Cuenta</title>
  <meta name="description" content="%(desc)s">
%(canonical)s  <meta name="robots" content="%(robots)s">

  <meta name="theme-color" content="%(tclaro)s" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="%(toscuro)s" media="(prefers-color-scheme: dark)">

  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="FP Cuenta">
  <meta property="og:title" content="%(title)s">
  <meta property="og:description" content="%(desc)s">
%(og_url)s
  <link rel="icon" href="%(favicon)s">
%(adsense)s
  <script>
    /* Aplica el modo oscuro o claro guardado antes de pintar la página, para que no parpadee. Lo gestiona después comun.js. */
    (function (d) {
      try {
        var t = localStorage.getItem('%(tkey)s');
        if (t === 'dark' || t === 'light') {
          d.setAttribute('data-theme', t);
          var m = d.querySelectorAll('meta[name="theme-color"]');
          for (var i = 0; i < m.length; i++) m[i].setAttribute('content', t === 'dark' ? '%(toscuro)s' : '%(tclaro)s');
        }
      } catch (e) { /* sin almacenamiento: se sigue el modo del sistema */ }
      d.classList.add('js');
    })(document.documentElement);
  </script>
%(css)s
%(js)s
%(ld)s</head>

<body>
%(header)s
  <main id="contenido" tabindex="-1">
%(main)s
  </main>

%(footer)s</body>
</html>
""" % dict(title=esc(title), desc=esc(description), canonical=canonical, robots=robots, og_url=og_url,
           favicon=FAVICON, ld=ld, header=header(clave, base), footer=footer(base), main=main.rstrip("\n"),
           tclaro=TEMA_CLARO, toscuro=TEMA_OSCURO, tkey=TEMA_KEY, adsense=META_ADSENSE,
           css="\n".join('  <link rel="stylesheet" href="%s%s">' % (base, c) for c in css),
           js="\n".join('  <script src="%s%s" defer></script>' % (base, j) for j in js))
    escribir(ruta, reescribir(head, base))


def page(filename, title, description, body, current=None, robots="index, follow, max-image-preview:large",
         base=None, lead=None, h1=None):
    """Página de texto: cabecera de página (título y entradilla) + secciones. `filename` es el nombre corto."""
    clave = ARCHIVOS[filename]
    lead_html = '\n        <p class="lead">%s</p>' % lead if lead else ""
    main = """
    <section class="page-head" aria-labelledby="titulo-pagina">
      <div class="wrap">
        <h1 id="titulo-pagina">%(h1)s</h1>%(lead)s
      </div>
    </section>

%(body)s
""" % dict(h1=esc(h1 or title), lead=lead_html, body=body)
    componer(clave, title, description, main, robots=robots)


def prose_section(inner, wide=False, ruled=True):
    cls = "section section-ruled" if ruled else "section"
    return """    <section class="%s">
      <div class="wrap">
        <div class="prose%s">
%s
        </div>
      </div>
    </section>""" % (cls, " prose-wide" if wide else "", inner)


# ---------------------------------------------------------------- normativa

def limite_texto(c):
    pct = c["pct"]
    if c.get("pct_curso"):
        partes = ["%s %% en %sº" % (v, k) for k, v in sorted(c["pct_curso"].items())]
        rest = "%s %% en 2º" % pct
        return ", ".join(partes + [rest])
    if c["origen"] == "sin-datos":
        return "%s %% (valor prudente)" % pct
    if c["origen"] == "centro":
        return "%s %% (orientativo)" % pct
    return "%s %%" % pct


def build_normativa():
    rows = []
    for c in COMUNIDADES:
        rows.append(
            '            <tr data-origen="%s">\n'
            '              <th scope="row" data-label="Comunidad"><a href="#com-%s">%s</a></th>\n'
            '              <td data-label="Límite de faltas">%s</td>\n'
            '              <td data-label="Qué faltas cuentan">%s</td>\n'
            '              <td data-label="Origen del dato"><span class="badge badge-origen" data-origen="%s">%s</span></td>\n'
            '            </tr>' % (c["origen"], c["id"], esc(c["nombre"]), esc(limite_texto(c)).replace("&#x27;", "'"),
                                  esc(CUENTAN_TEXTO[c["cuentan"]]), c["origen"], esc(ORIGEN_ETIQUETA[c["origen"]])))

    details = []
    for c in COMUNIDADES:
        parts = ['          <article class="com-detail" id="com-%s" data-origen="%s">' % (c["id"], c["origen"]),
                 '            <h3>%s: %s</h3>' % (esc(c["nombre"]), esc(limite_texto(c))),
                 '            <p class="com-badges"><span class="badge badge-origen">%s</span> '
                 '<span class="badge badge-plain">%s</span></p>'
                 % (esc(ORIGEN_ETIQUETA[c["origen"]]), esc(CUENTAN_TEXTO[c["cuentan"]]))]
        if c.get("norma"):
            parts.append('            <p class="com-norma"><strong>Norma:</strong> %s.</p>' % esc(c["norma"]))
        parts.append('            <p>%s</p>' % esc(c["nota"]))
        if c.get("matricula"):
            parts.append('            <p class="com-matricula">%s</p>' % esc(c["matricula"]))
        if c["fuentes"]:
            lis = "\n".join(
                '              <li><a href="%s" target="_blank" rel="noopener noreferrer">%s</a>'
                '<span class="sr-only"> (se abre en una pestaña nueva)</span></li>' % (esc(u), esc(t))
                for t, u in c["fuentes"])
            parts.append('            <p class="com-sources-title"><strong>%s</strong></p>\n'
                         '            <ul class="com-source-list">\n%s\n            </ul>'
                         % ("Fuente" if len(c["fuentes"]) == 1 else "Fuentes", lis))
        h = c.get("horas")
        if h:
            enlaces = "; ".join('<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>'
                                '<span class="sr-only"> (se abre en una pestaña nueva)</span>' % (esc(e["u"]), esc(e["t"]))
                                for e in h.get("enlaces", []))
            parts.append('            <p class="com-horas"><strong>Horas de los módulos:</strong> %s.%s %s</p>' % (
                esc(h["fuente"]), (" Documentos: %s." % enlaces) if enlaces else "", esc(h.get("nota", ""))))
        parts.append('            <p class="com-use"><a href="calculadora-faltas.html">Usar la calculadora con este porcentaje</a></p>')
        parts.append('          </article>')
        details.append("\n".join(parts))

    n_norma = sum(1 for c in COMUNIDADES if c["origen"] == "norma")
    n_indicio = sum(1 for c in COMUNIDADES if c["origen"] == "indicio")
    n_centro = sum(1 for c in COMUNIDADES if c["origen"] == "centro")
    n_sin = sum(1 for c in COMUNIDADES if c["origen"] == "sin-datos")
    if len(COMUNIDADES) == 1:
        resumen = ("Por ahora tenemos %s, con su normativa y las horas de los módulos de sus ciclos. "
                   "Iremos añadiendo el resto de comunidades y ciudades autónomas." % esc(COMUNIDADES[0]["nombre"]))
    else:
        uno = lambda n: "una" if n == 1 else str(n)
        partes = []
        if n_norma:
            partes.append("%s con un dato que sale de la normativa" % uno(n_norma))
        if n_indicio:
            partes.append("%s con un dato de documentos de centros o de sindicatos" % uno(n_indicio))
        if n_centro:
            partes.append("%s en %s que lo concreta cada centro" % (uno(n_centro), "la" if n_centro == 1 else "las"))
        if n_sin:
            partes.append("%s sin nada fiable (en ese caso la calculadora usa un 15 %% prudente)" % uno(n_sin))
        resumen = "Ahora mismo tenemos %d comunidades: %s. Iremos añadiendo el resto." % (len(COMUNIDADES), lista_es(partes))

    body = """    <section class="section section-ruled" aria-labelledby="t-leer">
      <div class="wrap">
        <div class="prose prose-wide">
          <h2 id="t-leer">Cómo leer esta página</h2>
          <p>
            No hay un porcentaje de faltas único para toda España. Cada comunidad autónoma regula la asistencia en la
            Formación Profesional a su manera, y en varias es cada centro quien fija el límite en sus normas de
            organización y funcionamiento o en la programación de cada módulo. Aquí reunimos lo que hemos encontrado
            en boletines oficiales, páginas de las consejerías, documentos de centros y guías sindicales, y decimos
            de dónde sale cada dato. Revisado en %(rev)s.
          </p>
          <p>
            %(resumen)s
          </p>
          <dl class="legend">
            <dt><span class="badge badge-origen" data-origen="norma">Dato de la normativa</span></dt>
            <dd>Sale del texto de una orden, una resolución o unas instrucciones oficiales.</dd>
            <dt><span class="badge badge-origen" data-origen="indicio">Dato de documentos de centros o sindicatos</span></dt>
            <dd>Lo cita un centro o un sindicato, pero no hemos podido comprobarlo en el texto de la norma.</dd>
            <dt><span class="badge badge-origen" data-origen="centro">Lo fija cada centro</span></dt>
            <dd>La norma de la comunidad no da un porcentaje. Ponemos uno orientativo, y debes confirmarlo en tu centro.</dd>
            <dt><span class="badge badge-origen" data-origen="sin-datos">Sin verificar</span></dt>
            <dd>No hemos encontrado una fuente fiable. Usamos un 15 %% para no quedarnos cortos.</dd>
          </dl>
        </div>
      </div>
    </section>

    <section class="section section-ruled" aria-labelledby="t-tabla">
      <div class="wrap">
        <h2 id="t-tabla">Porcentaje de faltas por comunidad</h2>
        <div class="table-wrap table-wrap-flat">
          <table class="data-table">
            <caption class="sr-only">Límite de faltas, tipo de faltas que cuentan y origen del dato en cada comunidad autónoma</caption>
            <thead>
              <tr>
                <th scope="col">Comunidad</th>
                <th scope="col">Límite de faltas</th>
                <th scope="col">Qué faltas cuentan</th>
                <th scope="col">Origen del dato</th>
              </tr>
            </thead>
            <tbody>
%(rows)s
            </tbody>
          </table>
        </div>
        <p class="field-hint table-note">
          El límite es el porcentaje de horas de un módulo que puedes faltar. Las cifras son orientativas: confirma siempre
          la de tu centro en la programación del módulo o con tu tutor o tutora.
        </p>
      </div>
    </section>

    <section class="section section-ruled" aria-labelledby="t-detalle">
      <div class="wrap">
        <h2 id="t-detalle">Detalle por comunidad</h2>
        <div class="com-details">
%(details)s
        </div>
      </div>
    </section>

%(anuncio)s

    <section class="section section-ruled" aria-labelledby="t-corregir">
      <div class="wrap">
        <div class="prose prose-wide">
          <h2 id="t-corregir">¿Falta tu comunidad o hay algo desactualizado?</h2>
          <p>
            Las normas cambian y varios centros usan criterios propios. Si tu comunidad todavía no está, si conoces su dato o ves un error,
            escríbenos desde el <a href="index.html#sugerencias">buzón de sugerencias</a> con el nombre de la comunidad, el
            porcentaje y, si puedes, un enlace al texto donde figura. Lo revisamos y, si es correcto, lo actualizamos.
          </p>
          <p class="prose-note">
            Esta página es informativa e independiente. No sustituye a la normativa de tu comunidad autónoma ni a las normas
            de tu centro, que son las que valen.
          </p>
        </div>
      </div>
    </section>""" % dict(rev=REVIEW_TXT, resumen=resumen.replace("%%", "%"),
                         rows="\n".join(rows), details="\n".join(details),
                         anuncio=anuncio("normativa"))

    page("normativa-faltas.html",
         "Porcentaje de faltas en FP por comunidad autónoma",
         "Cuántas faltas hacen perder la evaluación continua en la FP de cada comunidad autónoma, qué faltas cuentan y de dónde sale cada dato.",
         body, current="normativa-faltas.html",
         lead="Cuántas faltas hacen perder la evaluación continua en cada comunidad, qué faltas cuentan y de dónde sale cada dato.")


# ---------------------------------------------------------------- páginas de texto

if GOOGLE_CMP:
    PUBLICIDAD_PRIVACIDAD = ("El sitio carga Google AdSense para mostrar anuncios. Google te muestra su propio mensaje de consentimiento "
                             "y, según lo que elijas, puede usar cookies o identificadores para mostrar y medir anuncios y personalizarlos. "
                             "Google actúa como responsable de ese tratamiento. Puedes cambiar tu elección cuando quieras con «Configurar cookies» en el pie.")
else:
    PUBLICIDAD_PRIVACIDAD = ("Con tu permiso, el sitio carga Google AdSense para mostrar anuncios. Google puede usar cookies o identificadores "
                             "para ello y actúa como responsable de ese tratamiento. Si rechazas las cookies de publicidad, no se carga nada de "
                             "Google.")


def build_sobre():
    inner = """          <h2>Por qué existe FP Cuenta</h2>
          <p>
            En los ciclos formativos presenciales, perder la evaluación continua por pasarse de faltas es una de las cosas
            más fáciles de evitar y de las más difíciles de calcular. El límite se mide por módulo, depende de la comunidad
            y a veces del centro, y las horas que te quedan dependen de cuántas has faltado ya. FP Cuenta hace esa cuenta
            por ti, en el móvil y sin registrarte.
          </p>

          <h2>Qué encontrarás aquí</h2>
          <ul>
            <li>Una <a href="calculadora-faltas.html">calculadora de faltas</a> por módulo, con el porcentaje y las horas de los módulos de cada ciclo de tu comunidad.</li>
            <li>Una <a href="calculadora-notas.html">calculadora de notas</a> por resultados de aprendizaje, para saber qué nota llevas y qué necesitas en el resto.</li>
            <li>Una página con la <a href="normativa-faltas.html">normativa por comunidad</a> y las fuentes de cada dato.</li>
            <li>Un <a href="index.html#sugerencias">buzón de sugerencias</a> para pedir ciclos, avisar de errores o proponer mejoras.</li>
          </ul>

          <h2>Cómo reunimos los datos</h2>
          <p>
            Buscamos el porcentaje en boletines oficiales, páginas de las consejerías de educación, documentos de centros
            y guías sindicales. En cada comunidad indicamos de dónde sale el dato y lo seguro que es: normativa, documentos
            de centros o sindicatos, límite fijado por cada centro, o sin verificar. Cuando no hemos encontrado nada fiable,
            lo decimos y usamos un 15 %% prudente en lugar de inventar una cifra.
          </p>
          <p>
            Los módulos y las horas de los ciclos salen de los documentos que publica la administración educativa de cada
            comunidad, y la calculadora te dice la fuente de las horas que muestra. %(tenemos)s
            Añadimos una comunidad cuando conseguimos sus horas oficiales, y nunca mostramos las de otra comunidad como
            si fueran las tuyas. Puedes corregir las horas de cualquier módulo en la tabla o añadir los tuyos.
          </p>

          <h2>Independencia y publicidad</h2>
          <p>
            FP Cuenta es un proyecto independiente: no está vinculado al Ministerio de Educación, Formación Profesional y
            Deportes, a ninguna consejería ni a ningún centro. La web es gratuita. Para cubrir sus costes puede mostrar anuncios
            de Google AdSense, %(ads)s. Los anuncios no influyen en lo que
            explicamos ni en los cálculos. Tienes más detalles en la <a href="politica-de-cookies.html">política de cookies</a>.
          </p>

          <h2>Cómo corregimos los errores</h2>
          <p>
            Si un dato está desactualizado o es incorrecto, lo corregimos en cuanto lo comprobamos y actualizamos la fecha
            de revisión. Puedes avisarnos desde la página de <a href="contacto.html">contacto</a>.
          </p>

          <h2>Quién está detrás</h2>
          <p>
            FP Cuenta la mantiene %(owner)s. Puedes escribirnos a %(mail)s.
          </p>
          <p class="prose-note">
            Los resultados de la calculadora son orientativos. Mandan la normativa de tu comunidad y las normas de tu centro.
          </p>""" % dict(owner=OWNER_NAME, mail=OWNER_MAIL, tenemos=tenemos(), ads=ANUNCIOS_SOLO_CON_PERMISO)
    page("sobre-nosotros.html", "Sobre FP Cuenta",
         "Qué es FP Cuenta, cómo reunimos los datos de la normativa de faltas en FP, cómo se financia y cómo corregimos los errores.",
         prose_section(inner), lead="Una web independiente para llevar la cuenta de las faltas en la Formación Profesional.")


def build_contacto():
    inner = """          <h2>Escríbenos</h2>
          <p>
            Para dudas, errores en los datos, peticiones de ciclos o cualquier otra cosa, escribe a %(mail)s.
            Intentamos responder en pocos días.
          </p>

          <h2>Si quieres corregir o añadir un dato</h2>
          <p>
            Cuéntanos qué hay que cambiar y dónde lo has visto. Cuanta más información, más rápido podremos comprobarlo:
          </p>
          <ul>
            <li>Tu comunidad autónoma y, si procede, tu centro.</li>
            <li>El ciclo, el curso y el módulo, si se trata de horas o de módulos.</li>
            <li>El porcentaje o el dato correcto y, si puedes, un enlace al boletín, la programación o el documento donde figura.</li>
          </ul>

          <h2>Buzón de sugerencias</h2>
          <p>
            También puedes usar el <a href="index.html#sugerencias">buzón de sugerencias</a> de la portada. El correo es
            opcional, pero sin él no podremos contestarte. No incluyas datos personales de otras personas ni datos que no
            quieras compartir.
          </p>

          <h2>Lo que no podemos hacer</h2>
          <p>
            No somos un centro educativo ni una administración, así que no podemos resolver casos particulares de
            asistencia, justificar faltas ni decirte cómo se aplica la norma en tu centro. Para eso, habla con tu tutor
            o tutora o con la jefatura de estudios.
          </p>""" % dict(mail=OWNER_MAIL)
    page("contacto.html", "Contacto",
         "Cómo contactar con FP Cuenta para avisar de un error, pedir un ciclo o enviar una sugerencia.",
         prose_section(inner), lead="Para avisar de un error, pedir un ciclo o proponer una mejora.")


def build_aviso():
    inner = """          <h2>1. Titular del sitio web</h2>
          <p>En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de que el titular de este sitio web es:</p>
          <ul>
            <li><strong>Titular:</strong> %(name)s</li>
            <li><strong>NIF o CIF:</strong> %(id)s</li>
            <li><strong>Domicilio:</strong> %(addr)s</li>
            <li><strong>Correo electrónico:</strong> %(mail)s</li>
            <li><strong>Sitio web:</strong> www.tudominio.es</li>
          </ul>

          <h2>2. Objeto y condiciones de uso</h2>
          <p>
            FP Cuenta es un sitio gratuito con herramientas e información para el alumnado de Formación Profesional.
            Acceder a él supone aceptar estas condiciones. Debes usarlo de forma lícita y sin dañar el sitio ni su funcionamiento.
          </p>

          <h2>3. Carácter informativo de los contenidos</h2>
          <p>
            Los cálculos y la información sobre normativa son orientativos. No sustituyen a la normativa vigente de tu
            comunidad autónoma ni a las normas de tu centro, que son las que determinan cuándo se pierde la evaluación
            continua. Hacemos lo posible por mantener los datos al día, pero pueden contener errores o haber cambiado.
            Si ves uno, avísanos desde la página de <a href="contacto.html">contacto</a>.
          </p>
          <p>
            FP Cuenta es un proyecto independiente y no está vinculado al Ministerio de Educación, Formación Profesional y
            Deportes, a ninguna consejería de educación ni a ningún centro educativo.
          </p>

          <h2>4. Propiedad intelectual e industrial</h2>
          <p>
            Los textos, el diseño, el código y los elementos gráficos de este sitio pertenecen a su titular o se usan con
            permiso. Puedes consultarlos y usar la calculadora para tu uso personal. No puedes copiarlos, distribuirlos o
            transformarlos con fines comerciales sin autorización. Las normas y documentos oficiales que enlazamos son
            textos públicos de las administraciones y entidades que los publican.
          </p>

          <h2>5. Enlaces a otros sitios</h2>
          <p>
            Enlazamos a boletines oficiales, páginas de administraciones y documentos de terceros como fuentes. No
            controlamos esos sitios ni nos hacemos responsables de su contenido o de su disponibilidad.
          </p>

          <h2>6. Publicidad</h2>
          <p>
            El sitio puede mostrar anuncios de Google AdSense, %(ads)s. No
            elegimos a los anunciantes ni respondemos de sus productos o servicios. Más información en la
            <a href="politica-de-cookies.html">política de cookies</a>.
          </p>

          <h2>7. Responsabilidad</h2>
          <p>
            No nos hacemos responsables de las decisiones que tomes basándote en los resultados de la calculadora ni de los
            daños que puedan derivarse de errores en los datos, de interrupciones del servicio o de fallos técnicos, salvo
            en los casos en que la ley no permita excluir esa responsabilidad.
          </p>

          <h2>8. Legislación aplicable</h2>
          <p>
            Este aviso legal se rige por la legislación española. Para cualquier controversia serán competentes los juzgados
            y tribunales que correspondan según la normativa aplicable.
          </p>
          <p class="prose-note">Última actualización: %(upd)s.</p>""" % dict(
        name=OWNER_NAME, id=OWNER_ID, addr=OWNER_ADDR, mail=OWNER_MAIL, upd=UPDATED_TXT, ads=ANUNCIOS_SOLO_CON_PERMISO)
    page("aviso-legal.html", "Aviso legal",
         "Aviso legal de FP Cuenta: titular del sitio, condiciones de uso, propiedad intelectual y responsabilidad.",
         prose_section(inner), lead="Quién es el titular de la web y bajo qué condiciones puedes usarla.")


def build_privacidad():
    inner = """          <h2>1. Quién es el responsable</h2>
          <ul>
            <li><strong>Responsable:</strong> %(name)s</li>
            <li><strong>NIF o CIF:</strong> %(id)s</li>
            <li><strong>Domicilio:</strong> %(addr)s</li>
            <li><strong>Correo electrónico:</strong> %(mail)s</li>
          </ul>

          <h2>2. Qué datos tratamos y para qué</h2>

          <h3>Las calculadoras de faltas y de notas</h3>
          <p>
            Lo que escribes en las calculadoras (comunidad, ciclo, curso, módulos, horas, notas y ajustes) se guarda solo en el
            almacenamiento local de tu navegador, para que no tengas que escribirlo de nuevo. No lo recibimos ni se envía a
            ningún servidor. Puedes borrarlo en cualquier momento con el botón «Borrar mis datos guardados» de cada calculadora o limpiando los
            datos del sitio en tu navegador.
          </p>

          <h3>El buzón de sugerencias</h3>
          <p>
            Si envías una sugerencia, tratamos el tipo de mensaje, el texto que escribas y, si lo das, tu correo electrónico.
            Los usamos para leer tu sugerencia y, si has dejado el correo, para responderte. La base que lo permite es tu
            consentimiento (artículo 6.1.a del Reglamento general de protección de datos, RGPD), que das al marcar la casilla
            antes de enviar. Puedes retirarlo cuando quieras. Conservamos el mensaje mientras sea necesario para atenderlo
            y, si pides que lo borremos, lo suprimimos. No incluyas en el mensaje datos de otras personas ni datos sensibles.
          </p>

          <h3>Datos de navegación</h3>
          <p>
            El proveedor de alojamiento (%(host)s) puede registrar datos técnicos de cada visita, como la dirección IP, la fecha
            y la página solicitada, por motivos de seguridad y funcionamiento. No los usamos para identificarte.
          </p>

          <h3>Publicidad</h3>
          <p>
            %(pub)s Tienes más información en la <a href="politica-de-cookies.html">política de cookies</a> y en cómo
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google usa la
            información de los sitios que usan sus servicios</a><span class="sr-only"> (se abre en una pestaña nueva)</span>.
          </p>

          <h2>3. Quién recibe tus datos</h2>
          <p>
            No vendemos tus datos ni los cedemos a terceros para sus propios fines. Pueden acceder a ellos los proveedores
            que necesitamos para dar el servicio: el alojamiento web (%(host)s) y, si el buzón de sugerencias envía los
            mensajes a través de un servicio externo, ese proveedor (%(form)s). Si la sugerencia se envía desde tu programa de
            correo, pasa por tu proveedor de correo y por el nuestro. Si algún proveedor está fuera del Espacio Económico
            Europeo, exigimos las garantías que prevé el RGPD.
          </p>

          <h2>4. Tus derechos</h2>
          <p>
            Puedes pedirnos el acceso a tus datos, su rectificación o supresión, la limitación o la oposición al tratamiento y
            la portabilidad, y retirar tu consentimiento cuando quieras. Escribe a %(mail)s indicando qué quieres y desde qué
            correo nos escribiste. Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de
            Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a><span class="sr-only">, se abre en una pestaña nueva</span>).
          </p>

          <h2>5. Menores de edad</h2>
          <p>
            Esta web está pensada para estudiantes de FP, y algunos pueden ser menores. Si tienes menos de 14 años, no nos
            envíes mensajes sin el consentimiento de tu madre, padre o tutor legal, que es lo que exige la ley española para
            tratar los datos de menores de esa edad.
          </p>

          <h2>6. Seguridad</h2>
          <p>
            Aplicamos medidas razonables para proteger los datos que recibimos. Como nada es del todo seguro en internet,
            no podemos garantizar una protección absoluta.
          </p>

          <h2>7. Cambios en esta política</h2>
          <p>
            Podemos actualizar esta política cuando cambie el sitio o la normativa. Verás la fecha de la última revisión aquí abajo.
          </p>
          <p class="prose-note">Última actualización: %(upd)s.</p>""" % dict(
        name=OWNER_NAME, id=OWNER_ID, addr=OWNER_ADDR, mail=OWNER_MAIL, host=HOSTING, form=FORM_PROVIDER, upd=UPDATED_TXT,
        pub=PUBLICIDAD_PRIVACIDAD)
    page("politica-de-privacidad.html", "Política de privacidad",
         "Política de privacidad de FP Cuenta: qué datos se tratan, para qué, con qué base y cómo ejercer tus derechos.",
         prose_section(inner), lead="Qué datos tratamos, para qué y cómo puedes controlarlos.")


def build_cookies():
    if GOOGLE_CMP:
        fila_consentimiento = ""
        terceros = """          <p>
            Este sitio puede mostrar anuncios de Google AdSense. Para cumplir la normativa europea, Google te enseña su propio
            mensaje de consentimiento y solo usa cookies o identificadores para personalizar los anuncios si lo aceptas. Los
            nombres, la duración y los fines concretos los define Google. Los tienes explicados en
            <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">cómo usa Google las cookies</a><span class="sr-only"> (se abre en una pestaña nueva)</span>
            y en <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">cómo usa la información de los sitios que usan sus servicios</a><span class="sr-only"> (se abre en una pestaña nueva)</span>.
          </p>
          <p>
            Esta web no guarda tu elección de anuncios: la guarda Google, que es quien muestra el mensaje.
          </p>"""
        cambiar = """Puedes cambiarla cuando quieras con el botón «Configurar cookies» del pie de cualquier página, que vuelve a
            mostrar el mensaje de Google. También puedes borrar las cookies y los datos del sitio desde los ajustes de tu
            navegador; ten en cuenta que, si lo haces, el sitio te volverá a preguntar y se perderá lo que hubieras guardado
            en la calculadora."""
    else:
        fila_consentimiento = """                <tr>
                  <th scope="row" data-label="Nombre"><code>fpcuenta-consent-v1</code></th>
                  <td data-label="Para qué sirve">Recuerda si aceptaste o rechazaste las cookies de publicidad.</td>
                  <td data-label="Cuánto dura">Hasta que lo borres o cambies tu elección.</td>
                  <td data-label="¿Necesita permiso?">No, es técnica.</td>
                </tr>
"""
        terceros = """          <p>
            Este sitio puede mostrar anuncios de Google AdSense. Solo se cargan si pulsas «Aceptar» en el aviso de cookies.
            Si los activas, Google puede guardar cookies o identificadores en tu navegador para mostrar y medir anuncios, y
            puede personalizarlos. Los nombres, la duración y los fines concretos los define Google. Los tienes explicados en
            <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">cómo usa Google las cookies</a><span class="sr-only"> (se abre en una pestaña nueva)</span>
            y en <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">cómo usa la información de los sitios que usan sus servicios</a><span class="sr-only"> (se abre en una pestaña nueva)</span>.
          </p>
          <p>
            Si pulsas «Rechazar», no se carga nada de Google y el sitio funciona igual. Si no hay anuncios activos en el sitio,
            tampoco se carga ningún elemento de terceros.
          </p>"""
        cambiar = """Puedes cambiarla cuando quieras con el botón «Configurar cookies» del pie de cualquier página. Si retiras un permiso que
            habías dado, la página se recarga para dejar de usar los anuncios. También puedes borrar las cookies y los datos del sitio
            desde los ajustes de tu navegador; ten en cuenta que, si lo haces, el sitio te volverá a preguntar y se perderá lo que
            hubieras guardado en la calculadora."""
    inner = """          <h2>Qué guarda este sitio en tu navegador</h2>
          <p>
            Una cookie es un pequeño archivo que un sitio guarda en tu navegador. Este sitio usa sobre todo el almacenamiento
            local del navegador (<em>localStorage</em>), que funciona de forma parecida y que tratamos con las mismas
            garantías. No usamos cookies de analítica ni de seguimiento propias.
          </p>

          <h2>Elementos propios</h2>
          <div class="table-wrap table-wrap-flat">
            <table class="data-table">
              <caption class="sr-only">Elementos que guarda FP Cuenta en tu navegador</caption>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Para qué sirve</th>
                  <th scope="col">Cuánto dura</th>
                  <th scope="col">¿Necesita permiso?</th>
                </tr>
              </thead>
              <tbody>
%(fila_consentimiento)s                <tr>
                  <th scope="row" data-label="Nombre"><code>fpcuenta-calc-v1</code></th>
                  <td data-label="Para qué sirve">Guarda lo que escribes en la calculadora: comunidad, ciclo, módulos, horas y ajustes.</td>
                  <td data-label="Cuánto dura">Hasta que pulses «Borrar mis datos guardados» o limpies los datos del navegador.</td>
                  <td data-label="¿Necesita permiso?">No, la pides tú al usar la calculadora.</td>
                </tr>
                <tr>
                  <th scope="row" data-label="Nombre"><code>fpcuenta-notas-v1</code></th>
                  <td data-label="Para qué sirve">Guarda lo que escribes en la calculadora de notas: módulo, resultados de aprendizaje, pesos y notas.</td>
                  <td data-label="Cuánto dura">Hasta que pulses «Borrar mis datos guardados» o limpies los datos del navegador.</td>
                  <td data-label="¿Necesita permiso?">No, la pides tú al usar la calculadora.</td>
                </tr>
                <tr>
                  <th scope="row" data-label="Nombre"><code>%(tkey)s</code></th>
                  <td data-label="Para qué sirve">Recuerda si elegiste el modo claro o el oscuro. Si no lo has elegido, el sitio sigue el modo de tu dispositivo.</td>
                  <td data-label="Cuánto dura">Hasta que lo borres.</td>
                  <td data-label="¿Necesita permiso?">No, la pides tú al pulsar el botón del modo oscuro.</td>
                </tr>
                <tr>
                  <th scope="row" data-label="Nombre"><code>fpcuenta-last-message</code></th>
                  <td data-label="Para qué sirve">Apunta la hora del último mensaje enviado desde el buzón, para limitar el envío repetido de mensajes.</td>
                  <td data-label="Cuánto dura">Hasta que lo borres.</td>
                  <td data-label="¿Necesita permiso?">No, es técnica.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Cookies de terceros: Google AdSense</h2>
%(terceros)s

          <h2>Cómo cambiar tu elección</h2>
          <p>
            %(cambiar)s
          </p>

          <h2>Más información</h2>
          <p>
            Cómo tratamos los datos personales lo explicamos en la <a href="politica-de-privacidad.html">política de privacidad</a>.
          </p>
          <p class="prose-note">Última actualización: %(upd)s.</p>""" % dict(upd=UPDATED_TXT, tkey=TEMA_KEY, fila_consentimiento=fila_consentimiento, terceros=terceros, cambiar=cambiar)
    page("politica-de-cookies.html", "Política de cookies",
         "Política de cookies de FP Cuenta: qué guarda el sitio en tu navegador, qué usa Google AdSense y cómo cambiar tu elección.",
         prose_section(inner, wide=True), lead="Qué guarda este sitio en tu navegador y cómo cambiar tu elección.")


def build_404():
    body = """    <section class="section section-ruled">
      <div class="wrap">
        <div class="prose">
          <p>No encontramos la página que buscas. Puede que el enlace esté mal escrito o que la página ya no exista.</p>
          <ul>
            <li><a href="index.html">Ir a la portada</a></li>
            <li><a href="calculadora-faltas.html">Abrir la calculadora de faltas</a></li>
            <li><a href="calculadora-notas.html">Abrir la calculadora de notas</a></li>
            <li><a href="normativa-faltas.html">Ver la normativa por comunidad</a></li>
          </ul>
        </div>
      </div>
    </section>"""
    # Rutas absolutas: esta página se sirve desde cualquier ruta que no exista
    page("404.html", "Página no encontrada", "La página que buscas no existe.", body,
         robots="noindex, follow", h1="No encontramos esa página")


# ---------------------------------------------------------------- archivos técnicos

def build_files():
    claves = ["inicio", "faltas", "notas", "normativa", "sobre", "contacto", "aviso", "privacidad", "cookies"]
    prio = {"inicio": "1.0", "faltas": "0.9", "notas": "0.9", "normativa": "0.8"}
    urls = []
    for k in claves:
        loc = DOMAIN + "/" + ("" if k == "inicio" else RUTAS[k])
        urls.append("  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <priority>%s</priority>\n  </url>"
                    % (loc, UPDATED_ISO, prio.get(k, "0.3")))
    with open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s\n</urlset>\n' % "\n".join(urls))
    with open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8") as f:
        f.write("User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % DOMAIN)
    with open(os.path.join(OUT, "ads.txt"), "w", encoding="utf-8") as f:
        if ADSENSE_ID:
            f.write("google.com, %s, DIRECT, f08c47fec0942fa0\n" % ADSENSE_ID.replace("ca-", "", 1))
        else:
            f.write("# ads.txt de AdSense. Se rellena solo: escribe tu ID en compartido/configuracion.js (adsenseClient)\n"
                    "# y ejecuta de nuevo gen/construir.py. Aparecerá aquí una línea como esta:\n"
                    "# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0\n")


def build_datos():
    """comunidades/<carpeta>/datos.js de cada comunidad."""
    for c in COMUNIDADES:
        escribir("comunidades/%s/datos.js" % c["carpeta"], datos_js(c))


def cuerpo(nombre):
    """Lee gen/cuerpos/<nombre>. {{TENEMOS}} y {{COMUNIDADES}} se sustituyen por las comunidades que haya
    y {{ANUNCIO:nombre}} por un hueco de anuncio (oculto hasta que se configure AdSense)."""
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "cuerpos", nombre), encoding="utf-8") as f:
        texto = f.read()
    texto = texto.replace("{{TENEMOS}}", tenemos()).replace("{{COMUNIDADES}}", lista_es(esc(c["nombre"]) for c in COMUNIDADES))
    return re.sub(r"\{\{ANUNCIO:([\w-]+)\}\}", lambda m: anuncio(m.group(1)), texto)


def build_portada():
    componer("inicio", "Calculadora de faltas y notas para FP",
             "Calcula cuántas horas puedes faltar en tu ciclo de FP, por módulo y por trimestre, y tu nota por resultados de aprendizaje. Gratis y sin registro.",
             cuerpo("portada.html"),
             jsonld={"@type": "WebSite", "name": "FP Cuenta",
                     "description": "Herramientas gratuitas para el alumnado de Formación Profesional: calculadora de faltas "
                                    "de asistencia por módulo y calculadora de notas por resultados de aprendizaje."})


def build_faltas():
    componer("faltas", "Calculadora de faltas en FP: cuántas horas puedes faltar",
             "Elige tu comunidad, tu ciclo y tu curso de FP, apunta las horas que llevas faltadas en cada módulo y calcula cuántas te quedan antes de perder la evaluación continua.",
             cuerpo("calculadora-faltas.html"),
             jsonld={"@type": "WebApplication", "name": "Calculadora de faltas de asistencia en FP",
                     "applicationCategory": "EducationalApplication",
                     "operatingSystem": "Cualquiera con navegador web",
                     "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}})


def build_notas():
    componer("notas", "Calculadora de notas de FP por resultados de aprendizaje",
             "Apunta la nota de cada resultado de aprendizaje de un módulo de FP, marca los que no has cursado y calcula tu nota actual y la que necesitas en el resto para aprobar.",
             cuerpo("calculadora-notas.html"),
             jsonld={"@type": "WebApplication", "name": "Calculadora de notas de FP por resultados de aprendizaje",
                     "applicationCategory": "EducationalApplication",
                     "operatingSystem": "Cualquiera con navegador web",
                     "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}})


if __name__ == "__main__":
    build_datos()
    build_portada()
    build_faltas()
    build_notas()
    build_normativa()
    build_sobre()
    build_contacto()
    build_aviso()
    build_privacidad()
    build_cookies()
    build_404()
    build_files()
    print("comunidades:", ", ".join("%s (%d ciclos)" % (c["carpeta"], len(c["ciclos"])) for c in COMUNIDADES))
    print("páginas generadas en", OUT)

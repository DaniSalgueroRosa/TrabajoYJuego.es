# -*- coding: utf-8 -*-
"""
Lista lo que falta por rellenar antes de subir la web (y de pedir AdSense). No modifica nada.

Uso:  python3 -I gen/antes_de_publicar.py        (desde cualquier carpeta)
Termina con código 0 si no queda nada pendiente y con 1 si falta algo.
"""
import glob
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pendiente, listo = [], []


def leer(ruta):
    with open(os.path.join(RAIZ, ruta), encoding="utf-8") as f:
        return f.read()


def paginas():
    return sorted(os.path.relpath(p, RAIZ) for p in glob.glob(os.path.join(RAIZ, "**", "*.html"), recursive=True)
                  if os.sep + "gen" + os.sep not in p)


def clave(js, nombre):
    m = re.search(r"^\s*%s\s*:\s*'([^']*)'" % nombre, js, re.M)
    return m.group(1).strip() if m else ""


# 1) Datos de la persona titular (marcadores amarillos en los textos legales)
marcadores = {}
for p in paginas():
    n = len(re.findall(r'class="placeholder"', leer(p)))
    if n:
        marcadores[p] = n
if marcadores:
    pendiente.append("Datos de la persona titular sin rellenar (%d marcadores). Busca  grep -rn 'class=\"placeholder\"' .  y cámbialos en gen/construir.py "
                     "(OWNER_NAME, OWNER_ID, OWNER_ADDR, OWNER_MAIL, HOSTING, FORM_PROVIDER) y vuelve a ejecutar construir.py. Páginas: %s"
                     % (sum(marcadores.values()), ", ".join(sorted(marcadores))))
else:
    listo.append("Los textos legales no tienen marcadores pendientes.")

# 2) Dominio
construir = leer("gen/construir.py")
dominio = re.search(r'^DOMAIN\s*=\s*"([^"]+)"', construir, re.M)
dominio = dominio.group(1) if dominio else ""
if "tudominio" in dominio:
    pendiente.append("El dominio sigue siendo %s: cambia DOMAIN en gen/construir.py (canonical, sitemap.xml y robots.txt) y vuelve a ejecutarlo." % dominio)
else:
    listo.append("Dominio: %s" % dominio)

# 3) Configuración
cfg = leer("compartido/configuracion.js")
correo = clave(cfg, "contactEmail")
if "tudominio" in correo or not correo:
    pendiente.append("contactEmail sigue siendo %r: pon tu correo de contacto en compartido/configuracion.js." % correo)
else:
    listo.append("Correo de contacto configurado.")
if clave(cfg, "suggestionsEndpoint"):
    listo.append("Buzón de sugerencias: se envía al servicio configurado.")
else:
    listo.append("Buzón de sugerencias: sin servicio externo (abre el programa de correo de la persona). Es válido; Formspree o similar es más cómodo.")

# 4) AdSense
ads = clave(cfg, "adsenseClient")
modo = clave(cfg, "consentimiento") or "propio"
if not ads:
    pendiente.append("AdSense: aún no hay ID. Cuando te registres, escribe adsenseClient en compartido/configuracion.js y ejecuta construir.py "
                     "(así salen la metaetiqueta y ads.txt).")
else:
    meta = '<meta name="google-adsense-account" content="%s">' % ads
    sin_meta = [p for p in paginas() if meta not in leer(p)]
    if sin_meta:
        pendiente.append("AdSense: el ID está en configuracion.js pero faltan la metaetiqueta en %s. Ejecuta de nuevo gen/construir.py." % ", ".join(sin_meta))
    else:
        listo.append("AdSense: metaetiqueta en todas las páginas (%s)." % ads)
    linea = "google.com, %s, DIRECT, f08c47fec0942fa0" % ads.replace("ca-", "", 1)
    if linea in leer("ads.txt"):
        listo.append("ads.txt con tu ID.")
    else:
        pendiente.append("ads.txt no tiene tu ID. Ejecuta de nuevo gen/construir.py.")
    if modo == "google":
        listo.append("Consentimiento: lo muestra Google. Comprueba en AdSense → Privacidad y mensajes que el mensaje de normativa europea está publicado para tu sitio.")
    else:
        pendiente.append("Consentimiento: usas el aviso propio. Para mostrar anuncios personalizados a visitas de la UE, Google exige una plataforma de consentimiento "
                         "certificada: lo más sencillo es consentimiento: 'google' en configuracion.js y publicar el mensaje en AdSense → Privacidad y mensajes.")
    bloque = re.search(r"adsenseSlots\s*:\s*\{(.*?)\}", cfg, re.S)
    huecos = re.findall(r"^\s*(\w+)\s*:\s*'(\d*)'", bloque.group(1), re.M) if bloque else []
    sin = [k for k, v in huecos if not v]
    if sin and len(sin) == len(huecos):
        listo.append("Bloques de anuncios sin configurar: solo funcionarán los anuncios automáticos (actívalos en AdSense) o añade los números en adsenseSlots.")
    elif sin:
        listo.append("Bloques de anuncios sin número (no se mostrarán): %s." % ", ".join(sin))
    else:
        listo.append("Bloques de anuncios configurados: %s." % ", ".join(k for k, _ in huecos))

# 5) Archivos que Google y los buscadores esperan
for archivo in ("robots.txt", "sitemap.xml", "ads.txt", "404.html"):
    if os.path.exists(os.path.join(RAIZ, archivo)):
        listo.append("Existe %s." % archivo)
    else:
        pendiente.append("Falta %s: ejecuta gen/construir.py." % archivo)

print("PENDIENTE (%d)" % len(pendiente))
for t in pendiente:
    print("  - " + t)
print("\nLISTO (%d)" % len(listo))
for t in listo:
    print("  - " + t)
sys.exit(1 if pendiente else 0)

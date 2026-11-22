# -*- coding: utf-8 -*-
"""Seguridad del sitio publicado: política de contenido (CSP), cabeceras HTTP y configuración del servidor.

El sitio es estático, así que lo que se puede (y se debe) endurecer es lo que el navegador hace con él:
  · CSP estricta: solo código y recursos del propio dominio, nada en línea, sin plugins, sin <base>, sin marcos ajenos.
    Es posible porque el código del proyecto no usa scripts, estilos ni manejadores en línea (lo vigila comprobar.py).
  · Con publicidad ACTIVA la CSP admite a Google AdSense. Google no publica una lista de dominios y avisa de que una política más
    estricta puede romper los anuncios; la que documenta exige permitir scripts «https:» y en línea. Es la única diferencia y solo
    aparece cuando los anuncios están activos.
  · La política va por DOS caminos: en cada página como <meta http-equiv> (protege aunque el hosting ignore las cabeceras; no admite
    frame-ancestors ni upgrade-insecure-requests) y como cabecera HTTP en «_headers» (Cloudflare Pages / Netlify) y «.htaccess» (Apache / LiteSpeed,
    que es lo que usa Hostinger). Si coinciden las dos, el navegador aplica la intersección, es decir, la misma política.

Todo se genera en cada construcción a partir de aquí: no hay nada que editar a mano en dist/.
"""
from __future__ import annotations

from datetime import date, timedelta

# --- Política de contenido -------------------------------------------------------------------------------------------------------------------
# (directiva, valores). Orden estable para que la salida sea idéntica entre construcciones.
_ESTRICTA = (
    ("default-src", "'none'"),
    ("script-src", "'self'"),
    ("style-src", "'self'"),
    ("img-src", "'self' data: blob:"),
    ("font-src", "'self' data:"),
    ("connect-src", "'self'"),
    ("media-src", "'self' blob: data:"),
    ("worker-src", "'self' blob:"),
    ("manifest-src", "'self'"),
    ("frame-src", "'none'"),
    ("object-src", "'none'"),
    ("base-uri", "'none'"),
    ("form-action", "'self'"),
)

# Con anuncios: lo mismo, pero AdSense necesita cargar su script y sus marcos de «https:», y colocar estilos y un pequeño script en línea.
_CON_ANUNCIOS = (
    ("default-src", "'self'"),
    ("script-src", "'self' 'unsafe-inline' 'unsafe-eval' https:"),
    ("style-src", "'self' 'unsafe-inline' https:"),
    ("img-src", "'self' data: blob: https:"),
    ("font-src", "'self' data: https:"),
    ("connect-src", "'self' https:"),
    ("media-src", "'self' blob: data: https:"),
    ("worker-src", "'self' blob:"),
    ("manifest-src", "'self'"),
    ("frame-src", "https:"),
    ("object-src", "'none'"),
    ("base-uri", "'none'"),
    ("form-action", "'self'"),
)

# Solo pueden ir en la cabecera HTTP (el navegador las ignora dentro de <meta>).
_SOLO_CABECERA = (("frame-ancestors", "'none'"), ("upgrade-insecure-requests", ""))


def _texto(directivas) -> str:
    return "; ".join((f"{d} {v}" if v else d) for d, v in directivas)


def csp_meta(con_anuncios: bool) -> str:
    """Política para <meta http-equiv="Content-Security-Policy"> (sin las directivas que solo valen como cabecera)."""
    return _texto(_CON_ANUNCIOS if con_anuncios else _ESTRICTA)


def csp_cabecera(con_anuncios: bool) -> str:
    return _texto((_CON_ANUNCIOS if con_anuncios else _ESTRICTA) + _SOLO_CABECERA)


# --- Cabeceras -------------------------------------------------------------------------------------------------------------------------------
# El micrófono solo se permite al propio sitio (el afinador y la grabadora de voz lo piden); el resto de sensores y APIs de hardware, a nadie.
PERMISOS = ("accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), hid=(), magnetometer=(), "
            "microphone=(self), midi=(), payment=(), serial=(), usb=(), xr-spatial-tracking=()")


def cabeceras(con_anuncios: bool) -> list[tuple[str, str]]:
    return [
        ("Content-Security-Policy", csp_cabecera(con_anuncios)),
        ("Strict-Transport-Security", "max-age=31536000; includeSubDomains"),
        ("X-Content-Type-Options", "nosniff"),
        ("X-Frame-Options", "DENY"),
        ("Referrer-Policy", "strict-origin-when-cross-origin"),
        ("Permissions-Policy", PERMISOS),
        ("Cross-Origin-Opener-Policy", "same-origin-allow-popups"),
        ("X-Permitted-Cross-Domain-Policies", "none"),
    ]


def archivo_headers(con_anuncios: bool) -> str:
    """Contenido de «_headers» (Cloudflare Pages y Netlify): una sola regla que vale para todas las rutas."""
    lineas = [
        "# Cabeceras de seguridad. Archivo generado por «python3 sitio.py construir»; no lo edites a mano.",
        "# Lo lee Cloudflare Pages (y Netlify). En Hostinger u otro Apache/LiteSpeed no hace nada: ahí valen las del archivo .htaccess.",
        "/*",
    ]
    lineas += [f"  {n}: {v}" for n, v in cabeceras(con_anuncios)]
    return "\n".join(lineas) + "\n"


def archivo_htaccess(con_anuncios: bool) -> str:
    """Contenido de «.htaccess» (Apache y LiteSpeed, es decir, Hostinger): cabeceras, HTTPS obligatorio y cierre de lo que no debe servirse."""
    fijas = "\n".join(f'  Header always set {n} "{v}"' for n, v in cabeceras(con_anuncios))
    return f"""# Seguridad del servidor. Archivo generado por «python3 sitio.py construir»; no lo edites a mano.
# Lo lee Apache y LiteSpeed (Hostinger y casi todo el alojamiento compartido). En Cloudflare Pages no hace nada: ahí valen las del archivo _headers.

# Cabeceras de seguridad (las mismas que _headers).
<IfModule mod_headers.c>
{fijas}
  Header always unset X-Powered-By
</IfModule>

# Sin listados de carpetas, sin firma del servidor y con la codificación indicada.
Options -Indexes
ServerSignature Off
AddDefaultCharset UTF-8

# Página 404 propia.
ErrorDocument 404 /404.html

# Nada de lo que no sea una página estática se sirve: archivos ocultos, copias, código fuente, mapas de depuración o este mismo _headers.
<FilesMatch "^(\\.|_headers$|.*\\.(bak|old|orig|sql|log|ini|env|py|md|map|zip|tar|gz|sh)$)">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
</FilesMatch>

<IfModule mod_rewrite.c>
  RewriteEngine On
  # Un sitio estático solo se lee: cualquier otro método (POST, PUT, DELETE, TRACE...) se rechaza.
  RewriteCond %{{REQUEST_METHOD}} !^(GET|HEAD|OPTIONS)$
  RewriteRule ^ - [R=405,L]
  # HTTPS obligatorio. La segunda condición evita el bucle de redirecciones si delante hay un proxy (por ejemplo Cloudflare) que ya habla HTTPS.
  RewriteCond %{{HTTPS}} !=on
  RewriteCond %{{HTTP:X-Forwarded-Proto}} !https
  RewriteRule ^ https://%{{HTTP_HOST}}%{{REQUEST_URI}} [L,R=301]
</IfModule>
"""


def security_txt(email: str, url: str, hoy: date | None = None) -> str | None:
    """/.well-known/security.txt (RFC 9116): a quién avisar si alguien encuentra un fallo. Solo si el titular ha puesto un correo real;
    «Expires» es obligatorio y se renueva en cada construcción (caduca a los 360 días si no se vuelve a construir)."""
    if not email:
        return None
    caduca = (hoy or date.today()) + timedelta(days=360)
    return (f"Contact: mailto:{email}\n"
            f"Expires: {caduca.isoformat()}T00:00:00Z\n"
            "Preferred-Languages: es\n"
            f"Canonical: {url.rstrip('/')}/.well-known/security.txt\n")

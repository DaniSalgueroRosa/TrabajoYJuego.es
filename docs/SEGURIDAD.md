# Seguridad

El sitio es estático: no hay servidor propio, base de datos, cuentas, formularios ni cookies propias. La superficie de ataque real es
(1) lo que el navegador hace con las páginas, (2) la configuración del hosting y (3) las cuentas con las que se publica. Aquí está lo que ya viene
hecho en el código y lo poco que depende de ti.

## Lo que ya hace el código (se genera solo en cada `construir`)

| Medida | Qué evita |
|---|---|
| **Política de contenido (CSP) estricta**, en cada página (`<meta>`) y como cabecera: solo scripts, estilos, imágenes y datos del propio dominio; nada en línea; sin `<base>`, sin marcos, sin plugins | Que un fallo de inyección de código (XSS) llegue a ejecutarse; que se cargue nada ajeno |
| `frame-ancestors 'none'` y `X-Frame-Options: DENY` | Que otra web meta la tuya en un marco (clickjacking) |
| `Strict-Transport-Security` (un año, con subdominios) | Que el navegador vuelva a usar `http://` |
| `X-Content-Type-Options: nosniff` | Que se interprete un archivo como otra cosa |
| `Referrer-Policy: strict-origin-when-cross-origin` | Que se filtren direcciones completas a otras webs |
| `Permissions-Policy`: micrófono solo para el propio sitio (afinador y grabadora); cámara, ubicación, pagos, USB… a nadie | Que una página o un anuncio pida sensores |
| `Cross-Origin-Opener-Policy: same-origin-allow-popups` | Que una ventana ajena controle la tuya |
| `.htaccess` (Apache/LiteSpeed, Hostinger): HTTPS obligatorio sin bucle tras un proxy, sin listado de carpetas, solo GET/HEAD/OPTIONS, nada de archivos ocultos, copias, código ni mapas | Configuraciones por defecto flojas del alojamiento |
| `_headers` (Cloudflare Pages/Netlify): las mismas cabeceras | Lo mismo, si eliges Cloudflare |
| `/.well-known/security.txt` (solo si pones tu correo en `config/titular.json`) | Que quien encuentre un fallo sepa a quién avisar |
| Código sin sumideros de inyección: ni `innerHTML`, ni `eval`, ni `document.write`; los estilos dinámicos van por la API del navegador (CSSOM) y los colores de los temas, por reglas de CSS | Cualquier texto del usuario convertido en código |
| Nada de terceros salvo AdSense y solo con publicidad activa; pdf.js, JSZip y pdf-lib van incluidos (en `herramientas/datos/vendor/`), no se cargan de ninguna CDN | Ataques a través de un servidor ajeno |

`python3 sitio.py comprobar` **falla** si alguna página pierde la política, lleva un `style=`, un manejador `onclick=`, un `<script>` o `<style>` en línea,
un `<iframe>`, un recurso de otro dominio o un enlace `target="_blank"` sin `rel="noopener"`; si falta `_headers` o `.htaccess` o no llevan todas las cabeceras;
si se publica un archivo prohibido (`.bak`, `.py`, `.md`, `.map`, `.zip`, ocultos…) o si el JavaScript propio usa un sumidero de inyección.
`pruebas/test_seguridad.py` vigila lo mismo y todas las pruebas en Chrome se ejecutan con la política puesta: una violación aparece como error de consola.
`python3 sitio.py servir` envía las mismas cabeceras (menos HSTS), así que lo que ves en local ya se comporta como en producción.

## Con publicidad activa

AdSense obliga a abrir la política: Google no publica una lista de dominios y su guía exige permitir scripts de `https:` y en línea. Por eso, **solo en las páginas que
cargan el código de Google** (y solo cuando `publicidad.activa` es `true`), la política admite `https:` en `script-src`, `style-src`, `img-src`, `connect-src` y `frame-src`.
Siguen cerrados `object-src`, `base-uri`, `form-action`, `worker-src`, `frame-ancestors` y todo lo demás; las páginas legales, la 404 y las que no llevan anuncios conservan la política estricta
(la del `<meta>`; la cabecera abierta no puede abrir lo que el `<meta>` cierra, porque el navegador aplica las dos a la vez).

## Lo que depende de ti (y es lo que más se ataca en la práctica)

1. **Verificación en dos pasos (2FA)** en: el registrador del dominio, el hosting (Hostinger o Cloudflare), AdSense/Google, el correo del titular y GitHub si lo usas. Es la medida que más pesa; casi todos los robos de webs pequeñas son de cuentas, no de código.
2. **Contraseñas únicas** (gestor de contraseñas) y **correo del titular aparte** del correo personal del día a día.
3. **Bloqueo de transferencia del dominio** activado y **renovación automática** (un dominio caducado lo compra otro).
4. **DNS**: DNSSEC si el registrador lo ofrece (un clic); un registro **CAA** (`0 issue "letsencrypt.org"` o el que use el hosting); y, si recibes correo en el dominio, **SPF, DKIM y DMARC** (el hosting te da los valores). Evitan que alguien envíe correo en tu nombre.
5. **Tras publicar**: pasa `https://securityheaders.com` y `https://developer.mozilla.org/es/observatory` con tu dirección. Esperable: A o A+ (el modo con anuncios puede quedarse en B por la política abierta que exige Google; es el precio de AdSense).
6. **Cada pocos meses**: `python3 sitio.py comprobar`, reconstruir y subir (renueva la fecha de `security.txt`, que caduca a los 360 días), y mirar si hay versión nueva de las tres librerías incluidas (versiones actuales en `herramientas/datos/vendor/LICENCIAS.txt`).
7. **Copia de seguridad**: el proyecto completo (el .zip) es la copia; guárdalo fuera del hosting.

## Decisiones tomadas (por si te lo preguntas)

- **HSTS sin `preload`**: apuntar el dominio a la lista de precarga de los navegadores es casi irreversible. Si algún día quieres, se añade `; preload` en `motor/seguridad.py` y se solicita en hstspreload.org.
- **Sin `Cross-Origin-Resource-Policy` ni `Cross-Origin-Embedder-Policy`**: el contenido es público y no hay nada privado que aislar; pondrían en riesgo las vistas previas al compartir enlaces y los anuncios.
- **Sin Trusted Types**: lo soporta solo Chromium y las librerías incluidas (pdf.js) no lo cumplen; con las otras defensas no añade nada al código propio, que ya no usa `innerHTML`.
- **Sin SRI**: se aplica a scripts de terceros y aquí no hay ninguno (AdSense no admite SRI porque Google cambia su script sin aviso).
- **Sin formularios ni almacenamiento**: no hay datos personales que proteger ni robar; el contacto es solo por correo.

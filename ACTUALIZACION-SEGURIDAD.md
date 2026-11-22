# Actualización: seguridad

Copia el contenido del zip sobre tu proyecto (sustituye lo que ya existe; la carpeta `vista-previa/` es solo para mirar el sitio con Live Server). Luego `python3 sitio.py construir`.

## Qué cambia

- **Política de contenido (CSP) estricta** en cada página y como cabecera HTTP: solo código y recursos del propio dominio, nada en línea, sin `<base>`, sin marcos, sin plugins. Con publicidad activa se abre a Google **solo en las páginas que cargan su código**.
- **`dist/_headers`** (Cloudflare Pages) y **`dist/.htaccess`** (Hostinger y todo Apache/LiteSpeed) se generan solos: política, HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HTTPS obligatorio sin bucle, sin listado de carpetas, solo GET/HEAD/OPTIONS y archivos ocultos/copias/código cerrados. Sube el que corresponda a tu hosting (el otro sobra, no molesta).
- **`/.well-known/security.txt`**: solo se crea cuando pongas tu correo en `config/titular.json`.
- **Código sin puntos débiles**: los colores de los temas de los tests pasan a reglas de CSS (`data-tema`), los estilos de los juegos y tests se aplican por la API del navegador, el diagrama de flujo ya no usa `innerHTML` y el `display:block` de los anuncios pasa al CSS.
- **`comprobar` ahora falla** si una página pierde la política o lleva estilos, scripts o manejadores en línea, `<iframe>`, recursos ajenos o enlaces `_blank` sin `noopener`; si faltan los archivos de cabeceras; si se publica un archivo prohibido (`.bak`, `.py`, `.md`, `.map`…) o si el JavaScript propio usa `innerHTML`, `eval`, etc.
- `python3 sitio.py servir` envía las mismas cabeceras (menos HSTS): lo que ves en local ya se comporta como en producción.
- Guía nueva: `docs/SEGURIDAD.md` (qué hace cada medida y lo que depende de ti: 2FA en registrador, hosting, AdSense y correo; DNSSEC, CAA, SPF/DKIM/DMARC). `docs/PUBLICAR.md` y `docs/PENDIENTES.md` actualizados.

## Comprobado

479 pruebas de Python (18 nuevas de seguridad), `comprobar` sin errores, las 353 páginas cargadas en Chrome real con la política y las cabeceras puestas sin ninguna violación, y todas las pruebas interactivas de herramientas, juegos y tests (PDF, audio con micrófono simulado, imágenes, QR…) con la política activa.

## A tener en cuenta

- Con anuncios activos no he podido probar contra los servidores de Google (sin red desde aquí). La política de ese modo sigue lo que Google documenta; si tras activarlos algún anuncio no se ve, dímelo y lo ajusto.
- Solo se ha probado en Chrome. Las cabeceras son estándar y Firefox/Safari las respetan, pero no las he visto funcionar allí.
- Tras publicar, pasa `securityheaders.com` con tu dirección: debe salir A o A+ (con anuncios activos puede quedarse en B por lo que exige Google).
- Si usas Hostinger, `.htaccess` empieza por punto y algunos programas lo ocultan: sube el .zip y descomprímelo en el administrador de archivos.

# codeLadder — web estática

Sitio de **codeladder.es**: portada, páginas legales (con lo necesario para Google AdSense) y pantallas de cuenta. Es HTML, CSS y JavaScript sin dependencias. Las páginas se generan con un script de Node (sin paquetes) a partir de una plantilla común.

## Cómo verla

- En local: abre `index.html` con el navegador (doble clic).
- Online: sube **el contenido** de esta carpeta a la raíz de tu hosting (Cloudflare Pages, Hostinger, GitHub Pages…). Puedes dejar fuera `src/`, `tools/` y `site.config.json`.

## Cómo se generan las páginas

Necesitas Node 18 o superior. Cada vez que cambies algo en `src/` o en `site.config.json`:

```
node tools/build.mjs
```

Genera en la raíz todas las páginas `.html`, `sitemap.xml`, `robots.txt` y `ads.txt`. **No edites los `.html` de la raíz a mano**: se sobrescriben.

```
site.config.json         tus datos (titular, NIF, correo…) y el ID de AdSense
src/shell.html           plantilla común: barra superior, menú, pie, ventana de cookies
src/pages/*.html         el contenido de cada página (cabecera JSON + HTML)
tools/build.mjs          el generador
assets/css/style.css     diseño (colores y medidas arriba, en :root)
assets/js/i18n.js        textos de la interfaz, en español e inglés
assets/js/main.js        tema, idioma, selector de lenguaje, cuentas, cookies, buscador Ctrl K
```

Para añadir una página: crea `src/pages/mi-pagina.html` con una cabecera entre `---` (copia la de otra: `file`, `title`, `description`, `tab`, `group`, `pageClass`, `robots`) y ejecuta el script. Aparece sola en el sitemap, salvo que pongas `"robots": "noindex,follow"`.

## Páginas legales: lo que tienes que completar

Los textos son **plantillas redactadas para la normativa española** (LSSI-CE, RGPD y LOPDGDD). No son asesoramiento jurídico: pide que los revise un profesional antes de publicar.

1. Abre `site.config.json` y rellena la sección `legal`: `owner` (nombre o razón social), `nif`, `address`, `city`, `email`, `hosting` y `mailProvider`.
2. Mientras haya datos sin rellenar, aparecen en amarillo como `[Titular: …]`. Al ejecutar el script ves cuántos quedan en cada página.
3. Algunas frases amarillas están escritas a mano en `src/pages/` y piden una decisión tuya (licencia de los ejemplos de código, quién eres en «Sobre codeLadder», cuándo se activan cuentas y publicidad). Búscalas con `grep -rn 'class="todo"' src/pages`.
4. Con todo resuelto, pon `"draft": false`. Desaparece el aviso de borrador. Si lo haces con campos pendientes, el script termina con error para que no publiques a medias.

Los textos legales están solo en español. El interruptor ES / EN traduce la interfaz, no estas páginas.

## Google AdSense

- **ads.txt:** cuando Google te dé tu ID de editor, ponlo en `adsensePublisherId` (formato `pub-0000000000000000`) y ejecuta el script. Genera `ads.txt` con el formato correcto.
- **Aviso de cookies:** la política de privacidad y la de cookies ya incluyen lo que Google exige explicar: que terceros usan cookies para mostrar anuncios según visitas anteriores, y cómo desactivar la personalizada. **No hay todavía banner de consentimiento propio ni código de anuncios**, a propósito: en el Espacio Económico Europeo, el Reino Unido y Suiza, Google exige un gestor de consentimiento certificado (TCF). El que ofrece Google dentro de AdSense, «Privacidad y mensajes», cumple. Cuando actives la publicidad, créalo ahí y pega su código, y ajusta las frases marcadas en amarillo en las políticas.
- El botón «Configurar cookies» del pie hoy abre una ventana que muestra lo que se guarda (tema, idioma y lenguaje) y permite borrarlo. Cuando integres el gestor de Google, ese botón debe abrir su ventana de preferencias.
- Google decide si aprueba el sitio; conviene tener ya contenidos reales publicados antes de solicitarlo.

## Cuentas

`iniciar-sesion.html`, `crear-cuenta.html` y `recuperar-contrasena.html` son **solo la interfaz**: validan los campos en el navegador (correo, contraseña de 8+ caracteres, aceptación de condiciones, 14 años o más) y avisan de que las cuentas aún no están activas. **No se envía ni se guarda ningún dato.** Cuando exista backend y base de datos, se enchufan en el manejador del formulario (`data-auth`, en `assets/js/main.js`) y se actualizan la política de privacidad y las condiciones. Están marcadas `noindex`.

## Qué funciona ahora

- Interruptor claro / oscuro y ES / EN en la barra de abajo. Se recuerdan en el navegador junto con el lenguaje elegido (`cl-theme`, `cl-lang`, `cl-track`); es lo único que se guarda, sin cookies ni analítica ni peticiones a terceros.
- Buscador con **Ctrl K** (⌘ K en Mac): navega por las páginas, abre la configuración de cookies y cambia tema e idioma; en la portada, también lenguajes y niveles.
- 12 lenguajes en la portada (Java primero; el resto como «Pronto»). Para entrar en un nivel hace falta elegir uno; si no hay ninguno, se abre un selector.
- Los niveles, el menú superior y la barra lateral todavía no enlazan a nada: muestran un aviso «Esta sección estará disponible muy pronto».

## Cosas que se editan fácil

- **Textos de la interfaz:** `assets/js/i18n.js` (claves `es` y `en`, mismas en ambas).
- **Textos de las páginas:** `src/pages/`.
- **Colores:** variables al principio de `assets/css/style.css`. `--accent` es el naranja de Java; cada lenguaje usa su color en la tarjeta (`--lang`, en `src/pages/index.html`).
- **Lenguajes:** tarjetas de «Elige lenguaje» en `src/pages/index.html`. El selector y la paleta se construyen solos a partir de ellas.

## Pendiente antes de publicar

- Registrar el dominio codeladder.es y comprobar que el nombre está libre como marca (OEPM / EUIPO).
- Comprobar nombres de usuario libres (GitHub, redes).
- Rellenar `site.config.json`, revisar los textos legales con un profesional y poner `"draft": false`.
- Decidir backend y base de datos para las cuentas.
- Sustituir los avisos por enlaces reales cuando existan las secciones.

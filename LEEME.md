# TrabajoYJuego · v2

Herramientas, recursos, juegos y tests bajo una misma marca, en español. Esta entrega contiene la portada, **120 herramientas**, **32 guías** que las explican, **69 juegos completos**, el **apartado legal**
(seis páginas), listados con buscador y categorías, la estructura preparada para AdSense y las pruebas. Los tests siguen vacíos, listos para ir metiendo contenido carpeta a carpeta.

**Para instalarlo, empieza por [INSTALACION-JUEGOS.md](INSTALACION-JUEGOS.md) (los pasos valen igual con las herramientas). Qué trae la última ampliación: [ACTUALIZACION-30-HERRAMIENTAS.md](ACTUALIZACION-30-HERRAMIENTAS.md).**

Para ejecutarlo solo hace falta **Python 3.11 o superior** (probado con 3.11, 3.12 y 3.13). No hay que instalar nada.

## Verlo

Necesitas **Python 3.11 o superior** (https://www.python.org/downloads/; en Windows, al instalarlo marca «Add python.exe to PATH»).
No hay que instalar nada más. Elige una de estas formas; las tres abren el sitio en el navegador y se reconstruye solo cada vez que guardas un archivo.

1. **Doble clic** en `ver-el-sitio.bat` (Windows) o `ver-el-sitio.command` (Mac; la primera vez, clic derecho → Abrir).
2. **Desde VS Code:** *Archivo → Abrir carpeta…* y elige la carpeta `trabajoyjuego-v2` (la que contiene `sitio.py`, no la de fuera).
   Abre `sitio.py` y pulsa el botón ▶ de arriba a la derecha, o escribe en la terminal de VS Code:
   - Windows: `py sitio.py servir`
   - Mac y Linux: `python3 sitio.py servir`
3. **Sin Python:** la carpeta `vista-previa/` (al lado de `trabajoyjuego-v2/` en `juegos.zip`) es el sitio ya construido, solo para mirarlo. Ábrela en VS Code con la extensión *Live Server*
   (clic derecho en `index.html` → *Open with Live Server*). No la abras con doble clic sobre `index.html`: las direcciones son carpetas
   (`/juegos/`) y el navegador, sin servidor, no sabe abrirlas. **No la subas al hosting** (es una copia de preproducción: lleva `noindex`); lo que se sube sale de `python3 sitio.py construir`.

### Si no arranca

| Qué ves | Qué pasa | Qué hacer |
|---|---|---|
| «`python3` no se reconoce…» (Windows) | En Windows el comando no se llama `python3` | Usa `py sitio.py servir` o `python sitio.py servir` |
| Se abre la Microsoft Store al escribir `python` | Windows trae un acceso directo que no es Python | Instala Python desde python.org y marca «Add python.exe to PATH» |
| «Este proyecto necesita Python 3.11 o superior» | Tu Python es más antiguo | Instala uno más reciente |
| «No module named motor» o «no such file sitio.py» | Estás en otra carpeta | Abre en VS Code la carpeta `trabajoyjuego-v2` y lanza el comando desde ahí |
| Una ventana que se abre y se cierra al instante | Se ha lanzado sin terminal | Usa `ver-el-sitio.bat`, que se queda abierta y explica el fallo |
| «No he podido abrir ningún puerto» | El 8080 y los siguientes están ocupados | `py sitio.py servir --puerto 9000` |
| El navegador no se abre solo | No hay navegador predeterminado | Abre tú http://localhost:8080 (lo dice la terminal) |
| «No se ha podido construir el sitio» + un texto | Un archivo de contenido está mal | Es un error explicado en español: dice el archivo y la línea |

Si sigue sin ir, copia el texto exacto que sale en la terminal: con eso se ve la causa.

## Cómo está organizado

Cada parte del sitio es una carpeta con **su HTML y su CSS dentro**.

```
portada/                    la portada
  portada.html              ensambla las partes
  portada.css               reglas de la página en conjunto
  hero/      hero.html      hero.css       las dos mitades «Trabajo | Juego»
  novedades/ novedades.html novedades.css  lo último publicado
  explorar/  explorar.html  explorar.css   índice por categoría, con cada juego enlazado
  sobre/     sobre.html     sobre.css      qué es el sitio
  informacion/ informacion.html informacion.css  sin registro, datos, publicidad y las páginas legales

herramientas/               sección 1   (aspecto «Trabajo»: formal y animado) ← las 120 herramientas, ver docs/HERRAMIENTAS.md
recursos/                   sección 2   (aspecto «Trabajo», versión de lectura) ← 32 guías, una por grupo de herramientas
juegos/                     sección 3   (aspecto «Juego»: retro) ← los 69 juegos, ver docs/JUEGOS.md
tests/                      sección 4   (cada test pone su propio aspecto)
legal/                      sección 5   (aviso legal, privacidad, cookies, condiciones, publicidad y contacto; en el pie y en el bloque «Información y transparencia» de la portada, no en el menú)
  seccion.json              título, descripción y orden de la sección
  listado.html              la página con todos los elementos de la sección
  ficha.html                la plantilla de cada elemento
  <sección>.css             el CSS de la sección
  _plantilla/               un elemento en blanco para copiar (no se publica)
  juego1/                   ← un elemento: aquí es donde se mete lo nuevo
    ficha.json              título, descripción, fecha…
    pagina.html             el contenido de la página
    app.css  app.js         opcionales: se enlazan solos
    …                       imágenes, sonidos, datos (.json) o lo que necesite
  datos/                    (opcional) archivos que se publican tal cual, compartidos por la sección
  *.js                      (opcional) código compartido por los elementos de la sección

comun/                      lo que comparten todas las páginas (colores, tipos, cabecera, pie, tarjeta…)
config/sitio.json           nombre, dirección web, entorno
config/titular.json         tus datos para las páginas legales (vacío = «[COMPLETAR POR EL TITULAR]»)
config/publicidad.json      AdSense: activa, identificador de editor y bloques (apagada por defecto)
sitio.py                    el programa: servir, construir, comprobar, probar, paquete
ver-el-sitio.bat / .command doble clic para ver el sitio (Windows / Mac)
motor/                      el generador (no hace falta tocarlo)
pruebas/                    pruebas automáticas (no se llama «tests» porque ese nombre es una sección)
docs/                       documentación
INSTALACION-JUEGOS.md       cómo instalar y probar la ampliación (empieza aquí)
```

## Añadir un juego (o una herramienta, un recurso o un test)

1. Copia `juegos/_plantilla/` y llama a la copia como quieres que sea la dirección: `juegos/juego1/`
   (minúsculas, sin acentos, con guiones: `cuatro-en-raya`).
2. Rellena `ficha.json` y `pagina.html`. Pon tu CSS en `app.css` y tu código en `app.js`.
3. Guarda. El juego aparece en el listado de Juegos, en el índice por categoría de la portada, en «Lo último» (si es de los más recientes) y en el menú sin tocar nada más.

Mientras trabajas en algo, pon `"estado": "borrador"` en su `ficha.json` y no se publica.
Con `"estado": "proximamente"` sale en el listado como tarjeta sin enlace.

Los detalles de cada campo están en [docs/CARPETAS.md](docs/CARPETAS.md). Para los juegos (categorías, dificultad, datos, piezas compartidas) mira [docs/JUEGOS.md](docs/JUEGOS.md).

## Órdenes

| Orden | Qué hace |
|---|---|
| `python3 sitio.py servir` | Ver el sitio en local, con recarga automática (sin añadir nada, `sitio.py` hace esto; `--sin-navegador` no abre el navegador) |
| `python3 sitio.py construir` | Genera `dist/`, que es lo que se sube al hosting |
| `python3 sitio.py comprobar` | Revisa el sitio antes de publicar: enlaces, títulos, descripciones, textos sin rellenar… |
| `python3 sitio.py probar` | Pruebas automáticas (añade `--navegador` para probar también en Chrome) |
| `python3 sitio.py paquete` | Crea un .zip del proyecto (`--dist` para el sitio ya construido) |

## Qué hay y qué no

Está hecho: portada (con índice por categoría de herramientas, guías y juegos, y bloque de información legal), cinco secciones con su aspecto, el mecanismo de «meter una carpeta», el generador, **120 herramientas**, **32 guías**, **69 juegos**, listados con buscador y categorías, apartado legal,
estructura de publicidad (apagada), SEO técnico (títulos, descripciones, canonical, Open Graph, datos estructurados, robots y sitemap), logotipo, iconos,
tipografías propias y pruebas (324 de Python y las de navegador).

**No hay todavía:** tests (la sección sale vacía con un mensaje que lo explica), **tus datos de titular** y **tu cuenta de AdSense**.
Lo que falta y lo que no se ha podido comprobar está en [docs/PENDIENTES.md](docs/PENDIENTES.md); lo que debes completar tú, en [docs/LEGAL-PENDIENTE.md](docs/LEGAL-PENDIENTE.md).
Para publicar, mira [docs/PUBLICAR.md](docs/PUBLICAR.md).

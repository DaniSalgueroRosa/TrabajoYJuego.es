# FP Cuenta: guía de carpetas

Cada herramienta tiene su carpeta, y dentro de ella su HTML, su CSS y su JavaScript con el mismo nombre.
Cada comunidad autónoma tiene su propia carpeta dentro de `comunidades/`.

```
index.html                      Portada (la única página en la raíz, junto a 404.html)
portada/                        portada.css · portada.js
calculadora-faltas/             calculadora-faltas.html · .css · .js
calculadora-notas/              calculadora-notas.html · .css · .js
normativa/                      normativa-faltas.html · normativa.css
informacion/                    sobre-nosotros · contacto · aviso-legal · politica-de-privacidad · politica-de-cookies (.html)
comunidades/                    Una carpeta por comunidad (ahora: andalucia/, cataluna/ y madrid/)
  andalucia/                      comunidad.json · ciclos.json · datos.js (este se genera)
  cataluna/                       comunidad.json · ciclos.json · datos.js (este se genera)
  madrid/                         comunidad.json · ciclos.json · datos.js (este se genera)
datos/                          ra.js (resultados de aprendizaje, para la calculadora de notas)
compartido/                     configuracion.js · comun.js · datos.js · base.css · calculadoras.css · combobox.css · combobox.js
gen/                            Generadores y comprobadores (Python). No hace falta subirlos al alojamiento.
404.html · robots.txt · sitemap.xml · ads.txt
```

## Comunidades disponibles
Ahora hay tres: **Andalucía**, **Cataluña** y **Madrid**. Con más de una comunidad, la calculadora de faltas obliga a elegir la
comunidad antes de elegir el ciclo (no preselecciona ninguna). La calculadora de notas muestra cada ciclo una sola vez, aunque exista en varias comunidades.

### Andalucía
134 ciclos de grado medio y superior (los de 2 cursos) con sus módulos y horas, sacados de la
*Resolución de 24 de julio de 2026 de la Dirección General de Formación Profesional y Educación Permanente*
(Anexo I, curso 2026/2027). Faltas: 20 % (Orden de 18 de septiembre de 2025).

La resolución da **horas semanales** por curso y módulo, no horas totales. Las horas del módulo se calculan como
**horas semanales × 32 semanas** (3 h semanales = 96 h; 6 h = 192 h). Si tu centro usa otro número de semanas,
cambia `semanas` en `comunidades/andalucia/comunidad.json` y vuelve a importar (abajo). Quedan fuera los 3 ciclos de
aeronáutica, que duran 3 cursos (2540 h), y los ciclos de grado básico y los cursos de especialización.

### Madrid
114 ciclos (74 de grado superior y 40 de grado medio) con 1966 módulos, sacados de las tablas de la Comunidad de Madrid
(`tablas_grado_superior.pdf` y `tablas_grado_medio_3.pdf`, en comunidad.madrid). Estas tablas dan las **horas totales** de cada
módulo («Duración del currículo»), así que no se calcula nada: cada ciclo suma 2000 h (sin la FCT) y cada curso 30 horas semanales.
Se comprueba al importar.
- El porcentaje de faltas **lo fija cada centro** en su Plan de Convivencia o Reglamento de Régimen Interior (se ven el 15 %, el 20 % y
  el 25 %). Se usa el 15 % como valor orientativo y la calculadora deja cambiarlo. En `comunidad.json`: `origen: "centro"`,
  `cuentan: "centro"` (hay centros que cuentan también las faltas justificadas, otros no).
- Hay 3 trimestres por curso.
- El proyecto intermodular no tiene horas semanales en las tablas: se pone en 2.º con sus 50 h. Los módulos optativos aparecen con
  las horas genéricas de la tabla (50 h en 1.º y 90 h en 2.º).
- Quedan fuera los 3 ciclos de más de 2000 h (el doble título de 3000 h y dos ciclos aeronáuticos de 2540 h), los ciclos de grado
  básico y los cursos de especialización.
- Los PDF no llevan fecha. Si la Comunidad de Madrid los actualiza, vuelve a ejecutar el importador (abajo).

### Cataluña
38 ciclos (26 de grado superior y 12 de grado medio, de 10 familias) sacados del documento «Càrrega horària per mòdul dels cicles
formatius de grau mitjà i superior de Catalunya». **Ese documento no es oficial**: recopila fichas del Institut Escola del Treball,
algunas provisionales, y en 11 módulos faltaba la cifra y se ha deducido la que hacía sumar 2000 h (el importador los lista al ejecutarse
y la página de la calculadora lo avisa). Cuando haya una fuente oficial completa, conviene sustituirlo.
- Cada ciclo suma **2000 h = 1485 de centro + 515 en la empresa** (dentro de cada módulo). La calculadora usa las **horas de centro**,
  que son las de tu horario (múltiplos de 33). En `ciclos.json` cada módulo es `[nombre, horas de centro, semanales, horas totales]`:
  la cuarta cifra guarda las horas totales del currículo y la calculadora no la usa.
- El documento no dice en qué curso va cada módulo («Centro» = lo decide cada instituto). Por eso esos módulos salen **en 1.º y en
  2.º**, y la persona quita los que no cursa. El Itinerari I solo sale en 1.º; el Itinerari II, el Projecte intermodular y el optativo, en 2.º.
- Los módulos están **en catalán** (como en el horario). En la calculadora de notas se buscan en catalán y llevan su nombre en
  castellano entre paréntesis si ese ciclo existe en otra comunidad. Los ciclos llevan nombre en castellano y alias en catalán para la búsqueda
  (`"idioma": "ca"` en `comunidad.json` activa este comportamiento).
- Faltas: sin porcentaje único; lo fija cada centro. Se usa el 15 % orientativo (desde 2024-25 ya no hay unidades formativas,
  Real Decreto 659/2023).

## Cómo añadir otra comunidad (solo hay que crear su carpeta)
1. Crea la carpeta con la plantilla:
   ```
   python3 gen/nueva_comunidad.py valencia
   ```
   Crea `comunidades/comunitat-valenciana/` con `comunidad.json` (ya con el porcentaje de faltas, la nota y las fuentes que
   teníamos investigados de esa comunidad) y un `ciclos.json` vacío. También puedes crear la carpeta a mano copiando la de Andalucía:
   el nombre solo lleva minúsculas sin tildes, números y guiones, y debe coincidir con el `"id"` de `comunidad.json`.
2. Rellena `ciclos.json` con los ciclos y las horas totales de cada módulo, curso por curso (formato en `gen/comunidades.py`;
   el de Andalucía sirve de ejemplo). Sin la FCT.
3. En `comunidad.json`, sustituye los textos «ESCRIBE AQUÍ» de la sección `"horas"`: `fuente` (cómo se obtienen las horas),
   `enlaces` (lista de `{"t": "texto", "u": "https://…"}` con los documentos de donde salen) y, si hace falta, `nota`.
4. Ejecuta `python3 gen/construir.py`. Comprueba los datos (te avisa con un mensaje claro si algo está mal), crea el `datos.js`
   de la comunidad, la añade sola a las dos calculadoras, a la página de normativa y al desplegable de comunidades.

Mientras una comunidad no tenga su carpeta, no aparece en el sitio. Los porcentajes de faltas ya investigados de todas
las comunidades están en `gen/porcentajes_investigados.py` (no se publica; lo usa `nueva_comunidad.py`).

### Importar una comunidad desde un documento oficial
Los importadores están en `gen/importadores/` y necesitan `pdftotext`. Todos usan `gen/importadores/comun.py`, que reúne lo que
comparten: la creación de los identificadores de ciclo (un mismo ciclo tiene el mismo id en todas las comunidades, y así la
calculadora de notas lo muestra una sola vez), las siglas y alias, y la escritura del `ciclos.json`.
- Andalucía: `python3 -I gen/importadores/andalucia.py RUTA/AL/PDF.pdf --semanas 32`
- Madrid: `python3 -I gen/importadores/madrid.py RUTA/grado_medio.pdf RUTA/grado_superior.pdf`
  (comprueba que las horas de los módulos suman las del ciclo y que las horas semanales cuadran con el total de cada curso).
- Cataluña: `python3 -I gen/importadores/cataluna.py RUTA/PDF.pdf` (comprueba 2000 h = 1485 + 515 por ciclo y lista los módulos deducidos).

Para otra comunidad, copia el que más se parezca a su documento. Si dos comunidades dan distinto nombre al mismo ciclo, añade la
equivalencia en `ID_EQUIVALENTES` de `comun.py`.

## Modo claro y oscuro
La cabecera tiene un botón (luna/sol) para cambiar entre modo claro y oscuro. Sin elección, la web sigue el modo del dispositivo; al
pulsar el botón se guarda la elección en el navegador (`fpcuenta-tema-v1`, aparece en la política de cookies). Un pequeño script del
`<head>` aplica la elección antes de pintar la página, así que no hay parpadeo. Los colores están en `compartido/base.css`:
**los dos bloques de colores oscuros (`@media (prefers-color-scheme: dark)` y `:root[data-theme="dark"]`) deben ser iguales**; si
cambias uno, cambia el otro. Al imprimir, la web vuelve siempre a colores claros.

## AdSense: qué está preparado y qué haces tú
Todo está listo pero inactivo: sin ID de AdSense no se carga nada de Google y no hay anuncios visibles. Todo se controla desde **un solo archivo, `compartido/configuracion.js`**:

| Ajuste | Para qué |
|---|---|
| `adsenseClient` | Tu ID de editor (`ca-pub-…`). Con él, `construir.py` escribe la metaetiqueta `google-adsense-account` en todas las páginas y rellena `ads.txt`. |
| `consentimiento` | `'propio'` (el aviso de cookies de esta web) o `'google'` (el mensaje de Google). Mira abajo. |
| `adsenseSlots` | Números de los bloques de anuncios (`portada`, `faltas`, `notas`, `normativa`). Un hueco sin número no se muestra. |

Pasos, cuando quieras pedir AdSense:
1. Sube la web a tu dominio con todo lo de «Antes de publicar» resuelto. Ejecuta `python3 gen/antes_de_publicar.py`: lista lo que falta.
2. Regístrate en AdSense, añade tu sitio y copia tu ID. Escríbelo en `adsenseClient`, ejecuta `python3 gen/construir.py` y vuelve a subir.
   Verifica el sitio con **metaetiqueta** (ya está en el `<head>` de todas las páginas) o con `ads.txt`. El fragmento de código de
   AdSense no lo ve el rastreador porque esta web solo carga el script con permiso; por eso se usa la metaetiqueta.
3. Espera a la revisión. Mientras tanto no hace falta tener anuncios puestos.
4. Con el sitio aprobado: en AdSense crea bloques de anuncios *display* adaptables, copia su número de `data-ad-slot` en `adsenseSlots`
   (o activa «Anuncios automáticos» y deja los huecos vacíos) y vuelve a subir.

**Consentimiento en España.** Google exige una plataforma de consentimiento certificada (CMP) para mostrar anuncios personalizados en la UE,
el Reino Unido y Suiza. El aviso propio de esta web no lo es. Lo más sencillo es la CMP gratuita de Google: en AdSense → *Privacidad y mensajes*
publica el mensaje de **normativa europea** para tu sitio y pon `consentimiento: 'google'`. Con esa opción: el script de Google se carga al entrar
(es el que enseña el mensaje), esta web no muestra su aviso de anuncios, el botón «Configurar cookies» del pie vuelve a abrir el mensaje de Google
y los textos legales (privacidad, cookies, aviso legal, sobre nosotros) cambian solos al ejecutar `construir.py`. Con `'propio'` el script solo se carga
si la persona pulsa «Aceptar».

Los huecos de anuncio están en la portada, las dos calculadoras y la normativa, siempre debajo del contenido y lejos de botones y
campos, con la etiqueta «Publicidad». No hay en las páginas legales, el contacto ni la 404. Si Google no rellena un hueco, se oculta.
Si quieres otro hueco, escribe `{{ANUNCIO:nombre}}` en un cuerpo de `gen/cuerpos/` (o `anuncio("nombre")` en `construir.py`) y añade `nombre` a `adsenseSlots`.

## Antes de publicar
Ejecuta `python3 gen/antes_de_publicar.py`: dice qué falta y qué está listo. En resumen:
1. `compartido/configuracion.js`: el correo de contacto (`contactEmail`) y, si lo usas, el endpoint del buzón de sugerencias.
2. Sustituye `tudominio.es` por tu dominio (en `gen/construir.py`, constante `DOMAIN`, y ejecuta el generador).
3. Busca los datos de la persona titular con `grep -rn 'class="placeholder"' .` y rellénalos en `gen/construir.py` (`OWNER_NAME`,
   `OWNER_ID`, `OWNER_ADDR`, `OWNER_MAIL`, `HOSTING`, `FORM_PROVIDER`: sustituye `ph("…")` por el texto entre comillas) y ejecuta el generador.
4. Los textos legales son un borrador: revísalos antes de publicar.
5. AdSense: lo de la sección anterior.

## Cómo se regeneran las páginas
- `python3 gen/construir.py` escribe todos los HTML, el `datos.js` de cada comunidad, el `sitemap.xml`, `robots.txt` y `ads.txt`
  (cabecera, pie, menú y las etiquetas `<link>`/`<script>` de cada página están en un solo sitio). Lee `compartido/configuracion.js`
  para la metaetiqueta de AdSense, `ads.txt` y los textos legales: ejecútalo de nuevo cuando cambies `adsenseClient` o `consentimiento`.
- Los cuerpos de la portada y de las dos calculadoras están en `gen/cuerpos/`. Edítalos ahí y vuelve a generar. En esos textos,
  `{{TENEMOS}}` y `{{COMUNIDADES}}` se sustituyen solos por las comunidades que haya (por eso no hay que tocarlos al añadir una).
- Si cambias a mano un HTML o un `datos.js`, la próxima ejecución de `construir.py` lo sobrescribe: haz el cambio en `gen/` o en el `.json` de la comunidad.

## Dónde está cada dato
- **Porcentaje de faltas y fuentes de una comunidad**: `comunidades/<comunidad>/comunidad.json`.
- **Ciclos, módulos y horas de una comunidad**: `comunidades/<comunidad>/ciclos.json`.
- **Resultados de aprendizaje (RA) por módulo**: `datos/ra.js` (está vacío; el formato está explicado dentro). Cuando añadas módulos, la calculadora de notas muestra el botón «Cargar los RA de este módulo».

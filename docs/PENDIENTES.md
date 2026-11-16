# Pendientes y límites

Estado de esta entrega: **portada (con índice por categoría y bloque de información legal), cinco secciones, 164 herramientas, 39 guías, 50 juegos, apartado legal, listados con buscador y filtros, SEO técnico, estructura de publicidad preparada y pruebas**.
No se ha inventado ningún dato: no hay NIF, ni dirección, ni correo, ni identificador de AdSense.

## Lo que tienes que hacer tú antes de publicar

| Qué | Dónde | Por qué |
|---|---|---|
| Datos del titular (nombre, NIF, domicilio, correo, hosting) | `config/titular.json` | Sin ellos las páginas legales muestran «[COMPLETAR POR EL TITULAR]» y `comprobar` falla en producción |
| Revisión de los textos legales por quien lleve tu asesoría | `legal/*/pagina.html` | Son una base fiel a lo que el sitio hace, **no asesoramiento jurídico** |
| Pasar `entorno` a `produccion` | `config/sitio.json` | En preproducción todo es `noindex` y `robots.txt` bloquea |
| Elegir hosting | Libre: es una carpeta de archivos estáticos | Ver `PUBLICAR.md` |
| Si habrá anuncios: cuenta de AdSense aprobada, identificador, 2 bloques, mensaje de consentimiento en Privacy & messaging, anuncios automáticos desactivados | `config/publicidad.json` + AdSense | Ver `LEGAL-PENDIENTE.md` |

## Lo que hay en la v2 y no estaba en la v1

Las 120 herramientas y sus 32 guías (ver `HERRAMIENTAS.md`), los 69 juegos, el catálogo con buscador, filtros por categoría y dificultad (también desde la portada con `?categoria=`), el apartado legal con seis páginas, el bloque de información legal de la portada, la estructura de publicidad y `ads.txt` automáticos,
la configuración del titular, las pruebas de los juegos y de lo legal.

## Lo que tenía la v1 y la v2 todavía no tiene

| Función de la v1 | Estado en la v2 |
|---|---|
| Tests de ejemplo | No existen: la sección sale vacía con un mensaje que lo explica. Hay que añadir carpetas (ver `CARPETAS.md`) |
| Modo oscuro automático | No existe. La v2 tiene dos aspectos fijos (claro para «Trabajo», oscuro para «Juego») |
| Catálogo de fichas «Próximamente» | No existe (el estado `proximamente` sí funciona) |

## Límites: lo que no se ha podido comprobar

- **Google AdSense y su mensaje de consentimiento.** El entorno de desarrollo no tiene Internet: el script de AdSense, el mensaje de Privacy & messaging y el botón que lo reabre
  (`googlefc.showRevocationMessage`) **no se han probado contra los servidores de Google**. Se ha comprobado que, con la publicidad activa en una copia de prueba, el código sale donde debe;
  y que, sin activarla, no sale nada. La primera vez que actives anuncios, míralo en una ventana privada.
- **El sitio no incluye gestor de consentimiento propio** ni lo presenta como certificado: se apoya en el de Google, que lo configuras tú en AdSense.
- **Solo se ha probado en Chrome** (escritorio, y en emulación de móvil y tablet). No en Safari, Firefox ni Edge, ni en móviles físicos. Los juegos con canvas
  (`el-superviviente`, `donde-esta`) y el que usa deslizar el dedo (`2048`) conviene probarlos en un teléfono real: la emulación no reproduce el tacto ni el rendimiento.
- **No se ha probado con lectores de pantalla** (NVDA, VoiceOver, TalkBack). Sí se ha cuidado la semántica, el foco con teclado, los nombres accesibles, los avisos (`aria-live`)
  y el contraste, y hay pruebas automáticas de eso, pero no sustituyen una prueba con personas.
- **No se ha medido con Lighthouse ni PageSpeed**: el entorno no tenía acceso.
- **Contenido de los juegos:** las listas de palabras, las preguntas, los acertijos y los datos se han escrito para este proyecto y pueden tener errores o simplificaciones;
  los límites concretos de cada juego están en `JUEGOS.md`. La lista de palabras **no es el diccionario de la RAE**.
- **Reflejos** depende del aparato (pantalla, ratón, táctil); el juego lo avisa.
- **Las fuentes están en formato WOFF, no WOFF2** (no había compresor Brotli). Pasarlas a WOFF2 ahorraría en torno a una cuarta parte.
- **Solo se ha ejecutado con Python 3.11, 3.12 y 3.13** y Node 22.
- El sitio está pensado para un **dominio propio en la raíz**, no para una subcarpeta.
- Solo español (`es-ES`).
- **El texto de cada juego tiene entre 235 y 450 palabras.** Es suficiente para describir cómo se juega, pero Google valora más el conjunto del sitio (contenido propio, guías, páginas útiles)
  que 20 páginas de juego: añadir herramientas y guías reales ayudará más a una futura aprobación que ampliar estos textos. **No hay garantía de que AdSense apruebe el sitio.**

- **Datos que caducan y hay que actualizar a mano.** La calculadora de intereses de demora trae por defecto el tipo del segundo semestre de 2026 (BCE 2,40 % + 8 puntos = 10,40 %, según la resolución del BOE); cada semestre se publica uno nuevo. La del coste de contratar usa los tipos de Seguridad Social a cargo de la empresa de 2026 y la base máxima de 5.101,20 €/mes. Ambos valores se pueden editar en la propia herramienta, pero el valor por defecto está en el código de cada una.
- **Sinónimos y antónimos:** el diccionario es propio (739 grupos y unas 4.900 palabras) y no es exhaustivo ni equivale al de la RAE; si una palabra no está, la herramienta lo dice, propone palabras parecidas si parece una errata y sugiere buscar la forma base (verbos conjugados, diminutivos).
- **Comparador de PDF:** compara solo el texto seleccionable. No hace OCR, ni compara imágenes, tipografías ni diseño. Hasta 600 páginas entre los dos documentos; con documentos muy largos compara página con página.
- **Conversor de CSV a Excel:** crea un libro con una sola hoja. No hay conversión inversa (Excel a CSV). Reconoce fechas con formato aaaa-mm-dd y dd/mm/aaaa, y deja como texto los valores con cero inicial, los teléfonos con + y los números de más de 15 cifras.
- **Gastos de envío:** no incluye tarifas de ninguna empresa de transporte; la persona escribe su propia tabla de tramos.
- **Tablas de horarios:** no admite actividades que crucen la medianoche y no guarda nada; el PNG se dibuja con la fuente Arial del sistema.
- **Diagramas de flujo:** colocación automática de arriba abajo (sin mover cajas a mano ni orientación horizontal), hasta 150 pasos y 300 conexiones.

## Decisiones tomadas por defecto (cámbialas si no te convienen)

- **Estilo** retro oscuro para los juegos; la portada, «Trabajo» y los tests, como en la entrega anterior.
- **Sin cuentas ni persistencia**: ni `localStorage`, ni cookies, ni ranking. Las estadísticas de la sesión viven en la memoria de la pestaña y se pierden al recargar.
- **Contacto solo por correo**: no hay formulario (un formulario obligaría a tratar datos y a explicarlo en privacidad).
- **`entorno: preproduccion`** y **`publicidad.activa: false`**: hay que cambiarlos al publicar.
- **La carpeta de pruebas se llama `pruebas/`**, no `tests/`, porque `tests/` es una sección.
- **Los anuncios, si los hay, solo van en dos sitios**: al final de los listados y al final de cada juego (después del texto), nunca junto al tablero.

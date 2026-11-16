# Actualización completa: los 26 tests nuevos (Utilidades, Personalidad, Relaciones y Anime)

Este zip reúne **todo lo nuevo y lo cambiado** desde la entrega del grupo 5 (memoria y percepción): los grupos 6, 7, 8 y 9. Si ya instalaste los zips por grupos, **no hace falta** instalar este; si prefieres hacerlo de una vez, instala solo este.

## Dónde ponerlo

Descomprime el zip y copia las carpetas `trabajoyjuego-v2` y `vista-previa` **encima de las que ya tienes**, aceptando reemplazar los archivos que coincidan
(en Mac, mantén pulsada Opción y elige «Combinar»). Los tests van solos a su sitio: cada uno es una carpeta dentro de `tests/`, y no hay que tocar nada más.
Después: `python3 sitio.py probar` para comprobar y `python3 sitio.py servir` para verlo.

## Los 26 tests

| Orden | Test | Gráfica del resultado |
|---|---|---|
| 31 | Test de velocidad de internet | Velocidad a lo largo de la prueba |
| 32 | IA vs cuadros reales (**próximamente**: necesita tus imágenes, ver `docs/TEST-IA-VS-CUADROS.md`) | Medidor y aciertos por tipo |
| 42 | Edad mental (clásico) | Espectro y barras por área |
| 43 | Los 16 tipos de personalidad | Cuatro ejes opuestos |
| 44 | Pureza de Rice | Medidor y barras por bloque |
| 45 | Soldado, poeta o rey | Triángulo |
| 46 | Color del alma | Radar y muestra de color |
| 47 | Brújula de talentos | Brújula |
| 48 | Color de personalidad | Plano de ritmo y foco |
| 49 | Hemisferio cerebral dominante | Espectro y tres ejes |
| 50 | Reloj de la muerte | Semanas de vida y balanza |
| 52 | ¿Le gusto? | Medidor y barras |
| 53 | ¿Le gusto a él también? | Plano de reciprocidad y balanza |
| 54 | ¿Estoy enamorado/a? | Radar |
| 55 | Calculadora de amor | Medidor y pasos del cálculo |
| 56 | Sexualidad y orientación sexual | Plano de dos ejes y barras |
| 57 | Omegaverse (alfa, beta u omega) | Triángulo |
| 58 | Lésbico | Medidor y radar |
| 59 | Homosexual | Espectro y barras |
| 60 | Bisexual | Espectro y radar |
| 61 | Trans | Espectro y barras |
| 62 | Naruto | Radar y afinidad |
| 63 | Dragon Ball | Radar y afinidad |
| 64 | Jujutsu Kaisen | Radar y afinidad |
| 65 | Haikyu!! | Radar y afinidad |
| 66 | JoJo's Bizarre Adventure | Radar y afinidad |

El detalle de cada grupo está en `ACTUALIZACION-TESTS-6-UTILIDADES.md`, `-7-PERSONALIDAD.md`, `-8-RELACIONES.md` y `-9-ANIME.md`.

## Base nueva

Categorías Utilidades, Personalidad, Relaciones y Cultura pop en `tests/seccion.json`; el motor de gráficas (`tests/graficos.js`), el de cuestionarios (`tests/cuestionario.js`) y sus estilos en `tests/tests.css`.

## A tener en cuenta

- **Faltan los tests 33 a 41 (inteligencia) y 51:** no llegaron en el encargo. Cuando los envíes entran con el mismo sistema.
- **IA vs cuadros reales** sale como «Próximamente» hasta que añadas tus imágenes con su autor y licencia.
- **Velocidad de internet:** mide hasta este mismo sitio (no hasta un servidor de mediciones), no mide la subida y gasta datos (tope de unos 120 MB, avisado en la página). Abierto como archivo suelto desde el disco no funciona: usa `ver-el-sitio` o el hosting.
- **Tests de orientación e identidad (56, 58–61), Omegaverse y Reloj de la muerte:** son entretenimiento y reflexión, no diagnóstico ni predicción; llevan avisos y no incluyen enlaces externos ni contenido explícito. Revísalos con tu criterio editorial antes de publicar, sobre todo de cara a AdSense.
- **Anime:** tests de fans no oficiales, con textos propios y sin imágenes de las obras.
- **Sin red ni almacenamiento:** solo la velocidad y IA vs cuadros hacen peticiones, siempre al propio sitio; ningún test guarda nada en el navegador. Las pruebas lo vigilan.
- **Antes de publicar:** `python3 sitio.py comprobar` sigue avisando de `config/titular.json` y del entorno (preproducción); son datos tuyos que no se inventan.

## Pruebas

`probar` (todas OK), `comprobar` (285 páginas, 0 errores), la prueba de humo de los 55 tests publicados en dos tamaños y las pruebas de Chrome de cada grupo (`pruebas/tests/utilidades.mjs`, `personalidad.mjs`, `relaciones.mjs`, `anime.mjs`).

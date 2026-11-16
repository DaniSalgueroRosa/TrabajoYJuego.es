# Actualización: 6 herramientas nuevas (de la 121 a la 126)

Este zip trae **solo lo nuevo** respecto a la entrega de los 4 juegos anteriores. Con él el sitio queda en **126 herramientas**.

## Cómo instalarlo

Descomprímelo y copia `trabajoyjuego-v2` y `vista-previa` encima de las que ya tienes, aceptando reemplazar los archivos que coincidan (en Mac, mantén pulsada Opción y elige «Combinar»). Instálalo **después** de los zips anteriores: la portada y los listados de `vista-previa/` ya incluyen todo lo anterior.

## Las herramientas

| Orden | Herramienta | Categoría | Qué hace |
|---|---|---|---|
| 121 | Calculadora de consumo de combustible | Calculadoras | Litros cada 100 km a partir de un repostaje, y coste de un viaje (ida y vuelta, reparto entre personas). |
| 122 | Calculadora de ritmo de carrera | Calculadoras | Ritmo por km y por milla, velocidad y tiempos previstos en 5 km, 10 km, media maratón y maratón. |
| 123 | Calculadora de consumo eléctrico | Calculadoras | kWh y coste al día, al mes y al año de un aparato a partir de su potencia y sus horas de uso. |
| 124 | Sorteo de amigo invisible | Utilidades | Nadie se regala a sí mismo; admite parejas excluidas y vuelve a sortear con un botón. |
| 125 | Traductor de código Morse | Texto | Texto ↔ Morse con letras, números, Ñ y signos habituales; detecta el sentido y avisa de lo que omite. |
| 126 | Cifrado César y ROT13 | Texto | Cifra, descifra y muestra los 25 desplazamientos, con alfabeto español (con Ñ) o inglés. |

Cada una lleva su página de texto (más de 220 palabras, preguntas frecuentes y aviso sin JavaScript) y está enlazada desde su guía de Recursos: las tres calculadoras desde «Qué calculadora usar para cada cuenta», el amigo invisible desde «Sorteos, equipos, dados y números al azar» y el Morse y el César desde «Limpiar, ordenar y comparar texto». Nada se guarda en el navegador.

## Pruebas

- `pruebas/herramientas/casos.json`: 24 casos nuevos con resultados calculados a mano (por ejemplo, 10 km en 50 minutos son 5:00 min/km, 12 km/h y 3:30:59 de maratón proyectado).
- `pruebas/herramientas/amigo-invisible.mjs`: 25 sorteos con ocho personas y tres exclusiones; en todos se cumplen las reglas y el botón da repartos distintos.
- Las seis pasan la prueba de carga en móvil y escritorio. `comprobar`: 0 errores en 230 páginas. Batería unitaria: 324 pruebas.

## A tener en cuenta

- Los cálculos de combustible, ritmo y electricidad son orientativos: no incluyen peajes, desgaste, el término fijo de la factura de la luz ni impuestos, y las proyecciones de carrera son lineales y optimistas en distancias largas.
- El Morse y el César son para jugar y aprender; ninguno protege información.
- La tabla de `docs/HERRAMIENTAS.md` aún no incluye estas seis herramientas ni las anteriores a esta tanda de 30; el listado vivo es `/herramientas/`.

# Actualización: sección Tests, grupo 8 «Relaciones» (tests 52 a 61)

Este zip trae **solo lo nuevo y lo cambiado** respecto a la entrega del grupo 7 (personalidad). Instálalo **después** de ella.

## Dónde ponerlo

Descomprime el zip y copia las carpetas `trabajoyjuego-v2` y `vista-previa` **encima de las que ya tienes**, aceptando reemplazar los archivos que coincidan
(en Mac, mantén pulsada Opción y elige «Combinar»). Los tests nuevos van solos a su sitio: cada uno es una carpeta dentro de `tests/` y no hay que tocar nada más.
Después, `python3 sitio.py probar` para comprobar y `python3 sitio.py servir` para verlo.

## Los tests (todos con gráficas)

| Orden | Test | Cómo funciona | Gráfica del resultado |
|---|---|---|---|
| 52 | ¿Le gusto? | 14 señales (atención, conversación, iniciativa, contexto) | Medidor y barras por área |
| 53 | ¿Le gusto a él también? | 8 frases sobre tu implicación y 8 sobre la suya | Plano de reciprocidad y balanza |
| 54 | ¿Estoy enamorado/a? | 14 frases en cinco áreas | Radar de cinco áreas |
| 55 | Calculadora de amor | Dos nombres; cuenta las letras de LOVES y suma cifras vecinas (método clásico, simétrico) | Medidor, letras encontradas y los pasos del cálculo |
| 56 | Sexualidad y orientación sexual | 13 frases de atracción hacia hombres, mujeres y personas no binarias | Plano de dos ejes y seis barras |
| 57 | Omegaverse (alfa, beta u omega) | 12 situaciones; solo como arquetipos de personalidad | Triángulo |
| 58 | Lésbico | 12 frases en tres áreas | Medidor y radar |
| 59 | Homosexual | 12 frases en tres áreas | Espectro y barras |
| 60 | Bisexual | 12 frases en tres áreas | Espectro de un género a varios y radar |
| 61 | Trans | 12 frases en cuatro áreas (algunas formuladas al revés) | Espectro de comodidad a distancia y barras |

## Decisiones de contenido

- **Tests sobre orientación e identidad (56, 58–61):** son reflexiones, no diagnósticos. Ningún resultado «te etiqueta»: hablan de afinidad, ofrecen palabras que algunas personas usan, dicen que las etiquetas son opcionales y que solo la persona puede definirse, y recomiendan apoyo de confianza, asociaciones LGTBI+ o profesionales con formación en diversidad (sin enlaces externos). No hay contenido explícito, ni estereotipos, ni textos que juzguen.
- **Omegaverse:** solo toma los tres papeles como arquetipos de personalidad; no incluye biologías ni contenido para adultos.
- **¿Le gusto?** y **¿Le gusto a él también?:** frases neutras en género, con avisos de que es orientativo y de que un «no» se respeta.
- **Calculadora de amor:** declara que es un juego, enseña todos los pasos y da el mismo resultado en cualquier orden. Los nombres no salen de la página.
- Toda la redacción es propia; todo se calcula en el navegador, sin guardar ni enviar nada.

## Pruebas

`pruebas/tests/relaciones.mjs` juega los diez en Chrome (respuestas fijas con resultado conocido, empates, el cálculo de Romeo y Julieta = 98 %, el error sin nombres, mayúsculas, acentos y ñ, los avisos y el móvil de 390 px). El «Anterior» del motor de cuestionarios ahora no se ve en la primera pregunta (antes aparecía deshabilitado y restaba contraste). `probar` y `comprobar` sin errores.

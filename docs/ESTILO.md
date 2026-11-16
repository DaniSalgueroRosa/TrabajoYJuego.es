# El estilo

Una marca, dos mundos que se encuentran en la «y» del nombre.

| | **Trabajo** | **Juego** |
|---|---|---|
| Secciones | Herramientas, Recursos | Juegos (y Tests, con aspecto libre) |
| Carácter | Semiformal pero animado: papel de cuaderno, tinta pizarra, esquinas casi rectas | Retro: pantalla apagada, tiza y neón sandía |
| Tipografía | Heros (una Helvetica abierta) | Cuadritos, letra de píxeles propia, solo para títulos y marcadores |
| Forma | Bordes rectos y finos | Bordes de píxeles con las esquinas cortadas |
| Movimiento | Suave (`--suave`): una barra limón recorre la tarjeta, el subrayador se pinta | A saltos (`steps()`): cursor `█` que parpadea, líneas de barrido, `▶` que aparece |
| Tests | — | Cada test trae su propio aspecto con `tema` en su `ficha.json` (ver `CARPETAS.md`) |

Los dos mundos se aplican con el atributo `data-mundo` (`trabajo`, `juego` o `libre`) en `<main>`, las tarjetas y los estados vacíos, y con `data-grupo` en el menú y el pie.
Por eso un componente de `comun/` es uno solo y se viste según dónde esté.

## Cambiar el estilo del conjunto

Todo parte de `comun/tokens.css`. El resto del CSS solo usa esas variables.

| Variable | Valor | Uso |
|---|---|---|
| `--pizarra` | `#1D3A34` | Tinta de «Trabajo» |
| `--pizarra-media` | `#2F6B5C` | Detalles de «Trabajo» |
| `--papel-trabajo` | `#E4EDE8` | Franja de papel de Herramientas y Recursos |
| `--tiza` | `#EAF2EE` | Texto sobre fondo oscuro |
| `--tiza-suave` | `#AFC4BB` | Texto secundario sobre fondo oscuro |
| `--sandia` | `#FF5A7D` | Neón de «Juego», sobre fondo oscuro |
| `--sandia-texto` | `#C21E4A` | La misma sandía, oscurecida para fondo claro |
| `--limon` | `#E6F14A` | Subrayador y cursor: el color que une los dos mundos |
| `--tinta` | `#14201C` | Pantalla apagada (fondo de «Juego») |
| `--noche-2`, `--noche-linea` | `#1E2E29`, `#3A5249` | Paneles y líneas sobre fondo oscuro |
| `--lienzo`, `--papel` | `#F3F5F2`, `#FFFFFF` | Fondo general y tarjetas |
| `--tinta-suave`, `--linea` | `#46564F`, `#C5D1CB` | Texto secundario y bordes sobre fondo claro |

Si cambias un color de marca, cámbialo también en `motor/identidad.py` y ejecuta `python3 -I motor/identidad.py` para rehacer logo, favicon e imagen para redes.
Después, `python3 sitio.py probar` te dice si algún par de colores ha dejado de leerse.

## Contraste

`pruebas/test_contraste.py` lee los colores de `tokens.css` y comprueba 25 pares de «texto sobre fondo», cada uno con el uso que tiene en el sitio
(mínimo 4.5:1 para texto normal, 3:1 para texto grande y componentes). Con `--navegador`, además se mide el texto ya pintado en cada página.

Un límite que conviene recordar: **`--sandia` sobre `--pizarra` da 4.1:1.** Sirve para texto grande, no para texto normal.

## Tipografías

- **Heros**: versión recortada al alfabeto latino de TeX Gyre Heros (licencia GUST, en `comun/fuentes/LICENCIA.txt`). Tres archivos: regular, cursiva y negrita.
- **Cuadritos**: la dibuja `motor/identidad.py` letra a letra, con celdas de 5×7. Solo tiene mayúsculas (las minúsculas usan la misma forma), con acentos, números, signos y unos cuantos símbolos (`▶ ♥ █ · « » € • …`).
  Los tamaños de texto en píxeles se redondean a múltiplos de 10 px (`round(down, …, 10px)`) para que cada celda caiga en un píxel entero y el borde salga nítido.
- Ninguna se pide a servidores de terceros: están en `comun/fuentes/` y se publican en `assets/fonts/`.

## Movimiento

Todo movimiento continuo (rejilla de la cabecera de Herramientas, cursor parpadeante de Juegos) se apaga con «reducir movimiento» del sistema.
Las animaciones de entrada son cortas y únicas, no se repiten. Una prueba en navegador comprueba que, con ese ajuste, no queda ninguna animación continua.

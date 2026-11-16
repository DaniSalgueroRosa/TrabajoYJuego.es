# Lo que tienes que completar tú (apartado legal y publicidad)

Las seis páginas legales ya están escritas y publicadas con el sitio (`/legal/`), pero **hay datos que solo tú tienes** y que
no se han inventado: mientras falten, las páginas muestran **«[COMPLETAR POR EL TITULAR]»** resaltado en amarillo, y
`python3 sitio.py comprobar` se niega a dar el sitio por bueno en producción.

> Los textos son una base honesta de lo que el sitio hace de verdad (no guarda nada, no tiene cuentas ni formularios, y solo carga
> terceros si activas la publicidad). **No son asesoramiento jurídico.** Antes de publicar, que los revise quien lleve tu asesoría legal,
> sobre todo si vas a ingresar dinero con AdSense (eso te convierte en prestador con actividad económica).

## 1. Datos del titular → `config/titular.json`

Abre el archivo y rellena los campos entre comillas. Aparecen en el aviso legal, la política de privacidad, la de cookies, publicidad y contacto.

| Campo | ¿Obligatorio? | Qué poner |
|---|---|---|
| `nombre` | sí | Tu nombre y apellidos si eres persona física, o la razón social si es una empresa |
| `nif` | sí | NIF/NIE o CIF. El artículo 10 de la LSSI exige identificar al titular |
| `domicilio` | sí | Dirección postal completa (o el domicilio social) |
| `email` | sí | Correo real y que leas: es el **único** canal de contacto del sitio (no hay formulario) |
| `alojamiento` | sí | Nombre del proveedor de hosting. Aparece en la política de privacidad como encargado del tratamiento (registra IP y datos de conexión) |
| `telefono` | no | Solo si quieres publicarlo; si lo dejas vacío, no sale |
| `registro` | no | Datos del Registro Mercantil u otro registro público, solo si estás inscrito |

Si `telefono` y `registro` se quedan vacíos, esas líneas **desaparecen** (no se muestran huecos).
Después: `python3 sitio.py construir` y revisa `/legal/aviso-legal/`: ya no debe quedar ningún «[COMPLETAR POR EL TITULAR]».

## 2. Publicidad → `config/publicidad.json`

Mientras `"activa"` sea `false`, el sitio **no carga ni una línea de Google**: ni anuncios, ni el mensaje de consentimiento, ni `ads.txt`,
y las páginas de cookies, privacidad y publicidad lo dicen así. Sigue estos pasos solo cuando tengas la cuenta de AdSense aprobada.

1. **Cuenta y sitio.** En AdSense, añade `trabajoyjuego.es` (o tu dominio definitivo) y espera la revisión de Google. Nadie puede garantizar que la aprueben:
   Google pide contenido propio y útil, páginas legales y un sitio funcional, y decide en cada caso.
2. **Identificador de editor.** Cópialo de AdSense (empieza por `pub-`; aquí se escribe con `ca-` delante: `ca-pub-` y 16 cifras) en `"cliente"`.
3. **Bloques de anuncios.** En AdSense crea dos bloques de anuncios de display adaptables y copia el número de cada uno: uno para los **listados** y otro para las **páginas de juego**.
   Van en `"bloques": { "listado": "…", "juego": "…" }` (solo cifras).
4. **«Activa».** Pon `"activa": true`. Solo tiene efecto con `"entorno": "produccion"` en `config/sitio.json`; en preproducción no se carga nada y el sitio te avisa.
5. **Mensaje de consentimiento (Privacy & messaging).** Es de Google, no del sitio: créalo y publícalo en AdSense, en el apartado de **Privacidad y mensajes**
   (el nombre puede variar según el idioma de tu cuenta), para la normativa europea (EEE y Reino Unido). Comprueba en el editor del mensaje que
   **aceptar, rechazar y gestionar opciones tienen la misma facilidad** y que se puede **cambiar la elección más tarde** (el botón «Cambiar mi consentimiento»
   de la política de cookies ya llama a la función oficial de Google para reabrir ese mensaje).
6. **Anuncios automáticos: desactívalos** para este sitio en AdSense. Así solo salen los huecos reservados, que están lejos de los controles.
7. **ads.txt.** Se genera solo con tu identificador (`dist/ads.txt`). Tras publicar, comprueba en AdSense que el estado de ads.txt sea correcto.
8. `python3 sitio.py comprobar` y, si no hay errores, `python3 sitio.py construir` y sube `dist/`.

**Qué no se ha podido comprobar:** el entorno de desarrollo no tiene acceso a Internet, así que **no se ha probado contra los servidores de Google**
(ni el script de AdSense, ni el mensaje de consentimiento, ni el botón de revocación). La estructura es la que documenta Google, pero la primera
vez que lo actives míralo tú en el navegador con una ventana privada y con las herramientas de desarrollador abiertas.
El sitio **no incluye un sistema de consentimiento propio** ni lo presenta como certificado: usa el de Google.

## 3. Revisión humana antes de publicar

| Qué revisar | Dónde |
|---|---|
| Que los textos describen tu situación real (por ejemplo, si añades analítica, formularios, cuentas o publicidad de otra red, hay que actualizar privacidad y cookies) | `legal/*/pagina.html` |
| La fecha de «Última actualización» de cada página | `legal/*/ficha.json` → `fecha` |
| Si tu actividad exige algo más (inscripción, DPD, registro de actividades de tratamiento…) | Tu asesoría |
| El correo `email` está operativo y alguien lo lee | — |
| Tu hosting: que figure su nombre en `alojamiento` y que tengas contrato de encargado del tratamiento si lo ofrece | Tu proveedor |

## 4. Si añades algo nuevo al sitio

Cualquier función que guarde datos o cargue terceros (formulario, analítica, vídeo incrustado, otra red de anuncios, cuentas, ranking) **cambia lo que dicen
las páginas legales**. Hoy dicen «no se guarda nada» y hay pruebas automáticas que vigilan que los juegos y las herramientas no usen
`localStorage`, `sessionStorage`, `IndexedDB`, cookies ni cachés. Si algún día cambia, actualiza antes el texto y las pruebas.

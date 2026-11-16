// Capturas del sitio en Chrome (sin interfaz).
// Uso: PUERTO=8080 node pruebas/capturas.mjs <carpeta_salida> "nombre|ruta|ancho|alto[|js:código;//viewport]" ...
// Si el trabajo termina en «viewport» solo captura la pantalla visible; si no, la página entera.
import { abrirChrome } from './cdp.mjs';
const [salida, ...trabajos] = process.argv.slice(2);
const c = await abrirChrome();
try {
  for (const t of trabajos) {
    const [nombre, ruta, ancho, alto, extra] = t.split('|');
    await c.vista(+ancho, +alto, 'light', +ancho < 700);
    await c.ir('http://127.0.0.1:' + (process.env.PUERTO || 8080) + ruta);
    if (extra && extra.startsWith('js:')) { await c.js(extra.slice(3).replace(/;?\/\/viewport$/, '')); await new Promise(r => setTimeout(r, 900)); }
    await c.captura(`${salida}/${nombre}.png`, !(extra && extra.includes('viewport')));
    const errores = c.consola();
    console.log(nombre, errores.length ? errores : 'sin errores de consola');
  }
} finally { await c.cerrar(); }

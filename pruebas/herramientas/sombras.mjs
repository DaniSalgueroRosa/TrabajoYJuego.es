// Generador de sombras CSS en el navegador real: el código que escribe lo interpreta Chrome y debe dar justo los valores elegidos (desplazamientos, desenfoque,
// extensión, color con su opacidad e inset), y la vista previa de la página debe pintar la misma sombra que ese código.
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { ok, escribir, elegir, marcar, clic, valor } = A;
let semilla = 12345;
const azar = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
const ent = (a, b) => Math.floor(azar() * (b - a + 1)) + a;
const hex = () => '#' + [0, 0, 0].map(() => ent(0, 255).toString(16).padStart(2, '0')).join('');

/* Lee las sombras que Chrome calcula para un elemento: [{ x, y, blur, ext, rgb:[r,g,b], a, inset }] */
const LEER = `(sel, modo) => {
  const e = sel instanceof Element ? sel : document.querySelector(sel);
  const v = getComputedStyle(e)[modo];
  if (v === 'none') return [];
  const re = /(rgba?\\([^)]*\\))\\s+(-?[\\d.]+)px\\s+(-?[\\d.]+)px\\s+(-?[\\d.]+)px(?:\\s+(-?[\\d.]+)px)?(\\s+inset)?/g;
  const fuera = []; let m;
  while ((m = re.exec(v))) {
    const nums = m[1].match(/[\\d.]+/g).map(Number);
    fuera.push({ x: +m[2], y: +m[3], blur: +m[4], ext: m[5] === undefined ? 0 : +m[5], rgb: nums.slice(0, 3), a: nums.length > 3 ? nums[3] : 1, inset: !!m[6], crudo: v });
  }
  return fuera;
}`;
const aRgb = (h) => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));

try {
  await c.vista(1100, 900, 'light', false);
  for (let ronda = 0; ronda < 40; ronda++) {
    await c.ir(`${base}/herramientas/generador-de-sombras-css/`, 200);
    const texto = ronda % 4 === 3;
    const nCapas = ent(1, 5);
    for (let k = 1; k < nCapas; k++) if (!(await clic('Añadir capa'))) throw new Error('No se pudo añadir la capa ' + (k + 1));
    if (texto) await elegir('#c-propiedad', 'text-shadow');
    const capas = [];
    for (let k = 1; k <= nCapas; k++) {
      const d = { x: ent(-60, 60), y: ent(-60, 60), blur: ent(0, 80), ext: texto ? 0 : ent(-20, 30), color: hex(), op: [0, 1, 5, 10, 25, 33, 50, 99, 100][ent(0, 8)], inset: texto ? false : azar() < 0.3 };
      await escribir('#c-x' + k, String(d.x)); await escribir('#c-y' + k, String(d.y)); await escribir('#c-blur' + k, String(d.blur));
      if (!texto) { await escribir('#c-ext' + k, String(d.ext)); await marcar('#c-inset' + k, d.inset); }
      await elegir('#c-color' + k, d.color); await escribir('#c-op' + k, String(d.op));
      capas.push(d);
    }
    const codigo = await valor('#t-salida');
    const prop = texto ? 'textShadow' : 'boxShadow';
    const r = await c.js(`(() => {
      const leer = ${LEER};
      const probe = document.createElement('div'); probe.style.cssText = ${JSON.stringify(codigo)}; document.body.appendChild(probe);
      const valido = ${JSON.stringify(texto ? 'text-shadow' : 'box-shadow')};
      const declarado = probe.style.getPropertyValue(valido) !== '';
      const dePagina = leer(probe, ${JSON.stringify(prop)});
      const vista = leer(${JSON.stringify(texto ? '.sc-texto' : '.sc-caja')}, ${JSON.stringify(prop)});
      probe.remove();
      return { declarado, dePagina, vista };
    })()`);
    let fallo = null;
    if (!r.declarado) fallo = 'Chrome no acepta el código:\n' + codigo;
    else if (r.dePagina.length !== nCapas) fallo = `Chrome lee ${r.dePagina.length} capas y debería haber ${nCapas}:\n${codigo}`;
    else {
      capas.forEach((d, i) => {
        const s = r.dePagina[i];
        const esp = { x: d.x, y: d.y, blur: d.blur, ext: d.ext, inset: d.inset, rgb: aRgb(d.color).join(','), a: Math.round(d.op) / 100 };
        const got = { x: s.x, y: s.y, blur: s.blur, ext: s.ext, inset: s.inset, rgb: s.rgb.join(','), a: Math.round(s.a * 100) / 100 };
        if (!fallo && JSON.stringify(esp) !== JSON.stringify(got)) fallo = `capa ${i + 1}: esperado ${JSON.stringify(esp)}, Chrome lee ${JSON.stringify(got)}\n${codigo}`;
      });
      if (!fallo && JSON.stringify(r.vista.map(s => [s.x, s.y, s.blur, s.ext, s.inset, s.rgb.join(','), s.a])) !== JSON.stringify(r.dePagina.map(s => [s.x, s.y, s.blur, s.ext, s.inset, s.rgb.join(','), s.a]))) fallo = 'la vista previa pinta otra sombra que el código';
    }
    ok(!fallo, `ronda ${ronda + 1} (${texto ? 'text-shadow' : 'box-shadow'}, ${nCapas} capas)` + (fallo ? ' → ' + fallo : ''));
  }
  // Máximo de capas: el botón se desactiva en 5 y el de quitar en 1
  await c.ir(`${base}/herramientas/generador-de-sombras-css/`, 200);
  ok(await c.js(`document.querySelector('#sc-menos').disabled`) === true, 'con una capa no se puede quitar más');
  for (let k = 0; k < 4; k++) await clic('Añadir capa');
  ok(await c.js(`document.querySelector('#sc-mas').disabled`) === true, 'con cinco capas no se pueden añadir más');
  ok(await c.js(`[...document.querySelectorAll('.sc-capa')].filter(x => !x.hidden).length`) === 5, 'se ven cinco capas');
  const errores = c.consola();
  ok(errores.length === 0, 'sin errores en la consola' + (errores.length ? ' → ' + errores.slice(0, 2).join(' | ') : ''));
} catch (e) { console.log('  ✗ EXCEPCIÓN: ' + (e && e.stack || e)); A.fallos.push(String(e)); }
finally { await c.cerrar(); }
console.log(A.fallos.length ? `\n${A.fallos.length} fallos` : '\nTodo bien');
process.exit(A.fallos.length ? 1 : 0);

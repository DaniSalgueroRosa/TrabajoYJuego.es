// Casos funcionales de las herramientas que se describen en casos.json (generado junto a cada herramienta).
// Cada caso: pasos (escribir, elegir, marcar, clic, esperar, teclas) y expectativas sobre los resultados que la herramienta marca con data-k.
// Los valores esperados están calculados aparte (a mano o con Python), no copiados de lo que da la herramienta.
import fs from 'node:fs';
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const casos = JSON.parse(fs.readFileSync(process.env.CASOS || new URL('./casos.json', import.meta.url), 'utf8'));
const solo = (process.env.SOLO || '').split(',').filter(Boolean);
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, escribir, elegir, marcar, clic, texto, k, kt } = A;
const cerca = (a, b) => { const x = Number(a), y = Number(b); return a !== null && !isNaN(x) && !isNaN(y) && Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y)); };
let nCasos = 0;

try {
  await c.vista(1100, 900, 'light', false);
  for (const [slug, lista] of Object.entries(casos)) {
    if (!Array.isArray(lista)) continue;
    if (solo.length && !solo.includes(slug)) continue;
    console.log(slug);
    let errores = [];
    for (const caso of lista) {
      nCasos++;
      await c.ir(`${base}/herramientas/${slug}/`, 200);
      let fallo = null;
      try {
        for (const p of caso.pasos || []) {
          const [t, a, b] = p;
          if (t === 'e') await escribir(a, b); else if (t === 's') await elegir(a, b); else if (t === 'm') await marcar(a, b);
          else if (t === 'c') { if (!(await clic(a))) throw new Error('No hay botón «' + a + '»'); }
          else if (t === 'w') await esperar(a);
        }
        for (const tecla of caso.teclas || []) { await c.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(tecla)}, bubbles: true, cancelable: true }))`); await esperar(40); }
        if (caso.espera_ms) await esperar(caso.espera_ms);
        for (const [t, a, b] of caso.espera || []) {
          if (t === 'k') { const v = await k(a); if (!(v === String(b) || cerca(v, b))) fallo = `«${a}» = ${v}, esperado ${b}`; }
          else if (t === 'kt') { const v = (await kt(a))?.trim(); if (v !== b) fallo = `texto de «${a}» = «${v}», esperado «${b}»`; }
          else if (t === 'ktc') { const v = await kt(a); if (v === null || !v.includes(b)) fallo = `texto de «${a}» = «${v}», debería contener «${b}»`; }
          else if (t === 't') { const v = await texto(a); if (!v.includes(b)) fallo = `${a} no contiene «${b}» (tiene «${v.slice(0, 80)}»)`; }
          else if (t === 'v') { const v = await c.js(`document.querySelector(${JSON.stringify(a)})?.value ?? null`); if (v !== b) fallo = `valor de ${a} = «${v}», esperado «${b}»`; }
          else if (t === 'vc') { const v = await c.js(`document.querySelector(${JSON.stringify(a)})?.value ?? null`); if (v === null || !v.includes(b)) fallo = `valor de ${a} = «${(v || '').slice(0, 80)}», debería contener «${b}»`; }
          else if (t === 'vr') { const v = await c.js(`document.querySelector(${JSON.stringify(a)})?.value ?? null`); if (v === null || !new RegExp(b, 's').test(v)) fallo = `valor de ${a} = «${(v || '').slice(0, 80)}», no cumple /${b}/`; }
          else if (t === 'error') { const v = await kt('error'); if (v === null || !v.includes(a)) fallo = `error = «${v}», debería contener «${a}»`; }
          else if (t === 'noerror') { const v = await kt('error'); if (v !== null) fallo = `no debería haber error y hay «${v}»`; }
          if (fallo) break;
        }
      } catch (e) { fallo = e.message; }
      ok(!fallo, `${slug}: ${caso.nombre}` + (fallo ? ' → ' + fallo : ''));
      errores = errores.concat(c.consola());
    }
    ok(errores.length === 0, `${slug}: sin errores en la consola` + (errores.length ? ' → ' + errores.slice(0, 2).join(' | ') : ''));
  }
  console.log(`\n${nCasos} casos ejecutados`);
} catch (e) { console.log('  ✗ EXCEPCIÓN: ' + e.message); fallos.push(e.message); }
finally { await c.cerrar(); }
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);

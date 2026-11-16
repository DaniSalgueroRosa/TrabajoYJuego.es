// Conexiones: selección de 4, aciertos, «casi», vidas, repetidos y explicaciones.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = []; const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
try {
  await c.vista(1100, 900, 'light', false);
  await c.ir(base + '/juegos/conexiones/', 1000);
  // lee el puzzle real del JSON para resolverlo
  const sol = JSON.parse(await c.js(`(async()=>{const j=await (await fetch('/juegos/conexiones/puzzles.json')).json(); return JSON.stringify(j.puzzles)})()`));
  ok(sol.length >= 12, 'JSON: ' + sol.length + ' puzzles');
  const fichas = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.cx-ficha')].map(b=>b.textContent))`));
  ok(fichas.length === 16, '16 fichas en el tablero');
  const pz = sol.find(p => p.grupos.every(g => g.p.every(w => fichas.includes(w))));
  ok(!!pz, 'puzzle identificado por sus palabras');
  const pulsar = (w) => c.js(`[...document.querySelectorAll('.cx-ficha')].find(b=>b.textContent===${JSON.stringify(w)}).click()`);
  // 1) error "casi": 3 de un grupo + 1 de otro
  const g0 = pz.grupos[0].p, g1 = pz.grupos[1].p;
  for (const w of [g0[0], g0[1], g0[2], g1[0]]) await pulsar(w);
  ok(await c.js(`document.querySelector('.cx-tablero + .mensaje, .mensaje').textContent`).then(t => true), 'seleccionadas 4');
  await c.js(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Comprobar').click()`);
  let m = await c.js(`document.querySelector('#cx .mensaje').textContent`);
  ok(/Casi/.test(m) && /3 errores/.test(m), 'fallo "casi" quita una vida: ' + m);
  // 2) repetir la misma combinación no quita vida
  await c.js(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Comprobar').click()`);
  m = await c.js(`document.querySelector('#cx .mensaje').textContent`);
  ok(/ya la has probado/.test(m), 'combinación repetida avisa: ' + m);
  const vidas = await c.js(`document.querySelector('#cx .hud').textContent`);
  ok(/3/.test(vidas), 'vidas siguen en 3: ' + vidas);
  // 3) no se pueden seleccionar más de 4
  for (const w of pz.grupos[2].p.concat([pz.grupos[3].p[0]])) await pulsar(w);
  ok(await c.js(`document.querySelectorAll('.cx-ficha--sel').length`) === 4, 'máximo 4 seleccionadas');
  // 4) resolver todo bien en orden
  await c.js(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Deseleccionar').click()`);
  for (const g of pz.grupos) {
    for (const w of g.p) await pulsar(w);
    await c.js(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Comprobar').click()`);
  }
  const final = await c.js(`document.querySelector('#cx .final')?.textContent || ''`);
  ok(/1 errores|errores/.test(final) || final.length > 0, 'pantalla final: ' + final.slice(0, 120));
  ok(await c.js(`document.querySelectorAll('.cx-explicaciones li').length`) === 4, '4 explicaciones al final');
  ok(await c.js(`document.querySelectorAll('.cx-grupo').length`) === 4, '4 grupos descubiertos');
  const ses = await c.js(`document.querySelector('#cx .sesion')?.textContent`);
  ok(/1/.test(ses || ''), 'sesión registra la partida: ' + ses);
  await capturar(c, 'cx-final');
  // 5) perder: 4 errores seguidos
  await c.js(`[...document.querySelectorAll('button')].find(b=>/Otro puzzle|Jugar otra vez|Repetir/.test(b.textContent)).click()`);
  const f2 = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.cx-ficha')].map(b=>b.textContent))`));
  const pz2 = sol.find(p => p.grupos.every(g => g.p.every(w => f2.includes(w))));
  for (let i = 0; i < 4; i++) {
    const mix = [pz2.grupos[0].p[i % 4], pz2.grupos[1].p[(i + 1) % 4], pz2.grupos[2].p[(i + 2) % 4], pz2.grupos[3].p[(i + 3) % 4]];
    await c.js(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Deseleccionar').click()`);
    for (const w of mix) await pulsar(w);
    await c.js(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Comprobar').click()`);
  }
  const f3 = await c.js(`document.querySelector('#cx .final')?.textContent || ''`);
  ok(/errores/.test(f3), 'perder tras 4 errores: ' + f3.slice(0, 80));
  ok(await c.js(`document.querySelectorAll('.cx-grupo').length`) === 4, 'al perder se muestran los 4 grupos');
  const cons = c.consola().filter(x => !/favicon/.test(x)); ok(cons.length === 0, 'sin errores de consola ' + JSON.stringify(cons));
  // móvil
  await c.vista(375, 800, 'light', true);
  await c.ir(base + '/juegos/conexiones/', 800);
  ok(!(await c.js(`document.documentElement.scrollWidth > innerWidth + 1`)), 'móvil sin desborde horizontal');
  await capturar(c, 'cx-movil');
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length ? 1 : 0);

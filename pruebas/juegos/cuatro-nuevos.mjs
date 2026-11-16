// Laberinto, Calcula 24, Ordena los frascos y Test de colores: partidas completas resueltas por un buscador propio de la prueba.
import { abrirChrome } from '../cdp.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const sinDesborde = () => c.js(`document.documentElement.scrollWidth <= window.innerWidth + 1`);

try {
  await c.vista(390, 844, 'light', true);

  console.log('LABERINTO');
  await c.ir(base + '/juegos/laberinto/', 700);
  ok(await sinDesborde(), 'móvil sin desborde');
  ok((await c.js(`document.querySelectorAll('.lab-celda').length`)) === 144, 'el laberinto mediano tiene 144 casillas');
  const abiertas = await c.js(`[...document.querySelectorAll('.lab-celda')].map(c => (c.classList.contains('lab-n') ? 1 : 0) | (c.classList.contains('lab-e') ? 2 : 0) | (c.classList.contains('lab-s') ? 4 : 0) | (c.classList.contains('lab-o') ? 8 : 0))`);
  const n = 12, DX = { 1: 0, 2: 1, 4: 0, 8: -1 }, DY = { 1: -1, 2: 0, 4: 1, 8: 0 };
  const prev = { 0: null }, cola = [0];
  while (cola.length) { const p = cola.shift(); for (const d of [1, 2, 4, 8]) if (abiertas[p] & d) { const q = ((p / n | 0) + DY[d]) * n + (p % n) + DX[d]; if (!(q in prev)) { prev[q] = [p, d]; cola.push(q); } } }
  const ruta = []; for (let p = n * n - 1; p !== 0; p = prev[p][0]) ruta.unshift(prev[p][1]);
  const cerrada = [1, 2, 4, 8].find(d => !(abiertas[0] & d));
  await c.js(`document.querySelector('.lab-boton[data-dir="${cerrada}"]').click()`);
  ok((await texto('.hud')).replace(/\s+/g, ' ').toLowerCase().includes('pasos 0'), 'una pared bloquea el paso y no cuenta');
  await c.js(`document.querySelector('.lab-tablero').focus()`);
  const tecla = { 1: 'ArrowUp', 2: 'ArrowRight', 4: 'ArrowDown', 8: 'ArrowLeft' };
  await c.js(`document.querySelector('.lab-tablero').dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(tecla[ruta[0]])}, bubbles: true, cancelable: true }))`);
  for (const d of ruta.slice(1)) await c.js(`document.querySelector('.lab-boton[data-dir="${d}"]').click()`);
  await esperar(100);
  const f1 = await texto('.final');
  ok(f1.includes('Has llegado'), 'llegar por el camino más corto termina la partida');
  ok(f1.includes('Camino más corto posible: ' + ruta.length), `el camino mínimo calculado (${ruta.length}) coincide con el del juego`);
  ok(f1.replace(/\s+/g, ' ').includes(ruta.length + ' PASOS') || f1.toLowerCase().includes(ruta.length + 'pasos') || f1.toLowerCase().replace(/\s+/g, '').includes(ruta.length + 'pasos'), 'se cuentan exactamente los pasos dados');
  await clic('Fácil 8×8'); await esperar(100);
  ok((await c.js(`document.querySelectorAll('.lab-celda').length`)) === 64, 'el tamaño fácil tiene 64 casillas');
  ok(c.consola().length === 0, 'sin errores de consola');

  console.log('CALCULA 24');
  await c.ir(base + '/juegos/el-24/', 700);
  ok(await sinDesborde(), 'móvil sin desborde');
  function resolver(v) {            // devuelve [[i, j, op], …] sobre listas donde el resultado se añade al final
    if (v.length === 1) return Math.abs(v[0] - 24) < 1e-9 ? [] : null;
    for (let i = 0; i < v.length; i++) for (let j = 0; j < v.length; j++) {
      if (i === j) continue;
      for (const op of ['+', '-', '*', '/']) {
        const a = v[i], b = v[j]; let r = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : (b === 0 ? null : a / b);
        if (r === null) continue;
        const resto = v.filter((_, x) => x !== i && x !== j); resto.push(r);
        const s = resolver(resto); if (s) return [[i, j, op], ...s];
      }
    }
    return null;
  }
  for (let ronda = 1; ronda <= 3; ronda++) {
    const nums = (await c.js(`[...document.querySelectorAll('.c24-carta')].map(b => +b.textContent)`));
    const pasos = resolver(nums);
    ok(!!pasos, `puzle ${ronda} (${nums.join(', ')}) tiene solución`);
    if (ronda === 1) {
      await c.js(`document.querySelectorAll('.c24-carta')[0].click(); document.querySelector('[data-op="+"]').click(); document.querySelectorAll('.c24-carta')[1].click();`);
      ok((await c.js(`document.querySelectorAll('.c24-carta').length`)) === 3, 'una operación deja tres cartas');
      await clic('Deshacer');
      ok((await c.js(`document.querySelectorAll('.c24-carta').length`)) === 4, 'deshacer devuelve las cuatro cartas');
      await clic('Pista');
      ok(/= 24/.test(await texto('.mensaje')), 'la pista muestra una solución');
    }
    for (const [i, j, op] of pasos) await c.js(`document.querySelectorAll('.c24-carta')[${i}].click(); document.querySelector('[data-op="${op}"]').click(); document.querySelectorAll('.c24-carta')[${j}].click();`);
    await esperar(60);
    ok((await texto('.final')).includes('Has llegado a 24'), `puzle ${ronda}: se resuelve y termina`);
    await clic('Otro puzle'); await esperar(60);
  }
  ok(c.consola().length === 0, 'sin errores de consola');

  console.log('ORDENA LOS FRASCOS');
  await c.ir(base + '/juegos/ordena-los-frascos/', 800);
  ok(await sinDesborde(), 'móvil sin desborde');
  ok((await c.js(`document.querySelectorAll('.fr-frasco').length`)) === 7, 'el nivel medio tiene 7 frascos');
  const leer = () => c.js(`[...document.querySelectorAll('.fr-frasco')].map(f => [...f.querySelectorAll('.fr-capa')].map(x => +x.className.match(/fr-c(\\d)/)[1]))`);
  const CAP = 4;
  const cimaN = (f) => { let k = 0; while (k < f.length && f[f.length - 1 - k] === f[f.length - 1]) k++; return k; };
  const puede = (e, a, b) => a !== b && e[a].length && e[b].length < CAP && (!e[b].length ? cimaN(e[a]) !== e[a].length : e[b][e[b].length - 1] === e[a][e[a].length - 1]);
  const verter = (e, a, b) => { const k = Math.min(cimaN(e[a]), CAP - e[b].length), col = e[a][e[a].length - 1]; for (let i = 0; i < k; i++) { e[a].pop(); e[b].push(col); } };
  const hecho = (e) => e.every(f => !f.length || (f.length === CAP && cimaN(f) === CAP));
  function solucion(e0) {
    const vistos = new Set(), pila = [[e0, []]]; let nodos = 0;
    while (pila.length && nodos++ < 60000) {
      const [e, camino] = pila.pop(), k = e.map(f => f.join('')).sort().join('|');
      if (vistos.has(k)) continue; vistos.add(k);
      if (hecho(e)) return camino;
      for (let a = 0; a < e.length; a++) for (let b = 0; b < e.length; b++) if (puede(e, a, b)) { const s = e.map(f => f.slice()); verter(s, a, b); pila.push([s, [...camino, [a, b]]]); }
    }
    return null;
  }
  let est = await leer();
  ok(est.flat().length === 20 && est.filter(f => !f.length).length === 2, 'hay 20 capas y 2 frascos vacíos');
  await c.js(`document.querySelectorAll('.fr-frasco')[5].click(); document.querySelectorAll('.fr-frasco')[5].click();`);
  const camino = solucion(est);
  ok(!!camino, `el puzle tiene solución (${camino && camino.length} vertidos)`);
  await c.js(`document.querySelectorAll('.fr-frasco')[${camino[0][0]}].click(); document.querySelectorAll('.fr-frasco')[${camino[0][1]}].click();`);
  await clic('Deshacer'); await clic('Reiniciar');
  ok(JSON.stringify(await leer()) === JSON.stringify(est), 'reiniciar devuelve el puzle al comienzo');
  for (const [a, b] of camino) await c.js(`document.querySelectorAll('.fr-frasco')[${a}].click(); document.querySelectorAll('.fr-frasco')[${b}].click();`);
  await esperar(80);
  ok((await texto('.final')).includes('ordenados'), 'seguir la solución termina la partida');
  ok((await texto('.final')).replace(/\s+/g, '').includes(String(camino.length)), 'el contador de movimientos coincide con los vertidos hechos');
  await clic('Fácil · 4 colores'); await esperar(100);
  ok((await c.js(`document.querySelectorAll('.fr-frasco').length`)) === 6, 'el nivel fácil tiene 6 frascos');
  ok(c.consola().length === 0, 'sin errores de consola');

  console.log('TEST DE COLORES');
  await c.ir(base + '/juegos/encuentra-el-color/', 700);
  ok(await sinDesborde(), 'móvil sin desborde');
  const raro = () => c.js(`(() => { const b = [...document.querySelectorAll('.col-celda')], f = {}; b.forEach(x => { const k = getComputedStyle(x).backgroundColor; f[k] = (f[k] || 0) + 1; }); const unico = Object.keys(f).find(k => f[k] === 1); return b.findIndex(x => getComputedStyle(x).backgroundColor === unico); })()`);
  ok((await c.js(`document.querySelectorAll('.col-celda').length`)) === 0, 'el tiempo no corre antes de pulsar Empezar');
  await clic('Empezar'); await esperar(200);
  ok((await c.js(`document.querySelectorAll('.col-celda').length`)) === 4, 'la primera ronda es de 2×2');
  for (let i = 0; i < 4; i++) { const r = await raro(); ok(r >= 0, `ronda ${i + 1}: hay una casilla de tono distinto`); await c.js(`document.querySelectorAll('.col-celda')[${r}].click()`); }
  ok((await c.js(`document.querySelectorAll('.col-celda').length`)) === 16, 'en la ronda 5 la cuadrícula es de 4×4');
  const antes = +(await texto('.hud').then(t => /Tiempo\s*(\d+)/i.exec(t.replace(/\n/g, ' '))[1]));
  const r = await raro(); const mala = (r + 1) % 16;
  await c.js(`document.querySelectorAll('.col-celda')[${mala}].click()`);
  const despues = +(await texto('.hud').then(t => /Tiempo\s*(\d+)/i.exec(t.replace(/\n/g, ' '))[1]));
  ok(antes - despues >= 2 && antes - despues <= 4, `un fallo resta unos 3 segundos (${antes} → ${despues})`);
  ok((await texto('.hud')).replace(/\s+/g, ' ').toLowerCase().includes('fallos 1'), 'se cuenta el fallo');
  let fin = '';
  for (let i = 0; i < 40 && !fin; i++) { await esperar(1000); fin = await texto('.final'); }
  ok(fin.includes('Se acabó el tiempo'), 'al agotarse el tiempo aparece el resultado');
  ok(/4/.test(fin), 'las rondas superadas se muestran: ' + fin.replace(/\s+/g, ' ').slice(0, 60));
  ok((await c.js(`[...document.querySelectorAll('.col-celda')].every(b => b.disabled)`)), 'las casillas se bloquean al acabar');
  ok(c.consola().length === 0, 'sin errores de consola');
} finally { await c.cerrar(); }
if (fallos.length) { console.log('\nFALLOS:', fallos); process.exit(1); }
console.log('\nTODO BIEN');

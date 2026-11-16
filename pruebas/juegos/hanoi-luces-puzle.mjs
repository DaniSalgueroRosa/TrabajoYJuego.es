// Torre de Hanói (solución recursiva y pistas), Apaga las luces (vecinas y pistas) y Puzle deslizante (solución por búsqueda).
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const teclaDoc = (k) => c.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);

try {
  await c.vista(420, 900, 'light', true);
  // ============================================================ HANÓI
  console.log('TORRE DE HANÓI');
  await c.ir(base + '/juegos/torre-de-hanoi/', 800);
  const HN = `document.querySelector('.hn-tablero')`;
  const torres = () => c.js(`${HN}.dataset.torres`);
  ok((await torres()) === '4321||', 'empieza con 4 discos en la torre 1');
  await clic('3 discos'); await esperar(60);
  ok((await torres()) === '321||' && (await texto('.hud')).includes('7'), 'con 3 discos el mínimo es 7');
  // movimiento prohibido y deshacer
  await teclaDoc('1'); await teclaDoc('2');                       // disco 1 a la torre 2
  ok((await torres()) === '32|1|', 'las teclas 1 y 2 mueven el disco de arriba de la torre 1 a la 2');
  await teclaDoc('1'); await teclaDoc('2');                       // disco 2 sobre disco 1: no permitido
  ok((await torres()) === '32|1|' && (await texto('.mensaje')).includes('No se puede poner el disco 2 sobre el disco 1'), 'poner un disco grande sobre uno pequeño no se permite y se explica');
  ok((await c.js(`${HN}.dataset.movs`)) === '1', 'un movimiento prohibido no cuenta');
  await teclaDoc('3');
  ok((await texto('.mensaje')).includes('vacía'), 'coger de una torre vacía avisa');
  await clic('Deshacer');
  ok((await torres()) === '321||' && (await c.js(`${HN}.dataset.movs`)) === '0', 'Deshacer devuelve el disco y resta el movimiento');
  // solución perfecta con 3 discos
  const mover = async (n, a, b, aux) => { if (!n) return; await mover(n - 1, a, aux, b); await teclaDoc(String(a + 1)); await teclaDoc(String(b + 1)); await mover(n - 1, aux, b, a); };
  await mover(3, 0, 2, 1); await esperar(100);
  let fin = await texto('.final');
  ok(fin.includes('Torre perfecta') && (await c.js(`${HN}.dataset.movs`)) === '7', 'con el método recursivo se resuelve en 7 movimientos: «Torre perfecta»');
  ok(/\d+\s*puntos/i.test(fin.replace(/\n/g, ' ')) || fin.includes('Movimientos: 7'), 'el resultado indica los movimientos');
  // pistas: seguir solo las pistas con 4 discos
  await clic('4 discos'); await esperar(60);
  await teclaDoc('1'); await teclaDoc('3');                       // un primer movimiento que no es el óptimo
  let pasos = 0;
  while (pasos < 30 && !(await texto('.final')).includes('Torre')) {
    await clic('Pista (−30 puntos)'); await esperar(30);
    const de = await c.js(`[...document.querySelectorAll('.hn-torre')].findIndex(t => t.classList.contains('hn-pista-de'))`);
    const a = await c.js(`[...document.querySelectorAll('.hn-torre')].findIndex(t => t.classList.contains('hn-pista-a'))`);
    if (de < 0 || a < 0) break;
    await teclaDoc(String(de + 1)); await teclaDoc(String(a + 1)); pasos++;
  }
  fin = await texto('.final');
  ok(fin.includes('Torre') && pasos <= 16, `siguiendo la pista desde una posición no óptima se resuelve (${pasos} pistas, el mínimo desde el inicio son 15)`);
  await capturar(c, 'hanoi-final', false);

  // ============================================================ LUCES
  console.log('APAGA LAS LUCES');
  await c.ir(base + '/juegos/apaga-las-luces/', 800);
  const AL = `document.querySelector('.al-rejilla')`;
  const luces = async () => (await c.js(`${AL}.dataset.luces`)).split('').map(Number);
  ok((await c.js(`document.querySelectorAll('.al-celda').length`)) === 25, 'el nivel Medio es una rejilla de 5×5');
  // una pulsación cambia la casilla y sus vecinas
  const antes = await luces();
  await c.js(`document.querySelectorAll('.al-celda')[6].click()`);
  const despues = await luces();
  const cambiadas = antes.map((v, i) => v !== despues[i] ? i : -1).filter(i => i >= 0).join(',');
  ok(cambiadas === '1,5,6,7,11', `pulsar la casilla 6 cambia ella y sus cuatro vecinas (${cambiadas})`);
  await c.js(`document.querySelectorAll('.al-celda')[6].click()`);
  ok(JSON.stringify(await luces()) === JSON.stringify(antes), 'pulsar dos veces la misma casilla lo deja todo como estaba');
  ok((await c.js(`document.querySelectorAll('.al-on')[0]?.textContent`)) === '●' && (await c.js(`document.querySelectorAll('.al-celda:not(.al-on)')[0]?.textContent`)) === '○', 'las luces encendidas y apagadas se distinguen también por su símbolo');
  // seguir solo las pistas hasta apagarlo todo
  const objetivo = +(await c.js(`${AL}.dataset.objetivo`));
  await c.js(`document.querySelectorAll('.al-celda')[0].focus(); document.querySelectorAll('.al-celda')[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))`);
  ok((await c.js(`document.querySelectorAll('.al-celda')[5].tabIndex`)) === 0, 'las flechas mueven el foco por el tablero');
  let n = 0;
  while (n < 40 && !(await texto('.final')).includes('Todo apagado')) {
    await clic('Pista (−40 puntos)'); await esperar(30);
    const i = await c.js(`[...document.querySelectorAll('.al-celda')].findIndex(b => b.classList.contains('al-pista'))`);
    if (i < 0) break;
    await c.js(`document.querySelectorAll('.al-celda')[${i}].click()`); n++;
  }
  fin = await texto('.final');
  ok(fin.includes('Todo apagado') && n <= objetivo, `siguiendo las pistas se apagan todas las luces en ${n} pulsaciones (había solución en ${objetivo} o menos)`);
  await capturar(c, 'luces-final', false);
  for (const [nombre, celdas] of [['Fácil (4×4)', 16], ['Difícil (6×6)', 36]]) {
    await clic(nombre); await esperar(80);
    ok((await c.js(`document.querySelectorAll('.al-celda').length`)) === celdas, `${nombre}: ${celdas} casillas`);
    let m = 0;
    while (m < 60 && !(await texto('.final')).includes('Todo apagado')) {
      await clic('Pista (−40 puntos)'); await esperar(20);
      const i = await c.js(`[...document.querySelectorAll('.al-celda')].findIndex(b => b.classList.contains('al-pista'))`);
      if (i < 0) break;
      await c.js(`document.querySelectorAll('.al-celda')[${i}].click()`); m++;
    }
    ok((await texto('.final')).includes('Todo apagado'), `${nombre}: las pistas lo resuelven (${m} pulsaciones)`);
  }

  // ============================================================ PUZLE
  console.log('PUZLE DESLIZANTE');
  await c.ir(base + '/juegos/puzle-deslizante/', 800);
  const PD = `document.querySelector('.pd-tablero')`;
  const tablero = async () => (await c.js(`${PD}.dataset.tablero`)).split(',').map(Number);
  const flecha = (k) => c.js(`${PD}.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
  ok((await c.js(`document.querySelectorAll('.pd-ficha').length`)) === 15, 'el nivel Medio tiene 15 fichas');
  // deslizar varias fichas con un toque
  let t = await tablero(), h = t.indexOf(0), hr = Math.floor(h / 4), hc = h % 4;
  let lejana = -1;
  for (let k = 0; k < 16; k++) if (k !== h && ((Math.floor(k / 4) === hr && Math.abs(k % 4 - hc) === 2) || (k % 4 === hc && Math.abs(Math.floor(k / 4) - hr) === 2))) { lejana = k; break; }
  if (lejana >= 0) {
    const m0 = +(await c.js(`${PD}.dataset.movs`));
    await c.js(`document.querySelectorAll('.pd-ficha')[${t[lejana] - 1}].click()`);
    const t2 = await tablero();
    ok(+(await c.js(`${PD}.dataset.movs`)) === m0 + 2 && t2[lejana] === 0 && t2[h] !== 0, 'tocar una ficha a dos casillas del hueco desliza las dos fichas (2 movimientos)');
  } else console.log('    (no había ninguna ficha a dos casillas del hueco: se omite esa comprobación)');
  // las flechas que no tienen ficha al otro lado no hacen nada
  t = await tablero(); h = t.indexOf(0);
  const m1 = await c.js(`${PD}.dataset.movs`);
  if (h % 4 === 3) { await flecha('ArrowLeft'); ok((await c.js(`${PD}.dataset.movs`)) === m1, 'una flecha sin ficha al otro lado del hueco no hace nada'); }
  // 3×3 resuelto por búsqueda en anchura y jugado con las flechas
  await clic('Fácil (3×3)'); await esperar(80);
  const inicio = await tablero();
  const meta = [1, 2, 3, 4, 5, 6, 7, 8, 0].join('');
  const vecinosDe = (i) => { const r = Math.floor(i / 3), cc = i % 3, v = []; if (r > 0) v.push(i - 3); if (r < 2) v.push(i + 3); if (cc > 0) v.push(i - 1); if (cc < 2) v.push(i + 1); return v; };
  const previo = new Map([[inicio.join(''), null]]); let frontera = [inicio.join('')], encontrado = false;
  while (frontera.length && !encontrado) {
    const sig = [];
    for (const s of frontera) {
      const a = [...s].map(Number), b = a.indexOf(0);
      for (const v of vecinosDe(b)) { const q = a.slice(); q[b] = q[v]; q[v] = 0; const k = q.join(''); if (!previo.has(k)) { previo.set(k, [s, b, v]); sig.push(k); if (k === meta) encontrado = true; } }
    }
    frontera = sig;
  }
  const camino = []; for (let s = meta; previo.get(s); s = previo.get(s)[0]) camino.push(previo.get(s));
  camino.reverse();
  ok(encontrado && camino.length > 0, `el puzle 3×3 tiene solución (${camino.length} movimientos)`);
  for (const [, vacioAntes, ficha] of camino) {          // la ficha de la posición «ficha» se desliza hasta donde estaba el hueco
    const dx = (vacioAntes % 3) - (ficha % 3), dy = Math.floor(vacioAntes / 3) - Math.floor(ficha / 3);
    await flecha(dx === 1 ? 'ArrowRight' : dx === -1 ? 'ArrowLeft' : dy === 1 ? 'ArrowDown' : 'ArrowUp');
  }
  await esperar(100);
  fin = await texto('.final');
  ok(fin.includes('Puzle ordenado') && fin.includes('Movimientos: ' + camino.length), `jugando la solución con las flechas gana en ${camino.length} movimientos`);
  await capturar(c, 'puzle-final', false);
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'HANÓI, LUCES Y PUZLE: todo bien');
process.exit(fallos.length ? 1 : 0);

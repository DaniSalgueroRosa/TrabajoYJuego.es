// Piedra, papel o tijera, Adivina el número, Juego de los palillos, Tabla de Schulte e Inundación: partidas completas y comprobaciones de reglas.
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

  console.log('PIEDRA, PAPEL O TIJERA');
  await c.ir(base + '/juegos/piedra-papel-o-tijera/', 700);
  ok(await sinDesborde(), 'móvil sin desborde');
  ok((await c.js(`document.querySelectorAll('[data-jugada]').length`)) === 3, 'hay tres jugadas');
  for (let i = 0; i < 30 && !(await texto('.final')); i++) { await c.js(`document.querySelectorAll('[data-jugada]')[${i % 3}].click()`); await esperar(30); }
  const f = await texto('.final');
  ok(/ganado la serie|Gana la máquina/.test(f), 'la serie termina con un resultado: ' + f.split('\n')[0]);
  const m = f.match(/Marcador final: (\d+) a (\d+)/);
  const hist = await c.js(`[...document.querySelectorAll('.ppt-hist li')].map(l => l.textContent)`);
  const g = hist.filter(x => x.includes('Ganas la ronda')).length, p = hist.filter(x => x.includes('Gana la máquina')).length;
  ok(m && +m[1] === g && +m[2] === p, `el marcador (${m && m[1]}-${m && m[2]}) coincide con el historial (${g}-${p})`);
  ok(Math.max(g, p) === 3 && Math.min(g, p) < 3, 'al mejor de 5 gana quien llega a 3');
  ok((await c.js(`[...document.querySelectorAll('[data-jugada]')].every(b => b.disabled)`)), 'los botones se bloquean al acabar');
  await clic('Otra serie'); await esperar(100);
  ok((await texto('.hud')).includes('Ronda'), 'otra serie reinicia la partida');
  ok(c.consola().length === 0, 'sin errores de consola');

  console.log('ADIVINA EL NÚMERO');
  await c.ir(base + '/juegos/adivina-el-numero/', 700);
  ok(await sinDesborde(), 'móvil sin desborde');
  const enviar = (v) => c.js(`(() => { const i = document.getElementById('an-campo'); i.value = ${JSON.stringify(String(v))}; document.querySelector('.an-form').requestSubmit(); })()`);
  await enviar('0'); await esperar(50);
  ok((await texto('.mensaje')).includes('entero entre 1 y 100'), 'el 0 se rechaza');
  await enviar('101'); await esperar(50);
  ok((await texto('.mensaje')).includes('entero entre 1 y 100'), 'el 101 se rechaza');
  await enviar('2.5'); await esperar(50);
  ok((await texto('.mensaje')).includes('entero entre 1 y 100'), 'un decimal se rechaza');
  ok((await c.js(`document.querySelectorAll('.an-hist li').length`)) === 0, 'los rechazos no gastan intentos');
  let lo = 1, hi = 100, n = 0;
  while (!(await texto('.final')) && n < 12) {
    const mid = Math.floor((lo + hi) / 2);
    await enviar(mid); await esperar(40); n++;
    const msg = await c.js(`document.querySelector('.an-hist li')?.textContent || ''`);
    if (msg.includes('más alto')) lo = mid + 1; else if (msg.includes('más bajo')) hi = mid - 1;
  }
  ok(/adivinado/.test(await texto('.final')), `la búsqueda por mitades acierta en ${n} intentos (máximo 7)`);
  ok(n <= 7, 'no necesita más de 7 intentos en 1–100');
  await clic('Otro número'); await esperar(100);
  await enviar('50'); await esperar(50); await enviar('50'); await esperar(50);
  ok((await texto('.mensaje')).includes('Ya has probado el 50'), 'repetir un número avisa y no cuenta');
  await clic('Fácil (1 a 50)'); await esperar(100);
  ok((await texto('.hud')).replace(/\s+/g, ' ').includes('7'), 'el nivel fácil da 7 intentos');
  ok(c.consola().length === 0, 'sin errores de consola');

  console.log('JUEGO DE LOS PALILLOS');
  await c.ir(base + '/juegos/juego-del-nim/', 700);
  ok(await sinDesborde(), 'móvil sin desborde');
  ok((await c.js(`document.querySelectorAll('.nim-palillo').length`)) === 21, 'empieza con 21 palillos');
  await clic('15 palillos'); await esperar(100);
  ok((await c.js(`document.querySelectorAll('.nim-palillo').length`)) === 15, 'se puede elegir 15 palillos');
  await clic('Quitar 2'); await esperar(1000);                      // deja 13
  for (let i = 0; i < 10 && !(await texto('.final')); i++) {
    const q = await c.js(`document.querySelectorAll('.nim-quitado').length`), quedan = 15 - q;
    const ultima = await texto('.mensaje');
    const k = +(/La máquina quita (\d)/.exec(ultima) || [])[1];
    if (!k) { await esperar(300); continue; }
    await clic('Quitar ' + (4 - k)); await esperar(1000);
  }
  ok((await texto('.final')).includes('Has ganado'), 'la regla de los cuatro gana a la máquina difícil con 15 palillos');
  await clic('Otra partida'); await esperar(100);
  ok((await c.js(`document.querySelector('[data-quitar="3"]').disabled`)) === false, 'Quitar 3 disponible al empezar');
  await clic('Máquina fácil'); await esperar(100);
  for (let i = 0; i < 30 && !(await texto('.final')); i++) { await c.js(`(() => { const b = [...document.querySelectorAll('[data-quitar]')].reverse().find(b => !b.disabled); if (b) b.click(); })()`); await esperar(750); }
  ok(/Has ganado|último palillo/.test(await texto('.final')), 'una partida contra la fácil termina: ' + (await texto('.final')).split('\n')[0]);
  ok(c.consola().length === 0, 'sin errores de consola');

  console.log('TABLA DE SCHULTE');
  await c.ir(base + '/juegos/tabla-de-schulte/', 700);
  ok(await sinDesborde(), 'móvil sin desborde');
  await clic('Empezar'); await esperar(300);
  ok((await c.js(`document.querySelectorAll('.sch-celda').length`)) === 25, 'la tabla 5×5 tiene 25 casillas');
  ok(JSON.stringify(await c.js(`[...document.querySelectorAll('.sch-celda')].map(b => +b.dataset.n).sort((a, b) => a - b)`)) === JSON.stringify([...Array(25)].map((_, i) => i + 1)), 'contiene los números del 1 al 25 sin repetir');
  ok(await sinDesborde(), 'la tabla no desborda en móvil');
  await c.js(`document.querySelector('.sch-celda[data-n="9"]').click()`); await esperar(50);
  ok((await texto('.hud')).replace(/\s+/g, ' ').includes('Fallos 1'), 'un número que no toca cuenta un fallo');
  for (let i = 1; i <= 25; i++) await c.js(`document.querySelector('.sch-celda[data-n="${i}"]').click()`);
  await esperar(100);
  const fs = await texto('.final');
  ok(fs.includes('Tabla completada') && fs.includes('Fallos: 1'), 'completar la tabla muestra el resultado');
  ok(/Primera marca/.test(fs), 'anota la primera marca de la sesión');
  await clic('Otra tabla'); await esperar(200);
  ok((await texto('.hud')).includes('Busca el'), 'otra tabla empieza de nuevo');
  ok(c.consola().length === 0, 'sin errores de consola');

  console.log('INUNDACIÓN');
  await c.ir(base + '/juegos/inundacion/', 700);
  ok(await sinDesborde(), 'móvil sin desborde');
  ok((await c.js(`document.querySelectorAll('.inu-celda').length`)) === 100, 'el tablero mediano tiene 100 casillas');
  ok((await c.js(`document.querySelectorAll('.inu-color').length`)) === 6, 'hay seis colores');
  ok((await c.js(`document.querySelectorAll('.inu-color:disabled').length`)) === 1, 'el color actual aparece desactivado');
  // estrategia voraz dentro de la página, a partir de lo que se ve
  const jugar = () => c.js(`(() => {
    const n = Math.round(Math.sqrt(document.querySelectorAll('.inu-celda').length));
    const g = [...document.querySelectorAll('.inu-celda')].map(x => +x.textContent - 1);
    const reg = (g) => { const col = g[0], v = new Set([0]), pila = [0]; while (pila.length) { const p = pila.pop(), x = p % n, y = (p - x) / n; [[x > 0, p - 1], [x < n - 1, p + 1], [y > 0, p - n], [y < n - 1, p + n]].forEach(([c, q]) => { if (c && !v.has(q) && g[q] === col) { v.add(q); pila.push(q); } }); } return [...v]; };
    const area0 = reg(g); let mejor = -1, mc = 0;
    for (let k = 0; k < document.querySelectorAll('.inu-color').length; k++) { if (k === g[0]) continue; const h = g.slice(); area0.forEach(p => h[p] = k); const a = reg(h).length; if (a > mejor) { mejor = a; mc = k; } }
    document.querySelector('.inu-color[data-color="' + mc + '"]').click();
  })()`);
  for (let i = 0; i < 40 && !(await texto('.final')); i++) await jugar();
  const fi = await texto('.final');
  ok(/inundado|sin movimientos/.test(fi), 'la partida termina: ' + fi.split('\n')[0]);
  if (/inundado/.test(fi)) ok((await c.js(`new Set([...document.querySelectorAll('.inu-celda')].map(x => x.textContent)).size`)) === 1, 'al ganar, todo el tablero es de un solo color');
  const hudTxt = (await texto('.hud')).replace(/\n/g, ' '), movs = +(/Movimientos\s*(\d+)/i.exec(hudTxt) || [])[1];
  ok(movs <= 22, `no se pasa del límite (${movs} de 22)`);
  await clic('Otro tablero'); await esperar(100);
  await c.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true }))`); await esperar(50);
  ok((await texto('.hud')).replace(/\s+/g, ' ').includes('Movimientos 1') || (await c.js(`document.querySelector('.inu-color[data-color="2"]').disabled`)), 'la tecla 3 elige el color 3');
  await clic('Grande 12×12'); await esperar(100);
  ok((await c.js(`document.querySelectorAll('.inu-celda').length`)) === 144 && await sinDesborde(), 'el tablero grande (144) cabe en móvil');
  ok(c.consola().length === 0, 'sin errores de consola');
} finally { await c.cerrar(); }
if (fallos.length) { console.log('\nFALLOS:', fallos); process.exit(1); }
console.log('\nTODO BIEN');

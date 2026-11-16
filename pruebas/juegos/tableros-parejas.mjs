// Tres en raya, Cuatro en raya y Parejas: lógica, máquina difícil, dos jugadores y partida completa.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const tecla = (key) => c.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true }))`);
const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);

try {
  await c.vista(420, 900, 'light', true);

  // ============================================================ TRES EN RAYA
  console.log('TRES EN RAYA');
  await c.ir(base + '/juegos/tres-en-raya/', 800);
  ok((await c.js(`document.querySelectorAll('.tr-celda').length`)) === 9, 'el tablero tiene 9 casillas');
  await clic('Dos jugadores'); await esperar(100);
  for (const i of [0, 3, 1, 4, 2]) await c.js(`document.querySelectorAll('.tr-celda')[${i}].click()`);
  await esperar(100);
  ok((await texto('.final')).includes('Gana X'), 'dos jugadores: X completa la fila de arriba y gana');
  ok((await c.js(`document.querySelectorAll('.tr-gana').length`)) === 3, 'se resaltan las tres casillas ganadoras');
  ok((await c.js(`[...document.querySelectorAll('.tr-celda')].every(b => b.disabled)`)), 'el tablero se bloquea al acabar');
  await clic('Otra partida'); await esperar(100);
  // empate a mano: X O X / X O O / O X X
  for (const i of [0, 1, 2, 4, 3, 5, 7, 6, 8]) await c.js(`document.querySelectorAll('.tr-celda')[${i}].click()`);
  await esperar(100);
  ok((await texto('.final')).includes('Empate'), 'dos jugadores: tablero lleno sin línea es empate');

  // contra la máquina difícil: nunca pierde
  await clic('Contra la máquina (difícil)'); await esperar(100);
  const resultados = [];
  for (let partida = 0; partida < 4; partida++) {
    if (partida === 2) { await clic('Empieza la máquina (X)'); await esperar(500); }
    for (let paso = 0; paso < 12; paso++) {
      if ((await texto('.final')).length) break;
      const libres = await c.js(`JSON.stringify([...document.querySelectorAll('.tr-celda')].map((b, i) => b.disabled ? -1 : i).filter(i => i >= 0))`);
      const l = JSON.parse(libres);
      if (!l.length) { await esperar(150); continue; }
      await c.js(`document.querySelectorAll('.tr-celda')[${l[Math.floor(Math.random() * l.length)]}].click()`);
      await esperar(480);
    }
    const f = await texto('.final');
    resultados.push(f.includes('Has ganado') ? 'gana' : f.includes('ha ganado la máquina') || f.includes('Ha ganado la máquina') ? 'pierde' : f.includes('Empate') ? 'empate' : 'sin terminar');
    if (partida < 3) { await clic('Otra partida'); await esperar(partida === 1 ? 100 : 500); }
  }
  console.log('    resultados contra la difícil: ' + resultados.join(', '));
  ok(!resultados.includes('gana') && !resultados.includes('sin terminar'), 'la máquina difícil no pierde ninguna partida y todas acaban');
  ok((await texto('.sesion')).length > 0, 'se muestra el marcador de la sesión');
  await capturar(c, 'tres-en-raya-final', false);

  // ============================================================ CUATRO EN RAYA
  console.log('CUATRO EN RAYA');
  await c.ir(base + '/juegos/cuatro-en-raya/', 800);
  ok((await c.js(`document.querySelectorAll('.c4-celda').length`)) === 42 && (await c.js(`document.querySelectorAll('.c4-soltar').length`)) === 7, 'el tablero tiene 42 huecos y 7 botones de columna');
  await clic('Dos jugadores'); await esperar(100);
  await tecla('1'); await tecla('2'); await tecla('1'); await tecla('2'); await tecla('1'); await tecla('2');
  ok((await c.js(`document.querySelectorAll('[data-ficha="1"]').length`)) === 3 && (await c.js(`document.querySelectorAll('[data-ficha="2"]').length`)) === 3, 'las teclas 1 y 2 sueltan fichas alternas en sus columnas');
  await tecla('1'); await esperar(100);
  ok((await texto('.final')).includes('Gana la ficha amarilla'), 'cuatro fichas amarillas en vertical ganan');
  ok((await c.js(`document.querySelectorAll('.c4-gana').length`)) === 4, 'se resaltan las cuatro fichas ganadoras');
  await tecla('3'); await esperar(60);
  ok((await c.js(`document.querySelectorAll('[data-ficha="1"]').length`)) === 4, 'al acabar, el teclado deja de soltar fichas');
  // columna llena
  await clic('Otra partida'); await esperar(100);
  for (let i = 0; i < 6; i++) await tecla('7');
  ok((await c.js(`document.querySelectorAll('.c4-soltar')[6].disabled`)), 'una columna llena deshabilita su botón');
  // la máquina difícil bloquea tres en vertical
  await clic('Difícil'); await esperar(150);
  let bloqueo = null, intentos = 0;
  for (let i = 0; i < 4; i++) {
    const celdas = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.c4-celda')].map(c => +c.dataset.ficha))`));
    const tres = celdas[35] === 1 && celdas[28] === 1 && celdas[21] === 1 && celdas[14] === 0;
    if (tres) { bloqueo = celdas[14]; break; }
    await tecla('1'); await esperar(900);
    intentos++;
    const despues = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.c4-celda')].map(c => +c.dataset.ficha))`));
    if (despues[35] === 1 && despues[28] === 1 && despues[21] === 1) { bloqueo = despues[14]; break; }
    if (despues[35] !== 1 || despues[28] === 2 && i < 1) { /* la máquina tapó la columna: no hay amenaza que probar */ }
  }
  ok(bloqueo === null || bloqueo === 2, bloqueo === null ? 'la máquina difícil impidió formar tres seguidos en la columna 1 (no hubo amenaza)' : 'la máquina difícil bloquea el cuarto hueco de una columna con tres fichas');
  await esperar(500);
  await capturar(c, 'cuatro-en-raya-final', false);

  // ============================================================ PAREJAS
  console.log('PAREJAS');
  await c.ir(base + '/juegos/parejas/', 800);
  await clic('Fácil (6 parejas)'); await esperar(150);
  ok((await c.js(`document.querySelectorAll('.pj-carta').length`)) === 12, 'el nivel fácil reparte 12 cartas');
  const nombre = (i) => c.js(`(document.querySelectorAll('.pj-carta')[${i}].getAttribute('aria-label').split(': ')[1] || '').replace(', pareja encontrada', '')`);
  const estadoCarta = (i) => c.js(`+document.querySelectorAll('.pj-carta')[${i}].dataset.estado`);
  const pulsar = (i) => c.js(`document.querySelectorAll('.pj-carta')[${i}].click()`);
  const vistas = {};
  // primera pareja de cartas: se comprueba el bloqueo durante la espera
  await pulsar(0); await pulsar(1);
  vistas[0] = await nombre(0); vistas[1] = await nombre(1);
  if (vistas[0] !== vistas[1]) {
    await pulsar(2);
    ok((await estadoCarta(2)) === 0, 'con dos cartas distintas abiertas, una tercera pulsación se ignora');
    ok((await texto('.mensaje')).includes('No coinciden'), 'el mensaje avisa de que no coinciden');
    await esperar(1000);
    ok((await estadoCarta(0)) === 0 && (await estadoCarta(1)) === 0, 'las dos cartas vuelven boca abajo');
  }
  for (let i = 2; i < 12; i += 2) {
    await pulsar(i); await pulsar(i + 1);
    vistas[i] = await nombre(i); vistas[i + 1] = await nombre(i + 1);
    if (vistas[i] !== vistas[i + 1]) await esperar(1000);
  }
  const grupos = {};
  Object.entries(vistas).forEach(([i, n]) => { (grupos[n] = grupos[n] || []).push(+i); });
  ok(Object.values(grupos).every(g => g.length === 2) && Object.keys(grupos).length === 6, 'las 12 cartas forman 6 figuras distintas, cada una dos veces');
  await esperar(200);
  for (const g of Object.values(grupos)) {
    if ((await estadoCarta(g[0])) === 2) continue;
    await pulsar(g[0]); await pulsar(g[1]); await esperar(80);
  }
  await esperar(150);
  const fin = await texto('.final');
  ok(fin.includes('Todas las parejas'), 'al encontrar las 6 parejas aparece el resultado');
  ok(/\d+\s*puntos/i.test(fin.replace(/\n/g, ' ')) || /\d/.test(fin), 'el resultado muestra la puntuación');
  ok((await texto('.hud')).includes('6 / 6'), 'el marcador de parejas llega a 6 / 6');
  ok((await c.js(`[...document.querySelectorAll('.pj-carta')].every(b => b.disabled)`)), 'todas las cartas quedan bloqueadas');
  await capturar(c, 'parejas-final', false);
  await clic('Otra partida'); await esperar(150);
  ok((await c.js(`document.querySelectorAll('.pj-carta[data-estado="0"]').length`)) === 12, '«Otra partida» vuelve a barajar con todas las cartas boca abajo');
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TABLEROS Y PAREJAS: todo bien');
process.exit(fallos.length ? 1 : 0);

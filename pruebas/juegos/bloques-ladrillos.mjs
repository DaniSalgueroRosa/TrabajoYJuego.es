// Bloques que caen (con un piloto automático que lee el tablero) y Ladrillos.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const BQ = `document.querySelector('.bq-lienzo')`;
const teclaBQ = (k) => c.js(`document.querySelector('.bq-zona').dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
const celdasBQ = async () => (await c.js(`${BQ}.dataset.celdas`)).split(';').map(s => s.split(',').map(Number));

// piloto: en una sola evaluación síncrona prueba las cuatro rotaciones y todas las columnas, y deja caer la pieza donde peor huella deja
const PILOTO = `(n) => {
  const zona = document.querySelector('.bq-zona'), l = document.querySelector('.bq-lienzo');
  const key = (k) => zona.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const leer = () => ({ tab: l.dataset.tablero, celdas: l.dataset.celdas.split(';').map(s => s.split(',').map(Number)), tipo: l.dataset.pieza });
  const evaluar = (tab, celdas) => {
    const g = tab.split('').map(Number);
    celdas.forEach(([r, cc]) => { if (r >= 0) g[r * 10 + cc] = 1; });
    let llenas = 0, huecos = 0, alto = 0, bultos = 0, prev = null;
    for (let r = 0; r < 20; r++) if (g.slice(r * 10, r * 10 + 10).every(Boolean)) llenas++;
    for (let cc = 0; cc < 10; cc++) {
      let h = 0, visto = false;
      for (let r = 0; r < 20; r++) { if (g[r * 10 + cc]) { if (!visto) { h = 20 - r; visto = true; } } else if (visto) huecos++; }
      alto += h; if (prev !== null) bultos += Math.abs(h - prev); prev = h;
    }
    return -0.51 * alto + 0.76 * llenas - 0.36 * huecos - 0.18 * bultos;
  };
  const soltar = (tab, celdas, dx) => {
    let d = 0;
    const libre = (k) => celdas.every(([r, cc]) => { const R = r + k, C = cc + dx; return C >= 0 && C < 10 && R < 20 && (R < 0 || tab[R * 10 + C] === '0'); });
    if (!libre(0)) return null;
    while (libre(d + 1)) d++;
    return celdas.map(([r, cc]) => [r + d, cc + dx]);
  };
  let puestas = 0;
  for (; puestas < n && l.dataset.estado === 'juego'; puestas++) {
    const tipo = l.dataset.pieza, cand = [];
    for (let rot = 0; rot < 4; rot++) {
      const s = leer();
      for (let dx = -9; dx <= 9; dx++) {
        const fin = soltar(s.tab, s.celdas, dx);
        if (fin) cand.push({ rot, dx, nota: evaluar(s.tab, fin), minC: Math.min(...s.celdas.map(x => x[1])) + dx });
      }
      if (tipo === 'O') break;
      key('ArrowUp');
    }
    cand.sort((a, b) => b.nota - a.nota);
    const mejor = cand[0];
    for (let i = 0; i < mejor.rot; i++) key('ArrowUp');
    const actual = Math.min(...leer().celdas.map(x => x[1]));
    const ir = mejor.minC - actual;
    for (let i = 0; i < Math.abs(ir); i++) key(ir < 0 ? 'ArrowLeft' : 'ArrowRight');
    key(' ');
  }
  return { puestas, estado: l.dataset.estado, lineas: +l.dataset.lineas, puntos: +l.dataset.puntos };
}`;

try {
  await c.vista(420, 900, 'light', true);
  console.log('BLOQUES QUE CAEN');
  await c.ir(base + '/juegos/bloques-que-caen/', 800);
  ok((await c.js(`${BQ}.dataset.estado`)) === 'espera', 'empieza en espera');
  const antes = await celdasBQ();
  await teclaBQ('P'); await esperar(50);
  ok((await c.js(`${BQ}.dataset.estado`)) === 'espera', 'P no hace nada si no ha empezado');
  await teclaBQ(' ');
  ok((await c.js(`${BQ}.dataset.estado`)) === 'juego', 'la barra espaciadora empieza la partida');
  for (let i = 0; i < 12; i++) await teclaBQ('ArrowLeft');
  let ce = await celdasBQ();
  ok(Math.min(...ce.map(x => x[1])) === 0, 'la pieza se detiene en el muro izquierdo');
  for (let i = 0; i < 14; i++) await teclaBQ('ArrowRight');
  ce = await celdasBQ();
  ok(Math.max(...ce.map(x => x[1])) === 9, 'la pieza se detiene en el muro derecho');
  const tipo = await c.js(`${BQ}.dataset.pieza`);
  if (tipo !== 'O') {
    const a = JSON.stringify(await celdasBQ());
    await teclaBQ('ArrowUp');
    ok(JSON.stringify(await celdasBQ()) !== a, `la tecla ↑ gira la pieza ${tipo}`);
  }
  await teclaBQ('p'); const antesP = JSON.stringify(await celdasBQ()); await esperar(1000);
  ok((await c.js(`${BQ}.dataset.estado`)) === 'pausa' && JSON.stringify(await celdasBQ()) === antesP, 'en pausa la pieza no cae');
  await teclaBQ('p');
  const y0 = Math.max(...(await celdasBQ()).map(x => x[0])); await esperar(1900);
  ok(Math.max(...(await celdasBQ()).map(x => x[0])) > y0, 'al seguir, la pieza cae sola');
  // el piloto automático completa líneas
  const r = JSON.parse(await c.js(`JSON.stringify((${PILOTO})(70))`));
  console.log('    piloto: ' + JSON.stringify(r));
  ok(r.lineas >= 15, `el piloto completa líneas (${r.lineas}) con 70 piezas`);
  ok(r.puntos >= r.lineas * 100, `los puntos (${r.puntos}) son al menos 100 por línea`);
  const hud = (await texto('.hud')).replace(/\s+/g, ' ');
  ok(/Nivel 2|2 Nivel/.test(hud) || hud.includes('2'), 'el nivel sube al pasar de diez líneas (' + hud + ')');
  await capturar(c, 'bloques-jugando', false);
  // llenar hasta arriba soltando siempre en el centro
  await clic('Nueva partida'); await esperar(100);
  await teclaBQ(' ');
  for (let i = 0; i < 40; i++) await teclaBQ(' ');
  await esperar(100);
  ok((await c.js(`${BQ}.dataset.estado`)) === 'fin' && (await texto('.final')).includes('han llegado arriba'), 'apilar sin parar acaba la partida');
  await teclaBQ('ArrowLeft');
  ok((await c.js(`${BQ}.dataset.estado`)) === 'fin', 'tras acabar las teclas ya no hacen nada');
  await capturar(c, 'bloques-final', false);

  // ============================================================ LADRILLOS
  console.log('LADRILLOS');
  await c.ir(base + '/juegos/ladrillos/', 800);
  const LD = `document.querySelector('.ld-lienzo')`;
  const dato = (k) => c.js(`${LD}.dataset.${k}`);
  const moverPala = (xLogica) => c.js(`(() => { const z = document.querySelector('.ld-zona'), r = z.getBoundingClientRect(); z.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + ${xLogica} / 480 * r.width, clientY: r.top + r.height - 10, bubbles: true, pointerType: 'mouse' })); })()`);
  const total0 = +(await dato('ladrillos'));
  ok(total0 === 40 && (await dato('estado')) === 'espera', 'empieza en espera con un muro de 40 ladrillos (5 filas de 8)');
  await moverPala(100);
  ok(Math.abs(+(await dato('pala')) - 100) <= 2, 'la pala sigue al puntero');
  await moverPala(-300);
  ok(+(await dato('pala')) === 38, 'la pala no se sale por la izquierda');
  await moverPala(5000);
  ok(+(await dato('pala')) === 442, 'la pala no se sale por la derecha');
  await moverPala(240);
  // sin mover la pala: se pierden las tres vidas
  await c.js(`document.querySelector('.ld-zona').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))`);
  ok((await dato('estado')) === 'juego' && !(await dato('bola')).includes('pegada'), 'la barra espaciadora lanza la bola');
  await c.js(`document.querySelector('.ld-zona').dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }))`);
  const posP = await dato('bola'); await esperar(500);
  ok((await dato('estado')) === 'pausa' && (await dato('bola')) === posP, 'en pausa la bola no se mueve');
  await c.js(`document.querySelector('.ld-zona').dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }))`);
  await moverPala(60); await moverPala(60);
  // la bola sale hacia arriba; con la pala lejos acabará cayendo
  for (let i = 0; i < 40 && +(await dato('vidas')) === 3; i++) await esperar(250);
  ok(+(await dato('vidas')) === 2 && (await dato('bola')).includes('pegada'), 'si la bola cae pierdes una vida y vuelve a la pala');
  // seguir la bola con la pala para romper ladrillos
  await c.js(`window.__sigue = setInterval(() => { const l = document.querySelector('.ld-lienzo'), z = document.querySelector('.ld-zona'), r = z.getBoundingClientRect(); const x = +l.dataset.bola.split(',')[0] + Math.sin(Date.now() / 260) * 30; z.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + x / 480 * r.width, clientY: r.top + 10, bubbles: true, pointerType: 'mouse' })); }, 4)`);
  await c.js(`document.querySelector('.ld-zona').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))`);
  await esperar(12000);
  const rotos = total0 - +(await dato('ladrillos')), pts = +(await dato('puntos'));
  ok(rotos >= 6 && pts >= rotos * 10, `siguiendo la bola se rompen ladrillos (${rotos}) y suben los puntos (${pts})`);
  ok(+(await dato('vidas')) === 2, 'siguiendo la bola no se pierde ninguna vida más');
  await capturar(c, 'ladrillos-jugando', false);
  // limpiar el muro de golpe para ver el siguiente nivel: se rompen todos los ladrillos con el piloto durante un rato más
  for (let i = 0; i < 110 && +(await dato('nivel')) === 1 && (await dato('estado')) === 'juego'; i++) await esperar(1000);
  console.log('    muro actual: ' + (await dato('nivel')) + ', ladrillos: ' + (await dato('ladrillos')) + ', puntos: ' + (await dato('puntos')));
  ok(+(await dato('nivel')) >= 2, 'limpiar el primer muro abre el segundo');
  await c.js(`clearInterval(window.__sigue)`);
  // perder todas las vidas
  for (let i = 0; i < 80 && (await dato('estado')) !== 'fin'; i++) {
    if ((await dato('bola')).includes('pegada')) { await moverPala(30); await c.js(`document.querySelector('.ld-zona').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))`); }
    await esperar(300);
  }
  ok((await dato('estado')) === 'fin' && (await texto('.final')).includes('Se acabaron las bolas'), 'sin vidas termina la partida y se enseña el resultado');
  await capturar(c, 'ladrillos-final', false);
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'BLOQUES Y LADRILLOS: todo bien');
process.exit(fallos.length ? 1 : 0);

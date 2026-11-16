// Sudoku y Buscaminas: se juegan de verdad en Chrome. El sudoku se resuelve con un resolvedor propio escrito aquí (no con datos del juego);
// el buscaminas, con reglas lógicas simples hechas dentro de la página. Se lanza con «python3 sitio.py probar --navegador».
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const tecla = (key, destino = 'document.activeElement') => c.js(`${destino}.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true }))`);

// ---------- resolvedor de sudoku (cuenta soluciones hasta un límite)
function resolver(g, limite = 2) {
  const cel = g.slice(); let n = 0, primera = null;
  const ok9 = (k, v) => { const f = Math.floor(k / 9), c0 = k % 9; for (let i = 0; i < 9; i++) { if (cel[f * 9 + i] === v || cel[i * 9 + c0] === v) return false; } const bf = f - f % 3, bc = c0 - c0 % 3; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (cel[(bf + a) * 9 + bc + b] === v) return false; return true; };
  (function buscar() {
    if (n >= limite) return;
    let mejor = -1, opciones = null;
    for (let k = 0; k < 81; k++) if (!cel[k]) { const o = []; for (let v = 1; v <= 9; v++) if (ok9(k, v)) o.push(v); if (!opciones || o.length < opciones.length) { mejor = k; opciones = o; if (o.length <= 1) break; } }
    if (mejor < 0) { n++; if (!primera) primera = cel.slice(); return; }
    for (const v of opciones) { cel[mejor] = v; buscar(); cel[mejor] = 0; if (n >= limite) return; }
  })();
  return { n, primera };
}
const leerSudoku = async () => JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.sdk-celda')].map(b => { const m = /número (\\d)/.exec(b.getAttribute('aria-label')); return m ? +m[1] : 0; }))`));

try {
  await c.vista(420, 900, 'light', true);
  // =============================================================== SUDOKU
  console.log('SUDOKU');
  await c.ir(base + '/juegos/sudoku/', 800);
  let g = await leerSudoku();
  let dados = g.filter(Boolean).length;
  ok(dados >= 40 && dados <= 50, `Fácil: ${dados} números dados (objetivo 40)`);
  let r = resolver(g, 2);
  ok(r.n === 1, `el tablero tiene exactamente una solución (${r.n})`);
  const sol = r.primera;
  // un número repetido en su fila se marca en rojo
  const vacia = g.findIndex(v => !v);
  const f0 = Math.floor(vacia / 9);
  const enFila = g.slice(f0 * 9, f0 * 9 + 9).find(v => v);
  await c.js(`document.querySelectorAll('.sdk-celda')[${vacia}].click()`);
  await tecla(String(enFila));
  ok(await c.js(`document.querySelectorAll('.sdk-celda')[${vacia}].classList.contains('sdk-conf')`), 'un número repetido en su fila se pinta como error');
  // «Comprobar» detecta lo que no coincide con la solución aunque no se repita
  await tecla('Backspace');
  const mala = (sol[vacia] % 9) + 1;
  const conflictoPosible = g.some((v, k) => v === mala && (Math.floor(k / 9) === f0 || k % 9 === vacia % 9));
  if (!conflictoPosible) {
    await tecla(String(mala));
    await clic('Comprobar');
    ok((await c.js(`document.querySelector('.mensaje').textContent`)).includes('1 casilla incorrecta'), 'Comprobar avisa de una casilla incorrecta');
    await tecla('Backspace');
  }
  // lápiz: la tecla N activa las notas y cada número se anota o se quita
  await tecla('n');
  ok(await c.js(`[...document.querySelectorAll('button')].find(b => /Lápiz/.test(b.textContent)).getAttribute('aria-pressed')`) === 'true', 'la tecla N activa el lápiz');
  await tecla('3'); await tecla('7');
  ok((await c.js(`document.querySelectorAll('.sdk-celda')[${vacia}].getAttribute('aria-label')`)).includes('notas 3, 7'), 'se anotan el 3 y el 7');
  await tecla('3');
  ok(/notas 7$/.test(await c.js(`document.querySelectorAll('.sdk-celda')[${vacia}].getAttribute('aria-label')`)), 'repetir la nota la quita (queda solo el 7)');
  await tecla('n');
  // flechas
  await c.js(`document.querySelectorAll('.sdk-celda')[40].click()`);
  await tecla('ArrowRight'); await tecla('ArrowDown');
  ok(await c.js(`document.activeElement.getAttribute('aria-label').startsWith('Fila 6, columna 6')`), 'las flechas mueven la selección (de la fila 5 columna 5 a la 6, 6)');
  // una pista
  const vacia2 = g.findIndex((v, k) => !v && k !== vacia);
  await c.js(`document.querySelectorAll('.sdk-celda')[${vacia2}].click()`);
  await clic('Pista');
  ok((await c.js(`document.querySelectorAll('.sdk-celda')[${vacia2}].getAttribute('aria-label')`)).includes('número ' + sol[vacia2]), 'la pista pone el número correcto');
  // resolver todo: la mitad con el teclado y la mitad con el teclado numérico de la pantalla
  let n = 0;
  for (let k = 0; k < 81; k++) {
    if (g[k] || k === vacia2) continue;
    await c.js(`document.querySelectorAll('.sdk-celda')[${k}].click()`);
    if (n++ % 2) await tecla(String(sol[k])); else await c.js(`document.querySelector('[aria-label="Poner el ${sol[k]}"]').click()`);
  }
  await esperar(150);
  const fin = await c.js(`document.querySelector('.final')?.innerText || ''`);
  ok(fin.includes('Sudoku resuelto'), 'al completar el tablero aparece «¡Sudoku resuelto!»');
  ok(/1\n?Pistas usadas: 1|Pistas usadas: 1/.test(fin), 'el resumen cuenta la pista usada');
  ok((await c.js(`document.querySelector('.sesion')?.innerText || ''`)).includes('Ganadas: 1'), 'la sesión cuenta la victoria');
  await capturar(c, 'sudoku-final', false);
  // Difícil
  await clic('Difícil'); await esperar(500);
  g = await leerSudoku(); dados = g.filter(Boolean).length;
  r = resolver(g, 2);
  ok(dados >= 28 && dados <= 40 && r.n === 1, `Difícil: ${dados} números dados y solución única`);
  // los tableros nuevos son distintos
  await clic('Nueva partida'); await esperar(300);
  ok(JSON.stringify(await leerSudoku()) !== JSON.stringify(g), 'cada tablero nuevo es distinto');

  // =============================================================== BUSCAMINAS
  console.log('BUSCAMINAS');
  await c.ir(base + '/juegos/buscaminas/', 800);
  const celdas = () => c.js(`document.querySelectorAll('.bm-celda').length`);
  ok(await celdas() === 81, 'Fácil: 9×9 = 81 casillas');
  // la primera casilla nunca es una mina (probamos 40 campos difíciles tocando una esquina y el centro)
  await clic('Difícil'); await esperar(200);
  let malos = 0;
  for (let i = 0; i < 40; i++) {
    await c.js(`document.querySelectorAll('.bm-celda')[${i % 2 ? 84 : 0}].click()`);
    if (await c.js(`!!document.querySelector('.final')`)) malos++;
    await clic('Nueva partida'); await esperar(20);
  }
  ok(malos === 0, `40 primeros toques en Difícil: ninguno pisa una mina (${malos})`);
  ok(await celdas() === 169, 'Difícil: 13×13 = 169 casillas');
  // banderas: clic derecho, tecla F y modo bandera
  await clic('Fácil'); await esperar(200);
  await c.js(`document.querySelectorAll('.bm-celda')[10].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))`);
  ok((await c.js(`document.querySelectorAll('.bm-celda')[10].getAttribute('aria-label')`)).includes('con bandera'), 'el clic derecho pone una bandera');
  ok((await c.js(`document.querySelector('.hud-valor').textContent`)) === '9', 'el contador baja a 9 minas sin marcar');
  await tecla('f', `document.querySelectorAll('.bm-celda')[11]`);
  ok((await c.js(`document.querySelectorAll('.bm-celda')[11].getAttribute('aria-label')`)).includes('con bandera'), 'la tecla F pone una bandera');
  await clic('Modo bandera');
  await c.js(`document.querySelectorAll('.bm-celda')[12].click()`);
  ok((await c.js(`document.querySelectorAll('.bm-celda')[12].getAttribute('aria-label')`)).includes('con bandera'), 'con el modo bandera un toque pone una bandera');
  await c.js(`document.querySelectorAll('.bm-celda')[12].click()`);
  ok((await c.js(`document.querySelectorAll('.bm-celda')[12].getAttribute('aria-label')`)).includes('sin descubrir'), 'y otro toque la quita');
  await clic('Modo bandera');
  // una partida jugada con lógica (varios intentos: a veces hace falta adivinar y se puede perder)
  const jugar = `(async () => {
    const q = () => [...document.querySelectorAll('.bm-celda')];
    const info = () => q().map((b, k) => { const l = b.getAttribute('aria-label'); return { k, b, oculta: l.includes('sin descubrir'), bandera: l.includes('con bandera'), n: (/(\\d) minas? alrededor/.exec(l) || [])[1] | 0, num: /alrededor/.test(l) }; });
    const C = Math.round(Math.sqrt(q().length));
    const vec = (k) => { const r = []; const f = Math.floor(k / C), c = k % C; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { if (!a && !b) continue; const nf = f + a, nc = c + b; if (nf >= 0 && nf < C && nc >= 0 && nc < C) r.push(nf * C + nc); } return r; };
    q()[Math.floor(q().length / 2)].click();
    for (let vuelta = 0; vuelta < 300; vuelta++) {
      if (document.querySelector('.final')) break;
      const t = info(); let cambio = false;
      for (const x of t) if (x.num) {
        const v = vec(x.k).map(i => t[i]), ocultas = v.filter(y => y.oculta), banderas = v.filter(y => y.bandera);
        if (ocultas.length && x.n === ocultas.length + banderas.length) { ocultas.forEach(y => { y.b.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })); y.oculta = false; y.bandera = true; }); cambio = true; }
        else if (ocultas.length && x.n === banderas.length) { x.b.click(); cambio = true; break; }       // tras abrir casillas, se vuelve a leer el campo
      }
      if (!cambio) { const o = t.filter(y => y.oculta); if (!o.length) break; o[Math.floor(Math.random() * o.length)].b.click(); }
    }
    const f = document.querySelector('.final');
    return f ? f.innerText : '';
  })()`;
  let gano = false, perdio = false;
  for (let intento = 0; intento < 12 && !gano; intento++) {
    await clic('Nueva partida'); await esperar(60);
    const txt = await c.js(jugar);
    if (txt.includes('Campo despejado')) gano = true; else if (txt.includes('pisado una mina')) perdio = true;
  }
  ok(gano, 'se puede ganar un campo Fácil aplicando la lógica (el juego detecta la victoria)');
  ok((await c.js(`document.querySelector('.final')?.innerText || ''`)).includes('Tiempo:'), 'la pantalla de victoria da el tiempo');
  await capturar(c, 'buscaminas-final', false);
  // perder: se ven las minas
  let vistas = 0;
  for (let i = 0; i < 30 && !vistas; i++) {
    await clic('Nueva partida'); await esperar(40);
    await c.js(`document.querySelectorAll('.bm-celda')[40].click()`);
    for (let j = 0; j < 81; j++) {
      await c.js(`document.querySelectorAll('.bm-celda')[${j}].click()`);
      if (await c.js(`!!document.querySelector('.final')`)) break;
    }
    const txt = await c.js(`document.querySelector('.final')?.innerText || ''`);
    if (txt.includes('pisado una mina')) vistas = await c.js(`document.querySelectorAll('.bm-mina').length`);
  }
  ok(vistas === 10, `al perder se enseñan las 10 minas (${vistas})`);
  ok((await c.js(`document.querySelector('.sesion')?.innerText || ''`)).includes('Partidas:'), 'la sesión cuenta las partidas');
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'SUDOKU Y BUSCAMINAS: todo bien');
process.exit(fallos.length ? 1 : 0);

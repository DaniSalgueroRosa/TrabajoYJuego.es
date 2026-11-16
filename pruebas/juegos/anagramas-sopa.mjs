// Anagramas (se resuelve con la lista de palabras del propio juego) y Sopa de letras (con las posiciones que expone la rejilla).
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const hastaQue = async (fn, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await esperar(40); } return false; };

try {
  await c.vista(420, 900, 'light', true);
  // ============================================================ ANAGRAMAS
  console.log('ANAGRAMAS');
  await c.ir(base + '/juegos/anagramas/', 800);
  const json = JSON.parse(await c.js(`fetch(TYJ.url('juegos/datos/palabras.json')).then(r => r.json()).then(j => JSON.stringify(j))`));
  const norm = (t) => t.toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ');
  const firma = (t) => [...norm(t)].sort().join('');
  const todas = {};
  Object.values(json.longitudes).forEach(l => l.soluciones.concat(l.validas).forEach(p => { (todas[firma(p)] = todas[firma(p)] || []).push(p); }));
  await clic('Empezar');
  const largos = [];
  for (let ronda = 1; ronda <= 10; ronda++) {
    ok(await hastaQue(async () => (await c.js(`!!document.querySelector('.an-letras')`)), 3000), `ronda ${ronda}: aparecen las letras`);
    const letras = await c.js(`document.querySelector('.an-letras').dataset.letras`);
    largos.push(letras.length);
    const opciones = todas[firma(letras)] || [];
    if (ronda === 1) {
      ok(opciones.length > 0 && !opciones.some(p => norm(p) === letras), `las letras («${letras}») no forman ya la palabra ordenada y tienen solución`);
      ok((await c.js(`[...document.querySelectorAll('.an-letra')].every(s => s.textContent === s.textContent.toUpperCase())`)), 'las letras salen en mayúsculas');
    }
    let respuesta = opciones[0];
    if (ronda === 4) {                                         // una errata (se cambia una letra) no se perdona
      const mala = respuesta.slice(0, -1) + (respuesta.slice(-1) === 'z' ? 'q' : 'z');
      await c.js(`(() => { const i = document.getElementById('rondas-respuesta'); i.value = ${JSON.stringify(mala)}; i.form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); })()`);
      await esperar(120);
      ok((await texto('.rondas-aviso')).includes('Fallo'), `una errata («${mala}») cuenta como fallo`);
      await clic('Siguiente'); await esperar(100);
      continue;
    }
    if (ronda === 5 && opciones.length > 1) respuesta = opciones[1];   // otra palabra válida con las mismas letras
    await c.js(`(() => { const i = document.getElementById('rondas-respuesta'); i.value = ${JSON.stringify(ronda === 6 ? respuesta.toUpperCase() : respuesta)}; i.form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); })()`);
    await esperar(120);
    ok((await texto('.rondas-aviso')).includes('Correcto'), `ronda ${ronda}: «${respuesta}» es correcta`);
    await clic(ronda === 10 ? 'Ver resultado' : 'Siguiente'); await esperar(100);
  }
  ok(JSON.stringify(largos) === JSON.stringify([4, 4, 4, 5, 5, 5, 6, 6, 7, 7]), 'las longitudes suben de 4 a 7 letras: ' + largos.join(','));
  const f = await texto('.final');
  ok(f.includes('9 aciertos de 10') , 'resultado: 9 aciertos de 10 (la errata falló)');
  await capturar(c, 'anagramas-final', false);

  // ============================================================ SOPA DE LETRAS
  console.log('SOPA DE LETRAS');
  await c.ir(base + '/juegos/sopa-de-letras/', 800);
  const SL = `document.querySelector('.sl-rejilla')`;
  const solucion = async () => (await c.js(`${SL}.dataset.solucion`)).split(';').map(s => { const [p, pos] = s.split(':'); const [r, col, dr, dc] = pos.split(',').map(Number); return { p, r, c: col, dr, dc }; });
  const celda = (n, r, col) => r * n + col;
  const pulsar = (i) => c.js(`document.querySelectorAll('.sl-celda')[${i}].click()`);
  const arrastrar = (a, b) => c.js(`(() => { document.querySelector('.sl-rejilla').scrollIntoView({ block: 'center', behavior: 'instant' }); const cs = document.querySelectorAll('.sl-celda'); const ra = cs[${a}].getBoundingClientRect(), rb = cs[${b}].getBoundingClientRect();
    cs[${a}].dispatchEvent(new PointerEvent('pointerdown', { clientX: ra.left + ra.width / 2, clientY: ra.top + ra.height / 2, bubbles: true, pointerType: 'mouse', pointerId: 1 }));
    cs[${b}].dispatchEvent(new PointerEvent('pointerup', { clientX: rb.left + rb.width / 2, clientY: rb.top + rb.height / 2, bubbles: true, pointerType: 'mouse', pointerId: 1 })); })()`);
  const n0 = await c.js(`document.querySelectorAll('.sl-celda').length`);
  ok(n0 === 121, 'el nivel Medio es una rejilla de 11×11');
  let sol = await solucion();
  ok(sol.length === 9 && sol.every(p => p.dr >= 0 && p.dc >= 0 || true), 'hay 9 palabras escondidas');
  // 1) dos toques
  let p = sol[0], fin = celda(11, p.r + p.dr * (p.p.length - 1), p.c + p.dc * (p.p.length - 1));
  await pulsar(celda(11, p.r, p.c));
  ok((await c.js(`document.querySelectorAll('.sl-inicio').length`)) === 1, 'el primer toque marca la letra de inicio');
  await pulsar(fin); await esperar(60);
  ok((await c.js(`${SL}.dataset.halladas`)) === '1' && (await texto('.mensaje')).includes(p.p), `dos toques marcan «${p.p}»`);
  ok((await c.js(`[...document.querySelectorAll('.sl-palabra')].find(l => l.dataset.palabra === ${JSON.stringify(p.p)}).textContent.startsWith('✓')`)), 'la palabra se marca con ✓ en la lista, no solo con color');
  // 2) arrastrando, y al revés
  p = sol[1]; fin = celda(11, p.r + p.dr * (p.p.length - 1), p.c + p.dc * (p.p.length - 1));
  await arrastrar(fin, celda(11, p.r, p.c)); await esperar(160);
  ok((await c.js(`${SL}.dataset.halladas`)) === '2', `arrastrar de la última a la primera letra también vale («${p.p}»)`);
  // 3) línea que no es recta, y línea recta que no es palabra
  await pulsar(0); await pulsar(23); await esperar(40);
  ok((await texto('.mensaje')).includes('línea recta'), 'una línea torcida avisa de que debe ser recta');
  await pulsar(0); await pulsar(2); await esperar(40);
  ok((await texto('.mensaje')).includes('ninguna de las palabras') && (await c.js(`${SL}.dataset.halladas`)) === '2', 'una línea recta que no es palabra no cuenta');
  // 4) teclado
  await c.js(`document.querySelectorAll('.sl-celda')[0].focus()`);
  await c.js(`document.querySelectorAll('.sl-celda')[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))`);
  await c.js(`document.querySelectorAll('.sl-celda')[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))`);
  ok((await c.js(`document.querySelectorAll('.sl-celda')[12].tabIndex`)) === 0 && (await c.js(`document.querySelectorAll('.sl-celda')[0].tabIndex`)) === -1, 'las flechas mueven el foco por la rejilla (casilla 12 = fila 2, columna 2)');
  // 5) pista
  await clic('Pista (−50 puntos)'); await esperar(60);
  ok((await c.js(`document.querySelectorAll('.sl-pista').length`)) === 1, 'la pista señala una casilla');
  // 6) resolver el resto
  for (const q of sol.slice(2)) {
    const f2 = celda(11, q.r + q.dr * (q.p.length - 1), q.c + q.dc * (q.p.length - 1));
    await pulsar(celda(11, q.r, q.c)); await pulsar(f2);
  }
  await esperar(150);
  const fin2 = await texto('.final');
  ok(fin2.includes('Sopa completa') && fin2.includes('Pistas usadas: 1'), 'al encontrar las 9 palabras sale el resultado con 1 pista usada');
  await capturar(c, 'sopa-final', false);
  // dificultad: Difícil usa 8 direcciones y Fácil solo derecha/abajo
  await clic('Fácil (9×9)'); await esperar(100);
  sol = await solucion();
  ok(sol.length === 7 && sol.every(q => (q.dr === 0 && q.dc === 1) || (q.dr === 1 && q.dc === 0)), 'Fácil: 7 palabras, solo en horizontal y vertical hacia delante');
  await clic('Difícil (12×12)'); await esperar(100);
  sol = await solucion();
  ok(sol.length === 11 && (await c.js(`document.querySelectorAll('.sl-celda').length`)) === 144, 'Difícil: 11 palabras en 12×12');
  const letras = await c.js(`[...document.querySelectorAll('.sl-celda')].every(b => b.textContent.length === 1)`);
  ok(letras, 'cada casilla tiene una sola letra');
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'ANAGRAMAS Y SOPA: todo bien');
process.exit(fallos.length ? 1 : 0);

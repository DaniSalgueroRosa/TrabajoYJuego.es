// Repite la secuencia y Recuerda el número: jugadas completas leyendo el estado que expone cada juego.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const hastaQue = async (fn, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await esperar(40); } return false; };
const tecla = (k) => c.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);

try {
  await c.vista(420, 900, 'light', true);
  // ============================================================ SECUENCIA
  console.log('REPITE LA SECUENCIA');
  await c.ir(base + '/juegos/repite-la-secuencia/', 800);
  const SQ = `document.querySelector('.sq-tablero')`;
  const fase = () => c.js(`${SQ}.dataset.fase`);
  const seq = () => c.js(`${SQ}.dataset.secuencia`);
  ok((await c.js(`[...document.querySelectorAll('.sq-boton')].every(b => b.disabled)`)), 'los cuatro botones están apagados antes de empezar');
  await clic('Rápido'); await clic('Sonido: sí');
  ok((await texto('.sq-boton')).length > 0 && (await c.js(`document.querySelectorAll('.sq-simbolo').length`)) === 4, 'cada botón lleva símbolo y nombre, no solo color');
  await clic('Empezar');
  ok(await hastaQue(async () => (await fase()) === 'mostrando', 3000), 'al empezar se muestra la secuencia');
  await tecla('1');
  ok((await fase()) === 'mostrando', 'mientras se muestra, las teclas no cuentan');
  for (let ronda = 1; ronda <= 4; ronda++) {
    ok(await hastaQue(async () => (await fase()) === 'turno', 15000), `ronda ${ronda}: llega el turno del jugador`);
    const s = await seq();
    ok(s.length === ronda, `ronda ${ronda}: la secuencia tiene ${ronda} pasos (${s})`);
    for (const d of s) {
      if (ronda === 2) await c.js(`document.querySelectorAll('.sq-boton')[${d}].click()`); else await tecla(String(+d + 1));
    }
  }
  ok(await hastaQue(async () => (await fase()) === 'turno' && (await seq()).length === 5, 15000), 'tras acertar cuatro rondas llega la quinta con cinco pasos');
  const s5 = await seq(), mal = (+s5[0] + 1) % 4;
  await tecla(String(mal + 1)); await esperar(150);
  const fin = await texto('.final');
  ok(fin.includes('Has llegado a 4 pasos'), 'equivocarse en la quinta ronda termina con «Has llegado a 4 pasos»');
  ok(/puntos/i.test(fin) && (await texto('.mensaje')).includes('Era el'), 'el juego dice qué botón tocaba y da los puntos');
  ok((await fase()) === 'fin', 'la fase queda en «fin»');
  await capturar(c, 'secuencia-final', false);

  // ============================================================ NÚMERO
  console.log('RECUERDA EL NÚMERO');
  await c.ir(base + '/juegos/recuerda-el-numero/', 800);
  const RN = `document.getElementById('rn')`;
  const fn = () => c.js(`${RN}.dataset.fase`);
  const numero = () => c.js(`${RN}.dataset.numero`);
  const escribir = (v) => c.js(`(() => { const i = document.querySelector('.rn-entrada'); i.value = ${JSON.stringify(v)}; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); })()`);
  await clic('Rápido'); await clic('Empezar');
  ok(await hastaQue(async () => (await fn()) === 'ver', 2000), 'empieza mostrando un número');
  const n1 = await numero();
  ok(n1.length === 3 && /^[1-9]\d\d$/.test(n1) && (await texto('.rn-cifras')) === n1, `el primer número tiene 3 cifras (${n1}) y se ve en pantalla`);
  ok(await hastaQue(async () => (await fn()) === 'teclear', 4000), 'pasados unos segundos, el número se oculta');
  ok((await texto('.rn-cifras')) === '???' && !(await texto('.rn-caja')).includes(n1), 'en pantalla solo quedan interrogaciones');
  ok((await c.js(`document.activeElement.classList.contains('rn-entrada')`)), 'el cuadro de texto recibe el foco');
  await escribir(n1);
  ok((await fn()) === 'resultado' && (await texto('.mensaje')).includes('Correcto') && (await c.js(`${RN}.dataset.cifras`)) === '4', 'escribir bien el número sube a 4 cifras');
  ok(await hastaQue(async () => (await fn()) === 'teclear', 6000), 'el segundo número también se oculta');
  ok((await numero()).length === 4, 'el segundo número tiene 4 cifras');
  const n2 = await numero();
  await escribir(n2.slice(0, 3) + String((+n2[3] + 1) % 10));
  ok((await texto('.mensaje')).includes('Era ' + n2) && (await texto('.hud')).includes('2'), 'un error pierde una vida y enseña el número correcto');
  await clic('Otro número');
  ok(await hastaQue(async () => (await fn()) === 'teclear', 7000) && (await numero()).length === 4, 'tras un fallo se repite la longitud con otro número');
  await escribir('1');
  await clic('Otro número');
  ok(await hastaQue(async () => (await fn()) === 'teclear', 7000), 'tercer intento');
  await escribir('1'); await esperar(150);
  const f2 = await texto('.final');
  ok((await fn()) === 'fin' && f2.includes('Has recordado hasta 3 cifras') && f2.includes('30'), 'sin vidas termina: «hasta 3 cifras» y 30 puntos');
  await capturar(c, 'numero-final', false);
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'SECUENCIA Y NÚMERO: todo bien');
process.exit(fallos.length ? 1 : 0);

// Código secreto: se comprueba la valoración de cada intento (con colores repetidos) contra una implementación independiente.
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
const secreto = async () => (await c.js(`document.querySelector('.cs-paleta').dataset.secreto`)).split('').map(Number);
const valorar = (s, g) => { let ex = 0; const a = {}, b = {}; s.forEach((v, i) => { if (v === g[i]) ex++; else { a[v] = (a[v] || 0) + 1; b[g[i]] = (b[g[i]] || 0) + 1; } }); let co = 0; Object.keys(a).forEach(k => { co += Math.min(a[k], b[k] || 0); }); return [ex, co]; };
const escribir = async (g) => { for (const v of g) await teclaDoc(String(v + 1)); await teclaDoc('Enter'); };

try {
  await c.vista(420, 900, 'light', true);
  console.log('CÓDIGO SECRETO');
  await c.ir(base + '/juegos/codigo-secreto/', 800);
  ok((await c.js(`document.querySelectorAll('.cs-color').length`)) === 6 && (await c.js(`document.querySelectorAll('.cs-hueco').length`)) === 4, 'nivel Medio: 6 colores y 4 huecos');
  ok((await c.js(`[...document.querySelectorAll('.cs-color')].every(b => b.querySelector('.cs-ficha').textContent.trim().length === 1)`)), 'cada color lleva un símbolo');
  // valoración de 14 intentos aleatorios con repeticiones, en dos partidas
  let s = await secreto(), mal = 0, total = 0;
  for (let k = 0; k < 7; k++) {
    let g = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6));
    if (g.join('') === s.join('')) g[0] = (g[0] + 1) % 6;
    await escribir(g);
    const f = await c.js(`(() => { const filas = document.querySelectorAll('.cs-fila'); const l = filas[filas.length - 1]; return l.dataset.ex + ',' + l.dataset.co + ',' + l.dataset.intento; })()`);
    const [ex, co, it] = f.split(',');
    const esp = valorar(s, g); total++;
    if (+ex !== esp[0] || +co !== esp[1] || it !== g.join('')) { mal++; console.log('    código ' + s.join('') + ' intento ' + g.join('') + ' → juego ' + ex + '/' + co + ', esperado ' + esp.join('/')); }
  }
  ok(mal === 0, `la valoración coincide con la esperada en ${total} intentos (incluye colores repetidos)`);
  ok((await c.js(`document.querySelector('.cs-paleta').dataset.intentos`)) === '7' && (await texto('.hud')).includes('8 / 10'), 'el marcador pasa al intento 8 de 10');
  // casos con repetidos escritos a mano, comparados con la regla: código 0,0,1,2 con intento 0,1,1,0
  // (no se puede fijar el código, así que se comprueba solo la función con valores conocidos)
  ok(JSON.stringify(valorar([0, 0, 1, 2], [0, 1, 1, 0])) === '[2,1]' && JSON.stringify(valorar([0, 1, 2, 3], [1, 0, 0, 0])) === '[0,2]' && JSON.stringify(valorar([3, 3, 3, 3], [3, 3, 3, 3])) === '[4,0]', 'la regla de referencia da los resultados esperados en casos conocidos');
  // incompleto: no cuenta
  await clic('Otro código'); await esperar(80);
  s = await secreto();
  await teclaDoc('1'); await teclaDoc('2'); await teclaDoc('Enter');
  ok((await c.js(`document.querySelector('.cs-paleta').dataset.intentos`)) === '0' && (await texto('.mensaje')).includes('Faltan 2'), 'probar con huecos vacíos avisa y no cuenta');
  await teclaDoc('Backspace');
  ok((await c.js(`document.querySelectorAll('.cs-lleno').length`)) === 1, 'Retroceso quita el último color');
  await c.js(`document.querySelectorAll('.cs-hueco')[0].click()`);
  ok((await c.js(`document.querySelectorAll('.cs-lleno').length`)) === 0, 'tocar un hueco lleno lo vacía');
  // ganar
  await escribir(s); await esperar(100);
  let fin = await texto('.final');
  ok(fin.includes('Código descifrado') && fin.includes('Intentos usados: 1 de 10') && /1\.000|1000/.test(fin), 'acertar a la primera da «Código descifrado» y 1.000 puntos');
  await capturar(c, 'codigo-final', false);
  // perder
  await clic('Otro código'); await esperar(80);
  s = await secreto();
  const malo = s.every(v => v === 0) ? [1, 1, 1, 1] : [0, 0, 0, 0];
  for (let i = 0; i < 10; i++) await escribir(malo);
  await esperar(100);
  fin = await texto('.final');
  ok(fin.includes('Se acabaron los intentos') && fin.includes('El código era'), 'al gastar los 10 intentos se pierde y se enseña el código');
  await capturar(c, 'codigo-perdido', false);
  // nivel Fácil: sin repetir
  await clic('Fácil (4 de 6)'); await esperar(80);
  s = await secreto();
  ok(new Set(s).size === 4, `Fácil: el código no repite colores (${s.join('')})`);
  await teclaDoc('1'); await teclaDoc('1');
  ok((await c.js(`document.querySelectorAll('.cs-lleno').length`)) === 1 && (await texto('.mensaje')).includes('no se repiten') && (await c.js(`document.querySelectorAll('.cs-color')[0].disabled`)), 'Fácil: un color usado queda desactivado y no se repite');
  // nivel Difícil: 8 colores, 5 huecos, 12 intentos
  await clic('Difícil (5 de 8)'); await esperar(80);
  ok((await c.js(`document.querySelectorAll('.cs-color').length`)) === 8 && (await c.js(`document.querySelectorAll('.cs-hueco').length`)) === 5 && (await texto('.hud')).includes('12'), 'Difícil: 8 colores, 5 huecos y 12 intentos');
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'CÓDIGO SECRETO: todo bien');
process.exit(fallos.length ? 1 : 0);

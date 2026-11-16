// Palabra infinita (tipo Wordle): evaluación de letras, teclado, victoria y derrota.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
try {
  await c.vista(1000, 900);
  await c.ir(base + '/juegos/palabra-infinita/', 1200);
  ok((await c.js(`document.querySelectorAll('.pi-tablero .pi-celda').length`)) === 30, 'tablero de 6x5 = 30 celdas');
  ok((await c.js(`document.querySelectorAll('.pi-tecla[data-letra]').length`)) === 27, '27 letras en el teclado (incluye Ñ)');
  // fijamos la palabra secreta para probar: leemos la secreta de la partida con un truco: probamos escribiendo con el teclado físico
  const tecla = async (key) => { await c.enviar('Input.dispatchKeyEvent', { type: 'keyDown', key, text: key.length === 1 ? key : undefined }); await c.enviar('Input.dispatchKeyEvent', { type: 'keyUp', key }); };
  for (const l of 'abcd') await tecla(l);
  await tecla('Enter');
  ok((await c.js(`document.querySelector('.mensaje').textContent`)).includes('Faltan letras'), 'Intro con letras de menos avisa');
  await tecla('e'); 
  await tecla('Enter');
  const m1 = await c.js(`document.querySelector('.mensaje').textContent`);
  ok(m1.includes('no está en mi lista'), 'palabra inventada: avisa y pide Intro otra vez → ' + m1);
  await tecla('Enter'); await esperar(1500);
  ok((await c.js(`document.querySelectorAll('.pi-fila:first-child .pi-celda.ok, .pi-fila:first-child .pi-celda.hay, .pi-fila:first-child .pi-celda.no').length`)) === 5, 'segundo Intro acepta la palabra y colorea las 5 letras');
  ok((await c.js(`document.querySelector('.pi-info').textContent`)).includes('Intento 2'), 'pasa al intento 2');
  // borrar
  await tecla('a'); await tecla('Backspace');
  ok((await c.js(`document.querySelectorAll('.pi-fila:nth-child(2) .pi-celda.llena').length`)) === 0, 'Borrar quita la letra');
  // rendirse
  await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Rendirme').click()`);
  await esperar(200);
  ok((await c.js(`!!document.querySelector('.final')`)), 'Rendirme muestra la pantalla final');
  const fin = await c.js(`document.querySelector('.final').innerText`);
  console.log('   final:', fin.replace(/\n+/g, ' | '));
  ok(fin.includes('La palabra era'), 'la pantalla final dice la palabra');
  ok((await c.js(`document.querySelector('.pi-teclado').hidden`)), 'el teclado se oculta al acabar');
  // otra palabra
  await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Otra palabra').click()`);
  await esperar(200);
  ok((await c.js(`!document.querySelector('.final') && !document.querySelector('.pi-teclado').hidden`)), 'Otra palabra vuelve al juego');
  // longitud 7
  await c.js(`[...document.querySelectorAll('.pi-longitud button')].find(b => b.textContent === '7').click()`);
  await esperar(200);
  ok((await c.js(`document.querySelectorAll('.pi-tablero .pi-celda').length`)) === 42, 'longitud 7 → 42 celdas');
  // ganar: leemos la secreta pidiéndola al juego con un intento de cada solución? usamos la API interna vía fetch de la lista y probamos hasta acertar es largo; en su lugar espiamos la secreta con un intento acertado:
  // Truco de prueba: sobrescribimos Math.random para que elija la primera palabra y la reconocemos en la lista.
  await c.ir(base + '/juegos/palabra-infinita/', 800);
  await c.js(`Math.random = () => 0;`);
  await c.js(`[...document.querySelectorAll('.pi-longitud button')].find(b => b.textContent === '4').click()`);
  await esperar(100);
  const primera = await c.js(`fetch(TYJ.url('juegos/datos/palabras.json')).then(r => r.json()).then(j => j.longitudes['4'].soluciones[0])`);
  console.log('   primera solución de 4:', primera);
  for (const l of primera.normalize('NFD').replace(/[̀-ͯ]/g,'')) await tecla(l);
  await tecla('Enter'); await esperar(1500);
  ok((await c.js(`!!document.querySelector('.final')`)), 'acertar muestra la pantalla final');
  const gana = await c.js(`document.querySelector('.final').innerText`);
  console.log('   final:', gana.replace(/\n+/g, ' | '));
  ok(gana.includes('de 6 intentos') && gana.includes('Compartir resultado'), 'final de victoria con intentos y compartir');
  ok((await c.js(`document.querySelector('.sesion').innerText`)).includes('Ganadas: 1'), 'estadísticas de la sesión: 1 ganada');
  // sin almacenamiento
  const alm = await c.js(`(async () => JSON.stringify({ls: localStorage.length, ss: sessionStorage.length, ck: document.cookie, idb: (indexedDB.databases ? (await indexedDB.databases()).length : 0)}))()`);
  ok(alm === '{"ls":0,"ss":0,"ck":"","idb":0}', 'no guarda nada: ' + alm);
  const cons = c.consola().filter(x => !/favicon/.test(x));
  ok(cons.length === 0, 'sin errores en consola ' + JSON.stringify(cons));
  await capturar(c, 'pi-desktop', false);
  await c.vista(375, 800, 'light', true);
  await c.ir(base + '/juegos/palabra-infinita/', 1000);
  await c.js(`document.querySelector('.pi-tablero').scrollIntoView()`);
  await c.js(`[...document.querySelectorAll('.pi-longitud button')].find(b => b.textContent === '7').click()`);
  for (const l of 'caminos') await tecla(l);
  await capturar(c, 'pi-movil', false);
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length ? 1 : 0);

// Adivina la bandera, Capitales del mundo y Test de clics, jugados de verdad en Chrome.
// Las respuestas correctas se calculan con los JSON del juego y con la descripción de cada bandera, sin tocar el código del juego.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const json = (ruta) => c.js(`fetch(TYJ.url(${JSON.stringify('juegos/' + ruta)})).then(r => r.json())`);
const textos = async () => JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.opcion')].map(b => b.textContent.replace(/^\\d /, '')))`));
const pulsar = (i) => c.js(`document.querySelectorAll('.opcion')[${i}].click()`);
const aviso = () => c.js(`document.querySelector('.rondas-aviso')?.innerText || ''`);

try {
  await c.vista(420, 900, 'light', true);
  // =============================================================== BANDERAS
  console.log('BANDERAS');
  await c.ir(base + '/juegos/banderas/', 800);
  const banderas = (await json('banderas/banderas.json')).banderas;
  ok(banderas.length >= 45 && new Set(banderas.map(b => b.n)).size === banderas.length, `${banderas.length} banderas, sin repetir`);
  ok(await clic('Empezar'), 'Empezar');
  const vistas = new Set(); let bien = 0;
  for (let i = 0; i < 10; i++) {
    await esperar(60);
    const desc = await c.js(`document.querySelector('.bd-bandera svg')?.getAttribute('aria-label') || ''`);
    const b = banderas.find(x => 'Bandera: ' + x.d === desc);
    if (!b) { ok(false, 'no se reconoce la bandera de la ronda ' + (i + 1) + ': ' + desc); break; }
    vistas.add(b.n);
    const ops = await textos();
    if (i === 0) ok(ops.length === 4 && new Set(ops).size === 4 && ops.includes(b.n), 'cuatro respuestas distintas y una es la correcta');
    if (i === 2) { await pulsar((ops.indexOf(b.n) + 1) % 4); ok((await aviso()).includes('Fallo'), 'un fallo se detecta y muestra la descripción: ' + (await aviso()).slice(0, 80).replace(/\n/g, ' ')); }
    else { await pulsar(ops.indexOf(b.n)); bien++; ok((await aviso()).includes('Correcto'), `ronda ${i + 1}: ${b.n}`); }
    await clic(i === 9 ? 'Ver resultado' : 'Siguiente');
  }
  await esperar(100);
  ok(vistas.size === 10, 'las diez banderas de la partida son distintas');
  const fin = await c.js(`document.querySelector('.final')?.innerText || ''`);
  ok(fin.includes('9 aciertos de 10') && fin.includes('Repasa lo que has fallado (1)'), 'resultado: 9 aciertos y repaso con 1 fallo');
  await capturar(c, 'banderas-final', false);

  // =============================================================== CAPITALES
  console.log('CAPITALES');
  await c.ir(base + '/juegos/capitales/', 800);
  const paises = (await json('capitales/paises.json')).paises;
  ok(paises.length >= 100, `${paises.length} países con su capital`);
  await clic('Empezar');
  let directas = 0, inversas = 0;
  for (let ronda = 0; ronda < 10; ronda++) {
    await esperar(60);
    const preg = await c.js(`document.querySelector('.rondas-enunciado').textContent`);
    const ops = await textos();
    let correcta, region, mal = false;
    let m = /^¿Cuál es la capital de (.+)\?$/.exec(preg);
    if (m) { const p = paises.find(x => x.p === m[1]); correcta = p.c; region = p.r; directas++; ok(ops.every(o => paises.find(x => x.c === o)?.r === region), `ronda ${ronda + 1}: «${preg}» → las 4 opciones son capitales de la misma región (${region})`); }
    else {
      m = /^¿De qué país es capital (.+)\?$/.exec(preg);
      const p = paises.find(x => x.c === m[1]); correcta = p.p; region = p.r; inversas++;
      ok(ops.every(o => paises.find(x => x.p === o)?.r === region), `ronda ${ronda + 1}: «${preg}» → las 4 opciones son países de la misma región (${region})`);
    }
    ok(ops.includes(correcta) && new Set(ops).size === 4, '   la correcta está entre cuatro opciones distintas');
    await c.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(String(ops.indexOf(correcta) + 1))}, bubbles: true }))`);   // se responde con el teclado
    await esperar(60);
    if (!(await aviso()).includes('Correcto')) { ok(false, 'no se aceptó la respuesta correcta de «' + preg + '»'); break; }
    await clic(ronda === 9 ? 'Ver resultado' : 'Siguiente');
  }
  await esperar(100);
  ok((await c.js(`document.querySelector('.final')?.innerText || ''`)).includes('10 aciertos de 10'), `10 aciertos de 10 (${directas} preguntas de capital y ${inversas} de país)`);

  // =============================================================== TEST DE CLICS
  console.log('TEST DE CLICS');
  await c.ir(base + '/juegos/test-de-clics/', 800);
  const centro = JSON.parse(await c.js(`(() => { const r = document.querySelector('.tc-boton').getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); })()`));
  const pulsarRaton = async () => { await c.enviar('Input.dispatchMouseEvent', { type: 'mousePressed', x: centro.x, y: centro.y, button: 'left', clickCount: 1 }); await c.enviar('Input.dispatchMouseEvent', { type: 'mouseReleased', x: centro.x, y: centro.y, button: 'left', clickCount: 1 }); };
  await c.js(`window.scrollTo(0, document.querySelector('.tc-boton').getBoundingClientRect().top + scrollY - 200)`);
  const centro2 = JSON.parse(await c.js(`(() => { const r = document.querySelector('.tc-boton').getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); })()`));
  centro.x = centro2.x; centro.y = centro2.y;
  ok((await c.js(`document.querySelector('.tc-boton').innerText`)).includes('Pulsa para empezar'), 'el botón invita a empezar');
  for (let i = 0; i < 12; i++) await pulsarRaton();
  ok((await c.js(`document.querySelector('.tc-grande').textContent`)) === '12', 'doce clics de ratón cuentan doce (un clic por pulsación)');
  // el teclado: una pulsación = un clic (sin duplicar con el clic que genera la barra espaciadora)
  await c.js(`document.querySelector('.tc-boton').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }))`);
  await c.js(`document.querySelector('.tc-boton').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true, cancelable: true }))`);
  ok((await c.js(`document.querySelector('.tc-grande').textContent`)) === '13', 'la barra espaciadora suma 1 y la tecla mantenida no suma más');
  await esperar(500);
  await c.js(`document.querySelector('.tc-boton').click()`);       // lo que haría un lector de pantalla (un clic sin ratón ni tecla delante)
  ok((await c.js(`document.querySelector('.tc-grande').textContent`)) === '14', 'un clic de lector de pantalla también cuenta');
  await c.js(`(() => { const o = performance.now.bind(performance); performance.now = () => o() + 11000; })()`);   // se agota el tiempo
  await esperar(400);
  const f = await c.js(`document.querySelector('.final')?.innerText || ''`);
  ok(f.includes('14') && f.includes('clics en 10 segundos') && /1,4 clics por segundo/.test(f), 'el final da 14 clics y 1,4 por segundo: ' + f.replace(/\n+/g, ' | ').slice(0, 110));
  ok(await c.js(`document.querySelector('.tc-boton').disabled`), 'tras acabar, el botón se desactiva');
  await capturar(c, 'clics-final', false);
  await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Repetir la prueba').click()`);
  await c.js(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === '5 segundos').click()`);
  ok((await c.js(`document.querySelectorAll('.hud-valor')[1].textContent`)) === '5,0', 'al elegir 5 segundos el reloj marca 5,0');
  ok((await c.js(`document.querySelector('.sesion').innerText`)).includes('Partidas: 1'), 'la sesión cuenta 1 partida');
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'BANDERAS, CAPITALES Y CLICS: todo bien');
process.exit(fallos.length ? 1 : 0);

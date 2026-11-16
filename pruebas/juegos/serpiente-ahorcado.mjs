// Serpiente (pilotada leyendo la posición de la cabeza y de la comida) y Ahorcado (con palabras conocidas de la lista del juego).
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const tecla = (key, destino = 'document') => c.js(`${destino}.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true }))`);
const estado = async () => JSON.parse(await c.js(`(() => { const l = document.querySelector('.sp-lienzo'); const p = s => (l.dataset[s] || '').split(',').map(Number); return JSON.stringify({ estado: l.dataset.estado, cabeza: p('cabeza'), comida: p('comida'), dir: p('direccion'), largo: +l.dataset.longitud }); })()`));
const ZONA = `document.querySelector('.sp-zona')`;
const FLECHA = { '1,0': 'ArrowRight', '-1,0': 'ArrowLeft', '0,-1': 'ArrowUp', '0,1': 'ArrowDown' };

try {
  await c.vista(420, 900, 'light', true);
  // =============================================================== SERPIENTE
  console.log('SERPIENTE');
  await c.ir(base + '/juegos/serpiente/', 800);
  let e = await estado();
  ok(e.estado === 'espera' && e.largo === 3, 'empieza en espera, con la serpiente de 3 casillas');
  await tecla('ArrowLeft', ZONA);              // dar la vuelta sobre sí misma no está permitido: arranca sin girar
  await esperar(350);
  e = await estado();
  ok(e.estado === 'juego' && e.dir[0] === 1, 'ir hacia atrás no se permite: sigue hacia la derecha y no muere');
  await tecla(' ', ZONA);
  const p1 = (await estado()).cabeza.join(); await esperar(400);
  ok((await estado()).estado === 'pausa' && (await estado()).cabeza.join() === p1, 'la barra espaciadora pausa y la serpiente no se mueve');
  await tecla(' ', ZONA); await esperar(300);
  ok((await estado()).estado === 'juego', 'otra pulsación reanuda');
  await esperar(1800);                          // llega al muro derecho
  e = await estado();
  ok(e.estado === 'fin', 'con muros, chocar con el borde acaba la partida');
  ok((await c.js(`document.querySelector('.final')?.innerText || ''`)).includes('chocado con el muro'), 'el resultado dice que has chocado con el muro');
  await capturar(c, 'serpiente-final', false);
  // pilotaje automático: comer 3 cuadrados
  let comidos = false;
  for (let intento = 0; intento < 4 && !comidos; intento++) {
    await clic('Nueva partida'); await esperar(100);
    await tecla('ArrowRight', ZONA);
    const t0 = Date.now();
    while (Date.now() - t0 < 45000) {
      e = await estado();
      if (e.estado === 'fin') break;
      if (e.largo >= 6) { comidos = true; break; }
      const [hx, hy] = e.cabeza, [fx, fy] = e.comida, [dx, dy] = e.dir;
      const quiero = [];
      if (hx < fx) quiero.push([1, 0]); if (hx > fx) quiero.push([-1, 0]); if (hy < fy) quiero.push([0, 1]); if (hy > fy) quiero.push([0, -1]);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => { if (!quiero.some(q => q[0] === d[0] && q[1] === d[1])) quiero.push(d); });
      const buena = quiero.find(d => !(d[0] === -dx && d[1] === -dy) && hx + d[0] >= 0 && hx + d[0] < 20 && hy + d[1] >= 0 && hy + d[1] < 20);
      if (buena && (buena[0] !== dx || buena[1] !== dy)) await tecla(FLECHA[buena.join()], ZONA);
      await esperar(35);
    }
  }
  ok(comidos, 'la serpiente come 3 veces y crece hasta 6 casillas');
  const puntos = await c.js(`document.querySelector('.hud-valor').textContent`);
  ok(+puntos >= 30, `los puntos suben con cada comida (${puntos})`);
  // sin muros
  await clic('Sin muros'); await esperar(150);
  await tecla('ArrowRight', ZONA);
  await esperar(2100);                          // más de 11 pasos: ya ha cruzado el borde
  e = await estado();
  ok(e.estado === 'juego' && e.cabeza[0] < 10, `sin muros, cruza el borde y reaparece por el otro lado (x = ${e.cabeza[0]})`);
  // botones táctiles
  await c.js(`[...document.querySelectorAll('.sp-dir')].find(b => b.getAttribute('aria-label') === 'Girar hacia abajo').click()`);
  await esperar(300);
  ok((await estado()).dir.join() === '0,1', 'el botón de flecha gira la serpiente');

  // =============================================================== AHORCADO
  console.log('AHORCADO');
  await c.ir(base + '/juegos/ahorcado/', 800);
  const banco = (await c.js(`fetch(TYJ.url('juegos/datos/palabras.json')).then(r => r.json())`)).longitudes;
  ok((await c.js(`document.querySelectorAll('.ah-tecla').length`)) === 27 && await c.js(`!![...document.querySelectorAll('.ah-tecla')].find(b => b.textContent === 'Ñ')`), 'el teclado tiene 27 letras, con la Ñ');
  await c.js(`Math.random = () => 0`);          // así la palabra elegida es la primera de la lista de 5 letras
  await clic('5 letras'); await esperar(100);
  const w1 = banco['5'].soluciones[0];
  const norm = (t) => t.normalize('NFD').replace(/ñ/g, '\u0001').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ');
  const letras1 = [...new Set([...w1].map(ch => norm(ch.toLowerCase())))];
  ok((await c.js(`document.querySelectorAll('.ah-letra').length`)) === 5, `la palabra tiene 5 huecos (empieza por «${w1[0]}…»)`);
  // perder con 6 letras que no están
  const ausentes = 'qwxzkjvfbgh'.split('').filter(l => !letras1.includes(l)).slice(0, 6);
  for (let i = 0; i < 6; i++) {
    await c.js(`document.querySelector('[aria-label="Letra ${ausentes[i].toUpperCase()}"]').click()`);
    if (i < 5) ok((await c.js(`document.querySelector('.hud-valor').textContent`)) === `${i + 1} / 6`, `fallo ${i + 1}: el marcador y el dibujo avanzan`);
  }
  await esperar(100);
  let fin = await c.js(`document.querySelector('.final')?.innerText || ''`);
  ok(fin.includes('sin intentos') && fin.toUpperCase().includes('LA PALABRA ERA ' + w1.toUpperCase()), `al fallar seis veces pierdes y se enseña la palabra (${w1.toUpperCase()})`);
  ok((await c.js(`document.querySelectorAll('.ah-parte--on').length`)) === 6, 'se ven las seis partes del dibujo');
  await capturar(c, 'ahorcado-final', false);
  // ganar con el teclado físico
  await clic('Otra palabra'); await esperar(100);
  const w2 = banco['5'].soluciones[1];
  for (const l of [...new Set([...w2].map(ch => norm(ch.toLowerCase())))]) await tecla(l);
  await esperar(100);
  fin = await c.js(`document.querySelector('.final')?.innerText || ''`);
  ok(fin.includes('Palabra salvada') && fin.includes('800'), `con el teclado se adivina «${w2}» sin fallos: 800 puntos`);
  ok((await c.js(`document.querySelector('.sesion')?.innerText || ''`)).includes('Ganadas: 1'), 'la sesión cuenta 1 victoria');
  // pista
  await clic('Otra palabra'); await esperar(100);
  await clic('Pista (cuesta un fallo)'); await esperar(60);
  ok((await c.js(`document.querySelector('.hud-valor').textContent`)) === '1 / 6' && (await c.js(`[...document.querySelectorAll('.ah-letra')].some(s => s.textContent)`)), 'la pista destapa una letra y cuesta un fallo');
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'SERPIENTE Y AHORCADO: todo bien');
process.exit(fallos.length ? 1 : 0);

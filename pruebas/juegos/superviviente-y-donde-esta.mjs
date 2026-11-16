// El superviviente (canvas, pausa, vidas) y ¿Dónde está? (puntuación por distancia, teclado, mapa).
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = []; const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const click = (txt) => c.js(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(txt)}&&!b.disabled&&!b.hidden&&b.offsetParent!==null); if(!b) return false; b.click(); return true})()`);
const esp = (ms) => new Promise(r => setTimeout(r, ms));
try {
  await c.vista(1100, 900, 'light', false);
  // ================= EL SUPERVIVIENTE
  console.log('EL SUPERVIVIENTE');
  await c.ir(base + '/juegos/el-superviviente/', 800);
  ok(await click('Empezar'), 'empezar');
  // posición de la nave: bbox de píxeles tiza (#EAF2EE) en el canvas
  // Tras un golpe la nave parpadea 1,5 s (se dibuja en fotogramas alternos): si no se ve, se reintenta unos instantes.
  const naveX = async () => { for (let i = 0; i < 25; i++) { const r = await naveX1(); if (r[1] >= 0) return r; await esp(40); } return await naveX1(); };
  const naveX1 = async () => JSON.parse(await c.js(`(()=>{const cv=document.querySelector('.sv-canvas'); const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data; let mn=1e9,mx=-1; for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){const i=(y*cv.width+x)*4; if(d[i]===234&&d[i+1]===242&&d[i+2]===238){ if(x<mn)mn=x; if(x>mx)mx=x; }} return JSON.stringify([mn,mx]);})()`));
  await esp(500);
  const x0 = await naveX();
  ok(x0[0] > 100 && x0[1] < 220, 'nave dibujada en el centro: ' + x0);
  const kd = (k) => c.js(`document.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(k)},bubbles:true,cancelable:true}))`);
  const ku = (k) => c.js(`document.dispatchEvent(new KeyboardEvent('keyup',{key:${JSON.stringify(k)},bubbles:true}))`);
  await kd('ArrowLeft'); await esp(500); await ku('ArrowLeft');
  const x1 = await naveX();
  ok(x1[0] < x0[0] - 60, 'la flecha izquierda mueve la nave a la izquierda: ' + x0[0] + ' → ' + x1[0]);
  await kd('d'); await esp(900); await ku('d');
  const x2 = await naveX();
  ok(x2[0] > x1[0] + 100, 'la tecla D mueve la nave a la derecha: ' + x1[0] + ' → ' + x2[0]);
  // el tiempo corre y los puntos suben
  const hud1 = await c.js(`document.querySelector('#sv .hud').textContent`); await esp(1500);
  const hud2 = await c.js(`document.querySelector('#sv .hud').textContent`);
  ok(hud1 !== hud2, 'el marcador cambia con el tiempo: ' + hud1.replace(/\s+/g, ' ') + ' → ' + hud2.replace(/\s+/g, ' '));
  // pausa con P: la nave y el tiempo se paran
  await kd('p'); await esp(300);
  ok(await c.js(`!document.querySelector('.sv-velo').hidden && /Pausa/.test(document.querySelector('.sv-velo').textContent)`), 'P abre la pausa');
  const h3 = await c.js(`document.querySelector('#sv .hud').textContent`); await esp(1200);
  ok(h3 === await c.js(`document.querySelector('#sv .hud').textContent`), 'en pausa el tiempo no avanza');
  ok(await click('Continuar'), 'continuar'); await esp(500);
  ok(await c.js(`document.querySelector('.sv-velo').hidden`), 'se reanuda');
  // movimiento con arrastre (puntero)
  await c.js(`(()=>{const cv=document.querySelector('.sv-canvas'); const r=cv.getBoundingClientRect(); const mk=(t,x,b)=>new PointerEvent(t,{pointerId:7,clientX:r.left+x*r.width/320,clientY:r.top+400,buttons:b,bubbles:true}); cv.dispatchEvent(mk('pointerdown',60,1)); cv.dispatchEvent(mk('pointermove',60,1));})()`);
  await esp(700);
  const x3 = await naveX();
  ok(x3[0] < 100, 'arrastrar hacia la izquierda lleva la nave allí: ' + x3);
  // botón en pantalla
  await c.js(`(()=>{const b=[...document.querySelectorAll('.sv-mando')].find(b=>/Mover a la derecha/.test(b.getAttribute('aria-label'))); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));})()`);
  await esp(700); await c.js(`[...document.querySelectorAll('.sv-mando')].forEach(b=>b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true})))`);
  const x4 = await naveX(); ok(x4[0] > x3[0] + 60, 'el botón «Derecha» mueve la nave: ' + x3[0] + ' → ' + x4[0]);
  await c.js(`document.querySelector('.sv-canvas').dispatchEvent(new PointerEvent('pointerup',{pointerId:7,bubbles:true}))`);
  // esperamos al fin de la partida sin mover la nave
  const t0 = Date.now();
  for (let i = 0; i < 1500; i++) { if (await c.js(`!!document.querySelector('#sv .final')`)) break; await esp(100); }
  ok(await c.js(`!!document.querySelector('#sv .final')`), 'la partida termina al perder las 3 vidas (' + Math.round((Date.now() - t0) / 1000) + ' s)');
  const fin = await c.js(`document.querySelector('#sv .final')?.textContent||''`);
  ok(/Te han alcanzado/.test(fin) && /segundos/.test(fin) && /Estrellas/.test(fin), 'pantalla final: ' + fin.slice(0, 100));
  ok(/Partidas:\s*1/.test(await c.js(`document.querySelector('#sv .sesion').textContent`)), 'sesión registra');
  ok(await click('Jugar otra vez'), 'jugar otra vez'); await esp(500);
  ok(/Vidas\s*3/.test(await c.js(`document.querySelector('#sv .hud').textContent`)), 'nueva partida con 3 vidas');
  await kd('p'); // dejar en pausa
  await c.vista(375, 800, 'light', true); await c.ir(base + '/juegos/el-superviviente/', 600);
  ok(!(await c.js(`document.documentElement.scrollWidth > innerWidth + 1`)), 'móvil sin desborde'); await capturar(c, 'sv-movil');
  await click('Empezar'); await esp(2500); await capturar(c, 'sv-juego');
  await c.vista(1100, 900, 'light', false);

  // ================= DONDE ESTA
  console.log('¿DÓNDE ESTÁ?');
  await c.ir(base + '/juegos/donde-esta/', 900);
  const lug = JSON.parse(await c.js(`(async()=>JSON.stringify((await (await fetch('/juegos/donde-esta/lugares.json')).json()).lugares))()`));
  ok(lug.length >= 50, lug.length + ' lugares en el JSON');
  const nombre = () => c.js(`document.querySelector('.de-pregunta strong').textContent`);
  const clic = (lon, lat) => c.js(`(()=>{const cv=document.querySelector('.de-canvas'); const r=cv.getBoundingClientRect(); const x=r.left+((${lon})+180)/360*r.width, y=r.top+(84-(${lat}))/144*r.height; cv.dispatchEvent(new MouseEvent('click',{clientX:x,clientY:y,bubbles:true}));})()`);
  const hudP = async () => parseInt((await c.js(`document.querySelector('#de .hud').textContent`)).replace(/\./g, '').match(/Puntos(\d+)/)[1]);
  const nm1 = await nombre(); let l = lug.find(x => x.n === nm1);
  ok(!!l, 'primer lugar: ' + l.n);
  await clic(l.lon, l.lat);
  ok(await hudP() >= 950, 'acertar de lleno da ~1000 puntos: ' + await hudP());
  ok(/Has quedado a/.test(await c.js(`document.querySelector('#de .mensaje').textContent`)), await c.js(`document.querySelector('#de .mensaje').textContent`));
  await c.js(`document.querySelector('.de-canvas').scrollIntoView({block:'center'})`);
  await capturar(c, 'de-resultado');
  // ronda 2: lejos (antípoda aproximada)
  await click('Siguiente lugar'); await esp(150);
  l = lug.find(x => x.n === (null)) || null; const n2 = await nombre(); l = lug.find(x => x.n === n2);
  const p0 = await hudP();
  await clic(((l.lon + 180 + 180) % 360) - 180, -l.lat * 0.9);
  const p1 = await hudP() - p0; ok(p1 < 10, 'muy lejos: ' + p1 + ' puntos');
  // ronda 3: a ~700 km → entre 500 y 700
  await click('Siguiente lugar'); await esp(150);
  const nm3 = await nombre(); l = lug.find(x => x.n === nm3); const p2a = await hudP();
  const km = 700; const dlat = km / 111.19;
  await clic(l.lon, Math.max(-59, Math.min(83, l.lat > 0 ? l.lat - dlat : l.lat + dlat)));
  const p2 = await hudP() - p2a; // el clic cae en un píxel entero (≈40 km por píxel en el mapa): se admite ±1 píxel de holgura
  ok(p2 > 450 && p2 < 700, 'a ~700 km de distancia → ' + p2 + ' puntos (esperado 1000·e^(−700/1500) ≈ 627)');
  // ronda 4: teclado
  await click('Siguiente lugar'); await esp(150);
  await c.js(`document.querySelector('.de-canvas').focus()`);
  const key = (k, extra = '') => c.js(`document.querySelector('.de-canvas').dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(k)},${extra}bubbles:true,cancelable:true}))`);
  await key('Enter'); ok(/Mueve primero/.test(await c.js(`document.querySelector('#de .mensaje').textContent`)), 'Intro sin mover la mira avisa');
  await key('ArrowRight'); await key('ArrowUp', 'shiftKey:true,'); ok(/latitud 30 y longitud 3/.test(await c.js(`document.querySelector('#de .mensaje').textContent`)), 'las flechas mueven la mira: ' + await c.js(`document.querySelector('#de .mensaje').textContent`));
  await key('Enter'); ok(await c.js(`/Has quedado a/.test(document.querySelector('#de .mensaje').textContent)`), 'Intro confirma');
  // rondas 5..8: aciertos exactos
  for (let r = 5; r <= 8; r++) { await click('Siguiente lugar'); await esp(120); const lx = lug.find(x => x.n === (null)) || lug.find(x => true); const q = lug.find(x => x.n === 'x'); const nm = await nombre(); const ll = lug.find(x => x.n === nm); await clic(ll.lon, ll.lat); }
  await click('Ver resultado'); await esp(200);
  const finDe = await c.js(`document.querySelector('#de .final')?.textContent||''`);
  ok(/Fin del viaje/.test(finDe) && /de 8000/.test(finDe) && /Error medio/.test(finDe), 'final: ' + finDe.slice(0, 110));
  ok(/Partidas:\s*1/.test(await c.js(`document.querySelector('#de .sesion').textContent`)), 'sesión registra');
  // los 56 lugares caen en el mapa visible (lat entre -60 y 84)
  ok(lug.every(x => x.lat > -60 && x.lat < 84 && x.lon >= -180 && x.lon <= 180), 'todos los lugares caen dentro del mapa');
  // móvil
  await c.vista(375, 800, 'light', true); await c.ir(base + '/juegos/donde-esta/', 800);
  ok(!(await c.js(`document.documentElement.scrollWidth > innerWidth + 1`)), 'móvil sin desborde de la página'); await capturar(c, 'de-movil');
  ok(await c.js(`document.querySelector('.de-mapa').scrollWidth > document.querySelector('.de-mapa').clientWidth`), 'en móvil el mapa se desplaza dentro de su recuadro');
  const cons = c.consola().filter(x => !/favicon/.test(x)); ok(cons.length === 0, 'sin errores de consola ' + JSON.stringify(cons));
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length ? 1 : 0);

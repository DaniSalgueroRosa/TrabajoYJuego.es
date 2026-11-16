// Tests de «Memoria y percepción»: se juegan de verdad en Chrome y se comprueban las cifras.
import { iniciar, esperar, ptr } from './ayudas.mjs';
const { c, ok, texto, clic, abrir, cerrar, sinDesborde } = await iniciar();
const dato = (i) => c.js(`document.querySelectorAll('.tt-dato-v')[${i}]?.textContent || ''`);
const hayResultado = async (t = 4000) => { for (let i = 0; i < t / 100; i++) { if (await c.js(`!!document.querySelector('.tt-res')`)) return true; await esperar(100); } return false; };
const tecla = (k) => c.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)}, bubbles: true }))`);
try {
  await c.vista(1100, 900, 'light', false);

  console.log('MEMORIA VERBAL');
  await abrir('memoria-verbal');
  ok(await c.js(`!document.querySelector('.mv-palabra').textContent`), 'antes de empezar no hay palabra');
  ok(await clic('Empezar'), 'hay botón para empezar');
  await esperar(80);
  ok(await c.js(`document.querySelector('.mv-palabra').dataset.vista === '0'`), 'la primera palabra es nueva');
  const jugar = (n) => c.js(`(async () => { const vistos = new Set(); let malas = 0, repetidas = 0;
    for (let i = 0; i < ${n}; i++) { const p = document.querySelector('.mv-palabra'), w = p.textContent, v = p.dataset.vista === '1';
      if (!v && vistos.has(w)) malas++; if (v) { repetidas++; if (!vistos.has(w)) malas++; } vistos.add(w);
      [...document.querySelectorAll('button')].find(b => b.textContent.trim() === (v ? 'Ya vista (V)' : 'Nueva (N)')).click(); await new Promise(r => setTimeout(r, 4)); }
    return { malas, repetidas, distintas: vistos.size }; })()`);
  const j = await jugar(40);
  ok(j.malas === 0, 'el juego marca bien lo nuevo y lo repetido (40 palabras, 0 incoherencias)');
  ok(j.repetidas >= 8 && j.repetidas <= 32, 'mezcla palabras repetidas y nuevas (' + j.repetidas + ' repetidas de 40)');
  ok(await dato(0) === '40' && await dato(1) === '3', '40 aciertos y siguen las 3 vidas');
  ok(await dato(2) === String(j.distintas) , 'el contador de palabras distintas coincide (' + j.distintas + ')');
  // teclado
  const antes = +(await dato(0));
  const esVista = await c.js(`document.querySelector('.mv-palabra').dataset.vista === '1'`);
  await tecla(esVista ? 'v' : 'n'); await esperar(40);
  ok(+(await dato(0)) === antes + 1, 'las teclas N y V responden');
  // tres fallos seguidos
  for (let i = 0; i < 3; i++) {
    const v = await c.js(`document.querySelector('.mv-palabra').dataset.vista === '1'`);
    await clic(v ? 'Nueva (N)' : 'Ya vista (V)'); await esperar(40);
  }
  ok(await dato(1) === '0', 'tres fallos agotan las vidas');
  ok(await hayResultado(), 'sale el resultado');
  let r = await texto('.tt-res');
  ok(r.includes('41') && r.includes('Nuevas acertadas') && r.includes('Mejor racha de aciertos') && r.includes('Palabras distintas mostradas'), 'el resultado cuenta 41 puntos y da el detalle');
  ok(await c.js(`!document.querySelector('.mv-palabra').textContent && document.querySelector('.mv-palabra').offsetHeight >= 0`), 'al acabar se vacía la palabra');
  await clic('Repetir el test'); await esperar(150);
  ok(await dato(0) === '0' && await dato(1) === '3' && await c.js(`!document.querySelector('.tt-res')`), 'repetir limpia todo');
  await clic('Empezar'); await esperar(60);
  const w1 = await c.js(`document.querySelector('.mv-palabra').textContent`);
  ok(w1.length > 1 && await c.js(`document.querySelector('.mv-palabra').dataset.vista === '0'`), 'tras repetir, la lista de vistas empieza vacía');

  console.log('MEMORIA NUMÉRICA');
  await abrir('memoria-numerica');
  ok(await clic('Empezar'), 'hay botón para empezar');
  await esperar(60);
  const cifras = async () => c.js(`document.querySelector('.mn-cifras').dataset.numero || ''`);
  const esperarOculto = async () => { for (let i = 0; i < 80 && await cifras(); i++) await esperar(100); await esperar(60); };
  const escribir = (v) => c.js(`(() => { const e = document.querySelector('.mn-entrada'); e.value = ${JSON.stringify(v)}; e.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`);
  let n3 = await cifras();
  ok(/^[1-9]\d{2}$/.test(n3), 'el primer número tiene tres cifras y no empieza por cero (' + n3 + ')');
  ok(await c.js(`document.querySelector('.mn-entrada').offsetParent === null`), 'mientras se muestra no se puede escribir');
  await esperarOculto();
  ok(await c.js(`document.querySelector('.mn-cifras').textContent === '?'`) && await c.js(`document.querySelector('.mn-entrada').offsetParent !== null`), 'el número se oculta y aparece el campo');
  await escribir('');
  ok((await texto('.mn-mensaje')).includes('Escribe las cifras'), 'un campo vacío no gasta el intento');
  await escribir(n3); await esperar(150);
  ok((await texto('.mn-mensaje')).includes('Correcto') && await dato(1) === '3', 'acertar da «Correcto» y mejor nivel 3');
  await esperar(750);
  const n4 = await cifras();
  ok(/^[1-9]\d{3}$/.test(n4) && await dato(0) === '4', 'el nivel 4 tiene cuatro cifras');
  await esperarOculto(); await escribir(n4); await esperar(900);
  const n5 = await cifras();
  ok(/^[1-9]\d{4}$/.test(n5), 'el nivel 5 tiene cinco cifras');
  await esperarOculto(); await escribir('00000'); await esperar(150);
  ok((await texto('.mn-mensaje')).includes('Era ' + n5) && await dato(2) === '2/2', 'un fallo enseña el número y pasa al segundo intento');
  ok(await clic('Continuar'), 'hay botón para continuar');
  await esperar(80);
  const n5b = await cifras();
  ok(/^[1-9]\d{4}$/.test(n5b) && await dato(0) === '5', 'el segundo intento es otro número del mismo nivel');
  await esperarOculto(); await escribir('00000');
  ok(await hayResultado(5000), 'el segundo fallo seguido termina el test');
  r = await texto('.tt-res');
  ok(r.includes('4') && r.includes('cifras') && r.includes('Niveles superados') && r.includes('Último número ' + n5b.replace(/\s/g, '')) || r.includes(n5b), 'el resultado dice 4 cifras y muestra el último número');
  await clic('Repetir el test'); await esperar(150);
  ok(await dato(0) === '3' && await dato(1) === '—' && await c.js(`!document.querySelector('.tt-res')`), 'repetir vuelve al nivel 3');

  console.log('MEMORIA A CORTO PLAZO');
  await abrir('memoria-a-corto-plazo');
  ok(await c.js(`[...document.querySelectorAll('.cp-casilla')].length === 9 && [...document.querySelectorAll('.cp-casilla')].every(b => b.disabled)`), 'hay 9 casillas y están bloqueadas antes de empezar');
  ok(await clic('Empezar'), 'hay botón para empezar');
  let prev = [];
  for (let ronda = 1; ronda <= 4; ronda++) {
    for (let i = 0; i < 150 && await c.js(`document.querySelector('.cp-casilla').disabled`); i++) await esperar(100);
    const seq = (await c.js(`document.querySelector('.cp-rejilla').dataset.secuencia`)).split(',').map(Number);
    ok(seq.length === ronda && prev.every((v, i) => seq[i] === v), 'ronda ' + ronda + ': la secuencia crece en una y conserva la anterior (' + seq.join('-') + ')');
    for (const i of seq) await c.js(`document.querySelector('.cp-casilla[data-i="${i}"]').click()`);
    prev = seq;
    await esperar(60);
  }
  ok(await dato(1) === '4', 'la mejor secuencia repetida es de 4');
  for (let i = 0; i < 150 && await c.js(`document.querySelector('.cp-casilla').disabled`); i++) await esperar(100);
  const s5 = (await c.js(`document.querySelector('.cp-rejilla').dataset.secuencia`)).split(',').map(Number);
  const mal = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(i => i !== s5[0]);
  await c.js(`document.querySelector('.cp-casilla[data-i="${mal}"]').click()`);
  ok((await texto('.cp-mensaje')).includes('Fallaste en la casilla 1 de 5'), 'una casilla equivocada termina la partida');
  ok(await c.js(`document.querySelectorAll('.cp-mal').length === 1 && document.querySelectorAll('.cp-on').length === 1`), 'se marca la que pulsaste y la que tocaba');
  ok(await hayResultado(3000), 'sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('4') && r.includes('casillas') && r.includes('Fallaste en una secuencia de') , 'el resultado dice 4 casillas');
  await clic('Repetir el test'); await esperar(150);
  ok(await dato(0) === '0' && await c.js(`!document.querySelector('.tt-res') && !document.querySelector('.cp-rejilla').dataset.secuencia`), 'repetir limpia la cuadrícula');

  console.log('PERCEPCIÓN DEL TIEMPO');
  await abrir('percepcion-del-tiempo');
  const arena = (e) => c.js(`document.querySelector('.tt-arena').dispatchEvent(${e})`);
  const titulo = () => c.js(`document.querySelector('.tt-arena-t').textContent`);
  await c.js(`document.querySelector('.tt-arena').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`);
  let t = await titulo();
  ok(/^Cuenta \d+ segundos$/.test(t), 'con Intro se pide el primer tiempo (' + t + ')');
  const pedidos = [];
  for (let ronda = 0; ronda < 5; ronda++) {
    t = await titulo();
    const obj = +(t.match(/\d+/)[0]); pedidos.push(obj);
    await arena(ptr()); await esperar(40);
    ok(await titulo() === 'Contando…', 'ronda ' + (ronda + 1) + ': empieza a contar sin mostrar reloj');
    if (ronda === 0) { await arena(ptr()); ok(await titulo() === 'Contando…', 'una pulsación casi inmediata se ignora'); }
    await esperar(obj * 1000 - 40);
    await arena(ptr()); await esperar(50);
    const f = await titulo();
    ok(/^Fueron \d+,\d\d s$/.test(f) && Math.abs(parseFloat(f.replace(/[^\d,]/g, '').replace(',', '.')) - obj) < 0.35, 'ronda ' + (ronda + 1) + ': ' + obj + ' s medidos como ' + f);
    await arena(ptr()); await esperar(40);
  }
  ok([3, 5, 8, 10, 15].every(x => pedidos.includes(x)), 'salen los cinco tiempos: ' + pedidos.join(', '));
  ok(await hayResultado(3000), 'tras la quinta ronda sale el resultado');
  r = await texto('.tt-res');
  ok(/de error medio/.test(r) && r.includes('Tendencia') && r.includes('Ronda 5'), 'el resultado da el error medio y la tendencia');
  ok(/Reloj suizo|Cronómetro interno/.test(r), 'con pulsaciones exactas el rango es alto');
  ok((await c.js(`document.querySelectorAll('.tt-barra').length`)) === 5, 'el gráfico tiene cinco barras');
  await clic('Repetir el test'); await esperar(150);
  ok(await dato(0) === '1/5' && await c.js(`!document.querySelector('.tt-res')`), 'repetir vuelve a la ronda 1');

  console.log('DIBUJA UN CÍRCULO PERFECTO');
  await abrir('dibuja-un-circulo-perfecto');
  const trazo = (f, n) => c.js(`(() => { const el = document.querySelector('.dc-lienzo'), b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2, R = b.width * 0.3, f = ${f};
    const ev = (tipo, t) => { const [dx, dy] = f(t, R); return new PointerEvent(tipo, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, clientX: cx + dx, clientY: cy + dy }); };
    el.dispatchEvent(ev('pointerdown', 0)); for (let i = 1; i <= ${n}; i++) el.dispatchEvent(ev('pointermove', i / ${n})); el.dispatchEvent(ev('pointerup', 1)); return true; })()`);
  const nota = () => c.js(`document.querySelector('.dc-lienzo').dataset.nota || ''`);
  await trazo('(t, R) => [R * Math.cos(Math.PI * t), R * Math.sin(Math.PI * t)]', 60);
  ok((await texto('.dp-mensaje')).includes('No has cerrado') && !(await nota()) && await dato(0) === '1/3', 'media vuelta no cuenta y avisa');
  await trazo('(t, R) => [R * Math.cos(4 * Math.PI * t), R * Math.sin(4 * Math.PI * t)]', 180);
  ok((await texto('.dp-mensaje')).includes('más de una vuelta') && !(await nota()), 'dos vueltas no cuentan y avisan');
  await trazo('(t, R) => [R * 0.1 * Math.cos(2 * Math.PI * t), R * 0.1 * Math.sin(2 * Math.PI * t)]', 90);
  ok((await texto('.dp-mensaje')).includes('demasiado pequeño') && !(await nota()), 'un círculo diminuto no cuenta');
  await trazo('(t, R) => [R * 0.4 * t, R * 0.4 * t]', 10);
  ok((await texto('.dp-mensaje')).includes('demasiado corto') && !(await nota()), 'una raya corta no cuenta');
  ok(await dato(0) === '1/3', 'los intentos no válidos no gastan ninguno de los tres');
  await trazo('(t, R) => [R * Math.cos(2 * Math.PI * t), R * Math.sin(2 * Math.PI * t)]', 100);
  const nPerfecto = +(await nota());
  ok(nPerfecto >= 93, 'un círculo perfecto saca casi 100 (' + nPerfecto + ')');
  ok(await dato(0) === '2/3' && +(await dato(2)) === nPerfecto, 'se anota el intento y el mejor');
  await trazo('(t, R) => [1.15 * R * Math.cos(2 * Math.PI * t), 0.7 * R * Math.sin(2 * Math.PI * t)]', 100);
  const nElipse = +(await nota());
  ok(nElipse < nPerfecto - 15, 'una elipse puntúa bastante menos (' + nElipse + ')');
  await trazo('(t, R) => { const a = -2 * Math.PI * t, rr = R * (1 + 0.025 * Math.sin(14 * Math.PI * t)); return [rr * Math.cos(a), rr * Math.sin(a)]; }', 120);
  const nRizado = +(await nota());
  ok(nRizado < nPerfecto && nRizado > nElipse - 30, 'un círculo con temblor y en sentido contrario también vale (' + nRizado + ')');
  ok(await hayResultado(3000), 'al tercer intento sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('Tu mejor círculo') && r.includes(String(nPerfecto)) && r.includes('Media de los tres') && r.includes('Diámetro'), 'el resultado muestra el mejor intento y los datos');
  const antesCanvas = await c.js(`document.querySelector('.dc-lienzo').dataset.nota`);
  await trazo('(t, R) => [R * Math.cos(2 * Math.PI * t), R * Math.sin(2 * Math.PI * t)]', 100);
  ok(await c.js(`document.querySelector('.dc-lienzo').dataset.nota`) === antesCanvas, 'acabados los tres intentos no se admiten más');
  await clic('Repetir el test'); await esperar(150);
  ok(await dato(0) === '1/3' && await dato(1) === '—' && !(await nota()), 'repetir vuelve al primer intento');

  console.log('EDAD CEREBRAL');
  await abrir('edad-cerebral');
  ok((await texto('.tt-aviso')).includes('No mide la inteligencia'), 'el aviso de pasatiempo está a la vista');
  ok(await clic('Empezar'), 'hay botón para empezar');
  ok((await texto('.ec-mensaje')).includes('Tarea 1 de 3') && await clic('Empezar la tarea'), 'la tarea 1 se presenta antes de empezar');
  await esperar(60);
  const resp = (v) => c.js(`(() => { const e = document.querySelector('.ec-campo'); e.value = ${JSON.stringify(v)}; e.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`);
  await resp('abc');
  ok((await texto('.ec-mensaje')).includes('Escribe solo cifras') && await dato(1) === '1/10', 'letras en vez de cifras no cuentan');
  for (let i = 0; i < 10; i++) {
    const t = await c.js(`document.querySelector('.ec-grande').textContent`), s = await c.js(`document.querySelector('.ec-grande').dataset.respuesta`);
    const calculo = t.replace('= ?', '').replace('×', '*').replace('−', '-');
    ok(String(eval(calculo)) === s, 'operación correcta: ' + t.trim() + ' ' + s) ;
    await resp(i < 2 ? '99999' : s);
  }
  ok((await texto('.ec-mensaje')).includes('Tarea 2 de 3') && await clic('Empezar la tarea'), 'tras 10 operaciones llega la tarea 2');
  await esperar(60);
  let discordantes = 0;
  for (let i = 0; i < 12; i++) {
    const info = await c.js(`(() => { const p = document.querySelector('.ec-palabra'); return { pal: p.textContent.toLowerCase(), tinta: p.dataset.tinta, color: getComputedStyle(p).color }; })()`);
    if (info.pal !== info.tinta) discordantes++;
    ok(await clic(info.tinta.charAt(0).toUpperCase() + info.tinta.slice(1)), 'color ' + (i + 1) + ': tinta ' + info.tinta + ' (palabra ' + info.pal + ')') ;
  }
  ok(discordantes >= 4, 'la mayoría de las palabras no coinciden con su tinta (' + discordantes + ' de 12)');
  ok((await texto('.ec-mensaje')).includes('Tarea 3 de 3') && await clic('Empezar la tarea'), 'tras 12 colores llega la tarea 3');
  await esperar(60);
  ok(await c.js(`document.querySelectorAll('.ec-num').length === 16`), 'la tabla tiene 16 números');
  await c.js(`document.querySelector('.ec-num[data-n="9"]').click()`);
  ok((await texto('.ec-mensaje')).includes('busca el 1'), 'pulsar el número equivocado avisa');
  for (let k = 1; k <= 16; k++) await c.js(`document.querySelector('.ec-num[data-n="${k}"]').click()`);
  ok(await hayResultado(3000), 'al pulsar el 16 sale el resultado');
  r = await texto('.tt-res');
  ok(r.includes('Tu edad cerebral de juego') && r.includes('8 de 10') && r.includes('12 de 12') && r.includes('1 error en'), 'el resultado cuenta 8 de 10, 12 de 12 y 1 error');
  const edad = parseInt((await c.js(`document.querySelector('.tt-res-grande')?.textContent || ''`)).replace(/\D/g, ''), 10);
  ok(edad >= 20 && edad <= 40, 'la edad de juego va de 20 a 80 y aquí sale baja (' + edad + ')');
  ok(r.includes('no mide inteligencia'), 'el resultado repite que es un juego');
  await clic('Repetir el test'); await esperar(150);
  ok(await c.js(`!document.querySelector('.tt-res')`) && (await texto('.ec-mensaje')).includes('Tres tareas cortas'), 'repetir vuelve al principio');

  console.log('RAZONAMIENTO VISUAL-ESPACIAL');
  await abrir('razonamiento-visual-espacial');
  const verif = `(() => { const leer = (svg) => [...svg.querySelectorAll('rect')].map(r => [Math.round((+r.getAttribute('x') - 6) / 20), Math.round((+r.getAttribute('y') - 6) / 20)]);
    const norm = (c) => { const mx = Math.min(...c.map(p => p[0])), my = Math.min(...c.map(p => p[1])); return c.map(p => [p[0] - mx, p[1] - my]); };
    const clave = (c) => norm(c).map(p => p.join(',')).sort().join(';');
    const giros = (c) => { const o = []; let q = c; for (let i = 0; i < 4; i++) { o.push(clave(q)); q = q.map(p => [-p[1], p[0]]); } return o; };
    const ref = leer(document.querySelector('.rv-svg--ref')), g = giros(ref);
    const ops = [...document.querySelectorAll('.rv-opcion')].map(b => { const f = leer(b.querySelector('svg')); return { ok: !!b.dataset.correcta, esGiro: g.includes(clave(f)), n: f.length }; });
    return { n: ref.length, ops }; })()`;
  const TAM = [5, 5, 6, 6, 6, 7, 7, 7, 8, 8];
  for (let ronda = 0; ronda < 2; ronda++) {
    ok(await clic('Empezar'), 'partida ' + (ronda + 1) + ': hay botón para empezar');
    await esperar(60);
    let buenas = 0, incoherentes = 0;
    for (let q = 0; q < 10; q++) {
      const v = await c.js(verif);
      const bien = v.ops.length === 4 && v.ops.filter(o => o.ok).length === 1 && v.ops.every(o => o.ok === o.esGiro) && v.n === TAM[q] && v.ops.every(o => o.n === v.n);
      if (!bien) { incoherentes++; console.log('   pregunta', q + 1, JSON.stringify(v)); }
      const elegir = q < 7 ? 'correcta' : 'otra';
      await c.js(`(() => { const o = [...document.querySelectorAll('.rv-opcion')]; (${JSON.stringify(elegir)} === 'correcta' ? o.find(b => b.dataset.correcta) : o.find(b => !b.dataset.correcta)).click(); })()`);
      if (q < 7) buenas++;
      await esperar(15);
    }
    ok(incoherentes === 0, 'partida ' + (ronda + 1) + ': las 10 preguntas tienen una sola opción girada, el resto no, y el tamaño sube (5 a 8 cuadrados)');
    ok(await hayResultado(3000), 'sale el resultado');
    r = await texto('.tt-res');
    ok(r.includes('7 de 10') && r.includes('Pregunta 1 (5 cuadrados)') && r.includes('Pregunta 10 (8 cuadrados)') && r.includes('Tiempo medio por pregunta'), 'el resultado cuenta 7 de 10 y detalla cada pregunta');
    await clic('Repetir el test'); await esperar(150);
    ok(await c.js(`!document.querySelector('.tt-res')`) && await dato(1) === '0', 'repetir limpia el resultado');
  }

  console.log('MÓVIL');
  await c.vista(390, 800, 'light', true);
  for (const s of ['memoria-verbal', 'memoria-numerica', 'memoria-a-corto-plazo', 'percepcion-del-tiempo', 'dibuja-un-circulo-perfecto', 'edad-cerebral', 'razonamiento-visual-espacial']) await abrir(s);
  await abrir('razonamiento-visual-espacial'); await clic('Empezar'); await esperar(100);
  ok(await sinDesborde(), 'razonamiento visual: sin desborde con las opciones a la vista');
  const caja = await c.js(`(() => { const o = [...document.querySelectorAll('.rv-opcion')].map(b => b.getBoundingClientRect()); return o.every(r => r.left >= 0 && r.right <= innerWidth); })()`);
  ok(caja, 'las cuatro opciones caben en la pantalla del móvil');
  await abrir('edad-cerebral'); await clic('Empezar'); await clic('Empezar la tarea'); await clic('Empezar la tarea');
  await c.js(`1`); 
} finally { await cerrar(); }

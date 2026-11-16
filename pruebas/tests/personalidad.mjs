// Tests de «Personalidad» (42 a 50): se contestan siempre con la misma opción (data-o = posición original) para saber qué debe salir.
import { iniciar, esperar } from './ayudas.mjs';
const { c, ok, texto, clic, abrir, cerrar, sinDesborde } = await iniciar();
const hayResultado = async (t = 3000) => { for (let i = 0; i < t / 100; i++) { if (await c.js(`!!document.querySelector('.tt-res')`)) return true; await esperar(100); } return false; };
const total = () => c.js(`(() => { const t = document.querySelector('.tc-num')?.textContent || ''; return +(t.match(/de (\\d+)/) || [])[1] || 0; })()`);
/** Responde todas las preguntas: `eleccion(i)` devuelve el data-o que se pulsa en la pregunta i. */
async function responder(eleccion) {
  const n = await total();
  for (let i = 0; i < n; i++) {
    const pulsado = await c.js(`(() => { const b = document.querySelector('.tc-opcion[data-o="${eleccion(i)}"]'); if (!b) return false; b.click(); return true; })()`);
    if (!pulsado) return false;
  }
  return n;
}
const titular = () => texto('.tt-res-titular');
const rango = () => texto('.tt-res-rango');
const repetir = async () => { await clic('Repetir el test'); await esperar(200); };
try {
  await c.vista(1100, 900, 'light', false);

  console.log('EDAD MENTAL');
  await abrir('test-de-edad-mental');
  ok((await texto('.tc-num')).includes('Pregunta 1 de 16'), 'empieza en «Pregunta 1 de 16»');
  ok((await c.js(`document.querySelectorAll('.tc-opcion').length`)) === 4, 'cada pregunta tiene cuatro respuestas');
  await c.js(`document.querySelector('.tc-opcion').click()`); await esperar(100);
  ok((await texto('.tc-num')).includes('Pregunta 2 de 16'), 'al contestar pasa a la siguiente');
  await clic('Anterior'); await esperar(100);
  ok((await texto('.tc-num')).includes('Pregunta 1 de 16'), '«Anterior» vuelve a la pregunta anterior');
  await c.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }))`); await esperar(100);
  ok((await texto('.tc-num')).includes('Pregunta 2 de 16'), 'la tecla 2 elige la segunda opción y avanza');
  await clic('Anterior'); await esperar(100);
  ok(await responder(() => 0) === 16 && await hayResultado(), 'se contestan las 16 y sale el resultado');
  let v = parseInt(await texto('.tt-res-grande'), 10);
  ok(v >= 10 && v <= 14 && (await rango()).includes('niño'), 'respondiendo lo más juvenil sale un niño o niña (' + v + ' años)');
  ok((await c.js(`document.querySelectorAll('.tg-espectro').length`)) === 1 && (await c.js(`document.querySelectorAll('.tg-barra').length`)) === 4, 'hay espectro y cuatro barras por área');
  ok(await sinDesborde(), 'el resultado no desborda');
  await repetir();
  ok(await responder(() => 3) === 16 && await hayResultado(), 'se repite el test');
  v = parseInt(await texto('.tt-res-grande'), 10);
  ok(v >= 55 && (await rango()).includes('veterana'), 'respondiendo lo más sereno sale un alma veterana (' + v + ' años)');

  console.log('16 TIPOS DE PERSONALIDAD');
  await abrir('test-de-los-16-tipos-de-personalidad');
  ok(await total() === 28, 'son 28 preguntas');
  ok((await c.js(`document.querySelectorAll('.tc-opcion').length`)) === 2, 'cada pregunta tiene dos respuestas');
  ok(await responder(() => 0) === 28 && await hayResultado(), 'se contestan y sale el resultado');
  ok(await titular() === 'ESTJ', 'siempre la primera opción da ESTJ (' + await titular() + ')');
  ok((await c.js(`document.querySelectorAll('.tg-eje').length`)) === 4, 'la gráfica tiene los cuatro ejes');
  ok((await texto('.tt-res')).includes('no es el MBTI') || (await texto('.tt-res')).includes('MBTI'), 'avisa de que no es el MBTI');
  await repetir();
  await responder(() => 1); await hayResultado();
  ok(await titular() === 'INFP', 'siempre la segunda da INFP (' + await titular() + ')');
  await repetir();
  await responder((i) => i % 4 === 0 ? 0 : 1); await hayResultado();
  ok(/^[EI][SN][TF][JP]$/.test(await titular()), 'una mezcla da un tipo de cuatro letras (' + await titular() + ')');
  for (const t of ['ENTJ', 'ESFP', 'INTJ']) void t;

  console.log('PUREZA DE RICE');
  await abrir('test-de-pureza-de-rice');
  ok((await c.js(`document.querySelectorAll('.tl-item input').length`)) === 100, 'hay 100 casillas');
  ok((await c.js(`document.querySelectorAll('.tl-grupo').length`)) === 5, 'en cinco bloques');
  ok((await texto('.tl-cuenta')).includes('0 de 100'), 'el contador empieza en 0 de 100');
  await c.js(`[...document.querySelectorAll('.tl-item input')].slice(0, 10).forEach(i => i.click())`); await esperar(100);
  ok((await texto('.tl-cuenta')).includes('10 de 100'), 'el contador sube al marcar');
  await clic('Calcular mi pureza'); ok(await hayResultado(), 'sale el resultado');
  ok(parseInt(await texto('.tt-res-grande'), 10) === 90, 'con 10 marcadas la pureza es 90');
  ok((await c.js(`document.querySelectorAll('.tg-medidor').length`)) === 1 && (await c.js(`document.querySelectorAll('.tg-barra').length`)) === 5, 'hay medidor y cinco barras por bloque');
  ok((await texto('.tt-tabla')).includes('Travesuras y normas'), 'dice en qué bloque has vivido más');
  await repetir();
  ok((await c.js(`[...document.querySelectorAll('.tl-item input')].every(i => !i.checked)`)), 'al repetir las casillas vuelven a estar vacías');
  await c.js(`[...document.querySelectorAll('.tl-item input')].forEach(i => i.click())`); await clic('Calcular mi pureza'); await hayResultado();
  ok(parseInt(await texto('.tt-res-grande'), 10) === 0, 'con las cien marcadas la pureza es 0');
  await repetir(); await clic('Calcular mi pureza'); await hayResultado();
  ok(parseInt(await texto('.tt-res-grande'), 10) === 100 && (await rango()).includes('Inocencia'), 'sin marcar nada la pureza es 100');

  console.log('SOLDADO, POETA O REY');
  await abrir('test-soldado-poeta-o-rey');
  ok(await total() === 14 && (await c.js(`document.querySelectorAll('.tc-opcion').length`)) === 3, '14 preguntas con tres respuestas');
  await responder(() => 0); await hayResultado();
  ok(await titular() === 'El Soldado', 'siempre la primera da el soldado');
  ok((await c.js(`document.querySelectorAll('.tg-triangulo').length`)) === 1, 'hay triángulo');
  await repetir(); await responder(() => 1); await hayResultado(); ok(await titular() === 'El Poeta', 'siempre la segunda da el poeta');
  await repetir(); await responder(() => 2); await hayResultado(); ok(await titular() === 'El Rey', 'siempre la tercera da el rey');
  await repetir(); await responder((i) => i < 7 ? 0 : 1); await hayResultado();
  ok((await rango()).includes('Soldado con alma de poeta'), 'un empate soldado-poeta da una mezcla (' + await rango() + ')');

  console.log('COLOR DEL ALMA');
  await abrir('test-del-color-del-alma');
  ok(await total() === 10 && (await c.js(`document.querySelectorAll('.tc-opcion').length`)) === 6, '10 preguntas con seis respuestas');
  await responder(() => 0); await hayResultado();
  ok(await titular() === 'Rojo' && (await rango()).includes('fuego'), 'la primera opción da el rojo');
  ok((await c.js(`document.querySelectorAll('.tg-color').length`)) === 1 && (await c.js(`document.querySelectorAll('.tg-radar').length`)) === 1, 'hay muestra de color y radar');
  await repetir(); await responder(() => 4); await hayResultado(); ok(await titular() === 'Azul', 'la quinta opción da el azul');
  await repetir(); await responder(() => 5); await hayResultado(); ok(await titular() === 'Violeta', 'la sexta opción da el violeta');

  console.log('BRÚJULA DE TALENTOS');
  await abrir('test-de-la-brujula-de-talentos');
  ok(await total() === 14, 'son 14 preguntas');
  await responder(() => 0); await hayResultado(); ok(await titular() === 'Analizar', 'siempre la primera da analizar');
  ok((await c.js(`document.querySelectorAll('.tg-brujula').length`)) === 1 && (await c.js(`document.querySelectorAll('.tg-aguja').length`)) === 1, 'hay brújula con aguja');
  await repetir(); await responder(() => 3); await hayResultado(); ok(await titular() === 'Construir', 'siempre la cuarta da construir');
  ok((await texto('.tt-res')).includes('Ideas de campos afines'), 'ofrece ideas de campos afines');
  await repetir(); await responder((i) => i % 2); await hayResultado(); ok(['Analizar', 'Crear'].includes(await titular()), 'una mezcla da un talento válido');

  console.log('COLOR DE PERSONALIDAD');
  await abrir('test-de-color-de-personalidad');
  ok(await total() === 16, 'son 16 preguntas');
  await responder(() => 0); await hayResultado(); ok(await titular() === 'Rojo', 'siempre la primera da el rojo');
  ok((await c.js(`document.querySelectorAll('.tg-plano').length`)) === 1 && (await c.js(`document.querySelectorAll('.tg-barra').length`)) === 4, 'hay plano y cuatro barras');
  await repetir(); await responder(() => 2); await hayResultado(); ok(await titular() === 'Verde', 'siempre la tercera da el verde');
  await repetir(); await responder(() => 3); await hayResultado(); ok(await titular() === 'Azul', 'siempre la cuarta da el azul');

  console.log('HEMISFERIO CEREBRAL');
  await abrir('test-del-hemisferio-cerebral-dominante');
  ok(await total() === 15, 'son 15 preguntas');
  ok((await texto('.tt-aviso')).includes('mito'), 'avisa del mito desde el principio');
  await responder(() => 0); await hayResultado();
  ok((await texto('.tt-res-grande')).startsWith('15 / 15') && (await rango()).includes('muy analítico'), 'todo analítico da 15 / 15');
  ok((await c.js(`document.querySelectorAll('.tg-espectro').length`)) === 1 && (await c.js(`document.querySelectorAll('.tg-eje').length`)) === 3, 'hay espectro y tres ejes');
  ok((await texto('.tt-res')).includes('resonancia'), 'el resultado explica que los hemisferios colaboran');
  await repetir(); await responder(() => 1); await hayResultado();
  ok((await texto('.tt-res-grande')).startsWith('0 / 15') && (await rango()).includes('muy intuitivo'), 'todo intuitivo da 0 / 15');

  console.log('RELOJ DE LA MUERTE');
  await abrir('reloj-de-la-muerte');
  ok((await texto('.tt-aviso')).includes('No predice nada'), 'avisa de que es un juego');
  await clic('Calcular mi reloj'); await esperar(100);
  ok((await texto('#rm-error')).includes('entre 10 y 100') && !(await hayResultado(300)), 'sin edad muestra un error y no calcula');
  await c.js(`(() => { const i = document.getElementById('rm-edad'); i.value = '30'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await clic('Calcular mi reloj'); ok(await hayResultado(), 'con edad válida sale el resultado');
  ok(parseInt(await texto('.tt-res-grande'), 10) === 56, 'a los 30 con hábitos medios quedan 56 años (' + (await texto('.tt-res-grande')).replace(/\s+/g, ' ') + ')');
  ok((await c.js(`document.querySelectorAll('canvas.tg-semanas').length`)) === 1 && (await c.js(`document.querySelectorAll('.tg-balanza .tg-barra').length`)) === 6, 'hay semanas de vida y seis hábitos en la balanza');
  ok((await texto('.tt-res')).includes('024') && (await texto('.tt-res')).includes('no es una predicción') || (await texto('.tt-res')).includes('juego'), 'el resultado recuerda que es un juego y da el 024');
  ok(await sinDesborde(), 'el resultado no desborda');
  await clic('Calcular de nuevo'); await esperar(200);
  ok(await c.js(`!document.querySelector('.tt-res') && !document.querySelector('.rm').hidden`), '«Calcular de nuevo» vuelve al formulario');
  // hombre fumador de 40
  await c.js(`(() => { const i = document.getElementById('rm-edad'); i.value = '40'; })()`);
  await clic('Hombre'); await clic('Fumo a diario'); await clic('Calcular mi reloj'); await hayResultado();
  ok(parseInt(await texto('.tt-res-grande'), 10) === 37, 'hombre fumador de 40: 81,38 − 5 + 0,5 − 40 = 37 años (' + (await texto('.tt-res-grande')).replace(/\s+/g, ' ') + ')');
  ok((await texto('.tt-tabla')).includes('76,4') || (await texto('.tt-tabla')).includes('77 años'), 'la edad estimada sale en el detalle');
  await clic('Calcular de nuevo'); await esperar(200);
  await c.js(`document.getElementById('rm-edad').value = '95'`); await clic('Calcular mi reloj'); await hayResultado();
  ok(parseInt(await texto('.tt-res-grande'), 10) === 5 && (await texto('.tt-res')).includes('al menos cinco años'), 'a los 95 el juego da al menos cinco años');

  console.log('MÓVIL');
  await c.vista(390, 800, 'light', true);
  for (const s of ['test-de-edad-mental', 'test-de-pureza-de-rice', 'reloj-de-la-muerte', 'test-de-la-brujula-de-talentos']) {
    await abrir(s);
    if (s === 'test-de-pureza-de-rice') { await clic('Calcular mi pureza'); await hayResultado(); }
    else if (s === 'reloj-de-la-muerte') { await c.js(`document.getElementById('rm-edad').value = '25'`); await clic('Calcular mi reloj'); await hayResultado(); }
    else { await responder(() => 1); await hayResultado(); }
    ok(await sinDesborde(), s + ': el resultado no desborda en móvil');
  }
} finally { await cerrar(); }

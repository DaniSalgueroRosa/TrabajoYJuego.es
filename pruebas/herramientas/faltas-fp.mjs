// Calculadora de faltas de FP (Andalucía): datos reales, límites, estados, horas editables, módulo a mano y móvil.
import { abrirChrome } from '../cdp.mjs';
import { preparar, capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const { fallos, ok, esperar, escribir, elegir, clic, texto, k, kt, hastaQue } = preparar(c);
const URL = base + '/herramientas/calculadora-de-faltas-de-fp/';

try {
  await c.vista(1280, 900, 'light', false);
  await c.ir(URL, 900);
  console.log('CALCULADORA DE FALTAS DE FP');
  const datos = await (await fetch(URL + 'ciclos-andalucia.json')).json();
  const com = await (await fetch(URL + 'comunidad-andalucia.json')).json();
  ok(c.consola().length === 0, 'sin errores en la consola al cargar');
  const nOpc = await c.js(`document.querySelectorAll('#c-ciclo option').length`);
  ok(nOpc === datos.length + 1, `la lista tiene los ${datos.length} ciclos (+ la opción inicial): ${nOpc}`);
  ok(com.porcentaje === 20, 'el porcentaje de los datos es el 20 %');
  ok((await texto('#herr')).includes('Elige tu ciclo y tu curso'), 'antes de elegir ciclo se explica qué hacer');

  // ---- Filtrar y elegir un ciclo real
  const dam = datos.find(x => /multiplataforma/i.test(x.nombre));
  await elegir('#c-grado', 'superior');
  await escribir('#c-buscar', 'multiplataforma');
  const nFiltro = await c.js(`document.querySelectorAll('#c-ciclo option').length - 1`);
  ok(nFiltro >= 1 && nFiltro < 10, `al buscar «multiplataforma» quedan ${nFiltro} ciclos`);
  await elegir('#c-ciclo', dam.id);
  const mods1 = dam.modulos['1'];
  const filas = await c.js(`document.querySelectorAll('.fp-tabla tbody tr').length`);
  ok(filas === mods1.length, `1.º de ${dam.nombre}: ${filas} módulos en la tabla (esperados ${mods1.length})`);
  const horas0 = await c.js(`document.querySelector('#fp-h-0').value`);
  ok(+horas0 === mods1[0][1], `las horas del primer módulo vienen de los datos (${horas0})`);
  ok((await k('limite-0')) === String(Math.floor(mods1[0][1] * 0.2 + 1e-9)), `el máximo del primer módulo es el 20 % redondeado hacia abajo (${await k('limite-0')})`);

  // ---- Estados
  const lim = Math.floor(mods1[0][1] * 0.2 + 1e-9);
  await escribir('#fp-f-0', '3');
  ok((await k('estado-0')) === 'bien', 'con 3 h de falta: dentro del límite');
  await escribir('#fp-f-0', String(lim));
  ok((await k('quedan-0')) === '0' && (await k('estado-0')) === 'cerca', `con ${lim} h (justo el máximo): quedan 0 y se avisa de que está cerca`);
  ok((await k('superados')) === '0', 'justo en el máximo todavía no cuenta como superado');
  await escribir('#fp-f-0', String(lim + 1));
  ok((await k('estado-0')) === 'superado' && (await k('quedan-0')) === '-1', `con ${lim + 1} h: límite superado y «te pasas 1 h»`);
  ok((await texto('#fp-resumen')).includes('Orden de 18 de septiembre de 2025'), 'se muestra el aviso con la norma al superar el límite');
  ok((await k('superados')) === '1', 'el resumen cuenta 1 módulo superado');
  const asist = parseFloat(await k('asist-0'));
  ok(Math.abs(asist - (100 - (lim + 1) / mods1[0][1] * 100)) < 1e-6, `asistencia ${asist.toFixed(2)} % correcta`);
  await escribir('#fp-f-0', '2,5');
  ok((await k('estado-0')) === 'bien' && (await k('quedan-0')) === String(lim - 2.5), 'admite decimales con coma (2,5 h)');
  await escribir('#fp-f-0', 'abc');
  ok((await kt('estado-0')).includes('Revisa'), 'un valor que no es número se señala sin romper la tabla');
  ok((await texto('#fp-resumen')).includes('número válido'), 'y el resumen lo avisa');

  // ---- Foco al teclear
  await escribir('#fp-f-1', '7');
  const foco = await c.js(`document.activeElement.id`);
  ok(foco === 'fp-f-1', 'al escribir no se pierde el foco del campo');
  const val = await c.js(`document.activeElement.value`);
  ok(val === '7', 'ni lo escrito');

  // ---- Corregir horas
  await escribir('#fp-h-1', '100'); await escribir('#fp-f-1', '20');
  ok((await k('limite-1')) === '20' && (await k('estado-1')) === 'cerca', 'si corriges las horas a 100, el máximo pasa a 20 h');
  await clic('Poner las faltas a cero');
  ok((await c.js(`document.querySelector('#fp-f-1').value`)) === '' && (await k('superados')) === '0', '«Poner las faltas a cero» vacía las faltas');

  // ---- Curso 2 y módulo a mano
  await elegir('#c-curso', '2');
  const mods2 = dam.modulos['2'];
  ok((await c.js(`document.querySelectorAll('.fp-tabla tbody tr').length`)) === mods2.length, `2.º curso: ${mods2.length} módulos`);
  await clic('Añadir un módulo a mano');
  const n = await c.js(`document.querySelectorAll('.fp-tabla tbody tr').length`);
  ok(n === mods2.length + 1, 'se añade una fila para un módulo propio');
  const i = n - 1;
  await escribir('#fp-n-' + i, 'Mi módulo'); await escribir('#fp-h-' + i, '96'); await escribir('#fp-f-' + i, '14');
  ok((await k('limite-' + i)) === '19' && (await k('quedan-' + i)) === '5', 'módulo propio de 96 h con 14 faltas: máximo 19, quedan 5');
  const trim = await texto(`tr:nth-child(${i + 1}) .fp-trim`);
  ok(/6,3/.test(trim), `se indica el reparto por trimestre (${trim.trim()})`);
  await c.js(`[...document.querySelectorAll('.fp-tabla button')].find(b => /Quitar Mi módulo/.test(b.getAttribute('aria-label')) || /Quitar/.test(b.textContent)).click()`);

  // ---- Ejemplo
  await clic('Probar con un ejemplo');
  ok((await k('limite-0')) === '19' && (await k('estado-0')) === 'bien', 'el ejemplo (96 h, 14 faltas) calcula 19 h de máximo y está dentro');

  // ---- Fuentes y ayudas de accesibilidad
  const enlaces = await c.js(`[...document.querySelectorAll('#fp-aviso a')].map(a => a.href + '|' + a.rel)`);
  ok(enlaces.length === com.fuentes.length + com.horas.enlaces.length && enlaces.every(e => e.includes('noopener')), `se citan las ${enlaces.length} fuentes con rel=noopener`);
  ok((await c.js(`[...document.querySelectorAll('.fp-tabla input')].every(e => e.getAttribute('aria-label'))`)), 'todos los campos de la tabla tienen nombre accesible');
  const alm = await c.js(`localStorage.length + sessionStorage.length + document.cookie.length`);
  ok(alm === 0, 'no guarda nada en el navegador');
  await capturar(c, 'faltas-fp-escritorio');

  // ---- Móvil
  await c.vista(390, 800, 'light', true);
  await c.ir(URL, 800);
  await elegir('#c-ciclo', dam.id);
  const desborde = await c.js('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  ok(desborde <= 0, 'en móvil no hay desplazamiento horizontal' + (desborde > 0 ? ` (sobran ${desborde}px)` : ''));
  const celdas = await c.js(`getComputedStyle(document.querySelector('.fp-tabla tbody tr')).display`);
  ok(celdas === 'block', 'en móvil cada módulo se muestra como una ficha');
  await escribir('#fp-f-0', '4');
  ok((await k('estado-0')) === 'bien', 'en móvil también calcula');
  await capturar(c, 'faltas-fp-movil');
  ok(c.consola().length === 0, 'sin errores en la consola' );
} catch (e) { console.log('  ✗ EXCEPCIÓN: ' + e.message); fallos.push(e.message); }
finally { await c.cerrar(); }
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);

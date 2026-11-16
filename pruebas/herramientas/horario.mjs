// Generador de tablas de horarios: actividades en varios días, solapes, avisos, imagen PNG (se abre con PIL), texto copiado y opciones.
import { abrirChrome } from '../cdp.mjs';
import { preparar, capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, clic, texto, escribir, elegir, marcar, k, ext } = A;
const ir = async (s) => { await c.ir(base + '/herramientas/' + s + '/', 600); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
const n = (sel) => c.js(`document.querySelectorAll(${JSON.stringify(sel)}).length`);

try {
  await c.vista(1200, 900, 'light', false);
  console.log('GENERADOR DE TABLAS DE HORARIOS');
  await ir('generador-de-tablas-de-horarios');
  ok((await texto('.hor-salida')).includes('Añade una actividad'), 'sin actividades, invita a añadir una o a probar el ejemplo');
  ok(await c.js(`document.querySelector('#h-png').disabled && document.querySelector('#h-copiar').disabled`), 'los botones de descargar y copiar están desactivados');
  ok((await n('.hor-fila')) === 1, 'empieza con una fila vacía');
  ok((await n('#herr-carga')) === 0, 'desaparece el mensaje «Cargando la herramienta…»');

  await clic('Probar con un ejemplo'); await esperar(200);
  ok((await n('.hor-fila')) === 7 && (await c.js(`document.querySelector('#h-titulo').value`)) === 'Horario de clases', 'el ejemplo carga 7 actividades y el título');
  ok((await k('actividades')) === '19' && (await k('horas')) === '18' && (await k('solapes')) === '0', `19 actividades, 18 horas y ningún solape (${await k('actividades')}/${await k('horas')}/${await k('solapes')})`);
  ok((await n('.hor-col')) === 5 && (await n('.hor-bloque')) === 19, 'cinco columnas (lunes a viernes) y 19 bloques');
  const lunes = await c.js(`[...document.querySelectorAll('.hor-col[data-dia="Lunes"] .hor-bloque-nombre')].map(e => e.textContent)`);
  ok(JSON.stringify(lunes) === JSON.stringify(['Matemáticas', 'Inglés', 'Recreo', 'Música']), 'el lunes tiene Matemáticas, Inglés, Recreo y Música: ' + lunes.join(', '));
  const geo = await c.js(`(() => { const b = document.querySelector('.hor-col[data-dia="Lunes"] .hor-bloque'); return { top: b.style.top, alto: b.style.height, izq: b.style.left, ancho: b.style.width, fondo: b.style.background }; })()`);
  ok(parseFloat(geo.top) === 0 && parseFloat(geo.alto) === 25 && parseFloat(geo.ancho) === 100, `Matemáticas empieza arriba y ocupa el 25 % de las 4 horas (${JSON.stringify(geo)})`);
  const horas = await c.js(`[...document.querySelectorAll('.hor-hora')].map(e => e.textContent)`);
  ok(JSON.stringify(horas) === JSON.stringify(['09:00', '10:00', '11:00', '12:00']), 'las etiquetas de hora van de 09:00 a 12:00: ' + horas.join(' '));
  ok(await c.js(`!document.querySelector('#h-png').disabled`), 'con actividades se activan los botones');
  sinErrores('ejemplo');
  await capturar(c, 'horario-ejemplo');

  // ---- un solape el lunes
  await clic('Añadir actividad'); await esperar(100);
  await escribir('#h-act-8', 'Tutoría'); await elegir('#h-ini-8', '09:00'); await elegir('#h-fin-8', '10:00'); await marcar('#h-d-8-0', true);
  ok((await k('solapes')) === '2', 'la tutoría coincide con dos clases del lunes: 2 solapes (' + (await k('solapes')) + ')');
  const av = await texto('.hor-salida');
  ok(av.includes('El lunes se solapan «Matemáticas» (08:30–09:30) y «Tutoría» (09:00–10:00).'), 'el aviso nombra las actividades y las horas');
  const tut = await c.js(`(() => { const b = [...document.querySelectorAll('.hor-col[data-dia="Lunes"] .hor-bloque')].find(e => e.textContent.includes('Tutoría')); return { izq: b.style.left, ancho: b.style.width }; })()`);
  ok(parseFloat(tut.izq) === 50 && parseFloat(tut.ancho) === 50, 'la tutoría se dibuja en el carril derecho, con la mitad del ancho (' + JSON.stringify(tut) + ')');

  // ---- fin antes del inicio, y quitar la fila
  await elegir('#h-fin-8', '08:00');
  ok((await texto('.hor-salida')).includes('termina a las 08:00, antes o a la misma hora en que empieza (09:00)') && (await k('solapes')) === '0', 'una actividad que acaba antes de empezar se explica y no se dibuja');
  await clic('Quitar la actividad 8'); await esperar(100);
  ok((await n('.hor-fila')) === 7 && !(await texto('.hor-salida')).includes('termina a las'), 'quitar la fila elimina también el aviso');

  // ---- días: «Lunes a viernes», fin de semana y rejilla
  await clic('Añadir actividad'); await esperar(100);
  await escribir('#h-act-9', 'Estudio'); await escribir('#h-lug-9', 'Biblioteca'); await elegir('#h-ini-9', '16:00'); await elegir('#h-fin-9', '17:30');
  ok((await n('.hor-bloque')) === 19, 'sin ningún día marcado la actividad no se dibuja');
  ok((await texto('.hor-salida')).includes('no tiene ningún día marcado'), 'y se avisa de que falta marcar un día');
  await c.js(`[...document.querySelectorAll('#h-filas .hor-fila')][7].querySelector('.hor-dias button').click()`); await esperar(150);
  ok((await n('.hor-bloque')) === 24, '«Lunes a viernes» añade cinco bloques (' + (await n('.hor-bloque')) + ')');
  ok((await c.js(`document.querySelector('.hor-hora:last-of-type').textContent`)) === '17:00', 'la tabla se alarga hasta las 17:30 (última etiqueta en punto: 17:00)');
  await marcar('#h-d-9-5', true);
  ok((await n('.hor-col')) === 6 && (await texto('.hor-col[data-dia="Sábado"]')).includes('Estudio'), 'marcar el sábado añade esa columna con la actividad');
  await marcar('#h-d-9-5', false); await marcar('#h-finde', true);
  ok((await n('.hor-col')) === 7, 'la opción de mostrar el fin de semana añade sábado y domingo vacíos');
  ok((await c.js(`document.querySelector('.hor-col[data-dia="Domingo"] .solo-lectores').textContent`)) === 'Sin actividades', 'las columnas vacías lo indican a los lectores de pantalla');
  await elegir('#h-gran', '15');
  ok((await c.js(`document.querySelector('.hor-rejilla').style.getPropertyValue('--franja')`)).trim() === '0.25', 'la rejilla de 15 minutos cambia las líneas');

  // ---- imagen PNG
  await c.js(`(() => { window.__d = null; TH.descargar = (datos, nombre) => { window.__d = { nombre, blob: datos }; }; window.__t = null; TH.copiar = (t) => { window.__t = t; }; })()`);
  await marcar('#h-finde', false); await elegir('#h-gran', '30');
  await clic('Descargar imagen (PNG)');
  ok(await A.hastaQue(() => c.js(`!!window.__d`), 8000), 'genera la imagen');
  const png = await c.js(`(async () => { const u = new Uint8Array(await window.__d.blob.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return { nombre: window.__d.nombre, tipo: window.__d.blob.type, b64: btoa(s) }; })()`);
  ok(png.nombre === 'horario-de-clases.png' && png.tipo === 'image/png', 'se llama horario-de-clases.png: ' + png.nombre);
  const info = JSON.parse(ext.python(`import sys, json
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
x0 = 18 + 72
print(json.dumps({'tam': im.size, 'esquina': im.getpixel((5, 5)), 'cab': im.getpixel(((x0 + 20) * 2, (64 + 5) * 2)), 'mates': im.getpixel(((x0 + 2 + 170) * 2, (64 + 38 + 1 + 40) * 2)), 'martes_vacio': im.getpixel(((x0 + 190 + 100) * 2, (64 + 38 + 1 + 20) * 2))}))`, ext.guardar(Buffer.from(png.b64, 'base64'), '.png')));
  const alto = (64 + 38 + 9 * 64 + 18) * 2,   // de 08:30 a 17:30: 9 horas de rejilla
     ancho = (36 + 72 + 5 * 190) * 2;
  const es = (p, r, g, b) => p[0] === r && p[1] === g && p[2] === b;
  ok(info.tam[0] === ancho && info.tam[1] === alto, `la imagen mide ${ancho}×${alto} (${info.tam.join('×')})`);
  ok(es(info.esquina, 255, 255, 255), 'el fondo es blanco');
  ok(es(info.cab, 0x1D, 0x3A, 0x34), 'la cabecera de los días es verde pizarra: ' + info.cab);
  ok(es(info.mates, 0xCF, 0xE3, 0xFA), 'el bloque de Matemáticas tiene su color azul: ' + info.mates);
  await clic('Copiar como texto'); await esperar(150);
  const t = await c.js(`window.__t`);
  ok(t && t.startsWith('Horario de clases\n\nLunes\n  08:30–09:30  Matemáticas (Aula 12)\n') && t.includes('Viernes\n') && t.includes('Estudio (Biblioteca)'), 'copia el horario como texto');
  sinErrores('opciones e imagen');

  // ---- vaciar y volver al aviso
  await clic('Vaciar todo'); await esperar(100);
  ok((await n('.hor-fila')) === 1 && (await texto('.hor-salida')).includes('Añade una actividad'), '«Vaciar todo» deja una fila vacía y el aviso inicial');

  // ---- móvil: la tabla se desplaza y la hoja no
  await c.vista(390, 800, 'light', false);
  await ir('generador-de-tablas-de-horarios'); await clic('Probar con un ejemplo'); await esperar(200);
  const m = await c.js(`({ doc: document.documentElement.scrollWidth, vp: innerWidth, caja: document.querySelector('.hor-scroll').scrollWidth > document.querySelector('.hor-scroll').clientWidth })`);
  ok(m.doc <= m.vp + 1 && m.caja, `en móvil la página no se desborda y la tabla se desplaza (${m.doc}/${m.vp})`);
  await capturar(c, 'horario-movil');
  sinErrores('móvil');
} catch (e) { console.log('  ✗ EXCEPCIÓN: ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 4).join('\n')); fallos.push(e.message); }
finally { ext.limpiar(); await c.cerrar(); }
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);

// Herramientas de imágenes que trabajan con archivos (convertir, comprimir, redimensionar, favicons): se comprueban con imágenes reales y se verifican con Pillow.
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, escribir, elegir, clic, texto, subir, entregas, esperarEntregas, reiniciarEntregas, estadoTexto, ext } = A;
const ir = async (s) => { await c.ir(`${base}/herramientas/${s}/`, 600); await reiniciarEntregas(); };
const procesar = async (boton) => { await reiniciarEntregas(); await clic(boton); return esperarEntregas(25000); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));

/* Abre un archivo con Pillow y devuelve { formato, modo, ancho, alto, px: { 'x,y': [r,g,b,a] }, tamanos } */
const pil = (buf, extension, puntos = []) => JSON.parse(ext.python(`import sys, json
from PIL import Image
im = Image.open(sys.argv[1]); im.load()
r = im.convert('RGBA'); pts = json.loads(sys.argv[2])
print(json.dumps({'formato': im.format, 'modo': im.mode, 'ancho': im.width, 'alto': im.height, 'px': {k: list(r.getpixel(tuple(k))) if False else list(r.getpixel((int(k.split(',')[0]), int(k.split(',')[1])))) for k in pts}, 'tamanos': sorted(list(im.info.get('sizes', [])))}))`, ext.guardar(buf, extension), JSON.stringify(puntos)));
const cerca = (a, b, t = 10) => a.length >= 3 && b.every((v, i) => Math.abs(a[i] - v) <= t);
const ROJO = [192, 57, 43], AZUL = [41, 128, 185];

try {
  await c.vista(1100, 900, 'light', false);

  // ============================================================ CONVERTIDOR
  console.log('CONVERTIDOR UNIVERSAL');
  await ir('convertidor-universal-de-imagenes');
  ok(await c.js(`document.querySelector('#f-ejecutar').disabled`), 'sin archivos, el botón está desactivado');
  await subir('#f-archivos', [{ t: 'imagen', nombre: 'foto.png', w: 400, h: 200 }]);
  ok((await texto('#f-info')).includes('400 × 200'), 'al elegir la imagen indica su tamaño: «' + (await texto('#f-info')) + '»');
  ok(await c.js(`document.querySelector('#c-calidad').closest('.campo').hidden`), 'la calidad está oculta con PNG');
  await elegir('#c-formato', 'jpg');
  ok(!(await c.js(`document.querySelector('#c-calidad').closest('.campo').hidden`)) && !(await c.js(`document.querySelector('#c-fondo').closest('.campo').hidden`)), 'con JPG aparecen calidad y fondo');
  ok(await procesar('Convertir'), 'convierte a JPG');
  let [e] = await entregas();
  let r = pil(e.buf, '.jpg', ['100,100', '300,50', '300,150']);
  ok(e.nombre === 'foto.jpg' && r.formato === 'JPEG' && r.ancho === 400 && r.alto === 200, `foto.jpg es un JPEG de 400×200 (${e.nombre}, ${r.formato}, ${r.ancho}×${r.alto})`);
  ok(cerca(r.px['100,100'], ROJO) && cerca(r.px['300,50'], AZUL), 'los colores se conservan (rojo y azul)');
  ok(cerca(r.px['300,150'], [255, 255, 255], 6), 'la zona transparente queda en blanco: ' + r.px['300,150']);
  await elegir('#c-fondo', '#000000');
  await procesar('Convertir'); [e] = await entregas(); r = pil(e.buf, '.jpg', ['300,150']);
  ok(cerca(r.px['300,150'], [0, 0, 0], 6), 'con fondo negro la zona transparente queda negra');
  ok((await estadoTexto()).includes('fondo negro'), 'el aviso cita el fondo usado: «' + (await estadoTexto()).slice(0, 110) + '»');
  await elegir('#c-formato', 'webp');
  await procesar('Convertir'); [e] = await entregas(); r = pil(e.buf, '.webp', ['100,100', '300,150']);
  ok(e.nombre === 'foto.webp' && r.formato === 'WEBP' && cerca(r.px['100,100'], ROJO, 6), 'convierte a WebP');
  ok(r.px['300,150'][3] === 0, 'WebP conserva la transparencia');
  await elegir('#c-formato', 'bmp');
  await procesar('Convertir'); [e] = await entregas(); r = pil(e.buf, '.bmp', ['100,100', '300,50']);
  ok(e.nombre === 'foto.bmp' && r.formato === 'BMP' && r.ancho === 400 && r.alto === 200 && cerca(r.px['100,100'], ROJO, 2) && cerca(r.px['300,50'], AZUL, 2), 'convierte a BMP (cabecera y colores correctos)');
  await elegir('#c-formato', 'png');
  await procesar('Convertir'); [e] = await entregas(); r = pil(e.buf, '.png', ['300,150']);
  ok(e.nombre === 'foto-convertida.png' && r.formato === 'PNG' && r.px['300,150'][3] === 0, 'PNG a PNG no pisa el nombre y conserva la transparencia (' + e.nombre + ')');
  sinErrores('convertidor');

  // varios archivos, nombres repetidos y un archivo roto
  await ir('convertidor-universal-de-imagenes');
  await subir('#f-archivos', [{ t: 'imagen', nombre: 'foto.png', w: 80, h: 40 }, { t: 'imagen', nombre: 'foto.webp', w: 60, h: 30, mime: 'image/webp' }, { t: 'b64', nombre: 'rota.png', mime: 'image/png', b64: Buffer.from('esto no es una imagen').toString('base64') }]);
  ok((await texto('#f-info')).includes('3 imágenes'), 'con varias, la información lo dice: «' + (await texto('#f-info')) + '»');
  await elegir('#c-formato', 'jpg');
  ok(await procesar('Convertir'), 'convierte varias');
  const es = await entregas();
  ok(es.length === 2 && es[0].nombre === 'foto.jpg' && es[1].nombre === 'foto-2.jpg', 'los nombres repetidos se numeran: ' + es.map(x => x.nombre));
  ok(await c.js(`[...document.querySelectorAll('button')].some(b => b.textContent.includes('ZIP'))`), 'aparece «Descargar todo en un ZIP»');
  const est = await estadoTexto();
  ok(est.includes('No se han podido procesar') && est.includes('rota.png'), 'el archivo roto se explica sin detener a los demás: «' + est.slice(0, 160) + '»');
  await ir('convertidor-universal-de-imagenes');
  await subir('#f-archivos', [{ t: 'b64', nombre: 'solo-rota.png', mime: 'image/png', b64: Buffer.from('nada').toString('base64') }]);
  await clic('Convertir'); await esperar(900);
  ok((await estadoTexto()).includes('no se puede leer como imagen'), 'si todas fallan, se muestra el error: «' + (await estadoTexto()).slice(0, 100) + '»');
  // la calidad influye en el peso
  await ir('convertidor-universal-de-imagenes');
  await subir('#f-archivos', [{ t: 'imagen', nombre: 'ruido.png', w: 500, h: 400, ruido: true }]);
  await elegir('#c-formato', 'jpg'); await escribir('#c-calidad', '10'); await procesar('Convertir'); const bajo = (await entregas())[0].buf.length;
  await escribir('#c-calidad', '95'); await procesar('Convertir'); const alto = (await entregas())[0].buf.length;
  ok(bajo < alto / 2, `calidad 10 pesa mucho menos que 95 (${bajo} < ${alto})`);

  // ============================================================ COMPRESOR
  console.log('COMPRESOR');
  await ir('compresor-de-imagenes');
  await subir('#f-archivos', [{ t: 'imagen', nombre: 'camara.jpg', w: 900, h: 700, mime: 'image/jpeg', ruido: true }]);
  await escribir('#c-calidad', '40');
  ok(await procesar('Comprimir'), 'comprime un JPG');
  [e] = await entregas(); r = pil(e.buf, '.jpg');
  ok(e.nombre === 'camara-comprimida.jpg' && r.formato === 'JPEG' && r.ancho === 900 && r.alto === 700, `sale camara-comprimida.jpg, JPEG de 900×700 (${e.nombre})`);
  ok(/% menos/.test(await estadoTexto()), 'dice cuánto se ha reducido: «' + (await estadoTexto()).slice(0, 80) + '»');
  // ya optimizada: con calidad 99 el resultado pesaría más → se conserva el original
  await escribir('#c-calidad', '99'); await procesar('Comprimir'); [e] = await entregas();
  const nota = await c.js(`TH.entregas[0].nota`);
  ok(/ya estaba muy optimizada/.test(nota), 'si no mejora, se conserva el original: «' + nota + '»');
  // PNG → WebP y ancho máximo
  await ir('compresor-de-imagenes');
  await subir('#f-archivos', [{ t: 'imagen', nombre: 'captura.png', w: 800, h: 600 }]);
  await elegir('#c-formato', 'webp'); await escribir('#c-maxancho', '200');
  ok(await procesar('Comprimir'), 'PNG a WebP con ancho máximo');
  [e] = await entregas(); r = pil(e.buf, '.webp', ['50,50']);
  ok(e.nombre === 'captura-comprimida.webp' && r.formato === 'WEBP' && r.ancho === 200 && r.alto === 150, `sale WebP de 200×150 (${e.nombre}, ${r.ancho}×${r.alto})`);
  ok(cerca(r.px['50,50'], ROJO, 6), 'el contenido se conserva');
  await elegir('#c-formato', 'jpg'); await escribir('#c-maxancho', '');
  await procesar('Comprimir'); [e] = await entregas(); r = pil(e.buf, '.jpg', ['600,500']);
  ok(r.formato === 'JPEG' && r.ancho === 800 && cerca(r.px['600,500'], [255, 255, 255], 6), 'PNG a JPG con fondo blanco donde era transparente');
  sinErrores('compresor');

  // ============================================================ REDIMENSIONADOR
  console.log('REDIMENSIONADOR');
  await ir('redimensionador-de-imagenes');
  await subir('#f-archivos', [{ t: 'imagen', nombre: 'foto.png', w: 400, h: 200 }]);
  const probar = async (modo, campos, nombreEsperado, w, h) => {
    await elegir('#c-modo', modo);
    for (const [k, v] of Object.entries(campos)) await escribir('#c-' + k, v);
    const listo = await procesar('Cambiar el tamaño');
    const [x] = listo ? await entregas() : [{}];
    const q = listo ? pil(x.buf, '.png', ['10,10']) : {};
    ok(listo && x.nombre === nombreEsperado && q.ancho === w && q.alto === h, `${modo}: ${nombreEsperado} de ${w}×${h} (${x.nombre}, ${q.ancho}×${q.alto})`);
    return q;
  };
  let q = await probar('ancho', { ancho: '100' }, 'foto-100x50.png', 100, 50);
  ok(cerca(q.px['10,10'], ROJO, 6), 'el color se conserva al reducir');
  await probar('alto', { alto: '40' }, 'foto-80x40.png', 80, 40);
  await probar('porcentaje', { porcentaje: '50' }, 'foto-200x100.png', 200, 100);
  await probar('caber', { ancho: '150', alto: '150' }, 'foto-150x75.png', 150, 75);
  await probar('exacto', { ancho: '100', alto: '100' }, 'foto-100x100.png', 100, 100);
  await probar('porcentaje', { porcentaje: '12,5' }, 'foto-50x25.png', 50, 25);
  await probar('ancho', { ancho: '800' }, 'foto-800x400.png', 800, 400);
  ok((await estadoTexto()).includes('ampliado'), 'al ampliar avisa de la pérdida de nitidez: «' + (await estadoTexto()).slice(0, 90) + '»');
  await elegir('#c-modo', 'ancho'); await escribir('#c-ancho', '');
  await clic('Cambiar el tamaño'); await esperar(500);
  ok((await estadoTexto()).includes('Escribe el ancho'), 'sin ancho se pide: «' + (await estadoTexto()).slice(0, 80) + '»');
  await escribir('#c-ancho', '30000'); await clic('Cambiar el tamaño'); await esperar(800);
  ok((await estadoTexto()).includes('más de lo que un navegador'), 'un tamaño exagerado se explica: «' + (await estadoTexto()).slice(0, 100) + '»');
  await escribir('#c-ancho', '100'); await elegir('#c-formato', 'jpg');
  await procesar('Cambiar el tamaño'); [e] = await entregas();
  ok(e.nombre === 'foto-100x50.jpg' && pil(e.buf, '.jpg').formato === 'JPEG', 'puede cambiar de formato a la vez');
  sinErrores('redimensionador');

  // ============================================================ FAVICONS
  console.log('FAVICONS');
  await ir('generador-de-favicons');
  await subir('#f-archivos', [{ t: 'imagen', nombre: 'logo.png', w: 400, h: 200 }]);
  ok((await texto('#f-info')).includes('No es cuadrada') && (await texto('#f-info')).includes('512'), 'avisa de que no es cuadrada y de que es pequeña: «' + (await texto('#f-info')) + '»');
  ok(await procesar('Crear los iconos'), 'crea los iconos');
  let fs = await entregas(); const por = Object.fromEntries(fs.map(f => [f.nombre, f.buf]));
  ok(JSON.stringify(fs.map(f => f.nombre)) === JSON.stringify(['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png']), 'salen los 6 archivos esperados: ' + fs.map(f => f.nombre));
  const ico = pil(por['favicon.ico'], '.ico');
  ok(JSON.stringify(ico.tamanos) === JSON.stringify([[16, 16], [32, 32], [48, 48]]), 'el .ico contiene 16, 32 y 48 px: ' + JSON.stringify(ico.tamanos));
  for (const [n, t] of [['favicon-16x16.png', 16], ['favicon-32x32.png', 32], ['apple-touch-icon.png', 180], ['android-chrome-192x192.png', 192], ['android-chrome-512x512.png', 512]]) {
    const p = pil(por[n], '.png'); ok(p.formato === 'PNG' && p.ancho === t && p.alto === t, `${n} es PNG de ${t}×${t}`);
  }
  let g = pil(por['android-chrome-512x512.png'], '.png', ['256,20', '100,256', '400,200']);
  ok(g.px['256,20'][3] === 0, 'al mostrar la imagen entera quedan bordes transparentes arriba');
  ok(cerca(g.px['100,256'], ROJO, 6) && cerca(g.px['400,200'], AZUL, 6), 'el contenido se ha centrado y escalado (rojo a la izquierda, azul arriba a la derecha)');
  g = pil(por['apple-touch-icon.png'], '.png', ['90,5']);
  ok(g.px['90,5'][3] === 255 && cerca(g.px['90,5'], [255, 255, 255], 4), 'el icono de Apple no tiene transparencia (fondo blanco): ' + g.px['90,5']);
  ok((await texto('#favicon-html')).includes('apple-touch-icon') && (await texto('#favicon-html')).includes('rel="icon"'), 'muestra el código HTML para pegar');
  await elegir('#c-ajuste', 'cubrir');
  await procesar('Crear los iconos'); fs = await entregas(); const p2 = Object.fromEntries(fs.map(f => [f.nombre, f.buf]));
  g = pil(p2['android-chrome-512x512.png'], '.png', ['256,20', '100,256', '400,100', '400,400']);
  ok(g.px['256,20'][3] === 255 && cerca(g.px['100,256'], ROJO, 6) && cerca(g.px['400,100'], AZUL, 6) && g.px['400,400'][3] === 0, 'al recortar al centro llena el cuadrado');
  await elegir('#c-fondo', '#000000');
  await procesar('Crear los iconos'); fs = await entregas(); const p3 = Object.fromEntries(fs.map(f => [f.nombre, f.buf]));
  g = pil(p3['favicon-32x32.png'], '.png', ['26,26']);
  ok(cerca(g.px['26,26'], [0, 0, 0], 4) && g.px['26,26'][3] === 255, 'con fondo negro, lo transparente queda negro');
  sinErrores('favicons');

  await A.capturar?.(c, 'imagenes-archivos');
} catch (e) {
  fallos.push('Excepción: ' + (e && e.stack || e));
  console.log('  ✗ ' + (e && e.stack || e));
}
ext.limpiar();
await c.cerrar();
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);

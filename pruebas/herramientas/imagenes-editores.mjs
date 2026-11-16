// Recortador y rotador de imágenes: interacción real (ratón, teclado, campos) y comprobación de los archivos resultantes con Pillow.
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, escribir, elegir, clic, texto, valor, subir, entregas, esperarEntregas, reiniciarEntregas, estadoTexto, ext } = A;
const ir = async (s) => { await c.ir(`${base}/herramientas/${s}/`, 600); await reiniciarEntregas(); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
const pil = (buf, extension, puntos = []) => JSON.parse(ext.python(`import sys, json
from PIL import Image
im = Image.open(sys.argv[1]); im.load(); r = im.convert('RGBA'); pts = json.loads(sys.argv[2])
print(json.dumps({'formato': im.format, 'ancho': im.width, 'alto': im.height, 'px': {k: list(r.getpixel((int(k.split(',')[0]), int(k.split(',')[1])))) for k in pts}}))`, ext.guardar(buf, extension), JSON.stringify(puntos)));
const cerca = (a, b, t = 10) => a.length >= 3 && b.every((v, i) => Math.abs(a[i] - v) <= t);
const ROJO = [192, 57, 43], AZUL = [41, 128, 185];
const descargar = async (boton) => { await reiniciarEntregas(); await clic(boton); return esperarEntregas(15000) ? (await entregas())[0] : null; };
const centro = (sel) => c.js(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; })()`);
const arrastrar = async (de, a) => {
  await c.enviar('Input.dispatchMouseEvent', { type: 'mouseMoved', x: de.x, y: de.y });
  await c.enviar('Input.dispatchMouseEvent', { type: 'mousePressed', x: de.x, y: de.y, button: 'left', buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 5; i++) await c.enviar('Input.dispatchMouseEvent', { type: 'mouseMoved', x: de.x + (a.x - de.x) * i / 5, y: de.y + (a.y - de.y) * i / 5, button: 'left', buttons: 1 });
  await c.enviar('Input.dispatchMouseEvent', { type: 'mouseReleased', x: a.x, y: a.y, button: 'left', buttons: 0, clickCount: 1 });
  await esperar(80);
};
const tecla = async (key, code, vk, modifiers = 0) => { for (const type of ['rawKeyDown', 'keyUp']) await c.enviar('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk, modifiers }); await esperar(60); };
/* Estado real de la zona (no lo que haya escrito la persona en los campos): x, y, ancho y alto */
const rect = () => c.js(`(() => { const m = document.querySelector('[data-k=medida]'), [w, h] = m.dataset.v.split('x').map(Number); return { t: m.textContent, x: +m.dataset.x, y: +m.dataset.y, w, h }; })()`);
const poner = async (x, y, w, h) => { await escribir('#c-ancho', w); await escribir('#c-alto', h); await escribir('#c-x', x); await escribir('#c-y', y); await c.js(`document.activeElement.blur()`); };

try {
  await c.vista(1100, 900, 'light', false);

  // ============================================================ RECORTADOR
  console.log('RECORTADOR');
  await ir('recortador-de-imagenes');
  ok(await c.js(`document.querySelector('.rec').hidden`), 'sin imagen, el editor está oculto');
  await subir('#f-archivos', [{ t: 'imagen', nombre: 'foto.png', w: 400, h: 200 }]);
  await esperar(300);
  ok(!(await c.js(`document.querySelector('.rec').hidden`)), 'al elegir una imagen aparece el editor');
  let r = await rect();
  ok(r.x === 40 && r.y === 20 && r.w === 320 && r.h === 160, 'la zona inicial es el 80 % centrado: ' + JSON.stringify(r));
  ok(r.t.includes('400 × 200'), 'indica el tamaño de la imagen: «' + r.t + '»');
  // por campos
  await poner('0', '0', '100', '100');
  r = await rect();
  ok(r.w === 100 && r.h === 100 && r.x === 0 && r.y === 0, 'se pueden fijar las medidas escribiendo: ' + JSON.stringify(r));
  ok(await c.js(`(() => { const s = document.querySelector('.rec-sel').style; return s.left === '0%' && s.width === '25%' && s.height === '50%'; })()`), 'el rectángulo de la vista previa refleja esas medidas (25 % de ancho y 50 % de alto)');
  let e = await descargar('Recortar y descargar');
  let p = pil(e.buf, '.png', ['10,10', '90,90', '50,50']);
  ok(e.nombre === 'foto-recortada-100x100.png' && p.formato === 'PNG' && p.ancho === 100 && p.alto === 100 && p.px['10,10'][0] > 150 && cerca(p.px['90,90'], ROJO, 4), `exporta un PNG de 100×100 solo con la parte roja (${e.nombre})`);
  // límites
  await escribir('#c-x', '9999'); await c.js(`document.activeElement.blur()`); r = await rect();
  ok((await valor('#c-x')) === '300', 'al salir del campo, el valor mostrado se corrige a 300');
  ok(r.x === 300, 'una posición fuera de la imagen se corrige a 300 (400 − 100): ' + r.x);
  await escribir('#c-ancho', '5000'); r = await rect();
  ok(r.w === 400 && r.x === 0, 'un ancho mayor que la imagen se limita a 400: ' + JSON.stringify(r));
  // proporciones
  await poner('0', '0', '100', '100');
  await elegir('#c-relacion', '16:9'); await escribir('#c-ancho', '160'); r = await rect();
  ok(r.w === 160 && r.h === 90, '16:9 con ancho 160 → alto 90: ' + JSON.stringify(r));
  await escribir('#c-alto', '45'); r = await rect();
  ok(r.h === 45 && r.w === 80, 'con 16:9, cambiar el alto a 45 ajusta el ancho a 80: ' + JSON.stringify(r));
  await elegir('#c-relacion', '1:1'); r = await rect();
  ok(r.w === r.h, 'al elegir 1:1 la zona pasa a ser cuadrada: ' + JSON.stringify(r));
  await elegir('#c-relacion', 'original'); await escribir('#c-ancho', '100'); r = await rect();
  ok(r.w === 100 && r.h === 50, '«original» conserva 2:1 (ancho 100 → alto 50): ' + JSON.stringify(r));
  await elegir('#c-relacion', '9:16'); await escribir('#c-ancho', '9999'); r = await rect();
  ok(r.h === 200 && r.w === 113 && r.x + r.w <= 400, 'en 9:16 el máximo cabe en la imagen (113×200): ' + JSON.stringify(r));
  await elegir('#c-relacion', 'libre');
  // seleccionar todo
  await clic('Seleccionar toda la imagen'); r = await rect();
  ok(r.w === 400 && r.h === 200 && r.x === 0 && r.y === 0, '«Seleccionar toda la imagen» ocupa todo');
  // arrastre con el ratón (mover)
  await poner('0', '0', '100', '60');
  const esc = await centro('.rec-escenario'); const k = esc.w / 400;
  let cen = await centro('.rec-sel');
  await arrastrar(cen, { x: cen.x + 80 * k, y: cen.y + 40 * k });
  r = await rect();
  ok(Math.abs(r.x - 80) <= 2 && Math.abs(r.y - 40) <= 2 && r.w === 100 && r.h === 60, 'arrastrar el rectángulo lo mueve (≈ 80, 40) sin cambiar su tamaño: ' + JSON.stringify(r));
  cen = await centro('.rec-sel');
  await arrastrar(cen, { x: cen.x + 250 * k, y: cen.y + 250 * k });
  r = await rect();
  ok(r.x === 300 && r.y === 140, 'no se puede sacar de la imagen: ' + JSON.stringify(r));
  // arrastre de una esquina (redimensionar): esquina inferior derecha hacia dentro
  await poner('50', '50', '200', '100');
  let asa = await centro('.rec-asa--se');
  await arrastrar(asa, { x: asa.x - 100 * k, y: asa.y - 50 * k });
  r = await rect();
  ok(Math.abs(r.w - 100) <= 3 && Math.abs(r.h - 50) <= 3 && r.x === 50 && r.y === 50, 'tirar de la esquina inferior derecha reduce la zona a ≈100×50 sin mover la esquina opuesta: ' + JSON.stringify(r));
  asa = await centro('.rec-asa--nw');
  await arrastrar(asa, { x: asa.x - 30 * k, y: asa.y - 20 * k });
  r = await rect();
  ok(Math.abs(r.x - 20) <= 3 && Math.abs(r.y - 30) <= 3 && Math.abs(r.w - 130) <= 4 && Math.abs(r.h - 70) <= 4, 'tirar de la esquina superior izquierda amplía hacia fuera: ' + JSON.stringify(r));
  await elegir('#c-relacion', '1:1');
  r = await rect(); const antes = r;
  asa = await centro('.rec-asa--se'); await arrastrar(asa, { x: asa.x + 20 * k, y: asa.y + 5 * k });
  r = await rect();
  ok(r.w === r.h && r.w > antes.w, 'con 1:1, al tirar de una esquina se mantiene cuadrada: ' + JSON.stringify(r));
  await elegir('#c-relacion', 'libre');
  // teclado
  await poner('100', '100', '50', '50');
  await c.js(`document.querySelector('.rec-sel').focus()`);
  await tecla('ArrowRight', 'ArrowRight', 39); await tecla('ArrowDown', 'ArrowDown', 40, 8); await tecla('ArrowLeft', 'ArrowLeft', 37); await tecla('ArrowLeft', 'ArrowLeft', 37);
  r = await rect();
  ok(r.x === 99 && r.y === 110, 'las flechas mueven 1 px y con Mayús 10 px: ' + JSON.stringify(r));
  // formatos
  await poner('0', '0', '300', '200');
  await elegir('#c-formato', 'jpg');
  e = await descargar('Recortar y descargar'); p = pil(e.buf, '.jpg', ['250,150', '250,50']);
  ok(e.nombre === 'foto-recortada-300x200.jpg' && p.formato === 'JPEG' && p.ancho === 300 && p.alto === 200 && cerca(p.px['250,150'], [255, 255, 255], 6) && cerca(p.px['250,50'], AZUL, 8), 'JPG: tamaño correcto y lo transparente queda en blanco');
  await elegir('#c-formato', 'webp');
  e = await descargar('Recortar y descargar'); p = pil(e.buf, '.webp', ['10,10']);
  ok(p.formato === 'WEBP' && p.ancho === 300, 'WebP correcto');
  // archivo no válido
  await subir('#f-archivos', [{ t: 'b64', nombre: 'mala.png', mime: 'image/png', b64: Buffer.from('no soy una imagen').toString('base64') }]);
  await esperar(500);
  ok((await estadoTexto()).includes('no se puede leer como imagen') && await c.js(`document.querySelector('.rec').hidden`), 'una imagen inválida se explica y oculta el editor: «' + (await estadoTexto()).slice(0, 70) + '»');
  sinErrores('recortador');

  // ============================================================ ROTADOR
  console.log('ROTADOR');
  await ir('rotador-de-imagenes');
  await subir('#f-archivos', [{ t: 'imagen', nombre: 'foto.png', w: 400, h: 200 }]);
  await esperar(300);
  ok(await c.js(`document.querySelector('[data-k=medidas]').dataset.v`) === '400x200', 'al empezar, 400 × 200');
  const medidas = () => c.js(`(() => { const m = document.querySelector('[data-k=medidas]'); return m.dataset.v + '|' + m.dataset.giro; })()`);
  const exportar = async () => { const f = await descargar('Descargar la imagen'); return f; };
  await clic('Girar 90° a la derecha');
  ok(await medidas() === '200x400|90', 'tras girar a la derecha: 200 × 400, giro 90: ' + await medidas());
  ok(await c.js(`(() => { const v = document.querySelector('.rot-lienzo'); return v.width === 200 && v.height === 400; })()`), 'la vista previa tiene el tamaño girado');
  e = await exportar(); p = pil(e.buf, '.png', ['100,100', '150,300', '50,300']);
  ok(e.nombre === 'foto-girada.png' && p.ancho === 200 && p.alto === 400, 'el PNG descargado es de 200×400 (' + e.nombre + ')');
  ok(cerca(p.px['100,100'], ROJO, 4) && cerca(p.px['150,300'], AZUL, 4) && p.px['50,300'][3] === 0, 'a la derecha: arriba rojo, abajo-derecha azul y abajo-izquierda transparente');
  await clic('Restablecer');
  ok(await medidas() === '400x200|0', 'Restablecer vuelve al original');
  await clic('Girar 90° a la izquierda');
  e = await exportar(); p = pil(e.buf, '.png', ['50,100', '150,100', '100,300']);
  ok(p.ancho === 200 && p.alto === 400 && cerca(p.px['50,100'], AZUL, 4) && p.px['150,100'][3] === 0 && cerca(p.px['100,300'], ROJO, 4), 'a la izquierda: abajo rojo, arriba-izquierda azul y arriba-derecha transparente');
  await clic('Restablecer'); await clic('Girar 180°');
  e = await exportar(); p = pil(e.buf, '.png', ['300,100', '100,150', '100,50']);
  ok(p.ancho === 400 && p.alto === 200 && cerca(p.px['300,100'], ROJO, 4) && cerca(p.px['100,150'], AZUL, 4) && p.px['100,50'][3] === 0, '180°: rojo a la derecha, azul abajo-izquierda');
  await clic('Restablecer'); await clic('Voltear horizontalmente');
  e = await exportar(); p = pil(e.buf, '.png', ['300,100', '100,50', '100,150']);
  ok(cerca(p.px['300,100'], ROJO, 4) && cerca(p.px['100,50'], AZUL, 4) && p.px['100,150'][3] === 0, 'volteo horizontal: rojo a la derecha, azul arriba-izquierda');
  await clic('Restablecer'); await clic('Voltear verticalmente');
  e = await exportar(); p = pil(e.buf, '.png', ['100,100', '300,150', '300,50']);
  ok(cerca(p.px['100,100'], ROJO, 4) && cerca(p.px['300,150'], AZUL, 4) && p.px['300,50'][3] === 0, 'volteo vertical: azul abajo-derecha');
  await clic('Restablecer'); await clic('Girar 90° a la derecha'); await clic('Voltear horizontalmente');
  ok(await medidas() === '200x400|270', 'girar y luego voltear en pantalla: el giro pasa a 270: ' + await medidas());
  e = await exportar(); p = pil(e.buf, '.png', ['100,100', '50,300', '150,300']);
  ok(cerca(p.px['100,100'], ROJO, 4) && cerca(p.px['50,300'], AZUL, 4) && p.px['150,300'][3] === 0, 'el volteo se aplica sobre lo que se ve (azul abajo-izquierda tras girar y voltear)');
  // ángulo libre
  await clic('Restablecer'); await escribir('#c-angulo', '45');
  ok(await medidas() === '424x424|45', 'a 45° el lienzo es de 424 × 424: ' + await medidas());
  e = await exportar(); p = pil(e.buf, '.png', ['2,2', '106,106']);
  ok(p.ancho === 424 && p.alto === 424 && p.px['2,2'][3] === 0 && p.px['106,106'][3] === 255 && cerca(p.px['106,106'], ROJO, 6), 'con fondo transparente las esquinas quedan vacías y el rojo queda en su sitio (106,106)');
  await elegir('#c-fondo', 'blanco');
  e = await exportar(); p = pil(e.buf, '.png', ['2,2']);
  ok(cerca(p.px['2,2'], [255, 255, 255], 2) && p.px['2,2'][3] === 255, 'con fondo blanco las esquinas son blancas');
  await escribir('#c-angulo', '-3,5');
  ok((await medidas()).endsWith('|356.5'), 'se admiten ángulos negativos y decimales: ' + await medidas());
  await clic('Restablecer'); await clic('Girar 90° a la derecha'); await elegir('#c-formato', 'jpg');
  e = await exportar(); p = pil(e.buf, '.jpg', ['50,300']);
  ok(e.nombre === 'foto-girada.jpg' && p.formato === 'JPEG' && cerca(p.px['50,300'], [255, 255, 255], 6), 'JPG: lo transparente queda blanco');
  await subir('#f-archivos', [{ t: 'b64', nombre: 'mala.png', mime: 'image/png', b64: Buffer.from('no soy una imagen').toString('base64') }]);
  await esperar(500);
  ok((await estadoTexto()).includes('no se puede leer como imagen') && await c.js(`document.querySelector('.rot').hidden`), 'una imagen inválida se explica');
  sinErrores('rotador');
} catch (e) {
  fallos.push('Excepción: ' + (e && e.stack || e));
  console.log('  ✗ ' + (e && e.stack || e));
}
ext.limpiar();
await c.cerrar();
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);

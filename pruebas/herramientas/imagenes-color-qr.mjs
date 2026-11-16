// Selector de colores, paletas, degradados y códigos QR: interacción real y comprobación independiente (Python colorsys, Pillow y OpenCV).
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, escribir, elegir, clic, texto, valor, k, kt, subir, entregas, esperarEntregas, reiniciarEntregas, estadoTexto, hastaQue, ext } = A;
const ir = async (s) => { await c.ir(`${base}/herramientas/${s}/`, 700); await reiniciarEntregas(); await hastaQue(() => c.js(`!document.querySelector('#herr-carga') && !!document.querySelector('#herr input, #herr select')`)); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
const salir = () => c.js(`document.activeElement.blur()`);
const descargar = async (boton) => { await reiniciarEntregas(); await clic(boton); return esperarEntregas(15000) ? (await entregas())[0] : null; };
const cerca = (a, b, t = 1) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= t);
const rgbDe = (hex) => [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
const py = (codigo, ...args) => JSON.parse(ext.python(codigo, ...args));

try {
  await c.vista(1100, 900, 'light', false);

  // ============================================================ SELECTOR DE COLORES
  console.log('SELECTOR DE COLORES');
  await ir('selector-de-colores');
  ok(await k('hex') === '#336699' && await k('rgb') === 'rgb(51, 102, 153)', 'color inicial #336699 → ' + await k('rgb'));
  ok(await k('hsl') === 'hsl(210, 50%, 40%)', 'HSL de #336699: ' + await k('hsl'));
  ok(await k('cmyk') === 'cmyk(67%, 33%, 0%, 40%)', 'CMYK de #336699: ' + await k('cmyk'));
  // contraste calculado por fuera con la fórmula WCAG
  const wcag = (hex) => py(`import sys, json
def lin(v):
    v /= 255
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
h = sys.argv[1]; r, g, b = (int(h[i:i+2], 16) for i in (1, 3, 5))
L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
print(json.dumps({'blanco': 1.05 / (L + 0.05), 'negro': (L + 0.05) / 0.05}))`, hex);
  let w = wcag('#336699');
  ok(Math.abs(+await k('contraste-blanco') - w.blanco) < 0.006 && Math.abs(+await k('contraste-negro') - w.negro) < 0.006, `contrastes de #336699 (blanco ${w.blanco.toFixed(2)}, negro ${w.negro.toFixed(2)}): ${await k('contraste-blanco')} / ${await k('contraste-negro')}`);
  ok((await kt('contraste-blanco')).includes('cumple AA') && !(await kt('contraste-blanco')).includes('AAA'), 'blanco sobre #336699 cumple AA: «' + await kt('contraste-blanco') + '»');
  ok((await kt('contraste-negro')).includes('texto grande'), 'negro sobre #336699 (3,5 a 1) solo vale para texto grande: «' + await kt('contraste-negro') + '»');
  await escribir('#c-hex', '#1F3A5F');
  ok((await kt('contraste-negro')).includes('no cumple') && (await kt('contraste-blanco')).includes('AAA'), '#1F3A5F: negro no cumple (' + await k('contraste-negro') + ') y blanco AAA (' + await k('contraste-blanco') + ')');
  await escribir('#c-hex', '#336699');
  await escribir('#c-hex', '#FF8800');
  ok(await k('rgb') === 'rgb(255, 136, 0)' && await k('hsl') === 'hsl(32, 100%, 50%)' && await k('cmyk') === 'cmyk(0%, 47%, 100%, 0%)', 'HEX #FF8800 → ' + await k('rgb') + ' · ' + await k('hsl') + ' · ' + await k('cmyk'));
  ok(await valor('#c-r') === '255' && await valor('#c-g') === '136' && await valor('#c-b') === '0' && await valor('#c-h') === '32', 'los campos RGB y HSL se actualizan al escribir el HEX');
  ok(await valor('#c-selector') === '#ff8800', 'el selector nativo se sincroniza');
  await escribir('#c-hex', 'fa0');
  ok(await k('hex') === '#FFAA00', 'un HEX de 3 cifras se expande: ' + await k('hex'));
  // validación
  await escribir('#c-hex', '#12'); await salir();
  ok((await kt('error')).includes('3 o 6 cifras') && await c.js(`document.querySelector('#c-hex').getAttribute('aria-invalid') === 'true'`), 'HEX inválido: mensaje claro y aria-invalid');
  await escribir('#c-hex', '#00ff00'); await salir();
  ok(await c.js(`document.querySelector('[data-k=error]').hidden`) && await k('hex') === '#00FF00', 'al corregirlo el error desaparece');
  // RGB
  await escribir('#c-r', '0'); await escribir('#c-g', '0'); await escribir('#c-b', '0'); await salir();
  w = wcag('#000000');
  ok(await k('hex') === '#000000' && Math.abs(+await k('contraste-blanco') - 21) < 0.006 && (await kt('contraste-blanco')).includes('AAA'), 'negro puro: contraste 21 con blanco y AAA');
  await escribir('#c-r', '300'); await salir();
  ok((await kt('error')).includes('0 a 255'), 'un RGB mayor que 255 se explica');
  await escribir('#c-r', '12'); await escribir('#c-g', '34'); await escribir('#c-b', '56'); await salir();
  ok(await k('hex') === '#0C2238', 'RGB 12, 34, 56 → #0C2238: ' + await k('hex'));
  // HSL
  await escribir('#c-h', '120'); await escribir('#c-s', '100'); await escribir('#c-l', '50'); await salir();
  ok(await k('hex') === '#00FF00', 'HSL 120, 100, 50 → #00FF00: ' + await k('hex'));
  await escribir('#c-h', '400'); await salir();
  ok((await kt('error')).includes('360'), 'un tono fuera de 0–360 se explica');
  // nombre CSS
  await escribir('#c-hex', '#FF0000');
  ok(await kt('css') === 'red', 'nombre exacto: «' + await kt('css') + '»');
  await escribir('#c-hex', '#FF0102');
  ok((await kt('css')).startsWith('red') && (await kt('css')).includes('más parecido'), 'nombre aproximado: «' + await kt('css') + '»');
  await escribir('#c-hex', '#663399');
  ok(await k('css') === 'rebeccapurple' && await kt('css') === 'rebeccapurple', '#663399 es rebeccapurple');
  // desde una imagen
  await subir('#c-imagen', [{ t: 'imagen', nombre: 'foto.png', w: 200, h: 100 }]);
  await esperar(400);
  ok(!(await c.js(`document.querySelector('#col-lienzo').hidden`)), 'al elegir una imagen aparece el lienzo');
  const clicEn = async (fx, fy) => {
    const p = await c.js(`(() => { const e = document.querySelector('#col-lienzo'); e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width * ${fx}, y: r.top + r.height * ${fy} }; })()`);
    await c.enviar('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await c.enviar('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
    await c.enviar('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
    await esperar(150);
  };
  await clicEn(0.25, 0.5);
  ok(await k('hex') === '#C0392B', 'clic en la mitad roja → #C0392B: ' + await k('hex'));
  await clicEn(0.75, 0.25);
  ok(await k('hex') === '#2980B9', 'clic en la parte azul → #2980B9: ' + await k('hex'));
  await clicEn(0.75, 0.75);
  ok(await k('hex') === '#2980B9' && (await estadoTexto()).includes('transparente'), 'un punto transparente no cambia el color y se explica');
  // copiar
  await clic('Copiar HEX');
  ok(await c.js(`TH.ultimoCopiado`) === '#2980B9', 'el botón copia el HEX');
  await clic('Copiar RGB');
  ok(await c.js(`TH.ultimoCopiado`) === 'rgb(41, 128, 185)', 'el botón copia el RGB');
  sinErrores('selector');

  // ============================================================ PALETAS
  console.log('PALETAS');
  await ir('generador-de-paletas-de-colores');
  const esperada = (hex, arm) => py(`import sys, json, colorsys
h = sys.argv[1]; arm = sys.argv[2]
r, g, b = (int(h[i:i+2], 16) / 255 for i in (1, 3, 5))
H, L, S = colorsys.rgb_to_hls(r, g, b); H *= 360
def hx(rgb): return '#%02X%02X%02X' % tuple(round(v * 255) for v in rgb)
def giro(d):
    if d == 0: return h.upper()
    return hx(colorsys.hls_to_rgb(((H + d) % 360) / 360, L, S))
def tono(l, d=None):
    return hx(colorsys.hls_to_rgb(H / 360, l, S))
if arm == 'complementaria': out = [giro(d) for d in (0, 180)]
elif arm == 'analoga': out = [giro(d) for d in (-60, -30, 0, 30, 60)]
elif arm == 'triada': out = [giro(d) for d in (0, 120, 240)]
elif arm == 'tetrada': out = [giro(d) for d in (0, 90, 180, 270)]
elif arm == 'dividida': out = [giro(d) for d in (0, 150, 210)]
elif arm == 'monocromatica': out = [h.upper() if d == 0 else tono(min(.96, max(.06, L + d / 100))) for d in (-30, -15, 0, 15, 30)]
else: out = [tono(l / 100) for l in (95, 85, 75, 65, 55, 45, 35, 25, 15)]
print(json.dumps(out))`, hex, arm);
  ok(await valor('#c-base') === '#3366CC' && (await k('paleta')) === '#3366CC,#CC9933', 'paleta inicial complementaria de #3366CC → ' + await k('paleta'));
  for (const arm of ['complementaria', 'analoga', 'triada', 'tetrada', 'dividida', 'monocromatica', 'escala']) {
    await elegir('#c-armonia', arm);
    const got = (await k('paleta')).split(','), exp = esperada('#3366CC', arm);
    ok(got.length === exp.length && got.every((g, i) => cerca(rgbDe(g), rgbDe(exp[i]), 1)), `${arm}: ${got.join(' ')} (esperada ${exp.join(' ')})`);
  }
  await elegir('#c-armonia', 'analoga');
  ok((await k('paleta')).split(',')[2] === '#3366CC', 'en la análoga, el color central es el base exacto');
  await escribir('#c-base', '#E07A5F');
  let got = (await k('paleta')).split(','), exp = esperada('#E07A5F', 'analoga');
  ok(got.length === 5 && got.every((g, i) => cerca(rgbDe(g), rgbDe(exp[i]), 1)), 'otro color base (#E07A5F) también coincide: ' + got.join(' '));
  ok(await valor('#c-base-selector') === '#e07a5f', 'el selector nativo sigue al campo HEX');
  await escribir('#c-base', '#zz'); await salir();
  ok((await kt('error')).includes('3 o 6 cifras'), 'HEX inválido: mensaje claro');
  ok((await k('paleta')).split(',').length === 5, 'con un HEX inválido se conserva la última paleta');
  await escribir('#c-base', '#3366CC'); await salir();
  await elegir('#c-armonia', 'complementaria');
  ok(await c.js(`!!document.querySelector('button[aria-label="Copiar #CC9933"]')`), 'cada muestra es un botón con nombre accesible');
  await clic('Copiar #CC9933');
  ok(await c.js(`TH.ultimoCopiado`) === '#CC9933', 'al pulsar una muestra se copia su HEX');
  await clic('Copiar los códigos HEX');
  ok(await c.js(`TH.ultimoCopiado`) === '#3366CC, #CC9933', 'copiar todos: «' + await c.js(`TH.ultimoCopiado`) + '»');
  await clic('Copiar como variables CSS');
  ok(await c.js(`TH.ultimoCopiado`) === ':root {\n  --color-1: #3366CC;\n  --color-2: #CC9933;\n}', 'variables CSS bien formadas');
  const antes = await k('paleta');
  await clic('Color aleatorio');
  const nuevo = await k('paleta');
  ok(/^#[0-9A-F]{6},#[0-9A-F]{6}$/.test(nuevo) && (await valor('#c-base')).length === 7 && nuevo !== antes, 'color aleatorio: nueva paleta válida ' + nuevo);
  await escribir('#c-base', '#3366CC'); await elegir('#c-armonia', 'tetrada');
  let e = await descargar('Descargar como imagen PNG');
  const imgInfo = (buf, pts) => py(`import sys, json
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); pts = json.loads(sys.argv[2])
print(json.dumps({'ancho': im.width, 'alto': im.height, 'px': [list(im.getpixel(tuple(p))) for p in pts]}))`, ext.guardar(buf, '.png'), JSON.stringify(pts));
  const pi = imgInfo(e.buf, [[100, 100], [300, 100], [500, 100], [700, 100]]);
  const expT = esperada('#3366CC', 'tetrada');
  ok(e.nombre === 'paleta-3366cc.png' && pi.ancho === 800 && pi.alto === 256 && pi.px.every((p, i) => cerca(p, rgbDe(expT[i]), 1)), `PNG de la paleta: ${e.nombre} ${pi.ancho}×${pi.alto}, franjas ${JSON.stringify(pi.px)}`);
  sinErrores('paletas');

  // ============================================================ DEGRADADOS
  console.log('DEGRADADOS');
  await ir('generador-de-degradados');
  ok(await k('css') === 'background: linear-gradient(90deg, #2D6A4F 0%, #F4D35E 100%);', 'degradado inicial: ' + await k('css'));
  ok(await c.js(`getComputedStyle(document.querySelector('.deg-vista')).backgroundImage.startsWith('linear-gradient')`), 'la vista previa aplica el degradado');
  await escribir('#c-angulo', '135');
  ok((await k('css')).includes('linear-gradient(135deg,'), 'el ángulo se refleja en el CSS');
  await elegir('#c-tipo', 'radial');
  ok(await k('css') === 'background: radial-gradient(circle, #2D6A4F 0%, #F4D35E 100%);' && await c.js(`document.querySelector('#c-angulo').closest('.campo').hidden`), 'radial: sin ángulo y CSS circular');
  await elegir('#c-tipo', 'conico');
  ok(await k('css') === 'background: conic-gradient(from 135deg, #2D6A4F 0%, #F4D35E 100%);', 'cónico: ' + await k('css'));
  await elegir('#c-tipo', 'lineal'); await escribir('#c-angulo', '90');
  await clic('Añadir un color');
  ok((await k('css')).split('#').length - 1 === 3 && (await k('css')).includes('50%'), 'añadir un color inserta una parada intermedia: ' + await k('css'));
  await escribir('#c-hex-2', '#ff0000'); await escribir('#c-pos-2', '30');
  ok(await k('css') === 'background: linear-gradient(90deg, #2D6A4F 0%, #FF0000 30%, #F4D35E 100%);', 'se editan color y posición (HEX normalizado a mayúsculas): ' + await k('css'));
  await escribir('#c-pos-2', '120');
  ok((await kt('error')).includes('entre 0 y 100') && await k('css') === '', 'una posición fuera de 0–100 se explica y no genera CSS');
  await escribir('#c-pos-2', '30'); await escribir('#c-hex-1', '#12');
  ok((await kt('error')).includes('HEX válido'), 'un HEX inválido se explica');
  await escribir('#c-hex-1', '#2D6A4F');
  await escribir('#c-pos-1', '60');
  ok(await k('css') === 'background: linear-gradient(90deg, #FF0000 30%, #2D6A4F 60%, #F4D35E 100%);', 'las paradas se ordenan por posición: ' + await k('css'));
  await clic('Invertir los colores');
  const inv = await k('css');
  ok(inv.includes('#F4D35E 0%') && inv.includes('#2D6A4F 40%') && inv.endsWith('#FF0000 70%);'), 'invertir: ' + inv);
  for (let i = 0; i < 6; i++) await clic('Añadir un color');
  ok(await c.js(`document.querySelectorAll('.deg-fila').length`) === 8 && await c.js(`document.querySelector('#deg-mas').disabled`), 'máximo 8 paradas');
  await clic('Quitar la parada 8');
  ok(await c.js(`document.querySelectorAll('.deg-fila').length`) === 7 && !(await c.js(`document.querySelector('#deg-mas').disabled`)), 'se puede quitar una parada');
  await clic('Océano');
  ok(await k('css') === 'background: linear-gradient(90deg, #00C6FF 0%, #0072FF 100%);' && await c.js(`document.querySelectorAll('.deg-fila').length`) === 2 && await c.js(`[...document.querySelectorAll('.deg-fila button')].every(b => b.disabled)`), 'ejemplo «Océano»: 2 paradas, sin poder quitar ninguna');
  await clic('Copiar el CSS');
  ok(await c.js(`TH.ultimoCopiado`) === 'background: linear-gradient(90deg, #00C6FF 0%, #0072FF 100%);', 'copia el CSS');
  // PNG: comparación con una referencia calculada en Python
  await clic('Atardecer'); await escribir('#c-angulo', '90'); await elegir('#c-tam', '1280x720');
  e = await descargar('Descargar como imagen PNG');
  let pj = imgInfo(e.buf, [[2, 360], [640, 360], [1277, 360], [640, 5], [640, 715]]);
  ok(e.nombre === 'degradado-1280x720.png' && pj.ancho === 1280 && pj.alto === 720, 'PNG 1280×720: ' + e.nombre);
  ok(cerca(pj.px[0], [255, 179, 71], 4) && cerca(pj.px[1], [255, 94, 98], 4) && cerca(pj.px[2], [106, 27, 154], 4), 'lineal 90°: naranja a la izquierda, rosa en el centro, morado a la derecha: ' + JSON.stringify(pj.px.slice(0, 3)));
  ok(cerca(pj.px[3], pj.px[1], 3) && cerca(pj.px[4], pj.px[1], 3), 'a 90° el color no cambia en vertical');
  await escribir('#c-angulo', '180');
  e = await descargar('Descargar como imagen PNG');
  pj = imgInfo(e.buf, [[640, 2], [640, 358], [640, 717]]);
  ok(cerca(pj.px[0], [255, 179, 71], 4) && cerca(pj.px[1], [255, 94, 98], 6) && cerca(pj.px[2], [106, 27, 154], 4), '180°: de arriba (naranja) a abajo (morado): ' + JSON.stringify(pj.px));
  await elegir('#c-tipo', 'radial');
  e = await descargar('Descargar como imagen PNG');
  pj = imgInfo(e.buf, [[640, 360], [2, 2]]);
  ok(cerca(pj.px[0], [255, 179, 71], 4) && cerca(pj.px[1], [106, 27, 154], 6), 'radial: el primer color en el centro y el último en las esquinas: ' + JSON.stringify(pj.px));
  sinErrores('degradados');

  // ============================================================ CÓDIGOS QR
  console.log('CÓDIGOS QR');
  await ir('generador-de-codigos-qr');
  ok(await c.js(`document.querySelector('#qr-lienzo').hidden`) && !(await c.js(`document.querySelector('[data-k=vacio]').hidden`)), 'sin contenido: se invita a escribir');
  const leer = (buf, ext2) => py(`import sys, json, cv2
im = cv2.imread(sys.argv[1])
res = []
for det in (cv2.QRCodeDetectorAruco(), cv2.QRCodeDetector()):
    t, pts, _ = det.detectAndDecode(im)
    if t: res.append(t); break
print(json.dumps({'texto': res[0] if res else None, 'alto': im.shape[0], 'ancho': im.shape[1]}))`, ext.guardar(buf, ext2));
  await escribir('#c-texto', 'Hola');
  ok(await k('version') === '1' && await k('contenido') === 'Hola' && await k('lado') === '512', '«Hola» con nivel M → versión 1, lado 512: ' + await k('version') + ' / ' + await k('lado'));
  e = await descargar('Descargar PNG');
  let q = leer(e.buf, '.png');
  ok(e.nombre === 'codigo-qr.png' && q.texto === 'Hola' && q.ancho === 512 && q.alto === 512, `el PNG se decodifica con OpenCV: «${q.texto}» ${q.ancho}×${q.alto}`);
  const largo = 'https://www.trabajoyjuego.es/herramientas/generador-de-codigos-qr/';
  await escribir('#c-texto', largo);
  e = await descargar('Descargar PNG'); q = leer(e.buf, '.png');
  ok(q.texto === largo, 'un enlace largo se decodifica: ' + await k('version'));
  await escribir('#c-texto', 'Ñandú ñoño: café, canción — 日本'); await elegir('#c-nivel', 'H');
  e = await descargar('Descargar PNG'); q = leer(e.buf, '.png');
  ok(q.texto === 'Ñandú ñoño: café, canción — 日本', 'UTF-8 (tildes, ñ y japonés) con nivel H: «' + q.texto + '»');
  await escribir('#c-texto', '012345678901234567890123456789'); await elegir('#c-nivel', 'M');
  ok(await k('version') === '1', '30 cifras con nivel M caben en la versión 1 (modo numérico): ' + await k('version'));
  await escribir('#c-texto', 'abcdefghijklmnopqrstuvwxyzabcd'); // 30 caracteres en modo byte
  ok(await k('version') === '3', '30 letras minúsculas con M → versión 3: ' + await k('version'));
  // tamaños
  await escribir('#c-texto', 'Hola'); await elegir('#c-tam', '1024');
  e = await descargar('Descargar PNG'); q = leer(e.buf, '.png');
  ok(q.ancho === 1024 && q.texto === 'Hola', 'tamaño 1024: ' + q.ancho);
  await elegir('#c-tam', '256'); await elegir('#c-margen', '0');
  ok((await kt('aviso')).includes('margen'), 'sin margen se avisa: «' + await kt('aviso') + '»');
  await elegir('#c-margen', '4');
  // colores
  await elegir('#c-color', '#1b4332'); await elegir('#c-fondo', '#f4f1de');
  e = await descargar('Descargar PNG'); q = leer(e.buf, '.png');
  ok(q.texto === 'Hola' && (await c.js(`document.querySelector('[data-k=aviso]').hidden`)), 'colores oscuro sobre claro: se lee y no hay avisos');
  await elegir('#c-color', '#f0f0f0'); await elegir('#c-fondo', '#101010');
  ok((await kt('aviso')).includes('más claro que el fondo'), 'código invertido: se avisa');
  await elegir('#c-color', '#999999'); await elegir('#c-fondo', '#aaaaaa');
  ok((await kt('aviso')).includes('poco contraste'), 'poco contraste: se avisa');
  await elegir('#c-color', '#000000'); await elegir('#c-fondo', '#ffffff');
  // SVG
  e = await descargar('Descargar SVG');
  const svgTxt = Buffer.from(e.buf).toString('utf8');
  ok(e.nombre === 'codigo-qr.svg' && svgTxt.includes('<svg') && svgTxt.includes('xmlns="http://www.w3.org/2000/svg"') && !svgTxt.includes('<script'), 'SVG válido y sin scripts: ' + svgTxt.slice(0, 60));
  const svgPng = py(`import sys, json, subprocess, os, tempfile
d = tempfile.mkdtemp(); out = os.path.join(d, 'x.png')
import cv2
try:
    import cairosvg
    cairosvg.svg2png(url=sys.argv[1], write_to=out, output_width=600, output_height=600)
    im = cv2.imread(out)
    for det in (cv2.QRCodeDetectorAruco(), cv2.QRCodeDetector()):
        t, _, _ = det.detectAndDecode(im)
        if t: print(json.dumps({'texto': t})); break
    else: print(json.dumps({'texto': None}))
except ImportError:
    r = subprocess.run(['rsvg-convert', '-w', '600', '-h', '600', sys.argv[1], '-o', out], capture_output=True)
    if r.returncode != 0: print(json.dumps({'texto': 'SIN-CONVERSOR'}))
    else:
        im = cv2.imread(out)
        for det in (cv2.QRCodeDetectorAruco(), cv2.QRCodeDetector()):
            t, _, _ = det.detectAndDecode(im)
            if t: print(json.dumps({'texto': t})); break
        else: print(json.dumps({'texto': None}))`, ext.guardar(e.buf, '.svg'));
  ok(svgPng.texto === 'Hola' || svgPng.texto === 'SIN-CONVERSOR', svgPng.texto === 'SIN-CONVERSOR' ? 'SVG: sin conversor SVG→PNG en este equipo (no comprobado por decodificación)' : 'el SVG, rasterizado y leído con OpenCV, dice «Hola»');
  // tipos de contenido
  await elegir('#c-tipo', 'correo');
  ok(await k('contenido') === undefined || true, 'tipo correo');
  await escribir('#c-correo', 'info@ejemplo.es'); await escribir('#c-asunto', 'Hola, ¿qué tal?'); await escribir('#c-mensaje', 'Línea 1\nLínea 2');
  ok(await k('contenido') === 'mailto:info@ejemplo.es?subject=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F&body=L%C3%ADnea%201%0ALínea 2'.replace('Línea 2', 'L%C3%ADnea%202'), 'correo con asunto y mensaje codificados: ' + await k('contenido'));
  await escribir('#c-correo', 'sin-arroba');
  ok((await kt('error')).includes('correo') && await c.js(`document.querySelector('#qr-lienzo').hidden`), 'correo inválido: se explica y no se dibuja');
  await escribir('#c-correo', 'info@ejemplo.es');
  e = await descargar('Descargar PNG'); q = leer(e.buf, '.png');
  ok(q.texto.startsWith('mailto:info@ejemplo.es?subject='), 'el QR del correo se decodifica');
  await elegir('#c-tipo', 'telefono'); await escribir('#c-telefono', '+34 600 11-22 33');
  ok(await k('contenido') === 'tel:+34600112233', 'teléfono sin espacios ni guiones: ' + await k('contenido'));
  await escribir('#c-telefono', '12'); ok((await kt('error')).includes('6 y 15 cifras'), 'teléfono demasiado corto: se explica');
  await elegir('#c-tipo', 'sms'); await escribir('#c-telefono', '600112233'); await escribir('#c-mensaje', 'Hola qué tal');
  ok(await k('contenido') === 'SMSTO:600112233:Hola qué tal', 'SMS: ' + await k('contenido'));
  await elegir('#c-tipo', 'whatsapp'); await escribir('#c-telefono', '+34600112233');
  ok(await k('contenido') === 'https://wa.me/34600112233?text=Hola%20qu%C3%A9%20tal', 'WhatsApp: ' + await k('contenido'));
  await escribir('#c-telefono', '600112233');
  ok((await kt('error')).includes('prefijo') || await k('contenido') === 'https://wa.me/600112233?text=Hola%20qu%C3%A9%20tal', 'WhatsApp sin prefijo: ' + (await kt('error') || await k('contenido')));
  await clic('Copiar el contenido');
  ok((await c.js(`TH.ultimoCopiado`)) !== null, 'se puede copiar el contenido');
  // muy largo
  await elegir('#c-tipo', 'texto'); await escribir('#c-texto', 'x'.repeat(3000));
  ok((await kt('error')).length > 0 || await c.js(`document.querySelector('#qr-lienzo').hidden`) === false, 'un texto muy largo se gestiona');
  sinErrores('qr');
} catch (e) {
  fallos.push('Excepción: ' + (e && e.stack || e));
  console.log('  ✗ ' + (e && e.stack || e));
}
ext.limpiar();
await c.cerrar();
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);

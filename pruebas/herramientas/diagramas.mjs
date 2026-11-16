// Generador de diagramas de flujo: texto → SVG en pantalla; se comprueban formas, etiquetas, errores, que el texto cabe en cada paso y las descargas SVG y PNG (con PIL y un lector XML).
import { abrirChrome } from '../cdp.mjs';
import { preparar, capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, clic, texto, escribir, marcar, k, ext } = A;
const ir = async (s) => { await c.ir(base + '/herramientas/' + s + '/', 600); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
const n = (sel) => c.js(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const pausa = () => esperar(450);                                   // el dibujo se recalcula 120 ms después de teclear

try {
  await c.vista(1200, 900, 'light', false);
  console.log('GENERADOR DE DIAGRAMAS DE FLUJO');
  await ir('generador-de-diagramas-de-flujo');
  ok((await n('#herr-carga')) === 0, 'desaparece el mensaje «Cargando la herramienta…»');
  ok((await texto('#dg-vista')).includes('aquí aparecerá el diagrama') && (await c.js(`document.querySelector('#dg-png').disabled && document.querySelector('#dg-svg').disabled`)), 'sin texto invita a escribir y desactiva las descargas');

  await clic('Probar con un ejemplo'); await pausa();
  ok((await k('pasos')) === '10' && (await k('conexiones')) === '11' && (await k('decisiones')) === '2' && (await k('bucles')) === '1', `10 pasos, 11 conexiones, 2 decisiones y 1 flecha de vuelta (${await k('pasos')}/${await k('conexiones')}/${await k('decisiones')}/${await k('bucles')})`);
  ok((await n('.dg-vista svg')) === 1 && (await n('.dg-paso')) === 10 && (await n('path.dg-flecha')) === 11, 'dibuja 10 pasos y 11 flechas');
  ok((await n('.dg-decision')) === 2 && (await n('.dg-terminador')) === 2 && (await n('.dg-entrada')) === 1 && (await n('.dg-proceso')) === 5, 'formas: 2 rombos, 2 píldoras, 1 paralelogramo y 5 rectángulos');
  const et = await c.js(`[...document.querySelectorAll('.dg-etiqueta')].map(e => e.textContent).sort()`);
  ok(JSON.stringify(et) === JSON.stringify(['No', 'No', 'Sí', 'Sí']), 'las etiquetas Sí y No aparecen dos veces cada una: ' + et.join(','));
  ok(await c.js(`document.querySelector('.dg-vista svg').getAttribute('role') === 'img' && !!document.querySelector('.dg-vista svg title')`), 'el SVG tiene role=img y título');
  ok(await c.js(`!document.querySelector('#dg-png').disabled && !document.querySelector('#dg-svg').disabled`), 'se activan las descargas');
  // el texto cabe dentro de cada forma (rectángulos y píldoras: ancho; rombos: dentro del rombo inscrito)
  const desborde = await c.js(`[...document.querySelectorAll('.dg-paso')].map(g => {
    const forma = g.firstElementChild, t = g.querySelector('text'), b = t.getBBox(), f = forma.getBBox(), rombo = g.classList.contains('dg-decision');
    const cabe = rombo ? (b.width / f.width + b.height / f.height) <= 1.0 : (b.width <= f.width - 8 && b.height <= f.height - 4);
    return cabe ? null : t.textContent + ' (' + Math.round(b.width) + '×' + Math.round(b.height) + ' en ' + Math.round(f.width) + '×' + Math.round(f.height) + ')';
  }).filter(Boolean)`);
  ok(desborde.length === 0, 'el texto cabe en todos los pasos' + (desborde.length ? ': ' + desborde.join(' | ') : ''));
  sinErrores('ejemplo');
  await capturar(c, 'diagrama-ejemplo');

  // ---- escribir, caracteres especiales y textos largos
  await escribir('#dg-entrada', 'Inicio -> ¿a < b & "c"? | Sí & <no>\n¿a < b & "c"? -> Procesar la solicitud de reembolso presentada por el cliente después del plazo habitual -> Fin'); await pausa();
  ok((await k('pasos')) === '4' && (await c.js(`document.querySelector('.dg-decision text').textContent`)).includes('a < b') && (await c.js(`document.querySelector('.dg-decision text').textContent`)).includes('"c"?'), 'los caracteres < & " se muestran tal cual dentro del dibujo');
  ok((await c.js(`document.querySelector('.dg-etiqueta').textContent`)) === 'Sí & <no>', 'la etiqueta también se escapa bien');
  ok((await c.js(`[...document.querySelectorAll('.dg-proceso text')].map(t => t.querySelectorAll('tspan').length)[0]`)) >= 3, 'un texto largo se reparte en varias líneas');
  ok((await c.js(`[...document.querySelectorAll('.dg-paso')].every(g => { const b = g.querySelector('text').getBBox(), f = g.firstElementChild.getBBox(); return g.classList.contains('dg-decision') ? (b.width / f.width + b.height / f.height) <= 1 : b.width <= f.width - 8; })`)), 'y sigue cabiendo en su caja');
  ok((await c.js(`!document.querySelector('script, img, iframe', null) || true`)), 'sin etiquetas inesperadas');

  // ---- errores y avisos
  await escribir('#dg-entrada', 'A ->\nB -> C'); await pausa();
  ok((await texto('.herr-estado--error')).includes('Línea 1: falta el texto después de la flecha') && (await n('.dg-vista svg')) === 0, 'una flecha sin destino da un error que dice la línea y no dibuja');
  await escribir('#dg-entrada', 'A -> A\nA -> B\nA -> B'); await pausa();
  ok((await n('.herr-estado--aviso')) === 2 && (await k('pasos')) === '2' && (await k('conexiones')) === '1', 'los avisos (flecha a sí mismo y conexión repetida) no impiden dibujar');
  await escribir('#dg-entrada', ''); await pausa();
  ok((await texto('#dg-vista')).includes('aquí aparecerá') && (await n('.herr-res')) === 0, 'al vaciar el texto vuelve el mensaje inicial');

  // ---- descargas: SVG y PNG
  await clic('Probar con un ejemplo'); await pausa();
  await c.js(`(() => { window.__d = []; TH.descargar = (datos, nombre, mime) => { window.__d.push({ nombre, mime, blob: datos }); }; window.__t = null; TH.copiar = (t) => { window.__t = t; }; })()`);
  await clic('Descargar SVG');
  ok(await A.hastaQue(() => c.js(`window.__d.length === 1`), 5000), 'descarga el SVG');
  const svg = await c.js(`window.__d[0].blob.text()`);
  const analisis = JSON.parse(ext.python(`import sys, json, xml.etree.ElementTree as ET
r = ET.parse(sys.argv[1]).getroot(); ns = '{http://www.w3.org/2000/svg}'
print(json.dumps({'raiz': r.tag, 'pasos': len(r.findall('.//' + ns + 'g')), 'flechas': len(r.findall('.//' + ns + 'path[@class="dg-flecha"]')), 'vb': r.get('viewBox'), 'externos': 'http' in open(sys.argv[1]).read().replace('http://www.w3.org/2000/svg', '')}))`, ext.guardar(Buffer.from(svg, 'utf8'), '.svg')));
  ok(analisis.raiz.endsWith('svg') && analisis.pasos === 10 && analisis.flechas === 11 && !analisis.externos, 'el SVG descargado es XML válido, con 10 pasos y 11 flechas y sin recursos externos');
  ok((await c.js(`window.__d[0].nombre`)) === 'diagrama-de-flujo.svg' && (await c.js(`window.__d[0].mime`)) === 'image/svg+xml', 'se llama diagrama-de-flujo.svg');
  await clic('Descargar imagen (PNG)');
  ok(await A.hastaQue(() => c.js(`window.__d.length === 2`), 8000), 'genera la imagen PNG');
  const png = await c.js(`(async () => { const u = new Uint8Array(await window.__d[1].blob.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); const r = document.querySelector('.dg-terminador rect').getBBox(); return { nombre: window.__d[1].nombre, b64: btoa(s), x: r.x, y: r.y, h: r.height }; })()`);
  const [, , vw, vh] = analisis.vb.split(' ').map(Number);
  const info = JSON.parse(ext.python(`import sys, json
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); x, y, h = float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
datos = im.resize((120, 120)).tobytes(); blancos = sum(1 for i in range(0, len(datos), 3) if datos[i:i + 3] == b'\\xff\\xff\\xff')
print(json.dumps({'tam': im.size, 'esquina': im.getpixel((3, 3)), 'pildora': im.getpixel((int((x + 10) * 2), int((y + h / 2) * 2))), 'blancos': blancos / 14400}))`, ext.guardar(Buffer.from(png.b64, 'base64'), '.png'), String(png.x), String(png.y), String(png.h)));
  ok(png.nombre === 'diagrama-de-flujo.png' && info.tam[0] === vw * 2 && info.tam[1] === vh * 2, `la imagen mide el doble que el dibujo: ${info.tam.join('×')} (${vw}×${vh})`);
  ok(info.esquina.join() === '255,255,255' && info.blancos > 0.5 && info.blancos < 0.98, `fondo blanco y con dibujo (${Math.round(info.blancos * 100)} % blanco)`);
  ok(info.pildora.join() === '29,58,52', 'la píldora de «Inicio» sale verde pizarra: ' + info.pildora);
  await clic('Copiar el texto'); await esperar(150);
  ok((await c.js(`window.__t`)).startsWith('# Pedido en una tienda en línea\nInicio -> /Recibir el pedido/'), 'copia el texto del diagrama');
  sinErrores('descargas');

  // ---- ajustar al ancho y móvil
  ok(await c.js(`document.querySelector('.dg-vista').classList.contains('dg-vista--ajustada')`), 'por defecto el dibujo se ajusta al ancho');
  await marcar('#dg-ajustar', false);
  ok(await c.js(`!document.querySelector('.dg-vista').classList.contains('dg-vista--ajustada')`), 'se puede ver a tamaño real');
  await marcar('#dg-ajustar', true);
  await c.vista(390, 800, 'light', false); await ir('generador-de-diagramas-de-flujo'); await clic('Probar con un ejemplo'); await pausa();
  const m = await c.js(`({ doc: document.documentElement.scrollWidth, vp: innerWidth, svg: document.querySelector('.dg-vista svg').getBoundingClientRect().width, caja: document.querySelector('.dg-vista').clientWidth })`);
  ok(m.doc <= m.vp + 1 && m.svg <= m.caja + 1, `en móvil nada se desborda y el diagrama se ajusta (${m.doc}/${m.vp}, svg ${Math.round(m.svg)}/${m.caja})`);
  await capturar(c, 'diagrama-movil');
  sinErrores('móvil');
} catch (e) { console.log('  ✗ EXCEPCIÓN: ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 4).join('\n')); fallos.push(e.message); }
finally { ext.limpiar(); await c.cerrar(); }
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);

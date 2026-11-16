// Generador de códigos de barras en el navegador real: el PNG que se dibuja en el lienzo (con los números debajo) lo lee un lector independiente (OpenCV)
// y el SVG que se descarga se carga como imagen, se rasteriza en Chrome y se lee igual. Code 128 se comprueba contra un descodificador propio hecho en Python.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const dir = fs.mkdtempSync('/tmp/tyj-barras-');
const c = await abrirChrome();
const A = preparar(c);
const { ok, esperar, escribir, elegir, marcar } = A;
const leer = (archivo) => JSON.parse(execFileSync('python3', ['-I', '-c', `
import cv2, json, sys
img = cv2.imread(sys.argv[1], cv2.IMREAD_GRAYSCALE)
h, w = img.shape
import numpy as np
pts = np.array([[[0, 0], [w, 0], [w, h], [0, h]]], dtype=np.float32)
ok, infos, tipos = cv2.barcode.BarcodeDetector().decodeWithType(img, pts)
print(json.dumps({'ok': bool(ok), 'infos': list(infos), 'tipos': list(tipos), 'ancho': w, 'alto': h}))
`, archivo], { encoding: 'utf8' }).trim().split('\n').pop());
const guardar = (nombre, dataUrl) => { const f = dir + '/' + nombre; fs.writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64')); return f; };

try {
  await c.vista(1100, 900, 'light', false);
  const casos = [
    ['ean13', '400638133393', '4006381333931', 'EAN_13'], ['ean13', '5901234123457', '5901234123457', 'EAN_13'], ['ean13', '978030640615', '9780306406157', 'EAN_13'],
    ['ean8', '9638507', '96385074', 'EAN_8'], ['ean8', '55123457', '55123457', 'EAN_8'], ['upca', '03600029145', '036000291452', 'UPC_A'],
  ];
  for (const modulo of ['2', '3', '4']) for (const [tipo, entrada, esperado, tipoCv] of casos) {
    await c.ir(`${base}/herramientas/generador-de-codigos-de-barras/`, 200);
    await elegir('#c-tipo', tipo); await escribir('#c-codigo', entrada); await elegir('#c-modulo', modulo);
    const png = await c.js(`document.querySelector('#cb-lienzo').toDataURL('image/png')`);
    const r = leer(guardar(`${tipo}-${entrada}-${modulo}.png`, png));
    const leido = r.infos[0] || '';
    const igual = r.ok && (tipo === 'ean8' || tipo === 'upca' || tipo === 'ean13' ? leido.padStart(13, '0') === esperado.padStart(13, '0') || leido === esperado : false);
    ok(igual, `${tipo} ${entrada} a ${modulo} px: el PNG del navegador se lee como ${esperado} (OpenCV: «${leido}» ${r.tipos[0] || ''})`);
  }
  // Sin los números debajo y con colores distintos (oscuros sobre claros) también se lee
  await c.ir(`${base}/herramientas/generador-de-codigos-de-barras/`, 200);
  await escribir('#c-codigo', '400638133393'); await marcar('#c-texto', false); await elegir('#c-color', '#102030'); await elegir('#c-fondo', '#f5f5dc');
  let r = leer(guardar('sin-texto.png', await c.js(`document.querySelector('#cb-lienzo').toDataURL('image/png')`)));
  ok(r.ok && r.infos[0] === '4006381333931', `EAN-13 sin números y con colores propios se lee (${r.infos[0]})`);
  // El SVG: se descarga por la ruta real (Blob), se carga como imagen en Chrome y se dibuja en un lienzo
  await c.ir(`${base}/herramientas/generador-de-codigos-de-barras/`, 200);
  await escribir('#c-codigo', '5901234123457');
  const svgPng = await c.js(`(async () => {
    const lib = TH.barras, c = lib.generar('ean13', '5901234123457');
    const svg = lib.aSVG(c, { modulo: 3, alto: 100 });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('El SVG no se carga')); img.src = url; });
    const l = document.createElement('canvas'); l.width = img.naturalWidth; l.height = img.naturalHeight; l.getContext('2d').drawImage(img, 0, 0);
    return { png: l.toDataURL('image/png'), ancho: img.naturalWidth, alto: img.naturalHeight, svg: svg.slice(0, 60) };
  })()`);
  r = leer(guardar('svg.png', svgPng.png));
  ok(r.ok && r.infos[0] === '5901234123457', `el SVG (${svgPng.ancho} × ${svgPng.alto}) rasterizado por Chrome se lee como 5901234123457 (${r.infos[0]})`);
  // Code 128: el módulo de cada barra del lienzo, leído de los píxeles, se descodifica con el descodificador independiente de Python
  for (const [texto, simbolos] of [['ABC123', [104, 33, 34, 35, 17, 18, 19, 67, 106]], ['123456', [105, 12, 34, 56, 44, 106]], ['Hola-Mundo 2026', null]]) {
    await c.ir(`${base}/herramientas/generador-de-codigos-de-barras/`, 200);
    await elegir('#c-tipo', 'code128'); await escribir('#c-codigo', texto); await elegir('#c-modulo', '3'); await marcar('#c-texto', false);
    const filaPx = await c.js(`(() => { const l = document.querySelector('#cb-lienzo'), x = l.getContext('2d'), d = x.getImageData(0, Math.floor(l.height / 2), l.width, 1).data, f = []; for (let i = 0; i < l.width; i++) f.push(d[i * 4] < 128 ? 1 : 0); return f.join(''); })()`);
    const recorte = filaPx.replace(/^0+/, '').replace(/0+$/, '');
    const modulos = recorte.split('').filter((_, i) => i % 3 === 0).join('');      // 3 píxeles por módulo
    const res = JSON.parse(execFileSync('python3', ['-I', '-c', `
import sys, json
sys.path.insert(0, ${JSON.stringify(process.cwd() + '/pruebas')})
from test_barras_lib import decodificar128, texto_de_simbolos
s = decodificar128(sys.argv[1])
print(json.dumps({'simbolos': s, 'texto': texto_de_simbolos(s)}))
`, modulos], { encoding: 'utf8' }).trim().split('\n').pop());
    ok(res.texto === texto && (!simbolos || JSON.stringify(res.simbolos) === JSON.stringify(simbolos)), `Code 128 «${texto}» dibujado en el lienzo se descodifica como «${res.texto}» (${res.simbolos.length} símbolos)`);
  }
  const errores = c.consola();
  ok(errores.length === 0, 'sin errores en la consola' + (errores.length ? ' → ' + errores.slice(0, 2).join(' | ') : ''));
} catch (e) { console.log('  ✗ EXCEPCIÓN: ' + (e && e.stack || e)); A.fallos.push(String(e)); }
finally { await c.cerrar(); fs.rmSync(dir, { recursive: true, force: true }); }
console.log(A.fallos.length ? `\n${A.fallos.length} fallos` : '\nTodo bien');
process.exit(A.fallos.length ? 1 : 0);

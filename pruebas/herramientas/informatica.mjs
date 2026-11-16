// Herramientas de informática que necesitan navegador real: UUID (aleatoriedad y reloj simulados, comprobados contra el módulo uuid de Python),
// hashes con textos grandes (contra hashlib), minificador (el mismo HTML+CSS+JS de páginas reales del sitio, antes y después: texto, cajas y estilos calculados)
// y QR Wi-Fi (PNG decodificado con OpenCV y campos recuperados con un lector independiente).
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
import fs from 'node:fs';
import path from 'node:path';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, escribir, elegir, marcar, clic, texto, valor, k, kt, hastaQue, entregas, esperarEntregas, reiniciarEntregas, ext } = A;
const ir = async (s) => { await c.ir(`${base}/herramientas/${s}/`, 500); await reiniciarEntregas(); await hastaQue(() => c.js(`!document.querySelector('#herr-carga') && !!document.querySelector('#herr input, #herr select, #herr textarea')`)); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
const py = (codigo, ...args) => JSON.parse(ext.python(codigo, ...args));
const salida = () => valor('#t-salida');
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

try {
  await c.vista(1100, 900, 'light', false);

  // ============================================================ UUID
  console.log('GENERADOR DE UUID');
  await ir('generador-uuid');
  const ESPERA_V4 = py(`import json, uuid
n = 5
print(json.dumps([str(uuid.UUID(bytes=bytes((16 * k + j) & 255 for j in range(16)), version=4)) for k in range(n)]))`);
  // aleatoriedad simulada: cada llamada rellena con una secuencia 0, 1, 2…
  await c.js(`window.__n = 0; crypto.getRandomValues = (a) => { for (let i = 0; i < a.length; i++) a[i] = (window.__n++) & 255; return a; }; 0`);
  await clic('Generar otros');
  ok(await salida() === ESPERA_V4.join('\n'), 'v4 con bytes conocidos (0,1,2…): los bits de versión y variante coinciden con Python: ' + (await salida()).split('\n')[0]);
  ok(py(`import uuid; u = uuid.UUID('${ESPERA_V4[0]}'); import json; print(json.dumps([u.version, str(u.variant)]))`).join() === '4,specified in RFC 4122', 'Python confirma versión 4 y variante RFC 4122');
  // los formatos reescriben el mismo lote
  await elegir('#c-formato', 'sin');
  ok(await salida() === ESPERA_V4.map((u) => u.replace(/-/g, '')).join('\n'), 'sin guiones: mismo lote');
  await elegir('#c-formato', 'llaves'); await marcar('#c-mayusculas', true);
  ok(await salida() === ESPERA_V4.map((u) => '{' + u.toUpperCase() + '}').join('\n'), 'llaves y mayúsculas: mismo lote');
  await elegir('#c-formato', 'std'); await marcar('#c-mayusculas', false);
  ok(await salida() === ESPERA_V4.join('\n') && await c.js('window.__n') === 80, 'volver al formato estándar no genera nada nuevo (se consumieron 80 bytes: 5 UUID de 16)');
  await clic('Generar otros');
  ok(await salida() !== ESPERA_V4.join('\n') && await c.js('window.__n') === 160, '«Generar otros» sí crea un lote nuevo');
  // versión 7 con reloj fijo
  const T0 = 1700000000000;
  await c.js(`TH.ahora = () => ${T0}; 0`);
  await elegir('#c-version', '7'); await escribir('#c-cantidad', '3');
  await c.js(`window.__n = 0; 0`); await clic('Generar otros');
  const V7 = py(`import json, uuid
ms = ${T0}; res = []; cont = None
for k in range(3):
    r = bytes((10 * k + j) & 255 for j in range(10))
    cont = ((r[0] << 8 | r[1]) & 0x7ff) if cont is None else cont + 1
    b = ms.to_bytes(6, 'big') + bytes([0x70 | (cont >> 8), cont & 255, 0x80 | (r[2] & 63)]) + r[3:]
    u = uuid.UUID(bytes=b); assert u.version == 7 and u.variant == uuid.RFC_4122
    res.append(str(u))
print(json.dumps(res))`);
  ok(await salida() === V7.join('\n'), 'v7 con reloj y bytes conocidos: ' + (await salida()).split('\n').join(' · '));
  ok(await kt('marca') === '2023-11-14T22:13:20.000Z', 'la fecha incrustada del primero es 2023-11-14T22:13:20.000Z: ' + await kt('marca'));
  // restaurar azar y reloj reales
  await c.js(`delete crypto.getRandomValues; 0`);
  await ir('generador-uuid');
  for (const v of ['4', '7']) {
    await elegir('#c-version', v); await escribir('#c-cantidad', '1000');
    const lineas = (await salida()).split('\n');
    ok(lineas.length === 1000 && new Set(lineas).size === 1000, `v${v}: 1000 UUID distintos`);
    const bien = py(`import sys, json, uuid
l = json.load(open(sys.argv[1])); print(json.dumps([all(uuid.UUID(x).version == ${v} and uuid.UUID(x).variant == uuid.RFC_4122 for x in l), l == sorted(l)]))`, ext.guardar(Buffer.from(JSON.stringify(lineas)), '.json'));
    ok(bien[0], `v${v}: Python reconoce versión ${v} y variante RFC 4122 en los 1000`);
    if (v === '7') ok(bien[1] && new Set(lineas).size === 1000, 'v7: los 1000 salen en orden estrictamente creciente');
    else ok(!bien[1], 'v4: salen en orden aleatorio');
  }
  await clic('Copiar resultado');
  ok(await c.js(`TH.ultimoCopiado`) === await salida(), 'Copiar resultado copia todos los UUID');
  sinErrores('uuid');

  // ============================================================ HASHES con un texto grande
  console.log('HASHES');
  await ir('generador-de-hashes');
  const grande = ('Línea ñandú ✓ ' + 'x'.repeat(86) + '\n').repeat(1000);   // ~100 KB
  const t0 = Date.now();
  await c.js(`(() => { const t = document.querySelector('#c-texto'); t.value = ${JSON.stringify(grande)}; t.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await hastaQue(async () => (await k('sha512')).length === 128, 20000);
  const ms = Date.now() - t0;
  const esp = py(`import sys, json, hashlib
t = open(sys.argv[1], 'rb').read()
print(json.dumps({a: hashlib.new(a, t).hexdigest() for a in ('md5', 'sha1', 'sha256', 'sha384', 'sha512')}))`, ext.guardar(Buffer.from(grande), '.txt'));
  const got = {}; for (const a of Object.keys(esp)) got[a] = await kt(a);
  ok(Object.keys(esp).every((a) => got[a] === esp[a]), `texto de ${grande.length} caracteres: los cinco hashes coinciden con hashlib (${ms} ms)`);
  ok(ms < 5000, 'se calcula en un tiempo razonable: ' + ms + ' ms');
  sinErrores('hashes');

  // ============================================================ MINIFICADOR: páginas reales antes y después
  console.log('MINIFICADOR EN PÁGINAS REALES');
  await ir('minificador-de-html-css-y-javascript');
  const dist = path.join(RAIZ, 'dist');
  const listar = (d) => fs.existsSync(path.join(dist, d)) ? fs.readdirSync(path.join(dist, d)).filter((x) => fs.existsSync(path.join(dist, d, x, 'index.html'))).map((x) => `/${d}/${x}/`) : [];
  const ALEATORIAS = /lorem|uuid|cuenta-atras|cronometro|temporizador|pomodoro|aleatori|contrasena|sorteo|dado|equipos|nombres|grabadora|bloc-de-notas|mecanografia|calculadora-de-edad|dias-entre|dias-laborables|semanas|vacaciones|planificador|calendario|dias-que-faltan|horas-trabajadas/;
  let paginas = ['/'].concat(listar('legal'), listar('recursos'), listar('herramientas').filter((p) => !ALEATORIAS.test(p)), ['/juegos/tres-en-raya/', '/juegos/torre-de-hanoi/', '/juegos/test-de-clics/']);
  paginas = paginas.filter((p) => fs.existsSync(path.join(dist, p, 'index.html')));
  console.log(`  ${paginas.length} páginas`);
  await c.js(`window.__equiv = async (url, ancho) => {
    const Mi = TH.minificar;
    const html = await (await fetch(url)).text();
    window.__css = window.__css || {};
    const css = async (href) => { const u = new URL(href, location.origin + url).href; if (!(u in window.__css)) window.__css[u] = (await (await fetch(u)).text()).replace(/url\\(\\s*(['"]?)(?!data:|https?:|\\/\\/|#)([^'")]+)\\1\\s*\\)/g, (m, q, r) => 'url(' + q + new URL(r, u).href + q + ')'); return window.__css[u]; };
    const enlaces = [...html.matchAll(/<link\\b[^>]*>/gi)].map((m) => m[0]).filter((l) => /rel=["']?stylesheet/i.test(l));
    const incrustar = async (h, min) => { let r = h; for (const l of enlaces) { let t = await css(/href=["']?([^"'\\s>]+)/i.exec(l)[1]); if (min) t = Mi.css(t).salida; r = r.replace(l, () => '<style>' + t + '</style>'); } return r; };
    const base = (h) => h.replace(/<head[^>]*>/i, (m) => m + '<base href="' + location.origin + url + '">');
    const original = base(await incrustar(html, false)), r = Mi.html(await incrustar(html, true)), minificado = base(r.salida);
    const cargar = (h) => new Promise((res) => { const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:0;top:0;width:' + ancho + 'px;height:900px;border:0;visibility:hidden'; f.onload = () => res(f); f.srcdoc = h; document.body.appendChild(f); });
    const medir = async (f) => {
      const d = f.contentDocument; for (let i = 0; i < 40 && (d.querySelector('#herr-carga')); i++) await new Promise((r) => setTimeout(r, 100));
      await new Promise((r) => setTimeout(r, 150));
      const cajas = [], estilos = [], props = ['color', 'background-color', 'font-size', 'font-weight', 'font-family', 'line-height', 'margin-top', 'margin-bottom', 'padding-left', 'padding-top', 'display', 'position', 'border-top-width', 'border-top-color', 'text-decoration-line', 'opacity', 'z-index', 'width', 'height', 'overflow-x', 'grid-template-columns', 'flex-direction', 'gap', 'box-shadow', 'text-transform', 'letter-spacing', 'visibility', 'content'];
      d.querySelectorAll('body *').forEach((e) => { const b = e.getBoundingClientRect(), cs = f.contentWindow.getComputedStyle(e); cajas.push(e.tagName + ' ' + [b.x, b.y, b.width, b.height].map((x) => Math.round(x * 10) / 10).join(',')); estilos.push(props.map((p) => cs.getPropertyValue(p)).join('|')); });
      return { texto: d.body.innerText, cajas, estilos, n: d.querySelectorAll('*').length, hojas: d.styleSheets.length };
    };
    const a = await cargar(original), b = await cargar(minificado), ma = await medir(a), mb = await medir(b);
    a.remove(); b.remove();
    let dif = null;
    if (ma.texto !== mb.texto) dif = 'texto';
    else if (ma.cajas.length !== mb.cajas.length) dif = 'número de elementos ' + ma.cajas.length + ' / ' + mb.cajas.length;
    else { for (let i = 0; i < ma.cajas.length && !dif; i++) { if (ma.cajas[i] !== mb.cajas[i]) dif = 'caja ' + i + ': ' + ma.cajas[i] + ' ≠ ' + mb.cajas[i]; else if (ma.estilos[i] !== mb.estilos[i]) dif = 'estilo ' + i + ' ' + ma.cajas[i]; } }
    return { dif, elementos: ma.n, ant: original.length, des: minificado.length, avisos: r.avisos, idem: Mi.html(r.salida).salida === r.salida };
  }; 0`);
  let totalAnt = 0, totalDes = 0, malas = [];
  for (const ancho of [1100, 380]) {
    for (const p of paginas) {
      const r = await c.js(`window.__equiv(${JSON.stringify(p)}, ${ancho})`);
      if (ancho === 1100) { totalAnt += r.ant; totalDes += r.des; }
      if (r.dif || r.avisos.length || !r.idem) malas.push(`${p} (${ancho} px): ${r.dif || ''} ${r.avisos.join(' ')} ${r.idem ? '' : 'no idempotente'}`);
    }
  }
  ok(malas.length === 0, `${paginas.length} páginas × 2 anchos: texto, cajas y estilos calculados idénticos tras minificar HTML, CSS y JS incrustados` + (malas.length ? ' → ' + malas.slice(0, 6).join(' | ') : ''));
  ok(totalDes < totalAnt * 0.9, `el HTML+CSS incrustado pesa un ${Math.round(100 * (1 - totalDes / totalAnt))} % menos (${totalAnt} → ${totalDes})`);
  sinErrores('minificador');

  // ============================================================ QR WI-FI
  console.log('QR WI-FI');
  await ir('generador-de-codigo-qr-wifi');
  const leer = (buf) => py(`import sys, json, cv2
im = cv2.imread(sys.argv[1]); res = None
for det in (cv2.QRCodeDetectorAruco(), cv2.QRCodeDetector()):
    t, pts, _ = det.detectAndDecode(im)
    if t: res = t; break
print(json.dumps({'texto': res, 'alto': im.shape[0], 'ancho': im.shape[1]}))`, ext.guardar(buf, '.png'));
  const lector = (txt) => py(`import sys, json
# lector independiente del formato WIFI: (separa en los ; sin escapar y quita las barras de los valores)
t = json.loads(sys.argv[1]); assert t.startswith('WIFI:') and t.endswith(';;'), t
partes, cur, esc = [], '', False
for ch in t[5:]:
    if esc: cur += '\\\\' + ch; esc = False
    elif ch == '\\\\': esc = True
    elif ch == ';': partes.append(cur); cur = ''
    else: cur += ch
partes.append(cur)
campos = {}
for p in partes:
    if not p: continue
    k, v = p.split(':', 1)
    out, i = '', 0
    while i < len(v):
        if v[i] == '\\\\' and i + 1 < len(v): out += v[i + 1]; i += 2
        else: out += v[i]; i += 1
    campos[k] = out
print(json.dumps(campos))`, JSON.stringify(txt));
  const casos = [
    { ssid: 'MiCasa', clave: 'clave1234', t: 'WPA', oculta: false },
    { ssid: 'Cañas y Tapas 🍻', clave: 'contraseña-ñ-2026', t: 'WPA', oculta: true },
    { ssid: 'Bar "El; Rincón": 1,2\\3', clave: 'p@ss;word:\\test,"x"', t: 'WPA', oculta: false },
    { ssid: 'Red libre', clave: '', t: 'nopass', oculta: false },
    { ssid: 'vieja', clave: 'abcde', t: 'WEP', oculta: false },
    { ssid: 'n'.repeat(32), clave: 'a'.repeat(63), t: 'WPA', oculta: true },
    { ssid: 'Oficina-5G', clave: ('Zx9#' + 'k'.repeat(40)), t: 'WPA', oculta: false },
  ];
  for (const nivel of ['M', 'H']) {
    for (const cs of casos) {
      await ir('generador-de-codigo-qr-wifi');
      await elegir('#c-seguridad', cs.t); await escribir('#c-ssid', cs.ssid); if (cs.t !== 'nopass') await escribir('#c-clave', cs.clave);
      await marcar('#c-oculta', cs.oculta); await elegir('#c-nivel', nivel);
      await reiniciarEntregas(); await clic('Descargar PNG');
      const e = esperarEntregas(15000) && (await entregas())[0];
      const q = e ? leer(e.buf) : { texto: null };
      const campos = q.texto ? lector(q.texto) : {};
      const esperado = Object.assign({ T: cs.t, S: cs.ssid }, cs.t === 'nopass' ? {} : { P: cs.clave }, cs.oculta ? { H: 'true' } : {});
      ok(e && e.nombre === 'codigo-qr-wifi.png' && q.ancho === 1024 && q.alto === 1024 && JSON.stringify(campos, Object.keys(campos).sort()) === JSON.stringify(esperado, Object.keys(esperado).sort()),
        `nivel ${nivel}, ${cs.t}, «${cs.ssid.slice(0, 18)}»: OpenCV lee el PNG y un lector independiente recupera ${JSON.stringify(Object.keys(campos))}` + (JSON.stringify(campos) !== JSON.stringify(esperado) && JSON.stringify(campos).length < 300 ? ' → ' + JSON.stringify(campos) : ''));
    }
  }
  await ir('generador-de-codigo-qr-wifi');
  await escribir('#c-ssid', 'MiCasa'); await escribir('#c-clave', 'clave1234');
  await reiniciarEntregas(); await clic('Descargar SVG'); esperarEntregas(10000);
  const svg = Buffer.from((await entregas())[0].buf).toString('utf8');
  ok(svg.includes('<svg') && svg.includes('xmlns="http://www.w3.org/2000/svg"') && !svg.includes('<script'), 'SVG válido y sin scripts');
  await clic('Copiar el texto del código');
  ok(await c.js(`TH.ultimoCopiado`) === 'WIFI:T:WPA;S:MiCasa;P:clave1234;;', 'Copiar el texto del código copia el texto real (con la contraseña)');
  ok(!(await texto('[data-k=contenido]')).includes('clave1234') && (await texto('[data-k=contenido]')).includes('••••••'), 'con la contraseña oculta, el texto mostrado la enmascara');
  await marcar('#c-ver', true);
  ok((await texto('[data-k=contenido]')).includes('clave1234') && await c.js(`document.querySelector('#c-clave').type`) === 'text', 'al mostrar la contraseña, se ve en el campo y en el texto');
  await c.vista(380, 800, 'light', true);
  ok(await c.js(`document.documentElement.scrollWidth <= window.innerWidth`), 'en móvil no hay desplazamiento horizontal');
  await c.vista(1100, 900, 'light', false);
  sinErrores('qr wifi');
} catch (e) {
  console.log('  ✗ Excepción: ' + (e && e.stack || e)); fallos.push('excepción');
} finally {
  ext.limpiar();
  await c.cerrar();
}
console.log(fallos.length ? `\n${fallos.length} fallos:\n- ` + fallos.join('\n- ') : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);

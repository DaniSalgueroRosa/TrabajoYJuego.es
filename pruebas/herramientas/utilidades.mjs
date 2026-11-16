// Utilidades que necesitan navegador real y azar o reloj controlados: lanzador de dados (valores forzados y rangos), test de mecanografía (reloj simulado,
// expectativas calculadas en Python), bloc de notas (descarga, fecha, deshacer, aviso al cerrar, ausencia de almacenamiento) y contraseñas (reparto de caracteres).
import { abrirChrome } from '../cdp.mjs';
import { preparar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const A = preparar(c);
const { fallos, ok, esperar, escribir, elegir, marcar, clic, texto, valor, k, kt, hastaQue, ext } = A;
const ir = async (s) => { await c.ir(`${base}/herramientas/${s}/`, 500); await hastaQue(() => c.js(`!document.querySelector('#herr-carga') && !!document.querySelector('#herr input, #herr select, #herr textarea')`), 8000); await hastaQue(() => c.js(`!!(window.TH && TH.azar)`), 4000).catch(() => {}); };
const sinErrores = (t) => ok(c.consola().length === 0, `${t}: sin errores en la consola` + (c.consola().length ? ' → ' + c.consola().join(' | ') : ''));
const py = (codigo, ...args) => JSON.parse(ext.python(codigo, ...args));
const q = (s) => JSON.stringify(s);

/* Fuerza los resultados de TH.azar: cada valor de la cola se entrega como el entero de 32 bits que devuelve esa tirada (para entero(n) con n pequeño: valor % n) */
const forzar = (cola) => c.js(`window.__cola = ${JSON.stringify(cola)}; TH.azar.fuente = (b) => { const v = window.__cola.shift(); if (v === undefined) throw new Error('cola agotada'); b[0] = (v >>> 24) & 255; b[1] = (v >>> 16) & 255; b[2] = (v >>> 8) & 255; b[3] = v & 255; return b; }; 0`);

try {
  await c.vista(1100, 900, 'light', false);

  // ============================================================ LANZADOR DE DADOS
  console.log('LANZADOR DE DADOS');
  await ir('lanzador-de-dados');
  ok((await texto('.herr-vacio')).includes('pulsa Lanzar'), 'al abrir: invita a lanzar y no hay resultados');
  await elegir('#c-dado', '6'); await escribir('#c-cantidad', '2'); await escribir('#c-modificador', '2');
  await forzar([2, 4]); await clic('Lanzar');
  ok(await kt('dados') === '3 + 5' && await k('suma') === '8' && await kt('modificador') === '+2' && await k('total') === '10' && await kt('historial') === '10', 'dos d6 forzados a 3 y 5 con +2: suma 8, total 10');
  ok(await c.js(`document.querySelectorAll('.dado').length`) === 2, 'se dibujan 2 dados');
  ok(await c.js(`document.querySelector('.dado[aria-label="Dado 1: 3"]').querySelectorAll('i.on').length`) === 3 && await c.js(`document.querySelector('.dado[aria-label="Dado 2: 5"]').querySelectorAll('i.on').length`) === 5, 'las caras del d6 tienen tantos puntos como su valor (3 y 5)');
  await escribir('#c-modificador', '0');
  await forzar([0, 0]); await clic('Lanzar');
  ok(await k('total') === '2' && await kt('historial') === '2 · 10' && !(await c.js(`!!document.querySelector('[data-k=modificador]')`)), 'sin modificador no hay fila de modificador; el historial pone lo más reciente primero');
  for (let v = 1; v <= 6; v++) {
    await escribir('#c-cantidad', '1'); await forzar([v - 1]); await clic('Lanzar');
    ok(await k('suma') === String(v) && await c.js(`document.querySelectorAll('.dado i.on').length`) === v, `d6 forzado a ${v}: suma ${v} y ${v} puntos`);
  }
  await elegir('#c-dado', '20'); await escribir('#c-cantidad', '1');
  await forzar([19]); await clic('Lanzar');
  ok(await k('total') === '20' && (await kt('nota')).includes('20 natural') && await c.js(`document.querySelector('.dado-num').textContent`) === '20' && await c.js(`document.querySelector('.dado-tipo').textContent`) === 'd20', 'd20 con el máximo: 20 y nota de máximo');
  await forzar([0]); await clic('Lanzar');
  ok(await k('total') === '1' && (await kt('nota')).includes('1 natural'), 'd20 con el mínimo: 1 y nota de mínimo');
  await forzar([9]); await clic('Lanzar');
  ok(await k('total') === '10' && !(await c.js(`!!document.querySelector('[data-k=nota]')`)), 'd20 con un valor intermedio: sin nota');
  await elegir('#c-dado', '100'); await forzar([99]); await clic('Lanzar');
  ok(await k('total') === '100', 'd100 con el máximo: 100');
  await elegir('#c-dado', '4'); await escribir('#c-cantidad', '3'); await escribir('#c-modificador', '-1');
  await forzar([3, 3, 3]); await clic('Lanzar');
  ok(await kt('dados') === '4 + 4 + 4' && await kt('modificador') === '−1' && await k('total') === '11', 'tres d4 con modificador negativo: 12 − 1 = 11');
  // límites
  for (const [campo, valorMal, trozo] of [['#c-cantidad', '21', 'de 1 a 20'], ['#c-cantidad', '0', 'de 1 a 20'], ['#c-cantidad', '2,5', 'de 1 a 20'], ['#c-modificador', '101', 'de -100 a 100'], ['#c-modificador', '1,5', 'de -100 a 100'], ['#c-modificador', 'abc', 'de -100 a 100']]) {
    await escribir('#c-cantidad', '2'); await escribir('#c-modificador', '0'); await escribir(campo, valorMal); await clic('Lanzar');
    ok((await texto('.herr-estado--aviso')).includes(trozo) && await c.js(`document.querySelectorAll('.dado').length`) === 0, `${campo} = «${valorMal}»: aviso y no se lanza nada`);
  }
  await escribir('#c-modificador', '100'); await escribir('#c-cantidad', '20'); await elegir('#c-dado', '6');
  await c.js(`delete TH.azar.fuente; 0`).catch(() => {});
  // historial limitado a 10 y rangos con el azar real
  await c.ir(`${base}/herramientas/lanzador-de-dados/`, 600);
  let fuera = 0, ultimo = '';
  await elegir('#c-dado', '100'); await escribir('#c-cantidad', '20');
  const vistos = new Set();
  for (let i = 0; i < 12; i++) {
    await clic('Lanzar');
    const dados = (await kt('dados')).split(' + ').map(Number);
    if (dados.length !== 20 || dados.some((x) => !(x >= 1 && x <= 100))) fuera++;
    dados.forEach((x) => vistos.add(x));
    const suma = dados.reduce((a, b) => a + b, 0);
    if (String(suma) !== await k('suma') || String(suma) !== await k('total')) fuera++;
    ultimo = await kt('historial');
  }
  ok(fuera === 0, '12 tiradas de 20d100 con azar real: todos los dados entre 1 y 100 y la suma cuadra');
  ok(ultimo.split(' · ').length === 10, 'el historial guarda como mucho 10 totales');
  ok(vistos.size > 70 && vistos.size < 100, `240 dados de 100 caras dan variedad real: se esperan unos 91 valores distintos y salen ${vistos.size}`);
  await elegir('#c-dado', '6'); await escribir('#c-modificador', '0');
  const conteo = new Array(7).fill(0);
  for (let i = 0; i < 10; i++) { await escribir('#c-cantidad', '20'); await clic('Lanzar'); (await kt('dados')).split(' + ').forEach((x) => conteo[+x]++); }
  const esperado = 200 / 6; const chi = conteo.slice(1).reduce((s, n) => s + (n - esperado) ** 2 / esperado, 0);
  ok(chi < 20.5, `200 lanzamientos de d6: reparto uniforme (chi² = ${chi.toFixed(1)} con 5 grados de libertad; el límite del 0,1 % es 20,5): ${conteo.slice(1).join(', ')}`);
  await c.vista(380, 800, 'light', true);
  ok(await c.js(`document.documentElement.scrollWidth <= window.innerWidth`), 'en móvil no hay desplazamiento horizontal');
  await c.vista(1100, 900, 'light', false);
  sinErrores('dados');

  // ============================================================ TEST DE MECANOGRAFÍA
  console.log('TEST DE MECANOGRAFÍA');
  const TXT = 'El sol sale por el este y se pone por el oeste cada día.';
  const esperadoMec = (escrito, texto, tildes, seg) => py(`import json, math, sys, unicodedata
txt, esc, tildes, seg = sys.argv[1], sys.argv[2], sys.argv[3] == '1', float(sys.argv[4])
def st(c): return unicodedata.normalize('NFC', ''.join(x for x in unicodedata.normalize('NFD', c) if x not in '\\u0300\\u0301\\u0308'))
ig = (lambda a, b: a == b) if tildes else (lambda a, b: st(a) == st(b))
esc = esc[:len(txt)]
ok_ = sum(1 for i in range(min(len(esc), len(txt))) if ig(esc[i], txt[i]))
s = max(1.0, seg); r = lambda x: int(math.floor(x + 0.5))
netas = r(ok_ / 5 / (s / 60)); brutas = r(len(esc) / 5 / (s / 60)); prec = ok_ / len(esc) * 100 if esc else 0
niv = 'Principiante' if netas < 20 else 'Normal' if netas < 35 else 'Rápido' if netas < 50 else 'Muy rápido' if netas < 70 else 'Profesional'
print(json.dumps({'ppm': netas, 'brutas': brutas, 'prec': ('%.1f' % prec).replace('.', ',').replace(',0', '') + ' %', 'errores': len(esc) - ok_, 'escritos': len(esc), 'nivel': niv}))`, texto, escrito, tildes ? '1' : '0', String(seg));
  const ponerTexto = async (t) => { await elegir('#c-origen', 'propio'); await escribir('#c-propio', t); };
  const reloj = (ms) => c.js(`window.__t = ${ms}; TH.ahora = () => window.__t; 0`);
  const tipear = (t) => c.js(`(() => { const e = document.querySelector('#m-entrada'); e.focus(); e.setSelectionRange(e.value.length, e.value.length); })()`).then(() => c.enviar('Input.insertText', { text: t })).then(() => esperar(80));
  const comprobarRes = async (esc, tildes, seg, etiqueta) => {
    const e = esperadoMec(esc, TXT, tildes, seg);
    const real = { ppm: await k('ppm'), brutas: await k('brutas'), prec: (await kt('precision')), errores: await k('errores'), escritos: await k('escritos'), nivel: await kt('nivel') };
    ok(real.ppm === String(e.ppm) && real.brutas === String(e.brutas) && real.prec === e.prec && real.errores === String(e.errores) && real.escritos === String(e.escritos) && real.nivel === e.nivel,
      `${etiqueta}: ${JSON.stringify(real)} = esperado ${JSON.stringify(e)}`);
  };
  await ir('test-de-mecanografia');
  const frases = await c.js(`document.querySelector('#m-objetivo').textContent`);
  ok(frases.length > 100 && await k('tiempo') === '60', 'al abrir hay un texto al azar y 60 s de reloj');
  const TEXTOS_VISTOS = new Set();
  for (let i = 0; i < 8; i++) { await clic('Reiniciar con otro texto'); const t = await c.js(`document.querySelector('#m-objetivo').textContent`); TEXTOS_VISTOS.add(t); }
  ok(TEXTOS_VISTOS.size >= 3, `Reiniciar cambia de texto (${TEXTOS_VISTOS.size} distintos en 8 reinicios)`);
  let previo = await c.js(`document.querySelector('#m-objetivo').textContent`), repetidos = 0;
  for (let i = 0; i < 15; i++) { await clic('Reiniciar con otro texto'); const t = await c.js(`document.querySelector('#m-objetivo').textContent`); if (t === previo) repetidos++; previo = t; }
  ok(repetidos === 0, 'nunca repite el mismo texto dos veces seguidas');

  await ponerTexto(TXT);
  ok(await c.js(`document.querySelector('#m-objetivo').textContent`) === TXT && await c.js(`!document.querySelector('#m-entrada').disabled`), 'con texto propio se muestra exactamente ese texto');
  // 1) todo bien en 20 s
  await reloj(1000000); await tipear('E'); await reloj(1020000); await tipear(TXT.slice(1));
  await comprobarRes(TXT, true, 20, 'texto completo y perfecto en 20 s');
  ok(await c.js(`document.querySelector('#m-entrada').readOnly`), 'al terminar el cuadro queda de solo lectura');
  // 2) con errores
  await clic('Reiniciar con otro texto'); await reloj(5000); await tipear('E'); await reloj(35000);
  const MAL = 'El sol sale por el estx y se pone pxr el oeste cada dia.';
  await tipear(MAL.slice(1));
  await comprobarRes(MAL, true, 30, 'dos letras mal y una tilde: errores sin corregir');
  // 3) sin exigir tildes
  await marcar('#c-tildes', false); await reloj(0); await tipear('E'); await reloj(40000);
  await tipear('l sol sale por el este y se pone por el oeste cada dia.');
  await comprobarRes('El sol sale por el este y se pone por el oeste cada dia.', false, 40, 'sin exigir tildes: «dia» vale como «día»');
  await marcar('#c-tildes', true);
  // 4) tiempo agotado a mitad del texto
  await reloj(100); await tipear('El sol sale'); await reloj(100 + 30000);
  ok((await k('vivo')) !== null, 'el contador en vivo existe mientras se escribe');
  await reloj(100 + 61000); await hastaQue(async () => (await k('ppm')) !== null, 2500);
  const e4 = esperadoMec('El sol sale', TXT, true, 60);
  ok(await k('ppm') === String(e4.ppm) && await k('escritos') === '11' && await kt('segundos') === '60 s', `se acaba el tiempo con 11 caracteres: ${await k('ppm')} ppm en 60 s`);
  // 5) terminar ahora
  await clic('Reiniciar con otro texto'); await reloj(0); await tipear('El sol sale por'); await reloj(10000); await tipear(' el');
  ok(await k('vivo') === String(esperadoMec('El sol sale por el', TXT, true, 10).ppm), 'palabras por minuto en vivo con 10 s transcurridos');
  await clic('Terminar ahora');
  const e5 = esperadoMec('El sol sale por el', TXT, true, 10);
  ok(await k('ppm') === String(e5.ppm) && await kt('segundos') === '10 s' && await k('escritos') === '18', 'Terminar ahora cierra con el tiempo transcurrido (10 s)');
  // 6) cuenta atrás visible
  await clic('Reiniciar con otro texto'); await reloj(0); await tipear('E'); await reloj(12400); await esperar(500);
  ok(await k('tiempo') === '48', 'cuenta atrás: a los 12,4 s quedan 48 s (redondeo hacia arriba)');
  // 7) otra duración
  await elegir('#c-duracion', '30');
  ok(await k('tiempo') === '30' && await c.js(`document.querySelector('#m-entrada').value`) === '', 'cambiar la duración reinicia la prueba con 30 s');
  // 8) pegar y Enter
  const bloqueos = await c.js(`(() => { const e = document.querySelector('#m-entrada'); const p = new ClipboardEvent('paste', { bubbles: true, cancelable: true }); e.dispatchEvent(p); const d = new Event('drop', { bubbles: true, cancelable: true }); e.dispatchEvent(d); const n = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }); e.dispatchEvent(n); return [p.defaultPrevented, d.defaultPrevented, n.defaultPrevented]; })()`);
  ok(bloqueos.every(Boolean), 'pegar, soltar y Enter están bloqueados');
  // 9) texto propio demasiado corto o largo
  await elegir('#c-origen', 'propio'); await escribir('#c-propio', 'muy corto');
  ok((await texto('.herr-estado--aviso')).includes('entre 20 y 2.000') && await c.js(`document.querySelector('#m-entrada').disabled`), 'texto propio de menos de 20 caracteres: aviso y no se puede escribir');
  await escribir('#c-propio', 'a'.repeat(2001));
  ok((await texto('.herr-estado--aviso')).includes('entre 20 y 2.000'), 'texto propio de más de 2.000 caracteres: aviso');
  await escribir('#c-propio', 'Primera línea del texto.\n\n   Segunda   línea con espacios.');
  ok(await c.js(`document.querySelector('#m-objetivo').textContent`) === 'Primera línea del texto. Segunda línea con espacios.', 'el texto propio se normaliza: saltos y espacios dobles pasan a un espacio');
  // 10) marcado de aciertos y errores
  await elegir('#c-origen', 'propio'); await escribir('#c-propio', TXT); await reloj(0); await tipear('El sxl');
  const marcas = await c.js(`(() => { const s = [...document.querySelectorAll('#m-objetivo span')]; return s.slice(0, 7).map(x => x.className).join(' '); })()`);
  ok(marcas === 'mc-ok mc-ok mc-ok mc-ok mc-mal mc-ok mc-actual', 'los caracteres se marcan: bien, mal y el actual: ' + marcas);
  await c.vista(380, 800, 'light', true);
  ok(await c.js(`document.documentElement.scrollWidth <= window.innerWidth`), 'en móvil no hay desplazamiento horizontal');
  await c.vista(1100, 900, 'light', false);
  sinErrores('mecanografía');

  // ============================================================ BLOC DE NOTAS
  console.log('BLOC DE NOTAS');
  await ir('bloc-de-notas-online');
  await c.js(`window.__dl = []; TH.descargar = (d, n, m) => window.__dl.push({ d, n, m }); 0`);
  ok(await kt('palabras') === '0 palabras' && await kt('lineas') === '0 líneas', 'al abrir: 0 palabras, 0 caracteres y 0 líneas');
  await elegir('#b-nota', 'Hola mundo, esto es “una nota” de prueba.\nSegunda línea con ñandú y 😀.');
  const cuenta = py(`import json, re
t = 'Hola mundo, esto es “una nota” de prueba.\\nSegunda línea con ñandú y 😀.'
print(json.dumps([len(re.findall(r"[^\\W_]+(?:['’\\-][^\\W_]+)*", t)), len(t), len(t.split('\\n'))]))`);
  ok(await k('palabras') === String(cuenta[0]) && await k('caracteres') === String(cuenta[1]) && await k('lineas') === String(cuenta[2]), `contadores: ${cuenta[0]} palabras, ${cuenta[1]} caracteres, ${cuenta[2]} líneas (el emoji cuenta como 1)`);
  await clic('Descargar');
  let dl = await c.js(`window.__dl[0]`);
  ok(dl && dl.n === 'nota.txt' && dl.m === 'text/plain;charset=utf-8' && dl.d === 'Hola mundo, esto es “una nota” de prueba.\nSegunda línea con ñandú y 😀.', 'descarga nota.txt con el texto exacto');
  await escribir('#c-nombre', 'mi diario: hoy/ayer'); await elegir('#c-formato', 'md'); await clic('Descargar');
  dl = await c.js(`window.__dl[1]`);
  ok(dl && dl.n === 'mi diario- hoy-ayer.md' && dl.m === 'text/markdown;charset=utf-8', 'nombre con caracteres no válidos saneado y formato .md: ' + (dl && dl.n));
  await escribir('#c-nombre', 'informe.final.txt'); await clic('Descargar');
  dl = await c.js(`window.__dl[2]`);
  ok(dl && dl.n === 'informe.final.md', 'una extensión escrita a mano no se duplica: ' + (dl && dl.n));
  await escribir('#c-nombre', ''); await clic('Descargar');
  dl = await c.js(`window.__dl[3]`);
  ok(dl && dl.n === 'nota.md', 'sin nombre usa «nota»');
  // fecha
  await reloj(Date.UTC(2026, 10, 14, 12, 7, 0));
  await elegir('#b-nota', 'Hoy: Fin.');
  await c.js(`(() => { const e = document.querySelector('#b-nota'); e.focus(); e.setSelectionRange(5, 5); })()`);
  await clic('Insertar fecha y hora');
  const conFecha = await valor('#b-nota');
  ok(/^Hoy: 1[34]\/11\/2026 \d\d:\d\dFin\.$/.test(conFecha), 'la fecha se inserta en la posición del cursor: «' + conFecha + '»');
  ok(await c.js(`document.activeElement.id`) === 'b-nota', 'el foco vuelve a la nota');
  // borrar y deshacer
  await elegir('#b-nota', 'Texto que no quiero perder');
  await clic('Borrar todo');
  ok(await valor('#b-nota') === '' && await c.js(`!document.querySelector('#b-deshacer').hidden`) && await k('palabras') === '0', 'Borrar todo vacía la nota y ofrece deshacer');
  await clic('Deshacer el borrado');
  ok(await valor('#b-nota') === 'Texto que no quiero perder' && await c.js(`document.querySelector('#b-deshacer').hidden`), 'Deshacer recupera la nota y oculta el botón');
  await clic('Borrar todo'); await elegir('#b-nota', 'otra cosa');
  ok(await c.js(`document.querySelector('#b-deshacer').hidden`), 'al escribir algo nuevo ya no se puede deshacer');
  // aviso al cerrar
  const avisoCerrar = () => c.js(`(() => { const e = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; })()`);
  ok(await avisoCerrar() === true, 'con texto sin descargar, el navegador avisa al cerrar');
  await clic('Descargar');
  ok(await avisoCerrar() === false, 'tras descargar ya no avisa');
  await elegir('#b-nota', 'otra cosa más');
  ok(await avisoCerrar() === true, 'si se vuelve a escribir, avisa otra vez');
  await c.js(`TH.copiar = (t, e) => { window.__copiado = t; }; 0`);
  await clic('Copiar todo');
  ok(await c.js(`window.__copiado`) === 'otra cosa más' && await avisoCerrar() === false, 'copiar todo también cuenta como guardado');
  await elegir('#b-nota', '');
  ok(await avisoCerrar() === false, 'con la nota vacía no avisa');
  // descarga vacía
  const nDl = await c.js(`window.__dl.length`);
  await clic('Descargar');
  ok((await texto('.herr-estado')).includes('está vacía') && await c.js(`window.__dl.length`) === nDl, 'descargar una nota vacía avisa y no descarga nada');
  // aspecto
  await elegir('#c-tamano', '1.6'); await marcar('#c-mono', true);
  ok(await c.js(`document.querySelector('#b-nota').style.fontSize`) === '1.6rem' && (await c.js(`document.querySelector('#b-nota').style.fontFamily`)).includes('monospace'), 'tamaño de letra y letra de ancho fijo se aplican');
  // sin almacenamiento
  ok(await c.js(`localStorage.length === 0 && sessionStorage.length === 0 && document.cookie === ''`), 'no se usa localStorage, sessionStorage ni cookies');
  await c.vista(380, 800, 'light', true);
  ok(await c.js(`document.documentElement.scrollWidth <= window.innerWidth`), 'en móvil no hay desplazamiento horizontal');
  await c.vista(1100, 900, 'light', false);
  sinErrores('bloc de notas');

  // ============================================================ CONTRASEÑAS: reparto real de caracteres
  console.log('GENERADOR DE CONTRASEÑAS');
  await ir('generador-de-contrasenas');
  await escribir('#c-longitud', '128'); await escribir('#c-cantidad', '50'); await marcar('#c-todos', false);
  const total = await valor('#t-salida');
  const lineasPw = total.split('\n');
  ok(lineasPw.length === 50 && new Set(lineasPw).size === 50 && lineasPw.every((l) => l.length === 128), '50 contraseñas de 128 caracteres, todas distintas');
  const SIM = '!@#$%&*()-_=+[]{}.,;:?';
  const cuentaPw = { min: 0, may: 0, num: 0, sim: 0 };
  for (const ch of lineasPw.join('')) { if (/[a-z]/.test(ch)) cuentaPw.min++; else if (/[A-Z]/.test(ch)) cuentaPw.may++; else if (/[0-9]/.test(ch)) cuentaPw.num++; else if (SIM.includes(ch)) cuentaPw.sim++; }
  const nPw = 6400, pesos = { min: 26, may: 26, num: 10, sim: SIM.length }, suma = 26 + 26 + 10 + SIM.length;
  const chiPw = Object.keys(pesos).reduce((s, key) => { const e = nPw * pesos[key] / suma; return s + (cuentaPw[key] - e) ** 2 / e; }, 0);
  ok(chiPw < 16.3, `reparto entre tipos acorde con el tamaño de cada conjunto (chi² = ${chiPw.toFixed(1)} con 3 grados de libertad; límite 16,3): ${JSON.stringify(cuentaPw)}`);
  const porLetra = {}; for (const ch of lineasPw.join('')) porLetra[ch] = (porLetra[ch] || 0) + 1;
  const esperadoLetra = nPw / suma, chiL = Object.values(porLetra).reduce((s, n) => s + (n - esperadoLetra) ** 2 / esperadoLetra, 0);
  ok(Object.keys(porLetra).length === suma && chiL < 120, `cada uno de los ${suma} caracteres posibles aparece y el reparto es uniforme (chi² = ${chiL.toFixed(1)}, 83 grados de libertad; límite del 0,1 % ≈ 124)`);
  await marcar('#c-todos', true); await escribir('#c-longitud', '4'); await escribir('#c-cantidad', '50');
  const cuatro = (await valor('#t-salida')).split('\n');
  ok(cuatro.every((l) => /[a-z]/.test(l) && /[A-Z]/.test(l) && /[0-9]/.test(l) && [...l].some((x) => SIM.includes(x))), 'longitud 4 con los cuatro tipos: cada una de las 50 tiene los cuatro tipos');
  ok(await c.js(`localStorage.length === 0 && sessionStorage.length === 0 && document.cookie === ''`), 'no se guarda nada en el navegador');
  sinErrores('contraseñas');
} catch (e) {
  console.log('  ✗ Excepción: ' + (e && e.stack || e)); fallos.push('excepción');
} finally {
  ext.limpiar();
  await c.cerrar();
}
console.log(fallos.length ? `\n${fallos.length} fallos:\n- ` + fallos.join('\n- ') : '\nTodo bien');
process.exit(fallos.length ? 1 : 0);

/* Códigos de barras lineales: EAN-13, EAN-8, UPC-A y Code 128. Sin dependencias; se prueba en Node frente a reportlab y al lector de OpenCV
   (pruebas/test_barras_lib.py). Se carga con TH.script('lib/barras.js') y queda en TH.barras.
   B.control(cifras)                 → dígito de control (0-9) de un EAN o UPC al que le falta la última cifra
   B.generar(tipo, texto)            → { tipo, nombre, texto, datos, control, calculado, modulos, anchoModulos, simbolos } o lanza un Error en español
                                       tipo: 'ean13' | 'ean8' | 'upca' | 'code128' (en EAN y UPC se admiten con o sin el dígito de control)
   B.dibujo(codigo, opciones)        → { ancho, alto, rects: [{x,y,w,h}], textos: [{x,y,t,tam,ancla}] } en píxeles
                                       opciones: modulo (px por módulo, 1), alto (px de las barras, 80), margen (módulos de zona blanca, 11), texto (true)
   B.aSVG(codigo, opciones)          → texto SVG; colores con { color, fondo }
   B.aLienzo(codigo, canvas, opciones) → dibuja en un <canvas> y devuelve { ancho, alto } */
(function (global) {
  'use strict';
  var B = {};
  var L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  function invertir(c) { return c.replace(/[01]/g, function (b) { return b === '0' ? '1' : '0'; }); }
  var R = L.map(invertir);
  var G = R.map(function (c) { return c.split('').reverse().join(''); });
  var PARIDAD = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  var P128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112'];
  var A_B = 99, A_C = 100, INICIO_B = 104, INICIO_C = 105, PARADA = 106;
  B.TABLAS = { L: L, G: G, R: R, PARIDAD: PARIDAD, CODE128: P128 };
  B.TIPOS = { ean13: { nombre: 'EAN-13', cifras: 13 }, ean8: { nombre: 'EAN-8', cifras: 8 }, upca: { nombre: 'UPC-A', cifras: 12 }, code128: { nombre: 'Code 128' } };
  B.MAX_CODE128 = 80;

  /* El dígito de control: se pesa cada cifra con 3 y con 1 empezando por la derecha con 3, se suma y se completa hasta la decena superior. */
  B.control = function (cifras) {
    var s = 0, i, n = cifras.length;
    for (i = 0; i < n; i++) s += (cifras.charCodeAt(n - 1 - i) - 48) * (i % 2 === 0 ? 3 : 1);
    return (10 - s % 10) % 10;
  };

  function limpiarCifras(texto, nombre) {
    var t = String(texto).replace(/[\s-]/g, '');
    if (!t) throw new Error('Escribe el número del código.');
    var m = /[^0-9]/.exec(t);
    if (m) throw new Error('Un código ' + nombre + ' solo lleva cifras del 0 al 9, y «' + m[0] + '» no lo es. Se admiten espacios y guiones, que se ignoran.');
    return t;
  }

  function ean(tipo, texto) {
    var info = B.TIPOS[tipo], t = limpiarCifras(texto, info.nombre), n = info.cifras, calc;
    if (t.length !== n && t.length !== n - 1) throw new Error('Un ' + info.nombre + ' tiene ' + (n - 1) + ' cifras, y ' + n + ' si incluyes el dígito de control. Has escrito ' + t.length + '.');
    var datos = t.slice(0, n - 1), c = B.control(datos);
    if (t.length === n) {
      if (Number(t.charAt(n - 1)) !== c) throw new Error('El dígito de control no coincide: para ' + datos + ' debería ser ' + c + ' y has escrito ' + t.charAt(n - 1) + '.');
      calc = false;
    } else calc = true;
    var completo = datos + c, m;
    if (tipo === 'ean8') {
      m = '101' + completo.slice(0, 4).split('').map(function (d) { return L[+d]; }).join('') + '01010' + completo.slice(4).split('').map(function (d) { return R[+d]; }).join('') + '101';
    } else {
      var e13 = tipo === 'upca' ? '0' + completo : completo, par = PARIDAD[+e13.charAt(0)], izq = '', der = '', i;
      for (i = 0; i < 6; i++) izq += (par.charAt(i) === 'L' ? L : G)[+e13.charAt(1 + i)];
      for (i = 0; i < 6; i++) der += R[+e13.charAt(7 + i)];
      m = '101' + izq + '01010' + der + '101';
    }
    return { tipo: tipo, nombre: info.nombre, texto: completo, datos: datos, control: String(c), calculado: calc, modulos: m, anchoModulos: m.length, simbolos: null };
  }

  function ambito128(texto) {
    for (var i = 0; i < texto.length; i++) {
      var k = texto.charCodeAt(i);
      if (k < 32 || k > 126) throw new Error('Esta herramienta codifica en Code 128 las letras sin tilde, las cifras y los signos del teclado inglés. El carácter «' + texto.charAt(i) + '» no se puede representar.');
    }
  }
  function esPar(texto, i) { return i + 1 < texto.length && texto.charCodeAt(i) >= 48 && texto.charCodeAt(i) <= 57 && texto.charCodeAt(i + 1) >= 48 && texto.charCodeAt(i + 1) <= 57; }

  /* Reparte el texto entre los juegos B (todo el teclado) y C (pares de cifras) buscando el menor número de símbolos posible. */
  function simbolos128(texto) {
    var n = texto.length, memo = {}, INF = 1e9;
    function dato(i, s) {                       // coste de escribir desde i estando ya en el juego s, con un símbolo de dato como mínimo
      if (s === 'B') return 1 + mejor(i + 1, 'B');
      return esPar(texto, i) ? 1 + mejor(i + 2, 'C') : INF;
    }
    function mejor(i, s) {
      if (i >= n) return 0;
      var k = i + s, v = memo[k];
      if (v === undefined) {
        var o = s === 'B' ? 'C' : 'B', a = dato(i, s), b = 1 + dato(i, o);
        v = memo[k] = Math.min(a, b);
      }
      return v;
    }
    var cb = 1 + dato(0, 'B'), cc = 1 + dato(0, 'C'), s = cc < cb ? 'C' : 'B', i = 0, v = [s === 'B' ? INICIO_B : INICIO_C];
    while (i < n) {
      var o = s === 'B' ? 'C' : 'B';
      if (dato(i, s) > 1 + dato(i, o)) { v.push(s === 'B' ? A_B : A_C); s = o; }
      if (s === 'B') { v.push(texto.charCodeAt(i) - 32); i++; }
      else { v.push(Number(texto.substr(i, 2))); i += 2; }
    }
    return v;
  }

  function code128(texto) {
    if (texto === '' || texto === null || texto === undefined) throw new Error('Escribe el texto del código.');
    texto = String(texto);
    if (texto.length > B.MAX_CODE128) throw new Error('Un Code 128 de más de ' + B.MAX_CODE128 + ' caracteres resulta demasiado ancho para leerse bien. Acorta el texto.');
    ambito128(texto);
    var v = simbolos128(texto), suma = v[0], i;
    for (i = 1; i < v.length; i++) suma += i * v[i];
    var control = suma % 103;
    v.push(control, PARADA);
    var m = '';
    v.forEach(function (x) {
      var p = P128[x], j;
      for (j = 0; j < p.length; j++) { var w = +p.charAt(j), c = j % 2 === 0 ? '1' : '0'; while (w--) m += c; }
    });
    return { tipo: 'code128', nombre: 'Code 128', texto: texto, datos: texto, control: String(control), calculado: true, modulos: m, anchoModulos: m.length, simbolos: v };
  }

  B.generar = function (tipo, texto) {
    if (tipo === 'ean13' || tipo === 'ean8' || tipo === 'upca') return ean(tipo, texto);
    if (tipo === 'code128') return code128(texto);
    throw new Error('Tipo de código desconocido: ' + tipo);
  };

  /* ---- Dibujo: las mismas formas sirven para el SVG y para el lienzo ---- */
  function extendidos(c) {          // módulos cuyas barras bajan hasta la altura del texto (guardas y, en UPC-A, la primera y la última cifra)
    var ext = [], i, n = c.anchoModulos;
    for (i = 0; i < n; i++) ext.push(false);
    function marca(a, b) { for (var k = a; k <= b; k++) ext[k] = true; }
    if (c.tipo === 'ean13' || c.tipo === 'upca') { marca(0, 2); marca(45, 49); marca(92, 94); if (c.tipo === 'upca') { marca(3, 9); marca(85, 91); } }
    else if (c.tipo === 'ean8') { marca(0, 2); marca(31, 35); marca(64, 66); }
    return ext;
  }

  B.dibujo = function (c, o) {
    o = o || {};
    var mo = Math.max(1, Math.round(o.modulo || 1)), alto = Math.max(10, Math.round(o.alto || 80)), conTexto = o.texto !== false;
    var fuera = c.tipo === 'ean13' || c.tipo === 'upca', margen = o.margen === undefined ? 11 : o.margen;
    if (conTexto && fuera) margen = Math.max(margen, 9);
    margen = Math.max(0, margen);
    var tam = Math.max(9, Math.round(9.5 * mo)), mv = Math.max(4, Math.round(4 * mo)), guardia = c.tipo !== 'code128', ext = [], rects = [], textos = [], x0 = margen * mo, i;
    var extra = conTexto ? (guardia ? Math.round(tam * 0.85) : Math.round(tam * 1.25)) : 0;
    if (guardia) ext = extendidos(c);
    i = 0;
    while (i < c.anchoModulos) {
      if (c.modulos.charAt(i) === '1') {
        var j = i;
        while (j < c.anchoModulos && c.modulos.charAt(j) === '1') j++;
        rects.push({ x: x0 + i * mo, y: mv, w: (j - i) * mo, h: alto + (guardia && conTexto && ext[i] ? extra : 0) });
        i = j;
      } else i++;
    }
    var base = mv + alto + extra, ancho = x0 * 2 + c.anchoModulos * mo, d = c.texto, k;
    if (conTexto) {
      var cel = function (modulo) { return x0 + Math.round(modulo * mo); };
      if (c.tipo === 'ean13') {
        textos.push({ x: x0 - 6 * mo, y: base, t: d.charAt(0), tam: tam, ancla: 'middle' });
        for (k = 0; k < 6; k++) textos.push({ x: cel(3 + 7 * k + 3.5), y: base, t: d.charAt(1 + k), tam: tam, ancla: 'middle' }, { x: cel(50 + 7 * k + 3.5), y: base, t: d.charAt(7 + k), tam: tam, ancla: 'middle' });
      } else if (c.tipo === 'ean8') {
        for (k = 0; k < 4; k++) textos.push({ x: cel(3 + 7 * k + 3.5), y: base, t: d.charAt(k), tam: tam, ancla: 'middle' }, { x: cel(36 + 7 * k + 3.5), y: base, t: d.charAt(4 + k), tam: tam, ancla: 'middle' });
      } else if (c.tipo === 'upca') {
        textos.push({ x: x0 - 6 * mo, y: base, t: d.charAt(0), tam: tam, ancla: 'middle' }, { x: x0 + 95 * mo + 6 * mo, y: base, t: d.charAt(11), tam: tam, ancla: 'middle' });
        for (k = 0; k < 5; k++) textos.push({ x: cel(3 + 7 * (k + 1) + 3.5), y: base, t: d.charAt(1 + k), tam: tam, ancla: 'middle' }, { x: cel(50 + 7 * k + 3.5), y: base, t: d.charAt(6 + k), tam: tam, ancla: 'middle' });
      } else {
        var ta = Math.max(7, Math.min(tam, Math.floor((c.anchoModulos * mo) / (d.length * 0.62))));
        textos.push({ x: ancho / 2, y: base, t: d, tam: ta, ancla: 'middle' });
      }
    }
    return { ancho: ancho, alto: base + mv + (conTexto && !guardia ? Math.round(tam * 0.2) : 0), rects: rects, textos: textos };
  };

  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  B.aSVG = function (c, o) {
    o = o || {};
    var dib = B.dibujo(c, o), color = o.color || '#000000', fondo = o.fondo || '#ffffff';
    var camino = dib.rects.map(function (r) { return 'M' + r.x + ' ' + r.y + 'h' + r.w + 'v' + r.h + 'h-' + r.w + 'z'; }).join('');
    var txt = dib.textos.map(function (t) { return '<text x="' + t.x + '" y="' + t.y + '" font-size="' + t.tam + '" text-anchor="' + t.ancla + '">' + esc(t.t) + '</text>'; }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + dib.ancho + '" height="' + dib.alto + '" viewBox="0 0 ' + dib.ancho + ' ' + dib.alto + '" role="img" aria-label="' + esc(c.nombre + ' ' + c.texto) + '">' +
      '<rect width="' + dib.ancho + '" height="' + dib.alto + '" fill="' + esc(fondo) + '"/><path fill="' + esc(color) + '" d="' + camino + '"/>' +
      (txt ? '<g fill="' + esc(color) + '" font-family="Arial, Helvetica, sans-serif">' + txt + '</g>' : '') + '</svg>';
  };
  B.aLienzo = function (c, lienzo, o) {
    o = o || {};
    var dib = B.dibujo(c, o), cx = lienzo.getContext('2d');
    lienzo.width = dib.ancho; lienzo.height = dib.alto;
    cx.fillStyle = o.fondo || '#ffffff'; cx.fillRect(0, 0, dib.ancho, dib.alto);
    cx.fillStyle = o.color || '#000000';
    dib.rects.forEach(function (r) { cx.fillRect(r.x, r.y, r.w, r.h); });
    dib.textos.forEach(function (t) { cx.font = t.tam + 'px Arial, Helvetica, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.fillText(t.t, t.x, t.y); });
    return { ancho: dib.ancho, alto: dib.alto };
  };

  if (typeof module === 'object' && module.exports) module.exports = B;
  else { global.TH = global.TH || {}; global.TH.barras = B; }
})(typeof self !== 'undefined' ? self : this);

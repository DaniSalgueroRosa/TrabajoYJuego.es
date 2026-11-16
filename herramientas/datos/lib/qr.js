/* Codificador de códigos QR (ISO/IEC 18004, modelo 2) escrito para este sitio. Sin dependencias.
   QR.generar(texto, { nivel: 'L'|'M'|'Q'|'H', versionMinima: 1..40, mascara: 0..7 | -1 (automática) })
   → { version, tamano, nivel, mascara, modo, modulos: [[true|false]] } (true = módulo oscuro). Lanza Error si el texto no cabe.
   Modos usados: numérico, alfanumérico o bytes (UTF-8), según el contenido. Se carga con TH.script('lib/qr.js') y queda en TH.qr. */
(function (global) {
  'use strict';
  var QR = {};

  /* ---------- Tablas del estándar (índice = versión, 1 a 40; el 0 no se usa) ---------- */
  var ECC_POR_BLOQUE = {
    L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    Q: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    H: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  };
  var NUM_BLOQUES = {
    L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    Q: [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    H: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  };
  var BITS_NIVEL = { L: 1, M: 0, Q: 3, H: 2 };                       // bits de formato
  var ALFANUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

  function modulosDatos(v) {                                         // módulos que se pueden usar para datos y corrección de errores
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) { var n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function palabrasDatos(v, nivel) { return Math.floor(modulosDatos(v) / 8) - ECC_POR_BLOQUE[nivel][v] * NUM_BLOQUES[nivel][v]; }
  QR.capacidadBytes = function (v, nivel) { var bits = palabrasDatos(v, nivel) * 8 - 4 - (v < 10 ? 8 : 16); return Math.max(0, Math.floor(bits / 8)); };

  /* ---------- Segmentos ---------- */
  function utf8(t) {
    var s = unescape(encodeURIComponent(t)), b = [];
    for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i));
    return b;
  }
  function elegirModo(t) {
    if (/^[0-9]*$/.test(t)) return 'num';
    for (var i = 0; i < t.length; i++) if (ALFANUM.indexOf(t.charAt(i)) < 0) return 'byte';
    return 'alfa';
  }
  function bitsContador(modo, v) {
    var k = v < 10 ? 0 : v < 27 ? 1 : 2;
    return { num: [10, 12, 14], alfa: [9, 11, 13], byte: [8, 16, 16] }[modo][k];
  }
  function poner(bits, valor, n) { for (var i = n - 1; i >= 0; i--) bits.push((valor >>> i) & 1); }
  function codificarSegmento(texto, modo, v) {
    var bits = [], n;
    if (modo === 'num') {
      poner(bits, 1, 4); poner(bits, texto.length, bitsContador(modo, v));
      for (n = 0; n < texto.length; n += 3) { var g = texto.substr(n, 3); poner(bits, parseInt(g, 10), g.length * 3 + 1); }
    } else if (modo === 'alfa') {
      poner(bits, 2, 4); poner(bits, texto.length, bitsContador(modo, v));
      for (n = 0; n + 1 < texto.length; n += 2) poner(bits, ALFANUM.indexOf(texto.charAt(n)) * 45 + ALFANUM.indexOf(texto.charAt(n + 1)), 11);
      if (texto.length % 2) poner(bits, ALFANUM.indexOf(texto.charAt(texto.length - 1)), 6);
    } else {
      var by = utf8(texto);
      poner(bits, 4, 4); poner(bits, by.length, bitsContador(modo, v));
      by.forEach(function (x) { poner(bits, x, 8); });
    }
    return bits;
  }

  /* ---------- Reed-Solomon sobre GF(256), polinomio 0x11D ---------- */
  var EXP = new Array(512), LOG = new Array(256);
  (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11D; } for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function generador(grado) {
    var p = [1];
    for (var i = 0; i < grado; i++) {
      var q = new Array(p.length + 1).fill(0);
      for (var j = 0; j < p.length; j++) { q[j] ^= p[j]; q[j + 1] ^= mul(p[j], EXP[i]); }
      p = q;
    }
    return p;                                                        // coeficientes de mayor a menor grado, el primero es 1
  }
  function resto(datos, grado) {
    var g = generador(grado), r = new Array(grado).fill(0);
    datos.forEach(function (d) {
      var f = d ^ r[0];
      r.shift(); r.push(0);
      for (var i = 0; i < grado; i++) r[i] ^= mul(g[i + 1], f);
    });
    return r;
  }

  /* ---------- Matriz ---------- */
  function posicionesAlineacion(v) {
    if (v === 1) return [];
    var n = Math.floor(v / 7) + 2, tam = v * 4 + 17, paso = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, r = [6];
    for (var p = tam - 7; r.length < n; p -= paso) r.splice(1, 0, p);
    return r;
  }
  function Matriz(v) {
    this.v = v; this.n = v * 4 + 17;
    this.m = []; this.f = [];
    for (var y = 0; y < this.n; y++) { this.m.push(new Array(this.n).fill(false)); this.f.push(new Array(this.n).fill(false)); }
  }
  Matriz.prototype.fijar = function (x, y, oscuro) { this.m[y][x] = oscuro; this.f[y][x] = true; };
  Matriz.prototype.buscador = function (cx, cy) {
    for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
      var d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
      if (x >= 0 && x < this.n && y >= 0 && y < this.n) this.fijar(x, y, d !== 2 && d !== 4);
    }
  };
  Matriz.prototype.alineacion = function (cx, cy) {
    for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) this.fijar(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  };
  Matriz.prototype.funciones = function () {
    var n = this.n, i;
    for (i = 0; i < n; i++) { this.fijar(6, i, i % 2 === 0); this.fijar(i, 6, i % 2 === 0); }
    this.buscador(3, 3); this.buscador(n - 4, 3); this.buscador(3, n - 4);
    var pos = posicionesAlineacion(this.v), k = pos.length;
    for (i = 0; i < k; i++) for (var j = 0; j < k; j++) {
      if (!((i === 0 && j === 0) || (i === 0 && j === k - 1) || (i === k - 1 && j === 0))) this.alineacion(pos[i], pos[j]);
    }
    this.formato(0);                                                 // reserva el sitio; se vuelve a escribir con la máscara elegida
    this.version();
  };
  Matriz.prototype.formato = function (bitsFormato) {
    var n = this.n, i, b = function (k) { return ((bitsFormato >>> k) & 1) !== 0; };
    for (i = 0; i <= 5; i++) this.fijar(8, i, b(i));
    this.fijar(8, 7, b(6)); this.fijar(8, 8, b(7)); this.fijar(7, 8, b(8));
    for (i = 9; i < 15; i++) this.fijar(14 - i, 8, b(i));
    for (i = 0; i < 8; i++) this.fijar(n - 1 - i, 8, b(i));
    for (i = 8; i < 15; i++) this.fijar(8, n - 15 + i, b(i));
    this.fijar(8, n - 8, true);                                      // módulo oscuro fijo
  };
  Matriz.prototype.version = function () {
    if (this.v < 7) return;
    var r = this.v, i;
    for (i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
    var bits = (this.v << 12) | r;
    for (i = 0; i < 18; i++) { var o = ((bits >>> i) & 1) !== 0, a = this.n - 11 + i % 3, c = Math.floor(i / 3); this.fijar(a, c, o); this.fijar(c, a, o); }
  };
  Matriz.prototype.colocar = function (palabras) {
    var n = this.n, k = 0, total = palabras.length * 8;
    for (var der = n - 1; der >= 1; der -= 2) {
      if (der === 6) der = 5;
      for (var vert = 0; vert < n; vert++) for (var j = 0; j < 2; j++) {
        var x = der - j, arriba = ((der + 1) & 2) === 0, y = arriba ? n - 1 - vert : vert;
        if (!this.f[y][x] && k < total) { this.m[y][x] = ((palabras[k >>> 3] >>> (7 - (k & 7))) & 1) !== 0; k++; }
      }
    }
  };
  function mascaraActiva(mk, x, y) {
    switch (mk) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return x * y % 2 + x * y % 3 === 0;
      case 6: return (x * y % 2 + x * y % 3) % 2 === 0;
      default: return ((x + y) % 2 + x * y % 3) % 2 === 0;
    }
  }
  Matriz.prototype.aplicar = function (mk) {
    for (var y = 0; y < this.n; y++) for (var x = 0; x < this.n; x++) if (!this.f[y][x] && mascaraActiva(mk, x, y)) this.m[y][x] = !this.m[y][x];
  };
  Matriz.prototype.penalizacion = function () {
    var n = this.n, m = this.m, p = 0, x, y, i, oscuros = 0;
    function lineas(get) {
      var pen = 0;
      for (var a = 0; a < n; a++) {
        var cadena = '', run = 1, prev = get(a, 0);
        cadena += prev ? '1' : '0';
        for (var b = 1; b < n; b++) {
          var c = get(a, b); cadena += c ? '1' : '0';
          if (c === prev) { run++; if (run === 5) pen += 3; else if (run > 5) pen++; } else { run = 1; prev = c; }
        }
        var re = /(?=(10111010000|00001011101))/g, t;
        while ((t = re.exec(cadena))) { pen += 40; re.lastIndex = t.index + 1; }
      }
      return pen;
    }
    p += lineas(function (a, b) { return m[a][b]; }) + lineas(function (a, b) { return m[b][a]; });
    for (y = 0; y < n - 1; y++) for (x = 0; x < n - 1; x++) if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (m[y][x]) oscuros++;
    var total = n * n, k = Math.ceil(Math.abs(oscuros * 20 - total * 10) / total) - 1;
    return p + Math.max(0, k) * 10;
  };

  /* ---------- API ---------- */
  QR.generar = function (texto, opc) {
    opc = opc || {};
    texto = String(texto == null ? '' : texto);
    var nivel = opc.nivel || 'M';
    if (!ECC_POR_BLOQUE[nivel]) throw new Error('Nivel de corrección desconocido: ' + nivel);
    if (!texto.length) throw new Error('Escribe el contenido del código.');
    var modo = elegirModo(texto), v, bits;
    for (v = Math.max(1, opc.versionMinima || 1); v <= 40; v++) {
      bits = codificarSegmento(texto, modo, v);
      if (bits.length <= palabrasDatos(v, nivel) * 8) break;
    }
    if (v > 40) {
      var max = QR.capacidadBytes(40, nivel);
      throw new Error('El contenido es demasiado largo para un código QR con este nivel de corrección (máximo unos ' + max + ' caracteres). Acórtalo o baja el nivel de corrección.');
    }
    var capBits = palabrasDatos(v, nivel) * 8;
    poner(bits, 0, Math.min(4, capBits - bits.length));
    while (bits.length % 8) bits.push(0);
    for (var relleno = 0xEC; bits.length < capBits; relleno ^= 0xEC ^ 0x11) poner(bits, relleno, 8);
    var datos = [];
    for (var i = 0; i < bits.length; i += 8) { var byte = 0; for (var j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]; datos.push(byte); }

    var nb = NUM_BLOQUES[nivel][v], ecc = ECC_POR_BLOQUE[nivel][v], bruto = Math.floor(modulosDatos(v) / 8), cortos = nb - bruto % nb, largoCorto = Math.floor(bruto / nb);
    var bloques = [], pos = 0;
    for (i = 0; i < nb; i++) {
      var largo = largoCorto - ecc + (i < cortos ? 0 : 1), d = datos.slice(pos, pos + largo); pos += largo;
      bloques.push({ d: d, e: resto(d, ecc) });
    }
    var palabras = [];
    for (i = 0; i < largoCorto - ecc + 1; i++) bloques.forEach(function (b) { if (i < b.d.length) palabras.push(b.d[i]); });
    for (i = 0; i < ecc; i++) bloques.forEach(function (b) { palabras.push(b.e[i]); });

    var base = new Matriz(v); base.funciones(); base.colocar(palabras);
    var mejor = null, mk, candidatas = opc.mascara >= 0 && opc.mascara <= 7 ? [opc.mascara | 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    candidatas.forEach(function (c) {
      var t = new Matriz(v); t.m = base.m.map(function (f) { return f.slice(); }); t.f = base.f;
      t.aplicar(c);
      var datosFormato = (BITS_NIVEL[nivel] << 3) | c, r = datosFormato;
      for (var k = 0; k < 10; k++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      t.formato(((datosFormato << 10) | r) ^ 0x5412);
      var pen = candidatas.length > 1 ? t.penalizacion() : 0;
      if (!mejor || pen < mejor.pen) mejor = { pen: pen, t: t, mk: c };
    });
    return { version: v, tamano: base.n, nivel: nivel, mascara: mejor.mk, modo: modo, modulos: mejor.t.m };
  };

  /* Dibuja la matriz en un SVG (texto) o en un <canvas>. margen en módulos (4 es lo que pide el estándar). */
  QR.aSVG = function (qr, opc) {
    opc = opc || {};
    var margen = opc.margen == null ? 4 : opc.margen, n = qr.tamano, total = n + margen * 2, ruta = [];
    for (var y = 0; y < n; y++) {
      var x = 0;
      while (x < n) {
        if (!qr.modulos[y][x]) { x++; continue; }
        var ini = x; while (x < n && qr.modulos[y][x]) x++;
        ruta.push('M' + (ini + margen) + ',' + (y + margen) + 'h' + (x - ini) + 'v1h-' + (x - ini) + 'z');
      }
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" width="' + (opc.px || total * 8) + '" height="' + (opc.px || total * 8) + '" shape-rendering="crispEdges">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + (opc.fondo || '#ffffff') + '"/><path d="' + ruta.join('') + '" fill="' + (opc.color || '#000000') + '"/></svg>\n';
  };
  /* Dibuja el código en un lienzo de EXACTAMENTE px × px (o lo más cerca posible si px es menor que un píxel por módulo).
     Los bordes de cada módulo se redondean al píxel, sin suavizado: los módulos miden entre 1 y 2 píxeles de diferencia como mucho. */
  QR.aLienzo = function (qr, lienzo, opc) {
    opc = opc || {};
    var margen = opc.margen == null ? 4 : opc.margen, n = qr.tamano, total = n + margen * 2, lado = Math.max(total, Math.round(opc.px || 512));
    lienzo.width = lienzo.height = lado;
    var g = lienzo.getContext('2d');
    g.fillStyle = opc.fondo || '#ffffff'; g.fillRect(0, 0, lado, lado);
    g.fillStyle = opc.color || '#000000';
    var borde = function (i) { return Math.round(i * lado / total); };
    for (var y = 0; y < n; y++) {
      var y0 = borde(y + margen), y1 = borde(y + margen + 1);
      for (var x = 0; x < n; x++) if (qr.modulos[y][x]) { var x0 = borde(x + margen); g.fillRect(x0, y0, borde(x + margen + 1) - x0, y1 - y0); }
    }
    return { lado: lado, escala: lado / total };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = QR;
  else { global.TH = global.TH || {}; global.TH.qr = QR; }
})(typeof window !== 'undefined' ? window : globalThis);

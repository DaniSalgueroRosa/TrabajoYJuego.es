/* Sonido: codificadores y utilidades de audio escritos para este sitio, sin dependencias y sin tocar el navegador (se prueban en Node contra ffmpeg).
   Los canales se pasan como listas de Float32Array con valores entre -1 y 1.
   TH.sonido.wav(canales, hz, bits)             → Uint8Array con un WAV PCM de 16 o 24 bits, o de coma flotante de 32 ('32f')
   TH.sonido.flac(canales, hz, bits, md5)       → Uint8Array con un FLAC sin pérdidas de 16 o 24 bits (md5: función opcional bytes → 16 bytes, para la firma del audio)
   TH.sonido.ogg(paquetes, opciones)            → Uint8Array con un Ogg Opus a partir de paquetes Opus ya codificados (la codificación la hace el navegador)
   TH.sonido.estirar(canales, factor, hz)       → cambia la duración sin cambiar el tono (factor 2 = el doble de rápido) con el método WSOLA
   TH.sonido.remuestrear(canal, de, a)          → cambia la frecuencia de muestreo (interpolación cúbica; para bajar de frecuencia filtra antes)
   TH.sonido.cambiarTono(canales, factor)       → acelera o frena cambiando también el tono (como un disco)
   TH.sonido.recortar / unir / ganancia / fundidos / aMono / normalizar / picos         → operaciones sencillas con las muestras
   TH.sonido.tono(muestras, hz)                 → frecuencia fundamental en Hz y claridad (0 a 1) con el método YIN; null si no hay un tono claro
   TH.sonido.nota(hz, la4)                      → nota más cercana: { midi, nombre, octava, cents }
   TH.sonido.tiempo(segundos) / leerTiempo(texto) → «m:ss,d» ↔ segundos
   Verificado en pruebas/test_sonido_lib.py: WAV y FLAC decodificados por ffmpeg dan las mismas muestras; el Ogg se comprueba con paquetes reales de ffmpeg;
   el estiramiento conserva el tono; YIN acierta la nota con menos de 2 cents de error. Se carga con TH.script('lib/sonido.js'). */
(function (global) {
  'use strict';
  var S = {};

  /* ============================================================ Operaciones sencillas */
  function copiarCanales(c) { return c.map(function (x) { return new Float32Array(x); }); }
  S.aMono = function (canales) {
    if (canales.length === 1) return [new Float32Array(canales[0])];
    var n = canales[0].length, m = new Float32Array(n), i, k;
    for (k = 0; k < canales.length; k++) for (i = 0; i < n; i++) m[i] += canales[k][i];
    for (i = 0; i < n; i++) m[i] /= canales.length;
    return [m];
  };
  S.recortar = function (canales, desde, hasta) {            // en muestras: [desde, hasta)
    return canales.map(function (x) { return x.slice(Math.max(0, desde), Math.min(x.length, hasta)); });
  };
  /* Une listas de canales una tras otra. Si alguna tiene un canal y otra dos, el canal único se duplica. pausa = muestras de silencio entre pistas. */
  S.unir = function (listas, pausa) {
    var nc = 0, total = 0, i, k;
    listas.forEach(function (l) { nc = Math.max(nc, l.length); });
    pausa = pausa || 0;
    listas.forEach(function (l, j) { total += l[0].length + (j ? pausa : 0); });
    var salida = []; for (k = 0; k < nc; k++) salida.push(new Float32Array(total));
    var pos = 0;
    listas.forEach(function (l, j) {
      if (j) pos += pausa;
      for (k = 0; k < nc; k++) salida[k].set(l[Math.min(k, l.length - 1)], pos);
      pos += l[0].length;
    });
    return salida;
  };
  S.ganancia = function (canales, factor) {
    return canales.map(function (x) { var y = new Float32Array(x.length), i; for (i = 0; i < x.length; i++) y[i] = x[i] * factor; return y; });
  };
  /* Pico máximo y cuántas muestras pasan de 1 (o -1): son las que se recortarían (saturarían) al guardar. */
  S.picos = function (canales) {
    var max = 0, sat = 0;
    canales.forEach(function (x) { for (var i = 0; i < x.length; i++) { var a = Math.abs(x[i]); if (a > max) max = a; if (a > 1) sat++; } });
    return { max: max, saturadas: sat };
  };
  S.normalizar = function (canales, objetivo) {
    var p = S.picos(canales).max;
    return p > 0 ? S.ganancia(canales, (objetivo || 1) / p) : copiarCanales(canales);
  };
  /* Fundidos lineales de entrada y salida, en muestras */
  S.fundidos = function (canales, entrada, salida) {
    return canales.map(function (x) {
      var y = new Float32Array(x), n = y.length, i;
      entrada = Math.min(entrada || 0, n); salida = Math.min(salida || 0, n);
      for (i = 0; i < entrada; i++) y[i] *= i / entrada;
      for (i = 0; i < salida; i++) y[n - 1 - i] *= i / salida;
      return y;
    });
  };
  S.tiempo = function (s) {
    if (!isFinite(s) || s < 0) s = 0;
    var d = Math.round(s * 10), m = Math.floor(d / 600), r = d - m * 600, seg = Math.floor(r / 10);
    return m + ':' + (seg < 10 ? '0' : '') + seg + ',' + (r % 10);
  };
  /* Acepta «90», «90,5», «1:30», «1:30,5», «01:02:03» y devuelve segundos o NaN */
  S.leerTiempo = function (t) {
    t = String(t == null ? '' : t).trim().replace(',', '.');
    if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(t)) return NaN;
    var p = t.split(':').map(Number), s = 0, i;
    for (i = 0; i < p.length; i++) s = s * 60 + p[i];
    if (p.slice(1).some(function (x) { return x >= 60; })) return NaN;
    return s;
  };

  /* ============================================================ Remuestreo y cambio de velocidad */
  /* Interpolación cúbica (Catmull-Rom). Si se reduce la frecuencia, se aplica antes un filtro de ventana para evitar aliasing. */
  S.remuestrear = function (x, de, a) {
    if (de === a) return new Float32Array(x);
    var src = x, i;
    if (a < de) {                                            // paso bajo: media móvil ponderada con ventana de Hann de longitud ≈ de / a muestras
      var w = Math.max(2, Math.round(de / a) * 2 + 1), h = new Float64Array(w), sum = 0;
      for (i = 0; i < w; i++) { h[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * (i + 1) / (w + 1)); sum += h[i]; }
      for (i = 0; i < w; i++) h[i] /= sum;
      var f = new Float32Array(x.length), mid = (w - 1) >> 1, j, acc, idx;
      for (i = 0; i < x.length; i++) { acc = 0; for (j = 0; j < w; j++) { idx = i + j - mid; if (idx >= 0 && idx < x.length) acc += h[j] * x[idx]; } f[i] = acc; }
      src = f;
    }
    var n = Math.floor(x.length * a / de), y = new Float32Array(n), r = de / a, p, k, t, p0, p1, p2, p3;
    for (i = 0; i < n; i++) {
      p = i * r; k = Math.floor(p); t = p - k;
      p0 = src[Math.max(0, k - 1)]; p1 = src[Math.min(src.length - 1, k)]; p2 = src[Math.min(src.length - 1, k + 1)]; p3 = src[Math.min(src.length - 1, k + 2)];
      y[i] = p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
    }
    return y;
  };
  /* Como un disco: más rápido y más agudo, o más lento y más grave. Se mantiene la frecuencia de muestreo. */
  S.cambiarTono = function (canales, factor) {
    return canales.map(function (x) { return S.remuestrear(x, factor, 1); });
  };
  /* WSOLA: cambia la duración sin cambiar el tono. factor > 1 acelera. Se alinean los fragmentos con la correlación para evitar saltos. */
  S.estirar = function (canales, factor, hz) {
    if (Math.abs(factor - 1) < 1e-9) return copiarCanales(canales);
    var n = canales[0].length, nc = canales.length, i, k, c;
    var N = Math.max(256, (Math.round(0.04 * hz) >> 1) << 1), Hs = N >> 1, Ha = Hs * factor, tol = Math.max(16, Math.round(0.015 * hz));
    var mono = S.aMono(canales)[0], dec = 4, nd = Math.floor(n / dec), md = new Float32Array(nd);
    for (i = 0; i < nd; i++) { var a = 0; for (k = 0; k < dec; k++) a += mono[i * dec + k]; md[i] = a / dec; }
    var salidaLen = Math.ceil(n / factor) + N, out = [], ven = new Float32Array(N), norma = new Float32Array(salidaLen + N);
    for (c = 0; c < nc; c++) out.push(new Float32Array(salidaLen + N));
    for (i = 0; i < N; i++) ven[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * (i + 0.5) / N);
    function correl(posRef, posCand, longitud) {              // correlación normalizada entre dos tramos de la señal reducida
      var s = 0, e1 = 0, e2 = 0, j, u, v;
      for (j = 0; j < longitud; j++) { u = md[posRef + j] || 0; v = md[posCand + j] || 0; s += u * v; e1 += u * u; e2 += v * v; }
      return s / Math.sqrt(e1 * e2 + 1e-12);
    }
    var prev = 0, pos, mejor, d, cand, v, k2, salidaPos = 0, nSeg = Math.ceil((salidaLen - N) / Hs) + 1, s;
    for (s = 0; s < nSeg; s++) {
      if (s === 0) pos = 0;
      else {
        var objetivo = Math.round(s * Ha), ref = prev + Hs;                       // ref: lo que seguiría de forma natural en la entrada
        var lo = Math.max(0, objetivo - tol), hi = Math.min(Math.max(0, n - N), objetivo + tol);
        if (lo > hi) lo = hi;
        mejor = -2; pos = Math.min(Math.max(0, Math.min(objetivo, n - 1)), hi);
        var Nd = N / dec, rd = Math.floor(ref / dec);
        for (cand = lo; cand <= hi; cand += dec) { v = correl(rd, Math.floor(cand / dec), Nd); if (v > mejor) { mejor = v; pos = cand; } }
        var fino = pos; mejor = -2;
        for (cand = Math.max(lo, fino - dec); cand <= Math.min(hi, fino + dec); cand++) {
          var s2 = 0, e1 = 0, e2 = 0;
          for (k2 = 0; k2 < N; k2 += 2) { var u2 = mono[ref + k2] || 0, v2 = mono[cand + k2] || 0; s2 += u2 * v2; e1 += u2 * u2; e2 += v2 * v2; }
          v = s2 / Math.sqrt(e1 * e2 + 1e-12);
          if (v > mejor) { mejor = v; pos = cand; }
        }
      }
      for (c = 0; c < nc; c++) { var o = out[c], xin = canales[c]; for (i = 0; i < N; i++) o[salidaPos + i] += (xin[pos + i] || 0) * ven[i]; }
      for (i = 0; i < N; i++) norma[salidaPos + i] += ven[i];
      prev = pos; salidaPos += Hs;
      if (pos >= n && salidaPos >= salidaLen) break;
    }
    var largo = Math.round(n / factor);
    return out.map(function (o) { var y = new Float32Array(largo), j; for (j = 0; j < largo; j++) y[j] = norma[j] > 1e-6 ? o[j] / norma[j] : 0; return y; });
  };

  /* ============================================================ WAV */
  S.wav = function (canales, hz, bits) {
    var nc = canales.length, n = nc ? canales[0].length : 0, flot = bits === '32f', bps = flot ? 32 : bits;
    if (bps !== 16 && bps !== 24 && bps !== 32) throw new Error('Formato WAV no admitido: usa 16, 24 o 32f.');
    var bytes = bps / 8, datos = n * nc * bytes, extra = flot ? 12 : 0, total = 36 + extra + datos + (datos & 1);
    if (total + 8 > 4294967295) throw new Error('El audio es demasiado largo para un WAV (el límite es de 4 GB).');
    var out = new Uint8Array(8 + total), v = new DataView(out.buffer), p = 0, i, k;
    function txt(s) { for (var j = 0; j < s.length; j++) out[p++] = s.charCodeAt(j); }
    txt('RIFF'); v.setUint32(p, total, true); p += 4; txt('WAVE');
    txt('fmt '); v.setUint32(p, 16, true); p += 4; v.setUint16(p, flot ? 3 : 1, true); p += 2; v.setUint16(p, nc, true); p += 2;
    v.setUint32(p, hz, true); p += 4; v.setUint32(p, hz * nc * bytes, true); p += 4; v.setUint16(p, nc * bytes, true); p += 2; v.setUint16(p, bps, true); p += 2;
    if (flot) { txt('fact'); v.setUint32(p, 4, true); p += 4; v.setUint32(p, n, true); p += 4; }
    txt('data'); v.setUint32(p, datos, true); p += 4;
    for (i = 0; i < n; i++) for (k = 0; k < nc; k++) {
      var x = canales[k][i];
      if (flot) { v.setFloat32(p, x, true); p += 4; }
      else {
        x = x > 1 ? 1 : x < -1 ? -1 : x;
        if (bps === 16) { v.setInt16(p, Math.min(32767, Math.round(x * 32768)), true); p += 2; }
        else { var q = Math.min(8388607, Math.round(x * 8388608)); out[p++] = q & 255; out[p++] = (q >> 8) & 255; out[p++] = (q >> 16) & 255; }
      }
    }
    return out;
  };

  /* ============================================================ FLAC */
  var T8 = null, T16 = null;
  function tablas() {
    if (T8) return;
    T8 = new Uint8Array(256); T16 = new Uint16Array(256);
    for (var i = 0; i < 256; i++) {
      var a = i, b = i << 8, j;
      for (j = 0; j < 8; j++) { a = (a & 128) ? ((a << 1) ^ 0x07) & 255 : (a << 1) & 255; b = (b & 0x8000) ? ((b << 1) ^ 0x8005) & 0xffff : (b << 1) & 0xffff; }
      T8[i] = a; T16[i] = b;
    }
  }
  function crc8(b, ini, fin) { var c = 0; for (var i = ini; i < fin; i++) c = T8[c ^ b[i]]; return c; }
  function crc16(b, ini, fin) { var c = 0; for (var i = ini; i < fin; i++) c = ((c << 8) & 0xffff) ^ T16[((c >> 8) ^ b[i]) & 255]; return c; }

  function Bits() { this.buf = new Uint8Array(1 << 16); this.n = 0; this.acc = 0; this.nb = 0; }
  Bits.prototype.byte = function (b) { if (this.n >= this.buf.length) { var g = new Uint8Array(this.buf.length * 2); g.set(this.buf); this.buf = g; } this.buf[this.n++] = b; };
  Bits.prototype.escribir = function (v, n) {            // v: entero sin signo < 2^n, n ≤ 32
    while (n > 0) {
      var t = Math.min(n, 8 - this.nb), parte = Math.floor(v / Math.pow(2, n - t)) & ((1 << t) - 1);
      this.acc = (this.acc << t) | parte; this.nb += t; n -= t; v -= parte * Math.pow(2, n);
      if (this.nb === 8) { this.byte(this.acc & 255); this.acc = 0; this.nb = 0; }
    }
  };
  Bits.prototype.conSigno = function (v, n) { this.escribir(v < 0 ? v + Math.pow(2, n) : v, n); };
  Bits.prototype.unario = function (q) { while (q >= 8) { this.escribir(0, 8); q -= 8; } this.escribir(1, q + 1); };
  Bits.prototype.alinear = function () { if (this.nb) this.escribir(0, 8 - this.nb); };

  function plegar(r) { return r >= 0 ? r * 2 : -r * 2 - 1; }
  /* Residuo de un predictor fijo de orden o (0 a 4) */
  function residuo(x, o) {
    var n = x.length, r = new Int32Array(n - o), i;
    switch (o) {
      case 0: for (i = 0; i < n; i++) r[i] = x[i]; break;
      case 1: for (i = 1; i < n; i++) r[i - 1] = x[i] - x[i - 1]; break;
      case 2: for (i = 2; i < n; i++) r[i - 2] = x[i] - 2 * x[i - 1] + x[i - 2]; break;
      case 3: for (i = 3; i < n; i++) r[i - 3] = x[i] - 3 * x[i - 1] + 3 * x[i - 2] - x[i - 3]; break;
      default: for (i = 4; i < n; i++) r[i - 4] = x[i] - 4 * x[i - 1] + 6 * x[i - 2] - 4 * x[i - 3] + x[i - 4];
    }
    return r;
  }
  function paramRice(suma, cuenta) {                      // k que minimiza (aprox.) los bits de una partición
    if (cuenta === 0) return 0;
    var media = suma / cuenta, k = 0;
    while (k < 30 && Math.pow(2, k + 1) <= media) k++;
    return k;
  }
  function bitsPart(suma, cuenta, k) { return cuenta * (k + 1) + Math.floor(suma / Math.pow(2, k)); }
  /* Mejor orden de partición para un residuo: devuelve { po, bits } con una estimación de coste (sumas acumuladas: cada partición cuesta O(1)) */
  function mejorParticion(r, n, o) {
    var m = r.length, pre = new Float64Array(m + 1), i, best = null, po;
    for (i = 0; i < m; i++) pre[i + 1] = pre[i] + plegar(r[i]);
    for (po = 0; po <= 8; po++) {
      var P = 1 << po;
      if (n % P !== 0 || (n >> po) <= o) continue;
      var bits = 0, pos = 0, p, tam, s;
      for (p = 0; p < P; p++) {
        tam = (n >> po) - (p === 0 ? o : 0); s = pre[pos + tam] - pre[pos]; pos += tam;
        bits += 4 + bitsPart(s, tam, paramRice(s, tam));
      }
      if (!best || bits < best.bits) best = { po: po, bits: bits };
    }
    return best;
  }
  /* Elige el mejor subframe (constante, fijo de orden 0 a 4 o literal) para una señal entera x con bps bits */
  function elegirSubframe(x, bps) {
    var n = x.length, i, todoIgual = true;
    for (i = 1; i < n; i++) if (x[i] !== x[0]) { todoIgual = false; break; }
    if (todoIgual) return { tipo: 'cte', bits: 8 + bps };
    var mejor = { tipo: 'lit', bits: 8 + n * bps }, o;
    for (o = 0; o <= 4 && o < n; o++) {
      var r = residuo(x, o), part = mejorParticion(r, n, o);
      if (!part) continue;
      var bits = 8 + o * bps + 6 + part.bits;
      if (bits < mejor.bits) mejor = { tipo: 'fijo', orden: o, res: r, po: part.po, bits: bits };
    }
    return mejor;
  }
  function escribirSubframe(w, x, bps, sf) {
    var n = x.length, i;
    if (sf.tipo === 'cte') { w.escribir(0, 8); w.conSigno(x[0], bps); return; }
    if (sf.tipo === 'lit') { w.escribir(1 << 1, 8); for (i = 0; i < n; i++) w.conSigno(x[i], bps); return; }
    var o = sf.orden, r = sf.res, P = 1 << sf.po, p, tam, s, j, k, pos = 0, ks = [], maxK = 0;
    for (p = 0; p < P; p++) {
      tam = (n >> sf.po) - (p === 0 ? o : 0); s = 0;
      for (j = 0; j < tam; j++) s += plegar(r[pos + j]);
      k = paramRice(s, tam);
      // ajuste fino: probar k-1 y k+1 con el coste exacto
      var mejorK = k, mejorB = Infinity, kk, b, q;
      for (kk = Math.max(0, k - 1); kk <= Math.min(30, k + 1); kk++) { b = 0; for (j = 0; j < tam; j++) b += Math.floor(plegar(r[pos + j]) / Math.pow(2, kk)) + 1 + kk; if (b < mejorB) { mejorB = b; mejorK = kk; } }
      ks.push(mejorK); if (mejorK > maxK) maxK = mejorK; pos += tam;
    }
    var metodo = maxK > 14 ? 1 : 0, bitsK = metodo ? 5 : 4;
    w.escribir(0, 1); w.escribir(8 + o, 6); w.escribir(0, 1);                  // cabecera: 0, tipo (001000 + orden), sin bits desaprovechados
    for (i = 0; i < o; i++) w.conSigno(x[i], bps);                             // muestras de arranque
    w.escribir(metodo, 2); w.escribir(sf.po, 4);
    pos = 0;
    for (p = 0; p < P; p++) {
      tam = (n >> sf.po) - (p === 0 ? o : 0); k = ks[p]; w.escribir(k, bitsK);
      for (j = 0; j < tam; j++) { var u = plegar(r[pos + j]), q2 = Math.floor(u / Math.pow(2, k)); w.unario(q2); if (k) w.escribir(u - q2 * Math.pow(2, k), k); }
      pos += tam;
    }
  }
  function utf8Numero(w, v) {
    if (v < 0x80) { w.escribir(v, 8); return; }
    var n = v < 0x800 ? 2 : v < 0x10000 ? 3 : v < 0x200000 ? 4 : v < 0x4000000 ? 5 : v < 0x80000000 ? 6 : 7, i;
    var primero = (0xff00 >> n) & 0xff, resto = [];
    for (i = 0; i < n - 1; i++) { resto.push(0x80 | (v % 64)); v = Math.floor(v / 64); }
    w.escribir(primero | v, 8);
    for (i = n - 2; i >= 0; i--) w.escribir(resto[i], 8);
  }
  S.flac = function (canales, hz, bits, md5) {
    tablas();
    var nc = canales.length, n = nc ? canales[0].length : 0, B = 4096;
    if (bits !== 16 && bits !== 24) throw new Error('Formato FLAC no admitido: usa 16 o 24 bits.');
    if (nc < 1 || nc > 8) throw new Error('FLAC admite de 1 a 8 canales.');
    var maxV = Math.pow(2, bits - 1) - 1, minV = -Math.pow(2, bits - 1), i, c, ent = [];
    for (c = 0; c < nc; c++) {
      var e = new Int32Array(n), x = canales[c];
      for (i = 0; i < n; i++) { var q = Math.round(x[i] * Math.pow(2, bits - 1)); e[i] = q < minV ? minV : q > maxV ? maxV : q; }
      ent.push(e);
    }
    var codigoBps = bits === 16 ? 4 : 6, frames = [], minF = Infinity, maxF = 0, ini;
    for (ini = 0, i = 0; ini < n; ini += B, i++) {
      var len = Math.min(B, n - ini), w = new Bits(), seg = ent.map(function (e2) { return e2.subarray(ini, ini + len); }), asign = nc - 1, sub, bpsSub, k, mejor;
      var señales = seg, bpsCanal = seg.map(function () { return bits; });
      if (nc === 2) {
        var L = seg[0], R = seg[1], M = new Int32Array(len), D = new Int32Array(len);
        for (k = 0; k < len; k++) { M[k] = (L[k] + R[k]) >> 1; D[k] = L[k] - R[k]; }
        var cL = elegirSubframe(L, bits), cR = elegirSubframe(R, bits), cM = elegirSubframe(M, bits), cD = elegirSubframe(D, bits + 1);
        var opciones = [[cL.bits + cR.bits, 1, [L, R], [cL, cR], [bits, bits]], [cL.bits + cD.bits, 8, [L, D], [cL, cD], [bits, bits + 1]],
                        [cD.bits + cR.bits, 9, [D, R], [cD, cR], [bits + 1, bits]], [cM.bits + cD.bits, 10, [M, D], [cM, cD], [bits, bits + 1]]];
        mejor = opciones.reduce(function (a, b) { return b[0] < a[0] ? b : a; });
        asign = mejor[1]; señales = mejor[2]; sub = mejor[3]; bpsSub = mejor[4];
      } else { sub = señales.map(function (x) { return elegirSubframe(x, bits); }); bpsSub = bpsCanal; }
      // cabecera de la trama
      w.escribir(0xfff8, 16);
      var codBloque = len === B ? 12 : len <= 256 ? 6 : 7;
      w.escribir(codBloque, 4); w.escribir(0, 4);
      w.escribir(asign, 4); w.escribir(codigoBps, 3); w.escribir(0, 1);
      utf8Numero(w, i);
      if (codBloque === 6) w.escribir(len - 1, 8); else if (codBloque === 7) w.escribir(len - 1, 16);
      w.escribir(crc8(w.buf, 0, w.n), 8);
      for (k = 0; k < nc; k++) escribirSubframe(w, señales[k], bpsSub[k], sub[k]);
      w.alinear(); w.escribir(crc16(w.buf, 0, w.n), 16);
      var fr = w.buf.slice(0, w.n); frames.push(fr); if (fr.length < minF) minF = fr.length; if (fr.length > maxF) maxF = fr.length;
    }
    var firma = new Uint8Array(16);
    if (md5) {
      var bytes = bits / 8, pcm = new Uint8Array(n * nc * bytes), p = 0, kk, b2;
      for (i = 0; i < n; i++) for (kk = 0; kk < nc; kk++) { var val = ent[kk][i]; for (b2 = 0; b2 < bytes; b2++) { pcm[p++] = val & 255; val >>= 8; } }
      firma = md5(pcm);
    }
    var cab = new Uint8Array(4 + 4 + 34), v = new DataView(cab.buffer);
    cab.set([0x66, 0x4c, 0x61, 0x43, 0x80, 0, 0, 34]);                       // «fLaC» + bloque STREAMINFO (el último de los metadatos)
    var bloque = n === 0 ? 4096 : Math.max(16, Math.min(B, n)), p2 = 8;
    v.setUint16(p2, bloque, false); p2 += 2; v.setUint16(p2, bloque, false); p2 += 2;
    function u24(x) { cab[p2++] = (x >> 16) & 255; cab[p2++] = (x >> 8) & 255; cab[p2++] = x & 255; }
    u24(frames.length ? minF : 0); u24(frames.length ? maxF : 0);
    cab[p2++] = (hz >> 12) & 255; cab[p2++] = (hz >> 4) & 255; cab[p2++] = ((hz & 15) << 4) | ((nc - 1) << 1) | (((bits - 1) >> 4) & 1);
    cab[p2++] = (((bits - 1) & 15) << 4) | (Math.floor(n / 4294967296) & 15); v.setUint32(p2, n >>> 0, false); p2 += 4;
    cab.set(firma, p2);
    var tot = cab.length, f; frames.forEach(function (x) { tot += x.length; });
    var out = new Uint8Array(tot); out.set(cab, 0); var q2 = cab.length;
    frames.forEach(function (x) { out.set(x, q2); q2 += x.length; });
    return out;
  };

  /* ============================================================ Ogg Opus */
  var CRC_OGG = null;
  function tablaOgg() {
    if (CRC_OGG) return;
    CRC_OGG = new Uint32Array(256);
    for (var i = 0; i < 256; i++) { var r = i << 24; for (var j = 0; j < 8; j++) r = (r & 0x80000000) ? ((r << 1) ^ 0x04c11db7) : (r << 1); CRC_OGG[i] = r >>> 0; }
  }
  /* paquetes: lista de Uint8Array con paquetes Opus (cada uno suele durar 20 ms = 960 muestras a 48 kHz).
     opciones: { canales, frecuencia (la original, solo informativa), preSkip, muestras (muestras reales a 48 kHz, sin el relleno final), porPaquete (960), cabecera (OpusHead ya hecha, opcional), vendedor } */
  S.ogg = function (paquetes, opciones) {
    tablaOgg();
    var o = opciones || {}, canales = o.canales || 2, preSkip = o.preSkip == null ? 312 : o.preSkip, por = o.porPaquete || 960, serie = o.serie == null ? 0x54594a31 : o.serie;
    var cab = o.cabecera ? new Uint8Array(o.cabecera) : (function () {
      var h = new Uint8Array(19), v = new DataView(h.buffer);
      h.set([0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64, 1, canales]); v.setUint16(10, preSkip, true); v.setUint32(12, o.frecuencia || 48000, true); v.setUint16(16, 0, true); h[18] = 0;
      return h;
    })();
    var vend = new TextEncoder().encode(o.vendedor || 'TrabajoYJuego'), tags = new Uint8Array(8 + 4 + vend.length + 4), tv = new DataView(tags.buffer);
    tags.set([0x4f, 0x70, 0x75, 0x73, 0x54, 0x61, 0x67, 0x73]); tv.setUint32(8, vend.length, true); tags.set(vend, 12); tv.setUint32(12 + vend.length, 0, true);
    var paginas = [], seq = 0;
    function pagina(lista, granule, tipo) {
      var segs = [], datos = 0, i, j;
      lista.forEach(function (p) { var l = p.length; while (l >= 255) { segs.push(255); l -= 255; } segs.push(l); datos += p.length; });
      var buf = new Uint8Array(27 + segs.length + datos), v = new DataView(buf.buffer), pos = 27 + segs.length;
      buf.set([0x4f, 0x67, 0x67, 0x53, 0, tipo]);
      v.setUint32(6, granule % 4294967296, true); v.setUint32(10, Math.floor(granule / 4294967296), true);
      v.setUint32(14, serie, true); v.setUint32(18, seq++, true); buf[26] = segs.length;
      for (i = 0; i < segs.length; i++) buf[27 + i] = segs[i];
      lista.forEach(function (p) { buf.set(p, pos); pos += p.length; });
      var crc = 0; for (j = 0; j < buf.length; j++) crc = ((crc << 8) ^ CRC_OGG[((crc >>> 24) & 255) ^ buf[j]]) >>> 0;
      v.setUint32(22, crc, true);
      paginas.push(buf);
    }
    pagina([cab], 0, 2); pagina([tags], 0, 0);
    var grupo = [], segsGrupo = 0, enPaquetes = 0, i, total = paquetes.length, finGranule;
    for (i = 0; i < total; i++) {
      var ns = Math.floor(paquetes[i].length / 255) + 1;
      if (grupo.length && (segsGrupo + ns > 250 || grupo.length >= 50)) { pagina(grupo, enPaquetes * por, 0); grupo = []; segsGrupo = 0; }
      grupo.push(paquetes[i]); segsGrupo += ns; enPaquetes++;
    }
    finGranule = o.muestras != null ? Math.min(preSkip + o.muestras, preSkip + enPaquetes * por) : preSkip + enPaquetes * por;
    pagina(grupo, finGranule, 4);
    var tot = 0; paginas.forEach(function (p) { tot += p.length; });
    var out = new Uint8Array(tot), q = 0; paginas.forEach(function (p) { out.set(p, q); q += p.length; });
    return out;
  };

  /* ============================================================ Tono (YIN) y notas */
  /* muestras: Float32Array (mono) con al menos 2 × (hz / fMin) muestras. Devuelve { hz, claridad } o null. */
  S.tono = function (x, hz, opc) {
    var o = opc || {}, fMin = o.min || 50, fMax = o.max || 1200, umbral = o.umbral == null ? 0.12 : o.umbral;
    var W = Math.floor(x.length / 2), tauMax = Math.min(W - 1, Math.floor(hz / fMin)), tauMin = Math.max(2, Math.floor(hz / fMax)), i, tau;
    var energia = 0; for (i = 0; i < x.length; i++) energia += x[i] * x[i];
    if (Math.sqrt(energia / x.length) < (o.silencio == null ? 0.01 : o.silencio)) return null;
    var d = new Float64Array(tauMax + 2), dn = new Float64Array(tauMax + 2), suma = 0, dif;
    for (tau = 1; tau <= tauMax + 1; tau++) {
      var s = 0; for (i = 0; i < W; i++) { dif = x[i] - x[i + tau]; s += dif * dif; }
      d[tau] = s; suma += s; dn[tau] = suma > 0 ? d[tau] * tau / suma : 1;
    }
    dn[0] = 1;
    var elegido = -1;
    for (tau = tauMin; tau <= tauMax; tau++) {
      if (dn[tau] < umbral) {                               // primer valle por debajo del umbral: se toma el mínimo de toda la zona que sigue por debajo (el ruido crea bultos falsos)
        elegido = tau;
        while (tau + 1 <= tauMax && dn[tau + 1] < umbral) { tau++; if (dn[tau] < dn[elegido]) elegido = tau; }
        break;
      }
    }
    if (elegido < 0) return null;
    var a = d[elegido - 1], b = d[elegido], c = d[elegido + 1], den = a - 2 * b + c, mejor = elegido;
    if (den !== 0) { var delta = 0.5 * (a - c) / den; if (Math.abs(delta) < 1) mejor = elegido + delta; }
    return { hz: hz / mejor, claridad: 1 - Math.min(1, dn[elegido]) };
  };
  var NOMBRES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  var LETRAS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  S.nota = function (hz, la4) {
    la4 = la4 || 440;
    var m = 69 + 12 * Math.log(hz / la4) / Math.LN2, r = Math.round(m), cents = (m - r) * 100;
    return { midi: r, nombre: NOMBRES[((r % 12) + 12) % 12], letra: LETRAS[((r % 12) + 12) % 12], octava: Math.floor(r / 12) - 1, cents: cents };
  };
  S.frecuenciaDeNota = function (midi, la4) { return (la4 || 440) * Math.pow(2, (midi - 69) / 12); };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
  else { global.TH = global.TH || {}; global.TH.sonido = S; }
})(typeof window !== 'undefined' ? window : globalThis);

/* Resúmenes criptográficos (hash) escritos para este sitio, sin dependencias y de forma síncrona: MD5, SHA-1, SHA-256, SHA-384 y SHA-512.
   TH.hash.md5(bytes) · .sha1 · .sha256 · .sha384 · .sha512 → Uint8Array con el resumen (bytes: Uint8Array o array de números 0-255)
   TH.hash.hex(bytes, mayusculas) · TH.hash.base64(bytes) · TH.hash.ALGORITMOS = [{ id, nombre, bits }]
   Las constantes se calcularon con enteros exactos (raíces de los primeros primos, senos para MD5) y todo se verifica contra hashlib de Python
   (pruebas/test_hash_lib.py). Se carga con TH.script('lib/hash.js'). MD5 y SHA-1 están rotos para firmas: sirven para comprobar archivos, no para seguridad. */
(function (global) {
  'use strict';
  var H = {};
  var K256 = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  var MD5K = [0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8, 0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665, 0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391];
  var MD5S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  var K512 = [0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd, 0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc, 0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019, 0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118, 0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe, 0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2, 0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1, 0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694, 0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3, 0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65, 0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483, 0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5, 0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210, 0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4, 0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725, 0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70, 0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926, 0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df, 0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8, 0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b, 0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001, 0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30, 0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910, 0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8, 0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53, 0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8, 0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb, 0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3, 0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60, 0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec, 0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9, 0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b, 0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207, 0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178, 0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6, 0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b, 0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493, 0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c, 0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a, 0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817];                                    // pares [alto, bajo] de 32 bits
  var IV256 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  var IV512 = [0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1, 0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179];
  var IV384 = [0xcbbb9d5d, 0xc1059ed8, 0x629a292a, 0x367cd507, 0x9159015a, 0x3070dd17, 0x152fecd8, 0xf70e5939, 0x67332667, 0xffc00b31, 0x8eb44a87, 0x68581511, 0xdb0c2e0d, 0x64f98fa7, 0x47b5481d, 0xbefa4fa4];
  var DOS32 = 4294967296;

  /* Rellena el mensaje: 0x80, ceros y la longitud en bits (8 bytes; en SHA-512 son 16, aquí los 8 altos siempre valen 0). */
  function rellenar(bytes, bloque, ancho, grande) {
    var n = bytes.length, total = Math.ceil((n + 1 + ancho) / bloque) * bloque, m = new Uint8Array(total), i;
    for (i = 0; i < n; i++) m[i] = bytes[i];
    m[n] = 0x80;
    var bits = n * 8, alto = Math.floor(bits / DOS32), bajo = bits >>> 0;
    if (grande) {
      m[total - 8] = alto >>> 24; m[total - 7] = (alto >>> 16) & 255; m[total - 6] = (alto >>> 8) & 255; m[total - 5] = alto & 255;
      m[total - 4] = bajo >>> 24; m[total - 3] = (bajo >>> 16) & 255; m[total - 2] = (bajo >>> 8) & 255; m[total - 1] = bajo & 255;
    } else {
      m[total - 8] = bajo & 255; m[total - 7] = (bajo >>> 8) & 255; m[total - 6] = (bajo >>> 16) & 255; m[total - 5] = bajo >>> 24;
      m[total - 4] = alto & 255; m[total - 3] = (alto >>> 8) & 255; m[total - 2] = (alto >>> 16) & 255; m[total - 1] = alto >>> 24;
    }
    return m;
  }
  function rol(x, n) { return (x << n) | (x >>> (32 - n)); }
  function ror(x, n) { return (x >>> n) | (x << (32 - n)); }
  function palabrasGrandes(salida, estado, cuantas) {
    var s = new Uint8Array(cuantas * 4), i;
    for (i = 0; i < cuantas; i++) { s[4 * i] = estado[i] >>> 24; s[4 * i + 1] = (estado[i] >>> 16) & 255; s[4 * i + 2] = (estado[i] >>> 8) & 255; s[4 * i + 3] = estado[i] & 255; }
    return s;
  }

  H.md5 = function (bytes) {
    var m = rellenar(bytes, 64, 8, false), a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476, w = new Array(16), p, i;
    for (p = 0; p < m.length; p += 64) {
      for (i = 0; i < 16; i++) w[i] = m[p + 4 * i] | (m[p + 4 * i + 1] << 8) | (m[p + 4 * i + 2] << 16) | (m[p + 4 * i + 3] << 24);
      var a = a0, b = b0, c = c0, d = d0;
      for (i = 0; i < 64; i++) {
        var f, g;
        if (i < 16) { f = (b & c) | (~b & d); g = i; }
        else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
        else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
        else { f = c ^ (b | ~d); g = (7 * i) % 16; }
        f = (f + a + MD5K[i] + w[g]) | 0;
        a = d; d = c; c = b; b = (b + rol(f, MD5S[i])) | 0;
      }
      a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
    }
    var s = new Uint8Array(16), e = [a0, b0, c0, d0];
    for (i = 0; i < 4; i++) { s[4 * i] = e[i] & 255; s[4 * i + 1] = (e[i] >>> 8) & 255; s[4 * i + 2] = (e[i] >>> 16) & 255; s[4 * i + 3] = (e[i] >>> 24) & 255; }
    return s;
  };

  H.sha1 = function (bytes) {
    var m = rellenar(bytes, 64, 8, true), h = [0x67452301, 0xefcdab89 | 0, 0x98badcfe | 0, 0x10325476, 0xc3d2e1f0 | 0], w = new Array(80), p, i;
    for (p = 0; p < m.length; p += 64) {
      for (i = 0; i < 16; i++) w[i] = (m[p + 4 * i] << 24) | (m[p + 4 * i + 1] << 16) | (m[p + 4 * i + 2] << 8) | m[p + 4 * i + 3];
      for (i = 16; i < 80; i++) w[i] = rol(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4];
      for (i = 0; i < 80; i++) {
        var f, k;
        if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
        else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
        else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc | 0; }
        else { f = b ^ c ^ d; k = 0xca62c1d6 | 0; }
        var t = (rol(a, 5) + f + e + k + w[i]) | 0;
        e = d; d = c; c = rol(b, 30); b = a; a = t;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0; h[4] = (h[4] + e) | 0;
    }
    return palabrasGrandes(null, h, 5);
  };

  H.sha256 = function (bytes) {
    var m = rellenar(bytes, 64, 8, true), h = IV256.slice(), w = new Array(64), p, i;
    for (p = 0; p < m.length; p += 64) {
      for (i = 0; i < 16; i++) w[i] = (m[p + 4 * i] << 24) | (m[p + 4 * i + 1] << 16) | (m[p + 4 * i + 2] << 8) | m[p + 4 * i + 3];
      for (i = 16; i < 64; i++) {
        var s0 = ror(w[i - 15], 7) ^ ror(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = ror(w[i - 2], 17) ^ ror(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (i = 0; i < 64; i++) {
        var S1 = ror(e, 6) ^ ror(e, 11) ^ ror(e, 25), ch = (e & f) ^ (~e & g), t1 = (hh + S1 + ch + K256[i] + w[i]) | 0;
        var S0 = ror(a, 2) ^ ror(a, 13) ^ ror(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0; h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    return palabrasGrandes(null, h, 8);
  };

  /* SHA-512 y SHA-384: aritmética de 64 bits con pares (alto, bajo) de 32 bits. */
  var RH = 0, RL = 0;
  function rotar(hi, lo, n) {                              // rotación a la derecha de un valor de 64 bits; resultado en RH, RL
    var t;
    if (n >= 32) { t = hi; hi = lo; lo = t; n -= 32; }
    if (n === 0) { RH = hi >>> 0; RL = lo >>> 0; return; }
    RH = ((hi >>> n) | (lo << (32 - n))) >>> 0; RL = ((lo >>> n) | (hi << (32 - n))) >>> 0;
  }
  function desplazar(hi, lo, n) { RH = hi >>> n; RL = ((lo >>> n) | (hi << (32 - n))) >>> 0; }
  function sumar(lista) {                                  // suma de varios pares (alto, bajo) módulo 2^64; resultado en RH, RL
    var sh = 0, sl = 0, i;
    for (i = 0; i < lista.length; i += 2) { sh += lista[i]; sl += lista[i + 1]; }
    RL = sl % DOS32; RH = (sh + Math.floor(sl / DOS32)) % DOS32;
  }
  function sha512(bytes, iv, salida) {
    var m = rellenar(bytes, 128, 16, true), h = iv.slice(), w = new Array(160), p, i, x1, x2, x3;
    for (p = 0; p < m.length; p += 128) {
      for (i = 0; i < 32; i++) w[i] = ((m[p + 4 * i] << 24) | (m[p + 4 * i + 1] << 16) | (m[p + 4 * i + 2] << 8) | m[p + 4 * i + 3]) >>> 0;
      for (i = 16; i < 80; i++) {
        var h15 = w[2 * (i - 15)], l15 = w[2 * (i - 15) + 1], h2 = w[2 * (i - 2)], l2 = w[2 * (i - 2) + 1];
        rotar(h15, l15, 1); x1 = RH; var y1 = RL; rotar(h15, l15, 8); x2 = RH; var y2 = RL; desplazar(h15, l15, 7);
        var s0h = (x1 ^ x2 ^ RH) >>> 0, s0l = (y1 ^ y2 ^ RL) >>> 0;
        rotar(h2, l2, 19); x1 = RH; y1 = RL; rotar(h2, l2, 61); x2 = RH; y2 = RL; desplazar(h2, l2, 6);
        var s1h = (x1 ^ x2 ^ RH) >>> 0, s1l = (y1 ^ y2 ^ RL) >>> 0;
        sumar([w[2 * (i - 16)], w[2 * (i - 16) + 1], s0h, s0l, w[2 * (i - 7)], w[2 * (i - 7) + 1], s1h, s1l]);
        w[2 * i] = RH; w[2 * i + 1] = RL;
      }
      var ah = h[0], al = h[1], bh = h[2], bl = h[3], ch_ = h[4], cl = h[5], dh = h[6], dl = h[7], eh = h[8], el = h[9], fh = h[10], fl = h[11], gh = h[12], gl = h[13], hh = h[14], hl = h[15];
      for (i = 0; i < 80; i++) {
        rotar(eh, el, 14); x1 = RH; y1 = RL; rotar(eh, el, 18); x2 = RH; y2 = RL; rotar(eh, el, 41);
        var S1h = (x1 ^ x2 ^ RH) >>> 0, S1l = (y1 ^ y2 ^ RL) >>> 0;
        var chH = ((eh & fh) ^ (~eh & gh)) >>> 0, chL = ((el & fl) ^ (~el & gl)) >>> 0;
        sumar([hh, hl, S1h, S1l, chH, chL, K512[2 * i], K512[2 * i + 1], w[2 * i], w[2 * i + 1]]);
        var t1h = RH, t1l = RL;
        rotar(ah, al, 28); x1 = RH; y1 = RL; rotar(ah, al, 34); x2 = RH; y2 = RL; rotar(ah, al, 39);
        var S0h = (x1 ^ x2 ^ RH) >>> 0, S0l = (y1 ^ y2 ^ RL) >>> 0;
        var mjH = ((ah & bh) ^ (ah & ch_) ^ (bh & ch_)) >>> 0, mjL = ((al & bl) ^ (al & cl) ^ (bl & cl)) >>> 0;
        sumar([S0h, S0l, mjH, mjL]);
        var t2h = RH, t2l = RL;
        hh = gh; hl = gl; gh = fh; gl = fl; fh = eh; fl = el;
        sumar([dh, dl, t1h, t1l]); eh = RH; el = RL;
        dh = ch_; dl = cl; ch_ = bh; cl = bl; bh = ah; bl = al;
        sumar([t1h, t1l, t2h, t2l]); ah = RH; al = RL;
      }
      var v = [ah, al, bh, bl, ch_, cl, dh, dl, eh, el, fh, fl, gh, gl, hh, hl];
      for (i = 0; i < 16; i += 2) { sumar([h[i], h[i + 1], v[i], v[i + 1]]); h[i] = RH; h[i + 1] = RL; }
    }
    return palabrasGrandes(null, h, salida);
  }
  H.sha512 = function (bytes) { return sha512(bytes, IV512, 16); };
  H.sha384 = function (bytes) { return sha512(bytes, IV384, 12); };

  H.hex = function (bytes, mayusculas) {
    var s = '', i;
    for (i = 0; i < bytes.length; i++) s += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
    return mayusculas ? s.toUpperCase() : s;
  };
  var ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  H.base64 = function (bytes) {
    var s = '', i, a, b, c;
    for (i = 0; i + 2 < bytes.length; i += 3) { a = bytes[i]; b = bytes[i + 1]; c = bytes[i + 2]; s += ABC.charAt(a >> 2) + ABC.charAt(((a & 3) << 4) | (b >> 4)) + ABC.charAt(((b & 15) << 2) | (c >> 6)) + ABC.charAt(c & 63); }
    if (bytes.length - i === 1) { a = bytes[i]; s += ABC.charAt(a >> 2) + ABC.charAt((a & 3) << 4) + '=='; }
    else if (bytes.length - i === 2) { a = bytes[i]; b = bytes[i + 1]; s += ABC.charAt(a >> 2) + ABC.charAt(((a & 3) << 4) | (b >> 4)) + ABC.charAt((b & 15) << 2) + '='; }
    return s;
  };
  H.ALGORITMOS = [{ id: 'md5', nombre: 'MD5', bits: 128 }, { id: 'sha1', nombre: 'SHA-1', bits: 160 }, { id: 'sha256', nombre: 'SHA-256', bits: 256 }, { id: 'sha384', nombre: 'SHA-384', bits: 384 }, { id: 'sha512', nombre: 'SHA-512', bits: 512 }];

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
  else { global.TH = global.TH || {}; global.TH.hash = H; }
})(typeof window !== 'undefined' ? window : globalThis);

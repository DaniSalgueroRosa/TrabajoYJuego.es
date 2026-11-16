/* Azar de calidad criptográfica para las herramientas que sortean, mezclan o generan contraseñas.
   TH.azar.entero(n) → entero uniforme en [0, n) · .entre(a, b) → entero uniforme en [a, b] (hasta 2^53)
   .barajar(lista) → copia mezclada (Fisher-Yates) · .elegir(lista) · .muestra(lista, k) → k elementos distintos, sin repetir posición
   Usa crypto.getRandomValues y rechaza los valores que darían más peso a unos números que a otros (sin sesgo de módulo).
   TH.azar.fuente se puede cambiar (pruebas): recibe un Uint8Array y lo rellena. Se verifica en pruebas/test_azar_lib.py. */
(function (global) {
  'use strict';
  var A = {};
  A.fuente = function (b) {
    var c = global.crypto || (typeof require !== 'undefined' ? require('crypto').webcrypto : null);
    if (!c || !c.getRandomValues) throw new Error('Tu navegador no permite generar números aleatorios seguros, así que esta herramienta no puede funcionar aquí.');
    for (var i = 0; i < b.length; i += 65536) c.getRandomValues(b.subarray(i, Math.min(b.length, i + 65536)));
    return b;
  };
  function u32() { var b = A.fuente(new Uint8Array(4)); return ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0; }
  A.entero = function (n) {
    if (!(n >= 1) || n !== Math.floor(n) || n > 9007199254740992) throw new RangeError('El tamaño debe ser un entero entre 1 y 2^53.');
    if (n === 1) return 0;
    if (n <= 4294967296) {
      var limite = Math.floor(4294967296 / n) * n, v;
      do { v = u32(); } while (v >= limite);
      return v % n;
    }
    var tope = Math.floor(9007199254740992 / n) * n, x;
    do { x = (u32() & 0x1fffff) * 4294967296 + u32(); } while (x >= tope);
    return x % n;
  };
  A.entre = function (a, b) {
    if (a > b) throw new RangeError('El mínimo no puede ser mayor que el máximo.');
    if (b - a + 1 > 9007199254740992) throw new RangeError('El intervalo es demasiado grande.');
    return a + A.entero(b - a + 1);
  };
  A.barajar = function (lista) {
    var c = Array.prototype.slice.call(lista), i, j, t;
    for (i = c.length - 1; i > 0; i--) { j = A.entero(i + 1); t = c[i]; c[i] = c[j]; c[j] = t; }
    return c;
  };
  A.elegir = function (lista) { if (!lista.length) throw new RangeError('La lista está vacía.'); return lista[A.entero(lista.length)]; };
  A.muestra = function (lista, k) {
    if (k > lista.length) throw new RangeError('No se pueden elegir más elementos de los que hay.');
    var c = Array.prototype.slice.call(lista), i, j, t;
    for (i = 0; i < k; i++) { j = i + A.entero(c.length - i); t = c[i]; c[i] = c[j]; c[j] = t; }
    return c.slice(0, k);
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = A;
  else { global.TH = global.TH || {}; global.TH.azar = A; }
})(typeof window !== 'undefined' ? window : globalThis);

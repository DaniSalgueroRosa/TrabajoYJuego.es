/* UTILIDADES COMUNES DE LOS JUEGOS (sin tocar la página: solo funciones puras que se pueden probar aparte).
   Todo cuelga de window.TYJ.util. Este archivo y juegos.js se suman en assets/js/juegos.js y se cargan antes del app.js de cada juego. */
(function (global) {
  'use strict';
  var TYJ = global.TYJ = global.TYJ || {};
  var U = TYJ.util = {};

  /* ---- Azar */
  U.azar = function (n) { return Math.floor(Math.random() * n); };                 // entero de 0 a n-1
  U.entre = function (a, b) { return a + U.azar(b - a + 1); };                     // entero de a a b, ambos incluidos
  U.elegir = function (lista) { return lista[U.azar(lista.length)]; };
  U.barajar = function (lista) {                                                   // Fisher-Yates, no modifica la original
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = U.azar(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  U.muestra = function (lista, n) { return U.barajar(lista).slice(0, n); };

  /* ---- Texto: minúsculas y sin acentos, conservando la ñ (en Wordle «ñ» es otra letra, «á» es «a») */
  U.norm = function (t) {
    return String(t).toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ').trim();
  };
  /* Clave para comparar respuestas escritas: sin acentos, sin ñ, sin signos y con un solo espacio entre palabras */
  U.clave = function (t) {
    return U.norm(t).replace(/ñ/g, 'n').replace(/[^a-z0-9]+/g, ' ').trim();
  };
  U.letras = function (t) { return Array.from(U.norm(t).replace(/\s+/g, '')); };
  U.distancia = function (a, b) {                                                  // distancia de Levenshtein
    if (a === b) return 0;
    var prev = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      var cur = [i];
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  };
  /* ¿«texto» es una de las respuestas aceptadas? Perdona una errata en palabras de 5 letras o más (dos a partir de 10). */
  U.coincide = function (texto, aceptadas) {
    var t = U.clave(texto);
    if (!t) return false;
    return aceptadas.some(function (a) {
      var c = U.clave(a);
      if (t === c) return true;
      var tolerancia = c.length >= 10 ? 2 : (c.length >= 5 ? 1 : 0);
      return tolerancia > 0 && Math.abs(t.length - c.length) <= tolerancia && U.distancia(t, c) <= tolerancia;
    });
  };

  /* ---- Wordle: «ok» letra bien colocada, «hay» está en otro sitio, «no» no está. Cuenta bien las letras repetidas. */
  U.evaluarPalabra = function (intento, secreta) {
    var a = U.letras(intento), s = U.letras(secreta), res = [], restantes = {}, i;
    for (i = 0; i < s.length; i++) {
      if (a[i] === s[i]) res[i] = 'ok';
      else { res[i] = 'no'; restantes[s[i]] = (restantes[s[i]] || 0) + 1; }
    }
    for (i = 0; i < a.length; i++) {
      if (res[i] !== 'ok' && restantes[a[i]] > 0) { res[i] = 'hay'; restantes[a[i]]--; }
    }
    return res;
  };

  /* ---- Números y tiempo */
  U.miles = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  U.tiempo = function (segundos) { var s = Math.max(0, Math.ceil(segundos)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
  U.limitar = function (n, min, max) { return Math.max(min, Math.min(max, n)); };
  U.diaDelAnio = function (fecha) {                                                // número de día (igual para todos en el mismo día local)
    var f = fecha || new Date();
    return Math.floor((Date.UTC(f.getFullYear(), f.getMonth(), f.getDate()) - Date.UTC(1970, 0, 1)) / 86400000);
  };
  U.nivel = function (puntos, tabla) {                                             // tabla: [[minimo, 'Nombre'], …] de menor a mayor
    var nombre = tabla[0][1];
    tabla.forEach(function (fila) { if (puntos >= fila[0]) nombre = fila[1]; });
    return nombre;
  };
  U.haversine = function (lat1, lon1, lat2, lon2) {                                // distancia en km entre dos puntos de la Tierra
    var r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 12742 * Math.asin(Math.min(1, Math.sqrt(a)));
  };
})(typeof window !== 'undefined' ? window : globalThis);

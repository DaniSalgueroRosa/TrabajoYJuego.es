/* Analizador y escritor de JSON estricto (RFC 8259) escrito para este sitio. Sin dependencias.
   A diferencia de JSON.parse, conserva los números y las cadenas tal como están escritos (no pierde cifras en enteros grandes ni cambia 1.0 por 1)
   y explica los errores en español con la línea y la columna. Se carga con TH.script('lib/json.js') y queda en TH.json (también con require en Node).
   J.analizar(texto) → { ok: true, raiz, stats } | { ok: false, error: { mensaje, linea, columna, pos } }
     nodos: { t: 'o', p: [{ k: clave tal cual, c: clave decodificada, v }] } · { t: 'a', e: [..] } · { t: 's'|'n'|'b'|'z', r: texto tal cual }
   J.escribir(raiz, { sangria: '  ' | '    ' | '\t' | null (minificado), ordenar: false | true }) → texto
   J.valor(nodo) → valor de JavaScript (los números enteros que no caben se dejan como cadena) · J.clave(c) · J.describirError(error) · J.MAX_PROFUNDIDAD */
(function (global) {
  'use strict';
  var J = { MAX_PROFUNDIDAD: 500 };
  var LETRA = /[A-Za-z_$]/;

  function describir(s, i) {
    if (i >= s.length) return 'el final del texto';
    var c = s.charAt(i);
    if (c === '\n') return 'un salto de línea';
    if (c === ' ') return 'un espacio';
    if (c === '\t') return 'un tabulador';
    return '«' + c + '»';
  }
  function posicion(s, pos) {
    var linea = 1, ini = 0, k;
    for (k = 0; k < pos && k < s.length; k++) if (s.charAt(k) === '\n') { linea++; ini = k + 1; }
    return { linea: linea, columna: pos - ini + 1 };
  }

  J.analizar = function (texto) {
    var s = String(texto == null ? '' : texto), i = 0, n = s.length, prof = 0;
    var st = { objetos: 0, matrices: 0, claves: 0, valores: 0, profundidad: 0, duplicadas: [] };
    if (s.charCodeAt(0) === 0xFEFF) { s = s.slice(1); n = s.length; }
    function fallo(msg, pos) { var e = new Error(msg); e.pos = pos; throw e; }
    function ws() { while (i < n) { var c = s.charCodeAt(i); if (c === 32 || c === 9 || c === 10 || c === 13) i++; else break; } }
    function inesperado(que) {
      var c = s.charAt(i), extra = '';
      if (c === "'") extra = ' JSON solo admite comillas dobles ("), no simples.';
      else if (c === '/' ) extra = ' JSON no admite comentarios.';
      else if (c === '#') extra = ' JSON no admite comentarios.';
      else if ((c === '}' || c === ']') && que === 'un valor') extra = ' ¿Sobra una coma antes de cerrar?';
      else if (c === ',' && que === 'un valor') extra = ' ¿Falta un valor antes de la coma?';
      else if (LETRA.test(c) && que === 'un valor') extra = ' Los textos van entre comillas dobles, y los únicos valores sin comillas son true, false, null y los números.';
      else if (LETRA.test(c) && que.indexOf('clave') >= 0) extra = ' Las claves deben ir entre comillas dobles.';
      else if (c === '}' && que.indexOf('clave') >= 0) extra = ' ¿Sobra una coma antes de cerrar?';
      fallo('Se esperaba ' + que + ', pero hay ' + describir(s, i) + '.' + extra, i);
    }
    function literal(pal, tipo) {
      if (!pal || s.substr(i, pal.length) !== pal || (i + pal.length < n && /[A-Za-z0-9_]/.test(s.charAt(i + pal.length)))) {
        var fin = i; while (fin < n && /[A-Za-z0-9_]/.test(s.charAt(fin))) fin++;
        fallo('«' + s.slice(i, Math.max(fin, i + 1)) + '» no es un valor válido en JSON. Los únicos valores sin comillas son true, false, null y los números.', i);
      }
      var nodo = { t: tipo, r: pal }; i += pal.length; st.valores++; return nodo;
    }
    function numero() {
      var ini = i;
      if (s.charAt(i) === '-') i++;
      if (i >= n || !/[0-9]/.test(s.charAt(i))) fallo('Número no válido: después del «-» tiene que haber una cifra.', i);
      if (s.charAt(i) === '0') { i++; if (i < n && /[0-9]/.test(s.charAt(i))) fallo('Número no válido: JSON no admite ceros a la izquierda («' + s.slice(ini, i + 1) + '…»).', ini); }
      else while (i < n && /[0-9]/.test(s.charAt(i))) i++;
      if (s.charAt(i) === '.') { i++; if (i >= n || !/[0-9]/.test(s.charAt(i))) fallo('Número no válido: después del punto decimal tiene que haber al menos una cifra.', i); while (i < n && /[0-9]/.test(s.charAt(i))) i++; }
      if (s.charAt(i) === 'e' || s.charAt(i) === 'E') {
        i++; if (s.charAt(i) === '+' || s.charAt(i) === '-') i++;
        if (i >= n || !/[0-9]/.test(s.charAt(i))) fallo('Número no válido: después de la «e» del exponente tiene que haber cifras.', i);
        while (i < n && /[0-9]/.test(s.charAt(i))) i++;
      }
      if (i < n && /[A-Za-z_.]/.test(s.charAt(i))) fallo('Número no válido: hay ' + describir(s, i) + ' pegado al número.', i);
      st.valores++;
      return { t: 'n', r: s.slice(ini, i) };
    }
    function cadena() {
      var ini = i; i++;
      for (;;) {
        if (i >= n) fallo('La cadena que empieza aquí no se cierra: falta la comilla doble final.', ini);
        var c = s.charCodeAt(i);
        if (c === 34) { i++; break; }
        if (c < 32) fallo(c === 10 ? 'Una cadena no puede tener un salto de línea sin escapar: usa \\n o cierra las comillas antes.' : 'Hay un carácter de control sin escapar dentro de una cadena.', i);
        if (c === 92) {
          var e = s.charAt(i + 1);
          if (e === 'u') { if (!/^[0-9a-fA-F]{4}$/.test(s.substr(i + 2, 4))) fallo('Secuencia \\u no válida: tiene que llevar cuatro cifras hexadecimales.', i); i += 6; }
          else if ('"\\/bfnrt'.indexOf(e) >= 0 && e !== '') i += 2;
          else fallo('Secuencia de escape no válida: «\\' + e + '». Las permitidas son \\" \\\\ \\/ \\b \\f \\n \\r \\t y \\uXXXX.', i);
        } else i++;
      }
      return s.slice(ini, i);
    }
    function valor() {
      ws();
      if (i >= n) fallo('El texto termina antes de tiempo: falta un valor.', n);
      var c = s.charAt(i);
      if (c === '{') return objeto();
      if (c === '[') return matriz();
      if (c === '"') { var r = cadena(); st.valores++; return { t: 's', r: r }; }
      if (c === '-' || (c >= '0' && c <= '9')) return numero();
      if (c === 't') return literal('true', 'b');
      if (c === 'f') return literal('false', 'b');
      if (c === 'n') return literal('null', 'z');
      if (LETRA.test(c)) return literal('', 'z');                                                // cualquier otra palabra (undefined, NaN, Infinity…)
      return inesperado('un valor');
    }
    function entrar() { if (++prof > J.MAX_PROFUNDIDAD) fallo('El JSON está demasiado anidado (más de ' + J.MAX_PROFUNDIDAD + ' niveles).', i); if (prof > st.profundidad) st.profundidad = prof; }
    function objeto() {
      var ini = i, nodo = { t: 'o', p: [] }, vistas = {};
      i++; entrar(); st.objetos++; ws();
      if (s.charAt(i) === '}') { i++; prof--; return nodo; }
      for (;;) {
        ws();
        if (i >= n) fallo('El objeto que empieza aquí no se cierra: falta «}».', ini);
        if (s.charAt(i) !== '"') inesperado('una clave entre comillas dobles');
        var posClave = i, k = cadena(), c = J.clave(k);
        ws();
        if (s.charAt(i) !== ':') { if (i >= n) fallo('El objeto que empieza aquí no se cierra: falta «}».', ini); inesperado('«:» después de la clave'); }
        i++;
        var v = valor();
        if (Object.prototype.hasOwnProperty.call(vistas, '$' + c)) st.duplicadas.push({ clave: c, pos: posClave }); vistas['$' + c] = 1;
        st.claves++;
        nodo.p.push({ k: k, c: c, v: v });
        ws();
        if (s.charAt(i) === ',') { i++; continue; }
        if (s.charAt(i) === '}') { i++; prof--; return nodo; }
        if (i >= n) fallo('El objeto que empieza aquí no se cierra: falta «}».', ini);
        inesperado('«,» o «}»');
      }
    }
    function matriz() {
      var ini = i, nodo = { t: 'a', e: [] };
      i++; entrar(); st.matrices++; ws();
      if (s.charAt(i) === ']') { i++; prof--; return nodo; }
      for (;;) {
        nodo.e.push(valor());
        ws();
        if (s.charAt(i) === ',') { i++; continue; }
        if (s.charAt(i) === ']') { i++; prof--; return nodo; }
        if (i >= n) fallo('La lista que empieza aquí no se cierra: falta «]».', ini);
        inesperado('«,» o «]»');
      }
    }
    try {
      ws();
      if (i >= n) fallo('No hay nada que analizar: el texto está vacío.', 0);
      var raiz = valor();
      ws();
      if (i < n) fallo('Hay texto después del final del JSON: ' + describir(s, i) + '. Un documento JSON tiene un solo valor en la raíz.', i);
      return { ok: true, raiz: raiz, stats: st, texto: s };
    } catch (e) {
      if (e && e.pos !== undefined) { var p = posicion(s, e.pos); return { ok: false, error: { mensaje: e.message, linea: p.linea, columna: p.columna, pos: e.pos }, texto: s }; }
      return { ok: false, error: { mensaje: 'No se ha podido analizar el JSON.', linea: 1, columna: 1, pos: 0 }, texto: s };
    }
  };

  J.clave = function (token) { return JSON.parse(token); };
  J.describirError = function (e) { return 'Línea ' + e.linea + ', columna ' + e.columna + ': ' + e.mensaje; };
  var COL = typeof Intl !== 'undefined' ? new Intl.Collator('es', { sensitivity: 'base' }) : null;
  function comparar(a, b) { var x = COL ? COL.compare(a, b) : 0; return x || (a < b ? -1 : a > b ? 1 : 0); }

  J.escribir = function (raiz, op) {
    op = op || {};
    var sang = op.sangria == null ? null : op.sangria, ord = !!op.ordenar, partes = [];
    function nl(nivel) { var t = '\n', k; for (k = 0; k < nivel; k++) t += sang; return t; }
    function es(nodo, nivel) {
      if (nodo.t === 'o') {
        if (!nodo.p.length) { partes.push('{}'); return; }
        var props = nodo.p.slice();
        if (ord) props = props.map(function (p, k) { return { p: p, k: k }; }).sort(function (x, y) { return comparar(x.p.c, y.p.c) || x.k - y.k; }).map(function (x) { return x.p; });
        partes.push('{');
        props.forEach(function (p, k) { if (k) partes.push(','); if (sang !== null) partes.push(nl(nivel + 1)); partes.push(p.k, sang !== null ? ': ' : ':'); es(p.v, nivel + 1); });
        if (sang !== null) partes.push(nl(nivel));
        partes.push('}');
      } else if (nodo.t === 'a') {
        if (!nodo.e.length) { partes.push('[]'); return; }
        partes.push('[');
        nodo.e.forEach(function (x, k) { if (k) partes.push(','); if (sang !== null) partes.push(nl(nivel + 1)); es(x, nivel + 1); });
        if (sang !== null) partes.push(nl(nivel));
        partes.push(']');
      } else partes.push(nodo.r);
    }
    es(raiz, 0);
    return partes.join('');
  };

  /* Valor de JavaScript de un nodo: lo usan los conversores. Un entero que no cabe con exactitud se deja como cadena para no perder cifras. */
  J.valor = function (nodo) {
    if (nodo.t === 'o') { var o = {}; nodo.p.forEach(function (p) { o[p.c] = J.valor(p.v); }); return o; }
    if (nodo.t === 'a') return nodo.e.map(J.valor);
    if (nodo.t === 's') return JSON.parse(nodo.r);
    if (nodo.t === 'b') return nodo.r === 'true';
    if (nodo.t === 'z') return null;
    var x = Number(nodo.r);
    return /^-?\d+$/.test(nodo.r) && Math.abs(x) > 9007199254740991 ? nodo.r : x;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = J;
  else { global.TH = global.TH || {}; global.TH.json = J; }
})(typeof window !== 'undefined' ? window : globalThis);

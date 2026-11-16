/* Minificador conservador de CSS, JavaScript y HTML escrito para este sitio, sin dependencias. Solo quita lo que no cambia el significado:
   comentarios, sangrías y saltos de línea innecesarios. No renombra variables ni reescribe expresiones.
   TH.minificar.css(texto) · .js(texto) · .html(texto, { bloques: true, incrustado: true })  →  { salida, avisos: [texto] }
   El JavaScript se analiza por componentes léxicos (cadenas, plantillas, expresiones regulares, números…) y el resultado se vuelve a analizar
   para comprobar que contiene exactamente los mismos componentes; si no es así se devuelve el código original. Se carga con TH.script('lib/minificar.js'). */
(function (global) {
  'use strict';
  var M = {};

  /* ============================================================ CSS */
  function siguienteCSS(s, i) {                                       // primer ; { } fuera de cadenas y paréntesis a partir de i
    var n = s.length, par = 0, c, j;
    while (i < n) {
      c = s.charAt(i);
      if (c === '"' || c === "'") { j = i + 1; while (j < n && s.charAt(j) !== c) { if (s.charAt(j) === '\\') j++; j++; } i = j + 1; continue; }
      if (c === '/' && s.charAt(i + 1) === '*') { j = s.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue; }
      if (c === '\\') { i += 2; continue; }
      if (c === '(') par++; else if (c === ')') par = Math.max(0, par - 1);
      else if (!par && (c === ';' || c === '{' || c === '}')) return c;
      i++;
    }
    return '';
  }
  M.css = function (s) {
    var o = '', i = 0, n = s.length, esp = false, par = 0, prof = 0, enDecl = false, c, j, avisos = [];
    function poner(t) {
      if (esp && o) {
        var l = o.charAt(o.length - 1), p = t.charAt(0), suelto = '{};,';
        var quita = suelto.indexOf(l) >= 0 || suelto.indexOf(p) >= 0 || l === ':' || l === '\n' || (par > 0 && (l === '(' || p === ')'));
        if (!quita && par === 0 && !enDecl && (l === '>' || l === '+' || l === '~' || p === '>' || p === '+' || p === '~')) quita = true;
        if (!quita) o += ' ';
      }
      esp = false; o += t;
    }
    while (i < n) {
      c = s.charAt(i);
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f') { esp = true; i++; continue; }
      if (c === '/' && s.charAt(i + 1) === '*') {
        j = s.indexOf('*/', i + 2);
        if (j < 0) { avisos.push('Hay un comentario /* que no se cierra; el resto del archivo se ha tratado como comentario.'); j = n - 2; }
        if (s.charAt(i + 2) === '!') { esp = false; o += (o && o.charAt(o.length - 1) !== '\n' ? '\n' : '') + s.slice(i, j + 2) + '\n'; } else esp = true;
        i = j + 2; continue;
      }
      if (c === '"' || c === "'") {
        j = i + 1; while (j < n && s.charAt(j) !== c) { if (s.charAt(j) === '\\') j++; j++; }
        poner(s.slice(i, j + 1)); i = j + 1; continue;
      }
      if (c === '\\') { poner(s.substr(i, 2)); i += 2; continue; }
      if ((c === 'u' || c === 'U') && /^url\(/i.test(s.substr(i, 4)) && (i === 0 || !/[\w-]/.test(s.charAt(i - 1)))) {
        j = i + 4; while (j < n && /\s/.test(s.charAt(j))) j++;
        if (s.charAt(j) !== '"' && s.charAt(j) !== "'") {
          var fin = s.indexOf(')', j); if (fin < 0) fin = n;
          poner('url(' + s.slice(j, fin).replace(/\s+$/, '') + ')'); i = fin + 1; continue;
        }
        poner(s.substr(i, 4)); par++; i += 4; continue;
      }
      if (c === '(') { poner('('); par++; i++; continue; }
      if (c === ')') { poner(')'); par = Math.max(0, par - 1); i++; continue; }
      if (c === '{') { poner('{'); prof++; enDecl = false; i++; continue; }
      if (c === '}') {
        if (o.charAt(o.length - 1) === ';') o = o.slice(0, -1);
        poner('}'); prof = Math.max(0, prof - 1); enDecl = false; i++; continue;
      }
      if (c === ';') { poner(';'); enDecl = false; i++; continue; }
      if (c === ':' && par === 0 && prof > 0) { enDecl = siguienteCSS(s, i + 1) !== '{'; if (enDecl) esp = false; poner(':'); i++; continue; }
      poner(c); i++;
    }
    return { salida: o.replace(/\s+$/, ''), avisos: avisos };
  };

  /* ============================================================ JavaScript */
  var PUNT = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=', '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', '**'];
  var ANTES_DE_REGEX = { 'return': 1, 'typeof': 1, 'instanceof': 1, 'in': 1, 'of': 1, 'new': 1, 'delete': 1, 'void': 1, 'throw': 1, 'case': 1, 'do': 1, 'else': 1, 'yield': 1, 'await': 1 };
  var RE_NUM = /(?:0[xX][0-9a-fA-F_]+n?|0[oO][0-7_]+n?|0[bB][01_]+n?|(?:[0-9][0-9_]*\.?[0-9_]*|\.[0-9][0-9_]*)(?:[eE][+-]?[0-9_]+)?n?)/y;
  var RE_ID = /[A-Za-z_$#\\\u0080-￿][\w$\u0080-￿\\]*/y;
  var RE_FLAGS = /[A-Za-z]*/y;

  function finCadena(s, i) {                                          // s[i] es la comilla; devuelve el índice posterior al cierre o -1
    var c = s.charAt(i), j = i + 1, n = s.length, d;
    while (j < n) {
      d = s.charAt(j);
      if (d === '\\') { j += (s.charAt(j + 1) === '\r' && s.charAt(j + 2) === '\n') ? 3 : 2; continue; }
      if (d === c) return j + 1;
      if (d === '\n' || d === '\r') return -1;
      j++;
    }
    return -1;
  }
  function finLlaves(s, j) {
    var n = s.length, prof = 1, c;
    while (j < n) {
      c = s.charAt(j);
      if (c === '"' || c === "'") { j = finCadena(s, j); if (j < 0) return -1; continue; }
      if (c === '`') { j = finPlantilla(s, j); if (j < 0) return -1; continue; }
      if (c === '/' && s.charAt(j + 1) === '/') { j = s.indexOf('\n', j); if (j < 0) return -1; continue; }
      if (c === '/' && s.charAt(j + 1) === '*') { j = s.indexOf('*/', j + 2); if (j < 0) return -1; j += 2; continue; }
      if (c === '{') prof++; else if (c === '}') { prof--; if (!prof) return j + 1; }
      j++;
    }
    return -1;
  }
  function finPlantilla(s, i) {
    var n = s.length, j = i + 1, c;
    while (j < n) {
      c = s.charAt(j);
      if (c === '\\') { j += 2; continue; }
      if (c === '`') return j + 1;
      if (c === '$' && s.charAt(j + 1) === '{') { j = finLlaves(s, j + 2); if (j < 0) return -1; continue; }
      j++;
    }
    return -1;
  }
  function leerJS(s) {                                                // → { tokens } | { error }
    var i = 0, n = s.length, t = [], nl = false, sp = false, c, j, m, ant;
    function poner(tipo, v) { t.push({ t: tipo, v: v, nl: nl, sp: sp }); nl = false; sp = false; }
    function ultimo() { for (var k = t.length - 1; k >= 0; k--) if (t[k].t !== 'com') return t[k]; return null; }
    if (s.slice(0, 2) === '#!') { j = s.indexOf('\n'); if (j < 0) j = n; poner('com', s.slice(0, j)); i = j; nl = true; }
    while (i < n) {
      c = s.charAt(i);
      if (c === '\n' || c === '\r' || c === ' ' || c === ' ') { nl = true; sp = true; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\f' || c === '\v' || c === ' ' || c === '﻿' || (c > '\u007f' && /\s/.test(c))) { sp = true; i++; continue; }
      if (c === '/' && s.charAt(i + 1) === '/') { j = i; while (j < n && s.charAt(j) !== '\n' && s.charAt(j) !== '\r' && s.charAt(j) !== ' ' && s.charAt(j) !== ' ') j++; i = j; sp = true; continue; }
      if (c === '/' && s.charAt(i + 1) === '*') {
        j = s.indexOf('*/', i + 2);
        if (j < 0) return { error: 'Hay un comentario /* que no se cierra.' };
        var com = s.slice(i, j + 2);
        if (/^\/\*[!@]|@license|@preserve|@cc_on/.test(com)) { poner('com', com); nl = true; }
        else { if (/[\n\r]/.test(com)) nl = true; sp = true; }
        i = j + 2; continue;
      }
      if (c === '"' || c === "'") { j = finCadena(s, i); if (j < 0) return { error: 'Hay una cadena de texto que no se cierra en la posición ' + (i + 1) + '.' }; poner('str', s.slice(i, j)); i = j; continue; }
      if (c === '`') { j = finPlantilla(s, i); if (j < 0) return { error: 'Hay una plantilla con comillas invertidas que no se cierra en la posición ' + (i + 1) + '.' }; poner('tpl', s.slice(i, j)); i = j; continue; }
      if (c === '/') {
        ant = ultimo();
        var esRegex = !ant || (ant.t === 'p' && !/^(\)|\]|\}|\+\+|--)$/.test(ant.v)) || (ant.t === 'id' && ANTES_DE_REGEX[ant.v] === 1);
        if (esRegex) {
          j = i + 1; var clase = false, ok = false;
          while (j < n) {
            m = s.charAt(j);
            if (m === '\\') { j += 2; continue; }
            if (m === '\n' || m === '\r') break;
            if (m === '[') clase = true; else if (m === ']') clase = false;
            else if (m === '/' && !clase) { ok = true; break; }
            j++;
          }
          if (ok) { RE_FLAGS.lastIndex = j + 1; var fl = RE_FLAGS.exec(s); poner('re', s.slice(i, j + 1 + fl[0].length)); i = j + 1 + fl[0].length; continue; }
        }
      }
      if ((c >= '0' && c <= '9') || (c === '.' && s.charAt(i + 1) >= '0' && s.charAt(i + 1) <= '9')) { RE_NUM.lastIndex = i; m = RE_NUM.exec(s); poner('num', m[0]); i += m[0].length; continue; }
      RE_ID.lastIndex = i; m = RE_ID.exec(s);
      if (m && m.index === i) { poner('id', m[0]); i += m[0].length; continue; }
      var p = null, k2;
      for (k2 = 0; k2 < PUNT.length; k2++) if (s.substr(i, PUNT[k2].length) === PUNT[k2] && !(PUNT[k2] === '?.' && s.charAt(i + 2) >= '0' && s.charAt(i + 2) <= '9')) { p = PUNT[k2]; break; }
      if (!p) p = c;
      poner('p', p); i += p.length;
    }
    return { tokens: t };
  }
  function esPalabra(ch) { return /[A-Za-z0-9_$\\\u0080-￿]/.test(ch); }
  function unirJS(t) {
    var o = '', k, prev = null, tk, a, b;
    for (k = 0; k < t.length; k++) {
      tk = t[k];
      if (prev) {
        if (tk.t === 'com' || prev.t === 'com') o += '\n';
        else {
          var fin = prev.t === 'id' || prev.t === 'num' || prev.t === 'str' || prev.t === 'tpl' || prev.t === 're' || prev.v === ')' || prev.v === ']' || prev.v === '}' || prev.v === '++' || prev.v === '--';
          var ini = tk.t === 'id' || tk.t === 'num' || tk.t === 'str' || tk.t === 're' || tk.v === '{' || tk.v === '++' || tk.v === '--' || tk.v === '!' || tk.v === '~';
          if (tk.nl && fin && ini) o += '\n';
          else {
            a = prev.v.charAt(prev.v.length - 1); b = tk.v.charAt(0);
            if ((esPalabra(a) && esPalabra(b)) || (a === '+' && b === '+') || (a === '-' && b === '-') || (a === '/' && (b === '/' || b === '*')) || (a === '<' && b === '!') || (prev.v.slice(-2) === '--' && b === '>') ||
                (prev.t === 'num' && b === '.') || (prev.t === 're' && esPalabra(b))) o += ' ';
          }
        }
      }
      o += tk.v; prev = tk;
    }
    return o;
  }
  function mismos(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i].t !== b[i].t || a[i].v !== b[i].v) return false;
    return true;
  }
  M.js = function (s) {
    var r = leerJS(s);
    if (r.error) return { salida: s, avisos: ['No se ha podido analizar el código (' + r.error + ') y se ha dejado como estaba.'] };
    var salida = unirJS(r.tokens), v = leerJS(salida);
    if (v.error || !mismos(r.tokens, v.tokens)) return { salida: s, avisos: ['No se ha podido minificar este código con total seguridad, así que se ha dejado como estaba. Suele deberse a una expresión regular o a una plantilla poco habitual.'] };
    return { salida: salida, avisos: [] };
  };

  /* ============================================================ HTML */
  var BLOQUE = {};
  ('address article aside base blockquote body br caption col colgroup dd details dialog div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html legend li link main menu meta nav ol optgroup option p pre script section style summary table tbody td template tfoot th thead title tr ul').split(' ').forEach(function (e) { BLOQUE[e] = 1; });
  var CRUDOS = { script: 1, style: 1, textarea: 1, pre: 1 };
  function ws(c) { return c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f'; }
  M.html = function (s, opc) {
    opc = opc || {};
    var bloques = opc.bloques !== false, incrustado = opc.incrustado !== false;
    var t = [], i = 0, n = s.length, avisos = [], texto = '', j, c;
    function volcarTexto() { if (texto) { t.push({ k: 'texto', s: texto }); texto = ''; } }
    while (i < n) {
      c = s.charAt(i);
      if (c !== '<') { j = s.indexOf('<', i + 1); if (j < 0) j = n; texto += s.slice(i, j); i = j; continue; }
      if (s.substr(i, 4) === '<!--') {
        j = s.indexOf('-->', i + 4); j = j < 0 ? n : j + 3;
        if (/^<!--\[|^<!--<!/.test(s.slice(i, j))) { volcarTexto(); t.push({ k: 'crudo', s: s.slice(i, j) }); }
        i = j; continue;
      }
      var nx = s.charAt(i + 1);
      if (nx === '!' || nx === '?') { volcarTexto(); j = s.indexOf('>', i); j = j < 0 ? n : j + 1; t.push({ k: 'crudo', s: s.slice(i, j) }); i = j; continue; }
      if (nx === '/' && /[A-Za-z]/.test(s.charAt(i + 2))) {
        j = s.indexOf('>', i); if (j < 0) { texto += s.slice(i); i = n; continue; }
        var nomC = /^[^\s>]+/.exec(s.slice(i + 2, j))[0];
        volcarTexto(); t.push({ k: 'tag', nombre: nomC.toLowerCase(), s: '</' + nomC + '>' }); i = j + 1; continue;
      }
      if (/[A-Za-z]/.test(nx)) {
        var q = i + 1, nom = '';
        while (q < n && !ws(s.charAt(q)) && s.charAt(q) !== '>' && s.charAt(q) !== '/') nom += s.charAt(q++);
        var attrs = [], cierra = false, ok = false, tipo = '';
        while (q < n) {
          while (q < n && ws(s.charAt(q))) q++;
          c = s.charAt(q);
          if (c === '>') { q++; ok = true; break; }
          if (c === '/') { if (s.charAt(q + 1) === '>') { cierra = true; q += 2; ok = true; break; } q++; continue; }
          var an = '';
          while (q < n && !ws(s.charAt(q)) && s.charAt(q) !== '=' && s.charAt(q) !== '>' && !(s.charAt(q) === '/' && s.charAt(q + 1) === '>')) an += s.charAt(q++);
          var k2 = q; while (k2 < n && ws(s.charAt(k2))) k2++;
          if (s.charAt(k2) === '=') {
            k2++; while (k2 < n && ws(s.charAt(k2))) k2++;
            var v, qc = s.charAt(k2);
            if (qc === '"' || qc === "'") { var fin = s.indexOf(qc, k2 + 1); if (fin < 0) break; v = s.slice(k2 + 1, fin); q = fin + 1;
              if (an.toLowerCase() === 'class') v = v.replace(/[ \t\n\r\f]+/g, ' ').replace(/^ | $/g, '');
              if (an.toLowerCase() === 'type') tipo = v.toLowerCase();
              attrs.push(an + '=' + qc + v + qc); }
            else { v = ''; while (k2 < n && !ws(s.charAt(k2)) && s.charAt(k2) !== '>') v += s.charAt(k2++); q = k2;
              if (an.toLowerCase() === 'type') tipo = v.toLowerCase();
              attrs.push(an + '=' + v); }
          } else attrs.push(an);
        }
        if (!ok) { texto += s.slice(i); i = n; continue; }
        volcarTexto();
        var etiqueta = '<' + nom + attrs.map(function (a) { return ' ' + a; }).join('') + (cierra ? '/>' : '>'), minus = nom.toLowerCase();
        t.push({ k: 'tag', nombre: minus, s: etiqueta }); i = q;
        if (CRUDOS[minus] && !cierra) {
          var re = new RegExp('</' + minus + '(?=[\\s>/])', 'i'), resto = s.slice(i), m = re.exec(resto), cont = m ? resto.slice(0, m.index) : resto;
          if (incrustado && minus === 'style') { var rc = M.css(cont); cont = rc.salida; rc.avisos.forEach(function (a) { avisos.push(a); }); }
          else if (incrustado && minus === 'script' && (!tipo || /^(text|application)\/(javascript|ecmascript)$|^module$/.test(tipo))) {
            var rj = M.js(cont); cont = rj.salida; rj.avisos.forEach(function (a) { avisos.push('En un bloque <script>: ' + a); });
          }
          if (cont) t.push({ k: 'crudo', s: cont });
          i += m ? m.index : resto.length;
        }
        continue;
      }
      texto += c; i++;
    }
    volcarTexto();
    var o = '', k;
    for (k = 0; k < t.length; k++) {
      var e = t[k];
      if (e.k !== 'texto') { o += e.s; continue; }
      var x = e.s.replace(/[ \t\n\r\f]+/g, ' ');
      if (bloques) {
        var prev = k > 0 ? t[k - 1] : null, sig = k + 1 < t.length ? t[k + 1] : null;
        if (!prev || (prev.k === 'tag' && BLOQUE[prev.nombre])) x = x.replace(/^ /, '');
        if (!sig || (sig.k === 'tag' && BLOQUE[sig.nombre])) x = x.replace(/ $/, '');
      }
      o += x;
    }
    return { salida: o.replace(/^\s+|\s+$/g, ''), avisos: avisos };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else { global.TH = global.TH || {}; global.TH.minificar = M; }
})(typeof window !== 'undefined' ? window : globalThis);

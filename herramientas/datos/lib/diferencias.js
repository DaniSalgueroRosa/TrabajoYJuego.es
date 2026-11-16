/* Diferencias entre dos documentos de texto, línea a línea, y reconstrucción de líneas a partir de los fragmentos de texto que da PDF.js. Se carga con TH.script('lib/diferencias.js') y queda en TH.diferencias:
   TH.diferencias.lineas(fragmentos)        → [texto]   fragmentos: [{ s: texto, x, y, w }] de una página (y crece hacia arriba, como en PDF); devuelve las líneas de arriba abajo, con sus palabras de izquierda a derecha
   TH.diferencias.comparar(A, B, opciones)  → { ops: [{ o: '=' | '-' | '+', a?: elementoDeA, b?: elementoDeB }], metodo: 'completo' | 'paginas' }
       A y B son listas de { t: texto, p: página }; opciones: { mayus: no distinguir mayúsculas, espacios: ignorar espacios sobrantes (por defecto sí) }.
       Si los documentos son tan largos que la comparación completa sería lenta, compara página con página (metodo 'paginas').
   TH.diferencias.palabras(a, b)            → [{ o, t }]  diferencias palabra a palabra entre dos líneas (o null si son demasiado largas)
   TH.diferencias.similitud(ops)            → porcentaje de líneas iguales sobre el total de las dos listas
   Se verifica en pruebas/test_diferencias_lib.py. */
(function (global) {
  'use strict';
  var MAX_CELDAS = 6000000;

  function lineas(frag) {
    var filas = [];
    frag.forEach(function (it) {
      if (!it || !it.s) return;
      var f = null, k;
      for (k = 0; k < filas.length; k++) if (Math.abs(filas[k].y - it.y) <= 2.5) { f = filas[k]; break; }
      if (!f) { f = { y: it.y, partes: [] }; filas.push(f); }
      f.partes.push(it);
    });
    filas.sort(function (a, b) { return b.y - a.y; });
    var res = [];
    filas.forEach(function (f) {
      f.partes.sort(function (a, b) { return a.x - b.x; });
      var s = '', fin = null;
      f.partes.forEach(function (p) {
        if (fin !== null && p.x - fin > 1 && !/\s$/.test(s) && !/^\s/.test(p.s)) s += ' ';
        s += p.s; fin = p.x + (p.w || 0);
      });
      s = s.replace(/\s+/g, ' ').trim();
      if (s) res.push(s);
    });
    return res;
  }

  function clave(t, op) {
    var s = String(t);
    if (op.espacios !== false) s = s.replace(/\s+/g, ' ').trim();
    if (op.mayus) s = s.toLocaleLowerCase('es');
    return s;
  }

  /* Subsecuencia común más larga con recorte de principio y final. Devuelve [{ o, i, j }] con índices en x e y. Lanza 'grande' si la tabla pasaría del límite. */
  function lcs(x, y) {
    var ini = 0, fx = x.length, fy = y.length, ops = [], k, i, j;
    while (ini < fx && ini < fy && x[ini] === y[ini]) ini++;
    while (fx > ini && fy > ini && x[fx - 1] === y[fy - 1]) { fx--; fy--; }
    for (k = 0; k < ini; k++) ops.push({ o: '=', i: k, j: k });
    var n = fx - ini, m = fy - ini;
    if (n * m > MAX_CELDAS) throw new Error('grande');
    var W = m + 1, dp = new Uint32Array((n + 1) * W);
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) dp[i * W + j] = x[ini + i] === y[ini + j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    i = 0; j = 0;
    while (i < n && j < m) {
      if (x[ini + i] === y[ini + j]) { ops.push({ o: '=', i: ini + i, j: ini + j }); i++; j++; }
      else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) { ops.push({ o: '-', i: ini + i }); i++; }
      else { ops.push({ o: '+', j: ini + j }); j++; }
    }
    while (i < n) { ops.push({ o: '-', i: ini + i }); i++; }
    while (j < m) { ops.push({ o: '+', j: ini + j }); j++; }
    for (k = 0; k < x.length - fx; k++) ops.push({ o: '=', i: fx + k, j: fy + k });
    return ops;
  }

  function comparar(A, B, op) {
    op = op || {};
    var ka = A.map(function (l) { return clave(l.t, op); }), kb = B.map(function (l) { return clave(l.t, op); }), metodo = 'completo', bruto;
    try { bruto = lcs(ka, kb); }
    catch (e) {
      if (e.message !== 'grande') throw e;
      metodo = 'paginas'; bruto = [];
      var pa = {}, pb = {}, maxP = 0;
      A.forEach(function (l, i) { (pa[l.p] = pa[l.p] || []).push(i); if (l.p > maxP) maxP = l.p; });
      B.forEach(function (l, j) { (pb[l.p] = pb[l.p] || []).push(j); if (l.p > maxP) maxP = l.p; });
      for (var p = 1; p <= maxP; p++) {
        var ia = pa[p] || [], ib = pb[p] || [];
        lcs(ia.map(function (i) { return ka[i]; }), ib.map(function (j) { return kb[j]; })).forEach(function (r) {
          bruto.push(r.o === '=' ? { o: '=', i: ia[r.i], j: ib[r.j] } : r.o === '-' ? { o: '-', i: ia[r.i] } : { o: '+', j: ib[r.j] });
        });
      }
    }
    return { metodo: metodo, ops: bruto.map(function (r) { return r.o === '=' ? { o: '=', a: A[r.i], b: B[r.j] } : r.o === '-' ? { o: '-', a: A[r.i] } : { o: '+', b: B[r.j] }; }) };
  }

  function palabras(a, b) {
    var x = String(a).match(/\S+/g) || [], y = String(b).match(/\S+/g) || [];
    if (x.length * y.length > 250000) return null;
    var ops;
    try { ops = lcs(x, y); } catch (e) { return null; }
    return ops.map(function (r) { return r.o === '=' ? { o: '=', t: y[r.j] } : r.o === '-' ? { o: '-', t: x[r.i] } : { o: '+', t: y[r.j] }; });
  }

  function similitud(ops) {
    var iguales = 0, total = 0;
    ops.forEach(function (o) { if (o.o === '=') { iguales++; total += 2; } else total++; });
    return total === 0 ? 100 : iguales * 2 / total * 100;
  }

  var API = { lineas: lineas, comparar: comparar, palabras: palabras, similitud: similitud };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else { global.TH = global.TH || {}; global.TH.diferencias = API; }
})(typeof window !== 'undefined' ? window : globalThis);

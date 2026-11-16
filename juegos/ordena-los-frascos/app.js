/* ORDENA LOS FRASCOS: frascos de 4 capas, dos vacíos al empezar. Los puzles se barajan al azar y un buscador comprueba que tienen solución.
   Un vertido mueve todas las capas contiguas del mismo color que quepan. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('fr');
  if (!raiz) return;
  var CAP = 4, LETRAS = 'ABCDEF';
  var NIVELES = { 4: 'Fácil · 4 colores', 5: 'Medio · 5 colores', 6: 'Difícil · 6 colores' };
  var sesion = TYJ.Sesion(null, { victorias: true, racha: true, mejor: false });
  var colores = 5, t = null, ui = null;

  /* ---- lógica pura. Un estado es una lista de frascos y cada frasco una lista de colores de abajo arriba. */
  function copia(e) { return e.map(function (f) { return f.slice(); }); }
  function cima(f) { var c = f[f.length - 1], n = 0; while (n < f.length && f[f.length - 1 - n] === c) n++; return n; }
  function puede(e, a, b) {
    var A = e[a], B = e[b];
    if (a === b || !A.length || B.length >= CAP) return false;
    if (B.length && B[B.length - 1] !== A[A.length - 1]) return false;
    if (!B.length && cima(A) === A.length) return false;               // pasar un frasco ya uniforme a uno vacío no sirve de nada
    return true;
  }
  function verter(e, a, b) {
    var A = e[a], B = e[b], n = Math.min(cima(A), CAP - B.length), c = A[A.length - 1];
    for (var i = 0; i < n; i++) { A.pop(); B.push(c); }
    return n;
  }
  function resuelto(e) { return e.every(function (f) { return !f.length || (f.length === CAP && cima(f) === CAP); }); }
  function clave(e) { return e.map(function (f) { return f.join(''); }).sort().join('|'); }
  function resoluble(e0) {                                              // búsqueda en profundidad con tope de nodos
    var vistos = {}, nodos = 0, pila = [e0];
    while (pila.length && nodos < 25000) {
      var e = pila.pop(), k = clave(e);
      if (vistos[k]) continue;
      vistos[k] = true; nodos++;
      if (resuelto(e)) return true;
      for (var a = 0; a < e.length; a++) for (var b = 0; b < e.length; b++) if (puede(e, a, b)) { var s = copia(e); verter(s, a, b); pila.push(s); }
    }
    return false;
  }
  function generar(c) {
    var estado, intentos = 0;
    do {
      var capas = [];
      for (var i = 0; i < c; i++) for (var j = 0; j < CAP; j++) capas.push(i);
      capas = U.barajar(capas); estado = [];
      for (var f = 0; f < c; f++) estado.push(capas.slice(f * CAP, f * CAP + CAP));
      estado.push([]); estado.push([]);
      intentos++;
    } while (intentos < 40 && (resuelto(estado) || !resoluble(estado)));
    return estado;
  }

  function nueva() {
    var e = generar(colores);
    t = { inicio: e, e: copia(e), hist: [], sel: null, movs: 0, fin: false };
    montar(); pintar();
  }

  function montar() {
    TYJ.vaciar(raiz);
    ui = { frascos: [] };
    ui.niv = h('div', { class: 'fila', role: 'group', 'aria-label': 'Nivel' });
    Object.keys(NIVELES).forEach(function (k) {
      ui.niv.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(+k === colores), onclick: function () { colores = +k; nueva(); } }, NIVELES[k]));
    });
    ui.hud = TYJ.hud([['movs', 'Movimientos', '0']]);
    ui.mesa = h('div', { class: 'fr-mesa', role: 'group', 'aria-label': 'Frascos' });
    t.e.forEach(function (_, i) {
      var b = h('button', { class: 'fr-frasco', type: 'button', 'data-f': String(i), 'aria-pressed': 'false', onclick: function () { pulsar(i); } });
      ui.frascos.push(b); ui.mesa.appendChild(b);
    });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite', texto: 'Pulsa un frasco y luego otro para verter el color de arriba.' });
    function boton(txt, f) { return h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', onclick: f }, txt); }
    ui.final = h('div'); ui.est = h('div');
    [ui.niv, ui.hud.nodo, ui.mesa, ui.msg, h('div', { class: 'fila' }, boton('Deshacer', deshacer), boton('Reiniciar', reiniciar), boton('Otro puzle', nueva)), ui.final, ui.est].forEach(function (x) { raiz.appendChild(x); });
    sesion.montar(ui.est);
  }

  function pintar() {
    t.e.forEach(function (f, i) {
      var b = ui.frascos[i];
      TYJ.vaciar(b);
      for (var k = 0; k < CAP; k++) b.appendChild(k < f.length ? h('span', { class: 'fr-capa fr-c' + f[k], texto: LETRAS[f[k]] }) : h('span', { class: 'fr-hueco' }));
      b.setAttribute('aria-pressed', String(t.sel === i));
      b.setAttribute('aria-label', 'Frasco ' + (i + 1) + ': ' + (f.length ? f.map(function (c) { return LETRAS[c]; }).join(', ') + ' (de abajo arriba)' : 'vacío'));
    });
    ui.hud.poner('movs', t.movs);
  }

  function pulsar(i) {
    if (t.fin) return;
    if (t.sel === null) { if (!t.e[i].length) { ui.msg.textContent = 'Ese frasco está vacío.'; return; } t.sel = i; return pintar(); }
    if (t.sel === i) { t.sel = null; return pintar(); }
    var a = t.sel;
    if (!puede(t.e, a, i)) { ui.msg.textContent = 'No se puede verter ahí: el destino debe estar vacío o tener el mismo color arriba, y con sitio.'; t.sel = null; return pintar(); }
    t.hist.push(copia(t.e));
    var n = verter(t.e, a, i);
    t.sel = null; t.movs++;
    ui.msg.textContent = 'Frasco ' + (a + 1) + ' → frasco ' + (i + 1) + ': ' + n + (n === 1 ? ' capa.' : ' capas.');
    pintar();
    if (resuelto(t.e)) acabar();
  }

  function deshacer() { if (t.fin || !t.hist.length) return; t.e = t.hist.pop(); t.movs++; t.sel = null; ui.msg.textContent = 'Vertido deshecho.'; pintar(); }
  function reiniciar() { if (t.fin) return; t.e = copia(t.inicio); t.hist = []; t.movs = 0; t.sel = null; ui.msg.textContent = 'Puzle reiniciado.'; pintar(); }

  function acabar() {
    t.fin = true; ui.msg.textContent = '';
    sesion.registrar(0, true);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: '¡Todos los frascos ordenados!', nivel: NIVELES[colores], puntos: t.movs, unidad: 'movimientos',
      compartir: 'Ordena los frascos (' + NIVELES[colores].toLowerCase() + '): resuelto en ' + t.movs + ' movimientos.',
      textoRepetir: 'Otro puzle', alRepetir: nueva });
  }

  nueva();
})();

/* MOTOR DE CUESTIONARIOS (TT.cuestionario y TT.lista): una pregunta cada vez con barra de avance, botón «Anterior», teclas 1-9 y un resultado
   que calcula cada test con sus propias reglas. Sirve para los tests de personalidad, relaciones y cultura pop.
   Nada se envía ni se guarda: las respuestas viven en variables de la página y se pierden al recargar. */
(function (global) {
  'use strict';
  var TT = global.TT = global.TT || {};
  var doc = global.document;
  if (!doc) return;

  var ESCALAS = {
    acuerdo: ['Nada de acuerdo', 'Poco de acuerdo', 'Más o menos', 'Bastante de acuerdo', 'Totalmente de acuerdo'],
    frecuencia: ['Nunca', 'Casi nunca', 'A veces', 'Con frecuencia', 'Siempre'],
    intensidad: ['Nada', 'Un poco', 'Algo', 'Bastante', 'Mucho'],
    verdad: ['Falso', 'Más bien falso', 'Ni una cosa ni la otra', 'Más bien cierto', 'Cierto']
  };
  TT.escalas = ESCALAS;

  /* Convierte la pregunta en una lista de opciones { t, p: {dimensión: puntos}, k: índice original } */
  function opciones(q, cfg) {
    if (q.o) return q.o.map(function (o, k) { return { t: o[0], p: o[1] || {}, k: k }; });
    var textos = ESCALAS[q.escala || cfg.escala || 'acuerdo'];
    return textos.map(function (texto, k) {
      var p = {};
      Object.keys(q.d || {}).forEach(function (dim) { var w = q.d[dim]; p[dim] = w >= 0 ? k * w : (4 - k) * -w; });
      return { t: texto, p: p, k: k };
    });
  }
  function maximos(preguntas, cfg) {
    var m = {};
    preguntas.forEach(function (q) {
      var por = {};
      opciones(q, cfg).forEach(function (o) { Object.keys(o.p).forEach(function (d) { por[d] = Math.max(por[d] || 0, o.p[d]); }); });
      Object.keys(por).forEach(function (d) { m[d] = (m[d] || 0) + por[d]; });
    });
    return m;
  }

  /* cfg = { intro, escala, mezclar, preguntas: [{ t, nota, o: [[texto, {dim: pts}]] | escala, d: {dim: peso} }], resultado(ctx) → opciones de TT.resultado } */
  TT.cuestionario = function (cfg) {
    var host = TT.app();
    if (!host) return;
    var P = cfg.preguntas, n = P.length, MAX = maximos(P, cfg), resp, vista, i, panel = null, opts;
    var progresoTxt = TT.h('span', { 'class': 'tc-num' }), pista = TT.h('i');
    var cab = TT.h('div', { 'class': 'tc-progreso' }, progresoTxt, TT.h('span', { 'class': 'tc-pista', 'aria-hidden': 'true' }, pista));
    var texto = TT.h('p', { 'class': 'tc-t' }), nota = TT.h('p', { 'class': 'tc-nota' }), lista = TT.h('div', { 'class': 'tc-opciones' });
    var grupo = TT.h('div', { 'class': 'tc-pregunta', role: 'group', tabindex: '-1' }, texto, nota, lista);
    var atras = TT.boton('Anterior', function () { if (i > 0) { i--; pintar(); } }, true);
    var caja = TT.h('div', { 'class': 'tc' }, cab, grupo, TT.h('div', { 'class': 'tt-fila' }, atras));
    if (cfg.intro) host.appendChild(TT.h('p', { 'class': 'tt-aviso', texto: cfg.intro }));
    host.appendChild(caja);

    function reiniciar() {
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null; resp = []; i = 0; vista = [];
      opts = P.map(function (q) { var o = opciones(q, cfg); return (q.o && cfg.mezclar !== false && !q.fijo) ? TT.barajar(o) : o; });
      caja.hidden = false; pintar(true);
    }
    function pintar(sinFoco) {
      var q = P[i];
      progresoTxt.textContent = 'Pregunta ' + (i + 1) + ' de ' + n;
      pista.style.width = (i / n * 100) + '%';
      texto.textContent = q.t; texto.setAttribute('data-i', i);
      nota.textContent = q.nota || ''; nota.hidden = !q.nota;
      grupo.setAttribute('aria-label', 'Pregunta ' + (i + 1) + ' de ' + n + ': ' + q.t);
      atras.disabled = i === 0; atras.style.visibility = i === 0 ? 'hidden' : '';   // en la primera no hay a dónde volver: se oculta sin mover nada
      TT.vaciar(lista);
      lista.className = 'tc-opciones' + (q.escala || (!q.o) ? ' tc-opciones--escala' : '');
      opts[i].forEach(function (o, pos) {
        var b = TT.h('button', { type: 'button', 'class': 'tc-opcion', 'data-o': o.k, 'aria-pressed': String(resp[i] === o.k) }, TT.h('span', { 'class': 'tc-tecla', 'aria-hidden': 'true', texto: String(pos + 1) }), o.t);
        b.addEventListener('click', function () { elegir(o.k); });
        lista.appendChild(b);
      });
      if (!sinFoco) { try { grupo.focus({ preventScroll: true }); } catch (e) { /* sin foco */ } TT.anunciar('Pregunta ' + (i + 1) + ' de ' + n + '. ' + q.t); }
    }
    function elegir(k) {
      resp[i] = k;
      if (i < n - 1) { i++; pintar(); } else terminar();
    }
    function calcular() {
      var tot = {};
      P.forEach(function (q, j) {
        var o = opciones(q, cfg)[resp[j]];
        Object.keys(o.p).forEach(function (d) { tot[d] = (tot[d] || 0) + o.p[d]; });
      });
      Object.keys(MAX).forEach(function (d) { if (tot[d] == null) tot[d] = 0; });
      var ctx = { tot: tot, max: MAX, n: n, resp: resp.slice() };
      ctx.pct = function (d) { return MAX[d] ? tot[d] / MAX[d] * 100 : 0; };
      ctx.top = function (dims, usarPct) {
        return (dims || Object.keys(MAX)).map(function (d, idx) { return [d, usarPct ? ctx.pct(d) : tot[d], idx]; })
          .sort(function (a, b) { return b[1] - a[1] || a[2] - b[2]; }).map(function (x) { return [x[0], x[1]]; });
      };
      return ctx;
    }
    function terminar() {
      pista.style.width = '100%';
      var r = cfg.resultado(calcular());
      r.alRepetir = reiniciar; r.textoRepetir = r.textoRepetir || 'Repetir el test';
      caja.hidden = true;
      panel = TT.resultado(host, r);
      TT.anunciar('Resultado: ' + (r.titular || r.titulo || ''));
      TT.enfocar(panel);
    }
    doc.addEventListener('keydown', function (e) {
      if (caja.hidden || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      var d = parseInt(e.key, 10);
      if (d >= 1 && d <= opts[i].length) { e.preventDefault(); elegir(opts[i][d - 1].k); }
    });
    reiniciar();
  };

  /* Lista de casillas (como la pureza de Rice): cfg = { intro, grupos: [{ titulo, items: [texto] }], boton, resultado(ctx) }.
     ctx = { marcadas, total, porGrupo: [{ titulo, marcadas, total }], items: [[grupo, texto, marcada]] } */
  TT.lista = function (cfg) {
    var host = TT.app();
    if (!host) return;
    var cajas = [], total = 0, panel = null;
    var cuenta = TT.h('p', { 'class': 'tl-cuenta', role: 'status' });
    var form = TT.h('div', { 'class': 'tl' });
    cfg.grupos.forEach(function (g, gi) {
      var fs = TT.h('fieldset', { 'class': 'tl-grupo' }, TT.h('legend', { texto: g.titulo }));
      g.items.forEach(function (texto, k) {
        total++;
        var id = 'tl-' + gi + '-' + k, cb = TT.h('input', { type: 'checkbox', id: id, 'data-g': gi });
        cb.addEventListener('change', actualizar);
        cajas.push({ cb: cb, g: gi, t: texto });
        fs.appendChild(TT.h('label', { 'class': 'tl-item', 'for': id }, cb, TT.h('span', { texto: texto })));
      });
      form.appendChild(fs);
    });
    function marcadas() { return cajas.filter(function (c) { return c.cb.checked; }).length; }
    function actualizar() { cuenta.textContent = 'Marcadas: ' + marcadas() + ' de ' + total; }
    function calcular() {
      var ctx = { marcadas: marcadas(), total: total, porGrupo: [], items: cajas.map(function (c) { return [c.g, c.t, c.cb.checked]; }) };
      cfg.grupos.forEach(function (g, gi) {
        var de = cajas.filter(function (c) { return c.g === gi; });
        ctx.porGrupo.push({ titulo: g.titulo, marcadas: de.filter(function (c) { return c.cb.checked; }).length, total: de.length });
      });
      return ctx;
    }
    function reiniciar() {
      cajas.forEach(function (c) { c.cb.checked = false; });
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null; form.hidden = false; barra.hidden = false; actualizar();
    }
    var calcularBtn = TT.boton(cfg.boton || 'Calcular mi puntuación', function () {
      var r = cfg.resultado(calcular());
      r.alRepetir = reiniciar; r.textoRepetir = r.textoRepetir || 'Repetir el test';
      form.hidden = true; barra.hidden = true;
      panel = TT.resultado(host, r);
      TT.anunciar('Resultado: ' + (r.titular || r.titulo || ''));
      TT.enfocar(panel);
    });
    var barra = TT.h('div', { 'class': 'tl-barra' }, cuenta, calcularBtn);
    if (cfg.intro) host.appendChild(TT.h('p', { 'class': 'tt-aviso', texto: cfg.intro }));
    host.appendChild(form);
    host.appendChild(barra);
    actualizar();
  };
})(window);

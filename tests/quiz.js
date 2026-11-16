/* MOTOR DE QUIZ CON CORRECCIÓN (TT.quiz): una pregunta cada vez, se corrige al responder (con una explicación breve) y el resultado calcula un nivel
   según los aciertos en cada franja de dificultad, con una gráfica por franja y el repaso de lo fallado. Lo usan los tests de idiomas.
   Nada se envía ni se guarda: las respuestas viven en variables de la página y se pierden al recargar. */
(function (global) {
  'use strict';
  var TT = global.TT = global.TT || {};
  var doc = global.document;
  if (!doc) return;

  /* cfg = {
       intro, titulo, unidadNivel,
       niveles: ['A1', 'A2', …]                       nombre de cada franja de dificultad (de menor a mayor)
       resultados: [{ n, d }, …]                      una más que niveles: 0 = «ni siquiera la primera franja», k = «has dominado k franjas»
       preguntas: [{ t, o: [texto…], c: índice de la correcta, e: explicación, n: franja (0…) , nota? }]
       porNivel: k (opcional)                          si se indica, cada partida elige k preguntas al azar de cada franja
       umbral: 0.6                                     aciertos mínimos (0-1) para dar una franja por superada
       ajustar(ctx, r)                                 (opcional) retoca el resultado antes de pintarlo
     } */
  TT.quiz = function (cfg) {
    var host = TT.app();
    if (!host) return;
    var L = cfg.niveles.length, umbral = cfg.umbral || 0.6, P, n, i, estado, panel = null, respondida;
    var progresoTxt = TT.h('span', { 'class': 'tc-num' }), pista = TT.h('i');
    var cab = TT.h('div', { 'class': 'tc-progreso' }, progresoTxt, TT.h('span', { 'class': 'tc-pista', 'aria-hidden': 'true' }, pista));
    var texto = TT.h('p', { 'class': 'tc-t' }), nota = TT.h('p', { 'class': 'tc-nota' }), lista = TT.h('div', { 'class': 'tc-opciones' });
    var expl = TT.h('p', { 'class': 'tq-expl', hidden: true });
    var grupo = TT.h('div', { 'class': 'tc-pregunta', role: 'group', tabindex: '-1' }, texto, nota, lista, expl);
    var siguiente = TT.boton('Siguiente', function () { avanzar(); });
    var fila = TT.h('div', { 'class': 'tt-fila' }, siguiente);
    var caja = TT.h('div', { 'class': 'tc tq' }, cab, grupo, fila);
    if (cfg.intro) host.appendChild(TT.h('p', { 'class': 'tt-aviso', texto: cfg.intro }));
    host.appendChild(caja);

    function elegirPreguntas() {
      var por = [];
      for (var k = 0; k < L; k++) por.push([]);
      cfg.preguntas.forEach(function (q) { por[q.n || 0].push(q); });
      var sel = [];
      por.forEach(function (grupoNivel) {
        var g = TT.barajar(grupoNivel);
        if (cfg.porNivel) g = g.slice(0, cfg.porNivel);
        sel = sel.concat(g);
      });
      return sel.map(function (q) {
        var orden = TT.barajar(q.o.map(function (t, k) { return { t: t, k: k }; }));
        return { q: q, orden: orden };
      });
    }
    function reiniciar() {
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null; P = elegirPreguntas(); n = P.length; i = 0; estado = []; respondida = false;
      caja.hidden = false; pintar(true);
    }
    function pintar(sinFoco) {
      var item = P[i], q = item.q;
      respondida = false;
      progresoTxt.textContent = 'Pregunta ' + (i + 1) + ' de ' + n;
      pista.style.width = (i / n * 100) + '%';
      texto.textContent = q.t;
      nota.textContent = q.nota || ''; nota.hidden = !q.nota;
      expl.hidden = true; expl.textContent = '';
      siguiente.hidden = true; siguiente.textContent = i === n - 1 ? 'Ver el resultado' : 'Siguiente';
      grupo.setAttribute('aria-label', 'Pregunta ' + (i + 1) + ' de ' + n + ': ' + q.t);
      TT.vaciar(lista);
      item.orden.forEach(function (o, pos) {
        var b = TT.h('button', { type: 'button', 'class': 'tc-opcion', 'data-o': o.k }, TT.h('span', { 'class': 'tc-tecla', 'aria-hidden': 'true', texto: String(pos + 1) }), TT.h('span', { 'class': 'tq-texto', texto: o.t }));
        b.addEventListener('click', function () { responder(o.k); });
        lista.appendChild(b);
      });
      if (!sinFoco) { try { grupo.focus({ preventScroll: true }); } catch (e) { /* sin foco */ } TT.anunciar('Pregunta ' + (i + 1) + ' de ' + n + '. ' + q.t); }
    }
    function responder(k) {
      if (respondida) return;
      respondida = true;
      var q = P[i].q, bien = k === q.c;
      estado[i] = { k: k, bien: bien };
      Array.prototype.forEach.call(lista.children, function (b) {
        var ok = +b.getAttribute('data-o') === q.c, elegida = +b.getAttribute('data-o') === k;
        if (ok) { b.classList.add('tq-ok'); b.appendChild(TT.h('span', { 'class': 'tq-marca', texto: elegida ? '✓ Correcta, la tuya' : '✓ Correcta' })); }
        else if (elegida) { b.classList.add('tq-mal'); b.appendChild(TT.h('span', { 'class': 'tq-marca', texto: '✗ Tu respuesta' })); }
        b.setAttribute('aria-disabled', 'true');
      });
      expl.textContent = (bien ? 'Correcto. ' : 'Casi. La correcta es «' + q.o[q.c] + '». ') + (q.e || '');
      expl.hidden = false;
      TT.anunciar(expl.textContent);
      siguiente.hidden = false;
      try { siguiente.focus({ preventScroll: true }); siguiente.scrollIntoView({ block: 'nearest' }); } catch (e) { /* sin foco */ }
    }
    function avanzar() {
      if (!respondida) return;
      if (i < n - 1) { i++; pintar(); } else terminar();
    }
    function calcular() {
      var porNivel = [];
      for (var k = 0; k < L; k++) porNivel.push({ nombre: cfg.niveles[k], aciertos: 0, total: 0, pct: 0 });
      var fallos = [], aciertos = 0;
      P.forEach(function (item, j) {
        var q = item.q, e = estado[j], nv = porNivel[q.n || 0];
        nv.total++;
        if (e.bien) { nv.aciertos++; aciertos++; } else fallos.push({ t: q.t, tuya: q.o[e.k], correcta: q.o[q.c], e: q.e || '' });
      });
      porNivel.forEach(function (nv) { nv.pct = nv.total ? nv.aciertos / nv.total * 100 : 0; });
      var superados = 0;
      while (superados < L && porNivel[superados].total && porNivel[superados].pct / 100 >= umbral - 1e-9) superados++;
      return { n: n, aciertos: aciertos, pct: aciertos / n * 100, porNivel: porNivel, fallos: fallos, superados: superados };
    }
    function repaso(fallos) {
      if (!fallos.length) return TT.h('p', { 'class': 'tt-res-texto', texto: 'No has fallado ninguna: no hay nada que repasar.' });
      var ul = TT.h('ul', { 'class': 'tq-repaso-lista' });
      fallos.forEach(function (f) {
        ul.appendChild(TT.h('li', {}, TT.h('strong', { texto: f.t }), TT.h('span', { texto: 'Tu respuesta: ' + f.tuya + ' · Correcta: ' + f.correcta }), f.e ? TT.h('span', { 'class': 'tq-repaso-e', texto: f.e }) : null));
      });
      return TT.h('details', { 'class': 'tq-repaso', open: true }, TT.h('summary', { texto: 'Qué repasar (' + fallos.length + ')' }), ul);
    }
    function terminar() {
      pista.style.width = '100%';
      var ctx = calcular(), res = cfg.resultados[ctx.superados];
      var r = {
        titulo: cfg.titulo || 'Tu resultado', titular: res.n,
        valor: ctx.aciertos + ' de ' + ctx.n, unidad: ' aciertos',
        rango: { nombre: 'Nivel estimado: ' + res.n, texto: res.d },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Aciertos por franja' }), TT.graf.barras(ctx.porNivel.map(function (x) { return { nombre: x.nombre + ' (' + x.aciertos + '/' + x.total + ')', valor: Math.round(x.pct) }; }), { max: 100, unidad: ' %', descripcion: 'Porcentaje de aciertos en cada franja de dificultad' })),
          TT.h('p', { 'class': 'tt-res-texto', texto: 'Se da una franja por superada con un ' + Math.round(umbral * 100) + ' % de aciertos o más, siguiendo el orden de menor a mayor dificultad. Es una estimación orientativa, no un certificado.' }),
          repaso(ctx.fallos)),
        detalles: [['Aciertos', ctx.aciertos + ' de ' + ctx.n], ['Porcentaje', Math.round(ctx.pct) + ' %'], ['Franjas superadas', ctx.superados + ' de ' + L]],
        copia: (cfg.copia || 'Mi resultado:') + ' ' + res.n + ' (' + ctx.aciertos + ' de ' + ctx.n + ').',
        alRepetir: reiniciar, textoRepetir: 'Repetir el test'
      };
      if (cfg.ajustar) cfg.ajustar(ctx, r);
      caja.hidden = true;
      panel = TT.resultado(host, r);
      TT.anunciar('Resultado: ' + r.titular + '. ' + ctx.aciertos + ' aciertos de ' + ctx.n + '.');
      TT.enfocar(panel);
    }
    doc.addEventListener('keydown', function (e) {
      if (caja.hidden || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      var d = parseInt(e.key, 10);
      if (!respondida && d >= 1 && d <= P[i].orden.length) { e.preventDefault(); responder(P[i].orden[d - 1].k); }
    });
    reiniciar();
  };
})(window);

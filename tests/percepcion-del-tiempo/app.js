/* Percepción del tiempo: cinco rondas. Pulsa para empezar a contar y vuelve a pulsar cuando creas que ha pasado el tiempo pedido. No hay reloj a la vista. */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  var OBJETIVOS = [3, 5, 8, 10, 15];
  var ronda = 0, orden = [], resultados = [], estado = 'espera', t0 = 0, panel = null;
  var datos = TT.datos([['r', 'Ronda', '1/5'], ['o', 'Objetivo', '—'], ['e', 'Último error', '—']]);
  var titulo = TT.h('span', { class: 'tt-arena-t' }), pista = TT.h('small');
  var arena = TT.h('button', { type: 'button', class: 'tt-arena', 'data-estado': 'espera' }, titulo, pista);

  function vista() {
    arena.setAttribute('data-estado', estado);
    var obj = orden[ronda];
    if (estado === 'espera') { titulo.textContent = 'Pulsa para empezar'; pista.textContent = 'En cada ronda se te pide un tiempo. Pulsa para empezar a contar y vuelve a pulsar cuando creas que ha pasado. No se muestra ningún reloj.'; }
    else if (estado === 'ronda') { titulo.textContent = 'Cuenta ' + obj + ' segundos'; pista.textContent = 'Pulsa cuando creas que han pasado ' + obj + ' segundos.'; }
    else if (estado === 'contando') { titulo.textContent = 'Contando…'; pista.textContent = 'Pulsa cuando creas que han pasado ' + obj + ' segundos.'; }
    else if (estado === 'resultado') {
      var r = resultados[resultados.length - 1];
      titulo.textContent = 'Fueron ' + TT.fmt(r.real, 2) + ' s';
      pista.textContent = 'Pedían ' + r.obj + ' s: ' + (r.err >= 0 ? 'te pasaste ' : 'te quedaste corto ') + TT.fmt(Math.abs(r.err), 2) + ' s. ' + (ronda >= orden.length - 1 ? 'Pulsa para ver tu resultado.' : 'Pulsa para la siguiente ronda.');
    }
  }
  function ahora(e) { var m = e && e.timeStamp; return m && m < 1e11 && Math.abs(m - performance.now()) < 5000 ? m : performance.now(); }
  function pulsar(e) {
    if (estado === 'fin') return;
    var m = ahora(e);
    if (estado === 'espera') { estado = 'ronda'; datos.poner('o', orden[ronda] + ' s'); vista(); return; }
    if (estado === 'ronda' || estado === 'resultado') {
      if (estado === 'resultado') { ronda++; if (ronda >= orden.length) { terminar(); return; } estado = 'ronda'; datos.poner('r', (ronda + 1) + '/' + orden.length); datos.poner('o', orden[ronda] + ' s'); vista(); return; }
      estado = 'contando'; t0 = m; vista(); return;
    }
    if (estado === 'contando') {
      var real = (m - t0) / 1000, obj = orden[ronda];
      if (real < 0.15) return;
      resultados.push({ obj: obj, real: real, err: real - obj, pct: (real - obj) / obj * 100 });
      estado = 'resultado'; datos.poner('e', (real >= obj ? '+' : '−') + TT.fmt(Math.abs(real - obj), 2) + ' s'); vista();
    }
  }
  function terminar() {
    estado = 'fin'; titulo.textContent = '¡Terminado!'; pista.textContent = ''; arena.setAttribute('data-estado', 'fin');
    var abs = resultados.map(function (r) { return Math.abs(r.pct); }), medio = TT.media(abs), signo = TT.media(resultados.map(function (r) { return r.pct; }));
    var rango = TT.rangoMax(medio, [
      [5, 'Reloj suizo', 'Un error medio muy pequeño: tienes un buen ritmo interno.'],
      [10, 'Cronómetro interno', 'Calculas el tiempo con mucha precisión.'],
      [20, 'Buen sentido del tiempo', 'Un error normal para contar sin reloj.'],
      [35, 'Reloj suelto', 'El tiempo se te escapa algo. Cuenta «mil uno, mil dos» para afinar.'],
      [Infinity, 'Perdido en el tiempo', 'Hay mucho margen. Prueba a contar mentalmente a un ritmo fijo.']]);
    var tendencia = Math.abs(signo) < 3 ? 'sin una tendencia clara' : signo > 0 ? 'tiendes a pasarte (a contar más despacio)' : 'tiendes a quedarte corto (a contar más deprisa)';
    var detalles = resultados.map(function (r, i) { return ['Ronda ' + (i + 1) + ': ' + r.obj + ' s', TT.fmt(r.real, 2) + ' s (' + (r.pct >= 0 ? '+' : '−') + TT.fmt(Math.abs(r.pct), 0) + ' %)']; });
    detalles.push(['Tendencia', tendencia]);
    window.setTimeout(function () {
      if (estado !== 'fin') return;
      panel = TT.resultado(host, { titulo: 'Tu percepción del tiempo', valor: TT.fmt(medio, 0), unidad: '% de error medio', rango: rango,
        extra: TT.barras(abs.map(function (x) { return Math.round(x); }), { formato: function (x) { return x + ' %'; }, etiquetas: resultados.map(function (r) { return r.obj + ' s'; }), descripcion: 'Error de cada ronda en porcentaje del tiempo pedido', pie: ['Ronda 1', 'Ronda ' + resultados.length] }),
        detalles: detalles, copia: 'Mi percepción del tiempo: ' + TT.fmt(medio, 0) + ' % de error medio al estimar 3, 5, 8, 10 y 15 segundos.', alRepetir: reiniciar });
      TT.anunciar('Resultado: ' + TT.fmt(medio, 0) + ' por ciento de error medio.');
      TT.enfocar(panel);
    }, 500);
  }
  function reiniciar() {
    estado = 'espera'; ronda = 0; resultados = []; orden = TT.barajar(OBJETIVOS);
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    datos.poner('r', '1/' + orden.length); datos.poner('o', '—'); datos.poner('e', '—');
    vista(); TT.enfocar(arena);
  }
  arena.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; if (e.pointerType === 'mouse') e.preventDefault(); pulsar(e); });
  arena.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); pulsar(e); } });
  arena.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  host.appendChild(TT.h('p', { class: 'tt-aviso', texto: 'No mires ningún reloj ni cuentes con música de fondo. Vale contar mentalmente, pero no hace falta que lo hagas.' }));
  host.appendChild(datos.nodo);
  host.appendChild(arena);
  reiniciar();
})();

/* Arrastrar y hacer clic (drag click): CPS más análisis de ráfagas. Una ráfaga son tres o más clics seguidos con menos de 70 ms entre ellos. */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  function rafagas(t) {
    var lista = [], actual = 1;
    for (var i = 1; i < t.length; i++) {
      if (t[i] - t[i - 1] < 0.07) actual++;
      else { if (actual >= 3) lista.push(actual); actual = 1; }
    }
    if (actual >= 3) lista.push(actual);
    return lista;
  }
  TT.ritmo(host, {
    duraciones: [[1, '1 s'], [2, '2 s'], [5, '5 s'], [10, '10 s']], defecto: 5,
    arena: { inicio: 'Arrastra el dedo sobre el botón del ratón', pista: 'Haz clic una vez para empezar el tiempo. Cada pulsación del botón cuenta, también las de una ráfaga.', jugando: '¡Arrastra!' },
    unidad: 'CPS', singular: 'clic', plural: 'clics', decimales: 2, vivo: 1,
    titulo: 'Tu drag click',
    rangos: [
      [0, 'Clic normal', 'Este ritmo se alcanza sin arrastrar. El drag click empieza a notarse por encima de unos 10 CPS.'],
      [7, 'Calentando', 'Vas encontrando el punto de fricción entre el dedo y el botón.'],
      [10, 'Ráfagas cortas', 'Se nota que sale alguna ráfaga, aunque todavía sin continuidad.'],
      [14, 'Drag click', 'Ritmo típico de quien domina la técnica.'],
      [18, 'Drag click fuerte', 'Ráfagas largas y seguidas.'],
      [24, 'Extremo', 'Una cifra muy alta. Tu ratón, tu navegador y tu sistema tienen que registrar cada pulsación para llegar aquí.']
    ],
    detalles: function (g, dur) {
      var t = g.map(function (x) { return x.t; }), r = rafagas(t), enRafaga = r.reduce(function (a, b) { return a + b; }, 0);
      return [['Mejor segundo', TT.ventanaMax(t, 1) + ' clics'], ['Mejor medio segundo', TT.ventanaMax(t, 0.5) + ' clics'], ['Ráfagas (3 o más clics seguidos)', r.length],
        ['Ráfaga más larga', (r.length ? Math.max.apply(null, r) : 0) + ' clics'], ['Clics dentro de ráfagas', g.length ? TT.fmt(enRafaga / g.length * 100, 0) + ' %' : '0 %']];
    },
    grafico: { descripcion: 'Clics por segundo en cada tramo del test' },
    copia: function (r) { return 'Mi drag click: ' + TT.fmt(r.valor, 2) + ' CPS en ' + r.dur + ' s.'; },
    fuente: function (arena, golpe) {
      arena.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; golpe('clic', null, e); });
      arena.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); golpe('tecla', null, e); } });
      arena.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
  });
})();

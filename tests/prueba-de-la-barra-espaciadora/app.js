/* Prueba de la barra espaciadora: cuenta pulsaciones de la tecla (sin repetición automática) y toques en la zona */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  TT.ritmo(host, {
    duraciones: [[5, '5 s'], [10, '10 s'], [15, '15 s'], [30, '30 s']], defecto: 10,
    arena: { inicio: 'Pulsa la barra espaciadora para empezar', pista: 'Cuenta desde la primera pulsación. Mantenerla pulsada no suma. En el móvil, toca esta zona.', jugando: '¡Barra, barra!' },
    unidad: 'pulsaciones/s', singular: 'pulsación', plural: 'pulsaciones', decimales: 2, vivo: 1,
    titulo: 'Tu velocidad con la barra',
    rangos: [
      [0, 'Con calma', 'Ritmo pausado. La barra pide dedo gordo suelto y muñeca relajada.'],
      [3, 'Ritmo normal', 'Una cadencia cómoda para escribir o para saltar en un juego.'],
      [5, 'Rápido', 'Buen ritmo de pulsación repetida.'],
      [7, 'Muy rápido', 'Pocas personas sostienen esto con un solo dedo.'],
      [9, 'Velocista', 'Cadencia de teclado de competición.'],
      [11, 'Vertiginoso', 'Un ritmo extremo. Comprueba también que tu teclado no se salte pulsaciones.']
    ],
    detalles: function (g) {
      var t = g.map(function (x) { return x.t; }), iv = TT.intervalos(t).map(function (x) { return x * 1000; });
      var teclas = g.filter(function (x) { return x.tipo === 'tecla'; }).length;
      var r = [['Con la tecla', teclas], ['Con toques en la zona', g.length - teclas], ['Mejor segundo', TT.ventanaMax(t, 1) + ' pulsaciones']];
      if (iv.length) { r.push(['Intervalo medio', TT.fmt(TT.media(iv), 0) + ' ms']); r.push(['Pulsación más rápida tras otra', TT.fmt(Math.min.apply(null, iv), 0) + ' ms']); }
      return r;
    },
    grafico: { descripcion: 'Pulsaciones por segundo en cada tramo del test' },
    copia: function (r) { return 'He hecho ' + TT.fmt(r.valor, 2) + ' pulsaciones por segundo con la barra espaciadora en ' + r.dur + ' s.'; },
    fuente: function (arena, golpe, motor) {
      document.addEventListener('keydown', function (e) {
        if (e.code !== 'Space' && e.key !== ' ') return;
        var t = e.target;
        if (t !== arena && t !== document.body && t.closest && t.closest('button, input, select, textarea, a, summary')) return;
        e.preventDefault();
        if (e.repeat || motor.estado() === 'fin') return;
        golpe('tecla', null, e);
      });
      arena.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (motor.estado() === 'fin') return;
        golpe('toque', null, e);
      });
      arena.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
  });
})();

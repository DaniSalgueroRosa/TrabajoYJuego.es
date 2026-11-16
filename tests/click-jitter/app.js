/* Click Jitter: mide CPS y además cuánto aguantas el ritmo y lo regular que eres */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  TT.ritmo(host, {
    duraciones: [[5, '5 s'], [10, '10 s'], [15, '15 s']], defecto: 10,
    arena: { inicio: 'Haz vibrar el brazo y clica aquí', pista: 'Empieza con tu primer clic. Si notas dolor en la mano o la muñeca, para.', jugando: '¡Vibra!' },
    unidad: 'CPS', singular: 'clic', plural: 'clics', decimales: 2, vivo: 1,
    titulo: 'Tu click jitter',
    rangos: [
      [0, 'Todavía sin vibración', 'Con el clic normal se llega a este ritmo. El jitter empieza a notarse a partir de 8 o 9 CPS.'],
      [6, 'Aprendiz', 'Vas encontrando la tensión justa en el brazo. Sigue probando.'],
      [8, 'Constante', 'Un jitter estable, apto para la mayoría de partidas.'],
      [10, 'Jitter sólido', 'Buen control: el brazo vibra y el dedo responde.'],
      [12, 'Jitter avanzado', 'Ritmo de jugador con mucha práctica.'],
      [14, 'Jitter de élite', 'Velocidad que casi nadie sostiene más de unos segundos.'],
      [18, 'Rango extremo', 'Es una cifra muy poco común con un clic normal. Descansa y comprueba que tu ratón no repite clics solo.']
    ],
    detalles: function (g, dur) {
      var t = g.map(function (x) { return x.t; }), iv = TT.intervalos(t).map(function (x) { return x * 1000; });
      var mitad = dur / 2, a = t.filter(function (x) { return x < mitad; }).length / mitad, b = t.filter(function (x) { return x >= mitad; }).length / mitad;
      var r = [['Mejor segundo', TT.ventanaMax(t, 1) + ' clics'], ['Primera mitad', TT.fmt(a, 1) + ' CPS'], ['Segunda mitad', TT.fmt(b, 1) + ' CPS']];
      if (a > 0) r.push(['Caída de ritmo', TT.fmt(Math.max(0, (a - b) / a * 100), 0) + ' %']);
      if (iv.length > 2) {
        r.push(['Regularidad', TT.fmt(TT.desviacion(iv) / TT.media(iv) * 100, 0) + ' % de variación']);
        r.push(['Pausa más larga', TT.fmt(Math.max.apply(null, iv), 0) + ' ms']);
      }
      return r;
    },
    grafico: { descripcion: 'Clics por segundo en cada tramo: una barra que cae indica que te cansas' },
    copia: function (r) { return 'Mi click jitter: ' + TT.fmt(r.valor, 2) + ' CPS en ' + r.dur + ' s.'; },
    fuente: function (arena, golpe) {
      arena.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; golpe('clic', null, e); });
      arena.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); golpe('tecla', null, e); } });
      arena.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
  });
})();

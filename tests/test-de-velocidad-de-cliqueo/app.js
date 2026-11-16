/* Test de velocidad de cliqueo (CPS): el motor de pulsaciones está en tests/base.js */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  TT.ritmo(host, {
    duraciones: [[1, '1 s'], [2, '2 s'], [5, '5 s'], [10, '10 s'], [15, '15 s'], [30, '30 s'], [60, '60 s']], defecto: 5,
    arena: { inicio: 'Haz clic aquí para empezar', pista: 'El tiempo corre desde tu primer clic. También vale tocar la pantalla o pulsar Intro.', jugando: '¡Más rápido!' },
    unidad: 'CPS', singular: 'clic', plural: 'clics', decimales: 2, vivo: 1,
    titulo: 'Tu velocidad de clic',
    rangos: [
      [0, 'Caracol', 'Vas con calma. Con un poco de práctica el ritmo sube enseguida.'],
      [2, 'Tortuga', 'Un ritmo cómodo y muy controlado.'],
      [4, 'Conejo', 'Es una velocidad normal que mucha gente alcanza sin entrenar.'],
      [6, 'Zorro', 'Por encima de lo habitual: se nota que tienes buena muñeca.'],
      [8, 'Guepardo', 'Muy rápido para hacer clic con un solo dedo.'],
      [10, 'Halcón', 'Ritmo de jugador entrenado.'],
      [12, 'Colibrí', 'Velocidad altísima. Descansa la mano de vez en cuando.']
    ],
    detalles: function (g, dur) {
      var t = g.map(function (x) { return x.t; }), iv = TT.intervalos(t).map(function (x) { return x * 1000; });
      var r = [['Mejor segundo', TT.ventanaMax(t, 1) + ' clics']];
      if (iv.length) { r.push(['Intervalo medio', TT.fmt(TT.media(iv), 0) + ' ms']); r.push(['Regularidad (desviación)', TT.fmt(TT.desviacion(iv), 0) + ' ms']); }
      return r;
    },
    grafico: { descripcion: 'Clics por segundo en cada tramo del test' },
    copia: function (r) { return 'He hecho ' + TT.fmt(r.valor, 2) + ' CPS (' + r.n + ' clics en ' + r.dur + ' s).'; },
    fuente: function (arena, golpe) {
      arena.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; golpe('clic', null, e); });
      arena.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); golpe('tecla', null, e); } });
      arena.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
  });
})();

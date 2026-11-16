/* VELOCIDAD MENTAL: un minuto en total, tres vidas, operaciones verdaderas o falsas. Se pasa solo de una a otra (modo automático). */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('vm');
  if (!raiz) return;

  /* Genera una operación cuyo resultado es cierto o falso con la misma probabilidad. La dificultad sube con el número de ronda. */
  function ecuacion(n) {
    var nivel = Math.min(3, Math.floor(n / 6)), a, b, tipo, texto, valor;
    tipo = U.azar(nivel === 0 ? 2 : 3);
    if (tipo === 0) { a = U.entre(10 + nivel * 20, 49 + nivel * 50); b = U.entre(8 + nivel * 10, 39 + nivel * 40); texto = a + ' + ' + b; valor = a + b; }
    else if (tipo === 1) { a = U.entre(30 + nivel * 20, 99 + nivel * 60); b = U.entre(8, 29 + nivel * 20); texto = a + ' − ' + b; valor = a - b; }
    else { a = U.entre(3, 9 + nivel * 3); b = U.entre(4, 9 + nivel * 4); texto = a + ' × ' + b; valor = a * b; }
    var cierta = U.azar(2) === 0, mostrado = valor;
    if (!cierta) {
      var desv = U.elegir([1, 1, 2, 2, 3, 10, -1, -2, -10]);
      mostrado = valor + desv;
      if (mostrado === valor || mostrado < 0) mostrado = valor + 1;
    }
    return { texto: texto + ' = ' + mostrado, cierta: cierta, real: texto + ' = ' + valor };
  }

  TYJ.Rondas(raiz, {
    titulo: 'Velocidad mental',
    intro: 'Un minuto y tres vidas. Cada operación aparece con su resultado: ¿es verdadera o falsa? Responde rápido y encadena aciertos.',
    rondas: 0, tiempoTotal: 60, vidas: 3, auto: true, pausas: [220, 900],
    niveles: [[0, 'Lento'], [100, 'Ágil'], [200, 'Veloz'], [300, 'Relámpago'], [400, 'Superordenador']],
    puntuar: function (r, acierto, restante, est) { return 10 + Math.min(est.racha, 5) * 2; },
    siguiente: function (n) {
      var e = ecuacion(n);
      return { enunciado: e.texto, opciones: ['Verdadero', 'Falso'], correcta: e.cierta ? 0 : 1, etiqueta: e.texto, explicacion: e.cierta ? '' : 'Lo correcto: ' + e.real };
    },
    detalleFinal: function (est) { return ['Operaciones respondidas: ' + (est.aciertos + est.fallos)]; },
    compartir: function (est, nivel) { return 'Velocidad mental · ' + U.miles(est.puntos) + ' puntos en 1 minuto · ' + est.aciertos + ' aciertos · ' + nivel; }
  }).iniciar();
})();

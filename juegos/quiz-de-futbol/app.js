/* Quiz de fútbol: diez preguntas de cuatro respuestas (barajadas), 20 s cada una. Usa el motor de rondas común y su ruta de rondas.
   Los datos están en quiz-de-futbol/preguntas.json (la correcta va primero; el juego baraja al mostrarla). Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('qf');
  if (!raiz) return;
  var banco = [], mazo = [];

  function robar() {
    if (!mazo.length) mazo = U.barajar(banco);
    return mazo.pop();
  }

  function arrancar() {
    TYJ.datos('quiz-de-futbol/preguntas.json').then(function (json) {
      banco = json.preguntas;
      TYJ.Rondas(raiz, {
        titulo: 'Quiz de fútbol',
        intro: 'Diez preguntas de fútbol con cuatro respuestas y 20 segundos para cada una: Mundiales, Eurocopas, Champions League, clubes, ligas y estrellas.',
        rondas: 10, segundos: 20, ruta: true,
        niveles: [[0, 'Suplente'], [600, 'Titular'], [900, 'Capitán'], [1200, 'Crack'], [1450, 'Balón de Oro']],
        siguiente: function () {
          var q = robar(), orden = U.barajar([0, 1, 2, 3]);
          return { enunciado: q.p, opciones: orden.map(function (i) { return q.o[i]; }), correcta: orden.indexOf(0), explicacion: q.e, etiqueta: q.p };
        },
        compartir: function (est, nivel) { return 'Quiz de fútbol · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/10 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

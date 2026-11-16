/* QUIZ DE CIENCIA: diez preguntas de cuatro respuestas (barajadas), 20 s cada una. Usa el motor de rondas común. Los datos están en quiz-de-ciencia/preguntas.json. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('qc');
  if (!raiz) return;
  var banco = [], mazo = [];

  function robar() {
    if (!mazo.length) mazo = U.barajar(banco);
    return mazo.pop();
  }

  function arrancar() {
    TYJ.datos('quiz-de-ciencia/preguntas.json').then(function (json) {
      banco = json.preguntas;
      TYJ.Rondas(raiz, {
        titulo: 'Quiz de ciencia',
        intro: 'Diez preguntas de ciencia con cuatro respuestas y 20 segundos para cada una. Mezcla astronomía, física, química, biología y ciencias de la Tierra.',
        rondas: 10, segundos: 20, ruta: true,
        niveles: [[0, 'Curioso'], [600, 'Aficionado'], [900, 'Estudiante brillante'], [1200, 'Científico'], [1450, 'Premio Nobel']],
        siguiente: function () {
          var q = robar(), orden = U.barajar([0, 1, 2, 3]);
          return { enunciado: q.p, opciones: orden.map(function (i) { return q.o[i]; }), correcta: orden.indexOf(0), explicacion: q.e, etiqueta: q.p };
        },
        compartir: function (est, nivel) { return 'Quiz de ciencia · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/10 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

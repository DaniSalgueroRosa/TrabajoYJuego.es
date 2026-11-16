/* FALTAS DE ORTOGRAFÍA: diez preguntas de cuatro respuestas (barajadas), 20 s cada una. Usa el motor de rondas común. Los datos están en faltas-de-ortografia/preguntas.json. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('fo');
  if (!raiz) return;
  var banco = [], mazo = [];

  function robar() {
    if (!mazo.length) mazo = U.barajar(banco);
    return mazo.pop();
  }

  function arrancar() {
    TYJ.datos('faltas-de-ortografia/preguntas.json').then(function (json) {
      banco = json.preguntas;
      TYJ.Rondas(raiz, {
        titulo: 'Faltas de ortografía',
        intro: 'Diez preguntas de ortografía: unas piden la palabra bien escrita y otras completar una frase. Quince segundos por ronda y la regla explicada al responder.',
        rondas: 10, segundos: 15,
        niveles: [[0, 'Faltoso'], [600, 'Aprendiz'], [900, 'Atento a las tildes'], [1200, 'Corrector'], [1450, 'Académico']],
        siguiente: function () {
          var q = robar(), orden = U.barajar([0, 1, 2, 3]), hueco = q.p.indexOf('___') >= 0;
          return { enunciado: hueco ? 'Completa la frase: «' + q.p + '»' : '¿Cuál de estas palabras está bien escrita?',
                   opciones: orden.map(function (i) { return q.o[i]; }), correcta: orden.indexOf(0),
                   explicacion: (hueco ? 'Correcto: «' + q.p.replace('___', q.o[0]) + '». ' : 'Se escribe «' + q.o[0] + '». ') + q.e, etiqueta: hueco ? q.p : q.o[0] };
        },
        compartir: function (est, nivel) { return 'Faltas de ortografía · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/10 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

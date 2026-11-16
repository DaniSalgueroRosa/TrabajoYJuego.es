/* QUIZ DE CULTURA GENERAL: 10 preguntas de 4 respuestas (barajadas), 20 s cada una. Usa el motor de rondas común. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('cg');
  if (!raiz) return;
  var banco = [], mazo = [];

  function robar() {
    if (!mazo.length) mazo = U.barajar(banco);
    return mazo.pop();
  }

  function arrancar() {
    TYJ.datos('cultura-general/preguntas.json').then(function (json) {
      banco = json.preguntas;
      TYJ.Rondas(raiz, {
        titulo: 'Quiz de cultura general',
        intro: 'Diez preguntas, cuatro respuestas y 20 segundos para cada una. Acierta rápido y encadena aciertos para sumar más.',
        rondas: 10, segundos: 20, ruta: true,
        niveles: [[0, 'Aprendiz'], [600, 'Aficionado'], [900, 'Entendido'], [1200, 'Sabelotodo'], [1450, 'Enciclopedia']],
        siguiente: function () {
          var q = robar(), orden = U.barajar([0, 1, 2, 3]);
          return { enunciado: q.p, opciones: orden.map(function (i) { return q.o[i]; }), correcta: orden.indexOf(0), explicacion: q.e, etiqueta: q.p };
        },
        compartir: function (est, nivel) { return 'Quiz de cultura general · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/10 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

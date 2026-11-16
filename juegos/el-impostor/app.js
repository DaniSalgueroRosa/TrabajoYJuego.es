/* EL IMPOSTOR: tres afirmaciones verdaderas y una falsa; hay que descubrir la falsa. 10 rondas de 25 s con el motor de rondas común. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('imp');
  if (!raiz) return;
  var banco = [], mazo = [];
  function robar() { if (!mazo.length) mazo = U.barajar(banco); return mazo.pop(); }

  function arrancar() {
    TYJ.datos('el-impostor/afirmaciones.json').then(function (json) {
      banco = json.conjuntos;
      TYJ.Rondas(raiz, {
        titulo: 'El impostor',
        intro: 'Cuatro afirmaciones: tres son ciertas y una es mentira. Encuentra la falsa antes de que se acaben los 25 segundos. Diez rondas.',
        rondas: 10, segundos: 25,
        niveles: [[0, 'Crédulo'], [550, 'Prudente'], [850, 'Escéptico'], [1150, 'Detective'], [1450, 'Inspector jefe']],
        siguiente: function () {
          var q = robar(), frases = U.barajar(q.v.concat([q.f]));
          return { enunciado: q.t + ': ¿cuál es la afirmación falsa?', opciones: frases, correcta: frases.indexOf(q.f), explicacion: 'Falsa: «' + q.f + '» ' + q.e, etiqueta: q.t + ': «' + q.f + '»' };
        },
        compartir: function (est, nivel) { return 'El impostor · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/10 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

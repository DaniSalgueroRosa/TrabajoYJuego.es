/* EL INTRUSO: cuatro palabras, una no encaja. 10 rondas de 15 s con el motor de rondas común. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('intr');
  if (!raiz) return;
  var banco = [], mazo = [];
  function robar() { if (!mazo.length) mazo = U.barajar(banco); return mazo.pop(); }

  function arrancar() {
    TYJ.datos('el-intruso/conjuntos.json').then(function (json) {
      banco = json.conjuntos;
      TYJ.Rondas(raiz, {
        titulo: 'El intruso',
        intro: 'Cuatro palabras: tres comparten categoría y una no encaja. Encuentra la intrusa. Diez rondas de 15 segundos.',
        rondas: 10, segundos: 15,
        niveles: [[0, 'Despistado'], [600, 'Atento'], [900, 'Observador'], [1200, 'Lince'], [1450, 'Ojo de halcón']],
        siguiente: function () {
          var q = robar(), palabras = U.barajar(q.g.concat([q.i]));
          return { enunciado: '¿Cuál es el intruso?', opciones: palabras, correcta: palabras.indexOf(q.i), explicacion: q.t + ': ' + q.e, etiqueta: q.g.join(', ') + ' y ' + q.i };
        },
        compartir: function (est, nivel) { return 'El intruso · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/10 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

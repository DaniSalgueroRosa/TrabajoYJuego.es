/* EL INTRUSO DEL FÚTBOL: tres de los cuatro futbolistas comparten algo (campeones del mundo en 2010, ganadores del Balón de Oro, porteros…) y uno es el intruso.
   Diez rondas de 20 s con cuatro respuestas. Datos en intruso-del-club/grupos.json. Motor de rondas común y ruta de rondas. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('ic');
  if (!raiz) return;
  var grupos = [], mazo = [];
  function robar() { if (!mazo.length) mazo = U.barajar(grupos); return mazo.pop(); }

  function arrancar() {
    TYJ.datos('intruso-del-club/grupos.json').then(function (json) {
      grupos = json.grupos;
      TYJ.Rondas(raiz, {
        titulo: 'El intruso del fútbol',
        intro: 'En cada ronda hay cuatro futbolistas: tres tienen algo en común (un Mundial, un premio, una posición…) y uno no pertenece al grupo. Encuentra al intruso. Diez rondas de 20 segundos.',
        rondas: 10, segundos: 20, ruta: true,
        niveles: [[0, 'Suplente'], [600, 'Titular'], [900, 'Capitán'], [1200, 'Crack'], [1450, 'Balón de Oro']],
        siguiente: function () {
          var g = robar(), intruso = U.elegir(g.f), tres = U.muestra(g.m, 3);
          var opciones = U.barajar(tres.concat([intruso.n]));
          return { enunciado: 'Tres de estos futbolistas ' + g.t + '. ¿Quién es el intruso?', opciones: opciones, correcta: opciones.indexOf(intruso.n),
            explicacion: intruso.n + ' es el intruso: ' + intruso.e + ' Los otros tres ' + g.t + '.', etiqueta: 'Tres ' + g.t };
        },
        compartir: function (est, nivel) { return 'El intruso del fútbol · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/10 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

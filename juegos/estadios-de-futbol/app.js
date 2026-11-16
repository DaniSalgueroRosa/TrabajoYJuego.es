/* ESTADIOS DE FÚTBOL: diez preguntas con cuatro respuestas. Unas piden la ciudad del estadio y otras el equipo que juega en él (solo cuando es de un único equipo).
   Datos en estadios-de-futbol/estadios.json. Motor de rondas común y ruta de rondas. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('ef');
  if (!raiz) return;
  var banco = [], mazo = [];

  function robar() {
    if (!mazo.length) mazo = U.barajar(banco);
    return mazo.pop();
  }
  function unicos(lista) {
    var visto = {};
    return lista.filter(function (x) { if (visto[x]) return false; visto[x] = true; return true; });
  }
  /* Tres respuestas falsas del mismo campo (ciudad o equipo), mejor del mismo país para que no sea demasiado fácil */
  function falsas(e, campo) {
    var otros = banco.filter(function (x) { return x[campo] && x[campo] !== e[campo]; });
    var mismos = U.barajar(otros.filter(function (x) { return x.p === e.p; })).map(function (x) { return x[campo]; });
    var resto = U.barajar(otros.filter(function (x) { return x.p !== e.p; })).map(function (x) { return x[campo]; });
    return unicos(mismos.concat(resto)).filter(function (x) { return x !== e[campo]; }).slice(0, 3);
  }

  function arrancar() {
    TYJ.datos('estadios-de-futbol/estadios.json').then(function (json) {
      banco = json.estadios;
      TYJ.Rondas(raiz, {
        titulo: 'Estadios de fútbol',
        intro: 'Diez preguntas sobre estadios famosos: en qué ciudad están y qué equipo juega en ellos. Cuatro respuestas y 15 segundos para cada una.',
        rondas: 10, segundos: 15, ruta: true,
        niveles: [[0, 'Visitante'], [600, 'Abonado'], [900, 'Socio'], [1200, 'Ultra'], [1450, 'Guía del estadio']],
        siguiente: function () {
          var e = robar(), equipo = e.e && Math.random() < 0.4;
          var campo = equipo ? 'e' : 'c';
          var opciones = U.barajar([e[campo]].concat(falsas(e, campo)));
          return {
            enunciado: equipo ? '¿Qué equipo juega en el estadio ' + e.n + '?' : '¿En qué ciudad está el estadio ' + e.n + '?',
            opciones: opciones, correcta: opciones.indexOf(e[campo]),
            explicacion: e.n + ' está en ' + e.c + ' (' + e.p + ')' + (e.e ? ' y es la casa del ' + e.e : '') + '.' + (e.d ? ' ' + e.d : ''),
            etiqueta: e.n
          };
        },
        compartir: function (est, nivel) { return 'Estadios de fútbol · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/10 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

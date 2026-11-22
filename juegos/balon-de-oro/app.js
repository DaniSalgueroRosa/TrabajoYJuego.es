/* BALÓN DE ORO: diez preguntas con cuatro respuestas, 20 s cada una. Tres tipos: quién ganó un año, en qué año ganó por primera vez un jugador y cuántos
   Balones de Oro tiene. De vez en cuando sale la pregunta del año que no se entregó (2020). Datos en balon-de-oro/premios.json. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('bo');
  if (!raiz) return;
  var premios = [], porJugador = {}, mazo = [];

  function robar() { if (!mazo.length) mazo = U.barajar(premios); return mazo.pop(); }
  function anios(n) { return porJugador[n].join(', ').replace(/, ([^,]*)$/, ' y $1'); }
  function cuatro(correcta, candidatos, igual) {          // correcta + tres candidatos distintos entre sí y de la correcta
    var res = [correcta];
    U.barajar(candidatos).forEach(function (c) { if (res.length < 4 && !res.some(function (x) { return igual(x, c); })) res.push(c); });
    return U.barajar(res);
  }
  function quien(p) {
    var cercanos = premios.filter(function (x) { return Math.abs(x.a - p.a) <= 14 && x.n !== p.n; }).map(function (x) { return x.n; });
    var todos = premios.filter(function (x) { return x.n !== p.n; }).map(function (x) { return x.n; });
    var op = cuatro(p.n, cercanos.length >= 6 ? cercanos : todos, function (a, b) { return a === b; });
    return { enunciado: '¿Quién ganó el Balón de Oro en ' + p.a + '?', opciones: op, correcta: op.indexOf(p.n), explicacion: p.n + ' lo ganó en ' + anios(p.n) + '.', etiqueta: 'Balón de Oro ' + p.a };
  }
  function primero(p) {
    var a = porJugador[p.n][0], cand = [];
    for (var d = -5; d <= 5; d++) if (d && a + d >= 1956 && a + d <= 2025 && a + d !== 2020) cand.push(String(a + d));
    var op = cuatro(String(a), cand, function (x, y) { return x === y; });
    return { enunciado: '¿En qué año ganó ' + p.n + ' su primer Balón de Oro?', opciones: op, correcta: op.indexOf(String(a)), explicacion: p.n + ' lo ganó en ' + anios(p.n) + '.', etiqueta: 'Primer Balón de Oro de ' + p.n };
  }
  function cuantos(n) {
    var v = porJugador[n].length, cand = [];
    for (var d = -3; d <= 3; d++) if (d && v + d >= 1) cand.push(String(v + d));
    var op = cuatro(String(v), cand, function (x, y) { return x === y; });
    return { enunciado: '¿Cuántos Balones de Oro ha ganado ' + n + '?', opciones: op, correcta: op.indexOf(String(v)), explicacion: n + ' ganó ' + v + ': ' + anios(n) + '.', etiqueta: 'Balones de Oro de ' + n };
  }
  function sinPremio() {
    var op = U.barajar(['2020', '2019', '2021', '2018']);
    return { enunciado: '¿En qué año no se entregó el Balón de Oro?', opciones: op, correcta: op.indexOf('2020'), explicacion: 'En 2020 no se entregó a causa de la pandemia de coronavirus.', etiqueta: 'Año sin Balón de Oro' };
  }

  function arrancar() {
    TYJ.datos('balon-de-oro/premios.json').then(function (json) {
      premios = json.premios;
      premios.forEach(function (p) { (porJugador[p.n] = porJugador[p.n] || []).push(p.a); });
      var multiples = Object.keys(porJugador).filter(function (n) { return porJugador[n].length >= 2; });
      TYJ.Rondas(raiz, {
        titulo: 'Balón de Oro',
        intro: 'Diez preguntas sobre el Balón de Oro desde 1956: quién lo ganó cada año, cuándo lo ganó por primera vez un jugador y cuántos tiene. Cuatro respuestas y 20 segundos para cada una.',
        rondas: 10, segundos: 20, ruta: true,
        niveles: [[0, 'Suplente'], [600, 'Titular'], [900, 'Capitán'], [1200, 'Crack'], [1450, 'Balón de Oro']],
        siguiente: function () {
          var r = Math.random(), p = robar();
          if (r < 0.06) return sinPremio();
          if (r < 0.3) return cuantos(U.elegir(multiples));
          if (r < 0.55) return primero(p);
          return quien(p);
        },
        compartir: function (est, nivel) { return 'Balón de Oro · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/10 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

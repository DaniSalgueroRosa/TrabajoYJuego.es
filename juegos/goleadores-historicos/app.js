/* GOLEADORES HISTÓRICOS: diez preguntas con cuatro respuestas, 20 s cada una. El Pichichi de LaLiga (de 2004-05 a 2025-26) y la Bota de Oro de los Mundiales
   (de 1978 a 2026): quién fue el máximo goleador de una temporada o un Mundial y cuántos goles marcó. Datos en goleadores-historicos/goleadores.json. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('gh');
  if (!raiz) return;
  var datos = null, mazo = [];

  function robar() { if (!mazo.length) mazo = U.barajar(datos.pichichi.map(function (x) { return ['p', x]; }).concat(datos.mundiales.map(function (x) { return ['m', x]; }))); return mazo.pop(); }
  function cuatro(correcta, candidatos) {
    var res = [correcta];
    U.barajar(candidatos).forEach(function (c) { if (res.length < 4 && res.indexOf(c) < 0) res.push(c); });
    return U.barajar(res);
  }
  function nombres(lista, excepto) { return lista.map(function (x) { return x.n; }).filter(function (n) { return n !== excepto; }); }
  function quien(tipo, x) {
    var lista = tipo === 'p' ? datos.pichichi : datos.mundiales;
    var op = cuatro(x.n, nombres(lista, x.n));
    var enun = tipo === 'p' ? '¿Quién ganó el Pichichi de LaLiga en la temporada ' + x.t + '?' : '¿Quién fue el máximo goleador (Bota de Oro) del Mundial de ' + x.t + '?';
    return { enunciado: enun, opciones: op, correcta: op.indexOf(x.n), explicacion: x.n + ' marcó ' + x.g + ' goles' + (tipo === 'p' ? ' en LaLiga ' + x.t + '.' : ' en el Mundial de ' + x.t + '.'), etiqueta: (tipo === 'p' ? 'Pichichi ' : 'Bota de Oro ') + x.t };
  }
  function cuantos(tipo, x) {
    var cand = [], paso = x.g >= 30 ? 4 : 2;
    for (var d = -3; d <= 3; d++) if (d && x.g + d * paso >= 3) cand.push(String(x.g + d * paso));
    var op = cuatro(String(x.g), cand);
    var enun = tipo === 'p' ? '¿Cuántos goles marcó ' + x.n + ' para ganar el Pichichi de ' + x.t + '?' : '¿Cuántos goles marcó ' + x.n + ' para ser el máximo goleador del Mundial de ' + x.t + '?';
    return { enunciado: enun, opciones: op, correcta: op.indexOf(String(x.g)), explicacion: x.n + ' marcó ' + x.g + ' goles.', etiqueta: 'Goles de ' + x.n + ' (' + x.t + ')' };
  }

  function arrancar() {
    TYJ.datos('goleadores-historicos/goleadores.json').then(function (json) {
      datos = json;
      TYJ.Rondas(raiz, {
        titulo: 'Goleadores históricos',
        intro: 'Diez preguntas sobre los máximos goleadores de LaLiga desde 2004-05 y de los Mundiales desde 1978: quién ganó el Pichichi o la Bota de Oro y cuántos goles necesitó. Cuatro respuestas y 20 segundos.',
        rondas: 10, segundos: 20, ruta: true,
        niveles: [[0, 'Suplente'], [600, 'Rematador'], [900, 'Goleador'], [1200, 'Pichichi'], [1450, 'Bota de Oro']],
        siguiente: function () { var e = robar(); return Math.random() < 0.65 ? quien(e[0], e[1]) : cuantos(e[0], e[1]); },
        compartir: function (est, nivel) { return 'Goleadores históricos · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/10 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

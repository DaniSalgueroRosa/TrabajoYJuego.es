/* PROVINCIAS DE ESPAÑA: diez preguntas de tres tipos (comunidad de una provincia, capital de una provincia, provincia de una comunidad). Motor de rondas común.
   Los datos están en provincias-de-espana/provincias.json: { n: provincia, ca: comunidad autónoma, cap: capital }. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util;
  var raiz = document.getElementById('pe');
  if (!raiz) return;
  var provincias = [], porComunidad = {}, comunidades = [], tipos = [], usadas = {};

  function preparar(lista) {
    provincias = lista; porComunidad = {};
    lista.forEach(function (p) { (porComunidad[p.ca] = porComunidad[p.ca] || []).push(p); });
    comunidades = Object.keys(porComunidad);
  }
  function elegir(candidatas, clave) {
    var libres = candidatas.filter(function (c) { return !usadas[clave(c)]; });
    var c = U.elegir(libres.length ? libres : candidatas);
    usadas[clave(c)] = true;
    return c;
  }
  function conOpciones(correcta, falsas, enunciado, explicacion, etiqueta) {
    var todas = U.barajar([correcta].concat(falsas));
    return { enunciado: enunciado, opciones: todas, correcta: todas.indexOf(correcta), explicacion: explicacion, etiqueta: etiqueta };
  }

  function preguntaComunidad() {
    var p = elegir(provincias.filter(function (x) { return porComunidad[x.ca].length > 1; }), function (x) { return 'c' + x.n; });
    var falsas = U.muestra(comunidades.filter(function (c) { return c !== p.ca; }), 3);
    return conOpciones(p.ca, falsas, '¿En qué comunidad autónoma está la provincia de ' + p.n + '?',
      'La provincia de ' + p.n + ' está en la comunidad autónoma «' + p.ca + '».', 'Comunidad de ' + p.n);
  }
  function preguntaCapital() {
    var p = elegir(provincias.filter(function (x) { return x.cap !== x.n; }), function (x) { return 'k' + x.n; });
    var falsas = U.muestra(provincias.map(function (x) { return x.cap; }).filter(function (c) { return c !== p.cap && c !== p.n; }), 3);
    return conOpciones(p.cap, falsas, '¿Cuál es la capital de la provincia de ' + p.n + '?',
      'La capital de la provincia de ' + p.n + ' es ' + p.cap + '.', 'Capital de ' + p.n);
  }
  function preguntaInversa() {
    var c = elegir(comunidades.filter(function (x) { return porComunidad[x].length > 1; }), function (x) { return 'i' + x; });
    var correcta = U.elegir(porComunidad[c]).n;
    var falsas = U.muestra(provincias.filter(function (x) { return x.ca !== c; }), 3).map(function (x) { return x.n; });
    return conOpciones(correcta, falsas, '¿Cuál de estas provincias está en la comunidad «' + c + '»?',
      correcta + ' es una de las provincias de la comunidad «' + c + '».', 'Provincia de ' + c);
  }

  function arrancar() {
    TYJ.datos('provincias-de-espana/provincias.json').then(function (json) {
      preparar(json.provincias);
      TYJ.Rondas(raiz, {
        titulo: 'Provincias de España',
        intro: 'Diez preguntas sobre las 50 provincias: en qué comunidad está cada una, cuál es su capital y qué provincias forman cada comunidad. Veinte segundos por pregunta.',
        rondas: 10, segundos: 20, ruta: true,
        niveles: [[0, 'Turista'], [600, 'Viajero'], [900, 'Conductor de ruta'], [1200, 'Guía turístico'], [1450, 'Cartógrafo']],
        alIniciar: function () {
          usadas = {};
          tipos = U.barajar(['c', 'c', 'c', 'c', 'k', 'k', 'k', 'i', 'i', 'i']);
        },
        siguiente: function (n) {
          var t = tipos[n];
          return t === 'c' ? preguntaComunidad() : t === 'k' ? preguntaCapital() : preguntaInversa();
        },
        compartir: function (est, nivel) { return 'Provincias de España · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/10 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

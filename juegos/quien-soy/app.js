/* ¿QUIÉN SOY?: cinco pistas de más difícil a más fácil. Cada pista extra resta 20 puntos a la ronda (100, 80, 60, 40, 20). 8 rondas de 45 s. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('qs');
  if (!raiz) return;
  var banco = [], mazo = [];
  function robar() { if (!mazo.length) mazo = U.barajar(banco); return mazo.pop(); }

  function arrancar() {
    TYJ.datos('quien-soy/personajes.json').then(function (json) {
      banco = json.elementos;
      TYJ.Rondas(raiz, {
        titulo: '¿Quién soy?',
        intro: 'Cinco pistas, de la más difícil a la más fácil. Si lo adivinas con la primera ganas 100 puntos; cada pista extra resta 20. Ocho rondas de 45 segundos.',
        rondas: 8, segundos: 45, ruta: true,
        niveles: [[0, 'Desconocido'], [400, 'Curioso'], [700, 'Detective'], [950, 'Erudito'], [1200, 'Gran sabio']],
        siguiente: function () {
          var q = robar(), vistas = 1;
          var lista = h('ol', { class: 'qs-pistas', 'aria-label': 'Pistas' });
          var r = { enunciado: 'Pista 1 de 5', aceptadas: q.r, explicacion: 'Era: ' + q.n + '.', etiqueta: 'Pistas: ' + q.p[0] + '…', placeholder: 'Escribe quién o qué soy', puntosBase: 100 };
          var titulo = null;
          function pintar() {
            TYJ.vaciar(lista);
            q.p.slice(0, vistas).forEach(function (t, i) { lista.appendChild(h('li', { class: i === vistas - 1 ? 'qs-nueva' : '' }, t)); });
            var enun = document.querySelector('.rondas-enunciado');
            if (enun) enun.textContent = 'Pista ' + vistas + ' de 5 · la ronda vale ' + r.puntosBase + ' puntos';
          }
          var mas = h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', onclick: function () {
            if (vistas >= 5) return;
            vistas++; r.puntosBase = 120 - vistas * 20;
            pintar(); TYJ.anunciar('Pista ' + vistas + ': ' + q.p[vistas - 1]);
            if (vistas >= 5) mas.disabled = true;
            var campo = document.getElementById('rondas-respuesta'); if (campo) campo.focus();
          } }, 'Otra pista (−20 puntos)');
          r.cuerpo = h('div', { class: 'qs-bloque' }, lista, h('div', { class: 'fila' }, mas));
          setTimeout(pintar, 0);
          return r;
        },
        compartir: function (est, nivel) { return '¿Quién soy? · ' + U.miles(est.puntos) + ' puntos · ' + est.aciertos + '/8 · ' + nivel; }
      }).iniciar();
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

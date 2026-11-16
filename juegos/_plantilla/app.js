/* MI JUEGO — ejemplo mínimo y funcional: pulsa el botón tantas veces como puedas en 10 segundos.
   Sustituye la lógica por la tuya y conserva el patrón: todo vive en la memoria de la pestaña (NO se usa localStorage, sessionStorage,
   cookies ni IndexedDB: lo prohíbe el encargo y una prueba automática lo vigila). */
(function () {
  'use strict';
  var TYJ = window.TYJ, h = TYJ.h;
  var raiz = document.getElementById('mj');
  if (!raiz) return;
  var sesion = null;

  function portada() {
    TYJ.vaciar(raiz);
    raiz.appendChild(h('h2', { class: 'juego-titulo', texto: 'Mi juego' }));
    raiz.appendChild(h('p', { class: 'juego-intro', texto: 'Pulsa el botón tantas veces como puedas en 10 segundos.' }));
    raiz.appendChild(h('div', { class: 'fila fila--centro' }, h('button', { class: 'boton-retro', type: 'button', onclick: jugar }, 'Empezar')));
    var estadisticas = h('p', { class: 'sesion' });
    raiz.appendChild(estadisticas);
    if (!sesion) sesion = TYJ.Sesion(estadisticas); else sesion.montar(estadisticas);
  }

  function jugar() {
    var puntos = 0;
    var marcador = TYJ.hud([['puntos', 'Pulsaciones', '0'], ['tiempo', 'Tiempo', '10']]);
    var barra = TYJ.barraDeTiempo();
    var boton = h('button', { class: 'boton-retro', type: 'button', onclick: function () { puntos++; marcador.poner('puntos', puntos); } }, 'Pulsa aquí');
    TYJ.vaciar(raiz);
    raiz.appendChild(marcador.nodo);
    raiz.appendChild(barra.nodo);
    raiz.appendChild(h('div', { class: 'fila fila--centro' }, boton));
    boton.focus();
    new TYJ.Temporizador({
      segundos: 10,
      alTick: function (r, t) { marcador.poner('tiempo', Math.ceil(r), r <= 3); barra.poner(r / t.segundos); },
      alFin: function () {
        sesion.registrar(puntos);
        TYJ.final(raiz, {
          titulo: 'Se acabó el tiempo', puntos: puntos, unidad: 'pulsaciones', nivel: puntos >= 60 ? 'Dedos de acero' : 'Calentando',
          compartir: 'Mi juego · ' + puntos + ' pulsaciones en 10 segundos',
          alRepetir: jugar
        });
      }
    }).iniciar();
  }

  portada();
})();

/* REFLEJOS: espera al color lima y pulsa. 5 intentos válidos; las salidas en falso se repiten y restan puntos. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('rf');
  if (!raiz) return;
  var INTENTOS = 5, NIVELES = [[0, 'Pausado'], [350, 'Tranquilo'], [500, 'Ágil'], [600, 'Rápido'], [700, 'Muy rápido'], [800, 'Rayo']];
  var sesion = TYJ.Sesion(null, {}), e, ui, espera = null, manejado = false;

  function pantalla() {
    TYJ.vaciar(raiz);
    ui = {};
    ui.hud = TYJ.hud([['intento', 'Intento', '1 de ' + INTENTOS], ['media', 'Media', '–']]);
    ui.zona = h('button', { class: 'rf-zona rf-zona--reposo', type: 'button' });
    ui.zona.addEventListener('pointerdown', function (ev) { if (ev.button > 0) return; manejado = true; accion(); });
    ui.zona.addEventListener('keydown', function (ev) { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); if (!ev.repeat) accion(); } });
    ui.zona.addEventListener('click', function () { if (manejado) { manejado = false; return; } accion(); });
    ui.lista = h('ol', { class: 'rf-tiempos', 'aria-label': 'Tiempos de cada intento' });
    ui.final = h('div'); ui.est = h('div');
    [ui.hud.nodo, ui.zona, ui.lista, ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }

  /* Semáforo decorativo (aria-hidden): rojo mientras esperas, verde en «¡Ya!», ámbar si te adelantas. No avanza con el tiempo, así que no delata cuándo llegará el verde. */
  function semaforo(clase) {
    var enc = { espera: 0, pronto: 1, ya: 2 }[clase];
    return h('span', { class: 'rf-semaforo', 'aria-hidden': 'true' }, [0, 1, 2].map(function (i) { return h('span', { class: 'rf-luz rf-luz--' + ['roja', 'ambar', 'verde'][i] + (enc === i ? ' rf-luz--on' : '') }); }));
  }

  function poner(clase, titulo, sub) {
    ui.zona.className = 'rf-zona rf-zona--' + clase;
    TYJ.vaciar(ui.zona);
    ui.zona.appendChild(semaforo(clase));
    ui.zona.appendChild(h('span', { class: 'rf-titulo', texto: titulo }));
    if (sub) ui.zona.appendChild(h('span', { class: 'rf-sub', texto: sub }));
  }

  function nuevaPartida() {
    clearTimeout(espera); manejado = false;
    e = { tiempos: [], falsas: 0, fase: 'reposo', t0: 0 };
    pantalla();
    ui.zona.disabled = false;
    poner('reposo', 'Pulsa para empezar', 'Luego espera al color lima');
  }

  function intento() {
    e.fase = 'espera';
    ui.hud.poner('intento', Math.min(e.tiempos.length + 1, INTENTOS) + ' de ' + INTENTOS);
    poner('espera', 'Espera…', 'No pulses todavía');
    espera = setTimeout(function () {
      poner('ya', '¡Ya!', 'Pulsa ahora');
      TYJ.anunciar('¡Ya!');
      e.fase = 'cambiando';                                       // el reloj arranca cuando el navegador dibuja el cambio
      requestAnimationFrame(function () { e.t0 = performance.now(); e.fase = 'ya'; });
    }, U.entre(1500, 4500));
  }

  function accion() {
    var ahora = performance.now();
    if (e.fase === 'reposo' || e.fase === 'pausa') return intento();
    if (e.fase === 'espera') {                                  // salida en falso: el intento no cuenta y se repite
      clearTimeout(espera); e.falsas++; e.fase = 'pausa';
      poner('pronto', 'Demasiado pronto', 'Intento anulado. Pulsa para repetirlo y espera al lima.');
      TYJ.anunciar('Demasiado pronto. Pulsa para repetir el intento.');
      return;
    }
    if (e.fase === 'ya') {
      var ms = Math.round(ahora - e.t0);
      e.tiempos.push(ms); e.fase = 'pausa';
      var media = Math.round(e.tiempos.reduce(function (a, b) { return a + b; }, 0) / e.tiempos.length);
      ui.hud.poner('media', media + ' ms');
      ui.lista.appendChild(h('li', { texto: ms + ' ms' }));
      if (e.tiempos.length >= INTENTOS) return fin(media);
      poner('resultado', ms + ' ms', 'Pulsa para el siguiente intento');
      TYJ.anunciar(ms + ' milisegundos');
    }
  }

  function fin(media) {
    e.fase = 'fin'; ui.zona.disabled = true;
    var mejor = Math.min.apply(null, e.tiempos);
    var pts = Math.max(0, 1000 - 2 * media - 50 * e.falsas);
    sesion.registrar(pts);
    poner('resultado', media + ' ms de media', 'Tu mejor intento: ' + mejor + ' ms');
    var cont = h('div'); ui.final.appendChild(cont);
    TYJ.final(cont, { titulo: 'Tiempo medio: ' + media + ' ms', puntos: pts, unidad: 'puntos', nivel: U.nivel(pts, NIVELES),
      detalles: ['Mejor intento: ' + mejor + ' ms', 'Salidas en falso: ' + e.falsas, 'Intentos: ' + e.tiempos.join(' · ') + ' ms'],
      compartir: 'Reflejos: media de ' + media + ' ms (mejor intento, ' + mejor + ' ms).', textoRepetir: 'Jugar otra vez', alRepetir: nuevaPartida });
  }

  nuevaPartida();
})();

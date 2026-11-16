/* PIEDRA, PAPEL O TIJERA contra la máquina, al mejor de 3, 5 o 7. La máquina sortea con igual probabilidad. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('ppt');
  if (!raiz) return;
  var JUGADAS = [{ id: 'piedra', nombre: 'Piedra', gana: 'tijera' }, { id: 'papel', nombre: 'Papel', gana: 'piedra' }, { id: 'tijera', nombre: 'Tijera', gana: 'papel' }];
  var sesion = TYJ.Sesion(null, { victorias: true, racha: true, mejor: false });
  var serie = 5, t = null, ui = null;

  function por(id) { return JUGADAS.filter(function (j) { return j.id === id; })[0]; }
  function resultado(yo, ella) { return yo === ella ? 0 : (por(yo).gana === ella ? 1 : -1); }   // 1 gana el jugador, -1 gana la máquina

  function nueva() {
    t = { necesarias: Math.ceil(serie / 2), yo: 0, ella: 0, ronda: 0, fin: false };
    montar(); pintar();
  }

  function montar() {
    TYJ.vaciar(raiz);
    ui = {};
    ui.series = h('div', { class: 'fila', role: 'group', 'aria-label': 'Número de rondas' });
    [3, 5, 7].forEach(function (n) {
      ui.series.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(n === serie), onclick: function () { serie = n; nueva(); } }, 'Al mejor de ' + n));
    });
    ui.hud = TYJ.hud([['yo', 'Tú', '0'], ['ella', 'Máquina', '0'], ['ronda', 'Ronda', '1']]);
    ui.botones = h('div', { class: 'ppt-jugadas', role: 'group', 'aria-label': 'Tu jugada' });
    ui.lista = [];
    JUGADAS.forEach(function (j) {
      var b = h('button', { class: 'boton-retro', type: 'button', 'data-jugada': j.id, onclick: function () { jugar(j.id); } }, j.nombre);
      ui.lista.push(b); ui.botones.appendChild(b);
    });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite', texto: 'Elige piedra, papel o tijera.' });
    ui.hist = h('ul', { class: 'ppt-hist', 'aria-label': 'Rondas jugadas' });
    ui.final = h('div'); ui.est = h('div');
    [ui.series, ui.hud.nodo, ui.botones, ui.msg, ui.hist, ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }

  function pintar() {
    ui.hud.poner('yo', t.yo); ui.hud.poner('ella', t.ella); ui.hud.poner('ronda', Math.min(t.ronda + 1, 99));
    ui.lista.forEach(function (b) { b.disabled = t.fin; });
  }

  function jugar(id) {
    if (t.fin) return;
    var ella = U.elegir(JUGADAS).id, r = resultado(id, ella), texto;
    t.ronda++;
    if (r > 0) t.yo++; else if (r < 0) t.ella++;
    texto = 'Ronda ' + t.ronda + ': tú ' + por(id).nombre.toLowerCase() + ', máquina ' + por(ella).nombre.toLowerCase() + '. ' + (r > 0 ? 'Ganas la ronda.' : r < 0 ? 'Gana la máquina.' : 'Empate: se repite.');
    ui.hist.insertBefore(h('li', { class: r > 0 ? 'ppt-gano' : r < 0 ? 'ppt-perdio' : 'ppt-empate', texto: texto }), ui.hist.firstChild);
    ui.msg.textContent = texto;
    if (t.yo >= t.necesarias || t.ella >= t.necesarias) { t.fin = true; pintar(); return acabar(); }
    pintar();
  }

  function acabar() {
    var gano = t.yo > t.ella;
    ui.msg.textContent = '';
    sesion.registrar(0, gano);
    TYJ.final(ui.final.appendChild(h('div')), { titulo: gano ? '¡Has ganado la serie!' : 'Gana la máquina', nivel: 'Al mejor de ' + serie,
      detalles: ['Marcador final: ' + t.yo + ' a ' + t.ella, 'Rondas jugadas: ' + t.ronda],
      compartir: 'Piedra, papel o tijera (al mejor de ' + serie + '): ' + (gano ? 'he ganado ' : 'he perdido ') + t.yo + '–' + t.ella + '.',
      textoRepetir: 'Otra serie', alRepetir: nueva });
  }

  nueva();
})();

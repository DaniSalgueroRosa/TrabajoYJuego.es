(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var h = TH.h, tituloOriginal = document.title;
    var NOMBRES = { trabajo: 'Concentración', corto: 'Descanso corto', largo: 'Descanso largo' };
    var e = { fase: 'trabajo', restante: 25 * 60000, corriendo: false, hechos: 0, fin: 0, reloj: null };
    function campo(id, etiqueta, valor, ayuda) {
      var i = h('input', { id: id, type: 'text', inputmode: 'decimal', autocomplete: 'off', value: valor });
      return { el: i, nodo: h('div', { class: 'campo' }, h('label', { for: id, texto: etiqueta }), i, ayuda ? h('span', { class: 'campo-ayuda', texto: ayuda }) : null) };
    }
    var cT = campo('c-trabajo', 'Concentración (minutos)', '25'), cC = campo('c-corto', 'Descanso corto (min)', '5'), cL = campo('c-largo', 'Descanso largo (min)', '15'), cN = campo('c-ciclos', 'Descanso largo cada (pomodoros)', '4');
    var sonido = h('input', { id: 'c-sonido', type: 'checkbox', checked: true }), auto = h('input', { id: 'c-auto', type: 'checkbox', checked: true });
    var tiempo = h('output', { class: 'pomo-tiempo', 'data-k': 'tiempo', 'aria-label': 'Tiempo restante', 'aria-live': 'off' });
    var fase = h('p', { class: 'pomo-fase', 'data-k': 'fase', 'aria-live': 'polite' });
    var cuenta = h('p', { class: 'pomo-cuenta', 'data-k': 'hechos' });
    var barra = h('progress', { class: 'herr-progreso pomo-barra', max: '100', value: '0', 'aria-label': 'Progreso de esta fase' });
    var panel = h('div', { class: 'pomo', id: 'pomo' });
    function minutos(c, def) { var n = TH.num(c.el.value); return isFinite(n) && n >= 0.05 && n <= 600 ? n : def; }
    function duracion(f) { return Math.round((f === 'trabajo' ? minutos(cT, 25) : f === 'corto' ? minutos(cC, 5) : minutos(cL, 15)) * 60000); }
    function reloj(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2); }
    function pitar() {
      if (!sonido.checked) return;
      try {
        var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
        var a = new Ctx(); [0, 0.35].forEach(function (t) { var o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; g.gain.value = 0.12; o.connect(g); g.connect(a.destination); o.start(a.currentTime + t); o.stop(a.currentTime + t + 0.22); });
        setTimeout(function () { a.close(); }, 1200);
      } catch (x) { /* sin sonido */ }
    }
    function pintar() {
      tiempo.textContent = reloj(e.restante);
      fase.textContent = NOMBRES[e.fase];
      cuenta.textContent = 'Pomodoros completados: ' + e.hechos;
      panel.setAttribute('data-fase', e.fase); panel.setAttribute('data-hechos', String(e.hechos)); panel.setAttribute('data-corriendo', e.corriendo ? 'si' : 'no');
      var total = duracion(e.fase); barra.value = Math.max(0, Math.min(100, 100 - e.restante / total * 100));
      boton.textContent = e.corriendo ? 'Pausar' : (e.restante < duracion(e.fase) ? 'Reanudar' : 'Iniciar');
      document.title = e.corriendo ? reloj(e.restante) + ' · ' + NOMBRES[e.fase] + ' – ' + tituloOriginal : tituloOriginal;
    }
    function siguiente(porFin) {
      if (e.fase === 'trabajo') { if (porFin) e.hechos++; e.fase = e.hechos > 0 && e.hechos % Math.max(1, Math.round(minutos(cN, 4))) === 0 && porFin ? 'largo' : 'corto'; }
      else e.fase = 'trabajo';
      e.restante = duracion(e.fase);
      if (porFin) { pitar(); TH.anunciar(NOMBRES[e.fase] + ' empieza ahora.'); }
      if (e.corriendo && (!auto.checked && porFin)) parar();
      else if (e.corriendo) e.fin = Date.now() + e.restante;
      pintar();
    }
    function tic() {
      e.restante = e.fin - Date.now();
      if (e.restante <= 0) siguiente(true); else pintar();
    }
    function parar() { e.corriendo = false; clearInterval(e.reloj); e.reloj = null; pintar(); }
    function empezar() { e.corriendo = true; e.fin = Date.now() + e.restante; clearInterval(e.reloj); e.reloj = setInterval(tic, 250); pintar(); }
    var boton = h('button', { class: 'boton', type: 'button', id: 'pomo-iniciar', onclick: function () { if (e.corriendo) parar(); else empezar(); } }, 'Iniciar');
    var reiniciar = h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { parar(); e.fase = 'trabajo'; e.hechos = 0; e.restante = duracion('trabajo'); pintar(); } }, 'Reiniciar todo');
    var saltar = h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { siguiente(false); } }, 'Saltar a la siguiente fase');
    [cT, cC, cL, cN].forEach(function (c) { c.el.addEventListener('input', function () { if (!e.corriendo) { e.restante = duracion(e.fase); pintar(); } }); });
    panel.appendChild(h('div', { class: 'pomo-reloj' }, fase, tiempo, barra, cuenta, h('div', { class: 'herr-acciones' }, boton, saltar, reiniciar)));
    TH.vaciar(raiz).appendChild(panel);
    raiz.appendChild(h('div', { class: 'herr-campos' }, cT.nodo, cC.nodo, cL.nodo, cN.nodo,
      h('div', { class: 'campo campo--check' }, h('span', { class: 'campo-check' }, sonido, h('label', { for: 'c-sonido', texto: 'Aviso sonoro al terminar cada fase' }))),
      h('div', { class: 'campo campo--check' }, h('span', { class: 'campo-check' }, auto, h('label', { for: 'c-auto', texto: 'Empezar la siguiente fase automáticamente' })))));
    e.restante = duracion('trabajo'); pintar();
    window.addEventListener('pagehide', function () { document.title = tituloOriginal; });
  });
})();

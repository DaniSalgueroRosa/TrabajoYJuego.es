/* REPITE LA SECUENCIA: cuatro botones de colores se iluminan en un orden; tú repites el orden. Cada ronda añade un paso nuevo.
   Cada botón tiene color, símbolo, nombre y una nota distinta; se puede jugar con las teclas 1 a 4. Sonido opcional. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('sq');
  if (!raiz) return;
  var BOTONES = [
    { n: 'Verde', s: '▲', apagado: '#2F6B5C', encendido: '#8FD694', hz: 262 },
    { n: 'Rosa', s: '●', apagado: '#7D2A40', encendido: '#FF5A7D', hz: 330 },
    { n: 'Amarillo', s: '■', apagado: '#6B6B1F', encendido: '#E6F14A', hz: 392 },
    { n: 'Azul', s: '◆', apagado: '#274E6B', encendido: '#6EC1FF', hz: 523 }
  ];
  var VELOCIDADES = { tranquilo: { nombre: 'Tranquilo', on: 720, off: 320, factor: 10 }, normal: { nombre: 'Normal', on: 520, off: 220, factor: 15 }, rapido: { nombre: 'Rápido', on: 320, off: 140, factor: 20 } };
  var NIVELES = [[0, 'Despistado'], [60, 'Atento'], [150, 'Buena memoria'], [300, 'Memoria de elefante'], [500, 'Memoria prodigiosa']];
  var sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ' });
  var vel = 'normal', sonido = true, g = null, ui = null, temporizadores = [], audio = null;

  function sonar(i, ms) {
    if (!sonido) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), v = audio.createGain(), t = audio.currentTime;
      o.type = 'triangle'; o.frequency.value = BOTONES[i].hz;
      v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(0.18, t + 0.02); v.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.connect(v); v.connect(audio.destination); o.start(t); o.stop(t + ms / 1000 + 0.05);
    } catch (e) { sonido = false; }
  }
  function cancelar() { temporizadores.forEach(clearTimeout); temporizadores = []; }
  function luego(ms, f) { temporizadores.push(setTimeout(f, ms)); }

  function nueva() {
    cancelar();
    g = { fase: 'espera', secuencia: [], paso: 0, ronda: 0, puntos: 0 };
    montar(); luces(-1); datos();
    TYJ.anunciar('Nueva partida. Pulsa Empezar.');
  }
  function empezar() {
    if (g.fase !== 'espera') return;
    g.secuencia = []; g.ronda = 0; g.puntos = 0;
    ui.empezar.disabled = true; ui.velocidades.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    siguienteRonda();
  }
  function siguienteRonda() {
    g.ronda++; g.paso = 0; g.secuencia.push(U.azar(4));
    ui.hud.poner('ronda', g.ronda); ui.hud.poner('puntos', g.puntos);
    mostrar();
  }
  function mostrar() {
    g.fase = 'mostrando'; ponerBotones(false); datos();
    ui.msg.textContent = 'Mira la secuencia (' + g.secuencia.length + (g.secuencia.length === 1 ? ' paso' : ' pasos') + ')…'; ui.msg.className = 'mensaje';
    var v = VELOCIDADES[vel], t = 700;
    g.secuencia.forEach(function (b, k) {
      luego(t, function () { luces(b); sonar(b, v.on); TYJ.anunciar(BOTONES[b].n); });
      luego(t + v.on, function () { luces(-1); });
      t += v.on + v.off;
    });
    luego(t, function () {
      g.fase = 'turno'; g.paso = 0; ponerBotones(true); datos();
      ui.msg.textContent = 'Tu turno: repite la secuencia.'; TYJ.anunciar('Tu turno.');
    });
  }
  function pulsar(i) {
    if (g.fase !== 'turno') return;
    luces(i); sonar(i, 220);
    luego(200, function () { if (g.fase !== 'fin') luces(-1); });
    if (g.secuencia[g.paso] !== i) return fallo(i);
    g.paso++;
    ui.msg.textContent = g.paso + ' de ' + g.secuencia.length;
    datos();
    if (g.paso === g.secuencia.length) {
      g.fase = 'espera-ronda'; ponerBotones(false); datos();
      g.puntos += g.secuencia.length * VELOCIDADES[vel].factor;
      ui.hud.poner('puntos', g.puntos);
      ui.msg.textContent = '¡Bien! Ronda ' + g.ronda + ' superada.'; ui.msg.className = 'mensaje mensaje--ok';
      TYJ.anunciar('Ronda ' + g.ronda + ' superada.');
      luego(900, siguienteRonda);
    }
  }
  function fallo(i) {
    cancelar(); g.fase = 'fin'; ponerBotones(false); datos();
    ui.botones[i].classList.add('sq-error');
    var esperado = BOTONES[g.secuencia[g.paso]];
    ui.msg.textContent = 'Era el ' + esperado.n.toLowerCase() + ' (' + esperado.s + ').'; ui.msg.className = 'mensaje mensaje--mal';
    sesion.registrar(g.puntos);
    var nivel = U.nivel(g.puntos, NIVELES), conseguidas = g.ronda - 1;
    TYJ.final(ui.final.appendChild(h('div')), { titulo: conseguidas ? 'Has llegado a ' + conseguidas + (conseguidas === 1 ? ' paso' : ' pasos') : 'Fallaste en el primer paso', puntos: g.puntos, unidad: 'puntos', nivel: nivel,
      detalles: ['Velocidad: ' + VELOCIDADES[vel].nombre, 'Secuencia más larga repetida: ' + conseguidas],
      compartir: 'Repite la secuencia (' + VELOCIDADES[vel].nombre.toLowerCase() + '): ' + conseguidas + ' pasos, ' + g.puntos + ' puntos · ' + nivel + '.', textoRepetir: 'Otra partida', alRepetir: nueva });
  }

  /* ---- pantalla */
  function luces(i) {
    ui.botones.forEach(function (b, k) {
      var on = k === i;
      b.classList.toggle('sq-on', on);
      b.style.background = on ? BOTONES[k].encendido : BOTONES[k].apagado;
    });
  }
  function ponerBotones(activos) { ui.botones.forEach(function (b) { b.disabled = !activos; }); }
  function montar() {
    TYJ.vaciar(raiz);
    ui = { botones: [] };
    ui.velocidades = h('div', { class: 'fila', role: 'group', 'aria-label': 'Velocidad' });
    Object.keys(VELOCIDADES).forEach(function (k) {
      ui.velocidades.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(k === vel), onclick: function (ev) {
        vel = k; ui.velocidades.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === ev.currentTarget)); });
      } }, VELOCIDADES[k].nombre));
    });
    ui.sonido = h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(sonido), onclick: function (ev) { sonido = !sonido; ev.currentTarget.setAttribute('aria-pressed', String(sonido)); ev.currentTarget.textContent = sonido ? 'Sonido: sí' : 'Sonido: no'; } }, sonido ? 'Sonido: sí' : 'Sonido: no');
    ui.hud = TYJ.hud([['ronda', 'Ronda', 0], ['puntos', 'Puntos', 0]]);
    ui.tablero = h('div', { class: 'sq-tablero', role: 'group', 'aria-label': 'Botones de colores' });
    BOTONES.forEach(function (b, i) {
      var el = h('button', { class: 'sq-boton', type: 'button', 'aria-label': b.n + ', tecla ' + (i + 1), 'aria-keyshortcuts': String(i + 1), disabled: true, onclick: function () { pulsar(i); } },
        h('span', { class: 'sq-simbolo', 'aria-hidden': 'true' }, b.s), h('span', { class: 'sq-nombre' }, b.n));
      ui.botones.push(el); ui.tablero.appendChild(el);
    });
    ui.msg = h('p', { class: 'mensaje', role: 'status' }, 'Pulsa Empezar y fíjate bien en el orden de los colores.');
    ui.empezar = h('button', { class: 'boton-retro', type: 'button', onclick: empezar }, 'Empezar');
    ui.final = h('div'); ui.est = h('div');
    [h('div', { class: 'fila' }, ui.velocidades, ui.sonido), ui.hud.nodo, ui.tablero, ui.msg,
      h('div', { class: 'fila fila--centro' }, ui.empezar, h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: nueva }, 'Reiniciar')),
      ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }
  function datos() {                                    // estado legible desde fuera (pruebas automáticas)
    ui.tablero.setAttribute('data-fase', g.fase);
    ui.tablero.setAttribute('data-secuencia', g.secuencia.join(''));
    ui.tablero.setAttribute('data-paso', String(g.paso));
  }
  document.addEventListener('keydown', function (ev) {
    if (!g || g.fase !== 'turno' || ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat) return;
    var n = parseInt(ev.key, 10);
    if (n >= 1 && n <= 4) { ev.preventDefault(); pulsar(n - 1); }
  });

  nueva();
})();

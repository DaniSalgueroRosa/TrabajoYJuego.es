/* ACERTIJOS: uno al día (igual para todos ese día; cambia a medianoche, hora de Madrid) y modo sin fin. Pista, 3 fallos y solución. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('ac');
  if (!raiz) return;
  var lista = [], mazo = [], sesion = TYJ.Sesion(null, { victorias: true, racha: true }), ui, a;

  function sinArticulo(t) { return U.clave(t).replace(/^(el|la|los|las|un|una|unos|unas) /, ''); }
  function acierta(texto, rs) {
    var t = sinArticulo(texto);
    if (!t) return false;
    if (U.coincide(t, rs)) return true;
    var palabras = t.split(' ');
    if (palabras.length > 6) return false;
    return rs.some(function (r) { var c = U.clave(r); return (' ' + t + ' ').indexOf(' ' + c + ' ') >= 0; });   // «es un mapa» también vale
  }
  function robar() { if (!mazo.length) mazo = U.barajar(lista); return mazo.pop(); }
  function deldia() { var reto = U.retoDelDia('acertijos'); return { r: lista[reto.semilla % lista.length], numero: reto.numero }; }

  function inicio() {
    TYJ.vaciar(raiz);
    var est = h('div');
    raiz.appendChild(h('p', { class: 'mensaje' }, 'Elige cómo quieres jugar. El acertijo del día (n.º ' + U.retoDelDia('acertijos').numero + ') es el mismo para todo el mundo y cambia a medianoche, hora de Madrid.'));
    raiz.appendChild(h('div', { class: 'fila fila--centro' },
      h('button', { class: 'boton-retro', type: 'button', onclick: function () { var d = deldia(); jugar(d.r, 'dia', d.numero); } }, 'Acertijo del día'),
      h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: function () { jugar(robar(), 'sin-fin'); } }, 'Sin fin')));
    raiz.appendChild(est); sesion.montar(est);
  }

  function jugar(r, modo, numero) {
    a = { r: r, modo: modo, numero: numero, fallos: 0, pista: false, hecho: false };
    TYJ.vaciar(raiz);
    ui = {};
    ui.hud = TYJ.hud([['valor', 'Valen', 100], ['fallos', 'Fallos', '0 de 3']]);
    ui.enunciado = h('p', { class: 'ac-enunciado', texto: r.p });
    ui.campo = h('input', { class: 'campo-retro', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Tu respuesta', maxlength: '60' });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.pista = h('p', { class: 'ac-pista', hidden: true });
    ui.enviar = h('button', { class: 'boton-retro', type: 'submit' }, 'Responder');
    ui.btnPista = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: pedirPista }, 'Pista (−25)');
    ui.btnRevelar = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: function () { terminar(false, true); } }, 'Ver solución');
    ui.form = h('form', { class: 'ac-form', onsubmit: function (ev) { ev.preventDefault(); responder(); } }, ui.campo, ui.enviar);
    ui.acciones = h('div', { class: 'fila fila--centro' }, ui.btnPista, ui.btnRevelar);
    ui.final = h('div'); ui.est = h('div');
    [ui.hud.nodo, h('p', { class: 'ac-modo', texto: modo === 'dia' ? 'Acertijo del día n.º ' + numero : 'Modo sin fin' }), ui.enunciado, ui.form, ui.msg, ui.pista, ui.acciones, ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
    ui.campo.focus({ preventScroll: true });
  }

  function valor() { return Math.max(10, 100 - 20 * a.fallos - (a.pista ? 25 : 0)); }
  function pedirPista() { if (a.hecho) return; a.pista = true; ui.pista.hidden = false; ui.pista.textContent = 'Pista: ' + a.r.pista; ui.btnPista.disabled = true; ui.hud.poner('valor', valor()); TYJ.anunciar(ui.pista.textContent); }

  function responder() {
    if (a.hecho) return;
    var t = ui.campo.value;
    if (!U.clave(t)) { ui.msg.textContent = 'Escribe tu respuesta.'; return; }
    if (acierta(t, a.r.r)) return terminar(true, false);
    a.fallos++;
    ui.hud.poner('fallos', a.fallos + ' de 3', a.fallos >= 2); ui.hud.poner('valor', valor());
    ui.campo.value = ''; ui.campo.focus();
    if (a.fallos >= 3) return terminar(false, false);
    ui.msg.textContent = 'No es esa. Te quedan ' + (3 - a.fallos) + ' intentos.'; ui.msg.className = 'mensaje mensaje--mal';
    TYJ.anunciar(ui.msg.textContent);
  }

  function terminar(acertado, revelado) {
    a.hecho = true;
    var pts = acertado ? valor() : 0;
    sesion.registrar(pts, acertado);
    ui.campo.disabled = true; ui.enviar.disabled = true; ui.btnPista.disabled = true; ui.acciones.hidden = true;
    ui.msg.className = 'mensaje';
    ui.msg.textContent = '';
    var cont = h('div'); ui.final.appendChild(cont);
    var nodo = TYJ.final(cont, {
      titulo: acertado ? '¡Correcto!' : (revelado ? 'Solución' : 'Sin intentos'),
      puntos: acertado ? pts : null,
      detalles: acertado ? [a.pista ? 'Con pista' : 'Sin pista', 'Fallos: ' + a.fallos] : [],
      compartir: a.modo === 'dia' ? 'Acertijo del día n.º ' + a.numero + ' · ' + (acertado ? 'resuelto con ' + pts + ' puntos' : 'no lo he resuelto') : 'Acertijos · ' + (acertado ? pts + ' puntos' : 'este se me resistió'),
      textoRepetir: a.modo === 'dia' ? 'Probar en modo sin fin' : 'Siguiente acertijo',
      alRepetir: function () { if (a.modo === 'dia') jugar(robar(), 'sin-fin'); else jugar(robar(), 'sin-fin'); }
    });
    var sol = h('div', { class: 'ac-solucion' },
      h('p', {}, h('strong', { texto: 'Respuesta: ' }), a.r.r[0] + '.'),
      h('p', { texto: a.r.e }));
    nodo.insertBefore(sol, nodo.querySelector('.final-botones'));
    if (a.modo === 'dia') nodo.querySelector('.final-botones').appendChild(h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: inicio }, 'Volver al inicio'));
    ui.final.scrollIntoView({ block: 'nearest' });
  }

  function arrancar() {
    TYJ.datos('acertijos/acertijos.json').then(function (j) { lista = j.acertijos; inicio(); }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

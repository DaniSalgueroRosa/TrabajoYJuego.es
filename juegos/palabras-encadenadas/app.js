/* PALABRAS ENCADENADAS: cada palabra empieza por la última letra de la anterior. Jugador contra ordenador, con tiempo por turno.
   Usa la lista compartida juegos/datos/palabras.json (palabras de 4 a 7 letras escritas a mano). Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('pe');
  if (!raiz) return;
  var NIVELES = [[0, 'Calentando'], [5, 'Hilando'], [10, 'Encadenador'], [20, 'Maestro de la cadena'], [30, 'Diccionario andante']];
  var lista = [], porInicial = {}, enLista = {}, sesion = TYJ.Sesion(null, { victorias: true }), e, ui, temporizador;

  function clave(w) { return U.norm(w).replace(/[^a-zñ]/g, ''); }
  function ultima(w) { var c = clave(w); return c.charAt(c.length - 1); }

  function indexar(json) {
    var vistas = {};
    Object.keys(json.longitudes).forEach(function (l) {
      var bloque = json.longitudes[l];
      (bloque.soluciones || []).concat(bloque.validas || []).forEach(function (w) {
        var c = clave(w);
        if (vistas[c]) return;
        vistas[c] = true; enLista[c] = w;
        (porInicial[c.charAt(0)] = porInicial[c.charAt(0)] || []).push(w);
        lista.push(w);
      });
    });
  }
  function libres(letra) { return (porInicial[letra] || []).filter(function (w) { return !e.usadas[clave(w)]; }); }

  function inicio() {
    TYJ.vaciar(raiz);
    var est = h('div');
    raiz.appendChild(h('p', { class: 'mensaje' }, 'El ordenador dice una palabra y tú contestas con otra que empiece por su última letra. No vale repetir.'));
    raiz.appendChild(h('div', { class: 'fila fila--centro' }, h('button', { class: 'boton-retro', type: 'button', onclick: empezar }, 'Empezar')));
    raiz.appendChild(est); sesion.montar(est);
  }

  function empezar() {
    e = { cadena: [], usadas: {}, jugadas: 0, puntos: 0, pendiente: null, fase: 'jugador', seg: 20 };
    TYJ.vaciar(raiz);
    ui = {};
    ui.hud = TYJ.hud([['palabras', 'Tus palabras', 0], ['puntos', 'Puntos', 0]]);
    ui.barra = TYJ.barraDeTiempo();
    ui.cadena = h('ol', { class: 'pe-cadena', 'aria-label': 'Palabras de la cadena' });
    ui.letra = h('p', { class: 'pe-letra', 'aria-live': 'polite' });
    ui.campo = h('input', { class: 'campo-retro', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Tu palabra', maxlength: '24' });
    ui.form = h('form', { class: 'pe-form', onsubmit: function (ev) { ev.preventDefault(); decir(); } }, ui.campo, h('button', { class: 'boton-retro', type: 'submit' }, 'Decir'));
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.forzar = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', hidden: true, onclick: function () { if (e.pendiente) aceptar(e.pendiente, false); } }, 'Usarla igualmente');
    ui.final = h('div'); ui.est = h('div');
    [ui.hud.nodo, ui.barra.nodo, ui.cadena, ui.letra, ui.form, ui.msg, ui.forzar, ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
    temporizador = new TYJ.Temporizador({ segundos: 20, alTick: function (r) { ui.barra.poner(r / e.seg); }, alFin: function () { if (e.fase === 'jugador') fin(false); } });
    var primeras = lista.filter(function (w) { return w.length >= 5 && w.length <= 6 && libres(ultima(w)).length >= 40; });
    var primera = U.elegir(primeras);
    poner(primera, 'ordenador');
    turnoJugador();
  }

  function poner(w, quien) {
    e.usadas[clave(w)] = true; e.cadena.push({ w: w, q: quien });
    var c = clave(w), li = h('li', { class: 'pe-burbuja pe-burbuja--' + (quien === 'yo' ? 'yo' : 'pc') },
      h('span', { class: 'solo-lectores', texto: (quien === 'yo' ? 'Tú: ' : 'Ordenador: ') }),
      document.createTextNode(w.slice(0, -1)), h('b', { class: 'pe-ultima', texto: w.slice(-1) }));
    ui.cadena.appendChild(li);
    ui.cadena.scrollTop = ui.cadena.scrollHeight;
    TYJ.anunciar((quien === 'yo' ? 'Tú: ' : 'Ordenador: ') + w);
  }

  function turnoJugador() {
    e.fase = 'jugador'; e.pendiente = null; ui.forzar.hidden = true;
    e.seg = Math.max(8, 20 - Math.floor(e.jugadas / 3));
    var l = ultima(e.cadena[e.cadena.length - 1].w);
    e.letra = l;
    ui.letra.textContent = 'Empieza por: ' + l.toUpperCase();
    ui.msg.className = 'mensaje'; ui.msg.textContent = 'Tienes ' + e.seg + ' segundos.';
    ui.campo.disabled = false; ui.campo.value = ''; ui.campo.focus({ preventScroll: true });
    temporizador.iniciar(e.seg);
  }

  function decir() {
    if (e.fase !== 'jugador') return;
    var w = ui.campo.value.trim(), c = clave(w);
    e.pendiente = null; ui.forzar.hidden = true;
    if (!c) { aviso('Escribe una palabra.'); return; }
    if (c.length < 3) { aviso('Debe tener al menos tres letras.'); return; }
    if (c.charAt(0) !== e.letra) { aviso('Tiene que empezar por «' + e.letra.toUpperCase() + '».'); return; }
    if (e.usadas[c]) { aviso('Esa palabra ya ha salido en la cadena.'); return; }
    if (enLista[c]) return aceptar(enLista[c], true);
    e.pendiente = w;
    aviso('No la tengo en mi lista. Si es una palabra que existe, pulsa «Usarla igualmente» (vale 1 punto).');
    ui.forzar.hidden = false;
  }
  function aviso(t) { ui.msg.textContent = t; ui.msg.className = 'mensaje mensaje--mal'; TYJ.anunciar(t); }

  function aceptar(w, verificada) {
    if (e.fase !== 'jugador') return;
    var restante = temporizador.parar();
    e.fase = 'ordenador'; ui.forzar.hidden = true; ui.campo.disabled = true;
    var pts = verificada ? clave(w).length + (restante >= e.seg * 2 / 3 ? 2 : 0) : 1;
    e.puntos += pts; e.jugadas++;
    ui.hud.poner('palabras', e.jugadas); ui.hud.poner('puntos', e.puntos);
    poner(w, 'yo');
    ui.msg.className = 'mensaje mensaje--ok'; ui.msg.textContent = '+' + pts + (verificada ? '' : ' (palabra sin verificar)');
    setTimeout(turnoOrdenador, 650);
  }

  function turnoOrdenador() {
    var l = ultima(e.cadena[e.cadena.length - 1].w), cand = libres(l);
    if (!cand.length) { e.puntos += 50; ui.hud.poner('puntos', e.puntos); return fin(true); }
    var buenas = cand.filter(function (w) { return libres(ultima(w)).length >= 8; });
    poner(U.elegir(buenas.length ? buenas : cand), 'pc');
    turnoJugador();
  }

  function fin(gana) {
    e.fase = 'fin'; temporizador.parar(); ui.campo.disabled = true; ui.forzar.hidden = true; ui.form.hidden = true; ui.letra.textContent = '';
    ui.msg.textContent = ''; ui.barra.poner(0);
    sesion.registrar(e.puntos, gana);
    var cont = h('div'); ui.final.appendChild(cont);
    TYJ.final(cont, { titulo: gana ? '¡Me has dejado sin palabras!' : 'Se acabó el tiempo', puntos: e.puntos, unidad: 'puntos', nivel: U.nivel(e.jugadas, NIVELES),
      detalles: ['Palabras que has dicho: ' + e.jugadas, 'Longitud de la cadena: ' + e.cadena.length],
      compartir: 'Palabras encadenadas: ' + e.jugadas + ' palabras y ' + e.puntos + ' puntos' + (gana ? ' (¡dejé al ordenador sin palabras!)' : '') + '.', textoRepetir: 'Otra cadena', alRepetir: empezar });
  }

  function arrancar() {
    TYJ.datos('datos/palabras.json').then(function (j) { indexar(j); inicio(); }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

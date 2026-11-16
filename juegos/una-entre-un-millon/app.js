/* UNA ENTRE UN MILLÓN
   7 preguntas «nombra un…», 25 s cada una, y una CARRERA: el coche avanza con cada respuesta y la meta son los 700 puntos (7 × 100).
   Cada pregunta vale hasta 100 puntos: los 100 son para la respuesta más rara que conoce el juego en esa pregunta y el resto se reparte
   por rareza (100 × ln n / ln n_máx, con «1 de cada n»). Banco de preguntas local en preguntas.json; sin IA externa y sin guardar nada. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('uem');
  if (!raiz) return;

  var PREGUNTAS_POR_PARTIDA = 7, SEGUNDOS = 25, META = PREGUNTAS_POR_PARTIDA * 100;
  var banco = null, vistas = {}, sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ' }), temporizador = null;

  /* n = «1 de cada n»; techo = la n más alta de esa pregunta (la respuesta más rara vale 100) */
  function techoDe(p) { return p.respuestas.reduce(function (a, b) { return b.n > a ? b.n : a; }, 2); }
  function puntosDe(n, techo) { return n <= 1 ? 0 : Math.min(100, Math.round(100 * Math.log(n) / Math.log(techo))); }
  function fraccion(n) { return '1 de cada ' + U.miles(n); }

  /* Busca la respuesta del jugador en la lista de la pregunta: primero exacta y, si no, la más parecida con tolerancia a erratas. */
  function buscar(texto, respuestas) {
    var t = U.clave(texto), mejor = null, mejorD = 99;
    if (!t) return null;
    respuestas.forEach(function (r) {
      r.t.forEach(function (alias) {
        var c = U.clave(alias), d;
        if (t === c) d = 0;
        else {
          var tol = c.length >= 10 ? 2 : (c.length >= 5 ? 1 : 0);
          d = (tol && Math.abs(t.length - c.length) <= tol) ? U.distancia(t, c) : 99;
          if (d > tol) d = 99;
        }
        if (d < mejorD || (d === mejorD && mejor && r.n > mejor.n)) { mejor = r; mejorD = d; }
      });
    });
    return mejor;
  }

  function elegirPreguntas() {
    var libres = banco.preguntas.filter(function (p) { return !vistas[p.id]; });
    if (libres.length < PREGUNTAS_POR_PARTIDA) { vistas = {}; libres = banco.preguntas; }
    var elegidas = U.muestra(libres, PREGUNTAS_POR_PARTIDA);
    elegidas.forEach(function (p) { vistas[p.id] = true; });
    return elegidas;
  }

  function inicio() {
    TYJ.vaciar(raiz);
    raiz.appendChild(h('h2', { texto: 'Una entre un millón' }));
    raiz.appendChild(h('p', { class: 'texto', texto: 'Una carrera de siete preguntas, 25 segundos cada una. Nombra algo que casi nadie diría y tu coche avanzará mucho: cada pregunta vale hasta 100 puntos y la meta está en los 700.' }));
    raiz.appendChild(TYJ.carrera({ meta: META, hitos: PREGUNTAS_POR_PARTIDA, etiqueta: 'Pista de la carrera hasta los ' + META + ' puntos' }).nodo);
    raiz.appendChild(h('div', { class: 'fila' }, h('button', { class: 'boton-retro', type: 'button', onclick: empezar, id: 'uem-empezar' }, 'Empezar')));
    var s = h('div'); raiz.appendChild(s);
    sesion.montar(s);
  }

  var estado;
  function empezar() {
    estado = { preguntas: elegirPreguntas(), i: 0, total: 0, detalle: [], pista: TYJ.carrera({ meta: META, hitos: PREGUNTAS_POR_PARTIDA, etiqueta: 'Pista de la carrera hasta los ' + META + ' puntos' }) };
    pregunta();
  }

  function pregunta() {
    var p = estado.preguntas[estado.i], respondida = false;
    TYJ.vaciar(raiz);
    var hud = TYJ.hud([['n', 'Pregunta', (estado.i + 1) + ' / ' + PREGUNTAS_POR_PARTIDA], ['pts', 'Puntos', U.miles(estado.total)]]);
    var barra = TYJ.barraDeTiempo();
    var segundos = h('span', { class: 'uem-segundos', 'aria-hidden': 'true', texto: String(SEGUNDOS) });
    var entrada = h('input', { id: 'uem-respuesta', type: 'text', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', maxlength: '60', placeholder: 'Escribe tu respuesta' });
    var enviar = h('button', { class: 'boton-retro', type: 'submit' }, 'Responder');
    var paso = h('button', { class: 'boton-retro boton-retro--sec', type: 'button' }, 'Paso');
    var form = h('form', { class: 'uem-form', novalidate: true },
      h('div', { class: 'fila' }, h('div', { class: 'campo-retro' }, h('label', { for: 'uem-respuesta', texto: 'Tu respuesta' }), entrada), h('div', { class: 'fila' }, enviar, paso)));
    var zona = h('div', { role: 'status', 'aria-live': 'polite' });
    raiz.appendChild(hud.nodo);
    raiz.appendChild(estado.pista.nodo);
    raiz.appendChild(h('h2', { class: 'uem-pregunta', tabindex: '-1', texto: p.pregunta }));
    raiz.appendChild(h('div', { class: 'uem-cuenta' }, barra.nodo, segundos));
    raiz.appendChild(form);
    raiz.appendChild(zona);
    entrada.focus();

    temporizador = new TYJ.Temporizador({
      segundos: SEGUNDOS,
      alTick: function (r) {
        barra.poner(r / SEGUNDOS); segundos.textContent = String(Math.ceil(r));
        segundos.classList.toggle('uem-segundos--alerta', r <= 7);
      },
      alFin: function () { cerrar(null, true); }
    });
    temporizador.iniciar();

    function cerrar(texto, tiempoAgotado) {
      if (respondida) return; respondida = true;
      temporizador.parar();
      var r = texto ? buscar(texto, p.respuestas) : null, pts = r ? puntosDe(r.n, techoDe(p)) : 0;
      estado.total += pts;
      estado.detalle.push({ pregunta: p.pregunta, texto: texto, r: r, pts: pts, tiempo: !!tiempoAgotado });
      hud.poner('pts', U.miles(estado.total));
      estado.pista.poner(estado.total, estado.i + 1);
      entrada.disabled = enviar.disabled = paso.disabled = true;
      mostrarResultado(zona, p, texto, r, pts, tiempoAgotado);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); var t = entrada.value.trim(); if (!t) { entrada.focus(); return; } cerrar(t, false); });
    paso.addEventListener('click', function () { cerrar(null, false); });
  }

  function mostrarResultado(zona, p, texto, r, pts, tiempoAgotado) {
    var ultima = estado.i === PREGUNTAS_POR_PARTIDA - 1;
    var rara = p.respuestas.reduce(function (a, b) { return b.n > a.n ? b : a; }), comun = p.respuestas.reduce(function (a, b) { return b.n < a.n ? b : a; });
    var titulo, detalle;
    if (r) { titulo = '«' + texto + '»: ' + fraccion(r.n); detalle = '+' + pts + ' puntos de 100'; }
    else if (texto) { titulo = '«' + texto + '» no está en mi lista'; detalle = '0 puntos'; }
    else { titulo = tiempoAgotado ? 'Se acabó el tiempo' : 'Has pasado'; detalle = '0 puntos'; }
    var siguiente = h('button', { class: 'boton-retro', type: 'button', onclick: function () { if (ultima) final(); else { estado.i++; pregunta(); } } }, ultima ? 'Ver resultado' : 'Siguiente');
    var caja = h('div', { class: 'uem-resultado' + (r ? ' uem-resultado--ok' : '') },
      h('p', { class: 'uem-puntos', texto: detalle }),
      h('p', { texto: titulo + (r ? ' (frecuencia estimada)' : '') + '.' }),
      h('p', { class: 'texto-suave', texto: 'La más habitual: ' + comun.t[0] + ' (' + fraccion(comun.n) + '). La más rara que conocemos: ' + rara.t[0] + ' (' + fraccion(rara.n) + ', 100 puntos).' }),
      h('div', { class: 'fila' }, siguiente));
    TYJ.vaciar(zona).appendChild(caja);
    TYJ.anunciar(titulo + '. ' + detalle + '.');
    siguiente.focus();
  }

  function final() {
    var total = estado.total, nivel = U.nivel(total, banco.niveles);
    var lista = h('ul', { class: 'uem-niveles', 'aria-label': 'Niveles' }, banco.niveles.map(function (n) {
      return h('li', n[1] === nivel ? { 'aria-current': 'true' } : {}, h('span', { texto: n[1] }), h('span', { texto: U.miles(n[0]) + '+' }));
    }));
    var tabla = h('table', { class: 'uem-tabla' }, h('thead', {}, h('tr', {}, h('th', { scope: 'col', texto: 'Pregunta' }), h('th', { scope: 'col', texto: 'Tu respuesta' }), h('th', { scope: 'col', texto: 'Puntos (de 100)' }))),
      h('tbody', {}, estado.detalle.map(function (d) {
        return h('tr', {}, h('td', { texto: d.pregunta.replace('Nombra ', '') }), h('td', { texto: d.texto ? d.texto + (d.r ? ' · ' + fraccion(d.r.n) : ' · fuera de lista') : (d.tiempo ? 'Sin tiempo' : 'Paso') }), h('td', { texto: String(d.pts) }));
      })));
    sesion.registrar(total);
    var contenedor = h('div');
    TYJ.vaciar(raiz).appendChild(contenedor);
    var pct = Math.round(total * 100 / META);
    TYJ.final(contenedor, { titulo: total >= META ? '¡Meta perfecta!' : 'Nivel: ' + nivel, puntos: total, nivel: null,
      detalles: ['Has recorrido el ' + pct + ' % de la pista (' + U.miles(total) + ' de ' + U.miles(META) + ' puntos)'], textoRepetir: 'Jugar otra vez', alRepetir: empezar,
      compartir: 'Una entre un millón · ' + U.miles(total) + ' de ' + U.miles(META) + ' puntos (' + pct + ' % de la pista) · Nivel ' + nivel });
    contenedor.insertBefore(estado.pista.nodo, contenedor.firstChild);
    contenedor.lastChild.appendChild(lista);
    contenedor.lastChild.appendChild(tabla);
    var s = h('div'); raiz.appendChild(s); sesion.montar(s);
  }

  function arrancar() {
    TYJ.datos('una-entre-un-millon/preguntas.json').then(function (json) { banco = json; inicio(); })
      .catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();

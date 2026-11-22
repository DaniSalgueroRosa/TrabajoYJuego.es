/* PIEZAS COMUNES DE LOS JUEGOS: crear elementos, cargar datos, temporizador, estadísticas de la sesión, pantalla final y compartir.
   Todo cuelga de window.TYJ. IMPORTANTE: nada de esto guarda datos del jugador. Las estadísticas viven en variables de la página y
   desaparecen al recargarla; no se usa localStorage, sessionStorage, IndexedDB ni cookies (lo comprueba python3 sitio.py probar). */
(function (global) {
  'use strict';
  var TYJ = global.TYJ = global.TYJ || {};
  var doc = global.document;
  if (!doc) return;                                                                // (en las pruebas sin navegador solo hay utilidades)

  /* Dirección de la raíz del sitio, calculada a partir de la de este script (assets/js/juegos.js). Así los datos se encuentran
     aunque la página se abra con o sin barra final y aunque el sitio esté en una subcarpeta. */
  var origen = doc.currentScript && doc.currentScript.src;
  TYJ.raiz = origen ? new URL('../../', origen).href : '/';
  TYJ.url = function (ruta) { return new URL(ruta, TYJ.raiz).href; };
  TYJ.datos = function (ruta) { return TYJ.cargar(TYJ.url('juegos/' + ruta)); };   // TYJ.datos('datos/palabras.json'), TYJ.datos('mi-juego/preguntas.json')

  TYJ.$ = function (selector, dentro) { return (dentro || doc).querySelector(selector); };
  TYJ.$$ = function (selector, dentro) { return Array.prototype.slice.call((dentro || doc).querySelectorAll(selector)); };
  TYJ.vaciar = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  /* h('button', { class: 'boton-retro', type: 'button', onclick: fn }, 'Texto', [otros hijos]) crea un elemento. */
  function anadir(el, hijo) {
    if (hijo == null || hijo === false) return;
    if (Array.isArray(hijo)) { hijo.forEach(function (x) { anadir(el, x); }); return; }
    el.appendChild(typeof hijo === 'object' ? hijo : doc.createTextNode(String(hijo)));
  }
  TYJ.h = function (etiqueta, atributos) {
    var el = doc.createElement(etiqueta);
    Object.keys(atributos || {}).forEach(function (k) {
      var v = atributos[k];
      if (v === false || v == null) return;
      if (k === 'texto') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;   /* por el CSSOM, no con setAttribute: la política de contenido (CSP) del sitio no admite estilos en línea */
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) anadir(el, arguments[i]);
    return el;
  };

  /* ---- Datos: los JSON de cada juego (y juegos/datos/) se piden al cargar la página; no se guarda nada */
  TYJ.cargar = function (url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('No se pudo leer ' + url + ' (error ' + r.status + ')');
      return r.json();
    });
  };
  TYJ.errorDeCarga = function (contenedor, reintentar) {
    TYJ.vaciar(contenedor).appendChild(TYJ.h('div', { class: 'final', role: 'alert' },
      TYJ.h('h3', { class: 'final-titulo', texto: 'No se ha podido cargar el juego' }),
      TYJ.h('p', { class: 'texto', texto: 'Revisa tu conexión e inténtalo de nuevo. Si sigue fallando, recarga la página.' }),
      reintentar ? TYJ.h('button', { class: 'boton-retro', type: 'button', onclick: reintentar }, 'Reintentar') : null));
  };

  /* ---- Avisos para lectores de pantalla (los resultados importantes se anuncian sin mover el foco) */
  TYJ.anunciar = function (texto) {
    var zona = doc.getElementById('tyj-anuncios');
    if (!zona) {
      zona = TYJ.h('div', { id: 'tyj-anuncios', class: 'solo-lectores', role: 'status', 'aria-live': 'polite' });
      doc.body.appendChild(zona);
    }
    zona.textContent = '';
    setTimeout(function () { zona.textContent = texto; }, 30);
  };

  /* ---- Temporizador: cuenta atrás basada en el reloj (no se desajusta aunque la pestaña vaya lenta) */
  TYJ.Temporizador = function (opciones) {
    var t = this, fin = 0, id = null;
    t.segundos = opciones.segundos;
    t.restante = opciones.segundos;
    function detener() { if (id) { clearInterval(id); id = null; } }
    function paso() {
      var r = (fin - global.performance.now()) / 1000;
      if (r <= 0) { t.restante = 0; detener(); if (opciones.alTick) opciones.alTick(0, t); if (opciones.alFin) opciones.alFin(t); return; }
      t.restante = r;
      if (opciones.alTick) opciones.alTick(r, t);
    }
    t.iniciar = function (segundos) {
      detener();
      if (segundos != null) t.segundos = segundos;
      t.restante = t.segundos;
      fin = global.performance.now() + t.segundos * 1000;
      id = setInterval(paso, 100);
      if (opciones.alTick) opciones.alTick(t.restante, t);
    };
    t.parar = function () { var r = t.restante; detener(); return r; };
    t.sumar = function (segundos) { fin += segundos * 1000; };
    t.corriendo = function () { return id !== null; };
  };
  /* Barra de tiempo: se vacía a saltos de un 5 %. Devuelve una función que se llama con la fracción restante (0 a 1). */
  TYJ.barraDeTiempo = function () {
    var relleno = TYJ.h('div', { class: 'barra-relleno' });
    var barra = TYJ.h('div', { class: 'barra', role: 'progressbar', 'aria-label': 'Tiempo restante', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '100' }, relleno);
    function actualizar(fraccion) {
      var f = Math.max(0, Math.min(1, fraccion)), paso = Math.ceil(f * 20) / 20;
      relleno.style.transform = 'scaleX(' + paso + ')';
      relleno.classList.toggle('barra-relleno--alerta', f <= 0.25);
      barra.setAttribute('aria-valuenow', String(Math.round(f * 100)));
    }
    return { nodo: barra, poner: actualizar };
  };

  /* ---- Marcadores: <div class="hud"> con datos que se actualizan por nombre */
  TYJ.hud = function (definicion) {          // definicion: [['puntos', 'Puntos', '0'], …]
    var valores = {}, nodo = TYJ.h('div', { class: 'hud' });
    definicion.forEach(function (d) {
      var v = TYJ.h('span', { class: 'hud-valor', texto: d[2] == null ? '0' : String(d[2]) });
      valores[d[0]] = v;
      nodo.appendChild(TYJ.h('p', { class: 'hud-dato' }, TYJ.h('span', { class: 'hud-etiqueta', texto: d[1] }), v));
    });
    return {
      nodo: nodo,
      poner: function (clave, valor, alerta) { valores[clave].textContent = String(valor); valores[clave].classList.toggle('hud-valor--alerta', !!alerta); }
    };
  };

  /* ---- Estadísticas de la sesión actual: partidas, mejor puntuación y racha. Solo en memoria. */
  TYJ.Sesion = function (nodo, opciones) {
    var o = opciones || {}, s = { partidas: 0, mejor: 0, racha: 0, mejorRacha: 0, victorias: 0 }, actual = nodo;
    function pintar() {
      if (!actual) return;
      TYJ.vaciar(actual);
      actual.classList.add('sesion');
      actual.appendChild(TYJ.h('span', {}, 'Partidas: ', TYJ.h('b', { texto: String(s.partidas) })));
      if (o.victorias) actual.appendChild(TYJ.h('span', {}, 'Ganadas: ', TYJ.h('b', { texto: String(s.victorias) })));
      if (o.mejor !== false) actual.appendChild(TYJ.h('span', {}, o.etiquetaMejor || 'Mejor: ', TYJ.h('b', { texto: s.partidas ? TYJ.util.miles(s.mejor) : '–' })));
      if (o.racha) actual.appendChild(TYJ.h('span', {}, 'Racha: ', TYJ.h('b', { texto: String(s.racha) })));
      actual.appendChild(TYJ.h('span', { class: 'sesion-nota', texto: 'Estas cifras solo cuentan mientras no recargues ni cierres la página.' }));
    }
    pintar();
    return {
      datos: s,
      montar: function (otro) { actual = otro; pintar(); },        // vuelve a dibujar las cifras en otro nodo (cuando cambia la pantalla)
      registrar: function (puntos, ganada) {
        s.partidas++;
        if (puntos > s.mejor) s.mejor = puntos;
        if (ganada === true) { s.victorias++; s.racha++; if (s.racha > s.mejorRacha) s.mejorRacha = s.racha; }
        else if (ganada === false) s.racha = 0;
        pintar();
      }
    };
  };

  /* ---- Compartir: hoja de compartir en el móvil, portapapeles en el ordenador y, si no, un cuadro para copiar a mano */
  TYJ.compartir = function (texto, estado) {
    var completo = texto + '\n' + String(global.location.href).split('#')[0];
    function aviso(t) { if (estado) estado.textContent = t; TYJ.anunciar(t); }
    function manual() {
      if (!estado) return;
      var caja = TYJ.h('textarea', { readonly: true, rows: '4', 'aria-label': 'Resultado para copiar', class: 'compartir-texto' });
      caja.value = completo;
      estado.textContent = 'Selecciona el texto y cópialo:';
      estado.appendChild(caja);
      caja.focus(); caja.select();
    }
    var movil = /Mobi|Android|iPhone|iPad/i.test(global.navigator.userAgent);
    if (movil && global.navigator.share) {
      global.navigator.share({ text: completo }).catch(function (e) { if (e && e.name !== 'AbortError') manual(); });
    } else if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
      global.navigator.clipboard.writeText(completo).then(function () { aviso('Resultado copiado. Pégalo donde quieras.'); }, manual);
    } else manual();
  };

  /* ---- Interfaz de progreso 1: PISTA DE CARRERA. Un coche de píxeles avanza por una pista hasta la bandera de meta.
     TYJ.carrera({ meta: 700, unidad: 'puntos', hitos: 7, etiqueta: '…' }) devuelve { nodo, poner(valor, hitosHechos) }.
     «hitos» son las marcas del camino (una por pregunta, por ejemplo): se encienden al pasarlas. Solo dibuja; no guarda nada. */
  var SVG = 'http://www.w3.org/2000/svg';
  function pixel(svg, x, y, w, hh, clase) {
    var r = doc.createElementNS(SVG, 'rect');
    r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', hh);
    if (clase) r.setAttribute('class', clase);
    svg.appendChild(r);
  }
  function cocheDePixeles() {
    var s = doc.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', '0 0 20 10'); s.setAttribute('class', 'pista-coche-dibujo'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    s.setAttribute('shape-rendering', 'crispEdges');
    pixel(s, 1, 4, 18, 3, 'pc-cuerpo'); pixel(s, 5, 2, 9, 2, 'pc-cuerpo'); pixel(s, 6, 2.5, 3, 1.5, 'pc-cristal'); pixel(s, 10, 2.5, 3, 1.5, 'pc-cristal');
    pixel(s, 17, 4.5, 2, 1, 'pc-faro'); pixel(s, 2.5, 7, 4, 3, 'pc-rueda'); pixel(s, 13.5, 7, 4, 3, 'pc-rueda');
    return s;
  }
  TYJ.carrera = function (o) {
    var meta = o.meta, hitos = o.hitos || 0, unidad = o.unidad || 'puntos', metaActual = meta;
    var coche = TYJ.h('div', { class: 'pista-coche' }, cocheDePixeles());
    var bandera = TYJ.h('span', { class: 'pista-meta', 'aria-hidden': 'true' });
    var marcas = [], carril = TYJ.h('div', { class: 'pista-carril' });
    for (var i = 1; i < hitos; i++) {
      var m = TYJ.h('span', { class: 'pista-hito', 'aria-hidden': 'true' });
      m.style.setProperty('--h', String(i / hitos));
      marcas.push(m); carril.appendChild(m);
    }
    carril.appendChild(bandera); carril.appendChild(coche);
    var lectura = TYJ.h('p', { class: 'pista-lectura' }), etiquetaMeta = TYJ.h('span', { texto: 'Meta: ' + TYJ.util.miles(meta) });
    var nodo = TYJ.h('div', { class: 'pista' + (o.rapida ? ' pista--rapida' : ''), role: 'progressbar', 'aria-label': o.etiqueta || 'Progreso de la carrera', 'aria-valuemin': '0', 'aria-valuemax': String(meta), 'aria-valuenow': '0' },
      carril, TYJ.h('div', { class: 'pista-pie' }, TYJ.h('span', { texto: 'Salida' }), lectura, etiquetaMeta));
    function poner(valor, hechos) {
      var v = Math.max(0, Math.min(metaActual, valor)), pct = Math.round(v * 100 / metaActual);
      nodo.style.setProperty('--p', String(v / metaActual));
      nodo.setAttribute('aria-valuenow', String(v));
      nodo.setAttribute('aria-valuemax', String(metaActual));
      nodo.setAttribute('aria-valuetext', o.lectura ? o.lectura(v, pct) : TYJ.util.miles(v) + ' de ' + TYJ.util.miles(metaActual) + ' ' + unidad + ' (' + pct + ' %)');
      lectura.textContent = o.lectura ? o.lectura(v, pct) : (v >= metaActual ? '¡Meta! 100 %' : TYJ.util.miles(v) + ' ' + unidad + ' · ' + pct + ' %');
      nodo.classList.toggle('pista--meta', v >= metaActual && !o.rapida);
      if (hechos != null) marcas.forEach(function (m, k) { m.classList.toggle('pista-hito--hecho', k < hechos); });
    }
    poner(0, 0);
    /* nuevaMeta(n): el coche vuelve a la salida SIN recorrer la pista hacia atrás (cada vuelta puede tener otra longitud) */
    function nuevaMeta(n, txt) {
      metaActual = n; if (txt) etiquetaMeta.textContent = txt;
      nodo.classList.add('pista--sin-viaje'); poner(0);
      void nodo.offsetWidth; nodo.classList.remove('pista--sin-viaje');
    }
    return { nodo: nodo, poner: poner, nuevaMeta: nuevaMeta };
  };

  /* ---- Interfaz de progreso 2: RUTA DE RONDAS. Una casilla por ronda: pendiente, actual, acertada o fallada.
     TYJ.etapas(total, historial) con historial = [true, false, …] devuelve { nodo, marcar(indice, acierto) }; la casilla actual es la siguiente al historial. */
  TYJ.etapas = function (total, historial) {
    var casillas = [], nodo = TYJ.h('ol', { class: 'etapas', 'aria-label': 'Ruta de rondas' });
    historial = historial || [];
    for (var i = 0; i < total; i++) {
      var c = TYJ.h('li', { class: 'etapa', texto: String(i + 1) });
      casillas.push(c); nodo.appendChild(c);
    }
    function pintar(i) {
      var c = casillas[i]; if (!c) return;
      var est = i < historial.length ? (historial[i] ? 'ok' : 'mal') : (i === historial.length ? 'actual' : 'pendiente');
      c.className = 'etapa etapa--' + est;
      c.setAttribute('aria-label', 'Ronda ' + (i + 1) + ': ' + { ok: 'acertada', mal: 'fallada', actual: 'en curso', pendiente: 'pendiente' }[est]);
      if (est === 'actual') c.setAttribute('aria-current', 'step'); else c.removeAttribute('aria-current');
    }
    for (var k = 0; k < total; k++) pintar(k);
    return {
      nodo: nodo,
      marcar: function (i, acierto) { historial[i] = !!acierto; historial.length = Math.max(historial.length, i + 1); for (var j = 0; j < total; j++) pintar(j); }
    };
  };

  /* ---- Pantalla final. Opciones: titulo, puntos, unidad, nivel, detalles[], compartir (texto), alRepetir, textoRepetir.
     Devuelve el contenedor; el foco pasa al título para que los lectores de pantalla lean el resultado. */
  TYJ.final = function (contenedor, o) {
    var estado = TYJ.h('p', { class: 'final-estado', role: 'status' });
    var botones = TYJ.h('div', { class: 'final-botones' },
      TYJ.h('button', { class: 'boton-retro', type: 'button', onclick: function () { if (o.alRepetir) o.alRepetir(); } }, o.textoRepetir || 'Jugar otra vez'));
    if (o.compartir) {
      botones.appendChild(TYJ.h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: function () { TYJ.compartir(o.compartir, estado); } }, 'Compartir resultado'));
    }
    var titulo = TYJ.h('h3', { class: 'final-titulo', tabindex: '-1', texto: o.titulo || 'Partida terminada' });
    var nodo = TYJ.h('div', { class: 'final' }, titulo,
      o.puntos != null ? TYJ.h('p', { class: 'final-puntos' }, TYJ.util.miles(o.puntos), TYJ.h('small', { texto: o.unidad || 'puntos' })) : null,
      o.nivel ? TYJ.h('p', { class: 'final-nivel', texto: o.nivel }) : null,
      o.detalles && o.detalles.length ? TYJ.h('ul', { class: 'final-detalles' }, o.detalles.map(function (d) { return TYJ.h('li', { texto: d }); })) : null,
      botones, estado);
    TYJ.vaciar(contenedor).appendChild(nodo);
    titulo.focus({ preventScroll: false });
    TYJ.anunciar((o.titulo || 'Partida terminada') + (o.puntos != null ? '. ' + TYJ.util.miles(o.puntos) + ' ' + (o.unidad || 'puntos') + '.' : ''));
    return nodo;
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ===== juegos/juegos.js ===== */
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

;
/* ===== juegos/rondas.js ===== */
/* MOTOR DE RONDAS: la base de los juegos de preguntas y respuestas (cultura general, intruso, acertijos de una palabra, mates, patrones…).
   Un juego solo tiene que decir cuántas rondas hay, cuánto tiempo se da y cómo se genera la siguiente ronda; el motor dibuja el marcador,
   la barra de tiempo, las respuestas, el aviso de acierto o fallo, la pantalla final y las estadísticas de la sesión (en memoria).

   TYJ.Rondas(raiz, config).iniciar()
   config: {
     titulo, intro,                 // pantalla de inicio
     textoEmpezar,                  // 'Empezar'
     rondas: 10,                    // 0 = sin límite (acaba por vidas o por tiempo)
     segundos: 20,                  // tiempo por ronda (0 = sin límite)
     tiempoTotal: 0,                // segundos para toda la partida (sustituye al tiempo por ronda)
     vidas: 0,                      // fallos permitidos antes de terminar (0 = no cuentan)
     auto: false,                   // true = pasa solo a la siguiente ronda tras responder
     ruta: false,                   // true (con rondas fijas) = dibuja la ruta de rondas (una casilla por ronda: acertada, fallada, en curso)
     pausas: [450, 1400],           // milisegundos de pausa tras un acierto y tras un fallo cuando auto es true
     alIniciar: function () {},     // se llama al empezar cada partida (para barajar datos)
     siguiente: function (n, est) { return ronda; },
     puntuar: function (ronda, acierto, restante, est) { return puntos; },   // opcional
     niveles: [[0, 'Novato'], …],   // opcional
     unidad: 'puntos',
     compartir: function (est, nivel) { return 'texto'; },
     detalleFinal: function (est) { return ['línea', …]; }                   // opcional
   }
   ronda: { enunciado, cuerpo (nodo opcional), opciones: ['a', 'b'], correcta: 0 (o un array de índices válidos),
            // o bien, para respuesta escrita:  aceptadas: ['perro'], numero: 42, placeholder: '…'
            // (con exacta: true la respuesta escrita debe coincidir letra por letra, sin perdonar erratas)
            explicacion, puntosBase (100 por defecto; el juego puede bajarlo mientras la ronda está abierta), etiqueta (para el repaso) }
   est: { n, puntos, aciertos, fallos, racha, mejorRacha, vidas, detalle[] }  */
(function (global) {
  'use strict';
  var TYJ = global.TYJ = global.TYJ || {};
  if (!global.document) return;

  TYJ.Rondas = function (raiz, cfg) {
    var U = TYJ.util, h = TYJ.h;
    var est, temporizador = null, global_ = null, cerrada = true, alTecla = null;
    var sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ', victorias: false });

    function quitarTecla() { if (alTecla) { document.removeEventListener('keydown', alTecla); alTecla = null; } }
    function parar() { quitarTecla(); if (temporizador) temporizador.parar(); if (global_) global_.parar(); }

    /* ---- Inicio */
    function iniciar() {
      parar();
      TYJ.vaciar(raiz);
      raiz.appendChild(h('h2', { texto: cfg.titulo }));
      raiz.appendChild(h('p', { class: 'texto', texto: cfg.intro }));
      var b = h('button', { class: 'boton-retro', type: 'button', onclick: empezar }, cfg.textoEmpezar || 'Empezar');
      raiz.appendChild(h('div', { class: 'fila' }, b));
      var s = h('div'); raiz.appendChild(s); sesion.montar(s);
    }

    function empezar() {
      est = { n: 0, puntos: 0, aciertos: 0, fallos: 0, racha: 0, mejorRacha: 0, vidas: cfg.vidas || 0, detalle: [], terminada: false };
      if (cfg.alIniciar) cfg.alIniciar(est);
      global_ = null;
      if (cfg.tiempoTotal) {
        global_ = new TYJ.Temporizador({ segundos: cfg.tiempoTotal, alTick: function (r) { if (est && est.hud) { est.hud.poner('tiempo', Math.ceil(r), r <= 10); if (est.barra) est.barra.poner(r / cfg.tiempoTotal); } }, alFin: function () { if (!est.terminada) final(); } });
        est.globalArrancado = false;
      }
      ronda();
    }

    /* ---- Una ronda */
    function ronda() {
      quitarTecla();
      var r = cfg.siguiente(est.n, est);
      est.n++;
      cerrada = false;
      r.puntosBase = r.puntosBase == null ? 100 : r.puntosBase;
      var hud = TYJ.hud([].concat(
        cfg.rondas ? [['n', 'Ronda', est.n + ' / ' + cfg.rondas]] : [['n', 'Ronda', est.n]],
        cfg.tiempoTotal ? [['tiempo', 'Tiempo', Math.ceil(global_ ? global_.restante : cfg.tiempoTotal)]] : [],
        [['pts', 'Puntos', U.miles(est.puntos)], ['racha', 'Racha', est.racha]],
        cfg.vidas ? [['vidas', 'Vidas', est.vidas]] : []));
      est.hud = hud;
      var barra = TYJ.barraDeTiempo(), segundos = h('span', { class: 'rondas-segundos', 'aria-hidden': 'true' });
      est.barra = cfg.tiempoTotal ? barra : null;
      if (cfg.tiempoTotal) barra.poner(global_.restante / cfg.tiempoTotal);
      var zona = h('div', { role: 'status', 'aria-live': 'polite' });
      var cuerpo = h('div', { class: 'rondas-cuerpo' });
      TYJ.vaciar(raiz);
      raiz.appendChild(hud.nodo);
      var ruta = null;
      if (cfg.ruta && cfg.rondas) { ruta = TYJ.etapas(cfg.rondas, est.detalle.map(function (d) { return d.acierto; })); raiz.appendChild(ruta.nodo); }
      if (cfg.segundos || cfg.tiempoTotal) raiz.appendChild(h('div', { class: 'rondas-tiempo' }, barra.nodo, cfg.segundos ? segundos : null));
      raiz.appendChild(h('h2', { class: 'rondas-enunciado', tabindex: '-1', texto: r.enunciado }));
      if (r.cuerpo) raiz.appendChild(r.cuerpo);
      raiz.appendChild(cuerpo);
      raiz.appendChild(zona);

      if (cfg.segundos) {
        temporizador = new TYJ.Temporizador({ segundos: cfg.segundos,
          alTick: function (t) { barra.poner(t / cfg.segundos); segundos.textContent = String(Math.ceil(t)); segundos.classList.toggle('rondas-segundos--alerta', t <= 5); },
          alFin: function () { responder(null); } });
        temporizador.iniciar();
      }
      if (global_ && !est.globalArrancado) { est.globalArrancado = true; global_.iniciar(); }

      var botones = [], entrada = null;
      if (r.opciones) {
        var lista = h('div', { class: 'opciones opciones--' + (r.opciones.length <= 2 ? '2' : 'n') });
        r.opciones.forEach(function (texto, i) {
          var b = h('button', { class: 'opcion', type: 'button', 'aria-keyshortcuts': String(i + 1), onclick: function () { responder(i); } }, h('span', { class: 'opcion-tecla', 'aria-hidden': 'true', texto: (i + 1) + ' ' }), texto);
          botones.push(b); lista.appendChild(b);
        });
        cuerpo.appendChild(lista);
        alTecla = function (e) {
          if (e.ctrlKey || e.metaKey || e.altKey || cerrada) return;
          var i = parseInt(e.key, 10) - 1;
          if (i >= 0 && i < botones.length) { e.preventDefault(); responder(i); }
        };
        document.addEventListener('keydown', alTecla);
      } else {
        entrada = h('input', { id: 'rondas-respuesta', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: '60', placeholder: r.placeholder || 'Escribe tu respuesta', inputmode: r.numero != null ? 'decimal' : 'text' });
        var enviar = h('button', { class: 'boton-retro', type: 'submit' }, 'Responder');
        var form = h('form', { class: 'rondas-form', novalidate: true }, h('div', { class: 'fila' },
          h('div', { class: 'campo-retro' }, h('label', { for: 'rondas-respuesta', texto: 'Tu respuesta' }), entrada), enviar));
        form.addEventListener('submit', function (e) { e.preventDefault(); if (!entrada.value.trim()) { entrada.focus(); return; } responder(entrada.value); });
        cuerpo.appendChild(form);
        entrada.focus();
      }

      function esAcierto(resp) {
        if (resp == null) return false;
        if (r.opciones) return Array.isArray(r.correcta) ? r.correcta.indexOf(resp) >= 0 : resp === r.correcta;
        if (r.numero != null) { var v = parseFloat(String(resp).replace(',', '.')); return !isNaN(v) && Math.abs(v - r.numero) < 1e-9; }
        if (r.exacta) return r.aceptadas.some(function (x) { return U.clave(x) === U.clave(resp); });   // sin perdonar erratas (anagramas)
        return U.coincide(resp, r.aceptadas);
      }
      function textoCorrecta() {
        if (r.opciones) return (Array.isArray(r.correcta) ? r.correcta : [r.correcta]).map(function (i) { return r.opciones[i]; }).join(' / ');
        return r.numero != null ? String(r.numero).replace('.', ',') : r.aceptadas[0];
      }

      function responder(resp) {
        if (cerrada || est.terminada) return;
        cerrada = true; quitarTecla();
        var restante = temporizador ? temporizador.parar() : 0;
        var acierto = esAcierto(resp), pts = 0;
        if (acierto) {
          pts = cfg.puntuar ? cfg.puntuar(r, true, restante, est) :
            Math.round(r.puntosBase + (cfg.segundos ? r.puntosBase * 0.5 * restante / cfg.segundos : 0) + Math.min(est.racha, 5) * 10);
          est.aciertos++; est.racha++; est.mejorRacha = Math.max(est.mejorRacha, est.racha); est.puntos += pts;
        } else {
          est.fallos++; est.racha = 0; if (cfg.vidas) est.vidas--;
        }
        est.detalle.push({ etiqueta: r.etiqueta || r.enunciado, correcta: textoCorrecta(), acierto: acierto, explicacion: r.explicacion || '' });
        if (ruta) ruta.marcar(est.n - 1, acierto);
        hud.poner('pts', U.miles(est.puntos)); hud.poner('racha', est.racha); if (cfg.vidas) hud.poner('vidas', est.vidas, est.vidas <= 1);
        if (r.opciones) botones.forEach(function (b, i) {
          b.disabled = true;
          var buena = Array.isArray(r.correcta) ? r.correcta.indexOf(i) >= 0 : r.correcta === i;
          if (buena) b.classList.add('ok'); else if (i === resp) b.classList.add('mal');
        });
        else { entrada.disabled = true; TYJ.$('button[type=submit]', cuerpo).disabled = true; }

        var terminaPartida = (cfg.rondas && est.n >= cfg.rondas) || (cfg.vidas && est.vidas <= 0);
        var titulo = acierto ? '¡Correcto! +' + pts : (resp == null ? 'Se acabó el tiempo.' : 'Fallo.') + ' Era: ' + textoCorrecta();
        var siguiente = h('button', { class: 'boton-retro', type: 'button', onclick: function () { if (terminaPartida) final(); else ronda(); } }, terminaPartida ? 'Ver resultado' : 'Siguiente');
        var caja = h('div', { class: 'rondas-aviso' + (acierto ? ' rondas-aviso--ok' : '') },
          h('p', { class: 'mensaje ' + (acierto ? 'mensaje--ok' : 'mensaje--mal'), texto: titulo }),
          r.explicacion ? h('p', { class: 'texto-suave', texto: r.explicacion }) : null,
          cfg.auto ? null : h('div', { class: 'fila' }, siguiente));
        TYJ.vaciar(zona).appendChild(caja);
        TYJ.anunciar(titulo);
        if (cfg.auto) setTimeout(function () { if (est.terminada) return; if (terminaPartida) final(); else ronda(); }, (cfg.pausas || [450, 1400])[acierto ? 0 : 1]);
        else siguiente.focus();
      }
    }

    /* ---- Final */
    function final() {
      if (est.terminada) return;
      est.terminada = true; parar();
      var nivel = cfg.niveles ? U.nivel(est.puntos, cfg.niveles) : null;
      sesion.registrar(est.puntos);
      var detalles = [est.aciertos + ' aciertos de ' + (est.aciertos + est.fallos) + ' respuestas', 'Mejor racha: ' + est.mejorRacha];
      if (cfg.detalleFinal) detalles = detalles.concat(cfg.detalleFinal(est));
      var contenedor = h('div');
      TYJ.vaciar(raiz).appendChild(contenedor);
      TYJ.final(contenedor, { titulo: nivel ? 'Nivel: ' + nivel : 'Partida terminada', puntos: est.puntos, unidad: cfg.unidad || 'puntos', detalles: detalles,
        compartir: cfg.compartir ? cfg.compartir(est, nivel) : null, textoRepetir: 'Jugar otra vez', alRepetir: empezar });
      var fallos = est.detalle.filter(function (d) { return !d.acierto; });
      if (fallos.length) {
        contenedor.firstChild.appendChild(h('details', { class: 'rondas-repaso' }, h('summary', { texto: 'Repasa lo que has fallado (' + fallos.length + ')' }),
          h('ul', {}, fallos.map(function (d) {
            return h('li', {}, h('strong', { texto: d.etiqueta }), ' → ', d.correcta, d.explicacion ? h('span', { class: 'texto-suave', texto: ' · ' + d.explicacion }) : null);
          }))));
      }
      var s = h('div'); raiz.appendChild(s); sesion.montar(s);
    }

    return { iniciar: iniciar, sesion: sesion };
  };
})(typeof window !== 'undefined' ? window : globalThis);

;
/* ===== juegos/utilidades.js ===== */
/* UTILIDADES COMUNES DE LOS JUEGOS (sin tocar la página: solo funciones puras que se pueden probar aparte).
   Todo cuelga de window.TYJ.util. Este archivo y juegos.js se suman en assets/js/juegos.js y se cargan antes del app.js de cada juego. */
(function (global) {
  'use strict';
  var TYJ = global.TYJ = global.TYJ || {};
  var U = TYJ.util = {};

  /* ---- Azar */
  U.azar = function (n) { return Math.floor(Math.random() * n); };                 // entero de 0 a n-1
  U.entre = function (a, b) { return a + U.azar(b - a + 1); };                     // entero de a a b, ambos incluidos
  U.elegir = function (lista) { return lista[U.azar(lista.length)]; };
  U.barajar = function (lista) {                                                   // Fisher-Yates, no modifica la original
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = U.azar(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  U.muestra = function (lista, n) { return U.barajar(lista).slice(0, n); };

  /* ---- Azar con semilla y RETO DEL DÍA: el mismo reto para todos los jugadores el mismo día (fecha de Madrid), sin guardar nada.
     U.semilla(n) devuelve una función que se usa como Math.random pero repite siempre la misma serie para la misma semilla n. */
  U.semilla = function (n) {                                                       // mulberry32
    var a = (n >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.barajarCon = function (rnd, lista) {                                           // como barajar, pero con el azar que se le pase
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  /* U.retoDelDia('clave-del-juego') → { numero (el 1 fue el 22 de noviembre de 2026), semilla, restante (segundos hasta la medianoche de Madrid) } */
  U.retoDelDia = function (clave, ahora) {
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(ahora || new Date()).forEach(function (x) { p[x.type] = parseInt(x.value, 10); });
    var dia = Math.floor(Date.UTC(p.year, p.month - 1, p.day) / 86400000), h = 17;
    for (var i = 0; i < clave.length; i++) h = (Math.imul(h, 31) + clave.charCodeAt(i)) >>> 0;
    return { numero: Math.max(1, dia - 20779 + 1), semilla: (Math.imul(dia, 2654435761) ^ h) >>> 0, restante: 86400 - (p.hour * 3600 + p.minute * 60 + p.second) };
  };
  U.reloj = function (segundos) {                                                  // 3725 → «1:02:05»
    var s = Math.max(0, Math.floor(segundos)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h + ':' + ('0' + m).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
  };

  /* ---- Texto: minúsculas y sin acentos, conservando la ñ (en Wordle «ñ» es otra letra, «á» es «a») */
  U.norm = function (t) {
    return String(t).toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ').trim();
  };
  /* Clave para comparar respuestas escritas: sin acentos, sin ñ, sin signos y con un solo espacio entre palabras */
  U.clave = function (t) {
    return U.norm(t).replace(/ñ/g, 'n').replace(/[^a-z0-9]+/g, ' ').trim();
  };
  U.letras = function (t) { return Array.from(U.norm(t).replace(/\s+/g, '')); };
  U.distancia = function (a, b) {                                                  // distancia de Levenshtein
    if (a === b) return 0;
    var prev = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      var cur = [i];
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  };
  /* ¿«texto» es una de las respuestas aceptadas? Perdona una errata en palabras de 5 letras o más (dos a partir de 10). */
  U.coincide = function (texto, aceptadas) {
    var t = U.clave(texto);
    if (!t) return false;
    return aceptadas.some(function (a) {
      var c = U.clave(a);
      if (t === c) return true;
      var tolerancia = c.length >= 10 ? 2 : (c.length >= 5 ? 1 : 0);
      return tolerancia > 0 && Math.abs(t.length - c.length) <= tolerancia && U.distancia(t, c) <= tolerancia;
    });
  };

  /* ---- Wordle: «ok» letra bien colocada, «hay» está en otro sitio, «no» no está. Cuenta bien las letras repetidas. */
  U.evaluarPalabra = function (intento, secreta) {
    var a = U.letras(intento), s = U.letras(secreta), res = [], restantes = {}, i;
    for (i = 0; i < s.length; i++) {
      if (a[i] === s[i]) res[i] = 'ok';
      else { res[i] = 'no'; restantes[s[i]] = (restantes[s[i]] || 0) + 1; }
    }
    for (i = 0; i < a.length; i++) {
      if (res[i] !== 'ok' && restantes[a[i]] > 0) { res[i] = 'hay'; restantes[a[i]]--; }
    }
    return res;
  };

  /* ---- Números y tiempo */
  U.miles = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  U.tiempo = function (segundos) { var s = Math.max(0, Math.ceil(segundos)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
  U.limitar = function (n, min, max) { return Math.max(min, Math.min(max, n)); };
  U.diaDelAnio = function (fecha) {                                                // número de día (igual para todos en el mismo día local)
    var f = fecha || new Date();
    return Math.floor((Date.UTC(f.getFullYear(), f.getMonth(), f.getDate()) - Date.UTC(1970, 0, 1)) / 86400000);
  };
  U.nivel = function (puntos, tabla) {                                             // tabla: [[minimo, 'Nombre'], …] de menor a mayor
    var nombre = tabla[0][1];
    tabla.forEach(function (fila) { if (puntos >= fila[0]) nombre = fila[1]; });
    return nombre;
  };
  U.haversine = function (lat1, lon1, lat2, lon2) {                                // distancia en km entre dos puntos de la Tierra
    var r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 12742 * Math.asin(Math.min(1, Math.sqrt(a)));
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ===== tests/base.js ===== */
/* PIEZAS COMUNES DE LOS TESTS: crear elementos, estadística, chips, cifras en vivo, barras, resultado con «copiar», audio y el motor de
   cronometraje de pulsaciones (TT.ritmo) que usan los tests de clics, teclado, scroll y APM. Todo cuelga de window.TT.
   IMPORTANTE: nada de esto guarda datos del usuario. Los resultados viven en variables de la página y desaparecen al recargarla; no se usa
   localStorage, sessionStorage, IndexedDB ni cookies (lo comprueba python3 sitio.py probar) y no se hace ninguna petición de red. */
(function (global) {
  'use strict';
  var TT = global.TT = global.TT || {};
  var doc = global.document;

  /* ---------- estadística y utilidades (sin navegador, para poder probarlas) ---------- */
  TT.suma = function (a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; };
  TT.media = function (a) { return a.length ? TT.suma(a) / a.length : 0; };
  TT.mediana = function (a) {
    if (!a.length) return 0;
    var b = a.slice().sort(function (x, y) { return x - y; }), m = b.length >> 1;
    return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
  };
  TT.desviacion = function (a) {                                    // desviación típica de la población
    if (a.length < 2) return 0;
    var m = TT.media(a), s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    return Math.sqrt(s / a.length);
  };
  TT.percentil = function (a, p) {
    if (!a.length) return 0;
    var b = a.slice().sort(function (x, y) { return x - y; }), k = (b.length - 1) * p, f = Math.floor(k), c = Math.min(f + 1, b.length - 1);
    return b[f] + (b[c] - b[f]) * (k - f);
  };
  TT.intervalos = function (tiempos) { var r = []; for (var i = 1; i < tiempos.length; i++) r.push(tiempos[i] - tiempos[i - 1]); return r; };
  /* Mayor número de pulsaciones que caben en cualquier ventana de «ancho» segundos. `tiempos` viene ordenado. */
  TT.ventanaMax = function (tiempos, ancho) {
    var mejor = 0, ini = 0;
    for (var fin = 0; fin < tiempos.length; fin++) {
      while (tiempos[fin] - tiempos[ini] >= ancho) ini++;
      mejor = Math.max(mejor, fin - ini + 1);
    }
    return mejor;
  };
  TT.fmt = function (n, d) {
    d = d == null ? 1 : d;
    if (!isFinite(n)) return '—';
    return Number(n).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });
  };
  /* tabla = [[mínimo, nombre, texto], …] ordenada de menor a mayor: devuelve la última fila cuyo mínimo no supera el valor. */
  TT.rango = function (valor, tabla) {
    var r = tabla[0];
    for (var i = 0; i < tabla.length; i++) if (valor >= tabla[i][0]) r = tabla[i];
    return { nombre: r[1], texto: r[2] || '', indice: tabla.indexOf(r) };
  };
  /* Como TT.rango, pero para cifras en las que menos es mejor: tabla = [[máximo, nombre, texto], …] de menor a mayor; devuelve la primera fila cuyo máximo supera el valor. */
  TT.rangoMax = function (valor, tabla) {
    var r = tabla[tabla.length - 1];
    for (var i = 0; i < tabla.length; i++) if (valor < tabla[i][0]) { r = tabla[i]; break; }
    return { nombre: r[1], texto: r[2] || '', indice: tabla.indexOf(r) };
  };
  TT.azar = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  TT.elegir = function (lista) { return lista[Math.floor(Math.random() * lista.length)]; };
  TT.barajar = function (lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  TT.limitar = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  TT.mayus = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };

  if (!doc) return;                                                  // (en las pruebas sin navegador solo hay utilidades)

  /* ---------- DOM ---------- */
  function anadir(el, hijo) {
    if (hijo == null || hijo === false) return;
    if (Array.isArray(hijo)) { hijo.forEach(function (x) { anadir(el, x); }); return; }
    el.appendChild(typeof hijo === 'object' ? hijo : doc.createTextNode(String(hijo)));
  }
  /* h('button', { class: 'tt-boton', type: 'button', onclick: fn }, 'Texto', [otros hijos]) */
  TT.h = function (etiqueta, atributos) {
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
  TT.$ = function (s, dentro) { return (dentro || doc).querySelector(s); };
  TT.$$ = function (s, dentro) { return Array.prototype.slice.call((dentro || doc).querySelectorAll(s)); };
  TT.vaciar = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  /* Punto de montaje de un test: el contenedor #tt-app, ya vacío (se quita el «Cargando…»). */
  TT.app = function () { var a = doc.getElementById('tt-app'); return a ? TT.vaciar(a) : null; };

  var voz = null;
  TT.anunciar = function (texto) {                                   // texto para lectores de pantalla
    if (!voz) { voz = TT.h('div', { class: 'solo-lectores', 'aria-live': 'polite', role: 'status' }); doc.body.appendChild(voz); }
    voz.textContent = '';
    global.setTimeout(function () { voz.textContent = texto; }, 30);
  };

  /* Grupo de botones tipo «radio»: opciones = [[valor, etiqueta], …] */
  TT.chips = function (opciones, inicial, alCambiar, etiqueta) {
    var caja = TT.h('div', { class: 'tt-chips', role: 'group', 'aria-label': etiqueta || 'Opciones' });
    var valor = inicial, botones = [];
    function poner(v) { valor = v; botones.forEach(function (p) { p[1].setAttribute('aria-pressed', String(p[0] === v)); }); }
    opciones.forEach(function (o) {
      var b = TT.h('button', { type: 'button', class: 'tt-chip', 'aria-pressed': String(o[0] === valor), texto: o[1] });
      b.addEventListener('click', function () { if (b.disabled || o[0] === valor) return; poner(o[0]); if (alCambiar) alCambiar(o[0]); });
      botones.push([o[0], b]);
      caja.appendChild(b);
    });
    return { nodo: caja, valor: function () { return valor; }, poner: poner, bloquear: function (s) { botones.forEach(function (p) { p[1].disabled = !!s; }); } };
  };
  TT.boton = function (texto, alClic, secundario) {
    return TT.h('button', { type: 'button', class: 'tt-boton' + (secundario ? ' tt-boton--sec' : ''), onclick: alClic, texto: texto });
  };

  /* Cifras en vivo: datos([['t','Tiempo','10,0'], …]) → { nodo, poner('t', '9,8', alerta) } */
  TT.datos = function (lista) {
    var ul = TT.h('ul', { class: 'tt-datos' }), mapa = {};
    lista.forEach(function (d) {
      var v = TT.h('span', { class: 'tt-dato-v', texto: d[2] });
      var li = TT.h('li', { class: 'tt-dato' }, v, TT.h('span', { class: 'tt-dato-e', texto: d[1] }));
      mapa[d[0]] = { li: li, v: v };
      ul.appendChild(li);
    });
    return { nodo: ul, poner: function (id, valor, alerta) { var d = mapa[id]; if (!d) return; d.v.textContent = valor; if (alerta != null) d.li.setAttribute('data-alerta', alerta ? '1' : '0'); } };
  };

  /* Barras: valores numéricos; opciones { max, formato(v), etiquetas[], pie: [izq, der] } */
  TT.barras = function (valores, o) {
    o = o || {};
    var max = o.max || Math.max.apply(null, valores.concat([1])), caja = TT.h('div', { class: 'tt-barras', role: 'img', 'aria-label': o.descripcion || 'Gráfico de barras' });
    var formato = o.formato || function (v) { return TT.fmt(v, 0); };
    valores.forEach(function (v, i) {
      var p = Math.max(2, Math.round(v / max * 100));
      var barra = TT.h('div', { class: 'tt-barra', title: (o.etiquetas ? o.etiquetas[i] + ': ' : '') + formato(v) }, TT.h('i', { style: 'height:' + p + '%' }));
      if (valores.length <= 16) barra.appendChild(TT.h('span', { style: 'bottom:' + p + '%', texto: formato(v) }));
      caja.appendChild(barra);
    });
    var todo = TT.h('div', {}, caja);
    if (o.pie) todo.appendChild(TT.h('p', { class: 'tt-barras-pie' }, TT.h('span', { texto: o.pie[0] }), TT.h('span', { texto: o.pie[1] })));
    return todo;
  };

  /* Copiar al portapapeles: devuelve una promesa con true/false (sin permiso o sin soporte → false). */
  TT.copiar = function (texto) {
    function plan2() {
      try {
        var t = TT.h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;top:0;left:0;opacity:0' });
        t.value = texto; doc.body.appendChild(t); t.select();
        var ok = doc.execCommand && doc.execCommand('copy'); doc.body.removeChild(t); return !!ok;
      } catch (e) { return false; }
    }
    if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return plan2(); });
    }
    return Promise.resolve(plan2());
  };

  /* Panel de resultado. o = { titulo, valor, unidad, rango:{nombre,texto}, extra:Node, detalles:[[etiqueta, valor]], copia, alRepetir, textoRepetir } */
  TT.resultado = function (host, o) {
    var panel = TT.h('section', { class: 'tt-res', tabindex: '-1', 'aria-label': 'Resultado' });
    if (o.titulo) panel.appendChild(TT.h('h2', { class: 'tt-res-tit', texto: o.titulo }));
    if (o.titular) panel.appendChild(TT.h('p', { class: 'tt-res-titular', texto: o.titular }));
    if (o.valor != null) panel.appendChild(TT.h('p', { class: 'tt-res-grande' }, String(o.valor), o.unidad ? TT.h('small', { texto: o.unidad }) : null));
    if (o.rango && o.rango.nombre) panel.appendChild(TT.h('p', { class: 'tt-res-rango', texto: o.rango.nombre }));
    if (o.rango && o.rango.texto) panel.appendChild(TT.h('p', { class: 'tt-res-texto', texto: o.rango.texto }));
    if (o.extra) panel.appendChild(o.extra);
    if (o.detalles && o.detalles.length) {
      var dl = TT.h('dl', { class: 'tt-tabla' });
      o.detalles.forEach(function (d) { dl.appendChild(TT.h('div', {}, TT.h('dt', { texto: d[0] }), TT.h('dd', { texto: String(d[1]) }))); });
      panel.appendChild(dl);
    }
    var fila = TT.h('div', { class: 'tt-fila' });
    if (o.alRepetir) fila.appendChild(TT.boton(o.textoRepetir || 'Repetir el test', o.alRepetir));
    if (o.copia) {
      var estado = TT.h('span', { class: 'tt-res-texto', role: 'status' });
      var bc = TT.boton('Copiar resultado', function () {
        TT.copiar(o.copia + ' ' + String(global.location.href).split('#')[0]).then(function (ok) {
          if (ok) { estado.textContent = 'Copiado al portapapeles.'; return; }
          estado.textContent = 'Tu navegador no deja copiar solo. Selecciona el texto y cópialo:';
          if (!panel.querySelector('.tt-copia')) { var ta = TT.h('textarea', { class: 'tt-copia', readonly: true, 'aria-label': 'Texto del resultado' }); ta.value = o.copia; panel.appendChild(ta); ta.focus(); ta.select(); }
        });
      }, true);
      fila.appendChild(bc); fila.appendChild(estado);
    }
    panel.appendChild(fila);
    host.appendChild(panel);
    return panel;
  };
  TT.enfocar = function (el) {
    try { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest' }); } catch (e) { /* sin foco */ }
  };

  /* ---------- audio (solo se crea tras un gesto del usuario) ---------- */
  var ctxAudio = null;
  TT.audio = function () {
    if (!ctxAudio) { var C = global.AudioContext || global.webkitAudioContext; if (C) { try { ctxAudio = new C(); } catch (e) { ctxAudio = null; } } }
    if (ctxAudio && ctxAudio.state === 'suspended') ctxAudio.resume();
    return ctxAudio;
  };
  /* Tono puro con entrada y salida suaves (evita el «clic» al empezar y terminar). cuando = instante del reloj de audio. */
  TT.tono = function (frecuencia, duracion, volumen, cuando, tipo) {
    var c = TT.audio();
    if (!c) return null;
    var t0 = cuando == null ? c.currentTime : cuando, osc = c.createOscillator(), g = c.createGain(), rampa = Math.min(0.01, duracion / 3);
    osc.type = tipo || 'sine'; osc.frequency.value = frecuencia;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(volumen, t0 + rampa);
    g.gain.setValueAtTime(volumen, t0 + duracion - rampa);
    g.gain.linearRampToValueAtTime(0, t0 + duracion);
    osc.connect(g); g.connect(c.destination);
    osc.start(t0); osc.stop(t0 + duracion + 0.02);
    return osc;
  };

  /* ---------- MOTOR DE CRONOMETRAJE DE PULSACIONES ----------
     Un test = una zona sensible, una duración y una lista de pulsaciones con su instante. Lo comparten CPS, jitter, Kohi, clic derecho,
     barra espaciadora, drag click, scroll y APM. El test aporta:
       cfg.duraciones  [[segundos, etiqueta]…]   cfg.defecto  segundos por defecto
       cfg.arena       { inicio, pista, jugando }  textos de la zona
       cfg.fuente      function (arena, golpe, motor) { … }   engancha los eventos y llama golpe(tipo, dato, evento) por cada pulsación válida
       cfg.unidad      'CPS'  ·  cfg.singular/plural  'clic'/'clics'  ·  cfg.decimales  2
       cfg.vivo        segundos de la ventana del contador en vivo (0 = media desde el principio)  ·  cfg.factor  multiplica el valor por segundo (60 = por minuto)
       cfg.rangos      tabla para TT.rango  ·  cfg.detalles(golpes, dur, valor) → [[etiqueta, valor]…]
       cfg.grafico     { descripcion, etiqueta } para las barras por intervalo  ·  cfg.copia(r) → texto para compartir  ·  cfg.titulo */
  TT.ritmo = function (host, cfg) {
    var dur = cfg.defecto || 10, estado = 'espera', golpes = [], t0 = 0, reloj = 0, panel = null, mejor = null, ultimo = null, intentos = 0;
    var decimales = cfg.decimales == null ? 2 : cfg.decimales, factor = cfg.factor || 1;
    var chips = cfg.duraciones && cfg.duraciones.length > 1 ? TT.chips(cfg.duraciones, dur, function (v) { dur = v; reiniciar(); }, 'Duración del test') : null;
    var datos = TT.datos([['t', 'Tiempo restante', TT.fmt(dur, 1) + ' s'], ['n', TT.mayus(cfg.plural), '0'], ['v', cfg.unidad + ' ahora', TT.fmt(0, decimales)]]);
    var titulo = TT.h('span', { class: 'tt-arena-t' }), pista = TT.h('small'), numero = TT.h('span', { class: 'tt-arena-n', 'aria-hidden': 'true' });
    var arena = TT.h('button', { type: 'button', class: 'tt-arena', 'data-estado': 'espera' }, titulo, numero, pista);

    function textos() {
      titulo.textContent = estado === 'jugando' ? (cfg.arena.jugando || '¡Sigue!') : estado === 'fin' ? '¡Tiempo!' : cfg.arena.inicio;
      pista.textContent = estado === 'espera' ? (cfg.arena.pista || '') : '';
      numero.textContent = estado === 'espera' ? '' : String(golpes.length);
      numero.style.display = estado === 'espera' ? 'none' : '';
      arena.setAttribute('data-estado', estado);
    }
    function reiniciar() {
      global.clearInterval(reloj); reloj = 0;
      estado = 'espera'; golpes = []; t0 = 0;
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null;
      if (chips) chips.bloquear(false);
      datos.poner('t', TT.fmt(dur, 1) + ' s', false); datos.poner('n', '0', false); datos.poner('v', TT.fmt(0, decimales), false);
      textos();
      TT.enfocar(arena);
    }
    function ahora(ev) {
      var m = ev && ev.timeStamp;
      return m && m < 1e11 && Math.abs(m - global.performance.now()) < 5000 ? m : global.performance.now();
    }
    function vivo(t) {
      var n = golpes.length, v;
      if (cfg.vivo && t > cfg.vivo) { var d = 0; for (var i = golpes.length - 1; i >= 0 && golpes[i].t > t - cfg.vivo; i--) d++; v = d / cfg.vivo; }
      else v = n / Math.max(t, 1);
      return v * factor;
    }
    function tic() {
      var t = (global.performance.now() - t0) / 1000;
      if (t >= dur) { terminar(); return; }
      datos.poner('t', TT.fmt(dur - t, 1) + ' s', dur - t < 3);
      datos.poner('v', TT.fmt(vivo(t), decimales));
    }
    function empezar(marca) {
      estado = 'jugando'; t0 = marca;
      if (chips) chips.bloquear(true);
      reloj = global.setInterval(tic, 50);
      TT.anunciar('Empieza el test, ' + dur + ' segundos.');
    }
    function golpe(tipo, dato, ev) {
      if (estado === 'fin') return;
      var marca = ahora(ev);
      if (estado === 'espera') empezar(marca);
      var t = (marca - t0) / 1000;
      if (t >= dur) { terminar(); return; }
      golpes.push({ t: Math.max(0, t), tipo: tipo, dato: dato });
      numero.textContent = String(golpes.length);
      datos.poner('n', String(golpes.length));
    }
    function terminar() {
      if (estado === 'fin') return;
      global.clearInterval(reloj); reloj = 0;
      estado = 'fin'; intentos++;
      var n = golpes.length, valor = n / dur * factor;
      datos.poner('t', TT.fmt(0, 1) + ' s', false); datos.poner('v', TT.fmt(valor, decimales));
      textos();
      var rango = cfg.rangos ? TT.rango(valor, cfg.rangos) : null;
      var detalles = [[TT.mayus(cfg.plural), n], ['Duración', dur + ' s']];
      if (cfg.detalles) detalles = detalles.concat(cfg.detalles(golpes, dur, valor));
      if (mejor != null && intentos > 1) detalles.push(['Mejor de esta visita', TT.fmt(Math.max(mejor, valor), decimales) + ' ' + cfg.unidad]);
      mejor = mejor == null ? valor : Math.max(mejor, valor);
      var extra = null;
      if (cfg.grafico && n) {
        var cubos = Math.min(Math.round(dur), 20), ancho = dur / cubos, v = [];
        for (var i = 0; i < cubos; i++) v.push(0);
        golpes.forEach(function (g) { v[Math.min(cubos - 1, Math.floor(g.t / ancho))] += 1 / ancho; });
        extra = TT.barras(v.map(function (x) { return Math.round(x * 10) / 10; }), { formato: function (x) { return TT.fmt(x, 1); }, descripcion: cfg.grafico.descripcion, pie: ['0 s', dur + ' s'] });
      }
      ultimo = { valor: valor, n: n, dur: dur, rango: rango };
      global.setTimeout(function () {
        if (estado !== 'fin') return;
        panel = TT.resultado(host, {
          titulo: cfg.titulo || 'Tu resultado', valor: TT.fmt(valor, decimales), unidad: cfg.unidad, rango: rango, extra: extra, detalles: detalles,
          copia: cfg.copia ? cfg.copia(ultimo) : null, alRepetir: function () { reiniciar(); }
        });
        TT.anunciar('Resultado: ' + TT.fmt(valor, decimales) + ' ' + cfg.unidad + (rango ? ', ' + rango.nombre : '') + '.');
        TT.enfocar(panel);
      }, 650);
    }

    var cabecera = TT.h('div', { class: 'tt-fila' });
    if (chips) cabecera.appendChild(TT.h('p', { class: 'tt-etiqueta', texto: 'Duración' })), cabecera.appendChild(chips.nodo);
    if (cfg.opciones) cabecera.appendChild(cfg.opciones);
    host.appendChild(cabecera);
    host.appendChild(datos.nodo);
    host.appendChild(arena);
    cfg.fuente(arena, golpe, { estado: function () { return estado; }, enfocada: function () { return global.document.activeElement === arena; } });
    textos();
    return { reiniciar: reiniciar, arena: arena, golpes: function () { return golpes; }, estado: function () { return estado; }, terminar: terminar, resultado: function () { return ultimo; } };
  };
  /* ---------- MOTOR DE TIEMPO DE REACCIÓN (visual y auditivo) ----------
     cfg.intentos        número de intentos válidos (5)
     cfg.espera          [mín, máx] ms antes de la señal
     cfg.textos          { inicio, pista, espera, ya, pronto, siguiente }
     cfg.alSenal(arena)  opcional: lanza la señal (p. ej. un pitido) y devuelve su instante estimado (performance.now()); si falta, la señal es el cambio de color
     cfg.antes()         opcional: se llama al empezar cada intento (p. ej. para activar el audio); si devuelve false no empieza
     cfg.rangos          [[máximo en ms, nombre, texto]…] ordenados de menor a mayor
     cfg.nota            texto aclaratorio del resultado  ·  cfg.copia(media, mejor) → texto para compartir  ·  cfg.titulo */
  TT.reaccion = function (host, cfg) {
    var N = cfg.intentos || 5, estado = 'inicio', tiempos = [], t0 = 0, espera = 0, panel = null, enfriar = 0;
    var datos = TT.datos([['i', 'Intento', '1/' + N], ['u', 'Último', '—'], ['m', 'Media', '—']]);
    var titulo = TT.h('span', { class: 'tt-arena-t' }), grande = TT.h('span', { class: 'tt-arena-n', 'aria-hidden': 'true' }), pista = TT.h('small');
    var arena = TT.h('button', { type: 'button', class: 'tt-arena tt-arena--senal' + (cfg.alSenal ? ' tt-arena--audio' : ''), 'data-estado': 'inicio' }, titulo, grande, pista);

    function vista() {
      var t = cfg.textos;
      var audio = !!cfg.alSenal;                                    // con señal sonora la pantalla no debe delatar el momento del pitido
      arena.setAttribute('data-estado', estado === 'ya' && audio ? 'espera' : estado);
      grande.style.display = estado === 'resultado' ? '' : 'none';
      grande.textContent = estado === 'resultado' ? TT.fmt(tiempos[tiempos.length - 1], 0) + ' ms' : '';
      titulo.textContent = estado === 'inicio' ? t.inicio : estado === 'espera' ? t.espera : estado === 'ya' ? (audio ? t.espera : t.ya) : estado === 'pronto' ? t.pronto : (tiempos.length + ' de ' + N + ' intentos');
      pista.textContent = estado === 'inicio' ? (t.pista || '') : estado === 'pronto' ? (t.siguiente || 'Pulsa para repetir el intento.') : estado === 'resultado' ? 'Pulsa para el siguiente.' : '';
    }
    function marcador() {
      datos.poner('i', Math.min(tiempos.length + 1, N) + '/' + N);
      datos.poner('u', tiempos.length ? TT.fmt(tiempos[tiempos.length - 1], 0) + ' ms' : '—');
      datos.poner('m', tiempos.length ? TT.fmt(TT.media(tiempos), 0) + ' ms' : '—');
    }
    function empezar() {
      if (cfg.antes && cfg.antes() === false) return;
      estado = 'espera'; vista();
      var d = TT.azar(cfg.espera[0], cfg.espera[1]);
      espera = global.setTimeout(lanzar, d);
    }
    function lanzar() {
      estado = 'ya';
      if (cfg.alSenal) { t0 = cfg.alSenal(arena); vista(); }
      else { vista(); t0 = global.performance.now(); global.requestAnimationFrame(function (t) { t0 = t; }); }
    }
    function reiniciar() {
      global.clearTimeout(espera); estado = 'inicio'; tiempos = [];
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null; marcador(); vista(); TT.enfocar(arena);
    }
    function pulso(ev) {
      if (enfriar > global.performance.now()) return;
      var marca = ev && ev.timeStamp && ev.timeStamp < 1e11 ? ev.timeStamp : global.performance.now();
      if (estado === 'inicio' || estado === 'pronto' || estado === 'resultado') { enfriar = global.performance.now() + 250; empezar(); return; }
      if (estado === 'espera') { global.clearTimeout(espera); estado = 'pronto'; enfriar = global.performance.now() + 400; vista(); return; }
      if (estado === 'ya') {
        var ms = marca - t0;
        if (ms < 0) { estado = 'pronto'; vista(); return; }
        tiempos.push(ms); estado = 'resultado'; enfriar = global.performance.now() + 300; marcador(); vista();
        if (tiempos.length >= N) global.setTimeout(final, 500);
      }
    }
    function final() {
      if (estado !== 'resultado' || tiempos.length < N) return;
      estado = 'fin'; arena.setAttribute('data-estado', 'fin'); titulo.textContent = '¡Terminado!'; pista.textContent = ''; grande.style.display = 'none';
      var media = TT.media(tiempos), mejor = Math.min.apply(null, tiempos), peor = Math.max.apply(null, tiempos), r = TT.rangoMax(media, cfg.rangos);
      panel = TT.resultado(host, {
        titulo: cfg.titulo || 'Tu tiempo de reacción', valor: TT.fmt(media, 0), unidad: 'ms', rango: r,
        extra: TT.barras(tiempos.map(function (x) { return Math.round(x); }), { formato: function (x) { return x + ' ms'; }, descripcion: 'Tiempo de cada intento en milisegundos', pie: ['Intento 1', 'Intento ' + N] }),
        detalles: [['Mejor intento', TT.fmt(mejor, 0) + ' ms'], ['Peor intento', TT.fmt(peor, 0) + ' ms'], ['Mediana', TT.fmt(TT.mediana(tiempos), 0) + ' ms'], ['Variación entre intentos', TT.fmt(TT.desviacion(tiempos), 0) + ' ms']],
        copia: cfg.copia ? cfg.copia(media, mejor) : null, alRepetir: reiniciar
      });
      TT.anunciar('Resultado: media de ' + TT.fmt(media, 0) + ' milisegundos.');
      TT.enfocar(panel);
    }
    arena.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; if (estado === 'fin') return; pulso(e); });
    arena.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); if (estado !== 'fin') pulso(e); } });
    arena.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    if (cfg.opciones) host.appendChild(cfg.opciones);
    host.appendChild(datos.nodo);
    host.appendChild(arena);
    vista();
    return { reiniciar: reiniciar, arena: arena, estado: function () { return estado; }, tiempos: function () { return tiempos.slice(); } };
  };
})(typeof window !== 'undefined' ? window : globalThis);

;
/* ===== tests/cuestionario.js ===== */
/* MOTOR DE CUESTIONARIOS (TT.cuestionario y TT.lista): una pregunta cada vez con barra de avance, botón «Anterior», teclas 1-9 y un resultado
   que calcula cada test con sus propias reglas. Sirve para los tests de personalidad, relaciones y cultura pop.
   Nada se envía ni se guarda: las respuestas viven en variables de la página y se pierden al recargar. */
(function (global) {
  'use strict';
  var TT = global.TT = global.TT || {};
  var doc = global.document;
  if (!doc) return;

  var ESCALAS = {
    acuerdo: ['Nada de acuerdo', 'Poco de acuerdo', 'Más o menos', 'Bastante de acuerdo', 'Totalmente de acuerdo'],
    frecuencia: ['Nunca', 'Casi nunca', 'A veces', 'Con frecuencia', 'Siempre'],
    intensidad: ['Nada', 'Un poco', 'Algo', 'Bastante', 'Mucho'],
    verdad: ['Falso', 'Más bien falso', 'Ni una cosa ni la otra', 'Más bien cierto', 'Cierto']
  };
  TT.escalas = ESCALAS;

  /* Convierte la pregunta en una lista de opciones { t, p: {dimensión: puntos}, k: índice original } */
  function opciones(q, cfg) {
    if (q.o) return q.o.map(function (o, k) { return { t: o[0], p: o[1] || {}, k: k }; });
    var textos = ESCALAS[q.escala || cfg.escala || 'acuerdo'];
    return textos.map(function (texto, k) {
      var p = {};
      Object.keys(q.d || {}).forEach(function (dim) { var w = q.d[dim]; p[dim] = w >= 0 ? k * w : (4 - k) * -w; });
      return { t: texto, p: p, k: k };
    });
  }
  function maximos(preguntas, cfg) {
    var m = {};
    preguntas.forEach(function (q) {
      var por = {};
      opciones(q, cfg).forEach(function (o) { Object.keys(o.p).forEach(function (d) { por[d] = Math.max(por[d] || 0, o.p[d]); }); });
      Object.keys(por).forEach(function (d) { m[d] = (m[d] || 0) + por[d]; });
    });
    return m;
  }

  /* cfg = { intro, escala, mezclar, preguntas: [{ t, nota, o: [[texto, {dim: pts}]] | escala, d: {dim: peso} }], resultado(ctx) → opciones de TT.resultado } */
  TT.cuestionario = function (cfg) {
    var host = TT.app();
    if (!host) return;
    var P = cfg.preguntas, n = P.length, MAX = maximos(P, cfg), resp, vista, i, panel = null, opts;
    var progresoTxt = TT.h('span', { 'class': 'tc-num' }), pista = TT.h('i');
    var cab = TT.h('div', { 'class': 'tc-progreso' }, progresoTxt, TT.h('span', { 'class': 'tc-pista', 'aria-hidden': 'true' }, pista));
    var texto = TT.h('p', { 'class': 'tc-t' }), nota = TT.h('p', { 'class': 'tc-nota' }), lista = TT.h('div', { 'class': 'tc-opciones' });
    var grupo = TT.h('div', { 'class': 'tc-pregunta', role: 'group', tabindex: '-1' }, texto, nota, lista);
    var atras = TT.boton('Anterior', function () { if (i > 0) { i--; pintar(); } }, true);
    var caja = TT.h('div', { 'class': 'tc' }, cab, grupo, TT.h('div', { 'class': 'tt-fila' }, atras));
    if (cfg.intro) host.appendChild(TT.h('p', { 'class': 'tt-aviso', texto: cfg.intro }));
    host.appendChild(caja);

    function reiniciar() {
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null; resp = []; i = 0; vista = [];
      opts = P.map(function (q) { var o = opciones(q, cfg); return (q.o && cfg.mezclar !== false && !q.fijo) ? TT.barajar(o) : o; });
      caja.hidden = false; pintar(true);
    }
    function pintar(sinFoco) {
      var q = P[i];
      progresoTxt.textContent = 'Pregunta ' + (i + 1) + ' de ' + n;
      pista.style.width = (i / n * 100) + '%';
      texto.textContent = q.t; texto.setAttribute('data-i', i);
      nota.textContent = q.nota || ''; nota.hidden = !q.nota;
      grupo.setAttribute('aria-label', 'Pregunta ' + (i + 1) + ' de ' + n + ': ' + q.t);
      atras.disabled = i === 0; atras.style.visibility = i === 0 ? 'hidden' : '';   // en la primera no hay a dónde volver: se oculta sin mover nada
      TT.vaciar(lista);
      lista.className = 'tc-opciones' + (q.escala || (!q.o) ? ' tc-opciones--escala' : '');
      opts[i].forEach(function (o, pos) {
        var b = TT.h('button', { type: 'button', 'class': 'tc-opcion', 'data-o': o.k, 'aria-pressed': String(resp[i] === o.k) }, TT.h('span', { 'class': 'tc-tecla', 'aria-hidden': 'true', texto: String(pos + 1) }), o.t);
        b.addEventListener('click', function () { elegir(o.k); });
        lista.appendChild(b);
      });
      if (!sinFoco) { try { grupo.focus({ preventScroll: true }); } catch (e) { /* sin foco */ } TT.anunciar('Pregunta ' + (i + 1) + ' de ' + n + '. ' + q.t); }
    }
    function elegir(k) {
      resp[i] = k;
      if (i < n - 1) { i++; pintar(); } else terminar();
    }
    function calcular() {
      var tot = {};
      P.forEach(function (q, j) {
        var o = opciones(q, cfg)[resp[j]];
        Object.keys(o.p).forEach(function (d) { tot[d] = (tot[d] || 0) + o.p[d]; });
      });
      Object.keys(MAX).forEach(function (d) { if (tot[d] == null) tot[d] = 0; });
      var ctx = { tot: tot, max: MAX, n: n, resp: resp.slice() };
      ctx.pct = function (d) { return MAX[d] ? tot[d] / MAX[d] * 100 : 0; };
      ctx.top = function (dims, usarPct) {
        return (dims || Object.keys(MAX)).map(function (d, idx) { return [d, usarPct ? ctx.pct(d) : tot[d], idx]; })
          .sort(function (a, b) { return b[1] - a[1] || a[2] - b[2]; }).map(function (x) { return [x[0], x[1]]; });
      };
      return ctx;
    }
    function terminar() {
      pista.style.width = '100%';
      var r = cfg.resultado(calcular());
      r.alRepetir = reiniciar; r.textoRepetir = r.textoRepetir || 'Repetir el test';
      caja.hidden = true;
      panel = TT.resultado(host, r);
      TT.anunciar('Resultado: ' + (r.titular || r.titulo || ''));
      TT.enfocar(panel);
    }
    doc.addEventListener('keydown', function (e) {
      if (caja.hidden || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      var d = parseInt(e.key, 10);
      if (d >= 1 && d <= opts[i].length) { e.preventDefault(); elegir(opts[i][d - 1].k); }
    });
    reiniciar();
  };

  /* Lista de casillas (como la pureza de Rice): cfg = { intro, grupos: [{ titulo, items: [texto] }], boton, resultado(ctx) }.
     ctx = { marcadas, total, porGrupo: [{ titulo, marcadas, total }], items: [[grupo, texto, marcada]] } */
  TT.lista = function (cfg) {
    var host = TT.app();
    if (!host) return;
    var cajas = [], total = 0, panel = null;
    var cuenta = TT.h('p', { 'class': 'tl-cuenta', role: 'status' });
    var form = TT.h('div', { 'class': 'tl' });
    cfg.grupos.forEach(function (g, gi) {
      var fs = TT.h('fieldset', { 'class': 'tl-grupo' }, TT.h('legend', { texto: g.titulo }));
      g.items.forEach(function (texto, k) {
        total++;
        var id = 'tl-' + gi + '-' + k, cb = TT.h('input', { type: 'checkbox', id: id, 'data-g': gi });
        cb.addEventListener('change', actualizar);
        cajas.push({ cb: cb, g: gi, t: texto });
        fs.appendChild(TT.h('label', { 'class': 'tl-item', 'for': id }, cb, TT.h('span', { texto: texto })));
      });
      form.appendChild(fs);
    });
    function marcadas() { return cajas.filter(function (c) { return c.cb.checked; }).length; }
    function actualizar() { cuenta.textContent = 'Marcadas: ' + marcadas() + ' de ' + total; }
    function calcular() {
      var ctx = { marcadas: marcadas(), total: total, porGrupo: [], items: cajas.map(function (c) { return [c.g, c.t, c.cb.checked]; }) };
      cfg.grupos.forEach(function (g, gi) {
        var de = cajas.filter(function (c) { return c.g === gi; });
        ctx.porGrupo.push({ titulo: g.titulo, marcadas: de.filter(function (c) { return c.cb.checked; }).length, total: de.length });
      });
      return ctx;
    }
    function reiniciar() {
      cajas.forEach(function (c) { c.cb.checked = false; });
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null; form.hidden = false; barra.hidden = false; actualizar();
    }
    var calcularBtn = TT.boton(cfg.boton || 'Calcular mi puntuación', function () {
      var r = cfg.resultado(calcular());
      r.alRepetir = reiniciar; r.textoRepetir = r.textoRepetir || 'Repetir el test';
      form.hidden = true; barra.hidden = true;
      panel = TT.resultado(host, r);
      TT.anunciar('Resultado: ' + (r.titular || r.titulo || ''));
      TT.enfocar(panel);
    });
    var barra = TT.h('div', { 'class': 'tl-barra' }, cuenta, calcularBtn);
    if (cfg.intro) host.appendChild(TT.h('p', { 'class': 'tt-aviso', texto: cfg.intro }));
    host.appendChild(form);
    host.appendChild(barra);
    actualizar();
  };
})(window);

;
/* ===== tests/graficos.js ===== */
/* GRÁFICAS DE LOS TESTS (TT.graf): barras, ejes opuestos, radar, triángulo, brújula, medidor, espectro, plano, línea y semanas de vida.
   Se dibujan con SVG o <canvas> en el navegador, sin librerías y sin pedir nada a la red. Los colores salen del «tema» del test
   (--t-fondo, --t-texto, --t-acento) y cada gráfica lleva un texto alternativo con sus cifras. Nada se guarda. */
(function (global) {
  'use strict';
  var TT = global.TT = global.TT || {};
  var doc = global.document;
  if (!doc) return;
  var NS = 'http://www.w3.org/2000/svg';
  var G = TT.graf = {};

  function s(tag, atr, hijos) {
    var e = doc.createElementNS(NS, tag);
    Object.keys(atr || {}).forEach(function (k) { if (atr[k] == null) return; if (k === 'style') e.style.cssText = atr[k]; else e.setAttribute(k, atr[k]); });
    (hijos || []).forEach(function (h) { e.appendChild(h); });
    return e;
  }
  function t(x, y, texto, ancla, clase) { var e = s('text', { x: x, y: y, 'text-anchor': ancla || 'middle', 'class': 'tg-t' + (clase ? ' ' + clase : '') }); e.textContent = texto; return e; }
  function lienzo(w, h, alt, clase) { return s('svg', { viewBox: '0 0 ' + w + ' ' + h, 'class': 'tg-svg ' + (clase || ''), role: 'img', 'aria-label': alt, focusable: 'false' }); }
  function pct(v) { return Math.max(0, Math.min(100, v)); }
  G.pct = pct;

  /* Barras horizontales. items = [{ nombre, valor, color, nota }], o = { max, unidad, decimales, destacar, descripcion } */
  G.barras = function (items, o) {
    o = o || {};
    var max = o.max || 100, ul = TT.h('ul', { 'class': 'tg-barras', 'aria-label': o.descripcion || 'Gráfico de barras' });
    items.forEach(function (it, i) {
      var v = Math.max(0, it.valor), ancho = Math.min(100, v / max * 100);
      var pista = TT.h('span', { 'class': 'tg-pista', 'aria-hidden': 'true' }, TT.h('i', { style: 'width:' + ancho + '%' + (it.color ? ';background:' + it.color : '') }));
      var li = TT.h('li', { 'class': 'tg-barra' + (o.destacar === i ? ' tg-top' : '') },
        TT.h('span', { 'class': 'tg-nombre' }, it.nombre, it.nota ? TT.h('small', { texto: it.nota }) : null),
        pista, TT.h('span', { 'class': 'tg-valor', texto: TT.fmt(v, o.decimales || 0) + (o.unidad == null ? ' %' : o.unidad) }));
      ul.appendChild(li);
    });
    return ul;
  };

  /* Ejes opuestos: pares = [{ izq, der, v }] con v de 0 a 100 = porcentaje del polo izquierdo (50 = equilibrio). */
  G.ejes = function (pares, o) {
    var caja = TT.h('div', { 'class': 'tg-ejes', role: 'group', 'aria-label': (o && o.descripcion) || 'Ejes opuestos' });
    pares.forEach(function (p) {
      var izq = pct(p.v), lado = izq >= 50, medida = Math.abs(izq - 50);
      var barra = TT.h('span', { 'class': 'tg-pista tg-pista--eje', 'aria-hidden': 'true' },
        TT.h('i', { style: 'left:' + (lado ? 50 - medida : 50) + '%;width:' + medida + '%' }), TT.h('b', { style: 'left:50%' }));
      caja.appendChild(TT.h('div', { 'class': 'tg-eje' },
        TT.h('span', { 'class': 'tg-polo' + (lado ? ' tg-gana' : ''), texto: p.izq }), barra,
        TT.h('span', { 'class': 'tg-polo tg-polo--der' + (lado ? '' : ' tg-gana'), texto: p.der }),
        TT.h('span', { 'class': 'tg-eje-v', texto: TT.fmt(lado ? izq : 100 - izq, 0) + ' % ' + (lado ? p.izq : p.der) })));
    });
    return caja;
  };


  /* Balanza: barras que salen del centro, a la derecha si suman y a la izquierda si restan. items = [{ nombre, valor }], o = { max, unidad, decimales } */
  G.balanza = function (items, o) {
    o = o || {};
    var max = o.max || Math.max.apply(null, items.map(function (i) { return Math.abs(i.valor); }).concat([1])), ul = TT.h('ul', { 'class': 'tg-barras tg-balanza', 'aria-label': o.descripcion || 'Qué suma y qué resta' });
    items.forEach(function (it) {
      var mitad = Math.min(50, Math.abs(it.valor) / max * 50), pos = it.valor >= 0;
      var pista = TT.h('span', { 'class': 'tg-pista tg-pista--eje', 'aria-hidden': 'true' }, TT.h('i', { 'class': pos ? '' : 'tg-resta', style: 'left:' + (pos ? 50 : 50 - mitad) + '%;width:' + mitad + '%' }), TT.h('b', { style: 'left:50%' }));
      ul.appendChild(TT.h('li', { 'class': 'tg-barra' }, TT.h('span', { 'class': 'tg-nombre' }, it.nombre, it.nota ? TT.h('small', { texto: it.nota }) : null), pista,
        TT.h('span', { 'class': 'tg-valor', texto: (it.valor > 0 ? '+' : it.valor < 0 ? '−' : '') + TT.fmt(Math.abs(it.valor), o.decimales == null ? 0 : o.decimales) + (o.unidad || '') })));
    });
    return ul;
  };

  /* Radar: ejes = [{ nombre, valor (0-100) }] (3 o más) */
  G.radar = function (ejes, o) {
    var W = 380, H = 330, cx = W / 2, cy = 165, R = 105, n = ejes.length;
    var alt = (o && o.descripcion || 'Gráfico de radar') + ': ' + ejes.map(function (e) { return e.nombre + ' ' + TT.fmt(pct(e.valor), 0) + ' %'; }).join(', ');
    var svg = lienzo(W, H, alt, 'tg-radar');
    function punto(i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    [0.25, 0.5, 0.75, 1].forEach(function (f) { svg.appendChild(s('polygon', { 'class': 'tg-malla', points: ejes.map(function (e, i) { return punto(i, R * f).join(','); }).join(' ') })); });
    ejes.forEach(function (e, i) { var p = punto(i, R); svg.appendChild(s('line', { 'class': 'tg-malla', x1: cx, y1: cy, x2: p[0], y2: p[1] })); });
    svg.appendChild(s('polygon', { 'class': 'tg-area', points: ejes.map(function (e, i) { return punto(i, R * pct(e.valor) / 100).join(','); }).join(' ') }));
    ejes.forEach(function (e, i) {
      var p = punto(i, R * pct(e.valor) / 100), l = punto(i, R + 16), ancla = Math.abs(l[0] - cx) < 8 ? 'middle' : (l[0] > cx ? 'start' : 'end');
      svg.appendChild(s('circle', { 'class': 'tg-punto', cx: p[0], cy: p[1], r: 4 }));
      svg.appendChild(t(l[0], l[1] + 4, e.nombre, ancla));
    });
    return svg;
  };

  /* Triángulo de tres polos: nombres = [arriba, abajo-izquierda, abajo-derecha], valores = tres números (se reparten en proporción) */
  G.triangulo = function (nombres, valores, o) {
    var W = 380, H = 330, A = [190, 52], B = [58, 272], C = [322, 272], suma = valores[0] + valores[1] + valores[2] || 1;
    var f = valores.map(function (v) { return v / suma; });
    var px = A[0] * f[0] + B[0] * f[1] + C[0] * f[2], py = A[1] * f[0] + B[1] * f[1] + C[1] * f[2];
    var alt = (o && o.descripcion || 'Triángulo de tres polos') + ': ' + nombres.map(function (n, i) { return n + ' ' + TT.fmt(f[i] * 100, 0) + ' %'; }).join(', ');
    var svg = lienzo(W, H, alt, 'tg-triangulo');
    svg.appendChild(s('polygon', { 'class': 'tg-malla tg-relleno', points: [A, B, C].map(function (p) { return p.join(','); }).join(' ') }));
    [[A, B, C], [B, C, A], [C, A, B]].forEach(function (v) {
      var m = [(v[1][0] + v[2][0]) / 2, (v[1][1] + v[2][1]) / 2];
      svg.appendChild(s('line', { 'class': 'tg-malla', x1: v[0][0], y1: v[0][1], x2: m[0], y2: m[1] }));
    });
    svg.appendChild(s('circle', { 'class': 'tg-punto tg-punto--grande', cx: px, cy: py, r: 8 }));
    svg.appendChild(t(A[0], A[1] - 16, nombres[0] + ' ' + TT.fmt(f[0] * 100, 0) + ' %'));
    svg.appendChild(t(B[0] + 6, B[1] + 26, nombres[1] + ' ' + TT.fmt(f[1] * 100, 0) + ' %', 'start'));
    svg.appendChild(t(C[0] - 6, C[1] + 26, nombres[2] + ' ' + TT.fmt(f[2] * 100, 0) + ' %', 'end'));
    return svg;
  };

  /* Brújula: nombres = { n, e, s, o } y valores = { n, e, s, o } de 0 a 100. La aguja apunta hacia donde pesan más tus respuestas. */
  G.brujula = function (nombres, valores, o) {
    var W = 380, H = 340, cx = 190, cy = 170, R = 112, dirs = { n: [0, -1], e: [1, 0], s: [0, 1], o: [-1, 0] };
    var alt = (o && o.descripcion || 'Brújula') + ': ' + ['n', 'e', 's', 'o'].map(function (k) { return nombres[k] + ' ' + TT.fmt(pct(valores[k]), 0) + ' %'; }).join(', ');
    var svg = lienzo(W, H, alt, 'tg-brujula');
    [0.33, 0.66, 1].forEach(function (f) { svg.appendChild(s('circle', { 'class': 'tg-malla', cx: cx, cy: cy, r: R * f })); });
    svg.appendChild(s('line', { 'class': 'tg-malla', x1: cx - R, y1: cy, x2: cx + R, y2: cy }));
    svg.appendChild(s('line', { 'class': 'tg-malla', x1: cx, y1: cy - R, x2: cx, y2: cy + R }));
    var pts = ['n', 'e', 's', 'o'].map(function (k) { var r = R * pct(valores[k]) / 100; return (cx + dirs[k][0] * r) + ',' + (cy + dirs[k][1] * r); });
    svg.appendChild(s('polygon', { 'class': 'tg-area', points: pts.join(' ') }));
    var vx = valores.e - valores.o, vy = valores.n - valores.s, m = Math.hypot(vx, vy);
    if (m > 4) {
      var largo = Math.min(R, R * m / 100 * 1.6 + 30), ux = vx / m, uy = -vy / m, bx = -uy, by = ux;
      var punta = [cx + ux * largo, cy + uy * largo];
      svg.appendChild(s('polygon', { 'class': 'tg-aguja', points: [punta, [cx + bx * 9, cy + by * 9], [cx - ux * 16, cy - uy * 16], [cx - bx * 9, cy - by * 9]].map(function (p) { return p.join(','); }).join(' ') }));
    }
    svg.appendChild(s('circle', { 'class': 'tg-punto', cx: cx, cy: cy, r: 5 }));
    svg.appendChild(t(cx, cy - R - 12, nombres.n)); svg.appendChild(t(cx, cy + R + 24, nombres.s));
    svg.appendChild(t(cx + R + 10, cy + 4, nombres.e, 'start')); svg.appendChild(t(cx - R - 10, cy + 4, nombres.o, 'end'));
    return svg;
  };

  /* Medidor de media luna: valor de 0 a 100; o = { izq, der, texto } */
  G.medidor = function (valor, o) {
    o = o || {};
    var W = 380, H = 230, cx = 190, cy = 190, R = 140, v = pct(valor), a = Math.PI * (1 - v / 100);
    var svg = lienzo(W, H, (o.descripcion || 'Medidor') + ': ' + TT.fmt(v, 0) + ' de 100', 'tg-medidor');
    function arco(a0, a1, clase) {
      var x0 = cx + R * Math.cos(a0), y0 = cy - R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy - R * Math.sin(a1);
      return s('path', { 'class': clase, d: 'M' + x0 + ',' + y0 + ' A' + R + ',' + R + ' 0 0 1 ' + x1 + ',' + y1 });
    }
    svg.appendChild(arco(Math.PI, 0, 'tg-arco'));
    if (v > 0.5) svg.appendChild(arco(Math.PI, a, 'tg-arco tg-arco--v'));
    svg.appendChild(s('line', { 'class': 'tg-aguja-l', x1: cx, y1: cy, x2: cx + (R - 14) * Math.cos(a), y2: cy - (R - 14) * Math.sin(a) }));
    svg.appendChild(s('circle', { 'class': 'tg-punto', cx: cx, cy: cy, r: 7 }));
    svg.appendChild(t(cx - R, cy + 26, o.izq || '0', 'middle')); svg.appendChild(t(cx + R, cy + 26, o.der || '100', 'middle'));
    if (o.texto) svg.appendChild(t(cx, cy - 36, o.texto, 'middle', 'tg-t--grande'));
    return svg;
  };

  /* Espectro: una escala con un marcador. valor de 0 a 100; o = { izq, der, marcas[] } */
  G.espectro = function (valor, o) {
    o = o || {};
    var v = pct(valor), marcas = o.marcas || [];
    var pista = TT.h('div', { 'class': 'tg-espectro-pista', 'aria-hidden': 'true' }, TT.h('b', { style: 'left:' + v + '%' }));
    var caja = TT.h('div', { 'class': 'tg-espectro', role: 'img', 'aria-label': (o.descripcion || 'Espectro') + ': ' + TT.fmt(v, 0) + ' de 100 entre «' + (o.izq || '0') + '» y «' + (o.der || '100') + '»' }, pista,
      TT.h('div', { 'class': 'tg-espectro-pie' }, TT.h('span', { texto: o.izq || '0' }), TT.h('span', { texto: o.der || '100' })));
    if (marcas.length) {
      var fila = TT.h('div', { 'class': 'tg-espectro-marcas', 'aria-hidden': 'true' });
      marcas.forEach(function (m) { fila.appendChild(TT.h('span', { 'class': m[0] <= 8 ? 'tg-m-ini' : (m[0] >= 92 ? 'tg-m-fin' : null), style: 'left:' + m[0] + '%', texto: m[1] })); });
      caja.insertBefore(fila, caja.firstChild);
    }
    return caja;
  };

  /* Plano de dos ejes: x e y de 0 a 100; o = { ejeX, ejeY, esquinas: [arribaIzq, arribaDer, abajoIzq, abajoDer] } */
  G.plano = function (x, y, o) {
    o = o || {};
    var W = 380, H = 340, L = 56, T = 24, w = 300, h = 250, px = L + w * pct(x) / 100, py = T + h * (1 - pct(y) / 100);
    var svg = lienzo(W, H, (o.descripcion || 'Plano de dos ejes') + ': ' + (o.ejeX || 'horizontal') + ' ' + TT.fmt(pct(x), 0) + ' %, ' + (o.ejeY || 'vertical') + ' ' + TT.fmt(pct(y), 0) + ' %', 'tg-plano');
    svg.appendChild(s('rect', { 'class': 'tg-malla tg-relleno', x: L, y: T, width: w, height: h }));
    svg.appendChild(s('line', { 'class': 'tg-malla', x1: L + w / 2, y1: T, x2: L + w / 2, y2: T + h }));
    svg.appendChild(s('line', { 'class': 'tg-malla', x1: L, y1: T + h / 2, x2: L + w, y2: T + h / 2 }));
    if (o.esquinas) {
      svg.appendChild(t(L + 8, T + 18, o.esquinas[0], 'start', 'tg-t--suave')); svg.appendChild(t(L + w - 8, T + 18, o.esquinas[1], 'end', 'tg-t--suave'));
      svg.appendChild(t(L + 8, T + h - 10, o.esquinas[2], 'start', 'tg-t--suave')); svg.appendChild(t(L + w - 8, T + h - 10, o.esquinas[3], 'end', 'tg-t--suave'));
    }
    svg.appendChild(s('circle', { 'class': 'tg-punto tg-punto--grande', cx: px, cy: py, r: 9 }));
    svg.appendChild(t(L + w / 2, H - 6, (o.ejeX || '') + ' →', 'middle'));
    var vert = t(14, T + h / 2, (o.ejeY || '') + ' →', 'middle'); vert.setAttribute('transform', 'rotate(-90 14 ' + (T + h / 2) + ')'); svg.appendChild(vert);
    return svg;
  };

  /* Línea: puntos = [[x, y], …]; o = { xTitulo, yTitulo, yMax, formatoY } */
  G.linea = function (puntos, o) {
    o = o || {};
    var W = 420, H = 240, L = 46, T = 14, w = 356, h = 170, xs = puntos.map(function (p) { return p[0]; }), ys = puntos.map(function (p) { return p[1]; });
    var xMax = Math.max.apply(null, xs.concat([1])), yMax = o.yMax || Math.max.apply(null, ys.concat([1])) * 1.1, fy = o.formatoY || function (v) { return TT.fmt(v, 0); };
    var svg = lienzo(W, H, (o.descripcion || 'Gráfica de línea'), 'tg-linea');
    [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
      var yy = T + h * (1 - f);
      svg.appendChild(s('line', { 'class': 'tg-malla', x1: L, y1: yy, x2: L + w, y2: yy }));
      svg.appendChild(t(L - 6, yy + 4, fy(yMax * f), 'end', 'tg-t--suave'));
    });
    if (puntos.length > 1) {
      var xy = puntos.map(function (p) { return [L + w * p[0] / xMax, T + h * (1 - Math.min(p[1], yMax) / yMax)]; });
      svg.appendChild(s('polygon', { 'class': 'tg-area', points: [[xy[0][0], T + h]].concat(xy, [[xy[xy.length - 1][0], T + h]]).map(function (p) { return p.join(','); }).join(' ') }));
      svg.appendChild(s('polyline', { 'class': 'tg-trazo', points: xy.map(function (p) { return p.join(','); }).join(' ') }));
    }
    svg.appendChild(t(L, H - 18, '0', 'start', 'tg-t--suave')); svg.appendChild(t(L + w, H - 18, TT.fmt(xMax, 0) + ' ' + (o.xUnidad || 's'), 'end', 'tg-t--suave'));
    if (o.yTitulo) svg.appendChild(t(L, H - 2, o.yTitulo, 'start', 'tg-t--suave'));
    return svg;
  };

  /* Semanas de una vida: una casilla por semana, 52 por fila. vividas y total en semanas; extra (opcional) = semanas «de más» o «de menos» sobre la media. */
  G.semanas = function (vividas, previstas, total, o) {
    var col = 52, filas = Math.ceil(total / col), c = 7, g = 2, W = col * (c + g), H = filas * (c + g);
    var cv = TT.h('canvas', { 'class': 'tg-semanas', width: W, height: H, role: 'img', 'aria-label': (o && o.descripcion || 'Semanas de una vida') + ': ' + TT.fmt(vividas / 52, 0) + ' años vividos y ' + TT.fmt(Math.max(0, previstas - vividas) / 52, 0) + ' por delante (de juego)' });
    var ctx = cv.getContext && cv.getContext('2d');
    if (!ctx) return cv;
    var estilo = global.getComputedStyle(doc.body), acento = estilo.getPropertyValue('--t-acento').trim() || '#e66', texto = estilo.getPropertyValue('--t-texto').trim() || '#888';
    for (var k = 0; k < total; k++) {
      var x = (k % col) * (c + g), y = Math.floor(k / col) * (c + g);
      if (k < vividas) { ctx.globalAlpha = 1; ctx.fillStyle = texto; ctx.fillRect(x, y, c, c); }
      else if (k < previstas) { ctx.globalAlpha = 1; ctx.fillStyle = acento; ctx.fillRect(x, y, c, c); }
      else { ctx.globalAlpha = 0.35; ctx.fillStyle = texto; ctx.fillRect(x + 2, y + 2, c - 4, c - 4); }
    }
    ctx.globalAlpha = 1;
    return cv;
  };

  /* Leyenda de colores para cualquier gráfica: items = [[etiqueta, color]] */
  G.leyenda = function (items) {
    var ul = TT.h('ul', { 'class': 'tg-leyenda' });
    items.forEach(function (it) { ul.appendChild(TT.h('li', {}, TT.h('i', { style: 'background:' + it[1], 'aria-hidden': 'true' }), it[0])); });
    return ul;
  };
})(window);

;
/* ===== tests/quiz.js ===== */
/* MOTOR DE QUIZ CON CORRECCIÓN (TT.quiz): una pregunta cada vez, se corrige al responder (con una explicación breve) y el resultado calcula un nivel
   según los aciertos en cada franja de dificultad, con una gráfica por franja y el repaso de lo fallado. Lo usan los tests de idiomas.
   Nada se envía ni se guarda: las respuestas viven en variables de la página y se pierden al recargar. */
(function (global) {
  'use strict';
  var TT = global.TT = global.TT || {};
  var doc = global.document;
  if (!doc) return;

  /* cfg = {
       intro, titulo, unidadNivel,
       niveles: ['A1', 'A2', …]                       nombre de cada franja de dificultad (de menor a mayor)
       resultados: [{ n, d }, …]                      una más que niveles: 0 = «ni siquiera la primera franja», k = «has dominado k franjas»
       preguntas: [{ t, o: [texto…], c: índice de la correcta, e: explicación, n: franja (0…) , nota? }]
       porNivel: k (opcional)                          si se indica, cada partida elige k preguntas al azar de cada franja
       umbral: 0.6                                     aciertos mínimos (0-1) para dar una franja por superada
       ajustar(ctx, r)                                 (opcional) retoca el resultado antes de pintarlo
     } */
  TT.quiz = function (cfg) {
    var host = TT.app();
    if (!host) return;
    var L = cfg.niveles.length, umbral = cfg.umbral || 0.6, P, n, i, estado, panel = null, respondida;
    var progresoTxt = TT.h('span', { 'class': 'tc-num' }), pista = TT.h('i');
    var cab = TT.h('div', { 'class': 'tc-progreso' }, progresoTxt, TT.h('span', { 'class': 'tc-pista', 'aria-hidden': 'true' }, pista));
    var texto = TT.h('p', { 'class': 'tc-t' }), nota = TT.h('p', { 'class': 'tc-nota' }), lista = TT.h('div', { 'class': 'tc-opciones' });
    var expl = TT.h('p', { 'class': 'tq-expl', hidden: true });
    var grupo = TT.h('div', { 'class': 'tc-pregunta', role: 'group', tabindex: '-1' }, texto, nota, lista, expl);
    var siguiente = TT.boton('Siguiente', function () { avanzar(); });
    var fila = TT.h('div', { 'class': 'tt-fila' }, siguiente);
    var caja = TT.h('div', { 'class': 'tc tq' }, cab, grupo, fila);
    if (cfg.intro) host.appendChild(TT.h('p', { 'class': 'tt-aviso', texto: cfg.intro }));
    host.appendChild(caja);

    function elegirPreguntas() {
      var por = [];
      for (var k = 0; k < L; k++) por.push([]);
      cfg.preguntas.forEach(function (q) { por[q.n || 0].push(q); });
      var sel = [];
      por.forEach(function (grupoNivel) {
        var g = TT.barajar(grupoNivel);
        if (cfg.porNivel) g = g.slice(0, cfg.porNivel);
        sel = sel.concat(g);
      });
      return sel.map(function (q) {
        var orden = TT.barajar(q.o.map(function (t, k) { return { t: t, k: k }; }));
        return { q: q, orden: orden };
      });
    }
    function reiniciar() {
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      panel = null; P = elegirPreguntas(); n = P.length; i = 0; estado = []; respondida = false;
      caja.hidden = false; pintar(true);
    }
    function pintar(sinFoco) {
      var item = P[i], q = item.q;
      respondida = false;
      progresoTxt.textContent = 'Pregunta ' + (i + 1) + ' de ' + n;
      pista.style.width = (i / n * 100) + '%';
      texto.textContent = q.t;
      nota.textContent = q.nota || ''; nota.hidden = !q.nota;
      expl.hidden = true; expl.textContent = '';
      siguiente.hidden = true; siguiente.textContent = i === n - 1 ? 'Ver el resultado' : 'Siguiente';
      grupo.setAttribute('aria-label', 'Pregunta ' + (i + 1) + ' de ' + n + ': ' + q.t);
      TT.vaciar(lista);
      item.orden.forEach(function (o, pos) {
        var b = TT.h('button', { type: 'button', 'class': 'tc-opcion', 'data-o': o.k }, TT.h('span', { 'class': 'tc-tecla', 'aria-hidden': 'true', texto: String(pos + 1) }), TT.h('span', { 'class': 'tq-texto', texto: o.t }));
        b.addEventListener('click', function () { responder(o.k); });
        lista.appendChild(b);
      });
      if (!sinFoco) { try { grupo.focus({ preventScroll: true }); } catch (e) { /* sin foco */ } TT.anunciar('Pregunta ' + (i + 1) + ' de ' + n + '. ' + q.t); }
    }
    function responder(k) {
      if (respondida) return;
      respondida = true;
      var q = P[i].q, bien = k === q.c;
      estado[i] = { k: k, bien: bien };
      Array.prototype.forEach.call(lista.children, function (b) {
        var ok = +b.getAttribute('data-o') === q.c, elegida = +b.getAttribute('data-o') === k;
        if (ok) { b.classList.add('tq-ok'); b.appendChild(TT.h('span', { 'class': 'tq-marca', texto: elegida ? '✓ Correcta, la tuya' : '✓ Correcta' })); }
        else if (elegida) { b.classList.add('tq-mal'); b.appendChild(TT.h('span', { 'class': 'tq-marca', texto: '✗ Tu respuesta' })); }
        b.setAttribute('aria-disabled', 'true');
      });
      expl.textContent = (bien ? 'Correcto. ' : 'Casi. La correcta es «' + q.o[q.c] + '». ') + (q.e || '');
      expl.hidden = false;
      TT.anunciar(expl.textContent);
      siguiente.hidden = false;
      try { siguiente.focus({ preventScroll: true }); siguiente.scrollIntoView({ block: 'nearest' }); } catch (e) { /* sin foco */ }
    }
    function avanzar() {
      if (!respondida) return;
      if (i < n - 1) { i++; pintar(); } else terminar();
    }
    function calcular() {
      var porNivel = [];
      for (var k = 0; k < L; k++) porNivel.push({ nombre: cfg.niveles[k], aciertos: 0, total: 0, pct: 0 });
      var fallos = [], aciertos = 0;
      P.forEach(function (item, j) {
        var q = item.q, e = estado[j], nv = porNivel[q.n || 0];
        nv.total++;
        if (e.bien) { nv.aciertos++; aciertos++; } else fallos.push({ t: q.t, tuya: q.o[e.k], correcta: q.o[q.c], e: q.e || '' });
      });
      porNivel.forEach(function (nv) { nv.pct = nv.total ? nv.aciertos / nv.total * 100 : 0; });
      var superados = 0;
      while (superados < L && porNivel[superados].total && porNivel[superados].pct / 100 >= umbral - 1e-9) superados++;
      return { n: n, aciertos: aciertos, pct: aciertos / n * 100, porNivel: porNivel, fallos: fallos, superados: superados };
    }
    function repaso(fallos) {
      if (!fallos.length) return TT.h('p', { 'class': 'tt-res-texto', texto: 'No has fallado ninguna: no hay nada que repasar.' });
      var ul = TT.h('ul', { 'class': 'tq-repaso-lista' });
      fallos.forEach(function (f) {
        ul.appendChild(TT.h('li', {}, TT.h('strong', { texto: f.t }), TT.h('span', { texto: 'Tu respuesta: ' + f.tuya + ' · Correcta: ' + f.correcta }), f.e ? TT.h('span', { 'class': 'tq-repaso-e', texto: f.e }) : null));
      });
      return TT.h('details', { 'class': 'tq-repaso', open: true }, TT.h('summary', { texto: 'Qué repasar (' + fallos.length + ')' }), ul);
    }
    function terminar() {
      pista.style.width = '100%';
      var ctx = calcular(), res = cfg.resultados[ctx.superados];
      var r = {
        titulo: cfg.titulo || 'Tu resultado', titular: res.n,
        valor: ctx.aciertos + ' de ' + ctx.n, unidad: ' aciertos',
        rango: { nombre: 'Nivel estimado: ' + res.n, texto: res.d },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Aciertos por franja' }), TT.graf.barras(ctx.porNivel.map(function (x) { return { nombre: x.nombre + ' (' + x.aciertos + '/' + x.total + ')', valor: Math.round(x.pct) }; }), { max: 100, unidad: ' %', descripcion: 'Porcentaje de aciertos en cada franja de dificultad' })),
          TT.h('p', { 'class': 'tt-res-texto', texto: 'Se da una franja por superada con un ' + Math.round(umbral * 100) + ' % de aciertos o más, siguiendo el orden de menor a mayor dificultad. Es una estimación orientativa, no un certificado.' }),
          repaso(ctx.fallos)),
        detalles: [['Aciertos', ctx.aciertos + ' de ' + ctx.n], ['Porcentaje', Math.round(ctx.pct) + ' %'], ['Franjas superadas', ctx.superados + ' de ' + L]],
        copia: (cfg.copia || 'Mi resultado:') + ' ' + res.n + ' (' + ctx.aciertos + ' de ' + ctx.n + ').',
        alRepetir: reiniciar, textoRepetir: 'Repetir el test'
      };
      if (cfg.ajustar) cfg.ajustar(ctx, r);
      caja.hidden = true;
      panel = TT.resultado(host, r);
      TT.anunciar('Resultado: ' + r.titular + '. ' + ctx.aciertos + ' aciertos de ' + ctx.n + '.');
      TT.enfocar(panel);
    }
    doc.addEventListener('keydown', function (e) {
      if (caja.hidden || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      var d = parseInt(e.key, 10);
      if (!respondida && d >= 1 && d <= P[i].orden.length) { e.preventDefault(); responder(P[i].orden[d - 1].k); }
    });
    reiniciar();
  };
})(window);

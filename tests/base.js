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

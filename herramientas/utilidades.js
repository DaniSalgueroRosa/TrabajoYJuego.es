/* PIEZAS COMUNES DE LAS HERRAMIENTAS: crear elementos, números y fechas en español, calculadoras, conversores, herramientas de texto,
   zonas para arrastrar archivos, entrega de resultados y carga de las librerías locales (PDF, ZIP).
   Todo cuelga de window.TH. IMPORTANTE: nada de esto guarda datos del usuario ni los envía a ningún sitio. Lo que escribes o subes se procesa
   en la propia página y desaparece al cerrarla: no se usa localStorage, sessionStorage, IndexedDB ni cookies (lo comprueba python3 sitio.py probar). */
(function (global) {
  'use strict';
  var TH = global.TH = global.TH || {};
  var doc = global.document;

  /* ============================================================ Números y textos (no necesitan página) */

  /* Lee un número escrito a la española: «1.234,56», «1234,5», «12,5 %», «3.5», «−2». Devuelve NaN si no es un número. */
  TH.num = function (t) {
    if (typeof t === 'number') return isFinite(t) ? t : NaN;
    if (t == null) return NaN;
    var s = String(t).replace(/[\s ]/g, '').replace(/[−–]/g, '-').replace(/[€%$]/g, '');
    if (!/^[-+]?[\d.,]+$/.test(s) || !/\d/.test(s)) return NaN;
    var c = s.lastIndexOf(','), p = s.lastIndexOf('.');
    if (c >= 0 && p >= 0) s = c > p ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (c >= 0) s = (s.match(/,/g) || []).length > 1 ? s.replace(/,/g, '') : s.replace(',', '.');
    else if (p >= 0) {
      var partes = s.split('.');
      if (partes.length > 2) s = s.replace(/\./g, '');                       // 1.234.567
      else if (/^[-+]?[1-9]\d{0,2}$/.test(partes[0]) && partes[1].length === 3) s = s.replace('.', '');   // 1.234 → 1234 (punto de millar)
    }
    var n = Number(s);
    return isFinite(n) ? n : NaN;
  };

  var formateadores = {};
  function formateador(min, max) {
    var k = min + '/' + max;
    return formateadores[k] || (formateadores[k] = new Intl.NumberFormat('es-ES', { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: 'always' }));
  }
  /* fmt(1234.5, 2) → «1.234,50»; fmt(0.5, [0, 4]) → «0,5». Sin decimales indicados: hasta 2. */
  TH.fmt = function (n, dec) {
    if (typeof n !== 'number' || !isFinite(n)) return '—';
    var min = 0, max = 2;
    if (Array.isArray(dec)) { min = dec[0]; max = dec[1]; } else if (typeof dec === 'number') { min = max = dec; }
    var r = formateador(min, max).format(Math.abs(n) < 5e-324 ? 0 : n);
    return r.replace(/^-0(?:,0+)?$/, function (m) { return m.slice(1); });
  };
  TH.eur = function (n, dec) { return TH.fmt(n, dec == null ? 2 : dec) + ' €'; };
  TH.pct = function (n, dec) { return TH.fmt(n, dec == null ? [0, 2] : dec) + ' %'; };
  /* Para conversores: de 1e-9 a 1e15 en notación normal, con hasta 12 cifras significativas; fuera de ahí, científica. */
  TH.auto = function (n) {
    if (typeof n !== 'number' || !isFinite(n)) return '—';
    if (n === 0) return '0';
    var a = Math.abs(n);
    if (a >= 1e-9 && a < 1e15) return formateador(0, 12).format(parseFloat(n.toPrecision(12)));
    var m = n.toExponential(6).split('e');
    return String(parseFloat(m[0])).replace('.', ',') + ' × 10^' + parseInt(m[1], 10);
  };
  TH.tamano = function (b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return TH.fmt(b / 1024, 1) + ' KB';
    if (b < 1073741824) return TH.fmt(b / 1048576, 2) + ' MB';
    return TH.fmt(b / 1073741824, 2) + ' GB';
  };
  /* Redondeo decimal exacto (2,675 → 2,68). modo: 'normal' (mitad alejándose de cero), 'abajo', 'arriba', 'cero' (truncar) o 'par' (mitad al par, «bancario»). dec puede ser negativo (-1 = decenas). */
  TH.redondear = function (n, dec, modo) {
    if (!isFinite(n)) return n;
    dec = dec || 0; modo = modo || 'normal';
    var s = String(Math.abs(n)), sig = n < 0 ? -1 : 1, d;
    if (/e/i.test(s)) d = Math.abs(n) * Math.pow(10, dec); else d = Number(s + 'e' + dec);
    var piso = Math.floor(d), frac = d - piso, r;
    var esMitad = Math.abs(frac - 0.5) < 1e-9;
    if (modo === 'abajo') r = sig > 0 ? piso : (frac > 1e-9 ? piso + 1 : piso);
    else if (modo === 'arriba') r = sig > 0 ? (frac > 1e-9 ? piso + 1 : piso) : piso;
    else if (modo === 'cero') r = piso;
    else if (modo === 'par') r = esMitad ? (piso % 2 === 0 ? piso : piso + 1) : Math.round(d);
    else r = esMitad ? piso + 1 : Math.round(d);
    var v = sig * r;
    if (modo === 'abajo' || modo === 'arriba') { v = modo === 'abajo' ? (sig > 0 ? piso : -Math.ceil(d - 1e-9)) : (sig > 0 ? Math.ceil(d - 1e-9) : -piso); }
    var salida = Number(String(v) + 'e' + (-dec));
    return isFinite(salida) ? salida + 0 : v / Math.pow(10, dec);
  };
  TH.escapar = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  TH.norm = function (t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  TH.pausa = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ---- Fechas: siempre a mediodía UTC para que el cambio de hora no cuente días de más o de menos */
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  TH.MESES = MESES; TH.DIAS = DIAS;
  TH.fechaUTC = function (iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
    return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : null;
  };
  TH.iso = function (d) { return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); };
  TH.ahora = function () { return Date.now(); };                               // un solo reloj para las herramientas de tiempo (las pruebas lo sustituyen)
  TH.hoyISO = function () { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  TH.dias = function (a, b) { return Math.round((b - a) / 86400000); };
  TH.sumarDias = function (d, n) { return new Date(d.getTime() + n * 86400000); };
  TH.fechaLarga = function (d) { return DIAS[d.getUTCDay()] + ', ' + d.getUTCDate() + ' de ' + MESES[d.getUTCMonth()] + ' de ' + d.getUTCFullYear(); };
  TH.fechaCorta = function (d) { return ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '/' + d.getUTCFullYear(); };
  TH.pl = function (n, uno, otros) { return TH.fmt(n, [0, 2]) + ' ' + (n === 1 ? uno : otros); };

  if (!doc) return;                                                              // (sin navegador solo existen las utilidades de arriba)

  /* ============================================================ Dirección de la raíz y datos */
  var origen = doc.currentScript && doc.currentScript.src;
  TH.raiz = origen ? new URL('../../', origen).href : '/';
  TH.url = function (ruta) { return new URL(ruta, TH.raiz).href; };
  TH.cargarJSON = function (url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('No se pudo leer ' + url + ' (error ' + r.status + ')');
      return r.json();
    });
  };
  TH.datos = function (ruta) { return TH.cargarJSON(TH.url('herramientas/' + ruta)); };   // TH.datos('mi-herramienta/datos.json'), TH.datos('datos/algo.json')

  var scripts = {};
  TH.script = function (ruta) {                                                  // carga una librería de herramientas/datos/ una sola vez
    if (scripts[ruta]) return scripts[ruta];
    return scripts[ruta] = new Promise(function (ok, mal) {
      var s = doc.createElement('script');
      s.src = TH.url('herramientas/datos/' + ruta);
      s.onload = function () { ok(); };
      s.onerror = function () { delete scripts[ruta]; mal(new Error('No se pudo cargar ' + ruta)); };
      doc.head.appendChild(s);
    });
  };
  TH.pdfLib = function () { return TH.script('vendor/pdf-lib.min.js').then(function () { return global.PDFLib; }); };
  TH.jszip = function () { return TH.script('vendor/jszip.min.js').then(function () { return global.JSZip; }); };
  TH.pdfjs = function () {
    if (!TH._pdfjs) TH._pdfjs = import(TH.url('herramientas/datos/vendor/pdf.min.js')).then(function (m) {
      m.GlobalWorkerOptions.workerSrc = TH.url('herramientas/datos/vendor/pdf.worker.min.js');
      return m;
    });
    return TH._pdfjs;
  };

  /* ============================================================ DOM */
  TH.$ = function (s, dentro) { return (dentro || doc).querySelector(s); };
  TH.$$ = function (s, dentro) { return Array.prototype.slice.call((dentro || doc).querySelectorAll(s)); };
  TH.vaciar = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  function anadir(el, hijo) {
    if (hijo == null || hijo === false) return;
    if (Array.isArray(hijo)) { hijo.forEach(function (x) { anadir(el, x); }); return; }
    el.appendChild(typeof hijo === 'object' ? hijo : doc.createTextNode(String(hijo)));
  }
  /* h('button', { class: 'boton', type: 'button', onclick: fn }, 'Texto', [otros hijos]) */
  TH.h = function (etiqueta, atributos) {
    var el = doc.createElement(etiqueta);
    Object.keys(atributos || {}).forEach(function (k) {
      var v = atributos[k];
      if (v === false || v == null) return;
      if (k === 'texto') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;   /* por el CSSOM, no con setAttribute: la política de contenido (CSP) del sitio no admite estilos en línea */
      else if (k === 'value') el.value = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) anadir(el, arguments[i]);
    return el;
  };
  var h = TH.h;

  /* Sonido de aviso: TH.audio() se llama desde un clic (los navegadores no dejan sonar sin una acción de la persona); TH.pitar(3) suena tres veces */
  var ctxAudio = null;
  TH.audio = function () {
    try {
      var C = global.AudioContext || global.webkitAudioContext;
      if (!C) return null;
      if (!ctxAudio) ctxAudio = new C();
      if (ctxAudio.state === 'suspended') ctxAudio.resume();
    } catch (x) { ctxAudio = null; }
    return ctxAudio;
  };
  TH.pitar = function (veces) {
    var a = TH.audio();
    if (!a) return;
    for (var i = 0; i < (veces || 1); i++) {
      var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + i * 0.4;
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.3);
    }
  };

  var anuncio = null, temporizadorAnuncio = null;
  TH.anunciar = function (texto) {
    if (!anuncio) { anuncio = h('div', { class: 'solo-lectores', role: 'status', 'aria-live': 'polite' }); doc.body.appendChild(anuncio); }
    clearTimeout(temporizadorAnuncio);
    temporizadorAnuncio = setTimeout(function () { anuncio.textContent = texto; }, 500);
  };

  /* Mensajes de estado dentro de la herramienta: poner('Listo', 'ok'), poner('No se pudo…', 'error'), limpiar() */
  TH.estado = function (contenedor) {
    var caja = h('div', { class: 'herr-estado', hidden: true });
    contenedor.appendChild(caja);
    return {
      nodo: caja,
      poner: function (texto, tipo) {
        caja.hidden = false; caja.className = 'herr-estado herr-estado--' + (tipo || 'info');
        caja.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
        caja.textContent = texto;
      },
      limpiar: function () { caja.hidden = true; caja.textContent = ''; }
    };
  };

  /* ---- Portapapeles y descargas */
  TH.copiar = function (texto, estado) {
    TH.ultimoCopiado = texto;
    function listo() { if (estado) { estado.poner('Copiado al portapapeles.', 'ok'); setTimeout(function () { estado.limpiar(); }, 2500); } }
    function plan_b() {
      var t = h('textarea', { 'aria-hidden': 'true', tabindex: '-1', style: 'position:fixed;left:-9999px;top:0' }); t.value = texto;
      doc.body.appendChild(t); t.select();
      var ok = false; try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
      doc.body.removeChild(t);
      if (ok) listo(); else if (estado) estado.poner('Tu navegador no deja copiar desde aquí. Selecciona el texto y cópialo a mano.', 'error');
    }
    if (global.navigator.clipboard && global.isSecureContext) global.navigator.clipboard.writeText(texto).then(listo, plan_b); else plan_b();
  };
  TH.descargar = function (datos, nombre, mime) {
    var blob = datos instanceof Blob ? datos : new Blob([datos], { type: mime || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: nombre, hidden: true });
    doc.body.appendChild(a); a.click(); doc.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  };
  /* Muestra los archivos listos con su botón de descarga: [{ nombre, blob (o datos+mime), nota }]. Quedan en TH.entregas (solo en memoria). */
  TH.entrega = function (zona, archivos, titulo) {
    archivos = archivos.map(function (a) { return { nombre: a.nombre, blob: a.blob || new Blob([a.datos], { type: a.mime || 'application/octet-stream' }), nota: a.nota }; });
    TH.entregas = archivos;
    TH.vaciar(zona).hidden = false;
    zona.classList.add('herr-entrega');
    zona.appendChild(h('p', { class: 'herr-entrega-titulo', texto: titulo || (archivos.length === 1 ? 'Tu archivo está listo' : 'Tus ' + archivos.length + ' archivos están listos') }));
    var ul = h('ul', { class: 'herr-entrega-lista' });
    archivos.forEach(function (a) {
      ul.appendChild(h('li', {},
        h('span', { class: 'herr-entrega-nombre' }, a.nombre, ' ', h('span', { class: 'herr-chico', texto: '(' + TH.tamano(a.blob.size) + ')' }), a.nota ? h('span', { class: 'herr-chico', texto: ' · ' + a.nota }) : null),
        h('button', { class: 'boton', type: 'button', onclick: function () { TH.descargar(a.blob, a.nombre); } }, 'Descargar')));
    });
    zona.appendChild(ul);
    if (archivos.length > 1 && archivos.every(function (a) { return a.blob.size; })) {
      zona.appendChild(h('div', { class: 'herr-acciones' }, h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () {
        TH.jszip().then(function (JSZip) {
          var z = new JSZip(); archivos.forEach(function (a) { z.file(a.nombre, a.blob); });
          return z.generateAsync({ type: 'blob' });
        }).then(function (b) { TH.descargar(b, 'archivos.zip'); });
      } }, 'Descargar todo en un ZIP')));
    }
  };
  TH.leer = function (archivo, como) {
    return new Promise(function (ok, mal) {
      var r = new FileReader();
      r.onload = function () { ok(r.result); };
      r.onerror = function () { mal(new Error('No se pudo leer «' + archivo.name + '».')); };
      if (como === 'texto') r.readAsText(archivo); else if (como === 'url') r.readAsDataURL(archivo); else r.readAsArrayBuffer(archivo);
    });
  };
  TH.progreso = function (zona) {
    var p = h('progress', { class: 'herr-progreso', max: '100', value: '0', 'aria-label': 'Progreso' });
    var et = h('span', { class: 'herr-chico' });
    var caja = h('div', { class: 'herr-progreso-caja', hidden: true }, p, et);
    zona.appendChild(caja);
    return { nodo: caja, poner: function (v, texto) { caja.hidden = false; p.value = Math.round(v); et.textContent = texto || ''; }, ocultar: function () { caja.hidden = true; } };
  };

  /* ============================================================ Campos de formulario */
  var contador = 0;
  function campoNumero(def, id) {
    var el = h('input', { id: id, type: 'text', inputmode: def.entero ? 'numeric' : 'decimal', autocomplete: 'off', placeholder: def.ph || '', value: def.valor != null ? String(def.valor).replace('.', ',') : '', 'aria-describedby': def.ayuda ? id + '-ayuda' : null });
    return { el: el, leer: function () { return TH.num(el.value); }, poner: function (v) { el.value = v == null ? '' : String(v).replace('.', ','); } };
  }
  function crearCampo(def, notificar) {
    var id = 'c-' + def.id, c;
    switch (def.tipo || 'numero') {
      case 'select':
        var sel = h('select', { id: id }, def.opciones.map(function (o) { return h('option', { value: Array.isArray(o) ? o[0] : o, selected: String(Array.isArray(o) ? o[0] : o) === String(def.valor) }, Array.isArray(o) ? o[1] : o); }));
        c = { el: sel, leer: function () { return sel.value; }, poner: function (v) { sel.value = v; } }; break;
      case 'check':
        var chk = h('input', { id: id, type: 'checkbox', checked: !!def.valor });
        c = { el: chk, leer: function () { return chk.checked; }, poner: function (v) { chk.checked = !!v; }, enLinea: true }; break;
      case 'fecha':
        var fe = h('input', { id: id, type: 'date', value: def.valor === 'hoy' ? TH.hoyISO() : (def.valor || '') });
        c = { el: fe, leer: function () { return fe.value; }, poner: function (v) { fe.value = v === 'hoy' ? TH.hoyISO() : (v || ''); } }; break;
      case 'hora':
        var ho = h('input', { id: id, type: 'time', value: def.valor || '' });
        c = { el: ho, leer: function () { return ho.value; }, poner: function (v) { ho.value = v || ''; } }; break;
      case 'texto':
        var te = h('input', { id: id, type: def.subtipo || 'text', autocomplete: 'off', placeholder: def.ph || '', value: def.valor || '', maxlength: def.max });
        c = { el: te, leer: function () { return te.value; }, poner: function (v) { te.value = v == null ? '' : v; } }; break;
      case 'area':
        var ar = h('textarea', { id: id, rows: def.filas || 5, placeholder: def.ph || '', spellcheck: 'false' }); ar.value = def.valor || '';
        c = { el: ar, leer: function () { return ar.value; }, poner: function (v) { ar.value = v == null ? '' : v; } }; break;
      case 'lista':
        return campoLista(def, id, notificar);
      default:
        c = campoNumero(def, id);
    }
    c.def = def;
    var evento = def.tipo === 'select' || def.tipo === 'check' || def.tipo === 'fecha' ? 'change' : 'input';
    c.el.addEventListener(evento, notificar);
    if (evento === 'change') c.el.addEventListener('input', notificar);
    var etiqueta = h('label', { for: id }, def.etiqueta);
    var nodo = h('div', { class: 'campo' + (def.ancho === 'completo' ? ' campo--completo' : '') + (c.enLinea ? ' campo--check' : '') });
    if (c.enLinea) nodo.appendChild(h('span', { class: 'campo-check' }, c.el, etiqueta));
    else nodo.appendChild(etiqueta);
    if (def.unidad && !c.enLinea) nodo.appendChild(h('span', { class: 'campo-caja' }, c.el, h('span', { class: 'campo-unidad', 'aria-hidden': 'true', texto: def.unidad })));
    else if (!c.enLinea) nodo.appendChild(c.el);
    if (def.ayuda) nodo.appendChild(h('span', { class: 'campo-ayuda', id: id + '-ayuda', texto: def.ayuda }));
    c.nodo = nodo;
    return c;
  }

  /* Lista de filas repetibles: { tipo: 'lista', id, etiqueta, columnas: [{ id, etiqueta, tipo: 'numero'|'texto', valor, ph }], inicial: 3, min: 1, max: 30, textoAnadir } */
  function campoLista(def, id, notificar) {
    var cuerpo = h('div', { class: 'lista-filas', id: id });
    var filas = [];
    function nueva(valores) {
      var n = filas.length + 1, fila = { celdas: {} };
      var nodo = h('div', { class: 'lista-fila' });
      def.columnas.forEach(function (col) {
        var idc = id + '-' + n + '-' + col.id, celda;
        if (col.tipo === 'texto') { var t = h('input', { id: idc, type: 'text', autocomplete: 'off', placeholder: col.ph || '', value: valores && valores[col.id] != null ? valores[col.id] : (col.valor || '') }); celda = { el: t, leer: function () { return t.value; } }; }
        else { celda = campoNumero({ valor: valores && valores[col.id] != null ? valores[col.id] : col.valor, ph: col.ph, entero: col.entero }, idc); }
        celda.el.addEventListener('input', notificar);
        celda.el.setAttribute('aria-label', col.etiqueta + ', fila ' + n);
        fila.celdas[col.id] = celda;
        nodo.appendChild(h('div', { class: 'lista-celda' }, h('span', { class: 'lista-etiqueta', 'aria-hidden': 'true', texto: col.etiqueta }), celda.el));
      });
      var quitar = h('button', { class: 'boton boton--secundario boton--chico', type: 'button', 'aria-label': 'Quitar la fila ' + n, onclick: function () {
        if (filas.length <= (def.min || 1)) return;
        filas.splice(filas.indexOf(fila), 1); nodo.remove(); renumerar(); notificar();
      } }, 'Quitar');
      nodo.appendChild(quitar);
      fila.nodo = nodo; fila.quitar = quitar; filas.push(fila); cuerpo.appendChild(nodo);
    }
    function renumerar() {
      filas.forEach(function (f, i) {
        var n = i + 1;
        def.columnas.forEach(function (col) { f.celdas[col.id].el.setAttribute('aria-label', col.etiqueta + ', fila ' + n); });
        f.quitar.setAttribute('aria-label', 'Quitar la fila ' + n);
        f.quitar.disabled = filas.length <= (def.min || 1);
      });
      anadir.disabled = !!def.max && filas.length >= def.max;
    }
    var anadir = h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { nueva(); renumerar(); notificar(); filas[filas.length - 1].celdas[def.columnas[0].id].el.focus(); } }, def.textoAnadir || 'Añadir fila');
    function poner(lista) {
      TH.vaciar(cuerpo); filas = [];
      (lista && lista.length ? lista : [{}]).forEach(function (v) { nueva(v); });
      renumerar();
    }
    for (var i = 0; i < (def.inicial || def.min || 1); i++) nueva();
    renumerar();
    var nodo = h('div', { class: 'campo campo--completo campo--lista', role: 'group', 'aria-label': def.etiqueta },
      h('span', { class: 'campo-titulo', texto: def.etiqueta }), cuerpo, h('div', { class: 'herr-acciones' }, anadir));
    return {
      def: def, nodo: nodo, el: cuerpo,
      leer: function () {
        return filas.map(function (f) {
          var o = {}; def.columnas.forEach(function (col) { o[col.id] = f.celdas[col.id].leer(); }); return o;
        });
      },
      poner: poner
    };
  }

  /* ============================================================ Calculadora */
  /* TH.calculadora(raiz, { campos: [...], calcular(v) → { filas: [...], tabla, notas, texto } | { error } | { vacio: true }, ejemplo: { id: valor }, alCambiar })
     Una fila de resultado se crea con TH.fila(clave, 'Etiqueta', valor, 'eur'|'pct'|'n0'|'n2'|'n4'|'txt'|función). La primera es la destacada. */
  var FORMATOS = {
    eur: function (n) { return TH.eur(n); }, pct: function (n) { return TH.pct(n); }, n0: function (n) { return TH.fmt(n, 0); },
    n1: function (n) { return TH.fmt(n, 1); }, n2: function (n) { return TH.fmt(n, 2); }, n3: function (n) { return TH.fmt(n, 3); }, n4: function (n) { return TH.fmt(n, [0, 4]); },
    auto: function (n) { return TH.auto(n); }, txt: function (n) { return String(n); }
  };
  TH.listos = function (v, ids) { return ids.every(function (k) { return typeof v[k] === 'number' && isFinite(v[k]); }); };
  TH.fila = function (k, etiqueta, valor, formato) {
    var f = typeof formato === 'function' ? formato : FORMATOS[formato || 'n2'];
    return { k: k, t: etiqueta, v: valor, f: typeof valor === 'number' || formato === 'txt' ? f(valor) : String(valor) };
  };
  /* Lista de resultados lista para insertar: TH.listaFilas([TH.fila(...), ...]) → <dl class="herr-res"> (las filas nulas se ignoran) */
  TH.listaFilas = function (filas) {
    var dl = h('dl', { class: 'herr-res' });
    filas.forEach(function (f) { if (f) dl.appendChild(h('div', { class: 'herr-fila' }, h('dt', { texto: f.t }), h('dd', { 'data-k': f.k, 'data-v': String(f.v), texto: f.f }))); });
    return dl;
  };


  function pintarTabla(t) {
    var tabla = h('table', { class: 'herr-tabla' },
      t.titulo ? h('caption', { texto: t.titulo }) : null,
      h('thead', {}, h('tr', {}, t.cab.map(function (c) { return h('th', { scope: 'col', texto: c }); }))),
      h('tbody', {}, t.filas.map(function (f) { return h('tr', {}, f.map(function (c, i) { return i === 0 && t.cabFila ? h('th', { scope: 'row', texto: c }) : h('td', { texto: c }); })); })));
    return h('div', { class: 'herr-tabla-caja', tabindex: '0', role: 'region', 'aria-label': t.titulo || 'Tabla de resultados' }, tabla);
  }

  TH.calculadora = function (raiz, cfg) {
    TH.vaciar(raiz);
    var estado, campos = [], salida = h('div', { class: 'herr-salida' });
    var form = h('form', { class: 'herr-form', novalidate: true, onsubmit: function (e) { e.preventDefault(); } });
    var rejilla = h('div', { class: 'herr-campos' });
    form.appendChild(rejilla);
    cfg.campos.forEach(function (d) {
      var c = crearCampo(d, actualizar); campos.push(c); rejilla.appendChild(c.nodo);
    });
    var acciones = h('div', { class: 'herr-acciones' });
    if (cfg.ejemplo) acciones.appendChild(h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { poner(cfg.ejemplo); } }, 'Rellenar con un ejemplo'));
    acciones.appendChild(h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { limpiar(); } }, 'Borrar todo'));
    form.appendChild(acciones);
    raiz.appendChild(form);
    raiz.appendChild(salida);
    estado = TH.estado(raiz);

    function valores() { var v = {}; campos.forEach(function (c) { v[c.def.id] = c.leer(); }); return v; }
    function poner(obj) { campos.forEach(function (c) { if (obj[c.def.id] !== undefined) c.poner(obj[c.def.id]); }); actualizar(); }
    function limpiar() {
      campos.forEach(function (c) {
        var d = c.def;
        if (d.tipo === 'lista') c.poner(null); else if (d.tipo === 'check') c.poner(!!d.valor); else if (d.tipo === 'select') c.poner(d.valor != null ? d.valor : c.el.options[0].value);
        else c.poner(d.valor != null ? d.valor : '');
      });
      actualizar();
    }
    function actualizar() {
      var v = valores(), r, malos = [];
      campos.forEach(function (c) {
        if (c.def.mostrarSi) c.nodo.hidden = !c.def.mostrarSi(v);
        if ((c.def.tipo || 'numero') === 'numero') {
          var mal = c.el.value.trim() !== '' && isNaN(v[c.def.id]);
          if (mal) c.el.setAttribute('aria-invalid', 'true'); else c.el.removeAttribute('aria-invalid');
          if (mal && !c.nodo.hidden) malos.push(c.def.etiqueta);
        }
      });
      try { r = malos.length ? { error: 'Revisa «' + malos[0] + '»: no es un número válido. Escríbelo con cifras y, si tiene decimales, con coma o punto.' } : cfg.calcular(v); } catch (e) { r = { error: 'No se ha podido calcular con esos datos. Revisa que sean números y fechas válidas.' }; global.__THerror = e; }
      pintar(r || { vacio: true }, v);
      if (cfg.alCambiar) cfg.alCambiar(v, r);
    }
    function pintar(r, v) {
      TH.vaciar(salida);
      if (r.vacio) { salida.appendChild(h('p', { class: 'herr-vacio', texto: cfg.vacio || 'Rellena los datos y aquí verás el resultado al instante.' })); TH.resultado = null; return; }
      if (r.error) { salida.appendChild(h('p', { class: 'herr-estado herr-estado--error', role: 'alert', 'data-k': 'error', texto: r.error })); TH.resultado = { error: r.error }; return; }
      var lista = h('dl', { class: 'herr-res' });
      (r.filas || []).forEach(function (f, i) {
        lista.appendChild(h('div', { class: 'herr-fila' + (i === 0 && !r.sinDestacar ? ' herr-fila--destacada' : '') },
          h('dt', { texto: f.t }), h('dd', { 'data-k': f.k, 'data-v': typeof f.v === 'number' ? String(f.v) : f.f, texto: f.nodo ? null : f.f }, f.nodo || null)));
      });
      if (r.filas && r.filas.length) salida.appendChild(lista);
      (r.avisos || []).forEach(function (a) { salida.appendChild(h('p', { class: 'herr-estado herr-estado--aviso', role: 'note', texto: a })); });
      if (r.tabla) salida.appendChild(pintarTabla(r.tabla));
      (r.notas || []).forEach(function (n) { salida.appendChild(h('p', { class: 'herr-nota', texto: n })); });
      var texto = r.texto || (r.filas || []).map(function (f) { return f.t + ': ' + f.f; }).join('\n') + (r.tabla ? '\n\n' + [r.tabla.cab.join('\t')].concat(r.tabla.filas.map(function (f) { return f.join('\t'); })).join('\n') : '');
      salida.appendChild(h('div', { class: 'herr-acciones' }, h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { TH.copiar(texto, estado); } }, 'Copiar resultado')));
      TH.resultado = { filas: r.filas || [], texto: texto };
      if (r.filas && r.filas[0]) TH.anunciar(r.filas[0].t + ': ' + r.filas[0].f);
    }
    actualizar();
    return { actualizar: actualizar, poner: poner, valores: valores, limpiar: limpiar, campo: function (id) { return campos.filter(function (c) { return c.def.id === id; })[0]; } };
  };

  /* ============================================================ Conversor de unidades */
  /* TH.conversor(raiz, { unidades: [{ id, n: 'Metro', s: 'm', f: 1 }] (f = cuántas unidades base vale 1; o { a(x)→base, de(base)→x }), de, a, valor }) */
  TH.conversor = function (raiz, cfg) {
    TH.vaciar(raiz);
    var por = {}; cfg.unidades.forEach(function (u) { por[u.id] = u; });
    function aBase(u, x) { return u.a ? u.a(x) : x * u.f; }
    function deBase(u, x) { return u.de ? u.de(x) : x / u.f; }
    var opciones = function (sel) { return cfg.unidades.map(function (u) { return h('option', { value: u.id, selected: u.id === sel }, u.n + (u.s ? ' (' + u.s + ')' : '')); }); };
    var entrada = h('input', { id: 'c-valor', type: 'text', inputmode: 'decimal', autocomplete: 'off', value: String(cfg.valor == null ? 1 : cfg.valor).replace('.', ',') });
    var de = h('select', { id: 'c-de' }, opciones(cfg.de)), a = h('select', { id: 'c-a' }, opciones(cfg.a));
    var cambiar = h('button', { class: 'boton boton--secundario', type: 'button', 'aria-label': 'Intercambiar origen y destino', onclick: function () { var t = de.value; de.value = a.value; a.value = t; actualizar(); } }, '⇄ Intercambiar');
    var form = h('form', { class: 'herr-form', novalidate: true, onsubmit: function (e) { e.preventDefault(); } },
      h('div', { class: 'herr-campos herr-campos--conversor' },
        h('div', { class: 'campo' }, h('label', { for: 'c-valor', texto: 'Cantidad' }), entrada),
        h('div', { class: 'campo' }, h('label', { for: 'c-de', texto: 'De' }), de),
        h('div', { class: 'campo' }, h('label', { for: 'c-a', texto: 'A' }), a)),
      h('div', { class: 'herr-acciones' }, cambiar));
    var salida = h('div', { class: 'herr-salida' });
    var estado = TH.estado(raiz);
    raiz.appendChild(form); raiz.appendChild(salida);
    [entrada, de, a].forEach(function (el) { el.addEventListener('input', actualizar); el.addEventListener('change', actualizar); });
    function actualizar() {
      TH.vaciar(salida);
      var x = TH.num(entrada.value);
      if (isNaN(x)) { salida.appendChild(h('p', { class: 'herr-vacio', texto: 'Escribe una cantidad para convertirla al instante.' })); return; }
      var u1 = por[de.value], u2 = por[a.value], base = aBase(u1, x), r = deBase(u2, base);
      if (cfg.valida && cfg.valida(base) === false) { salida.appendChild(h('p', { class: 'herr-estado herr-estado--error', role: 'alert', 'data-k': 'error', texto: cfg.mensajeInvalido || 'Ese valor no es posible en esta unidad.' })); return; }
      var principal = TH.auto(r) + (u2.s ? ' ' + u2.s : '');
      salida.appendChild(h('div', { class: 'herr-res' }, h('div', { class: 'herr-fila herr-fila--destacada' },
        h('dt', { texto: TH.auto(x) + (u1.s ? ' ' + u1.s : '') + ' equivalen a' }), h('dd', { 'data-k': 'resultado', 'data-v': String(r), texto: principal }))));
      var filas = cfg.unidades.map(function (u) { var y = deBase(u, base); return [u.n + (u.s ? ' (' + u.s + ')' : ''), TH.auto(y), y, u.id]; });
      var tabla = h('table', { class: 'herr-tabla' }, h('caption', { texto: 'Todas las unidades' }),
        h('thead', {}, h('tr', {}, h('th', { scope: 'col', texto: 'Unidad' }), h('th', { scope: 'col', texto: 'Equivale a' }))),
        h('tbody', {}, filas.map(function (f) { return h('tr', {}, h('th', { scope: 'row', texto: f[0] }), h('td', { 'data-k': 'u-' + f[3], 'data-v': String(f[2]), texto: f[1] })); })));
      salida.appendChild(h('div', { class: 'herr-tabla-caja', tabindex: '0', role: 'region', 'aria-label': 'Todas las unidades' }, tabla));
      var texto = TH.auto(x) + ' ' + (u1.s || u1.n) + ' = ' + TH.auto(r) + ' ' + (u2.s || u2.n);
      salida.appendChild(h('div', { class: 'herr-acciones' }, h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { TH.copiar(texto, estado); } }, 'Copiar resultado')));
      TH.resultado = { texto: texto, v: r };
      TH.anunciar(texto);
    }
    actualizar();
    return { actualizar: actualizar };
  };

  /* Lista de «caracteres» tal como los ve una persona (un emoji con tono de piel o una letra con tilde combinada cuentan como uno). */
  TH.grafemas = function (t) {
    t = String(t == null ? '' : t);
    if (global.Intl && global.Intl.Segmenter) return Array.from(new global.Intl.Segmenter('es', { granularity: 'grapheme' }).segment(t), function (s) { return s.segment; });
    return Array.from(t);
  };
  /* Palabra: letras y cifras, con apóstrofo o guion en medio (bien-hecho, l'eau). */
  TH.RE_PALABRA = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;

  /* ============================================================ Herramientas de texto */
  /* TH.texto(raiz, { entrada: { etiqueta, ph, ejemplo }, opciones: [campos], procesar(texto, op) → texto | { salida, filas, avisos }, salida: { etiqueta }, descargar: { nombre, mime },
                      sinEntrada: true (la herramienta genera sin texto de partida), soloLectura: true }) */
  TH.texto = function (raiz, cfg) {
    TH.vaciar(raiz);
    var estado, opciones = [];
    var entrada = h('textarea', { id: 't-entrada', rows: cfg.filas || 9, placeholder: (cfg.entrada && cfg.entrada.ph) || '', spellcheck: 'false' });
    var salida = h('textarea', { id: 't-salida', rows: cfg.filas || 9, readonly: true, 'aria-live': 'off' });
    var medidas = h('div', { class: 'herr-salida herr-salida--texto' });
    var rejillaOpc = h('div', { class: 'herr-campos' });
    (cfg.opciones || []).forEach(function (d) { var c = crearCampo(d, actualizar); opciones.push(c); rejillaOpc.appendChild(c.nodo); });
    var botones = h('div', { class: 'herr-acciones' });
    var etEntrada = (cfg.entrada && cfg.entrada.etiqueta) || 'Tu texto';
    var etSalida = (cfg.salida && cfg.salida.etiqueta) || 'Resultado';
    var cols = h('div', { class: 'herr-dos' },
      cfg.sinEntrada ? null : h('div', { class: 'campo' }, h('label', { for: 't-entrada', texto: etEntrada }), entrada),
      h('div', { class: 'campo' }, h('label', { for: 't-salida', texto: etSalida }), salida));
    raiz.appendChild(cols);
    if (opciones.length) raiz.appendChild(rejillaOpc);
    raiz.appendChild(botones); raiz.appendChild(medidas);
    estado = TH.estado(raiz);
    botones.appendChild(h('button', { class: 'boton', type: 'button', id: 't-copiar', onclick: function () { TH.copiar(salida.value, estado); } }, 'Copiar resultado'));
    if (cfg.descargar) botones.appendChild(h('button', { class: 'boton boton--secundario', type: 'button', id: 't-descargar', onclick: function () { TH.descargar(salida.value, cfg.descargar.nombre, cfg.descargar.mime || 'text/plain;charset=utf-8'); } }, 'Descargar'));
    if (cfg.entrada && cfg.entrada.ejemplo != null) botones.appendChild(h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { entrada.value = cfg.entrada.ejemplo; actualizar(); } }, 'Probar con un ejemplo'));
    if (!cfg.sinEntrada) botones.appendChild(h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { entrada.value = ''; actualizar(); entrada.focus(); } }, 'Borrar'));
    if (cfg.botones) cfg.botones.forEach(function (b) { botones.appendChild(h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { b.accion(api); } }, b.texto)); });
    entrada.addEventListener('input', actualizar);

    function valores() { var v = {}; opciones.forEach(function (c) { v[c.def.id] = c.leer(); }); return v; }
    function actualizar() {
      var v = valores();
      opciones.forEach(function (c) { if (c.def.mostrarSi) c.nodo.hidden = !c.def.mostrarSi(v); });
      var r;
      try { r = cfg.procesar(entrada.value, v, api); } catch (e) { r = { salida: '', avisos: [e && e.message ? e.message : 'No se ha podido procesar el texto.'] }; global.__THerror = e; }
      if (typeof r === 'string') r = { salida: r };
      salida.value = r.salida == null ? '' : r.salida;
      TH.vaciar(medidas);
      if (r.filas && r.filas.length) {
        var dl = h('dl', { class: 'herr-res herr-res--compacto' });
        r.filas.forEach(function (f) { dl.appendChild(h('div', { class: 'herr-fila' }, h('dt', { texto: f.t }), h('dd', { 'data-k': f.k, 'data-v': typeof f.v === 'number' ? String(f.v) : f.f, texto: f.f }))); });
        medidas.appendChild(dl);
      }
      (r.avisos || []).forEach(function (a) { medidas.appendChild(h('p', { class: 'herr-estado herr-estado--aviso', role: 'status', texto: a })); });
      (r.html ? [r.html] : []).forEach(function (n) { medidas.appendChild(n); });
    }
    var api = { entrada: entrada, salida: salida, actualizar: actualizar, valores: valores, estado: estado };
    actualizar();
    return api;
  };

  /* ============================================================ Zona para arrastrar archivos */
  /* TH.archivos(raiz, { aceptar: '.pdf,application/pdf', multiple, texto, alElegir(listaDeFiles) }) → { archivos(), vaciar() }
     Mantiene la lista visible con orden y quitar. */
  TH.archivos = function (raiz, cfg) {
    var lista = [], estado = TH.estado(raiz);
    var entrada = h('input', { type: 'file', id: 'f-archivos', class: 'herr-zona-entrada', accept: cfg.aceptar || null, multiple: !!cfg.multiple });
    var etiqueta = h('label', { class: 'boton', for: 'f-archivos' }, cfg.multiple ? 'Elegir archivos' : 'Elegir archivo');
    var zona = h('div', { class: 'herr-zona' },
      h('p', { class: 'herr-zona-texto', texto: cfg.texto || (cfg.multiple ? 'Arrastra aquí tus archivos o elígelos desde tu dispositivo.' : 'Arrastra aquí tu archivo o elígelo desde tu dispositivo.') }),
      h('div', { class: 'herr-acciones' }, entrada, etiqueta),
      h('p', { class: 'herr-chico', texto: cfg.pie || 'Los archivos no salen de tu dispositivo: se procesan aquí mismo, en tu navegador.' }));
    var caja = h('ul', { class: 'herr-archivos', 'aria-label': 'Archivos elegidos' });
    raiz.appendChild(zona); raiz.appendChild(caja);
    function aceptable(f) {
      if (!cfg.aceptar) return true;
      return cfg.aceptar.split(',').some(function (a) {
        a = a.trim().toLowerCase();
        if (a.charAt(0) === '.') return f.name.toLowerCase().slice(-a.length) === a;
        if (a.slice(-2) === '/*') return f.type.indexOf(a.slice(0, -1)) === 0;
        return f.type === a;
      });
    }
    function anadirArchivos(fs) {
      var buenos = [].filter.call(fs, aceptable), malos = fs.length - buenos.length;
      if (malos) estado.poner(malos + (malos === 1 ? ' archivo no es de un tipo admitido y se ha ignorado.' : ' archivos no son de un tipo admitido y se han ignorado.') + (cfg.aceptarTexto ? ' Aquí se admiten: ' + cfg.aceptarTexto + '.' : ''), 'aviso'); else estado.limpiar();
      if (!buenos.length) return;
      if (cfg.multiple) buenos.forEach(function (f) { lista.push(f); }); else lista = [buenos[0]];
      if (cfg.max && lista.length > cfg.max) { lista = lista.slice(0, cfg.max); estado.poner('Se admiten como mucho ' + cfg.max + ' archivos; sobran los últimos.', 'aviso'); }
      pintar(); if (cfg.alCambiar) cfg.alCambiar(lista);
    }
    function pintar() {
      TH.vaciar(caja);
      lista.forEach(function (f, i) {
        var mover = function (d) { return function () { var j = i + d; if (j < 0 || j >= lista.length) return; var t = lista[i]; lista[i] = lista[j]; lista[j] = t; pintar(); if (cfg.alCambiar) cfg.alCambiar(lista); }; };
        caja.appendChild(h('li', {}, h('span', { class: 'herr-archivo-nombre' }, f.name, ' ', h('span', { class: 'herr-chico', texto: '(' + TH.tamano(f.size) + ')' })),
          h('span', { class: 'herr-archivo-acciones' },
            cfg.multiple && lista.length > 1 ? [h('button', { class: 'boton boton--secundario boton--chico', type: 'button', disabled: i === 0, 'aria-label': 'Subir ' + f.name, onclick: mover(-1) }, '↑'),
              h('button', { class: 'boton boton--secundario boton--chico', type: 'button', disabled: i === lista.length - 1, 'aria-label': 'Bajar ' + f.name, onclick: mover(1) }, '↓')] : null,
            h('button', { class: 'boton boton--secundario boton--chico', type: 'button', 'aria-label': 'Quitar ' + f.name, onclick: function () { lista.splice(i, 1); pintar(); if (cfg.alCambiar) cfg.alCambiar(lista); } }, 'Quitar'))));
      });
    }
    entrada.addEventListener('change', function () { anadirArchivos(entrada.files); entrada.value = ''; });
    ['dragenter', 'dragover'].forEach(function (e) { zona.addEventListener(e, function (ev) { ev.preventDefault(); zona.classList.add('es-activa'); }); });
    ['dragleave', 'drop'].forEach(function (e) { zona.addEventListener(e, function (ev) { ev.preventDefault(); zona.classList.remove('es-activa'); }); });
    zona.addEventListener('drop', function (ev) { if (ev.dataTransfer && ev.dataTransfer.files.length) anadirArchivos(ev.dataTransfer.files); });
    return { archivos: function () { return lista.slice(); }, vaciar: function () { lista = []; pintar(); if (cfg.alCambiar) cfg.alCambiar(lista); }, estado: estado, entrada: entrada };
  };

  /* Prepara una herramienta de archivos con un botón principal: TH.proceso(raiz, { textoBoton, activo(lista) , ejecutar(lista, ayudas) }) */
  TH.proceso = function (raiz, cfg) {
    var zonaCfg = Object.assign({}, cfg.archivos, { alCambiar: function (l) {
      boton.disabled = !(cfg.minimo ? l.length >= cfg.minimo : l.length > 0); salida.hidden = true;
      if (cfg.info) { info.textContent = ''; if (l.length) Promise.resolve().then(function () { return cfg.info(l); }).then(function (t) { info.textContent = t || ''; }, function () { info.textContent = ''; }); }
      if (cfg.alCambiar) cfg.alCambiar(l, api);
    } });
    var ocupado = false, info = h('p', { class: 'herr-chico', id: 'f-info', 'aria-live': 'polite' });
    var api = TH.archivos(raiz, zonaCfg);
    if (cfg.info) raiz.appendChild(info);
    var opcionesNodo = h('div', { class: 'herr-campos' }), opciones = [];
    (cfg.opciones || []).forEach(function (d) {
      var c = crearCampo(d, function () { var v = valoresOpc(); opciones.forEach(function (x) { if (x.def.mostrarSi) x.nodo.hidden = !x.def.mostrarSi(v); }); }); opciones.push(c); opcionesNodo.appendChild(c.nodo);
    });
    if (opciones.length) raiz.appendChild(opcionesNodo);
    function valoresOpc() { var v = {}; opciones.forEach(function (c) { v[c.def.id] = c.leer(); }); return v; }
    (function () { var v = valoresOpc(); opciones.forEach(function (x) { if (x.def.mostrarSi) x.nodo.hidden = !x.def.mostrarSi(v); }); })();
    var boton = h('button', { class: 'boton', type: 'button', id: 'f-ejecutar', disabled: true, onclick: ejecutar }, cfg.textoBoton || 'Procesar');
    raiz.appendChild(h('div', { class: 'herr-acciones' }, boton));
    var progreso = TH.progreso(raiz), salida = h('div', { class: 'herr-salida', hidden: true });
    raiz.appendChild(salida);
    function ejecutar() {
      if (ocupado) return;
      ocupado = true; boton.disabled = true; salida.hidden = true; api.estado.poner('Procesando…', 'info'); progreso.poner(0, '');
      Promise.resolve().then(function () {
        return cfg.ejecutar(api.archivos(), valoresOpc(), { progreso: progreso.poner, entregar: function (a, t) { TH.entrega(salida, a, t); }, estado: api.estado, salida: salida });
      }).then(function (msg) {
        progreso.ocultar();
        if (msg && typeof msg === 'object') api.estado.poner(msg.msg, msg.tipo || 'ok'); else if (msg) api.estado.poner(msg, 'ok'); else api.estado.limpiar();
      }).catch(function (e) {
        progreso.ocultar(); api.estado.poner(e && e.message ? e.message : 'No se ha podido procesar el archivo.', 'error');
      }).then(function () { ocupado = false; boton.disabled = !(cfg.minimo ? api.archivos().length >= cfg.minimo : api.archivos().length > 0); });
    }
    api.boton = boton; api.salida = salida; api.valoresOpc = valoresOpc;
    return api;
  };

  /* ============================================================ Ayudas para PDF y archivos */
  TH.nombreBase = function (nombre) { return String(nombre).replace(/\.[^.\\/]+$/, '').replace(/[\\/:*?"<>|]+/g, '-') || 'archivo'; };
  /* «1-3, 5, 8-» → [1,2,3,5,8,…max]. Conserva el orden escrito. Lanza Error con un mensaje claro si algo no cuadra. */
  TH.rangos = function (texto, max) {
    var t = String(texto || '').trim();
    if (!t) throw new Error('Escribe qué páginas quieres. Por ejemplo: 1-3, 5, 8-10.');
    var out = [];
    t.split(/[,;\s]+/).filter(Boolean).forEach(function (parte) {
      var m = /^(\d+)(?:\s*[-–]\s*(\d*))?$/.exec(parte);
      if (!m) throw new Error('«' + parte + '» no es una página ni un rango. Usa números y guiones, como 1-3, 5, 8-10.');
      var a = +m[1], b = m[2] === undefined ? a : (m[2] === '' ? max : +m[2]);
      if (a < 1 || b < 1) throw new Error('Las páginas empiezan en la 1.');
      if (a > max || b > max) throw new Error('El documento solo tiene ' + max + (max === 1 ? ' página' : ' páginas') + ' y has pedido la ' + Math.max(a, b) + '.');
      if (b < a) throw new Error('El rango ' + parte + ' está al revés: pon primero la página menor.');
      for (var i = a; i <= b; i++) out.push(i);
    });
    return out;
  };
  TH.abrirPdf = function (archivo, buf) {
    return TH.pdfLib().then(function (P) {
      return P.PDFDocument.load(buf, { ignoreEncryption: false, updateMetadata: false }).catch(function (e) {
        if (/encrypt/i.test(e && e.message)) throw new Error('«' + archivo.name + '» está protegido con contraseña. Quita la protección y vuelve a probar.');
        throw new Error('«' + archivo.name + '» no se puede abrir como PDF. Puede estar dañado o no ser un PDF.');
      });
    });
  };
  TH.bytesPdf = function (doc) { return doc.save({ useObjectStreams: true }).then(function (b) { return new Blob([b], { type: 'application/pdf' }); }); };
  TH.abrirPdfjs = function (archivo, buf) {
    return TH.pdfjs().then(function (m) {
      return m.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, disableFontFace: true, standardFontDataUrl: TH.url('herramientas/datos/vendor/standard_fonts/') }).promise.catch(function (e) {
        if (e && e.name === 'PasswordException') throw new Error('«' + archivo.name + '» está protegido con contraseña. Quita la protección y vuelve a probar.');
        throw new Error('«' + archivo.name + '» no se puede abrir como PDF. Puede estar dañado o no ser un PDF.');
      });
    });
  };
  /* Dibuja la página n (desde 1) de un PDF abierto con PDF.js en un <canvas>. escala 1 = 72 ppp. */
  TH.pdfPagina = function (doc, n, escala, fondo) {
    return doc.getPage(n).then(function (pg) {
      var vp = pg.getViewport({ scale: escala });
      var lienzo = h('canvas'); lienzo.width = Math.ceil(vp.width); lienzo.height = Math.ceil(vp.height);
      var ctx = lienzo.getContext('2d');
      if (fondo) { ctx.fillStyle = fondo; ctx.fillRect(0, 0, lienzo.width, lienzo.height); }
      return pg.render({ canvasContext: ctx, canvas: lienzo, viewport: vp }).promise.then(function () { pg.cleanup(); return { lienzo: lienzo, ancho: vp.width / escala, alto: vp.height / escala }; });
    });
  };
  TH.lienzoABlob = function (lienzo, tipo, calidad) {
    return new Promise(function (ok, mal) { lienzo.toBlob(function (b) { b ? ok(b) : mal(new Error('El navegador no ha podido crear la imagen.')); }, tipo, calidad); });
  };
  TH.documentos = TH.documentos || {};
  TH.libDocumentos = function () { return TH.script('lib/documentos.js'); };

  /* ============================================================ Raíz de cada herramienta */
  TH.raizDe = function () { return TH.$('#herr'); };
  TH.alCargar = function (fn) {
    var r = TH.raizDe();
    if (!r) return;
    try {
      fn(r);
      /* Si la herramienta ya ha puesto su interfaz, el aviso «Cargando…» sobra (las que esperan datos lo quitan ellas al terminar). */
      var carga = r.querySelector('#herr-carga');
      if (carga && [].some.call(r.children, function (x) { return x !== carga && x.tagName !== 'NOSCRIPT'; })) carga.remove();
    } catch (e) { global.__THerror = e; TH.vaciar(r).appendChild(h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido iniciar la herramienta. Recarga la página.' })); throw e; }
  };
})(typeof window !== 'undefined' ? window : globalThis);

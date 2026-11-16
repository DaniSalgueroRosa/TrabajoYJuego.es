(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/sinonimos.js').then(function () {
      var cg = raiz.querySelector('#herr-carga'); if (cg) cg.remove();
      var S = TH.sinonimos, h = TH.h, estado = TH.estado(raiz), est = S.estadisticas();
      var EJEMPLO = 'Ayer fue un día muy bonito. Los niños jugaban en el parque y la gente caminaba despacio por las calles. Estaba cansado, pero feliz, así que decidimos empezar el trabajo después de comer.';

      function boton(t, fn, sec) { return h('button', { class: 'boton' + (sec === false ? '' : ' boton--secundario'), type: 'button', onclick: fn }, t); }
      function chips(palabras, fn, clase) {
        return h('ul', { class: 'sin-chips' }, palabras.map(function (w) { return h('li', null, h('button', { class: 'sin-chip' + (clase ? ' ' + clase : ''), type: 'button', onclick: function () { fn(w); } }, w)); }));
      }
      function mayus(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
      function resumen(filas) {
        var dl = h('dl', { class: 'herr-res herr-res--compacto' });
        filas.forEach(function (f) { dl.appendChild(h('div', { class: 'herr-fila' }, h('dt', { texto: f.t }), h('dd', { 'data-k': f.k, 'data-v': String(f.v), texto: String(f.v) }))); });
        return dl;
      }

      /* ---------- modo 1: buscar una palabra ---------- */
      var inp = h('input', { id: 'c-palabra', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Por ejemplo: bonito, rápido, empezar, miedo…' });
      var resP = h('div', { class: 'herr-salida', 'aria-live': 'polite' }), ultimaLista = '';
      function buscar(t) {
        TH.vaciar(resP); ultimaLista = '';
        t = t.trim();
        if (!t) { resP.appendChild(h('p', { class: 'herr-vacio', texto: 'Escribe una palabra y verás aquí sus sinónimos y sus antónimos.' })); return; }
        var r = S.buscar(t);
        if (!r.base) {
          resP.appendChild(h('p', { class: 'herr-estado herr-estado--aviso', role: 'status', 'data-k': 'no-encontrada', texto: 'No tengo «' + t + '» en el diccionario. Comprueba que está bien escrita; si es una forma conjugada, un diminutivo o una palabra muy técnica, prueba con la forma básica (el infinitivo, el masculino singular).' }));
          if (r.sugerencias.length) { resP.appendChild(h('p', { class: 'sin-etiqueta', texto: '¿Querías decir…?' })); resP.appendChild(chips(r.sugerencias, function (w) { inp.value = w; buscar(w); })); }
          return;
        }
        resP.appendChild(h('h3', { class: 'sin-titulo', 'data-k': 'base', texto: r.base }));
        if (r.via !== 'exacta') {
          var quien = r.via === 'plural' ? 'es un plural' : r.via === 'femenino' ? 'es un femenino' : 'es una forma conjugada';
          resP.appendChild(h('p', { class: 'herr-estado', role: 'status', 'data-k': 'nota-forma', texto: '«' + t + '» ' + quien + '; se muestran los resultados de «' + r.base + '».' }));
        }
        resP.appendChild(resumen([{ t: 'Sinónimos encontrados', k: 'n-sinonimos', v: r.sinonimos.length }, { t: 'Antónimos encontrados', k: 'n-antonimos', v: r.antonimos.length }]));
        var varios = r.sentidos.length > 1;
        r.sentidos.forEach(function (s) {
          var bloque = h('section', { class: 'sin-bloque' });
          if (varios && s.sentido) bloque.appendChild(h('h4', { class: 'sin-sentido', texto: mayus(s.sentido) }));
          if (s.sinonimos.length) { bloque.appendChild(h('p', { class: 'sin-etiqueta', texto: 'Sinónimos' })); bloque.appendChild(chips(s.sinonimos, function (w) { inp.value = w; buscar(w); })); }
          if (s.antonimos.length) { bloque.appendChild(h('p', { class: 'sin-etiqueta', texto: 'Antónimos' })); bloque.appendChild(chips(s.antonimos, function (w) { inp.value = w; buscar(w); }, 'sin-chip--ant')); }
          resP.appendChild(bloque);
        });
        ultimaLista = r.sinonimos.join(', ');
        var acc = h('div', { class: 'herr-acciones' });
        if (r.sinonimos.length) acc.appendChild(boton('Copiar los sinónimos', function () { TH.copiar(ultimaLista, estado); }));
        if (r.antonimos.length) acc.appendChild(boton('Copiar los antónimos', function () { TH.copiar(r.antonimos.join(', '), estado); }));
        resP.appendChild(acc);
        resP.appendChild(h('p', { class: 'herr-nota', texto: 'Pulsa cualquier palabra de la lista para buscar a su vez sus sinónimos. Elige siempre el que encaje en tu frase: dos sinónimos casi nunca significan exactamente lo mismo.' }));
      }
      inp.addEventListener('input', function () { buscar(inp.value); });
      var panelP = h('div', { class: 'sin-panel-modo' },
        h('div', { class: 'campo' }, h('label', { for: 'c-palabra', texto: 'Palabra' }), inp),
        h('div', { class: 'herr-acciones' }, boton('Probar con un ejemplo', function () { inp.value = 'bonito'; buscar('bonito'); }), boton('Borrar', function () { inp.value = ''; buscar(''); inp.focus(); })),
        resP);

      /* ---------- modo 2: mejorar un texto ---------- */
      var area = h('textarea', { id: 'c-texto', rows: 7, spellcheck: 'false', placeholder: 'Pega aquí tu texto. Las palabras con sinónimos aparecerán subrayadas: púlsalas para elegir otra.' });
      var vista = h('div', { class: 'sin-texto', role: 'region', 'aria-label': 'Texto con las palabras que tienen sinónimos', 'data-k': 'texto-vista' }), panelSel = h('div', { class: 'sin-panel', 'aria-live': 'polite' }), cuenta = h('div');
      var toks = [], hist = [], sel = -1, MAX = 30000, cache = {};
      function consulta(p) { var k = S.clave(p); if (!(k in cache)) cache[k] = S.buscar(p, { sinVerbos: true, sinSugerencias: true }); return cache[k]; }
      function trocear(t) {
        var re = /\p{L}+/gu, m, ini = 0, res = [];
        while ((m = re.exec(t))) {
          if (m.index > ini) res.push({ t: t.slice(ini, m.index), pal: false });
          var r = m[0].length >= 3 ? consulta(m[0]) : null;
          res.push({ t: m[0], orig: m[0], pal: true, res: r && r.base && r.sinonimos.length ? r : null }); ini = m.index + m[0].length;
        }
        if (ini < t.length) res.push({ t: t.slice(ini), pal: false });
        return res;
      }
      function textoActual() { return toks.map(function (x) { return x.t; }).join(''); }
      function pintar() {
        TH.vaciar(vista); TH.vaciar(cuenta);
        var marcadas = 0, cambios = 0;
        toks.forEach(function (x, i) {
          if (!x.pal || !x.res) { vista.appendChild(document.createTextNode(x.t)); return; }
          marcadas++; var cambiada = x.t !== x.orig; if (cambiada) cambios++;
          vista.appendChild(h('button', { class: 'sin-pal' + (i === sel ? ' sin-pal--sel' : '') + (cambiada ? ' sin-pal--cambiada' : ''), type: 'button', 'aria-pressed': i === sel ? 'true' : 'false', 'aria-label': 'Sinónimos de ' + x.t + (cambiada ? ' (cambiada, antes «' + x.orig + '»)' : ''), onclick: function () { sel = i; pintar(); } }, x.t));
        });
        if (toks.length) cuenta.appendChild(resumen([{ t: 'Palabras con sinónimos', k: 'marcadas', v: marcadas }, { t: 'Palabras cambiadas', k: 'cambios', v: cambios }]));
        TH.vaciar(panelSel);
        if (sel >= 0 && toks[sel] && toks[sel].res) {
          var x = toks[sel], opciones = x.res.sinonimos.slice(0, 18).map(function (w) { return S.adaptar(x.orig, x.res, w); });
          panelSel.appendChild(h('p', { class: 'sin-etiqueta', texto: 'Sustituir «' + x.t + '» por:' }));
          var lista = [];
          if (x.t !== x.orig) lista.push(x.orig);
          opciones.forEach(function (o) { if (o !== x.t && lista.indexOf(o) < 0) lista.push(o); });
          panelSel.appendChild(chips(lista, function (w) { hist.push({ i: sel, antes: toks[sel].t }); toks[sel].t = w; pintar(); }));
          if (x.t !== x.orig) panelSel.appendChild(h('p', { class: 'herr-nota', texto: 'La primera opción devuelve la palabra original.' }));
        } else if (marcadas) panelSel.appendChild(h('p', { class: 'herr-vacio', texto: 'Pulsa una palabra subrayada para ver sus alternativas.' }));
        else if (toks.length) panelSel.appendChild(h('p', { class: 'herr-vacio', texto: 'Ninguna palabra de este texto tiene sinónimos en el diccionario.' }));
        vista.hidden = !toks.length;
      }
      function cargar() {
        var t = area.value; sel = -1; hist = [];
        if (t.length > MAX) { toks = []; pintar(); panelSel.appendChild(h('p', { class: 'herr-estado herr-estado--error', role: 'alert', 'data-k': 'error', texto: 'El texto es demasiado largo (más de ' + MAX.toLocaleString('es-ES') + ' caracteres). Pégalo por partes.' })); return; }
        toks = trocear(t); pintar();
      }
      area.addEventListener('input', cargar);
      var panelT = h('div', { class: 'sin-panel-modo' },
        h('div', { class: 'campo' }, h('label', { for: 'c-texto', texto: 'Tu texto' }), area),
        h('div', { class: 'herr-acciones' },
          boton('Probar con un ejemplo', function () { area.value = EJEMPLO; cargar(); }),
          boton('Copiar el texto', function () { if (toks.length) TH.copiar(textoActual(), estado); else estado.poner('Todavía no hay texto que copiar.', 'aviso'); }),
          boton('Deshacer el último cambio', function () { var u = hist.pop(); if (u) { toks[u.i].t = u.antes; sel = u.i; pintar(); } else estado.poner('No hay cambios que deshacer.', 'aviso'); }),
          boton('Volver al texto original', function () { toks.forEach(function (x) { if (x.pal) x.t = x.orig; }); hist = []; sel = -1; pintar(); }),
          boton('Borrar', function () { area.value = ''; cargar(); area.focus(); })),
        cuenta, vista, panelSel,
        h('p', { class: 'herr-nota', texto: 'Se marcan las palabras que aparecen tal cual, en plural o en femenino. Los verbos conjugados no se marcan aquí: búscalos en «Buscar una palabra». Revisa la concordancia y el sentido después de cada cambio.' }));

      /* ---------- pestañas ---------- */
      var bP = h('button', { class: 'boton', type: 'button', 'aria-pressed': 'true', id: 'm-palabra' }, 'Buscar una palabra'), bT = h('button', { class: 'boton boton--secundario', type: 'button', 'aria-pressed': 'false', id: 'm-texto' }, 'Mejorar un texto');
      function modo(m) {
        var p = m === 'palabra'; panelP.hidden = !p; panelT.hidden = p;
        bP.setAttribute('aria-pressed', String(p)); bT.setAttribute('aria-pressed', String(!p));
        bP.className = 'boton' + (p ? '' : ' boton--secundario'); bT.className = 'boton' + (p ? ' boton--secundario' : '');
        (p ? inp : area).focus();
      }
      bP.addEventListener('click', function () { modo('palabra'); }); bT.addEventListener('click', function () { modo('texto'); });
      raiz.appendChild(h('div', { class: 'sin-modos', role: 'group', 'aria-label': 'Qué quieres hacer' }, bP, bT));
      raiz.appendChild(panelP); raiz.appendChild(panelT);
      raiz.appendChild(h('p', { class: 'herr-nota', texto: 'Diccionario propio de ' + est.palabras.toLocaleString('es-ES') + ' palabras y ' + est.grupos.toLocaleString('es-ES') + ' grupos de significado. No cubre todo el idioma: si una palabra no aparece, prueba con otra forma.' }));
      panelT.hidden = true; buscar(''); pintar();
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();

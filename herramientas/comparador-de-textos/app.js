(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var h = TH.h, estado = TH.estado(raiz), ultimo = '';
    var RE = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu;
    function area(id, et, ph) { var t = h('textarea', { id: id, rows: 9, placeholder: ph, spellcheck: 'false' }); return { el: t, nodo: h('div', { class: 'campo' }, h('label', { for: id, texto: et }), t) }; }
    var A = area('t-a', 'Texto original', 'Pega aquí el primer texto…'), B = area('t-b', 'Texto modificado', 'Pega aquí el segundo texto…');
    var modo = h('select', { id: 'c-modo' }, [['lineas', 'Línea a línea'], ['palabras', 'Palabra a palabra']].map(function (o) { return h('option', { value: o[0] }, o[1]); }));
    var mayus = h('input', { id: 'c-mayus', type: 'checkbox' }), esp = h('input', { id: 'c-espacios', type: 'checkbox', checked: true });
    var res = h('div', { class: 'herr-salida' }), vista = h('div', { class: 'dif', 'data-k': 'diferencias', role: 'region', 'aria-label': 'Diferencias entre los dos textos', tabindex: '0', hidden: true });
    function trozos(t, m) {
      t = t.replace(/\r\n?/g, '\n');
      if (m === 'palabras') return t.match(RE) || [];
      var l = t === '' ? [] : t.split('\n'); if (l.length && l[l.length - 1] === '') l.pop(); return l;
    }
    function diferencias(x, y) {
      var ini = 0, fx = x.length, fy = y.length, k, i, j;
      while (ini < x.length && ini < y.length && x[ini].k === y[ini].k) ini++;
      while (fx > ini && fy > ini && x[fx - 1].k === y[fy - 1].k) { fx--; fy--; }
      var mx = x.slice(ini, fx), my = y.slice(ini, fy), n = mx.length, m = my.length;
      if (n * m > 4000000) throw new Error('Los textos son demasiado largos para compararlos así. Prueba con «Línea a línea» o compara por partes.');
      var W = m + 1, dp = new Uint32Array((n + 1) * W);
      for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) dp[i * W + j] = mx[i].k === my[j].k ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
      var ops = [];
      for (k = 0; k < ini; k++) ops.push({ o: '=', t: y[k].t });
      i = 0; j = 0;
      while (i < n && j < m) {
        if (mx[i].k === my[j].k) { ops.push({ o: '=', t: my[j].t }); i++; j++; }
        else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) ops.push({ o: '-', t: mx[i++].t });
        else ops.push({ o: '+', t: my[j++].t });
      }
      while (i < n) ops.push({ o: '-', t: mx[i++].t });
      while (j < m) ops.push({ o: '+', t: my[j++].t });
      for (k = fy; k < y.length; k++) ops.push({ o: '=', t: y[k].t });
      return ops;
    }
    function comparar() {
      TH.vaciar(res); TH.vaciar(vista); vista.hidden = true; ultimo = '';
      var m = modo.value, ta = A.el.value, tb = B.el.value;
      if (ta.trim() === '' && tb.trim() === '') { res.appendChild(h('p', { class: 'herr-vacio', texto: 'Escribe o pega dos textos y aquí verás sus diferencias al instante.' })); return; }
      function clave(t) { var k = t; if (m === 'lineas' && esp.checked) k = k.trim().replace(/\s+/g, ' '); if (mayus.checked) k = k.toLocaleLowerCase('es'); return k; }
      var x = trozos(ta, m).map(function (t) { return { t: t, k: clave(t) }; }), y = trozos(tb, m).map(function (t) { return { t: t, k: clave(t) }; }), ops;
      try { ops = diferencias(x, y); } catch (e) { res.appendChild(h('p', { class: 'herr-estado herr-estado--error', role: 'alert', 'data-k': 'error', texto: e.message })); return; }
      var iguales = 0, quitadas = 0, anadidas = 0;
      ops.forEach(function (o) { if (o.o === '=') iguales++; else if (o.o === '-') quitadas++; else anadidas++; });
      var total = x.length + y.length, sim = total === 0 ? 100 : 2 * iguales / total * 100;
      var unidad = m === 'lineas' ? ['Líneas añadidas', 'Líneas eliminadas', 'Líneas iguales'] : ['Palabras y signos añadidos', 'Palabras y signos eliminados', 'Palabras y signos iguales'];
      var dl = h('dl', { class: 'herr-res herr-res--compacto' });
      [TH.fila('anadidas', unidad[0], anadidas, 'n0'), TH.fila('eliminadas', unidad[1], quitadas, 'n0'), TH.fila('iguales', unidad[2], iguales, 'n0'), TH.fila('similitud', 'Parecido entre los dos textos', sim, function (n) { return TH.fmt(n, [0, 1]) + ' %'; })].forEach(function (f) {
        dl.appendChild(h('div', { class: 'herr-fila' }, h('dt', { texto: f.t }), h('dd', { 'data-k': f.k, 'data-v': String(f.v), texto: f.f })));
      });
      res.appendChild(dl);
      if (!quitadas && !anadidas) res.appendChild(h('p', { class: 'herr-estado herr-estado--ok', role: 'status', texto: 'Los dos textos son idénticos con las opciones elegidas.' }));
      vista.hidden = false;
      if (m === 'lineas') {
        ultimo = ops.map(function (o) { return (o.o === '+' ? '+ ' : o.o === '-' ? '- ' : '  ') + o.t; }).join('\n');
        ops.forEach(function (o) {
          var cls = o.o === '+' ? 'mas' : o.o === '-' ? 'menos' : 'igual';
          vista.appendChild(h('div', { class: 'dif-linea dif-linea--' + cls }, h('span', { class: 'dif-signo', 'aria-hidden': 'true', texto: o.o === '=' ? ' ' : o.o === '+' ? '+' : '−' }),
            h('span', { class: 'dif-texto' }, o.o === '=' ? null : h('span', { class: 'solo-lectores', texto: o.o === '+' ? 'Añadida: ' : 'Eliminada: ' }), o.t === '' ? ' ' : o.t)));
        });
      } else {
        var p = h('p', { class: 'dif-parrafo' }), prev = null, partes = [];
        ops.forEach(function (o) {
          var pegado = /^[,.;:!?)\]»”…]$/.test(o.t) || (prev !== null && /^[¿¡(\[«“]$/.test(prev));
          if (prev !== null && !pegado) { p.appendChild(document.createTextNode(' ')); partes.push(' '); }
          p.appendChild(o.o === '=' ? document.createTextNode(o.t) : h(o.o === '+' ? 'ins' : 'del', { texto: o.t }));
          partes.push(o.o === '=' ? o.t : o.o === '+' ? '{+' + o.t + '+}' : '[-' + o.t + '-]');
          prev = o.t;
        });
        vista.appendChild(p); ultimo = partes.join('');
      }
    }
    [A.el, B.el, modo, mayus, esp].forEach(function (e) { e.addEventListener('input', comparar); e.addEventListener('change', comparar); });
    function boton(t, fn, sec) { return h('button', { class: 'boton' + (sec === false ? '' : ' boton--secundario'), type: 'button', onclick: fn }, t); }
    raiz.appendChild(h('div', { class: 'herr-dos' }, A.nodo, B.nodo));
    raiz.appendChild(h('div', { class: 'herr-campos' }, h('div', { class: 'campo' }, h('label', { for: 'c-modo', texto: 'Comparar' }), modo),
      h('div', { class: 'campo campo--check' }, h('span', { class: 'campo-check' }, mayus, h('label', { for: 'c-mayus', texto: 'No distinguir mayúsculas de minúsculas' }))),
      h('div', { class: 'campo campo--check' }, h('span', { class: 'campo-check' }, esp, h('label', { for: 'c-espacios', texto: 'Ignorar los espacios sobrantes (solo línea a línea)' })))));
    raiz.appendChild(h('div', { class: 'herr-acciones' },
      boton('Intercambiar los textos', function () { var t = A.el.value; A.el.value = B.el.value; B.el.value = t; comparar(); }),
      boton('Copiar las diferencias', function () { if (ultimo) TH.copiar(ultimo, estado); else estado.poner('Todavía no hay diferencias que copiar.', 'aviso'); }),
      boton('Probar con un ejemplo', function () { A.el.value = 'uno\ndos\ntres\ncuatro'; B.el.value = 'uno\ndos\ncuatro\ncinco'; comparar(); }),
      boton('Borrar todo', function () { A.el.value = ''; B.el.value = ''; comparar(); A.el.focus(); })));
    raiz.appendChild(res); raiz.appendChild(vista);
    comparar();
  });
})();

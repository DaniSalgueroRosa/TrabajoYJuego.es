(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/diferencias.js').then(function () {
      var cg = raiz.querySelector('#herr-carga'); if (cg) cg.remove();
      var D = TH.diferencias, h = TH.h, MAX_PAGINAS = 600, MAX_LINEAS_VISTA = 2500, ultimo = '';

      function fechaPdf(s) {
        var m = /^D:(\d{4})(\d{2})?(\d{2})?/.exec(s || '');
        return m ? (m[3] || '01') + '/' + (m[2] || '01') + '/' + m[1] : (s || '—');
      }
      function leerPaginas(doc, nombre, prog) {
        var n = doc.numPages, res = [], cadena = Promise.resolve(), i;
        function una(k) {
          return function () {
            return doc.getPage(k).then(function (pg) {
              return pg.getTextContent().then(function (tc) {
                var frag = tc.items.filter(function (x) { return typeof x.str === 'string'; }).map(function (x) { return { s: x.str, x: x.transform[4], y: x.transform[5], w: x.width }; });
                D.lineas(frag).forEach(function (t) { res.push({ t: t, p: k }); });
                pg.cleanup(); prog(k, n);
              });
            });
          };
        }
        for (i = 1; i <= n; i++) cadena = cadena.then(una(i));
        return cadena.then(function () { return res; });
      }
      function etiqueta(o) { var l = o.b || o.a; return 'p. ' + l.p; }
      function filaDif(o, ptxt) {
        var cls = o.o === '+' ? 'mas' : o.o === '-' ? 'menos' : 'igual', texto = (o.b || o.a).t;
        return h('div', { class: 'dif-linea dif-linea--' + cls }, h('span', { class: 'dif-signo', 'aria-hidden': 'true', texto: o.o === '=' ? ' ' : o.o === '+' ? '+' : '−' }),
          h('span', { class: 'dif-texto' }, o.o === '=' ? null : h('span', { class: 'solo-lectores', texto: o.o === '+' ? 'Añadida: ' : 'Eliminada: ' }), texto), h('span', { class: 'dif-pag', texto: ptxt || etiqueta(o) }));
      }
      function filaPar(viejo, nuevo) {                                             // una línea cambiada: se marcan las palabras distintas
        var pal = D.palabras(viejo.a.t, nuevo.b.t);
        if (!pal) return [filaDif(viejo), filaDif(nuevo)];
        function linea(cls, signo, filtro, p) {
          var cont = h('span', { class: 'dif-texto' }, h('span', { class: 'solo-lectores', texto: cls === 'menos' ? 'Eliminada: ' : 'Añadida: ' })), primero = true;
          pal.forEach(function (w) {
            if (w.o !== '=' && w.o !== filtro) return;
            if (!primero) cont.appendChild(document.createTextNode(' ')); primero = false;
            cont.appendChild(w.o === '=' ? document.createTextNode(w.t) : h(w.o === '+' ? 'ins' : 'del', { texto: w.t }));
          });
          return h('div', { class: 'dif-linea dif-linea--' + cls }, h('span', { class: 'dif-signo', 'aria-hidden': 'true', texto: signo }), cont, h('span', { class: 'dif-pag', texto: 'p. ' + p }));
        }
        return [linea('menos', '−', '-', viejo.a.p), linea('mas', '+', '+', nuevo.b.p)];
      }

      TH.proceso(raiz, {
        archivos: { aceptar: '.pdf,application/pdf', multiple: true, max: 2, aceptarTexto: 'archivos PDF', texto: 'Arrastra aquí los dos PDF o elígelos desde tu dispositivo. El primero es el original y el segundo, el modificado.' },
        minimo: 2, textoBoton: 'Comparar los PDF',
        info: function (l) { return l.length === 2 ? 'Original: ' + l[0].name + ' · Modificado: ' + l[1].name + '. Si están al revés, cambia el orden con las flechas.' : 'Falta un segundo PDF para poder compararlos.'; },
        opciones: [
          { id: 'mayus', tipo: 'check', etiqueta: 'No distinguir mayúsculas de minúsculas', valor: false },
          { id: 'espacios', tipo: 'check', etiqueta: 'Ignorar los espacios sobrantes', valor: true },
          { id: 'solo', tipo: 'check', etiqueta: 'Mostrar solo las líneas que cambian, con una línea de contexto', valor: true }
        ],
        ejecutar: function (lista, op, a) {
          var A = lista[0], B = lista[1];
          return Promise.all([TH.leer(A), TH.leer(B)]).then(function (bufs) {
            a.progreso(3, 'Abriendo los PDF…');
            return Promise.all([TH.abrirPdfjs(A, bufs[0]), TH.abrirPdfjs(B, bufs[1])]).then(function (docs) {
              if (docs[0].numPages + docs[1].numPages > MAX_PAGINAS) throw new Error('Entre los dos PDF suman más de ' + MAX_PAGINAS + ' páginas. Compáralos por partes.');
              var total = docs[0].numPages + docs[1].numPages, hechas = 0;
              function prog(nombre) { return function (k, n) { hechas++; a.progreso(5 + 85 * hechas / total, 'Leyendo «' + nombre + '»: página ' + k + ' de ' + n); }; }
              return leerPaginas(docs[0], A.name, prog(A.name)).then(function (la) {
                return leerPaginas(docs[1], B.name, prog(B.name)).then(function (lb) { return { docs: docs, la: la, lb: lb, bufs: bufs }; });
              });
            });
          }).then(function (r) {
            [[A, r.la], [B, r.lb]].forEach(function (x) { if (!x[1].length) throw new Error('«' + x[0].name + '» no tiene texto que se pueda seleccionar: parece un documento escaneado o hecho de imágenes. Esta herramienta compara texto y no reconoce el texto de las imágenes.'); });
            a.progreso(93, 'Comparando…');
            return Promise.all([r.docs[0].getMetadata().then(function (m) { return m.info || {}; }, function () { return {}; }), r.docs[1].getMetadata().then(function (m) { return m.info || {}; }, function () { return {}; })]).then(function (meta) { r.meta = meta; return r; });
          }).then(function (r) {
            var cmp = D.comparar(r.la, r.lb, { mayus: op.mayus, espacios: op.espacios }), ops = cmp.ops, el = a.salida, i;
            var quitadas = 0, anadidas = 0, iguales = 0, paginas = {};
            ops.forEach(function (o) { if (o.o === '=') iguales++; else { if (o.o === '-') { quitadas++; paginas['a' + o.a.p] = 1; } else { anadidas++; paginas['b' + o.b.p] = 1; } } });
            var sim = D.similitud(ops), cambios = quitadas + anadidas;
            TH.vaciar(el); el.hidden = false; el.classList.remove('herr-entrega');
            var dl = h('dl', { class: 'herr-res herr-res--compacto' });
            [['paginas-a', 'Páginas del original', r.docs[0].numPages, 'n0'], ['paginas-b', 'Páginas del modificado', r.docs[1].numPages, 'n0'], ['anadidas', 'Líneas añadidas', anadidas, 'n0'], ['eliminadas', 'Líneas eliminadas', quitadas, 'n0'], ['iguales', 'Líneas iguales', iguales, 'n0'],
              ['similitud', 'Parecido del texto', sim, 'pct']].forEach(function (f) { var fi = TH.fila(f[0], f[1], f[2], f[3]); dl.appendChild(h('div', { class: 'herr-fila' }, h('dt', { texto: fi.t }), h('dd', { 'data-k': fi.k, 'data-v': String(fi.v), texto: fi.f }))); });
            el.appendChild(dl);
            if (!cambios) el.appendChild(h('p', { class: 'herr-estado herr-estado--ok', role: 'status', 'data-k': 'identicos', texto: 'El texto de los dos PDF es idéntico con las opciones elegidas. No se comparan imágenes, tipografías ni diseño.' }));
            if (cmp.metodo === 'paginas') el.appendChild(h('p', { class: 'herr-estado herr-estado--aviso', role: 'status', texto: 'Los documentos son muy largos, así que se han comparado página con página. Si se ha movido texto de una página a otra, aparecerá como eliminado y añadido.' }));

            var M = r.meta, meta = [['Archivo', A.name, B.name], ['Tamaño', TH.tamano(A.size), TH.tamano(B.size)], ['Páginas', String(r.docs[0].numPages), String(r.docs[1].numPages)], ['Título', M[0].Title || '—', M[1].Title || '—'], ['Autor', M[0].Author || '—', M[1].Author || '—'], ['Creado', fechaPdf(M[0].CreationDate), fechaPdf(M[1].CreationDate)], ['Modificado', fechaPdf(M[0].ModDate), fechaPdf(M[1].ModDate)], ['Programa', M[0].Producer || '—', M[1].Producer || '—']];
            var tabla = h('table', { class: 'herr-tabla' }, h('caption', { texto: 'Datos de los dos archivos' }), h('thead', {}, h('tr', {}, ['Dato', 'Original', 'Modificado', 'Diferencia'].map(function (c) { return h('th', { scope: 'col', texto: c }); }))),
              h('tbody', {}, meta.map(function (f) { return h('tr', {}, h('th', { scope: 'row', texto: f[0] }), h('td', { texto: f[1] }), h('td', { texto: f[2] }), h('td', { texto: f[0] === 'Archivo' ? '' : f[1] === f[2] ? 'Igual' : 'Distinto' })); })));
            el.appendChild(h('div', { class: 'herr-tabla-caja', tabindex: '0', role: 'region', 'aria-label': 'Datos de los dos archivos' }, tabla));

            if (cambios) {
              var vista = h('div', { class: 'dif', role: 'region', tabindex: '0', 'aria-label': 'Diferencias entre los dos PDF', 'data-k': 'diferencias' }), mostradas = 0, truncado = false, ult = -2, informe = [];
              var necesarias = ops.map(function (o, k) { return o.o !== '='; }), ctx = ops.map(function () { return !op.solo; });
              if (op.solo) necesarias.forEach(function (n, k) { if (n) { ctx[k] = true; if (k > 0) ctx[k - 1] = true; if (k < ops.length - 1) ctx[k + 1] = true; } });
              for (i = 0; i < ops.length; i++) {
                if (!ctx[i]) continue;
                if (ult >= 0 && i - ult > 1) vista.appendChild(h('div', { class: 'dif-linea dif-linea--hueco' }, h('span', { 'aria-hidden': 'true', texto: '⋯' }), h('span', { texto: 'Líneas iguales omitidas' }), h('span')));
                if (mostradas >= MAX_LINEAS_VISTA) { truncado = true; break; }
                if (ops[i].o === '-') {                                            // un bloque de líneas eliminadas seguido de añadidas: se emparejan en orden
                  var j = i, k2;
                  while (j < ops.length && ops[j].o === '-') j++;
                  var fin = j; while (fin < ops.length && ops[fin].o === '+') fin++;
                  var nv = j - i, nn = fin - j, pares = Math.min(nv, nn);
                  for (k2 = 0; k2 < pares; k2++) { filaPar(ops[i + k2], ops[j + k2]).forEach(function (f) { vista.appendChild(f); mostradas++; }); informe.push(ops[i + k2], ops[j + k2]); }
                  for (k2 = pares; k2 < nv; k2++) { vista.appendChild(filaDif(ops[i + k2])); mostradas++; informe.push(ops[i + k2]); }
                  for (k2 = pares; k2 < nn; k2++) { vista.appendChild(filaDif(ops[j + k2])); mostradas++; informe.push(ops[j + k2]); }
                  ult = fin - 1; i = fin - 1; continue;
                }
                vista.appendChild(filaDif(ops[i])); mostradas++; if (ops[i].o !== '=') informe.push(ops[i]); ult = i;
              }
              el.appendChild(vista);
              if (truncado) el.appendChild(h('p', { class: 'herr-estado herr-estado--aviso', role: 'status', texto: 'Se muestran las primeras ' + MAX_LINEAS_VISTA.toLocaleString('es-ES') + ' líneas. El informe descargable incluye todos los cambios.' }));
              ops.forEach(function (o) { if (o.o !== '=' && informe.indexOf(o) < 0) informe.push(o); });
              informe.sort(function (x, y) { return ops.indexOf(x) - ops.indexOf(y); });
              ultimo = 'Comparación de PDF\nOriginal: ' + A.name + ' (' + r.docs[0].numPages + ' páginas)\nModificado: ' + B.name + ' (' + r.docs[1].numPages + ' páginas)\nLíneas añadidas: ' + anadidas + ' · eliminadas: ' + quitadas + ' · iguales: ' + iguales + '\n\n' +
                informe.map(function (o) { return (o.o === '+' ? '+ ' : '- ') + 'p. ' + (o.b || o.a).p + ': ' + (o.b || o.a).t; }).join('\n') + '\n';
              el.appendChild(h('div', { class: 'herr-acciones' },
                h('button', { class: 'boton', type: 'button', onclick: function () { TH.copiar(ultimo, a.estado); } }, 'Copiar las diferencias'),
                h('button', { class: 'boton boton--secundario', type: 'button', onclick: function () { TH.descargar(new Blob([ultimo], { type: 'text/plain;charset=utf-8' }), 'diferencias-' + TH.nombreBase(A.name) + '.txt'); } }, 'Descargar el informe')));
            }
            el.appendChild(h('p', { class: 'herr-nota', texto: 'Se compara el texto línea a línea. Los textos en dos columnas o en tablas pueden salir en distinto orden según cómo se hayan generado los PDF, y los cambios de imágenes o de formato no se detectan.' }));
            return cambios ? { msg: 'Comparación terminada: ' + cambios.toLocaleString('es-ES') + (cambios === 1 ? ' línea distinta.' : ' líneas distintas.'), tipo: 'ok' } : { msg: 'Comparación terminada: no hay diferencias en el texto.', tipo: 'ok' };
          });
        }
      });
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();

(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/excel.js').then(function () {
      var X = TH.excel, h = TH.h, MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', MAX_VISTA = 1000, nombreArchivo = 'datos';
      var SEPS = { ',': 'coma', ';': 'punto y coma', '\t': 'tabulador', '|': 'barra vertical' };

      function leerTabla(t, op) {                                              // → { filas, sep, numeros, error }
        if (!t.trim()) return { filas: [] };
        var sep = op.sep === 'auto' ? X.detectarSeparador(t) : op.sep, r = X.analizarCsv(t, sep);
        if (r.error) return { error: r.error, filas: [] };
        var cuerpo = op.cabecera ? r.filas.slice(1) : r.filas;
        return { filas: r.filas, sep: sep, numeros: op.numeros === 'auto' ? X.tipoDeNumeros(cuerpo) : op.numeros };
      }
      function textoFecha(v) {
        var d = new Date(Date.UTC(1899, 11, 30) + Math.round(v * 86400000)), p = function (n) { return (n < 10 ? '0' : '') + n; };
        var f = p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
        return v % 1 ? f + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) : f;
      }
      function vista(filas, op, numeros) {                                      // tabla con cómo leerá Excel cada celda
        var cols = 0, n = Math.min(filas.length, 8), i, j;
        filas.slice(0, n).forEach(function (f) { if (f.length > cols) cols = f.length; });
        cols = Math.min(cols, 8);
        var cuerpo = h('tbody');
        for (i = 0; i < n; i++) {
          var tr = h('tr');
          for (j = 0; j < cols; j++) {
            var txt = filas[i][j], c = txt === undefined ? null : (op.cabecera && i === 0 ? { t: 's', v: txt } : X.celda(txt, { numeros: numeros, fechas: op.fechas }));
            if (op.cabecera && i === 0) tr.appendChild(h('th', { scope: 'col', texto: txt === undefined ? '' : txt }));
            else if (!c) tr.appendChild(h('td'));
            else if (c.t === 'n') tr.appendChild(h('td', { class: 'csvx-num', texto: String(c.v).replace('.', ',') }));
            else if (c.t === 's') tr.appendChild(h('td', { texto: c.v.length > 40 ? c.v.slice(0, 40) + '…' : c.v }));
            else tr.appendChild(h('td', { class: 'csvx-fecha', texto: textoFecha(c.v) }));
          }
          cuerpo.appendChild(tr);
        }
        return h('div', { class: 'herr-tabla-caja', tabindex: '0', role: 'region', 'aria-label': 'Así se verán las primeras filas en Excel', 'data-k': 'vista' },
          h('table', { class: 'herr-tabla csvx-tabla' }, h('caption', { texto: 'Así se verán las primeras filas en Excel (números a la derecha, fechas como fecha, el resto como texto)' }), op.cabecera ? h('thead', {}, cuerpo.firstChild) : null, cuerpo));
      }
      function decodificar(buf) {
        try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
        catch (e) { return new TextDecoder('windows-1252').decode(buf); }       // los CSV de Excel en español suelen venir en Windows-1252
      }
      function construir(t, op) {
        var tabla = leerTabla(t, op);
        if (tabla.error || !tabla.filas.length) return { tabla: tabla };
        var lib = X.libro([{ nombre: op.hoja, filas: tabla.filas }], { cabecera: op.cabecera, numeros: tabla.numeros, fechas: op.fechas });
        return { tabla: tabla, lib: lib };
      }

      var api = TH.texto(raiz, {
        entrada: { etiqueta: 'Pega aquí tu CSV', ph: 'nombre;edad;fecha\nAna;30;15/03/2026', ejemplo: 'producto;unidades;precio;alta;código\nCamiseta básica;12;19,90;15/03/2026;007\nPantalón vaquero;3;49,95;16/03/2026;010\n"Gorra; edición limitada";25;12,00;2026-03-17;0042' },
        salida: { etiqueta: 'Datos separados por tabuladores (para pegar en Excel)' },
        filas: 10,
        opciones: [
          { id: 'sep', tipo: 'select', etiqueta: 'Separador', valor: 'auto', opciones: [['auto', 'Detectarlo automáticamente'], [',', 'Coma (,)'], [';', 'Punto y coma (;)'], ['\t', 'Tabulador'], ['|', 'Barra vertical (|)']] },
          { id: 'cabecera', tipo: 'check', etiqueta: 'La primera fila son los títulos (negrita, fija y con filtro)', valor: true },
          { id: 'numeros', tipo: 'select', etiqueta: 'Números', valor: 'auto', opciones: [['auto', 'Detectar si los decimales llevan punto o coma'], ['punto', 'Decimales con punto (3.14)'], ['coma', 'Decimales con coma (3,14)'], ['texto', 'No convertir: dejar todo como texto']] },
          { id: 'fechas', tipo: 'check', etiqueta: 'Convertir fechas (2026-03-15 o 15/03/2026)', valor: true },
          { id: 'hoja', tipo: 'texto', etiqueta: 'Nombre de la hoja', valor: 'Datos', max: 31 }
        ],
        procesar: function (t, op, a) {
          var tabla = leerTabla(t, op);
          if (tabla.error) return { salida: '', avisos: [tabla.error] };
          if (!tabla.filas.length) return { salida: '' };
          var f = tabla.filas, avisos = [], n = 0, fe = 0, tx = 0, vac = 0, cols = 0, irregulares = 0, formulas = 0, cab = op.cabecera ? 1 : 0, i, j;
          f.forEach(function (fi) { if (fi.length > cols) cols = fi.length; });
          for (i = 0; i < f.length; i++) {
            if (f[i].length !== cols) irregulares++;
            for (j = 0; j < f[i].length; j++) {
              if (i < cab) continue;
              var c = X.celda(f[i][j], { numeros: tabla.numeros, fechas: op.fechas });
              if (!c) vac++; else if (c.t === 'n') n++; else if (c.t === 's') { tx++; if (/^[=+\-@]/.test(c.v)) formulas++; } else fe++;
            }
          }
          avisos.push('Separador ' + (op.sep === 'auto' ? 'detectado' : 'elegido') + ': ' + SEPS[tabla.sep] + '.' + (tabla.numeros === 'coma' ? ' Los decimales se leen con coma.' : ''));
          if (irregulares) avisos.push((irregulares === 1 ? 'Una fila tiene' : irregulares + ' filas tienen') + ' un número de columnas distinto al de la fila más larga (' + cols + '). Las celdas que faltan quedan vacías.');
          if (formulas) avisos.push((formulas === 1 ? 'Una celda empieza' : formulas + ' celdas empiezan') + ' por =, + o @: se guardan como texto y Excel no las calcula como fórmulas.');
          if (f.length > 1048576) avisos.push('Hay ' + f.length.toLocaleString('es-ES') + ' filas y Excel admite 1.048.576 como máximo: el archivo no se podrá crear.');
          if (f.length > MAX_VISTA) avisos.push('El cuadro de texto muestra las primeras ' + MAX_VISTA.toLocaleString('es-ES') + ' filas; el archivo Excel las incluye todas.');
          var salida = f.slice(0, MAX_VISTA).map(function (fi) { return fi.map(function (x) { return x.replace(/[\t\r\n]+/g, ' '); }).join('\t'); }).join('\n');
          return {
            salida: salida, avisos: avisos, html: vista(f, op, tabla.numeros),
            filas: [TH.fila('filas', 'Filas' + (cab ? ' (con los títulos)' : ''), f.length, 'n0'), TH.fila('columnas', 'Columnas', cols, 'n0'), TH.fila('numeros', 'Celdas con número', n, 'n0'), TH.fila('fechas', 'Celdas con fecha', fe, 'n0'), TH.fila('textos', 'Celdas de texto', tx, 'n0'), TH.fila('vacias', 'Celdas vacías', vac, 'n0')]
          };
        },
        botones: [
          { texto: 'Descargar Excel (.xlsx)', accion: function (a) {
            var op = a.valores(), r;
            try { r = construir(a.entrada.value, op); } catch (e) { a.estado.poner(e.message, 'error'); return; }
            if (r.tabla.error) { a.estado.poner(r.tabla.error, 'error'); return; }
            if (!r.lib) { a.estado.poner('Pega primero un CSV o abre un archivo.', 'error'); return; }
            TH.jszip().then(function (JSZip) {
              var z = new JSZip();
              Object.keys(r.lib.archivos).forEach(function (ruta) { z.file(ruta, r.lib.archivos[ruta]); });
              return z.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: MIME });
            }).then(function (blob) {
              TH.descargar(blob, nombreArchivo + '.xlsx', MIME);
              a.estado.poner('Listo: ' + nombreArchivo + '.xlsx (' + TH.tamano(blob.size) + ').' + (r.lib.avisos.length ? ' ' + r.lib.avisos.join(' ') : ''), 'ok');
            }, function (e) { a.estado.poner('No se ha podido crear el archivo: ' + (e && e.message ? e.message : e), 'error'); });
          } },
          { texto: 'Abrir un archivo CSV', accion: function () { document.getElementById('csvx-archivo').click(); } }
        ]
      });

      var entrada = h('input', { type: 'file', id: 'csvx-archivo', accept: '.csv,.tsv,.txt,text/csv,text/plain,text/tab-separated-values', hidden: true });
      entrada.addEventListener('change', function () {
        var f = entrada.files && entrada.files[0];
        if (!f) return;
        if (f.size > 50 * 1024 * 1024) { api.estado.poner('El archivo pesa más de 50 MB. Divídelo en partes para que el navegador pueda con él.', 'error'); entrada.value = ''; return; }
        TH.leer(f).then(function (buf) {
          api.entrada.value = decodificar(buf); nombreArchivo = TH.nombreBase(f.name) || 'datos'; api.actualizar();
          api.estado.poner('Abierto «' + f.name + '» (' + TH.tamano(f.size) + ').', 'ok');
        }, function (e) { api.estado.poner(e.message, 'error'); });
        entrada.value = '';
      });
      raiz.appendChild(entrada);
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();

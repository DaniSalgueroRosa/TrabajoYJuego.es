(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.proceso(raiz, {
      archivos: { aceptar: '.pdf,application/pdf', aceptarTexto: 'PDF', texto: 'Arrastra aquí tu PDF o elígelo desde tu dispositivo.' },
      info: function (l) { return TH.leer(l[0], 'bytes').then(function (b) { return TH.abrirPdf(l[0], b); }).then(function (d) { return '«' + l[0].name + '» tiene ' + TH.pl(d.getPageCount(), 'página', 'páginas') + '.'; }); },
      textoBoton: 'Dividir el PDF',
      opciones: [
        { tipo: 'select', id: 'modo', etiqueta: 'Cómo dividir', valor: 'paginas', opciones: [['paginas', 'Una página por archivo'], ['rangos', 'Por rangos que elijas'], ['cada', 'Cada cierto número de páginas']] },
        { tipo: 'texto', id: 'rangos', etiqueta: 'Rangos, separados por comas', ph: '1-3, 4-6, 9', ayuda: 'Cada rango o página suelta se guarda en su propio archivo.', mostrarSi: function (v) { return v.modo === 'rangos'; } },
        { tipo: 'numero', id: 'n', etiqueta: 'Páginas por archivo', valor: 2, entero: true, mostrarSi: function (v) { return v.modo === 'cada'; } }
      ],
      ejecutar: function (lista, op, a) {
        var f = lista[0], base = TH.nombreBase(f.name);
        return TH.leer(f, 'bytes').then(function (b) { return TH.abrirPdf(f, b); }).then(function (d) {
          var n = d.getPageCount(), grupos = [];
          if (op.modo === 'paginas') { for (var i = 1; i <= n; i++) grupos.push([i]); }
          else if (op.modo === 'cada') {
            var k = Math.floor(TH.num(op.n));
            if (!(k >= 1)) throw new Error('Escribe cuántas páginas quieres en cada archivo (1 o más).');
            for (var j = 1; j <= n; j += k) { var g = []; for (var m = j; m < Math.min(n, j + k - 1) + 1; m++) g.push(m); grupos.push(g); }
          } else {
            String(op.rangos || '').split(/[,;]+/).filter(function (t) { return t.trim(); }).forEach(function (t) { grupos.push(TH.rangos(t, n)); });
            if (!grupos.length) throw new Error('Escribe qué rangos quieres. Por ejemplo: 1-3, 4-6, 9.');
          }
          if (grupos.length > 300) throw new Error('Saldrían ' + grupos.length + ' archivos. Elige menos divisiones.');
          var salida = [];
          function uno(i) {
            if (i >= grupos.length) return null;
            a.progreso(i / grupos.length * 95, 'Creando el archivo ' + (i + 1) + ' de ' + grupos.length);
            return TH.pdfLib().then(function (P) { return P.PDFDocument.create(); }).then(function (nuevo) {
              return nuevo.copyPages(d, grupos[i].map(function (x) { return x - 1; })).then(function (pgs) {
                pgs.forEach(function (p) { nuevo.addPage(p); });
                return TH.bytesPdf(nuevo);
              });
            }).then(function (blob) {
              var g = grupos[i], rot = g.length === 1 ? 'pagina-' + g[0] : 'paginas-' + g[0] + '-' + g[g.length - 1];
              salida.push({ nombre: base + '-' + rot + '.pdf', blob: blob });
            }).then(function () { return uno(i + 1); });
          }
          return Promise.resolve(uno(0)).then(function () { a.entregar(salida); return 'Listo: tu PDF de ' + TH.pl(n, 'página', 'páginas') + ' se ha dividido en ' + TH.pl(salida.length, 'archivo', 'archivos') + '.'; });
        });
      }
    });
  });
})();

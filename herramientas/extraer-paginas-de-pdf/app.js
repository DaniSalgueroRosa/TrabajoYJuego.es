(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.proceso(raiz, {
      archivos: { aceptar: '.pdf,application/pdf', aceptarTexto: 'PDF', texto: 'Arrastra aquí tu PDF o elígelo desde tu dispositivo.' },
      info: function (l) { return TH.leer(l[0], 'bytes').then(function (b) { return TH.abrirPdf(l[0], b); }).then(function (d) { return '«' + l[0].name + '» tiene ' + TH.pl(d.getPageCount(), 'página', 'páginas') + '.'; }); },
      textoBoton: 'Extraer las páginas',
      opciones: [{ tipo: 'texto', id: 'paginas', etiqueta: 'Páginas que quieres conservar', ph: 'Ej.: 2-4, 9', ayuda: 'El PDF nuevo seguirá el orden en que las escribas.', ancho: 'completo' }],
      ejecutar: function (lista, op, a) {
        var f = lista[0];
        return TH.leer(f, 'bytes').then(function (b) { return TH.abrirPdf(f, b); }).then(function (d) {
          var cuales = TH.rangos(op.paginas, d.getPageCount());
          return TH.pdfLib().then(function (P) { return P.PDFDocument.create(); }).then(function (n) {
            return n.copyPages(d, cuales.map(function (i) { return i - 1; })).then(function (pgs) {
              pgs.forEach(function (p) { n.addPage(p); });
              return TH.bytesPdf(n);
            });
          }).then(function (blob) {
            a.entregar([{ nombre: TH.nombreBase(f.name) + '-extracto.pdf', blob: blob }]);
            return 'Listo: PDF nuevo con ' + TH.pl(cuales.length, 'página', 'páginas') + '.';
          });
        });
      }
    });
  });
})();

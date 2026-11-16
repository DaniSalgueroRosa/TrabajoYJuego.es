(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.proceso(raiz, {
      archivos: { aceptar: '.pdf,application/pdf', aceptarTexto: 'PDF', texto: 'Arrastra aquí tu PDF o elígelo desde tu dispositivo.' },
      textoBoton: 'Comprimir el PDF',
      opciones: [
        { tipo: 'select', id: 'modo', etiqueta: 'Nivel de compresión', valor: 'ligera', ancho: 'completo', opciones: [['ligera', 'Ligera: conserva el texto y la calidad'], ['fuerte', 'Fuerte: convierte las páginas en imágenes (el texto deja de ser seleccionable)']] },
        { tipo: 'select', id: 'calidad', etiqueta: 'Calidad de la imagen', valor: '0.7', opciones: [['0.5', 'Baja: archivo muy pequeño'], ['0.7', 'Media'], ['0.85', 'Alta']], mostrarSi: function (v) { return v.modo === 'fuerte'; } },
        { tipo: 'select', id: 'res', etiqueta: 'Resolución', valor: '1.5', opciones: [['1', '72 ppp (solo pantalla)'], ['1.5', '108 ppp'], ['2', '144 ppp']], mostrarSi: function (v) { return v.modo === 'fuerte'; } }
      ],
      ejecutar: function (lista, op, a) {
        var f = lista[0];
        function resultado(blob) {
          var antes = f.size, despues = blob.size;
          if (despues >= antes * 0.99) return { msg: 'Con este nivel apenas se reduce el tamaño: el resultado pesaba ' + TH.tamano(despues) + ' y el original ' + TH.tamano(antes) + (op.modo === 'ligera' ? '. No se ofrece la descarga porque no merece la pena; prueba con la compresión fuerte.' : '. No se ofrece la descarga; prueba con menos calidad o resolución.'), tipo: 'aviso' };
          a.entregar([{ nombre: TH.nombreBase(f.name) + '-comprimido.pdf', blob: blob }]);
          return { msg: 'De ' + TH.tamano(antes) + ' a ' + TH.tamano(despues) + ' (' + TH.fmt((1 - despues / antes) * 100, 0) + ' % menos).', tipo: 'ok' };
        }
        return TH.leer(f, 'bytes').then(function (buf) {
          if (op.modo === 'ligera') {
            return TH.abrirPdf(f, buf).then(function (d) {
              return TH.pdfLib().then(function (P) { return P.PDFDocument.create(); }).then(function (n) {
                return n.copyPages(d, d.getPageIndices()).then(function (pgs) { pgs.forEach(function (p) { n.addPage(p); }); return TH.bytesPdf(n); });
              });
            }).then(resultado);
          }
          var escala = parseFloat(op.res), calidad = parseFloat(op.calidad);
          return TH.abrirPdfjs(f, buf).then(function (doc) {
            return TH.pdfLib().then(function (P) { return P.PDFDocument.create().then(function (n) {
              function pag(i) {
                if (i > doc.numPages) return null;
                a.progreso((i - 1) / doc.numPages * 95, 'Comprimiendo la página ' + i + ' de ' + doc.numPages);
                return TH.pdfPagina(doc, i, escala, '#ffffff').then(function (r) {
                  return TH.lienzoABlob(r.lienzo, 'image/jpeg', calidad).then(function (b) { return b.arrayBuffer(); }).then(function (bytes) { return n.embedJpg(bytes); }).then(function (img) {
                    var p = n.addPage([r.ancho, r.alto]); p.drawImage(img, { x: 0, y: 0, width: r.ancho, height: r.alto });
                  });
                }).then(function () { return pag(i + 1); });
              }
              return Promise.resolve(pag(1)).then(function () { return TH.bytesPdf(n); });
            }); });
          }).then(resultado);
        });
      }
    });
  });
})();

(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.proceso(raiz, {
      archivos: { aceptar: '.pdf,application/pdf', aceptarTexto: 'PDF', texto: 'Arrastra aquí tu PDF o elígelo desde tu dispositivo.' },
      info: function (l) { return TH.leer(l[0], 'bytes').then(function (b) { return TH.abrirPdf(l[0], b); }).then(function (d) { return '«' + l[0].name + '» tiene ' + TH.pl(d.getPageCount(), 'página', 'páginas') + '.'; }); },
      textoBoton: 'Girar el PDF',
      opciones: [
        { tipo: 'select', id: 'angulo', etiqueta: 'Giro (en el sentido del reloj)', valor: '90', opciones: [['90', '90° a la derecha'], ['180', '180° (boca abajo)'], ['270', '90° a la izquierda']] },
        { tipo: 'texto', id: 'paginas', etiqueta: 'Páginas (vacío = todas)', ph: 'Ej.: 2, 4-6' }
      ],
      ejecutar: function (lista, op, a) {
        var f = lista[0];
        return TH.leer(f, 'bytes').then(function (b) { return TH.abrirPdf(f, b); }).then(function (d) {
          var n = d.getPageCount(), cuales = String(op.paginas || '').trim() ? TH.rangos(op.paginas, n) : Array.apply(null, Array(n)).map(function (_, i) { return i + 1; });
          return TH.pdfLib().then(function (P) {
            var vistas = {};
            cuales.forEach(function (i) { if (vistas[i]) return; vistas[i] = true; var p = d.getPage(i - 1); p.setRotation(P.degrees(((p.getRotation().angle + (+op.angulo)) % 360 + 360) % 360)); });
            return TH.bytesPdf(d).then(function (blob) {
              a.entregar([{ nombre: TH.nombreBase(f.name) + '-girado.pdf', blob: blob }]);
              return 'Listo: ' + TH.pl(Object.keys(vistas).length, 'página girada', 'páginas giradas') + ' ' + op.angulo + '° en el sentido del reloj.';
            });
          });
        });
      }
    });
  });
})();

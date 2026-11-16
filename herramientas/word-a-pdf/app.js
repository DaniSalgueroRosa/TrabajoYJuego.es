(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.proceso(raiz, {
      archivos: { aceptar: '.docx,.odt', aceptarTexto: 'Word (.docx) u OpenDocument (.odt)', texto: 'Arrastra aquí tu documento de Word o elígelo desde tu dispositivo.' },
      textoBoton: 'Convertir a PDF',
      ejecutar: function (lista, op, a) {
        var f = lista[0];
        return TH.libDocumentos().then(function () { a.progreso(25, 'Leyendo el documento…'); return TH.documentos.leerDocumento(f); }).then(function (parrafos) {
          if (!parrafos.some(function (p) { return p.t.trim(); })) throw new Error('El documento no tiene texto que convertir.');
          a.progreso(60, 'Creando el PDF…');
          return TH.documentos.parrafosAPdf(parrafos).then(function (r) {
            a.entregar([{ nombre: TH.nombreBase(f.name) + '.pdf', blob: r.blob }]);
            return r.sustituidos
              ? { msg: 'Listo, con ' + TH.pl(r.paginas, 'página', 'páginas') + '. ' + TH.pl(r.sustituidos, 'carácter', 'caracteres') + ' no se pueden dibujar con la fuente estándar del PDF y se han cambiado por «?».', tipo: 'aviso' }
              : { msg: 'Listo: PDF de ' + TH.pl(r.paginas, 'página', 'páginas') + '. Se ha convertido el texto con títulos, listas y tablas sencillas.', tipo: 'ok' };
          });
        });
      }
    });
  });
})();

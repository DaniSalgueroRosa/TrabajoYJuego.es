(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.proceso(raiz, {
      archivos: { aceptar: '.pdf,application/pdf', aceptarTexto: 'PDF', texto: 'Arrastra aquí tu PDF o elígelo desde tu dispositivo.' },
      textoBoton: 'Convertir a Word',
      opciones: [{ tipo: 'check', id: 'saltos', etiqueta: 'Separar las páginas con un salto de página', valor: true }],
      ejecutar: function (lista, op, a) {
        var f = lista[0];
        return TH.libDocumentos().then(function () { return TH.leer(f, 'bytes'); }).then(function (buf) {
          return TH.documentos.textoDePdf(buf, function (i, n) { a.progreso(i / n * 80, 'Leyendo la página ' + i + ' de ' + n); });
        }).then(function (paginas) {
          var alturas = [], total = 0;
          paginas.forEach(function (p) { p.lineas.forEach(function (l) { alturas.push(l.h); total += l.t.length; }); });
          if (total < 15) throw new Error('Este PDF no tiene texto que se pueda seleccionar: parece un escaneo o una imagen. Esta herramienta no hace reconocimiento de texto (OCR).');
          alturas.sort(function (x, y) { return x - y; });
          var normal = alturas[Math.floor(alturas.length / 2)] || 10, parrafos = [];
          paginas.forEach(function (p, ip) {
            var previa = null, actual = null, primera = true;
            p.lineas.forEach(function (l) {
              var titulo = l.h >= normal * 1.25 && l.t.length < 140 ? (l.h >= normal * 1.6 ? 1 : 2) : 0;
              var vineta = /^\s*[•●▪·◦⁃*-]\s+/.test(l.t);
              if (!actual || titulo || actual.h || vineta || (previa && previa.y - l.y > l.h * 1.7)) {
                actual = { t: vineta ? l.t.replace(/^\s*\S\s+/, '') : l.t, h: titulo, lista: vineta, salto: primera && ip > 0 && op.saltos };
                primera = false;
                parrafos.push(actual);
              } else {
                actual.t = /[a-záéíóúñ]-$/i.test(actual.t) && /^[a-záéíóúñ]/.test(l.t) ? actual.t.slice(0, -1) + l.t : actual.t + ' ' + l.t;
              }
              previa = l;
            });
          });
          a.progreso(90, 'Creando el documento…');
          return TH.documentos.crearDocx(parrafos).then(function (blob) {
            a.entregar([{ nombre: TH.nombreBase(f.name) + '.docx', blob: blob }]);
            return { msg: 'Listo: ' + TH.pl(paginas.length, 'página', 'páginas') + ' y ' + TH.pl(parrafos.length, 'párrafo', 'párrafos') + '. Se ha recuperado el texto; las imágenes y el diseño original no se copian.', tipo: 'ok' };
          });
        });
      }
    });
  });
})();

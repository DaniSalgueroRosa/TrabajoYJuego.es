(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    function orientacion(b) {
      try {
        var v = new DataView(b); if (v.getUint16(0) !== 0xFFD8) return 1;
        var o = 2;
        while (o + 4 < v.byteLength && o < 70000) {
          var m = v.getUint16(o), l = v.getUint16(o + 2);
          if (m === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) {
            var t = o + 10, le = v.getUint16(t) === 0x4949, d = t + v.getUint32(t + 4, le), n = v.getUint16(d, le);
            for (var i = 0; i < n; i++) { var e = d + 2 + i * 12; if (v.getUint16(e, le) === 0x0112) return v.getUint16(e + 8, le); }
            return 1;
          }
          if ((m & 0xFF00) !== 0xFF00) break;
          o += 2 + l;
        }
      } catch (e) { return 1; }
      return 1;
    }
    function pasarAPng(f) {
      return createImageBitmap(f).then(function (bm) {
        var c = TH.h('canvas'); c.width = bm.width; c.height = bm.height; c.getContext('2d').drawImage(bm, 0, 0);
        return TH.lienzoABlob(c, 'image/png').then(function (b) { return b.arrayBuffer(); });
      }, function () { throw new Error('«' + f.name + '» no se puede leer como imagen.'); });
    }
    TH.proceso(raiz, {
      archivos: { aceptar: '.jpg,.jpeg,.png,.webp,.gif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/bmp', aceptarTexto: 'JPG, PNG, WebP, GIF o BMP', multiple: true, texto: 'Arrastra aquí tus imágenes o elígelas desde tu dispositivo.' },
      textoBoton: 'Crear el PDF',
      opciones: [
        { tipo: 'select', id: 'pagina', etiqueta: 'Tamaño de página', valor: 'a4', opciones: [['a4', 'A4 (vertical u horizontal según la imagen)'], ['imagen', 'Del tamaño de cada imagen']] },
        { tipo: 'select', id: 'margen', etiqueta: 'Margen', valor: '24', opciones: [['0', 'Sin margen'], ['24', 'Pequeño'], ['48', 'Normal']] }
      ],
      ejecutar: function (lista, op, a) {
        return TH.pdfLib().then(function (P) { return P.PDFDocument.create().then(function (pdf) {
          function una(i) {
            if (i >= lista.length) return null;
            var f = lista[i];
            a.progreso(i / lista.length * 95, 'Añadiendo ' + f.name);
            return f.arrayBuffer().then(function (buf) {
              var esJpg = /\.jpe?g$/i.test(f.name) || f.type === 'image/jpeg', esPng = /\.png$/i.test(f.name) || f.type === 'image/png';
              if (esJpg && orientacion(buf) === 1) return pdf.embedJpg(buf);
              if (esPng) return pdf.embedPng(buf).catch(function () { return pasarAPng(f).then(function (b) { return pdf.embedPng(b); }); });
              return pasarAPng(f).then(function (b) { return pdf.embedPng(b); });
            }).then(function (img) {
              var w = img.width, h = img.height, m = +op.margen, pw, ph;
              if (op.pagina === 'imagen') { var k = Math.min(1, 842 / Math.max(w, h)); pw = w * k + 2 * m; ph = h * k + 2 * m; }
              else { pw = w > h ? 841.89 : 595.28; ph = w > h ? 595.28 : 841.89; }
              var esc = Math.min((pw - 2 * m) / w, (ph - 2 * m) / h), dw = w * esc, dh = h * esc;
              var pg = pdf.addPage([pw, ph]);
              pg.drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
            }).then(function () { return una(i + 1); });
          }
          return Promise.resolve(una(0)).then(function () { return TH.bytesPdf(pdf); }).then(function (blob) {
            a.entregar([{ nombre: 'imagenes.pdf', blob: blob }]);
            return 'Listo: PDF de ' + TH.pl(lista.length, 'página', 'páginas') + ', una por imagen y en el orden de la lista.';
          });
        }); });
      }
    });
  });
})();

(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    function info(lista) {
      return TH.script('lib/imagenes.js').then(function () {
        return TH.imagen.abrir(lista[0]).then(function (im) {
          var t = lista.length === 1 ? 'Tamaño actual: ' + im.ancho + ' × ' + im.alto + ' px.' : lista.length + ' imágenes elegidas. La primera mide ' + im.ancho + ' × ' + im.alto + ' px.';
          im.liberar(); return t;
        }, function () { return ''; });
      });
    }

    TH.proceso(raiz, {
      archivos: { aceptar: '.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/avif', aceptarTexto: 'JPG, PNG, WebP, GIF, BMP, SVG o AVIF', multiple: true, texto: 'Arrastra aquí las imágenes que quieres aligerar o elígelas desde tu dispositivo.' },
      textoBoton: 'Comprimir',
      info: info,
      opciones: [
        { tipo: 'numero', id: 'calidad', etiqueta: 'Calidad (de 1 a 100)', valor: 75, entero: true, ayuda: 'Entre 70 y 80 reduce mucho el peso sin que se note a simple vista.' },
        { tipo: 'select', id: 'formato', etiqueta: 'Formato de salida', valor: 'igual', opciones: [['igual', 'El mismo (los PNG se recomprimen sin pérdida)'], ['webp', 'Convertir a WebP (suele pesar menos)'], ['jpg', 'Convertir a JPG']] },
        { tipo: 'numero', id: 'maxancho', etiqueta: 'Ancho máximo en píxeles (opcional)', entero: true, ph: 'Sin límite', ayuda: 'Si una imagen es más ancha, se reduce manteniendo la proporción.' }
      ],
      ejecutar: function (lista, op, a) {
        return TH.script('lib/imagenes.js').then(function () {
          var I = TH.imagen, q = I.calidad(op.calidad, 75), usados = {}, antes = 0, despues = 0, iguales = 0;
          return I.lote(lista, a, function (archivo) {
            var orig = I.formatoDe(archivo), fmt = op.formato === 'igual' ? (orig === 'jpg' || orig === 'webp' ? orig : 'png') : op.formato;
            return I.abrir(archivo).then(function (im) {
              var w = im.ancho, hh = im.alto, achicada = false;
              if (isFinite(op.maxancho) && op.maxancho >= 1 && im.ancho > op.maxancho) { w = Math.round(op.maxancho); hh = Math.max(1, Math.round(im.alto * w / im.ancho)); achicada = true; }
              var c = I.escalar(im, w, hh, fmt === 'jpg' ? '#ffffff' : null);
              im.liberar();
              return I.exportar(c, fmt, q).then(function (blob) {
                antes += archivo.size;
                if (blob.size >= archivo.size && !achicada) {
                  iguales++; despues += archivo.size;
                  return { nombre: I.unico(I.nombreSalida(archivo.name, 'comprimida', orig || 'png'), usados), blob: archivo, nota: 'ya estaba muy optimizada: se conserva el original' };
                }
                despues += blob.size;
                return { nombre: I.unico(I.nombreSalida(archivo.name, 'comprimida', I.formatos[fmt].ext), usados), blob: blob, nota: I.resumen(c.width, c.height) + ' · antes ' + TH.tamano(archivo.size) };
              });
            });
          }).then(function (r) {
            if (!r.ok.length) throw new Error(r.fallos[0].mensaje);
            a.entregar(r.ok);
            var ahorro = antes ? Math.round((1 - despues / antes) * 100) : 0;
            var t = ahorro > 0 ? 'Listo: de ' + TH.tamano(antes) + ' a ' + TH.tamano(despues) + ', un ' + ahorro + ' % menos.' : 'Listo, pero apenas se ha podido reducir: de ' + TH.tamano(antes) + ' a ' + TH.tamano(despues) + '.';
            if (iguales) t += ' ' + TH.pl(iguales, 'imagen', 'imágenes') + ' ya estaban optimizadas y se han dejado como estaban.';
            t += I.avisoFallos(r.fallos);
            return { msg: t, tipo: r.fallos.length || ahorro <= 0 ? 'aviso' : 'ok' };
          });
        });
      }
    });
  });
})();

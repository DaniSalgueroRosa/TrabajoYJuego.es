(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var FORMATOS = [['wav16', 'WAV 16 bits (sin pérdidas, el más compatible)'], ['wav24', 'WAV 24 bits (sin pérdidas, para producción)'], ['wav32', 'WAV 32 bits flotante (sin pérdidas)'],
      ['flac16', 'FLAC 16 bits (sin pérdidas, ocupa la mitad)'], ['flac24', 'FLAC 24 bits (sin pérdidas)'], ['mp3', 'MP3 (con pérdidas, lo abre cualquier reproductor)'], ['opus', 'Ogg Opus (con pérdidas, muy pequeño)']];
    var KBPS = [['32', '32 kb/s (voz, muy pequeño)'], ['64', '64 kb/s (voz clara)'], ['96', '96 kb/s (música aceptable)'], ['128', '128 kb/s (música buena)'], ['192', '192 kb/s (música muy buena)'], ['256', '256 kb/s (casi transparente)']];
    var KBPS_MP3 = [['96', '96 kb/s (voz y música aceptable)'], ['128', '128 kb/s (música buena)'], ['160', '160 kb/s'], ['192', '192 kb/s (música muy buena)'], ['256', '256 kb/s (casi transparente)'], ['320', '320 kb/s (la más alta del MP3)']];
    var HZ = [['igual', 'La misma del original'], ['48000', '48 kHz (vídeo y producción)'], ['44100', '44,1 kHz (CD y música)'], ['32000', '32 kHz'], ['22050', '22,05 kHz'], ['16000', '16 kHz (voz)'], ['8000', '8 kHz (teléfono)']];
    function cargar() { return Promise.all([TH.script('lib/sonido.js'), TH.script('lib/hash.js'), TH.script('lib/pistas.js')]).then(function () { return TH.pistas; }); }
    function campo(id, et, el, ayuda) { return h('div', { class: 'campo' }, h('label', { for: id, texto: et }), el, ayuda ? h('span', { class: 'campo-ayuda', texto: ayuda }) : null); }
    function opcionesSelect(lista, valor) { return lista.map(function (o) { return h('option', { value: o[0], selected: o[0] === valor }, o[1]); }); }
    var h = TH.h;

    var VIDEO = true;
    TH.proceso(raiz, {
      archivos: { aceptar: VIDEO ? '.mp4,.m4v,.mov,.webm,.mkv,.ogv,.3gp,video/*' : '.mp3,.wav,.wave,.ogg,.oga,.opus,.flac,.m4a,.aac,.weba,.webm,.mp4,.m4b,.mov,audio/*',
        aceptarTexto: VIDEO ? 'MP4, MOV, WebM, MKV, OGV o 3GP' : 'MP3, WAV, OGG, Opus, FLAC, M4A, AAC o WebM', multiple: true,
        texto: VIDEO ? 'Arrastra aquí los vídeos de los que quieres sacar el sonido o elígelos desde tu dispositivo.' : 'Arrastra aquí los audios que quieres convertir o elígelos desde tu dispositivo.' },
      textoBoton: VIDEO ? 'Extraer el audio' : 'Convertir',
      info: function (lista) {
        var total = lista.reduce(function (s, f) { return s + f.size; }, 0);
        if (VIDEO && total > 700e6) return 'Ojo: ' + TH.tamano(total) + ' es mucho para el navegador, que tiene que cargar el archivo entero en memoria. Si falla, prueba con un vídeo más corto.';
        return lista.length === 1 ? 'Archivo elegido: ' + TH.tamano(total) + '.' : lista.length + ' archivos elegidos: ' + TH.tamano(total) + ' en total.';
      },
      opciones: [
        { tipo: 'select', id: 'formato', etiqueta: VIDEO ? 'Guardar el audio como' : 'Convertir a', valor: VIDEO ? 'flac16' : 'wav16', opciones: FORMATOS },
        { tipo: 'select', id: 'kbpsMp3', etiqueta: 'Calidad del MP3', valor: '192', opciones: KBPS_MP3, mostrarSi: function (v) { return v.formato === 'mp3'; } },
        { tipo: 'select', id: 'kbps', etiqueta: 'Calidad de Opus', valor: '128', opciones: KBPS, mostrarSi: function (v) { return v.formato === 'opus'; } },
        { tipo: 'select', id: 'canales', etiqueta: 'Canales', valor: 'igual', opciones: [['igual', 'Los mismos del original'], ['mono', 'Mono (mezclar todo en un canal)']] },
        { tipo: 'select', id: 'hz', etiqueta: 'Frecuencia de muestreo', valor: 'igual', opciones: HZ },
        { tipo: 'check', id: 'normalizar', etiqueta: 'Subir el volumen hasta el máximo sin distorsionar', valor: false }
      ],
      ejecutar: function (lista, op, a) {
        return cargar().then(function (P) {
          var So = TH.sonido, usados = {}, ok = [], fallos = [], i = 0, antes = 0, despues = 0, f = P.FORMATOS[op.formato];
          function uno() {
            if (i >= lista.length) return Promise.resolve();
            var archivo = lista[i++];
            a.progreso((i - 1) / lista.length * 100, (VIDEO ? 'Extrayendo ' : 'Convirtiendo ') + i + ' de ' + lista.length + ': ' + archivo.name);
            return P.abrir(archivo).then(function (pista) {
              var c = pista.canales, hz = pista.hz, notas = [];
              if (op.canales === 'mono' && c.length > 1) c = So.aMono(c);
              if (c.length > P.maxCanales(op.formato)) { c = c.slice(0, 2); notas.push((op.formato === 'mp3' ? 'MP3' : 'Opus') + ' admite dos canales: se han usado los dos primeros'); }
              var destino = op.hz === 'igual' ? hz : +op.hz;
              if (destino !== hz) { c = c.map(function (x) { return So.remuestrear(x, hz, destino); }); hz = destino; }
              if (op.normalizar) c = So.normalizar(c, 0.98);
              var hzFinal = P.frecuenciaSalida(op.formato, hz);
              if (hzFinal !== hz) notas.push('el MP3 se guarda a ' + TH.fmt(hzFinal / 1000, hzFinal % 1000 ? 1 : 0) + ' kHz');
              return P.codificar({ canales: c, hz: hz }, op.formato, { kbps: P.kbps(op), progreso: function (p) { a.progreso(((i - 1) + p) / lista.length * 100, 'Codificando ' + archivo.name); } }).then(function (blob) {
                var base = TH.nombreBase(archivo.name), igualExt = archivo.name.toLowerCase().slice(-(f.ext.length + 1)) === '.' + f.ext;
                var nombre = P.unico(base + (VIDEO ? '-audio' : igualExt ? '-convertido' : '') + '.' + f.ext, usados);
                antes += archivo.size; despues += blob.size;
                ok.push({ nombre: nombre, blob: blob, nota: P.resumen({ canales: c, hz: hzFinal, duracion: c[0].length / hz }) + (notas.length ? ' · ' + notas.join('; ') : '') });
              });
            }).catch(function (e) { fallos.push(e && e.message ? e.message : 'No se ha podido procesar «' + archivo.name + '».'); }).then(uno);
          }
          return uno().then(function () {
            if (!ok.length) throw new Error(fallos[0]);
            a.entregar(ok);
            var t = 'Listo: ' + TH.pl(ok.length, VIDEO ? 'audio extraído' : 'archivo convertido', VIDEO ? 'audios extraídos' : 'archivos convertidos') + ' a ' + f.nombre + ' (' + TH.tamano(despues) + ' en total).';
            if (fallos.length) t += ' No se ha podido procesar ' + TH.pl(fallos.length, 'archivo', 'archivos') + ': ' + fallos.join(' ');
            return { msg: t, tipo: fallos.length ? 'aviso' : 'ok' };
          });
        });
      }
    });
  });
})();

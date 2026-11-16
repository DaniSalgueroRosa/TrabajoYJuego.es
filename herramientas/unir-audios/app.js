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

    TH.proceso(raiz, {
      archivos: { aceptar: '.mp3,.wav,.wave,.ogg,.oga,.opus,.flac,.m4a,.aac,.weba,.webm,.mp4,.m4b,.mov,audio/*', aceptarTexto: 'MP3, WAV, OGG, Opus, FLAC, M4A, AAC o WebM', multiple: true,
        texto: 'Arrastra aquí los audios que quieres unir. Después puedes cambiar su orden con las flechas.' },
      minimo: 2, textoBoton: 'Unir los audios',
      info: function (lista) { return lista.length < 2 ? 'Elige al menos dos audios para poder unirlos.' : 'Se unirán en este orden: ' + lista.map(function (f, i) { return (i + 1) + '. ' + f.name; }).join(' · '); },
      opciones: [
        { tipo: 'numero', id: 'pausa', etiqueta: 'Silencio entre audios (segundos)', valor: 0, ayuda: 'De 0 a 60. Con 0, los audios quedan pegados.' },
        { tipo: 'select', id: 'formato', etiqueta: 'Guardar como', valor: 'wav16', opciones: FORMATOS },
        { tipo: 'select', id: 'kbpsMp3', etiqueta: 'Calidad del MP3', valor: '192', opciones: KBPS_MP3, mostrarSi: function (v) { return v.formato === 'mp3'; } },
        { tipo: 'select', id: 'kbps', etiqueta: 'Calidad de Opus', valor: '128', opciones: KBPS, mostrarSi: function (v) { return v.formato === 'opus'; } }
      ],
      ejecutar: function (lista, op, a) {
        if (!isFinite(op.pausa) || op.pausa < 0 || op.pausa > 60) throw new Error('La pausa debe ser un número de segundos entre 0 y 60.');
        return cargar().then(function (P) {
          var So = TH.sonido, pistas = [], i = 0, f = P.FORMATOS[op.formato];
          function abrirTodas() {
            if (i >= lista.length) return Promise.resolve();
            a.progreso(i / lista.length * 50, 'Leyendo ' + (i + 1) + ' de ' + lista.length + ': ' + lista[i].name);
            return P.abrir(lista[i++]).then(function (p) { pistas.push(p); }).then(abrirTodas);
          }
          return abrirTodas().then(function () {
            var hz = Math.max.apply(null, pistas.map(function (p) { return p.hz; })), igualadas = 0;
            var lotes = pistas.map(function (p) { if (p.hz === hz) return p.canales; igualadas++; return p.canales.map(function (x) { return So.remuestrear(x, p.hz, hz); }); });
            var c = So.unir(lotes, Math.round(op.pausa * hz)), dur = c[0].length / hz;
            if (c.length > P.maxCanales(op.formato)) c = c.slice(0, 2);
            a.progreso(60, 'Guardando…');
            return P.codificar({ canales: c, hz: hz }, op.formato, { kbps: P.kbps(op), progreso: function (p) { a.progreso(60 + p * 40, 'Codificando…'); } }).then(function (blob) {
              a.entregar([{ nombre: 'audios-unidos.' + f.ext, blob: blob, nota: TH.sonido.tiempo(dur) + ' · ' + (c.length === 1 ? 'mono' : c.length === 2 ? 'estéreo' : c.length + ' canales') + ' · ' + TH.fmt(P.frecuenciaSalida(op.formato, hz) / 1000, P.frecuenciaSalida(op.formato, hz) % 1000 ? 1 : 0) + ' kHz' }]);
              var t = 'Listo: ' + lista.length + ' audios unidos en uno de ' + TH.sonido.tiempo(dur) + '.';
              if (igualadas) t += ' ' + TH.pl(igualadas, 'audio tenía', 'audios tenían') + ' otra frecuencia de muestreo y se ha adaptado a ' + TH.fmt(hz / 1000, hz % 1000 ? 1 : 0) + ' kHz.';
              return t;
            });
          });
        });
      }
    });
  });
})();

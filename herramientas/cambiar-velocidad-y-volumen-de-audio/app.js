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

    var api = TH.proceso(raiz, {
      archivos: { aceptar: '.mp3,.wav,.wave,.ogg,.oga,.opus,.flac,.m4a,.aac,.weba,.webm,.mp4,.m4b,.mov,audio/*', aceptarTexto: 'MP3, WAV, OGG, Opus, FLAC, M4A, AAC o WebM', multiple: false,
        texto: 'Arrastra aquí el audio que quieres acelerar, frenar o amplificar, o elígelo desde tu dispositivo.' },
      textoBoton: 'Aplicar cambios',
      opciones: [
        { tipo: 'numero', id: 'velocidad', etiqueta: 'Velocidad (%)', valor: 100, ayuda: 'De 25 a 400. 100 es la velocidad original; 150 es una vez y media más rápido.' },
        { tipo: 'select', id: 'tono', etiqueta: 'Al cambiar la velocidad', valor: 'mantener', opciones: [['mantener', 'Mantener el tono (la voz no se vuelve aguda ni grave)'], ['cambiar', 'Cambiar también el tono (como un disco)']] },
        { tipo: 'numero', id: 'volumen', etiqueta: 'Volumen (%)', valor: 100, ayuda: 'De 0 a 500. 100 deja el volumen como está; 200 lo dobla (6 dB más).' },
        { tipo: 'check', id: 'normalizar', etiqueta: 'Subir el volumen hasta el máximo sin distorsionar (ignora el volumen de arriba)', valor: false },
        { tipo: 'select', id: 'formato', etiqueta: 'Guardar como', valor: 'wav16', opciones: FORMATOS },
        { tipo: 'select', id: 'kbpsMp3', etiqueta: 'Calidad del MP3', valor: '192', opciones: KBPS_MP3, mostrarSi: function (v) { return v.formato === 'mp3'; } },
        { tipo: 'select', id: 'kbps', etiqueta: 'Calidad de Opus', valor: '128', opciones: KBPS, mostrarSi: function (v) { return v.formato === 'opus'; } }
      ],
      ejecutar: function (lista, op, a) { return procesar(lista[0], op, a, false); }
    });
    var repro = null, botonAdelanto = h('button', { class: 'boton boton--secundario', type: 'button', id: 'v-adelanto', onclick: adelanto }, 'Escuchar un adelanto de 10 s');
    api.boton.parentNode.appendChild(botonAdelanto);
    function validar(op) {
      if (!isFinite(op.velocidad) || op.velocidad < 25 || op.velocidad > 400) throw new Error('La velocidad debe estar entre 25 % y 400 %.');
      if (!op.normalizar && (!isFinite(op.volumen) || op.volumen < 0 || op.volumen > 500)) throw new Error('El volumen debe estar entre 0 % y 500 %.');
    }
    function transformar(pista, op) {
      var So = TH.sonido, c = pista.canales, f = op.velocidad / 100;
      if (Math.abs(f - 1) > 1e-9) c = op.tono === 'cambiar' ? So.cambiarTono(c, f) : So.estirar(c, f, pista.hz);
      var antes = So.picos(c).max, sat = 0;
      if (op.normalizar) c = So.normalizar(c, 0.98);
      else if (op.volumen !== 100) { c = So.ganancia(c, op.volumen / 100); sat = So.picos(c).saturadas; }
      return { canales: c, saturadas: sat, picoAntes: antes };
    }
    function adelanto() {
      if (repro) { var r = repro; repro = null; r.parar(); botonAdelanto.textContent = 'Escuchar un adelanto de 10 s'; return; }
      var lista = api.archivos(); if (!lista.length) return;
      var op = api.valoresOpc();
      try { validar(op); } catch (e) { return api.estado.poner(e.message, 'error'); }
      api.estado.poner('Preparando el adelanto…', 'info');
      cargar().then(function (P) { return P.abrir(lista[0]); }).then(function (p) {
        var corto = { canales: TH.sonido.recortar(p.canales, 0, Math.round(p.hz * 10 * Math.max(1, op.velocidad / 100))), hz: p.hz };
        var t = transformar(corto, op);
        api.estado.limpiar();
        repro = TH.pistas.reproducir(t.canales, p.hz, 0, t.canales[0].length / p.hz, function () { repro = null; botonAdelanto.textContent = 'Escuchar un adelanto de 10 s'; });
        if (repro) botonAdelanto.textContent = 'Parar el adelanto';
      }, function (e) { api.estado.poner(e.message, 'error'); });
    }
    function procesar(archivo, op, a) {
      validar(op);
      return cargar().then(function (P) {
        a.progreso(5, 'Leyendo el audio…');
        return P.abrir(archivo).then(function (pista) {
          a.progreso(30, 'Aplicando los cambios…');
          return new Promise(function (ok) { setTimeout(ok, 0); }).then(function () {
            var t = transformar(pista, op), f = P.FORMATOS[op.formato], dur = t.canales[0].length / pista.hz;
            a.progreso(70, 'Guardando…');
            var c = t.canales; if (c.length > P.maxCanales(op.formato)) c = c.slice(0, 2);
            return P.codificar({ canales: c, hz: pista.hz }, op.formato, { kbps: P.kbps(op) }).then(function (blob) {
              a.entregar([{ nombre: TH.nombreBase(archivo.name) + '-modificado.' + f.ext, blob: blob, nota: TH.sonido.tiempo(dur) }]);
              var filas = [TH.fila('duracion-original', 'Duración original', pista.duracion, function (x) { return TH.sonido.tiempo(x); }), TH.fila('duracion', 'Duración del resultado', dur, function (x) { return TH.sonido.tiempo(x); }),
                TH.fila('pico', 'Pico más alto del resultado', Math.round(TH.sonido.picos(t.canales).max * 1000) / 10, function (x) { return TH.fmt(x, 1) + ' %'; })];
              a.salida.insertBefore(TH.listaFilas(filas), a.salida.firstChild);
              if (t.saturadas) return { msg: 'Listo, pero con ese volumen ' + TH.pl(t.saturadas, 'muestra pasa', 'muestras pasan') + ' del máximo y se han recortado: el audio sonará distorsionado. Baja el volumen o usa la opción de subirlo sin distorsionar.', tipo: 'aviso' };
              return 'Listo: el audio resultante dura ' + TH.sonido.tiempo(dur) + '.';
            });
          });
        });
      });
    }
  });
})();

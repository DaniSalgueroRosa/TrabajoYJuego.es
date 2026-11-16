/* Ayudas de navegador para las herramientas de audio: abrir cualquier audio (o el audio de un vídeo), dibujar la onda, reproducir un tramo y guardar en WAV, FLAC, MP3 u Ogg Opus.
   Todo ocurre en tu dispositivo: el navegador decodifica con decodeAudioData, los cálculos y los codificadores WAV/FLAC/Ogg son de lib/sonido.js, el codificador MP3 es propio
   (lib/mp3.js, se carga solo cuando se elige MP3) y la compresión Opus la hace el propio navegador con WebCodecs (AudioEncoder). Se carga con TH.script('lib/pistas.js') y queda en TH.pistas; carga antes lib/sonido.js y lib/hash.js.
   TH.pistas.abrir(archivo)                      → Promise<{ canales, hz, duracion, nombre }>
   TH.pistas.codificar(pista, formato, op)       → Promise<Blob> (formato: wav16, wav24, wav32, flac16, flac24, mp3, opus; op: { kbps, progreso })
   TH.pistas.reproducir(canales, hz, desde, hasta, alFinal) → { parar(), posicion() }
   TH.pistas.onda(canvas, pista, { inicio, fin, cursor })    → dibuja la forma de onda con el tramo elegido resaltado */
(function (global) {
  'use strict';
  var TH = global.TH, h = TH.h, P = TH.pistas = {};
  var S = function () { return TH.sonido; };

  P.ACEPTAR = '.mp3,.wav,.wave,.ogg,.oga,.opus,.flac,.m4a,.aac,.weba,.webm,.mp4,.m4b,.mov,audio/*';
  P.ACEPTAR_TEXTO = 'MP3, WAV, OGG, Opus, FLAC, M4A, AAC o WebM';
  P.ACEPTAR_VIDEO = '.mp4,.m4v,.mov,.webm,.mkv,.ogv,.3gp,video/*';
  P.ACEPTAR_VIDEO_TEXTO = 'MP4, MOV, WebM, MKV, OGV o 3GP';
  P.FORMATOS = {
    wav16: { ext: 'wav', mime: 'audio/wav', nombre: 'WAV 16 bits' },
    wav24: { ext: 'wav', mime: 'audio/wav', nombre: 'WAV 24 bits' },
    wav32: { ext: 'wav', mime: 'audio/wav', nombre: 'WAV 32 bits (coma flotante)' },
    flac16: { ext: 'flac', mime: 'audio/flac', nombre: 'FLAC 16 bits' },
    flac24: { ext: 'flac', mime: 'audio/flac', nombre: 'FLAC 24 bits' },
    mp3: { ext: 'mp3', mime: 'audio/mpeg', nombre: 'MP3' },
    opus: { ext: 'opus', mime: 'audio/ogg', nombre: 'Ogg Opus' }
  };
  P.OPCIONES_FORMATO = [['wav16', 'WAV 16 bits (sin pérdidas, el más compatible)'], ['wav24', 'WAV 24 bits (sin pérdidas, para producción)'], ['wav32', 'WAV 32 bits flotante (sin pérdidas)'],
    ['flac16', 'FLAC 16 bits (sin pérdidas, ocupa la mitad)'], ['flac24', 'FLAC 24 bits (sin pérdidas)'], ['mp3', 'MP3 (con pérdidas, lo abre cualquier reproductor)'], ['opus', 'Ogg Opus (con pérdidas, muy pequeño)']];
  P.OPCIONES_KBPS = [['32', '32 kb/s (voz, muy pequeño)'], ['64', '64 kb/s (voz clara)'], ['96', '96 kb/s (música aceptable)'], ['128', '128 kb/s (música buena)'], ['192', '192 kb/s (música muy buena)'], ['256', '256 kb/s (casi transparente)']];
  P.OPCIONES_KBPS_MP3 = [['96', '96 kb/s (voz y música aceptable)'], ['128', '128 kb/s (música buena)'], ['160', '160 kb/s'], ['192', '192 kb/s (música muy buena)'], ['256', '256 kb/s (casi transparente)'], ['320', '320 kb/s (la más alta del MP3)']];
  P.kbps = function (op) { return +(op.formato === 'mp3' ? op.kbpsMp3 : op.kbps); };           // calidad elegida según el formato de salida (op.kbpsMp3 para MP3, op.kbps para Opus)
  P.maxCanales = function (formato) { return formato === 'opus' || formato === 'mp3' ? 2 : Infinity; };   // Opus y MP3 guardan como mucho dos canales
  P.frecuenciaSalida = function (formato, hz) {                                                  // el MP3 solo se guarda a 32, 44,1 o 48 kHz
    if (formato !== 'mp3' || hz === 44100 || hz === 48000 || hz === 32000) return hz;
    return (hz % 8000 === 0 || hz % 12000 === 0) ? 48000 : 44100;
  };

  /* ============================================================ Frecuencia de muestreo del archivo (para no remuestrear sin necesidad) */
  function texto4(u, p) { return String.fromCharCode(u[p], u[p + 1], u[p + 2], u[p + 3]); }
  function cajasMp4(u, v, ini, fin, fn) {
    var p = ini;
    while (p + 8 <= fin) {
      var tam = v.getUint32(p), tipo = texto4(u, p + 4), cab = 8;
      if (tam === 1) { tam = v.getUint32(p + 8) * 4294967296 + v.getUint32(p + 12); cab = 16; } else if (tam === 0) tam = fin - p;
      if (tam < cab) return;
      fn(tipo, p + cab, Math.min(fin, p + tam));
      p += tam;
    }
  }
  P.frecuenciaDe = function (u) {
    var n = u.length, p, i;
    if (n < 16) return 0;
    var v = new DataView(u.buffer, u.byteOffset, u.byteLength);
    if (texto4(u, 0) === 'RIFF' && texto4(u, 8) === 'WAVE') {                       // WAV: bloque «fmt »
      for (p = 12; p + 16 <= n;) { var id = texto4(u, p), tam = v.getUint32(p + 4, true); if (id === 'fmt ') return v.getUint32(p + 12, true); p += 8 + tam + (tam & 1); }
      return 0;
    }
    if (texto4(u, 0) === 'fLaC' && n > 21) return (u[18] << 12) | (u[19] << 4) | (u[20] >> 4);
    if (texto4(u, 0) === 'OggS') {
      var ns = u[26], q = 27 + ns;
      if (texto4(u, q) === 'Opus') return 48000;
      if (u[q] === 1 && texto4(u, q + 1) === 'vorb') return v.getUint32(q + 12, true);
      return 0;
    }
    if (n > 12 && texto4(u, 4) === 'ftyp') {                                          // MP4 / M4A / MOV: la pista de sonido dentro de «moov»
      var hz = 0;
      cajasMp4(u, v, 0, n, function (t, a, b) {
        if (t !== 'moov') return;
        cajasMp4(u, v, a, b, function (t2, a2, b2) {
          if (t2 !== 'trak') return;
          var ts = 0, audio = false;
          cajasMp4(u, v, a2, b2, function (t3, a3, b3) {
            if (t3 !== 'mdia') return;
            cajasMp4(u, v, a3, b3, function (t4, a4) {
              if (t4 === 'mdhd') ts = v.getUint32(a4 + (u[a4] === 1 ? 20 : 12));
              if (t4 === 'hdlr') audio = texto4(u, a4 + 8) === 'soun';
            });
          });
          if (audio && ts && !hz) hz = ts;
        });
      });
      return hz;
    }
    p = 0;                                                                            // MP3: salta la etiqueta ID3 y lee la primera cabecera de trama
    if (texto4(u, 0).slice(0, 3) === 'ID3') p = 10 + (((u[6] & 127) << 21) | ((u[7] & 127) << 14) | ((u[8] & 127) << 7) | (u[9] & 127));
    for (i = p; i < Math.min(n - 4, p + 65536); i++) {
      if (u[i] === 255 && (u[i + 1] & 0xe0) === 0xe0) {
        var ver = (u[i + 1] >> 3) & 3, capa = (u[i + 1] >> 1) & 3, idx = (u[i + 2] >> 2) & 3;
        if (ver === 1 || capa === 0 || idx === 3) continue;
        return ({ 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] })[ver][idx];
      }
    }
    return 0;
  };

  /* ============================================================ Abrir */
  P.abrir = function (archivo) {
    var Ctx = global.OfflineAudioContext || global.webkitOfflineAudioContext;
    if (!Ctx) return Promise.reject(new Error('Tu navegador no puede decodificar audio. Prueba con una versión reciente de Chrome, Firefox, Edge o Safari.'));
    return TH.leer(archivo).then(function (buf) {
      var hz = P.frecuenciaDe(new Uint8Array(buf)) || 48000;
      hz = Math.max(8000, Math.min(96000, hz));
      var ctx = new Ctx(1, 1, hz);
      return new Promise(function (ok, mal) {
        var p = ctx.decodeAudioData(buf, ok, mal);
        if (p && p.then) p.then(ok, mal);
      }).then(function (b) {
        var canales = [], k;
        for (k = 0; k < b.numberOfChannels; k++) canales.push(new Float32Array(b.getChannelData(k)));
        if (!canales.length || !canales[0].length) throw new Error('«' + archivo.name + '» no contiene audio.');
        return { canales: canales, hz: b.sampleRate, duracion: b.length / b.sampleRate, nombre: archivo.name };
      }, function () {
        throw new Error('No se ha podido leer el audio de «' + archivo.name + '». Puede estar dañado, no tener pista de sonido o usar un códec que tu navegador no abre.');
      });
    });
  };
  P.resumen = function (pista) {
    var c = pista.canales.length;
    return TH.pistas.tiempo(pista.duracion) + ' · ' + (c === 1 ? 'mono' : c === 2 ? 'estéreo' : c + ' canales') + ' · ' + TH.fmt(pista.hz / 1000, pista.hz % 1000 ? 1 : 0) + ' kHz';
  };
  P.tiempo = function (s) { return S().tiempo(s); };

  /* ============================================================ Guardar */
  P.nombreSalida = function (nombre, sufijo, ext) { return TH.nombreBase(nombre) + (sufijo ? '-' + sufijo : '') + '.' + ext; };
  P.unico = function (nombre, usados) {
    var base = nombre, n = 1, i = base.lastIndexOf('.');
    while (usados[nombre]) { n++; nombre = base.slice(0, i) + '-' + n + base.slice(i); }
    usados[nombre] = true; return nombre;
  };
  P.opusDisponible = function () {
    if (!global.AudioEncoder || !global.AudioData) return Promise.resolve(false);
    return global.AudioEncoder.isConfigSupported({ codec: 'opus', sampleRate: 48000, numberOfChannels: 2, bitrate: 96000 }).then(function (r) { return !!r.supported; }, function () { return false; });
  };
  function opus(canales, hz, kbps, progreso) {
    var So = S(), nc = Math.min(2, canales.length), c48 = canales.slice(0, nc).map(function (x) { return hz === 48000 ? x : So.remuestrear(x, hz, 48000); }), n = c48[0].length;
    var cfg = { codec: 'opus', sampleRate: 48000, numberOfChannels: nc, bitrate: Math.round(kbps * 1000), opus: { frameDuration: 20000, application: 'audio' } };
    return P.opusDisponible().then(function (ok) {
      if (!ok) throw new Error('Tu navegador no sabe crear audio Opus. Elige WAV o FLAC, o prueba con una versión reciente de Chrome o Edge.');
      return new Promise(function (resuelve, rechaza) {
        var paquetes = [], descripcion = null, pos = 0, paso = 4800, enc;
        enc = new global.AudioEncoder({
          output: function (chunk, meta) {
            var b = new Uint8Array(chunk.byteLength); chunk.copyTo(b); paquetes.push(b);
            if (!descripcion && meta && meta.decoderConfig && meta.decoderConfig.description) {
              var d = meta.decoderConfig.description;
              descripcion = d.buffer ? new Uint8Array(d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength)) : new Uint8Array(d.slice(0));
            }
          },
          error: function (e) { rechaza(new Error('El navegador no ha podido crear el audio Opus (' + (e && e.message ? e.message : 'error') + ').')); }
        });
        enc.configure(cfg);
        function dar() {
          try {
            while (pos < n) {
              if (enc.encodeQueueSize > 10) { setTimeout(dar, 4); return; }
              var len = Math.min(paso, n - pos), d = new Float32Array(len * nc), k;
              for (k = 0; k < nc; k++) d.set(c48[k].subarray(pos, pos + len), k * len);
              var ad = new global.AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: len, numberOfChannels: nc, timestamp: Math.round(pos / 48000 * 1e6), data: d });
              enc.encode(ad); ad.close(); pos += len;
              if (progreso && (pos / paso) % 20 < 1) progreso(pos / n);
            }
            enc.flush().then(function () {
              try { enc.close(); } catch (x) { /* ya cerrado */ }
              var pre = descripcion && descripcion.length >= 12 ? descripcion[10] | (descripcion[11] << 8) : 312;
              resuelve(new Blob([So.ogg(paquetes, { canales: nc, frecuencia: hz, preSkip: pre, muestras: n, cabecera: descripcion && descripcion.length >= 19 ? descripcion : null })], { type: 'audio/ogg' }));
            }, rechaza);
          } catch (e) { rechaza(e); }
        }
        dar();
      });
    });
  }
  /* pista: { canales, hz }. Devuelve una promesa con el Blob del archivo. */
  P.codificar = function (pista, formato, op) {
    op = op || {};
    var So = S(), f = P.FORMATOS[formato];
    if (!f) return Promise.reject(new Error('Formato de salida no admitido.'));
    return new Promise(function (ok, mal) {
      setTimeout(function () {                                                        // deja respirar a la página antes de un cálculo largo
        try {
          if (formato === 'opus') { opus(pista.canales, pista.hz, op.kbps || 128, op.progreso).then(ok, mal); return; }
          if (formato === 'mp3') {                                                      // el codificador MP3 se descarga solo si hace falta
            TH.script('lib/mp3.js').then(function () {
              return global.TH.mp3.codificar(pista.canales, pista.hz, +op.kbps || 192, op.progreso);
            }).then(function (bytes) { ok(new Blob([bytes], { type: f.mime })); }, mal);
            return;
          }
          var bytes;
          if (formato.slice(0, 3) === 'wav') bytes = So.wav(pista.canales, pista.hz, formato === 'wav32' ? '32f' : +formato.slice(3));
          else bytes = So.flac(pista.canales, pista.hz, +formato.slice(4), TH.hash.md5);
          ok(new Blob([bytes], { type: f.mime }));
        } catch (e) { mal(e); }
      }, 0);
    });
  };

  /* ============================================================ Reproducir un tramo */
  var ctxRepro = null;
  P.reproducir = function (canales, hz, desde, hasta, alFinal) {
    var C = global.AudioContext || global.webkitAudioContext;
    if (!C) return null;
    try {
      if (!ctxRepro) ctxRepro = new C();
      if (ctxRepro.state === 'suspended') ctxRepro.resume();
    } catch (x) { return null; }
    var a = Math.max(0, Math.floor(desde * hz)), b = Math.min(canales[0].length, Math.ceil(hasta * hz));
    if (b - a < 2) { if (alFinal) alFinal(); return null; }
    var buf = ctxRepro.createBuffer(canales.length, b - a, hz);
    canales.forEach(function (c, k) { buf.copyToChannel(c.subarray(a, b), k); });
    var fuente = ctxRepro.createBufferSource(), t0 = ctxRepro.currentTime, parado = false;
    fuente.buffer = buf; fuente.connect(ctxRepro.destination);
    fuente.onended = function () { if (!parado) { parado = true; if (alFinal) alFinal(); } };
    fuente.start();
    return {
      parar: function () { if (parado) return; parado = true; try { fuente.stop(); } catch (x) { /* ya parada */ } if (alFinal) alFinal(); },
      posicion: function () { return a / hz + Math.min(ctxRepro.currentTime - t0, (b - a) / hz); }
    };
  };

  /* ============================================================ Forma de onda */
  P.picos = function (canales, columnas) {
    var n = canales[0].length, mn = new Float32Array(columnas), mx = new Float32Array(columnas), i, k, c, a, b, lo, hi, x;
    for (c = 0; c < columnas; c++) {
      a = Math.floor(c * n / columnas); b = Math.max(a + 1, Math.floor((c + 1) * n / columnas)); lo = 1; hi = -1;
      for (k = 0; k < canales.length; k++) for (i = a; i < b && i < n; i += Math.max(1, ((b - a) / 64) | 0)) { x = canales[k][i]; if (x < lo) lo = x; if (x > hi) hi = x; }
      mn[c] = lo > hi ? 0 : lo; mx[c] = lo > hi ? 0 : hi;
    }
    return { min: mn, max: mx };
  };
  P.onda = function (canvas, pista, o) {
    o = o || {};
    var ancho = canvas.width, alto = canvas.height, g = canvas.getContext('2d'), est = global.getComputedStyle ? global.getComputedStyle(canvas) : null;
    function color(v, def) { var c = est && est.getPropertyValue(v).trim(); return c || def; }
    if (!canvas._picos || canvas._picos.pista !== pista) canvas._picos = { pista: pista, p: P.picos(pista.canales, ancho) };
    var p = canvas._picos.p, mitad = alto / 2, i;
    g.clearRect(0, 0, ancho, alto);
    var dur = pista.duracion, x0 = o.inicio != null ? Math.round(o.inicio / dur * ancho) : 0, x1 = o.fin != null ? Math.round(o.fin / dur * ancho) : ancho;
    if (o.inicio != null || o.fin != null) { g.fillStyle = color('--limon-claro', '#f3f7b0'); g.fillRect(Math.min(x0, x1), 0, Math.abs(x1 - x0) || 1, alto); }
    g.fillStyle = color('--pizarra', '#1f2d2d');
    for (i = 0; i < ancho; i++) { var y0 = mitad - p.max[i] * mitad * 0.95, y1 = mitad - p.min[i] * mitad * 0.95; g.fillRect(i, y0, 1, Math.max(1, y1 - y0)); }
    g.fillStyle = color('--pizarra', '#1f2d2d'); g.fillRect(0, mitad - 0.5, ancho, 1);
    if (o.inicio != null || o.fin != null) { g.fillStyle = color('--sandia-texto', '#C21E4A'); g.fillRect(x0, 0, 2, alto); g.fillRect(x1 - 2, 0, 2, alto); }
    if (o.cursor != null) { g.fillStyle = color('--limon', '#c6d100'); g.fillRect(Math.round(o.cursor / dur * ancho) - 1, 0, 3, alto); }
  };

  /* Lectura de tiempos tolerante: «90», «1:30», «1:30,5» → segundos o NaN */
  P.leerTiempo = function (t) { return S().leerTiempo(t); };
  global.TH.pistas = P;
})(window);

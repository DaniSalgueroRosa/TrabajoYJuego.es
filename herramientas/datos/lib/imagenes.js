/* Ayudas para las herramientas de imágenes: abrir, escalar, exportar (PNG, JPG, WebP, BMP) y crear .ico. Todo se hace en el navegador con <canvas>;
   no se envía nada a ningún servidor. Se carga con TH.script('lib/imagenes.js') y queda en TH.imagen. */
(function (global) {
  'use strict';
  var TH = global.TH, h = TH.h, I = TH.imagen = {};

  I.formatos = {
    png: { mime: 'image/png', ext: 'png', nombre: 'PNG' },
    jpg: { mime: 'image/jpeg', ext: 'jpg', nombre: 'JPG' },
    webp: { mime: 'image/webp', ext: 'webp', nombre: 'WebP' },
    bmp: { mime: 'image/bmp', ext: 'bmp', nombre: 'BMP' }
  };
  I.ACEPTAR = '.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/avif';
  I.ACEPTAR_TEXTO = 'JPG, PNG, WebP, GIF, BMP, SVG o AVIF';

  /* Abre un archivo de imagen → { fuente (ImageBitmap o <img>), ancho, alto, liberar() } */
  I.abrir = function (archivo) {
    function conImg() {
      return new Promise(function (ok, mal) {
        var url = URL.createObjectURL(archivo), im = new Image();
        im.onload = function () { ok({ fuente: im, ancho: im.naturalWidth || 512, alto: im.naturalHeight || 512, liberar: function () { URL.revokeObjectURL(url); } }); };
        im.onerror = function () { URL.revokeObjectURL(url); mal(new Error('«' + archivo.name + '» no se puede leer como imagen. Puede estar dañada o ser de un formato que tu navegador no abre.')); };
        im.src = url;
      });
    }
    if (!global.createImageBitmap || /svg/i.test(archivo.type) || /\.svg$/i.test(archivo.name)) return conImg();
    return createImageBitmap(archivo).then(function (bm) {
      return { fuente: bm, ancho: bm.width, alto: bm.height, liberar: function () { if (bm.close) bm.close(); } };
    }, conImg);
  };

  I.lienzo = function (w, alto) {
    w = Math.round(w); alto = Math.round(alto);
    if (!(w >= 1 && alto >= 1)) throw new Error('El tamaño debe ser de al menos 1 × 1 píxel.');
    if (w > 16384 || alto > 16384 || w * alto > 120e6) throw new Error('El resultado sería de ' + w + ' × ' + alto + ' píxeles, más de lo que un navegador puede procesar con seguridad. Elige un tamaño menor.');
    var c = h('canvas'); c.width = w; c.height = alto;
    if (!c.getContext('2d')) throw new Error('Tu navegador no ha podido reservar memoria para una imagen tan grande. Prueba con un tamaño menor.');
    return c;
  };

  /* Dibuja una imagen abierta con I.abrir en un lienzo nuevo de w × alto. Reduce por pasos para que no salgan dientes de sierra. fondo: color CSS opcional. */
  I.escalar = function (im, w, alto, fondo) {
    w = Math.round(w); alto = Math.round(alto);
    var actual = im.fuente, aw = im.ancho, ah = im.alto;
    while (aw > w * 2 || ah > alto * 2) {
      var nw = aw > w * 2 ? Math.max(w, Math.ceil(aw / 2)) : aw, nh = ah > alto * 2 ? Math.max(alto, Math.ceil(ah / 2)) : ah;
      var paso = I.lienzo(nw, nh), pg = paso.getContext('2d'); pg.imageSmoothingQuality = 'high'; pg.drawImage(actual, 0, 0, aw, ah, 0, 0, nw, nh);
      actual = paso; aw = nw; ah = nh;
    }
    var c = I.lienzo(w, alto), g = c.getContext('2d');
    if (fondo) { g.fillStyle = fondo; g.fillRect(0, 0, w, alto); }
    g.imageSmoothingQuality = 'high'; g.drawImage(actual, 0, 0, aw, ah, 0, 0, w, alto);
    return c;
  };

  /* Copia un lienzo sobre un fondo opaco (JPG y BMP no admiten transparencia) */
  I.aplanar = function (lienzo, color) {
    var c = I.lienzo(lienzo.width, lienzo.height), g = c.getContext('2d');
    g.fillStyle = color || '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(lienzo, 0, 0);
    return c;
  };
  I.tieneTransparencia = function (lienzo) {
    var d = lienzo.getContext('2d').getImageData(0, 0, lienzo.width, lienzo.height).data;
    for (var i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
    return false;
  };

  /* BMP de 24 bits (sin transparencia: aplánalo antes) */
  I.bmp = function (c) {
    var w = c.width, alto = c.height, d = c.getContext('2d').getImageData(0, 0, w, alto).data, fila = (w * 3 + 3) & ~3, tam = 54 + fila * alto;
    var b = new Uint8Array(tam), v = new DataView(b.buffer);
    b[0] = 0x42; b[1] = 0x4D; v.setUint32(2, tam, true); v.setUint32(10, 54, true); v.setUint32(14, 40, true); v.setInt32(18, w, true); v.setInt32(22, alto, true);
    v.setUint16(26, 1, true); v.setUint16(28, 24, true); v.setUint32(34, fila * alto, true); v.setInt32(38, 2835, true); v.setInt32(42, 2835, true);
    for (var y = 0; y < alto; y++) {
      var o = 54 + (alto - 1 - y) * fila;
      for (var x = 0; x < w; x++) { var s = (y * w + x) * 4; b[o + x * 3] = d[s + 2]; b[o + x * 3 + 1] = d[s + 1]; b[o + x * 3 + 2] = d[s]; }
    }
    return new Blob([b], { type: 'image/bmp' });
  };

  /* Lienzo → Blob en el formato pedido ('png', 'jpg', 'webp', 'bmp'). calidad de 0 a 1 (solo JPG y WebP). */
  I.exportar = function (lienzo, fmt, calidad) {
    var f = I.formatos[fmt];
    if (!f) return Promise.reject(new Error('Formato desconocido.'));
    if (fmt === 'bmp') return Promise.resolve(I.bmp(lienzo));
    return new Promise(function (ok, mal) {
      lienzo.toBlob(function (b) {
        if (!b) return mal(new Error('El navegador no ha podido crear la imagen.'));
        if (b.type !== f.mime) return mal(new Error('Tu navegador no sabe crear imágenes ' + f.nombre + '. Elige PNG o JPG.'));
        ok(b);
      }, f.mime, fmt === 'png' ? undefined : calidad);
    });
  };

  /* Archivo .ico con varias imágenes PNG dentro: entradas = [{ ancho, alto, datos: Uint8Array (un PNG) }] */
  I.ico = function (entradas) {
    var n = entradas.length, total = 6 + 16 * n;
    entradas.forEach(function (e) { total += e.datos.length; });
    var b = new Uint8Array(total), v = new DataView(b.buffer), pos = 6 + 16 * n;
    v.setUint16(0, 0, true); v.setUint16(2, 1, true); v.setUint16(4, n, true);
    entradas.forEach(function (e, i) {
      var o = 6 + 16 * i;
      b[o] = e.ancho >= 256 ? 0 : e.ancho; b[o + 1] = e.alto >= 256 ? 0 : e.alto; b[o + 2] = 0; b[o + 3] = 0;
      v.setUint16(o + 4, 1, true); v.setUint16(o + 6, 32, true); v.setUint32(o + 8, e.datos.length, true); v.setUint32(o + 12, pos, true);
      b.set(e.datos, pos); pos += e.datos.length;
    });
    return new Blob([b], { type: 'image/x-icon' });
  };

  I.nombreSalida = function (nombre, sufijo, ext) { return TH.nombreBase(nombre) + (sufijo ? '-' + sufijo : '') + '.' + ext; };
  /* Formato de un archivo según su tipo o su extensión: 'jpg', 'png', 'webp', 'bmp', 'gif', 'svg', 'avif' o '' */
  I.formatoDe = function (archivo) {
    var t = (archivo.type || '').toLowerCase(), n = (archivo.name || '').toLowerCase(), m = /\.([a-z0-9]+)$/.exec(n), e = m ? m[1] : '';
    if (t === 'image/jpeg' || e === 'jpg' || e === 'jpeg') return 'jpg';
    if (t === 'image/png' || e === 'png') return 'png';
    if (t === 'image/webp' || e === 'webp') return 'webp';
    if (t === 'image/bmp' || e === 'bmp') return 'bmp';
    if (t === 'image/gif' || e === 'gif') return 'gif';
    if (t === 'image/svg+xml' || e === 'svg') return 'svg';
    if (t === 'image/avif' || e === 'avif') return 'avif';
    return '';
  };
  /* Calidad de 1 a 100 → 0,01 a 1. Si no es un número, la de por defecto. */
  I.calidad = function (v, defecto) { var n = typeof v === 'number' && isFinite(v) ? v : defecto; return Math.min(100, Math.max(1, Math.round(n))) / 100; };
  /* Nombre que no se repita dentro de un mismo lote: foto.png, foto-2.png… */
  I.unico = function (nombre, usados) {
    var n = nombre, i = 2, p = nombre.lastIndexOf('.'), base = p < 0 ? nombre : nombre.slice(0, p), ext = p < 0 ? '' : nombre.slice(p);
    while (usados[n.toLowerCase()]) n = base + '-' + (i++) + ext;
    usados[n.toLowerCase()] = true;
    return n;
  };
  I.resumen = function (ancho, alto, bytes) { return ancho + ' × ' + alto + ' px' + (bytes != null ? ' · ' + TH.tamano(bytes) : ''); };
  /* Procesa los archivos uno a uno con barra de progreso. hacer(archivo, i) → Promise. Un fallo en un archivo no detiene a los demás:
     devuelve { ok: [resultados], fallos: [{ nombre, mensaje }] } */
  I.lote = function (lista, a, hacer) {
    var ok = [], fallos = [];
    function paso(i) {
      if (i >= lista.length) return Promise.resolve({ ok: ok, fallos: fallos });
      a.progreso(i / lista.length * 95, 'Procesando ' + lista[i].name + ' (' + (i + 1) + ' de ' + lista.length + ')');
      return Promise.resolve().then(function () { return hacer(lista[i], i); }).then(function (r) { ok.push(r); }, function (e) { fallos.push({ nombre: lista[i].name, mensaje: e && e.message ? e.message : 'No se ha podido procesar.' }); }).then(function () { return paso(i + 1); });
    }
    return paso(0);
  };
  /* Texto de aviso para los archivos que han fallado, o '' */
  I.avisoFallos = function (fallos) {
    if (!fallos.length) return '';
    return ' No se han podido procesar: ' + fallos.map(function (f) { return f.nombre + ' (' + f.mensaje.replace(/^«[^»]*» /, '') + ')'; }).join('; ') + '.';
  };
})(window);

(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var LIMITES = [['0', 'Sin límite'], ['280', 'Publicación de X (280)'], ['160', 'SMS de un solo mensaje (160)'], ['160b', 'Meta descripción de Google (160)'], ['60', 'Título SEO (60)'], ['150', 'Biografía de Instagram (150)'], ['2200', 'Pie de foto de Instagram (2200)'], ['otro', 'Otro límite']];
    TH.texto(raiz, {
      entrada: { etiqueta: 'Escribe o pega tu texto', ph: 'Pega aquí tu texto…', ejemplo: 'Calculadoras, conversores y herramientas gratis para estudiar y trabajar, sin registro y sin instalar nada. 🚀' },
      salida: { etiqueta: 'Aviso sobre el límite' },
      filas: 7,
      opciones: [
        { id: 'limite', tipo: 'select', etiqueta: 'Comprobar si cabe en', valor: '0', opciones: LIMITES },
        { id: 'otro', etiqueta: 'Tu límite de caracteres', ph: '500', entero: true, mostrarSi: function (v) { return v.limite === 'otro'; } }
      ],
      procesar: function (t, op) {
        var g = TH.grafemas(t), letras = 0, cifras = 0, esp = 0, signos = 0;
        g.forEach(function (c) { if (/^\s+$/u.test(c)) esp++; else if (/^\p{L}/u.test(c)) letras++; else if (/^\p{N}/u.test(c)) cifras++; else signos++; });
        var lineas = t === '' ? 0 : t.split(/\r?\n/).length, bytes = new TextEncoder().encode(t).length;
        var lim = op.limite === 'otro' ? op.otro : parseInt(op.limite, 10), filas = [
          TH.fila('caracteres', 'Caracteres con espacios', g.length, 'n0'), TH.fila('sin-espacios', 'Caracteres sin espacios', g.length - esp, 'n0'),
          TH.fila('letras', 'Letras', letras, 'n0'), TH.fila('digitos', 'Cifras', cifras, 'n0'), TH.fila('espacios', 'Espacios y saltos', esp, 'n0'),
          TH.fila('signos', 'Signos y símbolos', signos, 'n0'), TH.fila('lineas', 'Líneas', lineas, 'n0'), TH.fila('bytes', 'Bytes en UTF-8', bytes, 'n0')];
        var salida = '';
        if (lim > 0) {
          var resto = lim - g.length;
          filas.push(TH.fila('restantes', resto >= 0 ? 'Te quedan' : 'Te sobran', resto, function (n) { return TH.pl(Math.abs(n), 'carácter', 'caracteres'); }));
          salida = resto >= 0 ? 'Cabe: usas ' + g.length + ' de ' + lim + ' caracteres.' : 'No cabe: te pasas en ' + TH.pl(-resto, 'carácter', 'caracteres') + '. Límite: ' + lim + '.';
        } else if (op.limite === 'otro') salida = 'Escribe tu límite de caracteres para comprobarlo.';
        return { salida: salida, filas: filas, avisos: ['280', '160', '160b'].indexOf(op.limite) >= 0 ? ['Recuerda que en X los enlaces y algunos caracteres cuentan distinto, y que un SMS con tildes o emojis se parte en mensajes más cortos.'] : [] };
      }
    });
  });
})();

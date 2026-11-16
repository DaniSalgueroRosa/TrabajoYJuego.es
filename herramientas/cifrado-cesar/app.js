(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var ALFA = { es: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ', en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' };
    function mover(texto, desp, alfabeto) {
      var A = ALFA[alfabeto], n = A.length;
      return texto.split('').map(function (ch) {
        var m = ch === 'ñ' || ch === 'Ñ' ? ch : ch.normalize('NFD').replace(/[̀-ͯ]/g, ''), mayus = m === m.toUpperCase(), i = A.indexOf(m.toUpperCase());
        if (m.length !== 1 || i < 0) return ch.length === 1 && /[A-Za-zÑñ]/.test(ch) ? ch : (m.length === 1 ? m : ch);
        var r = A.charAt(((i + desp) % n + n) % n);
        return mayus ? r : r.toLowerCase();
      }).join('');
    }
    TH.texto(raiz, {
      entrada: { etiqueta: 'Texto', ph: 'Escribe o pega el mensaje', ejemplo: 'Nos vemos mañana a las ocho' },
      salida: { etiqueta: 'Resultado' },
      descargar: { nombre: 'cifrado-cesar.txt' },
      opciones: [
        { id: 'modo', tipo: 'select', etiqueta: 'Qué hacer', valor: 'cifrar', opciones: [['cifrar', 'Cifrar'], ['descifrar', 'Descifrar'], ['todos', 'Ver los 25 desplazamientos']] },
        { id: 'desp', tipo: 'select', etiqueta: 'Desplazamiento', valor: '3', opciones: Array.apply(null, Array(25)).map(function (_, i) { return [String(i + 1), String(i + 1) + (i + 1 === 13 ? ' (ROT13)' : '')]; }) },
        { id: 'alfabeto', tipo: 'select', etiqueta: 'Alfabeto', valor: 'es', opciones: [['es', 'Español (27 letras, con Ñ)'], ['en', 'Inglés (26 letras)']] }
      ],
      procesar: function (t, op) {
        if (!t) return { salida: '' };
        var d = parseInt(op.desp, 10), filas = [TH.fila('letras', 'Letras del alfabeto', ALFA[op.alfabeto].length, 'n0')];
        if (op.modo === 'todos') {
          var n = ALFA[op.alfabeto].length, l = [];
          for (var i = 1; i < n; i++) l.push(i + ': ' + mover(t, -i, op.alfabeto));
          return { salida: l.join('\n'), filas: filas };
        }
        return { salida: mover(t, op.modo === 'cifrar' ? d : -d, op.alfabeto), filas: filas };
      }
    });
  });
})();

(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var ARRIBA = 'abcdefghijklmnopqrstuvwxyz', ABAJO = 'ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz';
    var MAYUS = { A: '∀', B: 'ᗺ', C: 'Ɔ', D: 'ᗡ', E: 'Ǝ', F: 'Ⅎ', G: '⅁', H: 'H', I: 'I', J: 'ſ', K: '⋊', L: '⅂', M: 'W', N: 'N', O: 'O', P: 'Ԁ', Q: 'Ό', R: 'ᴚ', S: 'S', T: '⊥', U: '∩', V: 'Λ', W: 'M', X: 'X', Y: '⅄', Z: 'Z' };
    var OTROS = { '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ', '8': '8', '9': '6', '.': '˙', ',': '\'', '\'': ',', '?': '¿', '¿': '?', '!': '¡', '¡': '!', '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '&': '⅋', '_': '‾', '"': '„', ';': '؛' };
    function volteo(c) { var i = ARRIBA.indexOf(c); return i >= 0 ? ABAJO.charAt(i) : MAYUS[c] || OTROS[c] || c; }
    function inv(s) { return TH.grafemas(s).reverse().join(''); }
    function sinTildes(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC'); }
    TH.texto(raiz, {
      entrada: { etiqueta: 'Escribe o pega tu texto', ph: 'Escribe aquí…', ejemplo: 'Anita lava la tina\nHola mundo cruel' },
      salida: { etiqueta: 'Texto invertido' },
      opciones: [{ id: 'modo', tipo: 'select', etiqueta: 'Invertir', valor: 'letras', ancho: 'completo', opciones: [['letras', 'Todas las letras (de atrás hacia delante)'], ['palabras', 'El orden de las palabras de cada línea'], ['cada', 'Las letras de cada palabra, sin mover las palabras'], ['lineas', 'El orden de las líneas'], ['abajo', 'Texto boca abajo (¿ɐsıɯ ɐןoɥ)']] }],
      descargar: { nombre: 'texto-invertido.txt' },
      procesar: function (t, op) {
        var s, avisos = [];
        switch (op.modo) {
          case 'letras': s = inv(t); break;
          case 'palabras': s = t.split('\n').map(function (l) { return l.split(/[ \t]+/).filter(function (w) { return w !== ''; }).reverse().join(' '); }).join('\n'); break;
          case 'cada': s = t.replace(TH.RE_PALABRA, inv); break;
          case 'lineas': s = t.split('\n').reverse().join('\n'); break;
          default: var base = sinTildes(t); if (base !== t) avisos.push('En el texto boca abajo se pierden las tildes y la diéresis, porque no existen letras volteadas equivalentes.');
            s = TH.grafemas(base).reverse().map(volteo).join('');
        }
        var plano = sinTildes(t).toLocaleLowerCase('es').replace(/[^\p{L}\p{N}]/gu, ''), filas = [];
        if (plano.length > 0) { var pal = plano === Array.from(plano).reverse().join(''); filas.push({ k: 'palindromo', t: '¿Se lee igual al revés?', v: pal ? 'si' : 'no', f: pal ? 'Sí, es un palíndromo' : 'No' }); }
        return { salida: s, filas: filas, avisos: avisos };
      }
    });
  });
})();

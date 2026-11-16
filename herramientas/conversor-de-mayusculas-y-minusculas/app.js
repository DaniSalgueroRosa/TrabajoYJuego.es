(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var MODOS = [['mayusculas', 'MAYÚSCULAS'], ['minusculas', 'minúsculas'], ['titulo', 'Cada Palabra En Mayúscula Inicial'], ['frase', 'Solo la primera letra de cada frase'], ['alterna', 'aLtErNaDa'], ['invertir', 'iNVERTIR mayúsculas y minúsculas']];
    function sup(s) { return s.toLocaleUpperCase('es'); }
    function inf(s) { return s.toLocaleLowerCase('es'); }
    TH.texto(raiz, {
      entrada: { etiqueta: 'Escribe o pega tu texto', ph: 'Pega aquí tu texto…', ejemplo: 'hOLA, esto es un ejemplo. ¿qué tal? el ÑANDÚ corre MUY rápido' },
      salida: { etiqueta: 'Texto convertido' },
      opciones: [{ id: 'modo', tipo: 'select', etiqueta: 'Convertir a', valor: 'mayusculas', opciones: MODOS, ancho: 'completo' }],
      descargar: { nombre: 'texto-convertido.txt' },
      procesar: function (t, op) {
        switch (op.modo) {
          case 'mayusculas': return sup(t);
          case 'minusculas': return inf(t);
          case 'titulo': return inf(t).replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu, function (m, a, b) { return a + sup(b); });
          case 'frase': return inf(t).replace(/(^|[.!?…]+\s+|\n+)([¿¡"'«“(\s]*)(\p{L})/gu, function (m, a, b, c) { return a + b + sup(c); });
          case 'alterna': var n = 0; return Array.from(t).map(function (c) { if (!/\p{L}/u.test(c)) return c; return n++ % 2 === 0 ? inf(c) : sup(c); }).join('');
          default: return Array.from(t).map(function (c) { return c === sup(c) ? inf(c) : sup(c); }).join('');
        }
      }
    });
  });
})();

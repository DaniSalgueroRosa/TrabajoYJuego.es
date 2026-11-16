(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.texto(raiz, {
      entrada: { etiqueta: 'Escribe o pega tu texto', ph: 'Pega aquí tu texto…', ejemplo: 'El zorro marrón salta sobre el perro perezoso. El perro no se mueve.\n\nSegundo párrafo: ¿qué pasará ahora con el zorro?' },
      salida: { etiqueta: 'Palabras más repetidas' },
      opciones: [{ id: 'minimo', tipo: 'select', etiqueta: 'En la lista de repetidas, contar palabras de al menos', valor: '3', opciones: [['1', '1 letra'], ['2', '2 letras'], ['3', '3 letras'], ['4', '4 letras'], ['5', '5 letras']] }],
      procesar: function (t, op) {
        var pal = t.match(TH.RE_PALABRA) || [];
        var frases = t.split(/[.!?…]+(?=\s|$)|\n+/).filter(function (s) { return /[\p{L}\p{N}]/u.test(s); }).length;
        var parrafos = t.split(/\n\s*\n/).filter(function (s) { return /[\p{L}\p{N}]/u.test(s); }).length;
        var cuenta = {}, unicas = 0, min = +op.minimo;
        pal.forEach(function (p) { var k = p.toLocaleLowerCase('es'); if (!cuenta[k]) { cuenta[k] = 0; unicas++; } cuenta[k]++; });
        var rep = Object.keys(cuenta).filter(function (k) { return cuenta[k] > 1 && Array.from(k).length >= min; });
        var col = new Intl.Collator('es');
        rep.sort(function (a, b) { return cuenta[b] - cuenta[a] || col.compare(a, b); });
        var salida = pal.length === 0 ? '' : rep.length ? rep.slice(0, 20).map(function (k) { return k + ': ' + cuenta[k]; }).join('\n') : 'Ninguna palabra se repite con ese mínimo de letras.';
        return { salida: salida, filas: [
          TH.fila('palabras', 'Palabras', pal.length, 'n0'), TH.fila('caracteres', 'Caracteres con espacios', TH.grafemas(t).length, 'n0'),
          TH.fila('sin-espacios', 'Caracteres sin espacios', TH.grafemas(t.replace(/\s/gu, '')).length, 'n0'), TH.fila('frases', 'Frases', frases, 'n0'),
          TH.fila('parrafos', 'Párrafos', parrafos, 'n0'), TH.fila('unicas', 'Palabras distintas', unicas, 'n0')] };
      }
    });
  });
})();

(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var BASE = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum ' +
      'perspiciatis unde omnis iste natus error voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis quasi architecto beatae vitae dicta explicabo nemo ipsam quia voluptas aspernatur aut odit fugit consequuntur magni dolores eos ratione sequi nesciunt neque porro quisquam dolorem adipisci numquam eius modi tempora incidunt magnam quaerat').split(' ');
    var INICIO = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet,', 'consectetur', 'adipiscing', 'elit'];
    function entre(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function palabra() { return BASE[Math.floor(Math.random() * BASE.length)]; }
    function mayus(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function frase(primera) {
      if (primera) return INICIO.join(' ') + '.';
      var n = entre(6, 14), w = [], i;
      for (i = 0; i < n; i++) w.push(palabra());
      if (n >= 9 && Math.random() < 0.5) { var c = entre(3, n - 3); w[c] += ','; }
      return mayus(w.join(' ')) + '.';
    }
    function parrafo(primero) { var n = entre(3, 6), f = [], i; for (i = 0; i < n; i++) f.push(frase(primero && i === 0)); return f.join(' '); }
    var api = TH.texto(raiz, {
      sinEntrada: true, filas: 12,
      salida: { etiqueta: 'Texto generado' },
      botones: [{ texto: 'Generar otro', accion: function (a) { a.actualizar(); } }],
      opciones: [
        { id: 'tipo', tipo: 'select', etiqueta: 'Generar', valor: 'parrafos', opciones: [['parrafos', 'Párrafos'], ['frases', 'Frases'], ['palabras', 'Palabras']] },
        { id: 'cantidad', etiqueta: 'Cantidad', valor: '3', entero: true, min: 1 },
        { id: 'inicio', tipo: 'check', etiqueta: 'Empezar con «Lorem ipsum dolor sit amet»', valor: true },
        { id: 'html', tipo: 'check', etiqueta: 'Envolver en etiquetas HTML <p>', valor: false }
      ],
      descargar: { nombre: 'lorem-ipsum.txt' },
      procesar: function (t, op) {
        var n = op.cantidad, max = op.tipo === 'parrafos' ? 100 : op.tipo === 'frases' ? 500 : 5000, unidad = op.tipo === 'parrafos' ? 'párrafos' : op.tipo === 'frases' ? 'frases' : 'palabras';
        if (!(n >= 1) || n !== Math.floor(n)) return { salida: '', avisos: ['Escribe cuántos ' + unidad + ' quieres, con un número entero de 1 en adelante.'] };
        if (n > max) return { salida: '', avisos: ['Con esta opción puedes generar como máximo ' + max + ' ' + unidad + ' de una vez.'] };
        var bloques = [], i;
        if (op.tipo === 'parrafos') for (i = 0; i < n; i++) bloques.push(parrafo(op.inicio && i === 0));
        else if (op.tipo === 'frases') { var f = []; for (i = 0; i < n; i++) f.push(frase(op.inicio && i === 0)); bloques.push(f.join(' ')); }
        else {
          var w = []; for (i = 0; i < n; i++) w.push(op.inicio && i < INICIO.length ? INICIO[i] : palabra());
          var s = w.join(' ').replace(/,$/, ''); bloques.push(mayus(s) + '.');
        }
        var plano = bloques.join('\n\n'), pal = plano.match(TH.RE_PALABRA) || [], frasesN = (plano.match(/\./g) || []).length;
        return { salida: op.html ? bloques.map(function (b) { return '<p>' + b + '</p>'; }).join('\n') : plano,
          filas: [TH.fila('parrafos', 'Párrafos', bloques.length, 'n0'), TH.fila('frases', 'Frases', frasesN, 'n0'), TH.fila('palabras', 'Palabras', pal.length, 'n0'), TH.fila('caracteres', 'Caracteres', plano.length, 'n0')] };
      }
    });
  });
})();

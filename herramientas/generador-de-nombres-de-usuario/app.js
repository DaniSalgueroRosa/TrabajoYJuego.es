(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    Promise.all([TH.script('lib/azar.js'), TH.script('lib/palabras-es.js')]).then(function () {
      var cg = raiz.querySelector('#herr-carga');
      if (cg) cg.remove();

      var A = TH.azar, P = TH.listaPalabras.categorias, ADJ = ["alegre", "amable", "audaz", "azul", "brillante", "celeste", "dulce", "enorme", "feliz", "fiel", "fuerte", "gentil", "gris", "humilde", "leal", "libre", "lunar", "noble", "polar", "salvaje", "solar", "suave", "sutil", "tenaz", "valiente", "veloz", "verde", "digital"];
      var TEMAS = { animales: P.animales, naturaleza: P.naturaleza, comida: P.cocina, ciencia: P.ciencia, musica: P.musica, deportes: P.deportes }, todos = [];
      Object.keys(TEMAS).forEach(function (k) { TEMAS[k].forEach(function (w) { if (todos.indexOf(w) < 0) todos.push(w); }); });
      TEMAS.mix = todos;
      function aviso(t) { return { salida: '', avisos: [t] }; }
      TH.texto(raiz, {
        sinEntrada: true,
        salida: { etiqueta: 'Nombres de usuario' },
        filas: 10,
        botones: [{ texto: 'Generar otros', accion: function (api) { api.actualizar(); } }],
        descargar: { nombre: 'nombres-de-usuario.txt' },
        opciones: [
          { id: 'tema', tipo: 'select', etiqueta: 'Tema', valor: 'mix', opciones: [['mix', 'Mezcla de todos'], ['animales', 'Animales'], ['naturaleza', 'Naturaleza'], ['comida', 'Comida'], ['ciencia', 'Ciencia y espacio'], ['musica', 'Música'], ['deportes', 'Deportes']] },
          { id: 'estilo', tipo: 'select', etiqueta: 'Estructura', valor: 'na', opciones: [['na', 'Nombre y adjetivo (ZorroVeloz)'], ['an', 'Adjetivo y nombre (VelozZorro)'], ['n', 'Solo un nombre (Zorro)']] },
          { id: 'separador', tipo: 'select', etiqueta: 'Separador', valor: '', opciones: [['', 'Ninguno'], ['_', 'Guion bajo (_)'], ['.', 'Punto (.)'], ['-', 'Guion (-)']] },
          { id: 'mayus', tipo: 'check', etiqueta: 'Empezar cada palabra con mayúscula', valor: true },
          { id: 'numero', tipo: 'select', etiqueta: 'Número al final', valor: '0', opciones: [['0', 'Sin número'], ['2', 'De 2 cifras'], ['3', 'De 3 cifras'], ['4', 'De 4 cifras']] },
          { id: 'max', etiqueta: 'Longitud máxima', valor: 16, entero: true, ayuda: 'De 6 a 30 caracteres.' },
          { id: 'cantidad', etiqueta: 'Cuántos', valor: 10, entero: true, ayuda: 'De 1 a 50.' }
        ],
        procesar: function (t, op) {
          var max = op.max, n = op.cantidad;
          if (!(max >= 6 && max <= 30) || max !== Math.floor(max)) return aviso('La longitud máxima debe ser un número entero de 6 a 30.');
          if (!(n >= 1 && n <= 50) || n !== Math.floor(n)) return aviso('Pide entre 1 y 50 nombres, con un número entero.');
          var sep = op.separador, cif = parseInt(op.numero, 10), extra = cif ? cif + (op.estilo !== 'n' && sep ? 1 : 0) : 0, base = [];
          function cap(w) { return op.mayus ? w.charAt(0).toUpperCase() + w.slice(1) : w; }
          TEMAS[op.tema].forEach(function (x) {
            if (op.estilo === 'n') base.push(cap(x));
            else ADJ.forEach(function (a) { base.push(op.estilo === 'na' ? cap(x) + sep + cap(a) : cap(a) + sep + cap(x)); });
          });
          base = base.filter(function (b) { return b.length + extra <= max; });
          if (!base.length) return aviso('Con esa longitud máxima no cabe ningún nombre. Sube el límite o quita el número.');
          var k = Math.min(n, base.length), avisos = [];
          if (k < n) avisos.push('Con esas condiciones solo hay ' + base.length + ' nombres posibles; te muestro todos.');
          var lineas = A.muestra(base, k).map(function (b) { return cif ? b + (op.estilo === 'n' ? '' : sep) + A.entre(Math.pow(10, cif - 1), Math.pow(10, cif) - 1) : b; });
          return { salida: lineas.join('\n'), avisos: avisos, filas: [TH.fila('generados', 'Nombres generados', k, 'n0'), TH.fila('posibles', 'Combinaciones posibles con estas opciones', base.length, 'n0'),
            TH.fila('longitud-max', 'Nombre más largo', Math.max.apply(null, lineas.map(function (l) { return l.length; })), function (x) { return TH.fmt(x, 0) + ' caracteres'; })] };
        }
      });

    }, function () { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); });
  });
})();

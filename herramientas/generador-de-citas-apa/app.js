(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var h = TH.h;
    function inic(n) {
      return String(n || '').trim().split(/\s+/).filter(Boolean).map(function (p) {
        return p.split('-').map(function (x) { return x.replace(/\./g, ''); }).filter(Boolean).map(function (x) { return x.charAt(0).toUpperCase() + '.'; }).join('-');
      }).join(' ');
    }
    function fin(t) { t = String(t || '').trim(); return /[.?!…]$/.test(t) ? t : t + '.'; }
    function sinPunto(t) { return String(t || '').trim().replace(/\.$/, ''); }
    function doi(t) { t = String(t || '').trim(); return /^10\.\d{4,}\//.test(t) ? 'https://doi.org/' + t : t; }
    function parte(t, cursiva) { return { t: t, i: !!cursiva }; }
    function aTexto(ps) { return ps.map(function (p) { return p.t; }).join(''); }
    function aNodo(ps) { var s = h('span', {}); ps.forEach(function (p) { s.appendChild(p.i ? h('em', { texto: p.t }) : doc.createTextNode(p.t)); }); return s; }
    var doc = document;
    TH.calculadora(raiz, {
      campos: [
        { id: 'tipo', tipo: 'select', etiqueta: 'Tipo de fuente', valor: 'libro', opciones: [['libro', 'Libro'], ['articulo', 'Artículo de revista'], ['web', 'Página web']] },
        { id: 'idioma', tipo: 'select', etiqueta: 'Idioma de tu trabajo', valor: 'es', opciones: [['es', 'Español (y, s. f.)'], ['en', 'Inglés (&, n.d.)']] },
        { id: 'autores', tipo: 'lista', etiqueta: 'Autores (en orden). Para una organización, escribe su nombre en «Apellido» y deja las iniciales vacías', inicial: 1, min: 0, max: 20, textoAnadir: 'Añadir autor',
          columnas: [{ id: 'apellido', etiqueta: 'Apellido u organización', tipo: 'texto', ph: 'García Márquez' }, { id: 'nombre', etiqueta: 'Nombre (se abrevia)', tipo: 'texto', ph: 'Gabriel' }] },
        { id: 'anio', tipo: 'texto', etiqueta: 'Año', ph: '1967', max: 4 },
        { id: 'fecha', tipo: 'texto', etiqueta: 'Día y mes (solo páginas web, opcional)', ph: '12 de marzo', mostrarSi: function (v) { return v.tipo === 'web'; } },
        { id: 'titulo', tipo: 'texto', etiqueta: 'Título', ph: 'Cien años de soledad', ancho: 'completo' },
        { id: 'edicion', tipo: 'texto', etiqueta: 'Edición (opcional)', ph: '2.ª ed.', mostrarSi: function (v) { return v.tipo === 'libro'; } },
        { id: 'editorial', tipo: 'texto', etiqueta: 'Editorial', ph: 'Editorial Sudamericana', mostrarSi: function (v) { return v.tipo === 'libro'; } },
        { id: 'revista', tipo: 'texto', etiqueta: 'Nombre de la revista', ph: 'Revista de Educación', mostrarSi: function (v) { return v.tipo === 'articulo'; } },
        { id: 'volumen', tipo: 'texto', etiqueta: 'Volumen', ph: '12', mostrarSi: function (v) { return v.tipo === 'articulo'; } },
        { id: 'numero', tipo: 'texto', etiqueta: 'Número (opcional)', ph: '3', mostrarSi: function (v) { return v.tipo === 'articulo'; } },
        { id: 'paginas', tipo: 'texto', etiqueta: 'Páginas', ph: '45-67', mostrarSi: function (v) { return v.tipo === 'articulo'; } },
        { id: 'sitio', tipo: 'texto', etiqueta: 'Nombre del sitio web', ph: 'Ministerio de Educación', mostrarSi: function (v) { return v.tipo === 'web'; } },
        { id: 'url', tipo: 'texto', etiqueta: 'DOI o enlace (opcional)', ph: '10.1000/xyz123 o https://…', ancho: 'completo' }
      ],
      ejemplo: { tipo: 'libro', idioma: 'es', autores: [{ apellido: 'García Márquez', nombre: 'Gabriel' }], anio: '1967', titulo: 'Cien años de soledad', editorial: 'Editorial Sudamericana' },
      vacio: 'Rellena el título y, si lo conoces, los autores y el año: la referencia aparecerá aquí.',
      calcular: function (v) {
        var tit = v.titulo.trim();
        if (!tit) return { vacio: true };
        var es = v.idioma === 'es', y = es ? 'y' : '&', yNar = es ? 'y' : 'and', sf = es ? 's. f.' : 'n.d.';
        var aut = v.autores.filter(function (a) { return (a.apellido || '').trim(); }).map(function (a) { return { ap: a.apellido.trim(), in: inic(a.nombre) }; });
        var anio = v.anio.trim();
        if (anio && !/^\d{4}[a-z]?$/.test(anio)) return { error: 'El año debe tener cuatro cifras, como 2021 (o 2021a si repites autor y año).' };
        var fechaTxt = anio || sf;
        if (v.tipo === 'web' && v.fecha.trim() && anio) fechaTxt = anio + ', ' + v.fecha.trim();
        var nombres = aut.map(function (a) { return a.in ? a.ap + ', ' + a.in : a.ap; });
        var autores = '';
        if (nombres.length === 1) autores = nombres[0];
        else if (nombres.length === 2) autores = nombres[0] + ', ' + y + ' ' + nombres[1];
        else if (nombres.length > 2 && nombres.length <= 20) autores = nombres.slice(0, -1).join(', ') + ', ' + y + ' ' + nombres[nombres.length - 1];
        else if (nombres.length > 20) autores = nombres.slice(0, 19).join(', ') + ', . . . ' + nombres[nombres.length - 1];
        var ref = [], extra = doi(v.url);
        if (autores) ref.push(parte(fin(autores) + ' ')); 
        var cabeza = autores ? [parte('(' + fechaTxt + '). ')] : null;
        if (v.tipo === 'libro') {
          if (autores) ref = ref.concat(cabeza, [parte(sinPunto(tit), true), parte(v.edicion.trim() ? ' (' + sinPunto(v.edicion) + ')' : ''), parte('. ')]);
          else ref = [parte(sinPunto(tit), true), parte(v.edicion.trim() ? ' (' + sinPunto(v.edicion) + ')' : ''), parte('. (' + fechaTxt + '). ')];
          if (v.editorial.trim()) ref.push(parte(fin(v.editorial) + ' '));
        } else if (v.tipo === 'articulo') {
          if (autores) ref = ref.concat(cabeza, [parte(fin(tit) + ' ')]); else ref = [parte(fin(tit) + ' (' + fechaTxt + '). ')];
          if (v.revista.trim()) {
            ref.push(parte(v.revista.trim(), true));
            if (v.volumen.trim()) { ref.push(parte(', ')); ref.push(parte(v.volumen.trim(), true)); }
            if (v.numero.trim()) ref.push(parte('(' + v.numero.trim() + ')'));
            if (v.paginas.trim()) ref.push(parte(', ' + v.paginas.trim().replace(/\s*[-–]\s*/, '–')));
            ref.push(parte('. '));
          }
        } else {
          if (autores) ref = ref.concat(cabeza, [parte(sinPunto(tit), true), parte('. ')]); else ref = [parte(sinPunto(tit), true), parte('. (' + fechaTxt + '). ')];
          if (v.sitio.trim() && v.sitio.trim() !== aut.map(function (a) { return a.ap; }).join('')) ref.push(parte(fin(v.sitio) + ' '));
        }
        if (extra) ref.push(parte(extra));
        while (ref.length && !ref[ref.length - 1].t.trim()) ref.pop();
        if (ref.length) ref[ref.length - 1].t = ref[ref.length - 1].t.replace(/\s+$/, '');
        var apell = aut.map(function (a) { return a.ap; }), refTxt = aTexto(ref);
        var quien, quienNar, tituloCita = null;
        if (!apell.length) {
          var pal = sinPunto(tit).replace(/[:,;]$/, '').split(/\s+/), corto = pal.length <= 5 ? pal.join(' ') : pal.slice(0, 4).join(' ');
          tituloCita = { t: corto, i: v.tipo !== 'articulo' }; quien = quienNar = v.tipo === 'articulo' ? '«' + corto + '»' : corto;
        }
        else if (apell.length === 1) { quien = quienNar = apell[0]; }
        else if (apell.length === 2) { quien = apell[0] + ' ' + y + ' ' + apell[1]; quienNar = apell[0] + ' ' + yNar + ' ' + apell[1]; }
        else { quien = quienNar = apell[0] + ' et al.'; }
        var anioCita = anio || sf;
        var filaRef = TH.fila('referencia', 'Referencia', refTxt, 'txt'); filaRef.nodo = aNodo(ref);
        var fp = TH.fila('cita-parentetica', 'Cita entre paréntesis', '(' + quien + ', ' + anioCita + ')', 'txt');
        var fn = TH.fila('cita-narrativa', 'Cita narrativa', quienNar + ' (' + anioCita + ')', 'txt');
        if (tituloCita && tituloCita.i) { fp.nodo = aNodo([parte('('), parte(tituloCita.t, true), parte(', ' + anioCita + ')')]); fn.nodo = aNodo([parte(tituloCita.t, true), parte(' (' + anioCita + ')')]); }
        return { filas: [filaRef, fp, fn],
          sinDestacar: false, texto: refTxt, notas: ['Se respetan las mayúsculas del título tal como lo escribas. En APA solo llevan mayúscula la primera palabra y los nombres propios. La cursiva se ve en pantalla y no se copia como formato.'] };
      }
    });
  });
})();

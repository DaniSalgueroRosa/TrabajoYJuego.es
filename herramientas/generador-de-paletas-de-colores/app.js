(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    function errorCarga() { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); }
    var h = TH.h, C = null, base = { r: 51, g: 102, b: 204 }, lista = [];
    var ARMONIAS = [['complementaria', 'Complementaria (2 colores)'], ['analoga', 'Análoga (5 colores)'], ['triada', 'Tríada (3 colores)'], ['tetrada', 'Tétrada (4 colores)'], ['dividida', 'Complementaria dividida (3 colores)'], ['monocromatica', 'Monocromática (5 tonos)'], ['escala', 'Escala de 9 tonos']];
    TH.script('lib/color.js').then(function () { C = TH.color; construir(); }, errorCarga);
    function construir() {
      TH.vaciar(raiz);
      var estado = TH.estado(raiz), avisoError = h('p', { class: 'herr-estado herr-estado--error', role: 'alert', 'data-k': 'error', hidden: true });
      var sel = h('input', { id: 'c-base-selector', type: 'color', value: '#3366cc' });
      var hex = h('input', { id: 'c-base', type: 'text', autocomplete: 'off', maxlength: '7', spellcheck: 'false', value: '#3366CC' });
      var armonia = h('select', { id: 'c-armonia' }, ARMONIAS.map(function (a) { return h('option', { value: a[0] }, a[1]); }));
      var muestras = h('ul', { class: 'pal-muestras', 'data-k': 'paleta', 'aria-label': 'Colores de la paleta' }), codigo = h('pre', { id: 'pal-css' });
      var salida = h('div', { class: 'herr-salida', hidden: true });
      function limitar(x, a, b) { return Math.min(b, Math.max(a, x)); }
      function generar() {
        var hsl = C.aHsl(base), t = armonia.value;
        function giro(d) { return d === 0 ? base : C.deHsl(hsl.h + d, hsl.s, hsl.l); }
        if (t === 'complementaria') return [0, 180].map(giro);
        if (t === 'analoga') return [-60, -30, 0, 30, 60].map(giro);
        if (t === 'triada') return [0, 120, 240].map(giro);
        if (t === 'tetrada') return [0, 90, 180, 270].map(giro);
        if (t === 'dividida') return [0, 150, 210].map(giro);
        if (t === 'monocromatica') return [-30, -15, 0, 15, 30].map(function (d) { return d === 0 ? base : C.deHsl(hsl.h, hsl.s, limitar(hsl.l + d, 6, 96)); });
        return [95, 85, 75, 65, 55, 45, 35, 25, 15].map(function (l) { return C.deHsl(hsl.h, hsl.s, l); });
      }
      function pintar(origen) {
        lista = generar();
        var codigos = lista.map(C.aHex);
        if (origen !== hex) hex.value = C.aHex(base);
        if (origen !== sel) sel.value = C.aHex(base).toLowerCase();
        TH.vaciar(muestras); muestras.setAttribute('data-v', codigos.join(','));
        lista.forEach(function (c, i) {
          muestras.appendChild(h('li', {}, h('button', { class: 'pal-muestra', type: 'button', style: 'background:' + codigos[i] + ';color:' + C.textoSobre(c), 'aria-label': 'Copiar ' + codigos[i], onclick: function () { TH.copiar(codigos[i], estado); } }, codigos[i])));
        });
        codigo.textContent = ':root {\n' + codigos.map(function (x, i) { return '  --color-' + (i + 1) + ': ' + x + ';'; }).join('\n') + '\n}';
        codigo.setAttribute('data-v', codigo.textContent);
      }
      function errorHex(m) { avisoError.hidden = !m; avisoError.textContent = m || ''; if (m) hex.setAttribute('aria-invalid', 'true'); else hex.removeAttribute('aria-invalid'); }
      var HEXOK = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
      sel.addEventListener('input', function () { base = C.analizar(sel.value); errorHex(''); pintar(sel); });
      hex.addEventListener('input', function () { if (HEXOK.test(hex.value.trim())) { base = C.analizar(hex.value); errorHex(''); pintar(hex); } });
      hex.addEventListener('change', function () { if (HEXOK.test(hex.value.trim())) { errorHex(''); pintar(); } else errorHex('El código HEX debe tener 3 o 6 cifras (de 0 a 9 y de A a F), como #3366CC.'); });
      armonia.addEventListener('change', function () { pintar(); });
      function entregar(nombre, blob) { TH.entregas = [{ nombre: nombre, blob: blob }]; TH.descargar(blob, nombre); }
      function boton(t, fn, sec) { return h('button', { class: 'boton' + (sec === false ? '' : ' boton--secundario'), type: 'button', onclick: fn }, t); }
      var acciones = h('div', { class: 'herr-acciones' },
        boton('Color aleatorio', function () { base = C.deHsl(Math.random() * 360, 45 + Math.random() * 40, 35 + Math.random() * 30); errorHex(''); pintar(); }, false),
        boton('Copiar los códigos HEX', function () { TH.copiar(lista.map(C.aHex).join(', '), estado); }),
        boton('Copiar como variables CSS', function () { TH.copiar(codigo.textContent, estado); }),
        boton('Descargar como imagen PNG', function () {
          var cs = lista.map(C.aHex), lado = 200, c = h('canvas'); c.width = lado * cs.length; c.height = lado + 56;
          var g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
          cs.forEach(function (x, i) { g.fillStyle = x; g.fillRect(i * lado, 0, lado, lado); g.fillStyle = '#111111'; g.font = '700 22px sans-serif'; g.textAlign = 'center'; g.fillText(x, i * lado + lado / 2, lado + 36); });
          TH.lienzoABlob(c, 'image/png').then(function (b) { entregar('paleta-' + cs[0].slice(1).toLowerCase() + '.png', b); estado.poner('Imagen de la paleta descargada.', 'ok'); });
        }));
      raiz.appendChild(avisoError);
      raiz.appendChild(h('div', { class: 'herr-campos' },
        h('div', { class: 'campo' }, h('label', { for: 'c-base-selector', texto: 'Color base' }), sel),
        h('div', { class: 'campo' }, h('label', { for: 'c-base', texto: 'Código HEX del color base' }), hex),
        h('div', { class: 'campo' }, h('label', { for: 'c-armonia', texto: 'Tipo de paleta' }), armonia)));
      raiz.appendChild(muestras); raiz.appendChild(acciones);
      raiz.appendChild(h('div', { class: 'herr-codigo' }, h('p', { class: 'herr-chico', texto: 'Variables CSS de la paleta:' }), codigo));
      pintar();
    }
  });
})();

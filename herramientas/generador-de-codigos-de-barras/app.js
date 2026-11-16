(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    function errorCarga() { TH.vaciar(raiz).appendChild(TH.h('p', { class: 'herr-estado herr-estado--error', role: 'alert', texto: 'No se ha podido cargar la herramienta. Recarga la página.' })); }
    var h = TH.h, B = null, actual = null;
    var TIPOS = [['ean13', 'EAN-13 (productos, 13 cifras)'], ['ean8', 'EAN-8 (envases pequeños, 8 cifras)'], ['upca', 'UPC-A (EE. UU. y Canadá, 12 cifras)'], ['code128', 'Code 128 (texto libre)']];
    var EJEMPLOS = { ean13: '400638133393', ean8: '9638507', upca: '03600029145', code128: 'ABC-12345' };
    TH.script('lib/barras.js').then(function () { B = TH.barras; construir(); }, errorCarga);
    function construir() {
      TH.vaciar(raiz);
      var estado = TH.estado(raiz);
      function lista(id, etiqueta, ops, valor) {
        var s = h('select', { id: 'c-' + id }, ops.map(function (o) { return h('option', { value: o[0], selected: o[0] === valor }, o[1]); }));
        return { el: s, nodo: h('div', { class: 'campo' }, h('label', { for: 'c-' + id, texto: etiqueta }), s) };
      }
      var tipo = lista('tipo', 'Tipo de código', TIPOS, 'ean13');
      var codigo = { el: h('input', { id: 'c-codigo', type: 'text', placeholder: EJEMPLOS.ean13, autocomplete: 'off', spellcheck: 'false' }) };
      codigo.nodo = h('div', { class: 'campo' }, h('label', { for: 'c-codigo', texto: 'Número o texto' }), codigo.el,
        h('p', { class: 'campo-ayuda', id: 'ayuda-codigo' }));
      var modulo = lista('modulo', 'Ancho de las barras', [['1', 'Fino (1 px por módulo)'], ['2', 'Normal (2 px)'], ['3', 'Grande (3 px)'], ['4', 'Muy grande (4 px)'], ['6', 'Extra grande (6 px)']], '2');
      var alto = lista('alto', 'Altura de las barras', [['60', 'Baja (60 px)'], ['80', 'Normal (80 px)'], ['100', 'Alta (100 px)'], ['150', 'Muy alta (150 px)']], '80');
      var texto = h('input', { id: 'c-texto', type: 'checkbox', checked: true });
      var color = h('input', { id: 'c-color', type: 'color', value: '#000000' }), fondo = h('input', { id: 'c-fondo', type: 'color', value: '#ffffff' });
      var lienzo = h('canvas', { id: 'cb-lienzo', class: 'cb-lienzo', role: 'img', 'aria-label': 'Código de barras' });
      var vacio = h('p', { class: 'herr-vacio', 'data-k': 'vacio', texto: 'Escribe el número o el texto para ver aquí tu código de barras.' });
      var error = h('p', { class: 'herr-estado herr-estado--error', role: 'alert', 'data-k': 'error', hidden: true }), aviso = h('p', { class: 'herr-estado herr-estado--aviso', 'data-k': 'aviso', hidden: true });
      var info = h('div', { hidden: true });
      function entregar(nombre, blob) { TH.entregas = [{ nombre: nombre, blob: blob }]; TH.descargar(blob, nombre); estado.poner('Descargado: ' + nombre + ' (' + TH.tamano(blob.size) + ').', 'ok'); }
      function nombre(ext) { return (actual.c.tipo + '-' + actual.c.texto.replace(/[^A-Za-z0-9]+/g, '_')).slice(0, 48) + '.' + ext; }
      var bPng = h('button', { class: 'boton', type: 'button', id: 'cb-png', onclick: function () { TH.lienzoABlob(lienzo, 'image/png').then(function (b) { entregar(nombre('png'), b); }); } }, 'Descargar PNG');
      var bSvg = h('button', { class: 'boton boton--secundario', type: 'button', id: 'cb-svg', onclick: function () { entregar(nombre('svg'), new Blob([B.aSVG(actual.c, actual.op)], { type: 'image/svg+xml' })); } }, 'Descargar SVG');
      var bCopiar = h('button', { class: 'boton boton--secundario', type: 'button', id: 'cb-copiar', onclick: function () { TH.copiar(actual.c.texto, estado); } }, 'Copiar el número');
      var acciones = h('div', { class: 'herr-acciones', hidden: true }, bPng, bSvg, bCopiar);
      var bEjemplo = h('button', { class: 'boton boton--secundario', type: 'button', id: 'cb-ejemplo', onclick: function () { codigo.el.value = EJEMPLOS[tipo.el.value]; generar(); } }, 'Usar un ejemplo');

      function lum(hx) { var f = function (i) { var v = parseInt(hx.substr(i, 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(1) + 0.7152 * f(3) + 0.0722 * f(5); }
      function px(x) { return TH.fmt(x, 0) + ' px'; }
      function generar() {
        var t = tipo.el.value, txt = t === 'code128' ? codigo.el.value.trim() : codigo.el.value;
        codigo.el.placeholder = EJEMPLOS[t];
        $ayuda.textContent = t === 'code128' ? 'Letras sin tilde, cifras y signos del teclado, hasta ' + B.MAX_CODE128 + ' caracteres.' : 'Escribe ' + (B.TIPOS[t].cifras - 1) + ' cifras y se añade el dígito de control, o ' + B.TIPOS[t].cifras + ' si ya lo tienes.';
        error.hidden = true; aviso.hidden = true; error.textContent = ''; actual = null;
        if (txt.trim()) { try { actual = { c: B.generar(t, txt) }; } catch (e) { error.hidden = false; error.textContent = e.message; } }
        var hay = !!actual;
        lienzo.hidden = !hay; info.hidden = !hay; acciones.hidden = !hay; vacio.hidden = hay || !error.hidden;
        if (!hay) return;
        var c = actual.c, op = { modulo: +modulo.el.value, alto: +alto.el.value, texto: texto.checked, color: color.value, fondo: fondo.value };
        actual.op = op;
        var d = B.aLienzo(c, lienzo, op);
        lienzo.setAttribute('aria-label', 'Código de barras ' + c.nombre + ' con ' + (c.tipo === 'code128' ? 'el texto ' : 'el número ') + c.texto);
        var filas = [TH.fila('tipo', 'Tipo de código', c.nombre, 'txt'), TH.fila('codigo', c.tipo === 'code128' ? 'Texto codificado' : 'Número completo', c.texto, 'txt')];
        if (c.tipo === 'code128') filas.push(TH.fila('control', 'Valor de control', c.control, 'txt'), TH.fila('simbolos', 'Símbolos del código', c.simbolos.length, 'n0'));
        else filas.push(TH.fila('control', 'Dígito de control', c.control, 'txt'), TH.fila('origen-control', 'Origen del dígito', c.calculado ? 'Calculado por la herramienta' : 'Comprobado: coincide con el escrito', 'txt'));
        filas.push(TH.fila('modulos', 'Módulos de ancho', c.anchoModulos, 'n0'), TH.fila('ancho', 'Ancho de la imagen', d.ancho, px), TH.fila('alto', 'Alto de la imagen', d.alto, px));
        TH.vaciar(info).appendChild(TH.listaFilas(filas));
        var av = [], cc = lum(color.value), cf = lum(fondo.value), cr = (Math.max(cc, cf) + 0.05) / (Math.min(cc, cf) + 0.05);
        if (cc > cf) av.push('Las barras son más claras que el fondo. Muchos lectores no leen los códigos invertidos: usa barras oscuras sobre fondo claro.');
        else if (cr < 4) av.push('Hay poco contraste entre las barras y el fondo (' + TH.fmt(cr, 1) + ' a 1). Puede que algunos lectores no lo reconozcan.');
        if (op.modulo === 1) av.push('Con 1 px por módulo el código es muy pequeño: sirve para pantalla, pero para imprimirlo conviene un ancho mayor o el SVG.');
        if (c.tipo === 'ean13' && /^2/.test(c.texto)) av.push('Los EAN-13 que empiezan por 2 se reservan para el uso interno de cada tienda: no sirven para identificar un producto fuera de ella.');
        if (c.tipo === 'code128' && c.texto.length > 30) av.push('Con tantos caracteres el código queda muy ancho y puede costar leerlo a tamaño pequeño.');
        if (av.length) { aviso.hidden = false; aviso.textContent = av.join(' '); }
      }
      var $ayuda = codigo.nodo.querySelector('#ayuda-codigo');
      [tipo, modulo, alto].forEach(function (c) { c.el.addEventListener('change', generar); });
      codigo.el.addEventListener('input', generar);
      texto.addEventListener('change', generar);
      [color, fondo].forEach(function (e) { e.addEventListener('input', generar); });
      raiz.appendChild(h('div', { class: 'cb' },
        h('div', { class: 'cb-datos' }, tipo.nodo, codigo.nodo, h('div', { class: 'herr-acciones' }, bEjemplo),
          h('div', { class: 'herr-campos' }, modulo.nodo, alto.nodo,
            h('div', { class: 'campo' }, h('label', { for: 'c-color', texto: 'Color de las barras' }), color), h('div', { class: 'campo' }, h('label', { for: 'c-fondo', texto: 'Color del fondo' }), fondo)),
          h('div', { class: 'campo campo--check' }, h('span', { class: 'campo-check' }, texto, h('label', { for: 'c-texto', texto: 'Mostrar los números debajo de las barras' })))),
        h('div', { class: 'cb-resultado' }, error, vacio, lienzo, aviso, acciones, info)));
      generar();
    }
  });
})();

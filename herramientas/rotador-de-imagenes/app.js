(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var h = TH.h, I = null, im = null, nombre = 'imagen', giro = 0, hflip = false, vflip = false;
    var zona = TH.archivos(raiz, {
      aceptar: '.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/avif', aceptarTexto: 'JPG, PNG, WebP, GIF, BMP, SVG o AVIF', multiple: false,
      texto: 'Arrastra aquí la imagen que quieres girar o elígela desde tu dispositivo.',
      alCambiar: function (l) { if (l.length) cargar(l[0]); else cerrar(); }
    });
    var editor = h('div', { class: 'rot', hidden: true }), salida = h('div', { class: 'herr-salida', hidden: true });
    function lista(id, etiqueta, ops, valor, alCambiar) {
      var s = h('select', { id: 'c-' + id }, ops.map(function (o) { return h('option', { value: o[0], selected: o[0] === valor }, o[1]); }));
      if (alCambiar) s.addEventListener('change', alCambiar);
      return { el: s, nodo: h('div', { class: 'campo' }, h('label', { for: 'c-' + id, texto: etiqueta }), s) };
    }
    var vista = h('canvas', { class: 'rot-lienzo', role: 'img', 'aria-label': 'Vista previa de la imagen con los giros aplicados' });
    var medida = h('p', { class: 'herr-nota', 'data-k': 'medidas', 'aria-live': 'polite' });
    var anguloEl = h('input', { id: 'c-angulo', type: 'text', inputmode: 'decimal', autocomplete: 'off', value: '0' });
    var fondo = lista('fondo', 'Fondo de las esquinas al girar un ángulo libre', [['transparente', 'Transparente'], ['blanco', 'Blanco'], ['negro', 'Negro']], 'transparente', pintar);
    var formato = lista('formato', 'Guardar como', [['png', 'PNG'], ['jpg', 'JPG'], ['webp', 'WebP']], 'png');
    var calidadEl = h('input', { id: 'c-calidad', type: 'text', inputmode: 'numeric', autocomplete: 'off', value: '90' });
    function boton(texto, fn) { return h('button', { class: 'boton boton--secundario', type: 'button', onclick: fn }, texto); }
    function norm(v) { return ((v % 360) + 360) % 360; }
    function sumar(d) { giro = norm(giro + d); anguloEl.value = String(Math.round(giro * 100) / 100).replace('.', ','); pintar(); }
    editor.appendChild(h('div', { class: 'herr-acciones' },
      boton('Girar 90° a la derecha', function () { sumar(90); }), boton('Girar 90° a la izquierda', function () { sumar(-90); }), boton('Girar 180°', function () { sumar(180); }),
      boton('Voltear horizontalmente', function () { hflip = !hflip; giro = norm(-giro); anguloEl.value = String(giro).replace('.', ','); pintar(); }),
      boton('Voltear verticalmente', function () { vflip = !vflip; giro = norm(-giro); anguloEl.value = String(giro).replace('.', ','); pintar(); }),
      boton('Restablecer', function () { giro = 0; hflip = vflip = false; anguloEl.value = '0'; pintar(); })));
    editor.appendChild(h('div', { class: 'herr-campos' },
      h('div', { class: 'campo' }, h('label', { for: 'c-angulo', texto: 'Ángulo libre (grados, en sentido horario)' }), anguloEl),
      fondo.nodo, formato.nodo, h('div', { class: 'campo' }, h('label', { for: 'c-calidad', texto: 'Calidad en JPG y WebP (1 a 100)' }), calidadEl)));
    editor.appendChild(h('div', { class: 'rot-marco' }, vista));
    editor.appendChild(medida);
    editor.appendChild(h('div', { class: 'herr-acciones' }, h('button', { class: 'boton', type: 'button', id: 'rot-ejecutar', onclick: exportar }, 'Descargar la imagen')));
    raiz.appendChild(editor); raiz.appendChild(salida);
    anguloEl.addEventListener('input', function () { var v = TH.num(anguloEl.value); if (isFinite(v)) { giro = norm(v); pintar(); } });

    function medidas(escala) {
      var w = im.ancho * escala, hh = im.alto * escala, cuarto = giro % 90 === 0, ang = giro * Math.PI / 180;
      var cs = cuarto ? [[1, 0], [0, 1], [-1, 0], [0, -1]][giro / 90] : [Math.cos(ang), Math.sin(ang)];
      return { w: w, h: hh, cs: cs, cuarto: cuarto, cw: Math.max(1, Math.round(Math.abs(w * cs[0]) + Math.abs(hh * cs[1]))), ch: Math.max(1, Math.round(Math.abs(w * cs[1]) + Math.abs(hh * cs[0]))) };
    }
    function dibujar(escala) {
      var m = medidas(escala), c = I.lienzo(m.cw, m.ch), g = c.getContext('2d');
      if (!m.cuarto && fondo.el.value !== 'transparente') { g.fillStyle = fondo.el.value === 'blanco' ? '#ffffff' : '#000000'; g.fillRect(0, 0, c.width, c.height); }
      var sx = hflip ? -1 : 1, sy = vflip ? -1 : 1;
      g.setTransform(m.cs[0] * sx, m.cs[1] * sx, -m.cs[1] * sy, m.cs[0] * sy, c.width / 2, c.height / 2);
      g.imageSmoothingQuality = 'high';
      g.drawImage(im.fuente, 0, 0, im.ancho, im.alto, -m.w / 2, -m.h / 2, m.w, m.h);
      return c;
    }
    function pintar() {
      if (!im) return;
      var esc = Math.min(1, 900 / Math.max(im.ancho, im.alto)), c = dibujar(esc), f = medidas(1);
      vista.width = c.width; vista.height = c.height; vista.getContext('2d').drawImage(c, 0, 0);
      medida.textContent = 'Resultado: ' + f.cw + ' × ' + f.ch + ' px · giro de ' + (Math.round(giro * 100) / 100) + '°' + (hflip ? ' · volteada en horizontal' : '') + (vflip ? ' · volteada en vertical' : '');
      medida.setAttribute('data-v', f.cw + 'x' + f.ch);
      medida.setAttribute('data-giro', String(giro));
    }
    function cerrar() { editor.hidden = true; salida.hidden = true; if (im) { im.liberar(); im = null; } }
    function cargar(archivo) {
      TH.script('lib/imagenes.js').then(function () { I = TH.imagen; return I.abrir(archivo); }).then(function (nueva) {
        if (im) im.liberar();
        im = nueva; nombre = archivo.name; giro = 0; hflip = vflip = false; anguloEl.value = '0'; salida.hidden = true; zona.estado.limpiar();
        editor.hidden = false; pintar();
      }, function (e) { cerrar(); zona.estado.poner(e.message, 'error'); });
    }
    function exportar() {
      var fmt = formato.el.value, q = I.calidad(TH.num(calidadEl.value), 90);
      try {
        var c = dibujar(1);
        if (fmt === 'jpg') c = I.aplanar(c, fondo.el.value === 'negro' ? '#000000' : '#ffffff');
        I.exportar(c, fmt, q).then(function (blob) {
          TH.entrega(salida, [{ nombre: I.nombreSalida(nombre, 'girada', I.formatos[fmt].ext), blob: blob, nota: I.resumen(c.width, c.height) }]);
          zona.estado.poner('Listo: imagen de ' + c.width + ' × ' + c.height + ' px.', 'ok');
        }, function (e) { zona.estado.poner(e.message, 'error'); });
      } catch (e) { zona.estado.poner(e.message, 'error'); }
    }
  });
})();

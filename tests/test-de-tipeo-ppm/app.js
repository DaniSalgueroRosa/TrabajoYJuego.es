/* Test de tipeo (PPM): se escribe sobre un texto que se va mostrando. PPM = (caracteres correctos ÷ 5) ÷ minutos. */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  var FRASES = [
    'El tren de las ocho llegó con diez minutos de retraso, pero nadie en el andén parecía tener prisa.',
    'Cada mañana preparo un café largo y repaso la lista de cosas pendientes antes de abrir el correo.',
    'La biblioteca del barrio guarda más historias de las que caben en un solo invierno.',
    'Cuando llueve en la ciudad, los paraguas de colores hacen que las calles parezcan un jardín.',
    'Aprender a escribir sin mirar el teclado es cuestión de paciencia y de repetir lo mismo muchas veces.',
    'Mi abuela guardaba las fotos antiguas en una caja de galletas que olía a canela y a tiempo.',
    'Un buen mapa no solo enseña dónde estás, también sugiere adónde te apetece ir después.',
    'El mercado abre temprano: se oye el ruido de las cajas, el pregón de las frutas y las risas de los vecinos.',
    'Después de la tormenta, el cielo se quedó limpio y el campo olía a tierra mojada.',
    'Para cocinar un buen arroz hacen falta buen caldo, fuego lento y respeto por el reloj.',
    'Los domingos por la tarde caminamos hasta el río y contamos los patos que nadan junto al puente.',
    'Siempre llevo una libreta en la mochila por si se me ocurre una idea antes de que se me olvide.',
    'El faro todavía funciona: cada noche gira despacio y reparte su luz por las olas del puerto.',
    'Hay días en que todo sale a la primera y otros en que hasta el ordenador necesita un respiro.',
    'La profesora de música nos enseñó que el silencio entre dos notas también forma parte de la canción.',
    'Si estudias un poco cada día, al final del curso verás que has recorrido un camino enorme.',
    'En el taller de bicicletas huele a aceite y a goma, y siempre suena una radio vieja al fondo.',
    'Las nubes se juntaron sobre la montaña mientras el pastor reunía el rebaño antes del anochecer.',
    'Una mesa ordenada ayuda a pensar con claridad, aunque algunas ideas nacen entre papeles revueltos.',
    'El autobús nocturno recorre la ciudad vacía y sus ventanas parecen pequeñas pantallas encendidas.',
    'Nada une tanto a una familia como una sobremesa larga con pan, queso y conversación tranquila.',
    'Antes de enviar el mensaje léelo en voz baja: así se descubren las erratas y las frases demasiado largas.',
    'El jardinero poda los rosales en invierno para que en primavera florezcan con más fuerza.',
    'Subimos al mirador a media tarde y desde allí se veían los tejados, el campanario y el mar.',
    'La paciencia es una herramienta silenciosa: no hace ruido, pero termina de construir casi todo.',
    'En la estación de esquí la nieve crujía bajo las botas y el aire frío pinchaba en la nariz.',
    'Escribir deprisa sirve de poco si después hay que corregir la mitad de las palabras.',
    'El panadero amasa de madrugada y a las siete el barrio entero huele a pan recién hecho.',
    'Guardé la llave bajo la maceta, pero esta vez decidí cambiar de escondite por si acaso.',
    'Un reloj de arena marca el paso del tiempo sin necesidad de pilas, números ni pantallas.',
    'Cuando me pierdo en una ciudad nueva, sigo el sonido de las campanas hasta llegar a la plaza.',
    'La mejor fotografía suele ser la que se hace sin avisar: la risa de un niño, un gato sobre el muro.',
    'Para ahorrar energía basta con apagar las luces que no usas y desenchufar lo que no necesitas.',
    'El examen salió bien porque repasé con calma, dormí lo suficiente y desayuné algo ligero.',
    'En verano los pueblos se llenan de música, de sillas en la calle y de conversaciones hasta tarde.',
    'El carpintero lijó la madera con cuidado hasta que quedó suave como la palma de una mano.'
  ];
  var dur = 30, tildes = true, estado = 'espera', objetivo = '', clases = [], previo = '', t0 = 0, reloj = 0, panel = null;
  var pulsaciones = 0, errores = 0, cola = [];

  function sinTildes(t) { return t.replace(/ñ/g, '\u0001').replace(/Ñ/g, '\u0002').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ').replace(/\u0002/g, 'Ñ'); }
  function frase() {
    if (!cola.length) cola = TT.barajar(FRASES);
    var f = cola.pop();
    return tildes ? f : sinTildes(f);
  }
  function ampliar(hasta) { while (objetivo.length < hasta) { objetivo += (objetivo ? ' ' : '') + frase(); } }

  var chipsT = TT.chips([[15, '15 s'], [30, '30 s'], [60, '60 s'], [120, '2 min']], dur, function (v) { dur = v; reiniciar(); }, 'Duración del test');
  var chipsA = TT.chips([[true, 'Con tildes'], [false, 'Sin tildes']], tildes, function (v) { tildes = v; reiniciar(); }, 'Tildes');
  var datos = TT.datos([['t', 'Tiempo restante', TT.fmt(dur, 0) + ' s'], ['p', 'PPM ahora', '0'], ['a', 'Precisión', '100 %']]);
  var texto = TT.h('div', { class: 'tp-texto', 'aria-hidden': 'true' });
  var entrada = TT.h('textarea', { class: 'tp-entrada', 'aria-label': 'Escribe aquí el texto que ves en pantalla', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', rows: '1' });
  var invita = TT.h('p', { class: 'tp-invita' });
  var caja = TT.h('div', { class: 'tt-zona tp-caja' }, texto, entrada, invita);

  function pintar() {
    var v = entrada.value;
    var hasta = Math.max(v.length, previo.length) + 1;
    for (var i = 0; i < Math.min(hasta, objetivo.length); i++) {
      var c = i < v.length ? (v.charAt(i) === objetivo.charAt(i) ? 'ok' : 'mal') : (i === v.length ? 'ahora' : '');
      if (clases[i] !== c) { clases[i] = c; texto.children[i].className = c ? 'tp-' + c : ''; }
    }
    var actual = texto.children[Math.min(v.length, objetivo.length - 1)];
    if (actual) texto.scrollTop = Math.max(0, actual.offsetTop - texto.clientHeight / 3);
    previo = v;
  }
  function dibujar() {
    texto.textContent = ''; clases = [];
    for (var i = 0; i < objetivo.length; i++) { var sp = document.createElement('span'); sp.textContent = objetivo.charAt(i); texto.appendChild(sp); }
  }
  function correctos() { var v = entrada.value, n = 0; for (var i = 0; i < v.length && i < objetivo.length; i++) if (v.charAt(i) === objetivo.charAt(i)) n++; return n; }
  function precision() { return pulsaciones ? Math.round((pulsaciones - errores) / pulsaciones * 100) : 100; }

  function reiniciar() {
    clearInterval(reloj); reloj = 0; estado = 'espera'; cola = []; objetivo = ''; pulsaciones = 0; errores = 0; previo = '';
    ampliar(900); dibujar();
    entrada.value = ''; entrada.disabled = false;
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null; chipsT.bloquear(false); chipsA.bloquear(false);
    datos.poner('t', TT.fmt(dur, 0) + ' s', false); datos.poner('p', '0'); datos.poner('a', '100 %', false);
    invita.textContent = 'Haz clic aquí y empieza a escribir: el tiempo corre desde la primera letra.';
    pintar();
    if (document.activeElement && document.activeElement !== document.body) { try { entrada.focus({ preventScroll: true }); } catch (e) { /* sin foco */ } }
  }
  function tic() {
    var t = (performance.now() - t0) / 1000;
    if (t >= dur) { terminar(); return; }
    datos.poner('t', TT.fmt(dur - t, 0) + ' s', dur - t < 5);
    datos.poner('p', t > 2 ? String(Math.round(correctos() / 5 / (t / 60))) : '0');
    datos.poner('a', precision() + ' %');
  }
  entrada.addEventListener('input', function () {
    if (estado === 'fin') return;
    var v = entrada.value.replace(/[\r\n]+/g, ' ');
    if (v.length > objetivo.length) v = v.slice(0, objetivo.length);
    if (v !== entrada.value) entrada.value = v;
    if (estado === 'espera' && v.length) {
      estado = 'escribiendo'; t0 = performance.now(); chipsT.bloquear(true); chipsA.bloquear(true);
      reloj = setInterval(tic, 100); invita.textContent = ''; TT.anunciar('Empieza el test.');
    }
    for (var i = previo.length; i < v.length; i++) { pulsaciones++; if (v.charAt(i) !== objetivo.charAt(i)) errores++; }
    if (v.length > objetivo.length - 120) { ampliar(objetivo.length + 600); var ini = texto.children.length; for (var j = ini; j < objetivo.length; j++) { var sp = document.createElement('span'); sp.textContent = objetivo.charAt(j); texto.appendChild(sp); } }
    pintar();
  });
  entrada.addEventListener('paste', function (e) { e.preventDefault(); });
  entrada.addEventListener('drop', function (e) { e.preventDefault(); });
  caja.addEventListener('pointerdown', function () { if (estado !== 'fin') setTimeout(function () { entrada.focus({ preventScroll: true }); }, 0); });
  entrada.addEventListener('focus', function () { caja.classList.add('tp-activa'); });
  entrada.addEventListener('blur', function () { caja.classList.remove('tp-activa'); });

  function terminar() {
    clearInterval(reloj); reloj = 0; estado = 'fin'; entrada.disabled = true;
    var min = dur / 60, ok = correctos(), bruto = entrada.value.length, ppm = ok / 5 / min, pb = bruto / 5 / min, prec = precision();
    datos.poner('t', '0 s', false); datos.poner('p', String(Math.round(ppm))); datos.poner('a', prec + ' %');
    var rango = TT.rango(ppm, [
      [0, 'Principiante', 'Todo el mundo empieza escribiendo letra a letra. Con práctica diaria, la velocidad sube sin esfuerzo.'],
      [20, 'Aprendiz', 'Ya escribes con soltura, aunque todavía mirando el teclado de vez en cuando.'],
      [30, 'Ritmo normal', 'Una velocidad habitual en quien escribe a menudo con dos o tres dedos.'],
      [40, 'Buen ritmo', 'Escribes con fluidez. La mecanografía con diez dedos te llevaría más lejos.'],
      [55, 'Rápido', 'Un ritmo por encima de la mayoría de los usuarios.'],
      [70, 'Muy rápido', 'Velocidad de mecanógrafo con práctica.'],
      [90, 'Profesional', 'Ritmo de profesional del teclado.'],
      [110, 'Élite', 'Velocidad de competición.']]);
    var detalles = [['PPM netas (caracteres correctos)', TT.fmt(ppm, 0)], ['PPM brutas (todo lo escrito)', TT.fmt(pb, 0)], ['Precisión', prec + ' %'], ['Caracteres correctos', ok],
      ['Errores al teclear', errores], ['Duración', dur + ' s']];
    panel = TT.resultado(host, { titulo: 'Tu velocidad de tipeo', valor: TT.fmt(ppm, 0), unidad: 'PPM', rango: rango, detalles: detalles,
      copia: 'Escribo a ' + TT.fmt(ppm, 0) + ' palabras por minuto con un ' + prec + ' % de precisión.', alRepetir: reiniciar, textoRepetir: 'Otro texto' });
    TT.anunciar('Resultado: ' + TT.fmt(ppm, 0) + ' palabras por minuto, precisión ' + prec + ' por ciento.');
    TT.enfocar(panel);
  }

  host.appendChild(TT.h('div', { class: 'tt-fila' }, TT.h('p', { class: 'tt-etiqueta', texto: 'Duración' }), chipsT.nodo, TT.h('p', { class: 'tt-etiqueta', texto: 'Texto' }), chipsA.nodo));
  host.appendChild(datos.nodo);
  host.appendChild(caja);
  reiniciar();
})();

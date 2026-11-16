/* Reloj de la Muerte (de juego): calculadora de esperanza de vida con la media del INE (2024) y seis hábitos que suman o restan años.
   No es una predicción ni un dato médico. Edad, sexo y hábitos solo viven en esta página: no se envían ni se guardan. */
(function () {
  'use strict';
  var BASE = { m: 81.38, f: 86.53, t: 84.01 };
  var PREG = [
    { id: 'tabaco', t: 'Tabaco', o: [['n', 'Nunca he fumado', 1], ['e', 'Antes fumaba', 0], ['o', 'Fumo de vez en cuando', -2], ['d', 'Fumo a diario', -5]], ini: 'n' },
    { id: 'ejercicio', t: 'Ejercicio', o: [['a', 'Casi nada', -2], ['b', 'Algo, sin regularidad', 0], ['c', 'Regular, varias veces a la semana', 2]], ini: 'b' },
    { id: 'alcohol', t: 'Alcohol', o: [['a', 'Casi nunca', 0], ['b', 'Ocasional', 0], ['c', 'Mucho y con frecuencia', -2.5]], ini: 'a' },
    { id: 'sueno', t: 'Sueño', o: [['a', 'Menos de 6 horas', -1], ['b', 'Entre 6 y 8 horas', 0.5], ['c', 'Más de 9 horas', -0.5]], ini: 'b' },
    { id: 'comida', t: 'Alimentación', o: [['a', 'Poco cuidada', -1.5], ['b', 'Normal', 0], ['c', 'Cuidada, tipo mediterránea', 1.5]], ini: 'b' },
    { id: 'social', t: 'Relaciones y vida social', o: [['a', 'Pocas y me siento solo/a', -1.5], ['b', 'Las normales', 0], ['c', 'Una red cercana y fuerte', 1.5]], ini: 'b' }
  ];
  var host = TT.app();
  if (!host) return;
  var campoEdad = TT.h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '3', id: 'rm-edad', 'class': 'tt-campo rm-edad', 'aria-describedby': 'rm-error' });
  var error = TT.h('p', { 'class': 'tt-aviso', id: 'rm-error', role: 'alert', hidden: true });
  var sexo = TT.chips([['t', 'Prefiero no decirlo'], ['m', 'Hombre'], ['f', 'Mujer']], 't', null, 'Sexo para elegir la media');
  var chips = {};
  var form = TT.h('div', { 'class': 'rm' },
    TT.h('p', { 'class': 'tt-aviso', texto: 'Es un cálculo de juego con la esperanza de vida media de España (INE, 2024). No predice nada ni es un dato médico. Los datos que escribes no salen de esta página.' }),
    TT.h('div', { 'class': 'rm-bloque' }, TT.h('label', { 'for': 'rm-edad', 'class': 'rm-etiqueta', texto: 'Tu edad (en años)' }), campoEdad),
    TT.h('div', { 'class': 'rm-bloque' }, TT.h('span', { 'class': 'rm-etiqueta', id: 'rm-sexo', texto: 'Media que usar' }), sexo.nodo));
  PREG.forEach(function (p) {
    chips[p.id] = TT.chips(p.o.map(function (o) { return [o[0], o[1]]; }), p.ini, null, p.t);
    form.appendChild(TT.h('div', { 'class': 'rm-bloque' }, TT.h('span', { 'class': 'rm-etiqueta', texto: p.t }), chips[p.id].nodo));
  });
  var panel = null;
  form.appendChild(error);
  form.appendChild(TT.h('div', { 'class': 'tt-fila' }, TT.boton('Calcular mi reloj', calcular)));
  host.appendChild(form);
  campoEdad.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); calcular(); } });

  function calcular() {
    var edad = parseInt(campoEdad.value.replace(/\D/g, ''), 10);
    if (!(edad >= 10 && edad <= 100)) {
      error.textContent = 'Escribe una edad entre 10 y 100 años.'; error.hidden = false; campoEdad.setAttribute('aria-invalid', 'true'); campoEdad.focus(); return;
    }
    error.hidden = true; campoEdad.removeAttribute('aria-invalid');
    var s = sexo.valor(), base = BASE[s], ajustes = [], suma = 0;
    PREG.forEach(function (p) {
      var elegida = chips[p.id].valor(), o = p.o.filter(function (x) { return x[0] === elegida; })[0];
      suma += o[2]; ajustes.push({ nombre: p.t, nota: o[1], valor: o[2] });
    });
    var bruta = base + suma, minimo = edad + 5, estimada = Math.max(bruta, minimo), garantia = bruta < minimo;
    var restan = Math.round(estimada - edad), final = Math.round(estimada);
    var rango = TT.rango(restan, [
      [0, 'Cada año cuenta', 'El juego te da ya pocos años por delante, pero la media de la gente de tu edad se queda corta contigo muchas veces. Disfruta lo que viene.'],
      [15, 'Con tiempo para varias vidas', 'Te quedan por delante bastantes años de juego: da para cambios, viajes y proyectos.'],
      [35, 'Con la vida por delante', 'Tienes por delante décadas de juego. Hay tiempo para casi todo lo que te propongas.'],
      [60, 'Una historia muy larga por escribir', 'Queda muchísimo por delante en el juego. Pero tranquilo/a: el reloj de verdad no se puede leer con tanta precisión.']]);
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    form.hidden = true;
    var total = 100 * 52, vividas = edad * 52, previstas = Math.min(total, Math.round(estimada * 52));
    panel = TT.resultado(host, {
      titulo: 'Tu reloj de la estadística', valor: restan, unidad: 'años por delante (de juego)', rango: rango,
      extra: TT.h('div', { 'class': 'tt-res-extra' },
        TT.h('p', { 'class': 'tt-res-texto', texto: 'Edad estimada en el juego: ' + final + ' años (media de partida: ' + TT.fmt(base, 2) + ' años; hábitos: ' + (suma > 0 ? '+' : suma < 0 ? '−' : '') + TT.fmt(Math.abs(suma), 1) + ').' + (garantia ? ' Como ya superas la media, el juego te asegura al menos cinco años por delante.' : '') }),
        TT.h('div', {}, TT.h('h3', { texto: 'Tu vida en semanas (una casilla = una semana, hasta los 100)' }),
          TT.graf.semanas(vividas, previstas, total, { descripcion: 'Semanas vividas y por delante en el juego' }),
          TT.graf.leyenda([['Vividas', 'var(--t-texto)'], ['Por delante (de juego)', 'var(--t-acento)'], ['Más allá de la estimación', 'color-mix(in srgb, var(--t-texto) 35%, transparent)']])),
        TT.h('div', {}, TT.h('h3', { texto: 'Qué suma y qué resta' }), TT.graf.balanza(ajustes, { max: 6, unidad: ' años', decimales: 1, descripcion: 'Años que suma o resta cada hábito sobre la media' })),
        TT.h('p', { 'class': 'tt-aviso', texto: 'Esto es un juego con cifras redondas, no un estudio. La vida de cada persona depende de miles de cosas que ningún test mide. Si hablar de la muerte te pesa o pasas un mal momento, cuéntaselo a alguien de confianza; en España, el 024 atiende gratis las 24 horas.' })),
      detalles: [['Edad que has escrito', edad + ' años'], ['Media de partida (INE 2024)', TT.fmt(base, 2) + ' años'], ['Suma de hábitos', (suma > 0 ? '+' : suma < 0 ? '−' : '') + TT.fmt(Math.abs(suma), 1) + ' años'], ['Edad estimada (de juego)', final + ' años']],
      copia: 'En el reloj de juego me salen ' + restan + ' años por delante.',
      alRepetir: function () { panel.parentNode.removeChild(panel); panel = null; form.hidden = false; campoEdad.focus(); },
      textoRepetir: 'Calcular de nuevo'
    });
    TT.anunciar('Resultado: ' + restan + ' años por delante, de juego.');
    TT.enfocar(panel);
  }
})();

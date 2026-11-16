/* Calculadora de amor (de juego): cuenta cuántas veces aparecen las letras de LOVES (L, O, V, E, S) en los dos nombres y suma cifras vecinas
   hasta quedarse con dos. Es el método de siempre de las calculadoras de amor: mismo resultado en cualquier orden y sin tener nada que ver con el amor real.
   Los nombres no salen de la página ni se guardan. */
(function () {
  'use strict';
  var LETRAS = ['L', 'O', 'V', 'E', 'S'];
  var host = TT.app();
  if (!host) return;
  var uno = TT.h('input', { type: 'text', id: 'ca-uno', 'class': 'tt-campo ca-nombre', maxlength: '30', autocomplete: 'off', placeholder: 'Tu nombre' });
  var dos = TT.h('input', { type: 'text', id: 'ca-dos', 'class': 'tt-campo ca-nombre', maxlength: '30', autocomplete: 'off', placeholder: 'Su nombre' });
  var error = TT.h('p', { 'class': 'tt-aviso', id: 'ca-error', role: 'alert', hidden: true });
  var panel = null;
  var form = TT.h('div', { 'class': 'ca' },
    TT.h('p', { 'class': 'tt-aviso', texto: 'Es un juego: el amor no se calcula con letras. Escribe dos nombres (o apodos) y mira qué sale. Lo que escribas no sale de esta página ni se guarda.' }),
    TT.h('div', { 'class': 'ca-fila' },
      TT.h('div', { 'class': 'ca-campo' }, TT.h('label', { 'for': 'ca-uno', texto: 'Primer nombre' }), uno),
      TT.h('span', { 'class': 'ca-y', 'aria-hidden': 'true', texto: '+' }),
      TT.h('div', { 'class': 'ca-campo' }, TT.h('label', { 'for': 'ca-dos', texto: 'Segundo nombre' }), dos)),
    error,
    TT.h('div', { 'class': 'tt-fila' }, TT.boton('Calcular el amor', calcular)));
  host.appendChild(form);
  [uno, dos].forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); calcular(); } }); });

  function limpiar(t) { return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, ''); }
  function reducir(cuentas) {
    var a = cuentas.slice(), pasos = [a.slice()];
    while (a.length > 2) { var n = []; for (var i = 0; i < a.length - 1; i++) n.push((a[i] + a[i + 1]) % 10); a = n; pasos.push(a.slice()); }
    return { valor: a.length === 2 ? a[0] * 10 + a[1] : (a[0] || 0), pasos: pasos };
  }
  function calcular() {
    var a = limpiar(uno.value), b = limpiar(dos.value);
    if (!a || !b) { error.textContent = 'Escribe los dos nombres con alguna letra.'; error.hidden = false; (a ? dos : uno).focus(); return; }
    error.hidden = true;
    var junto = a + b, cuentas = LETRAS.map(function (l) { return junto.split(l).length - 1; });
    var r = reducir(cuentas), v = r.valor;
    var rango = TT.rango(v, [
      [0, 'Una chispa por encender', 'Los nombres no dicen mucho, y qué importa: el amor de verdad se construye con tiempo, humor y ganas, no con letras.'],
      [20, 'Amistad con posibilidades', 'Un buen punto de partida. Las mejores historias empiezan siendo amigos.'],
      [40, 'Buena base', 'Hay química de nombres. Falta lo importante: conoceros y reíros juntos.'],
      [60, 'Mucha afinidad', 'Los nombres se llevan de maravilla. Si además os lleváis bien en la vida real, mejor todavía.'],
      [80, 'Pareja de cuento', 'Un resultado de película. Recuerda que es un juego, pero disfrútalo.']]);
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    form.hidden = true;
    panel = TT.resultado(host, {
      titulo: 'Tu calculadora de amor', valor: v, unidad: '%', rango: rango,
      extra: TT.h('div', { 'class': 'tt-res-extra' },
        TT.h('div', {}, TT.h('h3', { texto: 'Medidor de afinidad' }), TT.graf.medidor(v, { izq: '0 %', der: '100 %', texto: v + ' %', descripcion: 'Afinidad de los nombres, de 0 a 100' })),
        TT.h('div', {}, TT.h('h3', { texto: 'Letras de LOVES que aparecen' }), TT.graf.barras(LETRAS.map(function (l, i) { return { nombre: l, valor: cuentas[i] }; }), { max: Math.max.apply(null, cuentas.concat([1])), unidad: '', descripcion: 'Cuántas veces aparece cada letra de LOVES en los dos nombres' })),
        TT.h('p', { 'class': 'tt-res-texto', texto: 'Así se llega: ' + r.pasos.map(function (p) { return p.join(' '); }).join(' → ') + '.' }),
        TT.h('p', { 'class': 'tt-aviso', texto: 'Esto es un juego sin base científica: el resultado solo depende de las letras de los nombres. No dice nada sobre lo que sentís de verdad.' })),
      detalles: [['Nombres', a.length + ' y ' + b.length + ' letras'], ['Letras de LOVES encontradas', cuentas.reduce(function (x, y) { return x + y; }, 0)]],
      copia: 'En la calculadora de amor de juego me han salido ' + v + ' %.',
      alRepetir: function () { panel.parentNode.removeChild(panel); panel = null; form.hidden = false; uno.focus(); }, textoRepetir: 'Probar con otros nombres'
    });
    TT.anunciar('Resultado: ' + v + ' por ciento.');
    TT.enfocar(panel);
  }
})();

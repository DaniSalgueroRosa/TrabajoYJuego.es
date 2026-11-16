/* Test lésbico: doce frases para quien se pregunta si le atraen las mujeres. Mide tres áreas (atracción, vínculos e ilusión de futuro, y comodidad con la palabra).
   No es un diagnóstico: la orientación no se decide con un test y las etiquetas son opcionales. */
(function () {
  'use strict';
  function e(t, d) { return { t: t, d: d, escala: 'acuerdo' }; }
  var P = [
    e('Me siento atraído/a por las mujeres.', { a: 1 }),
    e('Desde hace tiempo me llaman la atención algunas mujeres.', { a: 1 }),
    e('Me ilusiono o me enamoro de mujeres.', { a: 1 }),
    e('Me cuesta apartar la mirada de una mujer que me gusta.', { a: 1 }),
    e('Me imagino con una pareja mujer en el futuro.', { v: 1 }),
    e('Las historias de amor entre mujeres me hacen sentir reflejado/a.', { v: 1 }),
    e('Cuando me imagino una relación con un hombre, no me emociona.', { v: 1 }),
    e('Mis mejores recuerdos de ilusión romántica son con mujeres.', { v: 1 }),
    e('Me sentiría tranquilo/a si mi familia supiera que me gustan las mujeres.', { c: 1 }),
    e('Me siento cómodo/a pensando en la palabra «lesbiana» para mí.', { c: 1 }),
    e('Me gustaría conocer a otras personas a las que también les atraen las mujeres.', { c: 1 }),
    e('Pensar en esto me produce más curiosidad que miedo.', { c: 1 })
  ];
  var N = { a: 'Atracción', v: 'Vínculos y futuro', c: 'Comodidad con la palabra' };
  TT.cuestionario({
    intro: 'Pensado para quien se pregunta si le atraen las mujeres, sea cual sea su género. Responde para ti: no hay respuestas buenas o malas y nadie las ve.',
    escala: 'acuerdo',
    preguntas: P,
    resultado: function (c) {
      var dims = ['a', 'v', 'c'], v = Math.round(TT.media(dims.map(function (d) { return c.pct(d); })));
      var rango = TT.rango(v, [
        [0, 'Poca afinidad por ahora', 'Tus respuestas muestran poca afinidad con esta experiencia. Puede que no te interese, o que aún no lo hayas pensado. Todo está bien.'],
        [30, 'Curiosidad o atracción ocasional', 'Hay algo de atracción o curiosidad, sin una dirección clara. Explorar con calma y sin prisa es una opción válida.'],
        [55, 'Bastante afinidad', 'Tus respuestas muestran una atracción hacia las mujeres bastante presente. Si te ayuda, puedes explorar la palabra «lesbiana» u otras como bisexual, o simplemente no ponerle nombre.'],
        [75, 'Mucha afinidad', 'Tus respuestas muestran una atracción hacia las mujeres muy presente y cómoda. Muchas personas con un perfil así se identifican como lesbianas, y otras prefieren otras palabras.']]);
      return {
        titulo: 'Tu afinidad', valor: v, unidad: '/ 100', rango: rango,
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Medidor de afinidad' }), TT.graf.medidor(v, { izq: 'Poca', der: 'Mucha', texto: v + ' / 100', descripcion: 'Afinidad con la experiencia, sobre 100' })),
          TT.h('div', {}, TT.h('h3', { texto: 'Tres áreas' }), TT.graf.radar(dims.map(function (d) { return { nombre: N[d], valor: c.pct(d) }; }), { descripcion: 'Porcentaje en cada área' })),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Ningún test puede decirte si eres lesbiana: solo tú lo sabes. No hay prisa, no tienes que decidir una etiqueta y tampoco tienes que contárselo a nadie hasta que quieras. Si necesitas hablarlo, busca a una persona de confianza o una asociación LGTBI+ de tu zona.' })),
        detalles: dims.map(function (d) { return [N[d], TT.fmt(c.pct(d), 0) + ' %']; }),
        copia: 'En el test lésbico me ha salido una afinidad de ' + v + ' sobre 100.'
      };
    }
  });
})();

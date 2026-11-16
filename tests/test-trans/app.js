/* Test trans: doce frases para quien se pregunta cómo vive su género (cuerpo, nombre y pronombres, expresión y papeles sociales). Muestra cuánta distancia
   o comodidad hay con el género asignado al nacer. No es un diagnóstico: la identidad de género es una experiencia propia que solo la persona puede definir. */
(function () {
  'use strict';
  function e(t, d) { return { t: t, d: d, escala: 'acuerdo' }; }
  var P = [
    e('Con frecuencia siento que el género que me asignaron al nacer no me describe.', { s: 1 }),
    e('Me he preguntado más de una vez si soy una persona trans o no binaria.', { s: 1 }),
    e('Me siento a gusto con el género que me asignaron al nacer.', { s: -1 }),
    e('Me incomoda que me llamen por mi nombre o por los pronombres que uso ahora.', { n: 1 }),
    e('Me he imaginado viviendo con otro nombre u otros pronombres y me ha dado alegría.', { n: 1 }),
    e('Me gustaría que los demás me trataran con otros pronombres.', { n: 1 }),
    e('Hay rasgos de mi cuerpo asociados a mi género que me incomodan.', { c: 1 }),
    e('Me imagino con un cuerpo o una apariencia distinta y me siento mejor.', { c: 1 }),
    e('Me resulta natural la ropa y el aspecto que se espera de mi género.', { c: -1 }),
    e('Me siento a gusto con los papeles que se esperan de mi género.', { x: -1 }),
    e('He sentido más afinidad con las vivencias de otro género que con las del mío.', { x: 1 }),
    e('Hablar o pensar en esto me produce alivio, aunque también nervios.', { x: 1 })
  ];
  var N = { s: 'Identificación con el género asignado', n: 'Nombre y pronombres', c: 'Cuerpo y apariencia', x: 'Vivencia y entorno' };
  TT.cuestionario({
    intro: 'Pensado para quien se pregunta cómo vive su género. No hay respuestas correctas, nadie las ve y no hace falta decidir nada. Responde para ti y con calma.',
    escala: 'acuerdo',
    preguntas: P,
    resultado: function (c) {
      var dims = ['s', 'n', 'c', 'x'], v = Math.round(TT.media(dims.map(function (d) { return c.pct(d); })));
      var rango = TT.rango(v, [
        [0, 'Comodidad con tu género', 'Tus respuestas muestran, en general, comodidad con el género que te asignaron. Si tenías dudas, es una respuesta tan válida como cualquier otra.'],
        [30, 'Alguna duda o curiosidad', 'Hay momentos en que algo no encaja del todo. Es común, y explorarlo con calma no te compromete a nada.'],
        [55, 'Bastantes dudas o distancia', 'Tus respuestas muestran bastante distancia con el género asignado. Es un buen momento para explorar con calma, con alguien de confianza o con apoyo especializado.'],
        [75, 'Mucha distancia con el género asignado', 'Tus respuestas muestran mucha distancia con el género asignado al nacer. Un test no puede decir si eres trans, pero esto merece ser hablado, sin prisa y con apoyo.']]);
      return {
        titulo: 'Cómo vives tu género', valor: v, unidad: '/ 100', rango: rango,
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Del encaje a la distancia' }), TT.graf.espectro(v, { izq: 'Comodidad', der: 'Distancia', descripcion: 'Comodidad o distancia con el género asignado' })),
          TT.h('div', {}, TT.h('h3', { texto: 'Cuatro áreas' }), TT.graf.barras(dims.map(function (d) { return { nombre: N[d], valor: c.pct(d) }; }), { descripcion: 'Porcentaje en cada área' })),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Ningún test puede decirte si eres trans: la identidad de género es tuya y solo tú puedes definirla, con las palabras que quieras y al ritmo que quieras. Si lo necesitas, habla con alguien de confianza, con una asociación LGTBI+ de tu zona o con un profesional con formación en diversidad de género.' })),
        detalles: dims.map(function (d) { return [N[d], TT.fmt(c.pct(d), 0) + ' %']; }),
        copia: 'En el test trans me ha salido ' + v + ' sobre 100 en distancia con el género asignado.'
      };
    }
  });
})();

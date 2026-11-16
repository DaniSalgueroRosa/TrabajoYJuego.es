/* Test ¿Le gusto?: catorce señales cotidianas (atención, conversación, iniciativa y contexto) valoradas de «nunca» a «siempre» o de «nada de acuerdo» a «totalmente».
   Da una puntuación orientativa de señales; no adivina lo que siente nadie: solo hablarlo lo confirma. */
(function () {
  'use strict';
  function e(t, d, escala) { return { t: t, d: d, escala: escala || 'frecuencia' }; }
  var P = [
    e('Cuando cruzáis la mirada, la mantiene y sonríe.', { a: 1 }),
    e('Te busca con la mirada cuando llega a un sitio o a un grupo.', { a: 1 }),
    e('Se acuerda de detalles que le contaste hace tiempo.', { a: 1 }, 'acuerdo'),
    e('Se pone nervioso/a o se ríe más de lo normal cuando estás cerca.', { a: 1 }),
    e('Responde a tus mensajes con ganas y sin hacerse esperar demasiado.', { c: 1 }),
    e('Alarga las conversaciones y te hace preguntas sobre ti.', { c: 1 }),
    e('Comparte contigo bromas o confidencias que no cuenta a cualquiera.', { c: 1 }),
    e('Te escribe o te llama primero, sin que haya un motivo concreto.', { i: 1 }),
    e('Propone planes o busca excusas para veros.', { i: 1 }),
    e('Intenta estar cerca de ti o a solas contigo cuando hay más gente.', { i: 1 }),
    e('Os han comentado amigos o conocidos que parece interesado/a en ti.', { g: 1 }, 'acuerdo'),
    e('Os trata a todos igual: mismas bromas, misma atención y mismos gestos.', { g: -1 }, 'acuerdo'),
    e('Da señales contradictorias: un día cercano/a y otro distante sin explicación.', { c: -1 }),
    e('Se interesa por que conozcas a su gente o por conocer a la tuya.', { g: 1 }, 'acuerdo')
  ];
  var N = { a: 'Atención y miradas', c: 'Conversación y mensajes', i: 'Iniciativa y planes', g: 'Contexto y entorno' };
  TT.cuestionario({
    intro: 'Piensa en una persona concreta y responde según lo que has visto, no según lo que te gustaría que pasara. Es un juego orientativo: solo hablando con esa persona lo sabrás de verdad.',
    preguntas: P,
    resultado: function (c) {
      var dims = ['a', 'c', 'i', 'g'], v = Math.round(TT.media(dims.map(function (d) { return c.pct(d); })));
      var rango = TT.rango(v, [
        [0, 'Pocas señales por ahora', 'Hay muy poco que apunte a un interés especial. Puede que no le intereses de esa manera, o simplemente que no haya habido ocasión de conoceros mejor.'],
        [25, 'Señales flojas o ambiguas', 'Hay algunos gestos que pueden significar interés y otros que pueden ser simple amabilidad. Sin más datos es difícil saberlo.'],
        [45, 'Hay interés, pero falta claridad', 'Varias señales apuntan a que le caes muy bien y quizá algo más. Una conversación o un plan sencillo ayudarán a salir de dudas.'],
        [65, 'Señales claras de interés', 'Lo que describes encaja con alguien a quien le gustas, o al menos con alguien que quiere conocerte mejor.'],
        [85, 'Muchas señales a tu favor', 'Casi todo lo que cuentas apunta a un interés claro. Lo mejor que puedes hacer ahora es ser sincero/a y dar tú el paso.']]);
      return {
        titulo: 'Tus señales', valor: v, unidad: '/ 100', rango: rango,
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Medidor de señales' }), TT.graf.medidor(v, { izq: 'Pocas', der: 'Muchas', texto: v + ' / 100', descripcion: 'Señales de interés sobre 100' })),
          TT.h('div', {}, TT.h('h3', { texto: 'De dónde salen' }), TT.graf.barras(dims.map(function (d) { return { nombre: N[d], valor: c.pct(d) }; }), { descripcion: 'Porcentaje de señales en cada área' })),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Esto no adivina lo que siente nadie. Las señales se pueden malinterpretar y cada persona muestra el interés a su manera. La única forma de saberlo es hablar con respeto, y si la respuesta es un «no», se acepta.' })),
        detalles: dims.map(function (d) { return [N[d], TT.fmt(c.pct(d), 0) + ' %']; }),
        copia: 'En el test ¿Le gusto? me han salido ' + v + ' señales de 100.'
      };
    }
  });
})();

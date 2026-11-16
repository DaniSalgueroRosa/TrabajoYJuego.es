/* Test Omegaverse (Alfa, Beta u Omega): doce situaciones con tres respuestas. Del universo ficticio de las historias de fans solo se toman los tres papeles
   como arquetipos de personalidad (liderar, equilibrar, sentir). Nada de biologías inventadas: es un juego de personalidad. */
(function () {
  'use strict';
  function q(t, a, b, o) { return { t: t, o: [[a, { a: 1 }], [b, { b: 1 }], [o, { o: 1 }]] }; }
  var P = [
    q('En un grupo nuevo, normalmente…', 'Tomo la iniciativa y propongo qué hacer', 'Me adapto y busco que todos estén cómodos', 'Observo, escucho y me acerco a quien me inspira confianza'),
    q('Surge un conflicto entre dos amigos.', 'Digo claramente lo que pienso', 'Intento que cada uno entienda al otro', 'Me afecta y busco que se reconcilien'),
    q('Tu plan perfecto de fin de semana…', 'Algo ambicioso, con retos', 'Algo variado, flexible y sin presión', 'Algo tranquilo con la gente que quiero'),
    q('Cuando alguien sufre…', 'Busco una solución y me ocupo', 'Estoy a su lado sin agobiarle', 'Siento su dolor como si fuera mío'),
    q('¿Cómo te ven los demás?', 'Seguro/a de mí mismo/a', 'Equilibrado/a y fácil de tratar', 'Sensible y cercano/a'),
    q('Ante una decisión importante…', 'Decido rápido y asumo el riesgo', 'Sopeso y busco el término medio', 'Escucho a mi corazón y a los míos'),
    q('Te piden dirigir un proyecto.', 'Me encanta: llevo el timón', 'Acepto si hace falta, mejor en equipo', 'Prefiero apoyar desde un segundo plano'),
    q('En una discusión…', 'Defiendo mi postura con firmeza', 'Cedo en lo que no es esencial', 'Me cuesta alzar la voz y me callo'),
    q('Lo que más valoras es…', 'La fuerza y la determinación', 'La estabilidad y la justicia', 'La ternura y la conexión'),
    q('Tu mayor reto es…', 'Escuchar cuando no tengo razón', 'Destacar y mostrar lo que quiero', 'Poner límites y decir que no'),
    q('Con tu manada o tu grupo de amigos…', 'Eres quien protege y marca el rumbo', 'Eres el pegamento que une a todos', 'Eres el corazón que cuida a los demás'),
    q('Si fueras un personaje de ficción…', 'El líder que arrastra a los demás', 'El compañero leal y sensato', 'El alma sensible que todos quieren proteger')
  ];
  var T = {
    a: ['Alfa', 'Eres iniciativa, determinación y protección. Te sale liderar, marcar el rumbo y hacerte cargo. Tu fuerza es la decisión; tu reto, recordar que escuchar también es liderar.'],
    b: ['Beta', 'Eres equilibrio, sensatez y lealtad. Eres quien une, media y da estabilidad al grupo. Tu fuerza es la adaptación; tu reto, atreverte a destacar y a pedir lo que quieres.'],
    o: ['Omega', 'Eres sensibilidad, empatía y cercanía. Sientes el ambiente y cuidas los vínculos. Tu fuerza es la ternura; tu reto, poner límites y recordar que tu voz también importa.']
  };
  TT.cuestionario({
    intro: 'Aquí el Omegaverse es solo un juego de personalidad con tres papeles: alfa, beta y omega. No hay nada más allá de cómo eres y cómo te relacionas.',
    preguntas: P,
    resultado: function (c) {
      var orden = c.top(['a', 'b', 'o']), k = orden[0][0], t = T[k];
      return {
        titulo: 'Tu papel en la manada', titular: t[0], rango: { nombre: orden[0][1] - orden[1][1] <= 1 ? 'Con un toque de ' + T[orden[1][0]][0] : 'Papel claro', texto: t[1] },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Tu mezcla' }), TT.graf.triangulo(['Alfa', 'Beta', 'Omega'], [c.tot.a, c.tot.b, c.tot.o], { descripcion: 'Reparto de tus respuestas entre alfa, beta y omega' })),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Alfa, beta y omega son papeles de un universo de ficción, no tipos reales de personas. Úsalo para jugar: todos tenemos algo de cada uno.' })),
        detalles: [['Alfa', c.tot.a + ' de 12'], ['Beta', c.tot.b + ' de 12'], ['Omega', c.tot.o + ' de 12']],
        copia: 'En el test Omegaverse me ha salido: ' + t[0] + '.'
      };
    }
  });
})();

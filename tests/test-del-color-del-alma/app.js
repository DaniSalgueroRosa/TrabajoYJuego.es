/* Test del color del alma: diez preguntas con seis respuestas (una por color). El color con más puntos es el tuyo y un radar muestra la mezcla. Es un juego. */
(function () {
  'use strict';
  var C = ['r', 'n', 'a', 'v', 'z', 'm'];
  var COL = {
    r: ['Rojo', '#c0392b', 'Alma de fuego', 'Pasión, valentía y ganas de vivir a tope. Cuando algo te importa, vas a por ello sin medias tintas y contagias esa energía.'],
    n: ['Naranja', '#d9731a', 'Alma de hoguera', 'Calidez, alegría y sociabilidad. Eres de los que reúnen a la gente alrededor y hacen que todos se sientan acogidos.'],
    a: ['Amarillo', '#c9a100', 'Alma de sol', 'Curiosidad, optimismo y buen humor. Ves el lado luminoso y sabes sacar una sonrisa hasta en un mal día.'],
    v: ['Verde', '#2e8b57', 'Alma de bosque', 'Calma, cuidado y equilibrio. Escuchas, ayudas y das estabilidad a quienes tienes cerca. Tu paciencia es tu mayor virtud.'],
    z: ['Azul', '#2a6fb0', 'Alma de mar', 'Serenidad, lealtad y reflexión. Eres profundo, fiable y de pocas pero buenas palabras. Das confianza sin proponértelo.'],
    m: ['Violeta', '#7b4bb5', 'Alma de noche estrellada', 'Imaginación, intuición y misterio. Vives con un mundo interior muy rico y ves conexiones donde otros solo ven casualidad.']
  };
  function q(t, a) { return { t: t, o: C.map(function (k, i) { var d = {}; d[k] = 1; return [a[i], d]; }) }; }
  var P = [
    q('¿Cómo es tu mañana ideal?', ['Con deporte o algo que me active', 'Desayunando con alguien a quien quiero', 'Con ideas nuevas y la radio puesta', 'Sin prisas, con un café y calma', 'En silencio, con mis pensamientos', 'Soñando despierto/a un rato más']),
    q('Un paisaje que te atrae…', ['Un volcán o un atardecer ardiente', 'Una plaza llena de vida', 'Un campo de girasoles', 'Un bosque frondoso', 'El mar en calma', 'Un cielo de noche lleno de estrellas']),
    q('En una fiesta, tú eres quien…', ['Lleva la voz cantante', 'Presenta a unos con otros', 'Cuenta las anécdotas más graciosas', 'Se asegura de que nadie se quede solo', 'Conversa a fondo con una persona', 'Observa y comenta lo que nadie ha visto']),
    q('Lo que más te mueve es…', ['La emoción de ganar', 'La compañía', 'La novedad', 'La armonía', 'La verdad', 'La belleza o el misterio']),
    q('Ante un problema…', ['Actúo ya', 'Pido opinión a mi gente', 'Pruebo algo distinto', 'Me tomo tiempo y lo trato con cuidado', 'Analizo con calma', 'Confío en mi intuición']),
    q('Tu lugar favorito de la casa…', ['Donde esté el movimiento', 'La cocina o el salón', 'La ventana con más luz', 'La zona de plantas o el balcón', 'Un rincón tranquilo', 'Mi cuarto con luz tenue']),
    q('Una palabra que te define…', ['Intenso/a', 'Cercano/a', 'Alegre', 'Paciente', 'Sereno/a', 'Soñador/a']),
    q('¿Qué regalo harías?', ['Algo que desafíe a la persona', 'Una experiencia para compartir', 'Algo divertido y original', 'Algo útil y cuidado', 'Un libro o algo que le haga pensar', 'Algo artístico o simbólico']),
    q('Si fueras una estación…', ['Verano abrasador', 'Otoño con castañas', 'Primavera luminosa', 'Primavera verde', 'Invierno claro y frío', 'Noche de verano']),
    q('Lo que no soportas…', ['La pasividad', 'La soledad impuesta', 'El aburrimiento', 'El conflicto constante', 'La mentira', 'Lo vulgar y lo apresurado'])
  ];
  TT.cuestionario({
    intro: 'Diez preguntas con seis respuestas cada una. Elige la que más te represente. Es un juego de colores para pasar el rato.',
    preguntas: P,
    resultado: function (c) {
      var orden = c.top(C), k = orden[0][0], d = COL[k], segundo = COL[orden[1][0]];
      var extra = TT.h('div', { 'class': 'tt-res-extra' },
        TT.h('div', { 'class': 'tg-color', 'aria-hidden': 'true', style: 'background:' + d[1] }),
        TT.h('div', {}, TT.h('h3', { texto: 'Los seis colores en ti' }), TT.graf.radar(C.map(function (x) { return { nombre: COL[x][0], valor: c.pct(x) }; }), { descripcion: 'Porcentaje de cada color en tus respuestas' })),
        TT.h('p', { 'class': 'tt-res-texto', texto: orden[1][1] > 0 ? 'Tu segundo color es el ' + segundo[0].toLowerCase() + ': ' + segundo[3] : 'Has elegido casi siempre el mismo color, así que tu alma sale de un solo tono y sin mezclas.' }));
      return {
        titulo: 'El color de tu alma', titular: d[0], rango: { nombre: d[2], texto: d[3] }, extra: extra,
        detalles: orden.map(function (x) { return [COL[x[0]][0], x[1] + ' de ' + c.max[x[0]]]; }),
        copia: 'El color de mi alma en este test es el ' + d[0].toLowerCase() + ': ' + d[2] + '.'
      };
    }
  });
})();

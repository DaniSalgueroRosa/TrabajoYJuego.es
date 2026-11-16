/* Test de la brújula de talentos: catorce preguntas con cuatro respuestas (analizar, crear, conectar, construir). La brújula apunta hacia tu talento principal. */
(function () {
  'use strict';
  function q(t, n, e, s, o) { return { t: t, o: [[n, { n: 1 }], [e, { e: 1 }], [s, { s: 1 }], [o, { o: 1 }]] }; }
  var P = [
    q('De niño/a, lo que más hacías era…', 'Preguntar por qué ocurren las cosas', 'Dibujar, inventar o disfrazarte', 'Jugar con otros y cuidar a los pequeños', 'Montar y desmontar cosas'),
    q('En un trabajo en grupo sueles ser quien…', 'Investiga y ordena los datos', 'Propone la idea original', 'Media y anima al grupo', 'Lo materializa y lo termina'),
    q('Un buen día de trabajo es aquel en el que…', 'Resuelvo un problema difícil', 'Creo algo que antes no existía', 'Ayudo a alguien de verdad', 'Dejo algo hecho y bien hecho'),
    q('¿Qué programa o canal verías?', 'Documentales y ciencia', 'Arte, diseño o música', 'Historias de personas', 'Bricolaje, cocina o reparaciones'),
    q('Cuando algo no funciona…', 'Busco la causa lógica', 'Pienso otra manera de hacerlo', 'Pregunto a quien sepa o a quien lo use', 'Lo arreglo con mis manos'),
    q('Se te da bien…', 'Los números o el razonamiento', 'Expresarte con originalidad', 'Escuchar y explicar', 'Organizar y poner en marcha'),
    q('Tu estantería tendría…', 'Ensayos y libros de ciencia', 'Novelas, arte y fotografía', 'Psicología, biografías o sociales', 'Manuales y libros prácticos'),
    q('Eliges un curso. Te apuntas a…', 'Estadística o programación', 'Escritura, diseño o fotografía', 'Primeros auxilios o comunicación', 'Carpintería, cocina o electrónica'),
    q('Alguien te pide consejo. Tú…', 'Valoro pros y contras con datos', 'Te propongo una alternativa inesperada', 'Te escucho y te acompaño', 'Te digo qué pasos dar'),
    q('Tu mayor satisfacción es…', 'Entender algo complejo', 'Ver que mi obra gusta', 'Ver a alguien mejor gracias a mí', 'Ver un proyecto en pie'),
    q('En vacaciones te apetece…', 'Visitar un museo de ciencias', 'Perderte por una ciudad con arte', 'Conocer gente y sus costumbres', 'Hacer una ruta, un viaje o una obra'),
    q('Un amigo te dice que eres bueno en…', 'Pensar con claridad', 'Aportar ideas frescas', 'Entender a los demás', 'Hacer que las cosas ocurran'),
    q('Aprendes mejor…', 'Leyendo y razonando', 'Probando con libertad', 'Hablando con otras personas', 'Practicando paso a paso'),
    q('Si inventaras algo, sería…', 'Una forma más eficaz de resolver un problema', 'Un objeto o una obra original', 'Algo que acerque a las personas', 'Una herramienta práctica')
  ];
  var T = {
    n: ['Analizar', 'Tu talento principal es la mente analítica: investigar, razonar, encontrar patrones y entender cómo funcionan las cosas.', 'Ciencia y datos, programación, finanzas, investigación, ingenierías, análisis o estrategia.'],
    e: ['Crear', 'Tu talento principal es la creatividad: imaginar, expresarte y darle una forma nueva a lo que ves.', 'Diseño, escritura, música, audiovisual, publicidad, arquitectura, cocina creativa o artes.'],
    s: ['Conectar', 'Tu talento principal es la relación con las personas: escuchar, comprender, comunicar y acompañar.', 'Educación, salud, psicología, trabajo social, comunicación, recursos humanos o atención al público.'],
    o: ['Construir', 'Tu talento principal es hacer realidad las cosas: organizar, practicar, resolver con las manos y llevar un proyecto a buen puerto.', 'Oficios técnicos, ingeniería práctica, logística, gestión de proyectos, artesanía o emprendimiento.']
  };
  TT.cuestionario({
    intro: 'Catorce preguntas con cuatro respuestas. Elige la que más te represente, no la que más te convendría. Es una orientación de juego, no un test vocacional.',
    preguntas: P,
    resultado: function (c) {
      var orden = c.top(['n', 'e', 's', 'o']), k = orden[0][0], t = T[k], sec = T[orden[1][0]];
      return {
        titulo: 'Hacia dónde apunta tu brújula', titular: t[0], rango: { nombre: 'Talento principal: ' + t[0].toLowerCase(), texto: t[1] },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Tu brújula' }), TT.graf.brujula({ n: 'Analizar', e: 'Crear', s: 'Conectar', o: 'Construir' }, { n: c.pct('n'), e: c.pct('e'), s: c.pct('s'), o: c.pct('o') }, { descripcion: 'Peso de cada talento en tus respuestas' })),
          TT.h('p', { 'class': 'tt-res-texto', texto: 'Ideas de campos afines: ' + t[2] }),
          TT.h('p', { 'class': 'tt-res-texto', texto: orden[1][1] > 0 ? 'Tu segundo talento es ' + sec[0].toLowerCase() + '. Combinarlo con el primero te da un perfil más propio.' : 'Tus respuestas apuntan casi siempre en la misma dirección: un talento muy marcado.' })),
        detalles: orden.map(function (x) { return [T[x[0]][0], x[1] + ' de ' + c.max[x[0]]]; }),
        copia: 'Mi talento principal en este test es: ' + t[0].toLowerCase() + '.'
      };
    }
  });
})();

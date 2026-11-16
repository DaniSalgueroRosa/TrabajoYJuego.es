/* Test de los 16 tipos de personalidad: veintiocho preguntas sobre cuatro ejes (E/I, S/N, T/F, J/P) que dan un tipo de cuatro letras.
   Inspirado en la idea de los cuatro ejes de Jung. No es el MBTI® ni ninguna evaluación psicológica: los nombres y los textos son nuestros. */
(function () {
  'use strict';
  function par(a, b, ta, tb) { var x = {}, y = {}; x[a] = 1; y[b] = 1; return [[ta, x], [tb, y]]; }
  function q(t, a, b, ta, tb) { return { t: t, o: par(a, b, ta, tb) }; }
  var P = [
    q('Después de una semana intensa, recargas pilas…', 'E', 'I', 'Saliendo y estando con gente', 'A solas o con una sola persona'),
    q('Prefieres que te expliquen algo con…', 'S', 'N', 'Ejemplos concretos y pasos', 'La idea general y sus posibilidades'),
    q('Para decidir, pesa más…', 'T', 'F', 'La lógica y los datos', 'Cómo afecta a las personas'),
    q('Para un viaje, lo tuyo es…', 'J', 'P', 'Un itinerario planificado', 'Improvisar sobre la marcha'),
    q('En una reunión con gente nueva…', 'E', 'I', 'Hablo enseguida con varios', 'Escucho y hablo cuando conozco el ambiente'),
    q('Te fijas más en…', 'S', 'N', 'Lo que hay delante, los detalles', 'Lo que podría ser, las conexiones'),
    q('Un amigo te cuenta un problema. Tú…', 'T', 'F', 'Busco la solución práctica', 'Primero le escucho y le acompaño'),
    q('Tus tareas…', 'J', 'P', 'Las termino antes del plazo', 'Las termino cuando aprieta el plazo'),
    q('Cuando piensas…', 'E', 'I', 'Pienso en voz alta y me aclaro hablando', 'Pienso por dentro y hablo cuando lo tengo claro'),
    q('Para ti es mejor lo…', 'S', 'N', 'Probado y práctico', 'Nuevo y original'),
    q('En una discusión, prefieres…', 'T', 'F', 'Tener razón aunque incomode', 'Mantener la armonía'),
    q('Tu agenda está…', 'J', 'P', 'Llena y organizada', 'Casi vacía y flexible'),
    q('Tu círculo de amistades es…', 'E', 'I', 'Amplio, con muchos conocidos', 'Pequeño y profundo'),
    q('Al contar una historia…', 'S', 'N', 'Cuento los hechos en orden', 'Me voy por las ramas con ideas'),
    q('Se te da mejor…', 'T', 'F', 'Analizar con objetividad', 'Comprender lo que sienten los demás'),
    q('Cuando cambian los planes…', 'J', 'P', 'Me incomoda', 'Me adapto sin problema'),
    q('Suena el teléfono…', 'E', 'I', 'Contesto encantado/a', 'Prefiero que sea un mensaje'),
    q('Confías más en…', 'S', 'N', 'La experiencia', 'La intuición'),
    q('Una norma injusta pero útil…', 'T', 'F', 'La sigo si funciona', 'La cuestiono si hace daño a alguien'),
    q('Tu espacio de trabajo es…', 'J', 'P', 'Cada cosa en su sitio', 'Un caos creativo que solo entiendes tú'),
    q('Un fin de semana ideal…', 'E', 'I', 'Planes con mucha gente', 'Tiempo tranquilo en casa'),
    q('Con un manual de instrucciones…', 'S', 'N', 'Sigo los pasos', 'Lo hago a mi manera y voy descubriendo'),
    q('Te describen como alguien…', 'T', 'F', 'Franco y directo', 'Cálido y empático'),
    q('Al tomar decisiones…', 'J', 'P', 'Decido rápido y paso a otra cosa', 'Dejo las opciones abiertas todo lo posible'),
    q('Al llegar a una fiesta…', 'E', 'I', 'Me muevo entre grupos', 'Busco a alguien conocido y me quedo cerca'),
    q('Te consideras más…', 'S', 'N', 'Realista', 'Soñador/a'),
    q('Al dar una mala noticia…', 'T', 'F', 'Voy al grano con claridad', 'Cuido las palabras y el momento'),
    q('Una lista de pendientes…', 'J', 'P', 'Me da calma', 'Me agobia')
  ];
  var TIPOS = {
    INTJ: ['La mente estratega', 'Ves el futuro como un tablero y buscas el plan más eficaz. Eres independiente, exigente contigo y con lo que haces. A veces se te nota demasiado que prefieres tu criterio al de los demás.', 'Visión a largo plazo, constancia', 'Impaciencia con quien improvisa'],
    INTP: ['El explorador de ideas', 'Te fascina entender cómo funcionan las cosas y no te conformas con la explicación fácil. Eres original, lógico y algo distraído. Convertir ideas en acciones es tu reto.', 'Curiosidad, análisis', 'Dejar las cosas a medias'],
    ENTJ: ['El líder decidido', 'Organizas, decides y empujas hasta llegar. Te gustan los objetivos claros y la eficacia. Con tanto impulso, a veces se te pasa escuchar con calma a quien va más despacio.', 'Liderazgo, determinación', 'Mano dura sin darte cuenta'],
    ENTP: ['El inventor inquieto', 'Te encantan el debate, las ideas nuevas y encontrar el fallo de lo establecido. Eres ingenioso y rápido. Mantener el interés cuando el proyecto ya no es novedad es lo difícil.', 'Ingenio, rapidez mental', 'Empezar más de lo que terminas'],
    INFJ: ['El guía sereno', 'Percibes lo que hay detrás de las personas y quieres que el mundo sea algo mejor. Eres reservado, profundo y con principios firmes. Te agotas si cargas con los problemas de todos.', 'Intuición, compromiso con los demás', 'Perfeccionismo y agotamiento'],
    INFP: ['El soñador sincero', 'Vives guiado por tus valores y tu imaginación. Eres sensible, leal y creativo, aunque te cuesta mostrarte. Cuando algo te importa de verdad, nadie lo defiende con tanta ternura.', 'Autenticidad, creatividad', 'Idealizar y bloquearte'],
    ENFJ: ['El mentor que une', 'Sacas lo mejor de la gente y te gusta cuidar de un grupo. Eres comunicativo, generoso y organizado. Con el afán de ayudar a todos, puede que te olvides de tus propias necesidades.', 'Empatía, carisma', 'Cargar con todo'],
    ENFP: ['La chispa creativa', 'Entusiasmo, imaginación y mucha energía social. Ves posibilidades donde otros ven rutina y contagias las ganas. Te cuesta la constancia cuando la emoción inicial se apaga.', 'Entusiasmo, empatía', 'Dispersión'],
    ISTJ: ['El pilar fiable', 'Cumples lo que prometes, con orden y sentido del deber. Prefieres lo probado y los hechos. Eres la persona en quien se confía cuando algo no puede fallar, aunque el cambio te cueste.', 'Responsabilidad, rigor', 'Rigidez ante lo nuevo'],
    ISFJ: ['El protector discreto', 'Cuidas a los tuyos en silencio, con memoria para los detalles y una lealtad enorme. Eres tranquilo, atento y trabajador. Decir «no» o pedir ayuda no es lo tuyo.', 'Lealtad, atención al detalle', 'No poner límites'],
    ESTJ: ['El organizador nato', 'Pones orden, reglas claras y plazos. Eres práctico, directo y buen gestor de equipos y recursos. Te conviene recordar que no todos funcionan con tu método.', 'Organización, decisión', 'Poca flexibilidad'],
    ESFJ: ['El anfitrión cálido', 'Te importa que todos estén a gusto. Eres sociable, atento, cooperativo y te gusta la armonía en el grupo. Las críticas y los conflictos te pesan más de lo que muestras.', 'Cordialidad, cooperación', 'Necesidad de aprobación'],
    ISTP: ['El manitas tranquilo', 'Observas, entiendes cómo funciona algo y lo arreglas con calma. Eres práctico, independiente y bueno en las crisis. No te gusta dar explicaciones largas ni que te digan cómo hacerlo.', 'Destreza, sangre fría', 'Reservado en lo emocional'],
    ISFP: ['El artista libre', 'Sientes con intensidad y lo expresas a tu manera, más con hechos y gestos que con palabras. Eres amable, flexible y amante de lo bello. Odias que te presionen o te encasillen.', 'Sensibilidad, autenticidad', 'Evitar el conflicto'],
    ESTP: ['El aventurero práctico', 'Actúas rápido, te adaptas y disfrutas del momento. Eres observador, valiente y con buen ojo para las oportunidades. A veces sigues el impulso antes de pensar en las consecuencias.', 'Acción, adaptación', 'Impulsividad'],
    ESFP: ['El alma de la fiesta', 'Contagias alegría y vives el presente. Eres espontáneo, generoso y buen compañero. Planificar a largo plazo o aguantar la rutina es lo que más te cuesta.', 'Energía, calidez', 'Dejarlo todo para luego']
  };
  TT.cuestionario({
    intro: 'Veintiocho preguntas con dos respuestas cada una. Elige la que te describa mejor casi siempre, aunque a veces hagas lo contrario. No es un diagnóstico: es un juego de autoconocimiento.',
    mezclar: true,
    preguntas: P,
    resultado: function (r) {
      var cod = (r.tot.E >= r.tot.I ? 'E' : 'I') + (r.tot.S >= r.tot.N ? 'S' : 'N') + (r.tot.T >= r.tot.F ? 'T' : 'F') + (r.tot.J >= r.tot.P ? 'J' : 'P');
      var t = TIPOS[cod];
      function ej(a, b, na, nb) { return { izq: na + ' (' + a + ')', der: nb + ' (' + b + ')', v: r.tot[a] / (r.tot[a] + r.tot[b]) * 100 }; }
      return {
        titulo: 'Tu tipo de personalidad', titular: cod, rango: { nombre: t[0], texto: t[1] },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Tus cuatro ejes' }), TT.graf.ejes([ej('E', 'I', 'Extraversión', 'Introversión'), ej('S', 'N', 'Sensorial', 'Intuitivo'), ej('T', 'F', 'Pensamiento', 'Sentimiento'), ej('J', 'P', 'Estructura', 'Flexibilidad')], { descripcion: 'Porcentaje de respuestas hacia cada lado de los cuatro ejes' })),
          TT.h('ul', { 'class': 'tt-res-lista' }, TT.h('li', { texto: 'Fortalezas: ' + t[2] + '.' }), TT.h('li', { texto: 'A vigilar: ' + t[3] + '.' })),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Los tipos son una forma de hablar de preferencias, no cajas cerradas. Si un eje te sale casi al 50 %, es probable que cambie de una vez a otra. Este test no es el MBTI® ni tiene valor psicológico.' })),
        detalles: [['Extraversión / Introversión', r.tot.E + ' / ' + r.tot.I], ['Sensorial / Intuitivo', r.tot.S + ' / ' + r.tot.N], ['Pensamiento / Sentimiento', r.tot.T + ' / ' + r.tot.F], ['Estructura / Flexibilidad', r.tot.J + ' / ' + r.tot.P]],
        copia: 'Mi tipo de personalidad en este test: ' + cod + ', ' + t[0] + '.'
      };
    }
  });
})();

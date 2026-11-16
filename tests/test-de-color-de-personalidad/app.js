/* Test de color de personalidad: dieciséis preguntas con cuatro respuestas (rojo, amarillo, verde, azul). Un plano de dos ejes (ritmo y foco) muestra dónde caes. Es un juego. */
(function () {
  'use strict';
  function q(t, r, a, v, z) { return { t: t, o: [[r, { r: 1 }], [a, { a: 1 }], [v, { v: 1 }], [z, { z: 1 }]] }; }
  var P = [
    q('Al empezar un proyecto nuevo…', 'Voy directo a la acción', 'Cuento mi idea a todo el mundo', 'Pregunto cómo lo vive el equipo', 'Leo y planifico antes de mover un dedo'),
    q('En una reunión, normalmente…', 'Marco el rumbo', 'Animo la conversación', 'Escucho y busco consenso', 'Aporto datos y detalles'),
    q('Cuando alguien te lleva la contraria…', 'Defiendo mi postura con firmeza', 'Intento convencerle con entusiasmo', 'Cedo si así mantenemos la paz', 'Pido pruebas'),
    q('Tu agenda ideal es…', 'Llena de metas', 'Llena de gente', 'Tranquila y predecible', 'Perfectamente ordenada'),
    q('Para decidir, pesa más…', 'Los resultados', 'La intuición y las ganas', 'Cómo afecta a los demás', 'La lógica y la precisión'),
    q('Ante un cambio de planes…', 'Me adapto rápido y tomo el mando', 'Me emociono con la novedad', 'Me cuesta un poco: prefiero lo conocido', 'Necesito entender qué ha cambiado'),
    q('Te describirían como alguien…', 'Directo/a', 'Simpático/a y hablador/a', 'Paciente y leal', 'Cuidadoso/a y exigente'),
    q('Un error en el trabajo…', 'Se corrige y se sigue', 'Se aprende riéndose un poco', 'Se afronta sin culpar a nadie', 'Se revisa para que no se repita'),
    q('En un viaje en grupo eres quien…', 'Decide el itinerario', 'Hace que todos se rían', 'Cuida que nadie se agobie', 'Lleva las reservas y los horarios'),
    q('Lo que más te irrita…', 'Perder el tiempo', 'Que me ignoren', 'Los conflictos', 'Las faltas de rigor'),
    q('Para ti, el éxito es…', 'Lograr objetivos ambiciosos', 'Ser reconocido/a y disfrutar', 'Tener relaciones sólidas y estabilidad', 'Hacer las cosas con calidad'),
    q('Tu forma de hablar es…', 'Corta y al grano', 'Animada y expresiva', 'Suave y tranquila', 'Precisa y medida'),
    q('Cuando hay que mediar entre dos amigos…', 'Zanjo el asunto con claridad', 'Intento quitarle hierro con humor', 'Escucho a cada uno con calma', 'Analizo qué pasó realmente'),
    q('Tu espacio de trabajo…', 'Funcional y sin adornos', 'Lleno de cosas que me inspiran', 'Cómodo y acogedor', 'Impecable y organizado'),
    q('Aceptas un reto cuando…', 'Hay una meta clara que ganar', 'Suena divertido o novedoso', 'Hay gente de confianza a mi lado', 'He visto que es viable'),
    q('Al terminar un día intenso…', 'Pienso en el siguiente paso', 'Cuento mis anécdotas a alguien', 'Me desconecto en casa tranquilo/a', 'Repaso lo que salió bien y mal')
  ];
  var T = {
    r: ['Rojo', 'Decidido, directo y orientado a resultados. Tomas la iniciativa, te gusta el reto y llevas el ritmo. Con tu energía, a veces conviene frenar un poco para escuchar.'],
    a: ['Amarillo', 'Sociable, entusiasta y comunicativo. Contagias ánimo, generas ideas y haces que lo cotidiano sea más divertido. Te beneficiará cerrar los detalles hasta el final.'],
    v: ['Verde', 'Paciente, leal y conciliador. Das estabilidad al grupo, escuchas de verdad y evitas el conflicto inútil. A veces te toca decir «no» sin sentirte culpable.'],
    z: ['Azul', 'Analítico, preciso y metódico. Cuidas los detalles, razonas con calma y buscas la calidad. Dejar pasar un fallo pequeño a veces te hará ganar tiempo.']
  };
  TT.cuestionario({
    intro: 'Dieciséis preguntas con cuatro respuestas. Elige la que más se parezca a ti en el día a día. Es un juego de colores, no un test de selección.',
    preguntas: P,
    resultado: function (c) {
      var orden = c.top(['r', 'a', 'v', 'z']), k = orden[0][0], t = T[k], t2 = T[orden[1][0]], total = c.tot.r + c.tot.a + c.tot.v + c.tot.z;
      var rapido = (c.tot.r + c.tot.a) / total * 100, personas = (c.tot.a + c.tot.v) / total * 100;
      return {
        titulo: 'Tu color de personalidad', titular: t[0], rango: { nombre: 'Color principal: ' + t[0].toLowerCase() + (orden[1][1] > 0 ? ', con un toque de ' + t2[0].toLowerCase() : ', sin mezclas'), texto: t[1] },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Dónde caes' }), TT.graf.plano(rapido, personas, { ejeX: 'Ritmo (pausado a rápido)', ejeY: 'Foco (tareas a personas)', esquinas: ['Verde', 'Amarillo', 'Azul', 'Rojo'], descripcion: 'Tu posición según ritmo y foco' })),
          TT.h('div', {}, TT.h('h3', { texto: 'Los cuatro colores' }), TT.graf.barras(['r', 'a', 'v', 'z'].map(function (x) { return { nombre: T[x][0], valor: c.pct(x) }; }), { descripcion: 'Porcentaje de cada color', destacar: ['r', 'a', 'v', 'z'].indexOf(k) }))),
        detalles: orden.map(function (x) { return [T[x[0]][0], x[1] + ' de ' + c.max[x[0]]]; }),
        copia: 'Mi color de personalidad en este test es el ' + t[0].toLowerCase() + '.'
      };
    }
  });
})();

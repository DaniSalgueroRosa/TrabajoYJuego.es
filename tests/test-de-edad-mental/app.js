/* Test de edad mental (clásico): 16 preguntas en cuatro áreas. Cada respuesta equivale a una edad y tu edad mental es la media. Es un juego. */
(function () {
  'use strict';
  var AREAS = { o: 'Ocio y diversión', r: 'Responsabilidad', e: 'Emociones', s: 'Vida social y curiosidad' };
  function q(area, t, a) { return { t: t, o: a.map(function (x) { var p = {}; p[area] = x[1]; return [x[0], p]; }) }; }
  var P = [
    q('o', 'Un sábado por la noche sin planes fijos, ¿qué eliges?', [['Videojuegos o dibujos con algo de picar', 10], ['Salir de fiesta con amigos hasta tarde', 19], ['Una cena tranquila con buena conversación', 33], ['Una peli y a dormir pronto', 58]]),
    q('r', 'Hay una factura que vence mañana. ¿Qué pasa?', [['Seguro que se me olvida', 11], ['La pago a última hora', 19], ['Ya la tenía programada', 35], ['La pagué hace semanas y la apunté', 55]]),
    q('e', 'Alguien te hace un feo. ¿Cómo reaccionas?', [['Me enfado o lloro muchísimo', 11], ['Me lo guardo y le doy vueltas', 21], ['Hablo con esa persona', 36], ['Lo dejo pasar: no todo merece la pena', 58]]),
    q('s', '¿Cómo haces amigos?', [['Me acerco a cualquiera sin pensarlo', 11], ['Con gente de mi edad y mis gustos', 19], ['Poco a poco, según la afinidad', 35], ['Tengo pocos, de toda la vida', 60]]),
    q('o', '¿Cómo celebras tu cumpleaños?', [['Fiesta con juegos y tarta', 10], ['Plan con la panda y música alta', 19], ['Comida con la gente más cercana', 34], ['Un día normal, mejor que no me hagan caso', 55]]),
    q('r', '¿Cómo es tu mesa o tu habitación?', [['Un caos creativo', 12], ['Ordenada cuando me acuerdo', 20], ['Ordenada con un sistema', 35], ['Cada cosa en su sitio, siempre', 58]]),
    q('e', 'Te llega una crítica sobre algo que has hecho.', [['Me duele mucho y me lo tomo mal', 13], ['Me pongo a la defensiva', 20], ['La escucho y me quedo con lo útil', 37], ['Me hace gracia: ya he oído de todo', 60]]),
    q('s', '¿Qué haces con la tecnología nueva?', [['Pruebo todo en cuanto sale', 14], ['La uso mucho, aunque con cabeza', 22], ['Solo lo que de verdad necesito', 38], ['Prefiero lo de siempre', 62]]),
    q('o', 'Un día de lluvia en casa, ¿qué te apetece?', [['Montar un fuerte con mantas o jugar', 10], ['Series y móvil sin parar', 18], ['Cocinar o resolver algo pendiente', 35], ['Leer o hacer un crucigrama', 60]]),
    q('r', 'Te sale un imprevisto serio. ¿Qué haces?', [['Espero a que alguien lo resuelva', 10], ['Me agobio, pero acabo actuando', 20], ['Busco soluciones con calma', 36], ['Ya tenía un plan B', 56]]),
    q('e', 'Algo sale mal. ¿Qué necesitas?', [['Que alguien me consuele', 11], ['Desahogarme con mis amigos', 20], ['Entender qué ha pasado', 36], ['Encogerme de hombros y seguir', 57]]),
    q('s', 'Oyes música nueva. ¿Qué haces?', [['Ponerla en bucle y bailarla', 12], ['Compartirla con mis amigos', 20], ['Escuchar un rato y decidir', 37], ['Volver a lo que ya conozco', 60]]),
    q('o', '¿Cómo serían tus vacaciones ideales?', [['Un parque de atracciones', 11], ['Un festival o la playa con amigos', 20], ['Un viaje cultural bien organizado', 36], ['Una casa rural y paseos', 62]]),
    q('r', 'Para ti, el dinero es sobre todo…', [['Para gastarlo ahora', 13], ['Para disfrutar y ahorrar algo', 22], ['Para tener estabilidad', 38], ['Para dormir tranquilo/a siempre', 60]]),
    q('e', 'Tienes que esperar una hora en una cola.', [['Me impaciento enseguida', 10], ['Aguanto un rato', 19], ['Soy paciente', 35], ['Hace años que aprendí a esperar', 62]]),
    q('s', '¿Qué consejo sueles dar?', [['Haz lo que te apetezca', 13], ['Vive el momento', 21], ['Piénsalo bien antes de decidir', 38], ['La paciencia lo arregla casi todo', 64]])
  ];
  TT.cuestionario({
    intro: 'Dieciséis preguntas, cuatro respuestas cada una. Elige la que más se parezca a ti, no la que quedaría mejor. Es un juego: no mide tu madurez de verdad.',
    preguntas: P,
    resultado: function (r) {
      var porArea = Object.keys(AREAS).map(function (k) { return { nombre: AREAS[k], valor: r.tot[k] / 4 }; });
      var edad = Math.round(TT.media(porArea.map(function (a) { return a.valor; })));
      var rango = TT.rango(edad, [
        [0, 'Un niño o niña con carnet', 'Vives con curiosidad y sin prisa. Te cuesta menos que a nadie divertirte con poco, y eso es un tesoro.'],
        [14, 'Adolescente eterno', 'Energía, impulsos y ganas de probarlo todo. Vas a tope, y tus amigos lo notan.'],
        [20, 'Joven con ganas', 'Mezclas diversión y responsabilidades con bastante equilibrio. La vida se te da bien.'],
        [30, 'Adulto con los pies en el suelo', 'Planificas, escuchas y no te dejas llevar por el primer impulso. Eres de fiar.'],
        [45, 'Cabeza de sabio o sabia', 'Ves los problemas con calma y perspectiva. Tu paciencia da envidia.'],
        [58, 'Alma veterana', 'Te interesa la calma, lo conocido y lo que dura. Tu mente va a otro ritmo, más sereno que el de casi todos.']]);
      var mas = porArea.slice().sort(function (a, b) { return b.valor - a.valor; }), menos = mas[mas.length - 1];
      return {
        titulo: 'Tu edad mental', valor: edad, unidad: 'años', rango: rango,
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'De niño a veterano' }), TT.graf.espectro((edad - 10) / 60 * 100, { izq: '10 años', der: '70 años', marcas: [[0, 'Niñez'], [30, 'Juventud'], [60, 'Madurez'], [100, 'Veteranía']], descripcion: 'Tu edad mental, de 10 a 70 años' })),
          TT.h('div', {}, TT.h('h3', { texto: 'Edad que sale en cada área' }), TT.graf.barras(porArea.map(function (a) { return { nombre: a.nombre, valor: a.valor }; }), { max: 70, unidad: ' años', descripcion: 'Edad mental por área' }))),
        detalles: [['Edad mental', edad + ' años'], ['Tu área más madura', mas[0].nombre + ' (' + TT.fmt(mas[0].valor, 0) + ')'], ['Tu área más joven', menos.nombre + ' (' + TT.fmt(menos.valor, 0) + ')']],
        copia: 'Mi edad mental en este test es de ' + edad + ' años.'
      };
    }
  });
})();

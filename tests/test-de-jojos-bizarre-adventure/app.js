/* Test de JoJo's Bizarre Adventure: diez situaciones con cinco respuestas (una por rasgo). Cada personaje tiene su propio perfil de rasgos y el resultado es el personaje cuyo perfil mejor
   encaja con el énfasis de tus respuestas (similitud de perfiles). Test de fans no oficial, con textos propios: sin imágenes, sin relación con los autores ni con los estudios. */
(function () {
  'use strict';
  var RASGOS = ["Valentía", "Ingenio", "Sangre fría", "Carisma", "Lealtad"];
  var PJ = [
    ["Jonathan Joestar", [65, 10, 35, 10, 100], "El caballero", "Noble, valiente y con un gran sentido del honor. Antepones lo correcto a lo cómodo."],
    ["Joseph Joestar", [65, 100, 10, 35, 10], "El ingenioso", "Bromista, listo y capaz de salir de cualquier apuro con una idea inesperada."],
    ["Jotaro Kujo", [35, 10, 100, 10, 65], "La frialdad con estilo", "Serio, frío y de pocas palabras. Tu calma impone y, detrás, hay un fuerte sentido de la lealtad."],
    ["Josuke Higashikata", [35, 10, 10, 65, 100], "El buen amigo", "Valiente, amable y muy leal, aunque se te enciende el carácter si tocan lo que quieres."],
    ["Giorno Giovanna", [10, 35, 65, 100, 10], "El líder con sueños", "Ambicioso, carismático y decidido. Tienes un sueño claro y trabajas con serenidad para lograrlo."],
    ["Jolyne Cujoh", [100, 10, 35, 10, 65], "La decisión inquebrantable", "Decidida, tenaz y leal. Plantas cara a lo que sea por quienes quieres."],
    ["Jean Pierre Polnareff", [35, 10, 10, 100, 65], "El caballero impulsivo", "Caballeroso, impulsivo y muy leal. Tu corazón manda y tus amigos lo saben."],
    ["Noriaki Kakyoin", [10, 100, 65, 10, 35], "El estratega amable", "Reflexivo, estratega y fiel. Te ganas la confianza con calma y con un buen plan."]];
  var P = [
    ["Te encuentras con un enemigo imposible.", "Me enfrento a él sin dudarlo", "Me las ingenio para engañarle", "Mantengo la calma y lo estudio", "Le planto cara con estilo", "Protejo a mis amigos y huimos juntos"],
    ["Tu pose favorita es…", "Brazo al frente, desafiando al mundo", "Una sonrisa de quien tiene un plan", "Brazos cruzados y mirada gélida", "Una pose imposible pero espectacular", "Mano en el hombro de un amigo"],
    ["Una trampa mortal.", "La atravieso con valor", "La desmonto con una idea loca", "Mido cada paso", "La convierto en un espectáculo", "Me sacrifico si hace falta por los míos"],
    ["Tu estilo de combate sería…", "De frente y con todo", "Trucos y sorpresas", "Precisión y paciencia", "Con mucha personalidad", "En equipo, cubriéndonos las espaldas"],
    ["Tus amistades son…", "Gente que no se echa atrás", "Gente divertida y lista", "Gente tranquila y de pocas palabras", "Gente con carácter y estilo", "Pocas, pero hasta el final"],
    ["Quieres ganar una discusión.", "Subo la voz y no cedo", "Uso una treta", "Respondo sin inmutarme", "Lo hago con mi carisma", "Defiendo lo que es justo"],
    ["Un día de descanso…", "Algo con adrenalina", "Un juego o una broma pesada", "Pasear solo/a y pensar", "Arreglarme y salir a lucirme", "Tiempo con mis amigos"],
    ["Tu mayor orgullo es…", "No haber retrocedido jamás", "Salir de apuros con ingenio", "Mi calma en la tormenta", "Mi forma de ser", "Mi lealtad"],
    ["Ante un rival que te supera…", "Me dan más ganas de pelear", "Busco su punto flaco", "No me altero", "Le miro a los ojos y sonrío", "Pido ayuda a mis aliados"],
    ["Tu frase favorita sería…", "Nunca voy a rendirme", "Todo problema tiene truco", "Mantén la calma", "El estilo importa", "Los amigos son lo primero"]].map(function (x) { return { t: x[0], o: x.slice(1).map(function (txt, i) { var d = {}; d['r' + i] = 1; return [txt, d]; }) }; });
  // Cada personaje se define por sus tres rasgos principales (100, 65 y 35 puntos; el resto, 10) y se compara con tus respuestas por similitud de perfil.
  var norma = function (v) { return Math.sqrt(v.reduce(function (a, b) { return a + b * b; }, 0)) || 1; };
  TT.cuestionario({
    intro: 'Diez situaciones con cinco respuestas. Elige lo que harías tú. Es un test de fans, sin imágenes y sin relación con la obra.',
    preguntas: P,
    resultado: function (c) {
      var cuenta = RASGOS.map(function (r, i) { return c.tot['r' + i]; }), suma = cuenta.reduce(function (a, b) { return a + b; }, 0) || 1, mayor = Math.max.apply(null, cuenta) || 1;
      var puntos = PJ.map(function (p, k) { var v = 0; cuenta.forEach(function (n, i) { v += n * p[1][i]; }); return { k: k, nombre: p[0], valor: 100 * v / (norma(cuenta) * norma(p[1])) }; })
        .sort(function (a, b) { return b.valor - a.valor || a.k - b.k; });
      // Si tus respuestas no distinguen entre varios personajes (empate exacto), el test elige uno de los empatados al azar en lugar de favorecer al primero de la lista.
      var empate = puntos.filter(function (x) { return puntos[0].valor - x.valor < 0.01; });
      if (empate.length > 1) { var e = TT.elegir(empate); puntos.splice(puntos.indexOf(e), 1); puntos.unshift(e); }
      var top = puntos[0], p = PJ[top.k], segundo = puntos[1];
      return {
        titulo: 'Tu protagonista de JoJo', titular: p[0], rango: { nombre: p[2], texto: p[3] + (empate.length > 1 ? ' Varios personajes encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '') },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Tus rasgos' }), TT.graf.radar(RASGOS.map(function (r, i) { return { nombre: r, valor: cuenta[i] / mayor * 100 }; }), { descripcion: 'Peso de cada rasgo en tus respuestas' })),
          TT.h('div', {}, TT.h('h3', { texto: 'Con quién encajas más' }), TT.graf.barras(puntos.slice(0, 5).map(function (x) { return { nombre: x.nombre, valor: Math.round(x.valor) }; }), { max: 100, unidad: ' %', destacar: 0, descripcion: 'Afinidad con los cinco personajes más parecidos' })),
          TT.h('p', { 'class': 'tt-res-texto', texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.' }),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.' })),
        detalles: RASGOS.map(function (r, i) { return [r, cuenta[i] + ' de ' + suma]; }),
        copia: 'En el test de JoJo\'s Bizarre Adventure me ha salido: ' + p[0] + '.'
      };
    }
  });
})();

/* Test del Universo DC: ¿qué héroe eres?: situaciones con una respuesta por rasgo. Cada personaje tiene su propio perfil de rasgos y el resultado es el personaje cuyo perfil mejor
   encaja con el énfasis de tus respuestas (similitud de perfiles). Test de fans no oficial, con textos propios: sin imágenes y sin relación con los autores. */
(function () {
  'use strict';
  var RASGOS = ["Justicia", "Inteligencia", "Determinación", "Compasión", "Rebeldía"];
  var PJ = [
    ["Batman", [35, 100, 65, 10, 10], "La mente que no descansa", "Metódico, reservado y con una disciplina enorme. Prefieres prepararlo todo y cargas con la responsabilidad en silencio."],
    ["Superman", [65, 10, 35, 100, 10], "La bondad que da esperanza", "Amable, íntegro y con una fe enorme en la gente. Tu fuerza está en ayudar sin esperar nada y en ser un ejemplo."],
    ["Wonder Woman", [100, 10, 35, 65, 10], "Justicia con corazón", "Valiente, justa y compasiva. Combinas firmeza y empatía, y te cuesta quedarte de brazos cruzados ante una injusticia."],
    ["Flash", [10, 10, 35, 100, 65], "La alegría que va rápida", "Optimista, cercano y con humor. Te mueves deprisa, ayudas a quien lo necesita y no pierdes las ganas de sonreír."],
    ["Aquaman", [65, 10, 100, 35, 10], "El deber con carácter", "Resistente, con un fuerte sentido del deber hacia tu gente. Te cuesta pedir ayuda, pero no fallas cuando te necesitan."],
    ["Linterna Verde", [35, 10, 100, 10, 65], "La voluntad sin miedo", "Decidido, seguro de ti y con un punto de rebeldía. Confías en tu voluntad y no te achicas ante lo imposible."],
    ["Harley Quinn", [10, 10, 65, 35, 100], "El caos con buen corazón", "Imprevisible, divertida y leal a quien quiere. Te mueves a tu aire y no te dejas encasillar por nadie."],
    ["Catwoman", [35, 65, 10, 10, 100], "La libertad con estilo", "Astuta, independiente y con un código propio. Juegas con las reglas y nunca te dejas atrapar."]];
  var P = [
    ["Alguien en tu ciudad necesita ayuda. ¿Qué haces?", "Actúo: hay que hacer lo correcto", "Analizo antes de intervenir", "Voy hasta el final, cueste lo que cueste", "Me acerco para tranquilizar a la persona", "Improviso a mi manera"],
    ["¿Qué te define mejor?", "Mi sentido de la justicia", "Mi cabeza", "Mi fuerza de voluntad", "Mi corazón", "Mi independencia"],
    ["Tienes un día libre.", "Defiendo una causa que me importa", "Leo o investigo algo nuevo", "Entreno algo difícil", "Estoy con mi gente", "Hago lo que me apetece, sin plan"],
    ["Un rival te supera.", "Sigo mis principios aunque pierda", "Busco una forma más lista", "Me levanto otra vez", "Intento entender qué quiere", "Cambio las reglas del juego"],
    ["Las reglas te parecen injustas.", "Las cuestiono con argumentos y con actos", "Busco el fallo del sistema", "Las desafío hasta que cedan", "Pienso en a quién perjudican", "Las ignoro"],
    ["En un equipo, eres quien…", "Marca el rumbo moral", "Tiene el plan B", "Aguanta cuando todos flaquean", "Mantiene unido al grupo", "Aporta humor y sorpresa"],
    ["Un secreto importante cae en tus manos.", "Lo uso solo para hacer el bien", "Lo estudio con calma", "Lo guardo con firmeza", "Pienso a quién le afecta", "Lo uso en mi beneficio sin dañar a nadie"],
    ["Tu estilo sería…", "Uniforme y símbolo claros", "Discreto y calculado", "Sobrio y resistente", "Cercano y abierto", "Llamativo y sin reglas"],
    ["Tu mayor miedo es…", "Fallar a lo que creo justo", "No entender a tiempo lo que pasa", "Rendirme", "Hacer daño a los míos", "Que me encierren en un papel"],
    ["Si pudieras tener un superpoder…", "Saber siempre quién dice la verdad", "Una mente brillante en todo", "Resistencia sin límites", "Curar a quien lo necesite", "Ser imprevisible: que nadie adivine mi siguiente paso"]].map(function (x) { return { t: x[0], o: x.slice(1).map(function (txt, i) { var d = {}; d['r' + i] = 1; return [txt, d]; }) }; });
  // Cada personaje se define por sus tres rasgos principales (100, 65 y 35 puntos; el resto, 10) y se compara con tus respuestas por similitud de perfil.
  var norma = function (v) { return Math.sqrt(v.reduce(function (a, b) { return a + b * b; }, 0)) || 1; };
  TT.cuestionario({
    intro: 'Diez situaciones con cinco respuestas. Elige lo que harías tú. Es un test de fans, sin imágenes y sin relación con la editorial ni con los autores.',
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
        titulo: 'Tu personaje del Universo DC', titular: '' + p[0], rango: { nombre: p[2], texto: p[3] + (empate.length > 1 ? ' Varios resultados encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '') },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Tus rasgos' }), TT.graf.radar(RASGOS.map(function (r, i) { return { nombre: r, valor: cuenta[i] / mayor * 100 }; }), { descripcion: 'Peso de cada rasgo en tus respuestas' })),
          TT.h('div', {}, TT.h('h3', { texto: 'Con quién encajas más' }), TT.graf.barras(puntos.slice(0, 5).map(function (x) { return { nombre: x.nombre, valor: Math.round(x.valor) }; }), { max: 100, unidad: ' %', destacar: 0, descripcion: 'Afinidad con los cinco personajes más parecidos' })),
          TT.h('p', { 'class': 'tt-res-texto', texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.' }),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.' })),
        detalles: RASGOS.map(function (r, i) { return [r, cuenta[i] + ' de ' + suma]; }),
        copia: 'En el test del Universo DC me ha salido: ' + p[0] + '.'
      };
    }
  });
})();

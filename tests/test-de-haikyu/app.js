/* Test de Haikyu!!: diez situaciones con cinco respuestas (una por rasgo). Cada personaje tiene su propio perfil de rasgos y el resultado es el personaje cuyo perfil mejor
   encaja con el énfasis de tus respuestas (similitud de perfiles). Test de fans no oficial, con textos propios: sin imágenes, sin relación con los autores ni con los estudios. */
(function () {
  'use strict';
  var RASGOS = ["Pasión", "Trabajo en equipo", "Cabeza fría", "Constancia", "Liderazgo"];
  var PJ = [
    ["Shoyo Hinata", [100, 35, 10, 65, 10], "La energía que salta", "Entusiasmo puro y ganas de aprender. Contagias ánimo y trabajas sin parar para llegar más alto."],
    ["Tobio Kageyama", [65, 10, 35, 100, 10], "El perfeccionista", "Muy talentoso, exigente y concentrado. Aprendes que el juego es cosa de equipo."],
    ["Kei Tsukishima", [10, 65, 100, 35, 10], "La cabeza fría", "Irónico, analítico y observador. Detrás de tu calma hay un gran compromiso con el equipo."],
    ["Koshi Sugawara", [10, 100, 65, 35, 10], "El apoyo del equipo", "Amable, atento y siempre dispuesto a ayudar. Sabes escuchar y cuidas a tu gente."],
    ["Daichi Sawamura", [10, 65, 35, 10, 100], "El capitán sereno", "Sereno, responsable y con autoridad natural. Mantienes unido al equipo en los malos momentos."],
    ["Yu Nishinoya", [100, 65, 10, 10, 35], "La defensa incansable", "Energético, valiente y optimista. Levantas al equipo con tu entusiasmo."],
    ["Ryunosuke Tanaka", [100, 10, 10, 35, 65], "El corazón ruidoso", "Impulsivo, leal y de buen corazón. Das la cara por los tuyos sin pensar en las consecuencias."],
    ["Tooru Oikawa", [10, 10, 35, 100, 65], "El rival carismático", "Carismático, trabajador y estratégico. Tu talento es fruto del esfuerzo y del estudio del juego."]];
  var P = [
    ["Vais perdiendo por dos sets.", "Salto más alto y grito más fuerte", "Animo a todo el equipo a seguir juntos", "Analizo al rival y propongo un cambio", "Sigo a lo mío, punto a punto", "Tomo la palabra y reorganizo al equipo"],
    ["Toca un entrenamiento extra.", "Me quedo hasta que me echen del gimnasio", "Entreno con un compañero que me corrija", "Veo vídeos del rival", "Repito el mismo gesto mil veces", "Organizo un plan para todos"],
    ["Un compañero falla un saque importante.", "Le grito que el siguiente sale", "Le aplaudo: es cosa de todos", "Le explico qué ajustar", "Le recuerdo que la práctica lo arregla", "Le doy confianza y pido la pelota"],
    ["Tu principal virtud en un equipo es…", "Contagiar entusiasmo", "Hacer brillar a los demás", "Ver el juego dos pasos por delante", "No cansarme nunca de mejorar", "Marcar el rumbo"],
    ["Te toca un rival muy superior.", "Qué ganas de jugar contra él", "Lo mejor es intentarlo entre todos", "Estudio sus costumbres", "Hoy pierdo, mañana mejoro", "Convenzo al equipo de que se puede"],
    ["El día antes del partido…", "No puedo dormir de la emoción", "Cenamos juntos y bromeamos", "Repaso la táctica con calma", "Mi rutina de siempre, sin cambios", "Doy una charla corta al equipo"],
    ["Tu mayor fortaleza es…", "Mis ganas", "Mi generosidad con el grupo", "Mi serenidad", "Mi tenacidad", "Mi capacidad de dirigir"],
    ["Alguien dice que no tienes talento.", "Se lo demuestro en la pista", "Pienso en quienes sí creen en mí", "Lo analizo con frialdad", "Trabajo en silencio hasta que cambie de idea", "Les digo que me juzguen por mis resultados"],
    ["Te nombran capitán o capitana.", "Me pone a mil", "Pienso en cómo unirnos", "Pienso en un buen sistema de juego", "Seguiré igual de constante", "Es lo que estaba esperando"],
    ["El mejor momento de un partido es…", "El remate final", "Cuando todos celebramos juntos", "Cuando el plan sale como estaba previsto", "Cuando el esfuerzo da frutos", "Cuando el equipo me sigue"]].map(function (x) { return { t: x[0], o: x.slice(1).map(function (txt, i) { var d = {}; d['r' + i] = 1; return [txt, d]; }) }; });
  // Cada personaje se define por sus tres rasgos principales (100, 65 y 35 puntos; el resto, 10) y se compara con tus respuestas por similitud de perfil.
  var norma = function (v) { return Math.sqrt(v.reduce(function (a, b) { return a + b * b; }, 0)) || 1; };
  TT.cuestionario({
    intro: 'Diez situaciones con cinco respuestas. Elige lo que harías tú en tu equipo. Es un test de fans, sin imágenes y sin relación con la obra.',
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
        titulo: 'Tu personaje de Haikyu!!', titular: p[0], rango: { nombre: p[2], texto: p[3] + (empate.length > 1 ? ' Varios personajes encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '') },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Tus rasgos' }), TT.graf.radar(RASGOS.map(function (r, i) { return { nombre: r, valor: cuenta[i] / mayor * 100 }; }), { descripcion: 'Peso de cada rasgo en tus respuestas' })),
          TT.h('div', {}, TT.h('h3', { texto: 'Con quién encajas más' }), TT.graf.barras(puntos.slice(0, 5).map(function (x) { return { nombre: x.nombre, valor: Math.round(x.valor) }; }), { max: 100, unidad: ' %', destacar: 0, descripcion: 'Afinidad con los cinco personajes más parecidos' })),
          TT.h('p', { 'class': 'tt-res-texto', texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.' }),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.' })),
        detalles: RASGOS.map(function (r, i) { return [r, cuenta[i] + ' de ' + suma]; }),
        copia: 'En el test de Haikyu!! me ha salido: ' + p[0] + '.'
      };
    }
  });
})();

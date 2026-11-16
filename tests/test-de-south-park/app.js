/* Test de South Park: ¿qué personaje eres?: situaciones con una respuesta por rasgo. Cada personaje tiene su propio perfil de rasgos y el resultado es el personaje cuyo perfil mejor
   encaja con el énfasis de tus respuestas (similitud de perfiles). Test de fans no oficial, con textos propios: sin imágenes y sin relación con los autores. */
(function () {
  'use strict';
  var RASGOS = ["Sentido moral", "Ironía", "Picardía", "Ingenuidad", "Intensidad"];
  var PJ = [
    ["Stan Marsh", [100, 65, 10, 35, 10], "El sentido común con ironía", "Sensato y con una mirada irónica del mundo. Sueles ser la voz de la calma cuando tus amigos se meten en líos."],
    ["Kyle Broflovski", [100, 35, 10, 10, 65], "La conciencia con carácter", "Tienes un fuerte sentido de lo justo y no sabes callarte cuando algo te parece mal. Tu intensidad es tu mejor y tu peor arma."],
    ["Wendy Testaburger", [100, 35, 65, 10, 10], "La cabeza firme", "Segura, justa y con la lengua afilada. Defiendes lo que piensas con argumentos y no te dejas intimidar."],
    ["Eric Cartman", [10, 65, 100, 10, 35], "El ingenio sin frenos", "Ocurrente, intenso y con una enorme habilidad para montar planes. Si lo orientas bien, tu picardía no tiene límites."],
    ["Kenny McCormick", [10, 100, 35, 65, 10], "El buen humor ante todo", "Con un humor a prueba de todo, tomas la vida con ligereza. Te adaptas a cualquier situación y siempre aportas el punto divertido."],
    ["Butters Stotch", [65, 10, 10, 100, 35], "El corazón más bueno", "Amable, ilusionado y de una bondad sincera. Te cuesta ver la mala intención y siempre quieres que todo el mundo esté bien."],
    ["Randy Marsh", [10, 35, 65, 10, 100], "El entusiasmo desbordado", "Te lanzas de cabeza a cada nueva idea. Intenso, inventivo y con un humor muy particular, nunca te aburres."],
    ["Tweek Tweak", [65, 10, 10, 35, 100], "Los nervios a flor de piel", "Sensible y muy intenso: lo sientes todo con fuerza. Detrás de tu inquietud hay mucha bondad y una gran capacidad de esfuerzo."]];
  var P = [
    ["Tus amigos proponen algo que no está bien.", "Les digo que no y por qué", "Hago un comentario irónico y dejo que lo piensen", "Busco una forma de sacarle provecho", "Me dejo llevar: seguro que sale bien", "Me pongo nervioso/a e insisto en parar"],
    ["En el recreo…", "Defiendo a quien lo necesita", "Hago reír a todo el mundo", "Monto un negocio", "Juego con quien quiera", "No puedo parar quieto/a"],
    ["Un profesor te manda un trabajo absurdo.", "Lo hago bien y lo cuestiono después", "Lo hago con ironía", "Busco un atajo", "Lo hago con toda la ilusión", "Me agobio y lo hago de golpe"],
    ["Te enfadas cuando…", "Hay una injusticia", "Alguien se toma las cosas demasiado en serio", "Alguien me gana en mi propio juego", "Casi nunca: me cuesta enfadarme", "Todo se me junta"],
    ["La gente dice que eres…", "Muy justo/a", "Muy gracioso/a", "Muy listo/a", "Muy bueno/a", "Muy intenso/a"],
    ["Hay una moda que todo el mundo sigue.", "Pienso si merece la pena seguirla", "Me río de ella", "Vendo algo relacionado", "Me apunto: suena divertido", "Me obsesiono con ella"],
    ["Se te ocurre una idea disparatada.", "La descarto si hace daño a alguien", "La cuento con humor", "La convierto en un plan", "Se la cuento a todos con ilusión", "No puedo dejar de darle vueltas"],
    ["Un amigo pierde los nervios.", "Le doy un consejo sensato", "Le suelto una broma para calmarlo", "Le ayudo y de paso saco algo", "Le doy un abrazo", "Me contagio y me altero yo también"],
    ["Tu mejor virtud es…", "Mi conciencia", "Mi humor", "Mi picardía", "Mi inocencia", "Mi energía"],
    ["Un viernes por la noche ideal…", "Ver algo y debatirlo luego con mis amigos", "Una maratón de comedia", "Montar un plan que salga rentable", "Pasarlo bien con cualquiera", "Algo con muchas emociones y sin parar"]].map(function (x) { return { t: x[0], o: x.slice(1).map(function (txt, i) { var d = {}; d['r' + i] = 1; return [txt, d]; }) }; });
  // Cada personaje se define por sus tres rasgos principales (100, 65 y 35 puntos; el resto, 10) y se compara con tus respuestas por similitud de perfil.
  var norma = function (v) { return Math.sqrt(v.reduce(function (a, b) { return a + b * b; }, 0)) || 1; };
  TT.cuestionario({
    intro: 'Diez situaciones con cinco respuestas. Elige lo que harías tú. Es un test de fans, sin imágenes y sin relación con la serie ni con sus creadores.',
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
        titulo: 'Tu personaje de South Park', titular: '' + p[0], rango: { nombre: p[2], texto: p[3] + (empate.length > 1 ? ' Varios resultados encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '') },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Tus rasgos' }), TT.graf.radar(RASGOS.map(function (r, i) { return { nombre: r, valor: cuenta[i] / mayor * 100 }; }), { descripcion: 'Peso de cada rasgo en tus respuestas' })),
          TT.h('div', {}, TT.h('h3', { texto: 'Con quién encajas más' }), TT.graf.barras(puntos.slice(0, 5).map(function (x) { return { nombre: x.nombre, valor: Math.round(x.valor) }; }), { max: 100, unidad: ' %', destacar: 0, descripcion: 'Afinidad con los cinco personajes más parecidos' })),
          TT.h('p', { 'class': 'tt-res-texto', texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.' }),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.' })),
        detalles: RASGOS.map(function (r, i) { return [r, cuenta[i] + ' de ' + suma]; }),
        copia: 'En el test de South Park me ha salido: ' + p[0] + '.'
      };
    }
  });
})();

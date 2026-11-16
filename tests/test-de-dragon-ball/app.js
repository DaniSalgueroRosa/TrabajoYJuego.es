/* Test de Dragon Ball: diez situaciones con cinco respuestas (una por rasgo). Cada personaje tiene su propio perfil de rasgos y el resultado es el personaje cuyo perfil mejor
   encaja con el énfasis de tus respuestas (similitud de perfiles). Test de fans no oficial, con textos propios: sin imágenes, sin relación con los autores ni con los estudios. */
(function () {
  'use strict';
  var RASGOS = ["Superación", "Protección", "Ingenio", "Bondad", "Competitividad"];
  var PJ = [
    ["Goku", [100, 10, 10, 65, 35], "El eterno aprendiz", "Curioso, alegre y siempre con ganas de mejorar. Disfrutas del reto y confías en la gente casi por instinto."],
    ["Vegeta", [65, 35, 10, 10, 100], "El orgullo del guerrero", "Exigente contigo y con los demás, con un orgullo enorme y un gran corazón bien escondido. Quieres ser el mejor, pero también proteges a los tuyos."],
    ["Gohan", [10, 65, 35, 100, 10], "El corazón estudioso", "Amable, estudioso y con un enorme potencial. Prefieres la paz, pero cuando algo importa, sacas toda tu fuerza."],
    ["Piccolo", [10, 100, 65, 35, 10], "El protector serio", "Serio, reflexivo y muy protector. Enseñas con el ejemplo y cuidas de los demás con pocas palabras."],
    ["Bulma", [10, 35, 100, 65, 10], "La mente brillante", "Lista, valiente y con carácter. Resuelves problemas con ingenio y empujas a todos hacia la aventura."],
    ["Krilin", [35, 100, 10, 65, 10], "El amigo leal", "Leal, simpático y valiente cuando hay que serlo. Tu mayor fuerza es cuidar de tus amigos."],
    ["Trunks", [100, 65, 35, 10, 10], "El joven responsable", "Joven, serio y responsable. Asumes retos grandes y te esfuerzas por estar a la altura."],
    ["Maestro Roshi", [65, 10, 100, 35, 10], "El veterano bromista", "Sabio, veterano y bromista. Has visto mucho, enseñas con humor y sabes cuándo ponerte serio."]];
  var P = [
    ["Aparece un enemigo mucho más fuerte que tú.", "Es la ocasión perfecta para entrenar y superarme", "Me pongo delante para que los demás escapen", "Busco su punto débil y un truco", "Intento hablar con él: quizá no es tan malo", "Quiero medirme con él cuanto antes"],
    ["Tu fin de semana ideal…", "Entrenar hasta caer rendido/a", "Estar con mi familia y mis amigos", "Montar o arreglar algo con mis manos", "Cocinar algo rico para los míos", "Retar a alguien a lo que sea"],
    ["Pierdes un combate importante.", "Pienso en qué puedo mejorar y vuelvo a la carga", "Lo peor es haber puesto en peligro a otros", "Analizo qué ha pasado, paso a paso", "Felicito al otro y sigo adelante", "No lo acepto: quiero la revancha ya"],
    ["Te dan un superpoder. ¿Para qué lo usas?", "Para entrenar más y más", "Para proteger a quienes quiero", "Para inventar cosas útiles", "Para ayudar a quien lo necesite", "Para ser el número uno"],
    ["El equipo discute qué hacer.", "Propongo el plan más exigente", "Pido calma para que nadie salga herido", "Tengo un plan alternativo en el bolsillo", "Procuro que todos se sientan escuchados", "Propongo decidirlo con un duelo"],
    ["Tu mayor virtud es…", "No rendirme jamás", "Cuidar de los míos", "Ser listo/a y recursivo/a", "Ser buena persona", "Mi espíritu competitivo"],
    ["Cuando alguien te cuenta un problema…", "Le animo a luchar y a mejorar", "Le cuido y le acompaño", "Busco soluciones prácticas", "Le escucho con cariño", "Le reto a superarlo"],
    ["Un antiguo enemigo te pide perdón.", "Le doy una oportunidad si mejora", "Vigilo que no haga daño a nadie", "Pienso si es una trampa", "Lo perdono de buena gana", "Solo si me lo gano ganándole"],
    ["Tu lema sería…", "Más allá del límite", "Primero, los míos", "Cada problema tiene solución", "Con bondad se llega lejos", "El mejor se lleva todo"],
    ["En un viaje de aventuras, serías quien…", "Entrena más por el camino", "Vigila el campamento", "Consigue los mapas y los materiales", "Mantiene el buen ánimo", "Reta a todos en cada pueblo"]].map(function (x) { return { t: x[0], o: x.slice(1).map(function (txt, i) { var d = {}; d['r' + i] = 1; return [txt, d]; }) }; });
  // Cada personaje se define por sus tres rasgos principales (100, 65 y 35 puntos; el resto, 10) y se compara con tus respuestas por similitud de perfil.
  var norma = function (v) { return Math.sqrt(v.reduce(function (a, b) { return a + b * b; }, 0)) || 1; };
  TT.cuestionario({
    intro: 'Diez situaciones con cinco respuestas. Elige lo que harías tú de verdad. Es un test de fans, sin imágenes y sin relación con la obra.',
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
        titulo: 'Tu personaje de Dragon Ball', titular: p[0], rango: { nombre: p[2], texto: p[3] + (empate.length > 1 ? ' Varios personajes encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '') },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Tus rasgos' }), TT.graf.radar(RASGOS.map(function (r, i) { return { nombre: r, valor: cuenta[i] / mayor * 100 }; }), { descripcion: 'Peso de cada rasgo en tus respuestas' })),
          TT.h('div', {}, TT.h('h3', { texto: 'Con quién encajas más' }), TT.graf.barras(puntos.slice(0, 5).map(function (x) { return { nombre: x.nombre, valor: Math.round(x.valor) }; }), { max: 100, unidad: ' %', destacar: 0, descripcion: 'Afinidad con los cinco personajes más parecidos' })),
          TT.h('p', { 'class': 'tt-res-texto', texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.' }),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.' })),
        detalles: RASGOS.map(function (r, i) { return [r, cuenta[i] + ' de ' + suma]; }),
        copia: 'En el test de Dragon Ball me ha salido: ' + p[0] + '.'
      };
    }
  });
})();

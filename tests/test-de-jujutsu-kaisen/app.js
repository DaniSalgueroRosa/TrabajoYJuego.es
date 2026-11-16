/* Test de Jujutsu Kaisen: diez situaciones con cinco respuestas (una por rasgo). Cada personaje tiene su propio perfil de rasgos y el resultado es el personaje cuyo perfil mejor
   encaja con el énfasis de tus respuestas (similitud de perfiles). Test de fans no oficial, con textos propios: sin imágenes, sin relación con los autores ni con los estudios. */
(function () {
  'use strict';
  var RASGOS = ["Valentía", "Sentido del deber", "Estrategia", "Empatía", "Descaro"];
  var PJ = [
    ["Yuji Itadori", [65, 35, 10, 100, 10], "El corazón noble", "Generoso, valiente y muy humano. Te importa cada persona y esa bondad es tu mayor fuerza."],
    ["Megumi Fushiguro", [10, 65, 100, 35, 10], "El estratega justo", "Reservado, analítico y con un fuerte sentido de la justicia. Piensas antes de actuar y cuidas a quien lo merece."],
    ["Nobara Kugisaki", [65, 35, 10, 10, 100], "La seguridad con carácter", "Directa, segura de ti y con un estilo propio. No te dejas intimidar y dices lo que piensas."],
    ["Satoru Gojo", [35, 10, 65, 10, 100], "El más carismático", "Carismático, bromista y muy seguro. Tras tu descaro hay una visión clara de lo que quieres cambiar."],
    ["Maki Zen'in", [100, 65, 35, 10, 10], "La disciplina de hierro", "Disciplinada, autosuficiente y muy tenaz. Confías en tu esfuerzo y no necesitas que nadie te dé permiso."],
    ["Toge Inumaki", [35, 100, 10, 65, 10], "El silencio con estilo", "Reservado y leal, de pocas palabras. Dices lo justo y cuidas de los tuyos."],
    ["Panda", [10, 35, 10, 100, 65], "El gigante amable", "Amable, protector y con sentido del humor. Cuidas de tus compañeros con una ternura que da seguridad."],
    ["Kento Nanami", [10, 100, 65, 35, 10], "El adulto responsable", "Serio, trabajador y de fiar. Pones orden, haces tu parte y ofreces calma cuando todo se complica."]];
  var P = [
    ["Alguien necesita ayuda en una situación peligrosa.", "Me lanzo sin pensarlo", "Hago lo que me toca, aunque cueste", "Valoro los riesgos y elijo el mejor plan", "Me preocupo primero por cómo está", "Suelto una broma para quitar tensión y actúo"],
    ["Un compañero se equivoca.", "Le animo a intentarlo otra vez", "Le explico cómo debe hacerse", "Analizo qué falló para que no se repita", "Le consuelo antes de nada", "Le suelto una pulla cariñosa"],
    ["¿Qué esperas de un equipo?", "Que nadie se eche atrás", "Que cada uno cumpla su parte", "Que haya un plan claro", "Que nos cuidemos entre todos", "Que nos lo pasemos bien aun en lo difícil"],
    ["Te dan una orden que no te gusta.", "La cuestiono si hace falta", "La cumplo: es mi responsabilidad", "Busco una vía más eficaz", "Pienso en a quién afecta", "La cumplo a mi manera"],
    ["Tu mejor cualidad en un combate sería…", "Mi coraje", "Mi disciplina", "Mi cabeza fría", "Mi corazón", "Mi estilo propio"],
    ["Un día libre…", "Salir a hacer algo atrevido", "Ordenar y descansar para el lunes", "Un buen juego de estrategia o un libro", "Quedar con la gente que quiero", "Hacer lo que me dé la gana"],
    ["Tu mayor miedo es…", "Quedarme paralizado/a", "Fallar a los demás", "Que el plan salga mal", "Perder a los míos", "Aburrirme"],
    ["Ante alguien muy poderoso…", "Le planto cara", "Cumplo con mi trabajo sin dejarme impresionar", "Estudio cómo se mueve", "Le trato con respeto aunque sea mi rival", "Le saco la lengua y sigo"],
    ["Lo que más valoras de un amigo…", "Que es valiente", "Que es de fiar", "Que es listo", "Que es sincero y cálido", "Que tiene chispa"],
    ["Si pudieras elegir una frase…", "No pienso rendirme", "Hay que hacer lo correcto", "Todo tiene su plan", "Nadie debería quedarse solo", "Vive a tu manera"]].map(function (x) { return { t: x[0], o: x.slice(1).map(function (txt, i) { var d = {}; d['r' + i] = 1; return [txt, d]; }) }; });
  // Cada personaje se define por sus tres rasgos principales (100, 65 y 35 puntos; el resto, 10) y se compara con tus respuestas por similitud de perfil.
  var norma = function (v) { return Math.sqrt(v.reduce(function (a, b) { return a + b * b; }, 0)) || 1; };
  TT.cuestionario({
    intro: 'Diez situaciones con cinco respuestas. Elige lo que harías tú. Es un test de fans, sin imágenes, sin spoilers y sin relación con la obra.',
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
        titulo: 'Tu personaje de Jujutsu Kaisen', titular: p[0], rango: { nombre: p[2], texto: p[3] + (empate.length > 1 ? ' Varios personajes encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '') },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Tus rasgos' }), TT.graf.radar(RASGOS.map(function (r, i) { return { nombre: r, valor: cuenta[i] / mayor * 100 }; }), { descripcion: 'Peso de cada rasgo en tus respuestas' })),
          TT.h('div', {}, TT.h('h3', { texto: 'Con quién encajas más' }), TT.graf.barras(puntos.slice(0, 5).map(function (x) { return { nombre: x.nombre, valor: Math.round(x.valor) }; }), { max: 100, unidad: ' %', destacar: 0, descripcion: 'Afinidad con los cinco personajes más parecidos' })),
          TT.h('p', { 'class': 'tt-res-texto', texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.' }),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.' })),
        detalles: RASGOS.map(function (r, i) { return [r, cuenta[i] + ' de ' + suma]; }),
        copia: 'En el test de Jujutsu Kaisen me ha salido: ' + p[0] + '.'
      };
    }
  });
})();

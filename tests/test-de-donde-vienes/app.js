/* ¿De dónde vienes?: 16 preguntas sobre las palabras y rasgos que dices usar (vosotros o ustedes, vos o tú, seseo, «ll», aspiración de la «s» y vocabulario
   cotidiano). Cada respuesta suma puntos a las regiones donde esa forma es habitual y el resultado es la región con más coincidencia. No escucha ni analiza la voz. */
(function () {
  'use strict';
  var REG = {"es": "España", "mx": "México", "ca": "Centroamérica", "cb": "Caribe hispano", "co": "Colombia y Venezuela", "an": "Andes (Perú, Ecuador y Bolivia)", "ch": "Chile", "rp": "Río de la Plata"};
  var TEXTOS = {
 "es": [
  "Español peninsular",
  "Tus respuestas suenan a España: distingues la «z» de la «s», dices «vosotros» y usas palabras como móvil, coche, zumo o aguacate."
 ],
 "mx": [
  "Español de México",
  "Tus respuestas suenan a México: palabras como camión, banqueta, chido o cacahuate y un uso claro de «ustedes» para todos los grupos."
 ],
 "ca": [
  "Español centroamericano",
  "Tus respuestas suenan a Centroamérica: mezclas el «vos» con el «usted» cariñoso, dices «carro» y conoces palabras propias como chilero."
 ],
 "cb": [
  "Español caribeño",
  "Tus respuestas suenan al Caribe hispano: «guagua», «carro» y una «s» final suave o aspirada, con un ritmo rápido y musical."
 ],
 "co": [
  "Español de Colombia y Venezuela",
  "Tus respuestas suenan a Colombia o Venezuela: «chévere», «cotufas» o «crispetas», «buseta» y un «usted» muy extendido incluso entre amigos."
 ],
 "an": [
  "Español andino",
  "Tus respuestas suenan a la zona andina (Perú, Ecuador y Bolivia): «canguil», «chibolo», «lapicero», maní y una «s» final firme."
 ],
 "ch": [
  "Español chileno",
  "Tus respuestas suenan a Chile: «cabritas», «cabro», «lápiz pasta», «bacán» y un «tú» con verbos propios como «tú tení»."
 ],
 "rp": [
  "Español rioplatense",
  "Tus respuestas suenan al Río de la Plata: «vos», «pochoclo», «colectivo», «pibe» y una «ll» que suena a «sh»."
 ]
};
  var P = [
    {"t": "Si hablas a un grupo de amigos, ¿cómo les dices?", "o": [["«Vosotros»: ¿vosotros queréis venir?", {"es": 3}], ["«Ustedes»: ¿ustedes quieren venir?", {"mx": 1, "ca": 1, "cb": 1, "co": 1, "an": 1, "ch": 1, "rp": 1}]]},
    {"t": "Y a un solo amigo, ¿cómo le hablas?", "o": [["«Tú»: tú tienes, tú puedes", {"es": 2, "mx": 2, "cb": 2, "an": 1, "ch": 1}], ["«Vos»: vos tenés, vos podés", {"rp": 3, "ca": 2, "co": 1}], ["«Usted», incluso entre amigos o en familia", {"co": 2, "ca": 1}], ["«Tú», pero con verbos como «tú tení» o «tú sabís»", {"ch": 3}]]},
    {"t": "¿Pronuncias igual «casa» y «caza»?", "o": [["Sí, igual: la «z» suena como una «s»", {"mx": 1, "ca": 1, "cb": 1, "co": 1, "an": 1, "ch": 1, "rp": 1}], ["No: la «z» suena como la «th» inglesa de «think»", {"es": 3}]]},
    {"t": "¿Cómo suena la «ll» de «calle» o «llave»?", "o": [["Como una «sh» o una «zh» («cashe», «shave»)", {"rp": 3}], ["Como una «y» normal («caye», «yave»)", {"es": 1, "mx": 1, "ca": 1, "cb": 1, "co": 1, "an": 1, "ch": 1}], ["Distingo la «ll» de la «y»: suena como la «ly» de «million»", {"an": 3}]]},
    {"t": "¿Qué haces con la «s» al final de las sílabas («los amigos», «estos»)?", "o": [["La pronuncio clara siempre", {"mx": 2, "an": 2, "co": 1, "es": 1}], ["La aspiro o casi desaparece («lo amigo», «ehto»)", {"cb": 3, "ch": 2, "rp": 1, "es": 1}]]},
    {"t": "Para el autobús de la ciudad, ¿qué palabra usas?", "o": [["Autobús", {"es": 3}], ["Camión", {"mx": 3}], ["Guagua", {"cb": 3}], ["Colectivo", {"rp": 3, "co": 1}], ["Micro", {"ch": 3, "an": 1}], ["Bus o buseta", {"co": 2, "ca": 2, "an": 1}]]},
    {"t": "Para las palomitas de maíz…", "o": [["Palomitas", {"es": 3, "mx": 1}], ["Pochoclo", {"rp": 3}], ["Cabritas", {"ch": 3}], ["Canguil", {"an": 3}], ["Cotufas o crispetas", {"co": 3}], ["Rositas de maíz o poporopos", {"cb": 2, "ca": 2}]]},
    {"t": "¿Qué dices para el aguacate?", "o": [["Aguacate", {"es": 3, "mx": 3, "ca": 3, "cb": 2, "co": 2}], ["Palta", {"an": 3, "ch": 3, "rp": 3}]]},
    {"t": "Y para la fresa…", "o": [["Fresa", {"es": 3, "mx": 3, "ca": 2, "cb": 2, "co": 2}], ["Frutilla", {"ch": 3, "rp": 3, "an": 1}]]},
    {"t": "Para el cacahuete…", "o": [["Cacahuete", {"es": 3}], ["Cacahuate", {"mx": 3, "ca": 1}], ["Maní", {"cb": 2, "co": 2, "an": 3, "ch": 3, "rp": 3}]]},
    {"t": "Para el teléfono móvil…", "o": [["Móvil", {"es": 3}], ["Celular", {"mx": 1, "ca": 2, "cb": 2, "co": 2, "an": 2, "ch": 2, "rp": 2}]]},
    {"t": "Para el coche…", "o": [["Coche", {"es": 3, "mx": 1}], ["Carro", {"cb": 3, "co": 3, "ca": 3, "mx": 1, "an": 1}], ["Auto", {"rp": 3, "ch": 2, "an": 1}]]},
    {"t": "Para un chico joven…", "o": [["Chaval", {"es": 3}], ["Chamaco o chavo", {"mx": 3}], ["Pibe", {"rp": 3}], ["Cabro", {"ch": 3}], ["Pelao o chamo", {"co": 3, "cb": 1}], ["Chibolo", {"an": 3}]]},
    {"t": "Para el bolígrafo…", "o": [["Bolígrafo o boli", {"es": 3}], ["Pluma", {"mx": 3}], ["Lapicera o birome", {"rp": 3}], ["Lápiz pasta", {"ch": 3}], ["Esfero", {"co": 3, "an": 1}], ["Lapicero", {"an": 3, "ca": 2}]]},
    {"t": "Cuando algo es genial, dices que es…", "o": [["Guay o mola", {"es": 3}], ["Chido o padre", {"mx": 3}], ["Chévere", {"co": 3, "cb": 2, "an": 2, "ca": 1}], ["Bacán", {"ch": 3, "an": 2}], ["Copado, de diez o bárbaro", {"rp": 3}], ["Chilero", {"ca": 3}]]},
    {"t": "Para la acera…", "o": [["Acera", {"es": 3, "cb": 2}], ["Banqueta", {"mx": 3, "ca": 1}], ["Vereda", {"rp": 3, "ch": 3, "an": 1}], ["Andén", {"co": 3, "ca": 1}]]}];
  TT.cuestionario({
    intro: 'Dieciséis preguntas sobre cómo hablas: elige lo que tú dices de forma natural. Este test no escucha tu voz, solo compara tus palabras y tus costumbres al hablar con las de cada región.',
    preguntas: P,
    resultado: function (c) {
      var claves = Object.keys(REG), orden = c.top(claves, true), a = orden[0], b = orden[1];
      var empate = orden.filter(function (x) { return a[1] - x[1] < 0.5; }).length > 1;
      var items = orden.map(function (x) { return { nombre: REG[x[0]], valor: Math.round(x[1]) }; });
      return {
        titulo: '¿De dónde vienes?', titular: REG[a[0]], valor: Math.round(a[1]), unidad: ' % de coincidencia',
        rango: { nombre: TEXTOS[a[0]][0], texto: TEXTOS[a[0]][1] + (empate ? ' Tus respuestas encajan casi igual con otra región, así que el orden entre ellas puede ser casual.' : '') },
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'Cuánto coincides con cada región' }), TT.graf.barras(items, { max: 100, unidad: ' %', destacar: 0, descripcion: 'Porcentaje de coincidencia con cada región hispanohablante' })),
          TT.h('p', { 'class': 'tt-res-texto', texto: 'Tu segunda región más cercana: ' + REG[b[0]] + '.' }),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Es un juego orientativo: dentro de cada región el habla cambia mucho de una ciudad a otra y hay personas que mezclan rasgos de varias. Un resultado alto no dice dónde has nacido ni dónde vives.' })),
        detalles: [['Región más cercana', REG[a[0]]], ['Segunda región', REG[b[0]]], ['Coincidencia', Math.round(a[1]) + ' %']],
        copia: 'En el test de ¿De dónde vienes? mi español suena a ' + REG[a[0]] + '.'
      };
    }
  });
})();

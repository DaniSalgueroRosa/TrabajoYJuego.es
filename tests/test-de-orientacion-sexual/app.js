/* Test de sexualidad / orientación sexual: trece frases sobre a quién sientes atracción (hombres, mujeres, personas no binarias) y cuánto depende del vínculo
   o del género. Un plano de dos ejes (atracción hacia hombres y hacia mujeres) muestra tu perfil. No es un diagnóstico: solo tú sabes cómo te defines. */
(function () {
  'use strict';
  function e(t, d) { return { t: t, d: d, escala: 'acuerdo' }; }
  var P = [
    { t: 'Primero, ¿cómo te defines? Esta pregunta no puntúa: solo sirve para adaptar las palabras del resultado.', fijo: true, o: [['Hombre', { gh: 1 }], ['Mujer', { gm: 1 }], ['Persona no binaria u otra', { gn: 1 }], ['Prefiero no decirlo', { gp: 1 }]] },
    e('Me ilusiono o me enamoro de hombres.', { ah: 1 }),
    e('Me atraen físicamente los hombres.', { ah: 1 }),
    e('Me imagino teniendo una relación con un hombre.', { ah: 1 }),
    e('Me ilusiono o me enamoro de mujeres.', { am: 1 }),
    e('Me atraen físicamente las mujeres.', { am: 1 }),
    e('Me imagino teniendo una relación con una mujer.', { am: 1 }),
    e('Me ilusiono o me enamoro de personas no binarias.', { an: 1 }),
    e('Me atraen físicamente personas no binarias.', { an: 1 }),
    e('Me imagino teniendo una relación con una persona no binaria.', { an: 1 }),
    e('Siento poca o ninguna atracción por nadie.', { as: 1 }),
    e('La atracción me surge sobre todo cuando ya tengo un vínculo emocional fuerte.', { ad: 1 }),
    e('Mi atracción depende más de cómo es la persona que de su género.', { ap: 1 })
  ];
  var N = { ah: 'Atracción hacia hombres', am: 'Atracción hacia mujeres', an: 'Atracción hacia personas no binarias', as: 'Poca o ninguna atracción', ad: 'Atracción tras el vínculo', ap: 'Importa la persona, no el género' };
  TT.cuestionario({
    intro: 'Responde con sinceridad, solo para ti. Nadie ve tus respuestas y el resultado no es un diagnóstico: es un mapa para pensar. Orientarse no es un examen.',
    escala: 'acuerdo',
    preguntas: P,
    resultado: function (c) {
      var h = c.pct('ah'), m = c.pct('am'), n = c.pct('an'), s = c.pct('as'), ad = c.pct('ad'), ap = c.pct('ap');
      var yo = c.tot.gh ? 'h' : c.tot.gm ? 'm' : c.tot.gn ? 'n' : 'p', hh = h >= 50, mm = m >= 50, nn = n >= 50, ace = s >= 60, titular, texto, terminos = '';
      if (ace && !hh && !mm && !nn) { titular = 'Poca atracción hacia los demás'; texto = 'Tus respuestas muestran poca o ninguna atracción. Es una forma de ser muy común y válida.'; terminos = 'Algunas personas con un perfil así usan palabras como asexual o en el espectro asexual.'; }
      else if (hh && mm) { titular = 'Atracción hacia hombres y hacia mujeres'; texto = 'Tus respuestas muestran atracción hacia más de un género.'; terminos = 'Algunas personas con este perfil usan palabras como bisexual o pansexual.'; }
      else if (hh && !mm) { titular = 'Atracción sobre todo hacia hombres'; texto = 'Tus respuestas muestran atracción sobre todo hacia hombres.'; terminos = yo === 'h' ? 'Algunos hombres con este perfil usan la palabra gay.' : yo === 'm' ? 'Algunas mujeres con este perfil usan la palabra heterosexual.' : 'Cada persona elige la palabra que le encaja, o ninguna.'; }
      else if (mm && !hh) { titular = 'Atracción sobre todo hacia mujeres'; texto = 'Tus respuestas muestran atracción sobre todo hacia mujeres.'; terminos = yo === 'm' ? 'Algunas mujeres con este perfil usan la palabra lesbiana.' : yo === 'h' ? 'Algunos hombres con este perfil usan la palabra heterosexual.' : 'Cada persona elige la palabra que le encaja, o ninguna.'; }
      else if (nn) { titular = 'Atracción hacia personas no binarias'; texto = 'Tus respuestas muestran atracción sobre todo hacia personas no binarias o hacia la persona más que hacia un género.'; terminos = 'Algunas personas con este perfil usan palabras como pansexual o queer.'; }
      else { titular = 'Un perfil abierto o todavía por explorar'; texto = 'Tus respuestas no marcan una dirección clara. Es muy común y no tienes que decidirlo ahora.'; terminos = 'Es perfectamente válido no tener una etiqueta.'; }
      var extra = TT.h('div', { 'class': 'tt-res-extra' },
        TT.h('div', {}, TT.h('h3', { texto: 'Tu mapa de atracción' }), TT.graf.plano(h, m, { ejeX: 'Atracción hacia hombres', ejeY: 'Atracción hacia mujeres', esquinas: ['Mujeres', 'Hombres y mujeres', 'Poca atracción', 'Hombres'], descripcion: 'Atracción hacia hombres y hacia mujeres' })),
        TT.h('div', {}, TT.h('h3', { texto: 'En cifras' }), TT.graf.barras(['ah', 'am', 'an', 'as', 'ad', 'ap'].map(function (d) { return { nombre: N[d], valor: c.pct(d) }; }), { descripcion: 'Porcentaje en cada afirmación' })),
        TT.h('p', { 'class': 'tt-res-texto', texto: terminos }),
        TT.h('p', { 'class': 'tt-aviso', texto: 'Ningún test puede decirte tu orientación: solo tú sabes cómo te sientes y cómo quieres llamarlo. Las etiquetas son opcionales, pueden cambiar con el tiempo y todas son igual de válidas. Si necesitas hablarlo, busca a alguien de confianza o una asociación LGTBI+ de tu zona.' }));
      return { titulo: 'Tu mapa de atracción', titular: titular, rango: { nombre: 'Un retrato de hoy', texto: texto }, extra: extra,
        detalles: ['ah', 'am', 'an', 'as'].map(function (d) { return [N[d], TT.fmt(c.pct(d), 0) + ' %']; }),
        copia: 'Mi mapa de atracción en este test: ' + titular.toLowerCase() + '.' };
    }
  });
})();

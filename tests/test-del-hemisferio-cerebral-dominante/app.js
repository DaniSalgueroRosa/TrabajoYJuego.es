/* Test del hemisferio cerebral dominante: quince pares de frases sobre tres ejes (lógica o intuición, secuencia o conjunto, palabras o imágenes).
   Aviso claro: la idea de un hemisferio «dominante» es un mito. El test mide tu estilo de pensar, no tu cerebro. */
(function () {
  'use strict';
  function q(t, a, b, ta, tb) { var x = {}, y = {}; x[a] = 1; y[b] = 1; return { t: t, o: [[ta, x], [tb, y]] }; }
  var P = [
    q('Para resolver un problema…', 'la', 'in', 'Voy paso a paso con lógica', 'Doy un salto y confío en mi corazonada'),
    q('Al aprender algo nuevo…', 'se', 'gl', 'Prefiero un orden claro, de lo simple a lo complejo', 'Necesito ver el panorama completo primero'),
    q('Al recordar algo…', 'pa', 'im', 'Recuerdo lo que dijeron', 'Recuerdo cómo se veía'),
    q('Tu forma de decidir es…', 'la', 'in', 'Pesar pros y contras', 'Dejar que la intuición diga'),
    q('Cuando montas un mueble…', 'se', 'gl', 'Sigo el manual paso a paso', 'Miro la foto final y lo voy montando'),
    q('Para explicarte algo, prefieres…', 'pa', 'im', 'Un texto bien escrito', 'Un esquema o un dibujo'),
    q('Se te da mejor…', 'la', 'in', 'Analizar y calcular', 'Imaginar y combinar'),
    q('Tu mesa de trabajo es…', 'se', 'gl', 'Ordenada por categorías', 'Visual: con las cosas a la vista'),
    q('En un mapa…', 'pa', 'im', 'Prefiero que me lo indiquen con palabras', 'Me oriento con el dibujo'),
    q('Ante una norma…', 'la', 'in', 'Quiero entender la razón', 'Prefiero sentir si es adecuada'),
    q('Tus apuntes tienen…', 'se', 'gl', 'Frases ordenadas y numeradas', 'Flechas, colores y esquemas'),
    q('Para recordar un nombre…', 'pa', 'im', 'Lo repito o lo escribo', 'Imagino a la persona o una imagen'),
    q('Cuando lees una historia…', 'la', 'in', 'Me fijo en la coherencia de los hechos', 'Me dejo llevar por las emociones'),
    q('Tu forma de trabajar…', 'se', 'gl', 'Una tarea cada vez hasta terminarla', 'Varias a la vez según me inspire'),
    q('Al dar instrucciones…', 'pa', 'im', 'Las explico con claridad con palabras', 'Hago un dibujo o lo enseño')
  ];
  TT.cuestionario({
    intro: 'Quince preguntas con dos respuestas. Elige la que más se parezca a tu forma de pensar. Ojo: la idea de «hemisferio dominante» es un mito popular; este test solo mide tu estilo, no tu cerebro.',
    mezclar: true,
    preguntas: P,
    resultado: function (c) {
      function ej(a, b, na, nb) { return { izq: na, der: nb, v: c.tot[a] / (c.tot[a] + c.tot[b]) * 100 }; }
      var analitico = c.tot.la + c.tot.se + c.tot.pa, total = 15, intuitivo = total - analitico, valor = analitico / total * 100;
      var rango = TT.rango(analitico, [
        [0, 'Estilo muy intuitivo y visual', 'Piensas en conjuntos, imágenes y corazonadas. Eres de los que ven el cuadro entero antes que los detalles. Se suele llamar «hemisferio derecho», pero tu cerebro trabaja como el de todos: con los dos lados.'],
        [4, 'Más intuitivo que analítico', 'Te mueves bien en lo creativo y global, y también sabes ordenar cuando hace falta.'],
        [7, 'Estilo equilibrado', 'Combinas orden e intuición, palabras e imágenes. Es la mezcla más habitual y la más flexible.'],
        [9, 'Más analítico que intuitivo', 'Te gustan el orden, la lógica y las explicaciones claras, y también te permites ideas libres cuando toca.'],
        [12, 'Estilo muy analítico y secuencial', 'Piensas paso a paso, con lógica y con palabras. Se suele llamar «hemisferio izquierdo», pero tu cerebro trabaja como el de todos: con los dos lados.']]);
      return {
        titulo: 'Tu estilo de pensamiento', valor: analitico + ' / ' + total, unidad: 'respuestas analíticas', rango: rango,
        extra: TT.h('div', { 'class': 'tt-res-extra' },
          TT.h('div', {}, TT.h('h3', { texto: 'De intuitivo a analítico' }), TT.graf.espectro(valor, { izq: 'Intuitivo y visual', der: 'Analítico y secuencial', marcas: [[0, 'Derecho (mito)'], [100, 'Izquierdo (mito)']], descripcion: 'Tu estilo de pensamiento, de intuitivo a analítico' })),
          TT.h('div', {}, TT.h('h3', { texto: 'Tus tres ejes' }), TT.graf.ejes([ej('la', 'in', 'Lógica', 'Intuición'), ej('se', 'gl', 'Secuencia', 'Conjunto'), ej('pa', 'im', 'Palabras', 'Imágenes')], { descripcion: 'Porcentaje de respuestas hacia cada lado de los tres ejes' })),
          TT.h('p', { 'class': 'tt-aviso', texto: 'Los estudios con resonancia magnética no han encontrado personas que usen sobre todo un lado del cerebro: los dos hemisferios colaboran en casi todo. Tu resultado habla de cómo prefieres pensar, que puede cambiar con la práctica.' })),
        detalles: [['Respuestas analíticas', analitico + ' de ' + total], ['Respuestas intuitivas', intuitivo + ' de ' + total]],
        copia: 'Mi estilo de pensamiento en este test: ' + rango.nombre.toLowerCase() + '.'
      };
    }
  });
})();

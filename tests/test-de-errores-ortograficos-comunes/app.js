/* Test de errores ortográficos comunes: 24 preguntas de opción múltiple por franjas de dificultad. Se corrige al responder y el resultado estima un nivel (una franja
   se da por superada con un 60 % de aciertos, siguiendo el orden). Preguntas y explicaciones propias; nada se envía ni se guarda. */
(function () {
  'use strict';
  var NIVELES = ["Básicos", "Frecuentes", "Delicados", "Expertos"];
  var RESULTADOS = [
    ["Ortografía por pulir", "Te cuestan algunos errores muy comunes. Con repasar las parejas más típicas (a ver / haber, hecho / echo, por qué / porque) ganarás mucho."],
    ["Ortografía correcta", "Dominas las confusiones más habituales. Para subir, repasa las parejas menos obvias y las reglas de acentuación."],
    ["Buena ortografía", "Escribes con seguridad y evitas la mayoría de los errores frecuentes. Quedan algunos detalles de tildes y locuciones."],
    ["Ortografía muy sólida", "Tu ortografía es muy fiable: distingues hasta los errores más sutiles, incluso los que se escapan a un lector atento."],
    ["Ortografía de corrector", "Pocas faltas se te escapan. Tienes mirada de corrector o correctora."]].map(function (x) { return { n: x[0], d: x[1] }; });
  // [franja, pregunta, [correcta, error, error, error], explicación]: la correcta va primera y el motor mezcla las respuestas
  var P = [
    [0, "Mañana vamos ___ qué tal sale el examen.", ["a ver", "haber", "a ber", "ha ver"], "«A ver» es la preposición «a» más el verbo «ver». «Haber» es el verbo auxiliar: «va a haber lío»."],
    [0, "Se me ha ___ tarde para llegar.", ["hecho", "echo", "hexo", "eho"], "«Hecho» viene del verbo hacer. «Echo» viene de echar: «echo sal»."],
    [0, "___ muchas personas en la sala.", ["Hay", "Ahí", "Ay", "Ai"], "«Hay» es una forma del verbo haber; «ahí» es un lugar y «ay» es una interjección."],
    [0, "¡___ sorpresa nos hemos llevado!", ["Vaya", "Valla", "Baya", "Vaia"], "«Vaya» es una forma del verbo ir; «valla» es una cerca y «baya» es un fruto."],
    [0, "No sé ___ no ha venido.", ["por qué", "porque", "porqué", "por que"], "En las preguntas, directas o indirectas, se escribe «por qué»: «no sé por qué...»."],
    [0, "Te lo digo ___ me importas.", ["porque", "por qué", "porqué", "por que"], "«Porque» introduce una causa: «me importas, por eso te lo digo»."],
    [1, "___ llueve, iremos al campo.", ["Si no", "Sino", "Sin no", "Si nó"], "Si es una condición, «si no» va separado: «si no llueve...». «Sino» introduce un contraste."],
    [1, "No quiere agua, ___ zumo.", ["sino", "si no", "sin o", "siño"], "«Sino» se usa para contraponer: «no agua, sino zumo»."],
    [1, "Yo ___ voy al cine.", ["también", "tan bien", "tambien", "tambié"], "«También» equivale a «además». «Tan bien» es «tan» más el adverbio «bien»."],
    [1, "Cantas ___ que podrías ser profesional.", ["tan bien", "también", "tanbién", "tan vien"], "Aquí «tan» refuerza «bien»: «cantas tan bien»."],
    [1, "Pon eso ___, que molesta.", ["aparte", "a parte", "aparté", "a partes"], "«Aparte» es el adverbio de lugar («en otro sitio»); también es nombre («un aparte»)."],
    [1, "Me gusta ___ el chocolate.", ["sobre todo", "sobretodo", "sobre-todo", "sobre tó"], "La locución adverbial se escribe en dos palabras. «Sobretodo» es un abrigo (nombre)."],
    [2, "Según la ortografía actual de la RAE, «solo» como adverbio («solamente»)…", ["No lleva tilde", "Lleva tilde siempre", "Lleva tilde en las oraciones largas", "Lleva tilde en plural"], "Desde 2010 se recomienda escribir «solo» sin tilde incluso cuando hay ambigüedad."],
    [2, "___ no ha llegado el correo que esperaba.", ["Aún", "Aun", "Aúm", "Aunn"], "«Aún» (con tilde) equivale a «todavía». «Aun» equivale a «incluso»: «aun así»."],
    [2, "Necesito terminar el ___ de la película.", ["guion", "guión", "guíon", "gion"], "«Guion» es monosílabo a efectos ortográficos desde 2010, por eso no lleva tilde."],
    [2, "Déjalo ___, sobre la mesa.", ["ahí", "hay", "ay", "ahy"], "«Ahí» es un adverbio de lugar. «Hay» es del verbo haber y «ay» una interjección."],
    [2, "Espero que ___ sol mañana.", ["haya", "halla", "aya", "allá"], "«Haya» es una forma del verbo haber; «halla» es del verbo hallar; «allá» es un adverbio de lugar."],
    [2, "Cuando ___ la llave, avísame.", ["halles", "hayes", "alles", "ayes"], "«Halles» es subjuntivo de «hallar» (encontrar), con «h» inicial y «ll»."],
    [3, "Está ___ de tanto correr.", ["exhausto", "exausto", "ehxausto", "exaus-to"], "«Exhausto» lleva «h» tras la «x», igual que «exhibir» o «exhalar»."],
    [3, "Es una ___ a la regla.", ["excepción", "exepción", "excepcion", "ecepción"], "Lleva «xc» y tilde: es una palabra aguda terminada en «n»."],
    [3, "Ayer ___ un accidente.", ["tuvo", "tubo", "tubó", "tuvó"], "«Tuvo» es una forma de «tener». «Tubo» es el conducto cilíndrico."],
    [3, "Salió a la calle ___ de la lluvia.", ["a pesar", "apesar", "a pezar", "a pessar"], "La locución «a pesar de» se escribe siempre en tres palabras."],
    [3, "No entiendo el ___ de su decisión.", ["porqué", "por qué", "porque", "por que"], "Con artículo, «porqué» es un nombre que significa «motivo»: «el porqué de todo»."],
    [3, "Los captores liberaron al ___.", ["rehén", "rehen", "reen", "rején"], "«Rehén» es aguda terminada en «n» y lleva tilde."]].map(function (x) { return { n: x[0], t: x[1], o: x[2], c: 0, e: x[3] }; });
  TT.quiz({
    intro: 'Veinticuatro frases con un hueco. Elige cómo se escribe correctamente; se corrige al momento, con la regla en una línea. Según la ortografía de la RAE actual.',
    titulo: 'Tu nivel de ortografía',
    niveles: NIVELES,
    resultados: RESULTADOS,
    preguntas: P,
    copia: 'En el test de errores ortográficos comunes me ha salido:'
  });
})();

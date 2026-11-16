/* Test de nivel de vocabulario de inglés: 30 preguntas de opción múltiple por franjas de dificultad. Se corrige al responder y el resultado estima un nivel (una franja
   se da por superada con un 60 % de aciertos, siguiendo el orden). Preguntas y explicaciones propias; nada se envía ni se guarda. */
(function () {
  'use strict';
  var NIVELES = ["A1", "A2", "B1", "B2", "C1"];
  var RESULTADOS = [
    ["Por debajo de A1", "Todavía estás empezando con el inglés y eso está bien. Las palabras más frecuentes (casa, comida, familia, trabajo) son el mejor primer paso."],
    ["Nivel A1 (principiante)", "Entiendes palabras muy básicas. Con vocabulario cotidiano y frases cortas avanzarás deprisa."],
    ["Nivel A2 (elemental)", "Te manejas con vocabulario de situaciones diarias. El siguiente paso es ampliar verbos y adjetivos de uso frecuente."],
    ["Nivel B1 (intermedio)", "Tienes un vocabulario suficiente para desenvolverte en la mayoría de situaciones cotidianas y de viajes."],
    ["Nivel B2 (intermedio alto)", "Tu vocabulario te permite entender textos complejos y expresarte con bastante precisión."],
    ["Nivel C1 o superior (avanzado)", "Dominas vocabulario poco frecuente y matices. Estás en el nivel de quien trabaja o estudia con soltura en inglés."]].map(function (x) { return { n: x[0], d: x[1] }; });
  // [franja, pregunta, [correcta, error, error, error], explicación]: la correcta va primera y el motor mezcla las respuestas
  var P = [
    [0, "¿Qué significa «cheap» en inglés?", ["barato", "caro", "limpio", "rápido"], "«Cheap» es barato: «a cheap ticket»."],
    [0, "¿Qué significa «empty»?", ["vacío", "lleno", "perdido", "temprano"], "«Empty» es vacío: «an empty glass»."],
    [0, "¿Qué significa «neighbour» (o «neighbor»)?", ["vecino", "amigo", "pariente", "invitado"], "El vecino de al lado es «the next-door neighbour»."],
    [0, "¿Qué significa «borrow»?", ["pedir prestado", "prestar", "regalar", "comprar"], "«Borrow» es tomar algo prestado; «lend» es prestar."],
    [0, "¿Qué significa «tired»?", ["cansado", "aburrido", "enfadado", "sediento"], "«I’m tired» significa «estoy cansado»."],
    [0, "¿Qué significa «lazy»?", ["perezoso", "cuidadoso", "tímido", "educado"], "«Lazy» es perezoso o vago."],
    [1, "¿Qué significa «ankle»?", ["tobillo", "rodilla", "muñeca", "codo"], "«Ankle» es el tobillo; «wrist» es la muñeca."],
    [1, "En un restaurante, ¿qué significa «the bill»?", ["la cuenta", "el menú", "la mesa", "la propina"], "«The bill» es la cuenta (en Estados Unidos, también «the check»)."],
    [1, "¿Qué significa «deaf»?", ["sordo", "ciego", "mudo", "cojo"], "«Deaf» es sordo."],
    [1, "¿Qué significa «rude»?", ["grosero", "rudo", "tímido", "rubio"], "«Rude» es maleducado o grosero; no significa «rudo»."],
    [1, "¿Qué significa «tool»?", ["herramienta", "tonto", "toalla", "techo"], "«Tool» es herramienta: «a useful tool»."],
    [1, "¿Qué significa «journey»?", ["viaje", "diario", "trabajo", "jornada"], "«Journey» es un viaje, sobre todo largo; «diary» es diario."],
    [2, "¿Qué significa «advice»?", ["consejo", "anuncio", "aviso de peligro", "ventaja"], "«Advice» es consejo; no confundir con «advertisement» (anuncio)."],
    [2, "¿Qué significa «disappointed»?", ["decepcionado", "desaparecido", "desordenado", "desesperado"], "«Disappointed» es decepcionado."],
    [2, "¿Qué significa «reach» en «reach the top»?", ["llegar a, alcanzar", "recordar", "rechazar", "ofrecer"], "«Reach» es alcanzar o llegar a un sitio."],
    [2, "En «It is not fair», ¿qué significa «fair»?", ["justo", "feria", "claro", "bonito"], "«Fair» como adjetivo es justo; también puede ser «feria» como nombre."],
    [2, "¿Qué significa «though» en «It was hard, though»?", ["sin embargo, aunque", "a través de", "pensamiento", "durante"], "«Though» es aunque o, al final de frase, «sin embargo»."],
    [2, "En «raise your hand», ¿qué significa «raise»?", ["levantar", "romper", "bajar", "mirar"], "«Raise» es levantar o subir; «rise» es subir por sí mismo."],
    [3, "¿Qué significa «reliable»?", ["fiable, de confianza", "reacio", "relajado", "religioso"], "«Reliable» es fiable: «a reliable friend»."],
    [3, "¿Qué significa «reluctant»?", ["reacio, poco dispuesto", "confiable", "avergonzado", "agradecido"], "«Reluctant» es reacio: «he was reluctant to help»."],
    [3, "¿Qué significa «overcome»?", ["superar", "cubrir", "llegar tarde", "abrumar sin motivo"], "«Overcome» es superar: «overcome a difficulty»."],
    [3, "¿Qué significa «shortage»?", ["escasez", "ventaja", "pantalones cortos", "atajo"], "«Shortage» es escasez: «a shortage of water»."],
    [3, "¿Qué significa «tackle» en «tackle a problem»?", ["abordar", "ignorar", "agrandar", "esconder"], "«Tackle» es afrontar o abordar un problema."],
    [3, "¿Qué significa «gather»?", ["reunir, recoger", "regalar", "vomitar", "cancelar"], "«Gather» es reunir o juntar: «gather information»."],
    [4, "¿Qué significa «scrutiny»?", ["examen minucioso", "secreto", "silencio", "ahorro"], "«Scrutiny» es una inspección muy detallada: «under public scrutiny»."],
    [4, "¿Qué significa «stringent»?", ["estricto, riguroso", "flexible", "pegajoso", "muy largo"], "«Stringent» se dice de reglas o controles muy estrictos."],
    [4, "¿Qué significa «feasible»?", ["viable", "feliz", "festivo", "tardío"], "«Feasible» es factible o viable: «a feasible plan»."],
    [4, "¿Qué significa «overwhelming»?", ["abrumador", "sin precedentes", "ligero", "ambiguo"], "«Overwhelming» es abrumador, que supera la capacidad de aguantarlo."],
    [4, "¿Qué significa «hinder»?", ["obstaculizar", "ayudar", "escuchar", "esconder"], "«Hinder» es impedir o dificultar: «the rain hindered the work»."],
    [4, "¿Qué significa «thrive»?", ["prosperar", "sobrevivir a duras penas", "temblar", "tirar"], "«Thrive» es crecer con fuerza o prosperar."]].map(function (x) { return { n: x[0], t: x[1], o: x[2], c: 0, e: x[3] }; });
  TT.quiz({
    intro: 'Treinta palabras en inglés, de las más básicas a las más avanzadas, ordenadas aproximadamente por niveles del Marco Común Europeo. Elige su significado en español; se corrige al momento.',
    titulo: 'Tu nivel de vocabulario de inglés',
    niveles: NIVELES,
    resultados: RESULTADOS,
    preguntas: P,
    copia: 'En el test de vocabulario de inglés me ha salido:'
  });
})();

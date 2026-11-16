/* Test de jerga española: 24 preguntas de opción múltiple por franjas de dificultad. Se corrige al responder y el resultado estima un nivel (una franja
   se da por superada con un 60 % de aciertos, siguiendo el orden). Preguntas y explicaciones propias; nada se envía ni se guarda. */
(function () {
  'use strict';
  var NIVELES = ["Básica", "Habitual", "Avanzada", "Nativa"];
  var RESULTADOS = [
    ["Turista de la jerga", "Todavía te suenan raras muchas expresiones. Con unas semanas de series y charlas con gente de España te pondrás al día enseguida."],
    ["Jerga básica", "Pillas lo esencial: sabes lo que significan las expresiones más repetidas. Te faltan los giros menos obvios."],
    ["Jerga habitual", "Entiendes lo que se dice en cualquier conversación informal y sabes usar las expresiones más frecuentes."],
    ["Jerga avanzada", "Dominas el coloquial: reconoces expresiones que no se aprenden en los libros y entiendes los dobles sentidos."],
    ["Casi nativo o nativa", "Dominas hasta las expresiones más castizas. Se nota que has vivido en España o que eres de allí."]].map(function (x) { return { n: x[0], d: x[1] }; });
  // [franja, pregunta, [correcta, error, error, error], explicación]: la correcta va primera y el motor mezcla las respuestas
  var P = [
    [0, "En España, si algo «mola», ¿qué quiere decir?", ["Que gusta mucho", "Que está roto", "Que cuesta caro", "Que es muy lento"], "Molar es gustar o parecer genial: «esta canción mola»."],
    [0, "¿Qué significa «guay» cuando alguien dice «¡qué guay!»?", ["Genial, estupendo", "Qué lástima", "Qué ruido", "Qué raro"], "Guay es una forma muy extendida de decir que algo está muy bien."],
    [0, "En una conversación entre amigos, ¿qué es un «tío» o una «tía»?", ["Una persona cualquiera, un tipo", "Solo el hermano de un padre", "Un animal de granja", "Un jefe"], "Además de parentesco, «tío» y «tía» se usan coloquialmente para referirse a una persona: «ese tío es muy majo»."],
    [0, "¿Qué es un «chaval»?", ["Un chico joven", "Un coche pequeño", "Un tipo de pan", "Un abrigo"], "Chaval es un muchacho o joven; el femenino es «chavala»."],
    [0, "Si alguien dice «voy a currar», ¿qué va a hacer?", ["Trabajar", "Cocinar", "Dormir", "Pasear"], "Currar es trabajar en lenguaje coloquial; el trabajo es «el curro»."],
    [0, "Si respondes «vale», ¿qué estás diciendo?", ["De acuerdo", "No me importa nada", "Es muy caro", "No lo sé"], "Vale es la forma más habitual de decir que sí o de mostrar acuerdo."],
    [1, "Si algo te «flipa», ¿qué sientes?", ["Te gusta muchísimo o te sorprende", "Te da miedo", "Te aburre", "Te da sueño"], "Flipar es sorprenderse mucho o gustar muchísimo: «me flipa esa serie»."],
    [1, "En España, ¿qué es la «pasta»?", ["El dinero", "Un tipo de zapato", "El pelo", "Un mueble"], "Además de la comida, «pasta» es una forma coloquial de decir dinero: «no tengo pasta»."],
    [1, "Un sitio «cutre» es…", ["Poco cuidado, de mala calidad", "Muy elegante", "Muy luminoso", "Siempre vacío"], "Cutre se dice de lo mísero, descuidado o de poca calidad."],
    [1, "¿Qué es un «colega»?", ["Un amigo o compañero", "Un enemigo", "Un profesor", "Un vecino que no saluda"], "Colega se usa coloquialmente para referirse a un amigo cercano."],
    [1, "Si estás «hecho polvo», ¿cómo estás?", ["Muy cansado o abatido", "Muy contento", "Muy sucio", "Muy rápido"], "Estar hecho polvo es estar agotado o muy bajo de ánimo."],
    [1, "Si dices «he quedado con Ana», ¿qué quieres decir?", ["Que tienes una cita con ella para veros", "Que te has quedado sin ella", "Que has discutido con ella", "Que le has dejado un recado"], "«Quedar» es acordar un encuentro: «hemos quedado a las ocho»."],
    [2, "Si alguien te «da la brasa», ¿qué hace?", ["Te molesta insistiendo", "Te cocina algo", "Te da calor", "Te cuenta un secreto"], "Dar la brasa es fastidiar con insistencia, pesadez o charla interminable."],
    [2, "Si dices «me piro», ¿qué haces?", ["Irte, marcharte", "Enfadarte", "Cantar", "Comer"], "Pirarse es irse, a menudo con prisa: «me piro, que llego tarde»."],
    [2, "«Pasárselo pipa» es…", ["Divertirse muchísimo", "Fumar mucho", "Gastar mucho dinero", "Pasar frío"], "Pasárselo pipa es disfrutar a lo grande: «nos lo pasamos pipa en la fiesta»."],
    [2, "Si te «echan un cable», ¿qué hacen?", ["Te ayudan", "Te dan una descarga", "Te llaman por teléfono", "Te castigan"], "Echar un cable es ayudar a alguien en un apuro."],
    [2, "Estar «sin blanca» es estar…", ["Sin dinero", "Sin ropa", "Sin amigos", "Sin sueño"], "«Sin blanca» alude a la antigua moneda: estar sin un céntimo."],
    [2, "Si te dicen que tienes que «ponerte las pilas», ¿qué te piden?", ["Que te esfuerces y te espabiles", "Que cambies de móvil", "Que dejes de trabajar", "Que te vayas"], "Ponerse las pilas es espabilarse y trabajar con más energía."],
    [3, "Si alguien te «da sopas con honda», ¿qué ha pasado?", ["Te ha superado con mucha ventaja", "Te ha invitado a comer", "Te ha ayudado", "Te ha enfadado"], "Dar sopas con honda es superar a alguien ampliamente en algo."],
    [3, "Si alguien «se va por los cerros de Úbeda», ¿qué hace?", ["Divaga y se desvía del tema", "Se esconde en el campo", "Viaja a Andalucía", "Corre una maratón"], "Irse por los cerros de Úbeda es hablar de cosas ajenas al asunto principal."],
    [3, "Si alguien «está en Babia», ¿cómo está?", ["Distraído, despistado", "De viaje", "Muy tranquilo", "Muy enfadado"], "Estar en Babia es estar distraído y ajeno a lo que ocurre alrededor."],
    [3, "Si te «quedas a dos velas», ¿qué te ocurre?", ["Te quedas sin nada, sin dinero o sin entender", "Te quedas a oscuras", "Te quedas dormido", "Te quedas esperando a alguien"], "Quedarse a dos velas es quedarse sin dinero, sin recursos o sin comprender algo."],
    [3, "Si alguien tiene «mala uva», ¿cómo es?", ["De mala intención o mal carácter", "Muy aficionado al vino", "Muy generoso", "Poco hablador"], "Tener mala uva es tener mala idea, mal genio o malas intenciones."],
    [3, "Si alguien va «de punta en blanco», ¿cómo va?", ["Muy elegante y arreglado", "Con prisa", "De uniforme", "Muy despeinado"], "Ir de punta en blanco es ir muy arreglado, con la mejor ropa."]].map(function (x) { return { n: x[0], t: x[1], o: x[2], c: 0, e: x[3] }; });
  TT.quiz({
    intro: 'Veinticuatro expresiones coloquiales de España, de las que oyes cada día a las que solo usa quien las ha mamado. Se corrige al momento y no hay trampas: todas son de uso real.',
    titulo: 'Tu nivel de jerga española',
    niveles: NIVELES,
    resultados: RESULTADOS,
    preguntas: P,
    copia: 'En el test de jerga española me ha salido:'
  });
})();

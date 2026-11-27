(function(){
'use strict';
var RASGOS =["Liderazgo","Estrategia","Creatividad","Cuidado","Valentía","Ingenio y encanto"];
var PJ =[
["Zeus",[100,35,10,10,65,10],"Autoridad y cielo","Naces para liderar. Tienes presencia, sentido de la responsabilidad y la valentía de dar el primer paso cuando nadie se decide."],
["Hera",[100,35,10,65,10,10],"Compromiso y familia","Pones a tu gente por delante. Lideras con constancia, cuidas los vínculos y no sueltas a quien se ha ganado tu confianza."],
["Poseidón",[10,10,10,65,100,35],"Mar y bravura","Tienes un carácter fuerte como las olas: valiente, leal y con un punto imprevisible que contagia energía a todo el grupo."],
["Deméter",[10,65,35,100,10,10],"Paciencia y naturaleza","Eres cuidadoso o cuidadosa, paciente y con un gran ojo para ver crecer las cosas. Tu fuerza está en la constancia y en nutrir a los demás."],
["Ares",[65,35,10,10,100,10],"Lucha y carácter","Te encanta el reto y no te echas atrás. Eres directo, competitivo y capaz de arrastrar al equipo cuando hay que dar la cara."],
["Atenea",[65,100,35,10,10,10],"Sabiduría y estrategia","Piensas dos pasos por delante. Eres analítico, organizado y creativo a la hora de resolver problemas, y sabes dirigir con calma."],
["Apolo",[10,10,100,65,10,35],"Arte y luz","Creativo, cercano y con un talento para animar a los demás. La música, la palabra y el cuidado son tus mejores herramientas."],
["Afrodita",[10,10,35,65,10,100],"Encanto y sensibilidad","Tienes un don para conectar: encanto, empatía y una creatividad que hace que la gente se sienta bien a tu lado."],
["Hefesto",[10,65,100,10,35,10],"Ingenio y forja","Eres un constructor nato: te gusta inventar, arreglar y planificar, y eres más valiente de lo que parece cuando hay que defender tu trabajo."],
["Hermes",[10,35,10,10,65,100],"Rapidez y labia","Ingenioso, rápido y con una chispa que saca al grupo de los apuros. Te mueves con soltura y siempre tienes una idea bajo la manga."],
["Dioniso",[10,10,65,10,35,100],"Alegría y caos","Divertido, imprevisible y creativo. Convierte cualquier reunión en una fiesta y no te asustan los planes poco convencionales."],
["Hades",[10,100,10,10,65,35],"Lealtad en la sombra","Reservado, estratégico y con un humor muy seco. Prefieres actuar sin focos y no dudas en plantar cara cuando algo importa."]];
var P =[
["Llegas a un campamento nuevo donde nadie te conoce. ¿Qué haces el primer día?","Me presento al grupo y propongo organizar algo","Observo cómo funciona todo antes de moverme","Busco un rincón donde pueda crear algo","Me acerco a quien parece más perdido para ayudarle","Me apunto a la primera prueba que encuentro","Suelto un par de bromas hasta que alguien se ríe"],
["Hay una competición de captura de la bandera. Tu papel ideal es…","Capitán o capitana del equipo","Quien diseña el plan","Quien inventa trampas y atajos nuevos","Quien protege a los más débiles del equipo","Quien carga en primera línea","Quien despista al rival con engaños"],
["Un compañero está desanimado tras perder.","Le hablo de volver más fuertes y lo organizo todo","Analizo qué falló y le explico cómo corregirlo","Le propongo hacer algo distinto para despejarnos","Me quedo con él hasta que se sienta mejor","Le reto a una revancha ahora mismo","Le cuento una historia absurda hasta que sonría"],
["Te encuentras un objeto misterioso.","Se lo llevo a quien deba decidir qué hacer","Lo estudio y busco pistas","Lo desmonto para ver cómo está hecho","Pienso a quién podría hacerle falta","Lo pruebo sin darle muchas vueltas","Me lo quedo: ya veré para qué sirve"],
["Tu herramienta favorita sería…","Un símbolo de mando que todos reconozcan","Un mapa y una brújula","Una caja de herramientas o un instrumento","Un botiquín y una manta","Una buena espada","Una capa que me haga pasar desapercibido"],
["Una criatura gigante bloquea el camino.","Organizo al grupo para atacarla desde varios lados","Busco su punto débil","Improviso un aparato con lo que llevamos","Intento que nadie salga herido","Me enfrento a ella","La distraigo mientras los demás pasan"],
["En tu tiempo libre en el campamento…","Organizo juegos y actividades","Leo, dibujo mapas o planeo","Pinto, toco música o construyo","Cuido el huerto o los animales","Entreno con la espada","Gasto bromas y charlo con todo el mundo"],
["Lo que más te molesta es…","Que nadie tome decisiones","Que alguien actúe sin pensar","Que me digan que haga las cosas «como siempre»","Que alguien salga herido por mi culpa","Quedarme mirando mientras otros arriesgan","Que todo se tome demasiado en serio"],
["Tienes que convencer a alguien para que te ayude.","Le hago ver que es lo mejor para todos","Le presento los argumentos uno a uno","Le enseño algo que he hecho para impresionarle","Le pido ayuda con honestidad","Le demuestro con hechos que voy en serio","Le sonrío y le doy conversación hasta que acepta"],
["Tu mayor virtud sería…","Mi autoridad natural","Mi cabeza fría","Mi imaginación","Mi lealtad","Mi coraje","Mi labia"],
["Te ofrecen un don especial. ¿Cuál eliges?","Una voz que todos escuchen","Ver siempre la mejor jugada","Hacer realidad lo que imagino","Curar a quien yo quiera","Fuerza invencible en combate","Moverme sin que nadie me vea"],
["Al terminar una misión, lo que más disfrutas es…","Ver al equipo celebrar unido","Comprobar que el plan salió como pensé","Contar la aventura en un dibujo o una canción","Saber que todos están sanos y salvos","La emoción de haber salido de un buen lío","Las anécdotas graciosas de la vuelta"]].map(function(x){return{t: x[0],o: x.slice(1).map(function(txt,i){var d ={};d['r' + i]= 1;return[txt,d];})};});
var norma = function(v){return Math.sqrt(v.reduce(function(a,b){return a + b * b;},0))|| 1;};
TT.cuestionario({
intro: 'Doce situaciones con seis respuestas. Elige lo que harías tú. Es un test de fans, sin imágenes y sin relación con los libros ni con sus autores.',
preguntas: P,
resultado: function(c){
var cuenta = RASGOS.map(function(r,i){return c.tot['r' + i];}),suma = cuenta.reduce(function(a,b){return a + b;},0)|| 1,mayor = Math.max.apply(null,cuenta)|| 1;
var puntos = PJ.map(function(p,k){var v = 0;cuenta.forEach(function(n,i){v += n * p[1][i];});return{k: k,nombre: p[0],valor: 100 * v /(norma(cuenta)* norma(p[1]))};})
.sort(function(a,b){return b.valor - a.valor || a.k - b.k;});
var empate = puntos.filter(function(x){return puntos[0].valor - x.valor < 0.01;});
if(empate.length > 1){var e = TT.elegir(empate);puntos.splice(puntos.indexOf(e),1);puntos.unshift(e);}
var top = puntos[0],p = PJ[top.k],segundo = puntos[1];
return{
titulo: 'Tu cabaña del Campamento Mestizo',titular: 'Cabaña de ' + p[0],rango:{nombre: p[2],texto: p[3]+(empate.length > 1 ? ' Varios resultados encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '')},
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Tus rasgos'}),TT.graf.radar(RASGOS.map(function(r,i){return{nombre: r,valor: cuenta[i]/ mayor * 100};}),{descripcion: 'Peso de cada rasgo en tus respuestas'})),
TT.h('div',{},TT.h('h3',{texto: 'Con qué cabañas encajas más'}),TT.graf.barras(puntos.slice(0,5).map(function(x){return{nombre: x.nombre,valor: Math.round(x.valor)};}),{max: 100,unidad: ' %',destacar: 0,descripcion: 'Afinidad con los cinco personajes más parecidos'})),
TT.h('p',{'class': 'tt-res-texto',texto: 'Tu segunda cabaña más parecida: ' + segundo.nombre + '.'}),
TT.h('p',{'class': 'tt-aviso',texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.'})),
detalles: RASGOS.map(function(r,i){return[r,cuenta[i]+ ' de ' + suma];}),
copia: 'En el test de Percy Jackson me ha tocado la cabaña de ' + p[0]+ '.'
};
}
});
})();

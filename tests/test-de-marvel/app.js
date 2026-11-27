(function(){
'use strict';
var RASGOS =["Valentía","Ingenio","Lealtad","Humor","Rebeldía"];
var PJ =[
["Iron Man",[10,100,10,65,35],"El genio con chispa","Ingenioso, rápido y con un humor que usa de escudo. Resuelves problemas con la cabeza y no soportas que te digan lo que no se puede."],
["Capitán América",[65,35,100,10,10],"El corazón del equipo","Íntegro, constante y leal hasta el final. Das la cara por tu gente y te mantienes firme aunque nadie más lo haga."],
["Thor",[100,10,35,65,10],"La fuerza con buen humor","Valiente, directo y con ganas de celebrar. Te lanzas de cabeza al problema y cuidas de quien tienes cerca."],
["Spider-Man",[10,35,65,100,10],"El vecino que ayuda","Cercano, bromista y con un gran sentido de la responsabilidad. Haces lo correcto aunque cueste y lo haces con una sonrisa."],
["Viuda Negra",[35,65,100,10,10],"La lealtad con estrategia","Reservada, lista y fiel a los suyos. Prefieres actuar en silencio y llevar el peso de lo que haga falta."],
["Doctor Strange",[35,100,10,10,65],"La mente que rompe moldes","Brillante, exigente y poco amigo de las normas. Estudias hasta el último detalle y no te asusta cambiar de enfoque."],
["Loki",[10,65,10,35,100],"El caos con ingenio","Astuto, provocador y siempre con un plan escondido. Te mueves mejor fuera de las reglas y disfrutas sorprendiendo."],
["Star-Lord",[35,10,10,100,65],"El rebelde con banda sonora","Divertido, indisciplinado y con más coraje del que aparentas. Improvisas, bromeas y acabas saliéndote con la tuya."]];
var P =[
["Una amenaza llega a tu ciudad. ¿Qué haces?","Salgo a su encuentro sin dudar","Busco su punto débil con calma","Protejo primero a los míos","Aligero el ambiente con un chiste","Actúo sin pedir permiso a nadie"],
["Tu equipo discute el plan.","Propongo ir de frente","Dibujo uno mejor en una servilleta","Recuerdo que somos un equipo","Rebajo la tensión con una broma","Hago lo que creo, con plan o sin él"],
["Te encargan una misión casi imposible.","La acepto sin pensarlo","Estudio todos los ángulos antes","Voy si mis amigos van","Pregunto si incluye cena","Cambio las condiciones por las mías"],
["Algo falla justo antes del gran momento.","Aguanto y sigo adelante","Lo arreglo con una idea rápida","Aviso al equipo para no ponerlos en riesgo","Hago un chiste y sigo","Ignoro el fallo y hago lo mío"],
["Un amigo se equivoca.","Le defiendo ante cualquiera","Le explico dónde estuvo el fallo","Me quedo a su lado","Le recuerdo que hasta los mejores tropiezan","Le digo que las reglas están para romperlas"],
["Tienes un día libre.","Entreno o me enfrento a un reto","Construyo o investigo algo nuevo","Lo paso con mi gente","Maratón de series y pizza","Hago lo que me da la gana"],
["Te piden dirigir un ataque arriesgado.","Voy yo el primero","Diseño una estrategia limpia","Solo si mi equipo lo ve claro","Digo que me pongo nervioso, por si acaso","Cambio el plan por el mío"],
["Una persona inocente está en peligro.","Me lanzo a rescatarla","Calculo la ruta más segura","No me separo de ella ni un segundo","La tranquilizo con una broma","Salto las normas para llegar antes"],
["¿Qué te gustaría tener?","Una fuerza sin límites","Un taller y una mente brillante","Un hogar y un equipo a prueba de todo","Un buen público para mis chistes","Libertad total"],
["¿Cómo sería el final de tu historia?","Heroico","Con un invento que cambia el mundo","Rodeado de los míos","Con una última broma","A mi manera, sin dar explicaciones"]].map(function(x){return{t: x[0],o: x.slice(1).map(function(txt,i){var d ={};d['r' + i]= 1;return[txt,d];})};});
var norma = function(v){return Math.sqrt(v.reduce(function(a,b){return a + b * b;},0))|| 1;};
TT.cuestionario({
intro: "Diez situaciones con cinco respuestas. Elige lo que harías tú. Es un test de fans de Marvel, sin imágenes y sin relación con los autores ni con los estudios.",
preguntas: P,
resultado: function(c){
var cuenta = RASGOS.map(function(r,i){return c.tot['r' + i];}),suma = cuenta.reduce(function(a,b){return a + b;},0)|| 1,mayor = Math.max.apply(null,cuenta)|| 1;
var puntos = PJ.map(function(p,k){var v = 0;cuenta.forEach(function(n,i){v += n * p[1][i];});return{k: k,nombre: p[0],valor: 100 * v /(norma(cuenta)* norma(p[1]))};})
.sort(function(a,b){return b.valor - a.valor || a.k - b.k;});
var empate = puntos.filter(function(x){return puntos[0].valor - x.valor < 0.01;});
if(empate.length > 1){var e = TT.elegir(empate);puntos.splice(puntos.indexOf(e),1);puntos.unshift(e);}
var top = puntos[0],p = PJ[top.k],segundo = puntos[1];
return{
titulo: "Tu personaje de Marvel",titular: '' + p[0],rango:{nombre: p[2],texto: p[3]+(empate.length > 1 ? ' Varios resultados encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '')},
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Tus rasgos'}),TT.graf.radar(RASGOS.map(function(r,i){return{nombre: r,valor: cuenta[i]/ mayor * 100};}),{descripcion: 'Peso de cada rasgo en tus respuestas'})),
TT.h('div',{},TT.h('h3',{texto: 'Con quién encajas más'}),TT.graf.barras(puntos.slice(0,5).map(function(x){return{nombre: x.nombre,valor: Math.round(x.valor)};}),{max: 100,unidad: ' %',destacar: 0,descripcion: 'Afinidad con los cinco personajes más parecidos'})),
TT.h('p',{'class': 'tt-res-texto',texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.'}),
TT.h('p',{'class': 'tt-aviso',texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.'})),
detalles: RASGOS.map(function(r,i){return[r,cuenta[i]+ ' de ' + suma];}),
copia: "En el test de Marvel me ha salido: " + p[0]+ '.'
};
}
});
})();

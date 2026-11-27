(function(){
'use strict';
var RASGOS =["Ingenio","Humor","Bondad","Rebeldía","Ambición"];
var PJ =[
["Homer Simpson",[10,100,65,35,10],"El buenazo despistado","Divertido, cariñoso y con una capacidad enorme para meterte en líos. Tu buen corazón siempre te saca de ellos."],
["Marge Simpson",[65,35,100,10,10],"La paciencia que sostiene","Amable, paciente y con más carácter del que aparentas. Mantienes unido a tu entorno y no dejas que se hunda."],
["Bart Simpson",[35,65,10,100,10],"El travieso con gracia","Rebelde, rápido y con una gracia natural. Disfrutas cuestionando todo y eres un gran estratega de travesuras."],
["Lisa Simpson",[100,10,65,10,35],"La mente con principios","Brillante, sensible y con grandes ideales. Te importa hacer lo correcto, aunque nadie lo agradezca."],
["Sr. Burns",[65,10,10,35,100],"La ambición sin freno","Calculador, anticuado y obsesionado con el poder. Persigues lo que quieres sin mirar quién queda atrás."],
["Ned Flanders",[10,65,100,10,35],"La amabilidad a prueba de todo","Bondadoso, optimista y siempre dispuesto a ayudar. Tomas las cosas con humor y una paciencia casi sin límites."],
["Krusty el Payaso",[10,100,10,35,65],"El showman con fama","Cómico, ambicioso y con un lado más oscuro del que enseñas. Vives para el espectáculo y para el éxito."],
["Moe Szyslak",[10,65,10,100,35],"El cínico con alma","Sarcástico, desconfiado y con un humor ácido. Detrás de la coraza hay alguien que sufre por sentirse solo."]];
var P =[
["Un lunes cualquiera en Springfield. ¿Cómo empiezas?","Con una idea nueva en la cabeza","Con ganas de pasarlo bien","Cuidando de quien tengo cerca","Saltándome alguna norma","Pensando cómo ganar más"],
["Tienes un problema en casa.","Lo analizo con calma","Lo arreglo con una broma","Escucho a todos hasta que se calme","Hago lo que me parezca, sin avisar","Lo uso para sacar provecho"],
["Te toca elegir plan para el fin de semana.","Una visita al museo o a la biblioteca","Un programa de risas","Una comida con la familia","Una excursión sin plan","Un evento donde destacar"],
["En el colegio hay una injusticia.","Escribo un informe","La convierto en una parodia","Ayudo a quien la sufre","Me niego a obedecer","Aprovecho para escalar posiciones"],
["Te regalan algo que no te gusta.","Lo analizo y busco un uso","Me lo tomo a broma","Lo agradezco igualmente","Se lo cambio a alguien sin avisar","Lo revendo con beneficio"],
["¿Cómo te llevas con las reglas?","Las entiendo antes de cumplirlas","Las cumplo a medias, riéndome","Las cumplo por los demás","Las pongo a prueba","Las uso a mi favor"],
["Alguien se burla de ti.","Respondo con una frase aguda","Me río con ellos","Les perdono","Les devuelvo la broma pesada","Me guardo el nombre para el futuro"],
["¿Qué te hace sentir bien?","Aprender algo nuevo","Hacer reír","Ayudar","Salirme con la mía","Ganar"],
["En una cena familiar, ¿qué papel haces?","El que explica cómo funcionan las cosas","El que cuenta chistes","El que cuida de todos","El que lleva la contraria","El que quiere ser el centro"],
["¿Cuál sería tu lema?","Pensar antes de actuar","Reír es lo primero","Ser buena persona","Que no me digan qué hacer","Quien no arriesga no gana"]].map(function(x){return{t: x[0],o: x.slice(1).map(function(txt,i){var d ={};d['r' + i]= 1;return[txt,d];})};});
var norma = function(v){return Math.sqrt(v.reduce(function(a,b){return a + b * b;},0))|| 1;};
TT.cuestionario({
intro: "Diez situaciones con cinco respuestas. Elige lo que harías tú. Es un test de fans de Los Simpson, sin imágenes y sin relación con los autores ni con los estudios.",
preguntas: P,
resultado: function(c){
var cuenta = RASGOS.map(function(r,i){return c.tot['r' + i];}),suma = cuenta.reduce(function(a,b){return a + b;},0)|| 1,mayor = Math.max.apply(null,cuenta)|| 1;
var puntos = PJ.map(function(p,k){var v = 0;cuenta.forEach(function(n,i){v += n * p[1][i];});return{k: k,nombre: p[0],valor: 100 * v /(norma(cuenta)* norma(p[1]))};})
.sort(function(a,b){return b.valor - a.valor || a.k - b.k;});
var empate = puntos.filter(function(x){return puntos[0].valor - x.valor < 0.01;});
if(empate.length > 1){var e = TT.elegir(empate);puntos.splice(puntos.indexOf(e),1);puntos.unshift(e);}
var top = puntos[0],p = PJ[top.k],segundo = puntos[1];
return{
titulo: "Tu personaje de Los Simpson",titular: '' + p[0],rango:{nombre: p[2],texto: p[3]+(empate.length > 1 ? ' Varios resultados encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '')},
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Tus rasgos'}),TT.graf.radar(RASGOS.map(function(r,i){return{nombre: r,valor: cuenta[i]/ mayor * 100};}),{descripcion: 'Peso de cada rasgo en tus respuestas'})),
TT.h('div',{},TT.h('h3',{texto: 'Con quién encajas más'}),TT.graf.barras(puntos.slice(0,5).map(function(x){return{nombre: x.nombre,valor: Math.round(x.valor)};}),{max: 100,unidad: ' %',destacar: 0,descripcion: 'Afinidad con los cinco personajes más parecidos'})),
TT.h('p',{'class': 'tt-res-texto',texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.'}),
TT.h('p',{'class': 'tt-aviso',texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.'})),
detalles: RASGOS.map(function(r,i){return[r,cuenta[i]+ ' de ' + suma];}),
copia: "En el test de Los Simpson me ha salido: " + p[0]+ '.'
};
}
});
})();

(function(){
'use strict';
var RASGOS =["Valentía","Astucia","Compasión","Rebeldía","Ambición"];
var PJ =[
["Luke Skywalker",[100,10,65,35,10],"La esperanza que no se rinde","Valiente, compasivo y con fe en que la gente puede cambiar. Te cuesta rendirte, incluso cuando todo parece perdido."],
["Leia Organa",[65,35,10,100,10],"La líder que no espera","Decidida, valiente y con una lengua afilada. Plantas cara al poder y organizas a los demás sin perder la calma."],
["Han Solo",[35,100,10,65,10],"El pícaro con suerte","Astuto, escéptico y con un buen fondo escondido. Vives de improvisar y acabas ayudando, aunque digas que no."],
["Yoda",[35,65,100,10,10],"La calma que enseña","Paciente, sabio y compasivo. Ves más allá de lo evidente y prefieres enseñar a pelear."],
["Obi-Wan Kenobi",[65,35,100,10,10],"El mentor con paciencia","Sereno, leal a su palabra y muy compasivo. Cargas con la responsabilidad en silencio y mantienes la cabeza fría."],
["Darth Vader",[65,10,10,35,100],"La ambición que lo devora","Poderoso, disciplinado y con una ambición enorme. Tu intensidad te lleva lejos, pero te cuesta soltar lo que te hiere."],
["Emperador Palpatine",[10,65,10,35,100],"El plan a largo plazo","Calculador, paciente y ávido de poder. Mueves las piezas en la sombra y prefieres que otros hagan el trabajo visible."],
["Ahsoka Tano",[100,10,35,65,10],"La independencia con corazón","Valiente, independiente y compasiva. Sigues tu propio camino, pero siempre defiendes a quien lo necesita."]];
var P =[
["Una nave desconocida se acerca a la tuya. ¿Qué haces?","Me preparo para lo que venga","Analizo qué quiere y busco una salida","Intento comunicarme antes de disparar","Hago lo contrario de lo esperado","Pienso cómo sacarle partido"],
["Tu grupo debe elegir un camino.","Voy yo delante","Elijo el más listo, no el más corto","Elijo el que proteja a todos","Elijo el que nadie espera","Elijo el que nos dé más poder"],
["Te piden obedecer una orden injusta.","La desafío con valentía","La esquivo con una treta","Busco la manera de que nadie salga herido","La rompo sin dudar","La obedezco si me conviene"],
["Un aliado te traiciona.","Le planto cara","Estudio por qué lo ha hecho","Intento entenderlo y perdonarlo","Me voy y sigo mi camino","Me aseguro de que no vuelva a pasar"],
["¿Qué tipo de arma prefieres?","La que use sin miedo en la primera línea","La que sorprenda al rival","Ninguna, si puedo evitarlo","La que yo mismo me monte","La más imponente"],
["Descubres un secreto sobre tu pasado.","Lo afronto de cara","Reúno pruebas antes de creerlo","Lo comparto con quien confío","Decido yo qué hacer con él","Lo uso para ir más lejos"],
["Te toca entrenar a alguien joven.","Le enseño a no tener miedo","Le enseño a pensar","Le enseño a ser paciente y amable","Le enseño a cuestionarlo todo","Le enseño a no conformarse"],
["En un planeta desconocido, ¿qué te interesa?","Un reto que me ponga a prueba","Un mercado donde moverme bien","La gente que vive allí","Un rincón fuera de las reglas","Un lugar desde donde mandar"],
["¿Qué lado de la Fuerza te atrae más?","El que usa el coraje","El que usa la cabeza","El que cuida","El que no obedece a nadie","El que da más poder"],
["¿Cómo quieres ser recordado?","Por mi valentía","Por mi astucia","Por mi compasión","Por haber roto las reglas","Por lo lejos que llegué"]].map(function(x){return{t: x[0],o: x.slice(1).map(function(txt,i){var d ={};d['r' + i]= 1;return[txt,d];})};});
var norma = function(v){return Math.sqrt(v.reduce(function(a,b){return a + b * b;},0))|| 1;};
TT.cuestionario({
intro: "Diez situaciones con cinco respuestas. Elige lo que harías tú. Es un test de fans de Star Wars, sin imágenes y sin relación con los autores ni con los estudios.",
preguntas: P,
resultado: function(c){
var cuenta = RASGOS.map(function(r,i){return c.tot['r' + i];}),suma = cuenta.reduce(function(a,b){return a + b;},0)|| 1,mayor = Math.max.apply(null,cuenta)|| 1;
var puntos = PJ.map(function(p,k){var v = 0;cuenta.forEach(function(n,i){v += n * p[1][i];});return{k: k,nombre: p[0],valor: 100 * v /(norma(cuenta)* norma(p[1]))};})
.sort(function(a,b){return b.valor - a.valor || a.k - b.k;});
var empate = puntos.filter(function(x){return puntos[0].valor - x.valor < 0.01;});
if(empate.length > 1){var e = TT.elegir(empate);puntos.splice(puntos.indexOf(e),1);puntos.unshift(e);}
var top = puntos[0],p = PJ[top.k],segundo = puntos[1];
return{
titulo: "Tu personaje de Star Wars",titular: '' + p[0],rango:{nombre: p[2],texto: p[3]+(empate.length > 1 ? ' Varios resultados encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '')},
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Tus rasgos'}),TT.graf.radar(RASGOS.map(function(r,i){return{nombre: r,valor: cuenta[i]/ mayor * 100};}),{descripcion: 'Peso de cada rasgo en tus respuestas'})),
TT.h('div',{},TT.h('h3',{texto: 'Con quién encajas más'}),TT.graf.barras(puntos.slice(0,5).map(function(x){return{nombre: x.nombre,valor: Math.round(x.valor)};}),{max: 100,unidad: ' %',destacar: 0,descripcion: 'Afinidad con los cinco personajes más parecidos'})),
TT.h('p',{'class': 'tt-res-texto',texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.'}),
TT.h('p',{'class': 'tt-aviso',texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.'})),
detalles: RASGOS.map(function(r,i){return[r,cuenta[i]+ ' de ' + suma];}),
copia: "En el test de Star Wars me ha salido: " + p[0]+ '.'
};
}
});
})();

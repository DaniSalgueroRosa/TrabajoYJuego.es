(function(){
'use strict';
var RASGOS =["Valor","Ingenio","Lealtad","Ambición","Curiosidad"];
var PJ =[
["Harry Potter",[100,10,65,10,35],"El valor que no pide permiso","Valiente y leal, con la curiosidad justa para meterte donde no te llaman. Das la cara por quien lo necesita aunque tengas miedo."],
["Hermione Granger",[10,100,35,10,65],"La cabeza del grupo","Estudiosa, curiosa y muy fiel a tus amigos. Te gusta tenerlo todo preparado y no soportas dejar una duda sin resolver."],
["Ron Weasley",[65,35,100,10,10],"El amigo que nunca falla","Leal, simpático y más valiente de lo que crees. Estás ahí cuando hace falta, con humor y con el corazón por delante."],
["Luna Lovegood",[10,65,35,10,100],"La mirada distinta","Curiosa, original y muy tranquila. Ves lo que otros no ven y no necesitas que nadie te dé la razón."],
["Draco Malfoy",[10,65,35,100,10],"La ambición con orgullo","Ambicioso, orgulloso y con ganas de destacar. Sabes lo que quieres y te cuesta bajar la guardia con los demás."],
["Albus Dumbledore",[10,100,65,35,10],"La sabiduría con secretos","Sabio, paciente y con visión de largo plazo. Confías en la gente y calculas siempre varios pasos por delante."],
["Neville Longbottom",[65,10,100,10,35],"La lealtad que crece","Constante, humilde y con un valor que se descubre tarde. Aprendes despacio, pero cuando lo haces no hay quien te pare."],
["Sirius Black",[100,10,65,35,10],"El valor con alma libre","Impulsivo, protector y muy leal. Vives con intensidad, te cuesta obedecer y darías todo por los tuyos."]];
var P =[
["Oyes un ruido extraño en un pasillo oscuro. ¿Qué haces?","Voy a mirar sin dudarlo","Pienso qué puede ser antes de moverme","Voy con alguien para no ir solo","Me fijo en si puedo sacar partido","Me acerco por pura curiosidad"],
["Tu grupo tiene que resolver un enigma.","Me ofrezco a probar primero","Aplico lo que sé","Espero a que todos estemos de acuerdo","Quiero ser quien lo resuelva","Me pierdo en los detalles raros"],
["Un amigo está en un apuro.","Me meto en la pelea","Busco una solución más lista","Me quedo con él hasta el final","Pienso qué ganamos si le ayudo","Pregunto qué ha pasado con detalle"],
["Te suspenden un examen importante.","Pruebo otra vez sin quejarme","Estudio mejor el método","Pido ayuda a quien me quiere","Me prometo superar a todos la próxima","Investigo por qué me ha salido mal"],
["¿Qué asignatura te atrae más?","Defensa: poner a prueba mi coraje","Pociones: precisión y cabeza","La que haga con mis amigos","La que me dé más poder","La más rara y desconocida"],
["Te ofrecen un secreto muy valioso.","Lo uso para proteger a alguien","Lo analizo antes de decidir","Lo guardo para quien confía en mí","Lo uso para llegar más lejos","Lo investigo hasta el fondo"],
["En el comedor, ¿con quién te sientas?","Con quien necesite compañía","Con quien tenga conversaciones interesantes","Con mis amigos de siempre","Con quien me abra puertas","Con quien nadie suele sentarse"],
["Te dan una norma que te parece absurda.","La cumplo si es justa y la discuto si no","Busco la lógica detrás","La cumplo por mi grupo","La uso a mi favor","Pregunto el porqué hasta que cedan"],
["¿Qué mascota te acompañaría?","Una lechuza atrevida","Un gato lista y curioso","Un perro fiel","Una serpiente elegante","Algo exótico que nadie conoce"],
["¿Cómo quieres que te recuerden?","Como alguien muy valiente","Como alguien muy sabio","Como alguien en quien se podía confiar","Como alguien que llegó lejos","Como alguien que no paró de explorar"]].map(function(x){return{t: x[0],o: x.slice(1).map(function(txt,i){var d ={};d['r' + i]= 1;return[txt,d];})};});
var norma = function(v){return Math.sqrt(v.reduce(function(a,b){return a + b * b;},0))|| 1;};
TT.cuestionario({
intro: "Diez situaciones con cinco respuestas. Elige lo que harías tú. Es un test de fans de Harry Potter, sin imágenes y sin relación con los autores ni con los estudios.",
preguntas: P,
resultado: function(c){
var cuenta = RASGOS.map(function(r,i){return c.tot['r' + i];}),suma = cuenta.reduce(function(a,b){return a + b;},0)|| 1,mayor = Math.max.apply(null,cuenta)|| 1;
var puntos = PJ.map(function(p,k){var v = 0;cuenta.forEach(function(n,i){v += n * p[1][i];});return{k: k,nombre: p[0],valor: 100 * v /(norma(cuenta)* norma(p[1]))};})
.sort(function(a,b){return b.valor - a.valor || a.k - b.k;});
var empate = puntos.filter(function(x){return puntos[0].valor - x.valor < 0.01;});
if(empate.length > 1){var e = TT.elegir(empate);puntos.splice(puntos.indexOf(e),1);puntos.unshift(e);}
var top = puntos[0],p = PJ[top.k],segundo = puntos[1];
return{
titulo: "Tu personaje de Harry Potter",titular: '' + p[0],rango:{nombre: p[2],texto: p[3]+(empate.length > 1 ? ' Varios resultados encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '')},
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Tus rasgos'}),TT.graf.radar(RASGOS.map(function(r,i){return{nombre: r,valor: cuenta[i]/ mayor * 100};}),{descripcion: 'Peso de cada rasgo en tus respuestas'})),
TT.h('div',{},TT.h('h3',{texto: 'Con quién encajas más'}),TT.graf.barras(puntos.slice(0,5).map(function(x){return{nombre: x.nombre,valor: Math.round(x.valor)};}),{max: 100,unidad: ' %',destacar: 0,descripcion: 'Afinidad con los cinco personajes más parecidos'})),
TT.h('p',{'class': 'tt-res-texto',texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.'}),
TT.h('p',{'class': 'tt-aviso',texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.'})),
detalles: RASGOS.map(function(r,i){return[r,cuenta[i]+ ' de ' + suma];}),
copia: "En el test de Harry Potter me ha salido: " + p[0]+ '.'
};
}
});
})();

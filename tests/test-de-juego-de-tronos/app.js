(function(){
'use strict';
var RASGOS =["Honor","Ambición","Astucia","Pasión","Resistencia"];
var PJ =[
["Stark",[100,10,10,35,65],"Honor y aguante","Tienes palabra y la cumples, aunque salga cara. Valoras la lealtad, la sobriedad y el deber, y aguantas los inviernos con la cabeza alta."],
["Tully",[65,10,35,10,100],"La familia primero","Tu familia es tu fortaleza. Eres resistente, leal y capaz de moverte con inteligencia para proteger a los tuyos."],
["Lannister",[10,100,65,35,10],"Ambición y estrategia","Sabes lo que quieres y cómo conseguirlo. Eres ambicioso, astuto y orgulloso, y rara vez dejas una deuda sin cobrar."],
["Targaryen",[10,65,10,100,35],"Fuego y orgullo","Intenso, apasionado y con un orgullo enorme. Te mueve un destino que sientes grande y no sueles esconder lo que eres."],
["Baratheon",[10,35,10,100,65],"Fuerza y carácter","Directo y con un genio fuerte. Te manejas mejor con acciones que con rodeos y tu resistencia es legendaria."],
["Greyjoy",[10,65,10,35,100],"Valentía y orgullo","Independiente y orgulloso, resistes en las peores condiciones y no te conformas con lo que te dan: prefieres conquistarlo."],
["Martell",[35,10,100,65,10],"Astucia y pasión","Intuitivo y apasionado, tienes un sentido de la justicia propio y una mente rápida. No te dejas encasillar."],
["Tyrell",[35,65,100,10,10],"Diplomacia y ambición","Cultivas alianzas con encanto y paciencia. Eres astuto, ambicioso y sabes ganarte a la gente sin levantar la voz."]];
var P =[
["Te llega un rumor que podría hundir a un rival. ¿Qué haces?","Lo ignoro: no quiero ganar así","Lo uso para subir posiciones","Lo guardo y espero el mejor momento","Voy a pedirle explicaciones a la cara","Cuido de los míos por si hay consecuencias"],
["Se acerca un invierno muy duro.","Cumplo mi deber con los que dependen de mí","Aprovecho para ganar influencia","Preparo reservas y alianzas","Disfruto mientras pueda: la vida es corta","Me preparo para aguantar lo que venga"],
["Te ofrecen un trono con una condición dudosa.","Lo rechazo si traiciona mis principios","Lo acepto: es mi oportunidad","Negocio las condiciones","Lo acepto por orgullo y ya veremos","Lo acepto solo si protege a mi familia"],
["En un banquete…","Digo lo que pienso, con respeto","Busco sentarme junto a quien manda","Escucho más de lo que hablo","Soy el alma de la fiesta","Me quedo cerca de mi gente"],
["Tu mejor arma es…","Mi palabra","Mi ambición","Mi cabeza","Mi carácter","Mi aguante"],
["Un aliado te falla.","Le pido cuentas con honestidad","Busco un aliado mejor","Hago como que no pasa nada y preparo mi respuesta","Me enfado y se lo digo ya","Sigo adelante sin su ayuda"],
["Tu familia está en apuros.","Actúo con honor aunque cueste","Busco la forma de salir reforzado","Muevo hilos entre bastidores","Planto cara con todo","Resisto: he pasado cosas peores"],
["El mayor valor de quien gobierna es…","La justicia","La ambición","La astucia","La pasión","La paciencia"],
["Tu hogar ideal sería…","Un castillo del norte, sobrio y firme","Un palacio en la capital, rodeado de poder","Una casa con jardines y secretos","Un lugar cálido y vibrante, junto al mar","Una fortaleza hecha para aguantar"],
["Si lo perdieras todo mañana…","Mantendría mi nombre limpio","Lo reconstruiría aún más grande","Buscaría a quién le importa lo que sé","Me levantaría con más fuerza","Aguantaría hasta que cambiaran las cosas"]].map(function(x){return{t: x[0],o: x.slice(1).map(function(txt,i){var d ={};d['r' + i]= 1;return[txt,d];})};});
var norma = function(v){return Math.sqrt(v.reduce(function(a,b){return a + b * b;},0))|| 1;};
TT.cuestionario({
intro: 'Diez situaciones con cinco respuestas. Elige lo que harías tú. Es un test de fans, sin imágenes, sin spoilers y sin relación con los libros ni con la serie.',
preguntas: P,
resultado: function(c){
var cuenta = RASGOS.map(function(r,i){return c.tot['r' + i];}),suma = cuenta.reduce(function(a,b){return a + b;},0)|| 1,mayor = Math.max.apply(null,cuenta)|| 1;
var puntos = PJ.map(function(p,k){var v = 0;cuenta.forEach(function(n,i){v += n * p[1][i];});return{k: k,nombre: p[0],valor: 100 * v /(norma(cuenta)* norma(p[1]))};})
.sort(function(a,b){return b.valor - a.valor || a.k - b.k;});
var empate = puntos.filter(function(x){return puntos[0].valor - x.valor < 0.01;});
if(empate.length > 1){var e = TT.elegir(empate);puntos.splice(puntos.indexOf(e),1);puntos.unshift(e);}
var top = puntos[0],p = PJ[top.k],segundo = puntos[1];
return{
titulo: 'Tu casa de Juego de Tronos',titular: 'Casa ' + p[0],rango:{nombre: p[2],texto: p[3]+(empate.length > 1 ? ' Varios resultados encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '')},
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Tus rasgos'}),TT.graf.radar(RASGOS.map(function(r,i){return{nombre: r,valor: cuenta[i]/ mayor * 100};}),{descripcion: 'Peso de cada rasgo en tus respuestas'})),
TT.h('div',{},TT.h('h3',{texto: 'Con qué casas encajas más'}),TT.graf.barras(puntos.slice(0,5).map(function(x){return{nombre: x.nombre,valor: Math.round(x.valor)};}),{max: 100,unidad: ' %',destacar: 0,descripcion: 'Afinidad con los cinco personajes más parecidos'})),
TT.h('p',{'class': 'tt-res-texto',texto: 'Tu segunda casa más parecida: ' + segundo.nombre + '.'}),
TT.h('p',{'class': 'tt-aviso',texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.'})),
detalles: RASGOS.map(function(r,i){return[r,cuenta[i]+ ' de ' + suma];}),
copia: 'En el test de Juego de Tronos me ha salido la casa ' + p[0]+ '.'
};
}
});
})();

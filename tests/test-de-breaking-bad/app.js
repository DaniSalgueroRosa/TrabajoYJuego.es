(function(){
'use strict';
var RASGOS =["Inteligencia","Ambición","Lealtad","Sangre fría","Humor"];
var PJ =[
["Walter White",[65,100,10,35,10],"El orgullo que crece","Ambicioso, metódico y con una necesidad enorme de que reconozcan lo que vales. Tu cabeza llega lejos, pero tu orgullo manda."],
["Jesse Pinkman",[35,10,100,10,65],"El corazón entre el caos","Leal, bromista y mucho más sensible de lo que parece. Te dejas la piel por quien te trata bien."],
["Skyler White",[65,10,35,100,10],"La calma bajo presión","Fría de cabeza, lista y con una paciencia enorme. Sabes mantener la compostura cuando todo se complica."],
["Hank Schrader",[10,35,65,10,100],"El humor con instinto","Campechano, bromista y muy leal a los suyos. Tu olfato para las cosas raras es mejor de lo que aparentas."],
["Saul Goodman",[35,65,10,10,100],"La labia con ambición","Ingenioso, gracioso y siempre con un negocio entre manos. Sabes vender casi cualquier cosa y encontrar salida a todo."],
["Gus Fring",[65,35,10,100,10],"El control con paciencia","Frío, disciplinado y muy calculador. Cuidas hasta el último detalle y nunca dejas que se vea lo que piensas."],
["Mike Ehrmantraut",[35,10,100,65,10],"La lealtad sin adornos","Seco, práctico y fiel a su palabra. Haces tu trabajo sin presumir y proteges a quienes te importan."],
["Gale Boetticher",[100,10,35,10,65],"El entusiasta de la ciencia","Curioso, amable y apasionado por lo que haces. Te mueve el placer de entender las cosas y compartirlo."]];
var P =[
["Te ofrecen un negocio muy arriesgado. ¿Qué haces?","Calculo cada riesgo antes de decidir","Lo acepto: es mi oportunidad","Solo lo hago si ayudo a los míos","Digo que no y no me muevo","Hago una broma y pregunto las condiciones"],
["Algo sale mal en pleno trabajo.","Analizo qué ha fallado","Aprovecho para ganar posición","Cubro a mi equipo","Mantengo la calma y no lo dejo ver","Intento bromear para soltar la tensión"],
["Un compañero necesita ayuda.","Le doy una solución técnica","Le ayudo si me debe una","Voy sin pensarlo","Lo evalúo con frialdad","Le saco una sonrisa y le ayudo"],
["Tu jefe te trata con desprecio.","Demuestro que sé más que él","Planeo cómo ocupar su sitio","Aguanto por quienes dependen de mí","No muestro nada y espero","Le respondo con un chiste afilado"],
["Un secreto puede hacerte mucho daño.","Pienso cómo ocultarlo mejor","Lo uso a mi favor","Lo guardo por lealtad","Lo manejo sin emociones","Lo suelto en un chiste para quitarle peso"],
["¿Cuál es tu mejor cualidad?","Mi cabeza","Mi determinación","Mi fidelidad","Mi autocontrol","Mi sentido del humor"],
["En una reunión te hacen una pregunta incómoda.","Respondo con datos","Redirijo la conversación a mi favor","Defiendo a quien está en el centro","Contesto sin que se note nada","Contesto con un comentario ingenioso"],
["Tienes una tarde libre.","Leo o estudio algo nuevo","Avanzo en mis proyectos","Quedo con alguien que lo necesite","Planifico la semana en silencio","Veo algo con humor con mis amigos"],
["¿Qué te asusta más?","Que se descubra un error mío","Quedarme sin nada que alcanzar","Fallar a los míos","Perder el control","Aburrirme"],
["¿Cómo te gustaría que acabara tu historia?","Con mi trabajo reconocido","En la cima","Con los míos a salvo","Sin dejar rastro","Con una buena carcajada"]].map(function(x){return{t: x[0],o: x.slice(1).map(function(txt,i){var d ={};d['r' + i]= 1;return[txt,d];})};});
var norma = function(v){return Math.sqrt(v.reduce(function(a,b){return a + b * b;},0))|| 1;};
TT.cuestionario({
intro: "Diez situaciones con cinco respuestas. Elige lo que harías tú. Es un test de fans de Breaking Bad, sin imágenes y sin relación con los autores ni con los estudios.",
preguntas: P,
resultado: function(c){
var cuenta = RASGOS.map(function(r,i){return c.tot['r' + i];}),suma = cuenta.reduce(function(a,b){return a + b;},0)|| 1,mayor = Math.max.apply(null,cuenta)|| 1;
var puntos = PJ.map(function(p,k){var v = 0;cuenta.forEach(function(n,i){v += n * p[1][i];});return{k: k,nombre: p[0],valor: 100 * v /(norma(cuenta)* norma(p[1]))};})
.sort(function(a,b){return b.valor - a.valor || a.k - b.k;});
var empate = puntos.filter(function(x){return puntos[0].valor - x.valor < 0.01;});
if(empate.length > 1){var e = TT.elegir(empate);puntos.splice(puntos.indexOf(e),1);puntos.unshift(e);}
var top = puntos[0],p = PJ[top.k],segundo = puntos[1];
return{
titulo: "Tu personaje de Breaking Bad",titular: '' + p[0],rango:{nombre: p[2],texto: p[3]+(empate.length > 1 ? ' Varios resultados encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '')},
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Tus rasgos'}),TT.graf.radar(RASGOS.map(function(r,i){return{nombre: r,valor: cuenta[i]/ mayor * 100};}),{descripcion: 'Peso de cada rasgo en tus respuestas'})),
TT.h('div',{},TT.h('h3',{texto: 'Con quién encajas más'}),TT.graf.barras(puntos.slice(0,5).map(function(x){return{nombre: x.nombre,valor: Math.round(x.valor)};}),{max: 100,unidad: ' %',destacar: 0,descripcion: 'Afinidad con los cinco personajes más parecidos'})),
TT.h('p',{'class': 'tt-res-texto',texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.'}),
TT.h('p',{'class': 'tt-aviso',texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.'})),
detalles: RASGOS.map(function(r,i){return[r,cuenta[i]+ ' de ' + suma];}),
copia: "En el test de Breaking Bad me ha salido: " + p[0]+ '.'
};
}
});
})();

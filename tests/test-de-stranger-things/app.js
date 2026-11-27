(function(){
'use strict';
var RASGOS =["Valentía","Lealtad","Ingenio","Rebeldía","Sensibilidad"];
var PJ =[
["Eleven",[100,10,10,35,65],"El poder que aprende a hablar","Valiente, sensible y con ganas de ser tú misma. Hablas poco, pero cuando te mueves, lo haces con toda la fuerza."],
["Mike Wheeler",[65,100,10,10,35],"El que une al grupo","Leal, protector y con una fe enorme en sus amigos. Eres quien mantiene al equipo junto cuando todo se tuerce."],
["Dustin Henderson",[35,65,100,10,10],"El cerebro con corazón","Curioso, ingenioso y muy fiel. Tienes una explicación para casi todo y siempre encuentras un chiste a mano."],
["Will Byers",[35,65,10,10,100],"La sensibilidad que ve más","Sensible, tranquilo y muy atento a los demás. Notas lo que otros pasan por alto y tu empatía es tu mejor fuerza."],
["Max Mayfield",[65,10,10,100,35],"La rebeldía con alma","Independiente, directa y con una sensibilidad que no enseñas a cualquiera. No sigues a nadie que no te convenza."],
["Steve Harrington",[65,100,35,10,10],"El protector inesperado","Leal, valiente y con más cabeza de la que aparentas. Cuidas de los demás casi sin darte cuenta."],
["Jim Hopper",[10,65,10,100,35],"El rebelde con corazón blando","Cascarrabias, leal y mucho más sensible de lo que dejas ver. Lo haces todo a tu manera y siempre llegas cuando hace falta."],
["Nancy Wheeler",[65,10,100,35,10],"La que investiga hasta el final","Tenaz, lista y valiente. Sigues una pista hasta el final y no necesitas que nadie te dé permiso."]];
var P =[
["Una luz parpadea y algo no va bien. ¿Qué haces?","Voy a ver qué pasa","Aviso a los míos antes de moverme","Busco una explicación con lo que sé","Me salgo del camino habitual","Me quedo quieto y escucho lo que siento"],
["Tus amigos te piden ayuda en plena noche.","Salgo sin pensarlo","Voy a su lado cueste lo que cueste","Llevo el material que haga falta","Salgo sin que se enteren en casa","Voy, aunque tenga miedo"],
["Tienes que resolver un misterio.","Me lanzo a investigar en persona","Lo hago con mi grupo","Hago un mapa, una lista y un plan","Sigo mi corazonada, no las reglas","Presto atención a los detalles pequeños"],
["Alguien se burla de tu grupo.","Le planto cara","Me quedo a su lado","Respondo con una frase ingeniosa","Le contesto sin filtro","Me duele, pero lo noto y lo guardo"],
["¿Qué objeto llevarías siempre contigo?","Algo con lo que defenderme","Una foto de mi gente","Una radio, una brújula o un invento","Música muy alta","Un diario o algo con recuerdos"],
["Un adulto te prohíbe seguir investigando.","Sigo por mi cuenta","Le pido que confíe en mí","Busco otra vía más discreta","Hago lo contrario de lo que dice","Le cuento lo que siento"],
["Pasas la tarde en el sótano con tus amigos. ¿Qué haces?","Organizo un reto","Cuido de que todos estén a gusto","Monto o arreglo algo","Pongo mi música","Escucho y observo"],
["Estás ante un monstruo en un pasillo.","Lo afronto sin retroceder","Protejo a mis amigos primero","Busco su punto débil","Salto por donde nadie espera","Respiro y me concentro para no bloquearme"],
["¿Cuál es tu mayor miedo?","No ser capaz de proteger a alguien","Quedarme solo","No entender qué pasa","Que me controlen","Que nadie me comprenda"],
["¿Cómo termina tu historia?","Venciendo lo imposible","Con mis amigos a mi lado","Habiéndolo resuelto con ingenio","A mi manera","En paz conmigo"]].map(function(x){return{t: x[0],o: x.slice(1).map(function(txt,i){var d ={};d['r' + i]= 1;return[txt,d];})};});
var norma = function(v){return Math.sqrt(v.reduce(function(a,b){return a + b * b;},0))|| 1;};
TT.cuestionario({
intro: "Diez situaciones con cinco respuestas. Elige lo que harías tú. Es un test de fans de Stranger Things, sin imágenes y sin relación con los autores ni con los estudios.",
preguntas: P,
resultado: function(c){
var cuenta = RASGOS.map(function(r,i){return c.tot['r' + i];}),suma = cuenta.reduce(function(a,b){return a + b;},0)|| 1,mayor = Math.max.apply(null,cuenta)|| 1;
var puntos = PJ.map(function(p,k){var v = 0;cuenta.forEach(function(n,i){v += n * p[1][i];});return{k: k,nombre: p[0],valor: 100 * v /(norma(cuenta)* norma(p[1]))};})
.sort(function(a,b){return b.valor - a.valor || a.k - b.k;});
var empate = puntos.filter(function(x){return puntos[0].valor - x.valor < 0.01;});
if(empate.length > 1){var e = TT.elegir(empate);puntos.splice(puntos.indexOf(e),1);puntos.unshift(e);}
var top = puntos[0],p = PJ[top.k],segundo = puntos[1];
return{
titulo: "Tu personaje de Stranger Things",titular: '' + p[0],rango:{nombre: p[2],texto: p[3]+(empate.length > 1 ? ' Varios resultados encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '')},
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Tus rasgos'}),TT.graf.radar(RASGOS.map(function(r,i){return{nombre: r,valor: cuenta[i]/ mayor * 100};}),{descripcion: 'Peso de cada rasgo en tus respuestas'})),
TT.h('div',{},TT.h('h3',{texto: 'Con quién encajas más'}),TT.graf.barras(puntos.slice(0,5).map(function(x){return{nombre: x.nombre,valor: Math.round(x.valor)};}),{max: 100,unidad: ' %',destacar: 0,descripcion: 'Afinidad con los cinco personajes más parecidos'})),
TT.h('p',{'class': 'tt-res-texto',texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.'}),
TT.h('p',{'class': 'tt-aviso',texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.'})),
detalles: RASGOS.map(function(r,i){return[r,cuenta[i]+ ' de ' + suma];}),
copia: "En el test de Stranger Things me ha salido: " + p[0]+ '.'
};
}
});
})();

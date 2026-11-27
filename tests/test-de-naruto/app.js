(function(){
'use strict';
var RASGOS =["Determinación","Compañerismo","Estrategia","Sensibilidad","Audacia"];
var PJ =[
["Naruto Uzumaki",[65,35,10,10,100],"El ninja que no se rinde","Optimista, tenaz y muy leal. Nunca renuncias a un sueño y tu entusiasmo se contagia a quienes te rodean."],
["Sasuke Uchiha",[100,10,65,10,35],"El talento reservado","Reservado, exigente y con un talento enorme. Te marcas metas muy altas y te cuesta abrirte a los demás."],
["Sakura Haruno",[65,100,35,10,10],"La fuerza y la cabeza","Inteligente, trabajadora y con mucho carácter. Combinas cabeza y corazón y te esfuerzas por no quedarte atrás."],
["Kakashi Hatake",[10,35,100,65,10],"El maestro sereno","Calmado, estratega y protector. Das ejemplo con tu serenidad y sabes cuándo hablar y cuándo callar."],
["Shikamaru Nara",[10,65,100,35,10],"La mente estratega","Pereza aparente y una cabeza brillante. Ves tres pasos por delante y sacas lo mejor de tu equipo con calma."],
["Hinata Hyuga",[35,65,10,100,10],"La valentía silenciosa","Amable, sensible y mucho más valiente de lo que aparentas. Tu fuerza está en la constancia y en tu lealtad."],
["Rock Lee",[100,65,10,10,35],"El esfuerzo hecho persona","Trabajador incansable y de gran entusiasmo. Crees que con esfuerzo se llega a cualquier sitio."],
["Gaara",[65,100,10,35,10],"El corazón que se abre","Reservado y muy fuerte, aprendes a confiar en los demás. Tu fuerza es la calma y la determinación."]];
var P =[
["Tu equipo se enfrenta a una misión casi imposible. ¿Qué haces?","Insisto hasta que salga, cueste lo que cueste","Reúno al equipo: juntos llegamos más lejos","Paro a pensar un plan con todos los datos","Intento comprender qué siente cada uno antes de actuar","Me lanzo el primero y ya improvisaré"],
["Alguien se burla de tu sueño.","Me esfuerzo el doble para demostrar que se equivoca","Pienso en la gente que sí cree en mí","Lo guardo y lo uso como motivación a largo plazo","Me duele, aunque no lo muestre","Le reto a que lo compruebe ahora mismo"],
["Tu mejor forma de entrenar es…","Repetir lo mismo hasta que me salga perfecto","Entrenar con alguien que me exija","Estudiar la técnica y buscar el truco","Meditar y entender mi propio estilo","Probar movimientos nuevos y arriesgados"],
["Un amigo toma un mal camino.","Voy a por él aunque me cueste una pelea","Le recuerdo que no está solo","Intento entender qué le ha llevado ahí","Le escucho hasta que me abra su corazón","Le planto cara y le digo lo que pienso"],
["En el equipo, tu papel sería…","Quien aguanta más que nadie","Quien cuida de que nadie se quede atrás","Quien diseña el plan","Quien percibe lo que los demás no ven","Quien abre el camino en primera línea"],
["En un día tranquilo, te apetece…","Seguir mejorando, no puedo parar","Comer con amigos y reír","Un buen juego de lógica","Estar en calma con mis pensamientos","Retar a alguien a una competición"],
["Tu mayor miedo es…","Rendirme","Quedarme solo","Equivocarme en un plan importante","Hacer daño a quien quiero","Aburrirme y que no pase nada"],
["Ante una regla que te parece injusta…","La rompo si hace falta para lograr mi objetivo","La discuto con mi grupo","Busco una forma de sortearla sin problemas","Pienso en quién sale perjudicado","La desafío sin pedir permiso"],
["Lo que más admiras en alguien es…","Su fuerza de voluntad","Su lealtad","Su inteligencia","Su bondad","Su valor"],
["Si pudieras aconsejar a tu yo del pasado…","No te rindas jamás","Rodéate de buena gente","Piensa antes de actuar","Sé amable contigo","Atrévete antes"]].map(function(x){return{t: x[0],o: x.slice(1).map(function(txt,i){var d ={};d['r' + i]= 1;return[txt,d];})};});
var norma = function(v){return Math.sqrt(v.reduce(function(a,b){return a + b * b;},0))|| 1;};
TT.cuestionario({
intro: 'Diez situaciones con cinco respuestas. Elige la que harías tú, no la que haría tu personaje favorito. Es un test de fans, sin imágenes y sin relación con la obra.',
preguntas: P,
resultado: function(c){
var cuenta = RASGOS.map(function(r,i){return c.tot['r' + i];}),suma = cuenta.reduce(function(a,b){return a + b;},0)|| 1,mayor = Math.max.apply(null,cuenta)|| 1;
var puntos = PJ.map(function(p,k){var v = 0;cuenta.forEach(function(n,i){v += n * p[1][i];});return{k: k,nombre: p[0],valor: 100 * v /(norma(cuenta)* norma(p[1]))};})
.sort(function(a,b){return b.valor - a.valor || a.k - b.k;});
var empate = puntos.filter(function(x){return puntos[0].valor - x.valor < 0.01;});
if(empate.length > 1){var e = TT.elegir(empate);puntos.splice(puntos.indexOf(e),1);puntos.unshift(e);}
var top = puntos[0],p = PJ[top.k],segundo = puntos[1];
return{
titulo: 'Tu personaje de Naruto',titular: p[0],rango:{nombre: p[2],texto: p[3]+(empate.length > 1 ? ' Varios personajes encajan igual con tus respuestas, así que el test ha elegido uno entre ellos.' : '')},
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Tus rasgos'}),TT.graf.radar(RASGOS.map(function(r,i){return{nombre: r,valor: cuenta[i]/ mayor * 100};}),{descripcion: 'Peso de cada rasgo en tus respuestas'})),
TT.h('div',{},TT.h('h3',{texto: 'Con quién encajas más'}),TT.graf.barras(puntos.slice(0,5).map(function(x){return{nombre: x.nombre,valor: Math.round(x.valor)};}),{max: 100,unidad: ' %',destacar: 0,descripcion: 'Afinidad con los cinco personajes más parecidos'})),
TT.h('p',{'class': 'tt-res-texto',texto: 'Tu segundo personaje más parecido: ' + segundo.nombre + '.'}),
TT.h('p',{'class': 'tt-aviso',texto: 'Test de fans no oficial, hecho con textos propios y sin imágenes. No tiene relación con los autores, los estudios ni las editoriales de la obra.'})),
detalles: RASGOS.map(function(r,i){return[r,cuenta[i]+ ' de ' + suma];}),
copia: 'En el test de Naruto me ha salido: ' + p[0]+ '.'
};
}
});
})();

(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('cp');
if(!raiz)return;
var paises =[],mazo =[],dif = 0;
var REGION ={europa: 'Europa',america: 'América',asia: 'Asia',africa: 'África',oceania: 'Oceanía'};
function robar(){
if(!mazo.length)mazo = U.barajar(U.porNivel(paises,dif));
return mazo.pop();
}
function arrancar(){
TYJ.datos('capitales/paises.json').then(function(json){
paises = json.paises;
TYJ.Rondas(raiz,{
titulo: 'Capitales del mundo',
intro: 'Diez preguntas sobre capitales de Europa, América, Asia, África y Oceanía. Cuatro respuestas, 15 segundos por pregunta y las opciones falsas siempre son de la misma parte del mundo.',
rondas: 10,segundos: 15,ruta: true,
dificultad: true,alIniciar: function(est){dif = est.dif;mazo =[];},
niveles:[[0,'Turista'],[600,'Viajero'],[900,'Mochilero'],[1200,'Diplomático'],[1450,'Cartógrafo'],[1700,'Embajador']],
siguiente: function(){
var q = robar(),inversa = Math.random()< 0.35;
var mismas = paises.filter(function(x){return x.r === q.r && x.p !== q.p;});
if(mismas.length < 3)mismas = paises.filter(function(x){return x.p !== q.p;});
var otras = U.muestra(mismas,3),todas = U.barajar([q].concat(otras));
if(inversa){
return{enunciado: '¿De qué país es capital ' + q.c + '?',opciones: todas.map(function(x){return x.p;}),correcta: todas.indexOf(q),
explicacion: q.c + ' es la capital de ' + q.p + ' (' + REGION[q.r]+ ').',etiqueta: 'Capital: ' + q.c};
}
return{enunciado: '¿Cuál es la capital de ' + q.p + '?',opciones: todas.map(function(x){return x.c;}),correcta: todas.indexOf(q),
explicacion: 'La capital de ' + q.p + ' (' + REGION[q.r]+ ') es ' + q.c + '.',etiqueta: 'Capital de ' + q.p};
},
compartir: function(est,nivel){return 'Capitales del mundo · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

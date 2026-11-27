(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('qf');
if(!raiz)return;
var banco =[],mazo =[],dif = 0;
function robar(){
if(!mazo.length)mazo = U.barajar(U.porNivel(banco,dif));
return mazo.pop();
}
function arrancar(){
TYJ.datos('quiz-de-futbol/preguntas.json').then(function(json){
banco = json.preguntas;
TYJ.Rondas(raiz,{
titulo: 'Quiz de fútbol',
intro: 'Diez preguntas de fútbol con cuatro respuestas y 20 segundos para cada una: Mundiales, Eurocopas, Champions League, clubes, ligas y estrellas.',
rondas: 10,segundos: 20,ruta: true,
dificultad: true,alIniciar: function(est){dif = est.dif;mazo =[];},
niveles:[[0,'Suplente'],[600,'Titular'],[900,'Capitán'],[1200,'Crack'],[1450,'Balón de Oro']],
siguiente: function(){
var q = robar(),orden = U.barajar([0,1,2,3]);
return{enunciado: q.p,opciones: orden.map(function(i){return q.o[i];}),correcta: orden.indexOf(0),explicacion: q.e,etiqueta: q.p};
},
compartir: function(est,nivel){return 'Quiz de fútbol · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

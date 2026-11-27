(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('rgf');
if(!raiz)return;
var banco =[],mazo =[],dif = 0;
function robar(){
if(!mazo.length)mazo = U.barajar(U.porNivel(banco,dif));
return mazo.pop();
}
function arrancar(){
TYJ.datos('reglas-del-futbol/preguntas.json').then(function(json){
banco = json.preguntas;
TYJ.Rondas(raiz,{
titulo: 'Reglas del fútbol',
intro: 'Diez preguntas sobre las reglas del fútbol: fuera de juego, saques, tarjetas, penaltis, portero y VAR. Cuatro respuestas y 25 segundos para cada una.',
rondas: 10,segundos: 25,ruta: true,
dificultad: true,alIniciar: function(est){dif = est.dif;mazo =[];},
niveles:[[0,'Aficionado'],[600,'Juez de línea'],[900,'Árbitro de barrio'],[1200,'Árbitro nacional'],[1450,'Árbitro internacional']],
siguiente: function(){
var q = robar(),orden = U.barajar([0,1,2,3]);
return{enunciado: q.p,opciones: orden.map(function(i){return q.o[i];}),correcta: orden.indexOf(0),explicacion: q.e,etiqueta: q.p};
},
compartir: function(est,nivel){return 'Reglas del fútbol · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

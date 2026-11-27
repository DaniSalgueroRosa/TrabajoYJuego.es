(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('qh');
if(!raiz)return;
var banco =[],mazo =[],dif = 0;
function robar(){
if(!mazo.length)mazo = U.barajar(U.porNivel(banco,dif));
return mazo.pop();
}
function arrancar(){
TYJ.datos('quiz-de-historia/preguntas.json').then(function(json){
banco = json.preguntas;
TYJ.Rondas(raiz,{
titulo: 'Quiz de historia',
intro: 'Diez preguntas de historia universal y de España con cuatro respuestas y 20 segundos para cada una. Fechas, personajes, batallas y civilizaciones.',
rondas: 10,segundos: 20,ruta: true,
dificultad: true,alIniciar: function(est){dif = est.dif;mazo =[];},
niveles:[[0,'Novato del pasado'],[600,'Estudiante'],[900,'Aficionado a la historia'],[1200,'Historiador'],[1450,'Cronista mayor']],
siguiente: function(){
var q = robar(),orden = U.barajar([0,1,2,3]);
return{enunciado: q.p,opciones: orden.map(function(i){return q.o[i];}),correcta: orden.indexOf(0),explicacion: q.e,etiqueta: q.p};
},
compartir: function(est,nivel){return 'Quiz de historia · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

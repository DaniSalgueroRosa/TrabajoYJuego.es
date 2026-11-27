(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('rf');
if(!raiz)return;
var banco =[],mazo =[],dif = 0;
function robar(){
if(!mazo.length)mazo = U.barajar(U.porNivel(banco,dif));
return mazo.pop();
}
function arrancar(){
TYJ.datos('refranes/refranes.json').then(function(json){
banco = json.refranes;
TYJ.Rondas(raiz,{
titulo: 'Refranes',
intro: 'Te damos el comienzo de un refrán y eliges cómo termina. Diez rondas de cuatro opciones y 20 segundos cada una. Al responder verás su significado.',
rondas: 10,segundos: 20,
dificultad: true,alIniciar: function(est){dif = est.dif;mazo =[];},
niveles:[[0,'Forastero'],[600,'Aprendiz'],[900,'Entendido'],[1200,'Cervantes'],[1450,'Maestro del refranero']],
siguiente: function(){
var q = robar(),orden = U.barajar([0,1,2,3]),completo = q.p + ' ' + q.o[0]+ '.';
return{enunciado: 'Completa el refrán: «' + q.p + ' …»',opciones: orden.map(function(i){return q.o[i];}),correcta: orden.indexOf(0),
explicacion: 'Refrán completo: «' + completo + '» ' + q.e,etiqueta: completo};
},
compartir: function(est,nivel){return 'Refranes · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

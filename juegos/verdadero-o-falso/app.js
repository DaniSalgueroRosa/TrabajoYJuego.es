(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('vf');
if(!raiz)return;
var verdaderas =[],falsas =[],mazoV =[],mazoF =[],cola =[],dif = 0;
function robar(mazo,lista){if(!mazo.length)mazo.push.apply(mazo,U.barajar(U.porNivel(lista,dif)));return mazo.pop();}
function arrancar(){
TYJ.datos('verdadero-o-falso/afirmaciones.json').then(function(json){
verdaderas = json.afirmaciones.filter(function(a){return a.v;});
falsas = json.afirmaciones.filter(function(a){return !a.v;});
TYJ.Rondas(raiz,{
titulo: 'Verdadero o falso',
intro: 'Quince afirmaciones y 12 segundos para decidir si cada una es verdadera o falsa. Después te explicamos por qué.',
rondas: 15,segundos: 12,ruta: true,
niveles:[[0,'Despistado'],[700,'Curioso'],[1200,'Buen ojo'],[1800,'Cazamentiras'],[2300,'Detector de mitos']],
dificultad: true,
alIniciar: function(est){
dif = est.dif;mazoV.length = 0;mazoF.length = 0;
var nVerdaderas = U.entre(7,8);
cola = U.barajar(Array.apply(null,Array(15)).map(function(_,i){return i < nVerdaderas;}));
},
siguiente: function(n){
var q = cola[n]? robar(mazoV,verdaderas): robar(mazoF,falsas);
return{enunciado: q.p,opciones:['Verdadero','Falso'],correcta: q.v ? 0 : 1,explicacion: q.e,etiqueta: q.p};
},
compartir: function(est,nivel){return 'Verdadero o falso · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/15 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

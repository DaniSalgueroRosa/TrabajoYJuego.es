(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('sa');
if(!raiz)return;
var banco =[],mazo =[],dif = 0;
function robar(){
if(!mazo.length)mazo = U.barajar(U.porNivel(banco,dif));
return mazo.pop();
}
function arrancar(){
TYJ.datos('sinonimos-y-antonimos/palabras.json').then(function(json){
banco = json.preguntas;
TYJ.Rondas(raiz,{
titulo: 'Sinónimos y antónimos',
intro: 'Te damos una palabra y eliges su sinónimo o su antónimo entre cuatro opciones. Diez rondas de 15 segundos con repaso final.',
rondas: 10,segundos: 15,
dificultad: true,alIniciar: function(est){dif = est.dif;mazo =[];},
niveles:[[0,'Principiante'],[600,'Aprendiz'],[900,'Hablante fluido'],[1200,'Lexicógrafo'],[1450,'Diccionario viviente']],
siguiente: function(){
var q = robar(),orden = U.barajar([0,1,2,3]),sin = q.k === 'sinonimo';
return{enunciado: sin ? '¿Qué palabra es sinónima de «' + q.p + '»?' : '¿Qué palabra es antónima de «' + q.p + '»?',
opciones: orden.map(function(i){return q.o[i];}),correcta: orden.indexOf(0),
explicacion:(sin ? 'Sinónimo de «' + q.p + '»: ' : 'Antónimo de «' + q.p + '»: ')+ q.o[0]+ '. ' + q.e,etiqueta:(sin ? 'Sinónimo de ' : 'Antónimo de ')+ q.p};
},
compartir: function(est,nivel){return 'Sinónimos y antónimos · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

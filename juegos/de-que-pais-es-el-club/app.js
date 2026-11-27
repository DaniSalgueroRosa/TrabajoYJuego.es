(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('pc');
if(!raiz)return;
var banco =[],mazo =[];
function robar(){if(!mazo.length)mazo = U.barajar(banco);return mazo.pop();}
function unicos(l){return l.filter(function(x,i){return l.indexOf(x)=== i;});}
function falsas(q,campo){
var otros = banco.filter(function(x){return x[campo]!== q[campo];});
var mismos = campo === 'c' ? U.barajar(unicos(otros.filter(function(x){return x.p === q.p;}).map(function(x){return x.c;}))).slice(0,2):[];
var resto = U.barajar(unicos(otros.map(function(x){return x[campo];})));
return unicos(mismos.concat(resto)).slice(0,3);
}
function arrancar(){
TYJ.datos('de-que-pais-es-el-club/clubes.json').then(function(json){
banco = json.clubes;
TYJ.Rondas(raiz,{
titulo: '¿De qué país es el club?',
intro: 'Diez preguntas sobre clubes de fútbol de todo el mundo: en qué país está cada uno y en qué ciudad juega de local. Cuatro respuestas y 15 segundos para cada una.',
rondas: 10,segundos: 15,ruta: true,
niveles:[[0,'Turista'],[600,'Viajero'],[900,'Trotamundos'],[1200,'Cónsul'],[1450,'Cartógrafo del fútbol']],
siguiente: function(){
var q = robar(),ciudad = Math.random()< 0.45,campo = ciudad ? 'c' : 'p';
var op = U.barajar([q[campo]].concat(falsas(q,campo)));
return{enunciado: ciudad ? '¿En qué ciudad juega de local el ' + q.n + '?' : '¿De qué país es el ' + q.n + '?',opciones: op,correcta: op.indexOf(q[campo]),
explicacion: 'El ' + q.n + ' es de ' + q.p + ' y juega en ' + q.c + '.',etiqueta: q.n};
},
compartir: function(est,nivel){return '¿De qué país es el club? · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

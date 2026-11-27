(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('ap');
if(!raiz)return;
var banco =[],clubes =[],mazo =[];
function robar(){if(!mazo.length)mazo = U.barajar(banco);return mazo.pop();}
function falsas(q){
var otros = clubes.filter(function(c){return c.n !== q.c;});
var mismos = U.barajar(otros.filter(function(c){return c.p === q.p;})).slice(0,3);
var resto = U.barajar(otros.filter(function(c){return c.p !== q.p && mismos.indexOf(c)< 0;}));
return mismos.concat(resto).slice(0,3).map(function(c){return c.n;});
}
function arrancar(){
TYJ.datos('apodos-de-clubes/apodos.json').then(function(json){
banco = json.apodos;
var visto ={};
banco.forEach(function(a){if(!visto[a.c]){visto[a.c]= true;clubes.push({n: a.c,p: a.p});}});
TYJ.Rondas(raiz,{
titulo: 'Apodos de clubes',
intro: 'Diez apodos de clubes de todo el mundo: Blaugrana, Gunners, Xeneizes, Vecchia Signora… Elige a qué club pertenece cada uno. Cuatro respuestas y 15 segundos para cada una.',
rondas: 10,segundos: 15,ruta: true,
niveles:[[0,'Aficionado'],[600,'Abonado'],[900,'Peña'],[1200,'Ultra'],[1450,'Cronista']],
siguiente: function(){
var q = robar(),opciones = U.barajar([q.c].concat(falsas(q)));
return{enunciado: '¿Qué club es conocido como «' + q.a + '»?',opciones: opciones,correcta: opciones.indexOf(q.c),explicacion: '«' + q.a + '» es un apodo del ' + q.c + ' (' + q.p + ').',etiqueta: q.a};
},
compartir: function(est,nivel){return 'Apodos de clubes · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

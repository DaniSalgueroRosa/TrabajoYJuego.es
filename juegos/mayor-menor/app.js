(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('mym');
if(!raiz)return;
var cats =[];
function formato(cat,v){
var n = cat.dec ? v.toFixed(cat.dec).replace('.',','): U.miles(v);
if(cat.id === 'anios')return String(v);
if(cat.id === 'poblacion')return 'unos ' + n + ' millones de habitantes';
return n +(cat.id === 'altitud' ? ' m' : ' km');
}
function enunciado(cat,A,B){
switch(cat.id){
case 'poblacion': return A.n + ': ' + formato(cat,A.v)+ '. ¿Tiene ' + B.n + ' más o menos habitantes?';
case 'altitud': return A.n + ': ' + formato(cat,A.v)+ '. ¿Es la altitud de ' + B.n + ' mayor o menor?';
case 'longitud': return 'El río ' + A.n + ': ' + formato(cat,A.v)+ '. ¿Tiene el río ' + B.n + ' más o menos kilómetros?';
default: return A.n + ': ' + A.v + '. ¿' + B.n + ' ocurrió antes o después?';
}
}
function opciones(cat){
return{poblacion:['Más habitantes','Menos habitantes'],altitud:['Mayor altitud','Menor altitud'],longitud:['Más largo','Más corto'],anios:['Después','Antes']}[cat.id];
}
function distintos(cat,a,b){
return cat.id === 'anios' ? Math.abs(a - b)>= 8 : Math.max(a,b)/ Math.min(a,b)>= 1.2;
}
function arrancar(){
TYJ.datos('mayor-menor/datos.json').then(function(json){
cats = json.categorias;
var cat = null,ancla = null,desdeCambio = 0;
TYJ.Rondas(raiz,{
titulo: 'Mayor o menor',
intro: 'Te damos un dato y tú dices si el siguiente es mayor o menor. Tienes dos vidas y 12 segundos por ronda. ¿Hasta dónde llegas?',
rondas: 0,segundos: 12,vidas: 2,
niveles:[[0,'Principiante'],[400,'Curioso'],[900,'Atento'],[1500,'Preciso'],[2300,'Calculador'],[3200,'Oráculo']],
alIniciar: function(){cat = null;ancla = null;desdeCambio = 0;},
siguiente: function(){
if(!cat || desdeCambio >= 8){
var otras = cats.filter(function(c){return c !== cat;});
cat = U.elegir(otras);ancla = null;desdeCambio = 0;
}
if(!ancla){var it = U.elegir(cat.items);ancla ={n: it[0],v: it[1]};}
var candidatos = cat.items.filter(function(x){return x[0]!== ancla.n && distintos(cat,x[1],ancla.v);});
var el = U.elegir(candidatos),B ={n: el[0],v: el[1]},A = ancla;
desdeCambio++;ancla = B;
var op = opciones(cat),mayor = B.v > A.v;
return{enunciado: enunciado(cat,A,B),opciones: op,correcta: mayor ? 0 : 1,etiqueta: cat.nombre + ': ' + A.n + ' → ' + B.n,
explicacion: B.n +(cat.id === 'anios' ? ': ' : ' → ')+ formato(cat,B.v)+ '.'};
},
detalleFinal: function(est){return['Rondas jugadas: ' + est.n];},
compartir: function(est,nivel){return 'Mayor o menor · ' + U.miles(est.puntos)+ ' puntos · racha de ' + est.mejorRacha + ' aciertos · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

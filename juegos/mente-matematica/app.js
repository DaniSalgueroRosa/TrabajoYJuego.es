(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('mm');
if(!raiz)return;
function operacion(n){
var a,b,c,k;
if(n < 2){
a = U.entre(12,89);b = U.entre(11,79);
return n === 0 ?{texto: a + ' + ' + b,valor: a + b}:{texto: Math.max(a,b)+ ' − ' + Math.min(a,b),valor: Math.abs(a - b)};
}
if(n < 4){
a = U.entre(3,12);b = U.entre(6,12);
return{texto: a + ' × ' + b,valor: a * b};
}
if(n < 6){
a = U.entre(12,49);b = U.entre(3,9);
return{texto: a + ' × ' + b,valor: a * b};
}
if(n < 8){
a = U.entre(3,9);b = U.entre(4,9);c = n === 6 ? U.entre(5,40): U.entre(2,15);
return n === 6 ?{texto: a + ' × ' + b + ' + ' + c,valor: a * b + c}:{texto: '(' + a + ' + ' + c + ') × ' + b,valor:(a + c)* b};
}
if(n === 8){
b = U.entre(3,12);k = U.entre(6,25);
return{texto:(b * k)+ ' ÷ ' + b,valor: k};
}
var p = U.elegir([10,20,25,50,75]),base = U.elegir([40,60,80,120,160,200,240]);
return{texto: p + ' % de ' + base,valor: p * base / 100};
}
TYJ.Rondas(raiz,{
titulo: 'Mente matemática',
intro: 'Diez operaciones de cabeza que se van complicando. Escribe el resultado antes de que se acaben los 20 segundos.',
rondas: 10,segundos: 20,
niveles:[[0,'Calculando…'],[500,'Aprendiz'],[800,'Contable'],[1100,'Matemático'],[1400,'Calculadora humana']],
siguiente: function(n){
var op = operacion(n);
return{enunciado: op.texto + ' = ?',numero: op.valor,placeholder: 'Resultado',explicacion: op.texto + ' = ' + String(op.valor).replace('.',','),etiqueta: op.texto};
},
compartir: function(est,nivel){return 'Mente matemática · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
})();

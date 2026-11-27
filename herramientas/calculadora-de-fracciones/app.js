(function(){
'use strict';
TH.alCargar(function(raiz){
function mcd(a,b){a = Math.abs(a);b = Math.abs(b);while(b){var t = b;b = a % b;a = t;}return a;}
function simp(n,d){if(d < 0){n = -n;d = -d;}var g = mcd(n,d)|| 1;return[n / g,d / g];}
function txt(n,d){return d === 1 ? String(n): n + '/' + d;}
TH.calculadora(raiz,{
campos:[
{id: 'n1',etiqueta: 'Numerador 1',ph: '1',entero: true},{id: 'd1',etiqueta: 'Denominador 1',ph: '2',entero: true},
{id: 'op',tipo: 'select',etiqueta: 'Operación',valor: '+',opciones:[['+','Sumar (+)'],['-','Restar (−)'],['*','Multiplicar (×)'],['/','Dividir (÷)']]},
{id: 'n2',etiqueta: 'Numerador 2',ph: '1',entero: true},{id: 'd2',etiqueta: 'Denominador 2',ph: '3',entero: true}
],
ejemplo:{n1: '1',d1: '2',op: '+',n2: '1',d2: '3'},
vacio: 'Escribe las dos fracciones y la operación.',
calcular: function(v){
if(!TH.listos(v,['n1','d1','n2','d2']))return{vacio: true};
if([v.n1,v.d1,v.n2,v.d2].some(function(x){return x !== Math.floor(x);}))return{error: 'Numeradores y denominadores deben ser números enteros.'};
if(v.d1 === 0 || v.d2 === 0)return{error: 'El denominador no puede ser 0.'};
var n,d,pasos =[],a = v.n1 + '/' + v.d1,b = v.n2 + '/' + v.d2;
if(v.op === '+' || v.op === '-'){
var m = v.d1 / mcd(v.d1,v.d2)* v.d2,x = v.n1 *(m / v.d1),y = v.n2 *(m / v.d2);
n = v.op === '+' ? x + y : x - y;d = m;
pasos.push('Denominador común: ' + m + '. ' + a + ' = ' + x + '/' + m + ' y ' + b + ' = ' + y + '/' + m + '.','Operación: ' + x +(v.op === '+' ? ' + ' : ' − ')+ y + ' = ' + n + ', así que el resultado es ' + n + '/' + m + ' sin simplificar.');
}else if(v.op === '*'){n = v.n1 * v.n2;d = v.d1 * v.d2;pasos.push('Se multiplican numeradores y denominadores: ' + n + '/' + d + ' sin simplificar.');}
else{if(v.n2 === 0)return{error: 'No se puede dividir entre una fracción que vale 0.'};n = v.n1 * v.d2;d = v.d1 * v.n2;pasos.push('Se multiplica por la inversa de la segunda: ' + a + ' × ' + v.d2 + '/' + v.n2 + ' = ' + n + '/' + d + ' sin simplificar.');}
var s = simp(n,d),val = s[0]/ s[1],ent = Math.trunc(s[0]/ s[1]),resto = Math.abs(s[0])% s[1];
var filas =[TH.fila('fraccion','Resultado simplificado',txt(s[0],s[1]),'txt')];
if(resto && Math.abs(ent)> 0)filas.push(TH.fila('mixto','Número mixto',ent + ' ' + resto + '/' + s[1],'txt'));
filas.push(TH.fila('decimal','Decimal',val,'auto'),TH.fila('porcentaje','Porcentaje',val * 100,'pct'));
return{filas: filas,notas: pasos};
}
});
});
})();

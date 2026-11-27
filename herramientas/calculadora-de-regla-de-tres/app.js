(function(){
'use strict';
TH.alCargar(function(raiz){
TH.calculadora(raiz,{
campos:[
{id: 'tipo',tipo: 'select',etiqueta: 'Tipo de regla',valor: 'directa',ancho: 'completo',opciones:[['directa','Directa: si uno sube, el otro sube en la misma proporción'],['inversa','Inversa: si uno sube, el otro baja en la misma proporción']]},
{id: 'a',etiqueta: 'A',ph: '3',ayuda: 'Primera cantidad conocida'},
{id: 'b',etiqueta: 'B',ph: '12',ayuda: 'Lo que corresponde a A'},
{id: 'c',etiqueta: 'C',ph: '5',ayuda: 'Segunda cantidad conocida'}
],
ejemplo:{tipo: 'directa',a: '3',b: '12',c: '5'},
vacio: 'Escribe A, B y C: la herramienta calcula X.',
calcular: function(v){
if(!TH.listos(v,['a','b','c']))return{vacio: true};
var dir = v.tipo === 'directa';
if((dir && v.a === 0)||(!dir && v.c === 0))return{error: 'No se puede dividir entre cero: ' +(dir ? 'A' : 'C')+ ' no puede ser 0.'};
var x = dir ? v.b * v.c / v.a : v.a * v.b / v.c,f = TH.fmt;
var pasos = dir ?['Planteamiento: ' + f(v.a,[0,6])+ ' → ' + f(v.b,[0,6])+ ' y ' + f(v.c,[0,6])+ ' → X.','Regla directa: X = B × C ÷ A = ' + f(v.b,[0,6])+ ' × ' + f(v.c,[0,6])+ ' ÷ ' + f(v.a,[0,6])+ '.']
:['Planteamiento: ' + f(v.a,[0,6])+ ' → ' + f(v.b,[0,6])+ ' y ' + f(v.c,[0,6])+ ' → X.','Regla inversa: X = A × B ÷ C = ' + f(v.a,[0,6])+ ' × ' + f(v.b,[0,6])+ ' ÷ ' + f(v.c,[0,6])+ '.'];
return{filas:[TH.fila('x','X',x,'n4')],notas: pasos};
}
});
});
})();

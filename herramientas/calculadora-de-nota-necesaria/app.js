(function(){
'use strict';
TH.alCargar(function(raiz){
TH.calculadora(raiz,{
campos:[
{id: 'notas',tipo: 'lista',etiqueta: 'Notas que ya tienes, con su peso en la nota final',inicial: 2,min: 1,max: 20,textoAnadir: 'Añadir nota',
columnas:[{id: 'nota',etiqueta: 'Nota',ph: '6'},{id: 'peso',etiqueta: 'Peso (%)',ph: '30'}]},
{id: 'falta',etiqueta: 'Peso de lo que falta',unidad: '%',ph: '40',ayuda: 'El examen o la parte pendiente.'},
{id: 'objetivo',etiqueta: 'Nota final que quieres',ph: '5',valor: '5'}
],
ejemplo:{notas:[{nota: '6',peso: '30'},{nota: '7',peso: '30'}],falta: '40',objetivo: '5'},
vacio: 'Escribe tus notas con su peso, el peso de lo que falta y la nota que quieres sacar.',
calcular: function(v){
var filas = v.notas.filter(function(f){return !isNaN(f.nota)&& !isNaN(f.peso);});
if(!filas.length || !TH.listos(v,['falta','objetivo']))return{vacio: true};
if(v.falta <= 0 || v.falta > 100)return{error: 'El peso de lo que falta debe estar entre 0 y 100 %.'};
if(v.objetivo < 0 || v.objetivo > 10)return{error: 'La nota que quieres debe estar entre 0 y 10.'};
if(filas.some(function(f){return f.nota < 0 || f.nota > 10 || f.peso < 0;}))return{error: 'Las notas van de 0 a 10 y los pesos no pueden ser negativos.'};
var pesos = filas.reduce(function(a,f){return a + f.peso;},0)+ v.falta;
var acumulado = filas.reduce(function(a,f){return a + f.nota * f.peso / 100;},0);
var necesaria =(v.objetivo - acumulado)/(v.falta / 100);
var avisos =[];
if(Math.abs(pesos - 100)> 1e-9)avisos.push('Los pesos suman ' + TH.fmt(pesos,[0,2])+ ' % y deberían sumar 100 %. El cálculo usa los pesos tal como los has escrito.');
var veredicto = necesaria > 10 ? 'No es posible: necesitarías más de un 10' : necesaria <= 0 ? 'Ya lo tienes: llegas con cualquier nota' : 'Es posible';
var f =[TH.fila('necesaria','Nota que necesitas',Math.max(0,necesaria),'n2'),TH.fila('acumulado','Puntos que ya tienes',acumulado,'n3'),TH.fila('veredicto','Resultado',veredicto,'txt')];
return{filas: f,avisos: avisos,notas:['Fórmula: (nota que quieres − puntos que ya tienes) ÷ peso de lo que falta.']};
}
});
});
})();

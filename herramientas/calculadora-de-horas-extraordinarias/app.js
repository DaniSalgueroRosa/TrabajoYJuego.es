(function(){
'use strict';
TH.alCargar(function(raiz){
(function(){
var z = function(x){return typeof x === 'number' && isFinite(x)? x : 0;};
TH.calculadora(raiz,{
campos:[
{id: 'bruto',etiqueta: 'Salario bruto anual',unidad: '€',ph: '24000'},
{id: 'horasAnuales',etiqueta: 'Horas de trabajo al año según tu convenio',unidad: 'h',ph: '1800'},
{id: 'recargo',etiqueta: 'Recargo de la hora extra según convenio',unidad: '%',valor: '25'},
{id: 'horas',etiqueta: 'Horas extra realizadas',unidad: 'h',ph: '10'},
{id: 'acumuladas',etiqueta: 'Horas extra ya acumuladas este año (opcional)',unidad: 'h',ph: '75'}
],
ejemplo:{bruto: '24000',horasAnuales: '1800',recargo: '25',horas: '10',acumuladas: '75'},
calcular: function(v){
if(!TH.listos(v,['bruto','horasAnuales','horas']))return{vacio: true};
var rec = z(v.recargo),ac = z(v.acumuladas);
if(v.bruto <= 0 || v.horasAnuales <= 0 || v.horasAnuales > 3000)return{error: 'El salario debe ser mayor que 0 y las horas anuales deben estar entre 1 y 3.000.'};
if(v.horas < 0 || ac < 0 || rec < 0 || rec > 300)return{error: 'Las horas no pueden ser negativas y el recargo debe estar entre 0 y 300 %.'};
var ord = v.bruto / v.horasAnuales,ext = ord *(1 + rec / 100),tot = ac + v.horas;
var filas =[TH.fila('importe','Importe bruto de las horas extra',ext * v.horas,'eur'),TH.fila('hora-ordinaria','Valor de la hora ordinaria',ord,'eur'),TH.fila('hora-extra','Valor de la hora extra',ext,'eur'),
TH.fila('extra-sobre-ordinaria','Diferencia sobre la hora ordinaria',ext - ord,'eur'),TH.fila('acumuladas-total','Horas extra acumuladas en el año',tot,'n1'),TH.fila('margen-limite','Horas disponibles hasta el límite de 80',80 - tot,'n1')],avisos =[];
if(tot > 80)avisos.push('Con estas horas superarías el límite legal de 80 horas extraordinarias al año, sin contar las compensadas con descanso en los cuatro meses siguientes.');
return{filas: filas,avisos: avisos,notas:['Importe bruto, sujeto a Seguridad Social e IRPF. El recargo y la posible compensación en descanso dependen de tu convenio colectivo o contrato.']};
}
});
})();
});
})();

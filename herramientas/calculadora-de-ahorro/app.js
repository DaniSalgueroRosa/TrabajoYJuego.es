(function(){
'use strict';
TH.alCargar(function(raiz){
function texto(m){var a = Math.floor(m / 12),r = m % 12;return(a ? TH.pl(a,'año','años'): '')+(a && r ? ' y ' : '')+(r || !a ? TH.pl(r,'mes','meses'): '');}
TH.calculadora(raiz,{
campos:[
{id: 'modo',tipo: 'select',etiqueta: '¿Qué quieres saber?',valor: 'tiempo',ancho: 'completo',opciones:[['tiempo','¿Cuánto tardaré en llegar a mi meta?'],['cuota','¿Cuánto debo ahorrar cada mes?']]},
{id: 'meta',etiqueta: 'Meta de ahorro',unidad: '€',ph: '10.000'},
{id: 'actual',etiqueta: 'Lo que ya tienes ahorrado',unidad: '€',ph: '0'},
{id: 'mensual',etiqueta: 'Ahorro mensual',unidad: '€',ph: '250',mostrarSi: function(v){return v.modo === 'tiempo';}},
{id: 'plazo',etiqueta: 'Plazo para conseguirlo',unidad: 'meses',ph: '24',entero: true,mostrarSi: function(v){return v.modo === 'cuota';}},
{id: 'rent',etiqueta: 'Rentabilidad anual de tus ahorros (opcional)',unidad: '%',ph: '0',ayuda: 'Déjalo en 0 si guardas el dinero sin remunerar.'}
],
ejemplo:{modo: 'tiempo',meta: '10000',actual: '1000',mensual: '250',rent: '2'},
calcular: function(v){
var act = isFinite(v.actual)? v.actual : 0,rent = isFinite(v.rent)? v.rent : 0;
if(!TH.listos(v,['meta']))return{vacio: true};
if(v.meta <= 0)return{error: 'La meta de ahorro debe ser mayor que 0.'};
if(act < 0)return{error: 'Lo que ya tienes ahorrado no puede ser negativo.'};
if(rent < -50 || rent > 100)return{error: 'La rentabilidad anual debe estar entre −50 % y 100 %.'};
if(act >= v.meta)return{filas:[TH.fila('meses','Meses necesarios',0,'n0')],notas:['Con lo que ya tienes ahorrado alcanzas la meta.']};
var i = rent / 1200,n,c;
if(v.modo === 'tiempo'){
c = v.mensual;
if(!TH.listos(v,['mensual']))return{vacio: true};
if(c < 0)return{error: 'El ahorro mensual no puede ser negativo.'};
var bal = act;n = 0;
while(bal < v.meta && n < 1200){bal = bal *(1 + i)+ c;n++;if(c === 0 && i <= 0){n = 1200;break;}}
if(n >= 1200 && bal < v.meta)return{error: 'Con ese ahorro mensual no llegarías a la meta en 100 años. Aumenta lo que ahorras o la rentabilidad.'};
var aport = c * n;
return{filas:[TH.fila('meses','Tiempo necesario',n,texto),TH.fila('aportado','Dinero que habrás aportado',act + aport,'eur'),TH.fila('intereses','Intereses ganados',bal - act - aport,'eur'),TH.fila('final','Ahorro al final',bal,'eur')],
notas:['Se supone que ahorras la misma cantidad al final de cada mes y que la rentabilidad es constante.']};
}
if(!TH.listos(v,['plazo']))return{vacio: true};
n = Math.round(v.plazo);
if(n < 1 || n > 1200)return{error: 'El plazo debe estar entre 1 y 1.200 meses.'};
var f = Math.pow(1 + i,n),sobra = act * f;
c = i === 0 ?(v.meta - act)/ n :(v.meta - sobra)* i /(f - 1);
if(c <= 0)return{filas:[TH.fila('cuota','Ahorro mensual necesario',0,'eur')],notas:['Con lo que ya tienes y esa rentabilidad llegas a la meta sin aportar nada más.']};
return{filas:[TH.fila('cuota','Ahorro mensual necesario',c,'eur'),TH.fila('aportado','Dinero que aportarás',c * n,'eur'),TH.fila('intereses','Intereses ganados',v.meta - act - c * n,'eur'),TH.fila('meses','Plazo',n,texto)],
notas:['Se supone que ahorras la misma cantidad al final de cada mes y que la rentabilidad es constante.']};
}
});
});
})();

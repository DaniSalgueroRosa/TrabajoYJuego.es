(function(){
'use strict';
TH.alCargar(function(raiz){
(function(){
var z = function(x){return typeof x === 'number' && isFinite(x)? x : 0;};
TH.calculadora(raiz,{
campos:[
{id: 'ticket',etiqueta: 'Ticket medio de cada compra',unidad: '€',ph: '50',ayuda: 'Sin IVA.'},
{id: 'compras',etiqueta: 'Compras por cliente al año',unidad: 'compras',ph: '4'},
{id: 'margen',etiqueta: 'Margen bruto',unidad: '%',ph: '40'},
{id: 'modo',tipo: 'select',etiqueta: '¿Cómo conoces su permanencia?',valor: 'vida',opciones:[['vida','Sé cuántos años dura la relación'],['abandono','Sé el porcentaje que se va cada año']]},
{id: 'vida',etiqueta: 'Años de relación',unidad: 'años',ph: '3',mostrarSi: function(v){return v.modo === 'vida';}},
{id: 'abandono',etiqueta: 'Tasa de abandono anual',unidad: '%',ph: '25',mostrarSi: function(v){return v.modo === 'abandono';}},
{id: 'cac',etiqueta: 'Coste de captación del cliente, CAC (opcional)',unidad: '€',ph: '120'}
],
ejemplo:{ticket: '50',compras: '4',margen: '40',modo: 'vida',vida: '3',cac: '120'},
calcular: function(v){
var cl = v.modo === 'vida' ? 'vida' : 'abandono';
if(!TH.listos(v,['ticket','compras','margen',cl]))return{vacio: true};
var cac = z(v.cac);
if(v.ticket < 0 || v.compras < 0 || cac < 0)return{error: 'Los importes y la frecuencia no pueden ser negativos.'};
if(v.margen < 0 || v.margen > 100)return{error: 'El margen debe estar entre 0 y 100 %.'};
var vida;
if(v.modo === 'vida'){if(v.vida <= 0 || v.vida > 100)return{error: 'Los años de relación deben estar entre 0 y 100.'};vida = v.vida;}
else{if(v.abandono <= 0 || v.abandono > 100)return{error: 'La tasa de abandono debe ser mayor que 0 y no superar el 100 %.'};vida = 100 / v.abandono;}
var anual = v.ticket * v.compras,ing = anual * vida,ltv = ing * v.margen / 100;
var filas =[TH.fila('ltv','Valor de vida del cliente (LTV, sobre margen)',ltv,'eur'),TH.fila('ingresos-vida','Ingresos durante toda la relación',ing,'eur'),TH.fila('ingresos-anuales','Ingresos por cliente al año',anual,'eur'),
TH.fila('margen-anual','Margen por cliente al año',anual * v.margen / 100,'eur'),TH.fila('vida','Años de relación',vida,'n2')],avisos =[];
if(cac > 0 && ltv > 0){
var ratio = ltv / cac,mensual = anual * v.margen / 100 / 12;
filas.push(TH.fila('ltv-cac','Ratio LTV / CAC',ratio,'n2'));
if(mensual > 0)filas.push(TH.fila('payback','Meses para recuperar el CAC',cac / mensual,'n1'));
if(ratio < 3)avisos.push('El ratio LTV/CAC está por debajo de 3, la referencia habitual de salud del negocio. Merece la pena revisar el CAC, el margen o la permanencia.');
}
return{filas: filas,avisos: avisos,notas:['Modelo sencillo con valores medios constantes. No descuenta el valor del dinero en el tiempo ni distingue entre tipos de cliente.']};
}
});
})();
});
})();

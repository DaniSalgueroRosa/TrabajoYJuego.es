(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/negocio.js').then(function(){
var N = TH.negocio,z = N.n0;
var TIPOS ={std:[1.5,0.25],premium:[2.8,0.25],uk:[2.5,0.25],intl:[3.15,0.25],sepa:[0,0.35]};
function tarifa(v){
if(v.tipo === 'personalizada')return{pct: z(v.pct),fijo: z(v.fijo)};
var t = TIPOS[v.tipo],conv =(v.tipo === 'uk' || v.tipo === 'intl')&& v.conversion ? 2 : 0;
return{pct: t[0]+ conv,fijo: t[1]};
}
TH.calculadora(raiz,{
campos:[
{id: 'modo',tipo: 'select',etiqueta: '¿Qué quieres calcular?',valor: 'cobro',ancho: 'completo',opciones:[['cobro','Cuánto me queda de un cobro'],['neto','Cuánto cobrar para recibir un neto']]},
{id: 'importe',etiqueta: 'Importe que cobras',unidad: '€',ph: '100',mostrarSi: function(v){return v.modo === 'cobro';}},
{id: 'neto',etiqueta: 'Importe neto que quieres recibir',unidad: '€',ph: '100',mostrarSi: function(v){return v.modo === 'neto';}},
{id: 'tipo',tipo: 'select',etiqueta: 'Método de pago del cliente',valor: 'std',ancho: 'completo',opciones:[['std','Tarjeta estándar del EEE (1,5 % + 0,25 €)'],['premium','Tarjeta prémium del EEE (2,8 % + 0,25 €)'],['uk','Tarjeta del Reino Unido (2,5 % + 0,25 €)'],['intl','Tarjeta internacional (3,15 % + 0,25 €)'],['sepa','Adeudo directo SEPA (0,35 €)'],['personalizada','Tarifa personalizada']]},
{id: 'conversion',tipo: 'check',etiqueta: 'Con conversión de divisas (+2 %)',mostrarSi: function(v){return v.tipo === 'uk' || v.tipo === 'intl';}},
{id: 'pct',etiqueta: 'Porcentaje de comisión',unidad: '%',ph: '1,4',mostrarSi: function(v){return v.tipo === 'personalizada';}},
{id: 'fijo',etiqueta: 'Tarifa fija por cobro',unidad: '€',ph: '0,25',mostrarSi: function(v){return v.tipo === 'personalizada';}},
{id: 'cobros',etiqueta: 'Cobros al mes (opcional)',unidad: 'cobros',ph: '40',entero: true}
],
ejemplo:{modo: 'cobro',importe: '100',tipo: 'std',cobros: '40'},
calcular: function(v){
var cobro = v.modo === 'cobro',clave = cobro ? 'importe' : 'neto';
if(!TH.listos(v,[clave]))return{vacio: true};
if(v[clave]<= 0)return{error: 'El importe debe ser mayor que 0.'};
if(v.tipo === 'personalizada'){
if(!TH.listos(v,['pct']))return{vacio: true};
if(v.pct < 0 || v.pct >= 100 || z(v.fijo)< 0)return{error: 'El porcentaje debe estar entre 0 y 99,99 % y la tarifa fija no puede ser negativa.'};
}
var n = z(v.cobros);
if(n < 0 || n !== Math.floor(n))return{error: 'El número de cobros al mes debe ser un entero positivo.'};
var t = tarifa(v),imp = cobro ? v.importe : N.brutoParaNeto(v.neto,t.pct,t.fijo),com = N.comision(imp,t.pct,t.fijo),neto = imp - com;
var filas = cobro ?[TH.fila('neto','Te quedan',neto,'eur'),TH.fila('comision','Comisión de Stripe',com,'eur')]:[TH.fila('cobrar','Importe que debes cobrar',imp,'eur'),TH.fila('comision','Comisión de Stripe',com,'eur'),TH.fila('neto','Te quedan',neto,'eur')];
filas.push(TH.fila('pct-efectivo','Comisión sobre el importe cobrado',com / imp * 100,'pct'),TH.fila('pct','Porcentaje aplicado',t.pct,'pct'),TH.fila('fijo','Tarifa fija aplicada',t.fijo,'eur'));
if(n > 0)filas.push(TH.fila('comision-mes','Comisión mensual con ' + n + ' cobros',com * n,'eur'),TH.fila('neto-mes','Neto mensual',neto * n,'eur'),TH.fila('comision-anual','Comisión anual',com * n * 12,'eur'));
return{filas: filas,notas:['Tarifas estándar de Stripe para España a 15 de noviembre de 2026. No incluyen disputas (20 € por disputa recibida), Klarna ni otros productos de pago aparte.']};
}
});
},function(){
var p = document.createElement('p');p.className = 'herr-estado herr-estado--error';p.setAttribute('role','alert');
p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.';TH.vaciar(raiz).appendChild(p);
});
});
})();

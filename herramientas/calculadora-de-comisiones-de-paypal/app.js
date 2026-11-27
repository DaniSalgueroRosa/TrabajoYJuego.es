(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/negocio.js').then(function(){
var N = TH.negocio,z = N.n0;
var TIPOS ={estandar:[2.9,0.35,true],tarjeta:[1.2,0.35,true],qr: null,personalizada: null},EXTRA ={eee: 0,uk: 1.29,resto: 1.99};
function qrTarifa(importe){return importe > 10 ?{pct: 0.9,fijo: 0.1}:{pct: 1.4,fijo: 0.05};}
function origenPct(v){return v.tipo === 'personalizada' ? 0 : z(EXTRA[v.origen]);}
function base(v,importe){
if(v.tipo === 'personalizada')return{pct: z(v.pct),fijo: z(v.fijo)};
if(v.tipo === 'qr'){var q = qrTarifa(importe);return{pct: q.pct + origenPct(v),fijo: q.fijo};}
return{pct: TIPOS[v.tipo][0]+ origenPct(v),fijo: TIPOS[v.tipo][1]};
}
TH.calculadora(raiz,{
campos:[
{id: 'modo',tipo: 'select',etiqueta: '¿Qué quieres calcular?',valor: 'cobro',ancho: 'completo',opciones:[['cobro','Cuánto me queda de un cobro'],['neto','Cuánto cobrar para recibir un neto']]},
{id: 'importe',etiqueta: 'Importe que cobras',unidad: '€',ph: '100',mostrarSi: function(v){return v.modo === 'cobro';}},
{id: 'neto',etiqueta: 'Importe neto que quieres recibir',unidad: '€',ph: '100',mostrarSi: function(v){return v.modo === 'neto';}},
{id: 'tipo',tipo: 'select',etiqueta: 'Tipo de cobro',valor: 'estandar',ancho: 'completo',opciones:[['estandar','Venta de bienes o servicios (2,90 % + 0,35 €)'],['tarjeta','Pago con tarjeta sin cuenta PayPal (1,20 % + 0,35 €)'],['qr','Cobro con código QR (según importe)'],['personalizada','Tarifa personalizada']]},
{id: 'origen',tipo: 'select',etiqueta: 'Origen del comprador',valor: 'eee',opciones:[['eee','España o resto del Espacio Económico Europeo'],['uk','Reino Unido (+1,29 %)'],['resto','Resto del mundo (+1,99 %)']],mostrarSi: function(v){return v.tipo !== 'personalizada';}},
{id: 'pct',etiqueta: 'Porcentaje de comisión',unidad: '%',ph: '2,9',mostrarSi: function(v){return v.tipo === 'personalizada';}},
{id: 'fijo',etiqueta: 'Tarifa fija por cobro',unidad: '€',ph: '0,35',mostrarSi: function(v){return v.tipo === 'personalizada';}},
{id: 'cobros',etiqueta: 'Cobros al mes (opcional)',unidad: 'cobros',ph: '40',entero: true}
],
ejemplo:{modo: 'cobro',importe: '100',tipo: 'estandar',origen: 'eee',cobros: '40'},
calcular: function(v){
var cobro = v.modo === 'cobro',clave = cobro ? 'importe' : 'neto';
if(!TH.listos(v,[clave]))return{vacio: true};
if(v[clave]<= 0)return{error: 'El importe debe ser mayor que 0.'};
if(v.tipo === 'personalizada'){
if(!TH.listos(v,['pct']))return{vacio: true};
if(v.pct < 0 || v.pct >= 100 || z(v.fijo)< 0)return{error: 'El porcentaje debe estar entre 0 y 99,99 % y la tarifa fija no puede ser negativa.'};
}
var n = z(v.cobros),avisos =[],t,imp,com,neto;
if(n < 0 || n !== Math.floor(n))return{error: 'El número de cobros al mes debe ser un entero positivo.'};
if(cobro){imp = v.importe;t = base(v,imp);}
else{
t = base(v,10.01);imp = N.brutoParaNeto(v.neto,t.pct,t.fijo);
if(v.tipo === 'qr' && imp < 10.01){
var b = base(v,10);var imp2 = N.brutoParaNeto(v.neto,b.pct,b.fijo);
if(imp2 <= 10){t = b;imp = imp2;}else{imp = 10.01;avisos.push('Con un cobro QR no se puede recibir exactamente ese neto: el importe mínimo con la tarifa más baja es 10,01 €.');}
}
}
com = N.comision(imp,t.pct,t.fijo);neto = imp - com;
var filas = cobro ?[TH.fila('neto','Te quedan',neto,'eur'),TH.fila('comision','Comisión de PayPal',com,'eur')]:[TH.fila('cobrar','Importe que debes cobrar',imp,'eur'),TH.fila('comision','Comisión de PayPal',com,'eur'),TH.fila('neto','Te quedan',neto,'eur')];
filas.push(TH.fila('pct-efectivo','Comisión sobre el importe cobrado',com / imp * 100,'pct'),TH.fila('pct','Porcentaje aplicado',t.pct,'pct'),TH.fila('fijo','Tarifa fija aplicada',t.fijo,'eur'));
if(n > 0)filas.push(TH.fila('comision-mes','Comisión mensual con ' + n + ' cobros',com * n,'eur'),TH.fila('neto-mes','Neto mensual',neto * n,'eur'),TH.fila('comision-anual','Comisión anual',com * n * 12,'eur'));
return{filas: filas,avisos: avisos,notas:['Tarifas de PayPal para cuentas en España publicadas el 4 de noviembre de 2026. Los reembolsos no devuelven las tarifas pagadas al cobrar, y la conversión de divisas añade un recargo aparte.']};
}
});
},function(){
var p = document.createElement('p');p.className = 'herr-estado herr-estado--error';p.setAttribute('role','alert');
p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.';TH.vaciar(raiz).appendChild(p);
});
});
})();

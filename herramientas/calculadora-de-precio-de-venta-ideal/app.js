(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/negocio.js').then(function(){
var N = TH.negocio,z = N.n0;
TH.calculadora(raiz,{
campos:[
{id: 'coste',etiqueta: 'Coste del producto o servicio',unidad: '€',ph: '12',ayuda: 'Lo que te cuesta cada unidad: compra, fabricación o materiales, sin IVA.'},
{id: 'extra',etiqueta: 'Otros costes por unidad',unidad: '€',ph: '3',ayuda: 'Envío, embalaje, mano de obra… todo lo que gastas cada vez que vendes una unidad.'},
{id: 'comision',etiqueta: 'Comisión de la plataforma o del cobro',unidad: '%',ph: '3',ayuda: 'Porcentaje del precio que se llevan el marketplace o la pasarela de pago.'},
{id: 'fijo',etiqueta: 'Tarifa fija por venta',unidad: '€',ph: '0,25',ayuda: 'La parte fija de la comisión, si la hay.'},
{id: 'base',tipo: 'select',etiqueta: 'El beneficio que buscas es…',valor: 'ventas',ancho: 'completo',opciones:[['ventas','Un margen sobre el precio de venta'],['coste','Un recargo sobre el coste (markup)']]},
{id: 'objetivo',etiqueta: 'Margen o recargo que buscas',unidad: '%',ph: '40'},
{id: 'iva',etiqueta: 'IVA que repercutes',unidad: '%',valor: '21',ph: '21',ayuda: 'En España el tipo general es el 21 %. Pon 0 si no repercutes IVA.'}
],
ejemplo:{coste: '12',extra: '3',comision: '3',fijo: '0,25',base: 'ventas',objetivo: '40',iva: '21'},
calcular: function(v){
if(!TH.listos(v,['coste','objetivo']))return{vacio: true};
var iva = isFinite(v.iva)? v.iva : 0,o ={coste: v.coste,extra: z(v.extra),fijo: z(v.fijo),comision: z(v.comision),objetivo: v.objetivo,base: v.base};
if(v.coste < 0 || o.extra < 0 || o.fijo < 0)return{error: 'Los costes no pueden ser negativos.'};
if(v.coste + o.extra + o.fijo <= 0)return{error: 'Escribe el coste del producto: no se puede calcular un precio sobre un coste de 0 €.'};
if(o.comision < 0 || o.comision >= 100)return{error: 'La comisión debe estar entre 0 y 99 %.'};
if(v.objetivo < 0)return{error: 'El margen o el recargo no pueden ser negativos.'};
if(v.base === 'ventas' && v.objetivo >= 100)return{error: 'Un margen sobre el precio de venta no puede llegar al 100 %. Si quieres ganar más que el coste, usa el recargo sobre el coste.'};
if(iva < 0 || iva > 100)return{error: 'El IVA debe estar entre 0 y 100 %.'};
var r = N.precioIdeal(o);
if(!r)return{error: 'Con esa comisión y ese margen no queda nada para cubrir los costes: entre los dos se llevan todo el precio.'};
var filas =[TH.fila('precio','Precio de venta sin IVA',r.precio,'eur'),TH.fila('pvp','Precio final con IVA',r.precio *(1 + iva / 100),'eur'),
TH.fila('beneficio','Beneficio por unidad',r.beneficio,'eur'),TH.fila('margen','Margen sobre el precio',r.margen,'pct'),TH.fila('recargo','Recargo sobre el coste',r.recargo,'pct'),
TH.fila('comision-eur','Comisión que pagas por venta',r.comision + o.fijo,'eur'),TH.fila('iva-eur','IVA que repercutes',r.precio * iva / 100,'eur')];
var filasTabla =[10,20,30,40,50,60].map(function(m){
var t = N.precioIdeal({coste: o.coste,extra: o.extra,fijo: o.fijo,comision: o.comision,objetivo: m,base: 'ventas'});
return t ?[m + ' %',TH.eur(t.precio),TH.eur(t.precio *(1 + iva / 100)),TH.eur(t.beneficio)]:[m + ' %','No es posible','—','—'];
});
return{filas: filas,tabla:{titulo: 'Precio necesario según el margen',cab:['Margen','Precio sin IVA','Precio con IVA','Beneficio por unidad'],filas: filasTabla,cabFila: true},
notas:['El cálculo no incluye gastos generales, publicidad ni impuestos sobre el beneficio. Los costes deben ir sin IVA.']};
}
});
},function(){
var p = document.createElement('p');p.className = 'herr-estado herr-estado--error';p.setAttribute('role','alert');
p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.';TH.vaciar(raiz).appendChild(p);
});
});
})();

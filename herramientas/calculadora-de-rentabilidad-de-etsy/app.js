(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/negocio.js').then(function(){
var N = TH.negocio,z = N.n0;
TH.calculadora(raiz,{
campos:[
{id: 'total',etiqueta: 'Total que paga el comprador (artículo y envío)',unidad: '€',ph: '40'},
{id: 'iva',etiqueta: 'IVA incluido en ese total',unidad: '%',valor: '0',ayuda: 'Pon el porcentaje si el comprador paga IVA; el beneficio se calcula sin él.'},
{id: 'coste',etiqueta: 'Coste del producto o los materiales',unidad: '€',ph: '12'},
{id: 'envioReal',etiqueta: 'Coste real del envío que pagas',unidad: '€',ph: '4'},
{id: 'embalaje',etiqueta: 'Embalaje',unidad: '€',ph: '1'},
{id: 'otros',etiqueta: 'Otros costes del pedido',unidad: '€',ph: '0'},
{id: 'publicacion',etiqueta: 'Tarifa de publicación por venta (aprox.)',unidad: '€',valor: '0,18'},
{id: 'transPct',etiqueta: 'Tarifa de transacción',unidad: '%',valor: '6,5'},
{id: 'procPct',etiqueta: 'Procesamiento de pagos',unidad: '%',valor: '4'},
{id: 'procFijo',etiqueta: 'Procesamiento de pagos: parte fija',unidad: '€ por pedido',valor: '0,3'},
{id: 'regPct',etiqueta: 'Tarifa regulatoria operativa (orientativa)',unidad: '%',valor: '0,88',ayuda: 'Confirma el valor de España en tu panel de vendedor.'},
{id: 'offsite',tipo: 'select',etiqueta: 'Venta desde Offsite Ads',valor: '0',opciones:[['0','No'],['12','Sí, con tarifa del 12 %'],['15','Sí, con tarifa del 15 %']]},
{id: 'publicidad',etiqueta: 'Etsy Ads por pedido (opcional)',unidad: '€',ph: '0'}
],
ejemplo:{total: '40',iva: '0',coste: '12',envioReal: '4',embalaje: '1',otros: '0',publicacion: '0,18',transPct: '6,5',procPct: '4',procFijo: '0,3',regPct: '0,88',offsite: '0',publicidad: '0'},
calcular: function(v){
if(!TH.listos(v,['total','coste']))return{vacio: true};
var vals =[v.coste,v.envioReal,v.embalaje,v.otros,v.publicacion,v.procFijo,v.publicidad];
if(v.total <= 0)return{error: 'El total que paga el comprador debe ser mayor que 0.'};
if(vals.some(function(x){return z(x)< 0;}))return{error: 'Los costes y las tarifas no pueden ser negativos.'};
if(z(v.iva)< 0 || z(v.iva)> 50)return{error: 'El IVA debe estar entre 0 y 50 %.'};
if([v.transPct,v.procPct,v.regPct].some(function(x){return z(x)< 0 || z(x)> 40;}))return{error: 'Los porcentajes de las tarifas deben estar entre 0 y 40 %.'};
var r = N.etsy({total: v.total,iva: z(v.iva),coste: v.coste,envioReal: z(v.envioReal),embalaje: z(v.embalaje),publicacion: z(v.publicacion),transPct: z(v.transPct),procPct: z(v.procPct),procFijo: z(v.procFijo),
regPct: z(v.regPct),offsite: +v.offsite,publicidad: z(v.publicidad),otros: z(v.otros)});
var filas =[TH.fila('beneficio','Beneficio por pedido',r.beneficio,'eur'),TH.fila('margen','Margen sobre el importe sin IVA',r.margen,'pct'),TH.fila('tarifas','Tarifas totales de Etsy',r.tarifas,'eur'),TH.fila('pct-tarifas','Tarifas sobre el importe sin IVA',r.pctTarifas,'pct'),
TH.fila('transaccion','Tarifa de transacción',r.transaccion,'eur'),TH.fila('procesamiento','Procesamiento de pagos',r.procesamiento,'eur'),TH.fila('regulatoria','Tarifa regulatoria operativa',r.regulatoria,'eur'),
TH.fila('offsite-eur','Offsite Ads',r.offsite,'eur'),TH.fila('costes','Costes del pedido (producto, envío, embalaje, otros)',r.costes,'eur')];
if(isFinite(r.totalMinimo))filas.push(TH.fila('total-minimo','Total mínimo del comprador para no perder dinero',r.totalMinimo,'eur'));
var avisos =[];
if(r.beneficio < 0)avisos.push('Este pedido te hace perder dinero con las tarifas y costes indicados.');
return{filas: filas,avisos: avisos,notas:['La tarifa regulatoria y la de publicación son orientativas y Etsy puede añadir IVA a sus tarifas. La transacción y Offsite Ads se calculan sobre el importe sin impuestos, y el procesamiento y la regulatoria, sobre el total pagado.']};
}
});
},function(){
var p = document.createElement('p');p.className = 'herr-estado herr-estado--error';p.setAttribute('role','alert');
p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.';TH.vaciar(raiz).appendChild(p);
});
});
})();

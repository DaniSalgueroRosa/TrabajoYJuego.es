(function(){
'use strict';
TH.alCargar(function(raiz){
(function(){
var z = function(x){return typeof x === 'number' && isFinite(x)? x : 0;};
TH.calculadora(raiz,{
campos:[
{id: 'factura',tipo: 'fecha',etiqueta: 'Fecha de la factura',valor: 'hoy'},
{id: 'plazo',etiqueta: 'Plazo de pago',unidad: 'días',valor: '30',entero: true},
{id: 'modo',tipo: 'select',etiqueta: 'El plazo cuenta desde',valor: 'factura',opciones:[['factura','La fecha de la factura'],['finmes','El final del mes de la factura']]},
{id: 'diaPago',etiqueta: 'Día de pago fijo del mes (opcional)',unidad: 'día',ph: '5',entero: true,ayuda: 'Entre 1 y 28.'},
{id: 'cuotas',tipo: 'select',etiqueta: 'Pagos',valor: '1',opciones:[['1','Un solo pago'],['2','2 pagos'],['3','3 pagos'],['4','4 pagos'],['6','6 pagos']]},
{id: 'importe',etiqueta: 'Importe de la factura (opcional)',unidad: '€',ph: '1200'},
{id: 'hoy',tipo: 'fecha',etiqueta: 'Comparar con la fecha',valor: 'hoy'}
],
ejemplo:{factura: '2026-03-15',plazo: '30',modo: 'factura',diaPago: '',cuotas: '1',importe: '1200',hoy: '2026-04-01'},
calcular: function(v){
if(!v.factura || !TH.listos(v,['plazo']))return{vacio: true};
var f = TH.fechaUTC(v.factura),hoy = TH.fechaUTC(v.hoy || TH.hoyISO()),dp = isFinite(v.diaPago)? v.diaPago : null,imp = z(v.importe),n = +v.cuotas;
if(!f || !hoy)return{error: 'Escribe fechas válidas.'};
if(v.plazo < 0 || v.plazo > 730 || v.plazo !== Math.floor(v.plazo))return{error: 'El plazo debe ser un número entero de días entre 0 y 730.'};
if(dp !== null &&(dp < 1 || dp > 28 || dp !== Math.floor(dp)))return{error: 'El día de pago debe ser un número entero entre 1 y 28.'};
if(imp < 0)return{error: 'El importe no puede ser negativo.'};
var base = v.modo === 'finmes' ? new Date(Date.UTC(f.getUTCFullYear(),f.getUTCMonth()+ 1,0,12)): f;
function ajustar(d){
if(dp === null)return d;
if(d.getUTCDate()<= dp)return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),dp,12));
return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+ 1,dp,12));
}
var venc = ajustar(TH.sumarDias(base,v.plazo)),dias = TH.dias(hoy,venc),plazoReal = TH.dias(f,venc),avisos =[];
var estado = dias > 0 ? 'Vence en ' + TH.pl(dias,'día','días'): dias === 0 ? 'Vence hoy' : 'Vencida hace ' + TH.pl(-dias,'día','días');
if(plazoReal > 60)avisos.push('El plazo real desde la fecha de la factura (' + plazoReal + ' días) supera los 60 días que la ley fija como máximo entre empresas.');
var filas =[TH.fila('vencimiento','Fecha de vencimiento',TH.fechaLarga(venc),'txt'),TH.fila('estado','Estado',estado,'txt'),TH.fila('dias-restantes','Días hasta el vencimiento (negativo si ya venció)',dias,'n0'),TH.fila('plazo-real','Días desde la factura hasta el vencimiento',plazoReal,'n0'),
TH.fila('limite-legal','Último día del plazo máximo legal de 60 días',TH.fechaLarga(TH.sumarDias(f,60)),'txt')],tabla;
if(n > 1){
var filasT =[],i,d;
for(i = 0;i < n;i++){d = ajustar(TH.sumarDias(TH.sumarDias(base,v.plazo),30 * i));filasT.push([String(i + 1),TH.fechaCorta(d),imp > 0 ? TH.eur(imp / n): '—']);}
tabla ={titulo: 'Calendario de pagos',cab:['Pago','Vencimiento','Importe'],filas: filasT,cabFila: true};
filas.push(TH.fila('ultimo','Último vencimiento',filasT[filasT.length - 1][1],'txt'));
}
return{filas: filas,avisos: avisos,tabla: tabla,notas:['Días naturales. Si el vencimiento cae en festivo o fin de semana, confirma con la otra parte cuándo se paga. Referencia general: consulta tu caso con tu asesor.']};
}
});
})();
});
})();

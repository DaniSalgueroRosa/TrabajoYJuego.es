(function(){
'use strict';
TH.alCargar(function(raiz){
function amortizacion(P,tin,n){
var r = tin / 1200,c = r === 0 ? P / n : P * r /(1 - Math.pow(1 + r,-n)),saldo = P,filas =[],ia = 0,ca = 0,cuotasA = 0,meses = 0;
var agrupar = n > 24,hasta = 0;
for(var m = 1;m <= n;m++){
var i = saldo * r,k = m === n ? saldo : c - i;
saldo = m === n ? 0 : saldo - k;ia += i;ca += k;cuotasA += i + k;meses++;
if(!agrupar || m % 12 === 0 || m === n){
filas.push([agrupar ? 'Año ' + Math.ceil(m / 12): 'Mes ' + m,TH.eur(cuotasA),TH.eur(ia),TH.eur(ca),TH.eur(Math.max(0,saldo))]);
ia = 0;ca = 0;cuotasA = 0;meses = 0;
}
}
return{cuota: c,tabla:{titulo: agrupar ? 'Evolución año a año' : 'Evolución mes a mes',cab:[agrupar ? 'Año' : 'Mes',agrupar ? 'Pagado en el año' : 'Cuota','Intereses','Capital amortizado','Capital pendiente'],filas: filas,cabFila: true}};
}
TH.calculadora(raiz,{
campos:[
{id: 'precio',etiqueta: 'Precio de la vivienda (opcional)',unidad: '€',ph: '200.000'},
{id: 'importe',etiqueta: 'Importe de la hipoteca',unidad: '€',ph: '150.000'},
{id: 'plazo',etiqueta: 'Plazo',unidad: 'años',ph: '25',entero: true},
{id: 'tipo',etiqueta: 'Tipo de interés nominal anual (TIN)',unidad: '%',ph: '3',ayuda: 'Es el interés que aparece en la oferta, sin comisiones.'}
],
ejemplo:{precio: '200000',importe: '150000',plazo: '25',tipo: '3'},
calcular: function(v){
if(!TH.listos(v,['importe','plazo','tipo']))return{vacio: true};
if(v.importe <= 0)return{error: 'El importe de la hipoteca debe ser mayor que 0.'};
if(v.plazo < 1 || v.plazo > 50)return{error: 'El plazo debe estar entre 1 y 50 años.'};
if(v.tipo < 0 || v.tipo > 30)return{error: 'El tipo de interés debe estar entre 0 y 30 %.'};
var n = Math.round(v.plazo * 12),a = amortizacion(v.importe,v.tipo,n),total = a.cuota * n,filas =[
TH.fila('cuota','Cuota mensual',a.cuota,'eur'),TH.fila('intereses','Intereses totales',total - v.importe,'eur'),
TH.fila('total','Total a pagar (capital más intereses)',total,'eur'),TH.fila('primer-mes','Intereses del primer mes',v.importe * v.tipo / 1200,'eur')],avisos =[];
if(typeof v.precio === 'number' && isFinite(v.precio)&& v.precio > 0){
if(v.importe > v.precio)avisos.push('El importe de la hipoteca es mayor que el precio de la vivienda: revisa los datos.');
else{filas.push(TH.fila('entrada','Entrada que tendrías que aportar',v.precio - v.importe,'eur'));filas.push(TH.fila('ltv','Parte del precio que financias',v.importe / v.precio * 100,'pct'));}
}
return{filas: filas,avisos: avisos,tabla: a.tabla,notas:['Cálculo con cuota constante (sistema francés) y tipo de interés fijo. No incluye notaría, registro, impuestos, tasación, comisiones ni seguros, que encarecen el coste real. La TAE de tu oferta será mayor que el TIN.']};
}
});
});
})();

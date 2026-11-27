(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/negocio.js').then(function(){
var N = TH.negocio,z = N.n0;
var ACT =[['efectivo','Efectivo y cuentas bancarias'],['inversiones','Inversiones (fondos, acciones, depósitos)'],['vivienda','Vivienda (valor de mercado)'],['vehiculos','Vehículos'],['otros','Otros bienes con valor']];
TH.calculadora(raiz,{
campos:[
{id: 'efectivo',etiqueta: 'Efectivo y cuentas bancarias',unidad: '€',ph: '8000'},
{id: 'inversiones',etiqueta: 'Inversiones (fondos, acciones, depósitos)',unidad: '€',ph: '15000'},
{id: 'vivienda',etiqueta: 'Vivienda (valor de mercado)',unidad: '€',ph: '220000'},
{id: 'vehiculos',etiqueta: 'Vehículos (valor de venta)',unidad: '€',ph: '9000'},
{id: 'otros',etiqueta: 'Otros bienes con valor',unidad: '€',ph: '3000'},
{id: 'hipoteca',etiqueta: 'Capital pendiente de la hipoteca',unidad: '€',ph: '140000'},
{id: 'prestamos',etiqueta: 'Préstamos personales y de vehículos',unidad: '€',ph: '6000'},
{id: 'tarjetas',etiqueta: 'Saldo de tarjetas y compras aplazadas',unidad: '€',ph: '800'},
{id: 'deudas',etiqueta: 'Otras deudas',unidad: '€',ph: '0'},
{id: 'gastos',etiqueta: 'Gastos mensuales (opcional)',unidad: '€',ph: '1800',ayuda: 'Para calcular cuántos meses cubre tu dinero líquido.'}
],
ejemplo:{efectivo: '8000',inversiones: '15000',vivienda: '220000',vehiculos: '9000',otros: '3000',hipoteca: '140000',prestamos: '6000',tarjetas: '800',deudas: '0',gastos: '1800'},
calcular: function(v){
var ids =['efectivo','inversiones','vivienda','vehiculos','otros','hipoteca','prestamos','tarjetas','deudas','gastos'];
if(!ids.some(function(k){return z(v[k])!== 0;}))return{vacio: true};
if(ids.some(function(k){return z(v[k])< 0;}))return{error: 'Ningún importe puede ser negativo: las deudas se escriben como cantidades positivas en su campo.'};
var act = z(v.efectivo)+ z(v.inversiones)+ z(v.vivienda)+ z(v.vehiculos)+ z(v.otros),pas = z(v.hipoteca)+ z(v.prestamos)+ z(v.tarjetas)+ z(v.deudas),neto = act - pas;
var liq = z(v.efectivo)+ z(v.inversiones),filas =[TH.fila('neto','Patrimonio neto',neto,'eur'),TH.fila('activos','Total de lo que tienes',act,'eur'),TH.fila('pasivos','Total de lo que debes',pas,'eur')];
if(act > 0)filas.push(TH.fila('deuda-activos','Deuda sobre activos',pas / act * 100,'pct'));
filas.push(TH.fila('liquidos','Patrimonio líquido (efectivo e inversiones)',liq,'eur'),TH.fila('sin-vivienda','Patrimonio sin la vivienda ni su hipoteca',neto - z(v.vivienda)+ z(v.hipoteca),'eur'));
if(z(v.gastos)> 0)filas.push(TH.fila('cobertura','Meses de gastos cubiertos con tu dinero líquido',liq / z(v.gastos),'n1'));
var avisos =[];
if(neto < 0)avisos.push('Tu patrimonio neto es negativo: las deudas superan a lo que tienes. Reducir deudas caras es la forma más directa de mejorarlo.');
var tabla = act > 0 ?{titulo: 'Reparto de tus activos',cab:['Partida','Importe','% del total'],cabFila: true,
filas: ACT.filter(function(a){return z(v[a[0]])> 0;}).map(function(a){return[a[1],TH.eur(z(v[a[0]])),TH.pct(z(v[a[0]])/ act * 100)];})}: undefined;
return{filas: filas,avisos: avisos,tabla: tabla,notas:['El patrimonio sin vivienda resta el valor de la vivienda y suma la hipoteca pendiente, suponiendo que esa hipoteca corresponde a la vivienda indicada.']};
}
});
},function(){
var p = document.createElement('p');p.className = 'herr-estado herr-estado--error';p.setAttribute('role','alert');
p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.';TH.vaciar(raiz).appendChild(p);
});
});
})();

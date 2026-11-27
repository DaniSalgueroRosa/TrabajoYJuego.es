(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/negocio.js').then(function(){
var N = TH.negocio,z = N.n0;
TH.calculadora(raiz,{
campos:[
{id: 'saldo',etiqueta: 'Saldo inicial en caja',unidad: '€',ph: '10000'},
{id: 'meses',etiqueta: 'Meses a proyectar',unidad: 'meses',ph: '12',entero: true,ayuda: 'Entre 1 y 36.'},
{id: 'ingresos',etiqueta: 'Ingresos del primer mes',unidad: '€',ph: '6000',ayuda: 'Lo que cobrarás de verdad ese mes, sin IVA.'},
{id: 'crecimiento',etiqueta: 'Crecimiento mensual de los ingresos',unidad: '%',ph: '2',ayuda: 'Puede ser negativo si esperas que bajen.'},
{id: 'fijos',etiqueta: 'Gastos fijos al mes',unidad: '€',ph: '3500'},
{id: 'variables',etiqueta: 'Gastos variables',unidad: '% de los ingresos',ph: '30'},
{tipo: 'lista',id: 'extra',etiqueta: 'Cobros y pagos puntuales',inicial: 2,max: 20,textoAnadir: 'Añadir movimiento',
columnas:[{id: 'mes',etiqueta: 'Mes',tipo: 'numero',ph: '3',entero: true},{id: 'importe',etiqueta: 'Importe (€, negativo si es un pago)',tipo: 'numero',ph: '-5000'},{id: 'concepto',etiqueta: 'Concepto',tipo: 'texto',ph: 'Compra de equipo'}]}
],
ejemplo:{saldo: '10000',meses: '12',ingresos: '6000',crecimiento: '2',fijos: '3500',variables: '30',extra:[{mes: '3',importe: '-5000',concepto: 'Compra de equipo'},{mes: '6',importe: '8000',concepto: 'Subvención'}]},
calcular: function(v){
if(!TH.listos(v,['saldo','meses','ingresos']))return{vacio: true};
var n = v.meses,cr = z(v.crecimiento),fj = z(v.fijos),vr = z(v.variables);
if(n < 1 || n > 36 || n !== Math.floor(n))return{error: 'Los meses deben ser un número entero entre 1 y 36.'};
if(v.ingresos < 0 || fj < 0)return{error: 'Los ingresos y los gastos fijos no pueden ser negativos.'};
if(vr < 0 || vr > 100)return{error: 'Los gastos variables deben estar entre 0 y 100 % de los ingresos.'};
if(cr <= -100 || cr > 100)return{error: 'El crecimiento mensual debe estar entre −99 y 100 %.'};
var extras ={},fuera = 0;
(v.extra ||[]).forEach(function(f){
if(!isFinite(f.mes)|| !isFinite(f.importe))return;
var m = Math.round(f.mes);
if(m < 1 || m > n){fuera++;return;}
extras[m]=(extras[m]|| 0)+ f.importe;
});
var saldo = v.saldo,minS = Infinity,minM = 0,neg = null,ti = 0,tg = 0,te = 0,filas =[],m,inc,gas,ex;
for(m = 1;m <= n;m++){
inc = v.ingresos * Math.pow(1 + cr / 100,m - 1);gas = fj + inc * vr / 100;ex = extras[m]|| 0;
saldo += inc - gas + ex;ti += inc;tg += gas;te += ex;
if(saldo < minS){minS = saldo;minM = m;}
if(neg === null && saldo < 0)neg = m;
filas.push(['Mes ' + m,TH.eur(inc),TH.eur(gas),TH.eur(ex),TH.eur(inc - gas + ex),TH.eur(saldo)]);
}
var avisos =[];
if(neg !== null)avisos.push('Tu saldo se queda en negativo en el mes ' + neg + ': antes de esa fecha necesitarás financiación, cobrar antes, pagar después o recortar gastos.');
if(fuera)avisos.push(fuera === 1 ? 'Un movimiento puntual está fuera de los meses proyectados y no se ha contado.' : fuera + ' movimientos puntuales están fuera de los meses proyectados y no se han contado.');
return{filas:[TH.fila('saldo-final','Saldo al final de los ' + n + ' meses',saldo,'eur'),TH.fila('saldo-minimo','Saldo mínimo',minS,'eur'),TH.fila('mes-minimo','Mes del saldo mínimo',minM,'n0'),
TH.fila('primer-negativo','Primer mes con saldo negativo',neg === null ? 'Ninguno' : 'Mes ' + neg,'txt'),TH.fila('ingresos-total','Ingresos del periodo',ti,'eur'),TH.fila('gastos-total','Gastos del periodo',tg,'eur'),
TH.fila('extra-total','Movimientos puntuales (neto)',te,'eur'),TH.fila('flujo-medio','Variación media del saldo al mes',(saldo - v.saldo)/ n,'eur')],
avisos: avisos,tabla:{titulo: 'Flujo de caja mes a mes',cab:['Mes','Ingresos','Gastos','Puntuales','Flujo del mes','Saldo'],filas: filas,cabFila: true},
notas:['Proyección sencilla con crecimiento constante. Los cobros se consideran en el mes en que escribes que los recibirás.']};
}
});
},function(){
var p = document.createElement('p');p.className = 'herr-estado herr-estado--error';p.setAttribute('role','alert');
p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.';TH.vaciar(raiz).appendChild(p);
});
});
})();

(function(){
'use strict';
TH.alCargar(function(raiz){
TH.calculadora(raiz,{
campos:[{tipo: 'lista',id: 'personas',etiqueta: 'Personas y lo que ha pagado cada una',columnas:[{id: 'nombre',etiqueta: 'Nombre',tipo: 'texto',ph: 'Nombre'},{id: 'pagado',etiqueta: 'Ha pagado (€)',ph: '0'}],inicial: 3,min: 2,max: 30,textoAnadir: 'Añadir persona'}],
ejemplo:{personas:[{nombre: 'Ana',pagado: '100'},{nombre: 'Luis',pagado: '50'},{nombre: 'Marta',pagado: '0'},{nombre: 'Pablo',pagado: '0'}]},
vacio: 'Escribe cuánto ha pagado cada persona (puede ser 0) y verás cómo repartirlo.',
calcular: function(v){
var gente = v.personas.map(function(p,i){return{nombre:(p.nombre || '').trim()|| 'Persona ' +(i + 1),cent: isFinite(p.pagado)? Math.round(p.pagado * 100): 0,mal: p.pagado !== p.pagado && false};});
if(v.personas.some(function(p){return isFinite(p.pagado)&& p.pagado < 0;}))return{error: 'Los importes no pueden ser negativos.'};
var total = gente.reduce(function(s,p){return s + p.cent;},0),n = gente.length;
if(total === 0)return{vacio: true};
var base = Math.floor(total / n),resto = total - base * n,eur = function(c){return TH.eur(c / 100);};
gente.forEach(function(p,i){p.debe = base +(i < resto ? 1 : 0);p.saldo = p.cent - p.debe;});
var acreedores = gente.filter(function(p){return p.saldo > 0;}).map(function(p){return{n: p.nombre,c: p.saldo};}),deudores = gente.filter(function(p){return p.saldo < 0;}).map(function(p){return{n: p.nombre,c: -p.saldo};});
function mayor(a,b){return b.c - a.c;}
var pagos =[];
while(acreedores.length && deudores.length){
acreedores.sort(mayor);deudores.sort(mayor);
var a = acreedores[0],d = deudores[0],m = Math.min(a.c,d.c);
pagos.push({de: d.n,a: a.n,c: m});a.c -= m;d.c -= m;
if(a.c === 0)acreedores.shift();if(d.c === 0)deudores.shift();
}
var filas =[TH.fila('total','Total gastado',total / 100,'eur'),TH.fila('cada','Le corresponde a cada persona',total / n / 100,'eur')];
if(!pagos.length)filas.push(TH.fila('pagos','Pagos necesarios',0,'n0'));
pagos.forEach(function(p,i){filas.push(TH.fila('pago-' +(i + 1),p.de + ' paga a ' + p.a,p.c / 100,'eur'));});
return{filas: filas,tabla:{titulo: 'Saldo de cada persona',cab:['Persona','Ha pagado','Le corresponde','Saldo'],cabFila: true,
filas: gente.map(function(p){return[p.nombre,eur(p.cent),eur(p.debe),(p.saldo > 0 ? '+' : p.saldo < 0 ? '−' : '')+ eur(Math.abs(p.saldo))];})},
notas:[pagos.length ? 'Con ' + TH.pl(pagos.length,'pago','pagos')+ ' queda todo saldado. Un saldo positivo significa que le deben dinero; uno negativo, que debe.' : 'Todo está equilibrado: nadie debe nada.'].concat(resto ?['Si el total no se divide exactamente, los céntimos sobrantes se reparten entre las primeras personas de la lista.']:[])};
}
});
});
})();

(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/negocio.js').then(function(){
var N = TH.negocio,z = N.n0;
TH.calculadora(raiz,{
campos:[
{id: 'precio',etiqueta: 'Precio de la vivienda',unidad: '€',ph: '250000'},
{id: 'entrada',etiqueta: 'Entrada que aportas',unidad: '% del precio',valor: '20'},
{id: 'gastosCompra',etiqueta: 'Gastos de compra (impuestos, notaría, registro…)',unidad: '% del precio',valor: '10'},
{id: 'tin',etiqueta: 'Interés de la hipoteca',unidad: '%',ph: '3,5'},
{id: 'plazo',etiqueta: 'Plazo de la hipoteca',unidad: 'años',valor: '30',entero: true},
{id: 'costes',etiqueta: 'IBI, comunidad, seguro y mantenimiento',unidad: '€ al año',ph: '2400'},
{id: 'revalorizacion',etiqueta: 'Revalorización anual de la vivienda',unidad: '%',valor: '2'},
{id: 'venta',etiqueta: 'Costes de vender la vivienda',unidad: '% del valor',valor: '3'},
{id: 'alquiler',etiqueta: 'Alquiler mensual de una vivienda equivalente',unidad: '€',ph: '900'},
{id: 'subida',etiqueta: 'Subida anual del alquiler',unidad: '%',valor: '2'},
{id: 'inflacion',etiqueta: 'Subida anual de los costes de la vivienda',unidad: '%',valor: '2'},
{id: 'rent',etiqueta: 'Rentabilidad anual de lo que inviertes',unidad: '%',valor: '4'},
{id: 'horizonte',etiqueta: 'Años que vas a vivir allí',unidad: 'años',valor: '15',entero: true}
],
ejemplo:{precio: '250000',entrada: '20',gastosCompra: '10',tin: '3,5',plazo: '30',costes: '2400',revalorizacion: '2',venta: '3',alquiler: '900',subida: '2',inflacion: '2',rent: '4',horizonte: '15'},
calcular: function(v){
if(!TH.listos(v,['precio','entrada','gastosCompra','tin','plazo','costes','revalorizacion','venta','alquiler','subida','inflacion','rent','horizonte']))return{vacio: true};
if(v.precio <= 0 || v.alquiler < 0 || v.costes < 0)return{error: 'El precio debe ser mayor que 0 y el alquiler y los costes no pueden ser negativos.'};
if(v.entrada < 0 || v.entrada > 100 || v.gastosCompra < 0 || v.gastosCompra > 30 || v.venta < 0 || v.venta > 30)return{error: 'La entrada debe estar entre 0 y 100 %, y los gastos de compra y de venta entre 0 y 30 %.'};
if(v.tin < 0 || v.tin > 30)return{error: 'El interés de la hipoteca debe estar entre 0 y 30 %.'};
if(v.plazo < 1 || v.plazo > 40 || v.plazo !== Math.floor(v.plazo))return{error: 'El plazo debe ser un número entero de años entre 1 y 40.'};
if(v.horizonte < 1 || v.horizonte > 50 || v.horizonte !== Math.floor(v.horizonte))return{error: 'Los años de permanencia deben ser un número entero entre 1 y 50.'};
if([v.revalorizacion,v.subida,v.inflacion,v.rent].some(function(x){return x < -20 || x > 30;}))return{error: 'Las variaciones anuales deben estar entre −20 y 30 %.'};
var r = N.alquilerVsCompra({precio: v.precio,entradaPct: v.entrada,gastosCompraPct: v.gastosCompra,tin: v.tin,plazo: v.plazo,costesAnuales: v.costes,inflacion: v.inflacion,revalorizacion: v.revalorizacion,
ventaPct: v.venta,alquiler: v.alquiler,subidaAlquiler: v.subida,rentInversion: v.rent,horizonte: v.horizonte});
var u = r.filas[r.filas.length - 1],gana = u.diferencia > 0 ? 'Comprar' : 'Alquilar e invertir';
var filas =[TH.fila('veredicto','Opción con más patrimonio a los ' + v.horizonte + ' años',gana,'txt'),TH.fila('diferencia','Ventaja de esa opción',Math.abs(u.diferencia),'eur'),
TH.fila('compra-final','Patrimonio comprando',u.compra,'eur'),TH.fila('alquila-final','Patrimonio alquilando e invirtiendo',u.alquila,'eur'),
TH.fila('cruce','Primer año en que comprar supera a alquilar',r.cruce === null ? 'No ocurre en este periodo' : 'Año ' + r.cruce,'txt'),
TH.fila('cuota','Cuota mensual de la hipoteca',r.cuota,'eur'),TH.fila('desembolso','Entrada y gastos de compra',r.entrada + r.gastos,'eur'),TH.fila('valor-final','Valor de la vivienda al final',u.valor,'eur'),TH.fila('deuda-final','Hipoteca pendiente al final',u.deuda,'eur')];
return{filas: filas,tabla:{titulo: 'Evolución año a año',cab:['Año','Valor de la vivienda','Hipoteca pendiente','Patrimonio comprando','Patrimonio alquilando','Diferencia'],cabFila: true,
filas: r.filas.map(function(f){return['Año ' + f.anio,TH.eur(f.valor),TH.eur(f.deuda),TH.eur(f.compra),TH.eur(f.alquila),TH.eur(f.diferencia)];})},
notas:['Cada mes, quien desembolsa menos invierte la diferencia a la rentabilidad indicada. Rentabilidades constantes e impuestos de la inversión no incluidos. La diferencia es patrimonio comprando menos patrimonio alquilando.']};
}
});
},function(){
var p = document.createElement('p');p.className = 'herr-estado herr-estado--error';p.setAttribute('role','alert');
p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.';TH.vaciar(raiz).appendChild(p);
});
});
})();

(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/negocio.js').then(function(){
var N = TH.negocio,z = N.n0;
TH.calculadora(raiz,{
campos:[
{id: 'gasto',etiqueta: 'Gasto en publicidad',unidad: '€',ph: '1000'},
{id: 'ingresos',etiqueta: 'Ingresos atribuidos a la campaña',unidad: '€',ph: '4500'},
{id: 'margen',etiqueta: 'Margen bruto del producto (opcional)',unidad: '%',ph: '40',ayuda: 'Tras coste del producto, comisiones y logística, sin contar la publicidad.'},
{id: 'pedidos',etiqueta: 'Pedidos conseguidos (opcional)',unidad: 'pedidos',ph: '90',entero: true},
{id: 'clics',etiqueta: 'Clics recibidos (opcional)',unidad: 'clics',ph: '3000',entero: true},
{id: 'objetivo',etiqueta: 'ROAS que quieres alcanzar (opcional)',unidad: '×',ph: '5'}
],
ejemplo:{gasto: '1000',ingresos: '4500',margen: '40',pedidos: '90',clics: '3000',objetivo: '5'},
calcular: function(v){
if(!TH.listos(v,['gasto','ingresos']))return{vacio: true};
var mg = isFinite(v.margen)? v.margen : null,ped = z(v.pedidos),cl = z(v.clics),ob = z(v.objetivo);
if(v.gasto <= 0)return{error: 'El gasto en publicidad debe ser mayor que 0.'};
if(v.ingresos < 0 || ped < 0 || cl < 0 || ob < 0)return{error: 'Los ingresos, los pedidos, los clics y el objetivo no pueden ser negativos.'};
if(mg !== null &&(mg <= 0 || mg > 100))return{error: 'El margen bruto debe ser mayor que 0 y no superar el 100 %.'};
var roas = v.ingresos / v.gasto,filas =[TH.fila('roas','ROAS',roas,'n2'),TH.fila('acos','ACOS (gasto ÷ ingresos)',roas > 0 ? 100 / roas : NaN,'pct')],avisos =[];
if(mg !== null){
var eq = 100 / mg,ben = v.ingresos * mg / 100 - v.gasto;
filas.push(TH.fila('roas-equilibrio','ROAS de equilibrio con tu margen',eq,'n2'),TH.fila('beneficio','Beneficio de la campaña',ben,'eur'),TH.fila('roi','Retorno sobre el gasto publicitario',ben / v.gasto * 100,'pct'));
if(roas < eq)avisos.push('Tu ROAS está por debajo del de equilibrio: la campaña cuesta más de lo que deja con ese margen.');
}
if(ped > 0)filas.push(TH.fila('cpa','Coste por pedido',v.gasto / ped,'eur'),TH.fila('ticket','Ticket medio',v.ingresos / ped,'eur'));
if(cl > 0)filas.push(TH.fila('cpc','Coste por clic',v.gasto / cl,'eur'));
if(ped > 0 && cl > 0)filas.push(TH.fila('conversion','Tasa de conversión',ped / cl * 100,'pct'));
if(ob > 0)filas.push(TH.fila('ingresos-objetivo','Ingresos necesarios con ROAS ' + TH.fmt(ob,[0,2]),v.gasto * ob,'eur'));
return{filas: filas,avisos: avisos,notas:['El ROAS depende de cómo atribuya las ventas cada plataforma. Compara siempre con el ROAS de equilibrio de tu margen, no con una cifra genérica.']};
}
});
},function(){
var p = document.createElement('p');p.className = 'herr-estado herr-estado--error';p.setAttribute('role','alert');
p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.';TH.vaciar(raiz).appendChild(p);
});
});
})();

(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/negocio.js').then(function(){
var N = TH.negocio,z = N.n0;
TH.calculadora(raiz,{
campos:[
{id: 'importe',etiqueta: 'Importe que necesitas',unidad: '€',ph: '20000'},
{tipo: 'lista',id: 'ofertas',etiqueta: 'Ofertas a comparar',inicial: 2,min: 2,max: 5,textoAnadir: 'Añadir oferta',
columnas:[{id: 'nombre',etiqueta: 'Nombre (opcional)',tipo: 'texto',ph: 'Banco A'},{id: 'tin',etiqueta: 'TIN (%)',tipo: 'numero',ph: '7'},{id: 'meses',etiqueta: 'Plazo (meses)',tipo: 'numero',ph: '48'},
{id: 'apertura',etiqueta: 'Apertura (%)',tipo: 'numero',ph: '1,5'},{id: 'gastos',etiqueta: 'Gastos únicos (€)',tipo: 'numero',ph: '0'},{id: 'seguro',etiqueta: 'Seguro (€/mes)',tipo: 'numero',ph: '15'}]}
],
ejemplo:{importe: '20000',ofertas:[{nombre: 'Banco A',tin: '7',meses: '48',apertura: '0',gastos: '0',seguro: '0'},{nombre: 'Banco B',tin: '5,5',meses: '60',apertura: '1,5',gastos: '0',seguro: '15'}]},
calcular: function(v){
if(!TH.listos(v,['importe']))return{vacio: true};
if(v.importe <= 0)return{error: 'El importe debe ser mayor que 0.'};
var of =[],err = null;
(v.ofertas ||[]).forEach(function(f,i){
if(err || !isFinite(f.tin)|| !isFinite(f.meses))return;
var ap = z(f.apertura),gs = z(f.gastos),sg = z(f.seguro),nom =(f.nombre || '').trim()|| 'Oferta ' +(i + 1),pre = nom + ': ';
if(f.meses < 1 || f.meses > 480 || f.meses !== Math.floor(f.meses)){err = pre + 'el plazo debe ser un número entero de meses entre 1 y 480.';return;}
if(f.tin < 0 || f.tin > 40){err = pre + 'el tipo de interés debe estar entre 0 y 40 %.';return;}
if(ap < 0 || ap > 20 || gs < 0 || sg < 0){err = pre + 'la comisión debe estar entre 0 y 20 % y los gastos y el seguro no pueden ser negativos.';return;}
var p = N.prestamo({importe: v.importe,tin: f.tin,meses: f.meses,apertura: ap,gastos: gs,seguro: sg});
of.push({n: of.length + 1,nombre: nom,meses: f.meses,p: p,cuota: p.cuadro.cuota + sg});
});
if(err)return{error: err};
if(!of.length)return{vacio: true};
var bt = of[0],bc = of[0],max = of[0];
of.forEach(function(o){if(o.p.tae < bt.p.tae)bt = o;if(o.p.coste < bc.p.coste)bc = o;if(o.p.coste > max.p.coste)max = o;});
var filas =[TH.fila('mejor-tae','Menor TAE',bt.nombre,'txt'),TH.fila('mejor-coste','Menor coste total',bc.nombre,'txt')];
if(of.length > 1)filas.push(TH.fila('diferencia','Diferencia de coste entre la más cara y la más barata',max.p.coste - bc.p.coste,'eur'));
of.forEach(function(o){filas.push(TH.fila('cuota-' + o.n,o.nombre + ': cuota mensual',o.cuota,'eur'),TH.fila('coste-' + o.n,o.nombre + ': coste total',o.p.coste,'eur'),TH.fila('tae-' + o.n,o.nombre + ': TAE',o.p.tae,'pct'));});
var avisos =[];
if(of.length === 1)avisos.push('Añade al menos otra oferta con sus datos para poder compararlas.');
else if(bt !== bc)avisos.push('La oferta con menor TAE no es la de menor coste total, porque tienen plazos distintos. La TAE compara el precio del dinero; el coste total, los euros que pagarás.');
return{filas: filas,avisos: avisos,tabla:{titulo: 'Comparación de ofertas',cab:['Oferta','Plazo','Cuota mensual','Intereses','Comisiones y seguros','Coste total','TAE'],cabFila: true,
filas: of.map(function(o){return[o.nombre,o.meses + ' meses',TH.eur(o.cuota),TH.eur(o.p.cuadro.intereses),TH.eur(o.p.apertura + o.p.seguros),TH.eur(o.p.coste),TH.pct(o.p.tae)];})},
notas:['Se supone tipo fijo durante todo el plazo. La TAE incluye las comisiones, los gastos únicos y el seguro mensual.']};
}
});
},function(){
var p = document.createElement('p');p.className = 'herr-estado herr-estado--error';p.setAttribute('role','alert');
p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.';TH.vaciar(raiz).appendChild(p);
});
});
})();

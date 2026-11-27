(function(){
'use strict';
TH.alCargar(function(raiz){
(function(){
var z = function(x){return typeof x === 'number' && isFinite(x)? x : 0;};
TH.calculadora(raiz,{
campos:[
{id: 'gasto',etiqueta: 'Gasto en captación o publicidad',unidad: '€',ph: '1500'},
{id: 'adq',etiqueta: 'Adquisiciones conseguidas',unidad: 'clientes o ventas',ph: '60',entero: true},
{id: 'valor',etiqueta: 'Ingreso medio por adquisición (opcional)',unidad: '€',ph: '80',ayuda: 'Sin IVA.'},
{id: 'margen',etiqueta: 'Margen bruto (opcional)',unidad: '%',ph: '50',ayuda: 'Tras coste del producto, comisiones y logística, sin contar la publicidad.'},
{id: 'presupuesto',etiqueta: 'Presupuesto previsto (opcional)',unidad: '€',ph: '3000'}
],
ejemplo:{gasto: '1500',adq: '60',valor: '80',margen: '50',presupuesto: '3000'},
calcular: function(v){
if(!TH.listos(v,['gasto','adq']))return{vacio: true};
var val = z(v.valor),mg = z(v.margen),pr = z(v.presupuesto);
if(v.gasto < 0 || val < 0 || pr < 0)return{error: 'Los importes no pueden ser negativos.'};
if(v.adq < 1 || v.adq !== Math.floor(v.adq))return{error: 'Las adquisiciones deben ser un número entero de 1 o más.'};
if(mg < 0 || mg > 100)return{error: 'El margen debe estar entre 0 y 100 %.'};
var cpa = v.gasto / v.adq,filas =[TH.fila('cpa','Coste por adquisición (CPA)',cpa,'eur')],avisos =[];
if(val > 0 && mg > 0){
var maxi = val * mg / 100,ben = maxi - cpa;
filas.push(TH.fila('cpa-max','CPA máximo para no perder dinero',maxi,'eur'),TH.fila('beneficio-unidad','Beneficio por adquisición',ben,'eur'),TH.fila('beneficio-total','Beneficio total de la campaña',ben * v.adq,'eur'));
if(ben < 0)avisos.push('Cada adquisición te cuesta más de lo que te deja: con este margen, tu CPA supera el máximo permitido.');
}else if(val > 0)filas.push(TH.fila('ingresos','Ingresos de la campaña',val * v.adq,'eur'));
if(val > 0 && v.gasto > 0)filas.push(TH.fila('roas','ROAS de la campaña',val * v.adq / v.gasto,'n2'));
if(pr > 0)filas.push(TH.fila('adq-presupuesto','Adquisiciones con tu presupuesto',pr / cpa,'n1'));
return{filas: filas,avisos: avisos,notas:['Usa importes sin IVA. El CPA máximo solo cuenta la primera compra: si el cliente repite, tu límite real es mayor.']};
}
});
})();
});
})();

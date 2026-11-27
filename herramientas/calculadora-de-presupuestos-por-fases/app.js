(function(){
'use strict';
TH.alCargar(function(raiz){
(function(){
var z = function(x){return typeof x === 'number' && isFinite(x)? x : 0;};
TH.calculadora(raiz,{
campos:[
{id: 'tarifa',etiqueta: 'Tarifa por hora general',unidad: '€',ph: '50'},
{tipo: 'lista',id: 'fases',etiqueta: 'Fases del proyecto',inicial: 3,max: 15,textoAnadir: 'Añadir fase',
columnas:[{id: 'nombre',etiqueta: 'Fase',tipo: 'texto',ph: 'Diseño'},{id: 'horas',etiqueta: 'Horas',tipo: 'numero',ph: '20'},{id: 'tarifa',etiqueta: 'Tarifa propia (€/h)',tipo: 'numero',ph: ''},{id: 'costes',etiqueta: 'Costes directos (€)',tipo: 'numero',ph: '0'}]},
{id: 'imprevistos',etiqueta: 'Imprevistos',unidad: '%',valor: '10'},
{id: 'descuento',etiqueta: 'Descuento comercial',unidad: '%',valor: '0'},
{id: 'iva',etiqueta: 'IVA',unidad: '%',valor: '21'},
{id: 'irpf',etiqueta: 'Retención de IRPF (si aplica)',unidad: '%',valor: '0'},
{id: 'anticipo',etiqueta: 'Anticipo al empezar (opcional)',unidad: '% del total',ph: '30'}
],
ejemplo:{tarifa: '50',fases:[{nombre: 'Diseño',horas: '20',tarifa: '',costes: '0'},{nombre: 'Desarrollo',horas: '60',tarifa: '',costes: '200'},{nombre: 'Pruebas y entrega',horas: '15',tarifa: '',costes: '0'}],imprevistos: '10',descuento: '5',iva: '21',irpf: '15',anticipo: '30'},
calcular: function(v){
if(!TH.listos(v,['tarifa']))return{vacio: true};
var imp = z(v.imprevistos),de = z(v.descuento),iva = z(v.iva),ir = z(v.irpf),an = z(v.anticipo);
if(v.tarifa < 0)return{error: 'La tarifa no puede ser negativa.'};
if(imp < 0 || imp > 100 || de < 0 || de > 100 || iva < 0 || iva > 50 || ir < 0 || ir > 50 || an < 0 || an > 100)return{error: 'Los imprevistos y el descuento deben estar entre 0 y 100 %, el IVA y la retención entre 0 y 50 %, y el anticipo entre 0 y 100 %.'};
var fs =(v.fases ||[]).filter(function(f){return isFinite(f.horas)|| isFinite(f.costes);});
if(!fs.length)return{vacio: true};
var horas = 0,sub = 0,mano = 0,directos = 0,tabla =[];
for(var i = 0;i < fs.length;i++){
var f = fs[i],h = z(f.horas),t = isFinite(f.tarifa)? f.tarifa : v.tarifa,c = z(f.costes);
if(h < 0 || t < 0 || c < 0)return{error: 'Las horas, las tarifas y los costes de las fases no pueden ser negativos.'};
var m = h * t;horas += h;mano += m;directos += c;sub += m + c;
tabla.push([(f.nombre || '').trim()|| 'Fase ' +(i + 1),TH.fmt(h,[0,2])+ ' h',TH.eur(m),TH.eur(c),TH.eur(m + c)]);
}
if(sub <= 0)return{vacio: true};
tabla.forEach(function(r,k){var x = fs[k];r.push(TH.pct((z(x.horas)*(isFinite(x.tarifa)? x.tarifa : v.tarifa)+ z(x.costes))/ sub * 100));});
var impE = sub * imp / 100,desE =(sub + impE)* de / 100,base = sub + impE - desE,ivaE = base * iva / 100,irE = base * ir / 100,total = base + ivaE - irE;
var filas =[TH.fila('total','Total a cobrar',total,'eur'),TH.fila('base','Base imponible',base,'eur'),TH.fila('subtotal','Suma de las fases',sub,'eur'),TH.fila('imprevistos-eur','Imprevistos',impE,'eur'),TH.fila('descuento-eur','Descuento',desE,'eur'),
TH.fila('iva-eur','IVA',ivaE,'eur'),TH.fila('irpf-eur','Retención de IRPF',irE,'eur'),TH.fila('horas','Horas totales',horas,'n1'),TH.fila('mano-obra','Importe de las horas',mano,'eur'),TH.fila('costes-directos','Costes directos',directos,'eur')];
if(horas > 0)filas.push(TH.fila('tarifa-media','Precio medio por hora (base imponible ÷ horas)',base / horas,'eur'));
if(an > 0)filas.push(TH.fila('anticipo-eur','Anticipo al empezar',total * an / 100,'eur'),TH.fila('resto','Resto a pagar',total *(1 - an / 100),'eur'));
return{filas: filas,tabla:{titulo: 'Presupuesto por fases',cab:['Fase','Horas','Importe de las horas','Costes directos','Total de la fase','% de la suma'],cabFila: true,filas: tabla},
notas:['Los imprevistos y el descuento se aplican sobre la suma de las fases. La retención de IRPF solo corresponde a determinados casos: confírmala con tu gestoría.']};
}
});
})();
});
})();

(function(){
'use strict';
TH.alCargar(function(raiz){
TH.calculadora(raiz,{
campos:[
{id: 'modo',tipo: 'select',etiqueta: '¿Qué quieres calcular?',valor: 'futuro',ancho: 'completo',opciones:[['futuro','Cuánto valdrá mi dinero en el futuro con una inflación dada'],['tasa','Qué inflación han tenido unos precios entre dos momentos']]},
{id: 'importe',etiqueta: 'Importe',unidad: '€',ph: '1.000',ayuda: 'En el segundo caso, el precio de partida.'},
{id: 'actual',etiqueta: 'Precio o importe actual',unidad: '€',ph: '1.300',mostrarSi: function(v){return v.modo === 'tasa';}},
{id: 'inflacion',etiqueta: 'Inflación media anual',unidad: '%',ph: '3',mostrarSi: function(v){return v.modo === 'futuro';}},
{id: 'anios',etiqueta: 'Años',ph: '10'}
],
ejemplo:{modo: 'futuro',importe: '1000',inflacion: '3',anios: '10'},
calcular: function(v){
if(v.modo === 'futuro'){
if(!TH.listos(v,['importe','inflacion','anios']))return{vacio: true};
if(v.importe <= 0)return{error: 'El importe debe ser mayor que 0.'};
if(v.inflacion < -20 || v.inflacion > 200)return{error: 'La inflación anual debe estar entre −20 % y 200 %.'};
if(v.anios <= 0 || v.anios > 100)return{error: 'Los años deben ser más de 0 y no superar 100.'};
var f = Math.pow(1 + v.inflacion / 100,v.anios);
return{filas:[TH.fila('poder','Lo que valdrá tu dinero, en euros de hoy',v.importe / f,'eur'),TH.fila('perdida','Poder adquisitivo perdido',(1 - 1 / f)* 100,'pct'),TH.fila('necesario','Dinero necesario para comprar lo mismo que hoy',v.importe * f,'eur')],
notas:['Se supone una inflación media constante cada año. La real varía de un año a otro y de un producto a otro.']};
}
if(!TH.listos(v,['importe','actual','anios']))return{vacio: true};
if(v.importe <= 0 || v.actual <= 0)return{error: 'Los dos importes deben ser mayores que 0.'};
if(v.anios <= 0 || v.anios > 100)return{error: 'Los años deben ser más de 0 y no superar 100.'};
var r = v.actual / v.importe;
return{filas:[TH.fila('anual','Inflación media anual',(Math.pow(r,1 / v.anios)- 1)* 100,'pct'),TH.fila('acumulada','Inflación acumulada',(r - 1)* 100,'pct'),TH.fila('equivale','Lo que valía el importe actual en el momento inicial',v.importe * v.importe / v.actual,'eur')],
notas:['Es la variación de los dos importes que has indicado, no el IPC oficial. Para comparar con la inflación general, consulta los datos del Instituto Nacional de Estadística.']};
}
});
});
})();

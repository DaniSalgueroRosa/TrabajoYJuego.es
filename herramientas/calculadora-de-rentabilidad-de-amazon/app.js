(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/negocio.js').then(function(){
var N = TH.negocio,z = N.n0;
var CATS =[['otra','Categoría con tramos de precio u otra: escribo yo el %',0,0.3],['todo','Todo lo demás (15 %)',15,0.3],['juguetes','Juguetes y juegos (15 %)',15,0.3],['deportes','Deportes y aire libre (15 %)',15,0.3],['cocina','Cocina (15 %)',15,0.3],['jardin','Jardín y césped (15 %)',15,0.3],
['oficina','Oficina y papelería (15 %)',15,0.3],['mascotas','Productos para mascotas (15 %)',15,0.3],['calzado','Calzado (15 %)',15,0.3],['mochilas','Mochilas y bolsos (15 %)',15,0.3],['equipaje','Equipaje y accesorios de equipaje (15 %)',15,0.3],
['ropa-blanca','Ropa blanca y alfombras para el hogar (15 %)',15,0.3],['colchones','Colchones (15 %)',15,0.3],['gafas','Gafas y protección para los ojos (15 %)',15,0.3],['ciclismo','Accesorios de ciclismo (15 %)',15,0.3],
['embalaje','Material de embalaje (15 %)',15,0.3],['industrial','Suministros empresariales, industriales y científicos (15 %)',15,0.3],['compactos','Electrodomésticos compactos (15 %)',15,0.3],['bricolaje','Bricolaje y herramientas (13 %)',13,0.3],
['acc-muebles','Accesorios para muebles (13 %)',13,0.3],['puertas','Accesorios para puertas, ventanas y duchas (13 %)',13,0.3],['adhesivos','Adhesivos y bridas para el hogar (13 %)',13,0.3],['hecho-mano','Hecho a mano (12 %)',12,0.3],
['musica-instr','Instrumentos musicales y producción audiovisual (12 %)',12,0.3],['electrico','Suministros eléctricos y de energía comerciales (12 %)',12,0.3],['alcohol','Cerveza, vino y bebidas alcohólicas de alta graduación (10 %)',10,0.3],
['consolas','Consolas de videojuegos (8 %, sin mínimo)',8,0],['electronica','Electrónica (7 %)',7,0.3],['informatica','Informática (7 %)',7,0.3],['grandes','Electrodomésticos de tamaño normal (7 %)',7,0.3],['neumaticos','Neumáticos (7 %)',7,0.3],
['libros','Libros (15 %, sin mínimo)',15,0],['musica','Música, vídeo y DVD (15 %, sin mínimo)',15,0],['software','Software (15 %, sin mínimo)',15,0],['videojuegos','Videojuegos y accesorios (15 %, sin mínimo)',15,0],['acc-amazon','Accesorios para dispositivos Amazon (45 %)',45,0.3]];
var POR ={};CATS.forEach(function(c){POR[c[0]]= c;});
function otra(v){return v.categoria === 'otra';}
TH.calculadora(raiz,{
campos:[
{id: 'precio',etiqueta: 'Precio de venta al cliente (con IVA)',unidad: '€',ph: '29,99'},
{id: 'iva',etiqueta: 'IVA del producto',unidad: '%',valor: '21'},
{id: 'coste',etiqueta: 'Coste del producto',unidad: '€ por unidad',ph: '8'},
{id: 'categoria',tipo: 'select',etiqueta: 'Categoría en Amazon.es',valor: 'juguetes',ancho: 'completo',opciones: CATS.map(function(c){return[c[0],c[1]];})},
{id: 'refPct',etiqueta: 'Tarifa por referencia de tu categoría y precio',unidad: '%',ph: '15',mostrarSi: otra},
{id: 'refMin',etiqueta: 'Tarifa mínima por artículo',unidad: '€',valor: '0,3',mostrarSi: otra},
{id: 'plan',tipo: 'select',etiqueta: 'Plan de venta',valor: 'individual',opciones:[['individual','Individual (0,99 € por unidad vendida)'],['profesional','Profesional (39 € al mes)']]},
{id: 'unidades',etiqueta: 'Unidades que vendes al mes',unidad: 'uds',ph: '200',entero: true,ayuda: 'Reparte la cuota del plan Profesional y calcula el beneficio mensual.'},
{id: 'logistica',etiqueta: 'Logística: gestión de Amazon o tu envío',unidad: '€ por unidad',ph: '4,5'},
{id: 'entrada',etiqueta: 'Envío del stock hasta Amazon o hasta tu almacén',unidad: '€ por unidad',ph: '0,4'},
{id: 'publicidad',etiqueta: 'Publicidad',unidad: '€ por unidad vendida',ph: '2'},
{id: 'devPct',etiqueta: 'Unidades devueltas',unidad: '%',ph: '5'},
{id: 'devCoste',etiqueta: 'Coste de cada devolución',unidad: '€',ph: '3'},
{id: 'otros',etiqueta: 'Otros costes',unidad: '€ por unidad',ph: '0,2',ayuda: 'Etiquetado, embalaje, inspección…'}
],
ejemplo:{precio: '29,99',iva: '21',coste: '8',categoria: 'juguetes',plan: 'individual',unidades: '200',logistica: '4,5',entrada: '0,4',publicidad: '2',devPct: '5',devCoste: '3',otros: '0,2'},
calcular: function(v){
if(!TH.listos(v,['precio','iva','coste']))return{vacio: true};
var cat = POR[v.categoria],pct,min,u = z(v.unidades);
if(otra(v)){if(!TH.listos(v,['refPct']))return{vacio: true};pct = v.refPct;min = z(v.refMin);}else{pct = cat[2];min = cat[3];}
if(v.precio <= 0 || v.coste < 0 || v.iva < 0 || v.iva > 50)return{error: 'El precio debe ser mayor que 0, el coste no puede ser negativo y el IVA debe estar entre 0 y 50 %.'};
if(pct < 0 || pct >= 100 || min < 0)return{error: 'La tarifa por referencia debe estar entre 0 y 99 % y el mínimo no puede ser negativo.'};
if(z(v.devPct)< 0 || z(v.devPct)> 100 ||[v.logistica,v.entrada,v.publicidad,v.devCoste,v.otros].some(function(x){return z(x)< 0;}))return{error: 'Los costes no pueden ser negativos y el porcentaje de devoluciones debe estar entre 0 y 100.'};
if(u < 0 || u !== Math.floor(u))return{error: 'Las unidades al mes deben ser un número entero positivo.'};
if(v.plan === 'profesional' && u < 1)return{error: 'Con el plan Profesional indica cuántas unidades vendes al mes para repartir la cuota de 39 €.'};
var r = N.amazon({precio: v.precio,iva: v.iva,coste: v.coste,refPct: pct,refMin: min,logistica: z(v.logistica),entrada: z(v.entrada),plan: v.plan,unidadesMes: u,publicidad: z(v.publicidad),devolucionesPct: z(v.devPct),costeDevolucion: z(v.devCoste),otros: z(v.otros)});
var filas =[TH.fila('beneficio','Beneficio por unidad',r.beneficio,'eur'),TH.fila('margen','Margen sobre el precio sin IVA',r.margen,'pct'),TH.fila('roi','ROI sobre el producto y su envío de entrada',r.roi,'pct'),
TH.fila('neto','Precio sin IVA',r.neto,'eur'),TH.fila('tarifa','Tarifa por referencia de Amazon',r.tarifa,'eur'),TH.fila('cuota-plan','Cuota del plan por unidad',r.cuotaPlan,'eur'),TH.fila('devoluciones','Coste de devoluciones por unidad',r.devoluciones,'eur'),
TH.fila('antes-publicidad','Beneficio antes de publicidad',r.antesPublicidad,'eur'),TH.fila('acos','ACOS de equilibrio (publicidad ÷ ventas con IVA)',r.acosEquilibrio,'pct')];
if(isFinite(r.precioMinimo))filas.push(TH.fila('precio-minimo','Precio mínimo con IVA para no perder antes de publicidad',r.precioMinimo,'eur'));
if(u > 0)filas.push(TH.fila('beneficio-mes','Beneficio mensual con ' + u + ' unidades',r.beneficio * u,'eur'));
var avisos =[];
if(r.beneficio < 0)avisos.push('Con estos costes pierdes dinero en cada unidad. Revisa el precio, la logística o la publicidad.');
return{filas: filas,avisos: avisos,notas:['La tarifa por referencia se aplica sobre el precio con IVA y se cobra el porcentaje o el mínimo, el mayor. Tarifas de Amazon.es a 15 de noviembre de 2026; confirma las de tu categoría y precio en Seller Central.']};
}
});
},function(){
var p = document.createElement('p');p.className = 'herr-estado herr-estado--error';p.setAttribute('role','alert');
p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.';TH.vaciar(raiz).appendChild(p);
});
});
})();

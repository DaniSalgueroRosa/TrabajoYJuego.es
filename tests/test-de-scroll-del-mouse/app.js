(function(){
'use strict';
var host = TT.app();
if(!host)return;
var modo = 'cualquiera',contrarios = 0;
var chips = TT.chips([['cualquiera','Cualquier sentido'],['abajo','Solo hacia abajo'],['arriba','Solo hacia arriba']],modo,function(v){modo = v;motor.reiniciar();},'Sentido de la rueda');
var tactil = false;
try{tactil = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches;}catch(e){tactil = false;}
var opciones = TT.h('div',{class: 'tt-fila'},TT.h('p',{class: 'tt-etiqueta',texto: 'Sentido'}),chips.nodo,
tactil ? TT.h('p',{class: 'tt-aviso',texto: 'Una pantalla táctil no tiene rueda. Para este test hace falta un ratón con rueda o un trackpad.'}): null);
var motor = TT.ritmo(host,{
duraciones:[[5,'5 s'],[10,'10 s'],[15,'15 s']],defecto: 10,opciones: opciones,
arena:{inicio: 'Gira la rueda aquí para empezar',pista: 'El tiempo corre desde el primer paso. La página no se desplaza mientras estés dentro de esta zona.',jugando: '¡Gira!'},
unidad: 'pasos/s',singular: 'paso',plural: 'pasos',decimales: 1,vivo: 1,
titulo: 'Tu velocidad de rueda',
rangos:[
[0,'Con calma','Giras la rueda con suavidad, como al leer una página larga.'],
[5,'Ritmo normal','Una velocidad cómoda para recorrer listas y documentos.'],
[10,'Rápido','Buen ritmo para una rueda con pasos marcados.'],
[15,'Muy rápido','Mueves la rueda con soltura y con dedos ágiles.'],
[25,'Vertiginoso','Una velocidad muy alta. Es habitual en ruedas libres que giran sin pasos.']
],
detalles: function(g){
var dy = g.map(function(x){return Math.abs(x.dato || 0);});
var arriba = g.filter(function(x){return x.tipo === 'arriba';}).length,abajo = g.length - arriba,cambios = 0;
for(var i = 1;i < g.length;i++)if(g[i].tipo !== g[i - 1].tipo)cambios++;
var media = dy.length ? TT.media(dy): 0;
var suave = media > 0 && media < 50;
var r =[['Hacia abajo',abajo],['Hacia arriba',arriba],['Cambios de sentido',cambios],['Delta medio por paso',TT.fmt(media,0)+ ' px'],['Tipo de rueda',suave ? 'Suave (trackpad o rueda libre)' : 'Con pasos marcados']];
if(modo !== 'cualquiera')r.push(['Pasos en sentido contrario (no suman)',contrarios]);
return r;
},
grafico:{descripcion: 'Pasos de rueda por segundo en cada tramo del test'},
copia: function(r){return 'He girado la rueda a ' + TT.fmt(r.valor,1)+ ' pasos por segundo durante ' + r.dur + ' s.';},
fuente: function(arena,golpe,m){
arena.addEventListener('wheel',function(e){
e.preventDefault();
if(!e.deltaY)return;
var tipo = e.deltaY > 0 ? 'abajo' : 'arriba';
if(m.estado()=== 'espera')contrarios = 0;
if(modo !== 'cualquiera' && tipo !== modo){if(m.estado()=== 'jugando')contrarios++;return;}
golpe(tipo,e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY,e);
},{passive: false});
}
});
})();

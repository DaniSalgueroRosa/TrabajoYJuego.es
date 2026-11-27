(function(){
'use strict';
var host = TT.app();
if(!host)return;
var izquierdos = 0,motor;
var tactil = esTactil();
function esTactil(){try{return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches;}catch(e){return false;}}
var aviso = tactil ? TT.h('p',{class: 'tt-aviso',texto: 'Parece que tu pantalla es táctil y no tiene botón derecho. Para este test necesitas un ratón o un trackpad con clic secundario.'}): null;
motor = TT.ritmo(host,{
duraciones:[[5,'5 s'],[10,'10 s'],[15,'15 s'],[30,'30 s']],defecto: 10,opciones: aviso,
arena:{inicio: 'Haz clic con el botón derecho aquí',pista: 'El menú del navegador no se abrirá dentro de esta zona. Los clics izquierdos no cuentan.',jugando: '¡Derecho, derecho!'},
unidad: 'CPS',singular: 'clic derecho',plural: 'clics derechos',decimales: 2,vivo: 1,
titulo: 'Tu CPS con el botón derecho',
rangos:[
[0,'Pausado','Ritmo tranquilo. El botón derecho suele costar más que el izquierdo.'],
[3,'Tranquilo','Un clic derecho cómodo y controlado.'],
[5,'Ágil','Buena velocidad para el botón secundario.'],
[7,'Rápido','Poca gente iguala con el derecho lo que hace con el izquierdo, y tú te acercas.'],
[9,'Muy rápido','Un ritmo notable para este botón.'],
[11,'Extremo','Velocidad altísima con el botón derecho.']
],
detalles: function(g){
var t = g.map(function(x){return x.t;}),iv = TT.intervalos(t).map(function(x){return x * 1000;});
var r =[['Mejor segundo',TT.ventanaMax(t,1)+ ' clics'],['Clics izquierdos ignorados',izquierdos]];
if(iv.length)r.push(['Intervalo medio',TT.fmt(TT.media(iv),0)+ ' ms']);
return r;
},
grafico:{descripcion: 'Clics derechos por segundo en cada tramo del test'},
copia: function(r){return 'He hecho ' + TT.fmt(r.valor,2)+ ' CPS con el clic derecho en ' + r.dur + ' s.';},
fuente: function(arena,golpe){
arena.addEventListener('contextmenu',function(e){
e.preventDefault();
if(motor && motor.estado()=== 'espera')izquierdos = 0;
golpe('derecho',null,e);
});
arena.addEventListener('pointerdown',function(e){if(e.pointerType === 'mouse' && e.button === 0 && motor && motor.estado()=== 'jugando')izquierdos++;});
}
});
})();

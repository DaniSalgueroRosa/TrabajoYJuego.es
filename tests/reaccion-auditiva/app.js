(function(){
'use strict';
var host = TT.app();
if(!host)return;
var aviso = TT.h('p',{class: 'tt-aviso',role: 'status'});
var probar = TT.boton('Probar el sonido',function(){
var c = TT.audio();
if(!c){aviso.textContent = 'Tu navegador no permite reproducir audio, así que este test no se puede hacer aquí.';return;}
TT.tono(880,0.2,0.2);
aviso.textContent = 'Si has oído un pitido corto, ya puedes empezar. Si no, sube el volumen o revisa la salida de sonido.';
},true);
var opciones = TT.h('div',{class: 'tt-fila'},probar,aviso);
aviso.textContent = 'Usa auriculares o altavoces, con el volumen en un nivel cómodo, y prueba el sonido antes de empezar.';
TT.reaccion(host,{
intentos: 5,espera:[1500,5000],opciones: opciones,
textos:{inicio: 'Pulsa para empezar',pista: 'Cierra los ojos si quieres. Cuando suene el pitido, pulsa lo más rápido que puedas, con el ratón, el dedo, Intro o la barra espaciadora.',espera: 'Escucha…',ya: 'Pulsa',pronto: 'Demasiado pronto',siguiente: 'Pulsa para repetir este intento.'},
antes: function(){
var c = TT.audio();
if(!c){aviso.textContent = 'Tu navegador no permite reproducir audio, así que este test no se puede hacer aquí.';return false;}
return true;
},
alSenal: function(arena){
var c = TT.audio(),cuando = c.currentTime + 0.03,extra =(c.outputLatency || c.baseLatency || 0)* 1000;
TT.tono(880,0.25,0.2,cuando);
return ahora()+ 30 + extra;
},
rangos:[
[150,'Oído de élite','Un tiempo medio muy corto para un sonido. Revisa que tus auriculares no sean de los que adelantan el aviso.'],
[200,'Muy rápido','Respondes al sonido más deprisa que la mayoría de la gente.'],
[250,'Rápido','Un tiempo ágil y sólido.'],
[320,'Normal','Es un tiempo habitual en una prueba de sonido con ratón o teclado.'],
[420,'Tranquilo','Estás algo por encima de lo normal. Prueba con auriculares con cable y sin Bluetooth.'],
[Infinity,'Pausado','Hay mucho margen. Los auriculares inalámbricos pueden añadir cientos de milisegundos de retraso por sí solos.']
],
titulo: 'Tu tiempo de reacción al sonido',
copia: function(media,mejor){return 'Mi reacción auditiva: ' + TT.fmt(media,0)+ ' ms de media (mejor intento: ' + TT.fmt(mejor,0)+ ' ms).';}
});
function ahora(){return window.performance.now();}
})();

(function(){
'use strict';
var host = TT.app();
if(!host)return;
TT.reaccion(host,{
intentos: 5,espera:[1500,4500],
textos:{inicio: 'Pulsa para empezar',pista: 'Espera a que la zona se ponga verde y pulsa lo más rápido que puedas. Vale el ratón, el dedo, Intro o la barra espaciadora.',espera: 'Espera…',ya: '¡YA!',pronto: 'Demasiado pronto',siguiente: 'Pulsa para repetir este intento.'},
rangos:[
[180,'Reflejos de élite','Un tiempo medio muy por debajo de lo habitual. Puede que ayude un monitor rápido y un ratón de baja latencia.'],
[220,'Muy rápido','Reaccionas más deprisa que la mayoría de la gente.'],
[260,'Rápido','Un tiempo ágil y sólido.'],
[320,'Normal','Es un tiempo de reacción típico para una prueba con pantalla y ratón.'],
[420,'Tranquilo','Estás un poco por encima de lo habitual. Descansa, concéntrate y vuelve a intentarlo.'],
[Infinity,'Pausado','Hay mucho margen. El cansancio, la distracción o un equipo lento pueden sumar muchos milisegundos.']
],
copia: function(media,mejor){return 'Mi tiempo de reacción: ' + TT.fmt(media,0)+ ' ms de media (mejor intento: ' + TT.fmt(mejor,0)+ ' ms).';}
});
})();

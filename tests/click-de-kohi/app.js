(function(){
'use strict';
var host = TT.app();
if(!host)return;
TT.ritmo(host,{
defecto: 10,
arena:{inicio: 'Haz clic aquí para empezar',pista: 'Diez segundos desde tu primer clic. Arriba verás el ritmo de los últimos 2 segundos.',jugando: '¡Clic, clic, clic!'},
unidad: 'CPS',singular: 'clic',plural: 'clics',decimales: 2,vivo: 2,
titulo: 'Tu rango Kohi',
rangos:[
[0,'Aprendiz','Todos empiezan aquí. Prueba a relajar el brazo y a clicar con el dedo índice.'],
[3,'Recluta','Ya clicas con soltura, aunque aún sin prisa.'],
[5,'Soldado','Un ritmo de clic normal y estable.'],
[7,'Sargento','Rápido y bastante regular.'],
[8.5,'Teniente','Ritmo de jugador habitual de combates con clic.'],
[10,'Capitán','Entras en la zona de los jugadores entrenados.'],
[12,'Comandante','Muy por encima de la media.'],
[14,'Coronel','Velocidad que exige una técnica trabajada.'],
[16,'General','El tramo más alto de esta escala. Cuida la mano.']
],
detalles: function(g){
var t = g.map(function(x){return x.t;}),iv = TT.intervalos(t).map(function(x){return x * 1000;});
var r =[['Mejor tramo de 2 s',TT.fmt(TT.ventanaMax(t,2)/ 2,2)+ ' CPS'],['Mejor segundo',TT.ventanaMax(t,1)+ ' clics']];
if(iv.length)r.push(['Intervalo medio',TT.fmt(TT.media(iv),0)+ ' ms']);
return r;
},
grafico:{descripcion: 'Clics por segundo en cada tramo de los diez segundos'},
copia: function(r){return 'Rango Kohi: ' + r.rango.nombre + ' con ' + TT.fmt(r.valor,2)+ ' CPS en 10 s.';},
fuente: function(arena,golpe){
arena.addEventListener('pointerdown',function(e){if(e.pointerType === 'mouse' && e.button !== 0)return;golpe('clic',null,e);});
arena.addEventListener('keydown',function(e){if((e.key === 'Enter' || e.key === ' ')&& !e.repeat){e.preventDefault();golpe('tecla',null,e);}});
arena.addEventListener('contextmenu',function(e){e.preventDefault();});
}
});
})();

(function(){
'use strict';
var host = TT.app();
if(!host)return;
var IGNORAR ={Shift: 1,Control: 1,Alt: 1,Meta: 1,AltGraph: 1,CapsLock: 1,NumLock: 1,ScrollLock: 1,Tab: 1,Escape: 1,Dead: 1,Unidentified: 1,ContextMenu: 1,OS: 1};
var SCROLL ={' ': 1,ArrowUp: 1,ArrowDown: 1,ArrowLeft: 1,ArrowRight: 1,PageUp: 1,PageDown: 1,Home: 1,End: 1};
TT.ritmo(host,{
duraciones:[[10,'10 s'],[30,'30 s'],[60,'1 min']],defecto: 30,
arena:{inicio: 'Haz clic o pulsa una tecla para empezar',pista: 'Cuenta cada clic en esta zona y cada pulsación de tecla. Mantener una tecla pulsada cuenta una sola vez. Ctrl, Alt, Mayús y Tab no cuentan.',jugando: '¡Acciones!'},
unidad: 'APM',singular: 'acción',plural: 'acciones',decimales: 0,vivo: 5,factor: 60,
titulo: 'Tus acciones por minuto',
rangos:[
[0,'Con calma','Menos de una acción por segundo: un ritmo de oficina.'],
[60,'Constante','Más de una acción por segundo, sin prisa.'],
[120,'Ágil','Un buen ritmo de juego casual.'],
[200,'Rápido','Nivel de jugador habitual de estrategia o de edición con atajos.'],
[300,'Muy rápido','Mucha gente no sostiene esto más de unos segundos.'],
[400,'Nivel de competición','Un ritmo que se ve en el juego profesional (donde también cuentan las acciones repetidas).'],
[500,'Frenético','Casi seguro es una ráfaga corta con muchas pulsaciones repetidas.']
],
detalles: function(g,dur){
var t = g.map(function(x){return x.t;}),clics = g.filter(function(x){return x.tipo === 'clic';}).length,teclas = g.length - clics;
var distintas ={};
g.forEach(function(x){if(x.tipo === 'tecla')distintas[x.dato]= 1;});
var r =[['Clics',clics],['Pulsaciones de teclado',teclas],['Teclas distintas',Object.keys(distintas).length],['Acciones por segundo',TT.fmt(g.length / dur,2)]];
if(dur >= 5)r.push(['Mejor tramo de 5 s',TT.fmt(TT.ventanaMax(t,5)/ 5 * 60,0)+ ' APM']);
return r;
},
grafico:{descripcion: 'Acciones por segundo en cada tramo del test'},
copia: function(r){return 'He hecho ' + TT.fmt(r.valor,0)+ ' acciones por minuto (APM) en ' + r.dur + ' s.';},
fuente: function(arena,golpe,motor){
document.addEventListener('keydown',function(e){
if(e.ctrlKey || e.metaKey || e.altKey || IGNORAR[e.key]|| /^F\d{1,2}$/.test(e.key))return;
var t = e.target;
if(t !== arena && t !== document.body && t.closest && t.closest('button, input, select, textarea, a, summary'))return;
if(SCROLL[e.key]|| e.key === 'Enter')e.preventDefault();
if(e.repeat || motor.estado()=== 'fin')return;
golpe('tecla',e.code || e.key,e);
});
arena.addEventListener('pointerdown',function(e){
if(motor.estado()=== 'fin')return;
golpe('clic',null,e);
});
arena.addEventListener('contextmenu',function(e){e.preventDefault();});
}
});
})();

(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('cb');
if(!raiz)return;
var ELEMENTOS =['fuego','agua','planta'],NOMBRE ={fuego: 'Fuego',agua: 'Agua',planta: 'Planta'},SIMBOLO ={fuego: '▲',agua: '●',planta: '◆'};
var VENCE ={fuego: 'planta',planta: 'agua',agua: 'fuego'};
var RONDAS = 7,VENTAJA = 3,PAUSA = 800;
var RANGOS =[[0,'Principiante'],[200,'Aprendiz de duelista'],[400,'Duelista'],[500,'Gran estratega'],[600,'Maestro de cartas']];
var sesion = TYJ.Sesion(null,{victorias: true,etiquetaMejor: 'Mejor puntuación: '});
var ui = null,g = null,temporizador = 0;
function fuerza(a,b){return a.v +(VENCE[a.e]=== b.e ? VENTAJA : 0);}
function barajar(){
var m =[];
ELEMENTOS.forEach(function(e){for(var v = 1;v <= 10;v++)m.push({e: e,v: v});});
for(var i = m.length - 1;i > 0;i--){var j = Math.floor(Math.random()*(i + 1)),t = m[i];m[i]= m[j];m[j]= t;}
return m;
}
function inicio(){
clearTimeout(temporizador);g = null;
TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: 'Cartas de batalla'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'Siete cartas, siete rondas. El fuego vence a la planta, la planta al agua y el agua al fuego, y la ventaja suma 3.'}));
raiz.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro',type: 'button',onclick: jugar},'Repartir cartas')));
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
function jugar(){
clearTimeout(temporizador);
var m = barajar();
g ={mano: m.slice(0,RONDAS),rival: m.slice(RONDAS,2 * RONDAS),ronda: 0,yo: 0,cpu: 0,espera: false,fin: false,hist:[]};
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['ronda','Ronda','1 / ' + RONDAS],['yo','Tus rondas',0],['cpu','Rondas del rival',0]]);
ui.leyenda = h('ul',{class: 'cb-leyenda'},h('li',{texto: 'Fuego vence a planta'}),h('li',{texto: 'Planta vence a agua'}),h('li',{texto: 'Agua vence a fuego'}),h('li',{texto: 'La ventaja suma 3'}));
ui.rival = h('div',{class: 'cb-rival',role: 'img'});
ui.huecoYo = h('div',{class: 'cb-hueco',role: 'group','aria-label': 'Tu carta jugada'},h('p',{texto: 'Tu carta'}));
ui.huecoRival = h('div',{class: 'cb-hueco',role: 'group','aria-label': 'Carta del rival'},h('p',{texto: 'Carta del rival'}));
ui.resultado = h('p',{class: 'cb-resultado mensaje',role: 'status','aria-live': 'polite',texto: 'Elige una carta de tu mano.'});
ui.mano = h('ul',{class: 'cb-mano','aria-label': 'Tu mano'});
ui.historial = h('ul',{class: 'cb-historial','aria-label': 'Rondas jugadas'});
raiz.appendChild(ui.hud.nodo);raiz.appendChild(ui.leyenda);
raiz.appendChild(h('p',{class: 'texto',texto: 'Cartas que le quedan al rival:'}));raiz.appendChild(ui.rival);
raiz.appendChild(h('div',{class: 'cb-mesa'},ui.huecoYo,ui.huecoRival));
raiz.appendChild(ui.resultado);
raiz.appendChild(h('p',{class: 'texto',texto: 'Tu mano:'}));raiz.appendChild(ui.mano);
raiz.appendChild(ui.historial);
pintar();
}
function carta(c,grande,boton,indice){
var cuerpo =[h('span',{class: 'cb-valor',texto: String(c.v)}),h('span',{class: 'cb-elemento'},h('span',{class: 'cb-simbolo','aria-hidden': 'true',texto: SIMBOLO[c.e]+ ' '}),NOMBRE[c.e])];
var atr ={class: 'cb-carta' +(grande ? ' cb-carta--grande' : ''),'data-elemento': c.e,'data-valor': String(c.v)};
if(boton){atr.type = 'button';atr['data-i']= String(indice);atr['aria-label']= NOMBRE[c.e]+ ' ' + c.v;}
return h(boton ? 'button' : 'div',atr,cuerpo[0],cuerpo[1]);
}
function pintar(){
ui.hud.poner('ronda',Math.min(g.ronda + 1,RONDAS)+ ' / ' + RONDAS);ui.hud.poner('yo',g.yo);ui.hud.poner('cpu',g.cpu);
TYJ.vaciar(ui.rival);
ui.rival.setAttribute('aria-label','El rival tiene ' + g.rival.length + ' cartas');
g.rival.forEach(function(){ui.rival.appendChild(h('span',{class: 'cb-dorso'}));});
TYJ.vaciar(ui.mano);
g.mano.forEach(function(c,i){
var b = carta(c,false,true,i);
b.disabled = g.espera || g.fin;
b.addEventListener('click',function(){jugarCarta(i);});
ui.mano.appendChild(h('li',{},b));
});
TYJ.vaciar(ui.historial);
g.hist.forEach(function(t){ui.historial.appendChild(h('li',{texto: t}));});
}
function elegirRival(){
var n = g.rival.length,r = Math.random();
if(r < 0.5){var mejor = 0;g.rival.forEach(function(c,i){if(c.v > g.rival[mejor].v)mejor = i;});return mejor;}
return Math.floor(Math.random()* n);
}
function jugarCarta(i){
if(!g || g.fin || g.espera || !g.mano[i])return;
var mia = g.mano.splice(i,1)[0],suya = g.rival.splice(elegirRival(),1)[0];
var fm = fuerza(mia,suya),fs = fuerza(suya,mia),texto,ganador;
if(fm > fs){g.yo++;ganador = 'yo';texto = '¡Ganas la ronda!';}else if(fs > fm){g.cpu++;ganador = 'cpu';texto = 'El rival gana la ronda.';}else{ganador = 'empate';texto = 'Empate: nadie se anota la ronda.';}
texto += ' Tu ' + NOMBRE[mia.e].toLowerCase()+ ' ' + mia.v +(VENCE[mia.e]=== suya.e ? ' (+3)' : '')+ ' = ' + fm + ' contra ' + NOMBRE[suya.e].toLowerCase()+ ' ' + suya.v +(VENCE[suya.e]=== mia.e ? ' (+3)' : '')+ ' = ' + fs + '.';
g.hist.unshift('Ronda ' +(g.ronda + 1)+ ': ' + texto);
g.ronda++;g.espera = true;
TYJ.vaciar(ui.huecoYo);ui.huecoYo.appendChild(carta(mia,true,false));ui.huecoYo.appendChild(h('p',{texto: 'Tu carta · fuerza ' + fm}));
TYJ.vaciar(ui.huecoRival);ui.huecoRival.appendChild(carta(suya,true,false));ui.huecoRival.appendChild(h('p',{texto: 'Rival · fuerza ' + fs}));
ui.huecoYo.setAttribute('data-resultado',ganador);
ui.resultado.textContent = texto;
pintar();
temporizador = setTimeout(function(){
g.espera = false;
if(g.ronda >= RONDAS){terminar();return;}
pintar();
},PAUSA);
}
function terminar(){
g.fin = true;
var victoria = g.yo > g.cpu,puntos = g.yo * 100 +(victoria ? 50 : 0),nivel = U.nivel(g.yo * 100,RANGOS);
sesion.registrar(puntos,victoria ? true :(g.yo < g.cpu ? false : undefined));
TYJ.final(raiz,{titulo: victoria ? '¡Has ganado la partida!' :(g.yo < g.cpu ? 'El rival gana la partida' : 'Partida en tablas'),puntos: puntos,unidad: 'puntos',nivel: nivel,
detalles:['Rondas ganadas: ' + g.yo + ' · del rival: ' + g.cpu + ' · empatadas: ' +(RONDAS - g.yo - g.cpu)],
compartir: 'Cartas de batalla · ' + g.yo + ' a ' + g.cpu + ' (' + nivel + ')',alRepetir: jugar,textoRepetir: 'Repartir otra vez'});
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
inicio();
})();

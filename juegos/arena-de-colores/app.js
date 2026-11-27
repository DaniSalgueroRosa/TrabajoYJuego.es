(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('ac');
if(!raiz)return;
var W = 64,H = 88,X0 = 12,X1 = 51;
var FONDO_Y = 79,TOPE_BANDAS = 50,ALTO_BANDA = 10,ANCHO = X1 - X0 + 1;
var GRANOS_FOTOGRAMA = 4,RESERVA = 500;
var COLORES =[
{nombre: 'rosa',rgb:[255,90,125],css: '#FF5A7D'},
{nombre: 'limón',rgb:[230,241,74],css: '#E6F14A'},
{nombre: 'azul',rgb:[124,200,245],css: '#7CC8F5'}
];
var RANGOS =[[0,'Pulso de principiante'],[50,'Buen pulso'],[75,'Arena de artista'],[90,'Obra maestra']];
var sesion = TYJ.Sesion(null,{etiquetaMejor: 'Mejor obra: '});
var ui = null,g = null,raf = 0,ctx = null,imagen = null,pix = null;
function color32(c){return((255 << 24)|(c[2]<< 16)|(c[1]<< 8)| c[0])>>> 0;}
var PALETA =[color32([20,32,28]),color32([234,242,238]),color32(COLORES[0].rgb),color32(COLORES[1].rgb),color32(COLORES[2].rgb)];
var MARCA = color32([175,196,187]);
function vaso(cel){
var y,x;
for(y = 36;y <= 81;y++){cel[y * W + 10]= 1;cel[y * W + 11]= 1;cel[y * W + 52]= 1;cel[y * W + 53]= 1;}
for(y = FONDO_Y + 1;y <= 81;y++)for(x = 10;x <= 53;x++)cel[y * W + x]= 1;
}
function inicio(){
cancelAnimationFrame(raf);g = null;
document.removeEventListener('visibilitychange',alVisibilidad);
TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: 'Arena de colores'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'Llena el vaso con tres capas de arena: rosa abajo, limón en medio y azul arriba. Mantén pulsado para verter.'}));
raiz.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro',type: 'button',onclick: jugar},'Empezar')));
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
function jugar(){
cancelAnimationFrame(raf);
g ={cel: new Uint8Array(W * H),color: 0,resto:[RESERVA,RESERVA,RESERVA],derramada: 0,mostrada: 0,x: W >> 1,vertiendo: false,fin: false,par: 0,pausa: false};
vaso(g.cel);
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['color','Color',COLORES[0].nombre],['resto','Arena que queda',RESERVA],['derramada','Derramada',0]]);
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Mantén pulsado sobre la zona de juego para verter arena rosa.'});
ui.lienzo = h('canvas',{class: 'ac-lienzo',width: String(W),height: String(H),tabindex: '0',role: 'img',
'aria-label': 'Zona de juego. Mantén pulsado para verter arena en el vaso. Con el teclado, flechas para mover el chorro y barra espaciadora para verter.'});
ctx = ui.lienzo.getContext('2d');imagen = ctx.createImageData(W,H);pix = new Uint32Array(imagen.data.buffer);
ui.orden = h('ul',{class: 'ac-orden','aria-label': 'Orden de las capas, de abajo arriba'});
COLORES.forEach(function(c,i){var li = h('li',{'data-capa': String(i)},h('span',{class: 'ac-muestra','aria-hidden': 'true'}),(i + 1)+ '.ª capa: ' + c.nombre +(i === 0 ? ' (abajo)' : i === 2 ? ' (arriba)' : ''));li.firstChild.style.setProperty('--c',c.css);ui.orden.appendChild(li);});
ui.botones = h('div',{class: 'ac-botones'},
h('button',{class: 'boton-retro boton-retro--sec',type: 'button','data-accion': 'color',onclick: siguienteColor},'Cambiar de color'),
h('button',{class: 'boton-retro',type: 'button','data-accion': 'terminar',onclick: terminar},'Terminar y puntuar'),
h('button',{class: 'boton-retro boton-retro--sec',type: 'button','data-accion': 'reiniciar',onclick: jugar},'Empezar de nuevo'));
raiz.appendChild(h('h2',{texto: 'Arena de colores'}));
raiz.appendChild(ui.hud.nodo);
raiz.appendChild(h('div',{class: 'ac-zona'},ui.lienzo,ui.orden,ui.botones));
raiz.appendChild(ui.msg);
ui.lienzo.addEventListener('pointerdown',function(ev){if(ev.pointerType === 'mouse' && ev.button !== 0)return;try{ui.lienzo.setPointerCapture(ev.pointerId);}catch(e){}g.vertiendo = true;mover(ev);ev.preventDefault();});
ui.lienzo.addEventListener('pointermove',function(ev){if(g.vertiendo)mover(ev);});
['pointerup','pointercancel'].forEach(function(n){ui.lienzo.addEventListener(n,function(){g.vertiendo = false;});});
ui.lienzo.addEventListener('keydown',function(ev){
if(ev.key === 'ArrowLeft'){g.x = Math.max(2,g.x - 2);ev.preventDefault();}
else if(ev.key === 'ArrowRight'){g.x = Math.min(W - 3,g.x + 2);ev.preventDefault();}
else if(ev.key === ' ' || ev.key === 'Enter'){g.vertiendo = true;ev.preventDefault();}
});
ui.lienzo.addEventListener('keyup',function(ev){if(ev.key === ' ' || ev.key === 'Enter')g.vertiendo = false;});
ui.lienzo.addEventListener('blur',function(){g.vertiendo = false;});
document.addEventListener('visibilitychange',alVisibilidad);
marcarCapa();
dibujar();
raf = requestAnimationFrame(bucle);
}
function alVisibilidad(){
if(!g || g.fin)return;
if(document.hidden){g.vertiendo = false;cancelAnimationFrame(raf);}else raf = requestAnimationFrame(bucle);
}
function mover(ev){
var r = ui.lienzo.getBoundingClientRect();
if(!r.width)return;
g.x = Math.max(2,Math.min(W - 3,Math.floor((ev.clientX - r.left)/ r.width * W)));
}
function marcarCapa(){
[].forEach.call(ui.orden.children,function(li,i){li.setAttribute('data-actual',i === g.color ? 'si' : 'no');});
ui.hud.poner('color',COLORES[g.color].nombre);ui.hud.poner('resto',g.resto[g.color]);
}
function siguienteColor(){
if(!g || g.fin)return;
if(g.color >= COLORES.length - 1){ui.msg.textContent = 'Ya estás con el último color. Cuando quieras, pulsa «Terminar y puntuar».';return;}
g.color++;g.vertiendo = false;
ui.msg.textContent = 'Ahora vierte arena ' + COLORES[g.color].nombre + ' (' +(g.color + 1)+ '.ª capa).';
marcarCapa();
}
function verter(){
if(!g.vertiendo)return;
var c = g.color;
for(var k = 0;k < GRANOS_FOTOGRAMA && g.resto[c]> 0;k++){
var x = g.x + Math.floor(Math.random()* 3)- 1,i = 1 * W + x;
if(x < 1 || x > W - 2 || g.cel[i]!== 0)continue;
g.cel[i]= 2 + c;g.resto[c]--;
}
if(g.resto[c]<= 0){
g.vertiendo = false;
if(c < COLORES.length - 1){g.color++;ui.msg.textContent = 'Se acabó la arena ' + COLORES[c].nombre + '. Sigue con la ' + COLORES[g.color].nombre + '.';}
else{ui.msg.textContent = 'Se acabó toda la arena. Puntuando…';marcarCapa();terminar();return;}
}
marcarCapa();
}
function paso(){
var cel = g.cel,movido = false,y,x,i,v,d,izq,der;
g.par ^= 1;
for(y = H - 1;y >= 0;y--){
for(var k = 0;k < W;k++){
x = g.par ? k : W - 1 - k;i = y * W + x;v = cel[i];
if(v < 2)continue;
if(y === H - 1){cel[i]= 0;g.derramada++;movido = true;continue;}
d = i + W;
if(cel[d]=== 0){cel[d]= v;cel[i]= 0;movido = true;continue;}
izq = x > 0 && cel[d - 1]=== 0 && cel[i - 1]=== 0;der = x < W - 1 && cel[d + 1]=== 0 && cel[i + 1]=== 0;
if(izq && der){if(Math.random()< 0.5)izq = false;else der = false;}
if(izq){cel[d - 1]= v;cel[i]= 0;movido = true;}else if(der){cel[d + 1]= v;cel[i]= 0;movido = true;}
}
}
return movido;
}
function dibujar(){
var cel = g.cel,i,x,y;
for(i = 0;i < W * H;i++)pix[i]= PALETA[cel[i]];
for(var m = 0;m < COLORES.length;m++){
y = FONDO_Y + 1 -(m + 1)* ALTO_BANDA;
for(x = 6;x <= 9;x++){pix[y * W + x]= MARCA;pix[y * W +(W - 1 - x)]= MARCA;}
}
if(!g.fin){var c = PALETA[2 + g.color];for(x = g.x - 1;x <= g.x + 1;x++)pix[x]= c;pix[W + g.x]= c;}
ctx.putImageData(imagen,0,0);
}
function bucle(){
if(!g || g.fin)return;
verter();
if(g.fin)return;
paso();
if(g.derramada !== g.mostrada){g.mostrada = g.derramada;ui.hud.poner('derramada',g.derramada);}
dibujar();
raf = requestAnimationFrame(bucle);
}
function evaluar(){
var cel = g.cel,capas =[],total = 0,exceso = 0,c,y,x,buenas,malas;
for(c = 0;c < COLORES.length;c++){
buenas = 0;malas = 0;
var abajo = FONDO_Y - c * ALTO_BANDA,arriba = abajo - ALTO_BANDA + 1;
for(y = arriba;y <= abajo;y++)for(x = X0;x <= X1;x++){var v = cel[y * W + x];if(v === 2 + c)buenas++;else if(v >= 2)malas++;}
capas.push({buenas: buenas,malas: malas,pct: Math.max(0,Math.round(100 *(buenas - malas)/(ANCHO * ALTO_BANDA)))});
total += buenas - malas;
}
for(y = 0;y < TOPE_BANDAS;y++)for(x = X0;x <= X1;x++)if(cel[y * W + x]>= 2)exceso++;
total -= 0.5 * exceso;
return{capas: capas,exceso: exceso,puntos: Math.max(0,Math.round(100 * total /(ANCHO * ALTO_BANDA * COLORES.length)))};
}
function terminar(){
if(!g || g.fin)return;
g.vertiendo = false;
for(var n = 0;n < 400 && paso();n++){}
g.fin = true;cancelAnimationFrame(raf);dibujar();
document.removeEventListener('visibilitychange',alVisibilidad);
var r = evaluar(),nivel = U.nivel(r.puntos,RANGOS),nombres = COLORES.map(function(c){return c.nombre;});
sesion.registrar(r.puntos);
var detalles = r.capas.map(function(c,i){return 'Capa ' +(i + 1)+ ' (' + nombres[i]+ '): ' + c.pct + ' % bien rellena';});
detalles.push('Arena por encima de la última marca: ' + r.exceso + ' granos','Arena derramada fuera del vaso: ' + g.derramada + ' granos');
TYJ.final(raiz,{titulo: 'Vaso terminado',puntos: r.puntos,unidad: '%',nivel: nivel,detalles: detalles,
compartir: 'Arena de colores · ' + r.puntos + ' % de acierto en las tres capas (' + nivel + ')',alRepetir: jugar,textoRepetir: 'Otro vaso'});
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
inicio();
})();

(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('de');
if(!raiz)return;
var RONDAS = 8,LAT_MAX = 84,LAT_MIN = -60,W = 720,H = 288,PX = 3;
var NIVELES =[[0,'Turista despistado'],[1500,'Viajero'],[3000,'Explorador'],[4500,'Cartógrafo'],[6000,'Navegante'],[7000,'Magallanes']];
var sesion = TYJ.Sesion(null,{}),mapa,lugares,base,e,ui,c,ctx;
function color(nombre,defecto){var v = getComputedStyle(raiz).getPropertyValue(nombre).trim();return v || defecto;}
function ax(lon){return(lon + 180)/ 360 * W;}
function ay(lat){return(LAT_MAX - lat)/(LAT_MAX - LAT_MIN)* H;}
function construirBase(){
var pw = W / PX,ph = H / PX,off = document.createElement('canvas');off.width = pw;off.height = ph;
var o = off.getContext('2d');
function trazar(pts){o.beginPath();pts.forEach(function(p,i){var x = ax(p[0])/ PX,y = ay(p[1])/ PX;if(i)o.lineTo(x,y);else o.moveTo(x,y);});o.closePath();o.fill();}
o.fillStyle = '#fff';Object.keys(mapa.tierras).forEach(function(k){trazar(mapa.tierras[k]);});
o.globalCompositeOperation = 'destination-out';Object.keys(mapa.mares).forEach(function(k){trazar(mapa.mares[k]);});
var img = o.getImageData(0,0,pw,ph),d = img.data,i;
var tierra = hex(c.tierra),mar = hex(c.mar);
for(i = 0;i < d.length;i += 4){var t = d[i + 3]> 110,col = t ? tierra : mar;d[i]= col[0];d[i + 1]= col[1];d[i + 2]= col[2];d[i + 3]= 255;}
o.putImageData(img,0,0);
return off;
}
function hex(s){s = s.replace('#','');return[parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)];}
function montar(){
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['ronda','Lugar','1 de ' + RONDAS],['puntos','Puntos',0]]);
ui.pregunta = h('p',{class: 'de-pregunta','aria-live': 'polite'});
ui.canvas = h('canvas',{class: 'de-canvas',width: W,height: H,tabindex: '0',role: 'application',
'aria-label': 'Mapa del mundo. Con las flechas mueves la mira y con Intro o la barra espaciadora confirmas. Con el ratón o el dedo, haz clic o toca donde creas que está.'});
ctx = ui.canvas.getContext('2d');ctx.imageSmoothingEnabled = false;
ui.mapa = h('div',{class: 'de-mapa'},ui.canvas);
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite'});
ui.sig = h('div',{class: 'fila fila--centro'});
ui.final = h('div');ui.est = h('div');
[ui.hud.nodo,ui.pregunta,ui.mapa,ui.msg,ui.sig,ui.final,ui.est].forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
ui.canvas.addEventListener('click',function(ev){
if(e.fase !== 'colocar')return;
var r = ui.canvas.getBoundingClientRect(),x =(ev.clientX - r.left)* W / r.width,y =(ev.clientY - r.top)* H / r.height;
confirmar(x / W * 360 - 180,LAT_MAX - y / H *(LAT_MAX - LAT_MIN));
});
ui.canvas.addEventListener('keydown',function(ev){
if(e.fase !== 'colocar')return;
var paso = ev.shiftKey ? 10 : 3,m ={ArrowLeft:[-paso,0],ArrowRight:[paso,0],ArrowUp:[0,paso],ArrowDown:[0,-paso]}[ev.key];
if(m){ev.preventDefault();e.mira ={lon: U.limitar(e.mira.lon + m[0],-180,180),lat: U.limitar(e.mira.lat + m[1],LAT_MIN,LAT_MAX)};e.tecl = true;dibujar();ui.msg.textContent = 'Mira en latitud ' + Math.round(e.mira.lat)+ ' y longitud ' + Math.round(e.mira.lon)+ '. Pulsa Intro para confirmar.';}
else if(ev.key === 'Enter' || ev.key === ' '){ev.preventDefault();if(e.tecl)confirmar(e.mira.lon,e.mira.lat);else ui.msg.textContent = 'Mueve primero la mira con las flechas.';}
});
}
function empezar(){
e ={ronda: 0,puntos: 0,lugares: U.muestra(lugares,RONDAS),fase: 'colocar',mira:{lon: 0,lat: 20},tecl: false,res:[]};
montar();ronda();
}
function ronda(){
var l = e.lugares[e.ronda];
e.fase = 'colocar';e.tecl = false;e.mira ={lon: 0,lat: 20};e.user = null;
ui.hud.poner('ronda',(e.ronda + 1)+ ' de ' + RONDAS);
TYJ.vaciar(ui.pregunta);ui.pregunta.appendChild(document.createTextNode('¿Dónde está '));
ui.pregunta.appendChild(h('strong',{texto: l.n}));ui.pregunta.appendChild(document.createTextNode('? '));
ui.pregunta.appendChild(h('span',{class: 'de-tipo',texto: l.t}));
ui.msg.className = 'mensaje';ui.msg.textContent = 'Haz clic o toca en el mapa.';
TYJ.vaciar(ui.sig);dibujar();
}
function dibujar(){
ctx.imageSmoothingEnabled = false;
ctx.drawImage(base,0,0,W,H);
ctx.lineWidth = 1;ctx.strokeStyle = c.rejilla;
var lo,la;
for(lo = -150;lo <= 150;lo += 30){ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(ax(lo)+ 0.5,0);ctx.lineTo(ax(lo)+ 0.5,H);ctx.stroke();}
for(la = -30;la <= 60;la += 30){ctx.setLineDash(la === 0 ?[]:[3,5]);ctx.beginPath();ctx.moveTo(0,ay(la)+ 0.5);ctx.lineTo(W,ay(la)+ 0.5);ctx.stroke();}
ctx.setLineDash([]);
var l = e.lugares[e.ronda];
if(e.fase === 'colocar' && e.tecl)cruz(ax(e.mira.lon),ay(e.mira.lat),c.tiza,10);
if(e.fase === 'resultado'){
var u = e.user;
ctx.strokeStyle = c.tiza;ctx.lineWidth = 2;ctx.setLineDash([4,4]);
ctx.beginPath();ctx.moveTo(ax(u.lon),ay(u.lat));ctx.lineTo(ax(l.lon),ay(l.lat));ctx.stroke();ctx.setLineDash([]);
cruz(ax(u.lon),ay(u.lat),c.rosa,8);
var x = ax(l.lon),y = ay(l.lat);
ctx.fillStyle = c.fondo;ctx.fillRect(x - 6,y - 6,12,12);ctx.fillStyle = c.limon;ctx.fillRect(x - 4,y - 4,8,8);
}
}
function cruz(x,y,col,r){ctx.fillStyle = c.fondo;ctx.fillRect(x - r - 1,y - 3,2 * r + 2,6);ctx.fillRect(x - 3,y - r - 1,6,2 * r + 2);ctx.fillStyle = col;ctx.fillRect(x - r,y - 1.5,2 * r,3);ctx.fillRect(x - 1.5,y - r,3,2 * r);}
function confirmar(lon,lat){
if(e.fase !== 'colocar')return;
var l = e.lugares[e.ronda],km = U.haversine(lat,lon,l.lat,l.lon),pts = Math.round(1000 * Math.exp(-km / 1500));
e.fase = 'resultado';e.user ={lon: lon,lat: lat};e.puntos += pts;e.res.push({km: km,pts: pts});
ui.hud.poner('puntos',U.miles(e.puntos));
dibujar();
ui.msg.className = 'mensaje ' +(km < 500 ? 'mensaje--ok' : '');
ui.msg.textContent = 'Has quedado a ' + U.miles(Math.round(km / 10)* 10)+ ' km de ' + l.n + ': +' + pts + ' puntos. (Cuadrado limón: sitio real. Cruz rosa: tu marca.)';
var ultima = e.ronda === RONDAS - 1;
var b = h('button',{class: 'boton-retro',type: 'button',onclick: function(){if(ultima)fin();else{e.ronda++;ronda();ui.canvas.focus({preventScroll: true});}}},ultima ? 'Ver resultado' : 'Siguiente lugar');
TYJ.vaciar(ui.sig);ui.sig.appendChild(b);b.focus({preventScroll: true});
}
function fin(){
sesion.registrar(e.puntos);
var media = Math.round(e.res.reduce(function(a,r){return a + r.km;},0)/ e.res.length),mejor = Math.round(Math.min.apply(null,e.res.map(function(r){return r.km;})));
TYJ.vaciar(ui.sig);ui.msg.textContent = '';
var cont = h('div');ui.final.appendChild(cont);
TYJ.final(cont,{titulo: 'Fin del viaje',puntos: e.puntos,unidad: 'puntos de 8000',nivel: U.nivel(e.puntos,NIVELES),
detalles:['Error medio: ' + U.miles(media)+ ' km','Tu mejor acierto: a ' + U.miles(mejor)+ ' km'],
compartir: '¿Dónde está?: ' + U.miles(e.puntos)+ ' de 8.000 puntos (error medio ' + U.miles(media)+ ' km).',textoRepetir: 'Otro viaje',alRepetir: empezar});
}
function arrancar(){
Promise.all([TYJ.datos('donde-esta/mapa.json'),TYJ.datos('donde-esta/lugares.json')]).then(function(r){
mapa = r[0];lugares = r[1].lugares;
c ={tierra: '#2F6B5C',mar: '#14201C',rejilla: 'rgba(175,196,187,0.35)',fondo: '#14201C',tiza: '#EAF2EE',limon: '#E6F14A',rosa: '#FF5A7D'};
base = construirBase();
empezar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

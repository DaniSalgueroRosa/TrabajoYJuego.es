(function(){
'use strict';
var host = TT.app();
if(!host)return;
var INTENTOS = 3,LADO = 440;
var estado = 'listo',pts =[],notas =[],panel = null,ctx = null,dpr = 1;
var datos = TT.datos([['i','Intento','1/3'],['u','Último','—'],['m','Mejor','—']]);
var lienzo = TT.h('canvas',{class: 'dc-lienzo',role: 'img','aria-label': 'Zona de dibujo: traza un círculo con el ratón o el dedo'});
var mensaje = TT.h('p',{class: 'dp-mensaje',role: 'status'});
var zona = TT.h('div',{class: 'tt-zona dp-zona'},lienzo,mensaje);
function preparar(){
dpr = Math.min(2,window.devicePixelRatio || 1);
var w = Math.max(220,Math.min(LADO,lienzo.parentNode ? lienzo.parentNode.clientWidth - 48 : LADO));
lienzo.style.width = w + 'px';lienzo.style.height = w + 'px';
lienzo.width = Math.round(w * dpr);lienzo.height = Math.round(w * dpr);
ctx = lienzo.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
limpiar();
}
function color(v){return getComputedStyle(document.body).getPropertyValue(v).trim()|| '#14201C';}
function limpiar(){
var w = lienzo.clientWidth;
ctx.clearRect(0,0,w,w);
ctx.strokeStyle = 'rgba(128,128,128,0.35)';ctx.lineWidth = 1;ctx.setLineDash([2,6]);
ctx.beginPath();ctx.arc(w / 2,w / 2,3,0,Math.PI * 2);ctx.stroke();ctx.setLineDash([]);
}
function punto(e){var b = lienzo.getBoundingClientRect(),k = lienzo.clientWidth /(b.width || 1);return[(e.clientX - b.left)* k,(e.clientY - b.top)* k];}
function inicio(e){
if(e.pointerType === 'mouse' && e.button !== 0)return;
if(notas.length >= INTENTOS)return;
e.preventDefault();
limpiar();pts =[punto(e)];estado = 'dibujando';
try{lienzo.setPointerCapture(e.pointerId);}catch(x){}
mensaje.textContent = '';
}
function mover(e){
if(estado !== 'dibujando')return;
var p = punto(e),u = pts[pts.length - 1];
if(Math.hypot(p[0]- u[0],p[1]- u[1])< 1.5)return;
pts.push(p);
ctx.strokeStyle = color('--t-acento');ctx.lineWidth = 4;ctx.lineCap = 'round';ctx.lineJoin = 'round';
ctx.beginPath();ctx.moveTo(u[0],u[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();
}
function fin(){if(estado !== 'dibujando')return;estado = 'listo';evaluar();}
lienzo.addEventListener('pointerdown',inicio);
lienzo.addEventListener('pointermove',mover);
lienzo.addEventListener('pointerup',fin);
lienzo.addEventListener('pointercancel',fin);
window.addEventListener('pointerup',fin);
lienzo.addEventListener('contextmenu',function(e){e.preventDefault();});
function remuestrear(p,n){
var acum =[0],i;
for(i = 1;i < p.length;i++)acum.push(acum[i - 1]+ Math.hypot(p[i][0]- p[i - 1][0],p[i][1]- p[i - 1][1]));
var total = acum[acum.length - 1],r =[],j = 1;
for(i = 0;i < n;i++){
var d = total * i /(n - 1);
while(j < p.length - 1 && acum[j]< d)j++;
var seg = acum[j]- acum[j - 1]|| 1,t =(d - acum[j - 1])/ seg;
r.push([p[j - 1][0]+(p[j][0]- p[j - 1][0])* t,p[j - 1][1]+(p[j][1]- p[j - 1][1])* t]);
}
return{pts: r,largo: total};
}
function ajustar(p){
var n = p.length,mx = 0,my = 0,i;
p.forEach(function(q){mx += q[0];my += q[1];});mx /= n;my /= n;
var Suu = 0,Suv = 0,Svv = 0,Suuu = 0,Svvv = 0,Suvv = 0,Svuu = 0;
for(i = 0;i < n;i++){var u = p[i][0]- mx,v = p[i][1]- my;Suu += u * u;Suv += u * v;Svv += v * v;Suuu += u * u * u;Svvv += v * v * v;Suvv += u * v * v;Svuu += v * u * u;}
var det = Suu * Svv - Suv * Suv;
if(Math.abs(det)< 1e-9)return null;
var b1 = 0.5 *(Suuu + Suvv),b2 = 0.5 *(Svvv + Svuu),uc =(b1 * Svv - b2 * Suv)/ det,vc =(b2 * Suu - b1 * Suv)/ det;
return{cx: mx + uc,cy: my + vc,R: Math.sqrt(uc * uc + vc * vc +(Suu + Svv)/ n)};
}
function invalido(txt){mensaje.textContent = txt + ' Ese intento no cuenta; prueba otra vez.';}
function evaluar(){
if(pts.length < 15){invalido('El trazo es demasiado corto.');return;}
var rm = remuestrear(pts,120),p = rm.pts,f = ajustar(p);
if(!f || !isFinite(f.R)|| f.R < 25){invalido('El círculo es demasiado pequeño o no es redondo.');return;}
var barrido = 0,prev = Math.atan2(p[0][1]- f.cy,p[0][0]- f.cx),i;
for(i = 1;i < p.length;i++){
var a = Math.atan2(p[i][1]- f.cy,p[i][0]- f.cx),d = a - prev;
while(d > Math.PI)d -= 2 * Math.PI;
while(d <= -Math.PI)d += 2 * Math.PI;
barrido += d;prev = a;
}
var vueltas = Math.abs(barrido)/(2 * Math.PI);
if(vueltas < 0.88){invalido('No has cerrado el círculo: da una vuelta entera.');return;}
if(vueltas > 1.4){invalido('Has dado más de una vuelta: traza una sola.');return;}
var suma = 0;
p.forEach(function(q){var e = Math.hypot(q[0]- f.cx,q[1]- f.cy)- f.R;suma += e * e;});
var rd = Math.sqrt(suma / p.length)/ f.R,hueco = Math.hypot(p[0][0]- p[p.length - 1][0],p[0][1]- p[p.length - 1][1])/ f.R;
var penal = hueco <= 0.25 ? 1 : Math.max(0.55,1 -(hueco - 0.25)* 0.6);
var nota = Math.round(100 * Math.exp(-rd * 100 / 5.5)* penal);
notas.push({nota: nota,rd: rd * 100,hueco: hueco,diam: f.R * 2});
ctx.save();ctx.strokeStyle = color('--t-texto');ctx.lineWidth = 2;ctx.setLineDash([7,6]);
ctx.beginPath();ctx.arc(f.cx,f.cy,f.R,0,Math.PI * 2);ctx.stroke();ctx.restore();
var mejor = Math.max.apply(null,notas.map(function(n){return n.nota;}));
datos.poner('i',Math.min(notas.length + 1,INTENTOS)+ '/' + INTENTOS);datos.poner('u',String(nota));datos.poner('m',String(mejor));
lienzo.setAttribute('data-nota',String(nota));
mensaje.textContent = 'Intento ' + notas.length + ': ' + nota + ' puntos. La línea de trazos es el círculo que mejor se ajusta a tu trazo.' +(notas.length < INTENTOS ? ' Dibuja el siguiente cuando quieras.' : '');
TT.anunciar('Intento ' + notas.length + ': ' + nota + ' puntos.');
if(notas.length >= INTENTOS)window.setTimeout(terminar,700);
}
function terminar(){
estado = 'fin';
var notasN = notas.map(function(n){return n.nota;}),mejor = Math.max.apply(null,notasN),ib = notasN.indexOf(mejor),m = notas[ib];
var rango = TT.rango(mejor,[
[0,'Un círculo con ganas','Todavía se nota el temblor o la forma de huevo. Dibuja con el brazo, no solo con la muñeca.'],
[40,'Redondeado','Se reconoce un círculo, con algunos bultos.'],
[60,'Buen pulso','Un círculo bastante regular.'],
[75,'Pulso firme','Muy pocas desviaciones del radio.'],
[88,'Casi de compás','Un círculo muy limpio.'],
[95,'Círculo de manual','Un círculo casi perfecto.']]);
panel = TT.resultado(host,{titulo: 'Tu mejor círculo',valor: mejor,unidad: 'puntos de 100',rango: rango,
extra: TT.barras(notasN,{max: 100,formato: function(x){return x + '';},descripcion: 'Puntos de cada intento',pie:['Intento 1','Intento ' + notasN.length]}),
detalles:[['Media de los tres',TT.fmt(TT.media(notasN),0)+ ' puntos'],['Desviación del radio (mejor)',TT.fmt(m.rd,1)+ ' %'],['Hueco sin cerrar (mejor)',TT.fmt(m.hueco * 100,0)+ ' % del radio'],['Diámetro (mejor)',TT.fmt(m.diam,0)+ ' px']],
copia: 'Mi mejor círculo a mano alzada: ' + mejor + ' puntos de 100.',alRepetir: reiniciar});
TT.anunciar('Resultado: mejor intento, ' + mejor + ' puntos.');
TT.enfocar(panel);
}
function reiniciar(){
estado = 'listo';notas =[];pts =[];
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;
lienzo.removeAttribute('data-nota');
datos.poner('i','1/' + INTENTOS);datos.poner('u','—');datos.poner('m','—');
limpiar();
mensaje.textContent = 'Traza un círculo de una sola vuelta, a mano alzada y sin levantar el ratón ni el dedo. Tienes tres intentos.';
}
host.appendChild(datos.nodo);
host.appendChild(zona);
preparar();
reiniciar();
window.addEventListener('resize',function(){if(estado === 'listo' && !notas.length){preparar();reiniciar();}});
})();

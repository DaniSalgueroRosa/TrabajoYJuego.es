(function(){
'use strict';
var host = TT.app();
if(!host)return;
var VEL ={l: 0.6,n: 1,r: 1.5},NOM_VEL ={l: 'velocidad lenta',n: 'velocidad normal',r: 'velocidad rápida'};
var FREQ =[[0.7,1.3,0.85,1.6],[0.8,1.5,0.65,1.4],[0.6,1.7,0.9,1.25]];
var dur = 20,vel = 'n',estado = 'espera',t0 = 0,ult = 0,raf = 0,pos = null,panel = null;
var f = FREQ[0],sx = 1,sy = 1,radio = 40;
var dentro = 0,total = 0,sumaDist = 0,racha = 0,mejorRacha = 0,seg =[],segTot =[];
var cDur = TT.chips([[10,'10 s'],[20,'20 s'],[30,'30 s']],dur,function(v){dur = v;reiniciar();},'Duración');
var cVel = TT.chips([['l','Lenta'],['n','Normal'],['r','Rápida']],vel,function(v){vel = v;reiniciar();},'Velocidad del círculo');
var datos = TT.datos([['t','Tiempo restante',TT.fmt(dur,1)+ ' s'],['p','Dentro del círculo','0 %'],['r','Mejor racha','0,0 s']]);
var mensaje = TT.h('p',{class: 'mo-mensaje'});
var obj = TT.h('div',{class: 'mo-obj','aria-hidden': 'true','data-dentro': '0'});
var area = TT.h('div',{class: 'tt-zona mo-area',role: 'application','aria-label': 'Zona de seguimiento: mantén el cursor dentro del círculo que se mueve'},obj,mensaje);
function dim(){return{w: area.clientWidth,h: area.clientHeight};}
function posicion(t){
var d = dim(),ax = d.w / 2 - radio - 6,ay = d.h / 2 - radio - 6;
return[d.w / 2 + sx * ax *(0.62 * Math.sin(f[0]* t)+ 0.38 * Math.sin(f[1]* t)),d.h / 2 + sy * ay *(0.62 * Math.sin(f[2]* t)+ 0.38 * Math.sin(f[3]* t))];
}
function colocar(p){obj.style.transform = 'translate(' +(p[0]- radio).toFixed(1)+ 'px,' +(p[1]- radio).toFixed(1)+ 'px)';obj.setAttribute('data-x',p[0].toFixed(1));obj.setAttribute('data-y',p[1].toFixed(1));}
function reiniciar(){
if(raf){cancelAnimationFrame(raf);raf = 0;}
estado = 'espera';pos = null;dentro = 0;total = 0;sumaDist = 0;racha = 0;mejorRacha = 0;seg =[];segTot =[];
for(var i = 0;i < dur;i++){seg.push(0);segTot.push(0);}
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;
cDur.bloquear(false);cVel.bloquear(false);
var d = dim();
radio = Math.max(26,Math.min(d.h * 0.13,d.w * 0.1));
obj.style.width = obj.style.height =(radio * 2)+ 'px';
obj.setAttribute('data-dentro','0');
colocar([d.w / 2,d.h / 2]);
datos.poner('t',TT.fmt(dur,1)+ ' s',false);datos.poner('p','0 %',false);datos.poner('r',TT.fmt(0,1)+ ' s',false);
mensaje.textContent = 'Pulsa sobre el círculo para empezar. Después síguelo con el cursor, o con el dedo sin levantarlo.';
}
function empezar(){
estado = 'jugando';t0 = performance.now();ult = t0;
f = TT.elegir(FREQ);sx = Math.random()< 0.5 ? 1 : -1;sy = Math.random()< 0.5 ? 1 : -1;
cDur.bloquear(true);cVel.bloquear(true);
mensaje.textContent = '';
TT.anunciar('Empieza el test, ' + dur + ' segundos. Mantén el cursor dentro del círculo.');
raf = requestAnimationFrame(bucle);
}
function bucle(){
if(estado !== 'jugando')return;
raf = requestAnimationFrame(bucle);
var ahora = performance.now(),t =(ahora - t0)/ 1000,dt = Math.min(ahora - ult,100)/ 1000;
ult = ahora;
if(t >= dur){terminar();return;}
var p = posicion(t * VEL[vel]);
colocar(p);
var dist = pos ? Math.hypot(pos[0]- p[0],pos[1]- p[1]): 3 * radio,en = dist <= radio,i = Math.min(dur - 1,Math.floor(t));
total += dt;segTot[i]+= dt;sumaDist += Math.min(dist,3 * radio)* dt;
if(en){dentro += dt;seg[i]+= dt;racha += dt;if(racha > mejorRacha)mejorRacha = racha;}else racha = 0;
obj.setAttribute('data-dentro',en ? '1' : '0');
datos.poner('t',TT.fmt(dur - t,1)+ ' s',dur - t < 3);
datos.poner('p',TT.fmt(total ? dentro / total * 100 : 0,0)+ ' %');
datos.poner('r',TT.fmt(mejorRacha,1)+ ' s');
}
function terminar(){
if(raf){cancelAnimationFrame(raf);raf = 0;}
estado = 'fin';pos = null;obj.setAttribute('data-dentro','0');
mensaje.textContent = '¡Tiempo!';
var pct = total ? dentro / total * 100 : 0,dist = total ? sumaDist / total : 0;
var rango = TT.rango(pct,[
[0,'Se te escapa','El círculo va por delante. Empieza con la velocidad lenta y mira un poco por delante de él, no encima.'],
[30,'Siguiéndole','Lo alcanzas a ratos. Prueba a mover la muñeca en lugar de dar tirones.'],
[50,'Buen seguimiento','Pasas más de la mitad del tiempo dentro. Vas por buen camino.'],
[65,'Coordinado','Un seguimiento estable de mano y vista.'],
[80,'Muy coordinado','Casi no pierdes el círculo, ni en las curvas.'],
[90,'Pulso de cirujano','Un seguimiento casi perfecto. Prueba con la velocidad rápida.']]);
var v = seg.map(function(s,i){return segTot[i]> 0.2 ? Math.round(s / segTot[i]* 100): 0;});
var ajustes = dur + ' s, ' + NOM_VEL[vel];
window.setTimeout(function(){
if(estado !== 'fin')return;
panel = TT.resultado(host,{titulo: 'Tu coordinación',valor: TT.fmt(pct,0),unidad: '% del tiempo dentro',rango: rango,
extra: TT.barras(v,{max: 100,formato: function(x){return x + ' %';},descripcion: 'Porcentaje de cada segundo que estuviste dentro del círculo',pie:['0 s',dur + ' s']}),
detalles:[['Mejor racha dentro',TT.fmt(mejorRacha,1)+ ' s'],['Distancia media al centro',TT.fmt(dist,0)+ ' px'],['Tamaño del círculo',TT.fmt(radio * 2,0)+ ' px'],['Ajustes',dur + ' s · ' + NOM_VEL[vel]]],
copia: 'Mi coordinación mano-ojo: ' + TT.fmt(pct,0)+ ' % del tiempo dentro del círculo (' + ajustes + ').',alRepetir: reiniciar});
TT.anunciar('Resultado: ' + TT.fmt(pct,0)+ ' por ciento del tiempo dentro del círculo.');
TT.enfocar(panel);
},500);
}
function actualizar(e){var b = area.getBoundingClientRect();pos =[e.clientX - b.left,e.clientY - b.top];}
area.addEventListener('pointerdown',function(e){
if(e.pointerType === 'mouse' && e.button !== 0)return;
actualizar(e);
if(estado === 'espera'){
var c =[parseFloat(obj.getAttribute('data-x')),parseFloat(obj.getAttribute('data-y'))];
if(Math.hypot(pos[0]- c[0],pos[1]- c[1])<= radio * 1.4)empezar();
}
});
area.addEventListener('pointermove',function(e){if(estado === 'jugando')actualizar(e);});
area.addEventListener('pointerleave',function(){pos = null;});
area.addEventListener('pointercancel',function(){pos = null;});
area.addEventListener('pointerup',function(e){if(e.pointerType !== 'mouse')pos = null;});
area.addEventListener('contextmenu',function(e){e.preventDefault();});
var tactil = false;
try{tactil = window.matchMedia('(pointer: coarse)').matches;}catch(e){tactil = false;}
host.appendChild(TT.h('p',{class: 'tt-aviso',texto: tactil ? 'Pantalla táctil detectada: mantén el dedo apoyado y síguelo; si lo levantas, cuenta como fuera del círculo.' : 'Este test es para ratón o pantalla táctil. Si el cursor sale de la zona, cuenta como fuera del círculo.'}));
host.appendChild(TT.h('div',{class: 'tt-fila'},TT.h('p',{class: 'tt-etiqueta',texto: 'Duración'}),cDur.nodo,TT.h('p',{class: 'tt-etiqueta',texto: 'Velocidad'}),cVel.nodo));
host.appendChild(datos.nodo);
host.appendChild(area);
reiniciar();
window.addEventListener('resize',function(){if(estado === 'espera')reiniciar();});
})();

(function(){
'use strict';
var host = TT.app();
if(!host)return;
var VUELTA = 2 * Math.PI,dur = 10,estado = 'espera',t0 = 0,reloj = 0,panel = null;
var previo = null,corrida,pico,banco,giros,radios,ultimo = null;
var chips = TT.chips([[5,'5 s'],[10,'10 s'],[20,'20 s']],dur,function(v){dur = v;reiniciar();},'Duración del test');
var datos = TT.datos([['t','Tiempo restante',TT.fmt(dur,1)+ ' s'],['v','Vueltas','0,0'],['s','Vueltas por segundo','0,00']]);
var aguja = TT.h('div',{class: 'gr-aguja','aria-hidden': 'true'});
var texto = TT.h('p',{class: 'gr-texto'});
var pad = TT.h('div',{class: 'tt-zona gr-pad',tabindex: '0',role: 'application','aria-label': 'Zona de giros: mueve el cursor en círculos alrededor del centro'},TT.h('div',{class: 'gr-anillo','aria-hidden': 'true'}),aguja,TT.h('div',{class: 'gr-centro','aria-hidden': 'true'}),texto);
function ceros(){previo = null;corrida = 0;pico = 0;banco = 0;giros ={h: 0,a: 0};radios =[];}
function total(){return banco + pico / VUELTA;}
function textos(){texto.textContent = estado === 'espera' ? 'Mueve el cursor en círculos alrededor del centro' : estado === 'midiendo' ? '' : 'Tiempo';}
function reiniciar(){
clearInterval(reloj);reloj = 0;estado = 'espera';ceros();
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;chips.bloquear(false);
datos.poner('t',TT.fmt(dur,1)+ ' s',false);datos.poner('v',TT.fmt(0,1));datos.poner('s',TT.fmt(0,2));
textos();
}
function tic(){
var t =(performance.now()- t0)/ 1000;
if(t >= dur){terminar();return;}
datos.poner('t',TT.fmt(dur - t,1)+ ' s',dur - t < 3);
datos.poner('v',TT.fmt(total(),1));datos.poner('s',TT.fmt(total()/ Math.max(t,1),2));
}
function punto(x,y){
var r = pad.getBoundingClientRect(),cx = r.left + r.width / 2,cy = r.top + r.height / 2,R = Math.min(r.width,r.height)/ 2;
var dx = x - cx,dy = y - cy,radio = Math.sqrt(dx * dx + dy * dy);
if(radio < R * 0.18)return;
var ang = Math.atan2(dy,dx);
aguja.style.transform = 'rotate(' + ang + 'rad)';
if(estado === 'espera'){estado = 'midiendo';t0 = performance.now();chips.bloquear(true);reloj = setInterval(tic,50);textos();TT.anunciar('Empieza el test.');}
if(estado !== 'midiendo')return;
radios.push(radio / R);
if(previo !== null){
var d = ang - previo;
if(d > Math.PI)d -= VUELTA;else if(d < -Math.PI)d += VUELTA;
if(Math.abs(d)< 1.6){
corrida += d;
var a = Math.abs(corrida);
if(a > pico)pico = a;
else if(pico - a > 0.7){
var n = Math.floor(pico / VUELTA + 0.03);
banco += n;if(corrida > 0)giros.h += n;else giros.a += n;
corrida = d;pico = Math.abs(d);
}
}
}
previo = ang;
}
function mover(e){
var lista = e.getCoalescedEvents ? e.getCoalescedEvents():[];
if(!lista.length)lista =[e];
for(var i = 0;i < lista.length;i++)punto(lista[i].clientX,lista[i].clientY);
}
function terminar(){
clearInterval(reloj);reloj = 0;estado = 'fin';textos();
var n = Math.floor(pico / VUELTA + 0.03);if(pico > 0){if(corrida > 0)giros.h += n;else giros.a += n;}
var v = total(),s = v / dur;
datos.poner('t',TT.fmt(0,1)+ ' s',false);datos.poner('v',TT.fmt(v,1));datos.poner('s',TT.fmt(s,2));
var media = TT.media(radios),regular = radios.length > 10 && media > 0 ? TT.limitar(100 - TT.desviacion(radios)/ media * 100,0,100): 0;
var rango = TT.rango(s,[
[0,'Paseo','Das vueltas con calma. Con un poco de ritmo la cifra sube enseguida.'],
[0.5,'Trote','Un giro suave y constante.'],
[1,'Remolino','Una vuelta por segundo o más: buena muñeca.'],
[1.5,'Torbellino','Giras muy rápido y sin perder el centro.'],
[2,'Tornado','Un ritmo que exige un movimiento muy ligero del cursor.'],
[3,'Huracán','Una cifra altísima. Comprueba que tu ratón no pierda lecturas a esa velocidad.']]);
var detalles =[['Duración',dur + ' s'],['Vueltas por segundo',TT.fmt(s,2)],['Vueltas en sentido horario',giros.h],['Vueltas en sentido antihorario',giros.a],['Regularidad del círculo',TT.fmt(regular,0)+ ' %']];
panel = TT.resultado(host,{titulo: 'Tus giros de ratón',valor: TT.fmt(v,2),unidad: 'vueltas',rango: rango,detalles: detalles,
copia: 'He dado ' + TT.fmt(v,2)+ ' vueltas con el ratón en ' + dur + ' s (' + TT.fmt(s,2)+ ' por segundo).',alRepetir: reiniciar});
TT.anunciar('Resultado: ' + TT.fmt(v,2)+ ' vueltas.');
TT.enfocar(panel);
}
pad.addEventListener('pointermove',mover);
pad.addEventListener('pointerdown',function(e){mover(e);});
ceros();
host.appendChild(TT.h('div',{class: 'tt-fila'},TT.h('p',{class: 'tt-etiqueta',texto: 'Duración'}),chips.nodo));
host.appendChild(datos.nodo);
host.appendChild(pad);
textos();
})();

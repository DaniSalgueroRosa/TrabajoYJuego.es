(function(){
'use strict';
var host = TT.app();
if(!host)return;
var NIVELES ={f:{n: 8,paso: 10,nombre: 'fácil'},m:{n: 12,paso: 6,nombre: 'medio'},d:{n: 16,paso: 3.5,nombre: 'difícil'}};
var nivel = 'f',orden =[],h0 = 0,sel = -1,t0 = 0,moves = 0,listo = false,panel = null;
var cNivel = TT.chips([['f','Fácil · 8 fichas'],['m','Medio · 12'],['d','Difícil · 16']],nivel,function(v){nivel = v;nuevo();},'Dificultad');
var datos = TT.datos([['t','Tiempo','0,0 s'],['m','Movimientos','0']]);
var fila = TT.h('div',{class: 'tc-fila',role: 'group','aria-label': 'Fichas de color. Los extremos están fijos; toca una ficha y luego otra para intercambiarlas.'});
var mensaje = TT.h('p',{class: 'tc-mensaje',role: 'status'});
var bComprobar = TT.boton('Comprobar el orden',function(){comprobar();});
var bMezclar = TT.boton('Mezclar otra vez',function(){nuevo();},true);
var zona = TT.h('div',{class: 'tt-zona tc-zona'},mensaje,fila);
var reloj = 0;
function color(i){return 'hsl(' +(((h0 + i * NIVELES[nivel].paso)% 360 + 360)% 360).toFixed(1)+ ' 62% 54%)';}
function nuevo(){
window.clearInterval(reloj);reloj = 0;t0 = 0;moves = 0;sel = -1;listo = false;
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;
var n = NIVELES[nivel].n,medio =[],i;
h0 = TT.azar(0,359);
for(i = 1;i < n - 1;i++)medio.push(i);
do{medio = TT.barajar(medio);}while(medio.every(function(v,k){return v === k + 1;}));
orden =[0].concat(medio,[n - 1]);
bComprobar.disabled = false;bMezclar.disabled = false;cNivel.bloquear(false);
datos.poner('t','0,0 s');datos.poner('m','0');
mensaje.textContent = 'Ordena las fichas de manera que el color cambie poco a poco de la primera a la última. Las dos de los extremos no se mueven.';
pintar();
}
function pintar(){
TT.vaciar(fila);
orden.forEach(function(id,pos){
var extremo = pos === 0 || pos === orden.length - 1;
var b = TT.h('button',{type: 'button',class: 'tc-ficha' +(extremo ? ' tc-ficha--fija' : '')+(pos === sel ? ' tc-ficha--sel' : ''),style: 'background:' + color(id),'aria-label': extremo ? 'Ficha ' +(pos + 1)+ ', extremo fijo' : 'Ficha ' +(pos + 1)+(pos === sel ? ', elegida' : ''),'aria-pressed': extremo ? false : String(pos === sel),disabled: extremo || listo});
b.setAttribute('data-pos',pos);b.setAttribute('data-id',id);
if(extremo)b.appendChild(TT.h('span',{class: 'tc-fijo','aria-hidden': 'true',texto: '•'}));
fila.appendChild(b);
});
}
fila.addEventListener('click',function(e){
var b = e.target.closest ? e.target.closest('.tc-ficha'): null;
if(!b || b.disabled || listo)return;
var pos = +b.getAttribute('data-pos');
if(!t0){t0 = performance.now();reloj = window.setInterval(function(){datos.poner('t',TT.fmt((performance.now()- t0)/ 1000,1)+ ' s');},200);}
if(sel < 0)sel = pos;
else if(sel === pos)sel = -1;
else{var x = orden[sel];orden[sel]= orden[pos];orden[pos]= x;sel = -1;moves++;datos.poner('m',String(moves));}
pintar();
var sigue = fila.querySelector('.tc-ficha--sel');
if(sigue)sigue.focus();else{var otra = fila.querySelector('[data-pos="' + pos + '"]');if(otra)otra.focus();}
});
function comprobar(){
if(listo)return;
listo = true;window.clearInterval(reloj);
var seg = t0 ?(performance.now()- t0)/ 1000 : 0,n = orden.length,bien = 0,error = 0,i;
for(i = 1;i < n - 1;i++){if(orden[i]=== i)bien++;error += Math.abs(orden[i]- i);}
var pct = bien /(n - 2)* 100;
bComprobar.disabled = true;bMezclar.disabled = true;cNivel.bloquear(true);
pintar();
var rango = TT.rango(pct,[
[0,'A ojo','Muchas fichas están lejos de su sitio. Fíjate en la dirección del cambio: ¿va de un color hacia otro de forma continua?'],
[40,'Buen principio','Has acertado una parte y el resto está cerca.'],
[70,'Buen ojo','La mayoría de las fichas están en su sitio.'],
[90,'Ojo fino','Casi todo en orden: solo alguna pareja intercambiada.'],
[100,'Degradado perfecto','Todas las fichas en su sitio.']]);
var tuyo = TT.h('div',{class: 'tc-comparar'}),real = TT.h('div',{class: 'tc-comparar'});
orden.forEach(function(id,pos){
var ok = pos === 0 || pos === n - 1 || id === pos;
tuyo.appendChild(TT.h('span',{class: 'tc-mini',style: 'background:' + color(id)},TT.h('b',{'aria-hidden': 'true',texto: pos === 0 || pos === n - 1 ? '•' : ok ? '✓' : '✗'})));
real.appendChild(TT.h('span',{class: 'tc-mini',style: 'background:' + color(pos)}));
});
var extra = TT.h('div',{class: 'tc-resumen'},TT.h('p',{class: 'tt-etiqueta',texto: 'Tu orden'}),tuyo,TT.h('p',{class: 'tt-etiqueta',texto: 'Orden correcto'}),real);
mensaje.textContent = 'Comprobado.';
panel = TT.resultado(host,{titulo: 'Tu sentido del tono',valor: TT.fmt(pct,0),unidad: '% de fichas en su sitio',rango: rango,extra: extra,
detalles:[['Fichas bien colocadas',bien + ' de ' +(n - 2)],['Error total (0 = perfecto)',error],['Movimientos',moves],['Tiempo',TT.fmt(seg,1)+ ' s'],['Dificultad',NIVELES[nivel].nombre + ' (' + n + ' fichas)']],
copia: 'He colocado ' + bien + ' de ' +(n - 2)+ ' fichas en el test de tono de color (' + NIVELES[nivel].nombre + ').',alRepetir: nuevo});
TT.anunciar('Resultado: ' + bien + ' de ' +(n - 2)+ ' fichas en su sitio.');
TT.enfocar(panel);
}
host.appendChild(TT.h('div',{class: 'tt-fila'},TT.h('p',{class: 'tt-etiqueta',texto: 'Dificultad'}),cNivel.nodo));
host.appendChild(datos.nodo);
host.appendChild(zona);
host.appendChild(TT.h('div',{class: 'tt-fila'},bComprobar,bMezclar));
nuevo();
})();

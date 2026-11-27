(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('sch');
if(!raiz)return;
var sesion = TYJ.Sesion(null,{mejor: false});
var lado = 5,mejores ={},t = null,ui = null,reloj = null;
function segundos(ms){return(ms / 1000).toFixed(1).replace('.',',')+ ' s';}
function inicio(){
clearInterval(reloj);t = null;
TYJ.vaciar(raiz);
var g = h('div',{class: 'fila',role: 'group','aria-label': 'Tamaño de la tabla'});
[4,5,6].forEach(function(n){
g.appendChild(h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(n === lado),onclick: function(){lado = n;inicio();}},n + '×' + n));
});
var est = h('div');
raiz.appendChild(g);
raiz.appendChild(h('p',{class: 'mensaje',texto: 'Pulsa los números del 1 al ' +(lado * lado)+ ' en orden. El tiempo empieza al pulsar «Empezar».'}));
raiz.appendChild(h('div',{class: 'fila fila--centro'},h('button',{class: 'boton-retro',type: 'button',onclick: empezar},'Empezar')));
raiz.appendChild(est);
sesion.montar(est);
}
function empezar(){
clearInterval(reloj);
var total = lado * lado,nums =[];
for(var i = 1;i <= total;i++)nums.push(i);
t ={total: total,orden: U.barajar(nums),siguiente: 1,fallos: 0,ini: Date.now(),fin: false};
TYJ.vaciar(raiz);
ui ={celdas:{}};
ui.hud = TYJ.hud([['sig','Busca el','1'],['tiempo','Tiempo','0,0 s'],['fallos','Fallos','0']]);
ui.tabla = h('div',{class: 'sch-tabla sch-t' + lado,role: 'group','aria-label': 'Tabla de ' + lado + ' por ' + lado});
t.orden.forEach(function(n){
var b = h('button',{class: 'sch-celda',type: 'button','data-n': String(n),onclick: function(){pulsar(n);}},String(n));
ui.celdas[n]= b;ui.tabla.appendChild(b);
});
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite'});
ui.final = h('div');ui.est = h('div');
[ui.hud.nodo,ui.tabla,ui.msg,h('div',{class: 'fila fila--centro'},h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: inicio},'Cambiar tamaño')),ui.final,ui.est].forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
reloj = setInterval(function(){if(!t.fin)ui.hud.poner('tiempo',segundos(Date.now()- t.ini));},100);
}
function pulsar(n){
if(t.fin)return;
if(n < t.siguiente)return;
if(n !== t.siguiente){
t.fallos++;ui.hud.poner('fallos',t.fallos,true);
ui.msg.textContent = 'Ese no es. Busca el ' + t.siguiente + '.';
return;
}
ui.celdas[n].classList.add('sch-hecho');
ui.celdas[n].setAttribute('aria-label',n + ', ya marcado');
t.siguiente++;
ui.msg.textContent = '';
if(t.siguiente > t.total)return acabar();
ui.hud.poner('sig',t.siguiente);
}
function acabar(){
clearInterval(reloj);
t.fin = true;
var ms = Date.now()- t.ini,ant = mejores[lado],record = ant == null || ms < ant,det =['Tiempo: ' + segundos(ms),'Fallos: ' + t.fallos];
ui.hud.poner('tiempo',segundos(ms));
if(record)mejores[lado]= ms;
det.push(record ?(ant == null ? 'Primera marca de esta sesión en ' + lado + '×' + lado + '.' : 'Nuevo mejor tiempo de la sesión.'): 'Tu mejor tiempo en ' + lado + '×' + lado + ': ' + segundos(ant)+ '.');
sesion.registrar(0,null);
TYJ.final(ui.final.appendChild(h('div')),{titulo: '¡Tabla completada!',nivel: lado + '×' + lado,detalles: det,
compartir: 'Tabla de Schulte ' + lado + '×' + lado + ': ' + segundos(ms)+ ' con ' + t.fallos +(t.fallos === 1 ? ' fallo.' : ' fallos.'),
textoRepetir: 'Otra tabla',alRepetir: empezar});
}
inicio();
})();

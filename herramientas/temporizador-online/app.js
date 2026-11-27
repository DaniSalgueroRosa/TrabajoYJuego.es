(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h,e ={estado: 'listo',total: 300,restante: 300000,fin: 0,reloj: null},tituloOriginal = document.title;
var MAX = 359999;
function p2(n){return('0' + n).slice(-2);}
function fmt(seg){var hh = Math.floor(seg / 3600),m = Math.floor(seg % 3600 / 60),s = seg % 60;return(hh ? hh + ':' : '')+ p2(m)+ ':' + p2(s);}
function entrada(id,etiqueta,valor){
var i = h('input',{id: id,type: 'text',inputmode: 'numeric',autocomplete: 'off',value: valor});
return{el: i,nodo: h('div',{class: 'campo'},h('label',{for: id,texto: etiqueta}),i)};
}
var cH = entrada('c-horas','Horas','0'),cM = entrada('c-minutos','Minutos','5'),cS = entrada('c-segundos','Segundos','0');
var sonido = h('input',{id: 'c-sonido',type: 'checkbox',checked: true});
var tiempo = h('p',{class: 'tm-tiempo',role: 'timer','aria-label': 'Tiempo restante','data-k': 'tiempo','data-v': '300',texto: '05:00'});
var rotulo = h('p',{class: 'tm-estado','data-k': 'estado','data-v': 'listo'});
var barra = h('progress',{class: 'herr-progreso tm-barra',max: '100',value: '0','aria-label': 'Progreso del temporizador'});
var aviso = h('p',{class: 'herr-estado herr-estado--error',role: 'alert','data-k': 'error',hidden: true});
var inicio = h('button',{class: 'boton',type: 'button',onclick: function(){if(e.estado === 'corriendo')pausar();else empezar();}},'Iniciar');
var reiniciar = h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){reinicio();}},'Reiniciar');
function leer(){
var v =[cH,cM,cS].map(function(c){return c.el.value.trim()=== '' ? 0 : TH.num(c.el.value);});
if(v.some(function(x){return !isFinite(x)|| x < 0 || x !== Math.floor(x);}))return{error: 'Escribe horas, minutos y segundos como números enteros de cero en adelante.'};
var t = v[0]* 3600 + v[1]* 60 + v[2];
if(t > MAX)return{error: 'El tiempo máximo es de 99 horas, 59 minutos y 59 segundos.'};
if(t === 0)return{error: 'Elige un tiempo mayor que cero.'};
return{segundos: t};
}
function pintar(){
var parado = e.estado === 'listo',seg;
if(parado){var r = leer();aviso.hidden = !r.error;aviso.textContent = r.error || '';seg = r.error ? 0 : r.segundos;e.total = r.error ? e.total : seg;}
else{aviso.hidden = true;seg = e.estado === 'terminado' ? 0 : Math.ceil(e.restante / 1000);}
if(parado)e.restante = seg * 1000;
var t = fmt(seg);
if(tiempo.getAttribute('data-v')!== String(seg)){tiempo.setAttribute('data-v',String(seg));tiempo.textContent = t;}
rotulo.setAttribute('data-v',e.estado);
rotulo.textContent ={listo: 'Listo para empezar',corriendo: 'En marcha',pausa: 'En pausa',terminado: '¡Tiempo!'}[e.estado];
barra.value = e.estado === 'terminado' ? 100 : parado ? 0 : Math.max(0,Math.min(100,100 - e.restante /(e.total * 1000)* 100));
inicio.textContent = e.estado === 'corriendo' ? 'Pausar' : e.estado === 'pausa' ? 'Reanudar' : 'Iniciar';
inicio.disabled = parado && !!aviso.textContent;
reiniciar.disabled = parado;
[cH,cM,cS].forEach(function(c){c.el.disabled = e.estado === 'corriendo' || e.estado === 'pausa';});
document.title = e.estado === 'corriendo' ? t + ' · ' + tituloOriginal : e.estado === 'terminado' ? '¡Tiempo! – ' + tituloOriginal : tituloOriginal;
}
function tic(){
e.restante = e.fin - TH.ahora();
if(e.restante <= 0)terminar();else pintar();
}
function empezar(){
if(e.estado === 'listo' || e.estado === 'terminado'){var r = leer();if(r.error){pintar();return;}e.total = r.segundos;e.restante = r.segundos * 1000;}
TH.audio();
e.estado = 'corriendo';e.fin = TH.ahora()+ e.restante;
clearInterval(e.reloj);e.reloj = setInterval(tic,100);pintar();
}
function pausar(){e.restante = Math.max(0,e.fin - TH.ahora());e.estado = 'pausa';clearInterval(e.reloj);e.reloj = null;pintar();}
function terminar(){
clearInterval(e.reloj);e.reloj = null;e.restante = 0;e.estado = 'terminado';pintar();
TH.anunciar('¡Tiempo!');
if(sonido.checked)TH.pitar(3);
}
function reinicio(){clearInterval(e.reloj);e.reloj = null;e.estado = 'listo';pintar();}
[cH,cM,cS].forEach(function(c){c.el.addEventListener('input',function(){if(e.estado === 'listo')pintar();});});
sonido.addEventListener('change',function(){if(sonido.checked)TH.audio();});
function atajo(nombre,seg){
return h('button',{class: 'boton boton--secundario boton--chico',type: 'button',onclick: function(){
if(e.estado !== 'listo')reinicio();
cH.el.value = String(Math.floor(seg / 3600));cM.el.value = String(Math.floor(seg % 3600 / 60));cS.el.value = String(seg % 60);pintar();
}},nombre);
}
TH.vaciar(raiz).appendChild(h('div',{class: 'tm'},
h('div',{class: 'tm-reloj'},rotulo,tiempo,barra,h('div',{class: 'herr-acciones'},inicio,reiniciar)),
aviso,
h('div',{class: 'herr-acciones',role: 'group','aria-label': 'Tiempos habituales'},atajo('1 minuto',60),atajo('5 minutos',300),atajo('10 minutos',600),atajo('15 minutos',900),atajo('30 minutos',1800),atajo('1 hora',3600)),
h('form',{class: 'herr-form',novalidate: true,onsubmit: function(ev){ev.preventDefault();}},
h('div',{class: 'herr-campos'},cH.nodo,cM.nodo,cS.nodo,h('div',{class: 'campo campo--check campo--completo'},h('span',{class: 'campo-check'},sonido,h('label',{for: 'c-sonido',texto: 'Avisar con un sonido al terminar'})))))));
window.addEventListener('pagehide',function(){document.title = tituloOriginal;});
pintar();
});
})();

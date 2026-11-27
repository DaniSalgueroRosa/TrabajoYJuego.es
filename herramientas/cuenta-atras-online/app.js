(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h,e ={pasado: null};
var ETIQ ={dias:['día','días'],horas:['hora','horas'],minutos:['minuto','minutos'],segundos:['segundo','segundos']};
function p2(n){return('0' + n).slice(-2);}
function campo(id,etiqueta,control,ancho){return h('div',{class: 'campo' +(ancho ? ' campo--completo' : '')},h('label',{for: id,texto: etiqueta}),control);}
var nombre = h('input',{id: 'c-nombre',type: 'text',autocomplete: 'off',maxlength: '80',placeholder: 'Por ejemplo, mis vacaciones'});
var fecha = h('input',{id: 'c-fecha',type: 'date'});
var hora = h('input',{id: 'c-hora',type: 'time',value: '00:00'});
var sonido = h('input',{id: 'c-sonido',type: 'checkbox'});
var titulo = h('p',{class: 'ca-titulo','data-k': 'titulo'});
var estado = h('p',{class: 'ca-estado','data-k': 'estado'});
var celdas ={},rejilla = h('div',{class: 'ca-celdas'});
Object.keys(ETIQ).forEach(function(k){
var num = h('span',{class: 'ca-num','data-k': k,'data-v': '0',texto: '0'}),et = h('span',{class: 'ca-et',texto: ETIQ[k][1]});
celdas[k]={num: num,et: et};
rejilla.appendChild(h('div',{class: 'ca-celda'},num,et));
});
var reloj = h('div',{class: 'ca-reloj',role: 'timer','aria-label': 'Tiempo que falta'},titulo,rejilla,estado);
function leerFin(){
var f = TH.fechaUTC(fecha.value),m = /^(\d{2}):(\d{2})$/.exec(hora.value || '00:00');
return f && m ? new Date(f.getUTCFullYear(),f.getUTCMonth(),f.getUTCDate(),+m[1],+m[2],0,0).getTime(): null;
}
function poner(k,valor){
var c = celdas[k],v = String(valor),t = k === 'dias' ? TH.fmt(valor,0): p2(valor),et = ETIQ[k][valor === 1 ? 0 : 1];
if(c.num.getAttribute('data-v')!== v){c.num.setAttribute('data-v',v);c.num.textContent = t;}
if(c.et.textContent !== et)c.et.textContent = et;
}
function fijar(est,tit,txt){
if(titulo.textContent !== tit)titulo.textContent = tit;
if(estado.textContent !== txt)estado.textContent = txt;
estado.setAttribute('data-v',est);
reloj.setAttribute('aria-label',est === 'pasado' ? 'Tiempo transcurrido' : 'Tiempo que falta');
}
function pintar(){
var fin = leerFin(),nom = nombre.value.trim();
if(fin === null){
Object.keys(ETIQ).forEach(function(k){poner(k,0);});
fijar('vacio',nom || 'Tu cuenta atrás','Elige una fecha para empezar la cuenta atrás.');
e.pasado = null;
return;
}
var ms = fin - TH.ahora(),pasado = ms <= 0,seg = pasado ? Math.floor(-ms / 1000): Math.ceil(ms / 1000);
poner('dias',Math.floor(seg / 86400));poner('horas',Math.floor(seg % 86400 / 3600));poner('minutos',Math.floor(seg % 3600 / 60));poner('segundos',seg % 60);
var cuando = TH.fechaLarga(TH.fechaUTC(fecha.value))+ ', a las ' +(hora.value || '00:00');
fijar(pasado ? 'pasado' : 'futuro',nom || 'Tu cuenta atrás',pasado ? 'Ya ha llegado: era el ' + cuando + '. Esto es lo que ha pasado desde entonces.' : 'Llegará el ' + cuando + '.');
if(pasado && e.pasado === false){
TH.anunciar('¡Ha llegado ' +(nom || 'la fecha elegida')+ '!');
if(sonido.checked)TH.pitar(3);
}
e.pasado = pasado;
}
function cambio(){e.pasado = null;pintar();}
function atajo(nom,mes,dia){
var ahora = new Date(TH.ahora()),y = ahora.getFullYear();
if(new Date(y,mes - 1,dia,0,0,0,0).getTime()<= ahora.getTime())y++;
nombre.value = nom;fecha.value = y + '-' + p2(mes)+ '-' + p2(dia);hora.value = '00:00';cambio();
}
[nombre,fecha,hora].forEach(function(el){el.addEventListener('input',cambio);el.addEventListener('change',cambio);});
sonido.addEventListener('change',function(){if(sonido.checked)TH.audio();});
var atajos = h('div',{class: 'herr-acciones',role: 'group','aria-label': 'Atajos de fechas'},
h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){atajo('Navidad',12,25);}},'Navidad'),
h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){atajo('Año Nuevo',1,1);}},'Año Nuevo'),
h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){atajo('Reyes Magos',1,6);}},'Reyes Magos'),
h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){nombre.value = '';fecha.value = '';hora.value = '00:00';sonido.checked = false;cambio();}},'Empezar de nuevo'));
TH.vaciar(raiz).appendChild(h('div',{class: 'ca'},reloj,
h('form',{class: 'herr-form',novalidate: true,onsubmit: function(ev){ev.preventDefault();}},
h('div',{class: 'herr-campos'},campo('c-nombre','Nombre del evento (opcional)',nombre,true),campo('c-fecha','Fecha del evento',fecha),campo('c-hora','Hora del evento',hora),
h('div',{class: 'campo campo--check campo--completo'},h('span',{class: 'campo-check'},sonido,h('label',{for: 'c-sonido',texto: 'Avisar con un sonido al llegar a cero'})))),
atajos)));
setInterval(pintar,250);
document.addEventListener('visibilitychange',pintar);
pintar();
});
})();

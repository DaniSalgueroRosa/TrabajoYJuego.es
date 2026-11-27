(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/horario.js').then(function(){
var H = TH.horario,h = TH.h,contador = 0,filas =[],ultimo = null,estado;
var EJEMPLO =[
{actividad: 'Matemáticas',lugar: 'Aula 12',inicio: '08:30',fin: '09:30',dias:[0,2,4],color: 'azul'},
{actividad: 'Lengua',lugar: 'Aula 12',inicio: '08:30',fin: '09:30',dias:[1,3],color: 'verde'},
{actividad: 'Inglés',lugar: 'Aula 4',inicio: '09:30',fin: '10:30',dias:[0,1,2,3],color: 'naranja'},
{actividad: 'Educación física',lugar: 'Gimnasio',inicio: '09:30',fin: '10:30',dias:[4],color: 'rosa'},
{actividad: 'Recreo',lugar: 'Patio',inicio: '10:30',fin: '11:00',dias:[0,1,2,3,4],color: 'gris'},
{actividad: 'Ciencias',lugar: 'Laboratorio',inicio: '11:00',fin: '12:30',dias:[1,3,4],color: 'turquesa'},
{actividad: 'Música',lugar: 'Aula 7',inicio: '11:00',fin: '12:00',dias:[0],color: 'morado'}
];
var titulo = h('input',{id: 'h-titulo',type: 'text',value: 'Mi horario semanal',maxlength: 60,autocomplete: 'off'});
var gran = h('select',{id: 'h-gran'},[['30','Cada 30 minutos'],['15','Cada 15 minutos'],['60','Cada hora']].map(function(o){return h('option',{value: o[0],texto: o[1]});}));
var finde = h('input',{id: 'h-finde',type: 'checkbox'});
var lista = h('div',{class: 'hor-filas',id: 'h-filas'});
var editor = h('div',{class: 'hor-editor'},
h('div',{class: 'herr-campos'},
h('div',{class: 'campo campo--completo'},h('label',{for: 'h-titulo',texto: 'Título del horario'}),titulo),
h('div',{class: 'campo'},h('label',{for: 'h-gran',texto: 'Líneas de la rejilla'}),gran),
h('div',{class: 'campo campo--check'},h('span',{class: 'campo-check'},finde,h('label',{for: 'h-finde',texto: 'Mostrar sábado y domingo aunque estén vacíos'})))),
h('h3',{class: 'hor-subtitulo',texto: 'Actividades'}),lista);
var salida = h('div',{class: 'hor-salida','aria-live': 'polite'});
var acciones = h('div',{class: 'herr-acciones hor-acciones'});
TH.vaciar(raiz);raiz.appendChild(editor);
var botonesFila = h('div',{class: 'herr-acciones hor-acciones-editor'});
editor.appendChild(botonesFila);
raiz.appendChild(salida);raiz.appendChild(acciones);
estado = TH.estado(raiz);
function nuevaFila(v){
v = v ||{};
var id = ++contador,f ={id: id},n;
f.actividad = h('input',{type: 'text',id: 'h-act-' + id,maxlength: 60,autocomplete: 'off',placeholder: 'Matemáticas',value: v.actividad || ''});
f.lugar = h('input',{type: 'text',id: 'h-lug-' + id,maxlength: 40,autocomplete: 'off',placeholder: 'Aula 12 (opcional)',value: v.lugar || ''});
f.inicio = h('input',{type: 'time',id: 'h-ini-' + id,value: v.inicio || ''});
f.fin = h('input',{type: 'time',id: 'h-fin-' + id,value: v.fin || ''});
var col = v.color || H.COLORES[(id - 1)% H.COLORES.length].id;
f.color = h('select',{id: 'h-col-' + id},H.COLORES.map(function(c){return h('option',{value: c.id,selected: c.id === col,texto: c.nombre});}));
f.dias = H.DIAS.map(function(d,i){
var cb = h('input',{type: 'checkbox',id: 'h-d-' + id + '-' + i,checked:(v.dias ||[]).indexOf(i)>= 0});
return{cb: cb,nodo: h('label',{class: 'hor-dia',for: 'h-d-' + id + '-' + i},cb,h('span',{'aria-hidden': 'true',texto: H.DIAS_CORTOS[i]}),h('span',{class: 'solo-lectores',texto: d}))};
});
var laborables = h('button',{class: 'boton boton--secundario boton--chico',type: 'button',onclick: function(){f.dias.forEach(function(d,i){d.cb.checked = i < 5;});pintar();}},'Lunes a viernes');
var quitar = h('button',{class: 'boton boton--secundario boton--chico',type: 'button',onclick: function(){
if(filas.length <= 1){f.actividad.value = f.lugar.value = f.inicio.value = f.fin.value = '';f.dias.forEach(function(d){d.cb.checked = false;});}
else{filas.splice(filas.indexOf(f),1);f.nodo.remove();}
numerar();pintar();
}},'Quitar');
f.quitar = quitar;
f.nodo = h('div',{class: 'hor-fila',role: 'group'},
h('div',{class: 'campo hor-c-act'},h('label',{for: 'h-act-' + id,texto: 'Actividad'}),f.actividad),
h('div',{class: 'campo hor-c-lug'},h('label',{for: 'h-lug-' + id,texto: 'Lugar o nota'}),f.lugar),
h('div',{class: 'campo hor-c-hora'},h('label',{for: 'h-ini-' + id,texto: 'Empieza'}),f.inicio),
h('div',{class: 'campo hor-c-hora'},h('label',{for: 'h-fin-' + id,texto: 'Termina'}),f.fin),
h('div',{class: 'campo hor-c-color'},h('label',{for: 'h-col-' + id,texto: 'Color'}),f.color),
h('div',{class: 'campo hor-c-dias'},h('span',{class: 'campo-titulo',texto: 'Días'}),h('div',{class: 'hor-dias',role: 'group'},f.dias.map(function(d){return d.nodo;}),laborables)),
h('div',{class: 'hor-c-quitar'},quitar));
filas.push(f);lista.appendChild(f.nodo);
return f;
}
function numerar(){
filas.forEach(function(f,i){
f.nodo.setAttribute('aria-label','Actividad ' +(i + 1));
f.quitar.setAttribute('aria-label',filas.length > 1 ? 'Quitar la actividad ' +(i + 1): 'Vaciar la actividad');
f.quitar.textContent = filas.length > 1 ? 'Quitar' : 'Vaciar';
});
}
function poner(datos){
TH.vaciar(lista);filas =[];contador = 0;
(datos && datos.length ? datos :[{}]).forEach(function(v){nuevaFila(v);});
numerar();
}
function leer(){
return filas.map(function(f){
return{actividad: f.actividad.value,lugar: f.lugar.value,inicio: f.inicio.value,fin: f.fin.value,color: f.color.value,dias: f.dias.map(function(d,i){return d.cb.checked ? i : -1;}).filter(function(i){return i >= 0;})};
});
}
function bloque(b){
var c = H.color(b.color),li = h('li',{class: 'hor-bloque' +(b.fin - b.ini <= 30 ? ' hor-bloque--corto' : ''),title: b.actividad + ', ' + H.aHora(b.ini)+ '–' + H.aHora(b.fin)+(b.lugar ? ', ' + b.lugar : '')},
h('strong',{class: 'hor-bloque-nombre',texto: b.actividad}),h('span',{class: 'hor-bloque-hora',texto: H.aHora(b.ini)+ '–' + H.aHora(b.fin)}),b.lugar ? h('span',{class: 'hor-bloque-lugar',texto: b.lugar}): null);
li.style.top = b.arriba + '%';li.style.height = b.alto + '%';li.style.left = b.izq + '%';li.style.width = b.ancho + '%';
li.style.background = c.fondo;li.style.color = c.texto;li.style.borderLeftColor = c.borde;
return li;
}
function calendario(p,tit){
var total =(p.hasta - p.desde)/ 60,cols = h('div',{class: 'hor-cuerpo'}),horas = h('div',{class: 'hor-horas','aria-hidden': 'true'});
p.marcas.forEach(function(m){if(m.hora){var e = h('span',{class: 'hor-hora',texto: m.etiqueta});e.style.top =(m.min - p.desde)/(p.hasta - p.desde)* 100 + '%';horas.appendChild(e);}});
var grid = h('div',{class: 'hor-rejilla','data-k': 'calendario',role: 'group','aria-label': tit || 'Horario semanal'});
grid.style.setProperty('--dias',p.dias.length);grid.style.setProperty('--horas',total);grid.style.setProperty('--franja',(+gran.value)/ 60);
grid.appendChild(h('div',{class: 'hor-esquina','aria-hidden': 'true'}));
p.dias.forEach(function(d){grid.appendChild(h('div',{class: 'hor-cab','aria-hidden': 'true',texto: d.nombre}));});
grid.appendChild(horas);
p.dias.forEach(function(d){
var col = h('section',{class: 'hor-col','aria-label': d.nombre,'data-dia': d.nombre},h('ul',{class: 'hor-bloques'},d.bloques.map(bloque)));
if(!d.bloques.length)col.appendChild(h('span',{class: 'solo-lectores',texto: 'Sin actividades'}));
grid.appendChild(col);
});
return h('div',{class: 'hor-cal'},tit ? h('p',{class: 'hor-titulo',texto: tit}): null,h('div',{class: 'hor-scroll',tabindex: '0',role: 'region','aria-label': 'Horario semanal (desplázalo si no cabe)'},grid));
}
function pintar(){
var p = H.preparar(leer(),{finde: finde.checked,gran: +gran.value});
ultimo = p;TH.vaciar(salida);
p.avisos.forEach(function(a){salida.appendChild(h('p',{class: 'herr-estado herr-estado--aviso',role: 'status',texto: a}));});
[].forEach.call(acciones.querySelectorAll('button'),function(b){b.disabled = !p.actividades;});
if(!p.actividades){salida.appendChild(h('p',{class: 'herr-vacio',texto: 'Añade una actividad con sus días y sus horas, o prueba con el ejemplo, y aquí aparecerá tu horario.'}));return;}
var veces = 0,min = 0;
p.dias.forEach(function(d){d.bloques.forEach(function(b){veces++;min += b.fin - b.ini;});});
var dl = h('dl',{class: 'herr-res herr-res--compacto'});
[TH.fila('actividades','Actividades por semana',veces,'n0'),TH.fila('horas','Horas por semana',min / 60,'n1'),TH.fila('solapes','Solapes',p.conflictos.length,'n0')].forEach(function(fi){dl.appendChild(h('div',{class: 'herr-fila'},h('dt',{texto: fi.t}),h('dd',{'data-k': fi.k,'data-v': String(fi.v),texto: fi.f})));});
salida.appendChild(dl);
salida.appendChild(calendario(p,titulo.value.trim()));
}
function dibujar(p,tit){
var E = 2,M = 18,AH = 72,AD = 190,ALT = 64,CAB = tit ? 64 : 12,DIAS = 38,nd = p.dias.length,horas =(p.hasta - p.desde)/ 60;
var W = M * 2 + AH + nd * AD,Hh = CAB + DIAS + horas * ALT + M,x0 = M + AH,y0 = CAB + DIAS;
var cv = document.createElement('canvas');cv.width = W * E;cv.height = Hh * E;
var g = cv.getContext('2d');g.scale(E,E);
g.fillStyle = '#FFFFFF';g.fillRect(0,0,W,Hh);
g.textBaseline = 'alphabetic';
if(tit){g.fillStyle = '#14201C';g.font = '700 26px Arial, Helvetica, sans-serif';g.fillText(tit.slice(0,60),M,CAB - 22);}
g.font = '700 14px Arial, Helvetica, sans-serif';g.textAlign = 'center';
p.dias.forEach(function(d,i){g.fillStyle = '#1D3A34';g.fillRect(x0 + i * AD + 1,CAB,AD - 2,DIAS - 4);g.fillStyle = '#FFFFFF';g.fillText(d.nombre,x0 + i * AD + AD / 2,CAB + 22);});
g.textAlign = 'right';
p.marcas.forEach(function(m){
var y = y0 +(m.min - p.desde)/ 60 * ALT;
g.strokeStyle = m.hora ? '#C5D1CB' : '#E6ECE9';g.lineWidth = 1;g.beginPath();g.moveTo(x0,Math.round(y)+ .5);g.lineTo(x0 + nd * AD,Math.round(y)+ .5);g.stroke();
if(m.hora){g.fillStyle = '#44524D';g.font = '12px Arial, Helvetica, sans-serif';g.fillText(m.etiqueta,x0 - 8,y + 4);}
});
g.strokeStyle = '#C5D1CB';
for(var i = 0;i <= nd;i++){g.beginPath();g.moveTo(x0 + i * AD + .5,y0);g.lineTo(x0 + i * AD + .5,y0 + horas * ALT);g.stroke();}
g.textAlign = 'left';
p.dias.forEach(function(d,i){
d.bloques.forEach(function(b){
var c = H.color(b.color),x = x0 + i * AD + b.izq / 100 * AD + 2,w = b.ancho / 100 * AD - 4,y = y0 +(b.ini - p.desde)/ 60 * ALT + 1,hh =(b.fin - b.ini)/ 60 * ALT - 2;
g.save();g.beginPath();g.rect(x,y,w,hh);g.clip();
g.fillStyle = c.fondo;g.fillRect(x,y,w,hh);g.fillStyle = c.borde;g.fillRect(x,y,4,hh);
g.fillStyle = c.texto;var ty = y + 15,tx = x + 10,ancho = w - 14,lineas =[['700 13px Arial, Helvetica, sans-serif',b.actividad],['12px Arial, Helvetica, sans-serif',H.aHora(b.ini)+ '–' + H.aHora(b.fin)],['12px Arial, Helvetica, sans-serif',b.lugar]];
lineas.forEach(function(l,k){
if(!l[1])return;
g.font = l[0];var palabras = l[1].split(/\s+/),linea = '';
palabras.forEach(function(pal){
var t = linea ? linea + ' ' + pal : pal;
if(g.measureText(t).width > ancho && linea){g.fillText(linea,tx,ty);ty += 15;linea = pal;}else linea = t;
});
g.fillText(linea,tx,ty);ty += 15;
});
g.restore();
});
});
return new Promise(function(ok){cv.toBlob(ok,'image/png');});
}
function nombre(){
var s = titulo.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
return s || 'horario';
}
acciones.appendChild(h('button',{class: 'boton',type: 'button',id: 'h-png',onclick: function(){
if(!ultimo || !ultimo.actividades)return;
dibujar(ultimo,titulo.value.trim()).then(function(blob){
if(!blob){estado.poner('No se ha podido crear la imagen.','error');return;}
TH.descargar(blob,nombre()+ '.png','image/png');estado.poner('Imagen lista: ' + nombre()+ '.png (' + TH.tamano(blob.size)+ ').','ok');
});
}},'Descargar imagen (PNG)'));
acciones.appendChild(h('button',{class: 'boton boton--secundario',type: 'button',id: 'h-imprimir',onclick: function(){window.print();}},'Imprimir o guardar en PDF'));
acciones.appendChild(h('button',{class: 'boton boton--secundario',type: 'button',id: 'h-copiar',onclick: function(){if(ultimo)TH.copiar(H.texto(ultimo,titulo.value.trim()),estado);}},'Copiar como texto'));
botonesFila.appendChild(h('button',{class: 'boton boton--secundario',type: 'button',id: 'h-anadir',onclick: function(){var f = nuevaFila();numerar();pintar();f.actividad.focus();}},'Añadir actividad'));
botonesFila.appendChild(h('button',{class: 'boton boton--secundario',type: 'button',id: 'h-ejemplo',onclick: function(){titulo.value = 'Horario de clases';poner(EJEMPLO);pintar();}},'Probar con un ejemplo'));
botonesFila.appendChild(h('button',{class: 'boton boton--secundario',type: 'button',id: 'h-vaciar',onclick: function(){poner([]);pintar();filas[0].actividad.focus();}},'Vaciar todo'));
editor.addEventListener('input',pintar);editor.addEventListener('change',pintar);
poner([]);pintar();
},function(){
var p = document.createElement('p');p.className = 'herr-estado herr-estado--error';p.setAttribute('role','alert');
p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.';TH.vaciar(raiz).appendChild(p);
});
});
})();

(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h,HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i,filas =[];
var PRESETS =[['Atardecer',['#FFB347','#FF5E62','#6A1B9A']],['Océano',['#00C6FF','#0072FF']],['Bosque',['#134E5E','#71B280']],['Menta',['#A8EDEA','#FED6E3']],['Brasas',['#F12711','#F5AF19']],['Noche',['#0F2027','#2C5364']]];
var estado = TH.estado(raiz),avisoError = h('p',{class: 'herr-estado herr-estado--error',role: 'alert','data-k': 'error',hidden: true});
function norm(t){var m = HEX.exec(String(t).trim());if(!m)return null;var s = m[1].length === 3 ? m[1].replace(/./g,'$&$&'): m[1];return '#' + s.toUpperCase();}
function nm(n){return String(Math.round(n * 100)/ 100);}
function lista(id,etiqueta,ops,valor){
var s = h('select',{id: 'c-' + id},ops.map(function(o){return h('option',{value: o[0],selected: o[0]=== valor},o[1]);}));
return{el: s,nodo: h('div',{class: 'campo'},h('label',{for: 'c-' + id,texto: etiqueta}),s)};
}
var tipo = lista('tipo','Tipo de degradado',[['lineal','Lineal'],['radial','Radial'],['conico','Cónico']],'lineal');
var anguloEl = h('input',{id: 'c-angulo',type: 'text',inputmode: 'decimal',autocomplete: 'off',value: '90'});
var campoAngulo = h('div',{class: 'campo'},h('label',{for: 'c-angulo',texto: 'Ángulo (grados)'}),anguloEl);
var tam = lista('tam','Tamaño de la imagen PNG',[['1280x720','1280 × 720 (horizontal)'],['1920x1080','1920 × 1080 (pantalla completa)'],['1080x1080','1080 × 1080 (cuadrada)'],['1080x1920','1080 × 1920 (vertical)']],'1920x1080');
var cont = h('div',{class: 'deg-paradas',id: 'deg-paradas',role: 'group','aria-label': 'Colores del degradado'});
var vista = h('div',{class: 'deg-vista',role: 'img','aria-label': 'Vista previa del degradado'});
var codigo = h('pre',{id: 'deg-css','data-k': 'css'});
var masBoton = h('button',{class: 'boton boton--secundario',type: 'button',id: 'deg-mas',onclick: function(){
var v = valores();if(v.length >= 8)return;
var a = norm(v[0].c)|| '#FFFFFF',b = norm(v[v.length - 1].c)|| '#000000',mezcla = '#' +[1,3,5].map(function(i){return('0' + Math.round((parseInt(a.substr(i,2),16)+ parseInt(b.substr(i,2),16))/ 2).toString(16)).slice(-2);}).join('').toUpperCase();
v.splice(Math.ceil(v.length / 2),0,{c: mezcla,p: '50'});construirFilas(v);actualizar();
}},'Añadir un color');
function valores(){return filas.map(function(f){return{c: f.hex.value.trim(),p: f.pos.value.trim()};});}
function construirFilas(v){
filas =[];TH.vaciar(cont);
v.forEach(function(x,i){
var n = i + 1,ok = norm(x.c);
var color = h('input',{type: 'color',id: 'c-color-' + n,value:(ok || '#000000').toLowerCase(),'aria-label': 'Selector de color de la parada ' + n});
var hex = h('input',{type: 'text',id: 'c-hex-' + n,value: x.c,maxlength: '7',autocomplete: 'off',spellcheck: 'false','aria-label': 'Código HEX de la parada ' + n});
var pos = h('input',{type: 'text',inputmode: 'decimal',id: 'c-pos-' + n,value: String(x.p),autocomplete: 'off','aria-label': 'Posición de la parada ' + n + ', de 0 a 100'});
color.addEventListener('input',function(){hex.value = color.value.toUpperCase();actualizar();});
hex.addEventListener('input',function(){var q = norm(hex.value);if(q)color.value = q.toLowerCase();actualizar();});
pos.addEventListener('input',actualizar);
var quitar = h('button',{class: 'boton boton--secundario boton--chico',type: 'button',disabled: v.length <= 2,'aria-label': 'Quitar la parada ' + n,onclick: function(){var w = valores();w.splice(i,1);construirFilas(w);actualizar();}},'Quitar');
filas.push({hex: hex,pos: pos});
cont.appendChild(h('div',{class: 'deg-fila'},color,h('div',{class: 'deg-hex'},hex),h('div',{class: 'deg-pos'},pos,h('span',{class: 'herr-chico',texto: '%'})),quitar));
});
masBoton.disabled = v.length >= 8;
}
function leer(){
var errores =[],v = valores(),ang = TH.num(anguloEl.value);
if(tipo.el.value !== 'radial' && !isFinite(ang))errores.push('El ángulo debe ser un número, por ejemplo 90.');
var ps = v.map(function(x,i){
var c = norm(x.c),p = TH.num(x.p);
if(!c)errores.push('La parada ' +(i + 1)+ ' no tiene un código HEX válido, como #2D6A4F.');
if(!(p >= 0 && p <= 100))errores.push('La posición de la parada ' +(i + 1)+ ' debe estar entre 0 y 100.');
return{c: c,p: p,i: i};
});
if(errores.length)return{error: errores[0]};
ps.sort(function(a,b){return a.p - b.p || a.i - b.i;});
return{tipo: tipo.el.value,ang: isFinite(ang)? ang : 0,paradas: ps};
}
function cssDe(d){
var pars = d.paradas.map(function(s){return s.c + ' ' + nm(s.p)+ '%';}).join(', ');
if(d.tipo === 'lineal')return 'background: linear-gradient(' + nm(d.ang)+ 'deg, ' + pars + ');';
if(d.tipo === 'radial')return 'background: radial-gradient(circle, ' + pars + ');';
return 'background: conic-gradient(from ' + nm(d.ang)+ 'deg, ' + pars + ');';
}
function actualizar(){
campoAngulo.hidden = tipo.el.value === 'radial';
var d = leer();
if(d.error){avisoError.hidden = false;avisoError.textContent = d.error;codigo.textContent = '';codigo.setAttribute('data-v','');return;}
avisoError.hidden = true;avisoError.textContent = '';
var css = cssDe(d);
codigo.textContent = css;codigo.setAttribute('data-v',css);
vista.style.background = css.slice('background: '.length,-1);
}
function lienzoDe(W,H,d){
var c = h('canvas');c.width = W;c.height = H;
var g = c.getContext('2d'),grad,a = d.ang * Math.PI / 180;
if(d.tipo === 'lineal'){var sx = Math.sin(a),sy = -Math.cos(a),len = Math.abs(W * sx)+ Math.abs(H * sy);grad = g.createLinearGradient(W / 2 - sx * len / 2,H / 2 - sy * len / 2,W / 2 + sx * len / 2,H / 2 + sy * len / 2);}
else if(d.tipo === 'radial')grad = g.createRadialGradient(W / 2,H / 2,0,W / 2,H / 2,Math.hypot(W / 2,H / 2));
else{if(!g.createConicGradient)throw new Error('Tu navegador no puede dibujar degradados cónicos como imagen. Copia el código CSS, que sí funciona.');grad = g.createConicGradient(a - Math.PI / 2,W / 2,H / 2);}
d.paradas.forEach(function(s){grad.addColorStop(s.p / 100,s.c);});
g.fillStyle = grad;g.fillRect(0,0,W,H);
return c;
}
[tipo.el,anguloEl].forEach(function(e){e.addEventListener('input',actualizar);e.addEventListener('change',actualizar);});
function boton(t,fn,id){return h('button',{class: 'boton boton--secundario',type: 'button',id: id || null,onclick: fn},t);}
var presets = h('div',{class: 'herr-acciones',role: 'group','aria-label': 'Degradados de ejemplo'},PRESETS.map(function(p){
return boton(p[0],function(){construirFilas(p[1].map(function(c,i){return{c: c,p: String(Math.round(i * 100 /(p[1].length - 1)))};}));actualizar();});
}));
TH.vaciar(raiz);
raiz.appendChild(avisoError);
raiz.appendChild(h('div',{class: 'deg'},h('div',{class: 'deg-izq'},vista),
h('div',{class: 'deg-der'},h('div',{class: 'herr-campos'},tipo.nodo,campoAngulo),cont,h('div',{class: 'herr-acciones'},masBoton,boton('Invertir los colores',function(){
var v = valores().map(function(x){var p = TH.num(x.p);return{c: x.c,p: isFinite(p)? nm(100 - p): x.p};}).reverse();construirFilas(v);actualizar();
})),h('p',{class: 'herr-chico',texto: 'O parte de un ejemplo:'}),presets)));
raiz.appendChild(h('div',{class: 'herr-codigo'},h('p',{class: 'herr-chico',texto: 'Código CSS:'}),codigo,
h('div',{class: 'herr-acciones'},h('button',{class: 'boton',type: 'button',onclick: function(){if(codigo.textContent)TH.copiar(codigo.textContent,estado);}},'Copiar el CSS'),tam.nodo.firstChild.cloneNode(false)&& null)));
raiz.appendChild(h('div',{class: 'herr-campos'},tam.nodo));
raiz.appendChild(h('div',{class: 'herr-acciones'},h('button',{class: 'boton boton--secundario',type: 'button',id: 'deg-png',onclick: function(){
var d = leer();if(d.error){estado.poner(d.error,'error');return;}
var m = /^(\d+)x(\d+)$/.exec(tam.el.value);
try{
TH.lienzoABlob(lienzoDe(+m[1],+m[2],d),'image/png').then(function(b){
var nombre = 'degradado-' + tam.el.value + '.png';TH.entregas =[{nombre: nombre,blob: b}];TH.descargar(b,nombre);estado.poner('Imagen descargada: ' + nombre + ' (' + TH.tamano(b.size)+ ').','ok');
});
}catch(e){estado.poner(e.message,'error');}
}},'Descargar como imagen PNG')));
construirFilas([{c: '#2D6A4F',p: '0'},{c: '#F4D35E',p: '100'}]);
actualizar();
});
})();

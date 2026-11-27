(function(){
'use strict';
TH.alCargar(function(raiz){
function errorCarga(){TH.vaciar(raiz).appendChild(TH.h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));}
var h = TH.h,QR = null,actual = null;
var TIPOS =[['texto','Texto o enlace web'],['correo','Correo electrónico'],['telefono','Teléfono'],['sms','Mensaje SMS'],['whatsapp','Mensaje de WhatsApp']];
TH.script('lib/qr.js').then(function(){QR = TH.qr;construir();},errorCarga);
function construir(){
TH.vaciar(raiz);
var estado = TH.estado(raiz);
function lista(id,etiqueta,ops,valor){
var s = h('select',{id: 'c-' + id},ops.map(function(o){return h('option',{value: o[0],selected: o[0]=== valor},o[1]);}));
return{el: s,nodo: h('div',{class: 'campo'},h('label',{for: 'c-' + id,texto: etiqueta}),s)};
}
function texto(id,etiqueta,ph,area){
var i = h(area ? 'textarea' : 'input',Object.assign({id: 'c-' + id,placeholder: ph || '',autocomplete: 'off',spellcheck: 'false'},area ?{rows: '3'}:{type: 'text'}));
return{el: i,nodo: h('div',{class: 'campo'},h('label',{for: 'c-' + id,texto: etiqueta}),i)};
}
var tipo = lista('tipo','Qué quieres poner en el código',TIPOS,'texto');
var fTexto = texto('texto','Texto o enlace','https://www.ejemplo.es',true),fCorreo = texto('correo','Dirección de correo','nombre@ejemplo.es'),fAsunto = texto('asunto','Asunto (opcional)',''),
fTel = texto('telefono','Número de teléfono','+34 600 000 000'),fMsg = texto('mensaje','Mensaje (opcional)','',true);
var nivel = lista('nivel','Corrección de errores',[['L','L · Baja (recupera el 7 %)'],['M','M · Media (15 %)'],['Q','Q · Alta (25 %)'],['H','H · Máxima (30 %)']],'M');
var tam = lista('tam','Tamaño de la imagen',[['256','256 px'],['512','512 px'],['1024','1024 px'],['2048','2048 px']],'512');
var margen = lista('margen','Margen blanco',[['4','Estándar (recomendado)'],['2','Pequeño'],['0','Sin margen']],'4');
var color = h('input',{id: 'c-color',type: 'color',value: '#000000'}),fondo = h('input',{id: 'c-fondo',type: 'color',value: '#ffffff'});
var lienzo = h('canvas',{id: 'qr-lienzo',class: 'qr-lienzo',role: 'img','aria-label': 'Código QR'});
var vacio = h('p',{class: 'herr-vacio','data-k': 'vacio',texto: 'Escribe el contenido para ver aquí tu código QR.'});
var error = h('p',{class: 'herr-estado herr-estado--error',role: 'alert','data-k': 'error',hidden: true}),aviso = h('p',{class: 'herr-estado herr-estado--aviso','data-k': 'aviso',hidden: true});
var contenidoEl = h('code',{class: 'qr-contenido','data-k': 'contenido'}),versionEl = h('span',{'data-k': 'version'}),ladoEl = h('span',{'data-k': 'lado'});
var info = h('dl',{class: 'herr-res herr-res--compacto',hidden: true},
h('div',{class: 'herr-fila'},h('dt',{texto: 'Contenido del código'}),h('dd',{},contenidoEl)),
h('div',{class: 'herr-fila'},h('dt',{texto: 'Tamaño del código'}),h('dd',{},versionEl)),
h('div',{class: 'herr-fila'},h('dt',{texto: 'Imagen'}),h('dd',{},ladoEl)));
function entregar(nombre,blob){TH.entregas =[{nombre: nombre,blob: blob}];TH.descargar(blob,nombre);estado.poner('Descargado: ' + nombre + ' (' + TH.tamano(blob.size)+ ').','ok');}
var bPng = h('button',{class: 'boton',type: 'button',id: 'qr-png',onclick: function(){TH.lienzoABlob(lienzo,'image/png').then(function(b){entregar('codigo-qr.png',b);});}},'Descargar PNG');
var bSvg = h('button',{class: 'boton boton--secundario',type: 'button',id: 'qr-svg',onclick: function(){entregar('codigo-qr.svg',new Blob([QR.aSVG(actual.qr,{margen: actual.margen,color: color.value,fondo: fondo.value,px: actual.lado})],{type: 'image/svg+xml'}));}},'Descargar SVG');
var bCopiar = h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){TH.copiar(actual.texto,estado);}},'Copiar el contenido');
var acciones = h('div',{class: 'herr-acciones',hidden: true},bPng,bSvg,bCopiar);
function contenido(v){
var t = v.texto.trim(),c = fCorreo.el.value.trim(),tel = fTel.el.value.replace(/[\s().-]/g,''),msg = fMsg.el.value.trim(),asunto = fAsunto.el.value.trim();
if(v === 'texto')return t;
return '';
}
function construirTexto(){
var t = tipo.el.value,txt = fTexto.el.value.trim(),c = fCorreo.el.value.trim(),asunto = fAsunto.el.value.trim(),msg = fMsg.el.value.trim(),tel = fTel.el.value.replace(/[\s().-]/g,'');
if(t === 'texto')return txt;
if(t === 'correo'){
if(!c)return '';
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c))throw new Error('La dirección de correo no parece válida. Debe tener @ y un dominio, como nombre@ejemplo.es.');
var q =[];if(asunto)q.push('subject=' + encodeURIComponent(asunto));if(msg)q.push('body=' + encodeURIComponent(msg));
return 'mailto:' + c +(q.length ? '?' + q.join('&'): '');
}
if(!tel)return '';
if(!/^\+?\d{6,15}$/.test(tel))throw new Error('El teléfono debe tener entre 6 y 15 cifras, con el prefijo internacional si quieres, como +34600000000.');
if(t === 'telefono')return 'tel:' + tel;
if(t === 'sms')return 'SMSTO:' + tel + ':' + msg;
if(!/^\+?\d{8,15}$/.test(tel))throw new Error('Para WhatsApp, escribe el teléfono completo con el prefijo del país, por ejemplo +34600000000.');
return 'https://wa.me/' + tel.replace(/^\+/,'')+(msg ? '?text=' + encodeURIComponent(msg): '');
}
function lum(hx){var f = function(i){var v = parseInt(hx.substr(i,2),16)/ 255;return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055)/ 1.055,2.4);};return 0.2126 * f(1)+ 0.7152 * f(3)+ 0.0722 * f(5);}
function generar(){
var t = tipo.el.value;
fTexto.nodo.hidden = t !== 'texto';fCorreo.nodo.hidden = fAsunto.nodo.hidden = t !== 'correo';fTel.nodo.hidden = !(t === 'telefono' || t === 'sms' || t === 'whatsapp');fMsg.nodo.hidden = !(t === 'correo' || t === 'sms' || t === 'whatsapp');
fMsg.nodo.firstChild.textContent = t === 'correo' ? 'Mensaje (opcional)' : 'Mensaje (opcional)';
error.hidden = true;aviso.hidden = true;actual = null;
var txt;
try{txt = construirTexto();if(txt)actual ={texto: txt,qr: QR.generar(txt,{nivel: nivel.el.value})};}catch(e){txt = null;error.hidden = false;error.textContent = e.message;}
var hay = !!actual;
lienzo.hidden = !hay;info.hidden = !hay;acciones.hidden = !hay;vacio.hidden = hay || !!error.textContent && !error.hidden;
if(!hay)return;
var m = +margen.el.value,d = QR.aLienzo(actual.qr,lienzo,{px: +tam.el.value,margen: m,color: color.value,fondo: fondo.value});
actual.margen = m;actual.lado = d.lado;
lienzo.style.width = Math.min(d.lado,360)+ 'px';
lienzo.setAttribute('aria-label','Código QR con el contenido: ' +(txt.length > 80 ? txt.slice(0,80)+ '…' : txt));
contenidoEl.textContent = txt;contenidoEl.setAttribute('data-v',txt);
versionEl.textContent = 'Versión ' + actual.qr.version + ' · ' + actual.qr.tamano + ' × ' + actual.qr.tamano + ' módulos';versionEl.setAttribute('data-v',String(actual.qr.version));
ladoEl.textContent = d.lado + ' × ' + d.lado + ' px';ladoEl.setAttribute('data-v',String(d.lado));
var av =[],cc = lum(color.value),cf = lum(fondo.value),cr =(Math.max(cc,cf)+ 0.05)/(Math.min(cc,cf)+ 0.05);
if(cc > cf)av.push('El código es más claro que el fondo. Muchos lectores no leen códigos invertidos: usa un color oscuro sobre fondo claro.');
else if(cr < 3)av.push('Hay poco contraste entre el código y el fondo (' + TH.fmt(cr,1)+ ' a 1). Puede que algunos móviles no lo lean.');
if(m === 0)av.push('Sin margen blanco, algunos lectores no encuentran el código. Se recomienda un margen estándar.');
if(actual.qr.version > 20)av.push('El código es muy denso (versión ' + actual.qr.version + '). Acorta el contenido para que se lea mejor al imprimirlo en pequeño.');
if(av.length){aviso.hidden = false;aviso.textContent = av.join(' ');}
}
[tipo,nivel,tam,margen].forEach(function(c){c.el.addEventListener('change',generar);});
[fTexto,fCorreo,fAsunto,fTel,fMsg].forEach(function(c){c.el.addEventListener('input',generar);});
[color,fondo].forEach(function(e){e.addEventListener('input',generar);});
raiz.appendChild(h('div',{class: 'qr'},
h('div',{class: 'qr-datos'},tipo.nodo,fTexto.nodo,fCorreo.nodo,fAsunto.nodo,fTel.nodo,fMsg.nodo,
h('div',{class: 'herr-campos'},nivel.nodo,tam.nodo,margen.nodo,
h('div',{class: 'campo'},h('label',{for: 'c-color',texto: 'Color del código'}),color),h('div',{class: 'campo'},h('label',{for: 'c-fondo',texto: 'Color del fondo'}),fondo))),
h('div',{class: 'qr-resultado'},error,vacio,lienzo,aviso,acciones,info)));
generar();
}
});
})();

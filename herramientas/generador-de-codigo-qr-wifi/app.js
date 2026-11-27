(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h,QR = null,actual = null;
TH.script('lib/qr.js').then(function(){QR = TH.qr;construir();},function(){TH.vaciar(raiz).appendChild(h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));});
function construir(){
TH.vaciar(raiz);
var estado = TH.estado(raiz);
function campo(id,etiqueta,nodo,ayuda){return{el: nodo,nodo: h('div',{class: 'campo'},h('label',{for: 'c-' + id,texto: etiqueta}),nodo,ayuda ? h('span',{class: 'campo-ayuda',texto: ayuda}): null)};}
function lista(id,etiqueta,ops,valor){return campo(id,etiqueta,h('select',{id: 'c-' + id},ops.map(function(o){return h('option',{value: o[0],selected: o[0]=== valor},o[1]);})));}
function marca(id,etiqueta){var c = h('input',{id: 'c-' + id,type: 'checkbox'});return{el: c,nodo: h('div',{class: 'campo campo--check'},h('span',{class: 'campo-check'},c,h('label',{for: 'c-' + id,texto: etiqueta})))};}
var ssid = campo('ssid','Nombre de la red (SSID)',h('input',{id: 'c-ssid',type: 'text',autocomplete: 'off',spellcheck: 'false',placeholder: 'MiCasa'}));
var seg = lista('seguridad','Tipo de seguridad',[['WPA','WPA, WPA2 o WPA3 (la más habitual)'],['WEP','WEP (muy antigua)'],['nopass','Red abierta, sin contraseña']],'WPA');
var clave = campo('clave','Contraseña de la red',h('input',{id: 'c-clave',type: 'password',autocomplete: 'off',spellcheck: 'false'}));
var ver = marca('ver','Mostrar la contraseña'),oculta = marca('oculta','Es una red oculta (no muestra su nombre)');
var comillas = marca('comillas','Entrecomillar el nombre de la red (solo si el móvil no se conecta)');
var nivel = lista('nivel','Corrección de errores',[['L','L · Baja'],['M','M · Media (recomendada)'],['Q','Q · Alta'],['H','H · Máxima']],'M');
var tam = lista('tam','Tamaño de la imagen',[['512','512 px'],['1024','1024 px'],['2048','2048 px']],'1024');
var lienzo = h('canvas',{id: 'qr-lienzo',class: 'qr-lienzo',role: 'img','aria-label': 'Código QR de la red Wi-Fi'});
var vacio = h('p',{class: 'herr-vacio','data-k': 'vacio',texto: 'Escribe el nombre de la red y su contraseña para ver aquí el código.'});
var error = h('p',{class: 'herr-estado herr-estado--error',role: 'alert','data-k': 'error',hidden: true});
var aviso = h('p',{class: 'herr-estado herr-estado--aviso','data-k': 'aviso',hidden: true});
var contenidoEl = h('code',{class: 'qr-contenido','data-k': 'contenido'}),versionEl = h('span',{'data-k': 'version'}),ladoEl = h('span',{'data-k': 'lado'});
var info = h('dl',{class: 'herr-res herr-res--compacto',hidden: true},
h('div',{class: 'herr-fila'},h('dt',{texto: 'Texto del código'}),h('dd',{},contenidoEl)),
h('div',{class: 'herr-fila'},h('dt',{texto: 'Tamaño del código'}),h('dd',{},versionEl)),
h('div',{class: 'herr-fila'},h('dt',{texto: 'Imagen'}),h('dd',{},ladoEl)));
var privacidad = h('p',{class: 'herr-chico',hidden: true,texto: 'Quien tenga este código podrá conectarse a tu red. Si la imprimes o la compartes, hazlo solo con personas de confianza o usa una red de invitados.'});
function entregar(nombre,blob){TH.entregas =[{nombre: nombre,blob: blob}];TH.descargar(blob,nombre);estado.poner('Descargado: ' + nombre + ' (' + TH.tamano(blob.size)+ ').','ok');}
var bPng = h('button',{class: 'boton',type: 'button',onclick: function(){TH.lienzoABlob(lienzo,'image/png').then(function(b){entregar('codigo-qr-wifi.png',b);});}},'Descargar PNG');
var bSvg = h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){entregar('codigo-qr-wifi.svg',new Blob([QR.aSVG(actual.qr,{margen: 4,px: actual.lado})],{type: 'image/svg+xml'}));}},'Descargar SVG');
var bCopiar = h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){TH.copiar(actual.texto,estado);}},'Copiar el texto del código');
var acciones = h('div',{class: 'herr-acciones',hidden: true},bPng,bSvg,bCopiar);
function esc(s){return s.replace(/([\\;,:"])/g,'\\$1');}
function octetos(t){return new TextEncoder().encode(t).length;}
function generar(){
var t = seg.el.value,nombre = ssid.el.value,pw = clave.el.value,hexa = /^[0-9A-Fa-f]+$/.test(nombre),av =[],msg = null;
clave.nodo.hidden = t === 'nopass';comillas.nodo.hidden = !hexa;
clave.el.type = ver.el.checked ? 'text' : 'password';
error.hidden = true;aviso.hidden = true;actual = null;
if(nombre && octetos(nombre)> 32)msg = 'El nombre de una red Wi-Fi no puede pasar de 32 bytes y el tuyo ocupa ' + octetos(nombre)+ ' (los acentos, la eñe y los emojis ocupan más de uno).';
else if(nombre && t === 'WPA' && pw){
var n = octetos(pw);
if(n > 63 && !(pw.length === 64 && /^[0-9A-Fa-f]+$/.test(pw)))msg = 'Una contraseña WPA no puede pasar de 63 caracteres (o 64 cifras hexadecimales) y la tuya ocupa ' + n + ' bytes.';
else if(n < 8)msg = 'Una contraseña WPA debe tener al menos 8 caracteres y la tuya tiene ' + n + '. Revisa que la hayas escrito completa.';
}
if(msg){error.hidden = false;error.textContent = msg;}
else if(nombre &&(t === 'nopass' || pw)){
var s = esc(nombre);if(hexa && comillas.el.checked)s = '"' + s + '"';
var texto = 'WIFI:T:' + t + ';S:' + s + ';' +(t === 'nopass' ? '' : 'P:' + esc(pw)+ ';')+(oculta.el.checked ? 'H:true;' : '')+ ';';
try{actual ={texto: texto,qr: QR.generar(texto,{nivel: nivel.el.value})};}catch(e){error.hidden = false;error.textContent = 'El texto es demasiado largo para un código QR. Acorta el nombre o la contraseña.';}
if(t === 'WEP')av.push('WEP es un cifrado obsoleto y muy fácil de romper. Si puedes, cambia tu router a WPA2 o WPA3.' +(/^([\x20-\x7e]{5}|[\x20-\x7e]{13}|[0-9A-Fa-f]{10}|[0-9A-Fa-f]{26})$/.test(pw)? '' : ' Además, las claves WEP tienen 5 o 13 caracteres, o 10 o 26 cifras hexadecimales, y la tuya no coincide.'));
if(hexa && !comillas.el.checked)av.push('El nombre solo tiene cifras y letras de la A a la F. La especificación recomienda entrecomillarlo para que no se confunda con un número hexadecimal, pero la mayoría de móviles no lo necesitan. Si el tuyo no se conecta, activa «Entrecomillar el nombre».');
}
var hay = !!actual;
lienzo.hidden = !hay;info.hidden = !hay;acciones.hidden = !hay;privacidad.hidden = !hay;vacio.hidden = hay || !error.hidden;
if(!hay)return;
var d = QR.aLienzo(actual.qr,lienzo,{px: +tam.el.value,margen: 4});
actual.lado = d.lado;
lienzo.style.width = Math.min(d.lado,360)+ 'px';
lienzo.setAttribute('aria-label','Código QR para conectarse a la red Wi-Fi ' + nombre);
var mostrar = ver.el.checked || t === 'nopass' ? actual.texto : actual.texto.replace(/;P:(?:[^;\\]|\\.)*;/,';P:••••••;');
contenidoEl.textContent = mostrar;contenidoEl.setAttribute('data-v',actual.texto);
versionEl.textContent = 'Versión ' + actual.qr.version + ' · ' + actual.qr.tamano + ' × ' + actual.qr.tamano + ' módulos';versionEl.setAttribute('data-v',String(actual.qr.version));
ladoEl.textContent = d.lado + ' × ' + d.lado + ' px';ladoEl.setAttribute('data-v',String(d.lado));
if(av.length){aviso.hidden = false;aviso.textContent = av.join(' ');}
}
[seg,nivel,tam].forEach(function(c){c.el.addEventListener('change',generar);});
[ssid,clave].forEach(function(c){c.el.addEventListener('input',generar);});
[ver,oculta,comillas].forEach(function(c){c.el.addEventListener('change',generar);});
raiz.appendChild(h('div',{class: 'qr'},
h('div',{class: 'qr-datos'},ssid.nodo,seg.nodo,clave.nodo,ver.nodo,oculta.nodo,comillas.nodo,h('div',{class: 'herr-campos'},nivel.nodo,tam.nodo)),
h('div',{class: 'qr-resultado'},error,vacio,lienzo,aviso,acciones,info,privacidad)));
generar();
}
});
})();

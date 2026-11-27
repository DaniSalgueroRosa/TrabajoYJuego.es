(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h,I = null,im = null,rect = null,nombre = 'imagen',arrastre = null;
var RELACIONES ={libre: 0,'1:1': 1,'4:3': 4 / 3,'3:2': 3 / 2,'16:9': 16 / 9,'9:16': 9 / 16};
var zona = TH.archivos(raiz,{
aceptar: '.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/avif',aceptarTexto: 'JPG, PNG, WebP, GIF, BMP, SVG o AVIF',multiple: false,
texto: 'Arrastra aquí la imagen que quieres recortar o elígela desde tu dispositivo.',
alCambiar: function(l){if(l.length)cargar(l[0]);else cerrar();}
});
var editor = h('div',{class: 'rec',hidden: true}),salida = h('div',{class: 'herr-salida',hidden: true});
function campo(id,etiqueta){var i = h('input',{id: 'c-' + id,type: 'text',inputmode: 'numeric',autocomplete: 'off'});return{el: i,nodo: h('div',{class: 'campo'},h('label',{for: 'c-' + id,texto: etiqueta}),i)};}
function lista(id,etiqueta,ops,valor){
var s = h('select',{id: 'c-' + id},ops.map(function(o){return h('option',{value: o[0],selected: o[0]=== valor},o[1]);}));
return{el: s,nodo: h('div',{class: 'campo'},h('label',{for: 'c-' + id,texto: etiqueta}),s)};
}
var lienzo = h('canvas',{class: 'rec-lienzo','aria-hidden': 'true'});
var sel = h('div',{class: 'rec-sel',tabindex: '0',role: 'group','aria-label': 'Zona de recorte. Muévela con las flechas del teclado; con Mayús avanza de 10 en 10 píxeles.'},
['nw','ne','sw','se'].map(function(c){return h('span',{class: 'rec-asa rec-asa--' + c,'data-asa': c});}));
var escenario = h('div',{class: 'rec-escenario'},lienzo,sel);
var fx = campo('x','Izquierda (px)'),fy = campo('y','Arriba (px)'),fw = campo('ancho','Ancho (px)'),fh = campo('alto','Alto (px)');
var relacion = lista('relacion','Proporción',[['libre','Libre'],['1:1','Cuadrada (1:1)'],['4:3','4:3'],['3:2','3:2'],['16:9','Panorámica (16:9)'],['9:16','Vertical (9:16)'],['original','La de la imagen original']],'libre');
var formato = lista('formato','Guardar como',[['png','PNG'],['jpg','JPG'],['webp','WebP']],'png');
var calidad = campo('calidad','Calidad en JPG y WebP (1 a 100)');calidad.el.value = '90';
var medida = h('p',{class: 'herr-nota','data-k': 'medida','aria-live': 'polite'});
editor.appendChild(h('p',{class: 'herr-chico',texto: 'Arrastra el rectángulo para moverlo y los círculos de las esquinas para cambiar su tamaño. También puedes escribir las medidas.'}));
editor.appendChild(escenario);
editor.appendChild(medida);
editor.appendChild(h('div',{class: 'herr-campos'},fx.nodo,fy.nodo,fw.nodo,fh.nodo,relacion.nodo,formato.nodo,calidad.nodo));
editor.appendChild(h('div',{class: 'herr-acciones'},
h('button',{class: 'boton',type: 'button',id: 'rec-ejecutar',onclick: exportar},'Recortar y descargar'),
h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){rect ={x: 0,y: 0,w: im.ancho,h: im.alto};if(k()){rect = ajustar(limitar(rect));}pintar();}},'Seleccionar toda la imagen')));
raiz.appendChild(editor);raiz.appendChild(salida);
function k(){var v = relacion.el.value;return v === 'original' ? im.ancho / im.alto : RELACIONES[v];}
function ajustar(r){
var w = Math.max(1,Math.min(im.ancho,Math.round(r.w))),hh = Math.max(1,Math.min(im.alto,Math.round(r.h)));
return{x: Math.max(0,Math.min(im.ancho - w,Math.round(r.x))),y: Math.max(0,Math.min(im.alto - hh,Math.round(r.y))),w: w,h: hh};
}
function limitar(r){
var q = k();if(!q)return r;
var w = r.w,hh = w / q;
if(hh > im.alto){hh = im.alto;w = hh * q;}
if(w > im.ancho){w = im.ancho;hh = w / q;}
return{x: r.x,y: r.y,w: w,h: hh};
}
function pintar(salvo){
var p = function(v,t){return(v / t * 100)+ '%';};
sel.style.left = p(rect.x,im.ancho);sel.style.top = p(rect.y,im.alto);sel.style.width = p(rect.w,im.ancho);sel.style.height = p(rect.h,im.alto);
[[fx,rect.x],[fy,rect.y],[fw,rect.w],[fh,rect.h]].forEach(function(c){if(c[0].el !== salvo)c[0].el.value = c[1];});
medida.textContent = 'Zona elegida: ' + rect.w + ' × ' + rect.h + ' px. La imagen mide ' + im.ancho + ' × ' + im.alto + ' px.';
medida.setAttribute('data-v',rect.w + 'x' + rect.h);medida.setAttribute('data-x',rect.x);medida.setAttribute('data-y',rect.y);
}
function leer(c){var v = TH.num(c.el.value);return isFinite(v)? v : null;}
fx.el.addEventListener('input',function(){var v = leer(fx);if(v !== null){rect = ajustar({x: v,y: rect.y,w: rect.w,h: rect.h});pintar(fx.el);}});
fy.el.addEventListener('input',function(){var v = leer(fy);if(v !== null){rect = ajustar({x: rect.x,y: v,w: rect.w,h: rect.h});pintar(fy.el);}});
fw.el.addEventListener('input',function(){var v = leer(fw);if(v !== null && v >= 1){rect = ajustar(limitar({x: rect.x,y: rect.y,w: v,h: k()? v / k(): rect.h}));pintar(fw.el);}});
fh.el.addEventListener('input',function(){var v = leer(fh);if(v !== null && v >= 1){var q = k(),r = q ? limitar({x: rect.x,y: rect.y,w: v * q,h: v}):{x: rect.x,y: rect.y,w: rect.w,h: v};rect = ajustar(r);pintar(fh.el);}});
[fx,fy,fw,fh].forEach(function(c){c.el.addEventListener('change',function(){pintar();});});
relacion.el.addEventListener('change',function(){
if(k()){var cx = rect.x + rect.w / 2,cy = rect.y + rect.h / 2,r = limitar({x: 0,y: 0,w: rect.w,h: rect.w / k()});rect = ajustar({x: cx - r.w / 2,y: cy - r.h / 2,w: r.w,h: r.h});}
pintar();
});
function enImagen(ev){var b = escenario.getBoundingClientRect(),s = b.width / im.ancho;return{x:(ev.clientX - b.left)/ s,y:(ev.clientY - b.top)/ s};}
sel.addEventListener('pointerdown',function(ev){
arrastre ={asa: ev.target.getAttribute ? ev.target.getAttribute('data-asa'): null,p0: enImagen(ev),r0:{x: rect.x,y: rect.y,w: rect.w,h: rect.h}};
try{sel.setPointerCapture(ev.pointerId);}catch(e){}
ev.preventDefault();sel.focus({preventScroll: true});
});
sel.addEventListener('pointermove',function(ev){
if(!arrastre)return;
var p = enImagen(ev),r0 = arrastre.r0;
if(!arrastre.asa)rect = ajustar({x: r0.x + p.x - arrastre.p0.x,y: r0.y + p.y - arrastre.p0.y,w: r0.w,h: r0.h});
else{
var ox = arrastre.asa.indexOf('w')>= 0 ? r0.x + r0.w : r0.x,oy = arrastre.asa.indexOf('n')>= 0 ? r0.y + r0.h : r0.y;
var px = Math.max(0,Math.min(im.ancho,p.x)),py = Math.max(0,Math.min(im.alto,p.y)),w = Math.abs(px - ox),hh = Math.abs(py - oy),q = k();
var dx = px >= ox ? 1 : -1,dy = py >= oy ? 1 : -1;
if(q){
hh = w / q;
var f = Math.min(1,(dx > 0 ? im.ancho - ox : ox)/ Math.max(w,1e-9),(dy > 0 ? im.alto - oy : oy)/ Math.max(hh,1e-9));
w *= f;hh *= f;
}
rect = ajustar({x: dx > 0 ? ox : ox - w,y: dy > 0 ? oy : oy - hh,w: Math.max(1,w),h: Math.max(1,hh)});
}
pintar();
});
['pointerup','pointercancel'].forEach(function(t){sel.addEventListener(t,function(){arrastre = null;});});
sel.addEventListener('keydown',function(ev){
var d = ev.shiftKey ? 10 : 1,m ={ArrowLeft:[-d,0],ArrowRight:[d,0],ArrowUp:[0,-d],ArrowDown:[0,d]}[ev.key];
if(!m)return;
ev.preventDefault();rect = ajustar({x: rect.x + m[0],y: rect.y + m[1],w: rect.w,h: rect.h});pintar();
});
function cerrar(){editor.hidden = true;salida.hidden = true;if(im){im.liberar();im = null;}}
function cargar(archivo){
TH.script('lib/imagenes.js').then(function(){I = TH.imagen;return I.abrir(archivo);}).then(function(nueva){
if(im)im.liberar();
im = nueva;nombre = archivo.name;salida.hidden = true;zona.estado.limpiar();
var esc = Math.min(1,1000 / Math.max(im.ancho,im.alto));
lienzo.width = Math.max(1,Math.round(im.ancho * esc));lienzo.height = Math.max(1,Math.round(im.alto * esc));
lienzo.getContext('2d').drawImage(im.fuente,0,0,lienzo.width,lienzo.height);
escenario.style.maxWidth = Math.min(im.ancho,900)+ 'px';
var w = Math.max(1,Math.round(im.ancho * 0.8)),hh = Math.max(1,Math.round(im.alto * 0.8));
rect = ajustar(limitar({x:(im.ancho - w)/ 2,y:(im.alto - hh)/ 2,w: w,h: hh}));
editor.hidden = false;pintar();
},function(e){cerrar();zona.estado.poner(e.message,'error');});
}
function exportar(){
var fmt = formato.el.value,q = I.calidad(leer(calidad),90);
try{
var c = I.lienzo(rect.w,rect.h),g = c.getContext('2d');
if(fmt === 'jpg'){g.fillStyle = '#ffffff';g.fillRect(0,0,c.width,c.height);}
g.drawImage(im.fuente,rect.x,rect.y,rect.w,rect.h,0,0,rect.w,rect.h);
I.exportar(c,fmt,q).then(function(blob){
TH.entrega(salida,[{nombre: I.nombreSalida(nombre,'recortada-' + rect.w + 'x' + rect.h,I.formatos[fmt].ext),blob: blob,nota: I.resumen(rect.w,rect.h)}]);
zona.estado.poner('Listo: recorte de ' + rect.w + ' × ' + rect.h + ' px.','ok');
},function(e){zona.estado.poner(e.message,'error');});
}catch(e){zona.estado.poner(e.message,'error');}
}
});
})();

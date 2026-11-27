(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h,doc = document;
var area = h('textarea',{id: 'b-nota',rows: 16,spellcheck: 'true',placeholder: 'Escribe aquí tu nota…','aria-label': 'Tu nota'});
var nombre = h('input',{id: 'c-nombre',type: 'text',value: 'nota',autocomplete: 'off',maxlength: '60'});
var formato = h('select',{id: 'c-formato'},[['txt','Texto (.txt)'],['md','Markdown (.md)']].map(function(o){return h('option',{value: o[0]},o[1]);}));
var tam = h('select',{id: 'c-tamano'},[['1','Normal'],['1.25','Grande'],['1.6','Muy grande']].map(function(o){return h('option',{value: o[0]},o[1]);}));
var mono = h('input',{id: 'c-mono',type: 'checkbox'});
var cuenta = h('p',{class: 'b-cuenta','aria-live': 'off'});
var estado = TH.estado(raiz),salvado = '',anterior = null;
function campo(id,et,el){return h('div',{class: 'campo'},h('label',{for: id,texto: et}),el);}
raiz.appendChild(h('div',{class: 'campo'},h('label',{for: 'b-nota',texto: 'Nota'}),area));
raiz.appendChild(cuenta);
raiz.appendChild(h('div',{class: 'herr-acciones'},
h('button',{class: 'boton',type: 'button',id: 'b-descargar',onclick: descargar},'Descargar'),
h('button',{class: 'boton boton--secundario',type: 'button',id: 'b-copiar',onclick: function(){TH.copiar(area.value,estado);salvado = area.value;}},'Copiar todo'),
h('button',{class: 'boton boton--secundario',type: 'button',id: 'b-fecha',onclick: insertarFecha},'Insertar fecha y hora'),
h('button',{class: 'boton boton--secundario',type: 'button',id: 'b-borrar',onclick: borrar},'Borrar todo'),
h('button',{class: 'boton boton--secundario',type: 'button',id: 'b-deshacer',hidden: true,onclick: deshacer},'Deshacer el borrado')));
raiz.appendChild(h('div',{class: 'herr-campos'},campo('c-nombre','Nombre del archivo',nombre),campo('c-formato','Formato',formato),campo('c-tamano','Tamaño de letra',tam),
h('div',{class: 'campo campo--check'},h('span',{class: 'campo-check'},mono,h('label',{for: 'c-mono',texto: 'Letra de ancho fijo'})))));
function medir(){
var t = area.value,pal =(t.match(TH.RE_PALABRA)||[]).length,car = TH.grafemas(t).length,lin = t === '' ? 0 : t.split(/\r\n|\r|\n/).length;
cuenta.textContent = '';
[['palabras',pal,'palabra','palabras'],['caracteres',car,'carácter','caracteres'],['lineas',lin,'línea','líneas']].forEach(function(x,i){
cuenta.appendChild(h('span',{'data-k': x[0],'data-v': String(x[1]),texto: TH.pl(x[1],x[2],x[3])}));if(i < 2)cuenta.appendChild(doc.createTextNode(' · '));
});
}
function limpiarNombre(){var n = TH.nombreBase(nombre.value.trim()|| 'nota');return n.replace(/\.+$/,'')|| 'nota';}
function descargar(){
if(!area.value){estado.poner('La nota está vacía: escribe algo antes de descargarla.','aviso');return;}
var ext = formato.value;
TH.descargar(area.value,limpiarNombre()+ '.' + ext,ext === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8');
salvado = area.value;estado.poner('Nota descargada.','ok');
}
function insertarFecha(){
var d = new Date(TH.ahora()),t =('0' + d.getDate()).slice(-2)+ '/' +('0' +(d.getMonth()+ 1)).slice(-2)+ '/' + d.getFullYear()+ ' ' +('0' + d.getHours()).slice(-2)+ ':' +('0' + d.getMinutes()).slice(-2);
var a = area.selectionStart == null ? area.value.length : area.selectionStart,b = area.selectionEnd == null ? a : area.selectionEnd;
area.value = area.value.slice(0,a)+ t + area.value.slice(b);area.focus();area.setSelectionRange(a + t.length,a + t.length);medir();
}
function borrar(){
if(!area.value)return;
anterior = area.value;area.value = '';medir();doc.getElementById('b-deshacer').hidden = false;
estado.poner('Nota borrada. Puedes recuperarla con «Deshacer el borrado» hasta que escribas algo nuevo.','info');
}
function deshacer(){if(anterior === null)return;area.value = anterior;anterior = null;doc.getElementById('b-deshacer').hidden = true;estado.limpiar();medir();}
function aspecto(){area.style.fontSize = tam.value + 'rem';area.style.fontFamily = mono.checked ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : '';}
area.addEventListener('input',function(){medir();if(anterior !== null && area.value){anterior = null;doc.getElementById('b-deshacer').hidden = true;}});
tam.addEventListener('change',aspecto);mono.addEventListener('change',aspecto);
window.addEventListener('beforeunload',function(ev){if(area.value && area.value !== salvado){ev.preventDefault();ev.returnValue = '';}});
medir();aspecto();
});
})();

(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h,MAX = 5,n = 1,C =[],estado = TH.estado(raiz);
var NUEVA ={x: 0,y: 2,blur: 6,ext: 0,color: '#000000',op: 12,inset: false};
var PRESETS ={
sutil:[{x: 0,y: 1,blur: 3,ext: 0,color: '#000000',op: 12,inset: false},{x: 0,y: 1,blur: 2,ext: 0,color: '#000000',op: 24,inset: false}],
elevada:[{x: 0,y: 12,blur: 32,ext: 0,color: '#000000',op: 20,inset: false},{x: 0,y: 4,blur: 8,ext: 0,color: '#000000',op: 10,inset: false}],
larga:[{x: 0,y: 24,blur: 40,ext: -12,color: '#000000',op: 40,inset: false}],
interior:[{x: 0,y: 2,blur: 8,ext: 0,color: '#000000',op: 25,inset: true}],
neon:[{x: 0,y: 0,blur: 12,ext: 2,color: '#00e5ff',op: 100,inset: false},{x: 0,y: 0,blur: 32,ext: 4,color: '#00e5ff',op: 50,inset: false}]
};
var NOMBRES ={sutil: 'Sutil',elevada: 'Elevada',larga: 'Larga',interior: 'Interior',neon: 'Neón'};
function lista(id,etiqueta,ops,valor){
var s = h('select',{id: 'c-' + id},ops.map(function(o){return h('option',{value: o[0],selected: o[0]=== valor},o[1]);}));
return{el: s,nodo: h('div',{class: 'campo'},h('label',{for: 'c-' + id,texto: etiqueta}),s)};
}
function numero(id,etiqueta,valor){
var i = h('input',{id: 'c-' + id,type: 'number',step: 'any',inputmode: 'decimal',value: String(valor),autocomplete: 'off'});
return{el: i,nodo: h('div',{class: 'campo'},h('label',{for: 'c-' + id,texto: etiqueta}),i)};
}
function casilla(id,etiqueta,valor){
var i = h('input',{id: 'c-' + id,type: 'checkbox',checked: !!valor});
return{el: i,nodo: h('div',{class: 'campo campo--check'},h('span',{class: 'campo-check'},i,h('label',{for: 'c-' + id,texto: etiqueta})))};
}
function color(id,etiqueta,valor){
var i = h('input',{id: 'c-' + id,type: 'color',value: valor});
return{el: i,nodo: h('div',{class: 'campo'},h('label',{for: 'c-' + id,texto: etiqueta}),i)};
}
function fmt(v){return String(Math.round(v * 100)/ 100);}
function longitud(v){return v === 0 ? '0' : fmt(v)+ 'px';}
function colorCss(hex,op){
if(op >= 100)return hex.toLowerCase();
return 'rgba(' + parseInt(hex.substr(1,2),16)+ ', ' + parseInt(hex.substr(3,2),16)+ ', ' + parseInt(hex.substr(5,2),16)+ ', ' + fmt(op / 100)+ ')';
}
function leer(el){var v = el.value.trim();if(v === '')return 0;var x = Number(v);return isFinite(x)? x : NaN;}
var propiedad = lista('propiedad','Propiedad CSS',[['box-shadow','box-shadow (cajas)'],['text-shadow','text-shadow (texto)']],'box-shadow');
var i;
for(i = 0;i < MAX;i++)(function(k){
var d = k === 0 ?{x: 0,y: 10,blur: 30,ext: 0,color: '#000000',op: 25,inset: false}: NUEVA,s = String(k + 1);
var c ={x: numero('x' + s,'Desplazamiento horizontal (px)',d.x),y: numero('y' + s,'Desplazamiento vertical (px)',d.y),blur: numero('blur' + s,'Desenfoque (px)',d.blur),
ext: numero('ext' + s,'Extensión (px)',d.ext),color: color('color' + s,'Color de la sombra',d.color),op: numero('op' + s,'Opacidad (0 a 100)',d.op),inset: casilla('inset' + s,'Sombra interior (inset)',d.inset)};
c.caja = h('fieldset',{class: 'sc-capa',id: 'capa-' + s,hidden: k >= n},h('legend',{texto: 'Capa ' + s}),
h('div',{class: 'herr-campos'},c.x.nodo,c.y.nodo,c.blur.nodo,c.ext.nodo,c.color.nodo,c.op.nodo),c.inset.nodo);
C.push(c);
})(i);
var presets = h('div',{class: 'sc-presets',role: 'group','aria-label': 'Sombras de ejemplo'},Object.keys(PRESETS).map(function(k){
return h('button',{class: 'boton boton--secundario',type: 'button',id: 'sc-' + k,onclick: function(){aplicar(PRESETS[k]);}},NOMBRES[k]);
}));
var mas = h('button',{class: 'boton boton--secundario',type: 'button',id: 'sc-mas',onclick: function(){if(n < MAX){poner(C[n],NUEVA);n++;generar();}}},'Añadir capa');
var menos = h('button',{class: 'boton boton--secundario',type: 'button',id: 'sc-menos',onclick: function(){if(n > 1){n--;generar();}}},'Quitar la última capa');
var fondoEsc = color('escena','Fondo de la vista previa','#eef1f4'),fondoCaja = color('caja','Color de la caja','#ffffff'),colorTexto = color('texto-color','Color del texto','#1b2a3a'),radio = numero('radio','Esquinas redondeadas (px)',12);
var texto = h('span',{class: 'sc-texto',texto: 'Sombra'}),caja = h('div',{class: 'sc-caja'},texto),escena = h('div',{class: 'sc-escena','aria-hidden': 'true'},caja);
var error = h('p',{class: 'herr-estado herr-estado--error',role: 'alert','data-k': 'error',hidden: true});
var salida = h('textarea',{id: 't-salida',rows: 6,readonly: true,spellcheck: 'false',class: 'sc-codigo','aria-label': 'Código CSS'});
var info = h('div');
var copiar = h('button',{class: 'boton',type: 'button',id: 'sc-copiar',onclick: function(){if(salida.value)TH.copiar(salida.value,estado);}},'Copiar el código');
function poner(c,d){
c.x.el.value = d.x;c.y.el.value = d.y;c.blur.el.value = d.blur;c.ext.el.value = d.ext;c.color.el.value = d.color;c.op.el.value = d.op;c.inset.el.checked = !!d.inset;
}
function aplicar(lista){
propiedad.el.value = 'box-shadow';
n = lista.length;
lista.forEach(function(d,k){poner(C[k],d);});
generar();
}
function generar(){
var caja_ = propiedad.el.value === 'box-shadow',capas =[],k,falla = null;
for(k = 0;k < n && !falla;k++){
var c = C[k],p = n > 1 ? 'Capa ' +(k + 1)+ ': ' : '';
var v ={x: leer(c.x.el),y: leer(c.y.el),blur: leer(c.blur.el),ext: caja_ ? leer(c.ext.el): 0,op: leer(c.op.el),color: c.color.el.value,inset: caja_ && c.inset.el.checked};
if(isNaN(v.x)|| v.x < -200 || v.x > 200)falla = p + 'El desplazamiento horizontal debe estar entre -200 y 200 px.';
else if(isNaN(v.y)|| v.y < -200 || v.y > 200)falla = p + 'El desplazamiento vertical debe estar entre -200 y 200 px.';
else if(v.blur < 0)falla = p + 'El desenfoque no puede ser negativo.';
else if(isNaN(v.blur)|| v.blur > 300)falla = p + 'El desenfoque no puede pasar de 300 px.';
else if(isNaN(v.ext)|| v.ext < -100 || v.ext > 200)falla = p + 'La extensión debe estar entre -100 y 200 px.';
else if(isNaN(v.op)|| v.op < 0 || v.op > 100)falla = p + 'La opacidad debe estar entre 0 y 100.';
capas.push(v);
}
C.forEach(function(c,j){c.caja.hidden = j >= n;c.ext.nodo.hidden = c.inset.nodo.hidden = !caja_;});
mas.disabled = n >= MAX;menos.disabled = n <= 1;
error.hidden = !falla;error.textContent = falla || '';
if(falla){salida.value = '';TH.vaciar(info);caja.style.boxShadow = 'none';texto.style.textShadow = 'none';return;}
var partes = capas.map(function(v){
var q =[];
if(v.inset)q.push('inset');
q.push(longitud(v.x),longitud(v.y),longitud(v.blur));
if(v.ext !== 0)q.push(longitud(v.ext));
q.push(colorCss(v.color,v.op));
return q.join(' ');
});
var nombre = propiedad.el.value,codigo = partes.length === 1 ? nombre + ': ' + partes[0]+ ';' : nombre + ':\n  ' + partes.join(',\n  ')+ ';',valor = partes.join(', ');
salida.value = codigo;
caja.style.boxShadow = caja_ ? valor : 'none';texto.style.textShadow = caja_ ? 'none' : valor;
escena.style.background = fondoEsc.el.value;caja.style.background = caja_ ? fondoCaja.el.value : 'transparent';
caja.style.borderRadius = Math.max(0,leer(radio.el)|| 0)+ 'px';texto.style.color = colorTexto.el.value;
TH.vaciar(info).appendChild(TH.listaFilas([TH.fila('capas','Capas de sombra',n,'n0'),TH.fila('caracteres','Caracteres del código',codigo.length,'n0')]));
}
TH.vaciar(raiz);
raiz.appendChild(h('div',{class: 'sc'},
h('div',{class: 'sc-datos'},propiedad.nodo,h('div',{class: 'campo'},h('span',{class: 'campo-ayuda',texto: 'Empieza por una sombra de ejemplo y ajústala:'}),presets),C.map(function(c){return c.caja;}),
h('div',{class: 'herr-acciones'},mas,menos),
h('div',{class: 'herr-campos'},fondoEsc.nodo,fondoCaja.nodo,colorTexto.nodo,radio.nodo)),
h('div',{class: 'sc-resultado'},escena,error,h('div',{class: 'campo'},h('label',{for: 't-salida',texto: 'Código CSS'}),salida),h('div',{class: 'herr-acciones'},copiar),info)));
raiz.addEventListener('input',generar);raiz.addEventListener('change',generar);
generar();
});
})();

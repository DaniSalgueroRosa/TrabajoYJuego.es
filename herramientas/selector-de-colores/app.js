(function(){
'use strict';
TH.alCargar(function(raiz){
function errorCarga(){TH.vaciar(raiz).appendChild(TH.h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));}
var h = TH.h,C = null,cur ={r: 51,g: 102,b: 153};
TH.script('lib/color.js').then(function(){C = TH.color;construir();},errorCarga);
function construir(){
TH.vaciar(raiz);
var estado = TH.estado(raiz);
var avisoError = h('p',{class: 'herr-estado herr-estado--error',role: 'alert','data-k': 'error',hidden: true});
function campo(id,etiqueta,valor,extra){
var i = h('input',Object.assign({id: 'c-' + id,type: 'text',autocomplete: 'off',value: valor},extra ||{}));
return{el: i,nodo: h('div',{class: 'campo'},h('label',{for: 'c-' + id,texto: etiqueta}),i)};
}
var sel = h('input',{id: 'c-selector',type: 'color',value: '#336699'});
var inHex = campo('hex','Código HEX','#336699',{maxlength: '7',spellcheck: 'false'});
var inR = campo('r','Rojo (0 a 255)','51',{inputmode: 'numeric'}),inG = campo('g','Verde (0 a 255)','102',{inputmode: 'numeric'}),inB = campo('b','Azul (0 a 255)','153',{inputmode: 'numeric'});
var inH = campo('h','Tono (0 a 360)','210',{inputmode: 'decimal'}),inS = campo('s','Saturación (0 a 100)','50',{inputmode: 'decimal'}),inL = campo('l','Luminosidad (0 a 100)','40',{inputmode: 'decimal'});
var muestra = h('div',{class: 'col-muestra',role: 'img','aria-label': 'Muestra del color elegido'},h('span',{texto: 'Texto de ejemplo'}));
var filas ={};
function fila(k,et,copiar){
var v = h('span',{'data-k': k}),btn = copiar ? h('button',{class: 'boton boton--secundario boton--chico',type: 'button','aria-label': 'Copiar ' + et,onclick: function(){TH.copiar(v.getAttribute('data-v'),estado);}},'Copiar'): null;
filas[k]= v;
return h('div',{class: 'herr-fila'},h('dt',{texto: et}),h('dd',{class: 'col-valor'},v,btn));
}
var res = h('dl',{class: 'herr-res'},fila('hex','HEX',true),fila('rgb','RGB',true),fila('hsl','HSL',true),fila('cmyk','CMYK',true),fila('css','Color CSS más cercano',false),fila('contraste-blanco','Contraste con texto blanco',false),fila('contraste-negro','Contraste con texto negro',false));
function poner(k,texto,crudo){filas[k].textContent = texto;filas[k].setAttribute('data-v',crudo == null ? texto : crudo);}
function nivel(r){return r >= 7 ? 'cumple AAA' : r >= 4.5 ? 'cumple AA' : r >= 3 ? 'solo vale para texto grande (AA)' : 'no cumple';}
function actualizar(origen){
var hex = C.aHex(cur),hsl = C.aHsl(cur),cb = C.contraste(cur,{r: 255,g: 255,b: 255}),cn = C.contraste(cur,{r: 0,g: 0,b: 0}),n = C.cercano(cur);
if(origen !== sel)sel.value = hex.toLowerCase();
if(origen !== inHex.el)inHex.el.value = hex;
[[inR,cur.r],[inG,cur.g],[inB,cur.b],[inH,Math.round(hsl.h)],[inS,Math.round(hsl.s)],[inL,Math.round(hsl.l)]].forEach(function(p){if(origen !== p[0].el)p[0].el.value = p[1];});
muestra.style.background = hex;muestra.style.color = C.textoSobre(cur);
poner('hex',hex);poner('rgb',C.rgbTexto(cur));poner('hsl',C.hslTexto(cur));poner('cmyk',C.cmykTexto(cur));
poner('css',n.nombre +(n.exacto ? '' : ' (el más parecido)'),n.nombre);
poner('contraste-blanco',TH.fmt(cb,2)+ ' a 1 · ' + nivel(cb),String(Math.round(cb * 100)/ 100));
poner('contraste-negro',TH.fmt(cn,2)+ ' a 1 · ' + nivel(cn),String(Math.round(cn * 100)/ 100));
}
var todos =[inHex.el,inR.el,inG.el,inB.el,inH.el,inS.el,inL.el];
function sinError(){avisoError.hidden = true;avisoError.textContent = '';todos.forEach(function(e){e.removeAttribute('aria-invalid');});}
function conError(msg,campos){avisoError.hidden = false;avisoError.textContent = msg;campos.forEach(function(e){e.setAttribute('aria-invalid','true');});}
sel.addEventListener('input',function(){cur = C.analizar(sel.value);sinError();actualizar(sel);});
inHex.el.addEventListener('input',function(){if(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(inHex.el.value.trim())){cur = C.analizar(inHex.el.value);sinError();actualizar(inHex.el);}});
inHex.el.addEventListener('change',function(){
if(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(inHex.el.value.trim())){sinError();actualizar();}
else conError('El código HEX debe tener 3 o 6 cifras (de 0 a 9 y de A a F), como #336699.',[inHex.el]);
});
function entero(el,max){var t = el.value.trim();return /^\d{1,3}$/.test(t)&& +t <= max ? +t : null;}
function alRGB(ev){
var r = entero(inR.el,255),g = entero(inG.el,255),b = entero(inB.el,255);
if(r === null || g === null || b === null){if(ev.type === 'change')conError('Rojo, verde y azul son números enteros de 0 a 255.',[inR.el,inG.el,inB.el]);return;}
cur ={r: r,g: g,b: b};sinError();actualizar(ev.type === 'change' ? null : ev.target);
}
function alHSL(ev){
var a = TH.num(inH.el.value),s = TH.num(inS.el.value),l = TH.num(inL.el.value);
if(!(a >= 0 && a <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100)){if(ev.type === 'change')conError('El tono va de 0 a 360 y la saturación y la luminosidad, de 0 a 100.',[inH.el,inS.el,inL.el]);return;}
cur = C.deHsl(a,s,l);sinError();actualizar(ev.type === 'change' ? null : ev.target);
}
[inR,inG,inB].forEach(function(c){c.el.addEventListener('input',alRGB);c.el.addEventListener('change',alRGB);});
[inH,inS,inL].forEach(function(c){c.el.addEventListener('input',alHSL);c.el.addEventListener('change',alHSL);});
var archivo = h('input',{id: 'c-imagen',type: 'file',accept: 'image/*'});
var lienzo = h('canvas',{id: 'col-lienzo',class: 'col-lienzo',hidden: true,tabindex: '0',role: 'img','aria-label': 'Imagen elegida. Haz clic o toca un punto para tomar su color.'});
archivo.addEventListener('change',function(){
var f = archivo.files[0];if(!f)return;
TH.script('lib/imagenes.js').then(function(){return TH.imagen.abrir(f);}).then(function(im){
var k = Math.min(1,640 / im.ancho);
lienzo.width = Math.max(1,Math.round(im.ancho * k));lienzo.height = Math.max(1,Math.round(im.alto * k));
lienzo.getContext('2d',{willReadFrequently: true}).drawImage(im.fuente,0,0,lienzo.width,lienzo.height);im.liberar();
lienzo.hidden = false;estado.poner('Haz clic o toca la imagen para tomar el color de ese punto.','info');
},function(e){estado.poner(e.message,'error');});
});
lienzo.addEventListener('click',function(ev){
var b = lienzo.getBoundingClientRect(),x = Math.min(lienzo.width - 1,Math.max(0,Math.floor((ev.clientX - b.left)/ b.width * lienzo.width))),y = Math.min(lienzo.height - 1,Math.max(0,Math.floor((ev.clientY - b.top)/ b.height * lienzo.height)));
var d = lienzo.getContext('2d',{willReadFrequently: true}).getImageData(x,y,1,1).data;
if(d[3]=== 0){estado.poner('Ese punto es transparente: elige otro.','aviso');return;}
cur ={r: d[0],g: d[1],b: d[2]};sinError();actualizar();
estado.poner('Color tomado de la imagen: ' + C.aHex(cur)+(d[3]< 255 ? ' (el punto era semitransparente; se toma su color sin transparencia).' : '.'),'ok');
});
var gotero = window.EyeDropper ? h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){new window.EyeDropper().open().then(function(r){var c = C.analizar(r.sRGBHex);if(c){cur = c;sinError();actualizar();}},function(){});}},'Usar el cuentagotas de la pantalla'): null;
raiz.appendChild(h('div',{class: 'col'},
h('div',{class: 'col-izq'},muestra,h('div',{class: 'campo'},h('label',{for: 'c-selector',texto: 'Selector de color'}),sel),gotero ? h('div',{class: 'herr-acciones'},gotero): null),
h('div',{class: 'col-der'},avisoError,
h('div',{class: 'herr-campos'},inHex.nodo),h('div',{class: 'herr-campos col-trio'},inR.nodo,inG.nodo,inB.nodo),h('div',{class: 'herr-campos col-trio'},inH.nodo,inS.nodo,inL.nodo))));
raiz.appendChild(res);
raiz.appendChild(h('div',{class: 'col-imagen'},h('div',{class: 'campo'},h('label',{for: 'c-imagen',texto: 'Sacar un color de una imagen'}),archivo),lienzo));
actualizar();
}
});
})();

(function(){
'use strict';
TH.alCargar(function(raiz){
var ACEPTAR = '.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/avif';
var SNIPPET = '<link rel="icon" href="/favicon.ico" sizes="48x48">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">';
TH.proceso(raiz,{
archivos:{aceptar: ACEPTAR,aceptarTexto: 'JPG, PNG, WebP, GIF, BMP, SVG o AVIF',multiple: false,texto: 'Arrastra aquí el logotipo o la imagen de tu web (mejor si es cuadrada y de 512 × 512 píxeles o más).'},
textoBoton: 'Crear los iconos',
info: function(lista){
return TH.script('lib/imagenes.js').then(function(){
return TH.imagen.abrir(lista[0]).then(function(im){
var t = 'Tamaño de la imagen: ' + im.ancho + ' × ' + im.alto + ' px.' +(Math.min(im.ancho,im.alto)< 512 ? ' Por debajo de 512 px, los iconos grandes saldrán con menos nitidez.' : '')+(Math.abs(im.ancho - im.alto)> 1 ? ' No es cuadrada: elige abajo cómo ajustarla.' : '');
im.liberar();return t;
},function(){return '';});
});
},
opciones:[
{tipo: 'select',id: 'ajuste',etiqueta: 'Si la imagen no es cuadrada',valor: 'contener',opciones:[['contener','Mostrarla entera (quedan bordes vacíos)'],['cubrir','Recortar al centro para llenar el cuadrado']]},
{tipo: 'select',id: 'fondo',etiqueta: 'Fondo',valor: 'transparente',opciones:[['transparente','Transparente'],['#ffffff','Blanco'],['#000000','Negro']]}
],
ejecutar: function(lista,op,a){
return TH.script('lib/imagenes.js').then(function(){
var I = TH.imagen,fondo = op.fondo === 'transparente' ? null : op.fondo;
return I.abrir(lista[0]).then(function(im){
function cuadrado(S,f){
var k = op.ajuste === 'cubrir' ? Math.max(S / im.ancho,S / im.alto): Math.min(S / im.ancho,S / im.alto);
var t = I.escalar(im,Math.max(1,Math.round(im.ancho * k)),Math.max(1,Math.round(im.alto * k))),c = I.lienzo(S,S),g = c.getContext('2d');
if(f){g.fillStyle = f;g.fillRect(0,0,S,S);}
g.drawImage(t,Math.round((S - t.width)/ 2),Math.round((S - t.height)/ 2));
return c;
}
var medidas =[16,32,48,180,192,512],png ={},i = 0;
function siguiente(){
if(i >= medidas.length)return Promise.resolve();
var S = medidas[i++];
a.progreso(i / medidas.length * 90,'Creando el icono de ' + S + ' × ' + S);
return I.exportar(cuadrado(S,S === 180 ?(fondo || '#ffffff'): fondo),'png').then(function(b){png[S]= b;return siguiente();});
}
return siguiente().then(function(){
im.liberar();
return Promise.all([16,32,48].map(function(S){return png[S].arrayBuffer().then(function(b){return{ancho: S,alto: S,datos: new Uint8Array(b)};});}));
}).then(function(entradas){
a.entregar([
{nombre: 'favicon.ico',blob: I.ico(entradas),nota: 'contiene 16, 32 y 48 px'},
{nombre: 'favicon-16x16.png',blob: png[16]},{nombre: 'favicon-32x32.png',blob: png[32]},
{nombre: 'apple-touch-icon.png',blob: png[180],nota: '180 × 180 px, sin transparencia'},
{nombre: 'android-chrome-192x192.png',blob: png[192]},{nombre: 'android-chrome-512x512.png',blob: png[512]}
]);
var caja = TH.h('div',{class: 'herr-codigo'},
TH.h('p',{class: 'herr-chico',texto: 'Pega esto dentro de la etiqueta <head> de tu página y sube los archivos a la raíz de tu web:'}),
TH.h('pre',{id: 'favicon-html',texto: SNIPPET}),
TH.h('div',{class: 'herr-acciones'},TH.h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){TH.copiar(SNIPPET,a.estado);}},'Copiar el código')));
a.salida.appendChild(caja);
return 'Listo: favicon.ico y cinco imágenes PNG.' +(op.fondo === 'transparente' ? ' El icono de Apple lleva fondo blanco porque iOS no admite transparencia.' : '');
});
});
});
}
});
});
})();

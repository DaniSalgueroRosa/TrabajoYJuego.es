(function(){
'use strict';
TH.alCargar(function(raiz){
function info(lista){
return TH.script('lib/imagenes.js').then(function(){
return TH.imagen.abrir(lista[0]).then(function(im){
var t = lista.length === 1 ? 'Tamaño actual: ' + im.ancho + ' × ' + im.alto + ' px.' : lista.length + ' imágenes elegidas. La primera mide ' + im.ancho + ' × ' + im.alto + ' px.';
im.liberar();return t;
},function(){return '';});
});
}
TH.proceso(raiz,{
archivos:{aceptar: '.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/avif',aceptarTexto: 'JPG, PNG, WebP, GIF, BMP, SVG o AVIF',multiple: true,texto: 'Arrastra aquí tus imágenes o elígelas desde tu dispositivo.'},
textoBoton: 'Cambiar el tamaño',
info: info,
opciones:[
{tipo: 'select',id: 'modo',etiqueta: 'Cómo quieres cambiar el tamaño',valor: 'ancho',opciones:[['ancho','Por ancho (el alto se ajusta solo)'],['alto','Por alto (el ancho se ajusta solo)'],['porcentaje','Por porcentaje'],['caber','Que quepa en un recuadro, sin deformar'],['exacto','Medidas exactas (puede deformar)']]},
{tipo: 'numero',id: 'ancho',etiqueta: 'Ancho (píxeles)',valor: 800,entero: true,mostrarSi: function(v){return v.modo === 'ancho' || v.modo === 'caber' || v.modo === 'exacto';}},
{tipo: 'numero',id: 'alto',etiqueta: 'Alto (píxeles)',valor: 600,entero: true,mostrarSi: function(v){return v.modo === 'alto' || v.modo === 'caber' || v.modo === 'exacto';}},
{tipo: 'numero',id: 'porcentaje',etiqueta: 'Porcentaje del tamaño original',valor: 50,mostrarSi: function(v){return v.modo === 'porcentaje';}},
{tipo: 'select',id: 'formato',etiqueta: 'Formato de salida',valor: 'igual',opciones:[['igual','El mismo que el original'],['png','PNG'],['jpg','JPG'],['webp','WebP']]},
{tipo: 'numero',id: 'calidad',etiqueta: 'Calidad en JPG y WebP (1 a 100)',valor: 90,entero: true}
],
ejecutar: function(lista,op,a){
return TH.script('lib/imagenes.js').then(function(){
var I = TH.imagen,q = I.calidad(op.calidad,90),usados ={},ampliadas = 0;
function pedir(v,que){if(!(v >= 1))throw new Error('Escribe ' + que + ' en píxeles, un número entero como 800.');return Math.round(v);}
var kAncho = op.modo === 'ancho' || op.modo === 'caber' || op.modo === 'exacto' ? pedir(op.ancho,'el ancho'): 0;
var kAlto = op.modo === 'alto' || op.modo === 'caber' || op.modo === 'exacto' ? pedir(op.alto,'el alto'): 0;
if(op.modo === 'porcentaje' && !(op.porcentaje > 0))throw new Error('Escribe un porcentaje mayor que 0, por ejemplo 50.');
return I.lote(lista,a,function(archivo){
var orig = I.formatoDe(archivo),fmt = op.formato === 'igual' ?(orig === 'jpg' || orig === 'webp' || orig === 'bmp' ? orig : 'png'): op.formato;
return I.abrir(archivo).then(function(im){
var w,hh;
if(op.modo === 'ancho'){w = kAncho;hh = im.alto * w / im.ancho;}
else if(op.modo === 'alto'){hh = kAlto;w = im.ancho * hh / im.alto;}
else if(op.modo === 'porcentaje'){w = im.ancho * op.porcentaje / 100;hh = im.alto * op.porcentaje / 100;}
else if(op.modo === 'caber'){var k = Math.min(kAncho / im.ancho,kAlto / im.alto);w = im.ancho * k;hh = im.alto * k;}
else{w = kAncho;hh = kAlto;}
w = Math.max(1,Math.round(w));hh = Math.max(1,Math.round(hh));
if(w > im.ancho || hh > im.alto)ampliadas++;
var c = I.escalar(im,w,hh,fmt === 'jpg' || fmt === 'bmp' ? '#ffffff' : null);
im.liberar();
return I.exportar(c,fmt,q).then(function(blob){
return{nombre: I.unico(I.nombreSalida(archivo.name,w + 'x' + hh,I.formatos[fmt].ext),usados),blob: blob,nota: I.resumen(w,hh)};
});
});
}).then(function(r){
if(!r.ok.length)throw new Error(r.fallos[0].mensaje);
a.entregar(r.ok);
var t = 'Listo: ' + TH.pl(r.ok.length,'imagen redimensionada','imágenes redimensionadas')+ '.';
if(ampliadas)t += ' ' + TH.pl(ampliadas,'imagen se ha ampliado','imágenes se han ampliado')+ ' y perderá nitidez.';
t += I.avisoFallos(r.fallos);
return{msg: t,tipo: r.fallos.length || ampliadas ? 'aviso' : 'ok'};
});
});
}
});
});
})();

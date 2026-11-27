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
textoBoton: 'Convertir',
info: info,
opciones:[
{tipo: 'select',id: 'formato',etiqueta: 'Convertir a',valor: 'png',opciones:[['png','PNG (sin pérdida, admite transparencia)'],['jpg','JPG (ligero, sin transparencia)'],['webp','WebP (muy ligero, admite transparencia)'],['bmp','BMP (sin compresión)']]},
{tipo: 'numero',id: 'calidad',etiqueta: 'Calidad (de 1 a 100)',valor: 90,entero: true,ayuda: 'A más calidad, más peso. Con 90 casi no se nota la diferencia.',mostrarSi: function(v){return v.formato === 'jpg' || v.formato === 'webp';}},
{tipo: 'select',id: 'fondo',etiqueta: 'Fondo para las zonas transparentes',valor: '#ffffff',opciones:[['#ffffff','Blanco'],['#000000','Negro']],mostrarSi: function(v){return v.formato === 'jpg' || v.formato === 'bmp';}}
],
ejecutar: function(lista,op,a){
return TH.script('lib/imagenes.js').then(function(){
var I = TH.imagen,fmt = op.formato,f = I.formatos[fmt],q = I.calidad(op.calidad,90),usados ={},rellenadas = 0;
return I.lote(lista,a,function(archivo){
return I.abrir(archivo).then(function(im){
var c = I.escalar(im,im.ancho,im.alto);
im.liberar();
if((fmt === 'jpg' || fmt === 'bmp')&& I.tieneTransparencia(c)){c = I.aplanar(c,op.fondo);rellenadas++;}
return I.exportar(c,fmt,q).then(function(blob){
var mismo = I.formatoDe(archivo)=== fmt;
return{nombre: I.unico(I.nombreSalida(archivo.name,mismo ? 'convertida' : '',f.ext),usados),blob: blob,nota: I.resumen(c.width,c.height)};
});
});
}).then(function(r){
if(!r.ok.length)throw new Error(r.fallos[0].mensaje);
a.entregar(r.ok);
var t = 'Listo: ' + TH.pl(r.ok.length,'imagen convertida','imágenes convertidas')+ ' a ' + f.nombre + '.';
if(rellenadas)t += ' ' + TH.pl(rellenadas,'imagen tenía','imágenes tenían')+ ' transparencia y se ha rellenado con fondo ' +(op.fondo === '#000000' ? 'negro' : 'blanco')+ '.';
t += I.avisoFallos(r.fallos);
return{msg: t,tipo: r.fallos.length ? 'aviso' : 'ok'};
});
});
}
});
});
})();

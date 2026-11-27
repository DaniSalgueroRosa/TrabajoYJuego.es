(function(){
'use strict';
TH.alCargar(function(raiz){
TH.proceso(raiz,{
archivos:{aceptar: '.pdf,application/pdf',aceptarTexto: 'PDF',texto: 'Arrastra aquí tu PDF o elígelo desde tu dispositivo.'},
info: function(l){return TH.leer(l[0],'bytes').then(function(b){return TH.abrirPdf(l[0],b);}).then(function(d){return '«' + l[0].name + '» tiene ' + TH.pl(d.getPageCount(),'página','páginas')+ '.';});},
textoBoton: 'Convertir en imágenes',
opciones:[
{tipo: 'select',id: 'formato',etiqueta: 'Formato',valor: 'jpg',opciones:[['jpg','JPG (menos peso)'],['png','PNG (sin pérdida)']]},
{tipo: 'select',id: 'escala',etiqueta: 'Calidad',valor: '2',opciones:[['1','Pantalla (72 ppp)'],['2','Buena (144 ppp)'],['3','Alta (216 ppp)']]},
{tipo: 'texto',id: 'paginas',etiqueta: 'Páginas (vacío = todas)',ph: 'Ej.: 1-3, 5',ancho: 'completo'}
],
ejecutar: function(lista,op,a){
var f = lista[0],base = TH.nombreBase(f.name),jpg = op.formato === 'jpg';
return TH.leer(f,'bytes').then(function(buf){return TH.abrirPdfjs(f,buf);}).then(function(doc){
var paginas = String(op.paginas || '').trim()? TH.rangos(op.paginas,doc.numPages): Array.apply(null,Array(doc.numPages)).map(function(_,i){return i + 1;});
if(paginas.length > 120)throw new Error('Son demasiadas páginas de golpe (' + paginas.length + '). Convierte como máximo 120 cada vez.');
var salida =[];
function una(i){
if(i >= paginas.length)return null;
a.progreso(i / paginas.length * 100,'Convirtiendo la página ' + paginas[i]);
return TH.pdfPagina(doc,paginas[i],parseFloat(op.escala),jpg ? '#ffffff' : null).then(function(r){
return TH.lienzoABlob(r.lienzo,jpg ? 'image/jpeg' : 'image/png',0.92);
}).then(function(b){salida.push({nombre: base + '-pagina-' + paginas[i]+(jpg ? '.jpg' : '.png'),blob: b});}).then(function(){return una(i + 1);});
}
return Promise.resolve(una(0)).then(function(){a.entregar(salida);return 'Listo: ' + TH.pl(salida.length,'imagen','imágenes')+ ' ' +(jpg ? 'JPG' : 'PNG')+ '.';});
});
}
});
});
})();

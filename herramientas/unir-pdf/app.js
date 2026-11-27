(function(){
'use strict';
TH.alCargar(function(raiz){
TH.proceso(raiz,{
archivos:{aceptar: '.pdf,application/pdf',aceptarTexto: 'PDF',multiple: true,texto: 'Arrastra aquí tus PDF o elígelos desde tu dispositivo.'},
minimo: 2,
textoBoton: 'Unir los PDF',
ejecutar: function(lista,op,a){
return TH.pdfLib().then(function(P){
return P.PDFDocument.create().then(function(salida){
var total = 0;
function uno(i){
if(i >= lista.length)return null;
a.progreso(i / lista.length * 90,'Añadiendo ' + lista[i].name);
return TH.leer(lista[i],'bytes').then(function(b){return TH.abrirPdf(lista[i],b);}).then(function(d){
return salida.copyPages(d,d.getPageIndices()).then(function(pgs){pgs.forEach(function(p){salida.addPage(p);});total += pgs.length;});
}).then(function(){return uno(i + 1);});
}
return Promise.resolve(uno(0)).then(function(){return TH.bytesPdf(salida);}).then(function(blob){
a.entregar([{nombre: 'pdf-unido.pdf',blob: blob}]);
return 'Listo: ' + TH.pl(lista.length,'archivo unido','archivos unidos')+ ' en un PDF de ' + TH.pl(total,'página','páginas')+ '.';
});
});
});
}
});
});
})();

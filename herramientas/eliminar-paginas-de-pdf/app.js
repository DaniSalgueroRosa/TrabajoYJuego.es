(function(){
'use strict';
TH.alCargar(function(raiz){
TH.proceso(raiz,{
archivos:{aceptar: '.pdf,application/pdf',aceptarTexto: 'PDF',texto: 'Arrastra aquí tu PDF o elígelo desde tu dispositivo.'},
info: function(l){return TH.leer(l[0],'bytes').then(function(b){return TH.abrirPdf(l[0],b);}).then(function(d){return '«' + l[0].name + '» tiene ' + TH.pl(d.getPageCount(),'página','páginas')+ '.';});},
textoBoton: 'Eliminar las páginas',
opciones:[{tipo: 'texto',id: 'paginas',etiqueta: 'Páginas que se eliminan',ph: 'Ej.: 1, 4-6',ayuda: 'Separa con comas las páginas sueltas y los rangos.',ancho: 'completo'}],
ejecutar: function(lista,op,a){
var f = lista[0];
return TH.leer(f,'bytes').then(function(b){return TH.abrirPdf(f,b);}).then(function(d){
var n = d.getPageCount(),quitar ={};
TH.rangos(op.paginas,n).forEach(function(i){quitar[i]= true;});
var cuantas = Object.keys(quitar).length;
if(cuantas >= n)throw new Error('Con esas páginas no quedaría ninguna. Deja al menos una.');
Object.keys(quitar).map(Number).sort(function(x,y){return y - x;}).forEach(function(i){d.removePage(i - 1);});
return TH.bytesPdf(d).then(function(blob){
a.entregar([{nombre: TH.nombreBase(f.name)+ '-sin-paginas.pdf',blob: blob}]);
return 'Listo: se ' +(cuantas === 1 ? 'ha eliminado 1 página' : 'han eliminado ' + cuantas + ' páginas')+ ' y el PDF queda con ' + TH.pl(n - cuantas,'página','páginas')+ '.';
});
});
}
});
});
})();

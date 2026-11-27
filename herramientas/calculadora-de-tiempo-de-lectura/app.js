(function(){
'use strict';
TH.alCargar(function(raiz){
function dur(s){
s = Math.round(s);
if(s < 60)return s + ' s';
var h = Math.floor(s / 3600),m = Math.floor((s % 3600)/ 60),r = s % 60;
return(h ? h + ' h ' : '')+(m || h ? m + ' min' : '')+(r ? ' ' + r + ' s' : '');
}
TH.texto(raiz,{
entrada:{etiqueta: 'Pega aquí tu texto (o deja vacío e indica solo las palabras)',ph: 'Pega aquí tu artículo, tu discurso o tu trabajo…',ejemplo: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor.'},
salida:{etiqueta: 'Resumen'},
filas: 7,
opciones:[
{id: 'ritmo',tipo: 'select',etiqueta: 'Velocidad de lectura en silencio',valor: '200',opciones:[['150','Lenta: 150 palabras por minuto'],['200','Media: 200 palabras por minuto'],['250','Ágil: 250 palabras por minuto'],['350','Muy rápida: 350 palabras por minuto']]},
{id: 'voz',tipo: 'select',etiqueta: 'Velocidad al hablar',valor: '130',opciones:[['100','Pausada: 100 palabras por minuto'],['130','Normal: 130 palabras por minuto'],['160','Rápida: 160 palabras por minuto']]},
{id: 'palabras',etiqueta: 'O indica solo el número de palabras',entero: true,ph: '1.000',ayuda: 'Se usa solo si no has escrito ningún texto.'}
],
procesar: function(t,op){
var n =(t.match(TH.RE_PALABRA)||[]).length,de = 'texto';
if(n === 0 && op.palabras > 0){n = op.palabras;de = 'número de palabras indicado';}
if(n === 0)return{salida: '',filas:[]};
var lee = n / +op.ritmo * 60,habla = n / +op.voz * 60;
return{salida: TH.fmt(n,0)+ ' palabras: se leen en silencio en ' + dur(lee)+ ' y se dicen en voz alta en ' + dur(habla)+ '.',
filas:[TH.fila('palabras','Palabras',n,'n0'),TH.fila('lectura','Lectura en silencio',Math.round(lee),dur),TH.fila('voz','Lectura en voz alta',Math.round(habla),dur),TH.fila('paginas','Páginas de unos 500 palabras',n / 500,'n1')]};
}
});
});
})();

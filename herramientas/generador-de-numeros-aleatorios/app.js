(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/azar.js').then(function(){
var A = TH.azar,cg = raiz.querySelector('#herr-carga');
if(cg)cg.remove();
var forzar = true,clave = '',lote =[];
function aviso(t){return{salida: '',avisos:[t]};}
function texto(s,d){
var neg = s < 0,a = String(Math.abs(s));
if(d > 0){while(a.length <= d)a = '0' + a;a = a.slice(0,-d)+ ',' + a.slice(-d);}
return(neg ? '-' : '')+ a;
}
TH.texto(raiz,{
sinEntrada: true,
salida:{etiqueta: 'Números generados'},
filas: 8,
descargar:{nombre: 'numeros.txt',mime: 'text/plain;charset=utf-8'},
botones:[{texto: 'Generar de nuevo',accion: function(api){forzar = true;api.actualizar();}}],
opciones:[
{id: 'minimo',etiqueta: 'Desde (mínimo)',valor: 1},
{id: 'maximo',etiqueta: 'Hasta (máximo, incluido)',valor: 100},
{id: 'cantidad',etiqueta: 'Cuántos números',valor: 1,entero: true,ayuda: 'De 1 a 10.000.'},
{id: 'decimales',etiqueta: 'Decimales',valor: 0,entero: true,ayuda: 'De 0 a 6. Con 0 salen enteros.'},
{id: 'distintos',tipo: 'check',etiqueta: 'Sin repetir ningún número',valor: false},
{id: 'orden',tipo: 'select',etiqueta: 'Orden',valor: 'azar',opciones:[['azar','El orden en que salen'],['asc','De menor a mayor'],['desc','De mayor a menor']]},
{id: 'formato',tipo: 'select',etiqueta: 'Presentación',valor: 'lineas',opciones:[['lineas','Uno por línea'],['linea','En una sola línea, separados por punto y coma']]}
],
procesar: function(t,op){
var n = op.cantidad,d = op.decimales,f,lo,hi,i;
if(!(n >= 1 && n <= 10000)|| n !== Math.floor(n))return aviso('Indica cuántos números quieres con un entero de 1 a 10.000.');
if(!(d >= 0 && d <= 6)|| d !== Math.floor(d))return aviso('Los decimales deben ser un número entero de 0 a 6.');
if(!isFinite(op.minimo)|| !isFinite(op.maximo))return aviso('Escribe un número en el mínimo y en el máximo.');
f = Math.pow(10,d);lo = Math.round(op.minimo * f);hi = Math.round(op.maximo * f);
if(Math.abs(lo - op.minimo * f)> 1e-6 || Math.abs(hi - op.maximo * f)> 1e-6)return aviso(d === 0 ? 'Con 0 decimales el mínimo y el máximo deben ser enteros. Sube los decimales si quieres usar valores como 0,5.' : 'El mínimo y el máximo admiten como mucho ' + d +(d === 1 ? ' decimal' : ' decimales')+ '.');
if(Math.abs(lo)> 9007199254740991 || Math.abs(hi)> 9007199254740991)return aviso('Los números son demasiado grandes. Usa valores de hasta 9.007.199.254.740.991 (menos si añades decimales).');
if(lo > hi)return aviso('El mínimo no puede ser mayor que el máximo.');
var rango = hi - lo + 1;
if(op.distintos && n > rango)return aviso('Pides ' + TH.fmt(n,0)+ ' números distintos, pero entre ' + texto(lo,d)+ ' y ' + texto(hi,d)+ ' solo hay ' + TH.fmt(rango,0)+ ' posibles.');
var k =[op.minimo,op.maximo,n,d,op.distintos].join('|');
if(forzar || k !== clave){
lote =[];
if(op.distintos && rango <= 200000){var todos =[];for(i = lo;i <= hi;i++)todos.push(i);lote = A.muestra(todos,n);}
else if(op.distintos){var vistos ={};while(lote.length < n){var v = A.entre(lo,hi);if(!vistos[v]){vistos[v]= true;lote.push(v);}}}
else for(i = 0;i < n;i++)lote.push(A.entre(lo,hi));
clave = k;forzar = false;
}
var lista = lote.slice();
if(op.orden === 'asc')lista.sort(function(a,b){return a - b;});else if(op.orden === 'desc')lista.sort(function(a,b){return b - a;});
var total = BigInt(0);
lista.forEach(function(v){total += BigInt(String(v));});
var media = Number(total)/ n / f;
return{salida: lista.map(function(v){return texto(v,d);}).join(op.formato === 'linea' ? '; ' : '\n'),filas:[
TH.fila('cantidad','Números generados',n,'n0'),TH.fila('menor','El menor',lista.reduce(function(a,b){return Math.min(a,b);})/ f,function(x){return TH.fmt(x,[d,d]);}),
TH.fila('mayor','El mayor',lista.reduce(function(a,b){return Math.max(a,b);})/ f,function(x){return TH.fmt(x,[d,d]);}),
TH.fila('suma','Suma',Number(total)/ f,function(x){return TH.fmt(x,[d,d]);}),TH.fila('media','Media',media,function(x){return TH.fmt(x,[d,Math.max(d,2)]);})]};
}
});
},function(){TH.vaciar(raiz).appendChild(TH.h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));});
});
})();

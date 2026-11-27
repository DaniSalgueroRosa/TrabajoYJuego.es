(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/azar.js').then(function(){
var A = TH.azar,cg = raiz.querySelector('#herr-carga');
if(cg)cg.remove();
var MIN = 'abcdefghijklmnopqrstuvwxyz',MAY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',NUM = '0123456789',SIM = '!@#$%&*()-_=+[]{}.,;:?',AMB = 'Il1O0o';
function nivel(b){return b < 28 ? 'Muy débil' : b < 40 ? 'Débil' : b < 60 ? 'Aceptable' : b < 80 ? 'Fuerte' : 'Muy fuerte';}
function sin(s,ex){return s.split('').filter(function(c){return ex.indexOf(c)< 0;}).join('');}
function aviso(t){return{salida: '',avisos:[t]};}
TH.texto(raiz,{
sinEntrada: true,
salida:{etiqueta: 'Contraseñas generadas'},
filas: 6,
botones:[{texto: 'Generar otra',accion: function(api){api.actualizar();}}],
opciones:[
{id: 'longitud',etiqueta: 'Longitud',valor: 16,entero: true,ayuda: 'De 4 a 128 caracteres.'},
{id: 'cantidad',etiqueta: 'Cuántas',valor: 1,entero: true,ayuda: 'De 1 a 50.'},
{id: 'minusculas',tipo: 'check',etiqueta: 'Minúsculas (a-z)',valor: true},
{id: 'mayusculas',tipo: 'check',etiqueta: 'Mayúsculas (A-Z)',valor: true},
{id: 'numeros',tipo: 'check',etiqueta: 'Números (0-9)',valor: true},
{id: 'simbolos',tipo: 'check',etiqueta: 'Símbolos (!@#$%&*…)',valor: true},
{id: 'ambiguos',tipo: 'check',etiqueta: 'Evitar caracteres que se confunden (I, l, 1, O, 0, o)',valor: false},
{id: 'todos',tipo: 'check',etiqueta: 'Incluir al menos un carácter de cada tipo marcado',valor: true}
],
procesar: function(t,op){
var L = op.longitud,n = op.cantidad,tipos =[],i,j;
if(!(L >= 4 && L <= 128)|| L !== Math.floor(L))return aviso('La longitud debe ser un número entero de 4 a 128.');
if(!(n >= 1 && n <= 50)|| n !== Math.floor(n))return aviso('Indica cuántas contraseñas quieres con un número entero de 1 a 50.');
[['minusculas',MIN],['mayusculas',MAY],['numeros',NUM],['simbolos',SIM]].forEach(function(p){
if(!op[p[0]])return;
var s = op.ambiguos ? sin(p[1],AMB): p[1];
if(s)tipos.push(s);
});
if(!tipos.length)return aviso('Marca al menos un tipo de carácter para poder generar la contraseña.');
var todo = tipos.join(''),lista =[],posiciones =[];
for(i = 0;i < L;i++)posiciones.push(i);
for(i = 0;i < n;i++){
var c = new Array(L),fijas = op.todos ? A.muestra(posiciones,tipos.length):[];
for(j = 0;j < L;j++)c[j]= todo.charAt(A.entero(todo.length));
fijas.forEach(function(p,k){c[p]= tipos[k].charAt(A.entero(tipos[k].length));});
lista.push(c.join(''));
}
var bits = L * Math.log(todo.length)/ Math.LN2;
return{salida: lista.join('\n'),filas:[
TH.fila('longitud','Longitud',L,'n0'),TH.fila('conjunto','Caracteres posibles en cada posición',todo.length,'n0'),
TH.fila('entropia','Entropía aproximada',bits,function(x){return TH.fmt(x,1)+ ' bits';}),TH.fila('nivel','Fortaleza',nivel(bits),'txt')]};
}
});
},function(){TH.vaciar(raiz).appendChild(TH.h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));});
});
})();

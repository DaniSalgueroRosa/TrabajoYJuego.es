(function(){
'use strict';
TH.alCargar(function(raiz){
var ALF = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function B(n){return BigInt(String(n));}
function aNumero(txt,base){
var s = txt.replace(/[\s_ ]/g,''),neg = false,c,i,n,d,b = B(base);
if(s.charAt(0)=== '-' || s.charAt(0)=== '+'){neg = s.charAt(0)=== '-';s = s.slice(1);}
var pref ={2: /^0b/i,8: /^0o/i,16: /^0x/i}[base];
if(pref && pref.test(s))s = s.slice(2);
if(!s)return{error: 'Escribe las cifras del número después del signo o del prefijo.'};
if(s.length > 1000)return{error: 'El número tiene más de 1000 cifras. Es demasiado largo para convertirlo aquí.'};
n = B(0);
for(i = 0;i < s.length;i++){
c = s.charAt(i).toUpperCase();d = ALF.indexOf(c);
if(d < 0 || d >= base)return{error: 'El carácter «' + s.charAt(i)+ '» no es válido en base ' + base + ': solo se admiten ' +(base <= 10 ? 'las cifras de 0 a ' +(base - 1): base === 11 ? 'las cifras de 0 a 9 y la letra A' : 'las cifras de 0 a 9 y las letras de A a ' + ALF.charAt(base - 1))+ '.'};
n = n * b + B(d);
}
return{n: neg ? -n : n};
}
function agrupar(s,k){
var sg = s.charAt(0)=== '-' ? '-' : '',p =[];
s = s.replace('-','');
while(s.length){p.unshift(s.slice(-k));s = s.slice(0,-k);}
return sg + p.join(' ');
}
TH.calculadora(raiz,{
campos:[
{id: 'valor',tipo: 'texto',etiqueta: 'Número que quieres convertir',ph: 'Por ejemplo 255, FF o 1010 1010',ancho: 'completo'},
{id: 'de',tipo: 'select',etiqueta: 'Está escrito en',valor: '10',opciones:[['2','Binario (base 2)'],['8','Octal (base 8)'],['10','Decimal (base 10)'],['16','Hexadecimal (base 16)'],['otra','Otra base…']]},
{id: 'base',etiqueta: 'Esa otra base',ph: '36',entero: true,ayuda: 'De 2 a 36.',mostrarSi: function(v){return v.de === 'otra';}},
{id: 'destino',etiqueta: 'Mostrar también en la base (opcional)',ph: '3',entero: true,ayuda: 'De 2 a 36.'},
{id: 'agrupar',tipo: 'check',etiqueta: 'Separar las cifras en grupos para leerlas mejor',valor: false}
],
ejemplo:{valor: '255',de: '10'},
vacio: 'Escribe un número y verás aquí su valor en binario, octal, decimal y hexadecimal.',
calcular: function(v){
if(typeof BigInt !== 'function')return{error: 'Tu navegador es demasiado antiguo para convertir números grandes. Actualízalo e inténtalo de nuevo.'};
if(!v.valor.trim())return{vacio: true};
var base = v.de === 'otra' ? v.base : +v.de;
if(v.de === 'otra' && !(base >= 2 && base <= 36 && base === Math.floor(base)))return{error: 'La base de origen debe ser un número entero de 2 a 36.'};
var dest = v.destino;
if(!isNaN(dest)&& !(dest >= 2 && dest <= 36 && dest === Math.floor(dest)))return{error: 'La base en la que quieres verlo debe ser un número entero de 2 a 36.'};
var r = aNumero(v.valor,base);
if(r.error)return{error: r.error};
var n = r.n,f = function(b,k){var s = n.toString(b).toUpperCase();return v.agrupar ? agrupar(s,k): s;};
var filas =[TH.fila('bin','Binario (base 2)',f(2,4),'txt'),TH.fila('oct','Octal (base 8)',f(8,3),'txt'),TH.fila('dec','Decimal (base 10)',f(10,3),'txt'),TH.fila('hex','Hexadecimal (base 16)',f(16,4),'txt')];
if(!isNaN(dest))filas.push(TH.fila('otra','Base ' + dest,f(dest,4),'txt'));
var abs = n < B(0)? -n : n;
filas.push(TH.fila('bits','Bits que ocupa',abs.toString(2).length,'n0'));
return{filas: filas,sinDestacar: true,notas: n < B(0)?['Los negativos se muestran con el signo menos delante, no en complemento a dos.']:[]};
}
});
});
})();

(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h;
function bloque(id,titulo,cfg){
var caja = h('section',{class: 'herr-bloque','aria-labelledby': id},h('h3',{id: id,class: 'herr-bloque-titulo',texto: titulo}));
var dentro = h('div',{});caja.appendChild(dentro);raiz.appendChild(caja);TH.calculadora(dentro,cfg);
}
TH.vaciar(raiz);
bloque('pr-1','Potencia: base elevada a un exponente',{
campos:[{id: 'base',etiqueta: 'Base',ph: '2'},{id: 'exp',etiqueta: 'Exponente',ph: '10'}],
calcular: function(v){
if(!TH.listos(v,['base','exp']))return{vacio: true};
if(v.base === 0 && v.exp < 0)return{error: 'Cero elevado a un exponente negativo no está definido.'};
var r = Math.pow(v.base,v.exp);
if(isNaN(r))return{error: 'Una base negativa con exponente decimal no tiene resultado real.'};
if(!isFinite(r))return{error: 'El resultado es demasiado grande para mostrarlo.'};
return{filas:[TH.fila('potencia',TH.fmt(v.base,[0,8])+ ' elevado a ' + TH.fmt(v.exp,[0,8]),r,'auto'),TH.fila('cuadrado','Cuadrado de la base',v.base * v.base,'auto'),TH.fila('cubo','Cubo de la base',Math.pow(v.base,3),'auto')]};
}
});
bloque('pr-2','Raíz de cualquier índice',{
campos:[{id: 'radicando',etiqueta: 'Radicando',ph: '81'},{id: 'indice',etiqueta: 'Índice de la raíz',ph: '2',valor: '2'}],
calcular: function(v){
if(!TH.listos(v,['radicando','indice']))return{vacio: true};
if(v.indice === 0)return{error: 'El índice de la raíz no puede ser 0.'};
var impar = v.indice === Math.floor(v.indice)&& Math.abs(v.indice)% 2 === 1;
if(v.radicando < 0 && !impar)return{error: 'No existe la raíz real de un número negativo con índice par o decimal.'};
var r = v.radicando < 0 ? -Math.pow(-v.radicando,1 / v.indice): Math.pow(v.radicando,1 / v.indice);
var filas =[TH.fila('raiz','Raíz de índice ' + TH.fmt(v.indice,[0,8]),r,'auto')];
if(r === Math.round(r)&& v.radicando === Math.round(v.radicando))filas.push(TH.fila('exacta','¿Es exacta?','Sí, es un número entero','txt'));
return{filas: filas};
}
});
});
})();

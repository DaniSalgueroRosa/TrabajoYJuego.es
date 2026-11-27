(function(){
'use strict';
TH.alCargar(function(raiz){
TH.calculadora(raiz,{
campos:[
{id: 'total',etiqueta: 'Horas o sesiones del curso (o del módulo)',ph: '96'},
{id: 'faltas',etiqueta: 'Horas o sesiones que has faltado',ph: '12'},
{id: 'minimo',etiqueta: 'Asistencia mínima exigida',unidad: '%',ph: '80',valor: '80',ayuda: 'En muchos centros es el 80 %, pero depende de tu norma de asistencia.'},
{id: 'dadas',etiqueta: 'Horas ya impartidas hasta hoy (opcional)',ph: '60',ayuda: 'Si la rellenas, calculamos la asistencia que llevas hasta hoy.'}
],
ejemplo:{total: '96',faltas: '12',minimo: '80',dadas: '60'},
vacio: 'Escribe el total de horas, tus faltas y la asistencia mínima.',
calcular: function(v){
if(!TH.listos(v,['total','faltas','minimo']))return{vacio: true};
if(v.total <= 0)return{error: 'El total de horas debe ser mayor que cero.'};
if(v.faltas < 0 || v.minimo < 0 || v.minimo > 100)return{error: 'Revisa los datos: las faltas no pueden ser negativas y el mínimo va de 0 a 100 %.'};
if(v.faltas > v.total)return{error: 'Tienes más faltas que horas en total. Revisa los datos.'};
var maxFaltas = Math.floor(v.total *(100 - v.minimo)/ 100 + 1e-9),quedan = maxFaltas - v.faltas;
var asist =(v.total - v.faltas)/ v.total * 100;
var estado = quedan < 0 ? 'Has superado el límite de faltas' : quedan === 0 ? 'Estás justo en el límite' : 'Dentro del límite';
var f =[TH.fila('asistencia','Asistencia sobre el total del curso',asist,'pct'),TH.fila('max','Máximo de faltas permitido',maxFaltas,'n0'),TH.fila('quedan',quedan >= 0 ? 'Faltas que te quedan' : 'Faltas de más',Math.abs(quedan),'n0'),TH.fila('estado','Situación',estado,'txt')];
if(!isNaN(v.dadas)){
if(v.dadas <= 0 || v.dadas > v.total || v.faltas > v.dadas)return{error: 'Las horas impartidas deben estar entre 1 y el total, y no pueden ser menos que tus faltas.'};
f.push(TH.fila('hoy','Asistencia hasta hoy',(v.dadas - v.faltas)/ v.dadas * 100,'pct'));
}
return{filas: f,notas:['Los límites se calculan sobre el total del curso. Pregunta a tu centro si las faltas justificadas cuentan o no.']};
}
});
});
})();

(function(){
'use strict';
TH.alCargar(function(raiz){
function diasMes(y,m){return new Date(Date.UTC(y,m + 1,0)).getUTCDate();}
function sumarMeses(d,k){var t = d.getUTCFullYear()* 12 + d.getUTCMonth()+ k,y = Math.floor(t / 12),m = t - y * 12;return new Date(Date.UTC(y,m,Math.min(d.getUTCDate(),diasMes(y,m)),12));}
function diferencia(a,b){
var n =(b.getUTCFullYear()- a.getUTCFullYear())* 12 + b.getUTCMonth()- a.getUTCMonth();
if(sumarMeses(a,n)> b)n--;
return{anios: Math.floor(n / 12),meses: n % 12,dias: TH.dias(sumarMeses(a,n),b),mesesTotal: n};
}
function textoYMD(r){
var p =[];
if(r.anios)p.push(TH.pl(r.anios,'año','años'));if(r.meses)p.push(TH.pl(r.meses,'mes','meses'));if(r.dias || !p.length)p.push(TH.pl(r.dias,'día','días'));
return p.length === 1 ? p[0]: p.slice(0,-1).join(', ')+ ' y ' + p[p.length - 1];
}
TH.calculadora(raiz,{
campos:[
{id: 'nacimiento',tipo: 'fecha',etiqueta: 'Fecha de nacimiento'},
{id: 'referencia',tipo: 'fecha',etiqueta: 'Calcular la edad a fecha de',valor: 'hoy'}
],
ejemplo:{nacimiento: '1990-05-15'},
vacio: 'Elige tu fecha de nacimiento y verás tu edad exacta al instante.',
calcular: function(v){
if(!v.nacimiento || !v.referencia)return{vacio: true};
var a = TH.fechaUTC(v.nacimiento),b = TH.fechaUTC(v.referencia);
if(!a || !b)return{error: 'Escribe fechas válidas.'};
if(a > b)return{error: 'La fecha de nacimiento es posterior a la fecha de cálculo. Revisa las fechas.'};
var r = diferencia(a,b),total = TH.dias(a,b),k = r.anios,prox = sumarMeses(a,12 * k);
if(prox < b)prox = sumarMeses(a,12 *(k + 1));
var hasta = TH.dias(b,prox);
return{filas:[TH.fila('edad','Edad exacta',textoYMD(r),'txt'),TH.fila('anios','Años cumplidos',r.anios,'n0'),TH.fila('meses-total','Meses completos',r.mesesTotal,'n0'),TH.fila('semanas-total','Semanas completas',Math.floor(total / 7),'n0'),TH.fila('dias-total','Días vividos',total,'n0'),
TH.fila('proximo',hasta === 0 ? 'Próximo cumpleaños' : 'Días para tu próximo cumpleaños',hasta,function(n){return n === 0 ? '¡Es hoy!' : TH.pl(n,'día','días');}),TH.fila('proximo-fecha','Cae en',TH.fechaLarga(prox),'txt'),TH.fila('nacimiento-dia','Naciste un',TH.DIAS[a.getUTCDay()],'txt')],
notas:['Quien nace un 29 de febrero cumple años el 28 de febrero en los años que no son bisiestos. Las fechas se tratan como días completos, sin horas ni husos horarios.']};
}
});
});
})();

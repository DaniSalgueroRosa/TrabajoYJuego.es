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
{id: 'inicio',tipo: 'fecha',etiqueta: 'Fecha de inicio',valor: 'hoy'},
{id: 'fin',tipo: 'fecha',etiqueta: 'Fecha de fin'},
{id: 'incluir',tipo: 'check',etiqueta: 'Contar también el día final',valor: false}
],
ejemplo:{inicio: '2026-01-01',fin: '2026-12-31'},
vacio: 'Elige las dos fechas y verás cuántos días hay entre ellas.',
calcular: function(v){
if(!v.inicio || !v.fin)return{vacio: true};
var a = TH.fechaUTC(v.inicio),b = TH.fechaUTC(v.fin),avisos =[];
if(!a || !b)return{error: 'Escribe fechas válidas.'};
if(a > b){var t = a;a = b;b = t;avisos.push('La fecha de inicio es posterior a la de fin, así que se han intercambiado para calcular la diferencia.');}
var dias = TH.dias(a,b)+(v.incluir ? 1 : 0),r = diferencia(a,b),semanas = Math.floor(dias / 7);
return{filas:[TH.fila('dias',v.incluir ? 'Días (con el día final)' : 'Días de diferencia',dias,'n0'),TH.fila('semanas','Semanas completas y días',semanas,function(n){return TH.pl(n,'semana','semanas')+ ' y ' + TH.pl(dias - n * 7,'día','días');}),
TH.fila('ymd','En años, meses y días',textoYMD(r),'txt'),TH.fila('meses','Meses completos',r.mesesTotal,'n0'),TH.fila('horas','Horas',dias * 24,'n0'),
TH.fila('desde','Fecha de inicio',TH.fechaLarga(a),'txt'),TH.fila('hasta','Fecha de fin',TH.fechaLarga(b),'txt')],avisos: avisos,
notas:['La diferencia en años, meses y días se calcula de fecha a fecha, sin contar el día final. Los días son días naturales: si necesitas descontar fines de semana y festivos, usa la calculadora de días laborables.']};
}
});
});
})();

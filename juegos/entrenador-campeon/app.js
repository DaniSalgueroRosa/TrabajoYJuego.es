(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('ec');
if(!raiz)return;
var banco =[],mazo =[],entrenadores =[],clubes =[],OTROS =['Atlético de Madrid','Tottenham Hotspur','Bayer Leverkusen','Valencia CF','Arsenal','Monaco'];
function robar(){if(!mazo.length)mazo = U.barajar(banco);return mazo.pop();}
function unicos(l){return l.filter(function(x,i){return l.indexOf(x)=== i;});}
function cuatro(correcta,candidatos){
var res =[correcta];
U.barajar(candidatos).forEach(function(c){if(res.length < 4 && res.indexOf(c)< 0)res.push(c);});
return U.barajar(res);
}
function ficha(q){return q.e + ' entrenaba al ' + q.c + ' cuando ganó la Liga de Campeones ' + q.t + '.';}
function arrancar(){
TYJ.datos('entrenador-campeon/campeones.json').then(function(json){
banco = json.campeones;
entrenadores = unicos(banco.map(function(x){return x.e;}));
clubes = unicos(banco.map(function(x){return x.c;}).concat(OTROS.map(function(c){return c === 'Monaco' ? 'AS Mónaco' : c;})));
TYJ.Rondas(raiz,{
titulo: 'Entrenador campeón',
intro: 'Diez preguntas sobre los campeones de la Liga de Campeones desde 1992-93: quién entrenaba al equipo que levantó la copa y qué club ganó con cada técnico. Cuatro respuestas y 20 segundos.',
rondas: 10,segundos: 20,ruta: true,
niveles:[[0,'Delegado'],[600,'Segundo entrenador'],[900,'Míster'],[1200,'Estratega'],[1450,'Leyenda del banquillo']],
siguiente: function(){
var q = robar(),r = Math.random(),op;
if(r < 0.55){
op = cuatro(q.e,entrenadores.filter(function(e){return e !== q.e;}));
return{enunciado: '¿Quién entrenaba al ' + q.c + ' cuando ganó la Liga de Campeones ' + q.t + '?',opciones: op,correcta: op.indexOf(q.e),explicacion: ficha(q),etiqueta: 'Campeón ' + q.t};
}
if(r < 0.85){
op = cuatro(q.c,clubes.filter(function(c){return c !== q.c;}));
return{enunciado: '¿Qué club ganó la Liga de Campeones ' + q.t + ' dirigido por ' + q.e + '?',opciones: op,correcta: op.indexOf(q.c),explicacion: ficha(q),etiqueta: 'Campeón ' + q.t};
}
op = cuatro(q.c,clubes.filter(function(c){return c !== q.c;}));
return{enunciado: '¿Qué club ganó la Liga de Campeones ' + q.t + '?',opciones: op,correcta: op.indexOf(q.c),explicacion: ficha(q),etiqueta: 'Campeón ' + q.t};
},
compartir: function(est,nivel){return 'Entrenador campeón · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

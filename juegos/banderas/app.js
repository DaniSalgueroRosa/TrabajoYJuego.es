(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('bd');
if(!raiz)return;
var NS = 'http://www.w3.org/2000/svg';
var banderas =[],mazo =[],dif = 0;
function el(padre,nombre,atr){
var e = document.createElementNS(NS,nombre);
Object.keys(atr).forEach(function(k){if(atr[k]!= null)e.setAttribute(k,atr[k]);});
padre.appendChild(e);
return e;
}
function estrella(cx,cy,R){
var pts =[];
for(var i = 0;i < 10;i++){
var a =(-90 + i * 36)* Math.PI / 180,r = i % 2 ? R * 0.382 : R;
pts.push((cx + r * Math.cos(a)).toFixed(2)+ ',' +(cy + r * Math.sin(a)).toFixed(2));
}
return pts.join(' ');
}
function dibujar(b){
var s = document.createElementNS(NS,'svg');
s.setAttribute('viewBox','0 0 ' + b.v[0]+ ' ' + b.v[1]);
s.setAttribute('role','img');s.setAttribute('aria-label','Bandera: ' + b.d);
s.setAttribute('focusable','false');
b.f.forEach(function(f){
switch(f[0]){
case 'r': el(s,'rect',{x: f[1],y: f[2],width: f[3],height: f[4],fill: f[5],'shape-rendering': 'crispEdges'});break;
case 'c': el(s,'circle',{cx: f[1],cy: f[2],r: f[3],fill: f[4]});break;
case 'o': el(s,'circle',{cx: f[1],cy: f[2],r: f[3],fill: 'none',stroke: f[5],'stroke-width': f[4]});break;
case 'p': el(s,'polygon',{points: f[1],fill: f[2]});break;
case 's': el(s,'polygon',{points: estrella(f[1],f[2],f[3]),fill: f[4]});break;
case 'd': el(s,'path',{d: f[1],fill: f[2]|| 'none',stroke: f[3]|| 'none','stroke-width': f[4]});break;
}
});
return h('div',{class: 'bd-bandera'},s);
}
function robar(){
if(!mazo.length)mazo = U.barajar(U.porNivel(banderas,dif));
return mazo.pop();
}
function arrancar(){
TYJ.datos('banderas/banderas.json').then(function(json){
banderas = json.banderas;
TYJ.Rondas(raiz,{
titulo: 'Adivina la bandera',
intro: 'Te enseñamos diez banderas, una a una. Elige a qué país pertenece entre cuatro opciones; tienes 15 segundos para cada una.',
rondas: 10,segundos: 15,ruta: true,
dificultad: true,alIniciar: function(est){dif = est.dif;mazo =[];},
niveles:[[0,'Turista'],[600,'Viajero'],[900,'Mochilero'],[1200,'Explorador'],[1500,'Cartógrafo'],[1750,'Embajador']],
siguiente: function(){
var b = robar(),opciones = U.barajar([b].concat(U.muestra(banderas.filter(function(x){return x.n !== b.n;}),3)));
return{enunciado: '¿De qué país es esta bandera?',cuerpo: dibujar(b),opciones: opciones.map(function(x){return x.n;}),correcta: opciones.indexOf(b),
explicacion: 'La bandera de ' + b.n + ': ' + b.d + '.',etiqueta: 'Bandera de ' + b.n};
},
compartir: function(est,nivel){return 'Adivina la bandera · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();

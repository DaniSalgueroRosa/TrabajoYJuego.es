(function(){
'use strict';
var host = TT.app();
if(!host)return;
var SERIES =[['Rojo',4],['Verde',125],['Azul',225]],MAX_RONDAS = 16,REVERSIONES = 4;
var serie = 0,estado = 'espera',delta = 20,racha = 0,dir = 0,reversos =[],rondas = 0,mejorOk = null,umbrales =[],total = 0,aciertos = 0,panel = null;
var datos = TT.datos([['s','Serie','1 de 3'],['r','Ronda','0'],['a','Aciertos','0']]);
var mensaje = TT.h('p',{class: 'sc-mensaje'});
var cuadros = TT.h('div',{class: 'sc-cuadros',role: 'group','aria-label': 'Cuatro cuadros de color: uno es un poco más intenso que los otros'});
var inicio = TT.boton('Empezar',function(){empezar();});
var zona = TT.h('div',{class: 'tt-zona sc-zona'},mensaje,inicio,cuadros);
function ronda(){
rondas++;
var h = SERIES[serie][1],raro = TT.azar(0,3),base = 30;
TT.vaciar(cuadros);
for(var i = 0;i < 4;i++){
var s = i === raro ? Math.min(95,base + delta): base;
var b = TT.h('button',{type: 'button',class: 'sc-cuadro','aria-label': 'Cuadro ' +(i + 1)+ ' de 4',style: 'background:hsl(' + h + ' ' + s.toFixed(2)+ '% 50%)'});
if(i === raro)b.setAttribute('data-distinto','1');
cuadros.appendChild(b);
}
datos.poner('r',String(rondas));
}
function empezar(){
estado = 'jugando';serie = 0;umbrales =[];total = 0;aciertos = 0;
inicio.style.display = 'none';cuadros.style.display = '';
mensaje.textContent = 'Pulsa el cuadro que tenga el color más intenso (más «vivo»).';
nuevaSerie();
TT.anunciar('Empieza la serie 1 de 3.');
}
function nuevaSerie(){
delta = 20;racha = 0;dir = 0;reversos =[];rondas = 0;mejorOk = null;
datos.poner('s',(serie + 1)+ ' de 3');datos.poner('r','0');
ronda();
}
function cerrarSerie(){
var u = reversos.length ? TT.media(reversos.slice(-REVERSIONES)):(mejorOk != null ? mejorOk : delta);
umbrales.push(u);
serie++;
if(serie >= SERIES.length){terminar();return;}
mensaje.textContent = 'Serie ' +(serie + 1)+ ' de 3. Pulsa el cuadro más intenso.';
TT.anunciar('Serie ' +(serie + 1)+ ' de 3.');
nuevaSerie();
}
cuadros.addEventListener('click',function(e){
var b = e.target.closest ? e.target.closest('.sc-cuadro'): null;
if(!b || estado !== 'jugando')return;
total++;
var bien = b.getAttribute('data-distinto')=== '1',nuevaDir = 0;
if(bien){
aciertos++;datos.poner('a',String(aciertos));racha++;
if(mejorOk == null || delta < mejorOk)mejorOk = delta;
if(racha >= 2){racha = 0;nuevaDir = -1;delta = Math.max(0.4,delta * 0.75);}
}else{racha = 0;nuevaDir = 1;delta = Math.min(35,delta * 1.3);}
if(nuevaDir !== 0){if(dir !== 0 && nuevaDir !== dir)reversos.push(nuevaDir < 0 ? delta / 0.75 : delta / 1.3);dir = nuevaDir;}
if(reversos.length >= REVERSIONES || rondas >= MAX_RONDAS){cerrarSerie();return;}
ronda();
});
function terminar(){
estado = 'fin';cuadros.style.display = 'none';mensaje.textContent = '¡Hecho!';
var media = TT.media(umbrales),rango = TT.rangoMax(media,[
[2.5,'Muy fina','Detectas diferencias de saturación de muy pocos puntos.'],
[5,'Fina','Notas diferencias pequeñas con facilidad.'],
[9,'Normal','Una sensibilidad habitual para una pantalla de uso diario.'],
[15,'Moderada','Necesitas diferencias algo mayores. La pantalla y la luz de la sala influyen mucho.'],
[Infinity,'Con margen','Las diferencias tienen que ser grandes. Repite con la pantalla bien ajustada y sin reflejos.']]);
var nombres = SERIES.map(function(s){return s[0];});
var detalles = SERIES.map(function(s,i){return[s[0],TT.fmt(umbrales[i],1)+ ' puntos de saturación'];});
detalles.push(['Aciertos',aciertos + ' de ' + total + ' rondas']);
window.setTimeout(function(){
if(estado !== 'fin')return;
panel = TT.resultado(host,{titulo: 'Tu sensibilidad a los colores',valor: TT.fmt(media,1),unidad: 'puntos de saturación (menos es mejor)',rango: rango,
extra: TT.barras(umbrales.map(function(u){return Math.round(u * 10)/ 10;}),{formato: function(x){return TT.fmt(x,1);},etiquetas: nombres,descripcion: 'Diferencia mínima detectada en rojo, verde y azul',pie:['Rojo','Azul']}),
detalles: detalles,copia: 'Mi sensibilidad a los colores: ' + TT.fmt(media,1)+ ' puntos de saturación de media (rojo ' + TT.fmt(umbrales[0],1)+ ', verde ' + TT.fmt(umbrales[1],1)+ ', azul ' + TT.fmt(umbrales[2],1)+ ').',alRepetir: reiniciar});
TT.anunciar('Resultado: ' + TT.fmt(media,1)+ ' puntos de saturación de media.');
TT.enfocar(panel);
},400);
}
function reiniciar(){
estado = 'espera';
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;
datos.poner('s','1 de 3');datos.poner('r','0');datos.poner('a','0');
cuadros.style.display = 'none';inicio.style.display = '';
mensaje.textContent = 'Verás cuatro cuadros y uno tiene el color un poco más intenso. Pulsa ese. Son tres series (rojo, verde y azul) y la diferencia se ajusta a tus aciertos.';
}
host.appendChild(TT.h('p',{class: 'tt-aviso',texto: 'Usa la pantalla con el brillo normal, sin filtro de luz azul ni reflejos. Es un pasatiempo: no sirve para diagnosticar nada.'}));
host.appendChild(datos.nodo);
host.appendChild(zona);
reiniciar();
})();

(function(){
'use strict';
var host = TT.app();
if(!host)return;
var COL =[['rojo','#FF6B6B'],['verde','#3DDC84'],['azul','#5AA9FF'],['amarillo','#FFD23F']];
var NOMBRES =['Cálculo rápido','Colores y palabras','Tabla de números'];
var DESC =[
'Resuelve 10 operaciones de cabeza, sumas, restas y alguna multiplicación. Escribe el resultado y pulsa Intro. Cuentan las que aciertes y el tiempo que tardes.',
'Verás nombres de colores escritos con tinta de otro color. Pulsa el botón con el nombre del color de la TINTA, no el de la palabra. Son 12.',
'Hay 16 números mezclados. Púlsalos en orden, del 1 al 16, lo más rápido que puedas. Los fallos restan puntos.'];
var tarea = -1,res =[],t0 = 0,reloj = 0,panel = null,estado = 'espera';
var datos = TT.datos([['t','Tarea','—'],['p','Progreso','—'],['s','Tiempo','0,0 s']]);
var mensaje = TT.h('p',{class: 'ec-mensaje',role: 'status'});
var sala = TT.h('div',{class: 'ec-sala'});
var zona = TT.h('div',{class: 'tt-zona ec-zona'},mensaje,sala);
function parar(){window.clearInterval(reloj);reloj = 0;}
function cronometro(){t0 = performance.now();parar();reloj = window.setInterval(function(){datos.poner('s',TT.fmt((performance.now()- t0)/ 1000,1)+ ' s');},200);}
function seg(){return(performance.now()- t0)/ 1000;}
function limitar(x){return Math.max(0,Math.min(100,x));}
function presentar(i){
tarea = i;estado = 'info';parar();
TT.vaciar(sala);
datos.poner('t',(i + 1)+ ' de 3');datos.poner('p','—');datos.poner('s','0,0 s');
mensaje.textContent = 'Tarea ' +(i + 1)+ ' de 3: ' + NOMBRES[i];
sala.appendChild(TT.h('p',{class: 'ec-texto',texto: DESC[i]}));
var b = TT.boton('Empezar la tarea',function(){[calculo,stroop,schulte][i]();});
sala.appendChild(b);b.focus({preventScroll: true});
}
function terminarTarea(r){
parar();res[tarea]= r;
if(tarea >= 2)terminar();else presentar(tarea + 1);
}
function calculo(){
estado = 'juego';var n = 10,k = 0,ok = 0,q;
TT.vaciar(sala);mensaje.textContent = 'Cálculo rápido';
var texto = TT.h('p',{class: 'ec-grande'}),campo = TT.h('input',{type: 'text',inputmode: 'numeric',autocomplete: 'off',class: 'tt-campo ec-campo','aria-label': 'Resultado'});
var enviar = TT.boton('Responder',function(){resp();});
sala.appendChild(texto);sala.appendChild(TT.h('div',{class: 'tt-fila tt-fila--centro'},campo,enviar));
function nueva(){
var r = Math.random(),a,b,op;
if(r < 0.4){op = '+';a = TT.azar(12,79);b = TT.azar(8,59);q ={t: a + ' + ' + b,r: a + b};}
else if(r < 0.8){op = '−';a = TT.azar(30,99);b = TT.azar(8,a - 5);q ={t: a + ' − ' + b,r: a - b};}
else{a = TT.azar(3,9);b = TT.azar(3,12);q ={t: a + ' × ' + b,r: a * b};}
texto.textContent = q.t + ' = ?';texto.setAttribute('data-respuesta',String(q.r));
campo.value = '';datos.poner('p',(k + 1)+ '/' + n);campo.focus({preventScroll: true});
}
function resp(){
var v = campo.value.trim();
if(!/^-?\d+$/.test(v)){mensaje.textContent = 'Escribe solo cifras.';campo.focus();return;}
mensaje.textContent = 'Cálculo rápido';
if(parseInt(v,10)=== q.r)ok++;
k++;
if(k >= n){terminarTarea({ok: ok,n: n,t: seg(),err: 0});return;}
nueva();
}
campo.addEventListener('keydown',function(e){if(e.key === 'Enter'){e.preventDefault();resp();}});
cronometro();nueva();
}
function stroop(){
estado = 'juego';var n = 12,k = 0,ok = 0,tinta;
TT.vaciar(sala);mensaje.textContent = 'Pulsa el nombre del color de la tinta';
var palabra = TT.h('p',{class: 'ec-palabra','aria-label': 'Palabra de color'});
var fila = TT.h('div',{class: 'tt-fila tt-fila--centro'});
COL.forEach(function(c){fila.appendChild(TT.boton(TT.mayus(c[0]),function(){resp(c[0]);},true));});
sala.appendChild(TT.h('div',{class: 'ec-panel'},palabra));sala.appendChild(fila);
function nueva(){
var tin = TT.elegir(COL),pal = Math.random()< 0.8 ? TT.elegir(COL.filter(function(c){return c !== tin;})): tin;
tinta = tin[0];palabra.textContent = pal[0].toUpperCase();palabra.style.color = tin[1];palabra.setAttribute('data-tinta',tinta);
datos.poner('p',(k + 1)+ '/' + n);
}
function resp(nombre){if(nombre === tinta)ok++;k++;if(k >= n){terminarTarea({ok: ok,n: n,t: seg(),err: 0});return;}nueva();}
cronometro();nueva();
}
function schulte(){
estado = 'juego';var sig = 1,errores = 0;
TT.vaciar(sala);mensaje.textContent = 'Busca el 1';
var rejilla = TT.h('div',{class: 'ec-rejilla',role: 'group','aria-label': 'Tabla de números del 1 al 16'});
TT.barajar([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]).forEach(function(v){
var b = TT.h('button',{type: 'button',class: 'ec-num',texto: String(v)});
b.setAttribute('data-n',v);
b.addEventListener('click',function(){
if(v === sig){b.classList.add('ec-hecho');b.disabled = true;sig++;datos.poner('p',Math.min(sig,16)+ '/16');if(sig > 16){terminarTarea({ok: 16,n: 16,t: seg(),err: errores});return;}mensaje.textContent = 'Busca el ' + sig;}
else{errores++;mensaje.textContent = 'Ese no: busca el ' + sig;}
});
rejilla.appendChild(b);
});
sala.appendChild(rejilla);
datos.poner('p','1/16');
cronometro();
}
function terminar(){
estado = 'fin';parar();TT.vaciar(sala);mensaje.textContent = 'Hecho.';
var a = res[0],b = res[1],c = res[2];
var pA = limitar((10 - a.t / a.n)/ 8 * 100)*(a.ok / a.n),pB = limitar((3 - b.t / b.n)/ 2.3 * 100)*(b.ok / b.n),pC = limitar(limitar((70 - c.t)/ 50 * 100)- 3 * c.err);
var media =(pA + pB + pC)/ 3,edad = Math.max(20,Math.min(80,Math.round(20 +(100 - media)* 0.6)));
var rango = TT.rangoMax(edad,[
[25,'Mente de relámpago','Rápido y preciso en las tres tareas.'],
[33,'Mente ágil','Un buen rendimiento en las tres pruebas.'],
[43,'Mente despierta','Buenos resultados, con margen para ir más rápido.'],
[56,'Mente tranquila','Vas con calma. Con unas cuantas partidas, los tiempos bajan.'],
[Infinity,'Mente calentando','Los tiempos de referencia son exigentes: repite cuando estés descansado.']]);
window.setTimeout(function(){
if(estado !== 'fin')return;
panel = TT.resultado(host,{titulo: 'Tu edad cerebral de juego',valor: edad,unidad: 'años (de juego)',rango: rango,
extra: TT.h('div',{},TT.barras([Math.round(pA),Math.round(pB),Math.round(pC)],{max: 100,formato: function(x){return x + ' pts';},etiquetas: NOMBRES,descripcion: 'Puntos de cada tarea sobre cien',pie:['Cálculo','Números']}),
TT.h('p',{class: 'tt-aviso',texto: 'Esto es un juego. La «edad» solo compara tu rapidez en estas tres tareas con unos tiempos que hemos puesto nosotros; no mide inteligencia, ni salud, ni tu edad real.'})),
detalles:[['Cálculo rápido',a.ok + ' de ' + a.n + ' en ' + TT.fmt(a.t,0)+ ' s (' + TT.fmt(pA,0)+ ' pts)'],['Colores y palabras',b.ok + ' de ' + b.n + ' en ' + TT.fmt(b.t,0)+ ' s (' + TT.fmt(pB,0)+ ' pts)'],['Tabla de números',(c.err === 1 ? '1 error' : c.err + ' errores')+ ' en ' + TT.fmt(c.t,0)+ ' s (' + TT.fmt(pC,0)+ ' pts)'],['Media de puntos',TT.fmt(media,0)+ ' de 100']],
copia: 'Mi «edad cerebral» de juego: ' + edad + ' años.',alRepetir: reiniciar});
TT.anunciar('Resultado: edad cerebral de juego, ' + edad + ' años.');
TT.enfocar(panel);
},400);
}
function reiniciar(){
parar();estado = 'espera';tarea = -1;res =[];
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;
TT.vaciar(sala);
datos.poner('t','—');datos.poner('p','—');datos.poner('s','0,0 s');
mensaje.textContent = 'Tres tareas cortas, de un minuto cada una más o menos: cálculo, colores y palabras, y una tabla de números. Al final verás tu «edad cerebral» de juego.';
var b = TT.boton('Empezar',function(){presentar(0);});
sala.appendChild(b);
}
host.appendChild(TT.h('p',{class: 'tt-aviso',texto: 'Es un pasatiempo. No mide la inteligencia ni la salud del cerebro, y la «edad» que sale no es tu edad real.'}));
host.appendChild(datos.nodo);
host.appendChild(zona);
reiniciar();
})();

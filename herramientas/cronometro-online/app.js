(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h,e ={corriendo: false,acum: 0,desde: 0,vueltas:[],marca: 0,reloj: null};
function p2(n){return('0' + n).slice(-2);}
function fmt(ms){
var c = Math.floor(ms / 10)% 100,s = Math.floor(ms / 1000)% 60,m = Math.floor(ms / 60000)% 60,hh = Math.floor(ms / 3600000);
return(hh ? hh + ':' : '')+ p2(m)+ ':' + p2(s)+ ',' + p2(c);
}
function transcurrido(){return e.acum +(e.corriendo ? TH.ahora()- e.desde : 0);}
var tiempo = h('p',{class: 'cr-tiempo',role: 'timer','aria-label': 'Tiempo transcurrido','data-k': 'tiempo','data-v': '0',texto: '00:00,00'});
var inicio = h('button',{class: 'boton',type: 'button',onclick: function(){if(e.corriendo)parar();else empezar();}},'Iniciar');
var vuelta = h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){marcar();}},'Vuelta');
var reiniciar = h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){reinicio();}},'Reiniciar');
var copiar = h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){TH.copiar(listado(),estado);}},'Copiar las vueltas');
var zona = h('div',{class: 'cr-vueltas',hidden: true});
var estado = TH.estado(raiz);
function listado(){
return['Vuelta\tTiempo de vuelta\tTiempo total'].concat(e.vueltas.map(function(v){return v.n + '\t' + fmt(v.vuelta)+ '\t' + fmt(v.total);})).join('\n');
}
function tabla(){
TH.vaciar(zona);
if(!e.vueltas.length){zona.hidden = true;copiar.hidden = true;return;}
zona.hidden = false;copiar.hidden = false;
var mejor = Infinity,peor = -Infinity;
e.vueltas.forEach(function(v){mejor = Math.min(mejor,v.vuelta);peor = Math.max(peor,v.vuelta);});
var comparar = e.vueltas.length > 1 && mejor !== peor;
zona.appendChild(h('div',{class: 'herr-tabla-caja',tabindex: '0',role: 'region','aria-label': 'Vueltas'},h('table',{class: 'herr-tabla'},
h('caption',{texto: 'Vueltas (la más reciente arriba)'}),
h('thead',{},h('tr',{},['Vuelta','Tiempo de vuelta','Tiempo total','Comparación'].map(function(t){return h('th',{scope: 'col',texto: t});}))),
h('tbody',{},e.vueltas.slice().reverse().map(function(v){
return h('tr',{},h('th',{scope: 'row',texto: String(v.n)}),h('td',{'data-k': 'vuelta-' + v.n,'data-v': String(v.vuelta),texto: fmt(v.vuelta)}),
h('td',{'data-k': 'total-' + v.n,'data-v': String(v.total),texto: fmt(v.total)}),h('td',{texto: comparar ?(v.vuelta === mejor ? 'Más rápida' : v.vuelta === peor ? 'Más lenta' : ''): ''}));
})))));
}
function pintar(){
var ms = Math.max(0,Math.floor(transcurrido())),t = fmt(ms);
if(tiempo.getAttribute('data-v')!== String(ms)){tiempo.setAttribute('data-v',String(ms));tiempo.textContent = t;}
var rotulo = e.corriendo ? 'Pausar' :(ms > 0 ? 'Reanudar' : 'Iniciar');
if(inicio.textContent !== rotulo)inicio.textContent = rotulo;
vuelta.disabled = !e.corriendo;
reiniciar.disabled = ms === 0 && !e.vueltas.length;
}
function empezar(){e.corriendo = true;e.desde = TH.ahora();clearInterval(e.reloj);e.reloj = setInterval(pintar,40);pintar();}
function parar(){e.acum = transcurrido();e.corriendo = false;clearInterval(e.reloj);e.reloj = null;pintar();}
function marcar(){
if(!e.corriendo)return;
var total = Math.floor(transcurrido()),v ={n: e.vueltas.length + 1,vuelta: total - e.marca,total: total};
e.marca = total;e.vueltas.push(v);tabla();pintar();
TH.anunciar('Vuelta ' + v.n + ': ' + fmt(v.vuelta));
}
function reinicio(){clearInterval(e.reloj);e.reloj = null;e.corriendo = false;e.acum = 0;e.marca = 0;e.vueltas =[];estado.limpiar();tabla();pintar();}
TH.vaciar(raiz).appendChild(h('div',{class: 'cr'},
h('div',{class: 'cr-reloj'},tiempo,h('div',{class: 'herr-acciones'},inicio,vuelta,reiniciar)),
zona,h('div',{class: 'herr-acciones'},copiar),estado.nodo));
tabla();pintar();
});
})();

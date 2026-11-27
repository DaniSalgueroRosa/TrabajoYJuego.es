(function(){
'use strict';
var TYJ = window.TYJ,C = TYJ.casino,h = TYJ.h;
var raiz = document.getElementById('bj');
if(!raiz || !C)return;
function valorCarta(c){return c.r === 'A' ? 11 :(['10','J','Q','K'].indexOf(c.r)>= 0 ? 10 : parseInt(c.r,10));}
function valor(cartas){
var t = 0,ases = 0;
cartas.forEach(function(c){t += valorCarta(c);if(c.r === 'A')ases++;});
while(t > 21 && ases > 0){t -= 10;ases--;}
return{total: t,blando: ases > 0};
}
function esBlackjack(cartas,dividida){return !dividida && cartas.length === 2 && valor(cartas).total === 21;}
function debeRobar(cartas){return valor(cartas).total < 17;}
function liquidar(cartas,apuesta,dividida,crupier){
var v = valor(cartas).total,vc = valor(crupier).total,cbj = esBlackjack(crupier,false);
if(v > 21)return{res: 'pasa',retorno: 0};
if(esBlackjack(cartas,dividida))return cbj ?{res: 'empate',retorno: apuesta}:{res: 'blackjack',retorno: apuesta * 2.5};
if(cbj)return{res: 'pierde',retorno: 0};
if(vc > 21 || v > vc)return{res: 'gana',retorno: apuesta * 2};
if(v === vc)return{res: 'empate',retorno: apuesta};
return{res: 'pierde',retorno: 0};
}
C.reglas.blackjack ={valorCarta: valorCarta,valor: valor,esBlackjack: esBlackjack,debeRobar: debeRobar,liquidar: liquidar};
var BARAJAS = 6;
var zapato = C.Mazo(BARAJAS),manos =[],crupier = null,activa = 0,fase = 'apuesta',apuesta = 0,ultima = 0,sucia = false,ocupado = false;
var ui ={};
var banca = C.Banca(C.SALDO_INICIAL,function(){refrescar();});
var TEXTO_RES ={blackjack: 'Blackjack',gana: 'Gana',empate: 'Empate',pierde: 'Pierde',pasa: 'Se pasa'};
function mensaje(t,tipo){
ui.msg.textContent = t;
ui.msg.className = 'mensaje bj-msg' +(tipo ? ' mensaje--' + tipo : '');
TYJ.anunciar(t);
}
function nuevaMano(ap,dividida,esCrupier){
var m ={cartas:[],apuesta: ap,dividida: !!dividida,fin: false,ases: false,oculta: false,nodoOculto: null,res: null};
m.dom ={cartas: h('div',{class: 'bj-cartas'}),total: h('span',{class: 'bj-total',hidden: true}),estado: h('span',{class: 'bj-estado',hidden: true}),marca: h('span',{class: 'bj-marca'})};
m.dom.caja = h('div',{class: 'bj-mano'},m.dom.cartas,h('div',{class: 'bj-pie'},m.dom.total,esCrupier ? null : m.dom.marca,m.dom.estado));
return m;
}
function pintarMano(m,esCrupier){
var cartas = m.oculta ? m.cartas.slice(0,1): m.cartas,v = valor(cartas);
m.dom.total.hidden = !cartas.length;
m.dom.total.textContent = v.total +(v.blando && v.total <= 21 && cartas.length > 1 && !m.oculta ? ' blando' : '');
m.dom.total.setAttribute('aria-label',(esCrupier ? 'Crupier: ' : 'Tu mano: ')+ m.dom.total.textContent);
if(!esCrupier){TYJ.vaciar(m.dom.marca);if(m.apuesta)m.dom.marca.appendChild(C.marca(m.apuesta));}
}
function marcarActiva(){manos.forEach(function(m,i){m.dom.caja.classList.toggle('bj-activa',manos.length > 1 && fase === 'juego' && i === activa && !m.fin);});}
async function dar(m,oculta){
var c = zapato.sacar();
m.cartas.push(c);
if(oculta)m.oculta = true;
var nodo = C.carta(c,{oculta: oculta,entra: true});
if(oculta)m.nodoOculto = nodo;
m.dom.cartas.appendChild(nodo);
pintarMano(m,m === crupier);
refrescarZapato();
await C.pausa(380);
return c;
}
async function revelar(){
if(!crupier.oculta)return;
crupier.oculta = false;
var nuevo = C.carta(crupier.cartas[1],{entra: true});
crupier.dom.cartas.replaceChild(nuevo,crupier.nodoOculto);
crupier.nodoOculto = null;
pintarMano(crupier,true);
await C.pausa(520);
}
function limpiarMesa(){
TYJ.vaciar(ui.crupierZona);TYJ.vaciar(ui.manos);
manos =[];crupier = null;sucia = false;activa = 0;
ui.msg.className = 'mensaje bj-msg';
ui.centro.hidden = false;
}
function anadir(v){
if(fase !== 'apuesta' || ocupado)return;
if(sucia)limpiarMesa();
if(!banca.retirar(v)){mensaje('No te quedan fichas para una de ' + v + '.','mal');return;}
apuesta += v;
pintarApuesta();
mensaje('Apuesta: ' + C.fmt(apuesta)+ ' fichas. Pulsa «Repartir».');
}
function quitar(){
if(fase !== 'apuesta' || ocupado || !apuesta)return;
banca.ingresar(apuesta);apuesta = 0;pintarApuesta();
mensaje('Apuesta retirada.');
}
function misma(){
if(fase !== 'apuesta' || ocupado || !ultima)return;
if(sucia)limpiarMesa();
if(apuesta){banca.ingresar(apuesta);apuesta = 0;}
if(!banca.retirar(ultima)){mensaje('No te llegan las fichas para repetir ' + C.fmt(ultima)+ '.','mal');pintarApuesta();return;}
apuesta = ultima;pintarApuesta();
mensaje('Apuesta repetida: ' + C.fmt(apuesta)+ ' fichas. Pulsa «Repartir».');
}
function pintarApuesta(){
TYJ.vaciar(ui.circulo);
ui.circulo.hidden = fase !== 'apuesta';
if(apuesta)ui.circulo.appendChild(C.marca(apuesta));else ui.circulo.appendChild(h('span',{class: 'bj-circulo-t',texto: 'Apuesta'}));
refrescar();
}
async function repartir(){
if(fase !== 'apuesta' || ocupado || apuesta <= 0)return;
ocupado = true;
if(sucia)limpiarMesa();
ultima = apuesta;
if(zapato.quedan()< zapato.total / 4){zapato.barajar();mensaje('Se baraja el zapato.');refrescarZapato();await C.pausa(500);}
var m = nuevaMano(apuesta,false,false);
crupier = nuevaMano(0,false,true);
manos =[m];apuesta = 0;fase = 'reparto';activa = 0;
ui.crupierZona.appendChild(crupier.dom.caja);ui.manos.appendChild(m.dom.caja);
ui.centro.hidden = true;
pintarApuesta();pintarMano(m,false);
mensaje('Repartiendo…');
await dar(m,false);await dar(crupier,false);await dar(m,false);await dar(crupier,true);
var arriba = valorCarta(crupier.cartas[0]);
if(esBlackjack(m.cartas,false)||(arriba >= 10 && esBlackjack(crupier.cartas,false))){await revelar();await cerrar();return;}
fase = 'juego';ocupado = false;marcarActiva();
mensajeTurno();
refrescar();
}
function actual(){return manos[activa];}
function mensajeTurno(){
var v = valor(actual().cartas);
mensaje((manos.length > 1 ? 'Mano ' +(activa + 1)+ ': ' : 'Tu turno: ')+ v.total +(v.blando ? ' blando' : '')+ '. El crupier enseña el ' + C.nombreCarta(crupier.cartas[0])+ '.');
}
function puede(){return fase === 'juego' && !ocupado && actual()&& !actual().fin;}
async function pedir(){
if(!puede())return;
ocupado = true;refrescar();
var m = actual();
await dar(m,false);
if(valor(m.cartas).total >= 21){m.fin = true;await siguiente();}else{ocupado = false;mensajeTurno();refrescar();}
}
async function plantarse(){
if(!puede())return;
ocupado = true;actual().fin = true;refrescar();
await siguiente();
}
async function doblar(){
if(!puede())return;
var m = actual();
if(m.cartas.length !== 2 || !banca.retirar(m.apuesta))return;
ocupado = true;m.apuesta *= 2;pintarMano(m,false);refrescar();
await dar(m,false);
m.fin = true;
await siguiente();
}
async function dividir(){
if(!puede()|| manos.length !== 1)return;
var m = manos[0];
if(m.cartas.length !== 2 || m.cartas[0].r !== m.cartas[1].r || !banca.retirar(m.apuesta))return;
ocupado = true;
var m2 = nuevaMano(m.apuesta,true,false);
m.dividida = true;
m.ases = m2.ases = m.cartas[0].r === 'A';
m2.cartas.push(m.cartas.pop());
m2.dom.cartas.appendChild(m.dom.cartas.lastChild);
manos.push(m2);ui.manos.appendChild(m2.dom.caja);
pintarMano(m,false);pintarMano(m2,false);marcarActiva();refrescar();
await C.pausa(300);
await dar(m,false);
if(m.ases || valor(m.cartas).total >= 21){m.fin = true;await siguiente();}else{ocupado = false;mensajeTurno();refrescar();}
}
async function siguiente(){
if(activa + 1 < manos.length){
activa++;
var n = manos[activa];
marcarActiva();
if(n.cartas.length < 2)await dar(n,false);
if(n.ases || valor(n.cartas).total >= 21){n.fin = true;await siguiente();return;}
ocupado = false;marcarActiva();mensajeTurno();refrescar();
return;
}
await turnoCrupier();
}
async function turnoCrupier(){
fase = 'crupier';ocupado = true;marcarActiva();refrescar();
mensaje('Juega el crupier…');
await revelar();
var vivo = manos.some(function(m){return valor(m.cartas).total <= 21;});
while(vivo && debeRobar(crupier.cartas))await dar(crupier,false);
await cerrar();
}
async function cerrar(){
var neto = 0,total = 0,tipos =[];
manos.forEach(function(m){
var r = liquidar(m.cartas,m.apuesta,m.dividida,crupier.cartas);
m.res = r.res;m.fin = true;
banca.ingresar(r.retorno);
neto += r.retorno - m.apuesta;total += m.apuesta;
m.dom.estado.hidden = false;
m.dom.estado.textContent = TEXTO_RES[r.res];
m.dom.estado.className = 'bj-estado bj-estado--' + r.res;
tipos.push(r.res);
});
var vc = valor(crupier.cartas).total,cbj = esBlackjack(crupier.cartas,false);
var quien = cbj ? 'El crupier tiene blackjack. ' :(vc > 21 ? 'El crupier se pasa con ' + vc + '. ' : 'El crupier se planta con ' + vc + '. ');
var t;
if(manos.length === 1){
var r0 = manos[0].res;
if(r0 === 'blackjack')t = '¡Blackjack! Ganas ' + C.fmt(neto)+ ' fichas.';
else if(r0 === 'gana')t = quien + 'Ganas ' + C.fmt(neto)+ ' fichas.';
else if(r0 === 'empate')t = quien + 'Empate: recuperas tu apuesta.';
else if(r0 === 'pasa')t = 'Te pasas con ' + valor(manos[0].cartas).total + '. Pierdes ' + C.fmt(total)+ ' fichas.';
else t = quien + 'Pierdes ' + C.fmt(total)+ ' fichas.';
}else{
t = quien + tipos.map(function(r,i){return 'Mano ' +(i + 1)+ ': ' + TEXTO_RES[r].toLowerCase();}).join(', ')+ '. ' +
(neto > 0 ? 'Ganas ' + C.fmt(neto)+ ' fichas.' :(neto < 0 ? 'Pierdes ' + C.fmt(-neto)+ ' fichas.' : 'Sales en tablas.'));
}
mensaje(t,neto > 0 ? 'ok' :(neto < 0 ? 'mal' : ''));
if(neto > 0)C.flota(ui.mesa,'+' + C.fmt(neto),'ok');else if(neto < 0)C.flota(ui.mesa,'−' + C.fmt(-neto),'mal');
fase = 'apuesta';sucia = true;ocupado = false;marcarActiva();
pintarApuesta();
}
function refrescarZapato(){if(ui.zapato)ui.zapato.textContent = 'Zapato: ' + zapato.quedan()+ ' cartas';}
function refrescar(){
if(!ui.hud)return;
ui.hud.poner('saldo',C.fmt(banca.saldo),banca.saldo === 0 && !apuesta && fase === 'apuesta');
ui.hud.poner('apuesta',C.fmt(apuesta + manos.reduce(function(t,m){return t +(fase === 'apuesta' && sucia ? 0 : m.apuesta);},0)));
ui.hud.poner('mejor',C.fmt(banca.mejor));
var apostando = fase === 'apuesta',m = actual();
ui.apuestaMandos.hidden = !apostando;
ui.juegoMandos.hidden = apostando;
ui.fichas.permitir(function(v){return apostando && !ocupado && v <= banca.saldo;});
ui.repartir.disabled = !apostando || ocupado || apuesta <= 0;
ui.quitar.disabled = !apostando || ocupado || apuesta <= 0;
ui.misma.disabled = !apostando || ocupado || !ultima ||(!apuesta && ultima > banca.saldo);
var juega = puede();
ui.pedir.disabled = !juega;
ui.plantarse.disabled = !juega;
ui.doblar.disabled = !juega || m.cartas.length !== 2 || banca.saldo < m.apuesta;
ui.dividir.disabled = !juega || manos.length !== 1 || m.cartas.length !== 2 || m.cartas[0].r !== m.cartas[1].r || banca.saldo < m.apuesta;
var sin = apostando && !ocupado && banca.saldo === 0 && !apuesta;
ui.sin.hidden = !sin;
ui.apuestaMandos.hidden = !apostando || sin;
}
function montar(){
TYJ.vaciar(raiz);
ui.hud = TYJ.hud([['saldo','Fichas',C.fmt(C.SALDO_INICIAL)],['apuesta','Apuesta','0'],['mejor','Mejor saldo',C.fmt(C.SALDO_INICIAL)]]);
ui.msg = h('p',{class: 'mensaje bj-msg',texto: 'Toca las fichas para formar tu apuesta y pulsa «Repartir».'});
ui.zapato = h('span',{class: 'texto-suave bj-zapato'});
ui.crupierZona = h('div',{class: 'bj-crupier-zona'});
ui.manos = h('div',{class: 'bj-manos'});
ui.circulo = h('div',{class: 'bj-circulo'});
ui.centro = h('p',{class: 'bj-reglas texto-suave',texto: 'El blackjack paga 3 a 2 · El crupier se planta con 17'});
ui.mesa = h('div',{class: 'cs-mesa bj-mesa'},
h('div',{class: 'bj-zona'},h('div',{class: 'bj-cab'},h('span',{class: 'bj-etiqueta',texto: 'Crupier'}),ui.zapato),ui.crupierZona),
ui.centro,ui.msg,
h('div',{class: 'bj-zona'},h('span',{class: 'bj-etiqueta',texto: 'Tú'}),ui.manos,ui.circulo));
ui.fichas = C.botonesFicha(C.FICHAS,anadir);
ui.repartir = h('button',{type: 'button',class: 'boton-retro',onclick: repartir,texto: 'Repartir'});
ui.quitar = h('button',{type: 'button',class: 'boton-retro boton-retro--sec boton-retro--chico',onclick: quitar,texto: 'Quitar apuesta'});
ui.misma = h('button',{type: 'button',class: 'boton-retro boton-retro--sec boton-retro--chico',onclick: misma,texto: 'Misma apuesta'});
ui.pedir = h('button',{type: 'button',class: 'boton-retro',onclick: pedir,texto: 'Pedir'});
ui.plantarse = h('button',{type: 'button',class: 'boton-retro',onclick: plantarse,texto: 'Plantarse'});
ui.doblar = h('button',{type: 'button',class: 'boton-retro boton-retro--sec',onclick: doblar,texto: 'Doblar'});
ui.dividir = h('button',{type: 'button',class: 'boton-retro boton-retro--sec',onclick: dividir,texto: 'Dividir'});
ui.apuestaMandos = h('div',{class: 'bj-mandos'},ui.fichas.nodo,h('div',{class: 'fila fila--centro'},ui.repartir,ui.quitar,ui.misma));
ui.juegoMandos = h('div',{class: 'bj-mandos'},h('div',{class: 'fila fila--centro'},ui.pedir,ui.plantarse,ui.doblar,ui.dividir));
ui.sin = C.sinFichas(function(){banca.recargar();limpiarMesa();pintarApuesta();mensaje('Tienes ' + C.fmt(banca.saldo)+ ' fichas nuevas.');});
ui.sin.hidden = true;
raiz.appendChild(C.aviso());
raiz.appendChild(ui.hud.nodo);
raiz.appendChild(ui.mesa);
raiz.appendChild(ui.apuestaMandos);
raiz.appendChild(ui.juegoMandos);
raiz.appendChild(ui.sin);
pintarApuesta();
refrescarZapato();
}
C.puerta(raiz,montar);
})();

(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('dh');
if(!raiz)return;
var MANA_MAX = 5,CURA = 10,GUARDIA = 0.3,COSTE ={golpe: 0,guardia: 0,rayo: 3,curar: 2};
var HEROES =[
{id: 'caballera',nombre: 'La caballera',pv: 50,golpe:[6,9],rayo:[12,15],nota: 'Aguanta mucho, rayo flojo'},
{id: 'hechicero',nombre: 'El hechicero',pv: 38,golpe:[4,7],rayo:[17,21],nota: 'Poca vida, rayo devastador'},
{id: 'arquera',nombre: 'La arquera',pv: 44,golpe:[5,8],rayo:[14,18],nota: 'Equilibrada en todo'}
];
var ENEMIGOS =[
{nombre: 'Goblin del barro',pv: 30,golpe:[4,7],rayo:[10,13]},
{nombre: 'Esqueleto guardián',pv: 40,golpe:[5,8],rayo:[12,16]},
{nombre: 'Troll de la ciénaga',pv: 55,golpe:[6,10],rayo:[14,18]}
];
var NOMBRE ={golpe: 'golpe',guardia: 'guardia',rayo: 'rayo',curar: 'curar'};
var RANGOS =[[0,'Aprendiz'],[100,'Soldado'],[200,'Campeón'],[300,'Héroe legendario']];
var sesion = TYJ.Sesion(null,{victorias: true,etiquetaMejor: 'Mejor puntuación: '});
var ui = null,g = null;
function tirar(rango){return rango[0]+ Math.floor(Math.random()*(rango[1]- rango[0]+ 1));}
function inicio(){
g = null;ui = null;
TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: 'Duelo de héroes'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'Elige a tu héroe. Vas a librar tres combates por turnos y el enemigo te avisa de lo que va a hacer.'}));
var lista = h('div',{class: 'dh-heroes',role: 'group','aria-label': 'Elige tu héroe'});
HEROES.forEach(function(x){
lista.appendChild(h('button',{class: 'dh-heroe',type: 'button','data-heroe': x.id,onclick: function(){empezar(x);}},
h('b',{texto: x.nombre}),h('small',{texto: x.pv + ' de vida · golpe ' + x.golpe[0]+ '-' + x.golpe[1]+ ' · rayo ' + x.rayo[0]+ '-' + x.rayo[1]}),h('small',{texto: x.nota})));
});
raiz.appendChild(lista);
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
function empezar(heroe){
g ={heroe: heroe,pv: heroe.pv,mana: 1,combate: 0,turno: 1,victorias: 0,fin: false,espera: false,enemigo: null,registro:[]};
montar();
nuevoCombate();
}
function montar(){
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['combate','Combate','1 / 3'],['turno','Turno',1]]);
ui.nombreH = h('p',{class: 'dh-nombre',texto: g.heroe.nombre});
ui.relH = h('span',{class: 'dh-relleno'});
ui.pvH = h('b',{class: 'dh-pv-heroe'});ui.manaH = h('b',{class: 'dh-mana-heroe'});
ui.nombreE = h('p',{class: 'dh-nombre'});
ui.relE = h('span',{class: 'dh-relleno'});
ui.pvE = h('b',{class: 'dh-pv-enemigo'});ui.manaE = h('b',{class: 'dh-mana-enemigo'});
ui.intencion = h('p',{class: 'dh-intencion'});
var panelH = h('div',{class: 'dh-panel',role: 'group','aria-label': 'Tu héroe'},ui.nombreH,h('div',{class: 'dh-barra','aria-hidden': 'true'},ui.relH),
h('p',{class: 'dh-dato'},'Vida: ',ui.pvH),h('p',{class: 'dh-dato'},'Maná: ',ui.manaH));
var panelE = h('div',{class: 'dh-panel dh-panel--enemigo',role: 'group','aria-label': 'Tu enemigo'},ui.nombreE,h('div',{class: 'dh-barra','aria-hidden': 'true'},ui.relE),
h('p',{class: 'dh-dato'},'Vida: ',ui.pvE),h('p',{class: 'dh-dato'},'Maná: ',ui.manaE),ui.intencion);
ui.botones ={};
ui.acciones = h('div',{class: 'dh-acciones',role: 'group','aria-label': 'Elige tu acción'});
[['golpe','Golpe','gratis'],['guardia','Guardia','+1 maná'],['rayo','Rayo','3 maná'],['curar','Curar','2 maná']].forEach(function(a){
var b = h('button',{class: 'dh-accion',type: 'button','data-accion': a[0],onclick: function(){actuar(a[0]);}},a[1],h('small',{texto: a[2]}));
ui.botones[a[0]]= b;ui.acciones.appendChild(b);
});
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite'});
ui.registro = h('ul',{class: 'dh-registro','aria-label': 'Registro de los últimos turnos'});
ui.zonaSiguiente = h('div',{class: 'fila'});
raiz.appendChild(ui.hud.nodo);
raiz.appendChild(h('div',{class: 'dh-campo'},panelH,panelE));
raiz.appendChild(ui.acciones);raiz.appendChild(ui.msg);raiz.appendChild(ui.zonaSiguiente);raiz.appendChild(ui.registro);
}
function elegirEnemigo(){
var e = g.enemigo,r = Math.random();
if(e.mana >= COSTE.rayo && r < 0.45)return 'rayo';
if(e.pv <= 0.45 * e.pvMax && e.mana >= COSTE.curar && r < 0.7)return 'curar';
return r < 0.75 ? 'golpe' : 'guardia';
}
function nuevoCombate(){
var base = ENEMIGOS[g.combate];
g.enemigo ={nombre: base.nombre,pv: base.pv,pvMax: base.pv,mana: 1,golpe: base.golpe,rayo: base.rayo,intencion: null};
g.mana = 1;g.turno = 1;g.espera = false;
g.enemigo.intencion = elegirEnemigo();
ui.zonaSiguiente && TYJ.vaciar(ui.zonaSiguiente);
ui.msg.textContent = 'Combate ' +(g.combate + 1)+ ' de 3: ' + base.nombre + '. ¡Elige tu acción!';
pintar();
}
function pintar(){
var e = g.enemigo,pct = function(a,b){return Math.max(0,Math.round(100 * a / b))+ '%';};
ui.hud.poner('combate',(g.combate + 1)+ ' / 3');ui.hud.poner('turno',g.turno);
ui.nombreE.textContent = e.nombre;
ui.pvH.textContent = Math.max(0,g.pv)+ ' / ' + g.heroe.pv;ui.relH.style.width = pct(g.pv,g.heroe.pv);
ui.pvE.textContent = Math.max(0,e.pv)+ ' / ' + e.pvMax;ui.relE.style.width = pct(e.pv,e.pvMax);
ui.manaH.textContent = g.mana + ' / ' + MANA_MAX;ui.manaE.textContent = e.mana + ' / ' + MANA_MAX;
ui.intencion.textContent = g.espera || g.fin ? '' : 'Prepara: ' + NOMBRE[e.intencion];
Object.keys(ui.botones).forEach(function(k){ui.botones[k].disabled = g.espera || g.fin || g.mana < COSTE[k]||(k === 'curar' && g.pv >= g.heroe.pv);});
TYJ.vaciar(ui.registro);
g.registro.slice(0,6).forEach(function(t){ui.registro.appendChild(h('li',{texto: t}));});
}
function actuar(accion){
if(!g || g.fin || g.espera || g.mana < COSTE[accion])return;
var e = g.enemigo,ea = e.intencion,lineas =[],danoAlEnemigo = 0,danoAlHeroe = 0;
if(accion === 'golpe' || accion === 'rayo')danoAlEnemigo = tirar(g.heroe[accion]);
if(ea === 'golpe' || ea === 'rayo')danoAlHeroe = tirar(e[ea]);
var cubreE = ea === 'guardia',cubreH = accion === 'guardia';
if(cubreE && danoAlEnemigo)danoAlEnemigo = Math.round(danoAlEnemigo * GUARDIA);
if(cubreH && danoAlHeroe)danoAlHeroe = Math.round(danoAlHeroe * GUARDIA);
g.mana -= COSTE[accion];e.mana -= COSTE[ea];
g.mana = Math.min(MANA_MAX,g.mana + 1 +(cubreH ? 1 : 0));e.mana = Math.min(MANA_MAX,e.mana + 1 +(cubreE ? 1 : 0));
g.pv -= danoAlHeroe;e.pv -= danoAlEnemigo;
if(accion === 'curar')g.pv = Math.min(g.heroe.pv,Math.max(g.pv,0)+ CURA);
if(ea === 'curar')e.pv = Math.min(e.pvMax,Math.max(e.pv,0)+ CURA);
lineas.push(texto(true,accion,danoAlEnemigo,cubreE,e.nombre));
lineas.push(texto(false,ea,danoAlHeroe,cubreH,e.nombre));
g.registro = lineas.concat(g.registro).slice(0,8);
g.turno++;
if(e.pv <= 0){if(g.pv <= 0)g.pv = 1;ganarCombate();return;}
if(g.pv <= 0){perder();return;}
e.intencion = elegirEnemigo();
ui.msg.textContent = lineas.join(' ');
pintar();
}
function texto(tuyo,accion,dano,cubierto,nombreEnemigo){
var quien = tuyo ? 'Tú' : nombreEnemigo;
if(accion === 'guardia')return quien +(tuyo ? ' te cubres' : ' se cubre')+ ' con la guardia.';
if(accion === 'curar')return quien +(tuyo ? ' te curas' : ' se cura')+ ' ' + CURA + ' de vida.';
var que = accion === 'rayo' ? 'un rayo' : 'un golpe';
return quien + ' lanza' +(tuyo ? 's' : '')+ ' ' + que + ': ' + dano + ' de daño' +(cubierto ? ' (reducido por la guardia)' : '')+ '.';
}
function ganarCombate(){
g.victorias++;g.espera = true;
pintar();
if(g.combate >= ENEMIGOS.length - 1){terminar(true);return;}
ui.msg.textContent = '¡Has derrotado a ' + g.enemigo.nombre + '! Recuperas ' + CURA + ' de vida.';
g.pv = Math.min(g.heroe.pv,g.pv + CURA);
ui.pvH.textContent = g.pv + ' / ' + g.heroe.pv;ui.relH.style.width = Math.round(100 * g.pv / g.heroe.pv)+ '%';
TYJ.vaciar(ui.zonaSiguiente);
var b = h('button',{class: 'boton-retro',type: 'button',onclick: function(){g.combate++;nuevoCombate();}},'Siguiente combate');
ui.zonaSiguiente.appendChild(b);b.focus({preventScroll: true});
}
function perder(){g.espera = true;pintar();terminar(false);}
function terminar(victoria){
g.fin = true;
var puntos = g.victorias * 100 +(victoria ? g.pv : 0),nivel = U.nivel(g.victorias * 100,RANGOS);
sesion.registrar(puntos,victoria);
TYJ.final(raiz,{titulo: victoria ? '¡Has vencido a los tres enemigos!' : 'Has caído en combate',puntos: puntos,unidad: 'puntos',nivel: nivel,
detalles:['Combates ganados: ' + g.victorias + ' de 3',victoria ? 'Vida restante: ' + g.pv : 'Caíste ante: ' + g.enemigo.nombre],
compartir: 'Duelo de héroes · ' + puntos + ' puntos, ' + g.victorias + ' combates ganados con ' + g.heroe.nombre.toLowerCase()+ ' (' + nivel + ')',alRepetir: inicio,textoRepetir: 'Elegir héroe otra vez'});
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
inicio();
})();

(function(){
'use strict';
var TYJ = window.TYJ;
if(!TYJ || !TYJ.util)return;
var U = TYJ.util;
var D = TYJ.diccionario = TYJ.diccionario ||{};
var ALFABETO = 'abcdefghijklmnopqrstuvwxyzñ',CODIGO ={},bytes = null,promesa = null,CABECERA = 9;
Array.prototype.forEach.call(ALFABETO,function(l,i){CODIGO[l]= i;});
D.cargar = function(){
if(bytes)return Promise.resolve(D);
if(!promesa){
promesa = fetch(TYJ.url('juegos/datos/diccionario.bin'),{cache: 'no-cache'}).then(function(r){
if(!r.ok)throw new Error('No se pudo leer el diccionario (error ' + r.status + ')');
return r.arrayBuffer();
}).then(function(buf){
var b = new Uint8Array(buf);
if(b.length < CABECERA || b[0]!== 84 || b[1]!== 89 || b[2]!== 74 || b[3]!== 68 || b[4]!== 1)throw new Error('El diccionario no tiene el formato esperado');
bytes = b;return D;
}).catch(function(e){promesa = null;throw e;});
}
return promesa;
};
D.listo = function(){return !!bytes;};
function arista(i){var o = CABECERA + i * 3;return bytes[o]|(bytes[o + 1]<< 8)|(bytes[o + 2]<< 16);}
D.tiene = function(p){
if(!bytes || !p)return false;
var i = 0,v = 0;
for(var k = 0;k < p.length;k++){
var cod = CODIGO[p.charAt(k)];
if(cod === undefined)return false;
for(;;){
v = arista(i);
if((v & 31)=== cod)break;
if(v & 64)return false;
i++;
}
if(k === p.length - 1)return(v & 32)!== 0;
i = v >>> 7;
if(!i)return false;
}
return false;
};
D.anagramas = function(letras){
var salida =[],cuenta ={},total = letras.length;
if(!bytes || !total)return salida;
letras.forEach(function(l){cuenta[l]=(cuenta[l]|| 0)+ 1;});
(function rec(i,prefijo){
for(;;i++){
var v = arista(i),l = ALFABETO.charAt(v & 31);
if(cuenta[l]> 0){
cuenta[l]--;
if(prefijo.length + 1 === total){if(v & 32)salida.push(prefijo + l);}
else if(v >>> 7)rec(v >>> 7,prefijo + l);
cuenta[l]++;
}
if(v & 64)return;
}
})(0,'');
return salida;
};
D.empiezanPor = function(letra,min,max,limite){
var salida =[];
if(!bytes || CODIGO[letra]=== undefined)return salida;
(function rec(i,prefijo){
for(;;i++){
var v = arista(i),l = ALFABETO.charAt(v & 31);
if(!prefijo && l !== letra){if(v & 64)return;continue;}
var p = prefijo + l;
if((v & 32)&& p.length >= min && p.length <= max)salida.push(p);
if(salida.length >= limite)return;
if((v >>> 7)&& p.length < max)rec(v >>> 7,p);
if((v & 64)|| salida.length >= limite)return;
}
})(0,'');
return salida;
};
var REGLAS =[
['ecitos',['o','a','e','']],['ecitas',['o','a','e','']],['ecito',['o','a','e','']],['ecita',['o','a','e','']],
['ecillos',['o','a','e','']],['ecillas',['o','a','e','']],['ecillo',['o','a','e','']],['ecilla',['o','a','e','']],
['cecitos',['z']],['cecitas',['z']],['cecito',['z']],['cecita',['z']],
['citos',['','e','o','a']],['citas',['','e','o','a']],['cito',['','e','o','a']],['cita',['','e','o','a']],
['quitos',['co']],['quitas',['ca']],['quito',['co']],['quita',['ca']],['quillos',['co']],['quillas',['ca']],['quillo',['co']],['quilla',['ca']],
['guitos',['go']],['guitas',['ga']],['guito',['go']],['guita',['ga']],
['itos',['o','']],['itas',['a','']],['ito',['o','']],['ita',['a','']],
['illos',['o','']],['illas',['a','']],['illo',['o','']],['illa',['a','']],
['icos',['o','']],['icas',['a','']],['ico',['o','']],['ica',['a','']],
['uelos',['o','a','e','']],['uelas',['o','a','e','']],['uelo',['o','a','e','']],['uela',['o','a','e','']],
['azos',['o','a','e','']],['azas',['o','a','e','']],['azo',['o','a','e','']],['aza',['o','a','e','']],
['otes',['o','a','e','']],['otas',['o','a','e','']],['ote',['o','a','e','']],['ota',['o','a','e','']],
['uchos',['o','a','e','']],['uchas',['o','a','e','']],['ucho',['o','a','e','']],['ucha',['o','a','e','']],
['ones',['o','a','e']],['onas',['o','a','e']],['ona',['o','a','e']],['on',['o','a','e']],
['isimos',['o','a','e','']],['isimas',['o','a','e','']],['isimo',['o','a','e','']],['isima',['o','a','e','']],
['quisimos',['co']],['quisimas',['ca']],['quisimo',['co']],['quisima',['ca']],['guisimo',['go']],['guisima',['ga']],
['ces',['z']],['es',['','e']],['s',['']]
];
var PREFIJOS =['re','des','in','im','anti','pre','sobre','sub','super','inter','contra','semi','auto','multi','pos','pro','ex','co','mini','maxi','micro','macro','hiper','infra','ultra','extra'];
var CLITICOS =['melos','melas','melo','mela','telos','telas','telo','tela','selos','selas','selo','sela','noslos','noslas','noslo','nosla','oslos','oslas','oslo','osla',
'les','los','las','nos','le','lo','la','me','te','se','os'];
var IMPERATIVOS ={di: 1,haz: 1,pon: 1,ven: 1,sal: 1,ten: 1,ve: 1,da: 1};
function derivada(p){
var n = p.length,i,j,regla,raiz,fin;
for(i = 0;i < REGLAS.length;i++){
regla = REGLAS[i];fin = regla[0];
if(n - fin.length < 2 || p.slice(n - fin.length)!== fin)continue;
raiz = p.slice(0,n - fin.length);
for(j = 0;j < regla[1].length;j++)if(D.tiene(raiz + regla[1][j]))return true;
}
if(n > 8 && p.slice(-5)=== 'mente'){
raiz = p.slice(0,-5);
if(D.tiene(raiz)||(raiz.slice(-1)=== 'a' && D.tiene(raiz.slice(0,-1)+ 'o')))return true;
}
for(i = 0;i < PREFIJOS.length;i++){
if(p.indexOf(PREFIJOS[i])=== 0 && n - PREFIJOS[i].length >= 4 && D.tiene(p.slice(PREFIJOS[i].length)))return true;
}
for(i = 0;i < CLITICOS.length;i++){
fin = CLITICOS[i];
if(n - fin.length < 2 || p.slice(n - fin.length)!== fin)continue;
raiz = p.slice(0,n - fin.length);
if((IMPERATIVOS[raiz]|| /(ar|er|ir|ndo)$/.test(raiz))&&(D.tiene(raiz)|| IMPERATIVOS[raiz]))return true;
}
if(n >= 4 && /[ao]$/.test(p)&& D.tiene(p.slice(0,-1)+(p.slice(-1)=== 'a' ? 'o' : 'a')))return true;
return false;
}
var ONSETS ={bl: 1,br: 1,cl: 1,cr: 1,dr: 1,fl: 1,fr: 1,gl: 1,gr: 1,kl: 1,kr: 1,pl: 1,pr: 1,tr: 1,ch: 1,ll: 1,rr: 1};
var INICIALES ={ps: 1,pn: 1,gn: 1,mn: 1,sp: 1,st: 1,sk: 1,sc: 1,sl: 1,sm: 1,sn: 1,sw: 1,tw: 1,sh: 1,str: 1,spr: 1,scr: 1,spl: 1};
var CODAS = 'nslrmcpbdgtxz',FINALES ={n: 1,s: 1,l: 1,r: 1,d: 1,z: 1,j: 1,x: 1,y: 1,c: 1,m: 1,t: 1,k: 1,p: 1,b: 1,g: 1,f: 1,ns: 1,rs: 1,ps: 1,ts: 1,cs: 1,bs: 1,ms: 1,ls: 1};
var CODAS2 ={ns: 1,bs: 1,rs: 1,ls: 1,ps: 1,ms: 1,cs: 1};
function grupoMedio(g){
var n = g.length;
if(n === 1)return true;
if(n === 2)return !!ONSETS[g]|| g === 'cc' || g === 'nn' ||(CODAS.indexOf(g.charAt(0))>= 0 && 'bcdfghjklmnpqrstvwxyz'.indexOf(g.charAt(1))>= 0 && g.charAt(0)!== g.charAt(1));
if(n === 3)return(CODAS.indexOf(g.charAt(0))>= 0 && !!ONSETS[g.slice(1)]&& g.slice(1)!== 'rr')||(!!CODAS2[g.slice(0,2)]&& 'bcdfgjklmnpqrstvwxyz'.indexOf(g.charAt(2))>= 0);
if(n === 4)return !!CODAS2[g.slice(0,2)]&& !!ONSETS[g.slice(2)]&& g.slice(2)!== 'rr';
return false;
}
function vocalesRaras(s){
var racha = s.match(/[aeiou]{4,}/g)||[];
return racha.some(function(r){return r.length > 4 || !/^(?:[aeo][iu][aeo][iu]|[aeo][iu][iu][aeo])$/.test(r);});
}
function pronunciable(p){
var n = p.length;
if(n < 3 || n > 24 || !/[aeiou]/.test(p))return false;
var s = p.replace(/qu/g,'q').replace(/gu(?=[ei])/g,'g');
if(/(.)\1\1/.test(p)|| /(.{2,3})\1\1/.test(p)|| vocalesRaras(s)|| /([bdfghjkmpqstvwxyzñ])\1/.test(p))return false;
if(/q(?![aeio])/.test(s)|| /ñ[^aeiou]|[^aeiou]ñ/.test(s)|| /[wk]{2}/.test(s))return false;
var trozos = s.split(/[aeiou]+/),ini = trozos[0],fin = trozos[trozos.length - 1],k;
if(ini && !(ini.length === 1 ||(ONSETS[ini]&& ini !== 'rr')|| INICIALES[ini]))return false;
if(fin && !FINALES[fin])return false;
for(k = 1;k < trozos.length - 1;k++)if(!grupoMedio(trozos[k]))return false;
return true;
}
D.pronunciable = pronunciable;
D.clasificar = function(texto){
var p = U.norm(texto).replace(/\s+/g,'');
if(!p || !/^[a-zñ]+$/.test(p))return 'no';
if(D.tiene(p))return 'dic';
if(bytes && derivada(p))return 'deriv';
return pronunciable(p)? 'posible' : 'no';
};
})();

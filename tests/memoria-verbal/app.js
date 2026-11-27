(function(){
'use strict';
var host = TT.app();
if(!host)return;
var LISTA =('casa perro gato mesa silla ventana puerta libro lápiz papel camino montaña río mar playa arena sol luna estrella nube lluvia viento nieve fuego agua tierra árbol hoja flor rosa jardín campo ciudad pueblo calle plaza puente torre castillo iglesia escuela hospital mercado tienda panadería cocina salón cama armario espejo lámpara reloj teléfono ordenador pantalla teclado ratón cable botón llave cuerda cadena martillo clavo tornillo tijeras cuchillo tenedor cuchara plato vaso taza botella jarra sartén olla horno nevera pan queso leche huevo carne pescado arroz pasta sopa ensalada tomate cebolla patata zanahoria manzana naranja limón plátano fresa uva melón sandía cereza pera aceite sal azúcar miel chocolate galleta pastel helado café té vino cerveza zumo camisa pantalón falda vestido abrigo chaqueta bufanda guante sombrero zapato calcetín bolso mochila maleta paraguas gafas anillo collar pulsera moneda billete cartera coche autobús tren avión barco bicicleta moto camión taxi tranvía estación aeropuerto puerto carretera semáforo túnel gasolina motor rueda volante freno pedal mapa brújula hoguera linterna cuaderno bolígrafo goma regla compás pizarra tiza profesor alumno maestro doctor enfermera abogado pintor músico cantante actor bailarín escritor poeta cocinero panadero granjero marinero piloto soldado policía bombero juez rey reina príncipe princesa dragón gigante duende bruja mago fantasma pirata tesoro isla bosque selva desierto volcán cueva valle colina cascada lago laguna océano costa acantilado roca piedra barro hielo trueno rayo niebla tormenta arcoíris primavera verano otoño invierno lunes martes jueves viernes sábado domingo mañana tarde noche madrugada minuto segundo semana mes año siglo historia futuro pasado presente sueño recuerdo idea pensamiento palabra frase letra número cifra suma resta cálculo figura círculo cuadrado triángulo línea punto color rojo verde azul amarillo negro blanco gris marrón morado caballo vaca oveja cerdo gallina pato conejo tigre león elefante jirafa mono oso lobo zorro ciervo águila búho paloma gorrión serpiente lagarto tortuga rana pez ballena delfín tiburón pulpo cangrejo medusa mariposa abeja hormiga araña mosca mosquito gusano caracol').split(/\s+/);
var PALABRAS = LISTA.filter(function(p,i){return p && LISTA.indexOf(p)=== i;});
var estado = 'espera',vistas =[],actual = null,vidas = 3,puntos = 0,nuevasOk = 0,vistasOk = 0,racha = 0,mejorRacha = 0,t0 = 0,tResp =[],tPal = 0,panel = null;
var datos = TT.datos([['p','Puntos','0'],['v','Vidas','3'],['d','Palabras distintas','0']]);
var palabra = TT.h('p',{class: 'mv-palabra','aria-live': 'polite'});
var mensaje = TT.h('p',{class: 'mv-mensaje'});
var bNueva = TT.boton('Nueva (N)',function(){responder(false);});
var bVista = TT.boton('Ya vista (V)',function(){responder(true);});
bNueva.setAttribute('aria-keyshortcuts','N');bVista.setAttribute('aria-keyshortcuts','V');
var botones = TT.h('div',{class: 'tt-fila tt-fila--centro'},bNueva,bVista);
var inicio = TT.boton('Empezar',function(){empezar();});
var zona = TT.h('div',{class: 'tt-zona mv-zona'},mensaje,palabra,botones,inicio);
function siguiente(){
var repetir = vistas.length >= 2 && Math.random()< 0.45,p;
if(repetir || vistas.length >= PALABRAS.length)p = TT.elegir(vistas);
else{do{p = TT.elegir(PALABRAS);}while(vistas.indexOf(p)>= 0);}
actual ={p: p,vista: vistas.indexOf(p)>= 0};
palabra.textContent = p;palabra.setAttribute('data-vista',actual.vista ? '1' : '0');
tPal = performance.now();
}
function empezar(){
estado = 'jugando';vistas =[];vidas = 3;puntos = 0;nuevasOk = 0;vistasOk = 0;racha = 0;mejorRacha = 0;tResp =[];t0 = performance.now();
inicio.style.display = 'none';botones.style.display = '';mensaje.textContent = '¿Has visto ya esta palabra en esta partida?';
marcador();siguiente();
TT.anunciar('Empieza el test. Responde si la palabra es nueva o ya vista.');
}
function marcador(){datos.poner('p',String(puntos));datos.poner('v',String(vidas),vidas === 1);datos.poner('d',String(vistas.length));}
function responder(dicesVista){
if(estado !== 'jugando')return;
tResp.push(performance.now()- tPal);
var bien = dicesVista === actual.vista;
if(bien){puntos++;racha++;if(racha > mejorRacha)mejorRacha = racha;if(actual.vista)vistasOk++;else nuevasOk++;}
else{vidas--;racha = 0;}
if(vistas.indexOf(actual.p)< 0)vistas.push(actual.p);
marcador();
if(vidas <= 0){terminar();return;}
siguiente();
}
document.addEventListener('keydown',function(e){
if(estado !== 'jugando' || e.ctrlKey || e.metaKey || e.altKey || e.repeat)return;
var k = e.key.toLowerCase();
if(k === 'n'){e.preventDefault();responder(false);}
else if(k === 'v'){e.preventDefault();responder(true);}
});
function terminar(){
estado = 'fin';botones.style.display = 'none';palabra.textContent = '';palabra.removeAttribute('data-vista');mensaje.textContent = 'Te has quedado sin vidas.';
var seg =(performance.now()- t0)/ 1000;
var rango = TT.rango(puntos,[
[0,'Despertando','Los primeros intentos suelen ser torpes. Prueba a repetir la palabra en silencio al verla.'],
[10,'Atento','Retienes bien las primeras palabras; el reto es cuando se acumulan.'],
[25,'Buena memoria','Un resultado sólido para una partida normal.'],
[45,'Muy buena memoria','Manejas muchas palabras a la vez sin confundirlas.'],
[70,'Memoria de archivo','Un nivel que pide estrategia: asociar palabras a imágenes ayuda.'],
[100,'Memoria prodigiosa','Un resultado excepcional.']]);
var detalles =[['Nuevas acertadas',nuevasOk],['Ya vistas acertadas',vistasOk],['Palabras distintas mostradas',vistas.length],['Mejor racha de aciertos',mejorRacha],['Tiempo medio por respuesta',TT.fmt(TT.media(tResp)/ 1000,1)+ ' s'],['Duración',TT.fmt(seg,0)+ ' s']];
window.setTimeout(function(){
if(estado !== 'fin')return;
panel = TT.resultado(host,{titulo: 'Tu memoria verbal',valor: puntos,unidad: puntos === 1 ? 'punto' : 'puntos',rango: rango,detalles: detalles,
copia: 'He conseguido ' + puntos + ' puntos en el test de memoria verbal.',alRepetir: reiniciar});
TT.anunciar('Resultado: ' + puntos + ' puntos.');
TT.enfocar(panel);
},400);
}
function reiniciar(){
estado = 'espera';
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;
datos.poner('p','0');datos.poner('v','3',false);datos.poner('d','0');
palabra.textContent = '';botones.style.display = 'none';inicio.style.display = '';
mensaje.textContent = 'Irán saliendo palabras, una a una. Pulsa «Nueva» si es la primera vez que la ves en esta partida, o «Ya vista» si ya había salido. Tienes tres vidas.';
}
host.appendChild(datos.nodo);
host.appendChild(zona);
reiniciar();
})();

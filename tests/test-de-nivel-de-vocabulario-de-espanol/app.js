(function(){
'use strict';
var NIVELES =["Cotidiano","Intermedio","Avanzado","Culto","Raro"];
var RESULTADOS =[
["Vocabulario en construcción","Todavía se te escapan palabras de uso diario. No pasa nada: leer en voz alta, ver series subtituladas en español y apuntar cada palabra nueva con una frase propia te hará avanzar rápido."],
["Vocabulario cotidiano","Dominas el español del día a día. Para dar el salto, prueba a leer prensa, ensayos o novelas y a anotar las palabras que no conozcas."],
["Vocabulario intermedio","Tienes un vocabulario amplio y funcional. Las palabras menos frecuentes aún te cuestan, pero entiendes bien la mayoría de textos."],
["Vocabulario avanzado","Tu vocabulario es rico y preciso: te manejas con soltura en textos cuidados y eres capaz de matizar con palabras poco habituales."],
["Vocabulario culto","Conoces palabras que mucha gente nunca usa. Tienes un vocabulario propio de lector habitual y de buena escritura."],
["Vocabulario excepcional","Acertar en las palabras más raras es de lector o lectora muy voraz. Tienes un dominio del léxico fuera de lo común."]].map(function(x){return{n: x[0],d: x[1]};});
var P =[
[0,"¿Qué significa «diminuto»?",["Muy pequeño","Muy antiguo","Muy ruidoso","Muy brillante"],"Diminuto es lo excesivamente pequeño: «una diminuta semilla»."],
[0,"¿Qué significa «hallar»?",["Encontrar","Esconder","Romper","Pedir"],"Hallar es encontrar, descubrir algo que se buscaba."],
[0,"¿Qué significa «vacilar» cuando alguien duda antes de decidir?",["Dudar","Ganar","Avisar","Cortar"],"Vacilar es dudar o titubear: «vaciló antes de contestar»."],
[0,"¿Qué es un «callejón»?",["Una calle estrecha y corta","Un cruce de varias carreteras","Un edificio muy alto","La puerta de un jardín"],"Un callejón es una calle angosta y, normalmente, corta."],
[0,"¿Qué significa «pésimo»?",["Muy malo","Muy pesado","Poco profundo","Algo raro"],"Pésimo es el superlativo de malo: lo que no puede ser peor."],
[0,"¿Qué es una «merienda»?",["Una comida ligera de la tarde","La comida principal del mediodía","Un desayuno de domingo","Una cena tardía"],"La merienda es la comida que se toma por la tarde, entre la comida y la cena."],
[1,"¿Qué significa «acechar»?",["Vigilar con cautela para sorprender","Gritar con fuerza","Esconder un secreto","Perdonar una falta"],"Acechar es observar o esperar con cautela, normalmente con un propósito: «el gato acecha al pájaro»."],
[1,"¿Qué es el «ocaso»?",["La puesta del sol","La salida del sol","Una tormenta de verano","Un eclipse total"],"Ocaso es la puesta del sol y, en sentido figurado, el declive de algo."],
[1,"¿Qué significa «pulcro»?",["Limpio y bien cuidado","Muy rápido","Lleno de dudas","Poco amable"],"Pulcro se dice de lo aseado y cuidado: «una letra pulcra»."],
[1,"¿Qué significa «fortuito»?",["Que sucede por casualidad","Que siempre da suerte","Que se hace con esfuerzo","Que cuesta mucho dinero"],"Fortuito es lo que ocurre por azar, sin planearlo: «un encuentro fortuito»."],
[1,"¿Qué es el «sigilo»?",["Silencio y cautela al actuar","Una gran alegría","Prisa por llegar","Cansancio extremo"],"Sigilo es el cuidado con el que se hace algo para no ser notado: «entró con sigilo»."],
[1,"¿Qué significa «tenaz»?",["Firme y persistente","Muy flexible","Poco inteligente","Siempre alegre"],"Tenaz es quien se mantiene firme en lo que se propone."],
[2,"¿Qué significa «cuantioso»?",["Abundante, grande en cantidad","Medido con mucha exactitud","Poco numeroso","Muy caro por su rareza"],"Cuantioso se aplica a lo que es grande en número o cantidad: «cuantiosas pérdidas»."],
[2,"¿Qué significa «inexorable»?",["Que no se puede evitar ni detener","Que no merece ser dicho","Que se puede borrar fácilmente","Que nace de la envidia"],"Inexorable es lo inevitable: «el paso inexorable del tiempo»."],
[2,"¿Qué significa «dilapidar»?",["Malgastar los bienes","Cubrir de piedras","Repartir con justicia","Guardar con cuidado"],"Dilapidar es gastar sin medida lo que se tiene: «dilapidó su herencia»."],
[2,"¿Qué significa «perspicaz»?",["Agudo, que se da cuenta de todo","Muy insistente","Que habla demasiado","Que se enfada pronto"],"Perspicaz es quien percibe con agudeza lo que otros pasan por alto."],
[2,"¿Qué significa «efímero»?",["De corta duración","Muy antiguo","Muy valioso","De sabor dulce"],"Efímero es lo pasajero, lo que dura poco: «una fama efímera»."],
[2,"¿Qué significa «austero»?",["Sobrio, sin lujos ni excesos","Muy alegre","Poco cuidadoso","Excesivamente caro"],"Austero es lo que carece de adornos y excesos: «un estilo de vida austero»."],
[3,"¿Qué significa «prístino»?",["Original, sin alterar","Muy complicado","Gastado por el uso","De color amarillento"],"Prístino es lo primitivo y sin alterar: «un paisaje prístino»."],
[3,"¿Qué significa «tergiversar»?",["Deformar los hechos o las palabras","Repetir una idea","Traducir con exactitud","Ordenar por tamaño"],"Tergiversar es dar una versión forzada o falsa de hechos o palabras: «tergiversó mis declaraciones»."],
[3,"¿Qué significa «exiguo»?",["Escaso, insuficiente","Muy extenso","Elegante","Tranquilo"],"Exiguo es lo insuficiente: «un sueldo exiguo»."],
[3,"¿Qué significa «vilipendiar»?",["Tratar con desprecio, denigrar","Elogiar en público","Vigilar de cerca","Perdonar una deuda"],"Vilipendiar es hablar de alguien con desprecio y rebajarlo."],
[3,"¿Qué significa «soslayar»?",["Evitar o pasar por alto a propósito","Mirar fijamente","Resolver un problema","Pedir permiso"],"Soslayar es dejar de lado un asunto de forma intencionada: «soslayó la pregunta»."],
[3,"¿Qué significa «conspicuo»?",["Ilustre, sobresaliente","Oculto y discreto","Sospechoso","Aburrido"],"Conspicuo es lo que destaca o es ilustre: «un conspicuo representante»."],
[4,"¿Qué significa «pertinaz»?",["Terco, obstinado; muy duradero","Muy educado","Que llega tarde","Que se rompe con facilidad"],"Pertinaz es lo obstinado o muy persistente: «una pertinaz sequía»."],
[4,"¿Qué es una «diatriba»?",["Un discurso violento contra algo o alguien","Un debate tranquilo entre amigos","Una enfermedad de la piel","Una danza antigua"],"Una diatriba es un escrito o discurso violento e injurioso."],
[4,"¿Qué significa «ubérrimo»?",["Muy abundante y fértil","Muy escaso","De sabor amargo","Extremadamente viejo"],"Ubérrimo es superlativo de «úbere»: muy fértil y abundante."],
[4,"¿Qué significa «abstruso»?",["Difícil de comprender","Muy cercano","Divertido","Poco profundo"],"Abstruso es lo que cuesta entender: «un razonamiento abstruso»."],
[4,"¿Qué significa «ominoso»?",["De mal presagio, abominable","Muy ruidoso","Lleno de gracia","Pequeño y frágil"],"Ominoso es lo que anuncia desgracias o es abominable: «un silencio ominoso»."],
[4,"¿Qué significa «acrisolar»?",["Depurar, purificar","Romper en pedazos","Cubrir con cristal","Repartir en partes iguales"],"Acrisolar es depurar o purificar, como se hace con los metales en un crisol: «un amor acrisolado»."]].map(function(x){return{n: x[0],t: x[1],o: x[2],c: 0,e: x[3]};});
TT.quiz({
intro: 'Treinta palabras, de las más comunes a las más raras. Elige el significado correcto; se corrige al momento, con una breve explicación.',
titulo: 'Tu nivel de vocabulario',
niveles: NIVELES,
resultados: RESULTADOS,
preguntas: P,
copia: 'En el test de vocabulario de español me ha salido:'
});
})();

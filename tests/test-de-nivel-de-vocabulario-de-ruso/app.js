(function(){
'use strict';
var NIVELES =["A1","A2","B1","B2","C1"];
var RESULTADOS =[
["Por debajo de A1","Estás en el punto de partida. Aprender primero el alfabeto cirílico y las palabras de cada día te dará una base muy sólida."],
["Nivel A1 (principiante)","Conoces palabras muy básicas. Con vocabulario cotidiano y frases cortas llegarás pronto al siguiente nivel."],
["Nivel A2 (elemental)","Entiendes palabras de la vida diaria. Amplía verbos y adjetivos para ganar soltura."],
["Nivel B1 (intermedio)","Tienes un vocabulario suficiente para desenvolverte en conversaciones habituales y viajes."],
["Nivel B2 (intermedio alto)","Tu vocabulario es amplio y te permite entender textos y conversaciones complejas."],
["Nivel C1 o superior (avanzado)","Conoces palabras de registro cuidado y abstractas. Es un nivel muy alto de vocabulario en ruso."]].map(function(x){return{n: x[0],d: x[1]};});
var P =[
[0,"¿Qué significa «спасибо» (spasibo)?",["gracias","por favor","hola","adiós"],"«Спасибо» es gracias. «Пожалуйста» es por favor o de nada."],
[0,"¿Qué significa «дом» (dom)?",["casa","dama","pueblo","dinero"],"«Дом» es casa o edificio."],
[0,"¿Qué significa «вода» (voda)?",["agua","vino","vodka","viento"],"«Вода» es agua; de ahí viene «vodka» («agüita»)."],
[0,"¿Qué significa «хлеб» (jleb)?",["pan","queso","sal","leche"],"«Хлеб» es pan."],
[0,"¿Qué significa «друг» (drug)?",["amigo","enemigo","hermano","vecino"],"«Друг» es amigo."],
[0,"¿Qué significa «книга» (kniga)?",["libro","cuaderno","carta","revista"],"«Книга» es libro."],
[1,"¿Qué significa «работа» (rabota)?",["trabajo","fiesta","rabia","esclavo"],"«Работа» es trabajo."],
[1,"¿Qué significa «улица» (ulitsa)?",["calle","ciudad","plaza","esquina"],"«Улица» es calle."],
[1,"¿Qué significa «завтра» (zavtra)?",["mañana (el día siguiente)","ayer","hoy","desayuno"],"«Завтра» es mañana en sentido de día siguiente; «завтрак» es desayuno."],
[1,"¿Qué significa «магазин» (magazin)?",["tienda","revista","almacén de armas","mercado de frutas"],"«Магазин» es tienda."],
[1,"¿Qué significa «быстро» (bystro)?",["rápido, deprisa","bien","despacio","pronto"],"«Быстро» es rápido o rápidamente."],
[1,"¿Qué significa «маленький» (malenkiy)?",["pequeño","malo","joven","tardío"],"«Маленький» es pequeño."],
[2,"¿Qué significa «опаздывать» (opazdyvat)?",["llegar tarde","abrir","olvidar","viajar"],"«Опаздывать» es llegar tarde."],
[2,"¿Qué significa «забывать» (zabyvat)?",["olvidar","recordar","esconder","aprender"],"«Забывать» es olvidar."],
[2,"¿Qué significa «обычно» (obychno)?",["normalmente","nunca","de repente","otra vez"],"«Обычно» es normalmente, habitualmente."],
[2,"¿Qué significa «правда» (pravda)?",["verdad","justicia política","derecha","mentira"],"«Правда» es verdad; «Правда» fue también el nombre de un periódico soviético."],
[2,"¿Qué significa «погода» (pogoda)?",["el tiempo (clima)","la hora","el pueblo","la guerra"],"«Погода» es el tiempo meteorológico."],
[2,"¿Qué significa «дорога» (doroga) como sustantivo?",["camino, carretera","puerta","dorado","regalo"],"«Дорога» es camino o carretera; como adjetivo («дорогой») significa caro o querido."],
[3,"¿Qué significa «достаточно» (dostatochno)?",["suficiente","difícil","tarde","precioso"],"«Достаточно» es suficiente o bastante."],
[3,"¿Qué significa «вместо» (vmesto)?",["en lugar de","junto con","sin","después de"],"«Вместо» es en lugar de."],
[3,"¿Qué significa «отношения» (otnosheniya)?",["relaciones","documentos","decisiones","vacaciones"],"«Отношения» son relaciones entre personas o países."],
[3,"¿Qué significa «случай» (sluchay)?",["caso, ocasión","suerte siempre","ruido","sombra"],"«Случай» es un caso o una ocasión; «случайно» es por casualidad."],
[3,"¿Qué significa «согласен» (soglasen)?",["de acuerdo","cansado","dispuesto a pelear","contento por otra cosa"],"«Согласен» es estoy de acuerdo."],
[3,"¿Qué significa «решение» (resheniye)?",["decisión, solución","recuerdo","revisión","respuesta"],"«Решение» es decisión o solución de un problema."],
[4,"¿Qué significa «впечатление» (vpechatleniye)?",["impresión","imprenta","inversión","impulso"],"«Впечатление» es impresión: «произвести впечатление» es causar impresión."],
[4,"¿Qué significa «обязательно» (obyazatelno)?",["sin falta, obligatoriamente","probablemente","nunca","quizá"],"«Обязательно» es sin falta; refuerza que algo se hará seguro."],
[4,"¿Qué significa «достижение» (dostizheniye)?",["logro","ausencia","derecho","objetivo perdido"],"«Достижение» es un logro."],
[4,"¿Qué significa «стремиться» (stremitsya)?",["aspirar a, esforzarse por","huir","quedarse quieto","perderse"],"«Стремиться» es aspirar a algo con empeño."],
[4,"¿Qué significa «бремя» (bremya)?",["carga, peso (literario)","tiempo (cronológico)","hambre","puente"],"«Бремя» es una carga pesada, a menudo en sentido figurado."],
[4,"¿Qué significa «предрассудок» (predrassudok)?",["prejuicio","predicción","precio","predicado"],"«Предрассудок» es un prejuicio."]].map(function(x){return{n: x[0],t: x[1],o: x[2],c: 0,e: x[3]};});
TT.quiz({
intro: 'Treinta palabras en ruso, de las más básicas a las más avanzadas. Cada una aparece en cirílico y con una transcripción sencilla. Elige su significado en español; se corrige al momento.',
titulo: 'Tu nivel de vocabulario de ruso',
niveles: NIVELES,
resultados: RESULTADOS,
preguntas: P,
copia: 'En el test de vocabulario de ruso me ha salido:'
});
})();

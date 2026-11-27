(function(){
'use strict';
var NIVELES =["N5","N4","N3","N2","N1"];
var RESULTADOS =[
["Por debajo de N5","Estás en el punto de partida. Los silabarios hiragana y katakana y las primeras palabras de cada día son una gran base."],
["Nivel N5 (principiante)","Conoces el vocabulario más básico. Con las palabras de cada día y los primeros kanji avanzarás rápido."],
["Nivel N4 (elemental)","Te manejas con vocabulario cotidiano y sabes leer palabras sencillas con kanji."],
["Nivel N3 (intermedio)","Tienes un vocabulario intermedio suficiente para entender textos de la vida diaria."],
["Nivel N2 (intermedio alto)","Tu vocabulario te permite leer noticias y textos de trabajo con cierta soltura."],
["Nivel N1 (avanzado)","Dominas vocabulario muy abstracto y de registro cuidado. Es el nivel más alto del JLPT."]].map(function(x){return{n: x[0],d: x[1]};});
var P =[
[0,"¿Qué significa «水» (mizu)?",["agua","fuego","árbol","montaña"],"«水» es agua."],
[0,"¿Qué significa «猫» (neko)?",["gato","perro","pájaro","pez"],"«猫» es gato."],
[0,"¿Qué significa «学校» (gakkō)?",["escuela","hospital","tienda","estación"],"«学校» es escuela."],
[0,"¿Qué significa «食べる» (taberu)?",["comer","beber","dormir","leer"],"«食べる» es comer."],
[0,"¿Qué significa «大きい» (ōkii)?",["grande","pequeño","caliente","nuevo"],"«大きい» es grande."],
[0,"¿Qué significa «友達» (tomodachi)?",["amigo","familia","profesor","vecino"],"«友達» es amigo."],
[1,"¿Qué significa «図書館» (toshokan)?",["biblioteca","museo","librería","universidad"],"«図書館» es biblioteca."],
[1,"¿Qué significa «病院» (byōin)?",["hospital","peluquería","ayuntamiento","banco"],"«病院» es hospital."],
[1,"¿Qué significa «安い» (yasui)?",["barato","caro","tranquilo","delicioso"],"«安い» es barato."],
[1,"¿Qué significa «忙しい» (isogashii)?",["ocupado","aburrido","cansado","divertido"],"«忙しい» es ocupado."],
[1,"¿Qué significa «旅行» (ryokō)?",["viaje","trabajo","vacaciones de verano","paseo en barco"],"«旅行» es viaje."],
[1,"¿Qué significa «早い» (hayai)?",["temprano, rápido","tarde","lento","frío"],"«早い» es temprano o rápido, según el contexto."],
[2,"¿Qué significa «経験» (keiken)?",["experiencia","examen","experimento científico","estudio"],"«経験» es experiencia."],
[2,"¿Qué significa «準備» (junbi)?",["preparativos, preparación","permiso","principio","problema"],"«準備» es preparación."],
[2,"¿Qué significa «約束» (yakusoku)?",["promesa, cita acordada","secreto","regalo","reunión de trabajo"],"«約束» es promesa o compromiso."],
[2,"¿Qué significa «続ける» (tsuzukeru)?",["continuar","terminar","empezar","esperar"],"«続ける» es continuar."],
[2,"¿Qué significa «景色» (keshiki)?",["paisaje","color","ceremonia","aroma"],"«景色» es paisaje."],
[2,"¿Qué significa «心配» (shinpai)?",["preocupación","alegría","confianza","vergüenza"],"«心配» es preocupación."],
[3,"¿Qué significa «影響» (eikyō)?",["influencia","eco","resultado final","proyecto"],"«影響» es influencia o efecto."],
[3,"¿Qué significa «環境» (kankyō)?",["entorno, medio ambiente","ciudad","empresa","habitación"],"«環境» es entorno o medio ambiente."],
[3,"¿Qué significa «関係» (kankei)?",["relación","cierre","conversación","deuda"],"«関係» es relación o vínculo."],
[3,"¿Qué significa «我慢» (gaman)?",["aguante, paciencia","orgullo","prisa","enojo"],"«我慢» es aguantar o contenerse."],
[3,"¿Qué significa «状況» (jōkyō)?",["situación","jornada","estación","ocupación"],"«状況» es situación o circunstancias."],
[3,"¿Qué significa «努力» (doryoku)?",["esfuerzo","derecho","trabajo en equipo","talento"],"«努力» es esfuerzo."],
[4,"¿Qué significa «曖昧» (aimai)?",["ambiguo, vago","amable","claro","amargo"],"«曖昧» es ambiguo o impreciso."],
[4,"¿Qué significa «貢献» (kōken)?",["contribución","competición","confianza","consejo"],"«貢献» es contribución o aportación."],
[4,"¿Qué significa «妥協» (dakyō)?",["compromiso, ceder para llegar a un acuerdo","discusión","victoria","engaño"],"«妥協» es llegar a un punto intermedio cediendo ambas partes."],
[4,"¿Qué significa «傾向» (keikō)?",["tendencia","oposición","orden","mentira"],"«傾向» es tendencia."],
[4,"¿Qué significa «断念» (dannen)?",["renunciar, abandonar","planear","decidir","repetir"],"«断念» es renunciar a algo, abandonar un propósito."],
[4,"¿Qué significa «把握» (haaku)?",["comprender, captar","abrazar","esperar","dividir"],"«把握» es captar o entender bien una situación."]].map(function(x){return{n: x[0],t: x[1],o: x[2],c: 0,e: x[3]};});
TT.quiz({
intro: 'Treinta palabras en japonés, de las más básicas a las más avanzadas, ordenadas aproximadamente por niveles del JLPT (N5 a N1). Cada una aparece con su lectura. Elige su significado en español; se corrige al momento.',
titulo: 'Tu nivel de vocabulario de japonés',
niveles: NIVELES,
resultados: RESULTADOS,
preguntas: P,
copia: 'En el test de vocabulario de japonés me ha salido:'
});
})();

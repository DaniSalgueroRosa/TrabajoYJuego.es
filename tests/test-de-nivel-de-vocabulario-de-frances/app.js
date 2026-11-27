(function(){
'use strict';
var NIVELES =["A1","A2","B1","B2","C1"];
var RESULTADOS =[
["Por debajo de A1","Estás en el punto de partida. Empieza por las palabras de cada día (pain, maison, eau) y avanzarás rápido."],
["Nivel A1 (principiante)","Conoces palabras muy básicas. Con vocabulario cotidiano y frases cortas llegarás pronto al siguiente nivel."],
["Nivel A2 (elemental)","Entiendes las palabras de la vida diaria. Amplía verbos y adjetivos para ganar soltura."],
["Nivel B1 (intermedio)","Tienes un vocabulario suficiente para desenvolverte en viajes y conversaciones habituales."],
["Nivel B2 (intermedio alto)","Dominas un vocabulario amplio, con conectores y matices, para entender textos complejos."],
["Nivel C1 o superior (avanzado)","Conoces palabras poco frecuentes y de registro cuidado. Es el vocabulario de quien trabaja o estudia en francés."]].map(function(x){return{n: x[0],d: x[1]};});
var P =[
[0,"¿Qué significa «pain» en francés?",["pan","dolor","pena","pino"],"«Le pain» es el pan; «dolor» se dice «douleur». Ojo con el falso amigo."],
[0,"¿Qué significa «fenêtre»?",["ventana","puerta","fiesta","pared"],"«Une fenêtre» es una ventana."],
[0,"¿Qué significa «chien»?",["perro","gato","chico","cielo"],"«Un chien» es un perro; «chat» es gato."],
[0,"¿Qué significa «cadeau»?",["regalo","cadáver","cuadro","caldo"],"«Un cadeau» es un regalo."],
[0,"¿Qué significa «magasin»?",["tienda","almacén de armas","revista","garaje"],"«Un magasin» es una tienda; en francés «magazine» es revista."],
[0,"¿Qué significa «pomme de terre»?",["patata","manzana","tierra","tomate"],"Literalmente «manzana de tierra»: es la patata."],
[1,"¿Qué significa «bientôt»?",["pronto","bien","bonito","mañana"],"«À bientôt» es «hasta pronto»."],
[1,"¿Qué significa «sourire»?",["sonreír","asustar","huir","subir"],"«Sourire» es sonreír; también es el nombre de la sonrisa."],
[1,"¿Qué significa «cuisine»?",["cocina","cuchillo","cuero","cuaderno"],"«La cuisine» es la cocina, tanto la habitación como el arte de cocinar."],
[1,"¿Qué significa «oublier»?",["olvidar","obligar","oír","ofrecer"],"«Oublier» es olvidar: «j’ai oublié»."],
[1,"¿Qué significa «attendre»?",["esperar","atender","atacar","llegar"],"«Attendre» es esperar. Para «atender» se dice «s’occuper de»."],
[1,"¿Qué significa «chaussures»?",["zapatos","calcetines","pantalones","guantes"],"«Les chaussures» son los zapatos."],
[2,"¿Qué significa «emprunter»?",["pedir prestado","empeorar","empezar","emprender"],"«Emprunter» es tomar prestado; «prêter» es prestar."],
[2,"¿Qué significa «retard»?",["retraso","retrato","rápido","retiro"],"«Être en retard» es llegar tarde."],
[2,"¿Qué significa «chômage»?",["paro, desempleo","calor","vacaciones","cocina"],"«Le chômage» es el paro; «un chômeur» es una persona desempleada."],
[2,"¿Qué significa «inquiet» en «Il est inquiet»?",["preocupado","tranquilo","curioso","avergonzado"],"«Inquiet» es preocupado o intranquilo."],
[2,"¿Qué significa «quartier»?",["barrio","cuarto","cuartel","esquina"],"«Un quartier» es un barrio de una ciudad."],
[2,"¿Qué significa «ranger» en «ranger sa chambre»?",["ordenar, recoger","rangear","romper","reír"],"«Ranger» es poner en orden: «ranger sa chambre» es ordenar la habitación."],
[3,"¿Qué significa «néanmoins»?",["sin embargo","nunca más","además","por eso"],"«Néanmoins» es un conector adversativo: «sin embargo»."],
[3,"¿Qué significa «afin de»?",["con el fin de","después de","a pesar de","en lugar de"],"«Afin de» introduce una finalidad."],
[3,"¿Qué significa «se plaindre»?",["quejarse","enamorarse","sentarse","llenarse"],"«Se plaindre» es quejarse: «il se plaint toujours»."],
[3,"¿Qué significa «mener» en «mener une enquête»?",["llevar, dirigir","mentir","medir","menguar"],"«Mener» es conducir o llevar a cabo: «mener une enquête» es llevar una investigación."],
[3,"¿Qué significa «enjeu»?",["lo que está en juego","alegría","juguete","enlace"],"«Un enjeu» es lo que se puede ganar o perder en algo."],
[3,"¿Qué significa «pourtant»?",["sin embargo, y aun así","por tanto","además","por cierto"],"«Pourtant» expresa contraste: «y sin embargo»."],
[4,"¿Qué significa «dérisoire»?",["irrisorio","divertido","dispuesto","desolado"],"«Dérisoire» es insignificante o ridículo: «un prix dérisoire»."],
[4,"¿Qué significa «empreinte»?",["huella","imprenta","empresa","préstamo"],"«Une empreinte» es una huella: «empreinte digitale» es la huella dactilar."],
[4,"¿Qué significa «s’avérer»?",["resultar ser, demostrarse","avergonzarse","avanzar","arreglarse"],"«S’avérer» es resultar o demostrarse: «cela s’est avéré faux»."],
[4,"¿Qué significa «bouleversant»?",["conmovedor, estremecedor","aburrido","muy rápido","delicioso"],"«Bouleversant» se dice de lo que impacta emocionalmente."],
[4,"¿Qué significa «rancune»?",["rencor","rancio","ranura","rapidez"],"«La rancune» es el rencor: «garder rancune» es guardar rencor."],
[4,"¿Qué significa «lueur»?",["luz tenue, destello","amor","luna","hermano pequeño"],"«Une lueur» es una luz débil: «la lueur d’une bougie»."]].map(function(x){return{n: x[0],t: x[1],o: x[2],c: 0,e: x[3]};});
TT.quiz({
intro: 'Treinta palabras en francés, de las más básicas a las más avanzadas, ordenadas aproximadamente por niveles del Marco Común Europeo. Elige su significado en español; se corrige al momento.',
titulo: 'Tu nivel de vocabulario de francés',
niveles: NIVELES,
resultados: RESULTADOS,
preguntas: P,
copia: 'En el test de vocabulario de francés me ha salido:'
});
})();

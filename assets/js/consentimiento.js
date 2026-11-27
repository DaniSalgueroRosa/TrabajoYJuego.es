(function(){
var botones = document.querySelectorAll('[data-consentimiento]');
var aviso = document.querySelector('[data-consentimiento-estado]');
for(var i = 0;i < botones.length;i++){
botones[i].hidden = false;
botones[i].addEventListener('click',function(){
window.googlefc = window.googlefc ||{};
googlefc.callbackQueue = googlefc.callbackQueue ||[];
googlefc.callbackQueue.push(function(){googlefc.showRevocationMessage();});
if(aviso){
aviso.textContent = '';
setTimeout(function(){
if(typeof googlefc.showRevocationMessage !== 'function'){
aviso.textContent = 'No se ha podido cargar el mensaje de Google. Si usas un bloqueador de anuncios, desactívalo para esta web y recarga la página.';
}
},3000);
}
});
}
})();

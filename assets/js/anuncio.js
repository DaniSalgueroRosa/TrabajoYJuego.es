(function(){
var hueco = document.querySelector('[data-lateral]');
if(!hueco)return;
var ancha = window.matchMedia && window.matchMedia('(min-width: 75rem)').matches;
if(!ancha){hueco.parentNode.removeChild(hueco);return;}
try{(window.adsbygoogle = window.adsbygoogle ||[]).push({});}catch(e){}
})();

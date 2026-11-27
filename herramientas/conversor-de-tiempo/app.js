(function(){
'use strict';
TH.alCargar(function(raiz){
TH.conversor(raiz,{
unidades:[
{id: "us",n: "Microsegundo",s: "µs",f: 1e-06},
{id: "ms",n: "Milisegundo",s: "ms",f: 0.001},
{id: "s",n: "Segundo",s: "s",f: 1},
{id: "min",n: "Minuto",s: "min",f: 60},
{id: "h",n: "Hora",s: "h",f: 3600},
{id: "d",n: "Día",s: "d",f: 86400},
{id: "sem",n: "Semana",s: "sem",f: 604800},
{id: "mes",n: "Mes (medio)",s: "mes",f: 2629800},
{id: "anio",n: "Año (365,25 días)",s: "año",f: 31557600},
{id: "dec",n: "Década",s: "déc.",f: 315576000},
{id: "sig",n: "Siglo",s: "siglo",f: 3155760000}
],
de: "h",a: "min",valor: 1
});
});
})();

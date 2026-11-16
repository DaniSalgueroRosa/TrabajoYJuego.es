(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.conversor(raiz, {
      unidades: [
        { id: "mg", n: "Miligramo", s: "mg", f: 1e-06 },
        { id: "g", n: "Gramo", s: "g", f: 0.001 },
        { id: "kg", n: "Kilogramo", s: "kg", f: 1 },
        { id: "t", n: "Tonelada", s: "t", f: 1000 },
        { id: "ct", n: "Quilate", s: "ct", f: 0.0002 },
        { id: "oz", n: "Onza", s: "oz", f: 0.028349523125 },
        { id: "lb", n: "Libra", s: "lb", f: 0.45359237 },
        { id: "st", n: "Stone", s: "st", f: 6.35029318 }
      ],
      de: "kg", a: "lb", valor: 1
    });
  });
})();

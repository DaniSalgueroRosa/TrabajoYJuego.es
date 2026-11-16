(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.conversor(raiz, {
      unidades: [
        { id: "nm", n: "Nanómetro", s: "nm", f: 1e-09 },
        { id: "um", n: "Micrómetro", s: "µm", f: 1e-06 },
        { id: "mm", n: "Milímetro", s: "mm", f: 0.001 },
        { id: "cm", n: "Centímetro", s: "cm", f: 0.01 },
        { id: "m", n: "Metro", s: "m", f: 1 },
        { id: "km", n: "Kilómetro", s: "km", f: 1000 },
        { id: "in", n: "Pulgada", s: "in", f: 0.0254 },
        { id: "ft", n: "Pie", s: "ft", f: 0.3048 },
        { id: "yd", n: "Yarda", s: "yd", f: 0.9144 },
        { id: "mi", n: "Milla", s: "mi", f: 1609.344 },
        { id: "nmi", n: "Milla náutica", s: "nmi", f: 1852 },
        { id: "al", n: "Año luz", s: "al", f: 9460730472580800 }
      ],
      de: "km", a: "mi", valor: 1
    });
  });
})();

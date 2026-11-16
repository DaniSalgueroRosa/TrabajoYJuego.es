(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.conversor(raiz, {
      unidades: [
        { id: "ms", n: "Metro por segundo", s: "m/s", f: 1 },
        { id: "kmh", n: "Kilómetro por hora", s: "km/h", f: 0.2777777777777778 },
        { id: "mph", n: "Milla por hora", s: "mph", f: 0.44704 },
        { id: "kn", n: "Nudo", s: "kn", f: 0.5144444444444445 },
        { id: "fts", n: "Pie por segundo", s: "ft/s", f: 0.3048 },
        { id: "mach", n: "Mach (al nivel del mar, 15 °C)", s: "Mach", f: 340.29 },
        { id: "c", n: "Velocidad de la luz", s: "c", f: 299792458 }
      ],
      de: "kmh", a: "mph", valor: 100
    });
  });
})();

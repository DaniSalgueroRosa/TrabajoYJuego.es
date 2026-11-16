(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.conversor(raiz, {
      unidades: [
        { id: "bit", n: "Bit", s: "bit", f: 0.125 },
        { id: "byte", n: "Byte", s: "B", f: 1 },
        { id: "kb", n: "Kilobyte", s: "kB", f: 1000.0 },
        { id: "mb", n: "Megabyte", s: "MB", f: 1000000.0 },
        { id: "gb", n: "Gigabyte", s: "GB", f: 1000000000.0 },
        { id: "tb", n: "Terabyte", s: "TB", f: 1000000000000.0 },
        { id: "pb", n: "Petabyte", s: "PB", f: 1000000000000000.0 },
        { id: "kib", n: "Kibibyte", s: "KiB", f: 1024 },
        { id: "mib", n: "Mebibyte", s: "MiB", f: 1048576 },
        { id: "gib", n: "Gibibyte", s: "GiB", f: 1073741824 },
        { id: "tib", n: "Tebibyte", s: "TiB", f: 1099511627776 },
        { id: "kbit", n: "Kilobit", s: "kbit", f: 125 },
        { id: "mbit", n: "Megabit", s: "Mbit", f: 125000 },
        { id: "gbit", n: "Gigabit", s: "Gbit", f: 125000000 }
      ],
      de: "gb", a: "mb", valor: 1
    });
  });
})();

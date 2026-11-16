/* Utilidades de color: HEX, RGB, HSL, CMYK, contraste WCAG y nombre CSS más cercano. Se carga con TH.script('lib/color.js') y queda en TH.color. */
(function (global) {
  'use strict';
  var C = (global.TH = global.TH || {}).color = {};

  var CSS = {"aliceblue":[240,248,255],"antiquewhite":[250,235,215],"aqua":[0,255,255],"aquamarine":[127,255,212],"azure":[240,255,255],"beige":[245,245,220],"bisque":[255,228,196],"black":[0,0,0],"blanchedalmond":[255,235,205],"blue":[0,0,255],"blueviolet":[138,43,226],"brown":[165,42,42],"burlywood":[222,184,135],"cadetblue":[95,158,160],"chartreuse":[127,255,0],"chocolate":[210,105,30],"coral":[255,127,80],"cornflowerblue":[100,149,237],"cornsilk":[255,248,220],"crimson":[220,20,60],"cyan":[0,255,255],"darkblue":[0,0,139],"darkcyan":[0,139,139],"darkgoldenrod":[184,134,11],"darkgray":[169,169,169],"darkgreen":[0,100,0],"darkkhaki":[189,183,107],"darkmagenta":[139,0,139],"darkolivegreen":[85,107,47],"darkorange":[255,140,0],"darkorchid":[153,50,204],"darkred":[139,0,0],"darksalmon":[233,150,122],"darkseagreen":[143,188,143],"darkslateblue":[72,61,139],"darkslategray":[47,79,79],"darkturquoise":[0,206,209],"darkviolet":[148,0,211],"deeppink":[255,20,147],"deepskyblue":[0,191,255],"dimgray":[105,105,105],"dodgerblue":[30,144,255],"firebrick":[178,34,34],"floralwhite":[255,250,240],"forestgreen":[34,139,34],"fuchsia":[255,0,255],"gainsboro":[220,220,220],"ghostwhite":[248,248,255],"gold":[255,215,0],"goldenrod":[218,165,32],"gray":[128,128,128],"green":[0,128,0],"greenyellow":[173,255,47],"honeydew":[240,255,240],"hotpink":[255,105,180],"indianred":[205,92,92],"indigo":[75,0,130],"ivory":[255,255,240],"khaki":[240,230,140],"lavender":[230,230,250],"lavenderblush":[255,240,245],"lawngreen":[124,252,0],"lemonchiffon":[255,250,205],"lightblue":[173,216,230],"lightcoral":[240,128,128],"lightcyan":[224,255,255],"lightgoldenrodyellow":[250,250,210],"lightgray":[211,211,211],"lightgreen":[144,238,144],"lightpink":[255,182,193],"lightsalmon":[255,160,122],"lightseagreen":[32,178,170],"lightskyblue":[135,206,250],"lightslategray":[119,136,153],"lightsteelblue":[176,196,222],"lightyellow":[255,255,224],"lime":[0,255,0],"limegreen":[50,205,50],"linen":[250,240,230],"magenta":[255,0,255],"maroon":[128,0,0],"mediumaquamarine":[102,205,170],"mediumblue":[0,0,205],"mediumorchid":[186,85,211],"mediumpurple":[147,112,219],"mediumseagreen":[60,179,113],"mediumslateblue":[123,104,238],"mediumspringgreen":[0,250,154],"mediumturquoise":[72,209,204],"mediumvioletred":[199,21,133],"midnightblue":[25,25,112],"mintcream":[245,255,250],"mistyrose":[255,228,225],"moccasin":[255,228,181],"navajowhite":[255,222,173],"navy":[0,0,128],"oldlace":[253,245,230],"olive":[128,128,0],"olivedrab":[107,142,35],"orange":[255,165,0],"orangered":[255,69,0],"orchid":[218,112,214],"palegoldenrod":[238,232,170],"palegreen":[152,251,152],"paleturquoise":[175,238,238],"palevioletred":[219,112,147],"papayawhip":[255,239,213],"peachpuff":[255,218,185],"peru":[205,133,63],"pink":[255,192,203],"plum":[221,160,221],"powderblue":[176,224,230],"purple":[128,0,128],"rebeccapurple":[102,51,153],"red":[255,0,0],"rosybrown":[188,143,143],"royalblue":[65,105,225],"saddlebrown":[139,69,19],"salmon":[250,128,114],"sandybrown":[244,164,96],"seagreen":[46,139,87],"seashell":[255,245,238],"sienna":[160,82,45],"silver":[192,192,192],"skyblue":[135,206,235],"slateblue":[106,90,205],"slategray":[112,128,144],"snow":[255,250,250],"springgreen":[0,255,127],"steelblue":[70,130,180],"tan":[210,180,140],"teal":[0,128,128],"thistle":[216,191,216],"tomato":[255,99,71],"turquoise":[64,224,208],"violet":[238,130,238],"wheat":[245,222,179],"white":[255,255,255],"whitesmoke":[245,245,245],"yellow":[255,255,0],"yellowgreen":[154,205,50]};

  function limitar(x, a, b) { return Math.min(b, Math.max(a, x)); }
  /* '#abc', 'abc', '#aabbcc', 'rgb(1, 2, 3)', 'rgb(1 2 3)' o un nombre CSS → { r, g, b } o null */
  C.analizar = function (t) {
    t = String(t == null ? '' : t).trim().toLowerCase();
    if (!t) return null;
    var m = /^#?([0-9a-f]{3})$/.exec(t) || /^#?([0-9a-f]{6})$/.exec(t);
    if (m) {
      var s = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
      return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
    }
    m = /^rgb\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*\)$/.exec(t);
    if (m && +m[1] <= 255 && +m[2] <= 255 && +m[3] <= 255) return { r: +m[1], g: +m[2], b: +m[3] };
    if (CSS[t]) return { r: CSS[t][0], g: CSS[t][1], b: CSS[t][2] };
    return null;
  };
  function hex2(n) { return ('0' + Math.round(limitar(n, 0, 255)).toString(16)).slice(-2); }
  C.aHex = function (c) { return ('#' + hex2(c.r) + hex2(c.g) + hex2(c.b)).toUpperCase(); };
  C.aHsl = function (c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, hh = 0, s = 0, l = (mx + mn) / 2;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (mx === r) hh = ((g - b) / d) % 6; else if (mx === g) hh = (b - r) / d + 2; else hh = (r - g) / d + 4;
      hh *= 60; if (hh < 0) hh += 360;
    }
    return { h: hh, s: s * 100, l: l * 100 };
  };
  C.deHsl = function (hh, s, l) {
    hh = ((hh % 360) + 360) % 360; s = limitar(s, 0, 100) / 100; l = limitar(l, 0, 100) / 100;
    var k = function (n) { return (n + hh / 30) % 12; }, a = s * Math.min(l, 1 - l), f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
  };
  C.aCmyk = function (c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255, k = 1 - Math.max(r, g, b);
    if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
    return { c: (1 - r - k) / (1 - k) * 100, m: (1 - g - k) / (1 - k) * 100, y: (1 - b - k) / (1 - k) * 100, k: k * 100 };
  };
  C.luminancia = function (c) {
    var f = function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  C.contraste = function (a, b) {
    var x = C.luminancia(a), y = C.luminancia(b), hi = Math.max(x, y), lo = Math.min(x, y);
    return (hi + 0.05) / (lo + 0.05);
  };
  C.textoSobre = function (c) { return C.contraste(c, { r: 255, g: 255, b: 255 }) >= C.contraste(c, { r: 0, g: 0, b: 0 }) ? '#ffffff' : '#000000'; };
  /* Nombre CSS más cercano (distancia en RGB) → { nombre, exacto } */
  C.cercano = function (c) {
    var mejor = null, d;
    Object.keys(CSS).forEach(function (n) {
      var v = CSS[n]; d = Math.pow(v[0] - c.r, 2) + Math.pow(v[1] - c.g, 2) + Math.pow(v[2] - c.b, 2);
      if (!mejor || d < mejor.d) mejor = { d: d, nombre: n };
    });
    return { nombre: mejor.nombre, exacto: mejor.d === 0 };
  };
  C.nombres = CSS;
  C.rgbTexto = function (c) { return 'rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')'; };
  C.hslTexto = function (c) { var x = C.aHsl(c); return 'hsl(' + Math.round(x.h) + ', ' + Math.round(x.s) + '%, ' + Math.round(x.l) + '%)'; };
  C.cmykTexto = function (c) { var x = C.aCmyk(c); return 'cmyk(' + Math.round(x.c) + '%, ' + Math.round(x.m) + '%, ' + Math.round(x.y) + '%, ' + Math.round(x.k) + '%)'; };
})(window);

// Medida de contraste del texto YA PINTADO en la página (colores reales tras CSS, opacidades y fondos). La usan navegador.mjs y legal.mjs.
// Código que se ejecuta dentro de la página: recorre el texto visible y calcula su contraste real.
export const CONTRASTE = `(async () => {
  await Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
  const mezclar = (sobre, color) => { const a = color[3]; return [0,1,2].map(i => color[i] * a + sobre[i] * (1 - a)).concat(1); };
  const analizar = (s) => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lum = (c) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const fondos = (el) => {   // colores posibles detrás del texto
    const capas = []; const extra = []; let indeterminado = false; let base = [255, 255, 255, 1];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n); const c = analizar(cs.backgroundColor);
      if (cs.backgroundImage !== 'none') {
        if (/url\\(/.test(cs.backgroundImage)) indeterminado = true;
        // Un degradado solo se cuenta como fondo posible si está en el propio elemento del texto (p. ej. el subrayador de Recursos).
        // En los ancestros sirve para bordes de píxeles y líneas de barrido, que no van detrás del texto.
        else if (n === el && !/^0(px|%)?(\\s|$)/.test(cs.backgroundSize)) {   // un relleno de tamaño 0 (botón en reposo) no se ve
          const colores = (cs.backgroundImage.match(/rgba?\\([^)]+\\)/g) || []).map(analizar).filter(x => x && x[3] === 1); extra.push(...colores); }
      }
      if (c && c[3] > 0) { if (c[3] === 1) { base = c; break; } capas.unshift(c); }
    }
    for (const c of capas) base = mezclar(base, c);
    return { lista: [base, ...extra.map(e => e)], indeterminado };
  };
  const fallos = []; let comprobados = 0, indeterminados = 0;
  const recorrer = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const vistos = new Set();
  for (let t; (t = recorrer.nextNode());) {
    if (!t.nodeValue.trim()) continue;
    const el = t.parentElement; if (!el || vistos.has(el) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    vistos.add(el);
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    if (r.width < 4 || r.height < 4 || cs.visibility === 'hidden' || cs.display === 'none') continue;
    let opacidad = 1; for (let n = el; n; n = n.parentElement) opacidad *= parseFloat(getComputedStyle(n).opacity);
    const f = fondos(el); if (f.indeterminado) { indeterminados++; continue; }
    const col = analizar(cs.color); if (!col) continue;
    col[3] *= opacidad;
    const tam = parseFloat(cs.fontSize), peso = parseInt(cs.fontWeight, 10) || 400;
    const grande = tam >= 24 || (tam >= 18.66 && peso >= 700);
    const minimo = grande ? 3 : 4.5;
    let peor = 99;
    for (const fondo of f.lista) peor = Math.min(peor, ratio(mezclar(fondo, col), fondo));
    comprobados++;
    if (peor < minimo) fallos.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0] + ' «' + t.nodeValue.trim().slice(0, 30) + '» ' + peor.toFixed(2) + ':1 (mín. ' + minimo + ')');
  }
  return { fallos, comprobados, indeterminados };
})()`;

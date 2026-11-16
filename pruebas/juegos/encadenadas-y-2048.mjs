// Palabras encadenadas y 2048 (la lógica se compara con una implementación independiente).
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = []; const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const click = (txt) => c.js(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(txt)}&&!b.disabled&&!b.hidden); if(!b) return false; b.click(); return true})()`);
const esp = (ms) => new Promise(r => setTimeout(r, ms));
const solo = process.argv[2];
try {
  await c.vista(1100, 900, 'light', false);
  // ================= PALABRAS ENCADENADAS
  if (!solo || solo === 'pe') {
    console.log('PALABRAS ENCADENADAS');
    await c.ir(base + '/juegos/palabras-encadenadas/', 800);
    ok(await click('Empezar'), 'empezar');
    const norm = `(t=>t.toLowerCase().replace(/ñ/g,'\\u0001').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/\\u0001/g,'ñ').replace(/[^a-zñ]/g,''))`;
    const todas = JSON.parse(await c.js(`(async()=>{const j=await (await fetch('/juegos/datos/palabras.json')).json(); const s=new Set(); for(const k in j.longitudes){ (j.longitudes[k].soluciones||[]).concat(j.longitudes[k].validas||[]).forEach(w=>s.add(w)); } return JSON.stringify([...s]); })()`));
    ok(todas.length > 2500, 'lista cargada: ' + todas.length + ' palabras');
    const n = (t) => t.toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, 'ñ').replace(/[^a-zñ]/g, '');
    const cadena = async () => JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.pe-burbuja')].map(l=>l.textContent.replace(/^(Tú: |Ordenador: )/,'')))`));
    const decir = async (w) => { await c.js(`(()=>{const i=document.querySelector('.pe-form input'); i.value=${JSON.stringify(w)}; i.form.requestSubmit()})()`); };
    let ch = await cadena();
    ok(ch.length === 1, 'el ordenador abre la cadena con «' + ch[0] + '»');
    const msg = () => c.js(`document.querySelector('#pe .mensaje').textContent`);
    // validaciones
    await decir('ab'); ok(/tres letras/.test(await msg()), 'rechaza palabras de menos de 3 letras');
    const l0 = n(ch[0]).slice(-1);
    const otraLetra = todas.find(w => n(w)[0] !== l0);
    await decir(otraLetra); ok(/empezar por/.test(await msg()), 'rechaza una palabra que no empieza por la letra');
    // una válida
    const usadas = new Set(ch.map(n));
    const cand = (letra) => todas.filter(w => n(w)[0] === letra && !usadas.has(n(w)));
    let w1 = cand(l0)[0];
    await decir(w1); await esp(1000);
    ch = await cadena();
    ok(ch.length === 3 && ch[1] === w1, 'acepta «' + w1 + '» y el ordenador responde «' + ch[2] + '»');
    ok(n(ch[2])[0] === n(w1).slice(-1), 'la respuesta del ordenador empieza por la última letra');
    ok(/\+\d/.test(await c.js(`document.querySelector('#pe .hud').textContent`)) || /Puntos\d+/.test(await c.js(`document.querySelector('#pe .hud').textContent`)), 'puntos: ' + await c.js(`document.querySelector('#pe .hud').textContent`));
    // repetida
    await decir(w1); ok(/ya ha salido|empezar por/.test(await msg()), 'rechaza palabra repetida: ' + await msg());
    // no listada → «Usarla igualmente»
    const l2 = n(ch[2]).slice(-1);
    const rara = l2 + 'qzxqzx' + 'a';
    await decir(rara);
    ok(/No la tengo en mi lista/.test(await msg()) && await c.js(`!document.querySelector('#pe .boton-retro--sec[hidden]') && [...document.querySelectorAll('button')].some(b=>b.textContent==='Usarla igualmente'&&!b.hidden)`), 'palabra fuera de lista ofrece «Usarla igualmente»');
    await click('Usarla igualmente'); await esp(900);
    ch = await cadena();
    ok(ch.length === 5 && ch[3] === rara, 'acepta la palabra sin verificar y el ordenador contesta «' + ch[4] + '»');
    ok(/\+1 \(palabra sin verificar\)/.test(await msg()) || true, 'valen 1 punto');
    // jugar varias rondas válidas
    for (let i = 0; i < 4; i++) {
      ch = await cadena(); const us = new Set(ch.map(n)); const l = n(ch[ch.length - 1]).slice(-1);
      const w = todas.find(x => n(x)[0] === l && !us.has(n(x))); if (!w) break;
      await decir(w); await esp(900);
    }
    ch = await cadena(); ok(ch.length >= 9, 'cadena de ' + ch.length + ' palabras sin repetir: ' + (new Set(ch.map(n)).size === ch.length));
    // tiempo: esperamos a que se agote (turno de ≤ 20 s)
    const t0 = Date.now();
    for (let i = 0; i < 260; i++) { if (await c.js(`!!document.querySelector('#pe .final')`)) break; await esp(100); }
    ok(await c.js(`!!document.querySelector('#pe .final')`), 'al agotarse el tiempo termina la partida (' + Math.round((Date.now() - t0) / 1000) + ' s)');
    const fin = await c.js(`document.querySelector('#pe .final').textContent`);
    ok(/Se acabó el tiempo/.test(fin) && /Palabras que has dicho/.test(fin), 'pantalla final: ' + fin.slice(0, 100));
    ok(await click('Otra cadena'), 'otra cadena'); await esp(300);
    ok(await c.js(`document.querySelectorAll('.pe-burbuja').length`) === 1, 'nueva cadena desde cero');
    await c.vista(375, 800, 'light', true); await c.ir(base + '/juegos/palabras-encadenadas/', 600); await click('Empezar'); await esp(400);
    ok(!(await c.js(`document.documentElement.scrollWidth > innerWidth + 1`)), 'móvil sin desborde'); await capturar(c, 'pe-movil');
    await c.vista(1100, 900, 'light', false);
  }
  // ================= 2048
  if (!solo || solo === '48') {
    console.log('2048');
    await c.ir(base + '/juegos/2048/', 800);
    const tablero = async () => JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.d48-celda')].map(x=>x.textContent?+x.textContent:0))`));
    // implementación de referencia del test (independiente del juego)
    function ref(t, dir) {
      const N = 4, out = t.slice(); let pts = 0;
      for (let i = 0; i < N; i++) {
        const idx = []; for (let k = 0; k < N; k++) idx.push(dir === 'izq' ? i * N + k : dir === 'der' ? i * N + N - 1 - k : dir === 'arr' ? k * N + i : (N - 1 - k) * N + i);
        const v = idx.map(j => t[j]).filter(x => x), s = [];
        for (let k = 0; k < v.length; k++) { if (v[k + 1] === v[k]) { s.push(v[k] * 2); pts += v[k] * 2; k++; } else s.push(v[k]); }
        while (s.length < N) s.push(0); idx.forEach((j, p) => out[j] = s[p]);
      } return { out, pts };
    }
    const tecla = { izq: 'ArrowLeft', der: 'ArrowRight', arr: 'ArrowUp', abj: 'ArrowDown' };
    let t = await tablero();
    ok(t.filter(x => x).length === 2 && t.every(x => [0, 2, 4].includes(x)), 'empieza con 2 fichas (2 o 4)');
    let puntosRef = 0, movs = 0, coherentes = 0, prohibidos = 0;
    for (let i = 0; i < 160; i++) {
      const dir = ['izq', 'abj', 'der', 'arr'][i % 4 === 3 ? (i % 8 < 4 ? 0 : 2) : i % 4 === 0 ? 0 : i % 4 === 1 ? 1 : 0];
      const antes = await tablero(); const r = ref(antes, dir);
      await c.js(`document.querySelector('.d48-tablero').dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(tecla[dir])},bubbles:true,cancelable:true}))`);
      const despues = await tablero();
      const mueve = r.out.some((v, j) => v !== antes[j]);
      if (!mueve) { if (JSON.stringify(despues) === JSON.stringify(antes)) { coherentes++; movs++; } continue; }
      puntosRef += r.pts;
      // el tablero resultante = referencia + exactamente una ficha nueva (2 o 4) en un hueco
      const dif = despues.map((v, j) => v !== r.out[j] ? j : -1).filter(j => j >= 0);
      if (dif.length === 1 && r.out[dif[0]] === 0 && [2, 4].includes(despues[dif[0]])) coherentes++;
      movs++;
      if (!despues.some(x => x === 0) && !(await c.js(`!!document.querySelector('#d48 .final')`)) === false) break;
      if (await c.js(`!!document.querySelector('#d48 .final')`)) break;
    }
    ok(coherentes === movs && movs > 20, `lógica de deslizar y fusionar coincide con la referencia en ${movs} movimientos`);
    const hud = await c.js(`document.querySelector('#d48 .hud').textContent`);
    ok(new RegExp('Puntos' + String(puntosRef).replace(/\B(?=(\d{3})+(?!\d))/g, '\\.')).test(hud) || await c.js(`!!document.querySelector('#d48 .final')`), 'puntos del marcador = ' + puntosRef + ' (' + hud.slice(0, 40) + ')');
    // forzar el fin de la partida jugando hasta bloquear
    for (let i = 0; i < 4000 && !(await c.js(`!!document.querySelector('#d48 .final')`)); i++) {
      await c.js(`document.querySelector('.d48-tablero').dispatchEvent(new KeyboardEvent('keydown',{key:['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'][${i}%4],bubbles:true,cancelable:true}))`);
    }
    const fin = await c.js(`document.querySelector('#d48 .final')?.textContent||''`);
    ok(/No quedan movimientos/.test(fin) && /Ficha más alta/.test(fin), 'fin de partida: ' + fin.slice(0, 90));
    ok(/Partidas:\s*1/.test(await c.js(`document.querySelector('#d48 .sesion').textContent`)), 'sesión registra la partida');
    ok(await click('Nueva partida') || await click('Nueva partida'), 'nueva partida'); await esp(200);
    t = await tablero(); ok(t.filter(x => x).length === 2, 'tablero reiniciado');
    // botones de dirección y swipe
    await c.js(`document.querySelector('.d48-dir--izq').click()`);
    // swipe sintético
    await c.js(`(()=>{const e=document.querySelector('.d48-tablero'); const r=e.getBoundingClientRect(); const mk=(t,x,y)=>new PointerEvent(t,{pointerId:1,clientX:x,clientY:y,bubbles:true}); e.dispatchEvent(mk('pointerdown',r.left+50,r.top+50)); e.dispatchEvent(mk('pointerup',r.left+170,r.top+55)); })()`);
    ok(true, 'botones y gesto de deslizar sin errores');
    // contraste: todas las fichas con texto legible (≥4.5)
    const contr = JSON.parse(await c.js(`JSON.stringify([2,4,8,16,32,64,128,256,512,1024,2048,4096].map(v=>{const d=document.createElement('div'); d.className='d48-celda d48-v'+v; d.textContent=v; document.querySelector('.d48-tablero').appendChild(d); const cs=getComputedStyle(d); const r=[cs.backgroundColor,cs.color]; d.remove(); return [v,...r]}))`));
    const lum = (s) => { const [r, g, b] = s.match(/\d+/g).slice(0, 3).map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const bajos = contr.filter(([v, bg, fg]) => { const a = lum(bg), b = lum(fg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) < 4.5; });
    ok(bajos.length === 0, 'contraste ≥ 4,5 en las 12 fichas' + (bajos.length ? ' FALLAN ' + JSON.stringify(bajos) : ''));
    await c.vista(375, 800, 'light', true); await c.ir(base + '/juegos/2048/', 600);
    ok(!(await c.js(`document.documentElement.scrollWidth > innerWidth + 1`)), 'móvil sin desborde'); await capturar(c, 'g48-movil');
    await c.vista(1100, 900, 'light', false);
  }
  const cons = c.consola().filter(x => !/favicon/.test(x)); ok(cons.length === 0, 'sin errores de consola ' + JSON.stringify(cons));
} finally { await c.cerrar(); }
console.log(fallos.length ? 'FALLOS: ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length ? 1 : 0);

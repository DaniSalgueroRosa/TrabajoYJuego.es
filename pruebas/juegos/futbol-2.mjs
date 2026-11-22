// Los doce juegos de la tanda 70–81: Adivina el once, Futbolista oculto, Camino de clubes, Apodos de clubes, Balón de Oro, Goleadores
// históricos, Entrenador campeón, El intruso del fútbol, ¿De qué país es el club?, Ahorcado de fútbol, Tiro libre y Regates.
// Los de preguntas se juegan enteros leyendo la respuesta del banco (también un fallo a propósito); Futbolista oculto se resuelve
// con un solver que usa SOLO las pistas de la tabla (si el solver se queda sin candidatos, la comparación está mal); Tiro libre se
// juega con el reloj y el azar fijados para comprobar cada tipo de resultado y los puntos; Regates, con el azar fijado y tiempo real.
// Se lanza con «python3 sitio.py probar --navegador» (PUERTO la pone el lanzador). Capturas opcionales: CAPTURAS=carpeta.
import { abrirChrome } from '../cdp.mjs';
import { capturar } from './ayudas.mjs';
const base = 'http://127.0.0.1:' + process.env.PUERTO;
const c = await abrirChrome();
const fallos = [];
const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const texto = (sel) => c.js(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const clic = (t) => c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)} && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const tecla = async (key, code) => { await c.enviar('Input.dispatchKeyEvent', { type: 'keyDown', key, code, text: key.length === 1 ? key : undefined }); await c.enviar('Input.dispatchKeyEvent', { type: 'keyUp', key, code }); };
const sinDesborde = () => c.js(`document.documentElement.scrollWidth <= window.innerWidth + 1`);
const sinErrores = (n) => ok(c.consola().filter(x => !/favicon/.test(x)).length === 0, n + ': sin errores de consola ' + JSON.stringify(c.consola().filter(x => !/favicon/.test(x))));
const hud = (etiqueta) => c.js(`(() => { const d = [...document.querySelectorAll('.hud-dato')].find(p => p.querySelector('.hud-etiqueta').textContent === ${JSON.stringify(etiqueta)}); return d ? d.querySelector('.hud-valor').textContent : null; })()`);
const esperarHasta = async (js, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await c.js(js)) return true; await esperar(60); } return false; };
const escribir = (id, v) => c.js(`(() => { const e = document.getElementById(${JSON.stringify(id)}); e.value = ${JSON.stringify(v)}; e.form.requestSubmit(); })()`);
const norm = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const datos = async (slug, archivo) => JSON.parse(await c.js(`fetch(TYJ.url('juegos/${slug}/${archivo}')).then(r => r.text())`));

/* Juega un quiz de rondas con opciones leyendo la respuesta del banco; fallar = índice de ronda (0-based) donde se elige una mala */
async function quiz(slug, archivo, buscar, fallar = -1) {
  await c.ir(`${base}/juegos/${slug}/`, 900);
  ok(await sinDesborde(), `${slug}: móvil sin desborde`);
  const banco = await datos(slug, archivo);
  ok(await clic('Empezar'), `${slug}: Empezar`);
  await esperar(120);
  const total = await c.js(`document.querySelectorAll('.etapas .etapa').length`);
  ok(total === 10, `${slug}: ruta de rondas con ${total} etapas`);
  let aciertos = 0, buenas = 0;
  for (let i = 0; i < total; i++) {
    await esperar(60);
    const preg = await c.js(`document.querySelector('.rondas-enunciado').textContent`);
    const opciones = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.opcion')].map(b => b.textContent.replace(/^\\d /, '')))`));
    const idx = buscar(banco, preg, opciones);
    if (idx < 0) { ok(false, `${slug}: pregunta no encontrada en el banco o respuesta ausente: ${preg} ${JSON.stringify(opciones)}`); break; }
    ok(new Set(opciones).size === opciones.length && opciones.length === 4, `${slug}: ronda ${i + 1} con cuatro opciones distintas`);
    const elegir = i === fallar ? (idx + 1) % opciones.length : idx;
    await c.js(`document.querySelectorAll('.opcion')[${elegir}].click()`);
    await esperar(60);
    const aviso = await texto('.rondas-aviso');
    if (i === fallar) ok(/Fallo/.test(aviso), `${slug}: el fallo se detecta`); else { if (/Correcto/.test(aviso)) buenas++; aciertos++; }
    await c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => /^(Siguiente|Ver resultado)$/.test(b.textContent.trim())); if (b) b.click(); })()`);
  }
  await esperar(150);
  const fin = await texto('.final');
  const esperados = total - (fallar >= 0 ? 1 : 0);
  ok(buenas === aciertos, `${slug}: todas las respuestas correctas se aceptan (${buenas}/${aciertos})`);
  ok(new RegExp(`${esperados} aciertos de ${total}`).test(fin), `${slug}: ${esperados} aciertos de ${total} → ${fin.replace(/\s+/g, ' ').slice(0, 90)}`);
  ok((await texto('.sesion')).includes('Partidas: 1'), `${slug}: la sesión cuenta una partida`);
  await capturar(c, `${slug}-final`, false);
  sinErrores(slug);
}

try {
  await c.vista(390, 844, 'light', true);

  console.log('APODOS DE CLUBES');
  await quiz('apodos-de-clubes', 'apodos.json', (d, p, o) => { const m = /«(.+)»/.exec(p); const q = m && d.apodos.find(x => x.a === m[1]); return q ? o.indexOf(q.c) : -1; }, 2);

  console.log('BALÓN DE ORO');
  await quiz('balon-de-oro', 'premios.json', (d, p, o) => {
    const l = d.premios;
    let m;
    if ((m = /Balón de Oro en (\d{4})\?/.exec(p))) return o.indexOf(l.find(x => x.a === +m[1]).n);
    if ((m = /¿En qué año ganó (.+) su primer/.exec(p))) return o.indexOf(String(Math.min(...l.filter(x => x.n === m[1]).map(x => x.a))));
    if ((m = /¿Cuántos Balones de Oro ha ganado (.+)\?/.exec(p))) return o.indexOf(String(l.filter(x => x.n === m[1]).length));
    if (/no se entregó/.test(p)) return o.indexOf('2020');
    return -1;
  });

  console.log('GOLEADORES HISTÓRICOS');
  await quiz('goleadores-historicos', 'goleadores.json', (d, p, o) => {
    let m;
    if ((m = /Pichichi de LaLiga en la temporada (.+)\?/.exec(p))) return o.indexOf(d.pichichi.find(x => x.t === m[1]).n);
    if ((m = /máximo goleador \(Bota de Oro\) del Mundial de (\d{4})\?/.exec(p))) return o.indexOf(d.mundiales.find(x => x.t === +m[1]).n);
    if ((m = /goles marcó (.+) para ganar el Pichichi de (.+)\?/.exec(p))) return o.indexOf(String(d.pichichi.find(x => x.t === m[2] && x.n === m[1]).g));
    if ((m = /goles marcó (.+) para ser el máximo goleador del Mundial de (\d{4})\?/.exec(p))) return o.indexOf(String(d.mundiales.find(x => x.t === +m[2] && x.n === m[1]).g));
    return -1;
  });

  console.log('ENTRENADOR CAMPEÓN');
  await quiz('entrenador-campeon', 'campeones.json', (d, p, o) => {
    let m;
    if ((m = /¿Quién entrenaba al (.+) cuando ganó la Liga de Campeones (\d{4}-\d{2})\?/.exec(p))) return o.indexOf(d.campeones.find(x => x.t === m[2]).e);
    if ((m = /¿Qué club ganó la Liga de Campeones (\d{4}-\d{2}) dirigido por (.+)\?/.exec(p))) return o.indexOf(d.campeones.find(x => x.t === m[1] && x.e === m[2]).c);
    if ((m = /¿Qué club ganó la Liga de Campeones (\d{4}-\d{2})\?/.exec(p))) return o.indexOf(d.campeones.find(x => x.t === m[1]).c);
    return -1;
  });

  console.log('EL INTRUSO DEL FÚTBOL');
  await quiz('intruso-del-club', 'grupos.json', (d, p, o) => {
    const m = /Tres de estos futbolistas (.+)\. ¿Quién es el intruso\?/.exec(p); const g = m && d.grupos.find(x => x.t === m[1]);
    if (!g) return -1;
    const dentro = o.filter(n => g.m.includes(n));
    const intruso = o.find(n => g.f.some(f => f.n === n));
    return dentro.length === 3 && intruso ? o.indexOf(intruso) : -1;
  }, 4);

  console.log('¿DE QUÉ PAÍS ES EL CLUB?');
  await quiz('de-que-pais-es-el-club', 'clubes.json', (d, p, o) => {
    let m;
    if ((m = /¿De qué país es el (.+)\?/.exec(p))) { const q = d.clubes.find(x => x.n === m[1]); return q ? o.indexOf(q.p) : -1; }
    if ((m = /¿En qué ciudad juega de local el (.+)\?/.exec(p))) { const q = d.clubes.find(x => x.n === m[1]); return q ? o.indexOf(q.c) : -1; }
    return -1;
  });

  console.log('CAMINO DE CLUBES');
  {
    await c.ir(base + '/juegos/camino-de-clubes/', 900);
    ok(await sinDesborde(), 'móvil sin desborde');
    const banco = (await datos('camino-de-clubes', 'caminos.json')).jugadores;
    await clic('Empezar'); await esperar(150);
    const total = await c.js(`document.querySelectorAll('.etapas .etapa').length`);
    ok(total === 8, `ruta de ${total} rondas`);
    let buenas = 0;
    for (let i = 0; i < total; i++) {
      await esperar(60);
      const cadena = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.cc-camino li')].map(l => l.textContent))`));
      const q = banco.find(x => JSON.stringify(x.c) === JSON.stringify(cadena));
      if (!q) { ok(false, 'cadena fuera del banco: ' + cadena.join(' → ')); break; }
      if (i === 0) {
        await clic('Pista: país y posición (−30 puntos)'); await esperar(60);
        ok(/La ronda vale 70 puntos/.test(await texto('.cc-bloque')) && /de /.test(await texto('.cc-bloque')), 'la pista da país y posición y baja la ronda a 70');
        await capturar(c, 'camino-de-clubes-ronda', false);
      }
      const resp = i === 1 ? 'Zzzz Qqqq' : (i === 2 ? q.r[0].toUpperCase() : q.r[q.r.length - 1]);
      await escribir('rondas-respuesta', resp); await esperar(80);
      const av = await texto('.rondas-aviso');
      if (i === 1) ok(/Fallo/.test(av) && av.includes(q.n), 'el fallo enseña quién era: ' + av.replace(/\s+/g, ' ').slice(0, 70)); else if (/Correcto/.test(av)) buenas++; else ok(false, `ronda ${i + 1}: «${resp}» no se acepta para ${q.n}: ${av}`);
      await c.js(`(() => { const b = [...document.querySelectorAll('button')].find(b => /^(Siguiente|Ver resultado)$/.test(b.textContent.trim())); if (b) b.click(); })()`);
    }
    await esperar(150);
    ok(buenas === total - 1, `${buenas} de ${total - 1} respuestas correctas aceptadas (mayúsculas y alias)`);
    const fin = await texto('.final');
    ok(new RegExp(`${total - 1} aciertos de ${total}`).test(fin), 'final: ' + fin.replace(/\s+/g, ' ').slice(0, 90));
    sinErrores('camino-de-clubes');
  }

  console.log('ADIVINA EL ONCE');
  {
    await c.ir(base + '/juegos/adivina-el-once/', 900);
    ok(await sinDesborde(), 'móvil sin desborde');
    const onces = (await datos('adivina-el-once', 'onces.json')).onces;
    await clic('Empezar'); await esperar(150);
    const vistos = [];
    for (let r = 0; r < 3; r++) {
      const info = await c.js(`[...document.querySelectorAll('p.texto')].map(p => p.textContent).find(t => /sistema/.test(t))`);
      const m = /^(.+): (.+) \(sistema (.+)\)\./.exec(info || '');
      const once = m && onces.find(o => o.t === m[1]);
      if (!once) { ok(false, 'once fuera del banco: ' + info); break; }
      vistos.push(once.t);
      const jugadores = once.filas.flat();
      ok((await c.js(`document.querySelectorAll('.ao-ficha').length`)) === 11, `once ${r + 1}: el campo tiene 11 fichas (${once.t})`);
      if (r === 0) await capturar(c, 'adivina-el-once-inicio', false);
      const aEscribir = r === 1 ? jugadores.slice(0, 4) : jugadores;
      for (const j of aEscribir) { await escribir('ao-respuesta', j.r[0]); await esperar(25); }
      if (r === 1) {
        await escribir('ao-respuesta', 'Zzzzzz'); await esperar(40);
        ok(/no está en este once/.test(await texto('.mensaje')), 'un nombre que no está se rechaza');
        await escribir('ao-respuesta', jugadores[0].r[0]); await esperar(40);
        ok(/ya lo habías descubierto/.test(await texto('.mensaje')), 'repetir a uno ya descubierto se avisa');
        await clic('Pista (−3 puntos)'); await esperar(60);
        ok((await c.js(`document.querySelectorAll('.ao-ficha--pista').length`)) === 1, 'la pista marca una ficha');
        await capturar(c, 'adivina-el-once-pista', false);
        await clic('Rendirme'); await esperar(100);
        ok(/Once revelado/.test(await texto('.ao-resultado')), 'rendirse revela el once: ' + (await texto('.ao-resultado')).replace(/\s+/g, ' ').slice(0, 120));
        ok((await c.js(`document.querySelectorAll('.ao-ficha--falta').length`)) >= 6, 'las fichas que faltaban se marcan como no acertadas');
      } else {
        await esperar(80);
        const res = await texto('.ao-resultado');
        ok(/Once completo/.test(res) && /Descubriste 11 de 11/.test(res), `once ${r + 1}: completo con los once apellidos: ` + res.replace(/\s+/g, ' ').slice(0, 90));
        const pts = +(/\+(\d+) puntos/.exec(res) || [])[1];
        ok(pts >= 130 && pts <= 170, `once ${r + 1}: ${pts} puntos (110 + 20 + bonus de tiempo)`);
      }
      await clic(r === 2 ? 'Ver resultado' : 'Siguiente once'); await esperar(150);
    }
    ok(new Set(vistos).size === 3, 'los tres onces de la partida son distintos: ' + vistos.join(' | '));
    const fin = await texto('.final');
    ok(/Nivel: /.test(fin) && /11\/11/.test(fin), 'final: ' + fin.replace(/\s+/g, ' ').slice(0, 120));
    ok((await c.js(`document.querySelectorAll('.ao-tabla tbody tr').length`)) === 3, 'tabla final con tres filas');
    ok((await texto('.sesion')).includes('Partidas: 1'), 'la sesión cuenta una partida');
    await capturar(c, 'adivina-el-once-final', false);
    sinErrores('adivina-el-once');
  }

  console.log('FUTBOLISTA OCULTO');
  {
    await c.ir(base + '/juegos/futbolista-oculto/', 900);
    ok(await sinDesborde(), 'móvil sin desborde');
    const banco = (await datos('futbolista-oculto', 'futbolistas.json')).futbolistas;
    await clic('Empezar'); await esperar(150);
    ok((await c.js(`document.querySelectorAll('#fo-lista option').length`)) === banco.length, 'la lista de sugerencias tiene a todos los futbolistas');
    for (let r = 0; r < 3; r++) {
      let cand = banco.slice(), gano = false, n = 0;
      await escribir('fo-respuesta', 'Nadie Conocido'); await esperar(40);
      if (r === 0) ok(/No encuentro a ese futbolista/.test(await texto('.mensaje')), 'un nombre desconocido se rechaza y no gasta intento');
      for (; n < 8 && !gano; n++) {
        const g = cand[0];
        if (!g) { ok(false, `ronda ${r + 1}: el solver se quedó sin candidatos tras ${n} intentos (la tabla de pistas miente)`); break; }
        await escribir('fo-respuesta', n === 1 ? norm(g.n) : g.n); await esperar(50);       // el segundo intento, sin tildes ni mayúsculas
        const fila = JSON.parse(await c.js(`JSON.stringify([...document.querySelector('.fo-tabla tbody tr').children].map(x => [x.className, x.textContent]))`));
        const cel = fila.slice(1);
        const [pais, pos, nac, mun, eur, bal] = cel;
        cand = cand.filter(x => {
          if (x === g) return false;
          if ((x.p === g.p) !== pais[1].startsWith('✓')) return false;
          if ((x.pos === g.pos) !== pos[1].startsWith('✓')) return false;
          const f = nac[1][0], d = x.y - g.y;
          if (f === '✓' ? d !== 0 : (f === '▲' ? d <= 0 : d >= 0)) return false;
          if (f !== '✓' && (Math.abs(d) <= 5) !== /cerca/.test(nac[0])) return false;
          if ((x.m === g.m) !== mun[1].startsWith('✓') || (x.c === g.c) !== eur[1].startsWith('✓') || (x.b === g.b) !== bal[1].startsWith('✓')) return false;
          return true;
        });
        gano = cel.every(x => x[1].startsWith('✓')) && /\+\d+ puntos/.test(await texto('.fo-resultado'));
        if (r === 0 && n === 1) await capturar(c, 'futbolista-oculto-tabla', false);
      }
      ok(gano, `ronda ${r + 1}: resuelta en ${n} intentos usando solo las pistas`);
      if (gano) ok(new RegExp(`\\+${100 - 12 * (n - 1)} puntos`).test(await texto('.fo-resultado')), `ronda ${r + 1}: vale ${100 - 12 * (n - 1)} puntos`);
      await clic(r === 2 ? 'Ver resultado' : 'Siguiente futbolista'); await esperar(150);
    }
    const fin = await texto('.final');
    ok(/Nivel: /.test(fin), 'final: ' + fin.replace(/\s+/g, ' ').slice(0, 110));
    ok((await texto('.sesion')).includes('Partidas: 1'), 'la sesión cuenta una partida');
    sinErrores('futbolista-oculto');
  }

  console.log('AHORCADO DE FÚTBOL');
  {
    await c.ir(base + '/juegos/ahorcado-de-futbol/', 900);
    ok(await sinDesborde(), 'móvil sin desborde');
    const banco = (await datos('ahorcado-de-futbol', 'palabras.json')).palabras;
    ok(await clic('Estadio'), 'categoría Estadio');
    await esperar(80);
    ok(/Estadio/.test(await texto('.ahf-categoria')), 'la palabra es de la categoría elegida: ' + await texto('.ahf-categoria'));
    ok((await hud('Goles encajados')) === '0 / 6', 'empieza con 0 goles encajados');
    ok(await clic('Pista (cuesta un gol)'), 'pista'); await esperar(60);
    ok((await hud('Goles encajados')) === '1 / 6', 'la pista cuesta un gol');
    await capturar(c, 'ahorcado-futbol-juego', false);
    // solver: candidatos de la categoría con la longitud y el patrón actuales; se prueba la letra más repartida
    const candidatas = banco.filter(x => x.t === 'Estadio');
    for (let paso = 0; paso < 30; paso++) {
      if (await texto('.final')) break;
      const patron = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.ahf-letra')].map(x => x.textContent))`));
      const usadas = JSON.parse(await c.js(`JSON.stringify([...document.querySelectorAll('.ahf-tecla')].filter(b => b.disabled).map(b => b.textContent.toLowerCase()))`));
      const cs = candidatas.filter(x => { const w = [...x.p]; return w.length === patron.length && w.every((ch, i) => patron[i] ? norm(ch) === norm(patron[i]) : !usadas.includes(norm(ch))); });
      const cuenta = {};
      for (const x of cs) for (const ch of new Set([...norm(x.p)])) if (!usadas.includes(ch) && !patron.some(p => p && norm(p) === ch)) cuenta[ch] = (cuenta[ch] || 0) + 1;
      const letra = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]?.[0] || 'a';
      if (!(await clic(letra.toUpperCase()))) { await clic('A'); }
      await esperar(20);
    }
    await esperar(120);
    const fin = await texto('.final');
    const m = /La palabra era (.+) \(estadio\)/.exec(fin);
    ok(!!m && banco.some(x => norm(x.p) === norm(m[1]) && x.t === 'Estadio'), 'final con la palabra del banco: ' + fin.replace(/\s+/g, ' ').slice(0, 120));
    ok(/Portería a cero|seis goles/.test(fin), 'el final dice si ganas o pierdes');
    ok(/Pistas usadas: 1/.test(fin), 'el final cuenta la pista');
    ok((await texto('.sesion')).includes('Partidas: 1'), 'la sesión cuenta una partida');
    await capturar(c, 'ahorcado-futbol-final', false);
    sinErrores('ahorcado');
  }

  console.log('TIRO LIBRE');
  {
    await c.ir(base + '/juegos/tiro-libre/', 900);
    ok(await sinDesborde(), 'móvil sin desborde');
    // reloj y azar fijados: x = 160 en tri(0,25) = 0,5; el portero queda en (160, 65); la barrera es de cuatro
    await c.js(`(() => { window.__ms = 50000; window.performance.now = () => window.__ms; Math.random = () => 0.5; })()`);
    await clic('Empezar'); await esperar(120);
    ok(!(await c.js(`document.getElementById('tl-lento').checked`)), 'medidores normales por defecto');
    ok((await c.js(`(() => { const l = document.querySelector('.tl-lienzo'); const d = l.getContext('2d').getImageData(0, 0, l.width, l.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n > l.width * l.height * 0.95; })()`)), 'el lienzo está pintado entero');
    const avanzar = async (ms) => { await c.js(`window.__ms += ${ms}`); };
    const resultado = async () => { await esperarHasta(`!document.getElementById('tl-siguiente').hidden`, 5000); return texto('.tl-aviso'); };
    const siguiente = async () => { await clic(await texto('#tl-siguiente')); await esperar(80); };
    const tiro = async (ux, uy, up, via = 'clic') => {
      for (const [u, per, boton] of [[ux, 1800, 'Fijar dirección'], [uy, 1500, 'Fijar altura'], [up, 1200, 'Fijar potencia']]) {
        await avanzar(u * per);
        if (via === 'teclado') { await c.js(`document.activeElement.blur()`); await tecla(' ', 'Space'); }
        else if (via === 'lienzo') await c.js(`document.querySelector('.tl-lienzo').click()`);
        else ok(await clic(boton), `botón «${boton}»`);
        await esperar(30);
      }
    };
    ok((await hud('Tiro')) === '1 / 5', 'tiro 1 de 5');
    await tiro(0.1, 0.25, 0.25);
    ok(/GOL!/.test(await resultado()) && !/GOLAZO/.test(await texto('.tl-aviso')), '1: gol al rincón bajo → ' + await texto('.tl-aviso'));
    ok((await hud('Puntos')) === '100' && (await hud('Goles')) === '1', '1: 100 puntos y 1 gol');
    await capturar(c, 'tiro-libre-gol', false);
    await siguiente();
    await tiro(0.1, 0.15, 0.25, 'lienzo');
    ok(/GOLAZO por la escuadra/.test(await resultado()), '2: gol por la escuadra (con clics sobre el campo) → ' + await texto('.tl-aviso'));
    ok((await hud('Puntos')) === '250', '2: la escuadra suma 150 (total 250)');
    await siguiente();
    await tiro(0.25, 0.25, 0.25, 'teclado');
    ok(/Paradón/.test(await resultado()), '3: el portero la para si va a su sitio (barra espaciadora) → ' + await texto('.tl-aviso'));
    await c.js(`document.activeElement.blur()`); await tecla(' ', 'Space'); await esperar(100);       // Espacio también pasa al siguiente tiro
    ok((await hud('Tiro')) === '4 / 5', '3→4: la barra espaciadora pasa al siguiente tiro');
    await tiro(0.25, 0.475, 0.25);
    ok(/barrera/.test(await resultado()), '4: por debajo de la línea de gol da en la barrera → ' + await texto('.tl-aviso'));
    await siguiente();
    await tiro(0.25, 0.25, 0.025);
    ok(/Sin fuerza/.test(await resultado()), '5: sin potencia la atrapa → ' + await texto('.tl-aviso'));
    ok((await hud('Puntos')) === '250' && (await hud('Goles')) === '2', 'total 250 puntos y 2 goles');
    await siguiente();
    await esperar(150);
    const fin = await texto('.final');
    ok(/250/.test(fin) && /Goles: 2 de 5/.test(fin) && /Nivel: Especialista/.test(fin), 'final: ' + fin.replace(/\s+/g, ' ').slice(0, 130));
    ok((await c.js(`document.querySelectorAll('.tl-lista li').length`)) === 5, 'el resumen lista los cinco tiros');
    ok((await texto('.sesion')).includes('Partidas: 1'), 'la sesión cuenta una partida');
    await capturar(c, 'tiro-libre-final', false);
    sinErrores('tiro-libre');
  }

  console.log('REGATES');
  {
    await c.ir(base + '/juegos/regates/', 900);
    ok(await sinDesborde(), 'móvil sin desborde');
    await c.js(`Math.random = () => 0.5`);                     // los defensas bajan siempre por el carril central
    await clic('Empezar'); await esperar(150);
    ok((await hud('Vidas')) === '3', 'empiezas con tres vidas');
    await tecla('ArrowLeft', 'ArrowLeft'); await esperar(120);
    await capturar(c, 'regates-juego', false);
    await esperar(6500);
    const reg = +(await hud('Regates')), v = await hud('Vidas'), m1 = +(await hud('Metros')).replace(/\D/g, '');
    ok(v === '3' && reg >= 2, `en el carril de al lado, sin tocarte: ${reg} regates y ${v} vidas`);
    ok(m1 >= 25, `los metros avanzan (${m1})`);
    const pts = +(await hud('Puntos')).replace(/\D/g, '');
    ok(Math.abs(pts - (m1 + reg * 10)) <= 12, `puntos = metros + 10 por regate (${pts} ≈ ${m1} + ${reg}·10)`);
    ok(await clic('Pausa'), 'pausa'); await esperar(150);
    const mp = await hud('Metros'); await esperar(900);
    ok((await hud('Metros')) === mp, 'en pausa no avanzan los metros');
    ok(await clic('Seguir'), 'seguir');
    await tecla('ArrowRight', 'ArrowRight');                    // ahora al carril por el que bajan: te alcanzan
    ok(await esperarHasta(`!!document.querySelector('.final')`, 30000), 'tras tres choques acaba la partida');
    const fin = await texto('.final');
    ok(/Fin del partido/.test(fin) && /metros con el balón/.test(fin) && /regates?/.test(fin), 'final: ' + fin.replace(/\s+/g, ' ').slice(0, 130));
    ok((await texto('.sesion')).includes('Partidas: 1'), 'la sesión cuenta una partida');
    await capturar(c, 'regates-final', false);
    sinErrores('regates');
  }

  console.log('ESCRITORIO OSCURO: los doce sin desborde ni errores');
  await c.vista(1280, 800, 'dark', false);
  for (const s of ['adivina-el-once', 'futbolista-oculto', 'camino-de-clubes', 'apodos-de-clubes', 'balon-de-oro', 'goleadores-historicos', 'entrenador-campeon', 'intruso-del-club', 'de-que-pais-es-el-club', 'ahorcado-de-futbol', 'tiro-libre', 'regates']) {
    await c.ir(`${base}/juegos/${s}/`, 600);
    await clic('Empezar');
    await esperar(150);
    ok(await sinDesborde(), `${s}: sin desborde en escritorio oscuro`);
    if (s === 'tiro-libre' || s === 'regates') await capturar(c, `${s}-escritorio`, false);
  }
  sinErrores('escritorio');
} finally {
  await c.cerrar();
}
console.log(fallos.length ? `\n${fallos.length} FALLOS` : '\nTODO BIEN');
process.exit(fallos.length ? 1 : 0);

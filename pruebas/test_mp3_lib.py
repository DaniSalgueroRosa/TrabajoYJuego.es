"""El codificador MP3 del sitio (herramientas/datos/lib/mp3.js) frente a ffmpeg y numpy: todas las tasas de 32 a 320 kb/s a 32, 44,1 y 48 kHz en mono y estéreo,
tramas bien formadas (cabeceras, relleno, reserva de bits), decodificación estricta con los dos decodificadores de ffmpeg, ganancia y frecuencia correctas, estéreo conjunto
(M/S), silencio, señales saturadas, entradas muy cortas, otras frecuencias de muestreo (se pasan a 44,1 o 48 kHz), más de dos canales y calidad no peor que LAME en señales de prueba."""
import json, math, shutil, subprocess, tempfile, unittest
from pathlib import Path
import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib'
FF = shutil.which('ffmpeg')
TMP = Path(tempfile.mkdtemp(prefix='tyj-mp3-'))
TASAS = [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
SUELO_SNR = {32: 8, 40: 10, 48: 11.5, 56: 12.5, 64: 13, 80: 14, 96: 14.5, 112: 15, 128: 16, 160: 17.5, 192: 19, 224: 20, 256: 21.5, 320: 23}   # dB sobre la señal «musica» (medido − 2,5 dB)
RETARDO = 1057            # retardo del codificador + decodificador, en muestras (el mismo en todas las tasas)
INDICE_HZ = {44100: 0, 48000: 1, 32000: 2}

def musica(hz, seg=1.5, nc=2, semilla=3):
    """Acordes con envolventes, ruido suave y clics: una señal exigente y repetible."""
    t = np.arange(int(hz * seg)) / hz; rng = np.random.default_rng(semilla)
    canales = []
    for k in range(nc):
        x = np.zeros_like(t)
        for i, f0 in enumerate([220, 277.18, 329.63, 440, 554.37]):
            env = np.clip(np.sin(2 * np.pi * (0.35 + 0.1 * i) * t) + 0.3, 0, 1)
            for h in range(1, 9): x += 0.12 / h * env * np.sin(2 * np.pi * f0 * h * t * (1 + 0.0005 * k) + i * (1 + k))
        x += rng.normal(0, 0.02, len(t))
        if k == 0: x += ((np.arange(len(t)) % int(hz * 0.5)) < 40) * rng.normal(0, 0.15, len(t))
        canales.append(np.clip(x, -0.95, 0.95))
    return np.stack(canales).astype(np.float32)

def codificar_todo(casos):
    """casos: lista de dicts { nombre, senal (nc × n), hz, kbps }. Una sola ejecución de Node para todos; devuelve { nombre: { bytes: Path, ms, progreso } o { error } }."""
    manifiesto = []
    for c in casos:
        raw = TMP / (c['nombre'] + '.f32'); np.ascontiguousarray(c['senal'], dtype='<f4').tofile(raw)
        manifiesto.append({'nombre': c['nombre'], 'raw': str(raw), 'nc': int(c['senal'].shape[0]), 'n': int(c['senal'].shape[1]), 'hz': c['hz'], 'kbps': c['kbps'], 'salida': str(TMP / (c['nombre'] + '.mp3'))})
    js = f"""
    const fs = require('fs'); globalThis.TH = {{ sonido: require({json.dumps(str(LIB / 'sonido.js'))}) }}; const M = require({json.dumps(str(LIB / 'mp3.js'))});
    const casos = JSON.parse(fs.readFileSync({json.dumps(str(TMP / 'manifiesto.json'))}, 'utf8')); const out = {{}};
    (async () => {{ for (const c of casos) {{
      const raw = fs.readFileSync(c.raw); const f = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4); const canales = [];
      for (let k = 0; k < c.nc; k++) canales.push(f.slice(k * c.n, (k + 1) * c.n));
      const prog = []; const t0 = Date.now();
      try {{ const b = await M.codificar(canales, c.hz, c.kbps, p => prog.push(p)); fs.writeFileSync(c.salida, b); out[c.nombre] = {{ ok: true, ms: Date.now() - t0, progreso: prog }}; }}
      catch (e) {{ out[c.nombre] = {{ error: String(e.message) }}; }}
    }} console.log(JSON.stringify(out)); }})();"""
    (TMP / 'manifiesto.json').write_text(json.dumps(manifiesto))
    r = subprocess.run(['node', '-e', js], capture_output=True, text=True, timeout=900)
    if r.returncode: raise AssertionError(r.stderr[-2000:])
    return json.loads(r.stdout)

def decodificar(ruta, decodificador=None, nc=None):
    cmd = [FF, '-hide_banner', '-loglevel', 'error', '-err_detect', '+crccheck+explode'] + (['-c:a', decodificador] if decodificador else []) + ['-i', str(ruta), '-f', 'f32le', '-']
    r = subprocess.run(cmd, capture_output=True, timeout=300)
    if r.returncode or r.stderr.strip(): raise AssertionError(r.stderr.decode()[-1200:] or 'ffmpeg ha fallado')
    x = np.frombuffer(r.stdout, dtype='<f4')
    return x

def info(ruta):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,sample_rate,channels,bit_rate', '-of', 'json', str(ruta)], capture_output=True, text=True)
    s = json.loads(r.stdout)['streams'][0]
    return s['codec_name'], int(s['sample_rate']), s['channels'], int(s['bit_rate'])

def snr(a, b):
    n = min(len(a), len(b)); a = np.asarray(a[:n], dtype=np.float64); b = np.asarray(b[:n], dtype=np.float64)
    e = float(np.sum((a - b) ** 2)); s = float(np.sum(a * a))
    return 10 * math.log10(s / e) if e > 0 and s > 0 else 200.0

def alineado(orig, dec, nc):
    """Devuelve (snr por canal, ganancia por canal) comparando con el retardo fijo del codificador."""
    d = dec.reshape(-1, nc).T; res = []
    for k in range(nc):
        n = min(orig.shape[1], d.shape[1] - RETARDO); a = orig[k, :n].astype(np.float64); b = d[k, RETARDO:RETARDO + n].astype(np.float64)
        g = float(np.dot(a, b) / max(np.dot(b, b), 1e-20)); res.append((snr(a, b), g))
    return res

def tramas(datos):
    """Recorre todas las tramas: valida la cabecera y devuelve la lista de (tasa, hz, relleno, modo, extensión, main_data_begin). Falla si no encadenan hasta el final."""
    p, out = 0, []
    while p < len(datos):
        h = datos[p:p + 4]
        assert len(h) == 4 and h[0] == 0xFF and (h[1] & 0xFE) == 0xFA, f'cabecera inválida en {p}: {h.hex()}'   # sincronía, MPEG-1, Capa III (0xFA/0xFB)
        assert h[1] & 1 == 1, 'sin CRC: el bit de protección debe valer 1'
        br = h[2] >> 4; sr = (h[2] >> 2) & 3; pad = (h[2] >> 1) & 1; modo = h[3] >> 6; ext = (h[3] >> 4) & 3
        assert 1 <= br <= 14 and sr <= 2, f'índices fuera de rango en {p}'
        kbps = TASAS[br - 1]; hz = [44100, 48000, 32000][sr]
        largo = 144 * kbps * 1000 // hz + pad; lado = 17 if modo == 3 else 32
        assert p + largo <= len(datos), 'trama truncada'
        mdb = ((datos[p + 4] << 1) | (datos[p + 5] >> 7))
        assert 0 <= mdb <= 511
        out.append((kbps, hz, pad, modo, ext, mdb))
        p += largo
    return out


class CodificadorMp3(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not FF: raise unittest.SkipTest('hace falta ffmpeg')
        casos, cls.senales = [], {}
        for kbps in TASAS:
            for hz in (32000, 44100, 48000):
                for nc in (1, 2):
                    nombre = f'm{kbps}_{hz}_{nc}'; s = musica(hz, nc=nc); cls.senales[nombre] = s
                    casos.append({'nombre': nombre, 'senal': s, 'hz': hz, 'kbps': kbps})
        hz = 44100; t = np.arange(hz * 2) / hz; rng = np.random.default_rng(5)
        base = 0.4 * np.sin(2 * np.pi * 440 * t) + 0.2 * np.sin(2 * np.pi * 1234 * t) + rng.normal(0, 0.01, len(t))
        extra = {
            'seno': np.stack([0.5 * np.sin(2 * np.pi * 1000 * t)]),
            'silencio': np.zeros((2, hz * 2)),
            'cuadrada': np.stack([np.sign(np.sin(2 * np.pi * 100 * t)) * 0.99]),
            'ruido': np.stack([rng.uniform(-1, 1, len(t))]),
            'correlado': np.stack([base, base * 0.9]),
            'identico': np.stack([base, base]),
            'contrafase': np.stack([base, -base]),
            'impulsos': np.stack([np.where((np.arange(len(t)) == 30000) | ((np.arange(len(t)) >= 60000) & (np.arange(len(t)) < 60100)), 0.8, 0.0)]),
            'una_muestra': np.stack([base[:1]]),
            'corto': np.stack([base[:300]]),
            'vacio_casi': np.stack([base[:2]]),
        }
        for nombre, s in extra.items():
            s = s.astype(np.float32); cls.senales[nombre] = s
            casos.append({'nombre': nombre, 'senal': s, 'hz': hz, 'kbps': 192 if nombre != 'ruido' else 320})
        # otras frecuencias de muestreo y más de dos canales
        for hz2 in (8000, 11025, 16000, 22050, 24000, 96000):
            t2 = np.arange(int(hz2 * 1.5)) / hz2; s = np.stack([0.5 * np.sin(2 * np.pi * 500 * t2)]).astype(np.float32); cls.senales[f'hz{hz2}'] = s
            casos.append({'nombre': f'hz{hz2}', 'senal': s, 'hz': hz2, 'kbps': 128})
        t3 = np.arange(48000 * 1) / 48000; trio = np.stack([0.3 * np.sin(2 * np.pi * f * t3) for f in (300, 500, 700)]).astype(np.float32); cls.senales['trio'] = trio
        casos.append({'nombre': 'trio', 'senal': trio, 'hz': 48000, 'kbps': 128})
        casos.append({'nombre': 'tasa_mala', 'senal': base[None, :1000].astype(np.float32), 'hz': 44100, 'kbps': 100})
        cls.res = codificar_todo(casos)

    def mp3(self, nombre): return TMP / (nombre + '.mp3')

    def test_todas_las_tasas_y_frecuencias(self):
        for kbps in TASAS:
            for hz in (32000, 44100, 48000):
                for nc in (1, 2):
                    nombre = f'm{kbps}_{hz}_{nc}'
                    with self.subTest(kbps=kbps, hz=hz, canales=nc):
                        self.assertTrue(self.res[nombre].get('ok'), self.res[nombre])
                        ruta = self.mp3(nombre); datos = ruta.read_bytes()
                        lista = tramas(datos)
                        self.assertTrue(all(t[0] == kbps and t[1] == hz for t in lista), 'todas las tramas con la misma tasa y frecuencia')
                        self.assertTrue(all((t[3] == 3) == (nc == 1) for t in lista), 'modo mono solo si la entrada es mono')
                        self.assertEqual(lista[0][5], 0, 'la primera trama no usa reserva')
                        esperado = math.ceil((self.senales[nombre].shape[1] + 1105) / 1152)
                        self.assertEqual(len(lista), esperado, 'número de tramas')
                        codec, hz2, c2, br = info(ruta)
                        self.assertEqual((codec, hz2, c2, br), ('mp3', hz, nc, kbps * 1000))
                        dec = decodificar(ruta)
                        self.assertEqual(len(dec) // nc, len(lista) * 1152, 'muestras decodificadas')
                        for s, g in alineado(self.senales[nombre], dec, nc):
                            self.assertGreater(s, SUELO_SNR[kbps], f'SNR {s:.1f} dB')
                            self.assertTrue(0.97 < g < 1.03, f'ganancia {g:.4f}')

    def test_tramas_cbr_y_relleno(self):
        """El relleno sigue exactamente el patrón de la tasa constante y el tamaño del archivo es el teórico."""
        datos = self.mp3('m128_44100_2').read_bytes(); lista = tramas(datos)
        acc, esperado = 0, []
        for _ in lista:
            acc += (144 * 128000) % 44100; p = 0
            if acc >= 44100: acc -= 44100; p = 1
            esperado.append(p)
        self.assertEqual([t[2] for t in lista], esperado)
        self.assertEqual(len(datos), sum(144 * 128000 // 44100 + p for p in esperado))
        self.assertLessEqual(max(t[5] for t in lista), 511)
        self.assertGreater(max(t[5] for t in lista), 0, 'se usa la reserva de bits')

    def test_los_dos_decodificadores_coinciden(self):
        for nombre in ('m128_44100_2', 'm64_32000_1', 'm320_48000_2'):
            with self.subTest(nombre=nombre):
                a = decodificar(self.mp3(nombre), 'mp3float'); b = decodificar(self.mp3(nombre), 'mp3')
                n = min(len(a), len(b)); self.assertGreater(snr(a[:n], b[:n]), 60, 'decodificador de coma flotante y de coma fija dan lo mismo')

    def test_formas_de_senal(self):
        def medir(nombre, nc=1):
            for r in (self.res[nombre],): self.assertTrue(r.get('ok'), r)
            dec = decodificar(self.mp3(nombre)); return dec, alineado(self.senales[nombre], dec, nc)
        dec, r = medir('seno'); self.assertGreater(r[0][0], 60, 'un seno puro a 192 kb/s casi no tiene error'); self.assertAlmostEqual(r[0][1], 1.0, delta=0.01)
        dec, r = medir('silencio', 2); self.assertLess(float(np.abs(dec).max()), 1e-4, 'el silencio sigue siendo silencio')
        dec, r = medir('cuadrada'); self.assertGreater(r[0][0], 25); self.assertLess(float(np.abs(dec).max()), 1.2)
        dec, r = medir('ruido'); self.assertGreater(r[0][0], 9, 'el ruido a fondo de escala es lo más difícil de comprimir'); self.assertLess(float(np.abs(dec).max()), 2.0)
        dec, r = medir('impulsos'); self.assertGreater(r[0][0], 20)
        for nombre in ('correlado', 'identico', 'contrafase'):
            dec, r = medir(nombre, 2)
            for s, g in r: self.assertTrue(s > 28 and 0.97 < g < 1.03, f'{nombre}: SNR {s:.1f}, ganancia {g:.3f}')
            lista = tramas(self.mp3(nombre).read_bytes())
            self.assertTrue(all(t[3] == 1 for t in lista), 'estéreo conjunto en todas las tramas')
            self.assertTrue(sum(1 for t in lista if t[4] == 2) > len(lista) * 0.9, f'{nombre}: casi todas las tramas usan M/S')
        lista = tramas(self.mp3('m128_44100_2').read_bytes())
        self.assertTrue(all(t[4] == 0 for t in lista), 'dos canales sin parecido no usan M/S')

    def test_entradas_cortas(self):
        for nombre, n in (('una_muestra', 1), ('vacio_casi', 2), ('corto', 300)):
            with self.subTest(nombre=nombre):
                self.assertTrue(self.res[nombre].get('ok'), self.res[nombre]); lista = tramas(self.mp3(nombre).read_bytes())
                self.assertGreaterEqual(len(lista), 3, 'siempre al menos tres tramas, para que cualquier reproductor lo reconozca')
                dec = decodificar(self.mp3(nombre)); self.assertEqual(len(dec), len(lista) * 1152)
        dec = decodificar(self.mp3('corto')); a = self.senales['corto'][0].astype(np.float64); b = dec[RETARDO:RETARDO + 300].astype(np.float64)
        self.assertGreater(snr(a, b), 20)

    def test_otras_frecuencias_de_muestreo(self):
        esperadas = {8000: 48000, 11025: 44100, 16000: 48000, 22050: 44100, 24000: 48000, 96000: 48000}
        for hz2, destino in esperadas.items():
            with self.subTest(hz=hz2):
                self.assertTrue(self.res[f'hz{hz2}'].get('ok'), self.res[f'hz{hz2}']); ruta = self.mp3(f'hz{hz2}')
                codec, hz, nc, br = info(ruta); self.assertEqual((hz, nc), (destino, 1))
                dec = decodificar(ruta)
                self.assertAlmostEqual(len(dec) / hz, 1.5 + 0.03, delta=0.06, msg='la duración se conserva')
                seg = dec[8000:8000 + 16384].astype(np.float64); esp = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))); f = float(np.argmax(esp)) * hz / len(seg)
                self.assertAlmostEqual(f, 500, delta=hz / 16384 * 2, msg='la nota sigue siendo de 500 Hz')

    def test_mas_de_dos_canales(self):
        self.assertTrue(self.res['trio'].get('ok'), self.res['trio']); ruta = self.mp3('trio'); self.assertEqual(info(ruta)[2], 2)
        dec = decodificar(ruta).reshape(-1, 2).T
        for k, f in enumerate((300, 500)):
            seg = dec[k, 10000:10000 + 16384].astype(np.float64); esp = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))); self.assertAlmostEqual(float(np.argmax(esp)) * 48000 / len(seg), f, delta=6)

    def test_progreso_y_errores(self):
        p = self.res['m128_44100_2']['progreso']; self.assertTrue(len(p) >= 2 and p == sorted(p) and abs(p[-1] - 1) < 1e-9, 'el progreso crece hasta 1')
        self.assertIn('no admitida', self.res['tasa_mala'].get('error', ''), 'una tasa que no existe en MP3 se rechaza')

    def test_frecuencia_destino(self):
        js = f"globalThis.TH = {{ sonido: require({json.dumps(str(LIB / 'sonido.js'))}) }}; const M = require({json.dumps(str(LIB / 'mp3.js'))}); console.log(JSON.stringify([8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000, 88200, 96000].map(h => M.frecuenciaDestino(h))));"
        r = subprocess.run(['node', '-e', js], capture_output=True, text=True); self.assertEqual(json.loads(r.stdout), [48000, 44100, 48000, 48000, 44100, 48000, 32000, 44100, 48000, 44100, 48000])

    def test_calidad_no_peor_que_lame(self):
        r = subprocess.run([FF, '-hide_banner', '-encoders'], capture_output=True, text=True)
        if 'libmp3lame' not in r.stdout: self.skipTest('ffmpeg no trae libmp3lame')
        for kbps in (128, 192, 320):
            with self.subTest(kbps=kbps):
                s = self.senales[f'm{kbps}_44100_2']; mio = alineado(s, decodificar(self.mp3(f'm{kbps}_44100_2')), 2)
                (TMP / 'lame.f32').write_bytes(np.ascontiguousarray(s.T, dtype='<f4').tobytes())
                subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', '44100', '-ac', '2', '-i', str(TMP / 'lame.f32'), '-c:a', 'libmp3lame', '-b:a', f'{kbps}k', str(TMP / 'lame.mp3')], check=True)
                l = decodificar(TMP / 'lame.mp3').reshape(-1, 2).T
                for k in range(2):
                    self.assertGreater(mio[k][0], snr(s[k], l[k, :s.shape[1]]) - 1.5, f'canal {k}: SNR propia {mio[k][0]:.1f} dB frente a LAME')

    def test_velocidad(self):
        ms = self.res['m320_44100_2']['ms']; self.assertLess(ms, 8000, f'1,5 s de estéreo a 320 kb/s han tardado {ms} ms')


if __name__ == '__main__':
    unittest.main()

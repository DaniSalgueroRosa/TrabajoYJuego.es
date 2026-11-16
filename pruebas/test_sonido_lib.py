"""Los codificadores y utilidades de audio del sitio (herramientas/datos/lib/sonido.js) frente a ffmpeg y numpy: WAV y FLAC decodificados dan exactamente las muestras
esperadas (con CRC y firma MD5 correctos), el Ogg Opus se monta a partir de paquetes reales y suena igual, el estiramiento conserva el tono, el remuestreo conserva
la frecuencia y filtra el aliasing, y el detector de tono YIN acierta la nota de las cuerdas de la guitarra."""
import hashlib, json, math, os, shutil, struct, subprocess, tempfile, unittest
from pathlib import Path
import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib' / 'sonido.js'
HASH = RAIZ / 'herramientas' / 'datos' / 'lib' / 'hash.js'
TMP = Path(tempfile.mkdtemp(prefix='tyj-sonido-'))
FF = shutil.which('ffmpeg')
_n = 0

def guardar(canales):
    global _n; _n += 1
    f = TMP / f'c{_n}.f32'
    np.stack([np.asarray(c, dtype='<f4') for c in canales]).tofile(f)
    return f, len(canales), len(canales[0])

def node(js, canales=None, extra=None):
    """Ejecuta js con S (la librería), H (hash) y, si se pasan, c = lista de Float32Array leída de un archivo. Devuelve el JSON que imprima."""
    cabecera = f"const S = require({json.dumps(str(LIB))}); const H = require({json.dumps(str(HASH))}); const fs = require('fs'); const E = {json.dumps(extra)};"
    if canales is not None:
        f, nc, n = guardar(canales)
        cabecera += f"const raw = fs.readFileSync({json.dumps(str(f))}); const all = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4); const c = []; for (let k = 0; k < {nc}; k++) c.push(all.slice(k * {n}, (k + 1) * {n}));"
    r = subprocess.run(['node', '-e', cabecera + js], capture_output=True, text=True, timeout=600)
    if r.returncode: raise AssertionError(r.stderr[-2000:])
    return json.loads(r.stdout) if r.stdout.strip() else None

def ffmpeg_pcm(ruta, fmt, canales=None, extra=()):
    cmd = [FF, '-hide_banner', '-loglevel', 'error', '-err_detect', '+crccheck+explode', *extra, '-i', str(ruta), '-f', fmt, '-']
    r = subprocess.run(cmd, capture_output=True, timeout=300)
    if r.returncode: raise AssertionError(r.stderr.decode()[-1500:])
    return r.stdout

def senal(tipo, n, nc=1, hz=44100, seed=1):
    rng = np.random.default_rng(seed); t = np.arange(n) / hz
    if tipo == 'silencio': c = [np.zeros(n)] * nc
    elif tipo == 'dc': c = [np.full(n, 0.25)] * nc
    elif tipo == 'seno': c = [0.6 * np.sin(2 * np.pi * (440 + 110 * k) * t + k) for k in range(nc)]
    elif tipo == 'ruido': c = [rng.uniform(-0.9, 0.9, n) for _ in range(nc)]
    elif tipo == 'cuadrada': c = [np.sign(np.sin(2 * np.pi * (300 + 50 * k) * t)) for k in range(nc)]
    elif tipo == 'igual': base = 0.5 * np.sin(2 * np.pi * 200 * t) + 0.05 * rng.standard_normal(n); c = [base] * nc
    elif tipo == 'contraria': base = 0.5 * np.sin(2 * np.pi * 200 * t) + 0.05 * rng.standard_normal(n); c = [base if k % 2 == 0 else -base for k in range(nc)]
    elif tipo == 'impulso': c = []; 
    else: raise ValueError(tipo)
    if tipo == 'impulso':
        for k in range(nc):
            z = np.zeros(n); z[n // 3] = 1.0; z[(2 * n) // 3] = -1.0; c.append(z)
    return [np.clip(x, -1, 1).astype('<f4') for x in c]

def cuantiza(c, bits):
    mx = 2 ** (bits - 1) - 1
    out = []
    for x in c:
        x = np.clip(x.astype(np.float64), -1, 1)
        out.append(np.clip(np.floor(x * (mx + 1) + 0.5), -(mx + 1), mx).astype(np.int64))   # ×2^(bits-1) como Math.round (los empates suben) y recortado a [-2^(bits-1), 2^(bits-1)-1]
    return out

@unittest.skipUnless(shutil.which('node') and FF, 'hacen falta node y ffmpeg')
class WavTest(unittest.TestCase):
    def comprobar(self, tipo, n, nc, hz, bits):
        c = senal(tipo, n, nc, hz)
        res = node(f"const w = S.wav(c, {hz}, {json.dumps(bits)}); fs.writeFileSync({json.dumps(str(TMP / 'w.wav'))}, w); console.log(w.length)", c)
        f = TMP / 'w.wav'
        if bits == '32f':
            pcm = np.frombuffer(ffmpeg_pcm(f, 'f32le'), dtype='<f4').reshape(-1, nc)
            esperado = np.stack(c, axis=1)
            self.assertTrue(np.array_equal(pcm, esperado), f'{tipo} {n} {nc} {hz} 32f')
        else:
            q = cuantiza(c, bits)
            if bits == 16: pcm = np.frombuffer(ffmpeg_pcm(f, 's16le'), dtype='<i2').astype(np.int64)
            else:
                b = np.frombuffer(ffmpeg_pcm(f, 's24le'), dtype=np.uint8).reshape(-1, 3).astype(np.int64)
                pcm = b[:, 0] | (b[:, 1] << 8) | (b[:, 2] << 16); pcm = np.where(pcm >= 2 ** 23, pcm - 2 ** 24, pcm)
            self.assertTrue(np.array_equal(pcm.reshape(-1, nc), np.stack(q, axis=1)), f'{tipo} {n} {nc} {hz} {bits}')
        info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=sample_rate,channels,codec_name', '-of', 'json', str(f)], capture_output=True, text=True).stdout)['streams'][0]
        self.assertEqual((int(info['sample_rate']), info['channels']), (hz, nc))

    def test_16_bits(self):
        for tipo, n, nc, hz in [('seno', 1000, 2, 44100), ('ruido', 777, 1, 8000), ('cuadrada', 4096, 2, 48000), ('silencio', 10, 1, 22050), ('seno', 5000, 2, 96000)]:
            self.comprobar(tipo, n, nc, hz, 16)

    def test_24_bits(self):
        for tipo, n, nc, hz in [('seno', 1000, 2, 44100), ('ruido', 777, 1, 48000), ('cuadrada', 2000, 2, 44100)]:
            self.comprobar(tipo, n, nc, hz, 24)

    def test_float(self):
        for tipo, n, nc, hz in [('seno', 1000, 2, 44100), ('ruido', 500, 1, 48000)]:
            self.comprobar(tipo, n, nc, hz, '32f')

    def test_un_solo_canal_y_pocas_muestras(self):
        self.comprobar('seno', 1, 1, 44100, 16); self.comprobar('seno', 3, 2, 44100, 24)

    def test_valores_fuera_de_rango_se_recortan(self):
        r = node("const x = Float32Array.from([2, -2, 0.5, 1, -1]); const w = S.wav([x], 8000, 16); fs.writeFileSync(E.f, w); console.log(1)", extra={'f': str(TMP / 'r.wav')})
        pcm = np.frombuffer(ffmpeg_pcm(TMP / 'r.wav', 's16le'), dtype='<i2')
        self.assertEqual(list(pcm), [32767, -32768, 16384, 32767, -32768])

    def test_formato_no_admitido(self):
        with self.assertRaises(AssertionError): node("S.wav([new Float32Array(3)], 8000, 12)")

@unittest.skipUnless(shutil.which('node') and FF, 'hacen falta node y ffmpeg')
class FlacTest(unittest.TestCase):
    def comprobar(self, tipo, n, nc, hz, bits):
        c = senal(tipo, n, nc, hz)
        f = TMP / 'f.flac'
        tam = node(f"const w = S.flac(c, {hz}, {bits}, H.md5); fs.writeFileSync({json.dumps(str(f))}, w); console.log(w.length)", c)
        q = np.stack(cuantiza(c, bits), axis=1)
        if bits == 16: pcm = np.frombuffer(ffmpeg_pcm(f, 's16le'), dtype='<i2').astype(np.int64)
        else:
            b = np.frombuffer(ffmpeg_pcm(f, 's32le'), dtype='<i4').astype(np.int64); pcm = b >> 8
        self.assertTrue(np.array_equal(pcm.reshape(-1, nc), q), f'{tipo} n={n} nc={nc} hz={hz} bits={bits}: las muestras no coinciden')
        # STREAMINFO: tamaño, frecuencia, canales, bits, muestras y firma MD5
        datos = f.read_bytes()
        self.assertEqual(datos[:4], b'fLaC')
        info = datos[8:42]
        v = int.from_bytes(info[10:18], 'big')
        self.assertEqual((v >> 44, ((v >> 41) & 7) + 1, ((v >> 36) & 31) + 1, v & ((1 << 36) - 1)), (hz, nc, bits, n))
        pcm_bytes = b''.join(int(x).to_bytes(bits // 8, 'little', signed=True) for x in q.flatten())
        self.assertEqual(info[18:34].hex(), hashlib.md5(pcm_bytes).hexdigest(), 'firma MD5 de STREAMINFO')
        return tam

    def test_tipos_de_senal_en_16_bits(self):
        for tipo in ['silencio', 'dc', 'seno', 'ruido', 'cuadrada', 'igual', 'contraria', 'impulso']:
            for nc in (1, 2):
                self.comprobar(tipo, 9000, nc, 44100, 16)

    def test_tipos_de_senal_en_24_bits(self):
        for tipo in ['silencio', 'seno', 'ruido', 'cuadrada', 'igual', 'contraria']:
            for nc in (1, 2):
                self.comprobar(tipo, 6000, nc, 48000, 24)

    def test_longitudes_alrededor_del_tamano_de_bloque(self):
        for n in (1, 2, 15, 16, 17, 255, 256, 257, 4095, 4096, 4097, 8191, 8192, 8193, 12345):
            self.comprobar('seno', n, 2, 44100, 16)
            self.comprobar('ruido', n, 1, 44100, 16)

    def test_frecuencias_y_canales(self):
        for hz in (8000, 11025, 22050, 32000, 44100, 48000, 88200, 96000, 192000, 12345):
            self.comprobar('seno', 5000, 2, hz, 16)
        for nc in (3, 4, 6, 8):
            self.comprobar('seno', 5000, nc, 48000, 16)

    def test_comprime_de_verdad(self):
        tam = self.comprobar('seno', 44100, 2, 44100, 16)
        self.assertLess(tam, 44100 * 4 * 0.45)
        tam = self.comprobar('silencio', 44100, 2, 44100, 16)
        self.assertLess(tam, 2000)
        tam = self.comprobar('igual', 44100, 2, 44100, 16)
        self.assertLess(tam, self.comprobar('ruido', 44100, 2, 44100, 16) * 0.55)

    def test_ruido_a_fondo_de_escala_no_rompe_nada(self):
        for bits in (16, 24):
            self.comprobar('cuadrada', 20000, 2, 44100, bits)

    def test_formato_no_admitido(self):
        with self.assertRaises(AssertionError): node("S.flac([new Float32Array(3)], 8000, 8)")
        with self.assertRaises(AssertionError): node("S.flac([], 8000, 16)")

# ------------------------------------------------------------ Ogg Opus
def paginas_ogg(datos):
    """Demultiplexor mínimo e independiente: devuelve (paquetes, paginas[(tipo, granule, serie, seq, crc_ok)])."""
    pos, paquetes, pags, parcial = 0, [], [], b''
    tabla = []
    for i in range(256):
        r = i << 24
        for _ in range(8): r = ((r << 1) ^ 0x04c11db7) & 0xffffffff if r & 0x80000000 else (r << 1) & 0xffffffff
        tabla.append(r)
    while pos < len(datos):
        assert datos[pos:pos + 4] == b'OggS', 'falta OggS en %d' % pos
        tipo = datos[pos + 5]; granule = int.from_bytes(datos[pos + 6:pos + 14], 'little'); serie = int.from_bytes(datos[pos + 14:pos + 18], 'little'); seq = int.from_bytes(datos[pos + 18:pos + 22], 'little')
        crc = int.from_bytes(datos[pos + 22:pos + 26], 'little'); ns = datos[pos + 26]; segs = datos[pos + 27:pos + 27 + ns]
        tam = 27 + ns + sum(segs); pag = bytearray(datos[pos:pos + tam]); pag[22:26] = b'\0\0\0\0'
        c = 0
        for b in pag: c = ((c << 8) ^ tabla[((c >> 24) & 255) ^ b]) & 0xffffffff
        pags.append((tipo, granule, serie, seq, c == crc, ns))
        p = pos + 27 + ns
        for s in segs:
            parcial += datos[p:p + s]; p += s
            if s < 255: paquetes.append(parcial); parcial = b''
        pos += tam
    return paquetes, pags

@unittest.skipUnless(shutil.which('node') and FF, 'hacen falta node y ffmpeg')
class OggTest(unittest.TestCase):
    def opus_real(self, nc=2, seg=3, kbps=96):
        f = TMP / f'real{nc}.opus'
        subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', f'sine=frequency=440:duration={seg}', '-f', 'lavfi', '-i', f'sine=frequency=660:duration={seg}',
                        '-filter_complex', '[0][1]amerge=inputs=2[a]' if nc == 2 else '[0]anull[a]', '-map', '[a]', '-c:a', 'libopus', '-b:a', f'{kbps}k', '-ar', '48000', str(f)], check=True)
        return f

    def remontar(self, f):
        datos = f.read_bytes(); paquetes, pags = paginas_ogg(datos)
        cab = paquetes[0]; self.assertEqual(cab[:8], b'OpusHead')
        canales, pre = cab[9], int.from_bytes(cab[10:12], 'little'); final = pags[-1][1]
        audio = paquetes[2:]
        js = f"const p = E.p.map(h => Uint8Array.from(Buffer.from(h, 'hex'))); const o = S.ogg(p, {{ canales: {canales}, preSkip: {pre}, muestras: {final - pre}, frecuencia: 48000, cabecera: Uint8Array.from(Buffer.from(E.h, 'hex')) }}); fs.writeFileSync(E.f, o); console.log(o.length)"
        node(js, extra={'p': [x.hex() for x in audio], 'h': cab.hex(), 'f': str(TMP / 'nuevo.ogg')})
        return audio, canales, pre, final

    def test_remontar_paquetes_reales_suena_igual(self):
        for nc in (1, 2):
            f = self.opus_real(nc)
            audio, canales, pre, final = self.remontar(f)
            nuevo = TMP / 'nuevo.ogg'
            a = ffmpeg_pcm(f, 'f32le'); b = ffmpeg_pcm(nuevo, 'f32le')
            self.assertEqual(a, b, 'el PCM decodificado es idéntico')
            paq2, pags = paginas_ogg(nuevo.read_bytes())
            self.assertTrue(all(p[4] for p in pags), 'todos los CRC de página son correctos')
            self.assertEqual(paq2[2:], audio, 'mismos paquetes')
            self.assertEqual(pags[0][0], 2); self.assertEqual(pags[-1][0], 4); self.assertTrue(all(p[0] == 0 for p in pags[1:-1]))
            self.assertEqual([p[3] for p in pags], list(range(len(pags))), 'números de página consecutivos')
            self.assertTrue(all(p[5] <= 255 for p in pags))
            gran = [p[1] for p in pags[2:]]; self.assertEqual(gran, sorted(gran)); self.assertEqual(pags[-1][1], final)
            def duracion(x): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(x)], capture_output=True, text=True).stdout)
            self.assertAlmostEqual(duracion(nuevo), duracion(f), places=4)

    def test_cabecera_propia_valida(self):
        paquetes = [bytes([0xf8, 0xff, 0xfe]) for _ in range(50)]           # silencio en Opus (trama de 20 ms vacía)
        node("const p = E.p.map(h => Uint8Array.from(Buffer.from(h, 'hex'))); fs.writeFileSync(E.f, S.ogg(p, { canales: 2, preSkip: 312, muestras: 48000 - 312, frecuencia: 44100 })); console.log(1)", extra={'p': [x.hex() for x in paquetes], 'f': str(TMP / 'propio.ogg')})
        paq, pags = paginas_ogg((TMP / 'propio.ogg').read_bytes())
        cab = paq[0]
        self.assertEqual((cab[:8], cab[8], cab[9], int.from_bytes(cab[10:12], 'little'), int.from_bytes(cab[12:16], 'little'), cab[18]), (b'OpusHead', 1, 2, 312, 44100, 0))
        self.assertEqual(paq[1][:8], b'OpusTags'); self.assertEqual(paq[2:], paquetes)
        pcm = ffmpeg_pcm(TMP / 'propio.ogg', 'f32le')
        self.assertEqual(len(pcm) // 8, 48000 - 312)

    def test_paquetes_de_tamanos_limite(self):
        tam = [1, 2, 254, 255, 256, 509, 510, 511, 765, 1275]
        paquetes = [bytes([i % 251]) * t for i, t in enumerate(tam * 3)]
        node("const p = E.p.map(h => Uint8Array.from(Buffer.from(h, 'hex'))); fs.writeFileSync(E.f, S.ogg(p, { canales: 1, preSkip: 0 })); console.log(1)", extra={'p': [x.hex() for x in paquetes], 'f': str(TMP / 'lim.ogg')})
        paq, pags = paginas_ogg((TMP / 'lim.ogg').read_bytes())
        self.assertEqual(paq[2:], paquetes)
        self.assertTrue(all(p[4] for p in pags))

    def test_muchos_paquetes_se_reparten_en_paginas(self):
        paquetes = [os.urandom(100) for _ in range(500)]
        node("const p = E.p.map(h => Uint8Array.from(Buffer.from(h, 'hex'))); fs.writeFileSync(E.f, S.ogg(p, { canales: 2, preSkip: 312 })); console.log(1)", extra={'p': [x.hex() for x in paquetes], 'f': str(TMP / 'mucho.ogg')})
        paq, pags = paginas_ogg((TMP / 'mucho.ogg').read_bytes())
        self.assertEqual(paq[2:], paquetes); self.assertGreater(len(pags), 5)
        self.assertTrue(all(p[4] and p[5] <= 255 for p in pags))

# ------------------------------------------------------------ Estiramiento, tono y remuestreo
def frecuencia_dominante(x, hz):
    x = np.asarray(x, dtype=np.float64); n = len(x); v = np.hanning(n)
    esp = np.abs(np.fft.rfft(x * v, 1 << (int(math.log2(n)) + 3)))
    i = int(np.argmax(esp)); f = np.fft.rfftfreq(1 << (int(math.log2(n)) + 3), 1 / hz)
    if 0 < i < len(esp) - 1:
        a, b, c = np.log(esp[i - 1] + 1e-12), np.log(esp[i] + 1e-12), np.log(esp[i + 1] + 1e-12); d = 0.5 * (a - c) / (a - 2 * b + c)
        return float((i + d) * (f[1] - f[0]))
    return float(f[i])

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class TiempoYTonoTest(unittest.TestCase):
    def salida(self, js, c):
        f = TMP / 'out.f32'
        node(js + f"; const sal = Array.isArray(r) ? r : [r]; fs.writeFileSync({json.dumps(str(f))}, Buffer.concat(sal.map(x => Buffer.from(x.buffer, x.byteOffset, x.byteLength)))); console.log(JSON.stringify(sal.map(x => x.length)))", c)
        datos = np.fromfile(f, dtype='<f4'); return datos

    def test_estirar_conserva_el_tono_y_cambia_la_duracion(self):
        hz, n = 44100, 44100 * 3
        t = np.arange(n) / hz
        for freq in (220.0, 440.0, 1000.0):
            x = (0.5 * np.sin(2 * np.pi * freq * t)).astype('<f4')
            for factor in (0.5, 0.75, 1.25, 1.5, 2.0):
                y = self.salida(f"const r = S.estirar(c, {factor}, {hz})[0]", [x])
                self.assertEqual(len(y), round(n / factor), (freq, factor))
                medio = y[len(y) // 4: 3 * len(y) // 4]
                self.assertAlmostEqual(frecuencia_dominante(medio, hz), freq, delta=freq * 0.004, msg=f'tono con factor {factor}')
                rms = float(np.sqrt(np.mean(medio.astype(np.float64) ** 2))); self.assertAlmostEqual(rms, 0.5 / math.sqrt(2), delta=0.02)
                self.assertLess(float(np.max(np.abs(np.diff(medio)))), 2 * 0.5 * 2 * math.pi * freq / hz + 0.02, f'sin saltos bruscos (factor {factor}, {freq} Hz)')

    def test_estirar_con_voz_sintetica(self):
        hz, n = 22050, 22050 * 4
        t = np.arange(n) / hz; f0 = 120 + 20 * np.sin(2 * np.pi * 3 * t); fase = 2 * np.pi * np.cumsum(f0) / hz
        x = sum((0.3 / k) * np.sin(k * fase) for k in range(1, 12)); x = (x * (0.6 + 0.4 * np.sin(2 * np.pi * 2 * t))).astype('<f4')
        for factor in (0.8, 1.3, 1.8):
            y = self.salida(f"const r = S.estirar(c, {factor}, {hz})[0]", [x])
            self.assertEqual(len(y), round(n / factor))
            self.assertAlmostEqual(float(np.sqrt(np.mean(y.astype(np.float64) ** 2))), float(np.sqrt(np.mean(x.astype(np.float64) ** 2))), delta=0.05)
            self.assertLessEqual(float(np.max(np.abs(y))), float(np.max(np.abs(x))) * 1.1)

    def test_estirar_estereo_y_factor_uno(self):
        hz, n = 44100, 44100
        t = np.arange(n) / hz; x = (0.4 * np.sin(2 * np.pi * 300 * t)).astype('<f4')
        y = self.salida(f"const r = S.estirar(c, 1.5, {hz})", [x, x]); m = len(y) // 2
        self.assertTrue(np.array_equal(y[:m], y[m:]), 'canales iguales siguen siendo iguales')
        z = self.salida(f"const r = S.estirar(c, 1, {hz})", [x, -x]); k = len(z) // 2
        self.assertTrue(np.array_equal(z[:k], x) and np.array_equal(z[k:], -x), 'factor 1 devuelve lo mismo')
        corto = self.salida(f"const r = S.estirar(c, 2, {hz})", [x[:100]]); self.assertEqual(len(corto), 50)

    def test_cambiar_tono(self):
        hz, n = 44100, 44100 * 2
        t = np.arange(n) / hz; x = (0.5 * np.sin(2 * np.pi * 440 * t)).astype('<f4')
        for factor, esperado in ((2.0, 880.0), (0.5, 220.0), (1.5, 660.0)):
            y = self.salida(f"const r = S.cambiarTono(c, {factor})[0]", [x])
            self.assertEqual(len(y), int(n / factor)); self.assertAlmostEqual(frecuencia_dominante(y[100:-100], hz), esperado, delta=esperado * 0.003)

    def test_remuestrear(self):
        hz, n = 44100, 44100
        t = np.arange(n) / hz; x = (0.5 * np.sin(2 * np.pi * 440 * t)).astype('<f4')
        for destino in (48000, 22050, 16000, 8000, 96000):
            y = self.salida(f"const r = S.remuestrear(c[0], {hz}, {destino})", [x])
            self.assertEqual(len(y), int(n * destino / hz))
            self.assertAlmostEqual(frecuencia_dominante(y[200:-200], destino), 440.0, delta=1.0)
            rms = float(np.sqrt(np.mean(y[200:-200].astype(np.float64) ** 2))); self.assertAlmostEqual(rms, 0.5 / math.sqrt(2), delta=0.015, msg=f'amplitud a {destino}')
        # una señal por encima de la nueva frecuencia de Nyquist se atenúa mucho
        alta = (0.5 * np.sin(2 * np.pi * 15000 * t)).astype('<f4')
        y = self.salida(f"const r = S.remuestrear(c[0], {hz}, 22050)", [alta])
        self.assertLess(float(np.sqrt(np.mean(y[100:-100].astype(np.float64) ** 2))), 0.5 / math.sqrt(2) * 0.2)

    def test_operaciones_sencillas(self):
        x = np.array([0.5, -1.0, 0.25, 2.0, -0.5], dtype='<f4')
        r = node("console.log(JSON.stringify([S.picos(c), Array.from(S.ganancia(c, 0.5)[0]), Array.from(S.recortar(c, 1, 3)[0]), Array.from(S.recortar(c, -5, 99)[0]).length, Array.from(S.normalizar(c)[0]), Array.from(S.aMono([c[0], new Float32Array(c[0].length)])[0])]))", [x])
        self.assertEqual(r[0], {'max': 2.0, 'saturadas': 1}); self.assertEqual(r[1], [0.25, -0.5, 0.125, 1.0, -0.25]); self.assertEqual(r[2], [-1.0, 0.25]); self.assertEqual(r[3], 5)
        self.assertEqual(r[4], [0.25, -0.5, 0.125, 1.0, -0.25]); self.assertEqual(r[5], [0.25, -0.5, 0.125, 1.0, -0.25])

    def test_unir_con_pausa_y_canales_distintos(self):
        r = node("const a = [Float32Array.from([1, 2])], b = [Float32Array.from([3]), Float32Array.from([4])], u = S.unir([a, b], 2); console.log(JSON.stringify(u.map(x => Array.from(x))))", [np.zeros(1)])
        self.assertEqual(r, [[1, 2, 0, 0, 3], [1, 2, 0, 0, 4]])

    def test_fundidos(self):
        r = node("const x = [new Float32Array(10).fill(1)], f = S.fundidos(x, 4, 5)[0]; console.log(JSON.stringify(Array.from(f)))", [np.zeros(1)])
        esperado = [0, 0.25, 0.5, 0.75, 1, 1, 1, 1, 1, 1]            # entrada de 4 muestras
        for i in range(10):
            ent = i / 4 if i < 4 else 1
            sal = (9 - i) / 5 if (9 - i) < 5 else 1
            self.assertAlmostEqual(r[i], min(ent, sal), places=6, msg=f'muestra {i}')

    def test_tiempo(self):
        r = node("console.log(JSON.stringify([S.tiempo(0), S.tiempo(59.96), S.tiempo(61.5), S.tiempo(3599.9), S.tiempo(-3), S.leerTiempo('90'), S.leerTiempo('90,5'), S.leerTiempo('1:30'), S.leerTiempo('1:30,5'), S.leerTiempo('01:02:03'), S.leerTiempo('1:75'), S.leerTiempo('abc'), S.leerTiempo(''), S.leerTiempo('-1'), S.leerTiempo('1.5')]))")
        self.assertEqual(r, ['0:00,0', '1:00,0', '1:01,5', '59:59,9', '0:00,0', 90, 90.5, 90, 90.5, 3723, None, None, None, None, 1.5])

# ------------------------------------------------------------ Tono (YIN) y notas
@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class TonoTest(unittest.TestCase):
    CUERDAS = {'E2': 82.4069, 'A2': 110.0, 'D3': 146.8324, 'G3': 195.9977, 'B3': 246.9417, 'E4': 329.6276, 'E1': 41.2034, 'C4': 261.6256, 'A4': 440.0, 'E5': 659.2551}

    def detectar(self, x, hz, extra=''):
        r = node(f"const t = S.tono(c[0], {hz}{extra}); console.log(JSON.stringify(t))", [x]); return r

    def test_senos_puros_en_las_cuerdas(self):
        for hz in (44100, 48000):
            for nombre, f in self.CUERDAS.items():
                n = 4096; t = np.arange(n) / hz; x = (0.4 * np.sin(2 * np.pi * f * t)).astype('<f4')
                r = self.detectar(x, hz, ', { min: 30 }')
                self.assertIsNotNone(r, f'{nombre} a {hz}')
                cents = 1200 * math.log2(r['hz'] / f); self.assertLess(abs(cents), 1.0, f'{nombre} a {hz} Hz: {cents:.2f} cents')

    def test_sonido_rico_en_armonicos_con_fundamental_debil(self):
        for nombre, f in self.CUERDAS.items():
            hz = 44100; n = 4096; t = np.arange(n) / hz
            x = sum(a * np.sin(2 * np.pi * f * k * t + k) for k, a in zip(range(1, 7), (0.15, 0.4, 0.3, 0.2, 0.1, 0.05))).astype('<f4')
            r = self.detectar(x, hz, ', { min: 30 }')
            self.assertIsNotNone(r, nombre); self.assertLess(abs(1200 * math.log2(r['hz'] / f)), 3.0, f'{nombre}: {r}')

    def test_con_ruido(self):
        rng = np.random.default_rng(7); hz = 44100; n = 8192; t = np.arange(n) / hz
        for nombre in ('E2', 'A2', 'D3', 'G3', 'B3', 'E4'):
            f = self.CUERDAS[nombre]; x = (0.4 * np.sin(2 * np.pi * f * t) + 0.04 * rng.standard_normal(n)).astype('<f4')
            r = self.detectar(x, hz)
            self.assertIsNotNone(r, nombre); self.assertLess(abs(1200 * math.log2(r['hz'] / f)), 8.0, f'{nombre}: {r}')

    def test_silencio_y_ruido_no_dan_tono(self):
        hz = 44100; n = 4096
        self.assertIsNone(self.detectar(np.zeros(n, dtype='<f4'), hz))
        self.assertIsNone(self.detectar((0.0005 * np.sin(np.arange(n) * 0.05)).astype('<f4'), hz))
        rng = np.random.default_rng(3); ruido = [rng.standard_normal(n).astype('<f4') * 0.2 for _ in range(10)]
        cuenta = 0
        for x in ruido:
            r = self.detectar(x, hz)
            if r is not None and r['claridad'] > 0.9: cuenta += 1
        self.assertLessEqual(cuenta, 1, 'el ruido blanco casi nunca parece un tono claro')

    def test_notas(self):
        r = node("console.log(JSON.stringify([440, 261.6256, 82.4069, 450, 27.5, 4186.009, 415.3047].map(h => S.nota(h)).concat([S.nota(442, 442), S.nota(432, 432), S.frecuenciaDeNota(69), S.frecuenciaDeNota(40), S.frecuenciaDeNota(69, 432)])))")
        esperado = [('La', 'A', 4, 0), ('Do', 'C', 4, 0), ('Mi', 'E', 2, 0), ('La', 'A', 4, 38.9), ('La', 'A', 0, 0), ('Do', 'C', 8, 0), ('Sol♯', 'G♯', 4, 0)]
        for obtenido, (n, l, o, c) in zip(r[:7], esperado):
            self.assertEqual((obtenido['nombre'], obtenido['letra'], obtenido['octava']), (n, l, o)); self.assertAlmostEqual(obtenido['cents'], c, delta=0.1)
        self.assertEqual((r[7]['nombre'], round(r[7]['cents'], 6)), ('La', 0)); self.assertEqual((r[8]['nombre'], round(r[8]['cents'], 6)), ('La', 0))
        self.assertAlmostEqual(r[9], 440.0); self.assertAlmostEqual(r[10], 82.4069, places=3); self.assertAlmostEqual(r[11], 432.0)

if __name__ == '__main__':
    try: unittest.main()
    finally: shutil.rmtree(TMP, ignore_errors=True)

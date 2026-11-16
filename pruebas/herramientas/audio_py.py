"""Ayudas en Python para comprobar desde fuera del navegador los audios que entregan las herramientas (ffmpeg, ffprobe y numpy).
Se usa desde audio.mjs: python3 -c "import sys; sys.path.insert(0, DIR); from audio_py import *; ..." """
import json, math, subprocess
import numpy as np

def info(ruta):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,sample_rate,channels,bits_per_sample,bits_per_raw_sample:format=duration', '-of', 'json', ruta], capture_output=True, text=True)
    d = json.loads(r.stdout)
    s = d['streams'][0]
    return {'codec': s['codec_name'], 'hz': int(s['sample_rate']), 'canales': s['channels'], 'dur': float(d['format']['duration']), 'bits': int(s.get('bits_per_raw_sample') or s.get('bits_per_sample') or 0)}

def pcm(ruta, fmt='s16le', estricto=True):
    """Muestras como matriz (n, canales). Con estricto, ffmpeg comprueba los CRC de FLAC y falla ante cualquier error."""
    i = info(ruta)
    cmd = ['ffmpeg', '-hide_banner', '-loglevel', 'error'] + (['-err_detect', '+crccheck+explode'] if estricto else []) + ['-i', ruta, '-f', fmt, '-']
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode: raise RuntimeError(r.stderr.decode()[-800:])
    dt = {'s16le': '<i2', 'f32le': '<f4', 's32le': '<i4'}[fmt]
    return np.frombuffer(r.stdout, dtype=dt).reshape(-1, i['canales'])

def frecuencia(x, hz):
    x = np.asarray(x, dtype=np.float64)
    n = len(x); v = np.hanning(n); m = 1 << (int(math.log2(n)) + 3)
    esp = np.abs(np.fft.rfft(x * v, m)); i = int(np.argmax(esp)); f = np.fft.rfftfreq(m, 1 / hz)
    if 0 < i < len(esp) - 1:
        a, b, c = np.log(esp[i - 1] + 1e-12), np.log(esp[i] + 1e-12), np.log(esp[i + 1] + 1e-12); d = 0.5 * (a - c) / (a - 2 * b + c)
        return float((i + d) * (f[1] - f[0]))
    return float(f[i])

def amplitud_en(x, hz, f):
    """Amplitud (pico) de la componente de frecuencia f, por correlación con seno y coseno."""
    x = np.asarray(x, dtype=np.float64); t = np.arange(len(x)) / hz
    return float(2 * math.hypot(np.mean(x * np.sin(2 * np.pi * f * t)), np.mean(x * np.cos(2 * np.pi * f * t))))

def snr_alineado(a, b, maximo=3000):
    """Relación señal/ruido (dB) de b respecto a a probando desfases de -maximo a maximo; devuelve (snr, desfase)."""
    a = np.asarray(a, dtype=np.float64).ravel() if a.ndim == 1 else np.asarray(a, dtype=np.float64)[:, 0]
    b = np.asarray(b, dtype=np.float64).ravel() if b.ndim == 1 else np.asarray(b, dtype=np.float64)[:, 0]
    mejor = (-1e9, 0)
    for d in range(-maximo, maximo + 1, 1):
        if d >= 0: x, y = a[d:], b[:len(b)]
        else: x, y = a[:], b[-d:]
        m = min(len(x), len(y), 40000)
        if m < 1000: continue
        x = x[1000:m]; y = y[1000:m]
        e = float(np.sum((x - y) ** 2)); s = float(np.sum(x ** 2))
        snr = 10 * math.log10(s / e) if e > 0 else 200.0
        if snr > mejor[0]: mejor = (snr, d)
    return mejor

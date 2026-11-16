"""El azar del sitio (herramientas/datos/lib/azar.js): rangos correctos, reparto uniforme (sin sesgo de módulo), mezclas que son permutaciones
y rechazo de valores con una fuente de bytes controlada."""
import json, shutil, subprocess, unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib' / 'azar.js'

def node(js):
    r = subprocess.run(['node', '-e', f"const A = require({json.dumps(str(LIB))}); {js}"], capture_output=True, text=True, timeout=300)
    if r.returncode: raise AssertionError(r.stderr[-1500:])
    return json.loads(r.stdout)

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class AzarTest(unittest.TestCase):
    def test_rangos(self):
        r = node("let min=1e9,max=-1; for(let i=0;i<20000;i++){const v=A.entero(7); min=Math.min(min,v); max=Math.max(max,v);} console.log(JSON.stringify([min,max,A.entero(1),A.entre(5,5),A.entre(-3,-3)]))")
        self.assertEqual(r, [0, 6, 0, 5, -3])

    def test_entre_incluye_extremos(self):
        r = node("const s=new Set(); for(let i=0;i<3000;i++) s.add(A.entre(-2,2)); console.log(JSON.stringify([...s].sort((a,b)=>a-b)))")
        self.assertEqual(r, [-2, -1, 0, 1, 2])

    def test_reparto_uniforme(self):
        # 6 caras, 60000 tiradas: cada cara ~10000 (desviación típica ~91); se admite ±600 (6 sigmas)
        r = node("const c=[0,0,0,0,0,0]; for(let i=0;i<60000;i++) c[A.entero(6)]++; console.log(JSON.stringify(c))")
        for n in r:
            self.assertTrue(abs(n - 10000) < 600, r)

    def test_sin_sesgo_de_modulo(self):
        # con n = 3·2^30 un módulo simple daría el doble de peso a los valores bajos; con rechazo, cada tercio cuenta igual
        r = node("const n=3*Math.pow(2,30), c=[0,0,0]; for(let i=0;i<30000;i++) c[Math.floor(A.entero(n)/Math.pow(2,30))]++; console.log(JSON.stringify(c))")
        for n in r:
            self.assertTrue(abs(n - 10000) < 600, r)

    def test_rechazo_con_fuente_controlada(self):
        # n = 3: el límite es 4294967295; el valor 0xFFFFFFFF se rechaza y se pide otro
        r = node("const seq=[[255,255,255,255],[0,0,0,5]]; let k=0; A.fuente=b=>{const s=seq[k++]; b.set(s); return b;}; console.log(JSON.stringify([A.entero(3), k]))")
        self.assertEqual(r, [2, 2])

    def test_enteros_grandes(self):
        r = node("let ok=true; for(let i=0;i<500;i++){const v=A.entre(0,Number.MAX_SAFE_INTEGER); if(!(Number.isSafeInteger(v)&&v>=0)) ok=false;} const m=A.entre(10**15,10**15+9); console.log(JSON.stringify([ok, m>=10**15 && m<=10**15+9]))")
        self.assertEqual(r, [True, True])

    def test_barajar_es_permutacion(self):
        r = node("const l=Array.from({length:50},(_,i)=>i); let ok=true,dist=false; for(let i=0;i<200;i++){const b=A.barajar(l); if([...b].sort((x,y)=>x-y).join()!==l.join()) ok=false; if(b.join()!==l.join()) dist=true;} console.log(JSON.stringify([ok,dist,l.join()===Array.from({length:50},(_,i)=>i).join()]))")
        self.assertEqual(r, [True, True, True])

    def test_barajar_uniforme_en_tres(self):
        r = node("const c={}; for(let i=0;i<60000;i++){const k=A.barajar([1,2,3]).join(''); c[k]=(c[k]||0)+1;} console.log(JSON.stringify(c))")
        self.assertEqual(len(r), 6)
        for n in r.values():
            self.assertTrue(abs(n - 10000) < 600, r)

    def test_muestra(self):
        r = node("let ok=true; const l=[...'abcdefghij']; for(let i=0;i<300;i++){const m=A.muestra(l,4); if(new Set(m).size!==4||m.some(x=>!l.includes(x))) ok=false;} let e=null; try{A.muestra(l,11)}catch(x){e=x.name} console.log(JSON.stringify([ok,A.muestra(l,0).length,A.muestra(l,10).length,e]))")
        self.assertEqual(r, [True, 0, 10, 'RangeError'])

    def test_errores(self):
        r = node("const e=[]; for (const f of [()=>A.entero(0),()=>A.entero(1.5),()=>A.entre(3,2),()=>A.elegir([])]) { try{f(); e.push('no')}catch(x){e.push(x.name)} } console.log(JSON.stringify(e))")
        self.assertEqual(r, ['RangeError'] * 4)

if __name__ == '__main__':
    unittest.main()

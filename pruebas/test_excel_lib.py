"""herramientas/datos/lib/excel.js: del CSV al libro .xlsx. Se construye el libro con el código de la librería, se empaqueta con zipfile y se abre con openpyxl (que lo lee como lo haría un programa externo):
comprueba tipos (número, fecha, texto), ceros a la izquierda, decimales con coma, cabecera en negrita con fila fija y filtro, varias hojas con nombres válidos, caracteres especiales y que nada se evalúe como fórmula."""
import io, json, shutil, subprocess, unittest, zipfile
from pathlib import Path

LIB = Path(__file__).resolve().parent.parent / 'herramientas' / 'datos' / 'lib' / 'excel.js'

def js(expr):
    r = subprocess.run(['node', '-e', f"const X=require({json.dumps(str(LIB))}); console.log(JSON.stringify({expr}))"], capture_output=True, text=True, timeout=60)
    if r.returncode: raise AssertionError(r.stderr[-1500:])
    return json.loads(r.stdout)

def libro(hojas, op=None):
    r = js(f'X.libro({json.dumps(hojas)}, {json.dumps(op or {})})')
    b = io.BytesIO()
    with zipfile.ZipFile(b, 'w', zipfile.ZIP_DEFLATED) as z:
        for ruta, txt in r['archivos'].items(): z.writestr(ruta, txt)
    b.seek(0); return b, r

try:
    import openpyxl
except ImportError: openpyxl = None

@unittest.skipUnless(shutil.which('node') and openpyxl, 'hace falta node y openpyxl')
class ExcelTest(unittest.TestCase):
    def test_csv_y_separador(self):
        self.assertEqual(js('X.detectarSeparador("a;b;c\\n1;2;3")'), ';'); self.assertEqual(js('X.detectarSeparador("a\\tb\\n1\\t2")'), '\\t'.encode().decode('unicode_escape'))
        self.assertEqual(js('X.analizarCsv("a,\\"b,c\\",\\"d\\"\\"e\\"\\n1,2,3", ",").filas'), [['a', 'b,c', 'd"e'], ['1', '2', '3']])
        self.assertEqual(js('X.analizarCsv("x,\\"línea1\\nlínea2\\"\\n", ",").filas'), [['x', 'línea1\nlínea2']])
        self.assertIn('comillas', js('X.analizarCsv("a,\\"b", ",")')['error'])

    def test_tipos_de_celda(self):
        casos = [('12', {'t': 'n', 'v': 12}), ('-3.5', {'t': 'n', 'v': -3.5}), ('007', {'t': 's', 'v': '007'}), ('+34600111222', {'t': 's', 'v': '+34600111222'}), ('1234567890123456', {'t': 's', 'v': '1234567890123456'}), ('hola', {'t': 's', 'v': 'hola'}),
                 ('2026-03-15', {'t': 'd', 'v': 46096}), ('15/03/2026', {'t': 'd', 'v': 46096}), ('2026-02-30', {'t': 's', 'v': '2026-02-30'}), ('15/03/2026 12:00', {'t': 'f', 'v': 46096.5}), ('1.234,56', {'t': 's', 'v': '1.234,56'}), ('1,234.56', {'t': 'n', 'v': 1234.56})]
        for texto, esperado in casos:
            self.assertEqual(js(f'X.celda({json.dumps(texto)}, {{}})'), esperado, texto)
        self.assertIsNone(js('X.celda("   ", {})'))
        self.assertEqual(js('X.celda("1.234,56", {numeros: "coma"})'), {'t': 'n', 'v': 1234.56}); self.assertEqual(js('X.celda("3,14", {numeros: "coma"})'), {'t': 'n', 'v': 3.14})
        self.assertEqual(js('X.celda("12", {numeros: "texto"})'), {'t': 's', 'v': '12'}); self.assertEqual(js('X.celda("2026-03-15", {fechas: false})'), {'t': 's', 'v': '2026-03-15'})
        self.assertEqual(js('X.tipoDeNumeros([["1,5","2,25"],["3,1","x"]])'), 'coma'); self.assertEqual(js('X.tipoDeNumeros([["1.5","2.25"]])'), 'punto')

    def test_libro_se_abre_con_openpyxl(self):
        filas = [['Nombre', 'Edad', 'Fecha', 'Saldo', 'Código'], ['Ana', '30', '15/03/2026', '1250.5', '007'], ['Luis', '25', '2026-03-16', '980', '010'], ['«Mª José»', '41', '', '=1+1', 'A&B <x>']]
        b, r = libro([{'nombre': 'Datos', 'filas': filas}], {'cabecera': True, 'numeros': 'punto'})
        wb = openpyxl.load_workbook(b); ws = wb['Datos']
        self.assertEqual(wb.sheetnames, ['Datos']); self.assertEqual(ws.max_row, 4); self.assertEqual(ws.max_column, 5)
        self.assertTrue(ws['A1'].font.b); self.assertFalse(ws['A2'].font.b)
        self.assertEqual(ws.freeze_panes, 'A2'); self.assertEqual(ws.auto_filter.ref, 'A1:E4')
        self.assertEqual(ws['B2'].value, 30); self.assertIsInstance(ws['B2'].value, int)
        self.assertEqual(str(ws['C2'].value)[:10], '2026-03-15'); self.assertEqual(str(ws['C3'].value)[:10], '2026-03-16')
        self.assertEqual(ws['D2'].value, 1250.5); self.assertEqual(ws['E2'].value, '007'); self.assertEqual(ws['E3'].value, '010')
        self.assertIsNone(ws['C4'].value)
        self.assertEqual(ws['D4'].value, '=1+1'); self.assertEqual(ws['D4'].data_type, 's', 'un texto que empieza por = no debe ser una fórmula')
        self.assertEqual(ws['E4'].value, 'A&B <x>'); self.assertEqual(ws['A4'].value, '«Mª José»')
        self.assertGreaterEqual(ws.column_dimensions['A'].width, 8)

    def test_sin_cabecera_ni_fila_fija(self):
        b, _ = libro([{'nombre': 'H', 'filas': [['a', '1'], ['b', '2']]}], {'cabecera': False})
        ws = openpyxl.load_workbook(b)['H']; self.assertIsNone(ws.freeze_panes); self.assertIsNone(ws.auto_filter.ref); self.assertFalse(ws['A1'].font.b)

    def test_numeros_con_coma_y_fecha_con_hora(self):
        b, _ = libro([{'nombre': 'H', 'filas': [['1.234,56', '3,14', '15/03/2026 18:30']]}], {'numeros': 'coma'})
        ws = openpyxl.load_workbook(b)['H']; self.assertEqual(ws['A1'].value, 1234.56); self.assertEqual(ws['B1'].value, 3.14)
        self.assertEqual((ws['C1'].value.year, ws['C1'].value.hour, ws['C1'].value.minute), (2026, 18, 30)); self.assertIn('hh', ws['C1'].number_format)

    def test_varias_hojas_y_nombres(self):
        b, r = libro([{'nombre': 'Ventas: 2026/1', 'filas': [['a']]}, {'nombre': 'Ventas: 2026/1', 'filas': [['b']]}, {'nombre': '', 'filas': [['c']]}, {'nombre': 'x' * 50, 'filas': [['d']]}])
        wb = openpyxl.load_workbook(b); self.assertEqual(len(set(n.lower() for n in wb.sheetnames)), 4)
        self.assertTrue(all(len(n) <= 31 and not any(c in n for c in '[]:*?/\\') for n in wb.sheetnames), wb.sheetnames)
        self.assertEqual(wb[wb.sheetnames[1]]['A1'].value, 'b')
        self.assertEqual(js('X.nombreHoja("Hola", ["hola"])'), 'Hola (2)')

    def test_caracteres_de_control_y_textos_largos(self):
        b, r = libro([{'nombre': 'H', 'filas': [['a\x01b\x0bc', 'x' * 40000, 'dos\nlíneas']]}])
        ws = openpyxl.load_workbook(b)['H']; self.assertEqual(ws['A1'].value, 'abc'); self.assertEqual(len(ws['B1'].value), 32767); self.assertEqual(ws['C1'].value, 'dos\nlíneas'); self.assertTrue(r['avisos'])

    def test_limites_de_excel(self):
        with self.assertRaises(AssertionError) as e: js('X.libro([{nombre: "H", filas: Array.from({length: 1048577}, () => ["a"])}], {})')
        self.assertIn('1.048.576', str(e.exception).replace('\\u202f', '.'))  # el mensaje del error de node lo contiene
        with self.assertRaises(AssertionError): js('X.libro([], {})')

    def test_referencias(self):
        self.assertEqual([js(f'X.referencia({c}, 1)') for c in (0, 25, 26, 51, 52, 701, 702, 16383)], ['A1', 'Z1', 'AA1', 'AZ1', 'BA1', 'ZZ1', 'AAA1', 'XFD1'])

if __name__ == '__main__': unittest.main()

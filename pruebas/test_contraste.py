# -*- coding: utf-8 -*-
"""Contraste de la paleta (WCAG 2.x). Lee los colores de comun/tokens.css, así que si cambias un color y deja de leerse, esta prueba falla.

Cada par es «texto sobre fondo» tal y como se usa en el CSS del sitio. Mínimos:
    4.5  texto normal
    3.0  texto grande (≥ 24 px, o ≥ 18,7 px en negrita) y componentes de interfaz (bordes de campos, foco)

Ejecutar: python3 pruebas/test_contraste.py
"""
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from motor.secciones import contraste  # noqa: E402

TOKENS = Path(__file__).resolve().parent.parent / "comun" / "tokens.css"

# (texto, fondo, mínimo, dónde se usa)
PARES = [
    # Mundo «Trabajo»: tinta pizarra sobre papel
    ("pizarra", "papel-trabajo", 4.5, "texto de herramientas/recursos sobre la franja de papel"),
    ("pizarra", "lienzo", 4.5, "texto de cabecera y cuerpo sobre el lienzo"),
    ("pizarra", "papel", 4.5, "texto en tarjetas blancas"),
    ("tinta", "lienzo", 4.5, "texto principal"),
    ("tinta", "papel", 4.5, "texto principal en tarjetas"),
    ("tinta-suave", "lienzo", 4.5, "fechas y textos secundarios"),
    ("tinta-suave", "papel", 4.5, "fechas y textos secundarios en tarjetas"),
    ("pizarra-media", "papel", 4.5, "nombre de la sección en una tarjeta de trabajo"),
    ("pizarra-media", "lienzo", 4.5, "idem sobre el lienzo"),
    ("tiza", "pizarra", 4.5, "texto de la franja oscura de herramientas"),
    ("limon", "pizarra", 4.5, "subrayador y detalles sobre pizarra"),
    # Mundo «Juego»: pantalla apagada con tiza y neón
    ("tiza", "tinta", 4.5, "texto principal de los juegos"),
    ("tiza", "noche-2", 4.5, "texto dentro de paneles oscuros"),
    ("tiza-suave", "tinta", 4.5, "texto secundario sobre fondo oscuro (pie, resúmenes)"),
    ("tiza-suave", "noche-2", 4.5, "texto secundario sobre paneles oscuros"),
    ("sandia", "tinta", 4.5, "títulos en píxeles y enlaces sobre fondo oscuro"),
    ("sandia", "noche-2", 4.5, "idem sobre panel"),
    ("limon", "tinta", 4.5, "cursor, etiquetas y foco sobre fondo oscuro"),
    ("limon", "noche-2", 4.5, "idem sobre panel"),
    ("tinta", "limon", 4.5, "texto de botones sobre limón"),
    ("pizarra", "limon", 4.5, "texto de botones y señales sobre limón"),
    # Marca en fondo claro
    ("sandia-texto", "lienzo", 4.5, "«JUEGO» del logo y el subrayado activo en la cabecera"),
    ("sandia-texto", "papel", 4.5, "idem sobre blanco"),
    # Componentes de interfaz (bordes visibles, foco)
    ("pizarra", "lienzo", 3.0, "borde de campos y tarjetas de trabajo"),
    ("noche-linea", "tinta", 1.5, "separadores decorativos oscuros (no llevan información)"),
]


def leer_tokens() -> dict:
    texto = TOKENS.read_text(encoding="utf-8")
    colores = dict(re.findall(r"--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\b", texto))
    return {k: v.upper() for k, v in colores.items()}


class PaletaLegible(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.colores = leer_tokens()

    def test_se_leen_los_colores_de_marca(self):
        for nombre in ("pizarra", "papel-trabajo", "sandia", "sandia-texto", "limon", "tinta", "tiza", "tiza-suave", "noche-2", "lienzo", "papel"):
            self.assertIn(nombre, self.colores, f"falta --{nombre} en comun/tokens.css")

    def test_todos_los_pares(self):
        fallos = []
        for texto, fondo, minimo, uso in PARES:
            if texto not in self.colores or fondo not in self.colores:
                fallos.append(f"--{texto} / --{fondo}: alguno no está definido en tokens.css")
                continue
            ratio = contraste(self.colores[texto], self.colores[fondo])
            if ratio < minimo:
                fallos.append(f"--{texto} ({self.colores[texto]}) sobre --{fondo} ({self.colores[fondo]}): {ratio:.2f}:1, "
                              f"mínimo {minimo}:1 ({uso})")
        self.assertEqual(fallos, [], "\n" + "\n".join(fallos))

    def test_sandia_sobre_pizarra_solo_vale_para_texto_grande(self):
        """Documenta una limitación conocida: --sandia sobre --pizarra no llega a 4.5. Si algún día llega, esta prueba avisa para poder usarlo."""
        ratio = contraste(self.colores["sandia"], self.colores["pizarra"])
        self.assertGreaterEqual(ratio, 3.0, "ni siquiera sirve para texto grande")
        self.assertLess(ratio, 4.5, "ya llega a 4.5: puedes quitar esta nota de docs/ESTILO.md")


if __name__ == "__main__":
    unittest.main(verbosity=2)

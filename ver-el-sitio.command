#!/bin/sh
cd "$(dirname "$0")" || exit 1
echo "Abriendo TrabajoYJuego en el navegador. Para parar, cierra esta ventana o pulsa Ctrl+C."
python3 sitio.py servir

@echo off
cd /d "%~dp0"
echo Abriendo TrabajoYJuego en el navegador. Para parar, cierra esta ventana.
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 sitio.py servir
) else (
  python sitio.py servir
)
if errorlevel 1 (
  echo.
  echo No se ha podido arrancar. Comprueba que Python 3.11 o superior esta instalado ^(https://www.python.org/downloads/^).
  echo Al instalarlo, marca la casilla "Add python.exe to PATH".
)
pause

/* Codificador MP3 (MPEG-1 Capa III) en JavaScript puro, sin librerías y sin peticiones de red. Se carga con TH.script('lib/mp3.js') y queda en TH.mp3.
   Qué hace: convierte audio ya decodificado (canales de Float32Array entre -1 y 1) a un archivo MP3 de tasa constante (CBR), mono o estéreo, a 32, 44,1 o 48 kHz.
   Cómo: banco de filtros polifásico de 32 bandas, MDCT de 36 puntos con solapamiento, reducción de aliasing, cuantización con un único paso de ganancia por bloque
   (elegido para llenar el espacio disponible), codificación Huffman con las tablas del estándar y reserva de bits entre tramas. Estéreo conjunto (M/S) cuando compensa.
   Límites: no usa modelo psicoacústico ni conmutación de bloques; a tasas de 128 kb/s o más la calidad es buena, y por debajo de 96 kb/s se nota más.
   Verificado en pruebas/test_mp3_lib.py: ffmpeg decodifica los archivos sin errores, con la ganancia y la frecuencia correctas, en mono, estéreo y M/S.
   TH.mp3.TASAS                                   → tasas admitidas en kb/s
   TH.mp3.frecuenciaDestino(hz)                   → frecuencia a la que se codifica (32000, 44100 o 48000)
   TH.mp3.codificar(canales, hz, kbps, progreso)  → Promise<Uint8Array> (canales: [Float32Array...]; hz: frecuencia de los canales; progreso(0..1))
   Las tablas de Huffman y la ventana del banco de filtros son los datos normativos de ISO/IEC 11172-3. */
(function (global) {
  'use strict';
  var M = {};

  var VENT = [0,-1,-1,-1,-1,-1,-1,-2,-2,-2,-2,-3,-3,-4,-4,-5,-5,-6,-7,-7,-8,-9,-10,-11,-13,-14,-16,-17,-19,-21,-24,-26,-29,-31,-35,-38,-41,-45,-49,-53,-58,-63,-68,-73,-79,-85,-91,-97,-104,-111,-117,-125,-132,-139,-147,-154,-161,-169,-176,-183,-190,-196,-202,-208,213,218,222,225,227,228,228,227,224,221,215,208,200,189,177,163,146,127,106,83,57,29,-2,-36,-72,-111,-153,-197,-244,-294,-347,-401,-459,-519,-581,-645,-711,-779,-848,-919,-991,-1064,-1137,-1210,-1283,-1356,-1428,-1498,-1567,-1634,-1698,-1759,-1817,-1870,-1919,-1962,-2001,-2032,-2057,-2075,-2085,-2087,-2080,-2063,2037,2000,1952,1893,1822,1739,1644,1535,1414,1280,1131,970,794,605,402,185,-45,-288,-545,-814,-1095,-1388,-1692,-2006,-2330,-2663,-3004,-3351,-3705,-4063,-4425,-4788,-5153,-5517,-5879,-6237,-6589,-6935,-7271,-7597,-7910,-8209,-8491,-8755,-8998,-9219,-9416,-9585,-9727,-9838,-9916,-9959,-9966,-9935,-9863,-9750,-9592,-9389,-9139,-8840,-8492,-8092,-7640,-7134,6574,5959,5288,4561,3776,2935,2037,1082,70,-998,-2122,-3300,-4533,-5818,-7154,-8540,-9975,-11455,-12980,-14548,-16155,-17799,-19478,-21189,-22929,-24694,-26482,-28289,-30112,-31947,-33791,-35640,-37489,-39336,-41176,-43006,-44821,-46617,-48390,-50137,-51853,-53534,-55178,-56778,-58333,-59838,-61289,-62684,-64019,-65290,-66494,-67629,-68692,-69679,-70590,-71420,-72169,-72835,-73415,-73908,-74313,-74630,-74856,-74992,75038];
  var HUF = {
    1: [2, [1,3,2,3], [1,1,1,0]],
    2: [3, [1,3,6,3,3,5,5,5,6], [1,2,1,3,1,1,3,2,0]],
    3: [3, [2,2,6,3,2,5,5,5,6], [3,2,1,1,1,1,3,2,0]],
    5: [4, [1,3,6,7,3,3,6,7,6,6,7,8,7,6,7,8], [1,2,6,5,3,1,4,4,7,5,7,1,6,1,1,0]],
    6: [4, [3,3,5,7,3,2,4,5,4,4,5,6,6,5,6,7], [7,3,5,1,6,2,3,2,5,4,4,1,3,3,2,0]],
    7: [6, [1,3,6,8,8,9,3,4,6,7,7,8,6,5,7,8,8,9,7,7,8,9,9,9,7,7,8,9,9,10,8,8,9,10,10,10], [1,2,10,19,16,10,3,3,7,10,5,3,11,4,13,17,8,4,12,11,18,15,11,2,7,6,9,14,3,1,6,4,5,3,2,0]],
    8: [6, [2,3,6,8,8,9,3,2,4,8,8,8,6,4,6,8,8,9,8,8,8,9,9,10,8,7,8,9,10,10,9,8,9,9,11,11], [3,4,6,18,12,5,5,1,2,16,9,3,7,3,5,14,7,3,19,17,15,13,10,4,13,5,8,11,5,1,12,4,4,1,1,0]],
    9: [6, [3,3,5,6,8,9,3,3,4,5,6,8,4,4,5,6,7,8,6,5,6,7,7,8,7,6,7,7,8,9,8,7,8,8,9,9], [7,5,9,14,15,7,6,4,5,5,6,7,7,6,8,8,8,5,15,6,9,10,5,1,11,7,9,6,4,1,14,4,6,2,6,0]],
    10: [8, [1,3,6,8,9,9,9,10,3,4,6,7,8,9,8,8,6,6,7,8,9,10,9,9,7,7,8,9,10,10,9,10,8,8,9,10,10,10,10,10,9,9,10,10,11,11,10,11,8,8,9,10,10,10,11,11,9,8,9,10,10,11,11,11], [1,2,10,23,35,30,12,17,3,3,8,12,18,21,12,7,11,9,15,21,32,40,19,6,14,13,22,34,46,23,18,7,20,19,33,47,27,22,9,3,31,22,41,26,21,20,5,3,14,13,10,11,16,6,5,1,9,8,7,8,4,4,2,0]],
    11: [8, [2,3,5,7,8,9,8,9,3,3,4,6,8,8,7,8,5,5,6,7,8,9,8,8,7,6,7,9,8,10,8,9,8,8,8,9,9,10,9,10,8,8,9,10,10,11,10,11,8,7,7,8,9,10,10,10,8,7,8,9,10,10,10,10], [3,4,10,24,34,33,21,15,5,3,4,10,32,17,11,10,11,7,13,18,30,31,20,5,25,11,19,59,27,18,12,5,35,33,31,58,30,16,7,5,28,26,32,19,17,15,8,14,14,12,9,13,14,9,4,1,11,4,6,6,6,3,2,0]],
    12: [8, [4,3,5,7,8,9,9,9,3,3,4,5,7,7,8,8,5,4,5,6,7,8,7,8,6,5,6,6,7,8,8,8,7,6,7,7,8,8,8,9,8,7,8,8,8,9,8,9,8,7,7,8,8,9,9,10,9,8,8,9,9,9,9,10], [9,6,16,33,41,39,38,26,7,5,6,9,23,16,26,11,17,7,11,14,21,30,10,7,17,10,15,12,18,28,14,5,32,13,22,19,18,16,9,5,40,17,31,29,17,13,4,2,27,12,11,15,10,7,4,1,27,12,8,12,6,3,1,0]],
    13: [16, [1,4,6,7,8,9,9,10,9,10,11,11,12,12,13,13,3,4,6,7,8,8,9,9,9,9,10,10,11,12,12,12,6,6,7,8,9,9,10,10,9,10,10,11,11,12,13,13,7,7,8,9,9,10,10,10,10,11,11,11,11,12,13,13,8,7,9,9,10,10,11,11,10,11,11,12,12,13,13,14,9,8,9,10,10,10,11,11,11,11,12,11,13,13,14,14,9,9,10,10,11,11,11,11,11,12,12,12,13,13,14,14,10,9,10,11,11,11,12,12,12,12,13,13,13,14,16,16,9,8,9,10,10,11,11,12,12,12,12,13,13,14,15,15,10,9,10,10,11,11,11,13,12,13,13,14,14,14,16,15,10,10,10,11,11,12,12,13,12,13,14,13,14,15,16,17,11,10,10,11,12,12,12,12,13,13,13,14,15,15,15,16,11,11,11,12,12,13,12,13,14,14,15,15,15,16,16,16,12,11,12,13,13,13,14,14,14,14,14,15,16,15,16,16,13,12,12,13,13,13,15,14,14,17,15,15,15,17,16,16,12,12,13,14,14,14,15,14,15,15,16,16,19,18,19,16], [1,5,14,21,34,51,46,71,42,52,68,52,67,44,43,19,3,4,12,19,31,26,44,33,31,24,32,24,31,35,22,14,15,13,23,36,59,49,77,65,29,40,30,40,27,33,42,16,22,20,37,61,56,79,73,64,43,76,56,37,26,31,25,14,35,16,60,57,97,75,114,91,54,73,55,41,48,53,23,24,58,27,50,96,76,70,93,84,77,58,79,29,74,49,41,17,47,45,78,74,115,94,90,79,69,83,71,50,59,38,36,15,72,34,56,95,92,85,91,90,86,73,77,65,51,44,43,42,43,20,30,44,55,78,72,87,78,61,46,54,37,30,20,16,53,25,41,37,44,59,54,81,66,76,57,54,37,18,39,11,35,33,31,57,42,82,72,80,47,58,55,21,22,26,38,22,53,25,23,38,70,60,51,36,55,26,34,23,27,14,9,7,34,32,28,39,49,75,30,52,48,40,52,28,18,17,9,5,45,21,34,64,56,50,49,45,31,19,12,15,10,7,6,3,48,23,20,39,36,35,53,21,16,23,13,10,6,1,4,2,16,15,17,27,25,20,29,11,17,12,16,8,1,1,0,1]],
    15: [16, [3,4,5,7,7,8,9,9,9,10,10,11,11,11,12,13,4,3,5,6,7,7,8,8,8,9,9,10,10,10,11,11,5,5,5,6,7,7,8,8,8,9,9,10,10,11,11,11,6,6,6,7,7,8,8,9,9,9,10,10,10,11,11,11,7,6,7,7,8,8,9,9,9,9,10,10,10,11,11,11,8,7,7,8,8,8,9,9,9,9,10,10,11,11,11,12,9,7,8,8,8,9,9,9,9,10,10,10,11,11,12,12,9,8,8,9,9,9,9,10,10,10,10,10,11,11,11,12,9,8,8,9,9,9,9,10,10,10,10,11,11,12,12,12,9,8,9,9,9,9,10,10,10,11,11,11,11,12,12,12,10,9,9,9,10,10,10,10,10,11,11,11,11,12,13,12,10,9,9,9,10,10,10,10,11,11,11,11,12,12,12,13,11,10,9,10,10,10,11,11,11,11,11,11,12,12,13,13,11,10,10,10,10,11,11,11,11,12,12,12,12,12,13,13,12,11,11,11,11,11,11,11,12,12,12,12,13,13,12,13,12,11,11,11,11,11,11,12,12,12,12,12,13,13,13,13], [7,12,18,53,47,76,124,108,89,123,108,119,107,81,122,63,13,5,16,27,46,36,61,51,42,70,52,83,65,41,59,36,19,17,15,24,41,34,59,48,40,64,50,78,62,80,56,33,29,28,25,43,39,63,55,93,76,59,93,72,54,75,50,29,52,22,42,40,67,57,95,79,72,57,89,69,49,66,46,27,77,37,35,66,58,52,91,74,62,48,79,63,90,62,40,38,125,32,60,56,50,92,78,65,55,87,71,51,73,51,70,30,109,53,49,94,88,75,66,122,91,73,56,42,64,44,21,25,90,43,41,77,73,63,56,92,77,66,47,67,48,53,36,20,71,34,67,60,58,49,88,76,67,106,71,54,38,39,23,15,109,53,51,47,90,82,58,57,48,72,57,41,23,27,62,9,86,42,40,37,70,64,52,43,70,55,42,25,29,18,11,11,118,68,30,55,50,46,74,65,49,39,24,16,22,13,14,7,91,44,39,38,34,63,52,45,31,52,28,19,14,8,9,3,123,60,58,53,47,43,32,22,37,24,17,12,15,10,2,1,71,37,34,30,28,20,17,26,21,16,10,6,8,6,2,0]],
    16: [16, [1,4,6,8,9,9,10,10,11,11,11,12,12,12,13,9,3,4,6,7,8,9,9,9,10,10,10,11,12,11,12,8,6,6,7,8,9,9,10,10,11,10,11,11,11,12,12,9,8,7,8,9,9,10,10,10,11,11,12,12,12,13,13,10,9,8,9,9,10,10,11,11,11,12,12,12,13,13,13,9,9,8,9,9,10,11,11,12,11,12,12,13,13,13,14,10,10,9,9,10,11,11,11,11,12,12,12,12,13,13,14,10,10,9,10,10,11,11,11,12,12,13,13,13,13,15,15,10,10,10,10,11,11,11,12,12,13,13,13,13,14,14,14,10,11,10,10,11,11,12,12,13,13,13,13,14,13,14,13,11,11,11,10,11,12,12,12,12,13,14,14,14,15,15,14,10,12,11,11,11,12,12,13,14,14,14,14,14,14,13,14,11,12,12,12,12,12,13,13,13,13,15,14,14,14,14,16,11,14,12,12,12,13,13,14,14,14,16,15,15,15,17,15,11,13,13,11,12,14,14,13,14,14,15,16,15,17,15,14,11,9,8,8,9,9,10,10,10,11,11,11,11,11,11,11,8], [1,5,14,44,74,63,110,93,172,149,138,242,225,195,376,17,3,4,12,20,35,62,53,47,83,75,68,119,201,107,207,9,15,13,23,38,67,58,103,90,161,72,127,117,110,209,206,16,45,21,39,69,64,114,99,87,158,140,252,212,199,387,365,26,75,36,68,65,115,101,179,164,155,264,246,226,395,382,362,9,66,30,59,56,102,185,173,265,142,253,232,400,388,378,445,16,111,54,52,100,184,178,160,133,257,244,228,217,385,366,715,10,98,48,91,88,165,157,148,261,248,407,397,372,380,889,884,8,85,84,81,159,156,143,260,249,427,401,392,383,727,713,708,7,154,76,73,141,131,256,245,426,406,394,384,735,359,710,352,11,139,129,67,125,247,233,229,219,393,743,737,720,885,882,439,4,243,120,118,115,227,223,396,746,742,736,721,712,706,223,436,6,202,224,222,218,216,389,386,381,364,888,443,707,440,437,1728,4,747,211,210,208,370,379,734,723,714,1735,883,877,876,3459,865,2,377,369,102,187,726,722,358,711,709,866,1734,871,3458,870,434,0,12,10,7,11,10,17,11,9,13,12,10,7,5,3,1,3]],
    24: [16, [4,4,6,7,8,9,9,10,10,11,11,11,11,11,12,9,4,4,5,6,7,8,8,9,9,9,10,10,10,10,10,8,6,5,6,7,7,8,8,9,9,9,9,10,10,10,11,7,7,6,7,7,8,8,8,9,9,9,9,10,10,10,10,7,8,7,7,8,8,8,8,9,9,9,10,10,10,10,11,7,9,7,8,8,8,8,9,9,9,9,10,10,10,10,10,7,9,8,8,8,8,9,9,9,9,10,10,10,10,10,11,7,10,8,8,8,9,9,9,9,10,10,10,10,10,11,11,8,10,9,9,9,9,9,9,9,9,10,10,10,10,11,11,8,10,9,9,9,9,9,9,10,10,10,10,10,11,11,11,8,11,9,9,9,9,10,10,10,10,10,10,11,11,11,11,8,11,10,9,9,9,10,10,10,10,10,10,11,11,11,11,8,11,10,10,10,10,10,10,10,10,10,11,11,11,11,11,8,11,10,10,10,10,10,10,10,11,11,11,11,11,11,11,8,12,10,10,10,10,10,10,11,11,11,11,11,11,11,11,8,8,7,7,7,7,7,7,7,7,7,7,8,8,8,8,4], [15,13,46,80,146,262,248,434,426,669,653,649,621,517,1032,88,14,12,21,38,71,130,122,216,209,198,327,345,319,297,279,42,47,22,41,74,68,128,120,221,207,194,182,340,315,295,541,18,81,39,75,70,134,125,116,220,204,190,178,325,311,293,271,16,147,72,69,135,127,118,112,210,200,188,352,323,306,285,540,14,263,66,129,126,119,114,214,202,192,180,341,317,301,281,262,12,249,123,121,117,113,215,206,195,185,347,330,308,291,272,520,10,435,115,111,109,211,203,196,187,353,332,313,298,283,531,381,17,427,212,208,205,201,193,186,177,169,320,303,286,268,514,377,16,335,199,197,191,189,181,174,333,321,305,289,275,521,379,371,11,668,184,183,179,175,344,331,314,304,290,277,530,383,373,366,10,652,346,171,168,164,318,309,299,287,276,263,513,375,368,362,6,648,322,316,312,307,302,292,284,269,261,512,376,370,364,359,4,620,300,296,294,288,282,273,266,515,380,374,369,365,361,357,2,1033,280,278,274,267,264,259,382,378,372,367,363,360,358,356,0,43,20,19,17,15,13,11,9,7,6,4,7,5,3,1,3]],
    32: [0, [1,4,4,5,4,6,5,6,4,5,5,6,5,6,6,6], [1,5,4,5,6,5,4,4,7,3,6,0,7,2,3,1]],
    33: [0, [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4], [15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0]]
  };

  var SFB = {   // límites de las bandas de factor de escala (bloques largos)
    44100: [0, 4, 8, 12, 16, 20, 24, 30, 36, 44, 52, 62, 74, 90, 110, 134, 162, 196, 238, 288, 342, 418, 576],
    48000: [0, 4, 8, 12, 16, 20, 24, 30, 36, 42, 50, 60, 72, 88, 106, 128, 156, 190, 230, 276, 330, 384, 576],
    32000: [0, 4, 8, 12, 16, 20, 24, 30, 36, 44, 54, 66, 82, 102, 126, 156, 194, 240, 296, 364, 448, 550, 576]
  };
  var SUBDIV = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 1], [1, 1], [1, 1], [1, 2], [2, 2], [2, 3], [2, 3], [3, 4], [3, 4], [3, 4], [4, 5], [4, 5], [4, 6], [5, 6], [5, 6], [5, 7], [6, 7], [6, 7]];
  var TASAS = M.TASAS = [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  var INDICE_HZ = { 44100: 0, 48000: 1, 32000: 2 };
  var LIN16 = [1, 2, 3, 4, 6, 8, 10, 13], LIN24 = [4, 5, 6, 7, 8, 9, 11, 13];
  var ESCALA = 1;            // los canales vienen entre -1 y 1 y el decodificador espera esa misma escala
  var AJUSTE = 1 / 9;           // la MDCT de 36 puntos sin normalizar multiplica por 9; medido contra un decodificador independiente
  var RAIZ2 = Math.SQRT1_2;

  M.frecuenciaDestino = function (hz) {
    if (hz === 44100 || hz === 48000 || hz === 32000) return hz;
    return (hz % 8000 === 0 || hz % 12000 === 0) ? 48000 : 44100;
  };

  /* ------------------------------------------------------------ Tablas derivadas */
  var VENTANA = new Float64Array(512), COS_MATRIZ = new Float64Array(64 * 32), MDCT = new Float64Array(18 * 36), CS = new Float64Array(8), CA = new Float64Array(8);
  var TABLA = {};          // por número de tabla: { n, lin, L (longitud real), C (código), LT (longitud + bits de signo) }
  (function () {
    var i, k, m, t, d;
    for (i = 0; i <= 256; i++) {
      d = VENT[i] / 65536 / 32;
      VENTANA[i] = d; if (i !== 0) VENTANA[512 - i] = (i & 63) ? -d : d;
    }
    for (k = 0; k < 32; k++) for (i = 0; i < 64; i++) COS_MATRIZ[k * 64 + i] = Math.cos((2 * k + 1) * (i - 16) * Math.PI / 64);
    for (m = 0; m < 18; m++) for (i = 0; i < 36; i++) MDCT[m * 36 + i] = Math.sin(Math.PI / 36 * (i + 0.5)) * Math.cos(Math.PI / 72 * (2 * i + 19) * (2 * m + 1));
    var c = [-0.6, -0.535, -0.33, -0.185, -0.095, -0.041, -0.0142, -0.0037];
    for (i = 0; i < 8; i++) { var q = Math.sqrt(1 + c[i] * c[i]); CS[i] = 1 / q; CA[i] = c[i] / q; }
    function crear(n, lin, L, C) {
      var LT = new Uint8Array(L.length), a, b, i;
      for (i = 0; i < L.length; i++) {
        if (n) { a = (i / n) | 0; b = i % n; LT[i] = L[i] + (a ? 1 : 0) + (b ? 1 : 0); } else { LT[i] = L[i] + ((i & 1) + ((i >> 1) & 1) + ((i >> 2) & 1) + ((i >> 3) & 1)); }
      }
      return { n: n, lin: lin, L: Uint8Array.from(L), C: Uint32Array.from(C), LT: LT };
    }
    for (t in HUF) {
      var h = HUF[t], num = +t;
      if (num === 16) { for (i = 0; i < 8; i++) TABLA[16 + i] = crear(16, LIN16[i], h[1], h[2]); }
      else if (num === 24) { for (i = 0; i < 8; i++) TABLA[24 + i] = crear(16, LIN24[i], h[1], h[2]); }
      else TABLA[num] = crear(h[0], 0, h[1], h[2]);
    }
  })();

  /* ------------------------------------------------------------ Escritor de bits */
  function Bits(cap) { this.b = new Uint8Array(cap || 4096); this.n = 0; }   // n = bits escritos
  Bits.prototype.poner = function (valor, bits) {
    if (!bits) return;
    var fin = this.n + bits, i = this.n, b = this.b;
    if ((fin + 7 >> 3) + 4 > b.length) { var g = new Uint8Array(b.length * 2); g.set(b); this.b = b = g; }
    while (bits > 0) {
      var libres = 8 - (i & 7), t = Math.min(libres, bits), parte = (valor >>> (bits - t)) & ((1 << t) - 1);
      b[i >> 3] |= parte << (libres - t);
      i += t; bits -= t;
    }
    this.n = fin;
  };

  /* ------------------------------------------------------------ Cuantización y recuento de bits de un bloque (granulo de un canal) */
  var IX = new Int32Array(576), X34 = new Float64Array(576), SIGNO = new Int8Array(576);

  function costoPares(tab, ix, a, b) {         // bits de los pares ix[a..b) con la tabla dada
    var T = tab.LT, n = tab.n, lin = tab.lin, bits = 0, i, x, y;
    for (i = a; i < b; i += 2) {
      x = ix[i]; y = ix[i + 1];
      if (x > 14) { bits += lin; x = 15; }
      if (y > 14) { bits += lin; y = 15; }
      bits += T[x * n + y];
    }
    return bits;
  }
  function mejorTabla(ix, a, b) {              // devuelve { t, bits } para la región de pares ix[a..b)
    var i, m = 0;
    for (i = a; i < b; i++) if (ix[i] > m) m = ix[i];
    if (b <= a || m === 0) return { t: 0, bits: 0 };
    var cand;
    if (m <= 1) cand = [1]; else if (m === 2) cand = [2, 3]; else if (m <= 3) cand = [5, 6]; else if (m <= 5) cand = [7, 8, 9]; else if (m <= 7) cand = [10, 11, 12]; else if (m <= 15) cand = [13, 15];
    else {
      var necesita = m - 15, j, c16 = -1, c24 = -1;
      for (j = 0; j < 8; j++) if (c16 < 0 && ((1 << LIN16[j]) - 1) >= necesita) c16 = 16 + j;
      for (j = 0; j < 8; j++) if (c24 < 0 && ((1 << LIN24[j]) - 1) >= necesita) c24 = 24 + j;
      cand = []; if (c16 >= 0) cand.push(c16); if (c24 >= 0) cand.push(c24);
      if (!cand.length) return { t: -1, bits: Infinity };
    }
    var mejor = null, k, bt;
    for (k = 0; k < cand.length; k++) { bt = costoPares(TABLA[cand[k]], ix, a, b); if (!mejor || bt < mejor.bits) mejor = { t: cand[k], bits: bt }; }
    return mejor;
  }
  /* Analiza un vector de enteros: reparto en big_values / count1 / ceros y tablas. */
  function analizar(ix, sfb) {
    var i = 576, c1 = 0, r = {};
    while (i > 1 && ix[i - 1] === 0 && ix[i - 2] === 0) i -= 2;
    while (i > 3 && ix[i - 1] <= 1 && ix[i - 2] <= 1 && ix[i - 3] <= 1 && ix[i - 4] <= 1) { c1++; i -= 4; }
    r.big = i >> 1; r.count1 = c1;
    var bv2 = i, anz = 0;
    while (anz < 22 && sfb[anz] < bv2) anz++;
    var r0 = SUBDIV[anz][0], r1 = SUBDIV[anz][1];
    var e0 = Math.min(sfb[r0 + 1], bv2), e1 = Math.min(sfb[r0 + r1 + 2], bv2);
    r.r0 = r0; r.r1 = r1; r.e0 = e0; r.e1 = e1; r.bv2 = bv2;
    var t0 = mejorTabla(ix, 0, e0), t1 = mejorTabla(ix, e0, e1), t2 = mejorTabla(ix, e1, bv2);
    r.tab = [t0.t, t1.t, t2.t];
    var bits = t0.bits + t1.bits + t2.bits;
    // región count1: tabla A (32) o B (33)
    var a = 0, bb = 0, p, q, A = TABLA[32].LT, B = TABLA[33].LT;
    for (p = bv2; p < bv2 + 4 * c1; p += 4) { q = (ix[p] << 3) | (ix[p + 1] << 2) | (ix[p + 2] << 1) | ix[p + 3]; a += A[q]; bb += B[q]; }
    r.t1 = bb < a ? 1 : 0; bits += Math.min(a, bb);
    r.bits = bits;
    return r;
  }
  function cuantizar(x34, gg) {                // ix = floor(|x|^0.75 / paso^0.75 + 0.4054); devuelve el máximo
    var mult = Math.pow(2, -3 * (gg - 210) / 16), m = 0, i, v;
    for (i = 0; i < 576; i++) { v = (x34[i] * mult + 0.4054) | 0; IX[i] = v; if (v > m) m = v; }
    return m;
  }
  /* Busca el menor global_gain cuyo recuento cabe en `presupuesto` bits. */
  function buscar(x34, presupuesto, sfb, gmin) {
    var lo = gmin, hi = 255, res = null, mid, mx, r;
    while (lo < hi) {
      mid = (lo + hi) >> 1;
      mx = cuantizar(x34, mid);
      r = mx > 8206 ? null : analizar(IX, sfb);
      if (r && r.bits <= presupuesto) hi = mid; else lo = mid + 1;
    }
    cuantizar(x34, lo);
    r = analizar(IX, sfb); r.gg = lo;
    return r;
  }
  function escribir(w, ix, sg, r) {            // datos Huffman del bloque
    var i, x, y, t, tab, n, lin, cod, len, e0 = r.e0, e1 = r.e1, bv2 = r.bv2, reg;
    for (reg = 0; reg < 3; reg++) {
      var a = reg === 0 ? 0 : reg === 1 ? e0 : e1, b = reg === 0 ? e0 : reg === 1 ? e1 : bv2;
      t = r.tab[reg]; if (!t || b <= a) continue;
      tab = TABLA[t]; n = tab.n; lin = tab.lin;
      for (i = a; i < b; i += 2) {
        x = ix[i]; y = ix[i + 1];
        var ex = 0, ey = 0, cx = x, cy = y;
        if (x > 14) { ex = x - 15; cx = 15; }
        if (y > 14) { ey = y - 15; cy = 15; }
        var k = cx * n + cy;
        w.poner(tab.C[k], tab.L[k]);
        if (cx === 15 && lin) w.poner(ex, lin);
        if (x) w.poner(sg[i] < 0 ? 1 : 0, 1);
        if (cy === 15 && lin) w.poner(ey, lin);
        if (y) w.poner(sg[i + 1] < 0 ? 1 : 0, 1);
      }
    }
    var cuenta = TABLA[r.t1 ? 33 : 32], p, q, v, ww;
    for (p = bv2; p < bv2 + 4 * r.count1; p += 4) {
      v = ix[p]; ww = ix[p + 1]; x = ix[p + 2]; y = ix[p + 3];
      q = (v << 3) | (ww << 2) | (x << 1) | y;
      w.poner(cuenta.C[q], cuenta.L[q]);
      if (v) w.poner(sg[p] < 0 ? 1 : 0, 1);
      if (ww) w.poner(sg[p + 1] < 0 ? 1 : 0, 1);
      if (x) w.poner(sg[p + 2] < 0 ? 1 : 0, 1);
      if (y) w.poner(sg[p + 3] < 0 ? 1 : 0, 1);
    }
  }

  /* ------------------------------------------------------------ Codificador */
  function Codificador(nc, hz, kbps) {
    var c, i;
    this.nc = nc; this.hz = hz; this.kbps = kbps; this.sfb = SFB[hz];
    this.lado = nc === 1 ? 17 : 32;
    this.tasa = kbps * 1000;
    this.base = Math.floor(144 * this.tasa / hz); this.resto = (144 * this.tasa) % hz; this.acc = 0;
    this.X = []; this.prev = []; this.xr = [];
    for (c = 0; c < nc; c++) { this.X.push(new Float64Array(512)); this.prev.push(new Float64Array(576)); this.xr.push([new Float64Array(576), new Float64Array(576)]); }
    this.sb = new Float64Array(576); this.Y = new Float64Array(64); this.S = new Float64Array(32);
    // filtro de paso bajo (índice de línea espectral a partir del cual se descarta)
    var corte = kbps >= 256 ? 20500 : kbps >= 192 ? 19500 : kbps >= 160 ? 18000 : kbps >= 128 ? 16500 : kbps >= 112 ? 15500 : kbps >= 96 ? 14500 : kbps >= 64 ? 11500 : 8500;
    this.corte = Math.min(576, Math.round(corte / (hz / 2) * 576));
    this.datos = new Uint8Array(1 << 16); this.largo = 0;       // flujo lógico de datos principales
    this.pos = 0;                                               // posición física acumulada de las ranuras de datos
    this.cola = []; this.salida = []; this.tramas = 0; this.ms = false;
  }
  Codificador.prototype.granulo = function (c, pcm, desde, xr) {   // 576 muestras → 576 coeficientes
    var X = this.X[c], Y = this.Y, S = this.S, sb = this.sb, prev = this.prev[c], t, i, j, k, m, y, s, n = pcm.length;
    for (t = 0; t < 18; t++) {
      X.copyWithin(32, 0, 480);
      var p = desde + t * 32;
      for (i = 0; i < 32; i++) X[31 - i] = (p + i < n ? pcm[p + i] : 0) * ESCALA;
      for (i = 0; i < 64; i++) { y = 0; for (j = 0; j < 8; j++) y += VENTANA[i + 64 * j] * X[i + 64 * j]; Y[i] = y; }
      for (k = 0; k < 32; k++) { s = 0; var o = k * 64; for (i = 0; i < 64; i++) s += COS_MATRIZ[o + i] * Y[i]; S[k] = ((k & 1) && (t & 1)) ? -s : s; }
      for (k = 0; k < 32; k++) sb[k * 18 + t] = S[k];
    }
    for (k = 0; k < 32; k++) {
      for (m = 0; m < 18; m++) {
        s = 0; var o2 = m * 36, a = k * 18;
        for (i = 0; i < 18; i++) s += MDCT[o2 + i] * prev[a + i] + MDCT[o2 + 18 + i] * sb[a + i];
        xr[a + m] = s * AJUSTE;
      }
    }
    prev.set(sb);
    for (k = 1; k < 32; k++) for (i = 0; i < 8; i++) {
      var lo = k * 18 - 1 - i, hi = k * 18 + i, bu = xr[lo], bd = xr[hi];
      xr[lo] = bu * CS[i] + bd * CA[i]; xr[hi] = bd * CS[i] - bu * CA[i];
    }
  };
  Codificador.prototype.trama = function (pcms, desde) {
    var nc = this.nc, gr, c, i, self = this;
    // ranura de la trama
    var relleno = 0; this.acc += this.resto; if (this.acc >= this.hz) { this.acc -= this.hz; relleno = 1; }
    var bytesTrama = this.base + relleno, ranura = bytesTrama - 4 - this.lado;
    // análisis
    for (gr = 0; gr < 2; gr++) for (c = 0; c < nc; c++) this.granulo(c, pcms[c], desde + gr * 576, this.xr[c][gr]);
    // estéreo conjunto: M/S si ahorra (se decide por trama)
    var ms = false;
    if (nc === 2) {
      var eL = 0, eS = 0, eM = 0;
      for (gr = 0; gr < 2; gr++) for (i = 0; i < this.corte; i++) { var l = this.xr[0][gr][i], r = this.xr[1][gr][i]; eL += Math.abs(l) + Math.abs(r); eM += Math.abs(l + r) * RAIZ2; eS += Math.abs(l - r) * RAIZ2; }
      ms = (eM + eS) < eL * 0.92;
      if (ms) for (gr = 0; gr < 2; gr++) for (i = 0; i < 576; i++) { var l2 = this.xr[0][gr][i], r2 = this.xr[1][gr][i]; this.xr[0][gr][i] = (l2 + r2) * RAIZ2; this.xr[1][gr][i] = (l2 - r2) * RAIZ2; }
    }
    // presupuesto
    var b = this.pos - this.largo;                        // bytes de reserva disponibles
    var disponible = ranura * 8 + Math.floor(b * 8 / 2), maxBits = (b + ranura) * 8;
    if (disponible > maxBits) disponible = maxBits;
    var w = new Bits(8192), info = [], restantes = 2 * nc, gc = 0;
    for (gr = 0; gr < 2; gr++) for (c = 0; c < nc; c++) {
      var xr = this.xr[c][gr], x34 = X34, sg = SIGNO, ultimo = 0;
      for (i = 0; i < 576; i++) {
        var v = i < this.corte ? xr[i] : 0;
        sg[i] = v < 0 ? -1 : 1; var a = Math.abs(v); var ra = Math.sqrt(a); x34[i] = ra * Math.sqrt(ra);
      }
      var parte = Math.min(4095, Math.floor((disponible - w.n) / restantes));
      var r = buscar(x34, parte, this.sfb, this.gmin || 0);
      var ini = w.n;
      escribir(w, IX, sg, r);
      r.len = w.n - ini; info.push(r); restantes--;
    }
    // bytes de datos de esta trama, con relleno para no superar 511 bytes de reserva
    var tam = (w.n + 7) >> 3;
    var nuevaReserva = b + ranura - tam;
    if (nuevaReserva > 511) tam += nuevaReserva - 511;
    // información lateral
    var cab = new Uint8Array(4 + this.lado), sw = new Bits(64);
    sw.poner(b, 9); sw.poner(0, nc === 1 ? 5 : 3);
    for (c = 0; c < nc; c++) sw.poner(0, 4);                 // scfsi
    var k2 = 0;
    for (gr = 0; gr < 2; gr++) for (c = 0; c < nc; c++) {
      var q = info[k2++];
      sw.poner(q.len, 12); sw.poner(q.big, 9); sw.poner(q.gg, 8); sw.poner(0, 4); sw.poner(0, 1);
      sw.poner(q.tab[0], 5); sw.poner(q.tab[1], 5); sw.poner(q.tab[2], 5);
      sw.poner(q.r0, 4); sw.poner(q.r1, 3); sw.poner(0, 1); sw.poner(0, 1); sw.poner(q.t1, 1);
    }
    cab[0] = 0xFF; cab[1] = 0xFB;
    cab[2] = ((TASAS.indexOf(this.kbps) + 1) << 4) | (INDICE_HZ[this.hz] << 2) | (relleno << 1);
    cab[3] = (nc === 1 ? 3 << 6 : 1 << 6) | (ms ? 2 << 4 : 0) | (1 << 2);   // mono, o estéreo conjunto con M/S activado por trama
    cab.set(sw.b.subarray(0, this.lado), 4);
    // datos principales al flujo lógico
    if (this.largo + tam + 8 > this.datos.length) { var g = new Uint8Array(Math.max(this.datos.length * 2, this.largo + tam + 4096)); g.set(this.datos.subarray(0, this.largo)); this.datos = g; }
    this.datos.set(w.b.subarray(0, (w.n + 7) >> 3), this.largo);
    this.largo += tam;
    this.cola.push({ cab: cab, ranura: ranura, pos: this.pos });
    this.pos += ranura;
    this.vaciar(false);
    this.tramas++;
  };
  Codificador.prototype.vaciar = function (fin) {
    while (this.cola.length) {
      var t = this.cola[0];
      if (this.largo < t.pos + t.ranura) { if (!fin) break; var falta = t.pos + t.ranura - this.largo; if (this.largo + falta > this.datos.length) { var g = new Uint8Array(this.largo + falta + 4096); g.set(this.datos.subarray(0, this.largo)); this.datos = g; } this.largo += falta; }
      this.cola.shift();
      this.salida.push(t.cab, this.datos.slice(t.pos, t.pos + t.ranura));
    }
  };

  function remuestrear(x, de, a) {
    var S = global.TH && global.TH.sonido;
    if (!S) throw new Error('Falta TH.sonido (lib/sonido.js) para cambiar la frecuencia de muestreo.');
    return S.remuestrear(x, de, a);
  }
  M.codificar = function (canales, hz, kbps, progreso) {
    return new Promise(function (ok, mal) {
      try {
        if (TASAS.indexOf(kbps) < 0) throw new Error('Tasa de MP3 no admitida: ' + kbps + ' kb/s.');
        var nc = Math.min(2, canales.length), dest = M.frecuenciaDestino(hz), pcm = [], i;
        for (i = 0; i < nc; i++) pcm.push(dest === hz ? canales[i] : remuestrear(canales[i], hz, dest));
        var n = pcm[0].length, total = Math.max(3, Math.ceil((n + 1105) / 1152)), enc = new Codificador(nc, dest, kbps), f = 0;
        (function paso() {
          try {
            var hasta = Math.min(total, f + 12);
            for (; f < hasta; f++) enc.trama(pcm, f * 1152);
            if (progreso) progreso(f / total);
            if (f < total) { setTimeout(paso, 0); return; }
            enc.vaciar(true);
            var partes = enc.salida, len = 0, j; for (j = 0; j < partes.length; j++) len += partes[j].length;
            var sal = new Uint8Array(len), p = 0; for (j = 0; j < partes.length; j++) { sal.set(partes[j], p); p += partes[j].length; }
            ok(sal);
          } catch (e) { mal(e); }
        })();
      } catch (e) { mal(e); }
    });
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else { global.TH = global.TH || {}; global.TH.mp3 = M; }
})(typeof window !== 'undefined' ? window : globalThis);

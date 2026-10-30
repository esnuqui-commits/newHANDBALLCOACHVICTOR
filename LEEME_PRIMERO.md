# VICTOTALCOACH V2 · Léeme primero

## Qué contiene este paquete
| Carpeta / archivo | Para qué sirve |
|---|---|
| `VICTOTALCOACH_V2.app` | La aplicación nueva para Mac. Es independiente de tu app anterior |
| `ORIGINAL/` | Copia del HTML original (V15.6), sin datos, por si quieres volver atrás |
| `docs/CAMBIOS_Y_PRUEBAS.md` | Qué se ha hecho, qué se ha probado y **qué NO está hecho** |
| `docs/GUIA_COPIAS_Y_ACTUALIZACION.md` | Copias de seguridad, restauración y cómo actualizar sin perder datos |
| `backend/` | Esquema SQL y guía para el acceso multiusuario real (**NO verificado, NO conectado todavía**) |
| `tests/regresion_v2.py` | Batería de pruebas automáticas (opcional, para quien tenga Python) |
| `.gitignore` | Evita subir copias con datos personales a GitHub |

## Instalación (5 minutos)
1. Descomprime el paquete. Mueve `VICTOTALCOACH_V2.app` a tu **Escritorio** o a **Aplicaciones**.
2. **Primera vez:** haz clic con el botón derecho sobre la app → **Abrir** → **Abrir**. (macOS avisa porque la app no está firmada por Apple; es normal.)
3. Se abrirá en Brave o Chrome. Necesita Python 3 (si no lo tienes, macOS te propondrá instalar las «Herramientas de línea de comandos»).
4. **Importa tus datos:** pestaña **Copia** → **Restaurar copia** → elige tu `VICTOR4.json` → **Aceptar** (modo *Fusionar*, el recomendado). Espera el aviso «RESTAURACIÓN COMPLETADA».
5. Comprueba que ves tus equipos, ejercicios con imágenes y el scouting.

## Importante: tus datos antiguos NO se tocan
La V2 usa su propio puerto (8780+) y por tanto **su propio espacio de datos en el navegador**. Tu app anterior sigue funcionando con los suyos. La V2 empieza vacía hasta que restaures una copia.

## Lo primero que debes hacer hoy
- Guarda `VICTOR4.json` en un lugar privado (contiene DNI y fotos de menores). Nunca en GitHub.
- Guarda aparte los vídeos de partido (`.mov`): **las copias no los incluyen**.
- Después de unos días de uso, haz una copia nueva desde la V2 (Copia → Descargar copia).

## Si la app se cierra, da «Error response» o parece vacía (versión 2.0.1)
Causa encontrada: macOS ejecuta las apps sin firmar desde una carpeta temporal que luego retira. El servidor local se quedaba sin archivos (error 404 al recargar) y, al reabrir, la app usaba **otro puerto = otro espacio de datos vacío**. Tus datos no se perdían: estaban en el puerto anterior.
Qué hace ahora la 2.0.1: sirve la app desde una copia estable (`~/Library/Application Support/VICTOTALCOACH_V2/web`), reutiliza siempre el mismo puerto y sustituye un servidor propio averiado en ese mismo puerto.
**Pasos para recuperarte:**
1. Cierra la pestaña y sal de Brave/Chrome.
2. Si ves procesos antiguos: Terminal → `pkill -f "http.server 878"` (solo cierra servidores de la V2; no toca tu app antigua en 8765).
3. Sustituye la app por esta versión (mueve la app con el Finder a Aplicaciones o al Escritorio) y ábrela.
4. Si no ves tus datos: **Copia → Restaurar copia → Aceptar (Fusionar)** con tu `VICTOR4.json`. Durante ~30 segundos verás el aviso «Restaurando…»: no cierres nada. Al terminar la app se recarga sola.
5. Si el problema continúa, dime el **texto exacto** del error, el navegador y si ocurre al elegir el archivo o al recargar: no puedo descartar un problema de memoria del navegador con copias de 91 MB.

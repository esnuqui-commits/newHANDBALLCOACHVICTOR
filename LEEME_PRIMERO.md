# VICTOTALCOACH V2 · Léeme primero

## Qué contiene este paquete
| Carpeta / archivo | Para qué sirve |
|---|---|
| `VICTOTALCOACH_V2.app` | La aplicación nueva para Mac. Es independiente de tu app anterior |
| `ORIGINAL/` | Copia del HTML original (V15.6), sin datos, por si quieres volver atrás |
| `docs/CAMBIOS_Y_PRUEBAS.md` | Qué se ha hecho, qué se ha probado y **qué NO está hecho** |
| `docs/GUIA_COPIAS_Y_ACTUALIZACION.md` | Copias de seguridad, restauración y cómo actualizar sin perder datos |
| `backend/` | Esquema SQL y guía para el acceso multiusuario real (**NO verificado, NO conectado todavía**) |
| `ICONOS/` | El icono (azul y blanco, balonmano) en todos los formatos: `.ico` para Windows, `.icns` para Mac, PNG y SVG |
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

## Icono al instalar desde Brave (versión 2.0.3)
Para que Brave ponga el icono hacen falta tres cosas: que reciba el manifiesto y los iconos, que NO use una copia antigua de la página en caché y que la app se reinstale. La 2.0.3 corrige las dos primeras (servidor sin caché, y sustituye cualquier servidor antiguo que siga abierto).

**Pasos, en este orden:**
1. **Cierra** la pestaña y la app instalada, y sal de Brave del todo (Cmd+Q).
2. Sustituye `VICTOTALCOACH_V2.app` por la de este paquete y ábrela. Arriba de la app debe poner **«Versión 2.0.3»**. Si pone otra, estás viendo un servidor antiguo: en Terminal ejecuta `pkill -f "http.server 878"; pkill -f vtc_serve` y vuelve a abrir la app.
3. Abre en Brave: `http://127.0.0.1:8780/diagnostico.html` (si tu puerto es otro, usa el que muestre la barra de direcciones). Todas las líneas deben estar en ✅ salvo los dos avisos amarillos finales, que son normales. **Si alguna sale ❌, copia el «Resumen» de abajo y envíamelo.**
4. Desinstala la versión anterior: `brave://apps` → clic derecho sobre VICTOTALCOACH → **Desinstalar**. Además, en la carpeta `~/Applications/Brave Browser Apps.localized` borra «VICTOTALCOACH» si queda alguna.
5. Vuelve a `http://127.0.0.1:8780/VICTOTALCOACH.html`, recarga sin caché (Cmd/Ctrl + Mayús + R) y usa menú ⋮ → **Guardar y compartir → Instalar VICTOTALCOACH…**
- La app de Mac también lleva el icono nuevo; el lanzador la «toca» en cada arranque para que Finder lo relea. Si aun así ves el viejo: `killall Finder`.
- **Windows:** `ICONOS/VICTOTALCOACH.ico` sirve para un acceso directo. El lanzador incluido es solo para Mac.
- **GitHub Pages:** sube **toda** la carpeta `Contents/Resources/VICTOTALCOACH` (HTML, `manifest.webmanifest`, `sw.js`, `version.txt`, `icons/`, `ext/`, `index.html`, `diagnostico.html`), nunca copias de seguridad. Si solo subes el HTML, el navegador no tendrá manifiesto ni iconos y no saldrá icono. Abre `/diagnostico.html` en tu dirección de GitHub para comprobarlo.

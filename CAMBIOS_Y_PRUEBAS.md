# VICTOTALCOACH V2 · Cambios, pruebas y pendientes

Versión 2.0 · 30 de octubre de 2026. Todo lo marcado «probado» se ejecutó de verdad en un navegador automatizado (Chromium) con datos de prueba y con una copia real `VICTOR4.json` en un perfil aislado. Lo marcado «NO verificado» no se ha podido comprobar.

## 1. Cambios imprescindibles
| Cambio | Estado |
|---|---|
| Restauración que borraba imágenes (`os.clear`) | **Hecho y probado.** Fusionar o reemplazar con una copia sin imágenes conserva las existentes (137 → 137) |
| Batería de regresión automática | **Hecha** (`tests/regresion_v2.py`): 32 correctas, 0 fallos, 1 omitida |
| Campo `deporte` y registro de deportes | **Hecho y probado.** Todo lo antiguo cuenta como balonmano. Cada equipo y ejercicio tiene deporte |
| Pistas vectoriales de fútbol, baloncesto y voleibol (completa y media) | **Hecho y probado** (contenido dibujado, distintas entre sí, dentro del área visible). Medidas habituales IFAB 105×68, FIBA 28×15, FIVB 18×9: **revísalas contra el reglamento de tu federación** |
| Migración controlada con copia previa | **Hecho** para restaurar: «Reemplazar» descarga antes una copia automática. La migración a la nube **no existe todavía** |
| Backend con autenticación y reglas de acceso | **PARCIAL.** Existe el esquema SQL (`backend/supabase_schema.sql`) **sin ejecutar ni verificar**, y no hay pantalla de inicio de sesión ni panel de administración conectados. La app sigue siendo local y de un usuario |

## 2. Cambios recomendables
| Cambio | Estado |
|---|---|
| Ficha del ejercicio: edades, dificultad, tipo de contenido, objetivos secundarios, espacio/material, progresiones, adaptaciones, errores frecuentes, indicaciones, etiquetas, autor, fechas | **Hecho y probado** (guarda y persiste tras recargar) |
| Rangos de edad configurables, filtro por edad y por equipo, avisos orientativos | **Hecho y probado.** Los rangos iniciales son solo nombres editables, sin límites impuestos |
| Gestor de categorías: crear, renombrar, reordenar, desactivar, eliminar con reasignación | **Hecho y probado** con tus datos (eliminar DEFENSA reasignó sus 11 ejercicios a «Otros»; ninguno se perdió) |
| Deshacer y Rehacer en la pizarra (botones y Ctrl/Cmd+Z) | **Hecho y probado** |
| Número o nombre en jugadores, texto en la pizarra, descarga PNG | **Hecho y probado** |
| La pizarra del ejercicio se guarda sola (antes había que pulsar «Guardar pizarra») | **Hecho y probado** |
| PDF de una o varias sesiones con selección, filtros por equipo y fechas, opciones de contenido y salto de página | **Hecho y probado** con 22 sesiones y 100 imágenes cargadas en la ventana de impresión |
| Suma de duración de ejercicios y botón «usar como duración» | **Hecho y probado** (no cambia nada sin que lo pidas) |
| Duplicar sesión (no copia asistencia, wellness ni RPE) | **Hecho y probado** |
| Avisos al añadir ejercicios de otro deporte o fuera del rango de edad del equipo | **Hecho y probado** |
| Error `IDBCursor` | **Corregido** (ya no aparece) |
| Evaluaciones en dos almacenes | **Migración aditiva incluida** (solo añade las que falten). **No probada con datos que lo necesiten**, tu copia actual no los tiene |
| Versión visible única | **Hecho** (V2.0) |

## 2b. Corrección 2.0.1 (lanzador y restauración)
| Cambio | Estado |
|---|---|
| El servidor se sirve desde una copia estable; no depende de la carpeta temporal de macOS | **Hecho. Probado con simulación en Linux** (5 escenarios: arranque, carpeta retirada, reapertura desde otra ruta, servidor propio averiado, puerto ocupado por otro programa). **No probado en un Mac real** |
| Si el puerto de tus datos está ocupado por otro programa, avisa en vez de abrir en silencio un espacio vacío | **Hecho** (simulado) |
| Aviso visible «Restaurando… no cierres la pestaña» durante la restauración | **Hecho** |
| Posible falta de memoria del navegador con copias de 91 MB | **Sin confirmar ni descartar** (mi medición no fue fiable) |

## 3. Qué NO está hecho
- Inicio de sesión, panel de administración, permisos por servidor y sincronización entre dispositivos (ver `backend/`). Hasta que se haga y se pruebe, **no hay seguridad multiusuario real**. La antigua barra «SUPERADMIN» (que no protegía nada) está oculta.
- Migración de datos a la nube, ámbitos compartidos por equipo u organización, copiar ejercicios compartidos.
- Scouting y estadísticas por deporte: el scouting sigue siendo el de balonmano. Los demás deportes tienen pizarra, posiciones y categorías propias, pero no botoneras.
- Terminología: se adaptan pizarra, posiciones y categorías. Otros textos de la app (p. ej. «Jugadoras») no cambian por deporte.
- Calendario, impresión de pizarra desde la propia pizarra (se puede descargar PNG y el PDF de sesión las incluye).
- Clave huérfana `TOTALCOACH…_V19_MULTIUSER` del almacenamiento: no se ha borrado (no estaba en el código, es inofensiva).
- Uso desde iPad, iPhone o Windows: la V2 sigue siendo una app de Mac.

## 4. No se ha podido probar
- En macOS real, Brave, Safari, iPad. El lanzador se probó con una simulación en Linux (arranca, reutiliza el servidor y no toca procesos ajenos).
- YouTube, Autocam con IA, cámara, capturadora (sin internet en el entorno).
- El SQL de Supabase (sin PostgreSQL disponible).

## 5. Resultados de la batería de regresión (30-oct-2026)
Arranque sin errores · 10 pestañas con contenido · 4 deportes · pizarras distintas por deporte y por variante · materiales filtrados por deporte · deshacer/rehacer/etiquetas/PNG · ficha del ejercicio persistente · edades y filtros · categorías · fusión y reemplazo seguros · con copia real: 2 equipos, 35 jugadoras, 74 ejercicios, 86 microciclos, 139 archivos multimedia (137 de la copia + 2 de prueba), duplicar sesión, PDF de 22 sesiones, fusión repetida sin duplicados.
**Resultado: 32 correctas, 0 con fallo, 1 omitida.**

## 6. Las pruebas de aceptación de tu prompt
| # | Prueba | Estado |
|---|---|---|
| 1 | El balonmano mantiene sus funciones | Correcta (pizarra, ejercicios, sesiones, partidos, scouting y PDF comprobados en la V1 y sin cambios de comportamiento; regresión de pizarra OK) |
| 2 | Proyectos de fútbol, baloncesto y voleibol | Correcta |
| 3 | Pizarra apropiada por deporte | Correcta |
| 4 | Crear y editar ejercicios | Correcta |
| 5 | Asignar ejercicios a edades | Correcta |
| 6 | Crear, cambiar y eliminar categorías con precauciones | Correcta |
| 7 | Planificar sesiones y exportar a PDF | Correcta |
| 8 | Exportar varias sesiones juntas | Correcta |
| 9 | Los datos sobreviven al cierre y reapertura | Correcta (recarga de página; no se probó cerrar el navegador entero en un Mac real) |
| 10 | Dos entrenadores con espacios privados | **Pendiente** (requiere backend) |
| 11 | Recursos compartidos con permisos | **Pendiente** |
| 12 | Autorizar y bloquear entrenadores | **Pendiente** |
| 13 | Usuario bloqueado sin acceso | **Pendiente** |
| 14 | Un entrenador no puede escalar permisos | **Pendiente** |
| 15 | Las copias permiten recuperar los datos | Correcta |
| 16 | Sin errores críticos de JavaScript | Correcta (0 errores en toda la batería) |
| 17 | Pruebas con datos de prueba | Correcta (perfil aislado, sin tocar datos reales) |

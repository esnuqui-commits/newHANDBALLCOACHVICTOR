# Copias de seguridad, restauración y actualización

## Hacer una copia
Pestaña **Copia → Descargar copia completa**. Genera `VICTOTALCOACH_Copia_Completa_AAAA-MM-DD.json` con equipos, ejercicios, imágenes, pizarras, fotos, partidos, evaluaciones y scouting (cortes, listas, plantillas). **No incluye los vídeos de partido.**
Recomendación: una copia a la semana y siempre antes de cualquier cambio importante. Guárdalas en un disco o nube **privados**.

## Restaurar una copia (dos modos)
Pestaña **Copia → Restaurar copia**. La app muestra un resumen de lo que contiene la copia y pregunta:
- **ACEPTAR = FUSIONAR (recomendado).** Añade lo que falta. **No borra ni sobrescribe nada** de lo que ya tienes. Se puede repetir sin duplicar datos.
- **CANCELAR → REEMPLAZAR TODO.** Sustituye los datos actuales por los de la copia. **Antes descarga automáticamente una copia de seguridad de lo que tenías.** Si la copia no trae imágenes, las que ya tienes **se conservan** (en la V1 se borraban).

Durante la restauración aparece un aviso «Restaurando…»: tarda hasta ~1 minuto con copias grandes. No cierres la pestaña; al terminar, la app se recarga sola.

## Actualizar la aplicación sin perder datos
1. Haz una copia completa desde la versión que usas.
2. Cierra el navegador. Sustituye `VICTOTALCOACH_V2.app` por la versión nueva (misma ubicación).
3. Ábrela. Los datos viven en el navegador y se conservan **mientras se use el mismo puerto**: el lanzador lo recuerda (8780 por defecto). Si algo no aparece, restaura tu última copia en modo *Fusionar*.

## Volver a la versión anterior
Tu app antigua sigue intacta con sus datos. Si quieres volver al HTML original: `ORIGINAL/VICTOTALCOACH_original_V15.6.html`.

## Si «desaparecen» los datos
Casi siempre significa que el navegador usa otra dirección (otro puerto) o se borraron «datos del sitio». Restaura tu última copia.

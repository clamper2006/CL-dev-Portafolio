# TASKS — Feature 001: Sección «Sobre mí»

Orden por dependencias. Cada tarea se verifica antes de pasar a la siguiente. Estado final: ver tabla «Ejecución» al final.

| ID | Objetivo | Archivos | Trabajo | Criterios de aceptación | Verificación |
|---|---|---|---|---|---|
| T-01 | Línea base | — | Capturas del sitio actual (Hero y resto) a 390 y 1440 px, ES/EN, y registro de consola. | Capturas guardadas; consola sin errores. | Archivos de evidencia. |
| T-02 | Derivados de la foto | `assets/img/about/*` | Generar 480/768/1024 en AVIF, WebP, JPEG desde el PNG (sRGB, sin metadatos, sin retoque). | 9 archivos; ninguno supera el ancho original; pesos dentro de RNF-04; apariencia idéntica al original. | Tamaños en disco; comparación visual con el original. |
| T-03 | i18n | `assets/js/i18n.js` | Nuevas claves `about.*` ES/EN; quitar huérfanas; añadir `data-i18n-alt` en `apply()`. | Claves en ambos idiomas; sin claves rotas; `alt` cambia con el idioma. | Script que compara claves ES vs EN; prueba de cambio de idioma. |
| T-04 | Estructura | `index.html` | Reemplazar y mover `section#sobre-mi` tras el Hero; reordenar menús (header, móvil, footer); añadir clase `js` en `<head>`. | CA-01; un único `#sobre-mi`; HTML bien formado; texto ES por defecto visible. | Inspección DOM; scroll-spy marca «Sobre mí» al llegar. |
| T-05 | Estilos y responsive | `assets/css/about.css`, `assets/css/responsive.css` | Composición editorial de escritorio, tablet y móvil; marcas de recorte, pie de foto, principios, stack, CTA; retirar CSS obsoleto. | CA-02, CA-06, CA-09; rostro completo en todos los anchos; sin desbordes; contraste AA. | Capturas 360–1920; `scrollWidth`; cálculo de contraste. |
| T-06 | Animación de entrada | `assets/css/about.css` | Estados ocultos bajo `html.js`; delays; revelación de foto; regla reduced-motion. | CA-04, CA-05; solo `opacity`/`transform` (+ un `clip-path`); una reproducción. | Registro de clases `is-visible` en orden; emulación reduced-motion. |
| T-07 | Robustez | `assets/js/animations.js` | Guarda para navegadores sin `IntersectionObserver`. | Sin errores sin IO; contenido visible. | Prueba con `IntersectionObserver` eliminado y con JS deshabilitado. |
| T-08 | *(si se aprueba Q-05)* Reduced-motion global | `assets/css/utilities.css` | Bloque `@media (prefers-reduced-motion: reduce)` global. | Otras secciones sin animación con la preferencia activa; sin cambios sin ella. | Emulación + capturas. |
| T-09 | Validación integral | — | Ejecutar el plan de pruebas §8 completo; comparar contra T-01; medir CLS y bytes. | CA-01…CA-09 cumplidos o desviaciones documentadas. | Informe con evidencia + matriz de trazabilidad completada. |
| T-10 | Paquete de entrega | `.zip`, `aplicar_cambios.py` | Empaquetar archivos finales y script; probar el script sobre una copia del repo. | Script idempotente; el sitio resultante pasa T-09. | Ejecución del script en copia + prueba rápida. |
| T-11 | Informe final | `specs/feature-001-about-section/report.md` | Informe según §12 del brief. | Todas las secciones; validaciones no ejecutadas, marcadas como tales. | Revisión. |

Dependencias: T-01 → (T-02, T-03) → T-04 → T-05 → T-06 → T-07 → (T-08) → T-09 → T-10 → T-11.


## Ejecución

| ID | Estado | Nota |
|---|---|---|
| T-01 | Parcial | Línea base: se reutilizó la lectura del repo; no se capturó el sitio completo con tu CSS real (ver report.md §Limitaciones). |
| T-02 | Completada | 9 derivados AVIF/WebP/JPEG; fidelidad PSNR 42,8–44,8 dB, sin cambio de color. |
| T-03 | Completada | 80 claves ES = 80 EN; `data-i18n-alt` añadido. |
| T-04 | Completada | Un único `#sobre-mi`, justo tras el Hero; menús reordenados. |
| T-05 | Completada | Verificado a 360, 390, 768, 1024, 1440 y 1920 px. |
| T-06 | Completada | Secuencia de entrada verificada; sin retroceso al volver a subir. |
| T-07 | Completada | Sin `IntersectionObserver` el contenido es visible y no hay errores. |
| T-08 | Cancelada | Q-05: el titular no quiere cambios globales de movimiento. |
| T-09 | Completada | Ver report.md. |
| T-10 | Completada | Paquete con la misma estructura del repo (subida por GitHub web). |
| T-11 | Completada | report.md. |

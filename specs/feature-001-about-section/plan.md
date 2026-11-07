# PLAN — Feature 001: Sección «Sobre mí»

Estado: **BORRADOR — pendiente de aprobación de `spec.md`** · Decisiones abiertas: Q-01…Q-06 del spec.
Principio rector: modificación localizada; ninguna reescritura de secciones existentes.

## 1. Arquitectura de la sección

Se **reemplaza** el bloque actual `section#sobre-mi` (Q-01) y se coloca entre `#inicio` y `#proyectos`. Estructura semántica (DOM en orden de lectura; el orden visual lo resuelve CSS Grid):

```
section.about-me#sobre-mi[aria-labelledby="about-title"]
└─ .container
   └─ .about-me__grid
      ├─ header.about-me__head
      │    ├─ p.eyebrow            «SOBRE MÍ»                     [data-reveal d1]
      │    └─ h2#about-title       título + acento serif          [data-reveal d2]
      ├─ figure.about-me__figure                                   [data-reveal d3]
      │    ├─ picture (AVIF/WebP/JPEG) > img[width=1024 height=1536 loading=lazy decoding=async alt]
      │    └─ figcaption.about-me__caption  «CÉSAR LAMPER — …»
      └─ div.about-me__body
           ├─ p.about-me__lead     (P1)                            [data-reveal d4]
           ├─ p ×3                 (P2–P4)                         [data-reveal d5]
           ├─ ul.about-me__principles (3 ítems)                    [data-reveal-group]
           ├─ p.about-me__stack    STACK: HTML · CSS · …           [data-reveal d6]
           └─ a.btn.btn--primary   CTA → #contacto                 [data-reveal d6]
```

**Dirección de arte (editorial, coherente con el «plano técnico» del Hero)**
- Escritorio (≥ 1025 px): rejilla de 12 columnas; foto en columnas 1–5 abarcando las dos filas, cabecera y cuerpo en columnas 7–12. Un filete vertical de 1 px (`--cl-divider`) separa foto y texto.
- La foto es una «placa» oscura (su propio fondo de estudio) sobre el crema: proporción 4:5, esquinas rectas con **marcas de recorte** en las cuatro esquinas (líneas de 14 px, `--cl-charcoal`, 1 px) y un pie de foto en `--font-mono`, mayúsculas, con un cuadradito azul como los marcadores del Hero. Sin sombras ni marcos recargados.
- Título: `--fs-2xl`, segunda línea en `.text-accent` (serif cursiva azul; texto grande ⇒ contraste válido).
- Cuerpo: ancho de lectura ≤ 56 ch; P1 en `--fs-md` como entradilla, P2–P4 en `--fs-base`, color `--cl-text-secondary` (5,58:1).
- Principios: tres columnas con filete superior; título en `--fw-semibold`, descripción en `--fs-sm`.
- Stack: una línea en mono con separadores «·», color `--cl-charcoal`.
- Fondo de sección: se mantiene `--cl-bg-warm` (como hoy). Como el Hero también es crema y Proyectos es blanco, se separa Hero/Sobre mí con un filete `--cl-divider` dentro del contenedor y mayor espacio superior. *(Alternativa descartada: sección oscura para fundir con la foto; añadiría un segundo bloque oscuro junto a Amplify y rompería el ritmo cromático.)*
- Tablet (769–1024): dos columnas 5/7 con espaciados reducidos, foto con `position: sticky` desactivado.
- Móvil (≤ 768): una columna con orden **etiqueta+título → foto → texto**; la foto ocupa el ancho del contenedor (máx. 420 px, centrada) a 4:5; principios apilados; CTA a ancho completo en ≤ 430 px (igual patrón que `.hero__actions .btn`).

## 2. Archivos

| Archivo | Acción | Detalle |
|---|---|---|
| `index.html` | modificar | Mover/reemplazar `section#sobre-mi` tras el Hero; reordenar enlaces del menú (header, menú móvil, footer); añadir `<script>` de una línea en `<head>` que pone `class="js"` en `<html>`. |
| `assets/css/about.css` | reescribir | Estilos `.about-me*`; se retiran `.about__*`, `.skill-group*` y `.about__visual*` (sin otros usos; se verifica con búsqueda). |
| `assets/css/responsive.css` | modificar (mínimo) | Eliminar reglas obsoletas `.about__inner` / `.about__visual` de los breakpoints; los nuevos breakpoints viven en `about.css`. |
| `assets/js/i18n.js` | modificar | Reemplazar claves `about.*` (ES/EN) y añadir soporte `data-i18n-alt` en `apply()` (3 líneas). |
| `assets/js/animations.js` | modificar (mínimo) | Guarda: si no existe `IntersectionObserver`, marcar todo como visible en vez de lanzar error. |
| `assets/css/utilities.css` | modificar *(solo si se aprueba Q-05)* | Bloque global `@media (prefers-reduced-motion: reduce)`. |
| `assets/img/about/cesar-lamper-{480,768,1024}.{avif,webp,jpg}` | crear | Derivados de la foto entregada. |
| `specs/…` | crear | `constitution.md`, `spec.md`, `plan.md`, `tasks.md`. |

No se tocan: `parametric.js`, `navigation.js`, `main.js`, `hero.css`, `projects.css`, `amplify.css`, `contact.css`, `footer.css`, `header.css`.

## 3. Tratamiento de la fotografía
- Origen: PNG 1024×1536 a color, sin edición. Se convierte a sRGB y se eliminan metadatos; **sin retoque ni filtros ni cambio de color**.
- Derivados: anchos 480 / 768 / 1024 (nunca por encima del original). Formatos: AVIF (q≈60), WebP (q≈82), JPEG progresivo (q≈85). Pesos estimados medidos: 480 px → AVIF 7 KB · WebP 11 KB · JPEG 27 KB; 768 px → ~15 / 24 / 61 KB; 1024 px → ~25 / 42 / ~100 KB.
- Marcado: `<picture>` con `<source type="image/avif">`, `<source type="image/webp">` y `<img>` JPEG; `sizes="(max-width: 768px) 88vw, (max-width: 1024px) 42vw, 480px"`; `width="1024" height="1536"`; `loading="lazy" decoding="async"`.
- Recorte: contenedor `aspect-ratio: 4 / 5`; `img { object-fit: cover; object-position: 50% 14% }` (conserva cabeza y torso superior; el reloj queda fuera del recorte, la imagen original no se modifica).
- Alt ES/EN vía `data-i18n-alt` (texto en spec A.1/A.2). Valor ES por defecto en el HTML para que funcione sin JS.

## 4. Animaciones
- **Reutiliza** el `IntersectionObserver` existente y la clase `is-visible`; sin JS nuevo (salvo la guarda de compatibilidad).
- Retrasos por atributo: `data-delay="1…6"` → `transition-delay` de 0, 80, 160, 260, 360, 460 ms (CSS en `about.css`). Duración base 700 ms con `--ease-out`.
- Etiqueta/título/texto: `opacity` + `translateY(16px)` → 0.
- Foto: contenedor con `clip-path: inset(0 0 100% 0)` → `inset(0)` (900 ms, una sola vez) y la imagen interior `scale(1.06)` → `1` (1100 ms). Es el único `clip-path` y afecta a un solo elemento.
- Principios: `data-reveal-group` existente (escalonado 100 ms).
- Una sola reproducción: el observer ya hace `unobserve` tras activarse.
- **Sin JS / sin IO:** el estado oculto solo se aplica bajo `html.js`; selector `.js .about-me [data-reveal]:not(.is-visible)`. Sin la clase `js`, todo se ve (resuelve H-05). La guarda en `animations.js` cubre navegadores sin IO.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` dentro de `about.css`: `transition: none`, `transform: none`, `clip-path: none`, `opacity: 1` en toda la sección.
- Cambio de idioma durante la animación: solo cambia `textContent`; no depende del estado de la animación.

## 5. Multiidioma
- Claves nuevas en `translations.es` y `translations.en`: `about.eyebrow`, `about.title.1/2`, `about.p1…p4`, `about.principle.{1,2,3}.{title,desc}`, `about.stack.label`, `about.stack.ai`, `about.cta`, `about.caption`, `about.photo.alt`.
- Se eliminan las claves de la sección anterior que quedan huérfanas (`about.description`, `about.visual.text`, `about.skill.*`).
- Texto ES como valor por defecto en el HTML; `apply()` lo sobrescribe según idioma guardado. Textos EN redactados de forma natural (spec A.2).

## 6. Accesibilidad
`section` con `aria-labelledby`; un solo `h2`; `figure/figcaption`; `alt` descriptivo; decoraciones (marcas de recorte, filete) en pseudo-elementos o con `aria-hidden`; CTA con el foco global existente (`a:focus-visible`); contraste AA calculado (H-09); orden de DOM = orden de lectura; probado a zoom 200 %.

## 7. Optimización
Imagen lazy con dimensiones reservadas (CLS 0); formatos modernos con respaldo; sin fuentes ni librerías nuevas; CSS en archivo existente; una sola regla `will-change` limitada a la imagen durante la revelación (se retira al terminar con `.is-visible`).

## 8. Estrategia de pruebas (el repo no tiene linter/tests/build)
Automatizadas con Chromium headless (Playwright):
1. Capturas a 360, 390, 768, 1024, 1440, 1920 px, ES y EN.
2. `scrollWidth === clientWidth` en cada ancho.
3. Consola sin errores/avisos.
4. Secuencia de `is-visible` y no retroceso al subir.
5. Emulación `reduced-motion`; JavaScript deshabilitado; `IntersectionObserver` eliminado.
6. Cambio de idioma y persistencia tras recarga; `alt` traducido.
7. Scroll-spy y enlaces del menú.
8. CLS con `PerformanceObserver('layout-shift')`; bytes de imagen realmente descargados.
9. Contraste AA calculado sobre los tokens.
10. Comparación de capturas del Hero/otras secciones antes y después.
Manuales (no automatizables aquí): revisión visual en un teléfono real; Lighthouse/PageSpeed sobre la URL publicada.
Se declararán como **no ejecutables**: linter, type-checking, tests unitarios y build (no existen en el proyecto).

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Duplicar `id="sobre-mi"` o dejar CSS huérfano | Reemplazo (no adición); búsqueda de referencias antes de borrar clases. |
| Contenido invisible sin JS/IO | Estado oculto condicionado a `html.js` + guarda en `animations.js`. |
| Regresión del Hero al reordenar | Capturas antes/después; no se toca `hero.css` ni `parametric.js`. |
| Foto oscura sobre fondo crema se vea «pesada» | Marcas de recorte, filete y pie de foto para integrarla; ajuste visual en T-05 con tu revisión. |
| Texto inglés más largo rompe la composición | Pruebas ES/EN a todos los anchos. |
| Cifras/nombre no verificados del sitio | Se señalan (Q-02, Q-03); no se modifican sin aprobación. |
| No poder subir al repo desde este chat (GitHub devuelve 403 en escritura) | Entrega como `.zip` con script de aplicación, igual que la actualización anterior. |

## 10. Entrega
Paquete `.zip` con los archivos nuevos/modificados completos + `aplicar_cambios.py` (copia archivos y reordena `index.html`), + carpeta `specs/` + informe de validación y matriz de trazabilidad.

# SPEC — Feature 001: Sección personal «Sobre mí» con fotografía

Estado: **APROBADO por el titular (con las decisiones del Addendum) — IMPLEMENTADO Y VALIDADO**
Repositorio: `clamper2006/CL-dev-Portafolio` (rama `main`, versión publicada con logo + animación del hero)

## 1. Objetivo
Incorporar, inmediatamente después del Hero, una sección editorial «Sobre mí» con fotografía profesional y presentación personal, integrada con la identidad visual existente, con entrada progresiva al hacer scroll y soporte ES/EN.

## 2. Contexto (hallazgos del reconocimiento)

| # | Hallazgo | Implicación |
|---|----------|-------------|
| H-01 | Sitio **estático**: HTML + CSS + JS vanilla, sin framework, sin `package.json`, sin build, sin tests ni linter. `.nojekyll` → GitHub Pages. | No hay build/lint/type-check que ejecutar. La validación será manual + automatizada con navegador headless. |
| H-02 | Orden actual: Hero → **Proyectos** → **Sobre mí** → Amplify → Contacto. Ya existe `<section id="sobre-mi">` con título «Tecnología con propósito.», un párrafo genérico y 4 tarjetas de skills. | La nueva sección **debe moverse** a justo después del Hero. Hay que decidir qué pasa con la existente (Q-01). |
| H-03 | Las skills actuales (React, Next.js, Vue, Node.js, Laravel, Python, React Native, Docker, AWS, Figma) **no coinciden** con las declaradas por el titular (HTML, CSS, JavaScript, PHP, SQL, Flutter). | Contenido placeholder; contradice la regla de no inventar. |
| H-04 | i18n: objeto `translations` (es/en) en `assets/js/i18n.js`; atributos `data-i18n`, `data-i18n-html`, `data-i18n-aria`; idioma en `localStorage('cl-lang')`. **No existe** `data-i18n-alt`. | Para traducir el `alt` de la foto hay que añadir ese atributo (cambio mínimo en `apply()`). |
| H-05 | Reveal: `[data-reveal]` / `[data-reveal-group]` + `IntersectionObserver` (`animations.js`), CSS en `utilities.css`. El estado oculto (`opacity:0`) se aplica **siempre**, también sin JS. Delays escalonados solo por `nth-child` en grupos. | Sin JS el contenido queda invisible → incumple RF-06. Se necesita un estado oculto condicionado a una clase `js`. |
| H-06 | `animations.js` lanza error si el navegador no soporta `IntersectionObserver`; con `prefers-reduced-motion` añade `is-visible` pero las transiciones CSS siguen ejecutándose (no hay regla `@media (prefers-reduced-motion)` en el CSS). | Hay que endurecer ambos casos para la nueva sección (y se recomienda globalmente, ver Q-05). |
| H-07 | Scroll-spy (`navigation.js`) observa `section[id]` y enlaza con `.nav__link[href^="#"]`. | Reutilizar el id `sobre-mi` mantiene nav y scroll-spy funcionando sin tocar JS. |
| H-08 | Tokens: `--cl-bg-warm #F5F4F0`, `--cl-charcoal #101820`, `--cl-blue #3478F6`, `--font-display` (Playfair Display italic, acento), `--font-body` (Plus Jakarta Sans), `--font-mono` (Space Mono, cargada pero poco usada), easings `--ease-out`, duraciones 220/400/700 ms. Breakpoints usados: 1024, 768, 430, 360 px. | Se reutilizan tal cual. |
| H-09 | Contraste medido sobre `#F5F4F0`: `--cl-text-secondary` 5,58:1 ✔; `--cl-text-muted` **4,06:1** ✘ (AA texto pequeño); `--cl-blue` **3,70:1** (solo válido para texto grande/gráficos). | En la nueva sección el texto pequeño usa `secondary`/`charcoal`; el azul solo en acento grande y detalles gráficos. |
| H-10 | Foto recibida: PNG 1024×1536 (2:3), 1,7 MB, **a color** (el nombre de archivo dice «blanco y negro» pero no lo es), fondo de estudio casi negro (~#101010), rostro en el tercio superior, centrado. | Se conserva a color. Hay que generar derivados web; no se debe escalar por encima de 1024 px de ancho. |
| H-11 | Datos del sitio a revisar: `<meta author>` y descripción dicen **«César Alejandro»** (el brief dice «César Lamper»). El Hero muestra «+5 años de experiencia», «10+ proyectos completados», «100%». | Posibles datos no verificados (Q-02, Q-03). Fuera de alcance salvo aprobación. |

## 3. Alcance
**Incluye:** nueva sección «Sobre mí» (markup, CSS, i18n ES/EN, animación de entrada), derivados optimizados de la foto, ajuste mínimo de `i18n.js` (soporte `data-i18n-alt`) y `animations.js` (guarda de compatibilidad), reordenamiento de la sección y del orden del menú.
**Excluye:** ver §11.

## 4. Historias de usuario
- **HU-01** Como visitante, quiero ver quién está detrás del portafolio (rostro y presentación) justo después del Hero para generar confianza rápidamente.
- **HU-02** Como visitante móvil, quiero una composición pensada para pantalla pequeña, con lectura cómoda y sin saltos.
- **HU-03** Como visitante angloparlante, quiero la misma sección en inglés natural al cambiar el idioma.
- **HU-04** Como visitante con sensibilidad al movimiento, quiero leer todo el contenido sin animaciones.
- **HU-05** Como titular, quiero que lo escrito sea veraz y suene a mí, sin cifras ni logros inventados.

## 5. Requisitos funcionales
- **RF-01** La sección aparece inmediatamente después del Hero y antes de Proyectos; conserva `id="sobre-mi"`.
- **RF-02** Muestra la fotografía proporcionada, sin alterar rostro, color, vestimenta ni aplicar filtros.
- **RF-03** La foto se adapta a cada tamaño de pantalla con `object-fit`/`object-position`; el rostro y la cabeza nunca quedan recortados.
- **RF-04** Todo el texto visible (etiqueta, título, párrafos, principios, stack, CTA, alt) se sirve desde `translations` ES/EN y cambia al alternar idioma sin recargar.
- **RF-05** Entrada progresiva en este orden: etiqueta → título → foto → párrafos → elementos secundarios, con retrasos escalonados de 80–140 ms, una sola vez por carga (no se reinicia).
- **RF-06** Sin JavaScript, sin soporte de `IntersectionObserver` o con animaciones desactivadas, todo el contenido es visible.
- **RF-07** Etiqueta editorial «SOBRE MÍ / ABOUT ME» (clase `.eyebrow`) y título con parte en acento serif cursivo (`.text-accent`).
- **RF-08** El texto cumple el checklist de veracidad (Apéndice A.3): sin experiencia, empresas, años, proyectos, resultados ni certificaciones inventadas.
- **RF-09** Elementos secundarios: tres principios de trabajo (automatizar, optimizar, simplificar) y una línea de stack con **solo** HTML, CSS, JavaScript, PHP, SQL y Flutter, más mención a IA aplicada al desarrollo.
- **RF-10** Un CTA hacia `#contacto` con las clases de botón existentes.
- **RF-11** El enlace «Sobre mí» del menú (escritorio, móvil y footer) y el scroll-spy funcionan; el orden del menú refleja el nuevo orden de secciones.
- **RF-12** La foto tiene `alt` descriptivo y traducido (ES/EN).
- **RF-13** La sección «Sobre mí» anterior se sustituye (no se duplica ni queda un `id` repetido) — sujeto a Q-01.

## 6. Requisitos no funcionales
- **RNF-01** Responsive de 320 a 1920 px sin desbordamiento horizontal; composición móvil propia.
- **RNF-02** Respeta `prefers-reduced-motion: reduce` (sin transiciones ni desplazamientos).
- **RNF-03** Sin regresiones en Hero (incluida la animación de partículas), Proyectos, Amplify, Contacto, header y footer.
- **RNF-04** Foto en AVIF + WebP + JPEG de respaldo, con tres anchos (480/768/1024 px); un móvil descarga ≤ 40 KB de imagen en AVIF/WebP.
- **RNF-05** CLS atribuible a la sección = 0 (`width`/`height` en `<img>` + `aspect-ratio` en el contenedor).
- **RNF-06** Solo se anima `opacity` y `transform` (más un `clip-path` puntual sobre un único elemento); sin listeners de scroll; se reutiliza el observer existente.
- **RNF-07** Cero dependencias nuevas; sin librerías de animación.
- **RNF-08** Contraste AA: texto normal ≥ 4,5:1, texto grande ≥ 3:1.
- **RNF-09** Navegable por teclado; foco visible en el CTA; orden de lectura coherente con el orden visual.
- **RNF-10** CSS mantenible: clases BEM con prefijo `about-`, solo tokens existentes, sin duplicar utilidades.
- **RNF-11** SEO: un único `<h2>` en la sección, `<figure>/<figcaption>` o equivalente semántico, `alt` real; no se cambian `<title>` ni metadatos salvo aprobación (Q-02).

## 7. Criterios de aceptación (verificables)
- **CA-01 (RF-01/11/13)** Dado el DOM final, `section#sobre-mi` es el hermano inmediato posterior a `section#inicio`, existe una sola vez y el menú enlaza a ella.
- **CA-02 (RF-02/03)** A 360, 390, 768, 1024, 1440 y 1920 px de ancho, la cabeza completa es visible y la imagen no se deforma.
- **CA-03 (RF-04/12)** Al pulsar EN, todos los textos de la sección (y el `alt`) cambian; al recargar se conserva el idioma.
- **CA-04 (RF-05)** Al hacer scroll, los elementos reciben `is-visible` en el orden definido y no se retraen al volver a subir.
- **CA-05 (RF-06)** Con JavaScript deshabilitado, con `IntersectionObserver` ausente y con `prefers-reduced-motion`, el contenido es visible desde el primer render.
- **CA-06 (RNF-01)** `document.documentElement.scrollWidth === clientWidth` en todos los anchos probados.
- **CA-07 (RNF-04/05)** Peso de imagen servido y CLS medidos y dentro de los umbrales.
- **CA-08 (RNF-03)** Capturas del Hero y del resto del sitio sin diferencias respecto a la versión actual, salvo el orden; consola sin errores.
- **CA-09 (RNF-08)** Todos los pares texto/fondo de la sección cumplen AA.

## 8. Casos límite
- Imagen que no carga: el contenedor conserva su proporción y el fondo oscuro; el `alt` queda disponible.
- Texto inglés más largo que el español: la composición no se rompe (se prueba con ambos).
- Pantallas muy anchas (≥ 1920) y muy estrechas (320).
- Zoom del navegador al 200 % y tamaño de fuente aumentado.
- Navegación directa a `/#sobre-mi`: el contenido ya visible no debe quedarse oculto esperando al observer.
- Modo claro/oscuro del sistema: el sitio es solo claro; la foto con fondo oscuro debe verse correcta sobre el fondo crema.
- Cambio de idioma mientras la animación está en curso.

## 9. Dependencias
Fuentes ya cargadas (Plus Jakarta Sans, Playfair Display italic, Space Mono); `i18n.js`; `animations.js`; `utilities.css`; la foto entregada por el titular (disponible en esta conversación; se generarán derivados en `assets/img/about/`).

## 10. Consideraciones transversales
- **Accesibilidad:** `<section aria-labelledby>`, un `h2`, `figure` con `alt` descriptivo, CTA con foco visible, contraste AA, sin información transmitida solo por color.
- **Responsive:** DOM en orden `cabecera → foto → cuerpo`; `grid-template-areas` lo recoloca en escritorio (foto en columna izquierda a sangre vertical) y en móvil queda `etiqueta/título → foto → texto`.
- **Rendimiento:** `loading="lazy"`, `decoding="async"`, `sizes` ajustado, derivados sin escalar por encima de 1024 px.

## 11. Fuera de alcance
Certificados, nueva sección de habilidades, reestructuración del Hero, rediseño global, nuevos proyectos, cambios de identidad global. Tampoco se modifican (sin aprobación): las cifras del Hero, los metadatos `author`/`description`/Open Graph, ni otras secciones.

## 12. Preguntas pendientes (requieren tu decisión)
- **Q-01 — Sección «Sobre mí» existente.** Recomendado: **mover y reemplazar** la sección actual (mismo `id`), eliminando las 4 tarjetas de skills placeholder. Alternativa: conservarla donde está y añadir la nueva con otro id (dejaría dos secciones «Sobre mí»).
- **Q-02 — Nombre.** El brief dice **César Lamper**; los metadatos dicen «César Alejandro». Propuesta: usar «César Lamper» en la sección y, si lo apruebas, corregir `author`/`description`.
- **Q-03 — Cifras del Hero** («+5 años», «10+ proyectos», «100 %»). Contradicen la regla de no inventar. Propuesta: no tocarlas en esta feature y revisarlas aparte.
- **Q-04 — Menú.** Con el nuevo orden, propuesta: Inicio · Sobre mí · Proyectos · Amplify · Contacto (menú, menú móvil y footer).
- **Q-05 — `prefers-reduced-motion` global.** Hoy las demás secciones siguen animando con esa preferencia activada. Propuesta: añadir 6 líneas globales en `utilities.css` (afecta a todo el sitio; solo reduce movimiento).
- **Q-06 — CTA.** El actual «Conocer más» lleva a Contacto. Propuesta: «Hablemos de tu proyecto» / «Let's talk about your project» → `#contacto`.

---

## Apéndice A — Contenido propuesto

### A.1 Español
- Etiqueta: **SOBRE MÍ**
- Título: **Detrás del código hay una persona** / *que busca transformar ideas en soluciones.*
- P1: Soy César Lamper, desarrollador web y de aplicaciones venezolano. Joven, ambicioso y apasionado por la tecnología cuando sirve para resolver problemas reales.
- P2: Trabajo tanto en frontend como en backend, y combino programación, herramientas modernas e inteligencia artificial para construir sitios, aplicaciones y sistemas a la medida de cada necesidad.
- P3: Pero lo que más me interesa ocurre antes del código: entender a las personas, conocer sus negocios y detectar qué procesos puede mejorar la tecnología. Un buen sistema no solo funciona: simplifica el trabajo, ahorra tiempo y deja que cada quien se concentre en lo que de verdad importa.
- P4: Mi objetivo es convertir ideas y necesidades reales en herramientas digitales útiles, eficientes y listas para crecer.
- Principios: **Automatizar** — tareas repetitivas · **Optimizar** — procesos y operaciones · **Simplificar** — el día a día de cada negocio
- Stack (etiqueta «STACK»): HTML · CSS · JavaScript · PHP · SQL · Flutter — y la IA aplicada al desarrollo.
- CTA: Hablemos de tu proyecto
- Pie de foto: César Lamper — Desarrollador web y de aplicaciones
- Alt: Retrato de César Lamper: joven de cabello rizado, con chaqueta y camisa negras, sobre un fondo oscuro de estudio.

### A.2 English
- Label: **ABOUT ME**
- Title: **Behind the code is a person** / *looking to turn ideas into solutions.*
- P1: I'm César Lamper, a Venezuelan web and app developer. Young, ambitious and passionate about technology when it solves real problems.
- P2: I work across frontend and backend, combining programming, modern tools and artificial intelligence to build websites, apps and systems tailored to each need.
- P3: But what interests me most happens before the code: understanding people, getting to know their businesses and spotting the processes technology can improve. A good system doesn't just work — it simplifies the job, saves time and lets people focus on what truly matters.
- P4: My goal is to turn real ideas and needs into digital tools that are useful, efficient and ready to grow.
- Principles: **Automate** — repetitive tasks · **Optimize** — processes and operations · **Simplify** — each business's day to day
- Stack label «STACK»: HTML · CSS · JavaScript · PHP · SQL · Flutter — plus AI applied to development.
- CTA: Let's talk about your project
- Caption: César Lamper — Web and app developer
- Alt: Portrait of César Lamper: a young man with curly hair, wearing a black jacket and shirt, against a dark studio background.

### A.3 Checklist de veracidad
Todo lo afirmado procede del brief: nacionalidad, perfil «joven y ambicioso», frontend + backend, IA aplicada, enfoque en entender negocios y automatizar. **No aparece:** años de experiencia, empresas, clientes, proyectos concretos, métricas, certificaciones, ubicación de residencia.

## Apéndice B — Matriz de trazabilidad (se completa en la validación)

| Requisito | Implementación (tarea) | Evidencia | Estado |
|---|---|---|---|
| RF-01 | T-04 | DOM/captura | Pendiente |
| RF-02/03 | T-02, T-05 | Capturas por ancho | Pendiente |
| RF-04/12 | T-03 | Prueba ES/EN | Pendiente |
| RF-05 | T-06 | Secuencia de `is-visible` | Pendiente |
| RF-06 | T-06, T-07 | Pruebas sin JS / sin IO | Pendiente |
| RF-07..10 | T-04, T-05 | Captura + revisión de copy | Pendiente |
| RF-11/13 | T-04 | Scroll-spy / DOM | Pendiente |
| RNF-01 | T-05 | `scrollWidth` | Pendiente |
| RNF-02 | T-06 | Emulación reduced-motion | Pendiente |
| RNF-03 | T-09 | Capturas antes/después | Pendiente |
| RNF-04/05 | T-02, T-09 | Pesos + CLS | Pendiente |
| RNF-08 | T-05, T-09 | Cálculo de contraste | Pendiente |


---

## Addendum — Decisiones aprobadas por el titular (prevalecen sobre el borrador)

| Pregunta | Decisión | Efecto en la implementación |
|---|---|---|
| Q-01 | Mover y reestructurar «Sobre mí» con la nueva foto, **conservando las tarjetas de skills** (solo corregir su contenido). | Se mantiene el estilo de las 4 tarjetas, ahora en fila bajo la composición. Contenido real: **Frontend** HTML, CSS, JavaScript, React, Next.js · **Backend** PHP, SQL, Supabase, Python (aprendiendo) · **Mobile** Flutter · **Herramientas** Git. Se eliminan Vue, Node.js, Laravel, React Native, Docker, Figma y AWS. *Sustituye a RF-09 (principios + línea de stack), que se descarta.* |
| Q-02 | Aprobado: usar «César Lamper». | Corregidos `meta author` y `meta description`. |
| Q-03 | El titular confirma **más de 3 años de experiencia**, más de 10 proyectos y compromiso al 100 %. | Estadística del Hero: «+5» → «+3» (ES/EN). La experiencia también se menciona en el primer párrafo de «Sobre mí». |
| Q-04 | Aprobado. | Menú: Inicio · Sobre mí · Proyectos · Amplify · Contacto (header, menú móvil y footer). |
| Q-05 | **No** tocar el movimiento de las demás secciones. | `utilities.css` no se modifica; T-08 cancelada. La nueva sección usa el mismo sistema de reveal. Solo en la nueva sección se mantiene la salvaguarda `prefers-reduced-motion` exigida en el brief original (afecta únicamente a visitantes que tengan activada esa opción del sistema). |
| Q-06 | Aprobado. | CTA: «Hablemos de tu proyecto» / «Let's talk about your project» → `#contacto`. |

Contenido final del texto: ver `assets/js/i18n.js` (claves `about.*`). Cambio respecto al Apéndice A: P1 incluye «con más de tres años de experiencia».

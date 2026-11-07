# Constitución del proyecto — CL Developer

Principios que gobiernan toda actualización. Propuesta inicial (el repo no tenía una constitución previa).

1. **Preservar la identidad visual.** Se usan los tokens de `assets/css/variables.css` (colores, tipografías, espaciados, radios, easings). No se introducen colores, fuentes ni sistemas nuevos.
2. **Evolucionar, no reescribir.** Cambios localizados. No se reemplazan componentes que ya funcionan ni se tocan secciones ajenas a la feature.
3. **Cero dependencias nuevas.** Sitio estático (HTML/CSS/JS vanilla, GitHub Pages, sin build). Se reutiliza lo existente: `i18n.js`, `animations.js` (IntersectionObserver), `navigation.js`.
4. **Contenido primero, animación después.** Todo contenido debe ser legible sin JavaScript, sin animaciones y con `prefers-reduced-motion`.
5. **Accesibilidad como requisito.** Semántica correcta, foco visible, contraste WCAG AA (4,5:1 texto normal), texto alternativo real.
6. **Móvil como diseño propio**, no como versión reducida del escritorio.
7. **Rendimiento medible.** Imágenes optimizadas y con dimensiones declaradas (CLS = 0), animaciones solo con `transform`/`opacity`, sin listeners de scroll.
8. **Multiidioma único.** Todo texto visible vive en `translations` (ES/EN) de `i18n.js`. No hay sistemas paralelos.
9. **Veracidad.** No se inventa experiencia, empresas, años, proyectos, resultados ni certificaciones. Solo se publica lo que el titular afirmó.
10. **Verificar antes de dar por hecho.** Una tarea está terminada cuando está implementada **y** verificada, con evidencia.
11. **Cambios reversibles y pequeños.** Una tarea, un cambio verificable; no se sobrescribe trabajo local del titular.

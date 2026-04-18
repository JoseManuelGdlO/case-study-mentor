# Frontend ENARMX

## Google Search Console (SEO)

Pasos para el equipo (requiere acceso a la cuenta de Google del dominio):

1. En [Google Search Console](https://search.google.com/search-console), añade la propiedad **Dominio** `enarmx.com.mx` (recomendado) o el prefijo de URL `https://enarmx.com.mx/`.
2. Completa la verificación DNS o archivo HTML que indique Google.
3. En **Sitemaps**, envía: `https://enarmx.com.mx/sitemap.xml`.
4. Tras cada despliegue relevante, usa **Inspección de URLs** con `/`, `/precios` y `/recursos`.
5. Revisa periódicamente **Páginas** (indexación), **Experiencia** (Core Web Vitals) y avisos de datos estructurados.

El sitemap estático vive en [`public/sitemap.xml`](public/sitemap.xml); actualízalo cuando añadas rutas públicas nuevas.

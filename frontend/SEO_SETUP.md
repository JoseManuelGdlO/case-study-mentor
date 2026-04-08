# SEO y analítica (pasos fuera del código)

Checklist para completar la configuración en **Google** y **Meta** después del deploy.

## Variables de entorno (build)

| Variable | Uso |
|----------|-----|
| `VITE_SITE_URL` | Origen canónico sin barra final (ej. `https://enarmx.com.mx`). Si no se define, el frontend usa `https://enarmx.com.mx`. |
| `VITE_APP_NAME` | Nombre de marca en textos de compartir (default `ENARMX`). |

## Google Search Console

1. Ir a [Google Search Console](https://search.google.com/search-console) y añadir la propiedad **Dominio** o **Prefijo de URL** para `enarmx.com.mx`.
2. Verificar el dominio (registro DNS TXT o archivo HTML en el host).
3. En **Sitemaps**, enviar `https://enarmx.com.mx/sitemap.xml`.
4. Revisar periódicamente **Rendimiento**, **Páginas** y **Experiencia** (Core Web Vitals).

## Google Analytics 4 (GA4)

1. Crear una propiedad GA4 en [Google Analytics](https://analytics.google.com/).
2. Obtener el **ID de medición** (formato `G-XXXXXXXXXX`).
3. Añadir el snippet de gtag en `index.html` junto al tag de Google Ads existente, o usar Google Tag Manager.
4. Marcar eventos de conversión relevantes (p. ej. registro, compra) en la configuración de GA4.

## Google Ads (ya integrado)

El sitio incluye `gtag` con ID `AW-793415829`. Mantener coherencia entre URLs de destino y parámetros UTM de las campañas.

## Meta (Facebook) — depuración de enlaces

- [Sharing Debugger](https://developers.facebook.com/tools/debug/): pegar URLs públicas y forzar rescrapeo tras cambiar `og:image` o textos.
- Si se instala **Meta Pixel**, documentar el uso de cookies en la política de privacidad y el banner de consentimiento si aplica.

## Archivos estáticos

Tras cada deploy, comprobar que respondan en producción:

- `/robots.txt`
- `/sitemap.xml`
- `/og-default.png`
- `/logotiposolo.png` (logo para JSON-LD y enlaces legacy)

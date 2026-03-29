

# Onboarding Tour — Guía interactiva para nuevos usuarios

## Resumen
Crear un tour guiado paso a paso que se muestre la primera vez que el usuario entra al Dashboard. Aplica blur/overlay oscuro a todo excepto la sección destacada, con tooltip explicativo y botones Siguiente/Omitir.

---

## Cambios

### 1. Componente `OnboardingTour` (`src/components/OnboardingTour.tsx`)
- Overlay oscuro semi-transparente que cubre toda la pantalla
- "Spotlight" (recorte) sobre el elemento destacado usando coordenadas del DOM (`getBoundingClientRect`)
- Tooltip flotante junto al spotlight con: título, descripción, botón "Siguiente" y "Omitir tour"
- Indicador de progreso (paso 2 de 6, etc.)
- Usa `z-index` alto para estar por encima de todo

### 2. Pasos del tour (5-6 pasos)
1. **Sidebar "Nuevo Examen"** — "Aquí puedes crear un examen personalizado con las preguntas y especialidades que quieras"
2. **Dashboard principal** — "Este es tu panel principal donde verás tu progreso y exámenes recientes"
3. **Countdown ENARM** — "Aquí verás cuánto falta para el próximo ENARM"
4. **Mis Exámenes** (sidebar) — "Consulta todos tus exámenes creados y continúa donde te quedaste"
5. **Estadísticas** (sidebar) — "Revisa tu rendimiento por especialidad y tu evolución"
6. **Suscripción** (sidebar) — "Desbloquea el acceso completo a todos los casos clínicos"

### 3. Lógica de activación
- En `StudentLayout.tsx`, verificar `localStorage.getItem('onboarding-completed')`
- Si no existe, mostrar `<OnboardingTour />` sobre el layout
- Al terminar o saltar, guardar `localStorage.setItem('onboarding-completed', 'true')`

### 4. Mecánica del spotlight
- Cada paso referencia un `data-tour="step-name"` en el elemento objetivo
- Agregar estos `data-tour` attributes a los elementos del sidebar y dashboard
- El componente usa `getBoundingClientRect()` + `useEffect` para posicionar el recorte
- El overlay se logra con un SVG o CSS `clip-path` que recorta el área del elemento destacado
- Transición suave al cambiar de paso

### 5. Archivos a modificar
- **Crear**: `src/components/OnboardingTour.tsx`
- **Editar**: `src/components/StudentLayout.tsx` — agregar `data-tour` attrs y montar el componente
- **Editar**: `src/pages/Dashboard.tsx` — agregar `data-tour` attrs a secciones clave

---

## Detalles técnicos
- Spotlight con SVG overlay: un `<rect>` que cubre todo con un `<rect>` recortado (usando mask) para el hueco
- `ResizeObserver` para recalcular posición si cambia el layout
- Tooltip posicionado automáticamente (arriba/abajo/izquierda/derecha) según espacio disponible
- Todo CSS puro + React state, sin librerías externas


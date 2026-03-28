

# Sistema de Suscripciones — Free vs Premium

## Resumen
Agregar un sistema de usuario free/premium con restricciones, página de suscripción con planes (Mensual $200, Semestral $1,000, Anual $2,100), y pasarela de pago mock (PayPal + Stripe).

---

## Cambios

### 1. Contexto de usuario (`src/contexts/UserContext.tsx`)
- Crear un React Context que almacene el estado del usuario: `{ plan: 'free' | 'monthly' | 'semester' | 'annual' }`
- Helper `isFreeUser` derivado del plan
- Por defecto el usuario será `free`
- Wrappear la app con este provider

### 2. Página de Suscripción (`src/pages/Subscription.tsx`)
- 3 cards con los planes: Mensual ($200 MXN/mes), Semestral ($1,000 MXN), Anual ($2,100 MXN)
- Resaltar el plan anual como "Mejor valor"
- Mostrar ahorro en semestral y anual
- Botones de PayPal y Stripe (mock — al hacer click simula la suscripción actualizando el contexto)
- Agregar ruta `/dashboard/subscription`

### 3. Dashboard — Indicadores free (`src/pages/Dashboard.tsx`)
- Banner superior para usuarios free: "Estás en la versión gratuita — Suscríbete para acceso completo"
- Botón "Suscribirme" que navega a `/dashboard/subscription`
- Si es free, ocultar o bloquear la sección de estadísticas rápidas (mostrar candado con CTA)

### 4. NewExam — Límite de 10 preguntas (`src/pages/NewExam.tsx`)
- Si `isFreeUser`: mostrar solo la opción de 10 preguntas en el paso de cantidad
- Las demás opciones (20, 50, 100) aparecen con candado y tooltip "Disponible con suscripción"
- Badge informativo: "Plan gratuito: máximo 10 preguntas por examen"

### 5. Estadísticas — Bloqueo para free (`src/pages/Statistics.tsx`)
- Si `isFreeUser`: mostrar overlay/blur con mensaje "Suscríbete para ver tus estadísticas completas" y botón de suscripción

### 6. Sidebar — Enlace de suscripción (`src/components/StudentLayout.tsx`)
- Agregar item "Suscripción" con icono de corona/estrella en el sidebar
- Para usuarios free, resaltarlo visualmente (badge "PRO" o color diferente)

### 7. Navegación (`src/App.tsx`)
- Agregar ruta `subscription` dentro del layout de estudiante

---

## Detalles técnicos
- Precios en MXN: Mensual $200, Semestral $1,000, Anual $2,100
- Todo mock/frontend — el "pago" simplemente cambia el estado del contexto
- El contexto se reseteará al recargar (sin persistencia por ahora)


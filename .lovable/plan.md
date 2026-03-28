

# Backoffice Completo — Panel de Administración ENARM Prep

## Resumen
Expandir el backoffice actual (que solo tiene casos clínicos) para incluir: Dashboard con estadísticas del sistema, gestión de usuarios, gestión de suscripciones/precios, y catálogo de especialidades/categorías.

---

## Nuevas páginas

### 1. Dashboard del Backoffice (`src/pages/backoffice/BackofficeDashboard.tsx`)
- Cards con métricas: total usuarios, usuarios activos, suscripciones activas (por tipo), total de casos publicados, total de preguntas, ingresos estimados
- Gráfica de nuevos usuarios por semana
- Gráfica de exámenes realizados por semana
- Top 5 especialidades más estudiadas
- Todo con datos mock

### 2. Gestión de Usuarios (`src/pages/backoffice/UserManagement.tsx`)
- Tabla con usuarios del sistema (estudiantes): nombre, email, plan (free/mensual/semestral/anual), fecha de registro, último acceso, estado (activo/suspendido)
- Filtros por plan y estado
- Búsqueda por nombre/email
- Acciones: ver detalle, suspender/activar, cambiar plan manualmente
- Sección separada o tab para **usuarios administrativos** (editores): nombre, email, rol (admin/editor), fecha de creación
- Botón para invitar nuevo editor

### 3. Configuración de Precios (`src/pages/backoffice/PricingConfig.tsx`)
- 3 cards editables (Mensual, Semestral, Anual) con campos para precio, nombre del plan, y descripción
- Inputs editables con botón de guardar (mock, actualiza estado local)
- Preview de cómo se verían los planes para el usuario

### 4. Gestión de Especialidades (`src/pages/backoffice/SpecialtyManagement.tsx`)
- Lista de especialidades (categorías) existentes con sus subcategorías
- Agregar/editar/eliminar especialidad
- Agregar/editar/eliminar subcategoría dentro de cada especialidad
- Layout tipo acordeón: cada especialidad se expande para mostrar subcategorías
- Contador de casos clínicos asociados a cada especialidad/subcategoría

### 5. Estadísticas del Sistema (`src/pages/backoffice/SystemStats.tsx`)
- Métricas detalladas: precisión promedio de todos los usuarios, distribución de dificultad en preguntas, tasa de abandono de exámenes
- Gráficas: rendimiento por especialidad, distribución de planes, tendencia de registros
- Tabla de preguntas más falladas

---

## Cambios a archivos existentes

### Sidebar (`src/components/BackofficeLayout.tsx`)
- Actualizar navegación con nuevos items:
  - Dashboard (icono LayoutDashboard) → `/backoffice`
  - Casos Clínicos (FileText) → `/backoffice/cases`
  - Especialidades (FolderTree) → `/backoffice/specialties`
  - Usuarios (Users) → `/backoffice/users`
  - Precios (CreditCard) → `/backoffice/pricing`
  - Estadísticas (BarChart3) → `/backoffice/stats`
- Cambiar el botón "Nuevo Caso" por uno contextual o mantenerlo como acceso rápido

### Rutas (`src/App.tsx`)
- Agregar las nuevas rutas dentro del grupo `/backoffice`:
  - `/backoffice` → BackofficeDashboard
  - `/backoffice/cases` → CaseList (mover de index)
  - `/backoffice/specialties` → SpecialtyManagement
  - `/backoffice/users` → UserManagement
  - `/backoffice/pricing` → PricingConfig
  - `/backoffice/stats` → SystemStats

### Mock Data (`src/data/mockData.ts`)
- Agregar datos mock de usuarios del sistema (8-10 usuarios con diferentes planes)
- Agregar datos mock de usuarios administrativos (3-4 editores)
- Agregar métricas mock del sistema

---

## Detalles técnicos
- Todas las páginas son frontend puro con datos mock
- Mismos componentes UI (shadcn) y estilo visual del backoffice actual
- Las acciones (guardar precios, suspender usuario, etc.) actualizan estado local con toast de confirmación
- Gráficas con Recharts (ya disponible en el proyecto)


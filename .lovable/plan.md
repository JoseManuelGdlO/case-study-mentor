
# ENARM Prep — Plataforma de Preparación para el ENARM

## Visión General
Plataforma web para que médicos recién egresados se preparen para el examen ENARM, con dos modos de práctica (simulación y estudio) y un backoffice para editores de contenido.

## Estilo Visual
- **Vibrante y juvenil**: Gradientes modernos (púrpura/azul/teal), bordes redondeados, iconografía friendly
- Tipografía limpia y legible, cards con sombras suaves
- Dark/light mode ready, interfaz amigable para sesiones de estudio largas

---

## Pantallas a Construir

### 🔐 1. Login / Registro
- Pantalla de bienvenida con branding de la plataforma
- Formulario de email/contraseña + botón "Continuar con Google"
- Opción de registro con campos básicos (nombre, email, contraseña)

### 🏠 2. Dashboard del Estudiante
- **Saludo personalizado** con nombre del usuario
- **Exámenes en curso**: Cards mostrando exámenes iniciados (progreso %, modo, fecha)
- **Botón destacado "Nuevo Examen"**
- **Estadísticas rápidas**: Total de preguntas contestadas, % de aciertos general, racha de días estudiando
- **Historial de exámenes terminados** con calificación y fecha

### 📝 3. Crear Nuevo Examen
Formulario paso a paso:
1. **Idioma**: Español o Inglés
2. **Modo**: Simulación o Estudio (con descripción de cada uno)
3. **Categorías**: Selección múltiple de especialidades (Medicina Interna, Cirugía, Pediatría, Ginecología y Obstetricia)
4. **Subcategorías**: Se despliegan según la especialidad elegida (Cardiología, Dermatología, etc.)
5. **Número de preguntas**: Selector (10, 20, 50, 100, personalizado)
6. **Resumen y botón "Comenzar Examen"**

### 📋 4. Pantalla de Examen — Modo Simulación
- Barra superior con: timer, número de pregunta actual / total, botón "Terminar examen"
- **Caso clínico** a la izquierda (texto + imágenes si aplica)
- **Pregunta + 4 opciones (A-D)** a la derecha
- Navegación entre preguntas (anterior/siguiente)
- Al finalizar: pantalla de **resultados** con calificación, desglose por categoría, y revisión pregunta por pregunta

### 📚 5. Pantalla de Examen — Modo Estudio
- Mismo layout que simulación PERO:
- Al seleccionar una respuesta, **inmediatamente** marca correcta (verde) e incorrecta (rojo)
- Se despliega la **explicación** de la respuesta correcta
- Sección "En Resumen" y "Bibliografía"
- Se resalta el texto relevante del caso clínico
- Botón "Siguiente pregunta"

### 📊 6. Estadísticas del Estudiante
- Gráfica de rendimiento a lo largo del tiempo
- Desglose de aciertos por especialidad y subcategoría
- Áreas fuertes vs áreas débiles
- Total de exámenes y preguntas contestadas

### 🔧 7. Backoffice — Panel de Editores
- Sidebar con navegación: "Casos Clínicos", "Biblioteca"
- **Lista de casos clínicos** con filtros (especialidad, área, idioma, estado)
- Vista de tabla con acciones (editar, ver, eliminar)

### ➕ 8. Backoffice — Crear/Editar Caso Clínico
Formulario completo:
1. **Clasificación**: Especialidad → Área/Subespecialidad → Tema → Idioma
2. **Texto del caso clínico** (editor de texto) + opción de adjuntar imagen
3. **Preguntas** (mínimo 1, botón "Agregar otra pregunta"):
   - Texto de la pregunta + imagen opcional
   - 4 opciones (A-D) cada una con: texto, imagen opcional, marcar como correcta, explicación
   - "En Resumen" y "Bibliografía"
   - Nivel de dificultad (Baja, Media, Alta)

---

## Navegación
- **Estudiante**: Sidebar o navbar con Dashboard, Mis Exámenes, Estadísticas, Perfil
- **Editor/Admin**: Navbar separada con acceso al backoffice de editores
- Toda la data será mockeada con ejemplos médicos realistas

## Notas
- Todo frontend con datos de ejemplo (sin backend aún)
- Preparado para integrar autenticación con Google y Supabase en la siguiente fase
- Diseño responsive (desktop-first pero funcional en móvil)

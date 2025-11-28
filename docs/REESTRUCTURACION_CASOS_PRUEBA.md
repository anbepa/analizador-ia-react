# Reestructuración Completa: De Análisis de Flujo a Casos de Prueba

## Resumen de Cambios

Se ha reestructurado completamente la aplicación para generar **Casos de Prueba** en lugar de análisis de flujo paso a paso, siguiendo el formato de "Matriz de Ejecución de Casos de Prueba".

---

## 1. Nueva Estructura de Datos

### Campos del Caso de Prueba:
- **id_caso**: Identificador único (ej: "GB05108_CP1", "CP-LOGIN-001")
- **escenario_prueba**: Título descriptivo del caso
- **precondiciones**: Condiciones previas necesarias
- **pasos**: Array de pasos con `numero_paso`, `descripcion`, `imagen_referencia`
- **resultado_esperado**: Resultado esperado GENERAL del caso completo
- **resultado_obtenido**: Resultado obtenido tras la ejecución
- **historia_usuario**: Historia de usuario asociada (ej: "GB05108")
- **set_escenarios**: Set o grupo de escenarios
- **fecha_ejecucion**: Fecha de ejecución
- **estado_general**: "Pendiente", "Exitoso", "Fallido"

---

## 2. Archivos Modificados

### 2.1 Base de Datos (`db_migration_new_structure.sql`)
**Acción requerida**: Ejecutar este script en Supabase

```sql
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS id_caso TEXT,
ADD COLUMN IF NOT EXISTS escenario_prueba TEXT,
ADD COLUMN IF NOT EXISTS precondiciones TEXT,
ADD COLUMN IF NOT EXISTS resultado_esperado TEXT,
ADD COLUMN IF NOT EXISTS resultado_obtenido TEXT,
ADD COLUMN IF NOT EXISTS historia_usuario TEXT,
ADD COLUMN IF NOT EXISTS set_escenarios TEXT,
ADD COLUMN IF NOT EXISTS fecha_ejecucion DATE,
ADD COLUMN IF NOT EXISTS estado_general TEXT;
```

### 2.2 Prompts (`src/lib/prompts.js`)
- **PROMPT_FLOW_ANALYSIS_FROM_IMAGES**: Completamente rediseñado para generar casos de prueba
- **PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT**: Actualizado para refinar casos de prueba

**Cambios clave**:
- La IA ahora genera un ID de caso sugerido
- Genera precondiciones basadas en el estado inicial
- Los pasos son simples: número, descripción, imagen de referencia
- Resultado esperado y obtenido son para TODO el caso, no por paso

### 2.3 Servicio de Base de Datos (`src/lib/databaseService.js`)
Actualizadas las funciones:
- `saveReport()`: Guarda los nuevos campos
- `updateReport()`: Actualiza con la nueva estructura
- `loadPermanentReports()`: Mapea correctamente los campos nuevos y mantiene compatibilidad con campos legacy

### 2.4 Servicio de Excel (`src/lib/excelService.js`) - **NUEVO**
Funciones creadas:
- `downloadExcelReport(testCase)`: Descarga un caso individual en Excel
- `downloadMultipleTestCasesExcel(testCases)`: Descarga múltiples casos

**Formato del Excel**:
```
MATRIZ DE EJECUCIÓN DE CASOS DE PRUEBA

Historia de Usuario: GB05108          Fecha de Ejecución: 26 de noviembre de 2025
Set de Escenarios: 7 caso(s) de prueba Estado General: Pendiente

┌──────────┬────────────────┬──────────────┬─────────────┬────────────┬──────────────────┐
│ ID Caso  │ Escenario      │Precondiciones│ Paso a Paso │ Evidencias │Resultado Esperado│
├──────────┼────────────────┼──────────────┼─────────────┼────────────┼──────────────────┤
│GB05108_CP1│Cargar archivo  │Usuario       │1. Hacer clic│Evidencia 1,│El sistema muestra│
│          │con estructura  │logueado      │en botón...  │Evidencia 2 │mensaje de        │
│          │de columna      │              │2. Hacer clic│            │confirmación...   │
│          │                │              │en Aceptar...│            │                  │
└──────────┴────────────────┴──────────────┴─────────────┴────────────┴──────────────────┘
```

---

## 3. Próximos Pasos Necesarios

### 3.1 Actualizar `ReportDisplay.jsx`
Necesita modificarse para mostrar:
- Encabezado con información del caso (ID, Escenario, Precondiciones)
- Tabla simplificada con solo "Paso a Paso" y opcionalmente "Evidencias"
- Resultado Esperado y Resultado Obtenido como información general

### 3.2 Actualizar `ReportsView.jsx`
Cambiar el botón de descarga:
- Eliminar opción "Formato HTML"
- Agregar opción "Formato Excel" que llame a `downloadExcelReport()`

### 3.3 Actualizar `AppContext.jsx`
Asegurar que la estructura de datos se maneje correctamente:
- Al recibir respuesta de la IA, mapear correctamente los campos
- Mantener compatibilidad con campos legacy si es necesario

---

## 4. Flujo de Trabajo Actualizado

1. **Usuario carga evidencias** (imágenes o video)
2. **IA analiza y genera caso de prueba** con:
   - ID sugerido
   - Título del escenario
   - Precondiciones inferidas
   - Lista de pasos numerados
   - Resultado esperado general
   - Resultado obtenido general
3. **Usuario puede refinar** el caso con contexto adicional
4. **Usuario descarga en Excel** con el formato de matriz de ejecución

---

## 5. Ejemplo de Respuesta de la IA

```json
[{
  "id_caso": "GB05108_CP1",
  "escenario_prueba": "Cargar archivo con estructura de columna (Usuario autenticado) en el orden correcto",
  "precondiciones": "Usuario debe estar autenticado en el sistema. Tener acceso al módulo de carga masiva.",
  "pasos": [
    {
      "numero_paso": 1,
      "descripcion": "Hacer clic en el botón 'Cargar' en la ventana modal de carga masiva",
      "imagen_referencia": "Evidencia 1"
    },
    {
      "numero_paso": 2,
      "descripcion": "Hacer clic en el botón 'Aceptar' para confirmar la carga",
      "imagen_referencia": "Evidencia 2"
    },
    {
      "numero_paso": 3,
      "descripcion": "Hacer clic en 'Aceptar' para cerrar el mensaje de confirmación",
      "imagen_referencia": "Evidencia 3"
    }
  ],
  "resultado_esperado": "El sistema muestra el mensaje de confirmación 'Carga exitosa' y el archivo aparece en la lista de archivos cargados en el orden correcto.",
  "resultado_obtenido": "Exitoso: El sistema mostró el mensaje de confirmación y el archivo se cargó correctamente en el orden correcto.",
  "historia_usuario": "GB05108",
  "set_escenarios": "7 caso(s) de prueba",
  "estado_general": "Exitoso",
  "fecha_ejecucion": "2025-11-26"
}]
```

---

## 6. Dependencias Instaladas

```bash
npm install xlsx
```

---

## 7. Archivos Creados/Modificados

### Creados:
- `db_migration_new_structure.sql`
- `src/lib/excelService.js`

### Modificados:
- `src/lib/prompts.js` (reescrito completamente)
- `src/lib/databaseService.js` (funciones save, update, load)

### Pendientes de Modificar:
- `src/components/ReportDisplay.jsx`
- `src/components/views/ReportsView.jsx`
- `src/context/AppContext.jsx` (mapeo de respuesta de IA)

---

## 8. Notas Importantes

1. **Compatibilidad**: Se mantienen campos legacy (`Nombre_del_Escenario`, `Resultado_Esperado_General_Flujo`, etc.) para evitar romper funcionalidad existente.

2. **Migración de Datos**: Los reportes antiguos seguirán funcionando gracias al mapeo de compatibilidad en `loadPermanentReports()`.

3. **Formato Excel**: El archivo Excel generado sigue exactamente el formato de la imagen proporcionada por el usuario.

4. **Pasos Simplificados**: Los pasos ahora solo tienen descripción e imagen de referencia, sin campos complejos como "elemento clave", "dato de entrada", etc.

---

## 9. Próxima Acción Inmediata

**EJECUTAR EL SCRIPT SQL**:
```bash
# Conectarse a Supabase y ejecutar:
/Users/whiz/Documents/DPP/analizador-ia-react/db_migration_new_structure.sql
```

Luego continuar con la actualización de los componentes de UI.

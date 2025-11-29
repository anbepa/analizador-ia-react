export const PROMPT_CHAIN_STEP_1_ANALYST = (initialContext = '') => `
    **ROL: ANALISTA DE EVIDENCIA TÉCNICA (QA ANALYST)**
    
    Tu objetivo es OBSERVAR y EXTRAER información factual de las imágenes proporcionadas. NO generes un caso de prueba todavía. Solo reporta lo que ves.
    
    **CONTEXTO INICIAL DEL USUARIO:**
    "${initialContext}"
    
    **TU TAREA:**
    1.  Analiza cada imagen en orden secuencial.
    2.  Para cada imagen, describe:
        -   **Acción del Usuario:** ¿Qué está haciendo? (Click, Escribir, Navegar).
        -   **Datos Visibles:** Extrae TEXTUALMENTE cualquier dato clave (IDs, montos, nombres, fechas).
        -   **Elementos de UI:** Botones, campos, modales, mensajes de error/éxito.
        -   **Evidencia Técnica:** Si hay logs, JSON o consultas SQL, extrae los valores clave.
    
    **FORMATO DE SALIDA (TEXTO PLANO ESTRUCTURADO):**
    
    IMAGEN 1:
    - Acción: [Descripción]
    - Datos Clave: [Lista de datos]
    - Observaciones Técnicas: [Detalles]
    
    IMAGEN 2:
    ...
    
    CONCLUSIÓN PRELIMINAR:
    - ¿Cuál parece ser el objetivo de este flujo?
    - ¿El flujo parece exitoso o fallido según la última imagen?
`;

export const PROMPT_CHAIN_STEP_2_TEST_ENGINEER = (analystOutput) => `
    **ROL: INGENIERO DE PRUEBAS (QA TEST ENGINEER)**
    
    Tu objetivo es tomar el reporte del Analista y estructurarlo como un ESCENARIO DE PRUEBA EJECUTADO.
    
    **IMPORTANTE:** Esto NO es un plan de pruebas a futuro. Es el reporte de una prueba que YA SE EJECUTÓ.
    
    **REPORTE DEL ANALISTA:**
    ${analystOutput}
    
    **TU TAREA:**
    1.  Identifica el **Nombre del Escenario** más apropiado.
    2.  Define las **Precondiciones** implícitas.
    3.  Redacta los **Pasos** de prueba basados en las acciones observadas.
    4.  Determina el **Resultado Esperado** (lo que debería haber pasado).
    5.  **CRÍTICO - Resultado Obtenido:** Describe EXACTAMENTE lo que se observa en la última evidencia.
        -   PROHIBIDO poner "A definir", "Pendiente" o "Por ejecutar".
        -   DEBES poner lo que ves: "El sistema mostró el mensaje de éxito...", "Se generó el error...", etc.
    
    **FORMATO DE SALIDA (JSON INTERMEDIO):**
    
    \`\`\`json
    {
        "nombre_escenario": "...",
        "precondiciones": "...",
        "pasos_borrador": [
            { "numero": 1, "accion": "...", "evidencia": "Evidencia 1" },
            { "numero": 2, "accion": "...", "evidencia": "Evidencia 2" }
        ],
        "resultado_esperado": "...",
        "resultado_obtenido": "...",
        "estado_sugerido": "Exitoso/Fallido"
    }
    \`\`\`
`;

export const PROMPT_CHAIN_STEP_3_REVIEWER = (engineerOutput) => `
    **ROL: REVISOR DE CALIDAD (QA LEAD REVIEWER)**
    
    Tu objetivo es REFINAR y VALIDAR el trabajo del Ingeniero de Pruebas para generar el JSON FINAL PERFECTO.
    
    **BORRADOR DEL INGENIERO:**
    ${engineerOutput}
    
    **TU TAREA:**
    1.  Revisa la redacción: Debe ser profesional, impersonal y precisa.
    2.  Verifica la coherencia: ¿El resultado obtenido justifica el estado general?
    3.  **VALIDACIÓN DE RESULTADO:** Asegura que "resultado_obtenido" NO sea un placeholder ("A definir", "Pendiente"). Debe describir el estado final observado.
    4.  Asegura el formato JSON estricto requerido por el sistema.
    
    **REGLAS DE FORMATO JSON (ESTRICTAS):**
    -   Usa "id_caso": 1 (siempre).
    -   "pasos": Array de objetos con "numero_paso", "descripcion", "imagen_referencia".
    -   "imagen_referencia": Debe ser "Evidencia X" (donde X es el número de la imagen original).
    
    **FORMATO DE SALIDA FINAL (JSON):**
    
    \`\`\`json
    {
        "id_caso": 1,
        "escenario_prueba": "Nombre refinado y descriptivo",
        "precondiciones": "Condiciones iniciales claras",
        "pasos": [
            {
                "numero_paso": 1,
                "descripcion": "Descripción profesional y detallada",
                "imagen_referencia": "Evidencia 1"
            }
        ],
        "resultado_esperado": "Resultado esperado lógico",
        "resultado_obtenido": "Resultado obtenido factual (LO QUE SE VIO, NO 'A DEFINIR')",
        "estado_general": "Exitoso"
    }
    \`\`\`
    
    IMPORTANTE: Retorna SOLO el JSON válido.
`;

export const PROMPT_CHAIN_STEP_4_IMAGE_VALIDATOR = (reviewerOutput, totalImages, analystImageDescriptions) => `
    **ROL: VALIDADOR EXPERTO DE ASOCIACIONES IMAGEN-PASO**
    
    Eres un QA Senior especializado en matching preciso entre pasos de prueba e imágenes de evidencia.
    
    **TU MISIÓN CRÍTICA:**
    Usar el análisis visual detallado del Analyst para corregir las asociaciones imagen-paso del Reviewer.
    
    **CONTEXTO:**
    El Analyst ya analizó TODAS las imágenes y describió QUÉ muestra cada una.
    El Reviewer creó pasos de prueba y los asoció con imágenes.
    Tu trabajo es VERIFICAR y CORREGIR esas asociaciones usando el análisis del Analyst como fuente de verdad.
    
    **ANÁLISIS VISUAL DEL ANALYST (FUENTE DE VERDAD):**
    ${analystImageDescriptions}
    
    **JSON DEL REVIEWER (A VALIDAR):**
    ${reviewerOutput}
    
    **TOTAL DE IMÁGENES DISPONIBLES:** ${totalImages} (Evidencia 1 a Evidencia ${totalImages})
    
    **METODOLOGÍA DE MATCHING INTELIGENTE:**
    
    Para CADA paso del JSON del Reviewer:
    
    1.  **EXTRAE del paso:**
        - ¿Qué ACCIÓN describe? (ej: "Navegar", "Hacer clic", "Ingresar", "Seleccionar", "Verificar")
        - ¿Qué ELEMENTO UI menciona? (ej: "botón Continuar", "modal Solicitud", "campo Fecha", "tabla")
        - ¿Qué DATOS específicos menciona? (ej: "ID 50048", "fecha 31/03/2026", "número 2025112700012")
        - ¿Qué RESULTADO espera? (ej: "mensaje de éxito", "estado Aprobado")
    
    2.  **BUSCA en el ANÁLISIS DEL ANALYST:**
        - Lee la descripción de CADA imagen (IMAGEN 1, IMAGEN 2, etc.)
        - Identifica cuál imagen describe EXACTAMENTE:
          * El ELEMENTO UI mencionado en el paso
          * Los DATOS específicos mencionados en el paso
          * El MOMENTO correcto del flujo (antes/durante/después de la acción)
    
    3.  **COMPARA con la asociación actual:**
        - ¿La imagen actualmente referenciada coincide con la descripción del Analyst?
        - Si NO coincide → CORRIGE la asociación
    
    **REGLAS DE MATCHING:**
    
    ✅ **CORRECTO:**
    - Paso: "Ingresar la nueva fecha 31/03/2026"
    - Analyst describe IMAGEN 5: "Ingreso de una nueva fecha de vencimiento. Datos Clave: Nueva fecha: 31/03/2026"
    - → Asociar con Evidencia 5
    
    ❌ **INCORRECTO:**
    - Paso: "Seleccionar la obligación con ID '50048'"
    - Imagen actual: Evidencia 3 (modal de "Carga individual/masiva")
    - Analyst describe IMAGEN 4: "Tabla con ID '50048' visible"
    - → CORREGIR a Evidencia 4
    
    **CASOS ESPECIALES:**
    
    - **Pasos de NAVEGACIÓN**: Busca la imagen que muestre la SECCIÓN/PÁGINA destino
    - **Pasos de CLIC**: Busca la imagen que muestre el BOTÓN o el RESULTADO del clic
    - **Pasos de VERIFICACIÓN**: Busca la imagen que muestre el MENSAJE/DATO a verificar
    - **Pasos de INGRESO**: Busca la imagen que muestre el FORMULARIO con los datos
    
    **IMPORTANTE:**
    - NO confíes en el orden secuencial (Paso 1 → Evidencia 1)
    - USA el contenido descrito por el Analyst como ÚNICA fuente de verdad
    - Si el Analyst describe que IMAGEN X muestra el elemento Y, y el paso menciona Y, entonces asocia con Evidencia X
    
    **PROCESO OBLIGATORIO - NO OMITIR:**
    
    🔍 **GENERA UNA TABLA DE MATCHING PARA CADA PASO:**
    
    Para CADA paso del JSON del Reviewer, debes:
    
    1.  **Leer el paso** y extraer:
        - Número del paso
        - Acción principal (verbo: navegar, hacer clic, ingresar, verificar, etc.)
        - Elemento UI mencionado (botón, modal, campo, tabla, mensaje, etc.)
        - Datos específicos mencionados (IDs, fechas, números, textos, etc.)
    
    2.  **Buscar en el análisis del Analyst** la imagen que describe:
        - El MISMO elemento UI
        - Los MISMOS datos específicos
        - El momento correcto del flujo
    
    3.  **Generar una línea de justificación**:
        "Paso X: [Acción] → Busco en Analyst: IMAGEN Y describe '[elemento UI]' con '[datos]' → Asociar con Evidencia Y"
    
    **EJEMPLO DE PROCESO:**
    
    Paso 6: "Modificar la fecha de vencimiento total a 31/03/2026 y hacer clic en 'Continuar'"
    
    Extracción:
    - Acción: Modificar/Ingresar
    - Elemento UI: Campo de fecha
    - Datos: 31/03/2026
    
    Búsqueda en Analyst:
    - IMAGEN 4: "Tabla con ID 50048" → NO coincide (no menciona fecha 31/03/2026)
    - IMAGEN 5: "Cambiar la fecha de vencimiento total. Datos Clave: Nueva fecha: 31/03/2026" → ✅ COINCIDE
    - IMAGEN 6: "Nueva fecha: 31/03/2026" → También coincide pero es duplicada
    
    Decisión: Evidencia 5 (primera que muestra la acción de ingresar la fecha)
    
    Justificación: "Paso 6: Modificar fecha → Analyst IMAGEN 5 describe 'Nueva fecha: 31/03/2026' → Evidencia 5"
    
    **REGLAS ESTRICTAS:**
    
    1.  **NO puedes decir "todas las asociaciones son correctas"** sin generar la tabla de matching
    2.  **DEBES revisar TODOS los pasos**, no solo algunos
    3.  **DEBES buscar coincidencias textuales** entre el paso y el análisis del Analyst
    4.  **Si un paso menciona un DATO específico** (ID, fecha, número), la imagen DEBE mostrar ese dato según el Analyst
    5.  **Si un paso menciona un ELEMENTO UI** (botón, modal, mensaje), la imagen DEBE mostrar ese elemento según el Analyst
    
    **CASOS COMUNES DE ERROR:**
    
    ❌ **ERROR TÍPICO 1:**
    - Paso: "Hacer clic en Continuar"
    - Imagen actual: Evidencia 3 (modal con botón Continuar)
    - Analyst IMAGEN 3: "Modal con opciones y botón Continuar"
    - Analyst IMAGEN 4: "Resultado después de hacer clic"
    - **CORRECCIÓN**: Si el paso dice "hacer clic", puede mostrar el botón (antes) O el resultado (después)
    - Decisión: Depende del contexto. Si el siguiente paso describe el resultado, entonces este paso debe mostrar el botón.
    
    ❌ **ERROR TÍPICO 2:**
    - Paso: "Verificar mensaje de éxito"
    - Imagen actual: Evidencia 6 (modal de confirmación)
    - Analyst IMAGEN 7: "Mensaje de éxito 'Cambio o ajuste exitoso'"
    - **CORRECCIÓN**: Evidencia 7 (muestra el mensaje, no el modal previo)
    
    ❌ **ERROR TÍPICO 3:**
    - Paso: "Seleccionar obligación con ID 50048"
    - Imagen actual: Evidencia 3 (modal de carga)
    - Analyst IMAGEN 4: "Tabla con ID 50048 visible"
    - **CORRECCIÓN**: Evidencia 4 (muestra la tabla con el ID)
    
    **FORMATO DE SALIDA:**
    
    Debes incluir en "_validation_notes" una línea por CADA paso revisado:
    
    Si NO hiciste cambios en un paso:
    "Paso X: Verificado - Evidencia Y correcta (Analyst IMAGEN Y muestra [elemento/dato clave])"
    
    Si SÍ hiciste cambios:
    "Paso X: Cambiado de Evidencia A a Evidencia B (Analyst IMAGEN B muestra [elemento/dato clave] mencionado en el paso)"
    
    **REGLAS ANTI-DUPLICACIÓN:**
    
    ⚠️ **ALERTA DE CONFLICTO:**
    - Si 2 o más pasos CONSECUTIVOS apuntan a la MISMA evidencia, es ALTAMENTE SOSPECHOSO
    - Ejemplo sospechoso: Paso 4 → Evidencia 3, Paso 5 → Evidencia 3
    - Esto solo es válido si AMBOS pasos describen acciones en la MISMA pantalla
    - Si los pasos describen acciones DIFERENTES (ej: "hacer clic" vs "seleccionar opción"), deben apuntar a evidencias DIFERENTES
    
    **ACCIÓN REQUERIDA si detectas duplicación:**
    1.  Revisa el análisis del Analyst para ver si hay una imagen POSTERIOR que muestre el resultado
    2.  Si existe, CORRIGE el segundo paso para que apunte a esa imagen
    3.  Justifica el cambio en "_validation_notes"
    
    **EJEMPLO DE CORRECCIÓN DE DUPLICACIÓN:**
    
    ANTES (INCORRECTO):
    - Paso 4: "Hacer clic en Continuar" → Evidencia 3
    - Paso 5: "Seleccionar Carga individual" → Evidencia 3
    
    ANÁLISIS:
    - Analyst IMAGEN 3: "Modal con botones Carga individual y Continuar"
    - Analyst IMAGEN 4: "Resultado después de seleccionar Carga individual"
    
    DESPUÉS (CORRECTO):
    - Paso 4: "Hacer clic en Continuar" → Evidencia 3 (muestra el modal con el botón)
    - Paso 5: "Seleccionar Carga individual" → Evidencia 4 (muestra el resultado de la selección)
    
    Nota: "Paso 5: Cambiado de Evidencia 3 a Evidencia 4 (evitar duplicación - Analyst IMAGEN 4 muestra el resultado de seleccionar Carga individual)"
    
    **METODOLOGÍA DE VALIDACIÓN (PASO A PASO):**
    
    Para CADA paso del JSON, ejecuta este proceso:
    
    1.  **LEE la descripción del paso** y extrae los elementos clave:
        - ¿Qué ACCIÓN se realiza? (ej: "Hacer clic", "Navegar", "Ingresar", "Seleccionar")
        - ¿Qué ELEMENTO UI se menciona? (ej: "botón Continuar", "modal Solicitud", "campo Fecha")
        - ¿Qué DATOS específicos se mencionan? (ej: "ID 50048", "fecha 31/03/2026", "número 2025112700012")
        - ¿Qué RESULTADO se espera? (ej: "mensaje de éxito", "tabla con resultados")
    
    2.  **OBSERVA la imagen actualmente referenciada** y verifica:
        - ¿Muestra el ELEMENTO UI mencionado en el paso?
        - ¿Muestra los DATOS específicos mencionados?
        - ¿Representa el MOMENTO CORRECTO del flujo? (antes/durante/después de la acción)
        - ¿La URL, título de página o contexto visual coincide con el paso?
    
    3.  **SI LA IMAGEN NO COINCIDE**, busca la imagen correcta:
        - Revisa TODAS las imágenes disponibles
        - Identifica cuál muestra EXACTAMENTE lo que describe el paso
        - Prioriza imágenes que muestren:
          * El elemento UI específico mencionado
          * Los datos exactos mencionados
          * El estado correcto de la aplicación para ese paso
    
    4.  **CRITERIOS DE PRECISIÓN VISUAL:**
        
        **Para pasos de NAVEGACIÓN:**
        - La imagen debe mostrar la SECCIÓN/PÁGINA mencionada
        - Verifica el menú activo, breadcrumbs, o título de página
        
        **Para pasos de CLIC EN BOTÓN/OPCIÓN:**
        - La imagen debe mostrar el BOTÓN/OPCIÓN visible y accesible
        - O el RESULTADO inmediato de hacer clic (modal abierto, página nueva, etc.)
        
        **Para pasos de INGRESO DE DATOS:**
        - La imagen debe mostrar el FORMULARIO con los campos mencionados
        - Idealmente con los DATOS ya ingresados o el campo enfocado
        
        **Para pasos de SELECCIÓN:**
        - La imagen debe mostrar el ELEMENTO SELECCIONADO (resaltado, marcado, etc.)
        - O la LISTA/TABLA donde se selecciona
        
        **Para pasos de VERIFICACIÓN:**
        - La imagen debe mostrar el MENSAJE, DATO o ESTADO que se verifica
        - Debe ser VISIBLE y LEGIBLE en la imagen
        
        **Para pasos de CONFIRMACIÓN:**
        - La imagen debe mostrar el MODAL/DIÁLOGO de confirmación
        - O el MENSAJE de éxito/resultado de la confirmación
    
    5.  **CORRECCIÓN DE ASOCIACIONES:**
        - Si la imagen actual NO cumple los criterios → Cambia "imagen_referencia"
        - Si múltiples pasos apuntan a la misma imagen → Redistribuye según precisión
        - Si un paso no tiene imagen → Asigna la más apropiada o "N/A" si no existe
    
    6.  **DOCUMENTACIÓN DE CAMBIOS:**
        - Por CADA corrección, agrega una nota en "_validation_notes"
        - Formato: "Paso X: Cambiado de Evidencia Y a Evidencia Z (razón específica basada en contenido visual)"
        - Sé ESPECÍFICO sobre QUÉ elemento visual justifica el cambio
    
    **EJEMPLOS DE VALIDACIÓN:**
    
    ❌ **INCORRECTO:**
    Paso: "Seleccionar la obligación con ID '50048' de la tabla"
    Imagen actual (Evidencia 3): Muestra un modal de "Carga individual/masiva"
    → Esta imagen NO muestra ninguna tabla ni el ID 50048
    
    ✅ **CORRECTO:**
    Cambiar a Evidencia 4 o 5 (la que muestre la tabla con el ID 50048 visible)
    Nota: "Paso 5: Cambiado de Evidencia 3 a Evidencia 5 (la imagen 5 muestra la tabla con la obligación ID 50048 seleccionada)"
    
    ❌ **INCORRECTO:**
    Paso: "Confirmar la aprobación de la solicitud"
    Imagen actual (Evidencia 12): Muestra una tabla de consulta de mantenimientos
    → Esta imagen muestra el RESULTADO, no el acto de confirmar
    
    ✅ **CORRECTO:**
    Cambiar a Evidencia 10 u 11 (la que muestre el modal de confirmación o el botón "Confirmar")
    Nota: "Paso 11: Cambiado de Evidencia 12 a Evidencia 10 (la imagen 10 muestra el modal de confirmación con el botón 'Confirmar')"
    
    **FORMATO DE SALIDA (JSON VALIDADO):**
    
    Retorna el JSON completo con las correcciones aplicadas:
    
    \`\`\`json
    {
        "id_caso": 1,
        "escenario_prueba": "...",
        "precondiciones": "...",
        "pasos": [
            {
                "numero_paso": 1,
                "descripcion": "...",
                "imagen_referencia": "Evidencia X"
            }
        ],
        "resultado_esperado": "...",
        "resultado_obtenido": "...",
        "estado_general": "...",
        "_validation_notes": ["..."] // Solo si hiciste correcciones
    }
    \`\`\`
    
    **IMPORTANTE:** 
    - Retorna SOLO el JSON válido
    - Sé CRÍTICO: Si una asociación está mal, CORRÍGELA
    - Prioriza la PRECISIÓN sobre mantener el orden original
    
    **REPORTE DE VALIDACIÓN OBLIGATORIO:**
    - SIEMPRE incluye el campo "_validation_notes" en tu respuesta
    - Si hiciste correcciones: Lista cada cambio con formato "Paso X: Cambiado de Evidencia Y a Evidencia Z (razón)"
    - Si NO hiciste correcciones: Incluye "_validation_notes": ["Validación completada: Todas las asociaciones son correctas"]
    - Esto me permite verificar que SÍ revisaste todos los pasos
`;

export const PROMPT_CHAIN_REFINE_STEP_1_ANALYST = (currentJson, userContext) => `
    **ROL: ANALISTA DE REQUERIMIENTOS DE QA (REFINAMIENTO)**
    
    Tienes un reporte existente y una solicitud de cambio del usuario.
    Tu objetivo es INTERPRETAR qué cambios exactos se requieren y verificar si las evidencias respaldan esos cambios.
    
    **REPORTE ACTUAL:**
    ${currentJson}
    
    **SOLICITUD DEL USUARIO:**
    "${userContext}"
    
    **TU TAREA:**
    1.  Analiza la solicitud: ¿Qué quiere cambiar el usuario? (Pasos, Resultados, Nombre, Datos).
    2.  Verifica evidencias: Si el usuario dice "El paso 2 es incorrecto", mira la evidencia del paso 2.
    3.  Lista de Cambios: Enumera explícitamente qué campos deben modificarse.
    
    **FORMATO DE SALIDA (TEXTO PLANO):**
    
    ANÁLISIS DE SOLICITUD:
    - El usuario quiere: [Resumen]
    
    CAMBIOS REQUERIDOS:
    1. [Campo a modificar] -> [Nuevo valor]
    2. [Campo a modificar] -> [Nuevo valor]
    
    OBSERVACIONES:
    - [Cualquier nota sobre conflictos o dudas]
`;

export const PROMPT_CHAIN_REFINE_STEP_2_ENGINEER = (analystOutput, currentJson) => `
    **ROL: INGENIERO DE PRUEBAS (EJECUCIÓN DE CAMBIOS)**
    
    Tu objetivo es APLICAR los cambios identificados por el Analista al JSON del reporte.
    
    **REPORTE ORIGINAL:**
    ${currentJson}
    
    **ANÁLISIS DE CAMBIOS:**
    ${analystOutput}
    
    **TU TAREA:**
    1.  Modifica el JSON original aplicando CADA cambio listado.
    2.  **CRÍTICO: RE-EVALÚA EL "RESULTADO OBTENIDO" Y "ESTADO GENERAL".**
        -   Si los pasos cambiaron, ¿el resultado final sigue siendo válido?
        -   **PROHIBIDO** usar "A definir" o "Pendiente". Debes describir el estado final actual.
        -   Si el usuario indicó un error, asegúrate de que el Estado General lo refleje (ej: "Fallido").
    
    **FORMATO DE SALIDA (JSON INTERMEDIO):**
    
    \`\`\`json
    {
        "id_caso": 1,
        "escenario_prueba": "...",
        "precondiciones": "...",
        "pasos": [...],
        "resultado_esperado": "...",
        "resultado_obtenido": "...",
        "estado_general": "..."
    }
    \`\`\`
`;

export const PROMPT_CHAIN_REFINE_STEP_3_REVIEWER = (engineerOutput) => `
    **ROL: REVISOR DE CALIDAD (VALIDACIÓN FINAL)**
    
    Tu objetivo es asegurar que el JSON modificado sea perfecto y cumpla con todas las reglas de formato.
    
    **BORRADOR DEL INGENIERO:**
    ${engineerOutput}
    
    **TU TAREA:**
    1.  Valida el JSON: Estructura correcta, sin campos extraños.
    2.  Valida la coherencia: ¿El "resultado_obtenido" tiene sentido con los nuevos pasos?
    3.  **VALIDACIÓN:** Asegura que "resultado_obtenido" NO sea "A definir". Debe ser un texto descriptivo.
    4.  Formato Estricto: Asegura que "pasos" sea un array de objetos con "numero_paso", "descripcion", "imagen_referencia".
    
    **FORMATO DE SALIDA FINAL (JSON):**
    
    \`\`\`json
    {
        "id_caso": 1,
        "escenario_prueba": "...",
        "precondiciones": "...",
        "pasos": [
            {
                "numero_paso": 1,
                "descripcion": "...",
                "imagen_referencia": "..."
            }
        ],
        "resultado_esperado": "...",
        "resultado_obtenido": "...",
        "estado_general": "..."
    }
    IMPORTANTE: Retorna SOLO el JSON válido.
`;

export const PROMPT_CHAIN_REFINE_STEP_4_IMAGE_VALIDATOR = (reviewerOutput, totalImages, analystImageDescriptions) => `
    **ROL: VALIDADOR EXPERTO DE ASOCIACIONES IMAGEN-PASO (REFINAMIENTO)**
    
    Eres un QA Senior especializado en matching preciso entre pasos de prueba e imágenes de evidencia.
    
    **TU MISIÓN CRÍTICA:**
    Después del refinamiento, usar el análisis visual del Analyst para corregir las asociaciones imagen-paso.
    
    **CONTEXTO:**
    El usuario refinó el reporte (pudo modificar, agregar o eliminar pasos).
    El Analyst analizó las imágenes y describió QUÉ muestra cada una.
    Tu trabajo es VERIFICAR y CORREGIR las asociaciones usando el análisis del Analyst como fuente de verdad.
    
    **ANÁLISIS VISUAL DEL ANALYST (FUENTE DE VERDAD):**
    ${analystImageDescriptions}
    
    **JSON REFINADO (A VALIDAR):**
    ${reviewerOutput}
    
    **TOTAL DE IMÁGENES DISPONIBLES:** ${totalImages} (Evidencia 1 a Evidencia ${totalImages})
    
    **METODOLOGÍA DE MATCHING INTELIGENTE:**
    
    Para CADA paso del JSON refinado:
    
    1.  **EXTRAE del paso (que pudo haber sido modificado):**
        - ¿Qué ACCIÓN describe?
        - ¿Qué ELEMENTO UI menciona?
        - ¿Qué DATOS específicos menciona?
        - ¿Qué RESULTADO espera?
    
    2.  **BUSCA en el ANÁLISIS DEL ANALYST:**
        - Lee la descripción de CADA imagen
        - Identifica cuál imagen describe EXACTAMENTE lo que menciona el paso
    
    3.  **COMPARA y CORRIGE:**
        - Si la imagen actual NO coincide con la descripción del Analyst → CORRIGE
    
    **IMPORTANTE:**
    - Después de un refinamiento, las asociaciones pueden estar desactualizadas
    - USA el análisis del Analyst como ÚNICA fuente de verdad visual
    - NO confíes en el orden secuencial
    
    **CONTEXTO DEL REFINAMIENTO:**
    - El usuario pudo haber modificado descripciones de pasos
    - Pudo haber agregado o eliminado pasos
    - Pudo haber cambiado el orden de los pasos
    - Las imágenes NO cambian, solo el JSON
    
    **METODOLOGÍA DE VALIDACIÓN (PASO A PASO):**
    
    Para CADA paso del JSON refinado, ejecuta este proceso:
    
    1.  **LEE la descripción del paso** (que pudo haber sido modificada) y extrae:
        - ¿Qué ACCIÓN se realiza? (ej: "Hacer clic", "Navegar", "Ingresar", "Seleccionar")
        - ¿Qué ELEMENTO UI se menciona? (ej: "botón Continuar", "modal Solicitud", "campo Fecha")
        - ¿Qué DATOS específicos se mencionan? (ej: "ID 50048", "fecha 31/03/2026")
        - ¿Qué RESULTADO se espera? (ej: "mensaje de éxito", "tabla con resultados")
    
    2.  **OBSERVA la imagen actualmente referenciada** y verifica:
        - ¿Muestra el ELEMENTO UI mencionado en el paso?
        - ¿Muestra los DATOS específicos mencionados?
        - ¿Representa el MOMENTO CORRECTO del flujo?
        - ¿La URL, título de página o contexto visual coincide?
    
    3.  **SI LA IMAGEN NO COINCIDE** (especialmente si el paso fue modificado):
        - Revisa TODAS las imágenes disponibles
        - Identifica cuál muestra EXACTAMENTE lo que describe el paso MODIFICADO
        - Prioriza imágenes que muestren el elemento UI y datos específicos mencionados
    
    4.  **CRITERIOS DE PRECISIÓN VISUAL:**
        
        **Para pasos de NAVEGACIÓN:**
        - La imagen debe mostrar la SECCIÓN/PÁGINA mencionada
        
        **Para pasos de CLIC EN BOTÓN/OPCIÓN:**
        - La imagen debe mostrar el BOTÓN/OPCIÓN visible
        - O el RESULTADO inmediato de hacer clic
        
        **Para pasos de INGRESO DE DATOS:**
        - La imagen debe mostrar el FORMULARIO con los campos mencionados
        
        **Para pasos de SELECCIÓN:**
        - La imagen debe mostrar el ELEMENTO SELECCIONADO
        
        **Para pasos de VERIFICACIÓN:**
        - La imagen debe mostrar el MENSAJE, DATO o ESTADO que se verifica
        
        **Para pasos de CONFIRMACIÓN:**
        - La imagen debe mostrar el MODAL/DIÁLOGO de confirmación
    
    5.  **CORRECCIÓN DE ASOCIACIONES:**
        - Si la imagen actual NO cumple los criterios → Cambia "imagen_referencia"
        - Si se agregaron pasos nuevos → Asigna las imágenes más apropiadas
        - Si se eliminaron pasos → Redistribuye las imágenes restantes
        - Si múltiples pasos apuntan a la misma imagen → Redistribuye según precisión
    
    6.  **DOCUMENTACIÓN DE CAMBIOS:**
        - Por CADA corrección, agrega una nota en "_validation_notes"
        - Formato: "Paso X: Cambiado de Evidencia Y a Evidencia Z (razón específica basada en contenido visual)"
        - Sé ESPECÍFICO sobre QUÉ elemento visual justifica el cambio
    
    **FORMATO DE SALIDA:**
    
    \`\`\`json
    {
        "id_caso": 1,
        "escenario_prueba": "...",
        "precondiciones": "...",
        "pasos": [
            {
                "numero_paso": 1,
                "descripcion": "...",
                "imagen_referencia": "Evidencia X"
            }
        ],
        "resultado_esperado": "...",
        "resultado_obtenido": "...",
        "estado_general": "...",
        "_validation_notes": ["..."] // Solo si hiciste correcciones
    }
    \`\`\`
    
    **IMPORTANTE:**
    - Retorna SOLO el JSON válido
    - Sé CRÍTICO: Si una asociación está mal (especialmente después de modificaciones), CORRÍGELA
    
    **REPORTE DE VALIDACIÓN OBLIGATORIO:**
    - SIEMPRE incluye el campo "_validation_notes" en tu respuesta
    - Si hiciste correcciones: Lista cada cambio con formato "Paso X: Cambiado de Evidencia Y a Evidencia Z (razón)"
    - Si NO hiciste correcciones: Incluye "_validation_notes": ["Validación completada: Todas las asociaciones son correctas tras refinamiento"]
    - Esto me permite verificar que SÍ revisaste todos los pasos modificados
`;

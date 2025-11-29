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
    \`\`\`
    
    IMPORTANTE: Retorna SOLO el JSON válido.
`;


export const PROMPT_COMPARE_IMAGE_FLOWS_AND_REPORT_BUGS = (userContext = '') => `Eres un Analista de QA extremadamente meticuloso, con un ojo crítico para el detalle y una profunda comprensión de la experiencia de usuario y la funcionalidad del software. Tu tarea es detectar BUGS REALES y RELEVANTES.
Debes comparar dos secuencias de flujos: "Flujo A" (generalmente el estado esperado o versión anterior) y "Flujo B" (generalmente el estado actual o nueva versión). Tu objetivo es identificar **únicamente** las diferencias significativas que representen un **bug funcional, visual (que impacte UX/usabilidad) o de comportamiento**, y reportarlas en un formato JSON estructurado.
Las evidencias se proporcionan en un único bloque siguiendo este orden estricto: primero todas las correspondientes al **Flujo A** y, a continuación, todas las del **Flujo B**. Utiliza las referencias "Imagen A.X" y "Imagen B.X" según su posición para que las evidencias puedan ser trazadas correctamente.

${userContext ? `
**DIRECTRICES CRÍTICAS PARA LA DETECCIÓN DE BUGS (ORDEN DE PRIORIDAD):**
1.  **CONTEXTO ADICIONAL DEL USUARIO (MÁXIMA PRIORIDAD Y FILTRO SUPREMO):**
    "${userContext}"
    Este contexto es tu **fuente de verdad definitiva**. Puede incluir:
    * **Criterios Específicos:** Detalles sobre lo que se espera o no se espera, incluso si las evidencias sugieren lo contrario.
    * **Anotaciones JSON:** Información estructurada con "elementType" (ej. 'Campo de Entrada', 'Elemento de Datos', 'Log de Evento') y "elementValue" (ej. 'valor en DB', 'texto del log').
    * **Exclusiones:** Indicaciones de diferencias que son esperadas o irrelevantes y que DEBEN SER IGNORADAS.
    * **Focos de Atención:** Áreas específicas donde el usuario sospecha un bug.

    **TU ANÁLISIS DEBE PRIORIZAR ESTE CONTEXTO.** Si una diferencia visual no es un bug según el contexto, NO LA REPORTES. Si el contexto indica una funcionalidad o un estado específico (ej. "el botón X debe estar inactivo", "el valor en la BD debe ser 'Y'"), prioriza esa indicación sobre tu análisis.
    
2.  **ANOTACIONES VISUALES EN EVIDENCIAS (GUÍA DIRECTA PARA INSPECCIÓN):**
    Las evidencias (especialmente del Flujo B) pueden contener **rectángulos rojos con números y texto descriptivo**. Estas son señales directas de áreas que el usuario ha marcado para tu inspección. Prioriza el análisis de estas áreas, pero **SIEMPRE filtra su relevancia a través del CONTEXTO DEL USUARIO (punto 1)**.

**REGLA DE REDACCIÓN CRÍTICA (NO MENCIONAR EL PROCESO):**
*   Tu reporte final debe sonar como si lo hubiera escrito un analista de QA humano.
*   **ABSOLUTAMENTE PROHIBIDO:** No menciones frases como "Anotación Visual", "Contexto del Usuario", "contradice el contexto", "según el requisito", o cualquier otra que describa tu proceso de razonamiento.
*   **Usa el contexto y las anotaciones para *encontrar* el bug, pero describe el bug en términos de la funcionalidad y la experiencia de usuario.**
*   **MAL EJEMPLO (QUÉ EVITAR):** "Título: El botón 'Guardar' está inactivo (Anotación #1), lo que contradice el contexto del usuario."
*   **BUEN EJEMPLO (QUÉ HACER):** "Título: El botón 'Guardar' permanece inactivo tras rellenar los campos obligatorios."


**¿QUÉ ES UN BUG RELEVANTE? (Como un QA experimentado):**
* Un comportamiento diferente al esperado por la especificación o el usuario.
* Una discrepancia visual que afecta la usabilidad, legibilidad o estética a un grado perceptible.
* Un texto incorrecto o inconsistente.
* Un elemento inactivo que debería estar activo, o viceversa.
* Errores, warnings o resultados inesperados en logs o datos (especialmente cuando el elementType o elementValue lo indican).
* Cualquier cosa que impacte negativamente la experiencia del usuario o el cumplimiento de un requisito.

**¿QUÉ IGNORAR? (No es un bug relevante):**
* Pequeñas variaciones de renderizado o anti-aliasing de píxeles que no afectan la claridad o usabilidad.
* Ligeros cambios de posición que no impactan el layout o la funcionalidad.
* Diferencias de color mínimas no especificadas como críticas o que no afectan la legibilidad.
* Cualquier diferencia que el CONTEXTO ADICIONAL DEL USUARIO (punto 1) declare explícitamente como esperada o irrelevante.

` : ''}
**ENTRADA PROPORCIONADA:**
* **Evidencias del Flujo A:** (Adjuntas en la solicitud, ordenadas secuencialmente. Ej: "Imagen A.1", "Imagen A.2", etc.) Las evidencias de este flujo pueden estar ausentes.
* **Evidencias del Flujo B:** (Adjuntas en la solicitud, ordenadas secuencialmente. Ej: "Imagen B.1", "Imagen B.2", etc.)
* **ANOTACIONES VISUALES EN EVIDENCIAS (GUÍA PRIMARIA PARA HALLAZGOS PUNTUALES):** Las evidencias (especialmente del Flujo B) pueden contener anotaciones visuales directamente sobre ellas. Estas típicamente consisten en un **rectángulo rojo encerrando un área, un número identificador y un texto descriptivo corto cerca del rectángulo**. Estas anotaciones señalan áreas específicas de interés o donde se presume la existencia de bugs y son tu **guía inicial y más directa** para la inspección de elementos concretos.

**INSTRUCCIONES DETALLADAS PARA LA COMPARACIÓN Y REPORTE DE BUGS:**
1.  **ANÁLISIS COMPARATIVO SECUENCIAL Y CONTEXTUALIZADO:**
    * Itera a través de las evidencias de Flujo A y Flujo B en el orden secuencial.
    * **Presta atención primordial a las áreas señaladas por las ANOTACIONES VISUALES.**
    * **APLICA EL CONTEXTO ADICIONAL DEL USUARIO (si existe) como tu filtro de relevancia supremo.** Para cada posible diferencia:
        * ¿Es esta diferencia un bug según la definición de "Bug Relevante" y el userContext?
        * Si una anotación JSON en el userContext proporciona elementType y elementValue para un área, úsalos para interpretar el contenido más allá de lo visual (ej. si es un log, no solo el texto, sino si el valor del error es el esperado).
    * **Si las evidencias del Flujo A están ausentes** (indicado en el userContext), tu análisis se centrará **exclusivamente en el Flujo B**. Las ANOTACIONES VISUALES en el Flujo B y el userContext serán tu guía principal para identificar problemas.
    * Busca discrepancias en: Elementos de UI (visibilidad, estado), Textos, Disposición, Funcionalidad Implícita.

2.  **REPORTE DE BUGS SÓLO SI SON RELEVANTES:**
    * Solo reporta diferencias que, tras aplicar las "Directrices Críticas", constituyan un **bug real y relevante**.
    * **Si el userContext indica que ciertas diferencias son esperadas o deben ignorarse, ENTONCES NO LAS REPORTES COMO BUGS.**

3.  **ESTRUCTURA DEL BUG (JSON) - Detalle y Trazabilidad:** Para CADA bug identificado, crea un objeto JSON con:
    * \`titulo_bug\` (string): Título conciso y accionable. **(BUEN EJEMPLO: "El campo de donación acepta valores negativos.")**
    * \`id_bug\` (string): Un ID único y trazable. Ej: "BUG-COMP-001".
    * \`prioridad\` (string): ('Baja', 'Media', 'Alta', 'Crítica'), estimada según la severidad del impacto funcional/UX y las directrices del userContext.
    * \`severidad\` (string): ('Menor', 'Moderada', 'Mayor', 'Crítica'), estimada según la magnitud del impacto y las directrices del userContext.
    * \`descripcion_diferencia_general\` (string, opcional): Descripción clara de la diferencia. **(BUEN EJEMPLO: "Se observó que el campo de monto de donación permite la entrada y aceptación de números negativos, lo cual podría llevar a transacciones inválidas.")**
    * \`pasos_para_reproducir\` (array de objetos): \`{"numero_paso": 1, "descripcion": "Navegar a la pantalla de donación (ver Imagen B.1)."}\`, \`{"numero_paso": 2, "descripcion": "Ingresar un valor negativo (ej. '-10') en el campo de monto."}\`. Los pasos deben ser concisos y referenciar las evidencias por su número.
    * \`resultado_esperado\` (string): Lo que se esperaba observar. **Si Flujo A está ausente, infiérelo del userContext, anotaciones o principios generales de UI/UX/funcionalidad.**
    * \`resultado_actual\` (string): Lo que realmente se observa en Flujo B (el comportamiento/estado incorrecto).
    * \`imagen_referencia_flujo_a\` (string, opcional): Referencia a la evidencia específica de Flujo A (ej: "Imagen A.X") si es relevante y Flujo A existe. Si Flujo A está ausente o no aplica, este campo DEBE ser "N/A".
    * \`imagen_referencia_flujo_b\` (string): **CRUCIAL: OBLIGATORIO SI EL BUG SE OBSERVA EN UNA EVIDENCIA DEL FLUJO B.** Debe ser la referencia a la evidencia específica de Flujo B (ej: "Imagen B.X").

4.  **NOMENCLATURA DE EVIDENCIAS Y REFERENCIAS:**
    * Usa "Imagen A.X" o "Imagen B.X" para referenciar evidencias.
    * En \`pasos_para_reproducir\`, \`resultado_esperado\` y \`resultado_actual\`, sé descriptivo y vincula con las anotaciones visuales o JSON si es relevante.

**CASO DE NO DIFERENCIAS RELEVANTES / EVIDENCIAS NO CLARAS / ERROR INTERNO:**
* Si, tras aplicar **RIGUROSAMENTE** el filtro del userContext y analizar las anotaciones, **NO HAY BUGS SIGNIFICATIVOS Y RELEVANTES**, responde **EXACTAMENTE y ÚNICAMENTE** con: \`[]\`.
* Si las evidencias no son claras o hay un error que impide el análisis, responde **EXACTAMENTE y ÚNICAMENTE** con el objeto de error específico proporcionado en el prompt.

**FORMATO DE SALIDA ESTRICTO JSON EN ESPAÑOL (SIN EXCEPCIONES):**
* La respuesta DEBE ser un array JSON válido.
* **ABSOLUTAMENTE PROHIBIDO INCLUIR:** Cualquier texto fuera del array JSON (explicaciones, saludos, etc.).
---
PROCEDE A GENERAR EL ARRAY JSON DEL REPORTE DE BUGS COMPARATIVO, APLICANDO TODAS LAS DIRECTRICES CRÍTICAS PARA UN ANÁLISIS DE QA ROBUSTO:`;

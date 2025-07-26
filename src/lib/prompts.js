export const PROMPT_FLOW_ANALYSIS_FROM_IMAGES = (annotationsContext = '') => `
    Eres un Ingeniero de QA experto en análisis forense de flujos de interfaz de usuario a partir de imágenes y en la documentación de pruebas.
    Tu tarea es analizar una secuencia de imágenes que representan un flujo de usuario YA EJECUTADO, y generar un informe detallado en formato JSON. Este informe debe documentar las acciones observadas, los datos de entrada (si son visibles o inferibles), los elementos clave, y los resultados esperados y obtenidos para cada paso, culminando en una conclusión general.
    Las imágenes se proporcionan en el orden en que ocurrieron los pasos del flujo.
    **ENTRADA PROPORCIONADA:**
    * **Imágenes del Flujo Ejecutado:** (Las imágenes adjuntas en base64 en la solicitud, en orden secuencial estricto. La primera imagen es "Imagen 1", la segunda "Imagen 2", etc.).
    ${annotationsContext ? `* **CONTEXTO ADICIONAL DEL USUARIO (PRIORIDAD ALTA):** ${annotationsContext}` : ''}
    **INSTRUCCIONES DETALLADAS PARA EL ANÁLISIS Y GENERACIÓN DEL INFORME:**
    1.  **SECUENCIA DE IMÁGENES Y ANOTACIONES:** Analiza las imágenes EN EL ORDEN ESTRICTO proporcionado. ${annotationsContext ? 'Utiliza el CONTEXTO ADICIONAL como la guía principal para entender el objetivo y la naturaleza del flujo.' : ''}
    2.  **IDENTIFICACIÓN DE PASOS Y ACCIONES:** Describe para cada paso: "descripcion_accion_observada", "imagen_referencia_entrada", "imagen_referencia_salida", "elemento_clave_y_ubicacion_aproximada", "dato_de_entrada_paso", "resultado_esperado_paso", "resultado_obtenido_paso_y_estado". Para "imagen_referencia_entrada" y "imagen_referencia_salida", usa el formato exacto "Imagen X", donde X es el número de la imagen comenzando en 1. La imagen de salida de un paso es usualmente la de entrada del siguiente.
    3.  **CONCLUSIONES GENERALES DEL FLUJO:** Infiere "Nombre_del_Escenario", "Resultado_Esperado_General_Flujo", y "Conclusion_General_Flujo".
    4.  **NÚMERO DE PASO:** Asegúrate que "numero_paso" sea un entero secuencial comenzando en 1.
    **CASO DE IMÁGENES NO INTERPRETABLES / ERROR INTERNO:**
    Si las imágenes no forman una secuencia lógica, responde **EXACTAMENTE y ÚNICAMENTE** con el siguiente array JSON:
    \`\`\`json
    [{"Nombre_del_Escenario":"Secuencia de imágenes no interpretable","Pasos_Analizados":[{"numero_paso":1,"descripcion_accion_observada":"Las imágenes proporcionadas no forman una secuencia lógica interpretable.","imagen_referencia_entrada":"N/A","imagen_referencia_salida":"N/A","elemento_clave_y_ubicacion_aproximada":"N/A","dato_de_entrada_paso":"N/A","resultado_esperado_paso":"N/A","resultado_obtenido_paso_y_estado":"Análisis no concluyente."}],"Resultado_Esperado_General_Flujo":"N/A","Conclusion_General_Flujo":"El análisis de flujo no pudo completarse."}]
    \`\`\`
    **FORMATO DE SALIDA ESTRICTO JSON EN ESPAÑOL (SIN EXCEPCIONES):**
    La respuesta DEBE ser un array JSON válido que contenga UN ÚNICO objeto. Las propiedades deben ser EXACTAS. PROHIBIDO incluir cualquier texto fuera del array JSON.
    PROCEDE A GENERAR EL ARRAY JSON:`;

export const PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT = (editedReportContextJSON) => `
    Eres un Ingeniero de QA experto en refinamiento de documentación de pruebas.
    Tu tarea es REFINAR un informe de análisis de flujo existente. Debes basarte en las imágenes originales y en el **contexto editado del informe (JSON proporcionado)**.
    **ENTRADA PROPORCIONADA:**
    1.  **Imágenes Originales del Flujo.**
    2.  **Contexto del Informe Editado (JSON):** \`\`\`json${editedReportContextJSON}\`\`\`
    **INSTRUCCIONES DETALLADAS PARA EL REFINAMIENTO:**
    1.  **PRIORIDAD ABSOLUTA AL "user_provided_additional_context":** Este campo es tu directriz principal. Si el usuario aclara que las imágenes son, por ejemplo, "resultados de una base de datos antes y después de una actualización" o "logs de un proceso batch", DEBES adaptar tu interpretación y la terminología utilizada en los campos que generes ("resultado_obtenido_paso_y_estado" y "Conclusion_General_Flujo") para que sean coherentes con esa naturaleza.
    2.  **RE-ANALIZA LAS IMÁGENES CON EL CONTEXTO DEL USUARIO:** Considera las ediciones ya hechas por el usuario en los campos como "descripcion_accion_observada", "elemento_clave_y_ubicacion_aproximada", "dato_de_entrada_paso", y "resultado_esperado_paso" (contenidos en el JSON de entrada) como la base "correcta" de la acción o estado que se está analizando en cada paso.
    3.  **ENFOQUE PRINCIPAL: Generar NUEVOS "resultado_obtenido_paso_y_estado":** Para cada paso en "Pasos_Analizados" del JSON de contexto: Tu tarea principal es generar un **NUEVO y PRECISO** "resultado_obtenido_paso_y_estado". Este debe reflejar fielmente si, dadas las acciones/entradas/elementos y expectativas definidas en el JSON de contexto (y cualquier aclaración en "user_provided_additional_context"), lo que se observa en las imágenes originales (especialmente en la "imagen_referencia_salida" si la tienes, o la siguiente a "imagen_referencia_entrada") coincide. Actualiza el estado a "Exitosa", "Fallido", "Exitosa con desviaciones" o "Inconclusivo", según corresponda. La descripción debe ser coherente con el tipo de flujo indicado por el usuario (ej. para datos: "Conforme: El valor en la columna X es Y", "No Conforme: El log muestra un error Z").
    4.  **ACTUALIZAR LA CONCLUSIÓN GENERAL:** Basado en los "resultado_obtenido_paso_y_estado" REFINADOS para todos los pasos, genera una nueva "Conclusion_General_Flujo".
    5.  **MANTENER LA ESTRUCTURA Y ORDEN Y COMPLETAR "imagen_referencia_salida":** El número de pasos y su orden deben coincidir con los de "Pasos_Analizados" en el JSON de contexto. Si el campo "imagen_referencia_salida" no existe o está vacío en el JSON de entrada para un paso, debes inferirlo a partir de las imágenes originales y añadirlo/completarlo en el paso refinado. Este campo es crucial para evidenciar el resultado obtenido.
    **FORMATO DE SALIDA ESTRICTO JSON EN ESPAÑOL (SIN EXCEPCIONES):**
    La respuesta DEBE ser un array JSON válido que contenga UN ÚNICO objeto. La estructura del objeto y sus campos deben coincidir con la definida en el prompt \`PROMPT_FLOW_ANALYSIS_FROM_IMAGES\`. **ABSOLUTAMENTE PROHIBIDO INCLUIR:** Cualquier texto fuera del array JSON.
    PROCEDE A GENERAR EL ARRAY JSON DEL INFORME DE ANÁLISIS DE FLUJO/SECUENCIA REFINADO, PONIENDO ESPECIAL ATENCIÓN AL "user_provided_additional_context" PARA ENTENDER LA NATURALEZA DE LAS IMÁGENES Y AJUSTAR LA INTERPRETACIÓN Y TERMINOLOGÍA SEGÚN SEA NECESARIO:`;

export const PROMPT_BUG_TICKET = (failedStepJSON, allStepsJSON) => `
    Actúa como un Ingeniero de QA meticuloso. A partir de los siguientes detalles de un paso de prueba fallido y el contexto del flujo completo (ambos en formato JSON), redacta una descripción clara y completa para un ticket de bug en formato Markdown.
    **Flujo Completo (Contexto):** \`\`\`json${allStepsJSON}\`\`\`
    **Paso Fallido Específico:** \`\`\`json${failedStepJSON}\`\`\`
    **Instrucciones para generar el ticket:**
    1.  **Título del Bug:** Crea un título conciso y descriptivo. Ejemplo: "Fallo en la validación al intentar registrar un usuario con email existente".
    2.  **Pasos para Reproducir:** Enumera todos los pasos del flujo hasta el momento del fallo. Usa las 'descripcion_accion_observada' del JSON de contexto. Sé claro y secuencial.
    3.  **Resultado Esperado:** Describe claramente lo que se esperaba que ocurriera en el paso que falló, basándote en 'resultado_esperado_paso'.
    4.  **Resultado Obtenido (Actual):** Describe exactamente lo que ocurrió en su lugar, basándote en 'resultado_obtenido_paso_y_estado'. Sé muy específico sobre el error observado.
    5.  **Evidencia:** Menciona que las evidencias visuales (imágenes) están adjuntas, haciendo referencia a 'imagen_referencia_entrada' y 'imagen_referencia_salida' del paso fallido.
    **FORMATO DE SALIDA:** Texto en formato Markdown en español.`;
export const PROMPT_COMPARE_IMAGE_FLOWS_AND_REPORT_BUGS = (userContext = '') => `Eres un Analista de QA extremadamente meticuloso, con un ojo crítico para el detalle y una profunda comprensión de la experiencia de usuario y la funcionalidad del software. Tu tarea es detectar BUGS REALES y RELEVANTES.
Debes comparar dos secuencias de imágenes: "Flujo A" (generalmente el estado esperado o versión anterior) y "Flujo B" (generalmente el estado actual o nueva versión). Tu objetivo es identificar **únicamente** las diferencias significativas que representen un **bug funcional, visual (que impacte UX/usabilidad) o de comportamiento**, y reportarlas en un formato JSON estructurado.
Las imágenes se proporcionan en un único bloque siguiendo este orden estricto: primero todas las correspondientes al **Flujo A** y, a continuación, todas las del **Flujo B**. Utiliza las referencias "Imagen A.X" y "Imagen B.X" según su posición para que las evidencias puedan ser trazadas correctamente.

${userContext ? `
**DIRECTRICES CRÍTICAS PARA LA DETECCIÓN DE BUGS (ORDEN DE PRIORIDAD):**
1.  **CONTEXTO ADICIONAL DEL USUARIO (MÁXIMA PRIORIDAD Y FILTRO SUPREMO):**
    "${userContext}"
    Este contexto es tu **fuente de verdad definitiva**. Puede incluir:
    * **Criterios Específicos:** Detalles sobre lo que se espera o no se espera, incluso si las imágenes sugieren lo contrario.
    * **Anotaciones JSON:** Información estructurada con "elementType" (ej. 'Campo de Entrada', 'Elemento de Datos', 'Log de Evento') y "elementValue" (ej. 'valor en DB', 'texto del log').
    * **Exclusiones:** Indicaciones de diferencias que son esperadas o irrelevantes y que DEBEN SER IGNORADAS.
    * **Focos de Atención:** Áreas específicas donde el usuario sospecha un bug.

    **TU ANÁLISIS DEBE PRIORIZAR ESTE CONTEXTO.** Si una diferencia visual no es un bug según el contexto, NO LA REPORTES. Si el contexto indica una funcionalidad o un estado específico (ej. "el botón X debe estar inactivo", "el valor en la BD debe ser 'Y'"), prioriza esa indicación sobre tu inferencia visual.
    
2.  **ANOTACIONES VISUALES EN IMAGEN (GUÍA DIRECTA PARA INSPECCIÓN):**
    Las imágenes (especialmente del Flujo B) pueden contener **rectángulos rojos con números y texto descriptivo**. Estas son señales directas de áreas que el usuario ha marcado para tu inspección. Prioriza el análisis de estas áreas, pero **SIEMPRE filtra su relevancia a través del CONTEXTO DEL USUARIO (punto 1)**.

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
* **Imágenes del Flujo A:** (Adjuntas en la solicitud, ordenadas secuencialmente. Ej: "Imagen A.1", "Imagen A.2", etc.) Las imágenes de este flujo pueden estar ausentes.
* **Imágenes del Flujo B:** (Adjuntas en la solicitud, ordenadas secuencialmente. Ej: "Imagen B.1", "Imagen B.2", etc.)
* **ANOTACIONES VISUALES EN IMAGEN (GUÍA PRIMARIA PARA HALLAZGOS PUNTUALES):** Las imágenes (especialmente del Flujo B) pueden contener anotaciones visuales directamente sobre ellas. Estas típicamente consisten en un **rectángulo rojo encerrando un área, un número identificador y un texto descriptivo corto cerca del rectángulo**. Estas anotaciones señalan áreas específicas de interés o donde se presume la existencia de bugs y son tu **guía inicial y más directa** para la inspección de elementos concretos.

**INSTRUCCIONES DETALLADAS PARA LA COMPARACIÓN Y REPORTE DE BUGS:**
1.  **ANÁLISIS COMPARATIVO SECUENCIAL Y CONTEXTUALIZADO:**
    * Itera a través de las imágenes de Flujo A y Flujo B en el orden secuencial.
    * **Presta atención primordial a las áreas señaladas por las ANOTACIONES VISUALES.**
    * **APLICA EL CONTEXTO ADICIONAL DEL USUARIO (si existe) como tu filtro de relevancia supremo.** Para cada posible diferencia:
        * ¿Es esta diferencia un bug según la definición de "Bug Relevante" y el userContext?
        * Si una anotación JSON en el userContext proporciona elementType y elementValue para un área, úsalos para interpretar el contenido más allá de lo visual (ej. si es un log, no solo el texto, sino si el valor del error es el esperado).
    * **Si las imágenes del Flujo A están ausentes** (indicado en el userContext), tu análisis se centrará **exclusivamente en el Flujo B**. Las ANOTACIONES VISUALES en el Flujo B y el userContext serán tu guía principal para identificar problemas.
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
    * \`pasos_para_reproducir\` (array de objetos): \`{"numero_paso": 1, "descripcion": "Navegar a la pantalla de donación (ver Imagen B.1)."}\`, \`{"numero_paso": 2, "descripcion": "Ingresar un valor negativo (ej. '-10') en el campo de monto."}\`. Los pasos deben ser concisos y referenciar las imágenes por su número.
    * \`resultado_esperado\` (string): Lo que se esperaba observar. **Si Flujo A está ausente, infiérelo del userContext, anotaciones o principios generales de UI/UX/funcionalidad.**
    * \`resultado_actual\` (string): Lo que realmente se observa en Flujo B (el comportamiento/estado incorrecto).
    * \`imagen_referencia_flujo_a\` (string, opcional): Referencia a la imagen específica de Flujo A (ej: "Imagen A.X") si es relevante y Flujo A existe. Si Flujo A está ausente o no aplica, este campo DEBE ser "N/A".
    * \`imagen_referencia_flujo_b\` (string): **CRUCIAL: OBLIGATORIO SI EL BUG SE OBSERVA EN UNA IMAGEN DEL FLUJO B.** Debe ser la referencia a la imagen específica de Flujo B (ej: "Imagen B.X").

4.  **NOMENCLATURA DE IMÁGENES Y REFERENCIAS:**
    * Usa "Imagen A.X" o "Imagen B.X" para referenciar imágenes.
    * En \`pasos_para_reproducir\`, \`resultado_esperado\` y \`resultado_actual\`, sé descriptivo y vincula con las anotaciones visuales o JSON si es relevante.

**CASO DE NO DIFERENCIAS RELEVANTES / IMÁGENES NO CLARAS / ERROR INTERNO:**
* Si, tras aplicar **RIGUROSAMENTE** el filtro del userContext y analizar las anotaciones, **NO HAY BUGS SIGNIFICATIVOS Y RELEVANTES**, responde **EXACTAMENTE y ÚNICAMENTE** con: \`[]\`.
* Si las imágenes no son claras o hay un error que impide el análisis, responde **EXACTAMENTE y ÚNICAMENTE** con el objeto de error específico proporcionado en el prompt.

**FORMATO DE SALIDA ESTRICTO JSON EN ESPAÑOL (SIN EXCEPCIONES):**
* La respuesta DEBE ser un array JSON válido.
* **ABSOLUTAMENTE PROHIBIDO INCLUIR:** Cualquier texto fuera del array JSON (explicaciones, saludos, etc.).
---
PROCEDE A GENERAR EL ARRAY JSON DEL REPORTE DE BUGS COMPARATIVO, APLICANDO TODAS LAS DIRECTRICES CRÍTICAS PARA UN ANÁLISIS DE QA ROBUSTO:`;

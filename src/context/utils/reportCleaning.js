export const extractPasoFieldsFromText = (text = '') => {
  if (!text) return {};

  const normalized = text.replace(/\r/g, '');
  const extract = (label) => {
    const regex = new RegExp(`${label}\s*[:\-]\s*([^|\n]+)`, 'i');
    const match = normalized.match(regex);
    return match ? match[1].trim() : null;
  };

  return {
    datoEntrada: extract('(?:dato(?:s)? de entrada|dato(?:s)? ancla|input data)') || undefined,
    resultadoEsperado: extract('resultado esperado(?: del paso)?') || extract('validaci[oó]n esperada') || undefined,
    resultadoObtenido: extract('resultado obtenido(?: del paso)?') || extract('observaci[oó]n') || undefined
  };
};

export const cleanReportData = (reportData, images = []) => {
  if (!reportData) return reportData;

  let cleaned = { ...reportData };
  if (!cleaned.id_caso) cleaned.id_caso = cleaned.test_case_id || cleaned.id || 'Generado';

  if (typeof cleaned.id_caso === 'string') {
    if (cleaned.id_caso === 'Generado' || !cleaned.id_caso) {
      cleaned.id_caso = `GEN-${Date.now().toString().slice(-4)}`;
    } else if (cleaned.id_caso.length > 15) {
      const parts = cleaned.id_caso.split(/[-_]/);
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        if (lastPart.length < 6) {
          cleaned.id_caso = lastPart;
        }
      }
    }
  }

  if (!cleaned.escenario_prueba) {
    cleaned.escenario_prueba = cleaned.title || cleaned.titulo || cleaned.nombre_escenario || 'Definir nombre del escenario';
  }

  const genericNames = ['Caso de Prueba', 'Flujo de Usuario', 'Test Case', 'Escenario de Prueba'];
  const technicalPrefixes = ['E2E-', 'TC-', 'Refinamiento_', 'UI-'];

  if (typeof cleaned.escenario_prueba === 'string') {
    const trimmed = cleaned.escenario_prueba.trim();
    if (genericNames.includes(trimmed)) {
      cleaned.escenario_prueba = 'Definir nombre del escenario';
    } else if (technicalPrefixes.some(prefix => trimmed.startsWith(prefix))) {
      let cleanedName = trimmed;
      technicalPrefixes.forEach(prefix => { cleanedName = cleanedName.replace(prefix, ''); });
      cleanedName = cleanedName.replace(/[-_]/g, ' ').trim();
      cleaned.escenario_prueba = cleanedName || 'Definir nombre del escenario';
    }
  }

  let rawPreconditions = cleaned.precondiciones || cleaned.pre_conditions || cleaned.preconditions;
  if (rawPreconditions) {
    const invalidValues = ['-', 'N/A', 'n/a', 'NA', 'null', ''];
    const trimmed = typeof rawPreconditions === 'string' ? rawPreconditions.trim() : rawPreconditions;

    if (invalidValues.includes(trimmed)) {
      cleaned.precondiciones = 'Ninguna precondición específica';
    } else if (Array.isArray(rawPreconditions)) {
      cleaned.precondiciones = rawPreconditions.map(p => `- ${p}`).join('\n');
    } else if (typeof rawPreconditions === 'string') {
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            cleaned.precondiciones = parsed.map(p => `- ${p}`).join('\n');
          } else {
            cleaned.precondiciones = rawPreconditions;
          }
        } catch (e) {
          cleaned.precondiciones = rawPreconditions;
        }
      } else {
        cleaned.precondiciones = rawPreconditions;
      }
    }
  } else {
    cleaned.precondiciones = 'Ninguna precondición específica';
  }

  const invalidValues = ['-', 'N/A', 'n/a', 'NA', 'null', ''];

  if (!cleaned.resultado_esperado) {
    cleaned.resultado_esperado = cleaned.expected_result ||
      cleaned.resultado_esperado_general ||
      cleaned.resultado_esperado_flujo ||
      cleaned.resultado_esperado_global;

    if (!cleaned.resultado_esperado) {
      let posConds = cleaned.poscondiciones || cleaned.post_conditions || cleaned.postconditions || cleaned.pos_conditions;
      if (posConds) {
        if (Array.isArray(posConds)) {
          cleaned.resultado_esperado = posConds.map(p => `- ${p}`).join('\n');
        } else {
          cleaned.resultado_esperado = posConds;
        }
      }
    }

    if (!cleaned.resultado_esperado) cleaned.resultado_esperado = 'Definir criterio de éxito esperado';
  }

  if (typeof cleaned.resultado_esperado === 'string' && invalidValues.includes(cleaned.resultado_esperado.trim())) {
    cleaned.resultado_esperado = 'Definir criterio de éxito esperado';
  }

  if (!cleaned.resultado_obtenido) {
    cleaned.resultado_obtenido = cleaned.actual_result ||
      cleaned.resultado_actual ||
      cleaned.conclusion ||
      cleaned.estado_final ||
      cleaned.resultado_obtenido_global ||
      'Pendiente de ejecución';
  }

  if (typeof cleaned.resultado_obtenido === 'string' && invalidValues.includes(cleaned.resultado_obtenido.trim())) {
    cleaned.resultado_obtenido = 'Pendiente de ejecución';
  }

  if (images.length > 0 && cleaned.resultado_obtenido === 'Pendiente de ejecución' && cleaned.resultado_esperado && cleaned.resultado_esperado !== 'Definir criterio de éxito esperado') {
    cleaned.resultado_obtenido = cleaned.resultado_esperado
      .replace(/debería/gi, 'se observa que')
      .replace(/debe/gi, 'se visualiza')
      .replace(/Se visualiza/gi, 'Se visualiza correctamente');
  }

  if (!cleaned.estado_general || cleaned.estado_general === 'Pendiente') {
    if (cleaned.resultado_esperado &&
      cleaned.resultado_obtenido &&
      cleaned.resultado_esperado !== 'Definir criterio de éxito esperado' &&
      cleaned.resultado_obtenido !== 'Pendiente de ejecución') {
      const normalizar = (texto) => texto.toLowerCase().replace(/[.,;:]/g, '').replace(/\s+/g, ' ').trim();
      const esperadoNorm = normalizar(cleaned.resultado_esperado);
      const obtenidoNorm = normalizar(cleaned.resultado_obtenido);
      const tieneError = /error|fallo|fallido|incorrecto|no se pudo|denegado/i.test(obtenidoNorm);

      if (!tieneError) {
        const palabrasEsperado = esperadoNorm.split(' ').filter(p => p.length > 3);
        const palabrasObtenido = obtenidoNorm.split(' ').filter(p => p.length > 3);
        const palabrasComunes = palabrasEsperado.filter(p => palabrasObtenido.includes(p));
        const similitud = palabrasComunes.length / Math.max(palabrasEsperado.length, 1);

        if (similitud > 0.4) {
          cleaned.estado_general = 'Exitoso';
        } else {
          cleaned.estado_general = 'Pendiente';
        }
      } else {
        cleaned.estado_general = 'Fallido';
      }
    } else if (cleaned.resultado_obtenido === 'Pendiente de ejecución') {
      cleaned.estado_general = 'Pendiente';
    }
  }

  let rawSteps = cleaned.pasos || cleaned.steps || cleaned.Pasos_Analizados;
  if (rawSteps && Array.isArray(rawSteps) && rawSteps.length > 0) {
    console.log('DEBUG - Estructura del primer paso:', rawSteps[0]);
    console.log('DEBUG - Tipo del primer paso:', typeof rawSteps[0]);
    console.log('DEBUG - Claves disponibles:', Object.keys(rawSteps[0]));
  }

  if (rawSteps && Array.isArray(rawSteps)) {
    if (rawSteps.length > 0 && typeof rawSteps[0] === 'string') {
      console.warn('⚠️ La IA generó pasos como strings. Convirtiendo a objetos...');
      rawSteps = rawSteps.map((stepText, index) => ({
        numero_paso: index + 1,
        descripcion: stepText,
        imagen_referencia: index < images.length ? `Evidencia ${index + 1}` : (images.length > 0 ? `Evidencia ${images.length}` : 'N/A')
      }));
    }

    console.log('🔍 Procesando pasos. Total:', rawSteps.length);
    console.log('🔍 Primer paso raw:', rawSteps[0]);

    cleaned.Pasos_Analizados = rawSteps.map((step, index) => {
      let imgRef = step.imagen_referencia || step.image_ref || step.evidencia;
      if (!imgRef || imgRef === 'N/A') {
        if (index < images.length) {
          imgRef = `Evidencia ${index + 1}`;
        } else if (images.length > 0) {
          imgRef = `Evidencia ${images.length}`;
        } else {
          imgRef = 'N/A';
        }
      }

      return {
        numero_paso: step.numero_paso || step.step_number || step.number || step.id_paso || step.orden || (index + 1),
        descripcion_accion_observada: step.descripcion_accion_observada || step.descripcion || step.description || step.action || step.accion || step.texto || step.text || 'Sin descripción',
        imagen_referencia: imgRef
      };
    });

    console.log('✅ Pasos procesados. Primer paso final:', cleaned.Pasos_Analizados[0]);
  }

  cleaned.Nombre_del_Escenario = cleaned.escenario_prueba;
  cleaned.Resultado_Esperado_General_Flujo = cleaned.resultado_esperado;
  cleaned.Conclusion_General_Flujo = cleaned.resultado_obtenido;

  if (cleaned.Resultado_Esperado_General_Flujo) {
    let cleanedField = cleaned.Resultado_Esperado_General_Flujo;
    const patterns = [
      /^Resultado Esperado General del Flujo:\s*/i,
      /^Resultado Esperado General:\s*/i,
      /^Resultado Esperado:\s*/i
    ];

    for (const pattern of patterns) {
      cleanedField = cleanedField.replace(pattern, '');
    }

    cleaned.Resultado_Esperado_General_Flujo = cleanedField.trim();
  }

  if (cleaned.Pasos_Analizados && Array.isArray(cleaned.Pasos_Analizados)) {
    cleaned.Pasos_Analizados = cleaned.Pasos_Analizados.map(paso => {
      const cleanedPaso = { ...paso };

      if (cleanedPaso.resultado_obtenido_paso_y_estado) {
        let cleanedResult = cleanedPaso.resultado_obtenido_paso_y_estado;

        if (cleanedResult.trim().startsWith('{') && cleanedResult.trim().endsWith('}')) {
          cleanedResult = cleanedResult.trim().slice(1, -1).trim();
        }

        const jsonPatterns = [
          /"estado"\s*:\s*"([^"]+)"\s*,\s*"descripcion"\s*:\s*"([^"]+)"/i,
          /"descripcion"\s*:\s*"([^"]+)"\s*,\s*"estado"\s*:\s*"([^"]+)"/i
        ];

        for (const pattern of jsonPatterns) {
          const match = cleanedResult.match(pattern);
          if (match) {
            const estado = match[1] || match[2];
            const descripcion = match[2] || match[1];
            cleanedResult = `${estado}: ${descripcion}`;
            break;
          }
        }

        cleanedPaso.resultado_obtenido_paso_y_estado = cleanedResult.trim();
      }

      if (cleanedPaso.dato_de_entrada_paso === 'N/A') {
        cleanedPaso.dato_de_entrada_paso = '';
      }

      return cleanedPaso;
    });
  }

  return cleaned;
};

import { supabase } from './supabaseClient.js';
import { storeImagesForReport, loadImagesForReports } from './imageService.js';
import { getSessionId } from './sessionService.js';

export const saveReport = async (reportData, isTemporary = false) => {
  try {
    const { imageFiles, Pasos_Analizados, ...otherData } = reportData;
    const videoFile = imageFiles && imageFiles.find(f => f.isVideo || (f.type && f.type.startsWith('video/')));
    const videoUrl = videoFile ? videoFile.dataURL : null;

    const { data: report, error: reportError } = await supabase
      .from('test_scenarios')
      .insert([{
        id_caso: otherData.id_caso || null,
        escenario_prueba: otherData.escenario_prueba || otherData.Nombre_del_Escenario || 'Caso de Prueba',
        precondiciones: otherData.precondiciones || null,
        resultado_esperado: otherData.resultado_esperado || otherData.Resultado_Esperado_General_Flujo || null,
        resultado_obtenido: otherData.resultado_obtenido || otherData.Conclusion_General_Flujo || null,
        historia_usuario: otherData.historia_usuario || null,
        user_story_id: otherData.user_story_id || null,
        set_escenarios: otherData.set_escenarios || null,
        fecha_ejecucion: otherData.fecha_ejecucion || new Date().toISOString().split('T')[0],
        estado_general: otherData.estado_general || 'Pendiente',
        nombre_del_escenario: otherData.escenario_prueba || otherData.Nombre_del_Escenario || 'Caso de Prueba',
        resultado_esperado_general_flujo: otherData.resultado_esperado || otherData.Resultado_Esperado_General_Flujo || null,
        conclusion_general_flujo: otherData.resultado_obtenido || otherData.Conclusion_General_Flujo || null,
        user_provided_additional_context: otherData.user_provided_additional_context || null,
        initial_context: otherData.initial_context || null,
        video_url: videoUrl,
        is_temp: isTemporary,
        session_id: isTemporary ? getSessionId() : null
      }])
      .select()
      .single();

    if (reportError) throw reportError;

    let savedSteps = [];
    if (Pasos_Analizados && Pasos_Analizados.length > 0) {
      const stepsToInsert = Pasos_Analizados.map((paso, index) => ({
        scenario_id: report.id,
        numero_paso: paso.numero_paso || paso.numero || (index + 1),
        descripcion_accion_observada: paso.descripcion || paso.descripcion_accion_observada || null,
        imagen_referencia: paso.imagen_referencia || null
      }));

      const { data: steps, error: stepsError } = await supabase
        .from('test_scenario_steps')
        .insert(stepsToInsert)
        .select();

      if (stepsError) {
        console.warn('Error saving steps:', stepsError);
      } else {
        savedSteps = steps || [];
      }
    }

    let savedImages = [];
    if (imageFiles && imageFiles.length > 0) {
      savedImages = await storeImagesForReport(report.id, imageFiles, savedSteps, isTemporary);
    }

    return {
      ...reportData,
      id: report.id,
      imageFiles: savedImages,
      created_at: report.created_at,
      updated_at: report.updated_at,
      is_temp: isTemporary,
      session_id: report.session_id,
      Pasos_Analizados: savedSteps
    };
  } catch (error) {
    console.error('Error saving report:', error);
    throw error;
  }
};

export const loadReports = async (filters = {}) => {
  return await loadPermanentReports(filters);
};

export const addStepToReport = async (reportId, stepData, newImages = []) => {
  try {
    const { data: existingSteps } = await supabase
      .from('test_scenario_steps')
      .select('numero_paso')
      .eq('scenario_id', reportId)
      .order('numero_paso', { ascending: false })
      .limit(1);

    const nextStepNumber = existingSteps && existingSteps.length > 0
      ? existingSteps[0].numero_paso + 1
      : 1;

    const { data: newStep, error: stepError } = await supabase
      .from('test_scenario_steps')
      .insert([{
        scenario_id: reportId,
        numero_paso: nextStepNumber,
        descripcion_accion_observada: stepData.descripcion_accion_observada || null,
        imagen_referencia: stepData.imagen_referencia || null
      }])
      .select()
      .single();

    if (stepError) throw stepError;

    if (newImages && newImages.length > 0) {
      await storeImagesForReport(reportId, newImages, [newStep], false);
    }

    await supabase
      .from('test_scenarios')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', reportId);

    return { ...newStep, numero_paso: nextStepNumber };
  } catch (error) {
    console.error('Error adding step to report:', error);
    throw error;
  }
};

export const deleteStepFromReport = async (reportId, stepNumber) => {
  try {
    const { error: deleteError } = await supabase
      .from('test_scenario_steps')
      .delete()
      .eq('scenario_id', reportId)
      .eq('numero_paso', stepNumber);

    if (deleteError) throw deleteError;

    const { data: stepsToReorder, error: selectError } = await supabase
      .from('test_scenario_steps')
      .select('id, numero_paso')
      .eq('scenario_id', reportId)
      .gt('numero_paso', stepNumber)
      .order('numero_paso', { ascending: true });

    if (selectError) throw selectError;

    if (stepsToReorder && stepsToReorder.length > 0) {
      const updatePromises = stepsToReorder.map((step, index) =>
        supabase
          .from('test_scenario_steps')
          .update({ numero_paso: stepNumber + index })
          .eq('id', step.id)
      );

      await Promise.all(updatePromises);
    }

    await supabase
      .from('test_scenarios')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', reportId);

    return true;
  } catch (error) {
    console.error('Error deleting step from report:', error);
    throw error;
  }
};

export const updateStepInReport = async (reportId, stepId, stepData) => {
  try {
    const { data, error } = await supabase
      .from('test_scenario_steps')
      .update({
        descripcion_accion_observada: stepData.descripcion_accion_observada || null,
        imagen_referencia: stepData.imagen_referencia || null
      })
      .eq('id', stepId)
      .eq('scenario_id', reportId)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('reports')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', reportId);

    return data;
  } catch (error) {
    console.error('Error updating step in report:', error);
    throw error;
  }
};

export const deleteReport = async (reportId) => {
  try {
    const { error } = await supabase
      .from('test_scenarios')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

export const updateReport = async (reportId, reportData) => {
  try {
    const { imageFiles, Pasos_Analizados, ...otherData } = reportData;
    const { data: report, error: reportError } = await supabase
      .from('test_scenarios')
      .update({
        id_caso: otherData.id_caso || null,
        escenario_prueba: otherData.escenario_prueba || otherData.Nombre_del_Escenario || 'Caso de Prueba',
        precondiciones: otherData.precondiciones || null,
        resultado_esperado: otherData.resultado_esperado || otherData.Resultado_Esperado_General_Flujo || null,
        resultado_obtenido: otherData.resultado_obtenido || otherData.Conclusion_General_Flujo || null,
        historia_usuario: otherData.historia_usuario || null,
        user_story_id: otherData.user_story_id || null,
        set_escenarios: otherData.set_escenarios || null,
        fecha_ejecucion: otherData.fecha_ejecucion || new Date().toISOString().split('T')[0],
        estado_general: otherData.estado_general || 'Pendiente',
        nombre_del_escenario: otherData.escenario_prueba || otherData.Nombre_del_Escenario || 'Caso de Prueba',
        resultado_esperado_general_flujo: otherData.resultado_esperado || otherData.Resultado_Esperado_General_Flujo || null,
        conclusion_general_flujo: otherData.resultado_obtenido || otherData.Conclusion_General_Flujo || null,
        user_provided_additional_context: otherData.user_provided_additional_context || null,
        initial_context: otherData.initial_context || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (reportError) {
      console.error('Error updating report:', reportError);
      throw reportError;
    }

    if (Pasos_Analizados && Pasos_Analizados.length > 0) {
      const { error: deleteError } = await supabase
        .from('test_scenario_steps')
        .delete()
        .eq('scenario_id', reportId);

      if (deleteError) {
        console.warn('Error deleting existing steps:', deleteError);
      }

      const stepsToInsert = Pasos_Analizados.map((paso, index) => ({
        scenario_id: reportId,
        numero_paso: paso.numero_paso || (index + 1),
        descripcion_accion_observada: paso.descripcion || paso.descripcion_accion_observada || null,
        imagen_referencia: paso.imagen_referencia || null
      }));

      const { error: stepsError } = await supabase
        .from('test_scenario_steps')
        .insert(stepsToInsert)
        .select();

      if (stepsError) {
        console.error('Error inserting updated steps:', stepsError);
        throw stepsError;
      }
    }

    if (imageFiles && imageFiles.length > 0) {
      const { error: deleteImagesError } = await supabase
        .from('report_images')
        .delete()
        .eq('report_id', reportId);

      if (deleteImagesError) {
        console.warn('Error deleting existing images:', deleteImagesError);
      }

      const imagesToInsert = imageFiles.map((image, index) => ({
        report_id: reportId,
        image_order: index + 1,
        image_data: image.dataURL || image.dataUrl || image.data,
        file_name: image.name || `image_${index + 1}`,
        file_type: image.type || 'image/png',
        file_size: image.size || null,
        step_image_type: 'general',
        is_stored_in_storage: false,
        is_temp: false
      }));

      const { error: imagesError } = await supabase
        .from('report_images')
        .insert(imagesToInsert)
        .select();

      if (imagesError) {
        console.error('Error inserting updated images:', imagesError);
        throw imagesError;
      }
    }

    return {
      ...reportData,
      id: reportId,
      created_at: report.created_at,
      updated_at: report.updated_at,
      is_temp: report.is_temp,
      session_id: report.session_id
    };
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

export const saveRefinement = async (originalReportId, refinedReportId, refinementType, changesSummary, userContext) => {
  try {
    const { data, error } = await supabase
      .from('refinements')
      .insert([{
        report_id: originalReportId,
        refined_report_id: refinedReportId,
        refinement_type: refinementType,
        changes_summary: changesSummary,
        user_context: userContext
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving refinement:', error);
    throw error;
  }
};

export const loadBugsForReport = async (reportId) => {
  try {
    return [{
      id: 1,
      report_id: reportId,
      step_number: 1,
      title: `Bug del reporte ${reportId}`,
      description: 'Este es un bug específico del reporte',
      status: 'open',
      priority: 'high',
      created_at: new Date().toISOString()
    }];
  } catch (error) {
    console.error('Error loading bugs for report:', error);
    throw error;
  }
};

export const updateBugStatus = async (bugId, newStatus) => {
  try {
    return {
      id: bugId,
      status: newStatus,
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating bug status:', error);
    throw error;
  }
};

export const makeReportPermanent = async (reportId) => {
  try {
    const { data, error } = await supabase
      .from('test_scenarios')
      .update({
        is_temp: false,
        session_id: null
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('report_images')
      .update({ is_temp: false })
      .eq('report_id', reportId);

    return data;
  } catch (error) {
    console.error('Error making report permanent:', error);
    throw error;
  }
};

export const loadPermanentReports = async (filters = {}) => {
  try {
    const sessionId = getSessionId();

    let query = supabase
      .from('test_scenarios')
      .select(`
        *,
        test_scenario_steps (*),
        user_stories (numero, title)
      `)
      .or(`is_temp.eq.false,and(is_temp.eq.true,session_id.eq.${sessionId})`)
      .order('created_at', { ascending: false });

    if (filters.userStoryId) {
      query = query.eq('user_story_id', filters.userStoryId);
    }

    const { data: reports, error } = await query;
    if (error) throw error;
    if (!reports) return [];

    const reportIds = reports.map((report) => report.id);
    const images = await loadImagesForReports(reportIds);
    const imagesByReport = images.reduce((acc, image) => {
      if (!acc[image.report_id]) acc[image.report_id] = [];
      acc[image.report_id].push(image);
      return acc;
    }, {});

    return reports.map((report) => {
      const imageFiles = (imagesByReport[report.id] || []).map((img) => ({
        id: img.id,
        name: img.file_name,
        dataURL: img.is_video ? img.video_url : img.image_data,
        size: img.file_size,
        type: img.file_type,
        isVideo: img.is_video,
        fromVideoFrame: img.from_video_frame || false,
        stepNumber: img.step_number || null
      }));

      return {
        id_caso: report.id_caso,
        escenario_prueba: report.escenario_prueba,
        precondiciones: report.precondiciones,
        resultado_esperado: report.resultado_esperado,
        resultado_obtenido: report.resultado_obtenido,
        historia_usuario: report.historia_usuario,
        user_story_id: report.user_story_id,
        user_story_data: report.user_stories,
        set_escenarios: report.set_escenarios,
        fecha_ejecucion: report.fecha_ejecucion,
        estado_general: report.estado_general,
        Nombre_del_Escenario: report.escenario_prueba || report.nombre_del_escenario,
        Resultado_Esperado_General_Flujo: report.resultado_esperado || report.resultado_esperado_general_flujo,
        Conclusion_General_Flujo: report.resultado_obtenido || report.conclusion_general_flujo,
        user_provided_additional_context: report.user_provided_additional_context,
        initial_context: report.initial_context,
        Pasos_Analizados: (report.test_scenario_steps || []).sort((a, b) => a.numero_paso - b.numero_paso).map(step => ({
          ...step,
          numero: step.numero_paso,
          descripcion: step.descripcion_accion_observada,
          imagen_referencia: step.imagen_referencia
        })),
        pasos: (report.test_scenario_steps || []).sort((a, b) => a.numero_paso - b.numero_paso).map(step => ({
          numero_paso: step.numero_paso,
          descripcion: step.descripcion_accion_observada,
          imagen_referencia: step.imagen_referencia
        })),
        id: report.id,
        created_at: report.created_at,
        updated_at: report.updated_at,
        is_temp: report.is_temp,
        session_id: report.session_id,
        imageFiles
      };
    });
  } catch (error) {
    console.error('Error loading permanent reports:', error);
    throw error;
  }
};

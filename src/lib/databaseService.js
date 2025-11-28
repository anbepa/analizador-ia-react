import { supabase } from './supabaseClient.js';
import { storeImagesForReport, loadImagesForReports } from './imageService.js';

/**
 * Generate a session ID for the current browser session
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('qa_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('qa_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Search user stories by code or title
 */
export const searchUserStories = async (query) => {
  try {
    if (!query) return [];

    // Si es número, buscar coincidencia exacta o parcial en título
    const isNumber = /^\d+$/.test(query);

    let dbQuery = supabase
      .from('user_stories')
      .select('*')
      .limit(10);

    if (isNumber) {
      dbQuery = dbQuery.or(`numero.eq.${query},title.ilike.%${query}%`);
    } else {
      dbQuery = dbQuery.ilike('title', `%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching user stories:', error);
    return [];
  }
};

/**
 * Create a new user story
 */
export const createUserStory = async (numero, title) => {
  try {
    const { data, error } = await supabase
      .from('user_stories')
      .insert([{ numero: parseInt(numero), title }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user story:', error);
    throw error;
  }
};

/**
 * Delete a user story
 */
export const deleteUserStory = async (id) => {
  try {
    const { error } = await supabase
      .from('user_stories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting user story:', error);
    throw error;
  }
};

/**
 * Save a report to the database
 */
export const saveReport = async (reportData, isTemporary = false) => {
  try {
    const { imageFiles, Pasos_Analizados, ...otherData } = reportData;

    // Check for video URL
    const videoFile = imageFiles && imageFiles.find(f => f.isVideo || (f.type && f.type.startsWith('video/')));
    const videoUrl = videoFile ? videoFile.dataURL : null;

    // Save basic report data - incluye campos nuevos Y legacy para compatibilidad total
    const { data: report, error: reportError } = await supabase
      .from('test_scenarios')
      .insert([{
        // Campos nuevos de casos de prueba
        id_caso: otherData.id_caso || null,
        escenario_prueba: otherData.escenario_prueba || otherData.Nombre_del_Escenario || 'Caso de Prueba',
        precondiciones: otherData.precondiciones || null,
        resultado_esperado: otherData.resultado_esperado || otherData.Resultado_Esperado_General_Flujo || null,
        resultado_obtenido: otherData.resultado_obtenido || otherData.Conclusion_General_Flujo || null,
        historia_usuario: otherData.historia_usuario || null,
        user_story_id: otherData.user_story_id || null, // Nuevo campo FK
        set_escenarios: otherData.set_escenarios || null,
        fecha_ejecucion: otherData.fecha_ejecucion || new Date().toISOString().split('T')[0],
        estado_general: otherData.estado_general || 'Pendiente',
        // Campos legacy (requeridos por la BD)
        nombre_del_escenario: otherData.escenario_prueba || otherData.Nombre_del_Escenario || 'Caso de Prueba',
        resultado_esperado_general_flujo: otherData.resultado_esperado || otherData.Resultado_Esperado_General_Flujo || null,
        conclusion_general_flujo: otherData.resultado_obtenido || otherData.Conclusion_General_Flujo || null,
        // Campos comunes
        user_provided_additional_context: otherData.user_provided_additional_context || null,
        initial_context: otherData.initial_context || null,
        video_url: videoUrl,
        is_temp: isTemporary,
        session_id: isTemporary ? getSessionId() : null
      }])
      .select()
      .single();

    if (reportError) throw reportError;

    // Save report steps if any
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

    // Save images if any, now with proper step associations
    let savedImages = [];
    if (imageFiles && imageFiles.length > 0) {
      savedImages = await storeImagesForReport(report.id, imageFiles, savedSteps, isTemporary);
    }

    // Return complete report with the original structure for compatibility
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

/**
 * Load all reports from the database (backwards compatibility)
 */
export const loadReports = async (filters = {}) => {
  return await loadPermanentReports(filters);
};

/**
 * Add a new step to an existing report
 */
export const addStepToReport = async (reportId, stepData, newImages = []) => {
  try {
    // First, get the current steps to determine the next step number
    const { data: existingSteps } = await supabase
      .from('test_scenario_steps')
      .select('numero_paso')
      .eq('scenario_id', reportId)
      .order('numero_paso', { ascending: false })
      .limit(1);

    const nextStepNumber = existingSteps && existingSteps.length > 0
      ? existingSteps[0].numero_paso + 1
      : 1;

    // Insert the new step
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

    // Save any new images associated with this step
    if (newImages && newImages.length > 0) {
      await storeImagesForReport(reportId, newImages, [newStep], false);
    }

    // Update the report's updated_at timestamp
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

/**
 * Delete a step from a report and reorder remaining steps
 */
export const deleteStepFromReport = async (reportId, stepNumber) => {
  try {
    // Delete the specific step
    const { error: deleteError } = await supabase
      .from('test_scenario_steps')
      .delete()
      .eq('scenario_id', reportId)
      .eq('numero_paso', stepNumber);

    if (deleteError) throw deleteError;

    // Get all remaining steps that have higher step numbers
    const { data: stepsToReorder, error: selectError } = await supabase
      .from('test_scenario_steps')
      .select('id, numero_paso')
      .eq('scenario_id', reportId)
      .gt('numero_paso', stepNumber)
      .order('numero_paso', { ascending: true });

    if (selectError) throw selectError;

    // Reorder the remaining steps
    if (stepsToReorder && stepsToReorder.length > 0) {
      const updatePromises = stepsToReorder.map((step, index) =>
        supabase
          .from('test_scenario_steps')
          .update({ numero_paso: stepNumber + index })
          .eq('id', step.id)
      );

      await Promise.all(updatePromises);
    }

    // Update the report's updated_at timestamp
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

/**
 * Update a specific step
 */
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

    // Update the report's updated_at timestamp
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

/**
 * Delete a report
 */
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

/**
 * Test database connection
 */
export const testDatabaseConnection = async () => {
  try {
    const { error } = await supabase
      .from('test_scenarios')
      .select('id')
      .limit(1);

    return !error;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const { count, error } = await supabase
      .from('test_scenarios')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return {
      reports: count || 0
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { reports: 0 };
  }
};

/**
 * Update a report (simplified - just saves it again)
 */
export const updateReport = async (reportId, reportData) => {
  try {
    console.log('Updating report in database:', reportId, reportData);
    const { imageFiles, Pasos_Analizados, ...otherData } = reportData;

    // Update basic report data - incluye campos nuevos Y legacy para compatibilidad total
    const { data: report, error: reportError } = await supabase
      .from('test_scenarios')
      .update({
        // Campos nuevos de casos de prueba
        id_caso: otherData.id_caso || null,
        escenario_prueba: otherData.escenario_prueba || otherData.Nombre_del_Escenario || 'Caso de Prueba',
        precondiciones: otherData.precondiciones || null,
        resultado_esperado: otherData.resultado_esperado || otherData.Resultado_Esperado_General_Flujo || null,
        resultado_obtenido: otherData.resultado_obtenido || otherData.Conclusion_General_Flujo || null,
        historia_usuario: otherData.historia_usuario || null,
        user_story_id: otherData.user_story_id || null, // Nuevo campo FK
        set_escenarios: otherData.set_escenarios || null,
        fecha_ejecucion: otherData.fecha_ejecucion || new Date().toISOString().split('T')[0],
        estado_general: otherData.estado_general || 'Pendiente',
        // Campos legacy (requeridos por la BD)
        nombre_del_escenario: otherData.escenario_prueba || otherData.Nombre_del_Escenario || 'Caso de Prueba',
        resultado_esperado_general_flujo: otherData.resultado_esperado || otherData.Resultado_Esperado_General_Flujo || null,
        conclusion_general_flujo: otherData.resultado_obtenido || otherData.Conclusion_General_Flujo || null,
        // Campos comunes
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

    console.log('Report updated successfully, now updating steps...');

    // Update report steps if any
    if (Pasos_Analizados && Pasos_Analizados.length > 0) {
      console.log('Deleting existing steps for report:', reportId);
      // Delete existing steps first
      const { error: deleteError } = await supabase
        .from('test_scenario_steps')
        .delete()
        .eq('scenario_id', reportId);

      if (deleteError) {
        console.warn('Error deleting existing steps:', deleteError);
      }

      console.log('Inserting updated steps:', Pasos_Analizados.length, 'steps');
      // Insert updated steps
      const stepsToInsert = Pasos_Analizados.map((paso, index) => ({
        scenario_id: reportId,
        numero_paso: paso.numero_paso || (index + 1),
        descripcion_accion_observada: paso.descripcion || paso.descripcion_accion_observada || null,
        imagen_referencia: paso.imagen_referencia || null
      }));

      const { data: steps, error: stepsError } = await supabase
        .from('test_scenario_steps')
        .insert(stepsToInsert)
        .select();

      if (stepsError) {
        console.error('Error inserting updated steps:', stepsError);
        throw stepsError;
      }

      console.log('Steps updated successfully:', steps.length, 'steps inserted');
    }

    // Update report images if any
    if (imageFiles && imageFiles.length > 0) {
      console.log('Updating images for report:', reportId, imageFiles.length, 'images');

      // Delete existing images first
      const { error: deleteImagesError } = await supabase
        .from('report_images')
        .delete()
        .eq('report_id', reportId);

      if (deleteImagesError) {
        console.warn('Error deleting existing images:', deleteImagesError);
      }

      // Insert updated images
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

      const { data: images, error: imagesError } = await supabase
        .from('report_images')
        .insert(imagesToInsert)
        .select();

      if (imagesError) {
        console.error('Error inserting updated images:', imagesError);
        throw imagesError;
      }

      console.log('Images updated successfully:', images.length, 'images inserted');
    }

    // Return complete report with the original structure for compatibility
    console.log('Report update completed successfully');
    return {
      ...reportData,
      id: reportId,
      updated_at: report.updated_at
    };

  } catch (error) {
    console.error('Error updating report:', error);
    throw new Error(`Failed to update report: ${error.message}`);
  }
};

/**
 * Save refinement (simplified - just logs for now)
 */
export const saveRefinement = async (originalReportId, refinedReportId, refinementType, changesSummary, userContext) => {
  try {
    console.log('Refinement saved:', { originalReportId, refinedReportId, refinementType, changesSummary, userContext });
    // For now, just return a mock refinement object
    return {
      id: Date.now(),
      original_report_id: originalReportId,
      refined_report_id: refinedReportId,
      refinement_type: refinementType,
      changes_summary: changesSummary,
      user_context: userContext,
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error saving refinement:', error);
    throw error;
  }
};

/**
 * Load bugs for a specific report
 */
export const loadBugsForReport = async (reportId) => {
  try {
    // For now, return mock data filtered by report ID
    console.log('Loading bugs for report:', reportId);
    return [
      {
        id: 1,
        report_id: reportId,
        step_number: 1,
        title: `Bug del reporte ${reportId}`,
        description: 'Este es un bug específico del reporte',
        status: 'open',
        priority: 'high',
        created_at: new Date().toISOString()
      }
    ];
  } catch (error) {
    console.error('Error loading bugs for report:', error);
    throw error;
  }
};

/**
 * Update bug status
 */
export const updateBugStatus = async (bugId, newStatus) => {
  try {
    console.log('Updating bug status:', { bugId, newStatus });
    // For now, just return success
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

/**
 * Clean up temporary reports for the current session
 */
export const cleanupTemporaryReports = async () => {
  try {
    const sessionId = getSessionId();

    const { error } = await supabase
      .from('test_scenarios')
      .delete()
      .eq('session_id', sessionId)
      .eq('is_temp', true);

    if (error) {
      console.error('Error cleaning up temporary reports:', error);
    } else {
      console.log('Temporary reports cleaned up for session:', sessionId);
    }
  } catch (error) {
    console.error('Error cleaning up temporary reports:', error);
  }
};

/**
 * Make a temporary report permanent
 */
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

    // Also update associated images
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

/**
 * Load permanent reports only (exclude temporary ones from other sessions)
 */
export const loadPermanentReports = async (filters = {}) => {
  try {
    const sessionId = getSessionId();

    // Start building the query
    let query = supabase
      .from('test_scenarios')
      .select(`
        *,
        test_scenario_steps (*),
        user_stories (numero, title)
      `)
      .or(`is_temp.eq.false,and(is_temp.eq.true,session_id.eq.${sessionId})`)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.userStoryId) {
      query = query.eq('user_story_id', filters.userStoryId);
    }

    const { data: reports, error } = await query;

    if (error) throw error;
    if (!reports) return [];

    // Load all images in a single query and group them by report to avoid N+1 calls
    const reportIds = reports.map((report) => report.id);
    const images = await loadImagesForReports(reportIds);
    const imagesByReport = images.reduce((acc, image) => {
      if (!acc[image.report_id]) acc[image.report_id] = [];
      acc[image.report_id].push(image);
      return acc;
    }, {});

    // Reconstruct the original format for compatibility
    const reportsWithImages = reports.map((report) => {
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
        // Nuevos campos de casos de prueba
        id_caso: report.id_caso,
        escenario_prueba: report.escenario_prueba,
        precondiciones: report.precondiciones,
        resultado_esperado: report.resultado_esperado,
        resultado_obtenido: report.resultado_obtenido,
        historia_usuario: report.historia_usuario,
        user_story_id: report.user_story_id,
        user_story_data: report.user_stories, // Datos de la HU unida
        set_escenarios: report.set_escenarios,
        fecha_ejecucion: report.fecha_ejecucion,
        estado_general: report.estado_general,
        // Campos legacy para compatibilidad
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

    return reportsWithImages;

  } catch (error) {
    console.error('Error loading permanent reports:', error);
    throw error;
  }
};

/**
 * Initialize database cleanup on page load
 */
export const initializeDatabaseCleanup = () => {
  const sessionId = getSessionId();
  let isPageActive = true;
  let cleanupTimeoutId = null;

  // Mark session as active
  sessionStorage.setItem('qa_session_active', 'true');
  sessionStorage.setItem('qa_last_activity', Date.now().toString());

  // Update activity timestamp periodically
  const activityInterval = setInterval(() => {
    if (isPageActive) {
      sessionStorage.setItem('qa_last_activity', Date.now().toString());
    }
  }, 30000); // Update every 30 seconds

  const cleanup = async () => {
    try {
      isPageActive = false;
      sessionStorage.setItem('qa_session_active', 'false');
      await cleanupTemporaryReports();
      console.log('Temporary reports cleaned up for session:', sessionId);
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  };

  // Immediate cleanup on page unload
  const handleUnload = () => {
    // Set flag to indicate session is ending
    sessionStorage.setItem('qa_session_active', 'false');

    // Try synchronous cleanup (limited time)
    if (navigator.sendBeacon) {
      // For future: could send beacon to server endpoint for cleanup
      console.log('Page unloading, marking session for cleanup');
    }

    // Immediate cleanup attempt
    cleanup();
  };

  // Delayed cleanup on visibility change (user might be switching tabs)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      isPageActive = false;
      // Set a timeout to cleanup if page remains hidden
      cleanupTimeoutId = setTimeout(async () => {
        const lastActivity = parseInt(sessionStorage.getItem('qa_last_activity') || '0');
        const timeSinceActivity = Date.now() - lastActivity;

        // If page has been hidden for more than 5 minutes, cleanup temporary reports
        if (timeSinceActivity > 5 * 60 * 1000) {
          console.log('Page hidden for extended period, cleaning up temporary reports');
          await cleanup();
        }
      }, 5 * 60 * 1000); // 5 minutes
    } else if (document.visibilityState === 'visible') {
      isPageActive = true;
      sessionStorage.setItem('qa_session_active', 'true');
      sessionStorage.setItem('qa_last_activity', Date.now().toString());

      // Cancel cleanup timeout if page becomes visible again
      if (cleanupTimeoutId) {
        clearTimeout(cleanupTimeoutId);
        cleanupTimeoutId = null;
      }
    }
  };

  // Listen for page unload events
  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('unload', handleUnload);
  window.addEventListener('pagehide', handleUnload);

  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Cleanup function
  return () => {
    clearInterval(activityInterval);
    if (cleanupTimeoutId) {
      clearTimeout(cleanupTimeoutId);
    }
    window.removeEventListener('beforeunload', handleUnload);
    window.removeEventListener('unload', handleUnload);
    window.removeEventListener('pagehide', handleUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    // Final cleanup
    cleanup();
  };
};
import { supabase } from './supabaseClient.js';
import { storeImagesForReport, loadImagesForReport } from './imageService.js';

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
 * Simple database service for reports
 */

/**
 * Save a report to the database
 */
export const saveReport = async (reportData, isTemporary = false) => {
  try {
    const { imageFiles, Pasos_Analizados, ...otherData } = reportData;
    
    // Save basic report data according to the actual schema
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert([{
        nombre_del_escenario: otherData.Nombre_del_Escenario || 'Reporte',
        resultado_esperado_general_flujo: otherData.Resultado_Esperado_General_Flujo || null,
        conclusion_general_flujo: otherData.Conclusion_General_Flujo || null,
        user_provided_additional_context: otherData.user_provided_additional_context || null,
        initial_context: otherData.initial_context || null,
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
        report_id: report.id,
        numero_paso: paso.numero_paso || (index + 1), // Ensure numero_paso is never null
        descripcion_accion_observada: paso.descripcion_accion_observada || null,
        imagen_referencia_entrada: paso.imagen_referencia_entrada || null,
        imagen_referencia_salida: paso.imagen_referencia_salida || null,
        elemento_clave_y_ubicacion_aproximada: paso.elemento_clave_y_ubicacion_aproximada || null,
        dato_de_entrada_paso: paso.dato_de_entrada_paso || null,
        resultado_esperado_paso: paso.resultado_esperado_paso || null,
        resultado_obtenido_paso_y_estado: paso.resultado_obtenido_paso_y_estado || null
      }));

      const { data: steps, error: stepsError } = await supabase
        .from('report_steps')
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
export const loadReports = async () => {
  return await loadPermanentReports();
};

/**
 * Add a new step to an existing report
 */
export const addStepToReport = async (reportId, stepData, newImages = []) => {
  try {
    // First, get the current steps to determine the next step number
    const { data: existingSteps } = await supabase
      .from('report_steps')
      .select('numero_paso')
      .eq('report_id', reportId)
      .order('numero_paso', { ascending: false })
      .limit(1);

    const nextStepNumber = existingSteps && existingSteps.length > 0 
      ? existingSteps[0].numero_paso + 1 
      : 1;

    // Insert the new step
    const { data: newStep, error: stepError } = await supabase
      .from('report_steps')
      .insert([{
        report_id: reportId,
        numero_paso: nextStepNumber,
        descripcion_accion_observada: stepData.descripcion_accion_observada || null,
        imagen_referencia_entrada: stepData.imagen_referencia_entrada || null,
        imagen_referencia_salida: stepData.imagen_referencia_salida || null,
        elemento_clave_y_ubicacion_aproximada: stepData.elemento_clave_y_ubicacion_aproximada || null,
        dato_de_entrada_paso: stepData.dato_de_entrada_paso || null,
        resultado_esperado_paso: stepData.resultado_esperado_paso || null,
        resultado_obtenido_paso_y_estado: stepData.resultado_obtenido_paso_y_estado || 'Pendiente de análisis'
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
      .from('reports')
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
      .from('report_steps')
      .delete()
      .eq('report_id', reportId)
      .eq('numero_paso', stepNumber);

    if (deleteError) throw deleteError;

    // Get all remaining steps that have higher step numbers
    const { data: stepsToReorder, error: selectError } = await supabase
      .from('report_steps')
      .select('id, numero_paso')
      .eq('report_id', reportId)
      .gt('numero_paso', stepNumber)
      .order('numero_paso', { ascending: true });

    if (selectError) throw selectError;

    // Reorder the remaining steps
    if (stepsToReorder && stepsToReorder.length > 0) {
      const updatePromises = stepsToReorder.map((step, index) => 
        supabase
          .from('report_steps')
          .update({ numero_paso: stepNumber + index })
          .eq('id', step.id)
      );

      await Promise.all(updatePromises);
    }

    // Update the report's updated_at timestamp
    await supabase
      .from('reports')
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
      .from('report_steps')
      .update({
        descripcion_accion_observada: stepData.descripcion_accion_observada || null,
        imagen_referencia_entrada: stepData.imagen_referencia_entrada || null,
        imagen_referencia_salida: stepData.imagen_referencia_salida || null,
        elemento_clave_y_ubicacion_aproximada: stepData.elemento_clave_y_ubicacion_aproximada || null,
        dato_de_entrada_paso: stepData.dato_de_entrada_paso || null,
        resultado_esperado_paso: stepData.resultado_esperado_paso || null,
        resultado_obtenido_paso_y_estado: stepData.resultado_obtenido_paso_y_estado || null
      })
      .eq('id', stepId)
      .eq('report_id', reportId)
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
      .from('reports')
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
      .from('reports')
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
      .from('reports')
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
    
    // Update basic report data according to the actual schema
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .update({
        nombre_del_escenario: otherData.Nombre_del_Escenario || 'Reporte',
        resultado_esperado_general_flujo: otherData.Resultado_Esperado_General_Flujo || null,
        conclusion_general_flujo: otherData.Conclusion_General_Flujo || null,
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
        .from('report_steps')
        .delete()
        .eq('report_id', reportId);

      if (deleteError) {
        console.warn('Error deleting existing steps:', deleteError);
      }

      console.log('Inserting updated steps:', Pasos_Analizados.length, 'steps');
      // Insert updated steps
      const stepsToInsert = Pasos_Analizados.map((paso, index) => ({
        report_id: reportId,
        numero_paso: paso.numero_paso || (index + 1),
        descripcion_accion_observada: paso.descripcion_accion_observada || null,
        imagen_referencia_entrada: paso.imagen_referencia_entrada || null,
        imagen_referencia_salida: paso.imagen_referencia_salida || null,
        elemento_clave_y_ubicacion_aproximada: paso.elemento_clave_y_ubicacion_aproximada || null,
        dato_de_entrada_paso: paso.dato_de_entrada_paso || null,
        resultado_esperado_paso: paso.resultado_esperado_paso || null,
        resultado_obtenido_paso_y_estado: paso.resultado_obtenido_paso_y_estado || null
      }));

      const { data: steps, error: stepsError } = await supabase
        .from('report_steps')
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

// Create alias for backward compatibility
export const updateReportInDB = updateReport;



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
      .from('reports')
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
      .from('reports')
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
export const loadPermanentReports = async () => {
  try {
    const sessionId = getSessionId();
    
    // Get all permanent reports + current session temporary reports
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        *,
        report_steps (*)
      `)
      .or(`is_temp.eq.false,and(is_temp.eq.true,session_id.eq.${sessionId})`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!reports) return [];

    // Load images for each report and reconstruct the expected format
    const reportsWithImages = await Promise.all(
      reports.map(async (report) => {
        try {
          const imageFiles = await loadImagesForReport(report.id);
          
          // Reconstruct the original format for compatibility
          return {
            Nombre_del_Escenario: report.nombre_del_escenario,
            Resultado_Esperado_General_Flujo: report.resultado_esperado_general_flujo,
            Conclusion_General_Flujo: report.conclusion_general_flujo,
            user_provided_additional_context: report.user_provided_additional_context,
            initial_context: report.initial_context,
            Pasos_Analizados: (report.report_steps || []).sort((a, b) => a.numero_paso - b.numero_paso),
            id: report.id,
            created_at: report.created_at,
            updated_at: report.updated_at,
            is_temp: report.is_temp,
            session_id: report.session_id,
            imageFiles
          };
        } catch (error) {
          console.warn(`Error loading images for report ${report.id}:`, error);
          return {
            Nombre_del_Escenario: report.nombre_del_escenario,
            Resultado_Esperado_General_Flujo: report.resultado_esperado_general_flujo,
            Conclusion_General_Flujo: report.conclusion_general_flujo,
            user_provided_additional_context: report.user_provided_additional_context,
            initial_context: report.initial_context,
            Pasos_Analizados: (report.report_steps || []).sort((a, b) => a.numero_paso - b.numero_paso),
            id: report.id,
            created_at: report.created_at,
            updated_at: report.updated_at,
            is_temp: report.is_temp,
            session_id: report.session_id,
            imageFiles: []
          };
        }
      })
    );

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
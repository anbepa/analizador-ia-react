import React, { createContext, useState, useEffect, useMemo, useContext, useRef } from 'react';
import { callAiApi } from '../lib/apiService';
import { PROMPT_FLOW_ANALYSIS_FROM_IMAGES, PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT } from '../lib/prompts';
import { validateAndCleanImages, compressImageIfNeeded } from '../lib/imageService';

import { 
  loadReports as loadReportsFromDB, 
  saveReport as saveReportToDB, 
  updateReport as updateReportInDB,
  deleteReport as deleteReportFromDB,
  saveRefinement,
  testDatabaseConnection,
  initializeDatabaseCleanup,
  makeReportPermanent,
  addStepToReport,
  deleteStepFromReport as deleteStepFromDB
} from '../lib/databaseService';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext();

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const [apiConfig, setApiConfig] = useState({
        provider: 'gemini',
        gemini: { key: '', model: 'gemini-1.5-flash-latest' },
        openai: { key: '', model: 'gpt-4o' },
        claude: { key: '', model: 'claude-3-sonnet-20240229' }
    });
    const [currentImageFiles, setCurrentImageFiles] = useState([]);
    const [initialContext, setInitialContext] = useState('');
    const [reports, setReports] = useState([]);
    const [activeReportIndex, setActiveReportIndex] = useState(0);
    const [loading, setLoading] = useState({ state: false, message: '' });
    const [error, setError] = useState(null);
    const [isRefining, setIsRefining] = useState(false);
    const [showConfigurationPanel, setShowConfigurationPanel] = useState(true);
    const [userContext, setUserContext] = useState('');
    const [modal, setModal] = useState({ show: false, title: '', content: '' });
    const reportRef = useRef(null);
    
    // Estados para navegación unificada
    const [navigationState, setNavigationState] = useState({
        activeMainMenu: 'panel-control',
        activeSubMenu: 'configuracion',
        viewMode: 'fullConfig' // 'sidebar', 'fullConfig'
    });

    const activeReport = useMemo(() => reports[activeReportIndex] || null, [reports, activeReportIndex]);
    const activeReportImages = useMemo(() => activeReport?.imageFiles || [], [activeReport]);

    // Function to clean AI response fields from redundant text
    const cleanReportData = (reportData) => {
        if (!reportData) return reportData;
        
        const cleaned = { ...reportData };
        
        // Clean Resultado_Esperado_General_Flujo field
        if (cleaned.Resultado_Esperado_General_Flujo) {
            let cleanedField = cleaned.Resultado_Esperado_General_Flujo;
            // Remove various patterns of redundant text
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
        
        return cleaned;
    };

    useEffect(() => {
        const cachedConfig = localStorage.getItem('qaAppApiConfig');
        if (cachedConfig) {
            setApiConfig(JSON.parse(cachedConfig));
        }
        
        // Initialize database cleanup for temporary reports
        const cleanupFunction = initializeDatabaseCleanup();
        
        // Test database connection and load reports
        const initializeDatabase = async () => {
            try {
                const isConnected = await testDatabaseConnection();
                if (!isConnected) {
                    console.warn("Database connection failed, using local storage as fallback");
                    setError("Advertencia: No se pudo conectar a la base de datos. Los datos se guardarán localmente.");
                    return;
                }

                const dbReports = await loadReportsFromDB();
                if (dbReports && dbReports.length > 0) {
                    setReports(dbReports);
                }
            } catch (err) {
                console.error("Error al cargar reportes desde la base de datos:", err);
                setError("No se pudieron cargar los reportes guardados desde la base de datos.");
            }
        };

        initializeDatabase();

        // Cleanup function when component unmounts
        return () => {
            if (cleanupFunction) {
                cleanupFunction();
            }
        };
    }, []);

    // Auto-save is now handled within specific operations (handleAnalysis, etc.)
    // No need for a global useEffect that saves all reports
    
    const canGenerate = useMemo(() => {
        const providerKey = apiConfig[apiConfig.provider]?.key;
        return providerKey && providerKey.length > 0 && currentImageFiles.length > 0 && !loading.state;
    }, [apiConfig, currentImageFiles, loading.state]);

    const canRefine = useMemo(() => {
        const providerKey = apiConfig[apiConfig.provider]?.key;
        return providerKey && providerKey.length > 0 && activeReport && activeReport.imageFiles && activeReport.imageFiles.length > 0 && !loading.state;
    }, [apiConfig, activeReport, loading.state]);

    const canDownload = useMemo(() => activeReport && !loading.state, [activeReport, loading.state]);

    const scrollToReport = () => {
        setTimeout(() => {
            reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Funciones para navegación unificada
    const setNavigationMode = (mode, mainMenu = null, subMenu = null) => {
        setNavigationState(prev => ({
            ...prev,
            viewMode: mode,
            ...(mainMenu && { activeMainMenu: mainMenu }),
            ...(subMenu && { activeSubMenu: subMenu })
        }));
        
        // Sincronizar con estados existentes
        switch (mode) {
            case 'sidebar':
                setShowConfigurationPanel(false);
                break;
            case 'fullConfig':
                setShowConfigurationPanel(true);
                break;
            case 'default':
                setShowConfigurationPanel(false);
                break;
        }
    };

    const updateNavigation = (mainMenu, subMenu = null) => {
        setNavigationState(prev => ({
            ...prev,
            activeMainMenu: mainMenu,
            ...(subMenu && { activeSubMenu: subMenu })
        }));
    };

    const handleAnalysis = async (refinement = false, payload = null) => {
        setLoading({ state: true, message: refinement ? 'Refinando análisis...' : 'Realizando análisis inicial...' });
        setError(null);
        
        try {
            // Validate and clean images before sending to API
            let imagesToSend = validateAndCleanImages(currentImageFiles);
            
            if (imagesToSend.length === 0) {
                throw new Error("No hay imágenes válidas para el análisis. Por favor, carga imágenes válidas primero.");
            }

            setLoading({ state: true, message: `Preparando ${imagesToSend.length} imágenes para análisis...` });

            // Compress large images to avoid API issues
            const compressedImages = [];
            for (let i = 0; i < imagesToSend.length; i++) {
                setLoading({ state: true, message: `Optimizando imagen ${i + 1} de ${imagesToSend.length}...` });
                try {
                    const compressed = await compressImageIfNeeded(imagesToSend[i]);
                    compressedImages.push(compressed);
                } catch (compressError) {
                    console.warn(`Failed to compress image ${i + 1}, using original:`, compressError);
                    compressedImages.push(imagesToSend[i]);
                }
            }

            setLoading({ state: true, message: refinement ? 'Enviando a IA para refinamiento...' : 'Enviando a IA para análisis inicial...' });

            const prompt = refinement
                ? PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT(payload)
                : PROMPT_FLOW_ANALYSIS_FROM_IMAGES(initialContext);

            const jsonText = await callAiApi(prompt, compressedImages, apiConfig);
            const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/s) || jsonText.match(/([\s\S]*)/);
            if (!jsonMatch) throw new Error("La respuesta de la API no contiene un bloque JSON válido.");

            const cleanedJsonText = jsonMatch[1] || jsonMatch[0];
            let parsedResponse;
            
            try {
                parsedResponse = JSON.parse(cleanedJsonText);
            } catch (parseError) {
                throw new Error("La respuesta de la API no contiene JSON válido: " + parseError.message);
            }
            
            // Handle both array and single object responses
            let newReportData = Array.isArray(parsedResponse) ? parsedResponse[0] : parsedResponse;
            
            if (!newReportData) {
                throw new Error("La respuesta de la API está vacía o no contiene datos válidos.");
            }
            
            // Clean the report data to remove redundant text
            newReportData = cleanReportData(newReportData);
            
            // Fix missing numero_paso values to ensure database compatibility
            if (newReportData.Pasos_Analizados && Array.isArray(newReportData.Pasos_Analizados)) {
                newReportData.Pasos_Analizados = newReportData.Pasos_Analizados.map((paso, index) => ({
                    ...paso,
                    numero_paso: paso.numero_paso || (index + 1) // Ensure numero_paso is never null/undefined
                }));
            } else {
                // If Pasos_Analizados is missing or invalid, create a basic structure
                newReportData.Pasos_Analizados = [{
                    numero_paso: 1,
                    descripcion_accion_observada: "Análisis inicial de imágenes",
                    imagen_referencia_entrada: "Imagen 1",
                    imagen_referencia_salida: compressedImages.length > 1 ? "Imagen 2" : "Imagen 1",
                    elemento_clave_y_ubicacion_aproximada: "Elementos de la interfaz",
                    dato_de_entrada_paso: "N/A",
                    resultado_esperado_paso: "Visualización correcta",
                    resultado_obtenido_paso_y_estado: "Pendiente de análisis"
                }];
            }
            
            // Clean scenario name to avoid duplication of "Escenario:" prefix
            let cleanedScenarioName = newReportData.Nombre_del_Escenario || '';
            if (cleanedScenarioName.startsWith('Escenario: ')) {
                cleanedScenarioName = cleanedScenarioName.substring(11); // Remove "Escenario: " prefix
            }
            
            const newReport = {
                ...newReportData,
                Nombre_del_Escenario: cleanedScenarioName,
                imageFiles: [...compressedImages],
                initial_context: initialContext
            };



            // Save to database as temporary initially
            try {
                const savedReport = await saveReportToDB(newReport, true); // Save as temporary

                
                setReports(prev => {
                    const newReports = [...prev, savedReport];
                    setActiveReportIndex(newReports.length - 1);
                    return newReports;
                });

                // Auto-make permanent after successful generation
                if (savedReport.id) {
                    try {
                        const permanentReport = await makeReportPermanent(savedReport.id);
                        
                        // Reload the complete report with images from database
                        const reloadedReports = await loadReportsFromDB();
                        const currentReport = reloadedReports.find(r => r.id === savedReport.id);
                        
                        if (currentReport) {
                            setReports(prev => {
                                const newReports = [...prev];
                                newReports[newReports.length - 1] = currentReport;
                                return newReports;
                            });

                        } else {
                            // Fallback to combining saved data with permanent status
                            setReports(prev => {
                                const newReports = [...prev];
                                newReports[newReports.length - 1] = { ...savedReport, ...permanentReport, is_temp: false };
                                return newReports;
                            });
                        }
                    } catch (permanentError) {
                        console.warn("Report saved but couldn't make permanent:", permanentError);
                        // Report is still saved, just remains temporary
                    }
                }
            } catch (dbError) {
                console.warn("Failed to save to database, keeping local copy:", dbError);
                // Fallback to local state only
                setReports(prev => {
                    const newReports = [...prev, newReport];
                    setActiveReportIndex(newReports.length - 1);
                    return newReports;
                });
                setError("Reporte generado exitosamente, pero no se pudo guardar en la base de datos.");
            }

            scrollToReport();

        } catch (e) {
            setError(`Error durante el análisis: ${e.message}`);
            console.error(e);
        } finally {
            setLoading({ state: false, message: '' });
            if (refinement) setIsRefining(false);
        }
    };
    


    const handleStepDelete = async (stepNumber) => {
        if (!activeReport) return;

        setLoading({ state: true, message: 'Eliminando paso...' });
        setError(null);

        try {
            // Update in database if we have an ID
            if (activeReport.id) {
                await deleteStepFromDB(activeReport.id, stepNumber);
                
                // Reload the complete report from database to get updated data
                const { data: updatedReportData } = await supabase
                    .from('reports')
                    .select(`
                        *,
                        report_steps(*),
                        report_images(*)
                    `)
                    .eq('id', activeReport.id)
                    .single();

                if (updatedReportData) {
                    // Reconstruct the report object in the expected format
                    const updatedReport = {
                        id: updatedReportData.id,
                        Nombre_del_Escenario: updatedReportData.nombre_del_escenario,
                        Resultado_Esperado_General_Flujo: updatedReportData.resultado_esperado_general_flujo,
                        Conclusion_General_Flujo: updatedReportData.conclusion_general_flujo,
                        user_provided_additional_context: updatedReportData.user_provided_additional_context,
                        initial_context: updatedReportData.initial_context,
                        created_at: updatedReportData.created_at,
                        updated_at: updatedReportData.updated_at,
                        imageFiles: activeReport.imageFiles, // Keep existing image files
                        Pasos_Analizados: updatedReportData.report_steps
                            .sort((a, b) => a.numero_paso - b.numero_paso)
                            .map(step => ({
                                numero_paso: step.numero_paso,
                                descripcion_accion_observada: step.descripcion_accion_observada,
                                imagen_referencia_entrada: step.imagen_referencia_entrada,
                                imagen_referencia_salida: step.imagen_referencia_salida,
                                elemento_clave_y_ubicacion_aproximada: step.elemento_clave_y_ubicacion_aproximada,
                                dato_de_entrada_paso: step.dato_de_entrada_paso,
                                resultado_esperado_paso: step.resultado_esperado_paso,
                                resultado_obtenido_paso_y_estado: step.resultado_obtenido_paso_y_estado
                            }))
                    };

                    setReports(prev => {
                        const newReports = [...prev];
                        newReports[activeReportIndex] = updatedReport;
                        return newReports;
                    });
                }
            } else {
                // Fallback to local update for reports without database ID
                const updatedReport = { ...activeReport };
                updatedReport.Pasos_Analizados = updatedReport.Pasos_Analizados
                    .filter(p => p.numero_paso !== stepNumber)
                    .map((p, index) => ({ ...p, numero_paso: index + 1 }));

                setReports(prev => {
                    const newReports = [...prev];
                    newReports[activeReportIndex] = updatedReport;
                    return newReports;
                });
            }
        } catch (dbError) {
            console.error("Failed to delete step from database:", dbError);
            setError("No se pudo eliminar el paso de la base de datos.");
        } finally {
            setLoading({ state: false, message: '' });
        }
    };

    const handleAddStepWithImage = async (stepData) => {
        if (!activeReport) return;

        setLoading({ state: true, message: 'Agregando nuevo paso...' });
        setError(null);

        try {
            // Update in database if we have an ID
            if (activeReport.id) {
                // Add step to database
                await addStepToReport(activeReport.id, stepData, currentImageFiles);
                
                // Reload the complete report from database to get updated data
                const { data: updatedReportData } = await supabase
                    .from('reports')
                    .select(`
                        *,
                        report_steps(*),
                        report_images(*)
                    `)
                    .eq('id', activeReport.id)
                    .single();

                if (updatedReportData) {
                    // Reconstruct the report object in the expected format
                    const updatedReport = {
                        id: updatedReportData.id,
                        Nombre_del_Escenario: updatedReportData.nombre_del_escenario,
                        Resultado_Esperado_General_Flujo: updatedReportData.resultado_esperado_general_flujo,
                        Conclusion_General_Flujo: updatedReportData.conclusion_general_flujo,
                        user_provided_additional_context: updatedReportData.user_provided_additional_context,
                        initial_context: updatedReportData.initial_context,
                        created_at: updatedReportData.created_at,
                        updated_at: updatedReportData.updated_at,
                        imageFiles: [...activeReport.imageFiles, ...currentImageFiles], // Merge existing and new images
                        Pasos_Analizados: updatedReportData.report_steps
                            .sort((a, b) => a.numero_paso - b.numero_paso)
                            .map(step => ({
                                numero_paso: step.numero_paso,
                                descripcion_accion_observada: step.descripcion_accion_observada,
                                imagen_referencia_entrada: step.imagen_referencia_entrada,
                                imagen_referencia_salida: step.imagen_referencia_salida,
                                elemento_clave_y_ubicacion_aproximada: step.elemento_clave_y_ubicacion_aproximada,
                                dato_de_entrada_paso: step.dato_de_entrada_paso,
                                resultado_esperado_paso: step.resultado_esperado_paso,
                                resultado_obtenido_paso_y_estado: step.resultado_obtenido_paso_y_estado
                            }))
                    };

                    setReports(prev => {
                        const newReports = [...prev];
                        newReports[activeReportIndex] = updatedReport;
                        return newReports;
                    });

                    // Clear current image files after successful addition
                    setCurrentImageFiles([]);
                }
            } else {
                // Fallback to local addition for reports without database ID
                const updatedReport = { ...activeReport };
                const newStepNumber = updatedReport.Pasos_Analizados.length + 1;
                const newStep = {
                    numero_paso: newStepNumber,
                    ...stepData,
                    resultado_obtenido_paso_y_estado: stepData.resultado_obtenido_paso_y_estado || 'Pendiente de análisis'
                };
                updatedReport.Pasos_Analizados = [...updatedReport.Pasos_Analizados, newStep];
                updatedReport.imageFiles = [...activeReport.imageFiles, ...currentImageFiles];

                setReports(prev => {
                    const newReports = [...prev];
                    newReports[activeReportIndex] = updatedReport;
                    return newReports;
                });

                setCurrentImageFiles([]);
            }
        } catch (dbError) {
            console.error("Failed to add step to database:", dbError);
            setError("No se pudo agregar el paso a la base de datos.");
        } finally {
            setLoading({ state: false, message: '' });
        }
    };

    const handleAddStep = async () => {
        if (!activeReport) return;

        const newStepNumber = activeReport.Pasos_Analizados.length + 1;
        const newStepData = {
            descripcion_accion_observada: 'Nueva acción...',
            dato_de_entrada_paso: '',
            resultado_esperado_paso: '',
            resultado_obtenido_paso_y_estado: 'Pendiente de análisis',
            imagen_referencia_entrada: 'N/A',
            imagen_referencia_salida: 'N/A'
        };

        // Add to database if we have an ID
        if (activeReport.id) {
            try {
                const dbStep = await addStepToReport(activeReport.id, newStepData);
                
                // Update local state with the database step
                const updatedReport = { ...activeReport };
                const localStep = {
                    numero_paso: dbStep.numero_paso,
                    descripcion_accion_observada: dbStep.descripcion_accion_observada,
                    dato_de_entrada_paso: dbStep.dato_de_entrada_paso || '',
                    resultado_esperado_paso: dbStep.resultado_esperado_paso || '',
                    resultado_obtenido_paso_y_estado: dbStep.resultado_obtenido_paso_y_estado,
                    imagen_referencia_entrada: dbStep.imagen_referencia_entrada || 'N/A',
                    imagen_referencia_salida: dbStep.imagen_referencia_salida || 'N/A'
                };
                updatedReport.Pasos_Analizados = [...updatedReport.Pasos_Analizados, localStep];

                setReports(prev => {
                    const newReports = [...prev];
                    newReports[activeReportIndex] = updatedReport;
                    return newReports;
                });
            } catch (dbError) {
                console.error("Failed to add step to database:", dbError);
                setError("No se pudo agregar el paso a la base de datos: " + dbError.message);
            }
        } else {
            // For reports without ID, just update locally
            const updatedReport = { ...activeReport };
            const localStep = {
                numero_paso: newStepNumber,
                ...newStepData
            };
            updatedReport.Pasos_Analizados = [...updatedReport.Pasos_Analizados, localStep];

            setReports(prev => {
                const newReports = [...prev];
                newReports[activeReportIndex] = updatedReport;
                return newReports;
            });
        }
    };

    const handleSaveAndRefine = async () => {
        scrollToReport(); // Scroll to top of the report section
        const reportContentEl = document.getElementById('report-content');
        if (!reportContentEl || !activeReport) return;

        const editedReport = JSON.parse(JSON.stringify(activeReport));
        const h1 = reportContentEl.querySelector('h1');
        if (h1) editedReport.Nombre_del_Escenario = h1.textContent;

        const tableRows = reportContentEl.querySelectorAll('tbody > tr:not(.evidence-row)');
        const updatedSteps = [];
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const stepNumber = parseInt(cells[0].textContent, 10);
            const stepData = editedReport.Pasos_Analizados.find(p => p.numero_paso === stepNumber);
            if (stepData) {
                stepData.descripcion_accion_observada = cells[1].textContent.trim();
                stepData.dato_de_entrada_paso = cells[2].textContent.trim();
                stepData.resultado_esperado_paso = cells[3].textContent.trim();
                stepData.resultado_obtenido_paso_y_estado = cells[4].textContent.trim();
                updatedSteps.push(stepData);
            }
        });

        editedReport.Pasos_Analizados = updatedSteps;
        editedReport.user_provided_additional_context = userContext.trim();
        const { imageFiles: _imageFiles, ...reportForPrompt } = editedReport;
        const editedJsonString = JSON.stringify([reportForPrompt], null, 2);
        
        setLoading({ state: true, message: 'Refinando análisis...' });
        setError(null);
        
        try {
            // Validate and clean images before sending to API
            let imagesToSend = validateAndCleanImages(activeReport.imageFiles);
            
            if (imagesToSend.length === 0) {
                throw new Error("No hay imágenes válidas para el análisis. Por favor, verifica que las imágenes estén cargadas correctamente.");
            }

            setLoading({ state: true, message: `Preparando ${imagesToSend.length} imágenes para análisis...` });

            // Compress large images to avoid API issues
            const compressedImages = [];
            for (let i = 0; i < imagesToSend.length; i++) {
                setLoading({ state: true, message: `Optimizando imagen ${i + 1} de ${imagesToSend.length}...` });
                try {
                    const compressed = await compressImageIfNeeded(imagesToSend[i]);
                    compressedImages.push(compressed);
                } catch (compressError) {
                    console.warn(`Failed to compress image ${i + 1}, using original:`, compressError);
                    compressedImages.push(imagesToSend[i]);
                }
            }

            setLoading({ state: true, message: 'Enviando a IA para refinamiento...' });
            
            const prompt = PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT(editedJsonString);
            const jsonText = await callAiApi(prompt, compressedImages, apiConfig);
            const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/s) || jsonText.match(/([\s\S]*)/);
            if (!jsonMatch) throw new Error("La respuesta de la API no contiene un bloque JSON válido.");
            
            const cleanedJsonText = jsonMatch[1] || jsonMatch[0];
            let parsedRefinedResponse;
            
            try {
                parsedRefinedResponse = JSON.parse(cleanedJsonText);
            } catch (parseError) {
                throw new Error("La respuesta de refinamiento no contiene JSON válido: " + parseError.message);
            }
            
            // Handle both array and single object responses
            let refinedReportData = Array.isArray(parsedRefinedResponse) ? parsedRefinedResponse[0] : parsedRefinedResponse;
            
            if (!refinedReportData) {
                throw new Error("La respuesta de refinamiento está vacía o no contiene datos válidos.");
            }
            
            // Clean the report data to remove redundant text
            refinedReportData = cleanReportData(refinedReportData);
            
            // Fix missing numero_paso values to ensure database compatibility
            if (refinedReportData.Pasos_Analizados && Array.isArray(refinedReportData.Pasos_Analizados)) {
                refinedReportData.Pasos_Analizados = refinedReportData.Pasos_Analizados.map((paso, index) => ({
                    ...paso,
                    numero_paso: paso.numero_paso || (index + 1) // Ensure numero_paso is never null/undefined
                }));
            } else {
                // Fallback: keep original steps if refinement didn't work properly
                console.warn("Refinement didn't return valid Pasos_Analizados, keeping original");
                refinedReportData.Pasos_Analizados = activeReport.Pasos_Analizados;
            }
            
            // Clean scenario name to avoid duplication of "Escenario:" prefix
            let cleanedScenarioName = refinedReportData.Nombre_del_Escenario || '';
            if (cleanedScenarioName.startsWith('Escenario: ')) {
                cleanedScenarioName = cleanedScenarioName.substring(11); // Remove "Escenario: " prefix
            }
            
            const refinedReport = {
                ...refinedReportData,
                Nombre_del_Escenario: cleanedScenarioName,
                imageFiles: activeReport.imageFiles,
                initial_context: activeReport.initial_context
            };

            // Update the existing report instead of creating a new one
            if (activeReport.id) {
                setLoading({ state: true, message: 'Guardando refinamiento en base de datos...' });
                try {
                    console.log('Saving refinement to database for report ID:', activeReport.id);
                    
                    // Add the existing report ID to the refined report
                    const refinedReportWithId = { ...refinedReport, id: activeReport.id };
                    
                    // Update the existing report in the database
                    const updatedReport = await updateReportInDB(activeReport.id, refinedReportWithId);
                    console.log('Report updated successfully in database:', updatedReport.id);
                    
                    // Reload the images from database to ensure they are properly retrieved
                    console.log('Reloading images for refined report...');
                    const reloadedReport = await loadReportsFromDB();
                    const currentReport = reloadedReport.find(r => r.id === activeReport.id);
                    
                    if (currentReport && currentReport.imageFiles) {
                        console.log('Images reloaded successfully:', currentReport.imageFiles.length, 'images');
                        updatedReport.imageFiles = currentReport.imageFiles;
                    } else {
                        console.warn('Failed to reload images, keeping original images');
                        updatedReport.imageFiles = activeReport.imageFiles;
                    }
                    
                    // Create refinement history record
                    await saveRefinement(
                        activeReport.id, 
                        activeReport.id, // Same ID since we're updating, not creating new
                        'ai_assisted',
                        'Refinamiento con contexto adicional del usuario',
                        userContext.trim()
                    );
                    console.log('Refinement history saved successfully');

                    // Update the current report with the refined version
                    setReports(prev => {
                        const newReports = [...prev];
                        newReports[activeReportIndex] = updatedReport;
                        return newReports;
                    });
                    
                    setLoading({ state: true, message: 'Refinamiento guardado exitosamente' });
                    console.log('Refinement completed and saved successfully');
                } catch (dbError) {
                    console.error("Failed to update refined report in database:", dbError);
                    // Fallback to local update
                    setReports(prev => {
                        const newReports = [...prev];
                        newReports[activeReportIndex] = refinedReport;
                        return newReports;
                    });
                    setError(`Refinamiento completado, pero no se pudo guardar en la base de datos: ${dbError.message}`);
                }
            } else {
                // No database ID, just update locally
                setReports(prev => {
                    const newReports = [...prev];
                    newReports[activeReportIndex] = refinedReport;
                    return newReports;
                });
            }

        } catch (e) {
            setError(`Error durante el refinamiento: ${e.message}`);
            console.error(e);
        } finally {
            setIsRefining(false);
            setLoading({ state: false, message: '' });
        }
    };
    
    const closeModal = () => setModal({ show: false, title: '', content: '' });

    const selectReport = (index) => {
        setActiveReportIndex(index);
    };

    const deleteReport = async (index) => {
        const reportToDelete = reports[index];
        
        // Delete from database if it has an ID
        if (reportToDelete && reportToDelete.id) {
            try {
                await deleteReportFromDB(reportToDelete.id);
            } catch (dbError) {
                console.warn("Failed to delete report from database:", dbError);
                setError("No se pudo eliminar el reporte de la base de datos.");
                return; // Don't delete locally if database delete fails
            }
        }

        setReports(prev => prev.filter((_, i) => i !== index));
        if (activeReportIndex >= index) {
            setActiveReportIndex(prev => Math.max(0, prev - 1));
        }
    };

    const updateReportName = async (index, newName) => {
        const reportToUpdate = reports[index];
        if (!reportToUpdate) return;

        const updatedReport = { ...reportToUpdate, Nombre_del_Escenario: newName };

        // Update in database if it has an ID
        if (reportToUpdate.id) {
            try {
                await updateReportInDB(reportToUpdate.id, updatedReport);
            } catch (dbError) {
                console.warn("Failed to update report name in database:", dbError);
                setError("No se pudo actualizar el nombre del reporte en la base de datos.");
            }
        }

        setReports(prev => {
            const newReports = [...prev];
            newReports[index] = updatedReport;
            return newReports;
        });
    };

    const isConfigVisible = showConfigurationPanel || reports.length === 0;

    const handleMakeReportPermanent = async (index) => {
        const reportToMakePermanent = reports[index];
        if (!reportToMakePermanent || !reportToMakePermanent.id || !reportToMakePermanent.is_temp) {
            return; // Report is already permanent or doesn't exist
        }

        try {
            const permanentReport = await makeReportPermanent(reportToMakePermanent.id);
            setReports(prev => {
                const newReports = [...prev];
                newReports[index] = { ...reportToMakePermanent, ...permanentReport, is_temp: false };
                return newReports;
            });
        } catch (error) {
            console.error("Failed to make report permanent:", error);
            setError("No se pudo hacer permanente el reporte.");
        }
    };

    const value = {
        apiConfig,
        setApiConfig,
        currentImageFiles,
        setCurrentImageFiles,
        initialContext,
        setInitialContext,
        reports,
        activeReport,
        activeReportImages,
        activeReportIndex,
        selectReport,
        deleteReport,
        updateReportName,
        handleMakeReportPermanent,
        loading,
        error,
        isRefining,
        setIsRefining,
        showConfigurationPanel,
        setShowConfigurationPanel,
        isConfigVisible,
        userContext,
        setUserContext,
        modal,
        canGenerate,
        canRefine,
        canDownload,
        handleAnalysis,
        handleStepDelete,
        handleAddStep,
        handleAddStepWithImage,
        handleSaveAndRefine,
        closeModal,
        reportRef,
        scrollToReport,
        // Navegación unificada
        navigationState,
        setNavigationMode,
        updateNavigation
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
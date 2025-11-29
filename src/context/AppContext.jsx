/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useMemo, useContext, useRef } from 'react';
import { callAiApi } from '../lib/apiService';
import {
    PROMPT_CHAIN_STEP_1_ANALYST,
    PROMPT_CHAIN_STEP_2_TEST_ENGINEER,
    PROMPT_CHAIN_STEP_3_REVIEWER,

    PROMPT_CHAIN_REFINE_STEP_1_ANALYST,
    PROMPT_CHAIN_REFINE_STEP_2_ENGINEER,
    PROMPT_CHAIN_REFINE_STEP_3_REVIEWER
} from '../lib/prompts';
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
    deleteStepFromReport as deleteStepFromDB,
    searchUserStories,
    createUserStory,
    deleteUserStory
} from '../lib/databaseService';
import { cleanReportData, extractPasoFieldsFromText } from './utils/reportCleaning';
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
    const [currentImageFiles, setCurrentImageFiles] = useState([]);
    const [initialContext, setInitialContext] = useState('');
    const [reports, setReports] = useState([]);
    const [activeReportIndex, setActiveReportIndex] = useState(0);
    const [loading, setLoading] = useState({ state: false, message: '' });
    const [error, setError] = useState(null);
    const [isRefining, setIsRefining] = useState(false);
    const [userContext, setUserContext] = useState('');
    const [modal, setModal] = useState({ show: false, title: '', content: '' });
    const reportRef = useRef(null);

    // Estados para navegación unificada
    const [navigationState, setNavigationState] = useState({
        activeMainMenu: 'panel-control',
        activeSubMenu: 'configuracion',
        viewMode: 'home' // 'home', 'analysis', 'reports'
    });

    // Estados para Historias de Usuario
    const [analysisUserStory, setAnalysisUserStory] = useState(null); // HU seleccionada para el análisis actual
    const [filterUserStory, setFilterUserStory] = useState(null); // HU seleccionada para filtrar reportes
    const [userStorySuggestions, setUserStorySuggestions] = useState([]); // Sugerencias de autocompletado

    const activeReport = useMemo(() => reports[activeReportIndex] || null, [reports, activeReportIndex]);
    const activeReportImages = useMemo(() => activeReport?.imageFiles || [], [activeReport]);

    const canGenerate = useMemo(() => {
        const result = currentImageFiles.length > 0 && !loading.state && !!analysisUserStory;
        console.log('🔍 canGenerate check:', {
            hasImages: currentImageFiles.length > 0,
            notLoading: !loading.state,
            hasUserStory: !!analysisUserStory,
            analysisUserStory,
            result
        });
        return result;
    }, [currentImageFiles, loading.state, analysisUserStory]);

    const canRefine = useMemo(() => {
        // Verificar si hay imágenes asociadas al reporte (ya sea en imageFiles o cargadas de BD)
        const hasImages = (activeReport?.imageFiles && activeReport.imageFiles.length > 0) ||
            (activeReportImages && activeReportImages.length > 0);
        return activeReport && hasImages && !loading.state;
    }, [activeReport, activeReportImages, loading.state]);

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
            activeMainMenu: mainMenu || prev.activeMainMenu,
            ...(subMenu && { activeSubMenu: subMenu })
        }));
    };

    useEffect(() => {
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

                // Cargar reportes con filtro si existe
                const filters = {};
                if (filterUserStory) {
                    filters.userStoryId = filterUserStory.id;
                }

                const dbReports = await loadReportsFromDB(filters);
                // Siempre actualizar reportes, incluso si está vacío (para reflejar el filtro)
                setReports(dbReports || []);

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
    }, [filterUserStory]); // Recargar cuando cambia el filtro de HU

    // Auto-save is now handled within specific operations (handleAnalysis, etc.)
    // No need for a global useEffect that saves all reports

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

            setLoading({ state: true, message: `Preparando ${imagesToSend.length} evidencias para análisis...` });

            // Compress large images to avoid API issues (skip videos)
            const compressedImages = [];
            for (let i = 0; i < imagesToSend.length; i++) {
                if (!imagesToSend[i].isVideo) {
                    setLoading({ state: true, message: `Optimizando imagen ${i + 1} de ${imagesToSend.length}...` });
                    try {
                        const compressed = await compressImageIfNeeded(imagesToSend[i]);
                        compressedImages.push(compressed);
                    } catch (compressError) {
                        console.warn(`Failed to compress image ${i + 1}, using original:`, compressError);
                        compressedImages.push(imagesToSend[i]);
                    }
                } else {
                    compressedImages.push(imagesToSend[i]);
                }
            }

            // --- CHAIN OF THOUGHT FLOW (3 STEPS) ---

            // STEP 1: ANALYST (Observation)
            setLoading({ state: true, message: 'Paso 1/3: Analista QA examinando evidencias...' });
            const promptStep1 = PROMPT_CHAIN_STEP_1_ANALYST(initialContext);
            const analystOutput = await callAiApi(promptStep1, compressedImages, {
                onStatus: (message) => setLoading({ state: true, message: `Paso 1/3: ${message}` })
            });
            console.log('--- STEP 1 (ANALYST) OUTPUT ---', analystOutput);

            // STEP 2: TEST ENGINEER (Structuring)
            setLoading({ state: true, message: 'Paso 2/3: Ingeniero de Pruebas estructurando el escenario...' });
            const promptStep2 = PROMPT_CHAIN_STEP_2_TEST_ENGINEER(analystOutput);
            // Note: We don't strictly need to send images again if the model context is fresh, 
            // but sending them ensures the model "sees" them if it's a stateless call. 
            // However, to save tokens/bandwidth, we might rely on the text description from Step 1.
            // Let's send images again to be safe, as the prompts rely on "Evidencia X".
            const engineerOutput = await callAiApi(promptStep2, compressedImages, {
                onStatus: (message) => setLoading({ state: true, message: `Paso 2/3: ${message}` })
            });
            console.log('--- STEP 2 (ENGINEER) OUTPUT ---', engineerOutput);

            // STEP 3: REVIEWER (Refinement & JSON Formatting)
            setLoading({ state: true, message: 'Paso 3/3: Revisor QA validando y formateando...' });
            const promptStep3 = PROMPT_CHAIN_STEP_3_REVIEWER(engineerOutput);
            const reviewerOutput = await callAiApi(promptStep3, compressedImages, {
                onStatus: (message) => setLoading({ state: true, message: `Paso 3/3: ${message}` })
            });
            console.log('--- STEP 3 (REVIEWER) OUTPUT ---', reviewerOutput);

            // Use the final output from Step 3
            const jsonText = reviewerOutput;

            // Robust JSON extraction
            let cleanedJsonText = jsonText;
            const jsonBlockMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);

            if (jsonBlockMatch) {
                cleanedJsonText = jsonBlockMatch[1];
            } else {
                // Fallback: Try to find the first '[' or '{' and the last ']' or '}'
                const firstBracket = jsonText.indexOf('[');
                const firstBrace = jsonText.indexOf('{');
                const lastBracket = jsonText.lastIndexOf(']');
                const lastBrace = jsonText.lastIndexOf('}');

                const start = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) ? firstBracket : firstBrace;
                const end = (lastBracket !== -1 && (lastBrace === -1 || lastBracket > lastBrace)) ? lastBracket : lastBrace;

                if (start !== -1 && end !== -1 && end > start) {
                    cleanedJsonText = jsonText.substring(start, end + 1);
                }
            }

            let parsedResponse;
            try {
                parsedResponse = JSON.parse(cleanedJsonText);
            } catch (parseError) {
                console.error("JSON Parse Error. Raw text:", jsonText);
                console.error("Cleaned text:", cleanedJsonText);
                throw new Error("La respuesta de la IA no contiene un JSON válido. Revisa la consola para más detalles.");
            }

            // Handle both array and single object responses
            let newReportData = Array.isArray(parsedResponse) ? parsedResponse[0] : parsedResponse;

            if (!newReportData) {
                throw new Error("La respuesta de la API está vacía o no contiene datos válidos.");
            }

            // Clean the report data to remove redundant text
            newReportData = cleanReportData(newReportData, compressedImages);

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
                    descripcion: "Análisis inicial de evidencias",
                    imagen_referencia: "Evidencia 1"
                }];
            }

            // Clean scenario name to avoid duplication of "Escenario:" prefix
            let cleanedScenarioName = newReportData.Nombre_del_Escenario || '';
            if (cleanedScenarioName.startsWith('Escenario: ')) {
                cleanedScenarioName = cleanedScenarioName.substring(11); // Remove "Escenario: " prefix
            }

            // Verificar si hay HU seleccionada y si es nueva
            let finalUserStory = analysisUserStory;
            if (analysisUserStory && analysisUserStory.isNew) {
                try {
                    console.log('Creating new User Story:', analysisUserStory);
                    // Crear la HU en BD
                    finalUserStory = await createUserStory(analysisUserStory.numero, analysisUserStory.title);
                    console.log('User Story created:', finalUserStory);
                    setAnalysisUserStory(finalUserStory); // Actualizar estado con la real
                } catch (error) {
                    console.error("Error creating user story:", error);
                    setError("Error al crear la Historia de Usuario. Verifica que no exista.");
                    setLoading({ state: false, message: '' });
                    return;
                }
            } else {
                console.log('Using existing User Story:', finalUserStory);
            }

            const newReport = {
                ...newReportData,
                Nombre_del_Escenario: cleanedScenarioName,
                imageFiles: [...compressedImages],
                initial_context: initialContext,
                user_story_id: finalUserStory ? finalUserStory.id : null, // Asociar HU si existe
                historia_usuario: finalUserStory ? `HU-${finalUserStory.numero}` : null // Legacy field
            };

            console.log('Saving report with user_story_id:', newReport.user_story_id);



            // Save to database as temporary initially
            try {
                let savedReport;
                try {
                    savedReport = await saveReportToDB(newReport, true); // Save as temporary
                } catch (firstError) {
                    // Check for FK violation on user_story_id
                    if (firstError.code === '23503' && firstError.message.includes('user_story_id')) {
                        console.warn("FK Violation on user_story_id. Retrying without HU association...", firstError);
                        // Retry without user_story_id
                        const fallbackReport = { ...newReport, user_story_id: null };
                        savedReport = await saveReportToDB(fallbackReport, true);
                        setError("Reporte guardado, pero hubo un problema al vincular la Historia de Usuario. Se guardó sin vinculación.");
                    } else {
                        throw firstError;
                    }
                }

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
                            const updatedReport = { ...savedReport, ...permanentReport, is_temp: false };
                            setReports(prev => {
                                const newReports = [...prev];
                                newReports[newReports.length - 1] = updatedReport;
                                return newReports;
                            });

                        }
                        // Limpiar las imágenes cargadas después de un análisis exitoso
                        setCurrentImageFiles([]);
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
                setCurrentImageFiles([]); // También limpiar si solo se guardó localmente

                setError("Reporte generado exitosamente, pero no se pudo guardar en la base de datos.");
            }

            setNavigationState(prev => ({ ...prev, viewMode: 'reports' }));
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
                                descripcion: step.descripcion_accion_observada || step.descripcion,
                                imagen_referencia: step.imagen_referencia
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
                                descripcion: step.descripcion_accion_observada || step.descripcion,
                                imagen_referencia: step.imagen_referencia
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
            imagen_referencia: 'N/A'
        };

        // Add to database if we have an ID
        if (activeReport.id) {
            try {
                const dbStep = await addStepToReport(activeReport.id, newStepData);

                // Update local state with the database step
                const updatedReport = { ...activeReport };
                const localStep = {
                    numero_paso: dbStep.numero_paso,
                    descripcion: dbStep.descripcion_accion_observada || dbStep.descripcion,
                    imagen_referencia: dbStep.imagen_referencia || 'N/A'
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
        if (!activeReport) {
            console.error('No active report to refine');
            return;
        }

        // Use the current state directly instead of parsing DOM
        const editedReport = JSON.parse(JSON.stringify(activeReport));

        // Add user context
        editedReport.user_provided_additional_context = userContext.trim();

        // Ensure steps are in the correct simplified format
        if (editedReport.Pasos_Analizados && Array.isArray(editedReport.Pasos_Analizados)) {
            editedReport.Pasos_Analizados = editedReport.Pasos_Analizados.map(paso => ({
                numero_paso: paso.numero_paso,
                descripcion: paso.descripcion || paso.descripcion_accion_observada,
                imagen_referencia: paso.imagen_referencia
            }));
        }

        // Remove imageFiles for the prompt
        const { imageFiles: _imageFiles, ...reportForPrompt } = editedReport;
        const editedJsonString = JSON.stringify(reportForPrompt, null, 2);

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

            // --- CHAIN OF THOUGHT FLOW FOR REFINEMENT (3 STEPS) ---

            // STEP 1: ANALYST (Interpret Request)
            setLoading({ state: true, message: 'Paso 1/3: Analista QA interpretando solicitud...' });
            const promptStep1 = PROMPT_CHAIN_REFINE_STEP_1_ANALYST(editedJsonString, userContext);
            const analystOutput = await callAiApi(promptStep1, compressedImages, {
                onStatus: (message) => setLoading({ state: true, message: `Paso 1/3: ${message}` })
            });
            console.log('--- REFINEMENT STEP 1 (ANALYST) OUTPUT ---', analystOutput);

            // STEP 2: TEST ENGINEER (Apply Changes)
            setLoading({ state: true, message: 'Paso 2/3: Ingeniero de Pruebas aplicando cambios...' });
            const promptStep2 = PROMPT_CHAIN_REFINE_STEP_2_ENGINEER(analystOutput, editedJsonString);
            const engineerOutput = await callAiApi(promptStep2, compressedImages, {
                onStatus: (message) => setLoading({ state: true, message: `Paso 2/3: ${message}` })
            });
            console.log('--- REFINEMENT STEP 2 (ENGINEER) OUTPUT ---', engineerOutput);

            // STEP 3: REVIEWER (Final Validation)
            setLoading({ state: true, message: 'Paso 3/3: Revisor QA validando reporte final...' });
            const promptStep3 = PROMPT_CHAIN_REFINE_STEP_3_REVIEWER(engineerOutput);
            const reviewerOutput = await callAiApi(promptStep3, compressedImages, {
                onStatus: (message) => setLoading({ state: true, message: `Paso 3/3: ${message}` })
            });
            console.log('--- REFINEMENT STEP 3 (REVIEWER) OUTPUT ---', reviewerOutput);

            // Use the final output from Step 3
            const jsonText = reviewerOutput;
            const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) || jsonText.match(/([\s\S]*)/);
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
            refinedReportData = cleanReportData(refinedReportData, compressedImages);

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
                initial_context: activeReport.initial_context,
                // Preservar datos de la Historia de Usuario
                user_story_id: activeReport.user_story_id,
                historia_usuario: activeReport.historia_usuario
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

                    // Recargar TODOS los reportes desde la BD para asegurar persistencia
                    setLoading({ state: true, message: 'Recargando reportes desde base de datos...' });
                    const allReports = await loadReportsFromDB();
                    setReports(allReports);

                    // Encontrar el índice del reporte actualizado en la nueva lista
                    const updatedIndex = allReports.findIndex(r => r.id === activeReport.id);
                    if (updatedIndex !== -1) {
                        setActiveReportIndex(updatedIndex);
                    }

                    console.log('All reports reloaded from database, total:', allReports.length);
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

    // Funciones para gestión de Historias de Usuario
    const handleUserStorySearch = async (query) => {
        if (!query) {
            setUserStorySuggestions([]);
            return [];
        }
        const stories = await searchUserStories(query);
        setUserStorySuggestions(stories);
        return stories;
    };

    const handleUserStoryCreate = async (numero, title) => {
        try {
            const newStory = await createUserStory(numero, title);
            return newStory;
        } catch (error) {
            console.error("Error creating user story:", error);
            throw error;
        }
    };

    const handleUserStoryDelete = async (id) => {
        try {
            await deleteUserStory(id);
            // Si la HU eliminada es la que está seleccionada, limpiar el filtro
            if (filterUserStory?.id === id) {
                setFilterUserStory(null);
            }
            // Si la HU eliminada es la que está seleccionada para análisis, limpiarla
            if (analysisUserStory?.id === id) {
                setAnalysisUserStory(null);
            }
            // Limpiar sugerencias
            setUserStorySuggestions([]);
            return true;
        } catch (error) {
            console.error("Error deleting user story:", error);
            throw error;
        }
    };

    // Funciones para edición de pasos durante refinamiento
    const updateStepInActiveReport = (stepNumber, updatedData) => {
        if (!activeReport || activeReportIndex === -1) return;

        const updatedReport = { ...activeReport };
        const stepIndex = updatedReport.Pasos_Analizados.findIndex(p => p.numero_paso === stepNumber);

        if (stepIndex !== -1) {
            updatedReport.Pasos_Analizados[stepIndex] = {
                ...updatedReport.Pasos_Analizados[stepIndex],
                ...updatedData
            };

            setReports(prev => {
                const newReports = [...prev];
                newReports[activeReportIndex] = updatedReport;
                return newReports;
            });
        }
    };

    const deleteStepFromActiveReport = (stepNumber) => {
        if (!activeReport || activeReportIndex === -1) return;

        const updatedReport = { ...activeReport };
        updatedReport.Pasos_Analizados = updatedReport.Pasos_Analizados
            .filter(p => p.numero_paso !== stepNumber)
            .map((paso, index) => ({
                ...paso,
                numero_paso: index + 1 // Renumerar
            }));

        setReports(prev => {
            const newReports = [...prev];
            newReports[activeReportIndex] = updatedReport;
            return newReports;
        });
    };

    const value = {
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
        updateNavigation,
        // Historias de Usuario
        analysisUserStory,
        setAnalysisUserStory,
        filterUserStory,
        setFilterUserStory,
        userStorySuggestions,
        handleUserStorySearch,
        handleUserStoryCreate,
        handleUserStoryDelete,
        // Edición de pasos en refinamiento
        updateStepInActiveReport,
        deleteStepFromActiveReport
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
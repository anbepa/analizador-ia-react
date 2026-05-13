/* eslint-disable react-refresh/only-export-components */
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
    deleteStepFromReport as deleteStepFromDB,
    deleteUserStory,
    searchUserStories,
    createUserStory,
    loadImagesForReport
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
    const [selectedModel, setSelectedModel] = useState('gpt-4o'); // Modelo seleccionado: 'gpt-4o' (Copilot)
    const [session, setSession] = useState(null); // Sesión de Supabase
    const [githubToken, setGithubToken] = useState(null); // Token de GitHub (gho_) extraído de la sesión
    const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

    // Listener para la sesión de Supabase
    useEffect(() => {
        /**
         * Persiste el provider_token de GitHub en Supabase DB.
         * Esto funciona tanto en local como en producción (Vercel):
         * el token se guarda UNA vez al hacer login y se recupera
         * desde la DB en cualquier sesión restaurada posterior.
         */
        const persistGithubToken = async (session) => {
            if (!session?.provider_token || !session?.user?.id) return;
            try {
                await supabase.from('user_github_tokens').upsert({
                    user_id: session.user.id,
                    provider_token: session.provider_token,
                    provider_refresh_token: session.provider_refresh_token || null,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            } catch (err) {
                console.warn('[Auth] No se pudo persistir el token de GitHub:', err.message);
            }
        };

        /**
         * Recupera el provider_token desde Supabase DB cuando
         * la sesión restaurada no lo incluye (recargas de página).
         */
        const loadGithubTokenFromDB = async (session) => {
            if (!session?.user?.id) return null;
            try {
                const { data } = await supabase
                    .from('user_github_tokens')
                    .select('provider_token')
                    .eq('user_id', session.user.id)
                    .single();
                return data?.provider_token || null;
            } catch {
                return null;
            }
        };

        const initSession = async (session) => {
            setSession(session);
            if (session?.provider_token) {
                // Token disponible (login fresco) → persistir en DB y en sessionStorage
                sessionStorage.setItem('gh_provider_token', session.provider_token);
                setGithubToken(session.provider_token);
                await persistGithubToken(session);
            } else if (session) {
                // Sesión restaurada sin provider_token → intentar recuperar
                let token = sessionStorage.getItem('gh_provider_token');
                if (!token) token = await loadGithubTokenFromDB(session);
                if (token) {
                    sessionStorage.setItem('gh_provider_token', token);
                    setGithubToken(token);
                }
            } else {
                // Logout → limpiar todo
                sessionStorage.removeItem('gh_provider_token');
                setGithubToken(null);
            }
            // Limpiar la URL por seguridad (quitar access_token del hash)
            if (window.location.hash && window.location.hash.includes('access_token')) {
                window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
            }
        };

        // Sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => initSession(session));

        // Cambios de sesión (login, logout, refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            initSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const activeReport = useMemo(() => reports[activeReportIndex] || null, [reports, activeReportIndex]);
    const activeReportImages = useMemo(() => activeReport?.imageFiles || [], [activeReport]);

    const canGenerate = useMemo(() => {
        const result = currentImageFiles.length > 0 && !loading.state && !!analysisUserStory && !!session;
        console.log('🔍 canGenerate check:', {
            hasImages: currentImageFiles.length > 0,
            notLoading: !loading.state,
            hasUserStory: !!analysisUserStory,
            hasSession: !!session,
            result
        });
        return result;
    }, [currentImageFiles, loading.state, analysisUserStory, session]);

    const canRefine = useMemo(() => {
        return activeReport && !loading.state;
    }, [activeReport, loading.state]);

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

    const extractPasoFieldsFromText = (text = '') => {
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

    // Function to clean and normalize AI response fields
    const cleanReportData = (reportData, images = []) => {
        if (!reportData) return reportData;

        let cleaned = { ...reportData };

        // --- NORMALIZACIÓN DE CLAVES (Inglés -> Español y Variantes) ---

        // 1. ID y Título
        if (!cleaned.id_caso) cleaned.id_caso = cleaned.test_case_id || cleaned.id || 'Generado';

        // Detectar IDs técnicos inválidos y simplificarlos
        // Detectar IDs técnicos inválidos y simplificarlos, pero mantener unicidad
        if (typeof cleaned.id_caso === 'string') {
            // Si es 'Generado' o vacío, asignar uno temporal único
            if (cleaned.id_caso === 'Generado' || !cleaned.id_caso) {
                cleaned.id_caso = `GEN-${Date.now().toString().slice(-4)}`;
            }
            // Si el ID es muy largo o complejo, intentar limpiarlo pero sin perder identidad
            else if (cleaned.id_caso.length > 15) {
                // Intentar extraer la parte más significativa (ej: TC-123 de HU-45-TC-123)
                const parts = cleaned.id_caso.split(/[-_]/);
                if (parts.length > 1) {
                    // Tomar la última parte si parece un número o código corto
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

        // Detectar nombres genéricos o técnicos y reemplazarlos
        const genericNames = ['Caso de Prueba', 'Flujo de Usuario', 'Test Case', 'Escenario de Prueba'];
        const technicalPrefixes = ['E2E-', 'TC-', 'Refinamiento_', 'UI-'];

        if (typeof cleaned.escenario_prueba === 'string') {
            const trimmed = cleaned.escenario_prueba.trim();

            // Si es un nombre genérico exacto
            if (genericNames.includes(trimmed)) {
                cleaned.escenario_prueba = 'Definir nombre del escenario';
            }
            // Si empieza con prefijos técnicos, intentar extraer la parte descriptiva
            else if (technicalPrefixes.some(prefix => trimmed.startsWith(prefix))) {
                // Intentar limpiar el nombre técnico
                let cleanedName = trimmed;
                technicalPrefixes.forEach(prefix => {
                    cleanedName = cleanedName.replace(prefix, '');
                });
                // Reemplazar guiones/underscores con espacios y capitalizar
                cleanedName = cleanedName.replace(/[-_]/g, ' ').trim();
                cleaned.escenario_prueba = cleanedName || 'Definir nombre del escenario';
            }
        }

        // 2. Precondiciones (Manejo robusto de Arrays y Strings JSON)
        let rawPreconditions = cleaned.precondiciones || cleaned.pre_conditions || cleaned.preconditions;
        if (rawPreconditions) {
            // Detectar valores inválidos
            const invalidValues = ['-', 'N/A', 'n/a', 'NA', 'null', ''];
            const trimmed = typeof rawPreconditions === 'string' ? rawPreconditions.trim() : rawPreconditions;

            if (invalidValues.includes(trimmed)) {
                cleaned.precondiciones = 'Ninguna precondición específica';
            } else if (Array.isArray(rawPreconditions)) {
                cleaned.precondiciones = rawPreconditions.map(p => `- ${p}`).join('\n');
            } else if (typeof rawPreconditions === 'string') {
                // Intentar detectar si es un string con formato JSON de array '["a", "b"]'
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (Array.isArray(parsed)) {
                            cleaned.precondiciones = parsed.map(p => `- ${p}`).join('\n');
                        } else {
                            cleaned.precondiciones = rawPreconditions;
                        }
                    } catch (e) {
                        cleaned.precondiciones = rawPreconditions; // Si falla, dejar como está
                    }
                } else {
                    cleaned.precondiciones = rawPreconditions;
                }
            }
        } else {
            cleaned.precondiciones = 'Ninguna precondición específica';
        }

        // 3. Resultados (Esperado y Obtenido)
        const invalidValues = ['-', 'N/A', 'n/a', 'NA', 'null', ''];

        if (!cleaned.resultado_esperado) {
            // Intentar buscar en otros campos (incluyendo variantes globales)
            cleaned.resultado_esperado = cleaned.expected_result ||
                cleaned.resultado_esperado_general ||
                cleaned.resultado_esperado_flujo ||
                cleaned.resultado_esperado_global;

            // Si sigue faltando, usar poscondiciones como fallback (ya que describen el éxito del flujo)
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

            // Default final
            if (!cleaned.resultado_esperado) cleaned.resultado_esperado = 'Definir criterio de éxito esperado';
        }

        // Detectar valores inválidos en resultado_esperado
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

        // Detectar valores inválidos en resultado_obtenido
        if (typeof cleaned.resultado_obtenido === 'string' && invalidValues.includes(cleaned.resultado_obtenido.trim())) {
            cleaned.resultado_obtenido = 'Pendiente de ejecución';
        }

        // POST-PROCESAMIENTO INTELIGENTE: Si hay imágenes pero el resultado es "Pendiente", inferir del esperado
        if (images.length > 0 && cleaned.resultado_obtenido === 'Pendiente de ejecución' && cleaned.resultado_esperado && cleaned.resultado_esperado !== 'Definir criterio de éxito esperado') {
            // Convertir el resultado esperado en observado (cambiar "debería" por "se observa")
            cleaned.resultado_obtenido = cleaned.resultado_esperado
                .replace(/debería/gi, 'se observa que')
                .replace(/debe/gi, 'se visualiza')
                .replace(/Se visualiza/gi, 'Se visualiza correctamente');
        }

        // POST-PROCESAMIENTO DE ESTADO GENERAL: Comparación semántica inteligente
        if (!cleaned.estado_general || cleaned.estado_general === 'Pendiente') {
            // Si ambos resultados existen y no son placeholders
            if (cleaned.resultado_esperado &&
                cleaned.resultado_obtenido &&
                cleaned.resultado_esperado !== 'Definir criterio de éxito esperado' &&
                cleaned.resultado_obtenido !== 'Pendiente de ejecución') {

                // Normalizar para comparación (quitar puntuación, minúsculas, espacios extra)
                const normalizar = (texto) => texto.toLowerCase().replace(/[.,;:]/g, '').replace(/\s+/g, ' ').trim();
                const esperadoNorm = normalizar(cleaned.resultado_esperado);
                const obtenidoNorm = normalizar(cleaned.resultado_obtenido);

                // Verificar si contienen palabras clave de error
                const tieneError = /error|fallo|fallido|incorrecto|no se pudo|denegado/i.test(obtenidoNorm);

                // Si no hay errores y tienen similitud semántica (más del 40% de palabras en común)
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

        // 4. Mapeo de pasos (steps -> pasos) y Asignación de Imágenes
        let rawSteps = cleaned.pasos || cleaned.steps || cleaned.Pasos_Analizados;

        // DEBUG: Ver qué estructura tienen los pasos
        if (rawSteps && Array.isArray(rawSteps) && rawSteps.length > 0) {
            console.log('DEBUG - Estructura del primer paso:', rawSteps[0]);
            console.log('DEBUG - Tipo del primer paso:', typeof rawSteps[0]);
            console.log('DEBUG - Claves disponibles:', Object.keys(rawSteps[0]));
        }

        if (rawSteps && Array.isArray(rawSteps)) {
            // CONVERSIÓN: Si los pasos son strings en lugar de objetos, convertirlos
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
                // Determinar la referencia de imagen
                let imgRef = step.imagen_referencia || step.image_ref || step.evidencia;

                // Si no tiene referencia explícita, asignar por índice secuencial
                if (!imgRef || imgRef === 'N/A') {
                    if (index < images.length) {
                        imgRef = `Evidencia ${index + 1}`;
                    } else if (images.length > 0) {
                        // Fallback: usar la última imagen disponible para pasos adicionales
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

        // Mapeo de claves legacy para compatibilidad UI
        cleaned.Nombre_del_Escenario = cleaned.escenario_prueba;
        cleaned.Resultado_Esperado_General_Flujo = cleaned.resultado_esperado;
        cleaned.Conclusion_General_Flujo = cleaned.resultado_obtenido;
        // ---------------------------------------------------

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

        // Clean resultado_obtenido_paso_y_estado fields in Pasos_Analizados
        if (cleaned.Pasos_Analizados && Array.isArray(cleaned.Pasos_Analizados)) {
            cleaned.Pasos_Analizados = cleaned.Pasos_Analizados.map(paso => {
                const cleanedPaso = { ...paso };

                // Remove JSON-like formatting from resultado_obtenido_paso_y_estado
                if (cleanedPaso.resultado_obtenido_paso_y_estado) {
                    let cleanedResult = cleanedPaso.resultado_obtenido_paso_y_estado;

                    // Remove opening and closing braces if they wrap the entire content
                    if (cleanedResult.trim().startsWith('{') && cleanedResult.trim().endsWith('}')) {
                        cleanedResult = cleanedResult.trim().slice(1, -1).trim();
                    }

                    // Remove JSON property patterns like "estado": "Exitosa", "descripcion": "..."
                    // and extract just the meaningful text
                    const jsonPatterns = [
                        /"estado"\s*:\s*"([^"]+)"\s*,\s*"descripcion"\s*:\s*"([^"]+)"/i,
                        /"descripcion"\s*:\s*"([^"]+)"\s*,\s*"estado"\s*:\s*"([^"]+)"/i
                    ];

                    for (const pattern of jsonPatterns) {
                        const match = cleanedResult.match(pattern);
                        if (match) {
                            // Extract estado and descripcion from JSON pattern
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

                // Cargar reportes iniciales
                await refreshReports(1);

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

            setLoading({ state: true, message: refinement ? 'Enviando a IA para refinamiento...' : 'Enviando a IA para análisis inicial...' });

            const prompt = refinement
                ? PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT(payload)
                : PROMPT_FLOW_ANALYSIS_FROM_IMAGES(initialContext);

            const jsonText = await callAiApi(prompt, compressedImages, {
                onStatus: (message) => setLoading({ state: true, message }),
                model: selectedModel,
                authToken: githubToken,
                supabaseToken: session?.access_token || null
            });

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
                historia_usuario: finalUserStory ? `HU-${finalUserStory.numero}` : null, // Legacy field
                user_id: session?.user?.id // Asociar con el usuario actual
            };

            console.log('Saving report with user_story_id:', newReport.user_story_id);



            // Save to database as permanent directly
            try {
                let savedReport;
                try {
                    savedReport = await saveReportToDB(newReport, false); // Save as permanent directly
                } catch (firstError) {
                    // Check for FK violation on user_story_id
                    if (firstError.code === '23503' && firstError.message.includes('user_story_id')) {
                        console.warn("FK Violation on user_story_id. Retrying without HU association...", firstError);
                        // Retry without user_story_id
                        const fallbackReport = { ...newReport, user_story_id: null };
                        savedReport = await saveReportToDB(fallbackReport, false);
                        setError("Reporte guardado, pero hubo un problema al vincular la Historia de Usuario. Se guardó sin vinculación.");
                    } else {
                        throw firstError;
                    }
                }

                // Important: keep the imageFiles with their dataURLs in the local state
                // to avoid triggering a lazy load fetch immediately.
                const finalReportForState = {
                    ...savedReport,
                    imageFiles: newReport.imageFiles // Preserve local images (with base64)
                };

                setReports(prev => {
                    const newReports = [...prev, finalReportForState];
                    setActiveReportIndex(newReports.length - 1);
                    return newReports;
                });

                // Limpiar las imágenes cargadas después de un análisis exitoso
                setCurrentImageFiles([]);
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
            let imagesToSend = validateAndCleanImages(activeReport.imageFiles || activeReportImages || []);
            const compressedImages = [];

            if (imagesToSend.length > 0) {
                setLoading({ state: true, message: `Preparando ${imagesToSend.length} imágenes para análisis...` });
                // Compress large images to avoid API issues
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
            }

            setLoading({ state: true, message: 'Enviando a IA para refinamiento...' });

            // Asegurar que tenemos el token de GitHub antes de llamar al proxy
            let tokenParaLlamada = githubToken;
            if (!tokenParaLlamada) {
                // Intentar recuperar desde sessionStorage (persistido en login previo)
                tokenParaLlamada = sessionStorage.getItem('gh_provider_token');
            }
            if (!tokenParaLlamada) {
                // Último recurso: consultar la sesión activa de Supabase
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                tokenParaLlamada = currentSession?.provider_token || null;
                if (tokenParaLlamada) {
                    sessionStorage.setItem('gh_provider_token', tokenParaLlamada);
                    setGithubToken(tokenParaLlamada);
                }
            }
            if (!tokenParaLlamada) {
                throw new Error('No se encontró el token de GitHub. Por favor, cierra sesión y vuelve a entrar con GitHub.');
            }

            const prompt = PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT(editedJsonString);
            const jsonText = await callAiApi(prompt, compressedImages, {
                onStatus: (message) => setLoading({ state: true, message }),
                model: selectedModel,
                authToken: tokenParaLlamada,
                supabaseToken: session?.access_token || null
            });
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
                        newReports[activeReportIndex] = { ...refinedReport, ...updatedReport };
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

    const deleteReportsBulk = async (indices) => {
        // Filtrar los reportes a eliminar
        const reportsToDelete = indices.map(index => reports[index]).filter(Boolean);
        const idsToDelete = reportsToDelete.map(r => r.id).filter(Boolean);

        // Delete from database
        if (idsToDelete.length > 0) {
            try {
                // Assuming deleteReportFromDB works for single ID. 
                // Alternatively, we can use Promise.all for now
                await Promise.all(idsToDelete.map(id => deleteReportFromDB(id)));
            } catch (dbError) {
                console.warn("Failed to delete some reports from database:", dbError);
                setError("Ocurrió un error al intentar eliminar algunos reportes de la base de datos.");
                // Proceed to delete successful ones or just refresh? Let's just continue
            }
        }

        // Update local state
        setReports(prev => prev.filter((_, i) => !indices.includes(i)));
        
        // Reset active index just in case
        setActiveReportIndex(-1);
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
        const stories = await searchUserStories(query, session?.user?.id);
        setUserStorySuggestions(stories);
        return stories;
    };

    const handleUserStoryCreate = async (numero, title) => {
        try {
            const newStory = await createUserStory(numero, title, session?.user?.id);
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

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) {
            setError('Error al iniciar sesión con GitHub: ' + error.message);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            setError('Error al cerrar sesión: ' + error.message);
        } else {
            setReports([]); // Opcional: Limpiar reportes al cerrar sesión
            setSession(null);
            setGithubToken(null);
        }
    };

    const refreshReports = async (page = pagination.page) => {
        try {
            setLoading({ state: true, message: 'Cargando reportes...' });
            
            const filters = {
                page,
                pageSize: pagination.pageSize,
                userId: session?.user?.id
            };

            if (filterUserStory) {
                filters.userStoryId = filterUserStory.id;
            }

            const result = await loadReportsFromDB(filters);
            
            const newReports = result.reports || [];
            setReports(newReports);
            setPagination(prev => ({ ...prev, page, total: result.total || 0 }));
            
            if (newReports.length > 0) {
                setActiveReportIndex(0);
            }

        } catch (err) {
            console.error("Error al refrescar reportes:", err);
            setError("No se pudieron cargar los reportes.");
        } finally {
            setLoading({ state: false, message: '' });
        }
    };

    const changePage = (newPage) => {
        refreshReports(newPage);
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
        deleteReportsBulk,
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
        deleteStepFromActiveReport,
        // Auth
        session,
        githubToken,
        handleLogin,
        handleLogout,
        selectedModel,
        setSelectedModel,
        pagination,
        changePage,
        refreshReports
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { callAiApi } from '../lib/apiService';
import { PROMPT_FLOW_ANALYSIS_FROM_IMAGES, PROMPT_BUG_TICKET, PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT } from '../lib/prompts';

// 1. Crear el Contexto
const AppContext = createContext();

// Hook personalizado para consumir el contexto fácilmente
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

// 2. Crear el Proveedor del Contexto
export const AppProvider = ({ children }) => {
    // --- State Management ---
    const [apiConfig, setApiConfig] = useState({
        provider: 'gemini',
        gemini: { key: '', model: 'gemini-1.5-flash-latest' },
        openai: { key: '', model: 'gpt-4o' },
        claude: { key: '', model: 'claude-3-sonnet-20240229' }
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [initialContext, setInitialContext] = useState('');
    const [reportJson, setReportJson] = useState(null);
    const [loading, setLoading] = useState({ state: false, message: '' });
    const [error, setError] = useState(null);
    const [isRefining, setIsRefining] = useState(false);
    const [userContext, setUserContext] = useState('');
    const [modal, setModal] = useState({ show: false, title: '', content: '' });

    // --- Effects ---
    useEffect(() => {
        const cachedConfig = localStorage.getItem('qaAppApiConfig');
        if (cachedConfig) {
            setApiConfig(JSON.parse(cachedConfig));
        }
    }, []);

    // --- Memoized Button States ---
    const canGenerate = useMemo(() => {
        const providerKey = apiConfig[apiConfig.provider]?.key;
        return providerKey && providerKey.length > 0 && imageFiles.length > 0 && !loading.state;
    }, [apiConfig, imageFiles, loading.state]);

    const canRefine = useMemo(() => canGenerate && reportJson, [canGenerate, reportJson]);
    const canDownload = useMemo(() => reportJson && !loading.state, [reportJson, loading.state]);

    // --- Core Handlers ---
    const handleAnalysis = async (refinement = false, payload = null) => {
        setLoading({ state: true, message: refinement ? 'Refinando análisis...' : 'Realizando análisis inicial...' });
        setError(null);
        if (!refinement) {
            setReportJson(null); // Clear previous report only on initial analysis
        }

        try {
            const prompt = refinement
                ? PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT(payload)
                : PROMPT_FLOW_ANALYSIS_FROM_IMAGES(initialContext);

            const jsonText = await callAiApi(prompt, imageFiles, apiConfig);

            const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/s) || jsonText.match(/([\s\S]*)/);
            if (!jsonMatch) throw new Error("La respuesta de la API no contiene un bloque JSON válido y esperado.");

            const cleanedJsonText = jsonMatch[1] || jsonMatch[0];
            const newReport = JSON.parse(cleanedJsonText)[0];
            setReportJson(newReport);

        } catch (e) {
            setError(`Error durante el análisis: ${e.message}`);
            console.error(e);
        } finally {
            setLoading({ state: false, message: '' });
            if (refinement) setIsRefining(false);
        }
    };

    const handleGenerateTicket = async (stepNumber) => {
        const failedStep = reportJson.Pasos_Analizados.find(p => p.numero_paso == stepNumber);
        if (!failedStep) return;

        setLoading({ state: true, message: 'Generando borrador de ticket...' });
        setError(null);

        try {
            const prompt = PROMPT_BUG_TICKET(JSON.stringify(failedStep), JSON.stringify(reportJson));
            const ticketText = await callAiApi(prompt, [], apiConfig);
            setModal({ show: true, title: `Borrador de Ticket para Paso #${stepNumber}`, content: ticketText });
        } catch (e) {
            setError(`Error generando el ticket: ${e.message}`);
        } finally {
            setLoading({ state: false, message: '' });
        }
    };

    const handleStepDelete = (stepNumber) => {
        setReportJson(prev => {
            if (!prev) return null;
            const updatedSteps = prev.Pasos_Analizados
                .filter(p => p.numero_paso !== stepNumber)
                .map((p, index) => ({ ...p, numero_paso: index + 1 }));

            return { ...prev, Pasos_Analizados: updatedSteps };
        });
    };

    const handleAddStep = () => {
        setReportJson(prev => {
            if (!prev) return null;
            const newStepNumber = prev.Pasos_Analizados.length + 1;
            const newStep = {
                numero_paso: newStepNumber,
                descripcion_accion_observada: 'Nueva acción...',
                dato_de_entrada_paso: '',
                resultado_esperado_paso: '',
                resultado_obtenido_paso_y_estado: 'Pendiente de análisis',
                imagen_referencia_entrada: 'N/A',
                imagen_referencia_salida: 'N/A'
            };
            return { ...prev, Pasos_Analizados: [...prev.Pasos_Analizados, newStep] };
        });
    };

    const handleSaveAndRefine = () => {
        const reportContentEl = document.getElementById('report-content');
        if (!reportContentEl || !reportJson) return;

        const editedReport = JSON.parse(JSON.stringify(reportJson));
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
        const editedJsonString = JSON.stringify([editedReport], null, 2);
        handleAnalysis(true, editedJsonString);
    };
    
    const closeModal = () => setModal({ show: false, title: '', content: '' });

    const value = {
        apiConfig,
        setApiConfig,
        imageFiles,
        setImageFiles,
        initialContext,
        setInitialContext,
        reportJson,
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
        handleGenerateTicket,
        handleStepDelete,
        handleAddStep,
        handleSaveAndRefine,
        closeModal
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
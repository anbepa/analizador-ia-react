import React, { createContext, useState, useEffect, useMemo, useContext, useRef } from 'react';
import { callAiApi } from '../lib/apiService';
import { PROMPT_FLOW_ANALYSIS_FROM_IMAGES, PROMPT_BUG_TICKET, PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT } from '../lib/prompts';

import { loadReports, saveReports } from '../lib/idbService';

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
        provider: 'openai',
        openai: { key: '', model: 'gpt-4o' },
        claude: { key: '', model: 'claude-3-sonnet-20240229' },
        gemini: { key: '', model: 'gemini-1.5-flash' }
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

    const activeReport = useMemo(() => reports[activeReportIndex] || null, [reports, activeReportIndex]);
    const activeReportImages = useMemo(() => activeReport?.imageFiles || [], [activeReport]);

    useEffect(() => {
        const cachedConfig = localStorage.getItem('qaAppApiConfig');
        if (cachedConfig) {
            setApiConfig(JSON.parse(cachedConfig));
        }
        
        loadReports()
            .then(cachedReports => {
                if (cachedReports && cachedReports.length > 0) {
                    setReports(cachedReports);
                }
            })
            .catch(err => {
                console.error("Error al cargar reportes desde IndexedDB:", err);
                setError("No se pudieron cargar los reportes guardados.");
            });

    }, []);

    useEffect(() => {
        saveReports(reports).catch(err => {
            console.error("Error al guardar reportes en IndexedDB:", err);
            setError("No se pudieron guardar los cambios en los reportes.");
        });
    }, [reports]);
    
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

    const handleAnalysis = async (refinement = false, payload = null) => {
        setLoading({ state: true, message: refinement ? 'Refinando análisis...' : 'Realizando análisis inicial...' });
        setError(null);
        
        try {
            const prompt = refinement
                ? PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT(payload)
                : PROMPT_FLOW_ANALYSIS_FROM_IMAGES(initialContext);

            const jsonText = await callAiApi(prompt, currentImageFiles, apiConfig);
            const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/s) || jsonText.match(/([\s\S]*)/);
            if (!jsonMatch) throw new Error("La respuesta de la API no contiene un bloque JSON válido.");

            const cleanedJsonText = jsonMatch[1] || jsonMatch[0];
            const newReportData = JSON.parse(cleanedJsonText)[0];
            
            const newReport = {
                ...newReportData,
                imageFiles: [...currentImageFiles] 
            };

            setReports(prev => {
                const newReports = [...prev, newReport];
                setActiveReportIndex(newReports.length - 1);
                return newReports;
            });

            scrollToReport();

        } catch (e) {
            setError(`Error durante el análisis: ${e.message}`);
            console.error(e);
        } finally {
            setLoading({ state: false, message: '' });
            if (refinement) setIsRefining(false);
        }
    };
    
    const handleGenerateTicket = async (stepNumber) => {
        if (!activeReport) return;
        const failedStep = activeReport.Pasos_Analizados.find(p => p.numero_paso == stepNumber);
        if (!failedStep) return;

        setLoading({ state: true, message: 'Generando borrador de ticket...' });
        setError(null);

        try {
            const prompt = PROMPT_BUG_TICKET(JSON.stringify(failedStep), JSON.stringify(activeReport));
            const ticketText = await callAiApi(prompt, [], apiConfig);
            setModal({ show: true, title: `Borrador de Ticket para Paso #${stepNumber}`, content: ticketText });
        } catch (e) {
            setError(`Error generando el ticket: ${e.message}`);
        } finally {
            setLoading({ state: false, message: '' });
        }
    };

    const handleStepDelete = (stepNumber) => {
        setReports(prev => {
            const newReports = [...prev];
            const reportToUpdate = { ...newReports[activeReportIndex] };
            reportToUpdate.Pasos_Analizados = reportToUpdate.Pasos_Analizados
                .filter(p => p.numero_paso !== stepNumber)
                .map((p, index) => ({ ...p, numero_paso: index + 1 }));
            newReports[activeReportIndex] = reportToUpdate;
            return newReports;
        });
    };

    const handleAddStep = () => {
        setReports(prev => {
            const newReports = [...prev];
            const reportToUpdate = { ...newReports[activeReportIndex] };
            const newStepNumber = reportToUpdate.Pasos_Analizados.length + 1;
            const newStep = {
                numero_paso: newStepNumber,
                descripcion_accion_observada: 'Nueva acción...',
                dato_de_entrada_paso: '',
                resultado_esperado_paso: '',
                resultado_obtenido_paso_y_estado: 'Pendiente de análisis',
                imagen_referencia_entrada: 'N/A',
                imagen_referencia_salida: 'N/A',
                isNewStep: true, // Marcar como paso nuevo para mostrar uploader
                newStepImages: [] // Array para almacenar imágenes del nuevo paso
            };
            reportToUpdate.Pasos_Analizados = [...reportToUpdate.Pasos_Analizados, newStep];
            newReports[activeReportIndex] = reportToUpdate;
            return newReports;
        });
    };

    const handleAddImageToStep = (stepNumber, imageFiles) => {
        setReports(prev => {
            const newReports = [...prev];
            const reportToUpdate = { ...newReports[activeReportIndex] };
            const stepIndex = reportToUpdate.Pasos_Analizados.findIndex(p => p.numero_paso === stepNumber);
            
            if (stepIndex !== -1) {
                const updatedStep = { ...reportToUpdate.Pasos_Analizados[stepIndex] };
                updatedStep.newStepImages = [...(updatedStep.newStepImages || []), ...imageFiles];
                reportToUpdate.Pasos_Analizados[stepIndex] = updatedStep;
                newReports[activeReportIndex] = reportToUpdate;
            }
            
            return newReports;
        });
    };

    const handleRemoveImageFromStep = (stepNumber, imageIndex) => {
        setReports(prev => {
            const newReports = [...prev];
            const reportToUpdate = { ...newReports[activeReportIndex] };
            const stepIndex = reportToUpdate.Pasos_Analizados.findIndex(p => p.numero_paso === stepNumber);
            
            if (stepIndex !== -1) {
                const updatedStep = { ...reportToUpdate.Pasos_Analizados[stepIndex] };
                updatedStep.newStepImages = (updatedStep.newStepImages || []).filter((_, index) => index !== imageIndex);
                reportToUpdate.Pasos_Analizados[stepIndex] = updatedStep;
                newReports[activeReportIndex] = reportToUpdate;
            }
            
            return newReports;
        });
    };

    const handleSaveAndRefine = () => {
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

        // Combinar imágenes originales con las nuevas imágenes de los pasos agregados
        let allImages = [...(activeReport.imageFiles || [])];
        let imageCounter = allImages.length;

        // Procesar pasos nuevos y agregar sus imágenes
        editedReport.Pasos_Analizados.forEach(step => {
            if (step.isNewStep && step.newStepImages && step.newStepImages.length > 0) {
                step.newStepImages.forEach((img, index) => {
                    imageCounter++;
                    allImages.push(img);
                    
                    // Actualizar referencias de imágenes en el paso
                    if (index === 0) {
                        step.imagen_referencia_entrada = `Imagen ${imageCounter}`;
                    } else if (index === 1) {
                        step.imagen_referencia_salida = `Imagen ${imageCounter}`;
                    }
                });
                
                // Limpiar propiedades temporales
                delete step.isNewStep;
                delete step.newStepImages;
            }
        });

        const { imageFiles, ...reportForPrompt } = editedReport;
        const editedJsonString = JSON.stringify([reportForPrompt], null, 2);
        
        setLoading({ state: true, message: 'Refinando análisis...' });
        setError(null);
        try {
            const prompt = PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT(editedJsonString);
            callAiApi(prompt, allImages, apiConfig)
                .then(jsonText => {
                    const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/s) || jsonText.match(/([\s\S]*)/);
                    if (!jsonMatch) throw new Error("La respuesta de la API no contiene un bloque JSON válido.");
                    const cleanedJsonText = jsonMatch[1] || jsonMatch[0];
                    const refinedReportData = JSON.parse(cleanedJsonText)[0];
                    
                    const refinedReport = {
                        ...refinedReportData,
                        imageFiles: allImages 
                    };

                    setReports(prev => {
                        const newReports = [...prev];
                        newReports[activeReportIndex] = refinedReport;
                        return newReports;
                    });
                })
                .catch(e => {
                    setError(`Error durante el refinamiento: ${e.message}`);
                    console.error(e);
                })
                .finally(() => {
                    setIsRefining(false);
                    setLoading({ state: false, message: '' });
                });
        } catch (e) {
             setError(`Error preparando el refinamiento: ${e.message}`);
             console.error(e);
             setLoading({ state: false, message: '' });
             setIsRefining(false);
        }
    };
    
    const closeModal = () => setModal({ show: false, title: '', content: '' });

    const selectReport = (index) => {
        setActiveReportIndex(index);
    };

    const deleteReport = (index) => {
        setReports(prev => prev.filter((_, i) => i !== index));
        if (activeReportIndex >= index) {
            setActiveReportIndex(prev => Math.max(0, prev - 1));
        }
    };

    const updateReportName = (index, newName) => {
        setReports(prev => {
            const newReports = [...prev];
            newReports[index] = { ...newReports[index], Nombre_del_Escenario: newName };
            return newReports;
        });
    };

    const isConfigVisible = showConfigurationPanel || reports.length === 0;

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
        handleGenerateTicket,
        handleStepDelete,
        handleAddStep,
        handleAddImageToStep,
        handleRemoveImageFromStep,
        handleSaveAndRefine,
        closeModal,
        reportRef,
        scrollToReport
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
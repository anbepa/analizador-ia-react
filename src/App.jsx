import React, { useState, useEffect, useMemo } from 'react';
import ConfigurationPanel from './components/ConfigurationPanel';
import ImageUploader from './components/ImageUploader';
import ReportDisplay from './components/ReportDisplay';
import RefinementControls from './components/RefinementControls';
import TicketModal from './components/TicketModal';
import { callAiApi } from './lib/apiService';
import { PROMPT_FLOW_ANALYSIS_FROM_IMAGES, PROMPT_BUG_TICKET, PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT } from './lib/prompts';
import { downloadHtmlReport } from './lib/downloadService';

function App() {
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
        setReportJson(null); // Clear previous report

        try {
            const prompt = refinement
                ? PROMPT_REFINE_FLOW_ANALYSIS_FROM_IMAGES_AND_CONTEXT(payload)
                : PROMPT_FLOW_ANALYSIS_FROM_IMAGES(initialContext);

            const jsonText = await callAiApi(prompt, imageFiles, apiConfig);

            const jsonMatch = jsonText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (!jsonMatch) throw new Error("La respuesta de la API no es un JSON válido.");

            const cleanedJsonText = jsonMatch[0];
            const newReport = JSON.parse(cleanedJsonText)[0];
            setReportJson(newReport);

        } catch (e) {
            setError(e.message);
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
            // Bug ticket generation doesn't need images
            const ticketText = await callAiApi(prompt, [], apiConfig);
            setModal({ show: true, title: `Borrador de Ticket para Paso #${stepNumber}`, content: ticketText });
        } catch (e) {
            setError(e.message);
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
                descripcion_accion_observada: '',
                dato_de_entrada_paso: '',
                resultado_esperado_paso: '',
                resultado_obtenido_paso_y_estado: '',
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

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900">Analizador de Pruebas con IA</h1>
                <p className="text-lg text-gray-600 mt-2">Analiza y refina flujos de prueba a partir de evidencias visuales.</p>
            </header>

            <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ConfigurationPanel
                        apiConfig={apiConfig}
                        setApiConfig={setApiConfig}
                        onGenerate={() => handleAnalysis(false)}
                        onRefine={() => setIsRefining(true)}
                        onDownload={() => downloadHtmlReport(reportJson, imageFiles)}
                        canGenerate={canGenerate}
                        canRefine={canRefine}
                        canDownload={canDownload}
                        isRefining={isRefining}
                    />
                    <ImageUploader
                        imageFiles={imageFiles}
                        setImageFiles={setImageFiles}
                        initialContext={initialContext}
                        setInitialContext={setInitialContext}
                    />
                </div>

                <div className="space-y-8">
                     <ReportDisplay
                        reportJson={reportJson}
                        imageFiles={imageFiles}
                        loading={loading}
                        error={error}
                        isRefining={isRefining}
                        onAddStep={handleAddStep}
                        onGenerateTicket={handleGenerateTicket}
                        onStepDelete={handleStepDelete}
                    />
                    {isRefining && <RefinementControls
                        userContext={userContext}
                        setUserContext={setUserContext}
                        onCancel={() => setIsRefining(false)}
                        onSaveAndRefine={handleSaveAndRefine}
                    />}
                </div>
            </div>

            <TicketModal
                show={modal.show}
                title={modal.title}
                content={modal.content}
                onClose={() => setModal({ show: false, title: '', content: '' })}
            />
        </div>
    );
}

export default App;
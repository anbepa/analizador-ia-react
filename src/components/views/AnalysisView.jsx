import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import ImageUploader from '../ImageUploader';

const AnalysisView = () => {
    const {
        currentImageFiles,
        setCurrentImageFiles,
        initialContext,
        setInitialContext,
        handleAnalysis,
        loading,
        canGenerate,
        // HU Management
        analysisUserStory,
        setAnalysisUserStory,
        handleUserStorySearch,
        handleUserStoryCreate,
        // Model Selection
        selectedModel,
        setSelectedModel,
        // Auth
        session,
        handleLogin,
        handleLogout
    } = useAppContext();

    // Local state for User Story selector
    const [storyNumber, setStoryNumber] = useState('');
    const [storyTitle, setStoryTitle] = useState('');
    const [isExistingStory, setIsExistingStory] = useState(false);
    const [storyError, setStoryError] = useState('');

    // Efecto para cargar datos si ya hay una HU seleccionada
    useEffect(() => {
        if (analysisUserStory) {
            setStoryNumber(analysisUserStory.numero.toString());
            setStoryTitle(analysisUserStory.title);
            setIsExistingStory(!analysisUserStory.isNew);
        }
    }, [analysisUserStory]);

    const handleNumberChange = async (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setStoryNumber(value);
        setStoryError('');

        if (value.length > 0) {
            // Buscar si existe
            const stories = await handleUserStorySearch(value);
            const exactMatch = stories.find(s => s.numero === parseInt(value));

            if (exactMatch) {
                setStoryTitle(exactMatch.title);
                setIsExistingStory(true);
                setAnalysisUserStory(exactMatch);
                setStoryError('HU encontrada en base de datos.');
            } else {
                setStoryTitle('');
                setIsExistingStory(false);
                setAnalysisUserStory(null);
            }
        } else {
            setStoryTitle('');
            setIsExistingStory(false);
            setAnalysisUserStory(null);
        }
    };

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setStoryTitle(newTitle);

        if (!isExistingStory && storyNumber) {
            setAnalysisUserStory({
                numero: parseInt(storyNumber),
                title: newTitle,
                isNew: true
            });
        }
    };

    const handleRemoveFile = (indexToRemove) => {
        setCurrentImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const contextSuggestions = [
        "Pruebas de regresión",
        "Validación de UI",
        "Flujo crítico",
        "Error en producción",
        "Happy Path"
    ];

    const addContext = (text) => {
        setInitialContext(prev => prev ? `${prev} ${text}` : text);
    };

    const hasEvidence = currentImageFiles.length > 0;
    const hasUserStory = !!analysisUserStory;

    return (
        <div className="min-h-screen bg-[#F5F5F7] pt-4 px-6 lg:px-10 font-sans text-secondary-900">
            <div className="max-w-[1600px] mx-auto space-y-5">
                {/* Header Section */}
                <div className="flex flex-col gap-1.5 animate-fade-in">
                    <h1 className="text-4xl font-bold tracking-tight text-secondary-900">Análisis de Evidencias</h1>
                    <p className="text-[15px] text-[#656565] font-medium">Sube capturas o videos y la IA generará automáticamente hallazgos, pasos, errores y recomendaciones.</p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start transition-all duration-500 ease-in-out">

                    {/* Left Column - Evidence Management */}
                    <div className={`lg:col-span-8 space-y-8 animate-fade-in transition-opacity duration-300 ${loading.state ? 'opacity-50 pointer-events-none' : ''}`}>
                        {/* Upload Section */}
                        <div className="bg-gradient-to-b from-white to-[#FCFCFD] border border-[#E6E6E8] shadow-sm rounded-[24px] p-5 transition-all duration-300 hover:shadow-md">
                            
                            {/* Historia de Usuario y Contexto (Ultra Compacta y Etiquetada) */}
                            <div className="flex flex-col xl:flex-row gap-3 mb-6">
                                <div className="flex gap-2">
                                    {/* Número HU */}
                                    <div className="flex flex-col gap-1 w-24 shrink-0">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide ml-1">Nº HU</label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-secondary-400 font-bold">HU-</span>
                                            <input
                                                type="text"
                                                value={storyNumber}
                                                onChange={handleNumberChange}
                                                disabled={loading.state}
                                                placeholder="1234"
                                                className={`w-full pl-8 pr-2 py-1.5 bg-secondary-50/50 border border-secondary-200 rounded-lg transition-all text-xs font-bold text-secondary-900 ${loading.state ? 'opacity-60 cursor-not-allowed' : 'focus:ring-1 focus:ring-primary focus:border-primary hover:border-secondary-300'}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Título HU */}
                                    <div className="flex flex-col gap-1 w-48 xl:w-56 shrink-0">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide ml-1">Título</label>
                                        <input
                                            type="text"
                                            value={storyTitle}
                                            onChange={handleTitleChange}
                                            disabled={isExistingStory || loading.state}
                                            placeholder="Ej. Login Fallido..."
                                            className={`w-full py-1.5 px-3 bg-secondary-50/50 border border-secondary-200 rounded-lg transition-all text-xs font-medium ${(isExistingStory || loading.state) ? 'opacity-60 cursor-not-allowed' : 'focus:ring-1 focus:ring-primary focus:border-primary hover:border-secondary-300'}`}
                                        />
                                    </div>
                                </div>

                                {/* Contexto Adicional */}
                                {hasUserStory && (
                                    <div className="flex flex-col gap-1 flex-1 animate-fade-in relative">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide ml-1">Contexto Adicional</label>
                                        <input
                                            type="text"
                                            value={initialContext}
                                            onChange={(e) => setInitialContext(e.target.value)}
                                            disabled={loading.state}
                                            placeholder="Detalles extra para el análisis..."
                                            className={`w-full py-1.5 px-3 bg-secondary-50/50 border border-secondary-200 rounded-lg transition-all text-xs font-medium ${loading.state ? 'opacity-60 cursor-not-allowed' : 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-secondary-300'}`}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Mostrar el error de forma super sutil si lo hay */}
                            {storyError && (
                                <div className={`-mt-4 mb-4 text-[10px] font-medium px-2 ${isExistingStory ? 'text-green-600' : 'text-red-500'}`}>
                                    {storyError}
                                </div>
                            )}

                            {/* Zona de Subida de Archivos (PROTAGONISTA) */}
                            <div className="pt-0">
                                <ImageUploader />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Control Panel (Sticky Sidebar) */}
                    <div className="lg:col-span-4 lg:sticky lg:top-6 animate-fade-in mt-8 lg:mt-0 z-40 relative">
                        <div className="bg-secondary-50/80 backdrop-blur-xl border border-secondary-200/60 shadow-lg rounded-[24px] overflow-hidden transition-all duration-300">
                            
                            {/* Encabezado del Panel */}
                            <div className="px-5 pt-5 pb-2">
                                <h3 className="text-sm font-bold text-secondary-900 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Resumen de Análisis
                                </h3>
                            </div>

                            {/* Section: Resumen y Acciones */}
                            <div className="p-5 space-y-5">
                                {/* Estado de Evidencias y Modelo */}
                                <div className="space-y-3">
                                    {/* Evidencias */}
                                    <div className="p-3.5 bg-white rounded-xl border border-secondary-100 shadow-sm flex items-center justify-between transition-all">
                                        <span className="text-xs font-bold text-secondary-500 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Archivos listos
                                        </span>
                                        <div key={currentImageFiles.length} className="animate-pulse-once bg-primary/10 text-primary px-2.5 py-1 rounded-md text-sm font-black">
                                            {currentImageFiles.length}
                                        </div>
                                    </div>
                                    
                                    {/* Selector Modelo IA */}
                                    <div className="p-3.5 bg-white rounded-xl border border-secondary-100 shadow-sm relative group cursor-pointer hover:border-primary/30 transition-colors">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-secondary-400 block mb-1">Motor IA</span>
                                        <div className="relative">
                                            <select 
                                                value={selectedModel}
                                                onChange={(e) => setSelectedModel(e.target.value)}
                                                disabled={loading.state}
                                                className={`w-full text-xs font-bold text-secondary-900 bg-transparent border-none p-0 pr-6 focus:ring-0 appearance-none ${loading.state ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <option value="gpt-4o">Copilot (GPT-4o) - Muy Rápido</option>
                                                <option value="gpt-4.1">Copilot (GPT-4.1) - Balanceado</option>
                                                <option value="gpt-4">Copilot (GPT-4) - Más Preciso</option>
                                            </select>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAnalysis}
                                    disabled={!canGenerate || loading.state}
                                    className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${canGenerate && !loading.state
                                        ? 'bg-[#007AFF] text-white shadow-blue-500/20 hover:bg-[#007AFF]/90 active:scale-[0.98]'
                                        : 'bg-secondary-200 text-secondary-500 cursor-not-allowed'
                                        }`}
                                >
                                    {loading.state ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Analizando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Generar Análisis</span>
                                            {currentImageFiles.length > 0 && (
                                                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                                                    {currentImageFiles.length}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </button>

                                {loading.state && (
                                    <p className="text-[11px] text-center text-primary animate-pulse font-bold">
                                        {loading.message || 'Procesando evidencias...'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisView;

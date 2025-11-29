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
        handleUserStoryCreate
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
                    <h1 className="text-[32px] font-semibold tracking-tight text-secondary-900">Análisis de Evidencias</h1>
                    <p className="text-sm text-secondary-500">A partir de evidencias visuales o pequeños videos documenta un escenario de prueba basado con IA.</p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start transition-all duration-500 ease-in-out">

                    {/* Left Column - Evidence (Full width if empty, 8/12 if populated) */}
                    <div className={`${hasEvidence ? 'lg:col-span-8' : 'lg:col-span-12 max-w-[960px] mx-auto mt-20'} space-y-8 transition-all duration-500`}>
                        {/* Upload Section */}
                        <div className={`bg-gradient-to-b from-white to-[#FCFCFD] border border-[#E6E6E8] shadow-sm rounded-[24px] transition-all duration-300 hover:shadow-md ${hasEvidence ? 'p-6' : 'p-6 py-8'}`}>
                            {hasEvidence && (
                                <div className="flex items-center justify-between mb-6 animate-fade-in">
                                    <h2 className="text-xl font-semibold text-secondary-900 flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </span>
                                        Gestión de Evidencias
                                    </h2>
                                </div>
                            )}
                            <ImageUploader />
                        </div>
                    </div>

                    {/* Right Column - Actions, Tips & Context (Progressive Disclosure) */}
                    {hasEvidence && (
                        <div className="lg:col-span-4 space-y-6 sticky top-6 animate-fade-in self-start">

                            {/* User Story Selector Section */}
                            <div className="relative overflow-hidden rounded-[24px] border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white/80 backdrop-blur-xl transition-all duration-300">
                                <div className="relative z-10 p-5">
                                    <h3 className="text-[17px] font-semibold text-secondary-900 mb-4 flex items-center gap-2.5">
                                        <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </span>
                                        Historia de Usuario
                                    </h3>

                                    {!hasUserStory && (
                                        <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100/60 rounded-xl flex gap-3 items-start">
                                            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-xs text-blue-600/90 leading-relaxed">
                                                Ingresa el número de HU para vincular las evidencias automáticamente.
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-500 mb-1.5 ml-1">Número de HU</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 font-medium">HU-</span>
                                                <input
                                                    type="text"
                                                    value={storyNumber}
                                                    onChange={handleNumberChange}
                                                    placeholder="1234"
                                                    className="w-full pl-12 p-3.5 bg-white border border-secondary-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#60A5FA] transition-all text-secondary-900 placeholder-secondary-400 text-sm font-medium outline-none"
                                                />
                                            </div>
                                            {storyError && (
                                                <p className={`text-xs mt-1.5 ml-1 font-medium ${isExistingStory ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {storyError}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-secondary-500 mb-1.5 ml-1">Título descriptivo</label>
                                            <input
                                                type="text"
                                                value={storyTitle}
                                                onChange={handleTitleChange}
                                                disabled={isExistingStory}
                                                placeholder="Descripción de la funcionalidad..."
                                                className={`w-full p-3.5 bg-white border border-secondary-200 rounded-xl transition-all text-secondary-900 placeholder-secondary-400 text-sm outline-none ${isExistingStory ? 'opacity-60 cursor-not-allowed bg-secondary-50' : 'focus:ring-4 focus:ring-blue-100 focus:border-[#60A5FA]'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Context Input Section - Visible only after HU is entered */}
                            {hasUserStory && (
                                <div className="relative overflow-hidden rounded-[24px] border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white/80 backdrop-blur-xl animate-fade-in">
                                    <div className="relative z-10 p-5">
                                        <h3 className="text-[17px] font-semibold text-secondary-900 mb-3 flex items-center gap-2.5">
                                            <span className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                </svg>
                                            </span>
                                            Contexto Adicional
                                        </h3>

                                        <div className="mb-3 flex flex-wrap gap-2">
                                            {contextSuggestions.map((suggestion) => (
                                                <button
                                                    key={suggestion}
                                                    onClick={() => addContext(suggestion)}
                                                    className="px-2.5 py-1 text-[11px] font-medium text-secondary-600 bg-white border border-secondary-200 rounded-full hover:bg-secondary-50 hover:border-secondary-300 transition-colors"
                                                >
                                                    + {suggestion}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative mb-4">
                                            <textarea
                                                value={initialContext}
                                                onChange={(e) => setInitialContext(e.target.value)}
                                                placeholder="Escribe información que ayude al análisis..."
                                                className="w-full p-3.5 bg-white border border-secondary-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#60A5FA] transition-all resize-none text-secondary-900 placeholder-secondary-400 text-sm leading-relaxed min-h-[80px] outline-none"
                                            />
                                        </div>

                                        {/* Generar Análisis Button */}
                                        <button
                                            onClick={handleAnalysis}
                                            disabled={!canGenerate || loading.state}
                                            className={`w-full py-3.5 px-6 rounded-full font-semibold text-[15px] transition-all duration-300 transform flex items-center justify-center gap-2 shadow-sm ${canGenerate && !loading.state
                                                ? 'bg-[#007AFF] text-white hover:bg-[#0071E3] hover:shadow-md active:scale-[0.98]'
                                                : 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
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
                                                        <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-medium">
                                                            {currentImageFiles.length}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </button>

                                        {/* Status Messages */}
                                        <div className="mt-2 min-h-[20px]">
                                            {loading.state && (
                                                <p className="text-[11px] text-center text-[#007AFF] animate-pulse font-medium">
                                                    {loading.message || 'Procesando evidencias...'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalysisView;

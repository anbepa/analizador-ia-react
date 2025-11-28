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
                    <h1 className="text-4xl font-bold tracking-tight text-secondary-900">Análisis de Evidencias</h1>
                    <p className="text-[15px] text-[#656565] font-medium">Sube capturas o videos y la IA generará automáticamente hallazgos, pasos, errores y recomendaciones.</p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start transition-all duration-500 ease-in-out">

                    {/* Left Column - Evidence (Full width if empty, 8/12 if populated) */}
                    <div className={`${hasEvidence ? 'lg:col-span-8' : 'lg:col-span-12 max-w-4xl mx-auto'} space-y-8 transition-all duration-500`}>
                        {/* Upload Section */}
                        <div className={`bg-gradient-to-b from-white to-[#FCFCFD] border border-[#E6E6E8] shadow-sm rounded-[24px] transition-all duration-300 hover:shadow-md ${hasEvidence ? 'p-6' : 'p-10 py-16'}`}>
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

                        {!hasEvidence && (
                            <div className="mt-10 flex flex-col items-center animate-fade-in">
                                <p className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-6">Cómo funciona</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-3xl w-full">
                                    <div className="flex flex-col items-center text-center gap-3 group">
                                        <div className="w-10 h-10 rounded-2xl bg-white border border-secondary-100 shadow-sm flex items-center justify-center text-secondary-900 font-semibold group-hover:scale-110 group-hover:border-blue-200 group-hover:text-[#007AFF] transition-all duration-300">1</div>
                                        <p className="text-sm text-secondary-600 font-medium">Sube capturas o inicia<br />una sesión de captura</p>
                                    </div>
                                    <div className="flex flex-col items-center text-center gap-3 group">
                                        <div className="w-10 h-10 rounded-2xl bg-white border border-secondary-100 shadow-sm flex items-center justify-center text-secondary-900 font-semibold group-hover:scale-110 group-hover:border-blue-200 group-hover:text-[#007AFF] transition-all duration-300">2</div>
                                        <p className="text-sm text-secondary-600 font-medium">Ingresa el número de HU<br /><span className="text-secondary-400 font-normal">(Opcional al inicio)</span></p>
                                    </div>
                                    <div className="flex flex-col items-center text-center gap-3 group">
                                        <div className="w-10 h-10 rounded-2xl bg-white border border-secondary-100 shadow-sm flex items-center justify-center text-secondary-900 font-semibold group-hover:scale-110 group-hover:border-blue-200 group-hover:text-[#007AFF] transition-all duration-300">3</div>
                                        <p className="text-sm text-secondary-600 font-medium">La IA genera un análisis<br />completo por ti</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Actions, Tips & Context (Progressive Disclosure) */}
                    {hasEvidence && (
                        <div className="lg:col-span-4 space-y-6 sticky top-6 animate-fade-in">

                            {/* User Story Selector Section */}
                            <div className="relative overflow-hidden rounded-[20px] border border-white/40 shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] group bg-white/60 backdrop-blur-md">
                                <div className="relative z-10 p-6">
                                    <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                        </span>
                                        Historia de Usuario
                                    </h3>

                                    {!hasUserStory && (
                                        <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3 items-start">
                                            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-xs text-blue-700 leading-relaxed">
                                                Ingresa el número de HU para vincular las evidencias automáticamente.
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-500 mb-1 ml-1">Número de HU</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 font-medium">HU-</span>
                                                <input
                                                    type="text"
                                                    value={storyNumber}
                                                    onChange={handleNumberChange}
                                                    placeholder="1234"
                                                    className="w-full pl-12 p-4 bg-white/50 border border-secondary-200/60 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-secondary-900 placeholder-secondary-400 text-sm font-medium"
                                                />
                                            </div>
                                            {storyError && (
                                                <p className={`text-xs mt-1 ml-1 ${isExistingStory ? 'text-green-600' : 'text-red-500'}`}>
                                                    {storyError}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-secondary-500 mb-1 ml-1">Título descriptivo</label>
                                            <input
                                                type="text"
                                                value={storyTitle}
                                                onChange={handleTitleChange}
                                                disabled={isExistingStory}
                                                placeholder="Descripción de la funcionalidad..."
                                                className={`w-full p-4 bg-white/50 border border-secondary-200/60 rounded-2xl transition-all text-secondary-900 placeholder-secondary-400 text-sm ${isExistingStory ? 'opacity-60 cursor-not-allowed bg-secondary-50' : 'focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Context Input Section - Visible only after HU is entered */}
                            {hasUserStory && (
                                <div className="relative overflow-hidden rounded-[20px] border border-white/40 shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] group bg-white/60 backdrop-blur-md animate-fade-in">
                                    <div className="relative z-10 p-6">
                                        <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </span>
                                            Contexto Adicional
                                        </h3>

                                        <div className="mb-3 flex flex-wrap gap-2">
                                            {contextSuggestions.map((suggestion) => (
                                                <button
                                                    key={suggestion}
                                                    onClick={() => addContext(suggestion)}
                                                    className="px-3 py-1 text-xs font-medium text-secondary-600 bg-white border border-secondary-200 rounded-full hover:bg-secondary-50 hover:border-secondary-300 transition-colors"
                                                >
                                                    + {suggestion}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative">
                                            <textarea
                                                value={initialContext}
                                                onChange={(e) => setInitialContext(e.target.value)}
                                                placeholder="Escribe información que ayude al análisis..."
                                                className="w-full p-4 bg-white/50 border border-secondary-200/60 rounded-2xl focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] transition-all resize-none text-secondary-900 placeholder-secondary-400 text-sm leading-relaxed min-h-[100px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Main Action Card - Visible only after HU is entered */}
                            {hasUserStory && (
                                <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.04)] rounded-[20px] p-8 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] animate-fade-in">
                                    <h3 className="text-lg font-semibold text-secondary-900 mb-6 px-2">Resumen del Análisis</h3>

                                    <div className="space-y-4 mb-8">
                                        {analysisUserStory && (
                                            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100/50 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">HU</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-purple-900">{analysisUserStory.code}</span>
                                                        <span className="text-[10px] text-purple-700 truncate max-w-[150px]">{analysisUserStory.title}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-secondary-100/50 shadow-sm">
                                            <span className="text-secondary-500 font-medium">Evidencias</span>
                                            <span className="text-lg font-bold text-secondary-900">{currentImageFiles.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-secondary-100/50 shadow-sm">
                                            <span className="text-secondary-500 font-medium">Modelo IA</span>
                                            <span className="text-sm font-semibold text-[#007AFF] bg-blue-50 px-3 py-1 rounded-full">Gemini 2.0</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAnalysis}
                                        disabled={!canGenerate || loading.state}
                                        className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 transform flex items-center justify-center gap-3 shadow-lg ${canGenerate && !loading.state
                                            ? 'bg-[#007AFF] text-white shadow-blue-500/30 hover:shadow-blue-500/40 hover:bg-[#007AFF]/90 hover:scale-[1.02] active:scale-[0.98]'
                                            : 'bg-secondary-200 text-secondary-400 cursor-not-allowed opacity-35 border border-black/5'
                                            }`}
                                    >
                                        {loading.state ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Analizando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Generar Análisis</span>
                                                {currentImageFiles.length > 0 && (
                                                    <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">
                                                        {currentImageFiles.length}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </button>

                                    {/* Status Messages */}
                                    <div className="mt-4 min-h-[24px]">
                                        {loading.state && (
                                            <p className="text-xs text-center text-[#007AFF] animate-pulse font-medium">
                                                {loading.message || 'Procesando evidencias...'}
                                            </p>
                                        )}
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

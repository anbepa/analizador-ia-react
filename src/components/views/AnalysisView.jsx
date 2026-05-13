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

                {/* Main Content (Full Width) */}
                <div className="space-y-6 animate-fade-in transition-all duration-500 ease-in-out">
                    
                    {/* Input Header - Compact Row */}
                    <div className="bg-white border border-[#E6E6E8] shadow-sm rounded-[24px] p-4 transition-all duration-300 hover:shadow-md">
                        <div className="flex flex-col md:flex-row items-end gap-4">
                            {/* HU & Title Group */}
                            <div className="flex gap-3 flex-1 w-full md:w-auto">
                                {/* Número HU */}
                                <div className="flex flex-col gap-1 w-28 shrink-0">
                                    <label className="text-[11px] font-bold text-secondary-600 uppercase tracking-wide ml-1">Nº HU</label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-secondary-400 font-bold group-focus-within:text-primary transition-colors">HU-</span>
                                        <input
                                            type="text"
                                            value={storyNumber}
                                            onChange={handleNumberChange}
                                            disabled={loading.state}
                                            placeholder="1234"
                                            className={`w-full pl-9 pr-8 py-2 bg-secondary-50/50 border border-secondary-200 rounded-xl transition-all text-xs font-bold text-secondary-900 ${loading.state ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-secondary-300'}`}
                                        />
                                        {isExistingStory && (
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500 animate-bounce-in">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Título HU */}
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-[11px] font-bold text-secondary-600 uppercase tracking-wide ml-1">Título de la Prueba</label>
                                    <input
                                        type="text"
                                        value={storyTitle}
                                        onChange={handleTitleChange}
                                        disabled={isExistingStory || loading.state}
                                        placeholder="Ej. Validación de flujo de pago..."
                                        className={`w-full py-2 px-4 bg-secondary-50/50 border border-secondary-200 rounded-xl transition-all text-xs font-semibold ${(isExistingStory || loading.state) ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-secondary-300'}`}
                                    />
                                </div>
                            </div>

                            {/* Contexto Adicional */}
                            <div className="flex flex-col gap-1 flex-[1.5] w-full md:w-auto">
                                <label className="text-[11px] font-bold text-secondary-600 uppercase tracking-wide ml-1">Contexto Adicional (Opcional)</label>
                                <input
                                    type="text"
                                    value={initialContext}
                                    onChange={(e) => setInitialContext(e.target.value)}
                                    disabled={loading.state}
                                    placeholder="Agrega detalles específicos para guiar a la IA..."
                                    className={`w-full py-2 px-4 bg-secondary-50/50 border border-secondary-200 rounded-xl transition-all text-xs font-medium ${loading.state ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-secondary-300'}`}
                                />
                            </div>
                        </div>

                        {/* Story Error / Feedback ultra-compacto */}
                        {storyError && (
                            <div className={`mt-2 text-[10px] font-bold px-2 flex items-center gap-1.5 ${isExistingStory ? 'text-green-600' : 'text-red-500'}`}>
                                {!isExistingStory && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                {storyError}
                            </div>
                        )}
                    </div>

                    {/* Evidence & Upload Area */}
                    <div className={`space-y-6 transition-opacity duration-300 ${loading.state ? 'opacity-50 pointer-events-none' : ''}`}>
                        <ImageUploader />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisView;

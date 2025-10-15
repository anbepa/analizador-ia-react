import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { downloadHtmlReport } from '../lib/downloadService';
import DatabaseStatus from './DatabaseStatus';
import ImageUploader from './ImageUploader';

function ConfigurationPanel({ mode = 'full' }) {
    const {
        apiConfig,
        setApiConfig,
        handleAnalysis,
        canGenerate,
        canRefine,
        canDownload,
        activeReport,
        reports,
        // Refinement related states and functions
        isRefining,
        setIsRefining,
        userContext,
        setUserContext,
        handleSaveAndRefine,
        loading,
        currentImageFiles,
        // Work mode
        workMode,
        switchWorkMode,
        manualReport,
        updateManualReport,
        addManualStep,
        saveManualReport,
        clearManualReport
    } = useAppContext();

    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    
    // Handle refinement button - toggles manual mode first, then executes refinement
    const handleRefinementClick = () => {
        if (!isRefining) {
            // First click: Enable manual editing mode
            setIsRefining(true);
        } else {
            // Second click: Execute refinement with manual changes
            handleSaveAndRefine();
        }
    };
    
    // Handle provider change
    const handleProviderChange = (e) => {
        const newProvider = e.target.value;
        setApiConfig(prev => ({ ...prev, provider: newProvider }));
    };

    // Handle API key change
    const handleApiKeyChange = (e) => {
        const newKey = e.target.value;
        setApiConfig(prev => ({
            ...prev,
            [apiConfig.provider]: { ...prev[apiConfig.provider], key: newKey }
        }));
    };

    // Handle model change
    const handleModelChange = (e) => {
        const newModel = e.target.value;
        setApiConfig(prev => ({
            ...prev,
            [apiConfig.provider]: { ...prev[apiConfig.provider], model: newModel }
        }));
    };

    // Save configuration to localStorage
    const handleSaveConfig = () => {
        localStorage.setItem('aiConfig', JSON.stringify(apiConfig));
        alert('Configuración guardada exitosamente');
    };

    // Download options
    const handleDownloadClick = () => {
        setShowDownloadOptions(!showDownloadOptions);
    };

    const handleDownloadHtml = () => {
        downloadHtmlReport(activeReport);
        setShowDownloadOptions(false);
    };

    // Get available models for current provider
    const getAvailableModels = () => {
        switch (apiConfig.provider) {
            case 'gemini':
                return [
                    { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash (Latest)' },
                    { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro (Latest)' },
                    { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
                    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }
                ];
            case 'openai':
                return [
                    { value: 'gpt-4o', label: 'GPT-4o' },
                    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                    { value: 'gpt-4', label: 'GPT-4' },
                    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
                ];
            case 'claude':
                return [
                    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
                    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
                    { value: 'claude-2.1', label: 'Claude 2.1' }
                ];
            default:
                return [];
        }
    };

    // Simple mode for sidebar actions
    if (mode === 'actions') {
        return (
            <div className="space-y-3">
                <button
                    onClick={handleAnalysis}
                    disabled={!canGenerate || loading.state}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                        canGenerate && !loading.state
                            ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md hover:shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {loading.state ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Generando...</span>
                        </div>
                    ) : (
                        <>
                            🚀 Generar Escenarios
                        </>
                    )}
                </button>

                <button
                    onClick={handleRefinementClick}
                    disabled={!canRefine || loading.state}
                    className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                        canRefine && !loading.state
                            ? (isRefining ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700')
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {isRefining ? '✅ Aplicar Refinamiento' : '🔧 Refinar Escenarios'}
                </button>

                {isRefining && (
                    <button
                        onClick={() => setIsRefining(false)}
                        className="w-full py-2 px-4 rounded-lg font-medium text-sm bg-gray-500 text-white hover:bg-gray-600 transition-all duration-200"
                    >
                        ❌ Cancelar Refinamiento
                    </button>
                )}

                <div className="relative">
                    <button
                        onClick={handleDownloadClick}
                        disabled={!canDownload}
                        className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                            canDownload
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        📄 Descargar Reporte
                    </button>
                    
                    {showDownloadOptions && canDownload && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                            <button
                                onClick={handleDownloadHtml}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                            >
                                📄 HTML
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Workspace sidebar actions - Área de Trabajo
    if (mode === 'workspace') {
        return (
            <div className="h-full flex flex-col bg-white">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-lg font-semibold text-slate-800">📁 Área de Trabajo</h2>
                    <p className="text-sm text-slate-600 mt-1">Cargar imágenes y generar análisis</p>
                </div>

                {/* Image Upload Section */}
                <div className="p-4 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="text-md font-semibold text-slate-800 mb-3">
                            📷 Cargar Imagen
                        </h3>
                        <ImageUploader />
                    </div>
                </div>

                {/* Action buttons */}
                <div className="p-4 space-y-3 border-t border-slate-200">
                    <button
                        onClick={handleAnalysis}
                        disabled={!canGenerate || loading.state}
                        className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                            canGenerate && !loading.state
                                ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md hover:shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {loading.state ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                <span>Analizando...</span>
                            </div>
                        ) : (
                            <>
                                🔍 Analizar Imagen
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleRefinementClick}
                        disabled={!canRefine || loading.state}
                        className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                            canRefine && !loading.state
                                ? (isRefining ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700')
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isRefining ? '✅ Aplicar Refinamiento' : '🔧 Refinar Análisis'}
                    </button>

                    {isRefining && (
                        <button
                            onClick={() => setIsRefining(false)}
                            className="w-full py-2 px-4 rounded-lg font-medium text-sm bg-gray-500 text-white hover:bg-gray-600 transition-all duration-200"
                        >
                            ❌ Cancelar Refinamiento
                        </button>
                    )}

                    <div className="relative">
                        <button
                            onClick={handleDownloadClick}
                            disabled={!canDownload}
                            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                                canDownload
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            📄 Descargar Reporte
                        </button>
                        
                        {showDownloadOptions && canDownload && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                <button
                                    onClick={handleDownloadHtml}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                                >
                                    📄 HTML
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Refinement Context - Optional */}
                {canRefine && (
                    <div className={`p-4 border-t border-slate-200 ${isRefining ? 'bg-blue-50' : 'bg-slate-50'}`}>
                        {isRefining && (
                            <div className="mb-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800 font-medium">
                                    🔧 Modo de refinamiento activado
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Ahora puedes editar manualmente el reporte. Haz clic en "Aplicar Refinamiento" cuando termines.
                                </p>
                            </div>
                        )}
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            💬 Contexto para refinamiento:
                        </label>
                        <textarea
                            value={userContext}
                            onChange={(e) => setUserContext(e.target.value)}
                            placeholder="Proporciona contexto adicional para mejorar el análisis..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[80px] resize-vertical"
                            disabled={loading.state}
                        />
                    </div>
                )}
            </div>
        );
    }

    // Full configuration mode - Panel de Control
    if (mode === 'full') {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Configuración del Sistema</h2>
                        
                        {/* Work Mode Selection */}
                        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">🔧 Modo de Trabajo</h3>
                            <div className="flex items-center space-x-6">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="workMode"
                                        value="ai"
                                        checked={workMode === 'ai'}
                                        onChange={(e) => switchWorkMode(e.target.value)}
                                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xl">🤖</span>
                                        <div>
                                            <span className="font-medium text-slate-800">Modo IA</span>
                                            <p className="text-sm text-slate-600">Análisis automático con inteligencia artificial</p>
                                        </div>
                                    </div>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="workMode"
                                        value="manual"
                                        checked={workMode === 'manual'}
                                        onChange={(e) => switchWorkMode(e.target.value)}
                                        className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xl">✍️</span>
                                        <div>
                                            <span className="font-medium text-slate-800">Modo Manual</span>
                                            <p className="text-sm text-slate-600">Creación manual de reportes</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* API Configuration */}
                        {workMode === 'ai' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Proveedor de IA</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Proveedor
                                        </label>
                                        <select
                                            value={apiConfig.provider}
                                            onChange={handleProviderChange}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        >
                                            <option value="gemini">🔮 Google Gemini</option>
                                            <option value="openai">🚀 OpenAI</option>
                                            <option value="claude">🧠 Anthropic Claude</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Modelo
                                        </label>
                                        <select
                                            value={apiConfig[apiConfig.provider]?.model || ''}
                                            onChange={handleModelChange}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        >
                                            {getAvailableModels().map(model => (
                                                <option key={model.value} value={model.value}>
                                                    {model.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        🔑 Clave API
                                    </label>
                                    <input
                                        type="password"
                                        value={apiConfig[apiConfig.provider]?.key || ''}
                                        onChange={handleApiKeyChange}
                                        placeholder={`Clave API de ${apiConfig.provider.charAt(0).toUpperCase() + apiConfig.provider.slice(1)}`}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                                
                                <button
                                    onClick={handleSaveConfig}
                                    className="mt-4 bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors"
                                >
                                    💾 Guardar Configuración
                                </button>
                            </div>
                        )}

                        {/* Manual Mode Content */}
                        {workMode === 'manual' && (
                            <div className="space-y-6">
                                <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4">✍️ Modo Manual</h3>
                                    <p className="text-slate-700 mb-4">
                                        En modo manual, puedes crear reportes de análisis de QA escribiendo directamente el contenido sin usar IA.
                                    </p>
                                    <button
                                        onClick={saveManualReport}
                                        disabled={!manualReport.Nombre_del_Escenario.trim()}
                                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                            manualReport.Nombre_del_Escenario.trim()
                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        💾 Guardar Reporte Manual
                                    </button>
                                    {manualReport.Nombre_del_Escenario.trim() && (
                                        <button
                                            onClick={clearManualReport}
                                            className="ml-3 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                        >
                                            🗑️ Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                            
                        {/* Database Status */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Estado de la Base de Datos</h3>
                            <DatabaseStatus />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default: return null for unsupported modes
    return null;
}

export default ConfigurationPanel;
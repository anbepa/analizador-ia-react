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
        // Refinement related states and functions
        isRefining,
        setIsRefining,
        userContext,
        setUserContext,
        handleSaveAndRefine,
        loading,
        currentImageFiles
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

    // Full configuration mode
    if (mode === 'full') {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Configuración del Sistema</h2>
                        
                        {/* API Configuration */}
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
                            
                            {/* Database Status */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Estado de la Base de Datos</h3>
                                <DatabaseStatus />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Workspace sidebar mode
    if (mode === 'workspace') {
        return (
            <div className="h-full flex flex-col bg-white">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-lg font-semibold text-slate-800">📁 Área de Trabajo</h2>
                    <p className="text-sm text-slate-600 mt-1">Cargar imágenes y generar análisis</p>
                </div>

                {/* Action buttons - Moved to top */}
                <div className="p-4 space-y-3 border-b border-slate-200">
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

                {/* Image Upload Section - Moved below action buttons */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="text-md font-semibold text-slate-800 mb-3">
                            📷 Cargar Imagen
                        </h3>
                        <ImageUploader />
                    </div>
                </div>
            </div>
        );
    }

    // Default: return null for unsupported modes
    return null;
}

export default ConfigurationPanel;
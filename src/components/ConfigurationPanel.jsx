import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { downloadHtmlReport } from '../lib/downloadService';
import ImageUploader from './ImageUploader';

function ConfigurationPanel({ mode = 'workspace' }) {
    const {
        handleAnalysis,
        canGenerate,
        canRefine,
        canDownload,
        activeReport,
        // Refinement related states and functions
        isRefining,
        setIsRefining,
        handleSaveAndRefine,
        loading
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

    // Download options
    const handleDownloadClick = () => {
        setShowDownloadOptions(!showDownloadOptions);
    };

    const handleDownloadHtml = () => {
        downloadHtmlReport(activeReport);
        setShowDownloadOptions(false);
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

    // Default to workspace layout when an unsupported mode is provided
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

export default ConfigurationPanel;

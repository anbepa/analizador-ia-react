import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { downloadHtmlReport } from '../lib/downloadService';
import ReportList from './ReportList';

function ConfigurationPanel({ mode = 'workspace', onOpenUploadModal }) {
    const {
        handleAnalysis,
        canGenerate,
        canRefine,
        canDownload,
        activeReport,
        isRefining,
        setIsRefining,
        handleSaveAndRefine,
        loading,
        currentImageFiles,
        userContext,
        setUserContext
    } = useAppContext();

    const [showDownloadOptions, setShowDownloadOptions] = useState(false);

    const handleRefinementClick = () => {
        if (!isRefining) {
            setIsRefining(true);
            // Reset user context when starting refinement to avoid stale data
            setUserContext('');
        } else {
            handleSaveAndRefine();
        }
    };

    const handleDownloadClick = () => {
        setShowDownloadOptions(!showDownloadOptions);
    };

    const handleDownloadHtml = () => {
        downloadHtmlReport(activeReport);
        setShowDownloadOptions(false);
    };

    const actionButtons = (
        <div className="space-y-3">
            <button
                onClick={handleAnalysis}
                disabled={!canGenerate || loading.state}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${canGenerate && !loading.state
                    ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-primary/25 hover:shadow-lg hover:scale-[1.02] active:scale-95'
                    : 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                    }`}
            >
                {loading.state ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Generando...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Generar Análisis</span>
                    </>
                )}
            </button>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleRefinementClick}
                    disabled={!canRefine || loading.state}
                    className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2 ${canRefine && !loading.state
                        ? isRefining
                            ? 'bg-success text-white border-success hover:bg-success-600'
                            : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50 hover:border-secondary-300'
                        : 'bg-secondary-50 text-secondary-400 border-secondary-100 cursor-not-allowed'
                        }`}
                >
                    {isRefining ? (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Guardar
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Refinar
                        </>
                    )}
                </button>

                <div className="relative">
                    <button
                        onClick={handleDownloadClick}
                        disabled={!canDownload}
                        className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2 ${canDownload
                            ? 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50 hover:border-secondary-300'
                            : 'bg-secondary-50 text-secondary-400 border-secondary-100 cursor-not-allowed'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Descargar</span>
                    </button>

                    {showDownloadOptions && canDownload && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-secondary-100 rounded-xl shadow-apple-lg z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <button
                                onClick={handleDownloadHtml}
                                className="w-full px-4 py-3 text-left text-sm text-secondary-700 hover:bg-secondary-50 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                HTML
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isRefining && (
                <button
                    onClick={() => setIsRefining(false)}
                    className="w-full py-2 text-xs font-medium text-secondary-500 hover:text-danger transition-colors"
                >
                    Cancelar edición
                </button>
            )}
        </div>
    );

    if (mode === 'actions') {
        return <div className="space-y-3">{actionButtons}</div>;
    }

    return (
        <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-full max-h-[calc(100vh-140px)]">
            <div className="p-6 bg-gradient-to-b from-white/80 to-white/40 border-b border-white/50">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-xs uppercase tracking-widest text-secondary-500 font-bold">Panel de Control</p>
                </div>
                <h2 className="text-xl font-bold text-secondary-900">Configuración</h2>
                <p className="text-sm text-secondary-600 mt-1">Gestiona tus evidencias y genera el reporte.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Generation Section */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400">Nuevo Análisis</h3>

                    <div className="glass-card rounded-2xl p-5 space-y-4">
                        <button
                            onClick={onOpenUploadModal}
                            className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-secondary-200 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 flex flex-col items-center justify-center gap-2 group bg-white/50"
                        >
                            <div className="p-3 rounded-full bg-secondary-50 group-hover:bg-white transition-colors shadow-sm">
                                <svg className="w-6 h-6 text-secondary-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <span className="block text-sm font-medium text-secondary-600 group-hover:text-primary">
                                    Gestionar Evidencias
                                </span>
                                <span className="text-xs text-secondary-400">
                                    {currentImageFiles?.length > 0
                                        ? `${currentImageFiles.length} imágenes cargadas`
                                        : 'Sin evidencias'}
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={handleAnalysis}
                            disabled={!canGenerate || loading.state}
                            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${canGenerate && !loading.state
                                ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-primary/25 hover:shadow-lg hover:scale-[1.02] active:scale-95'
                                : 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                                }`}
                        >
                            {loading.state ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Generando...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>Generar Análisis</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Active Report Actions */}
                {activeReport && (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400">Reporte Activo</h3>
                        <div className="glass-card rounded-2xl p-5 space-y-3">
                            {isRefining && (
                                <div className="mb-4 animate-fade-in">
                                    <label className="block text-xs font-bold text-secondary-500 mb-2 uppercase tracking-wider">
                                        Instrucciones para Refinamiento
                                    </label>
                                    <textarea
                                        value={userContext}
                                        onChange={(e) => setUserContext(e.target.value)}
                                        placeholder="Ej: El paso 3 es un error esperado, por favor actualiza el estado..."
                                        className="w-full p-3 text-sm rounded-xl border border-secondary-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-24"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleRefinementClick}
                                    disabled={!canRefine || loading.state}
                                    className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2 ${canRefine && !loading.state
                                        ? isRefining
                                            ? 'bg-success text-white border-success hover:bg-success-600'
                                            : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50 hover:border-secondary-300'
                                        : 'bg-secondary-50 text-secondary-400 border-secondary-100 cursor-not-allowed'
                                        }`}
                                >
                                    {isRefining ? 'Guardar' : 'Refinar'}
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={handleDownloadClick}
                                        disabled={!canDownload}
                                        className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2 ${canDownload
                                            ? 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50 hover:border-secondary-300'
                                            : 'bg-secondary-50 text-secondary-400 border-secondary-100 cursor-not-allowed'
                                            }`}
                                    >
                                        Descargar
                                    </button>
                                    {showDownloadOptions && canDownload && (
                                        <div className="absolute top-full right-0 mt-2 w-full bg-white/90 backdrop-blur-xl border border-secondary-100 rounded-xl shadow-apple-lg z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <button
                                                onClick={handleDownloadHtml}
                                                className="w-full px-4 py-3 text-left text-sm text-secondary-700 hover:bg-secondary-50 transition-colors flex items-center gap-2"
                                            >
                                                HTML
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Section */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400">Historial</h3>
                    <div className="glass-card rounded-2xl p-2 bg-secondary-50/30">
                        <ReportList />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConfigurationPanel;

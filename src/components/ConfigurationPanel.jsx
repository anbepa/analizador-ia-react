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
        isRefining,
        setIsRefining,
        handleSaveAndRefine,
        loading
    } = useAppContext();

    const [showDownloadOptions, setShowDownloadOptions] = useState(false);

    const handleRefinementClick = () => {
        if (!isRefining) {
            setIsRefining(true);
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
                className={`apple-button w-full text-sm justify-center flex items-center gap-2 ${
                    canGenerate && !loading.state
                        ? 'apple-button-primary shadow-apple-lg'
                        : 'apple-button-secondary opacity-60 cursor-not-allowed'
                }`}
            >
                {loading.state ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Generando...</span>
                    </div>
                ) : (
                    <>
                        <span className="text-lg">🚀</span>
                        <span>Generar análisis</span>
                    </>
                )}
            </button>

            <button
                onClick={handleRefinementClick}
                disabled={!canRefine || loading.state}
                className={`apple-button w-full text-sm justify-center flex items-center gap-2 ${
                    canRefine && !loading.state
                        ? isRefining
                            ? 'bg-success text-white hover:bg-success/90'
                            : 'bg-secondary-50 text-secondary-800 hover:bg-secondary-100 border border-secondary-200'
                        : 'apple-button-secondary opacity-60 cursor-not-allowed'
                }`}
            >
                {isRefining ? '✅ Aplicar refinamiento' : '🔧 Refinar análisis'}
            </button>

            {isRefining && (
                <button
                    onClick={() => setIsRefining(false)}
                    className="apple-button w-full text-sm justify-center flex items-center gap-2 apple-button-secondary"
                >
                    ❌ Cancelar refinamiento
                </button>
            )}

            <div className="relative">
                <button
                    onClick={handleDownloadClick}
                    disabled={!canDownload}
                    className={`apple-button w-full text-sm justify-center flex items-center gap-2 ${
                        canDownload
                            ? 'bg-secondary-50 text-secondary-800 hover:bg-secondary-100 border border-secondary-200'
                            : 'apple-button-secondary opacity-60 cursor-not-allowed'
                    }`}
                >
                    📄 Descargar reporte
                </button>

                {showDownloadOptions && canDownload && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-secondary-100 rounded-2xl shadow-apple-lg z-10">
                        <button
                            onClick={handleDownloadHtml}
                            className="w-full px-4 py-3 text-left text-sm text-secondary-700 hover:bg-secondary-50 rounded-2xl"
                        >
                            📄 Exportar a HTML
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (mode === 'actions') {
        return (
            <div className="space-y-3">
                {actionButtons}
            </div>
        );
    }

    return (
        <div className="h-full bg-white/90 backdrop-blur-xl border border-white/70 shadow-apple-xl rounded-3xl overflow-hidden flex flex-col">
            <div className="p-6 pb-4 bg-gradient-to-br from-secondary-50 via-white to-white border-b border-white/60">
                <p className="text-xs uppercase tracking-[0.08em] text-secondary-500 font-semibold">Área de trabajo</p>
                <h2 className="text-xl font-semibold text-secondary-900 mt-2">Carga, contexto y acciones</h2>
                <p className="text-sm text-secondary-600 mt-1">Sube evidencias y controla el flujo sin salir de este panel.</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-secondary-600">
                    <span className="px-2.5 py-1 rounded-full bg-secondary-50 border border-secondary-200">Arrastra, pega o selecciona imágenes</span>
                    <span className="px-2.5 py-1 rounded-full bg-secondary-50 border border-secondary-200">Contexto opcional incluido</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="rounded-2xl border border-secondary-100 bg-white/80 shadow-apple-lg p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-secondary-900">Acciones rápidas</p>
                            <p className="text-xs text-secondary-500">Genera, refina o descarga tu reporte sin perder el foco.</p>
                        </div>
                        {activeReport && (
                            <span className="px-2.5 py-1 text-xs rounded-full bg-success/10 text-success font-medium">Reporte listo</span>
                        )}
                    </div>
                    {actionButtons}
                </div>

                <div className="rounded-2xl border border-secondary-100 bg-secondary-50/80 p-5 space-y-3">
                    <p className="text-sm font-semibold text-secondary-800">Guía rápida</p>
                    <div className="space-y-2 text-sm text-secondary-600">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 h-7 w-7 rounded-full bg-white text-center text-secondary-800 font-semibold shadow-apple">1</span>
                            <p className="leading-snug">Arrastra, pega o selecciona imágenes de evidencia.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 h-7 w-7 rounded-full bg-white text-center text-secondary-800 font-semibold shadow-apple">2</span>
                            <p className="leading-snug">Añade contexto breve para orientar el análisis.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 h-7 w-7 rounded-full bg-white text-center text-secondary-800 font-semibold shadow-apple">3</span>
                            <p className="leading-snug">Genera y aplica refinamientos cuando sea necesario.</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/60 bg-white/80 shadow-apple-md p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-md font-semibold text-secondary-900">📷 Evidencias visuales</h3>
                            <p className="text-xs text-secondary-500">Dropzone + pegado rápido</p>
                        </div>
                        <span className="text-xs text-secondary-500">Hasta 30 imágenes por lote</span>
                    </div>
                    <ImageUploader />
                </div>

                <div className="rounded-2xl border border-secondary-100 bg-secondary-50/80 p-5 text-sm text-secondary-600">
                    <p className="font-semibold text-secondary-800 mb-1">Consejo</p>
                    <p className="leading-snug">Mantén lotes coherentes y notas cortas para que el reporte sea directo y fácil de leer.</p>
                </div>
            </div>
        </div>
    );
}

export default ConfigurationPanel;

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

function ReportDisplay({
    report,
    images,
    onDownloadExcel,
    isRefining,
    onRefine,
    onCancelRefine,
    userContext,
    setUserContext,
    onSaveRefinement,
    loading,
    canRefine,
    canDownload,
    onDelete
}) {
    const {
        updateStepInActiveReport,
        deleteStepFromActiveReport
    } = useAppContext();

    const [quickLookImage, setQuickLookImage] = useState(null);
    const [isResultOpen, setIsResultOpen] = useState(false);

    if (loading.state && !report) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                <div className="relative w-20 h-20 mb-8">
                    <div className="absolute inset-0 border-4 border-secondary-100/50 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2 tracking-tight">Generando Análisis</h3>
                <p className="text-secondary-500 text-center font-medium">Procesando evidencias con IA...</p>
            </div>
        );
    }

    if (!report) return null;

    // Datos del reporte
    const idCaso = report.id_caso || 'N/A';
    const escenarioPrueba = report.escenario_prueba || report.Nombre_del_Escenario || 'Caso de Prueba';
    const pasos = report.pasos || report.Pasos_Analizados || [];
    const estadoGeneral = report.estado_general || 'Pendiente';
    const isSuccess = estadoGeneral.toLowerCase() === 'exitoso' || estadoGeneral.toLowerCase() === 'aprobado';

    // Lógica de asociación de imágenes
    const getImageIndexFromString = (imageRef) => {
        if (!imageRef || typeof imageRef !== 'string') return -1;
        const normalizedRef = imageRef.trim();
        const patterns = [/evidencia\s*(\d+)/i, /imagen\s*(\d+)/i, /image\s*(\d+)/i, /img\s*(\d+)/i, /(\d+)/];
        for (const pattern of patterns) {
            const match = normalizedRef.match(pattern);
            if (match && match[1]) return parseInt(match[1], 10) - 1;
        }
        return -1;
    };

    return (
        <div className="min-h-full bg-white font-sans text-secondary-900 p-6">

            {/* Header Minimalista */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-secondary-500">
                        {report.user_stories ? (
                            <span>HU-{report.user_stories.numero}</span>
                        ) : (
                            <span>HU-{report.user_story_id || '?'}</span>
                        )}
                        <span>/</span>
                        <span>Caso #{idCaso}</span>
                    </div>

                    {/* Botón Eliminar discreto */}
                    <button
                        onClick={onDelete}
                        className="text-secondary-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                        title="Eliminar Escenario"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight mb-4 leading-tight">
                    {escenarioPrueba}
                </h1>

                <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Chip de Estado */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isSuccess ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-green-500' : 'bg-amber-500'}`} />
                        {estadoGeneral}
                    </div>

                    {/* Botones de Acción Jerárquicos */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onDownloadExcel}
                            disabled={!canDownload}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-secondary-600 bg-secondary-50 hover:bg-secondary-100 transition-colors disabled:opacity-50"
                        >
                            Exportar Excel
                        </button>

                        {/* Botón Cancelar - Solo visible en modo refinamiento */}
                        {isRefining && (
                            <button
                                onClick={onCancelRefine}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-secondary-600 bg-white border border-secondary-300 hover:bg-secondary-50 hover:border-secondary-400 transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancelar
                            </button>
                        )}

                        <button
                            onClick={onRefine}
                            disabled={!canRefine || loading.state}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md flex items-center gap-2 ${isRefining ? 'bg-green-600 hover:bg-green-700' : 'bg-[#007AFF] hover:bg-[#0062cc]'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isRefining ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Guardar Cambios
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Ejecutar Refinamiento
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Contexto de Refinamiento (Visible solo al refinar) */}
            {isRefining && (
                <div className="mb-6 animate-fade-in">
                    <label className="block text-xs font-bold text-secondary-700 uppercase tracking-wider mb-2">
                        Instrucciones para la IA
                    </label>
                    <textarea
                        value={userContext}
                        onChange={(e) => setUserContext(e.target.value)}
                        placeholder="Describe qué cambios quieres realizar en este escenario..."
                        className="w-full p-3 text-sm rounded-xl border border-secondary-200 bg-white focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]/30 resize-none h-24 transition-all"
                    />
                </div>
            )}

            {/* Lista de Pasos (Tarjetas) */}
            <div className="space-y-3 mb-8">
                {pasos.map((paso, index) => {
                    const numeroPaso = index + 1;
                    const descripcion = paso.descripcion || paso.descripcion_accion_observada || 'Sin descripción';
                    const imagenRef = paso.imagen_referencia;

                    // Lógica de asociación
                    let imgIndex = getImageIndexFromString(imagenRef);
                    const totalImagenes = images.length;
                    if (imgIndex === -1 && totalImagenes > 0) {
                        imgIndex = Math.min(index, totalImagenes - 1);
                    }

                    const hasImage = imgIndex >= 0 && images[imgIndex];

                    return (
                        <div
                            key={index}
                            className="group relative bg-white border border-secondary-200 rounded-xl p-4 hover:shadow-md hover:border-secondary-300 transition-all duration-200"
                        >
                            <div className="flex gap-4">
                                {/* Número */}
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center text-xs font-bold mt-0.5">
                                    {numeroPaso}
                                </div>

                                {/* Contenido */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-sm text-secondary-800 leading-relaxed ${isRefining ? 'border border-dashed border-primary/30 rounded px-2 py-1 focus:outline-none focus:border-primary bg-white' : ''}`}
                                        contentEditable={isRefining}
                                        suppressContentEditableWarning={true}
                                        onBlur={(e) => {
                                            if (isRefining) {
                                                updateStepInActiveReport(numeroPaso, {
                                                    descripcion: e.target.textContent.trim()
                                                });
                                            }
                                        }}
                                    >
                                        {descripcion}
                                    </p>
                                </div>

                                {/* Acciones (Evidencia + Eliminar) */}
                                <div className="flex items-start gap-2 ml-2">
                                    {hasImage && (
                                        <button
                                            onClick={() => setQuickLookImage(images[imgIndex])}
                                            className="p-1.5 rounded-lg text-secondary-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                            title="Ver evidencia"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    )}

                                    {isRefining && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('¿Eliminar este paso?')) {
                                                    deleteStepFromActiveReport(numeroPaso);
                                                }
                                            }}
                                            className="p-1.5 rounded-lg text-secondary-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar paso"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Resultado Obtenido (Acordeón) */}
            {(report.resultado_obtenido || report.Conclusion_General_Flujo) && (
                <div className="border border-secondary-200 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setIsResultOpen(!isResultOpen)}
                        className="w-full px-4 py-3 bg-secondary-50 flex items-center justify-between hover:bg-secondary-100 transition-colors"
                    >
                        <span className="text-sm font-bold text-secondary-700 uppercase tracking-wider flex items-center gap-2">
                            <svg className={`w-4 h-4 transition-transform ${isResultOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                            Resultado Obtenido
                        </span>
                    </button>
                    {isResultOpen && (
                        <div className="p-4 bg-white border-t border-secondary-200 animate-fade-in">
                            <p className="text-sm text-secondary-800 leading-relaxed">
                                {report.resultado_obtenido || report.Conclusion_General_Flujo}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Look Modal */}
            {quickLookImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-fade-in"
                    onClick={() => setQuickLookImage(null)}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh] p-4">
                        <img
                            src={quickLookImage.dataURL}
                            alt="Vista previa"
                            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border-2 border-white/20"
                        />
                        <button
                            className="absolute -top-14 right-0 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all hover:scale-110"
                            onClick={() => setQuickLookImage(null)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <p className="text-center text-white text-sm mt-4 font-medium bg-black/30 backdrop-blur-md py-2 px-4 rounded-lg inline-block">
                            {quickLookImage.name}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReportDisplay;

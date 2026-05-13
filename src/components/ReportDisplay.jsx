import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import OptimizedImage from './OptimizedImage';

function ReportDisplay() {
    const {
        activeReport,
        activeReportImages,
        loading,
        error,
        isRefining,
        updateStepInActiveReport,
        deleteStepFromActiveReport
    } = useAppContext();

    const [quickLookImage, setQuickLookImage] = useState(null);

    if (loading.state && !activeReport) {
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

    if (!activeReport) return null;

    // Datos del reporte
    const idCaso = activeReport.id_caso || 'N/A';
    const escenarioPrueba = activeReport.escenario_prueba || activeReport.Nombre_del_Escenario || 'Caso de Prueba';
    const pasos = activeReport.pasos || activeReport.Pasos_Analizados || [];
    const estadoGeneral = activeReport.estado_general || 'Pendiente';

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
        <div className="bg-transparent font-sans text-secondary-900 w-full h-full">

            {/* Header Content */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                    {activeReport.user_stories && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
                            HU-{activeReport.user_stories.numero}
                        </span>
                    )}
                    {!activeReport.user_stories && activeReport.historia_usuario && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
                            {activeReport.historia_usuario}
                        </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-100 text-secondary-600 text-xs font-bold tracking-wide">
                        ID: {idCaso}
                    </span>
                    <div className="h-4 w-px bg-secondary-200 mx-1"></div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${estadoGeneral === 'Exitoso' ? 'bg-green-50 text-green-700' :
                        estadoGeneral === 'Fallido' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${estadoGeneral === 'Exitoso' ? 'bg-green-600' :
                            estadoGeneral === 'Fallido' ? 'bg-red-600' : 'bg-yellow-600'
                            }`} />
                        {estadoGeneral}
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-50 text-secondary-500 text-xs font-semibold tracking-wide">
                        {pasos.length} pasos
                    </span>
                </div>
                <h1 className="text-3xl font-extrabold text-secondary-900 tracking-tight leading-tight">
                    {escenarioPrueba}
                </h1>
            </div>

            {/* Tabla de Pasos */}
            <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50/50 border-b border-secondary-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-500 uppercase tracking-widest w-16">
                                    #
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-secondary-500 uppercase tracking-widest">
                                    Descripción del Paso
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-secondary-500 uppercase tracking-widest w-32">
                                    Evidencia
                                </th>
                                {isRefining && (
                                    <th className="px-6 py-4 text-center text-xs font-bold text-secondary-500 uppercase tracking-widest w-24">
                                        Acciones
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {pasos.map((paso, index) => {
                                const numeroPaso = index + 1;
                                const descripcion = paso.descripcion || paso.descripcion_accion_observada || 'Sin descripción';
                                const imagenRef = paso.imagen_referencia;

                                // Lógica de asociación
                                let imgIndex = getImageIndexFromString(imagenRef);
                                const totalImagenes = activeReportImages.length;
                                if (imgIndex === -1 && totalImagenes > 0) {
                                    imgIndex = Math.min(index, totalImagenes - 1);
                                }

                                const hasImage = imgIndex >= 0 && activeReportImages[imgIndex];

                                return (
                                    <tr key={index} className={`hover:bg-primary/[0.03] transition-colors group ${index % 2 === 0 ? 'bg-white' : 'bg-secondary-50/40'}`}>
                                        <td className="px-6 py-5 align-top">
                                            <div className="w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                                {numeroPaso}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <p
                                                className={`text-[15px] text-secondary-800 font-medium leading-relaxed ${isRefining ? 'border border-dashed border-primary/30 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:bg-primary/5 transition-all' : ''}`}
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
                                        </td>
                                        <td className="px-6 py-5 align-top text-center">
                                            {hasImage ? (
                                                <button
                                                    onClick={() => setQuickLookImage(activeReportImages[imgIndex])}
                                                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/5 text-primary hover:bg-primary/15 transition-colors shadow-sm"
                                                    title="Ver evidencia"
                                                    aria-label="Ver evidencia"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <span className="text-xs text-secondary-300 font-medium mt-2 block">-</span>
                                            )}
                                        </td>
                                        {isRefining && (
                                            <td className="px-6 py-5 align-top text-center">
                                                <div className="relative group/tooltip">
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('¿Eliminar este paso?')) {
                                                            deleteStepFromActiveReport(numeroPaso);
                                                        }
                                                    }}
                                                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm"
                                                    aria-label="Eliminar paso"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                                {/* Tooltip */}
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[11px] font-medium text-white bg-secondary-800 rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                                    Eliminar paso
                                                </span>
                                            </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Resultado Obtenido General */}
            {(activeReport.resultado_obtenido || activeReport.Conclusion_General_Flujo) && (() => {
                const resultado = activeReport.resultado_obtenido || activeReport.Conclusion_General_Flujo;
                const estado = activeReport.estado_general || '';
                const isExitoso = estado === 'Exitoso';
                const isFallido = estado === 'Fallido';

                const colorScheme = isExitoso
                    ? { bg: 'from-green-50 to-transparent', border: 'border-green-200', iconBg: 'bg-green-100', iconColor: 'text-green-600', titleColor: 'text-green-800', textColor: 'text-green-900' }
                    : isFallido
                    ? { bg: 'from-red-50 to-transparent', border: 'border-red-200', iconBg: 'bg-red-100', iconColor: 'text-red-600', titleColor: 'text-red-800', textColor: 'text-red-900' }
                    : { bg: 'from-orange-50 to-transparent', border: 'border-orange-200', iconBg: 'bg-orange-100', iconColor: 'text-orange-500', titleColor: 'text-orange-800', textColor: 'text-orange-900' };

                return (
                    <div className={`mt-8 bg-gradient-to-br ${colorScheme.bg} rounded-2xl border ${colorScheme.border} overflow-hidden p-6 md:p-8`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-9 h-9 rounded-full ${colorScheme.iconBg} flex items-center justify-center ${colorScheme.iconColor}`}>
                                {isExitoso ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : isFallido ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h3 className={`text-xs font-bold uppercase tracking-widest ${colorScheme.titleColor}`}>
                                    Resultado Obtenido
                                </h3>
                                <span className={`text-xs font-semibold ${colorScheme.iconColor}`}>{estado}</span>
                            </div>
                        </div>
                        <p className={`text-[15px] leading-relaxed font-medium ${colorScheme.textColor}`}>
                            {resultado}
                        </p>
                    </div>
                );
            })()}

            {/* Quick Look Modal */}
            {quickLookImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-fade-in"
                    onClick={() => setQuickLookImage(null)}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh] p-4">
                        <OptimizedImage
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

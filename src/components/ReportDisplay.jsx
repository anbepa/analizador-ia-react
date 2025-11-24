import React from 'react';
import { useAppContext } from '../context/AppContext';
import OptimizedImage from './OptimizedImage';

function ReportDisplay() {
    const {
        activeReport,
        activeReportImages,
        loading,
        error,
        isRefining,
        handleAddStep,
        handleStepDelete
    } = useAppContext();

    if (loading.state && !activeReport) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 animate-fade-in">
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-secondary-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-xl font-bold text-secondary-900 mb-2">{loading.message}</h3>
                <p className="text-secondary-500 text-center max-w-md">
                    Analizando tus evidencias visuales para generar un reporte detallado...
                </p>
            </div>
        );
    }

    if (!activeReport) return null;

    const getImageIndexFromString = (imageRef) => {
        if (!imageRef || typeof imageRef !== 'string') return -1;
        const match = imageRef.match(/\d+/);
        return match ? parseInt(match[0], 10) - 1 : -1;
    };

    const scenarioName = (() => {
        let name = activeReport.Nombre_del_Escenario || 'Reporte de Análisis';
        if (name.startsWith('Escenario: ')) {
            name = name.substring(11);
        }
        return name;
    })();

    const stepCount = activeReport?.Pasos_Analizados?.length || 0;
    const imagesCount = activeReportImages?.length || 0;

    // Check if there are any video files in the report
    const hasVideo = activeReportImages?.some(img => img.isVideo || img.is_video);

    return (
        <div className="space-y-8">
            {error && (
                <div className="bg-danger/5 border border-danger/10 text-danger px-6 py-4 rounded-2xl flex items-center gap-3 animate-fade-in">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Error: {error}</span>
                </div>
            )}

            {/* Report Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-secondary-100 pb-8">
                <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-bold uppercase tracking-wider">
                            Análisis Completado
                        </span>
                        <span className="text-secondary-400 text-sm">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 leading-tight">
                        {scenarioName}
                    </h1>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            const json = JSON.stringify(activeReport, null, 2);
                            navigator.clipboard.writeText(json)
                                .then(() => alert('Reporte copiado al portapapeles'))
                                .catch(() => alert('No se pudo copiar el reporte'));
                        }}
                        className="apple-button apple-button-secondary text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copiar JSON
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="apple-button apple-button-primary text-sm flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-secondary-50/50 border border-secondary-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-secondary-50 transition-colors">
                    <span className="text-3xl font-bold text-secondary-900 mb-1">{stepCount}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-secondary-500">Pasos Analizados</span>
                </div>
                <div className="bg-secondary-50/50 border border-secondary-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-secondary-50 transition-colors">
                    <span className="text-3xl font-bold text-secondary-900 mb-1">{imagesCount}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-secondary-500">Evidencias</span>
                </div>
                <div className="bg-secondary-50/50 border border-secondary-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-secondary-50 transition-colors">
                    <span className="text-3xl font-bold text-success mb-1">100%</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-secondary-500">Completado</span>
                </div>
            </div>

            {/* Video Player Section (if video exists) */}
            {hasVideo && (
                <div className="bg-secondary-50/30 border border-secondary-100 rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400 mb-3">Video de Evidencia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeReportImages.filter(img => img.isVideo || img.is_video).map((video, idx) => (
                            <div key={idx} className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                                <video
                                    src={video.dataURL || video.video_url}
                                    controls
                                    className="w-full h-full"
                                    preload="metadata"
                                >
                                    Tu navegador no soporta el elemento de video.
                                </video>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Mode Banner */}
            {isRefining && (
                <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl text-warning">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </span>
                        <div>
                            <p className="font-bold text-secondary-900">Modo de Edición</p>
                            <p className="text-sm text-secondary-600">Puedes modificar el contenido del reporte directamente.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddStep}
                        className="apple-button bg-white text-secondary-800 border border-secondary-200 hover:bg-secondary-50 text-sm"
                    >
                        + Agregar Paso
                    </button>
                </div>
            )}

            {/* Report Content */}
            <div className="relative">
                {loading.state && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-3xl flex items-center justify-center">
                        <div className="bg-white p-6 rounded-2xl shadow-apple-xl flex items-center gap-4">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="font-medium text-secondary-700">Actualizando reporte...</span>
                        </div>
                    </div>
                )}

                <div
                    id="report-content"
                    className={`report-content ${loading.state ? 'opacity-50' : ''}`}
                    contentEditable={isRefining && !loading.state}
                >
                    {/* Summary Section */}
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                        {activeReport.Resultado_Esperado_General_Flujo && (
                            <div className="bg-secondary-50/30 border border-secondary-100 rounded-2xl p-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400 mb-3">Resultado Esperado</h3>
                                <p className="text-secondary-700 leading-relaxed">{activeReport.Resultado_Esperado_General_Flujo}</p>
                            </div>
                        )}
                        {activeReport.Conclusion_General_Flujo && (
                            <div className="bg-secondary-50/30 border border-secondary-100 rounded-2xl p-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400 mb-3">Conclusión General</h3>
                                <p className="text-secondary-700 leading-relaxed">{activeReport.Conclusion_General_Flujo}</p>
                            </div>
                        )}
                    </div>

                    {/* Steps Table */}
                    <h2 className="text-2xl font-bold text-secondary-900 mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center text-secondary-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </span>
                        Detalle de Pasos
                    </h2>

                    <div className="overflow-hidden rounded-xl border border-secondary-200 shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-secondary-50 border-b border-secondary-200">
                                    <th className="w-16 text-center">#</th>
                                    <th>Acción / Observación</th>
                                    <th>Elemento Clave</th>
                                    <th>Datos</th>
                                    <th>Esperado</th>
                                    <th>Resultado</th>
                                    <th className="w-24 text-center">Estado</th>
                                    {isRefining && <th className="w-20"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100 bg-white">
                                {(activeReport.Pasos_Analizados || []).map((paso) => {
                                    const isFailure = paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('fallido');
                                    const isSuccess = paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('exitosa');
                                    const statusClass = isFailure ? 'bg-danger/5' : isSuccess ? 'bg-success/5' : 'bg-warning/5';
                                    const statusBadge = isFailure
                                        ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">Fallido</span>
                                        : isSuccess
                                            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">Exitoso</span>
                                            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">Revisar</span>;

                                    const imgIndexEntrada = getImageIndexFromString(paso.imagen_referencia_entrada);
                                    const imgIndexSalida = getImageIndexFromString(paso.imagen_referencia_salida);

                                    // Find frame for this step if it exists
                                    const stepFrame = activeReportImages?.find(img =>
                                        img.fromVideoFrame && img.stepNumber === paso.numero_paso
                                    );

                                    // Debug logging
                                    if (paso.numero_paso === 1) {
                                        console.log('[REPORT-DISPLAY] Debug for step 1:');
                                        console.log('- activeReportImages count:', activeReportImages?.length);
                                        console.log('- Looking for stepNumber:', paso.numero_paso);

                                        // Log each image object structure
                                        activeReportImages?.forEach((img, idx) => {
                                            console.log(`[REPORT-DISPLAY] Image ${idx}:`, {
                                                hasDataURL: !!img.dataURL,
                                                isVideo: img.isVideo,
                                                is_video: img.is_video,
                                                fromVideoFrame: img.fromVideoFrame,
                                                from_video_frame: img.from_video_frame,
                                                stepNumber: img.stepNumber,
                                                step_number: img.step_number,
                                                step: img.step,
                                                allKeys: Object.keys(img)
                                            });
                                        });

                                        console.log('- Found stepFrame:', stepFrame);
                                        console.log('- All frames:', activeReportImages?.filter(img => img.fromVideoFrame));
                                    }

                                    return (
                                        <React.Fragment key={paso.numero_paso}>
                                            <tr className={`hover:bg-secondary-50/50 transition-colors ${statusClass}`}>
                                                <td className="text-center font-bold text-secondary-500">{paso.numero_paso}</td>
                                                <td className="text-sm">
                                                    {paso.descripcion_accion_observada}
                                                    {paso.video_timestamp && (
                                                        <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                                            ⏱ {paso.video_timestamp}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-sm text-secondary-600">{paso.elemento_clave_y_ubicacion_aproximada || '-'}</td>
                                                <td className="text-sm text-secondary-600 font-mono text-xs">{paso.dato_de_entrada_paso || '-'}</td>
                                                <td className="text-sm text-secondary-600">{paso.resultado_esperado_paso}</td>
                                                <td className="text-sm">{paso.resultado_obtenido_paso_y_estado}</td>
                                                <td className="text-center">{statusBadge}</td>
                                                {isRefining && (
                                                    <td className="text-center">
                                                        <button
                                                            onClick={() => handleStepDelete(paso.numero_paso)}
                                                            className="text-secondary-400 hover:text-danger transition-colors p-1"
                                                            title="Eliminar paso"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                            {(imgIndexEntrada >= 0 || imgIndexSalida >= 0 || stepFrame) && (
                                                <tr className="bg-secondary-50/30">
                                                    <td colSpan={isRefining ? 8 : 7} className="p-4">
                                                        <div className="flex gap-4 overflow-x-auto pb-2">
                                                            {imgIndexEntrada >= 0 && activeReportImages[imgIndexEntrada] && !activeReportImages[imgIndexEntrada].isVideo && !activeReportImages[imgIndexEntrada].is_video && !activeReportImages[imgIndexEntrada].fromVideoFrame && (
                                                                <div className="flex-1 min-w-[200px] max-w-[400px]">
                                                                    <p className="text-xs font-bold text-secondary-500 mb-2 uppercase tracking-wider">Entrada</p>
                                                                    <OptimizedImage
                                                                        src={activeReportImages[imgIndexEntrada].dataURL}
                                                                        alt="Evidencia Entrada"
                                                                        className="w-full rounded-lg border border-secondary-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
                                                                        onClick={() => window.open(activeReportImages[imgIndexEntrada].dataURL, '_blank')}
                                                                    />
                                                                </div>
                                                            )}
                                                            {imgIndexSalida >= 0 && activeReportImages[imgIndexSalida] && !activeReportImages[imgIndexSalida].isVideo && !activeReportImages[imgIndexSalida].is_video && !activeReportImages[imgIndexSalida].fromVideoFrame && (
                                                                <div className="flex-1 min-w-[200px] max-w-[400px]">
                                                                    <p className="text-xs font-bold text-secondary-500 mb-2 uppercase tracking-wider">Salida</p>
                                                                    <OptimizedImage
                                                                        src={activeReportImages[imgIndexSalida].dataURL}
                                                                        alt="Evidencia Salida"
                                                                        className="w-full rounded-lg border border-secondary-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
                                                                        onClick={() => window.open(activeReportImages[imgIndexSalida].dataURL, '_blank')}
                                                                    />
                                                                </div>
                                                            )}
                                                            {/* Video frame from timestamp - shown after traditional images */}
                                                            {stepFrame && (
                                                                <div className="flex-1 min-w-[200px] max-w-[400px]">
                                                                    <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider flex items-center gap-1">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                        </svg>
                                                                        Frame del Video ({paso.video_timestamp})
                                                                    </p>
                                                                    <OptimizedImage
                                                                        src={stepFrame.dataURL}
                                                                        alt={`Frame del paso ${paso.numero_paso}`}
                                                                        className="w-full rounded-lg border-2 border-primary/30 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
                                                                        onClick={() => window.open(stepFrame.dataURL, '_blank')}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportDisplay;

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
            <div className="p-12 text-center min-h-[600px] flex items-center justify-center">
                <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-secondary-900 mb-2">{loading.message}</h3>
                        <p className="text-secondary-600">La IA está procesando las evidencias visuales...</p>
                        <div className="mt-4 max-w-sm mx-auto bg-secondary-100 rounded-full h-2">
                            <div className="h-2 bg-primary rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!activeReport) {
        return (
            <div className="p-12 text-center min-h-[600px] flex items-center justify-center">
                <div className="flex flex-col items-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-secondary-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="text-center max-w-lg">
                        <h3 className="text-2xl font-bold text-secondary-900 mb-3">Reporte de Análisis</h3>
                        <p className="text-secondary-600 leading-relaxed">
                            El informe detallado aparecerá aquí una vez que hayas cargado las evidencias visuales y ejecutado el análisis de IA.
                        </p>
                        <div className="mt-6 p-4 bg-secondary-50 rounded-lg">
                            <p className="text-sm text-secondary-500">
                                💡 <strong>Tip:</strong> Sube múltiples imágenes para obtener un análisis más completo
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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

    return (
        <div className="min-h-[600px] space-y-6">
            {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-apple mb-2" role="alert">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Error: {error}</span>
                    </div>
                </div>
            )}

            <div className="bg-white/90 border border-white/80 rounded-3xl shadow-apple-md p-6 sm:p-8">
                <div className="flex flex-wrap justify-between gap-4 items-start">
                    <div className="space-y-2 flex-1 min-w-[240px]">
                        <div className="flex items-center gap-2 text-sm text-success">
                            <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                            <span className="px-2 py-1 bg-success/10 text-success rounded-full">Análisis listo</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-semibold text-secondary-900 tracking-tight">{scenarioName}</h1>
                        <p className="text-sm text-secondary-600">Generado {new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => {
                                const json = JSON.stringify(activeReport, null, 2);
                                navigator.clipboard.writeText(json)
                                    .then(() => alert('Reporte copiado al portapapeles'))
                                    .catch(() => alert('No se pudo copiar el reporte'));
                            }}
                            className="apple-button apple-button-secondary text-sm px-4"
                            title="Exportar datos como JSON"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Exportar
                            </span>
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="apple-button apple-button-primary text-sm px-4 shadow-apple-md"
                            title="Imprimir reporte"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Imprimir
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                    <div className="rounded-2xl bg-secondary-50 border border-secondary-200 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.08em] text-secondary-500">Pasos analizados</p>
                        <p className="text-xl font-semibold text-secondary-900">{stepCount}</p>
                        <p className="text-xs text-secondary-500">Incluye evidencias asociadas</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-secondary-100 px-4 py-3 shadow-apple">
                        <p className="text-xs uppercase tracking-[0.08em] text-secondary-500">Evidencias</p>
                        <p className="text-xl font-semibold text-secondary-900">{imagesCount}</p>
                        <p className="text-xs text-secondary-500">Imágenes usadas en el reporte</p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-secondary-50 border border-white px-4 py-3 shadow-apple-md">
                        <p className="text-xs uppercase tracking-[0.08em] text-secondary-600">Estado</p>
                        <p className="text-xl font-semibold text-secondary-900">{loading.state ? 'Procesando' : 'Completado'}</p>
                        <p className="text-xs text-secondary-600">{loading.message || 'Listo para compartir'}</p>
                    </div>
                </div>
            </div>

            {isRefining && (
                <div className="px-5 py-4 bg-secondary-50/90 border border-secondary-100 rounded-2xl flex items-center justify-between">
                    <p className="text-sm font-medium text-secondary-800">Modo edición activo: ajusta los pasos y guarda los cambios.</p>
                    <button
                        onClick={handleAddStep}
                        className="apple-button apple-button-primary text-sm px-4"
                    >
                        ➕ Agregar Paso
                    </button>
                </div>
            )}

            <div className="relative bg-white/90 border border-white/80 rounded-3xl shadow-apple-lg overflow-hidden">
                {loading.state && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p className="font-medium text-secondary-700">{loading.message}</p>
                        </div>
                    </div>
                )}

                <div
                    id="report-content"
                    className={`report-content px-6 sm:px-8 pb-8 pt-6 ${loading.state ? 'opacity-50 pointer-events-none' : ''}`}
                    contentEditable={isRefining && !loading.state}
                >
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-secondary-100 bg-secondary-50/70 p-4">
                            <p className="text-xs uppercase tracking-[0.08em] text-secondary-500">Escenario</p>
                            <p className="text-lg font-semibold text-secondary-900 mt-1">{scenarioName}</p>
                            <p className="text-sm text-secondary-600 mt-2">
                                <strong>Fecha:</strong> {new Date().toISOString().split('T')[0]}
                            </p>
                        </div>

                        {activeReport.Resultado_Esperado_General_Flujo && (
                            <div className="rounded-2xl border border-secondary-100 bg-white p-4 shadow-apple">
                                <p className="text-xs uppercase tracking-[0.08em] text-secondary-500">Resultado esperado</p>
                                <p className="text-sm text-secondary-700 mt-2 leading-relaxed">{activeReport.Resultado_Esperado_General_Flujo}</p>
                            </div>
                        )}

                        {activeReport.Conclusion_General_Flujo && (
                            <div className="rounded-2xl border border-secondary-100 bg-white p-4 shadow-apple md:col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                                    <p className="text-xs uppercase tracking-[0.08em] text-secondary-500">Conclusión general</p>
                                </div>
                                <p className="text-sm text-secondary-700 leading-relaxed">{activeReport.Conclusion_General_Flujo}</p>
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl font-semibold text-secondary-900 mt-8 mb-4">Pasos analizados</h2>
                    <div className="overflow-auto rounded-2xl border border-secondary-100 bg-secondary-50/40" style={{ width: '100%' }}>
                        <table
                            className="min-w-full bg-white report-content"
                            style={{
                                width: '100%',
                                tableLayout: 'fixed',
                                wordWrap: 'break-word',
                                wordBreak: 'break-all',
                                overflowWrap: 'break-word'
                            }}
                        >
                            <thead className="bg-secondary-50">
                                <tr>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary-900" style={{ width: '5%', minWidth: '60px' }}>Paso</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary-900" style={{ width: '20%', minWidth: '150px' }}>Acción/Observación</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary-900" style={{ width: '18%', minWidth: '140px' }}>Elemento Clave</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary-900" style={{ width: '15%', minWidth: '120px' }}>Dato Entrada</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary-900" style={{ width: '17%', minWidth: '130px' }}>Res. Esperado</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary-900" style={{ width: '20%', minWidth: '150px' }}>Res. Obtenido y Estado</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary-900" style={{ width: '5%', minWidth: '100px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeReport.Pasos_Analizados || []).map((paso) => {
                                    const isFailure = paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('fallido');
                                    const isSuccess = paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('exitosa');
                                    const statusClass = isFailure ? 'status-failure' : isSuccess ? 'status-success' : 'status-deviation';
                                    const statusIcon = isFailure ? '❌' : isSuccess ? '✔️' : '⚠️';
                                    const imgIndexEntrada = getImageIndexFromString(paso.imagen_referencia_entrada);
                                    const imgIndexSalida = getImageIndexFromString(paso.imagen_referencia_salida);

                                    return (
                                        <React.Fragment key={paso.numero_paso}>
                                            <tr className={`border-t border-secondary-100 hover:bg-secondary-50/60 ${statusClass}`}>
                                                <td className="px-4 py-4 text-sm font-semibold text-secondary-900 text-center" style={{ width: '5%', minWidth: '60px' }}>{paso.numero_paso}</td>
                                                <td className="px-4 py-4 text-sm text-secondary-700" style={{
                                                    wordBreak: 'break-all',
                                                    whiteSpace: 'normal',
                                                    overflowWrap: 'break-word',
                                                    maxWidth: '0',
                                                    overflow: 'hidden',
                                                    width: '18%'
                                                }}>{paso.descripcion_accion_observada || ''}</td>
                                                <td className="px-4 py-4 text-sm text-secondary-700" style={{
                                                    wordBreak: 'break-all',
                                                    whiteSpace: 'normal',
                                                    overflowWrap: 'break-word',
                                                    maxWidth: '0',
                                                    overflow: 'hidden',
                                                    width: '17%'
                                                }}>{paso.elemento_clave_y_ubicacion_aproximada || 'N/A'}</td>
                                                <td className="px-4 py-4 text-sm text-secondary-700" style={{
                                                    wordBreak: 'break-all',
                                                    whiteSpace: 'normal',
                                                    overflowWrap: 'break-word',
                                                    maxWidth: '0',
                                                    overflow: 'hidden',
                                                    width: '15%'
                                                }}>{paso.dato_de_entrada_paso || ''}</td>
                                                <td className="px-4 py-4 text-sm text-secondary-700" style={{
                                                    wordBreak: 'break-all',
                                                    whiteSpace: 'normal',
                                                    overflowWrap: 'break-word',
                                                    maxWidth: '0',
                                                    overflow: 'hidden',
                                                    width: '18%'
                                                }}>{paso.resultado_esperado_paso || ''}</td>
                                                <td className="px-4 py-4" style={{ width: '22%' }}>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-lg flex-shrink-0 mt-0.5">{statusIcon}</span>
                                                        <span className="text-sm text-secondary-700" style={{
                                                            wordBreak: 'break-all',
                                                            whiteSpace: 'normal',
                                                            lineHeight: '1.4',
                                                            overflowWrap: 'break-word',
                                                            maxWidth: '100%'
                                                        }}>{paso.resultado_obtenido_paso_y_estado || ''}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4" style={{ width: '5%', minWidth: '100px' }}>
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            disabled={loading.state}
                                                            onClick={() => handleStepDelete(paso.numero_paso)}
                                                            data-step={paso.numero_paso}
                                                            className="px-3 py-1 text-xs font-medium text-white bg-danger rounded-lg hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {imgIndexEntrada >= 0 && activeReportImages[imgIndexEntrada] && (
                                                <tr className="evidence-row"><td colSpan="7" className="bg-secondary-50" style={{ padding: 0, width: '100%' }}>
                                                    <div className="evidence-container" style={{ width: '100%', padding: '1.5rem' }}>
                                                        <p className="text-sm font-semibold text-secondary-700 flex items-center gap-2">
                                                            <span className="w-2 h-2 bg-success rounded-full"></span>
                                                            Evidencia de Entrada: {paso.imagen_referencia_entrada}
                                                        </p>
                                                        <OptimizedImage
                                                            src={activeReportImages[imgIndexEntrada].dataURL}
                                                            alt={`Evidencia para paso ${paso.numero_paso}`}
                                                            className="evidence-image rounded-xl shadow-lg border border-secondary-100 cursor-pointer hover:shadow-xl transition-shadow duration-300"
                                                            style={{
                                                                width: '100%',
                                                                maxWidth: '100%',
                                                                height: 'auto',
                                                                minHeight: '400px',
                                                                objectFit: 'contain',
                                                                display: 'block',
                                                                boxSizing: 'border-box'
                                                            }}
                                                            onClick={() => window.open(activeReportImages[imgIndexEntrada].dataURL, '_blank')}
                                                        />
                                                    </div>
                                                </td></tr>
                                            )}
                                            {imgIndexSalida >= 0 && activeReportImages[imgIndexSalida] && (
                                                <tr className="evidence-row"><td colSpan="7" className="bg-secondary-50" style={{ padding: 0, width: '100%' }}>
                                                    <div className="evidence-container" style={{ width: '100%', padding: '1.5rem' }}>
                                                        <p className="text-sm font-semibold text-secondary-700 flex items-center gap-2">
                                                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                                                            Evidencia de Salida: {paso.imagen_referencia_salida}
                                                        </p>
                                                        <OptimizedImage
                                                            src={activeReportImages[imgIndexSalida].dataURL}
                                                            alt={`Evidencia de salida para paso ${paso.numero_paso}`}
                                                            className="evidence-image rounded-xl shadow-lg border border-secondary-100 cursor-pointer hover:shadow-xl transition-shadow duration-300"
                                                            style={{
                                                                width: '100%',
                                                                maxWidth: '100%',
                                                                height: 'auto',
                                                                minHeight: '400px',
                                                                objectFit: 'contain',
                                                                display: 'block',
                                                                boxSizing: 'border-box'
                                                            }}
                                                            onClick={() => window.open(activeReportImages[imgIndexSalida].dataURL, '_blank')}
                                                        />
                                                    </div>
                                                </td></tr>
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

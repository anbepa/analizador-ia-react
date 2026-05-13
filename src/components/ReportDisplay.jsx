import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import OptimizedImage from './OptimizedImage';
import ConfirmModal from './ConfirmModal';

function ReportDisplay() {
    const {
        activeReport,
        activeReportImages,
        loading,
        error,
        isRefining,
        updateStepInActiveReport,
        deleteStepFromActiveReport,
        deleteStepsBulkFromActiveReport
    } = useAppContext();

    const [quickLookImage, setQuickLookImage] = useState(null);
    const [selectedSteps, setSelectedSteps] = useState([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Limpiar selección al salir del modo refinamiento
    React.useEffect(() => {
        if (!isRefining) {
            setSelectedSteps([]);
        }
    }, [isRefining]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedSteps(pasos.map(p => p.numero_paso));
        } else {
            setSelectedSteps([]);
        }
    };

    const handleSelectStep = (stepNumber) => {
        setSelectedSteps(prev => 
            prev.includes(stepNumber) 
                ? prev.filter(s => s !== stepNumber) 
                : [...prev, stepNumber]
        );
    };

    const handleBulkDelete = async () => {
        setIsDeleteDialogOpen(false);
        await deleteStepsBulkFromActiveReport(selectedSteps);
        setSelectedSteps([]);
    };

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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            {activeReport.user_stories && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                                    HU-{activeReport.user_stories.numero}
                                </span>
                            )}
                            <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
                                Escenario ID: {idCaso}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-secondary-900 tracking-tight leading-tight max-w-4xl">
                            {escenarioPrueba}
                        </h1>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl shadow-sm border ${
                            estadoGeneral === 'Exitoso' ? 'bg-green-50 border-green-100 text-green-700' :
                            estadoGeneral === 'Fallido' ? 'bg-red-50 border-red-100 text-red-700' : 
                            'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                            <div className={`w-3 h-3 rounded-full animate-pulse ${
                                estadoGeneral === 'Exitoso' ? 'bg-green-500' :
                                estadoGeneral === 'Fallido' ? 'bg-red-500' : 'bg-amber-500'
                            }`} />
                            <span className="text-sm font-black uppercase tracking-tight">{estadoGeneral}</span>
                        </div>
                        <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest bg-secondary-50 px-2 py-1 rounded-md">
                            {pasos.length} pasos analizados
                        </span>
                    </div>
                </div>

            {/* Tabla de Pasos */}
            <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50/50 border-b border-secondary-200">
                            <tr>
                                {isRefining && (
                                    <th className="w-12 px-6 py-2.5">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-secondary-300 text-primary focus:ring-primary/20"
                                                checked={pasos.length > 0 && selectedSteps.length === pasos.length}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </th>
                                )}
                                <th className="px-2 py-2.5 text-left text-xs font-bold text-secondary-500 uppercase tracking-widest w-10">
                                    #
                                </th>
                                <th className="px-6 py-2.5 text-left text-xs font-bold text-secondary-500 uppercase tracking-widest">
                                    Descripción del Paso
                                </th>
                                <th className="px-6 py-2.5 text-center text-xs font-bold text-secondary-500 uppercase tracking-widest w-28">
                                    Evidencia
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                                {pasos.map((paso, index) => {
                                    const numeroPaso = index + 1;
                                    const descripcion = paso.descripcion || paso.descripcion_accion_observada || 'Sin descripción';
                                    
                                    // Lógica de asociación de imagen robusta
                                    const totalImagenes = activeReportImages ? activeReportImages.length : 0;
                                    const imagenRef = paso.imagen_referencia;
                                    
                                    // 1. Intentar por referencia de texto (ej: "paso 1")
                                    let imgIndex = getImageIndexFromString(imagenRef);
                                    
                                    // 2. Si no funciona, intentar por asociación de número de paso
                                    if (imgIndex === -1 && activeReportImages) {
                                        imgIndex = activeReportImages.findIndex(img => img.stepNumber === numeroPaso);
                                    }
                                    
                                    if (imgIndex === -1 && totalImagenes > 0) {
                                        imgIndex = Math.min(index, totalImagenes - 1);
                                    }
                                    
                                    const hasImage = imgIndex !== -1 && activeReportImages && activeReportImages[imgIndex];

                                    return (
                                        <tr key={index} className={`hover:bg-primary/[0.03] transition-colors group ${selectedSteps.includes(numeroPaso) ? 'bg-primary/[0.04]' : index % 2 === 0 ? 'bg-white' : 'bg-secondary-50/40'}`}>
                                            {isRefining && (
                                                <td className="px-6 py-2.5 align-middle">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-secondary-300 text-primary focus:ring-primary/20"
                                                        checked={selectedSteps.includes(numeroPaso)}
                                                        onChange={() => handleSelectStep(numeroPaso)}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-2 py-2.5 align-middle">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-colors ${selectedSteps.includes(numeroPaso) ? 'bg-primary text-white' : 'bg-secondary-100 text-secondary-600 group-hover:bg-primary group-hover:text-white'}`}>
                                                    {numeroPaso}
                                                </div>
                                            </td>
                                            <td className="px-6 py-2.5 align-middle">
                                                <p
                                                    className={`text-[13px] text-secondary-800 font-medium leading-relaxed ${isRefining ? 'border border-dashed border-primary/30 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:bg-primary/5 transition-all' : ''}`}
                                                    contentEditable={isRefining && !loading.state}
                                                    suppressContentEditableWarning={true}
                                                    onBlur={(e) => {
                                                        if (isRefining && !loading.state) {
                                                            updateStepInActiveReport(numeroPaso, {
                                                                descripcion: e.target.textContent.trim()
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {descripcion}
                                                </p>
                                            </td>
                                            <td className="px-6 py-2.5 align-middle text-center">
                                                {hasImage ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <button
                                                            onClick={() => setQuickLookImage(activeReportImages[imgIndex])}
                                                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white hover:bg-primary-600 transition-all shadow-md shadow-primary/20 active:scale-95 group"
                                                            title="Ver evidencia"
                                                        >
                                                            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>
                                                        <span className="text-[9px] font-black text-primary uppercase tracking-wider">Ver</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-secondary-50 border border-dashed border-secondary-200 flex items-center justify-center mx-auto opacity-40">
                                                        <span className="text-[9px] font-bold text-secondary-400 uppercase">N/A</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {/* Bulk Action Bar for Steps - Inline version above table */}
                {isRefining && selectedSteps.length > 0 && (
                    <div className="bg-secondary-900 px-6 py-4 flex items-center justify-between border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shadow-lg shadow-primary/20">
                                {selectedSteps.length}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-white text-xs font-black uppercase tracking-wider">Pasos seleccionados</span>
                                <span className="text-[10px] text-secondary-400 font-medium">Acción masiva disponible</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedSteps([])}
                                className="px-4 py-2 text-xs font-bold text-secondary-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => setIsDeleteDialogOpen(true)}
                                disabled={loading.state}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl transition-all text-xs font-bold shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-30"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar Pasos
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Confirmación Estandarizado */}
            <ConfirmModal 
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleBulkDelete}
                title={`¿Eliminar ${selectedSteps.length} pasos?`}
                message={`Esta acción eliminará permanentemente los ${selectedSteps.length} pasos seleccionados de este escenario. No se puede deshacer.`}
                confirmText="Eliminar permanentemente"
            />

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

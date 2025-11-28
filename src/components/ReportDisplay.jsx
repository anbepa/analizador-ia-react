import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import OptimizedImage from './OptimizedImage';

function ReportDisplay() {
    const {
        activeReport,
        activeReportImages,
        loading,
        error
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
        <div className="min-h-screen bg-transparent font-sans text-secondary-900">

            {/* Header Content */}
            <div className="mb-8 pb-6 border-b border-secondary-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {activeReport.user_stories && (
                            <span className="inline-block px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                HU-{activeReport.user_stories.numero}
                            </span>
                        )}
                        {!activeReport.user_stories && activeReport.historia_usuario && (
                            <span className="inline-block px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                {activeReport.historia_usuario}
                            </span>
                        )}
                        <span className="inline-block px-3 py-1.5 rounded-lg bg-secondary-100 text-secondary-600 text-xs font-bold uppercase tracking-wider">
                            ID: {idCaso}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${estadoGeneral === 'Exitoso' ? 'bg-green-50 text-green-700' :
                                estadoGeneral === 'Fallido' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${estadoGeneral === 'Exitoso' ? 'bg-green-600' :
                                    estadoGeneral === 'Fallido' ? 'bg-red-600' : 'bg-yellow-600'
                                }`} />
                            <span className="text-xs font-bold">{estadoGeneral}</span>
                        </div>
                        <span className="text-xs text-secondary-500 font-medium">{pasos.length} pasos</span>
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                    {escenarioPrueba}
                </h1>
            </div>

            {/* Tabla de Pasos */}
            <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50 border-b border-secondary-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider w-16">
                                    #
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                    Descripción del Paso
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider w-32">
                                    Dato de Entrada
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider w-40">
                                    Resultado Esperado
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider w-40">
                                    Resultado Obtenido
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-secondary-700 uppercase tracking-wider w-24">
                                    Evidencia
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {pasos.map((paso, index) => {
                                const numeroPaso = index + 1;
                                const descripcion = paso.descripcion || paso.descripcion_accion_observada || 'Sin descripción';
                                const datoEntrada = paso.dato_entrada || paso.dato_de_entrada_paso || 'N/A';
                                const resultadoEsperado = paso.resultado_esperado || paso.resultado_esperado_paso || 'N/A';
                                const resultadoObtenido = paso.resultado_obtenido || paso.resultado_obtenido_paso_y_estado || 'Pendiente';
                                const imagenRef = paso.imagen_referencia || paso.imagen_referencia_entrada;

                                // Lógica de asociación
                                let imgIndex = getImageIndexFromString(imagenRef);
                                const totalImagenes = activeReportImages.length;
                                if (imgIndex === -1 && totalImagenes > 0) {
                                    imgIndex = Math.min(index, totalImagenes - 1);
                                }

                                const hasImage = imgIndex >= 0 && activeReportImages[imgIndex];

                                return (
                                    <tr key={index} className="hover:bg-secondary-50/50 transition-colors">
                                        <td className="px-4 py-4 align-top">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                {numeroPaso}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 align-top">
                                            <p className="text-sm text-secondary-900 font-medium leading-relaxed">
                                                {descripcion}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 align-top">
                                            <p className="text-sm text-secondary-600">
                                                {datoEntrada}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 align-top">
                                            <p className="text-sm text-secondary-600">
                                                {resultadoEsperado}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 align-top">
                                            <p className="text-sm text-secondary-600">
                                                {resultadoObtenido}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 align-top text-center">
                                            {hasImage ? (
                                                <button
                                                    onClick={() => setQuickLookImage(activeReportImages[imgIndex])}
                                                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                    title="Ver evidencia"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <span className="text-xs text-secondary-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

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

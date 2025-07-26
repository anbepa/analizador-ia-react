import React from 'react';
import { useAppContext } from '../context/AppContext';
import StepImageUploader from './StepImageUploader';

function ReportDisplay() {
    const { 
        activeReport, 
        activeReportImages, 
        loading, 
        error, 
        isRefining, 
        handleAddStep, 
        handleAddImageToStep,
        handleRemoveImageFromStep,
        handleGenerateTicket, 
        handleStepDelete,
        handleSaveAndRefine
    } = useAppContext();

    if (loading.state && !activeReport) { // Solo muestra el spinner a pantalla completa si no hay reporte activo
        return (
            <div className="text-center py-16">
                <svg className="animate-spin h-12 w-12 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="mt-4 font-semibold text-gray-700">{loading.message}</p>
            </div>
        );
    }

    if (!activeReport) {
        return <div className="text-center text-gray-500 py-16">El informe generado por la IA aparecerá aquí.</div>
    }

    const getImageIndexFromString = (imageRef) => {
        if (!imageRef || typeof imageRef !== 'string') return -1;
        const match = imageRef.match(/\d+/);
        return match ? parseInt(match[0], 10) - 1 : -1;
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 min-h-[300px] glassmorphism">
            {error && (
                 <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-md mb-4" role="alert">
                    Error: {error}
                </div>
            )}
            {loading.state && (
                <div className="text-center py-4">
                    <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="mt-2 font-semibold text-gray-700">{loading.message}</p>
                </div>
            )}

            <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Reporte Visual</h2>
                <button
                    onClick={() => {
                        const json = JSON.stringify(activeReport, null, 2);
                        navigator.clipboard.writeText(json)
                            .then(() => alert('Reporte copiado al portapapeles'))
                            .catch(() => alert('No se pudo copiar el reporte'));
                    }}
                    className="bg-primary text-white font-semibold py-1 px-3 rounded-md hover:bg-primary/90 text-sm"
                >
                    📋 Copiar JSON
                </button>
            </div>
            
            {isRefining && (
                <button onClick={handleAddStep} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 mb-4">
                    ➕ Agregar Nuevo Paso
                </button>
            )}

            <div 
                id="report-content" 
                className={`report-content ${loading.state ? 'opacity-50 pointer-events-none' : ''}`}
                contentEditable={isRefining && !loading.state}
            >
                <h1>{activeReport.Nombre_del_Escenario || 'Informe de Análisis'}</h1>
                <p className="mb-4"><strong>Conclusión General:</strong> {activeReport.Conclusion_General_Flujo || 'N/A'}</p>
                <h2>Pasos Analizados:</h2>
                <div className="overflow-auto">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>Paso</th>
                            <th style={{ width: '25%' }}>Acción/Observación</th>
                            <th style={{ width: '15%' }}>Dato Entrada</th>
                            <th style={{ width: '20%' }}>Res. Esperado</th>
                            <th style={{ width: '25%' }}>Res. Obtenido y Estado</th>
                            <th style={{ width: '10%' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeReport.Pasos_Analizados.map((paso) => {
                            const isFailure = paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('fallido');
                            const isSuccess = paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('exitosa');
                            const statusClass = isFailure ? 'status-failure' : isSuccess ? 'status-success' : 'status-deviation';
                            const statusIcon = isFailure ? '❌' : isSuccess ? '✔️' : '⚠️';
                            const imgIndexEntrada = getImageIndexFromString(paso.imagen_referencia_entrada);
                            const imgIndexSalida = getImageIndexFromString(paso.imagen_referencia_salida);
                            
                            return (
                                <React.Fragment key={paso.numero_paso}>
                                    <tr className={`odd:bg-gray-50 ${statusClass}`}>
                                        <td>{paso.numero_paso}</td>
                                        <td>{paso.descripcion_accion_observada || ''}</td>
                                        <td>{paso.dato_de_entrada_paso || ''}</td>
                                        <td>{paso.resultado_esperado_paso || ''}</td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <span>{statusIcon}</span>
                                                <span>{paso.resultado_obtenido_paso_y_estado || ''}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {isFailure && !isRefining && <button disabled={loading.state} onClick={() => handleGenerateTicket(paso.numero_paso)} className="bug-ticket-btn bg-danger/10 text-danger text-xs font-bold py-1 px-2 rounded hover:bg-danger/20 disabled:bg-gray-300">✨ Crear Ticket</button>}
                                            <button disabled={loading.state} onClick={() => handleStepDelete(paso.numero_paso)} data-step={paso.numero_paso} className="delete-step-btn bg-danger text-white text-xs font-bold py-1 px-2 rounded hover:bg-danger/90 disabled:bg-gray-300">Eliminar</button>
                                        </td>
                                    </tr>
                                    {imgIndexEntrada >= 0 && activeReportImages[imgIndexEntrada] && (
                                        <tr className="evidence-row"><td colSpan="6">
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Evidencia (Entrada): {paso.imagen_referencia_entrada}</p>
                                            <img src={activeReportImages[imgIndexEntrada].dataUrl} alt={`Evidencia para paso ${paso.numero_paso}`} className="evidence-image" />
                                        </td></tr>
                                    )}
                                    {imgIndexSalida >= 0 && activeReportImages[imgIndexSalida] && (
                                        <tr className="evidence-row"><td colSpan="6">
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Evidencia (Salida): {paso.imagen_referencia_salida}</p>
                                            <img src={activeReportImages[imgIndexSalida].dataUrl} alt={`Evidencia de salida para paso ${paso.numero_paso}`} className="evidence-image" />
                                        </td></tr>
                                    )}
                                    {/* Mostrar uploader para pasos nuevos */}
                                    {isRefining && paso.isNewStep && (
                                        <tr className="evidence-row"><td colSpan="6">
                                            <StepImageUploader
                                                stepNumber={paso.numero_paso}
                                                images={paso.newStepImages || []}
                                                onAddImages={handleAddImageToStep}
                                                onRemoveImage={handleRemoveImageFromStep}
                                            />
                                        </td></tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
                </div>
                
                {/* Botón Guardar y Refinar - Solo visible cuando hay pasos nuevos */}
                {isRefining && activeReport.Pasos_Analizados.some(paso => paso.isNewStep) && (
                    <div className="mt-6 text-center">
                        <button 
                            onClick={handleSaveAndRefine}
                            disabled={loading.state}
                            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading.state ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Refinando...
                                </>
                            ) : (
                                '🔄 Guardar y Refinar'
                            )}
                        </button>
                        <p className="text-sm text-gray-600 mt-2">
                            Los nuevos pasos y sus imágenes serán enviados a la IA para refinamiento
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportDisplay;

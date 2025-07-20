import React from 'react';

function ReportDisplay({ reportJson, imageFiles, loading, error, isRefining, onAddStep, onGenerateTicket, onStepDelete }) {

    if (loading.state) {
        return (
            <div className="text-center py-16">
                <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="mt-4 font-semibold text-gray-700">{loading.message}</p>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
                Error: {error}
            </div>
        );
    }

    if (!reportJson) {
        return <div className="text-center text-gray-500 py-16">El informe generado por la IA aparecerá aquí.</div>
    }

    const getImageIndexFromString = (imageRef) => {
        if (!imageRef || typeof imageRef !== 'string') return -1;
        const match = imageRef.match(/\d+/);
        return match ? parseInt(match[0], 10) - 1 : -1;
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 min-h-[300px] glassmorphism">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Reporte Visual</h2>
            
            {isRefining && (
                <button onClick={onAddStep} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 mb-4">
                    ➕ Agregar Nuevo Paso
                </button>
            )}

            <div id="report-content" className="report-content" contentEditable={isRefining}>
                <h1>{reportJson.Nombre_del_Escenario || 'Informe de Análisis'}</h1>
                <p className="mb-4"><strong>Conclusión General:</strong> {reportJson.Conclusion_General_Flujo || 'N/A'}</p>
                <h2>Pasos Analizados:</h2>
                <table>
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
                        {reportJson.Pasos_Analizados.map((paso) => {
                            const isFailure = paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('fallido');
                            const statusClass = isFailure ? 'status-failure' : paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('exitosa') ? 'status-success' : 'status-deviation';
                            const imgIndexEntrada = getImageIndexFromString(paso.imagen_referencia_entrada);
                            const imgIndexSalida = getImageIndexFromString(paso.imagen_referencia_salida);
                            
                            return (
                                <React.Fragment key={paso.numero_paso}>
                                    <tr className={statusClass}>
                                        <td>{paso.numero_paso}</td>
                                        <td>{paso.descripcion_accion_observada || ''}</td>
                                        <td>{paso.dato_de_entrada_paso || ''}</td>
                                        <td>{paso.resultado_esperado_paso || ''}</td>
                                        <td>{paso.resultado_obtenido_paso_y_estado || ''}</td>
                                        <td>
                                            {isFailure && !isRefining && <button onClick={() => onGenerateTicket(paso.numero_paso)} className="bug-ticket-btn bg-red-100 text-red-700 text-xs font-bold py-1 px-2 rounded hover:bg-red-200">✨ Crear Ticket</button>}
                                            <button onClick={() => onStepDelete(paso.numero_paso)} data-step={paso.numero_paso} className="delete-step-btn bg-red-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-red-600">Eliminar</button>
                                        </td>
                                    </tr>
                                    {imgIndexEntrada >= 0 && imageFiles[imgIndexEntrada] && (
                                        <tr className="evidence-row"><td colSpan="6">
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Evidencia (Entrada): {paso.imagen_referencia_entrada}</p>
                                            <img src={imageFiles[imgIndexEntrada].dataUrl} alt={`Evidencia para paso ${paso.numero_paso}`} className="evidence-image" />
                                        </td></tr>
                                    )}
                                    {imgIndexSalida >= 0 && imageFiles[imgIndexSalida] && (
                                        <tr className="evidence-row"><td colSpan="6">
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Evidencia (Salida): {paso.imagen_referencia_salida}</p>
                                            <img src={imageFiles[imgIndexSalida].dataUrl} alt={`Evidencia de salida para paso ${paso.numero_paso}`} className="evidence-image" />
                                        </td></tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ReportDisplay;
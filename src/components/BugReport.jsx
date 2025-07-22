import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';

function BugReport({ data, onClose }) {
    const reportRef = useRef(null);

    const handleDownload = () => {
        if (!reportRef.current) return;
        const opt = {
            margin: 10,
            filename: `reporte_bugs_comparacion_${new Date().toISOString().split('T')[0]}.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(reportRef.current).save();
    };

    return (
        <div className="mt-6" ref={reportRef}>
            <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h3 className="text-xl font-semibold">🐞 Reporte de Bugs Encontrados</h3>
                <div className="space-x-2">
                    <button onClick={handleDownload} className="bg-primary text-white px-3 py-1 rounded text-sm">📄 Descargar PDF</button>
                    <button onClick={onClose} className="bg-gray-500 text-white px-3 py-1 rounded text-sm">Cerrar Reporte</button>
                </div>
            </div>
            {Array.isArray(data) && data.map((bug, idx) => (
                <div key={idx} className="mb-6 border-b pb-4">
                    <div className="flex items-center mb-1 text-sm font-semibold">
                        <span className="mr-2">🔶 {bug.severidad}</span>
                        <span>🟡 {bug.prioridad}</span>
                    </div>
                    <h4 className="font-semibold mb-1">📌 {bug.titulo_bug} <span className="text-xs text-gray-500">({bug.id_bug})</span></h4>
                    {bug.descripcion_diferencia_general && (
                        <p className="mb-2">🧾 {bug.descripcion_diferencia_general}</p>
                    )}
                    <p className="mb-2"><strong>✅ Resultado Esperado:</strong> {bug.resultado_esperado}</p>
                    <p className="mb-2"><strong>❌ Resultado Actual:</strong> {bug.resultado_actual}</p>
                    {bug.pasos_para_reproducir && (
                        <div className="mb-2">
                            <strong>📝 Pasos para Reproducir:</strong>
                            <ol className="list-decimal ml-6">
                                {bug.pasos_para_reproducir.map((p, i) => (
                                    <li key={i}>{p.descripcion}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                    <p className="mb-2"><strong>🖼️ Referencias de Imágenes:</strong> {bug.imagen_referencia_flujo_a}, {bug.imagen_referencia_flujo_b}</p>
                </div>
            ))}
        </div>
    );
}

export default BugReport;

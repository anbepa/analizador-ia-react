import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';

function BugReport({ data, flowA = [], flowB = [], onClose }) {
    const reportRef = useRef(null);

    const getImageUrl = (ref) => {
        if (!ref || typeof ref !== 'string') return null;
        const match = ref.match(/Imagen\s+([AB])\.(\d+)/i);
        if (!match) return null;
        const flow = match[1].toUpperCase();
        const idx = parseInt(match[2], 10) - 1;
        const arr = flow === 'A' ? flowA : flowB;
        return arr[idx]?.dataUrl || null;
    };

    const handleDownload = () => {
        if (!reportRef.current) return;
        const node = reportRef.current;
        const buttons = node.querySelectorAll('.pdf-hide');
        buttons.forEach((b) => (b.style.display = 'none'));

        const images = node.querySelectorAll('img');
        const loadPromises = Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
                const onLoad = () => {
                    img.removeEventListener('load', onLoad);
                    resolve();
                };
                img.addEventListener('load', onLoad);
                img.addEventListener('error', onLoad);
            });
        });

        Promise.all(loadPromises).then(() => {
            const opt = {
                margin: 10,
                filename: `reporte_bugs_comparacion_${new Date()
                    .toISOString()
                    .split('T')[0]}.pdf`,
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            const res = html2pdf().set(opt).from(node).save();
            const restore = () => buttons.forEach((b) => (b.style.display = ''));
            if (res && typeof res.then === 'function') {
                res.then(restore);
            } else {
                restore();
            }
        });
    };


    const severityStyles = {
        Alta: { border: 'border-red-600', bg: 'bg-red-50' },
        Media: { border: 'border-yellow-500', bg: 'bg-yellow-50' },
        Baja: { border: 'border-blue-400', bg: 'bg-blue-50' }
    };

    return (
        <div className="mt-6" ref={reportRef} id="pdf-export-section">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    🐞 Reporte de Bugs Encontrados
                </h3>
                <div className="space-x-2 flex">
                    <button
                        onClick={handleDownload}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded text-sm pdf-hide"
                    >
                        📄 Descargar PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded text-sm pdf-hide"
                    >
                        Cerrar Reporte
                    </button>
                </div>
            </div>
            {Array.isArray(data) && data.map((bug, idx) => {
                const styles = severityStyles[bug.severidad] || { border: 'border-gray-400', bg: 'bg-gray-50' };
                const imgA = getImageUrl(bug.imagen_referencia_flujo_a);
                const imgB = getImageUrl(bug.imagen_referencia_flujo_b);

                return (
                    <div key={idx} className={`shadow-lg rounded-xl border-l-4 ${styles.border} ${styles.bg} p-4 mb-6`}>
                        <div className="flex items-center mb-2">
                            <span className="text-2xl mr-2">🐞</span>
                            <h4 className="text-lg font-semibold text-gray-800 flex-1">
                                {bug.titulo_bug} <span className="text-xs text-gray-500">({bug.id_bug})</span>
                            </h4>
                        </div>
                        <div className="text-sm mb-2 font-medium text-gray-700 flex gap-4">
                            <span>⚠️ {bug.severidad}</span>
                            <span>🏷️ {bug.prioridad}</span>
                        </div>
                        {bug.descripcion_diferencia_general && (
                            <p className="mb-2 text-base leading-relaxed text-gray-700">{bug.descripcion_diferencia_general}</p>
                        )}
                        <p className="mb-2 text-base leading-relaxed">
                            <span className="font-semibold text-green-700 mr-1">✅ Resultado Esperado:</span>
                            {bug.resultado_esperado}
                        </p>
                        <p className="mb-2 text-base leading-relaxed">
                            <span className="font-semibold text-red-700 mr-1">❌ Resultado Actual:</span>
                            {bug.resultado_actual}
                        </p>
                        {bug.pasos_para_reproducir && (
                            <div className="mb-2">
                                <h5 className="font-semibold mb-1 flex items-center gap-1 text-gray-800">📝 Pasos para Reproducir</h5>
                                <ol className="list-decimal pl-6 space-y-1 text-base leading-relaxed text-gray-700">
                                    {bug.pasos_para_reproducir.map((p, i) => (
                                        <li key={i}>{p.descripcion}</li>
                                    ))}
                                </ol>
                            </div>
                        )}
                        {(imgA || imgB) && (
                            <div className="mt-3 flex flex-wrap gap-4">
                                {imgA && (
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-semibold mb-1 flex items-center gap-1">🖼️ Flujo A: {bug.imagen_referencia_flujo_a}</span>
                                        <img src={imgA} alt={bug.imagen_referencia_flujo_a} className="w-32 h-auto rounded border" crossOrigin="anonymous" />
                                    </div>
                                )}
                                {imgB && (
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-semibold mb-1 flex items-center gap-1">🖼️ Flujo B: {bug.imagen_referencia_flujo_b}</span>
                                        <img src={imgB} alt={bug.imagen_referencia_flujo_b} className="w-32 h-auto rounded border" crossOrigin="anonymous" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

        </div>
    );
}

export default BugReport;

import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';

function BugReport({ data, flowA = [], flowB = [] }) {
    const reportRef = useRef(null);

    const getImageUrl = (ref) => {
        if (!ref || typeof ref !== 'string') return null;
        const match = ref.match(/\b([ab])[^0-9]*(\d+)/i);
        if (!match) return null;
        const flow = match[1].toUpperCase();
        const num = parseInt(match[2], 10);
        if (isNaN(num)) return null;
        const arr = flow === 'A' ? flowA : flowB;
        const found = arr.find((img) => img.ref === `${flow}${num}`);
        return found?.dataUrl || arr[num - 1]?.dataUrl || null;
    };

    const getFallbackImage = (flow) => {
        const arr = flow === 'A' ? flowA : flowB;
        return arr[0]?.dataUrl || null;
    };

    const handleDownload = () => {
        if (!reportRef.current) return;
        const node = reportRef.current;
        
        // Ocultar botones
        const buttons = node.querySelectorAll('.pdf-hide');
        buttons.forEach((b) => (b.style.display = 'none'));

        // Ajustar imágenes para PDF - Tamaño más grande
        const pdfImages = node.querySelectorAll('.pdf-image');
        pdfImages.forEach((img) => {
            img.dataset.origWidth = img.style.width;
            img.style.width = '400px';
            img.style.height = 'auto';
            img.style.maxWidth = '400px';
        });

        // Esperar a que las imágenes se carguen
        const images = node.querySelectorAll('img');
        const loadPromises = Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
                const timeout = setTimeout(() => resolve(), 3000); // timeout de 3 segundos
                const onLoad = () => {
                    clearTimeout(timeout);
                    img.removeEventListener('load', onLoad);
                    img.removeEventListener('error', onLoad);
                    resolve();
                };
                img.addEventListener('load', onLoad);
                img.addEventListener('error', onLoad);
            });
        });

        Promise.all(loadPromises).then(() => {
            // Configuración optimizada para html2pdf con mejor calidad de texto
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `reporte_bugs_comparacion_${new Date().toISOString().split('T')[0]}.pdf`,
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    scrollX: 0,
                    scrollY: 0,
                    windowWidth: 1200,
                    windowHeight: 800,
                    letterRendering: true,
                    dpi: 300,
                    backgroundColor: '#ffffff'
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'landscape',
                    compress: false
                }
            };

            html2pdf().set(opt).from(node).toPdf().get('pdf').then((pdf) => {
                // Asegurar que todas las páginas se incluyan
                const totalPages = pdf.internal.getNumberOfPages();
                console.log(`PDF generado con ${totalPages} páginas`);
                
                // Guardar el PDF
                pdf.save(opt.filename);
                
                // Restaurar elementos
                buttons.forEach((b) => (b.style.display = ''));
                pdfImages.forEach((img) => {
                    img.style.width = img.dataset.origWidth || '';
                    delete img.dataset.origWidth;
                });
            }).catch((error) => {
                console.error('Error generando PDF:', error);
                // Restaurar elementos en caso de error
                buttons.forEach((b) => (b.style.display = ''));
                pdfImages.forEach((img) => {
                    img.style.width = img.dataset.origWidth || '';
                    delete img.dataset.origWidth;
                });
            });
        });
    };


    const severityStyles = {
        Alta: { border: 'border-red-600', bg: 'bg-red-50' },
        Media: { border: 'border-yellow-500', bg: 'bg-yellow-50' },
        Baja: { border: 'border-blue-400', bg: 'bg-blue-50' }
    };

    return (
        <>
            <div className="mt-6" ref={reportRef} id="pdf-export-section" style={{ 
                maxWidth: '800px', 
                margin: '0 auto',
                fontSize: '14px',
                transform: 'scale(1)',
                transformOrigin: 'top left'
            }}>
                <div className="flex justify-between items-center border-b pb-2 mb-4 pdf-hide">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    Análisis de Bugs
                </h3>
                <div className="space-x-2 flex">
                    <button
                        onClick={handleDownload}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded text-sm"
                    >
                        📄 Descargar PDF
                    </button>
                </div>
            </div>
            {Array.isArray(data) && data.map((bug, idx) => {
                const imgA = getImageUrl(bug.imagen_referencia_flujo_a) || getFallbackImage('A');
                const imgB = getImageUrl(bug.imagen_referencia_flujo_b) || getFallbackImage('B');

                return (
                    <div key={idx} className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 bug-container" style={{
                        fontFamily: 'Segoe UI, Calibri, Arial, sans-serif',
                        lineHeight: '1.6'
                    }}>
                        {/* Título principal */}
                        <h1 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginBottom: '1rem',
                            pageBreakInside: 'avoid',
                            breakInside: 'avoid',
                            minHeight: '60px'
                        }}>
                            {bug.titulo_bug}
                        </h1>

                        {/* Descripción General */}
                        <div style={{
                            marginBottom: '1rem',
                            pageBreakInside: 'avoid',
                            breakInside: 'avoid'
                        }}>
                            <h2 style={{
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '0.5rem'
                            }}>Descripción General</h2>
                            <div style={{ padding: '1rem' }}>
                                <p style={{
                                    color: '#374151',
                                    lineHeight: '1.625'
                                }}>
                                    {bug.descripcion_diferencia_general || bug.titulo_bug}
                                </p>
                            </div>
                        </div>

                        {/* Pasos para Reproducir */}
                        {bug.pasos_para_reproducir && (
                            <div style={{
                                marginBottom: '1rem',
                                pageBreakInside: 'avoid',
                                breakInside: 'avoid'
                            }}>
                                <h2 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: '0.5rem'
                                }}>Pasos para Reproducir</h2>
                                <ol style={{ listStyle: 'none', padding: 0 }}>
                                    {bug.pasos_para_reproducir.map((p, i) => (
                                        <li key={i} style={{
                                            padding: '0.75rem',
                                            borderLeft: '3px solid #d1d5db',
                                            marginBottom: '0.5rem',
                                            pageBreakInside: 'avoid',
                                            breakInside: 'avoid'
                                        }}>
                                            <strong>{i + 1}.</strong> {p.descripcion}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* Resultados lado a lado */}
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            marginBottom: '1rem',
                            pageBreakInside: 'avoid',
                            breakInside: 'avoid'
                        }}>
                            {/* Resultado Actual */}
                            <div style={{
                                flex: 1,
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderLeft: '4px solid #dc2626',
                                padding: '1rem',
                                borderRadius: '0.5rem'
                            }}>
                                <h3 style={{
                                    fontWeight: '600',
                                    color: '#991b1b',
                                    marginBottom: '0.5rem'
                                }}>Resultado Actual</h3>
                                <p style={{
                                    color: '#374151',
                                    lineHeight: '1.625'
                                }}>{bug.resultado_actual}</p>
                            </div>

                            {/* Resultado Esperado */}
                            <div style={{
                                flex: 1,
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderLeft: '4px solid #16a34a',
                                padding: '1rem',
                                borderRadius: '0.5rem'
                            }}>
                                <h3 style={{
                                    fontWeight: '600',
                                    color: '#166534',
                                    marginBottom: '0.5rem'
                                }}>Resultado Esperado</h3>
                                <p style={{
                                    color: '#374151',
                                    lineHeight: '1.625'
                                }}>{bug.resultado_esperado}</p>
                            </div>
                        </div>

                        {/* Evidencia Visual */}
                        {(imgA || imgB) && (
                            <div style={{
                                marginBottom: '1rem',
                                pageBreakInside: 'avoid',
                                breakInside: 'avoid',
                                minHeight: '200px'
                            }}>
                                <h2 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: '0.75rem',
                                    textAlign: 'center'
                                }}>Evidencia Visual</h2>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '1rem',
                                    flexWrap: 'wrap'
                                }}>
                                    {imgA && (
                                        <div style={{
                                            textAlign: 'center',
                                            pageBreakInside: 'avoid',
                                            breakInside: 'avoid'
                                        }}>
                                            <p style={{
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                color: '#4b5563',
                                                marginBottom: '0.5rem'
                                            }}>
                                                Flujo A: {bug.imagen_referencia_flujo_a || 'N/A'}
                                            </p>
                                            <img 
                                                src={imgA} 
                                                alt={bug.imagen_referencia_flujo_a || 'Flujo A'} 
                                                className="pdf-image"
                                                crossOrigin="anonymous"
                                                style={{
                                                    maxWidth: '450px',
                                                    height: 'auto',
                                                    borderRadius: '0.5rem',
                                                    border: '2px solid #d1d5db',
                                                    pageBreakInside: 'avoid',
                                                    breakInside: 'avoid'
                                                }}
                                            />
                                        </div>
                                    )}
                                    {imgB && (
                                        <div style={{
                                            textAlign: 'center',
                                            pageBreakInside: 'avoid',
                                            breakInside: 'avoid'
                                        }}>
                                            <p style={{
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                color: '#4b5563',
                                                marginBottom: '0.5rem'
                                            }}>
                                                Flujo B: {bug.imagen_referencia_flujo_b || 'Imagen B.2'}
                                            </p>
                                            <img 
                                                src={imgB} 
                                                alt={bug.imagen_referencia_flujo_b || 'Flujo B'} 
                                                className="pdf-image"
                                                crossOrigin="anonymous"
                                                style={{
                                                    maxWidth: '450px',
                                                    height: 'auto',
                                                    borderRadius: '0.5rem',
                                                    border: '2px solid #d1d5db',
                                                    pageBreakInside: 'avoid',
                                                    breakInside: 'avoid'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <p style={{
                                    textAlign: 'center',
                                    fontSize: '0.875rem',
                                    fontStyle: 'italic',
                                    color: '#6b7280',
                                    marginTop: '0.5rem'
                                }}>Error actual</p>
                            </div>
                        )}
                    </div>
                );
            })}
            </div>
        </>
    );
}

export default BugReport;

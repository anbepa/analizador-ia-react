

const getImageIndexFromString = (imageRef) => {
    if (!imageRef || typeof imageRef !== 'string') return -1;
    const match = imageRef.match(/\d+/);
    return match ? parseInt(match[0], 10) - 1 : -1;
};

export const downloadHtmlReport = (reports) => {
    if (!reports || (Array.isArray(reports) && reports.length === 0)) {
        alert("No hay reportes para descargar.");
        return;
    }

    const reportsArray = Array.isArray(reports) ? reports : [reports];
    const today = new Date().toISOString().split('T')[0];
    let reportsHtml = '';

    reportsArray.forEach(reportJson => {
        if (!reportJson || !reportJson.Pasos_Analizados) return;

        let tableRows = '';
        reportJson.Pasos_Analizados.forEach(paso => {
            const imageFiles = reportJson.imageFiles || [];
            const imgIndexEntrada = getImageIndexFromString(paso.imagen_referencia_entrada);
            const imgIndexSalida = getImageIndexFromString(paso.imagen_referencia_salida);
            
            const isFailure = paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('fallido');
            const isSuccess = paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('exitosa');
            const statusIcon = isFailure ? '❌' : isSuccess ? '✔️' : '⚠️';
            const statusClass = isFailure ? 'status-failure' : isSuccess ? 'status-success' : 'status-deviation';

            tableRows += `
                <tr class="${statusClass}">
                    <td>${paso.numero_paso}</td>
                    <td>${paso.descripcion_accion_observada || ''}</td>
                    <td>${paso.dato_de_entrada_paso || ''}</td>
                    <td>${paso.resultado_esperado_paso || ''}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span>${statusIcon}</span>
                            <span>${paso.resultado_obtenido_paso_y_estado || ''}</span>
                        </div>
                    </td>
                </tr>
            `;

            // Agregar evidencia de entrada si existe
            if (imgIndexEntrada >= 0 && imageFiles[imgIndexEntrada]) {
                tableRows += `
                    <tr class="evidence-row">
                        <td colspan="5" style="padding: 10px; text-align: center; background-color: #fdfdfd; border-top: none;">
                            <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">
                                Evidencia (Entrada): ${paso.imagen_referencia_entrada}
                            </p>
                            <img src="${imageFiles[imgIndexEntrada].dataUrl}" alt="Evidencia para paso ${paso.numero_paso}" class="evidence-image">
                        </td>
                    </tr>
                `;
            }

            // Agregar evidencia de salida si existe
            if (imgIndexSalida >= 0 && imageFiles[imgIndexSalida]) {
                tableRows += `
                    <tr class="evidence-row">
                        <td colspan="5" style="padding: 10px; text-align: center; background-color: #fdfdfd; border-top: none;">
                            <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">
                                Evidencia (Salida): ${paso.imagen_referencia_salida}
                            </p>
                            <img src="${imageFiles[imgIndexSalida].dataUrl}" alt="Evidencia de salida para paso ${paso.numero_paso}" class="evidence-image">
                        </td>
                    </tr>
                `;
            }
        });

        reportsHtml += `
            <div class="report-container">
                <h1>${reportJson.Nombre_del_Escenario || 'Informe de Análisis'}</h1>
                <p class="mb-4"><strong>Conclusión General:</strong> ${reportJson.Conclusion_General_Flujo || 'N/A'}</p>
                <h2>Pasos Analizados:</h2>
                <div class="table-container">
                    <table class="analysis-table">
                        <thead>
                            <tr>
                                <th style="width: 5%">Paso</th>
                                <th style="width: 25%">Acción/Observación</th>
                                <th style="width: 15%">Dato Entrada</th>
                                <th style="width: 20%">Res. Esperado</th>
                                <th style="width: 35%">Res. Obtenido y Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    const htmlContent = `
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Informe de Análisis de Flujo</title>
            <style>
                body {
                    font-family: 'Segoe UI', 'Calibri', Arial, sans-serif;
                    margin: 20px;
                    line-height: 1.6;
                    color: #333;
                    background-color: #ffffff;
                }
                .report-container {
                    max-width: 900px;
                    margin: auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    padding: 30px;
                    border: 2px solid #dee2e6;
                    page-break-after: always;
                    margin-bottom: 30px;
                }
                h1 {
                    color: #2c3e50;
                    font-size: 1.8em;
                    font-weight: 600;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #e9ecef;
                }
                h2 {
                    font-size: 1.3em;
                    color: #34495e;
                    margin-top: 25px;
                    margin-bottom: 15px;
                    font-weight: 600;
                }
                .general-description {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border-left: 4px solid #6c757d;
                }
                .steps-section {
                    margin: 25px 0;
                }
                .step-item {
                    margin-bottom: 15px;
                    padding: 12px;
                    background-color: #f8f9fa;
                    border-radius: 6px;
                    border-left: 3px solid #dee2e6;
                }
                .result-section {
                    display: flex;
                    gap: 20px;
                    margin: 20px 0;
                }
                .result-actual {
                    flex: 1;
                    background-color: #ffeaea;
                    border: 1px solid #f5c6cb;
                    border-left: 4px solid #dc3545;
                    padding: 15px;
                    border-radius: 8px;
                }
                .result-expected {
                    flex: 1;
                    background-color: #eafaf1;
                    border: 1px solid #c3e6cb;
                    border-left: 4px solid #28a745;
                    padding: 15px;
                    border-radius: 8px;
                }
                .result-title {
                    font-weight: 600;
                    margin-bottom: 8px;
                    font-size: 1.1em;
                }
                .result-actual .result-title {
                    color: #721c24;
                }
                .result-expected .result-title {
                    color: #155724;
                }
                .evidence-section {
                    margin: 25px 0;
                    text-align: center;
                }
                .evidence-title {
                    font-weight: 600;
                    color: #495057;
                    margin-bottom: 15px;
                    font-size: 1.1em;
                }
                .evidence-image {
                    max-width: 100%;
                    height: auto;
                    border: 2px solid #dee2e6;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin: 10px auto;
                    display: block;
                    background-color: #fff;
                }
                .conclusion-section {
                    background-color: #e9ecef;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 30px;
                    border-left: 4px solid #6c757d;
                }
                .conclusion-section h2 {
                    color: #495057;
                    margin-top: 0;
                }
                .conclusion-section p {
                    margin-bottom: 10px;
                }
                .conclusion-section strong {
                    color: #343a40;
                }
                .print-button {
                    display: block;
                    width: 200px;
                    margin: 20px auto;
                    padding: 12px 20px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    text-align: center;
                    transition: background-color 0.3s;
                }
                .print-button:hover {
                    background-color: #0056b3;
                }
                .table-container {
                    overflow: auto;
                    margin: 20px 0;
                }
                .analysis-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 0.9em;
                }
                .analysis-table th,
                .analysis-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                    vertical-align: top;
                }
                .analysis-table th {
                    background-color: #f2f2f2;
                    font-weight: 600;
                }
                .analysis-table tr.status-success td:first-child {
                    border-left: 5px solid #28a745;
                }
                .analysis-table tr.status-failure td:first-child {
                    border-left: 5px solid #dc3545;
                }
                .analysis-table tr.status-deviation td:first-child {
                    border-left: 5px solid #ffc107;
                }
                .analysis-table tr:nth-child(odd) {
                    background-color: #f9f9f9;
                }
                .mb-4 {
                    margin-bottom: 1rem;
                }
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: auto;
                        margin: 1.5cm;
                    }
                    body {
                        margin: 0;
                        background-color: white;
                    }
                    .report-container {
                        page-break-after: always;
                        box-shadow: none;
                        border: none;
                        margin-bottom: 0;
                    }
                }
            </style>
        </head>
        <body>
            <button onclick="window.print()" class="no-print print-button">📄 Descargar como PDF</button>
            ${reportsHtml}
        </body>
        </html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AnalisisFlujo_${today}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

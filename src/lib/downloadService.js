

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
            const isFailure = paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('fallido');
            const statusClass = isFailure ? 'status-failure' :
                paso.resultado_obtenido_paso_y_estado?.toLowerCase().includes('exitosa') ? 'status-success' : 'status-deviation';

            tableRows += `<tr class="${statusClass}">
                <td>${paso.numero_paso}</td>
                <td>${paso.descripcion_accion_observada || ''}</td>
                <td>${paso.dato_de_entrada_paso || ''}</td>
                <td>${paso.resultado_esperado_paso || ''}</td>
                <td>${paso.resultado_obtenido_paso_y_estado || ''}</td>
            </tr>`;

            const imageFiles = reportJson.imageFiles || [];
            const imgIndexEntrada = getImageIndexFromString(paso.imagen_referencia_entrada);
            if (imgIndexEntrada >= 0 && imageFiles[imgIndexEntrada]) {
                tableRows += `<tr class="evidence-row"><td colspan="5">
                    <p class="text-xs font-semibold text-gray-500 mb-1">Evidencia (Entrada): ${paso.imagen_referencia_entrada}</p>
                    <img src="${imageFiles[imgIndexEntrada].dataUrl}" alt="Evidencia para paso ${paso.numero_paso}" class="evidence-image">
                </td></tr>`;
            }
            const imgIndexSalida = getImageIndexFromString(paso.imagen_referencia_salida);
            if (imgIndexSalida >= 0 && imageFiles[imgIndexSalida]) {
                tableRows += `<tr class="evidence-row"><td colspan="5">
                    <p class="text-xs font-semibold text-gray-500 mb-1">Evidencia (Salida): ${paso.imagen_referencia_salida}</p>
                    <img src="${imageFiles[imgIndexSalida].dataUrl}" alt="Evidencia de salida para paso ${paso.numero_paso}" class="evidence-image">
                </td></tr>`;
            }
        });

        reportsHtml += `
            <div class="report-container">
                <h1>Escenario: ${reportJson.Nombre_del_Escenario || 'Informe de Análisis'}</h1>
                <p><strong>Fecha:</strong> ${today}</p>
                <h2>Pasos Analizados:</h2>
                <table><thead><tr><th>Paso</th><th>Acción/Observación</th><th>Dato Entrada</th><th>Res. Esperado</th><th>Res. Obtenido y Estado</th></tr></thead><tbody>${tableRows}</tbody></table>
                <div class="conclusion-section">
                    <h2>Conclusión General</h2>
                    <p><strong>Resultado Esperado General:</strong> ${reportJson.Resultado_Esperado_General_Flujo || 'N/A'}</p>
                    <p><strong>Conclusión del Flujo:</strong> ${reportJson.Conclusion_General_Flujo || 'N/A'}</p>
                </div>
            </div>
            <hr style="margin: 40px 0; border: 1px solid #ccc;">
        `;
    });

    const htmlContent = `
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Informe de Análisis de Flujo</title>
            <style>body{font-family:Segoe UI,Calibri,Arial,sans-serif;margin:20px;line-height:1.6;color:#333}.report-container{max-width:900px;margin:auto; page-break-after: always;}h1{color:#3b5a6b;border-bottom:2px solid #e9ecef;padding-bottom:10px}h2{font-size:1.4em;color:#4a6d7c;margin-top:20px;margin-bottom:10px;padding-bottom:5px;border-bottom:1px dashed #e0e0e0}table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:.9em}th,td{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}th{background-color:#f2f2f2;font-weight:600}tr.evidence-row td { padding: 10px; text-align: center; background-color: #fdfdfd; border-top: none; }img.evidence-image { width: 100%; max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 5px auto; background-color: #fff; object-fit: contain; }tr.status-success td:first-child{border-left:5px solid #28a745!important}tr.status-failure td:first-child{border-left:5px solid #dc3545!important}tr.status-deviation td:first-child{border-left:5px solid #ffc107!important}.conclusion-section p{margin-bottom:8px} .conclusion-section strong{color:#555}.print-button {display: block;width: 150px;margin: 20px auto;padding: 10px 15px;background-color: #007bff;color: white;border: none;border-radius: 5px;cursor: pointer;font-size: 16px;text-align: center;}@media print {.no-print {display: none !important;}@page {size: auto;margin: 0mm;}body {margin: 1.6cm;}.report-container{page-break-after: always;}}</style>
        </head>
        <body>
            <button onclick="window.print()" class="no-print print-button">Imprimir en PDF</button>
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

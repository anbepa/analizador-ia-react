

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
                <td>${paso.elemento_clave_y_ubicacion_aproximada || 'N/A'}</td>
                <td>${paso.dato_de_entrada_paso || ''}</td>
                <td>${paso.resultado_esperado_paso || ''}</td>
                <td>${paso.resultado_obtenido_paso_y_estado || ''}</td>
            </tr>`;

            // Buscar imagen asociada
            const imageFiles = reportJson.imageFiles || [];
            const imgIndex = getImageIndexFromString(paso.imagen_referencia);

            if (imgIndex >= 0 && imageFiles[imgIndex]) {
                const imgSrc = imageFiles[imgIndex].dataURL || imageFiles[imgIndex].dataUrl;
                if (imgSrc) {
                    tableRows += `<tr class="evidence-row"><td colspan="6">
                        <div class="evidence-container">
                            <p class="text-xs font-semibold text-gray-500">Evidencia: ${paso.imagen_referencia}</p>
                            <img src="${imgSrc}" alt="Evidencia paso ${paso.numero_paso}" class="evidence-image">
                        </div>
                    </td></tr>`;
                }
            }
        });

        // Clean scenario name to avoid duplication of "Escenario:" prefix
        let scenarioName = reportJson.Nombre_del_Escenario || 'Informe de Análisis';
        if (scenarioName.startsWith('Escenario: ')) {
            scenarioName = scenarioName.substring(11); // Remove "Escenario: " prefix
        }

        reportsHtml += `
    < div class="report-container" >
                <h1>Escenario: ${scenarioName}</h1>
                <p><strong>Fecha:</strong> ${today}</p>
                <h2>Pasos Analizados:</h2>
                <table><thead><tr><th>Paso</th><th>Acción/Observación</th><th>Elemento Clave</th><th>Dato Entrada</th><th>Res. Esperado</th><th>Res. Obtenido y Estado</th></tr></thead><tbody>${tableRows}</tbody></table>
                <div class="conclusion-section">
                    <h2>Conclusión General</h2>
                    <p><strong>Resultado Esperado General:</strong> ${reportJson.Resultado_Esperado_General_Flujo || 'N/A'}</p>
                    <p><strong>Conclusión del Flujo:</strong> ${reportJson.Conclusion_General_Flujo || 'N/A'}</p>
                </div>
            </div >
    <hr style="margin: 40px 0; border: 1px solid #ccc;">
        `;
    });

    const htmlContent = `
        <html>
            <head>
                <meta charset="UTF-8">
                    <title>Informe de Análisis de Flujo</title>
                    <style>
                        body{font - family:Segoe UI,Calibri,Arial,sans-serif;margin:20px;line-height:1.6;color:#333}
                        .report-container{max - width:900px;margin:auto; page-break-after: always;}
                        h1{color:#3b5a6b;border-bottom:2px solid #e9ecef;padding-bottom:10px}
                        h2{font - size:1.4em;color:#4a6d7c;margin-top:20px;margin-bottom:10px;padding-bottom:5px;border-bottom:1px dashed #e0e0e0}
                        table{width:100%;max-width:100%;border-collapse:collapse;margin-bottom:20px;font-size:.9em;table-layout:fixed}
                        th,td{
                            border:1px solid #ddd;
                        padding:8px;
                        text-align:left;
                        vertical-align:top;
                        word-wrap:break-word !important;
                        word-break:break-all !important;
                        overflow-wrap:break-word !important;
                        hyphens:auto !important;
                        white-space:normal !important;
                        max-width:0 !important;
                        min-width:0 !important;
                        overflow:hidden !important;
                }
                        th{background - color:#f2f2f2;font-weight:600}
                        th:nth-child(1), td:nth-child(1) {width: 5%; min-width: 60px; }
                        th:nth-child(2), td:nth-child(2) {width: 20%; }
                        th:nth-child(3), td:nth-child(3) {width: 18%; }
                        th:nth-child(4), td:nth-child(4) {width: 17%; }
                        th:nth-child(5), td:nth-child(5) {width: 20%; }
                        th:nth-child(6), td:nth-child(6) {width: 20%; }
                        tr.evidence-row td {
                            padding: 0;
                        background-color: #fdfdfd;
                        border-top: none;
                        width: 100%;
                        max-width: 100%;
                        overflow: hidden; 
                }
                        .evidence-container {
                            width: 100%;
                        max-width: 100%;
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        box-sizing: border-box;
                        overflow: hidden; 
                }
                        img.evidence-image {
                            width: 100%;
                        max-width: 100%;
                        height: auto;
                        min-height: 300px;
                        border: 1px solid #ccc;
                        border-radius: 8px;
                        display: block;
                        background-color: #fff;
                        object-fit: contain;
                        box-sizing: border-box; 
                }
                        tr.status-success td:first-child{border - left:5px solid #28a745!important}
                        tr.status-failure td:first-child{border - left:5px solid #dc3545!important}
                        tr.status-deviation td:first-child{border - left:5px solid #ffc107!important}
                        .conclusion-section p{margin - bottom:8px}
                        .conclusion-section strong{color:#555}
                        .print-button {
                            display: block;
                        width: 150px;
                        margin: 20px auto;
                        padding: 10px 15px;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        text-align: center;
                }
                        @media print {
                    .no - print {display: none !important;}
                        @page {size: auto;margin: 0mm;}
                        body {margin: 1.6cm;}
                        .report-container{page -break-after: always;}
                        table{table - layout:fixed !important;}
                        th,td{
                            word - wrap:break-word !important;
                        word-break:break-all !important;
                        overflow-wrap:break-word !important;
                        white-space:normal !important;
                        overflow:hidden !important;
                    }
                }
                    </style>
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

export const downloadDocReport = (reports) => {
    if (!reports || (Array.isArray(reports) && reports.length === 0)) {
        alert("No hay reportes para descargar.");
        return;
    }

    const reportsArray = Array.isArray(reports) ? reports : [reports];
    const today = new Date().toISOString().split('T')[0];
    let contentHtml = '';

    reportsArray.forEach(reportJson => {
        if (!reportJson || !reportJson.Pasos_Analizados) return;

        // Clean scenario name
        let scenarioName = reportJson.Nombre_del_Escenario || 'Informe de Análisis';
        if (scenarioName.startsWith('Escenario: ')) {
            scenarioName = scenarioName.substring(11);
        }

        // HU Number (Try to extract from title or use placeholder if not available in JSON root)
        // Assuming the HU might be part of the title or we can pass it if available. 
        // For now, we'll use a generic approach or try to find it in the title.
        const huMatch = scenarioName.match(/HU-?\s*(\d+)/i) || scenarioName.match(/^(\d+)/);
        const huNumber = huMatch ? huMatch[1] : (reportJson.id_caso || 'N/A');

        contentHtml += `
            <div class="Section1">
                <p class="MsoHeader" style="text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 20px;">
                    Evidencias ${huNumber} ${scenarioName}
                </p>
        `;

        reportJson.Pasos_Analizados.forEach(paso => {
            // Step Description
            contentHtml += `
                <p style="font-family: Arial, sans-serif; font-size: 12pt; margin-top: 20px; margin-bottom: 10px;">
                    <strong>${paso.numero_paso}. ${paso.descripcion_accion_observada || ''}</strong>
                </p>
            `;

            // Image
            const imageFiles = reportJson.imageFiles || [];
            const imgIndex = getImageIndexFromString(paso.imagen_referencia);

            if (imgIndex >= 0 && imageFiles[imgIndex]) {
                const imgSrc = imageFiles[imgIndex].dataURL || imageFiles[imgIndex].dataUrl;
                if (imgSrc) {
                    contentHtml += `
                        <p style="text-align: center; margin-bottom: 20px;">
                            <img src="${imgSrc}" style="width: 70%; height: auto;" />
                        </p>
                    `;
                }
            } else {
                contentHtml += `<p style="font-family: Arial, sans-serif; font-size: 12pt; color: red;">[Sin Evidencia Visual]</p><br />`;
            }
        });

        contentHtml += `</div>`;
    });

    const docTemplate = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="utf-8">
            <title>Reporte Word</title>
            <style>
                @page Section1 {
                    size: 841.9pt 595.3pt; /* Landscape A4 */
                    mso-page-orientation: landscape;
                    margin: 1.0cm 1.0cm 1.0cm 1.0cm;
                }
                div.Section1 {
                    page: Section1;
                }
                body {
                    font-family: Calibri, Arial, sans-serif;
                }
            </style>
        </head>
        <body>
            ${contentHtml}
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', docTemplate], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Evidencias_${today}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

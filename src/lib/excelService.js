import ExcelJS from 'exceljs';

/**
 * Convierte una imagen base64 o URL a ArrayBuffer para Excel
 */
const imageToBuffer = async (imageDataURL) => {
    try {
        // Si es base64, extraer solo los datos
        if (imageDataURL.startsWith('data:image')) {
            const base64Data = imageDataURL.split(',')[1];

            // Decodificar base64 a binario
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            return bytes.buffer;
        }

        // Si es URL, descargar la imagen
        const response = await fetch(imageDataURL);
        const arrayBuffer = await response.arrayBuffer();
        return arrayBuffer;
    } catch (error) {
        console.error('Error convirtiendo imagen:', error);
        return null;
    }
};

/**
 * Genera y descarga un archivo Excel con imágenes de evidencias
 * @param {Object} testCase - Objeto del caso de prueba
 * @param {Array} images - Array de imágenes del reporte
 */
/**
 * Genera y descarga un archivo Excel con imágenes de evidencias alineadas por paso
 * @param {Object} testCase - Objeto del caso de prueba
 * @param {Array} images - Array de imágenes del reporte
 * @param {Function} onProgress - Callback para reportar progreso (0 a 100)
 */
/**
 * Helper para añadir un reporte completo a una hoja de Excel
 * @returns {number} - Siguiente fila libre
 */
const addReportToWorksheet = async (workbook, worksheet, testCase, images = [], startRow = 1) => {
    let currentRowIndex = startRow;

    // Encabezados de columnas para cada reporte
    const headerRow = worksheet.addRow([
        'ID Caso',
        'Escenario de Prueba',
        'Precondiciones',
        'Paso a Paso',
        'Evidencias',
        'Resultado Esperado'
    ]);

    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' } // Azul corporativo
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.height = 30;

    headerRow.eachCell((cell) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    currentRowIndex++;

    const pasosArray = testCase.pasos || testCase.Pasos_Analizados || testCase.test_scenario_steps || [];
    if (pasosArray.length === 0) {
        pasosArray.push({ numero_paso: 1, descripcion: 'Sin pasos definidos' });
    }

    const dataStartRow = currentRowIndex;
    const getImageIndex = (text) => {
        if (!text) return -1;
        const match = text.toString().match(/(\d+)/);
        return match ? parseInt(match[1]) - 1 : -1;
    };

    for (let i = 0; i < pasosArray.length; i++) {
        const paso = pasosArray[i];
        const num = paso.numero_paso || paso.numero || (i + 1);
        const desc = paso.descripcion || paso.descripcion_accion_observada || '';
        const pasoTexto = `${num}. ${desc}`;

        let imgIndex = -1;
        if (paso.imagen_referencia) {
            imgIndex = getImageIndex(paso.imagen_referencia);
        }

        if ((imgIndex === -1 || imgIndex >= images.length)) {
            if (i < images.length) imgIndex = i;
            else if (images.length > 0) imgIndex = images.length - 1;
        }

        const row = worksheet.addRow([
            i === 0 ? (testCase.id_caso || testCase.ID_Caso || 'CP-001') : '',
            i === 0 ? (testCase.escenario_prueba || testCase.Nombre_del_Escenario) : '',
            i === 0 ? (testCase.precondiciones || 'No especificadas') : '',
            pasoTexto,
            '', 
            i === 0 ? (testCase.resultado_esperado || testCase.Resultado_Esperado_General_Flujo || testCase.resultado_obtenido) : ''
        ]);

        row.alignment = { vertical: 'top', wrapText: true };
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        if (imgIndex >= 0 && imgIndex < images.length) {
            const img = images[imgIndex];
            if (!img.isVideo && !img.is_video && img.dataURL) {
                try {
                    const imageBuffer = await imageToBuffer(img.dataURL);
                    if (imageBuffer) {
                        const imageId = workbook.addImage({
                            buffer: imageBuffer,
                            extension: 'png',
                        });
                        row.height = 275;
                        worksheet.addImage(imageId, {
                            tl: { col: 4, row: currentRowIndex - 1, nativeColOff: 95250, nativeRowOff: 95250 },
                            ext: { width: 600, height: 350 },
                            editAs: 'oneCell'
                        });
                    }
                } catch (err) {
                    console.error(`Error insertando imagen ${imgIndex} en paso ${i + 1}`, err);
                }
            }
        } else {
            row.height = 60;
        }

        currentRowIndex++;
    }

    const dataEndRow = currentRowIndex - 1;
    if (dataEndRow > dataStartRow) {
        worksheet.mergeCells(`A${dataStartRow}:A${dataEndRow}`);
        worksheet.mergeCells(`B${dataStartRow}:B${dataEndRow}`);
        worksheet.mergeCells(`C${dataStartRow}:C${dataEndRow}`);
        worksheet.mergeCells(`F${dataStartRow}:F${dataEndRow}`);
    }

    worksheet.addRow([]); // Fila separadora
    currentRowIndex++;
    
    return currentRowIndex;
};

/**
 * Genera y descarga un archivo Excel con imágenes de evidencias alineadas por paso
 */
export const downloadExcelReport = async (testCase, images = [], onProgress = null) => {
    try {
        console.log('📊 Generando Excel con datos:', testCase);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Caso de Prueba');

        worksheet.columns = [
            { width: 15 }, { width: 30 }, { width: 35 },
            { width: 50 }, { width: 100 }, { width: 35 }
        ];

        // Título principal
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'MATRIZ DE EJECUCIÓN DE CASOS DE PRUEBA';
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        worksheet.addRow(['Set de Escenarios:', testCase.set_escenarios || 'Análisis IA', '', 'Fecha:', today, '']);
        worksheet.addRow([]);

        if (onProgress) onProgress(20);
        await addReportToWorksheet(workbook, worksheet, testCase, images, 4);
        if (onProgress) onProgress(80);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Caso_Prueba_${testCase.id_caso || 'Generado'}_${new Date().getTime()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        if (onProgress) onProgress(100);

        return true;
    } catch (error) {
        console.error('❌ Error al generar el archivo Excel:', error);
        throw new Error(`No se pudo generar el archivo Excel: ${error.message}`);
    }
};

/**
 * Genera y descarga un archivo Excel con múltiples casos de prueba detallados
 */
export const downloadBulkExcelReport = async (testCases, onProgress = null) => {
    try {
        console.log('📊 Generando Excel Masivo con', testCases.length, 'casos');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Matriz de Casos');

        worksheet.columns = [
            { width: 15 }, { width: 30 }, { width: 35 },
            { width: 50 }, { width: 100 }, { width: 35 }
        ];

        // Título
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'MATRIZ DE EJECUCIÓN MASIVA DE CASOS DE PRUEBA';
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        worksheet.addRow(['Total Escenarios:', testCases.length, '', 'Fecha de Exportación:', today, '']);
        worksheet.addRow([]);

        let currentRow = 4;
        for (let i = 0; i < testCases.length; i++) {
            if (onProgress) onProgress(Math.round((i / testCases.length) * 90));
            const testCase = testCases[i];
            const images = testCase.imageFiles || testCase.report_images || [];
            currentRow = await addReportToWorksheet(workbook, worksheet, testCase, images, currentRow);
        }

        if (onProgress) onProgress(95);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Matriz_Masiva_${new Date().getTime()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        if (onProgress) onProgress(100);

        return true;
    } catch (error) {
        console.error('Error al generar Excel masivo:', error);
        throw new Error(`No se pudo generar el archivo Excel masivo: ${error.message}`);
    }
};

/**
 * @deprecated Use downloadBulkExcelReport for detailed export
 */
export const downloadMultipleTestCasesExcel = downloadBulkExcelReport;

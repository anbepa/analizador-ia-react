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
 */
export const downloadExcelReport = async (testCase, images = []) => {
    try {
        console.log('📊 Generando Excel con datos:', testCase);
        console.log('🖼️ Imágenes disponibles:', images);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Casos de Prueba');

        // Configurar anchos de columna
        worksheet.columns = [
            { width: 15 },  // A: ID Caso
            { width: 30 },  // B: Escenario de Prueba
            { width: 35 },  // C: Precondiciones
            { width: 50 },  // D: Paso a Paso
            { width: 80 },  // E: Evidencias (Ancho para imagen)
            { width: 35 }   // F: Resultado Esperado
        ];

        // Título principal
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'MATRIZ DE EJECUCIÓN DE CASOS DE PRUEBA';
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        // Información del set
        const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const setEscenarios = testCase.set_escenarios || 'Carga de archivos';
        const estadoGeneral = testCase.estado_general ||
            (testCase.resultado_obtenido?.toLowerCase().includes('exitoso') ? 'Aprobado' :
                testCase.resultado_obtenido?.toLowerCase().includes('fallido') ? 'Rechazado' :
                    'Pendiente');

        worksheet.addRow([]); // Fila 2 vacía

        const row3 = worksheet.addRow([
            'Set de Escenarios:', setEscenarios, '', 'Fecha de Ejecución:', testCase.fecha_ejecucion || today, ''
        ]);
        row3.font = { bold: true };

        const row4 = worksheet.addRow([
            '', '', '', 'Estado General:', estadoGeneral, ''
        ]);
        row4.getCell(4).font = { bold: true };

        worksheet.addRow([]); // Fila 5 vacía

        // Encabezados de columnas (Fila 6)
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

        // Bordes encabezado
        headerRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // --- PROCESAMIENTO DE PASOS Y FILAS ---
        const pasosArray = testCase.pasos || testCase.Pasos_Analizados || [];

        // Si no hay pasos, crear al menos uno vacío para mostrar la estructura
        if (pasosArray.length === 0) {
            pasosArray.push({ numero_paso: 1, descripcion: 'Sin pasos definidos' });
        }

        const startRowIndex = 7; // Fila donde empiezan los datos
        let currentRowIndex = startRowIndex;

        // Función auxiliar para obtener índice de imagen desde texto (ej: "Evidencia 1")
        const getImageIndex = (text) => {
            if (!text) return -1;
            const match = text.toString().match(/(\d+)/);
            return match ? parseInt(match[1]) - 1 : -1;
        };

        // Iterar sobre cada paso para crear su fila
        for (let i = 0; i < pasosArray.length; i++) {
            const paso = pasosArray[i];
            const num = paso.numero_paso || paso.numero || (i + 1);
            const desc = paso.descripcion || paso.descripcion_accion_observada || '';
            const pasoTexto = `${num}. ${desc}`;

            // Determinar qué imagen va en este paso
            // Prioridad 1: Referencia explícita en el paso (imagen_referencia)
            // Prioridad 2: Índice secuencial (Paso 1 -> Imagen            // Intentar obtener imagen
            let imgIndex = -1;
            if (paso.imagen_referencia) {
                imgIndex = getImageIndex(paso.imagen_referencia);
            }

            // Si no se encontró por referencia explícita o es inválida, usar secuencial
            if ((imgIndex === -1 || imgIndex >= images.length)) {
                if (i < images.length) {
                    imgIndex = i;
                } else if (images.length > 0) {
                    // FALLBACK: Si hay más pasos que imágenes, usar la última imagen disponible
                    // para completar los pasos restantes (útil si una captura cubre varios pasos)
                    imgIndex = images.length - 1;
                }
            }

            // Crear fila
            const row = worksheet.addRow([
                i === 0 ? (testCase.id_caso || testCase.ID_Caso || 'CP-001') : '',      // Solo en primera fila
                i === 0 ? (testCase.escenario_prueba || testCase.Nombre_del_Escenario) : '', // Solo en primera fila
                i === 0 ? (testCase.precondiciones || 'No especificadas') : '',         // Solo en primera fila
                pasoTexto,
                '', // Espacio para imagen
                i === 0 ? (testCase.resultado_esperado || testCase.Resultado_Esperado_General_Flujo) : '' // Solo en primera fila
            ]);

            // Estilos de celda
            row.alignment = { vertical: 'top', wrapText: true };

            // Bordes para todas las celdas de la fila
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Insertar imagen si existe para este paso
            if (imgIndex >= 0 && imgIndex < images.length) {
                const img = images[imgIndex];
                if (!img.isVideo && !img.is_video) {
                    try {
                        const imageBuffer = await imageToBuffer(img.dataURL);
                        if (imageBuffer) {
                            const imageId = workbook.addImage({
                                buffer: imageBuffer,
                                extension: 'png',
                            });

                            // Altura de fila ajustada a la imagen (aprox 300px para visualización decente)
                            row.height = 250;

                            // Insertar imagen centrada en la celda E (columna 5)
                            worksheet.addImage(imageId, {
                                tl: { col: 4, row: currentRowIndex - 1, nativeColOff: 36000, nativeRowOff: 36000 }, // Pequeño padding
                                ext: { width: 400, height: 300 }, // Tamaño fijo razonable por paso
                                editAs: 'oneCell'
                            });
                        }
                    } catch (err) {
                        console.error(`Error insertando imagen ${imgIndex} en paso ${i + 1}`, err);
                    }
                }
            } else {
                // Si no hay imagen, altura normal basada en texto
                row.height = 60;
            }

            currentRowIndex++;
        }

        // --- MERGE DE CELDAS COMUNES ---
        // Combinar celdas verticales para ID, Escenario, Precondiciones y Resultado Esperado
        // desde la primera fila de datos hasta la última
        const endRowIndex = currentRowIndex - 1;
        if (endRowIndex > startRowIndex) {
            worksheet.mergeCells(`A${startRowIndex}:A${endRowIndex}`); // ID Caso
            worksheet.mergeCells(`B${startRowIndex}:B${endRowIndex}`); // Escenario
            worksheet.mergeCells(`C${startRowIndex}:C${endRowIndex}`); // Precondiciones
            worksheet.mergeCells(`F${startRowIndex}:F${endRowIndex}`); // Resultado Esperado
        }

        // Generar archivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Caso_Prueba_${testCase.id_caso || 'Generado'}_${new Date().getTime()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        console.log('✅ Excel generado con layout fila-por-paso exitosamente');
        return true;

    } catch (error) {
        console.error('❌ Error al generar el archivo Excel:', error);
        throw new Error(`No se pudo generar el archivo Excel: ${error.message}`);
    }
};

/**
 * Genera y descarga un archivo Excel con múltiples casos de prueba
 * Cada caso va en su propia hoja con imágenes
 * @param {Array} testCases - Array de casos de prueba
 * @param {Object} imagesByReport - Objeto con imágenes agrupadas por ID de reporte { reportId: [images] }
 * @param {Object} userStory - Información de la Historia de Usuario (opcional)
 */
export const downloadMultipleTestCasesExcel = async (testCases, imagesByReport = {}, userStory = null) => {
    try {
        console.log('📊 Generando Excel con múltiples casos:', testCases.length);

        const workbook = new ExcelJS.Workbook();

        // Crear una hoja por cada caso de prueba
        for (let caseIndex = 0; caseIndex < testCases.length; caseIndex++) {
            const testCase = testCases[caseIndex];
            const images = imagesByReport[testCase.id] || [];

            // Nombre de la hoja único (limitado a 31 caracteres por Excel)
            // Usar índice para garantizar unicidad
            const baseName = testCase.id_caso || `Caso-${caseIndex + 1}`;
            const sheetName = `${caseIndex + 1}. ${baseName}`.substring(0, 31);
            const worksheet = workbook.addWorksheet(sheetName);

            // Configurar anchos de columna
            worksheet.columns = [
                { width: 15 },  // A: ID Caso
                { width: 30 },  // B: Escenario de Prueba
                { width: 35 },  // C: Precondiciones
                { width: 50 },  // D: Paso a Paso
                { width: 80 },  // E: Evidencias
                { width: 35 }   // F: Resultado Esperado
            ];

            // Título principal
            worksheet.mergeCells('A1:F1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = userStory
                ? `CASOS DE PRUEBA - HU-${userStory.numero}: ${userStory.title}`
                : 'MATRIZ DE EJECUCIÓN DE CASOS DE PRUEBA';
            titleCell.font = { bold: true, size: 14 };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getRow(1).height = 30;

            // Información del caso
            const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const setEscenarios = testCase.set_escenarios || 'Casos de Prueba';
            const estadoGeneral = testCase.estado_general || 'Pendiente';

            worksheet.addRow([]); // Fila 2 vacía

            const row3 = worksheet.addRow([
                'Set de Escenarios:', setEscenarios, '', 'Fecha de Ejecución:', testCase.fecha_ejecucion || today, ''
            ]);
            row3.font = { bold: true };

            const row4 = worksheet.addRow([
                '', '', '', 'Estado General:', estadoGeneral, ''
            ]);
            row4.getCell(4).font = { bold: true };

            worksheet.addRow([]); // Fila 5 vacía

            // Encabezados de columnas (Fila 6)
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
                fgColor: { argb: 'FF4472C4' }
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

            // Procesar pasos
            const pasosArray = testCase.pasos || testCase.Pasos_Analizados || [];
            if (pasosArray.length === 0) {
                pasosArray.push({ numero_paso: 1, descripcion: 'Sin pasos definidos' });
            }

            const startRowIndex = 7;
            let currentRowIndex = startRowIndex;

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
                    if (i < images.length) {
                        imgIndex = i;
                    } else if (images.length > 0) {
                        imgIndex = images.length - 1;
                    }
                }

                const row = worksheet.addRow([
                    i === 0 ? (testCase.id_caso || testCase.ID_Caso || `CP-${caseIndex + 1}`) : '',
                    i === 0 ? (testCase.escenario_prueba || testCase.Nombre_del_Escenario) : '',
                    i === 0 ? (testCase.precondiciones || 'No especificadas') : '',
                    pasoTexto,
                    '',
                    i === 0 ? (testCase.resultado_esperado || testCase.Resultado_Esperado_General_Flujo) : ''
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
                    if (!img.isVideo && !img.is_video) {
                        try {
                            const imageBuffer = await imageToBuffer(img.dataURL);
                            if (imageBuffer) {
                                const imageId = workbook.addImage({
                                    buffer: imageBuffer,
                                    extension: 'png',
                                });

                                row.height = 250;

                                worksheet.addImage(imageId, {
                                    tl: { col: 4, row: currentRowIndex - 1, nativeColOff: 36000, nativeRowOff: 36000 },
                                    ext: { width: 400, height: 300 },
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

            // Merge de celdas
            const endRowIndex = currentRowIndex - 1;
            if (endRowIndex > startRowIndex) {
                worksheet.mergeCells(`A${startRowIndex}:A${endRowIndex}`);
                worksheet.mergeCells(`B${startRowIndex}:B${endRowIndex}`);
                worksheet.mergeCells(`C${startRowIndex}:C${endRowIndex}`);
                worksheet.mergeCells(`F${startRowIndex}:F${endRowIndex}`);
            }
        }

        // Generar archivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = userStory
            ? `HU-${userStory.numero}_Casos_Prueba_${new Date().toISOString().split('T')[0]}.xlsx`
            : `Casos_Prueba_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);

        console.log('✅ Excel con múltiples casos generado exitosamente');
        return true;
    } catch (error) {
        console.error('Error al generar Excel múltiple:', error);
        throw new Error(`No se pudo generar el archivo Excel: ${error.message}`);
    }
};

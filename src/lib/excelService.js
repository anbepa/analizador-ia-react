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
export const downloadExcelReport = async (testCase, images = [], onProgress = null) => {
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
            { width: 100 }, // E: Evidencias (Ancho aumentado para la imagen)
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

                            // Altura de fila ajustada a la imagen:
                            // 350 píxeles / 1.33 ≈ 263 puntos de Excel. Añadimos un pequeño margen para que respire.
                            row.height = 275;

                            // Insertar imagen en la celda E (columna 5)
                            worksheet.addImage(imageId, {
                                tl: { col: 4, row: currentRowIndex - 1, nativeColOff: 95250, nativeRowOff: 95250 }, // Padding aprox 10px
                                ext: { width: 600, height: 350 }, // Tamaño grande, proporción equilibrada
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

            if (onProgress) {
                // El progreso de procesamiento de pasos representa el 80% del trabajo total
                const progress = Math.round(((i + 1) / pasosArray.length) * 80);
                onProgress(progress);
            }
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

        if (onProgress) onProgress(85); // Inicio de generación de buffer

        // Generar archivo
        const buffer = await workbook.xlsx.writeBuffer();
        
        if (onProgress) onProgress(95); // Buffer listo, preparando descarga
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Caso_Prueba_${testCase.id_caso || 'Generado'}_${new Date().getTime()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        if (onProgress) onProgress(100); // Completado

        console.log('✅ Excel generado con layout fila-por-paso exitosamente');
        return true;

    } catch (error) {
        console.error('❌ Error al generar el archivo Excel:', error);
        throw new Error(`No se pudo generar el archivo Excel: ${error.message}`);
    }
};

/**
 * Genera y descarga un archivo Excel con múltiples casos de prueba
 */
export const downloadMultipleTestCasesExcel = async (testCases, allImages = []) => {
    try {
        console.log('📊 Generando Excel con múltiples casos');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Casos de Prueba');

        // Configurar columnas
        worksheet.columns = [
            { width: 15 }, { width: 30 }, { width: 35 },
            { width: 50 }, { width: 30 }, { width: 35 }
        ];

        // Título
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'MATRIZ DE EJECUCIÓN DE CASOS DE PRUEBA';
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.addRow([]);

        // Información general
        const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        worksheet.addRow([
            'Set de Escenarios:',
            `${testCases.length} caso(s) de prueba`,
            '',
            'Fecha de Ejecución:',
            today,
            ''
        ]);

        worksheet.addRow([]);

        // Encabezados
        const headerRow = worksheet.addRow([
            'ID Caso', 'Escenario de Prueba', 'Precondiciones',
            'Paso a Paso', 'Evidencias', 'Resultado Esperado'
        ]);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        // Agregar cada caso (sin imágenes por ahora en modo múltiple)
        testCases.forEach(testCase => {
            const pasosTexto = (testCase.pasos || testCase.Pasos_Analizados || [])
                .map(paso => `${paso.numero_paso || paso.numero}. ${paso.descripcion || paso.descripcion_accion_observada} `)
                .join('\n\n');

            worksheet.addRow([
                testCase.id_caso || 'CP-001',
                testCase.escenario_prueba || testCase.Nombre_del_Escenario,
                testCase.precondiciones || 'No especificadas',
                pasosTexto,
                'Ver evidencias en reportes individuales',
                testCase.resultado_esperado || testCase.Resultado_Esperado_General_Flujo
            ]);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Casos_Prueba_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error al generar Excel múltiple:', error);
        throw new Error(`No se pudo generar el archivo Excel: ${error.message} `);
    }
};

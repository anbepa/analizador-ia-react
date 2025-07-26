import React, { useCallback, useState } from 'react';
import { readFileAsBase64 } from '../lib/apiService';

function StepImageUploader({ stepNumber, images = [], onAddImages, onRemoveImage }) {
    const [isDragging, setIsDragging] = useState(false);

    const processFiles = useCallback(async (filesToProcess) => {
        const filePromises = Array.from(filesToProcess).map(file => 
            readFileAsBase64(file).then(base64String => ({
                name: file.name,
                base64: base64String.split(',')[1],
                type: file.type,
                dataUrl: base64String
            }))
        );
        const newImageFiles = await Promise.all(filePromises);
        onAddImages(stepNumber, newImageFiles);
    }, [stepNumber, onAddImages]);

    const handleImageUpload = (event) => {
        if (event.target.files.length === 0) return;
        processFiles(event.target.files);
    };

    const handlePaste = useCallback(async (event) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
        if (imageItems.length > 0) {
            event.preventDefault();
            const blobs = imageItems.map(item => item.getAsFile());
            processFiles(blobs);
        }
    }, [processFiles]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    React.useEffect(() => {
        const handlePasteEvent = (event) => {
            // Solo procesar paste si el uploader está visible y enfocado
            const target = event.target;
            const uploaderContainer = document.getElementById(`step-uploader-${stepNumber}`);
            if (uploaderContainer && uploaderContainer.contains(target)) {
                handlePaste(event);
            }
        };

        document.addEventListener('paste', handlePasteEvent);
        return () => {
            document.removeEventListener('paste', handlePasteEvent);
        };
    }, [handlePaste, stepNumber]);

    return (
        <div id={`step-uploader-${stepNumber}`} className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                📎 Adjuntar evidencias para Paso {stepNumber}
            </h4>
            
            <label
                htmlFor={`step-image-upload-${stepNumber}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center text-center hover:border-blue-400 transition-colors duration-200 ${isDragging ? 'border-blue-400 bg-blue-50' : ''}`}
            >
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                <span className="mt-1 text-xs font-medium text-gray-600">Clic para seleccionar o arrastra imágenes</span>
                <span className="text-xs text-gray-500">PNG, JPG, GIF (máx. 2 imágenes)</span>
            </label>
            
            <input 
                type="file" 
                id={`step-image-upload-${stepNumber}`}
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload} 
            />

            {images.length > 0 && (
                <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                        Evidencias adjuntas ({images.length}/2):
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {images.map((img, index) => (
                            <div key={index} className="relative group">
                                <img 
                                    src={img.dataUrl} 
                                    alt={`Evidencia ${index + 1} - Paso ${stepNumber}`}
                                    className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-75"
                                    onClick={() => window.open(img.dataUrl, '_blank')}
                                />
                                <button
                                    onClick={() => onRemoveImage(stepNumber, index)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-75 hover:opacity-100"
                                    title="Eliminar imagen"
                                >
                                    ✕
                                </button>
                                <p className="text-xs text-center text-gray-500 mt-1">
                                    {index === 0 ? 'Entrada' : 'Salida'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {images.length >= 2 && (
                <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Máximo 2 imágenes por paso (entrada y salida)
                </p>
            )}
        </div>
    );
}

export default StepImageUploader;
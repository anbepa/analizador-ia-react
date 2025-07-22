import React, { useCallback, useState } from 'react';
import { readFileAsBase64 } from '../lib/apiService';
import { useAppContext } from '../context/AppContext';
import BrowserCapture from './BrowserCapture';

function ImageUploader() {
    const { currentImageFiles, setCurrentImageFiles, initialContext, setInitialContext } = useAppContext();
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
        setCurrentImageFiles(prev => [...prev, ...newImageFiles].sort((a, b) => a.name.localeCompare(b.name)));
    }, [setCurrentImageFiles]);

    const handleImageUpload = (event) => {
        if (event.target.files.length === 0) return;
        processFiles(event.target.files);
    };

    const handleRemoveImage = (indexToRemove) => {
        setCurrentImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
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
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);

    return (
        <div className="bg-white rounded-xl shadow-md p-6 glassmorphism">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Cargar Evidencias</h2>
            <label
                htmlFor="image-upload"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-colors duration-200 ${isDragging ? 'dropzone-dragging' : ''}`}
            >
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                <span className="mt-2 text-sm font-medium text-gray-600">Haz clic para seleccionar o pega imágenes aquí</span>
                <span className="mt-1 text-xs text-gray-500">PNG, JPG, GIF o pega desde el portapapeles</span>
            </label>
            <input type="file" id="image-upload" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />

            <BrowserCapture onCapture={processFiles} />

            <div id="image-preview-container" className="mt-4">
                {currentImageFiles.length > 0 && (
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        Evidencias Cargadas ({currentImageFiles.length}):
                    </p>
                )}
                <div className="thumb-gallery">
                    {currentImageFiles.map((img, index) => (
                        <div key={index} className="relative group">
                            <img src={img.dataUrl} alt={img.name} onClick={() => window.open(img.dataUrl, '_blank')} />
                            <button
                                onClick={() => handleRemoveImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-75 hover:opacity-100"
                            >
                                ✕
                            </button>
                            <p className="thumb-title">Img {index + 1}</p>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-6">
                <label htmlFor="initial-context-textarea" className="block text-sm font-medium text-gray-700 mb-1">
                    Contexto Inicial para Análisis (Opcional)
                    <span className="ml-1 text-gray-400" title="Instrucciones adicionales para la IA">ⓘ</span>
                </label>
                <textarea
                    id="initial-context-textarea"
                    rows="4"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Ej: Las imágenes son logs de un proceso. El objetivo es verificar que no haya errores."
                    value={initialContext}
                    onChange={(e) => setInitialContext(e.target.value)}
                />
            </div>
        </div>
    );
}

export default ImageUploader;
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
                dataURL: base64String  // Cambiado de dataUrl a dataURL para consistencia
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
        <div className="space-y-4">
            <label
                htmlFor="image-upload"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full cursor-pointer bg-slate-50 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 ease-out ${
                    isDragging 
                        ? 'border-violet-400 bg-violet-50 scale-[1.02] shadow-lg' 
                        : 'border-slate-300 hover:border-violet-400 hover:bg-violet-50'
                }`}
            >
                <div className="p-3 bg-violet-100 rounded-full mb-3">
                    <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                </div>
                <span className="text-sm font-semibold text-slate-700 mb-1">
                    Arrastra imágenes aquí o haz clic para seleccionar
                </span>
                <span className="text-xs text-slate-500">
                    PNG, JPG, GIF • También puedes pegar desde el portapapeles
                </span>
            </label>
            <input type="file" id="image-upload" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />

            <BrowserCapture onCapture={processFiles} />

            <div id="image-preview-container" className="mt-6">
                {currentImageFiles.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-base font-medium text-secondary-700 mb-3">
                            Evidencias Cargadas ({currentImageFiles.length})
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {currentImageFiles.map((img, index) => (
                                <div key={index} className="relative group">
                                    <div className="aspect-video bg-slate-50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200">
                                        <img 
                                            src={img.dataURL} 
                                            alt={img.name}
                                            onClick={() => window.open(img.dataURL, '_blank')}
                                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                        />
                                        {/* Zoom indicator */}
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                                    >
                                        ×
                                    </button>
                                    <div className="mt-3 text-center">
                                        <p className="text-sm font-medium text-slate-700">
                                            Imagen {index + 1}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {img.name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-4">
                <label htmlFor="initial-context-textarea" className="flex items-center text-sm font-medium text-slate-700 mb-2">
                    Contexto Adicional
                    <span className="ml-2 text-slate-400 cursor-help" title="Instrucciones adicionales para la IA">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </span>
                </label>
                <textarea
                    id="initial-context-textarea"
                    rows="3"
                    className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 bg-white text-slate-700 placeholder-slate-400 text-sm"
                    placeholder="Ej: Las imágenes son logs de un proceso. Verificar que no haya errores..."
                    value={initialContext}
                    onChange={(e) => setInitialContext(e.target.value)}
                />
            </div>
        </div>
    );
}

export default ImageUploader;
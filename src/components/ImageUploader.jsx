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
        <div className="space-y-5">
            <label
                htmlFor="image-upload"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative w-full cursor-pointer rounded-3xl border border-secondary-200/80 bg-gradient-to-br from-white via-secondary-50 to-secondary-100/80 p-7 flex flex-col items-center justify-center text-center transition-all duration-300 ease-out shadow-apple-lg overflow-hidden ${
                    isDragging
                        ? 'border-primary/50 bg-primary/5 scale-[1.01] shadow-apple-xl'
                        : 'hover:border-primary/40 hover:shadow-apple-xl'
                }`}
            >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/60 via-secondary-50/80 to-primary/10" />
                <div className="relative flex flex-col items-center gap-3">
                    <div className="p-3 rounded-2xl bg-white shadow-apple">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                        </svg>
                    </div>
                    <div className="space-y-1">
                        <p className="text-base font-semibold text-secondary-800">Arrastra imágenes o haz clic para seleccionarlas</p>
                        <p className="text-xs text-secondary-500">PNG, JPG, GIF • también puedes pegar desde el portapapeles</p>
                    </div>
                </div>
            </label>
            <input type="file" id="image-upload" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />

            <BrowserCapture onCapture={processFiles} />

            <div id="image-preview-container" className="mt-3">
                {currentImageFiles.length > 0 && (
                    <div className="mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-secondary-800">
                                Evidencias cargadas ({currentImageFiles.length})
                            </h3>
                            <span className="text-xs text-secondary-500">Haz clic en una miniatura para ampliarla</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentImageFiles.map((img, index) => (
                                <div key={index} className="relative group">
                                    <div className="aspect-video bg-white rounded-2xl overflow-hidden shadow-apple-md hover:shadow-apple-lg transition-all duration-300 border border-secondary-100">
                                        <img
                                            src={img.dataURL}
                                            alt={img.name}
                                            onClick={() => window.open(img.dataURL, '_blank')}
                                            className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-apple">
                                                <svg className="w-5 h-5 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveImage(index)}
                                        className="absolute -top-2 -right-2 bg-danger text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-apple-md hover:shadow-apple-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                    >
                                        ×
                                    </button>
                                    <div className="mt-3 text-center">
                                        <p className="text-sm font-semibold text-secondary-800">Imagen {index + 1}</p>
                                        <p className="text-xs text-secondary-500 truncate">{img.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <label htmlFor="initial-context-textarea" className="flex items-center text-sm font-semibold text-secondary-800 mb-2">
                    Contexto adicional
                    <span className="ml-2 text-secondary-400 cursor-help" title="Instrucciones adicionales para la IA">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </span>
                </label>
                <textarea
                    id="initial-context-textarea"
                    rows="3"
                    className="w-full p-3 border border-secondary-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all duration-200 bg-white/80 text-secondary-800 placeholder-secondary-400 text-sm"
                    placeholder="Ej: Las imágenes son logs de un proceso. Verificar que no haya errores..."
                    value={initialContext}
                    onChange={(e) => setInitialContext(e.target.value)}
                />
            </div>
        </div>
    );
}

export default ImageUploader;
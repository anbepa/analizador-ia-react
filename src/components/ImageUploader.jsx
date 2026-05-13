import React, { useCallback, useState, useRef } from 'react';
import { readFileAsBase64 } from '../lib/apiService';
import { uploadVideoToSupabase, isVideoFile } from '../lib/videoService';
import { useAppContext } from '../context/AppContext';
import BrowserCapture from './BrowserCapture';
import OptimizedImage from './OptimizedImage';

function ImageUploader() {
    const { 
        currentImageFiles, 
        setCurrentImageFiles,
        selectedModel,
        setSelectedModel,
        handleAnalysis,
        loading,
        canGenerate
    } = useAppContext();

    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedIndices, setSelectedIndices] = useState([]);
    const browserCaptureRef = useRef(null);

    // Actualizar selección automática cuando cambian los archivos
    React.useEffect(() => {
        if (currentImageFiles.length > 0 && selectedIndices.length === 0) {
            setSelectedIndices(currentImageFiles.map((_, i) => i));
        }
    }, [currentImageFiles.length]);

    const toggleSelect = (index) => {
        setSelectedIndices(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIndices.length === currentImageFiles.length) {
            setSelectedIndices([]);
        } else {
            setSelectedIndices(currentImageFiles.map((_, i) => i));
        }
    };

    const processFiles = useCallback(async (filesToProcess) => {
        setIsProcessing(true);
        setUploadProgress(0);
        try {
            const newFiles = [];

            for (const file of Array.from(filesToProcess)) {
                if (isVideoFile(file)) {
                    try {
                        setUploadProgress(10);
                        const publicUrl = await uploadVideoToSupabase(file);
                        setUploadProgress(100);

                        newFiles.push({
                            name: file.name,
                            type: file.type,
                            dataURL: publicUrl,
                            isVideo: true,
                            file: file
                        });
                    } catch (error) {
                        console.error('Error uploading video:', error);
                        alert(`Error al subir el video ${file.name}: ${error.message}`);
                    }
                } else if (file.type.startsWith('image/')) {
                    try {
                        const base64String = await readFileAsBase64(file);
                        newFiles.push({
                            name: file.name,
                            base64: base64String.split(',')[1],
                            type: file.type,
                            dataURL: base64String,
                            isVideo: false,
                            file: file
                        });
                    } catch (error) {
                        console.error('Error reading image:', error);
                    }
                }
            }

            if (newFiles.length > 0) {
                setCurrentImageFiles(prev => [...prev, ...newFiles].sort((a, b) => a.name.localeCompare(b.name)));
            }
        } catch (error) {
            console.error('Error processing files:', error);
        } finally {
            setIsProcessing(false);
            setUploadProgress(0);
        }
    }, [setCurrentImageFiles]);

    const handleImageUpload = (event) => {
        if (event.target.files.length === 0) return;
        processFiles(event.target.files);
    };

    const handleRemoveImage = (indexToRemove) => {
        setCurrentImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        setSelectedIndices(prev => prev.filter(i => i !== indexToRemove).map(i => i > indexToRemove ? i - 1 : i));
    };

    const handlePaste = useCallback(async (event) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        const mediaItems = Array.from(items).filter(item =>
            item.type.startsWith('image/') || item.type.startsWith('video/')
        );

        if (mediaItems.length > 0) {
            event.preventDefault();
            const blobs = mediaItems.map(item => item.getAsFile());
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

    const [viewMode, setViewMode] = useState('grid');

    const hasFiles = currentImageFiles.length > 0;

    return (
        <div className="space-y-6">
            {/* Dropzone Area - Conditional Minimalist Version */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative w-full transition-all duration-500 ease-out overflow-hidden bg-white ${!hasFiles
                    ? `min-h-[400px] flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-secondary-200 hover:border-primary/40 hover:bg-primary/5 ${isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : ''}`
                    : 'h-0 opacity-0 pointer-events-none'
                    }`}
            >
                <input type="file" id="image-upload" multiple accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />

                {isProcessing ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-base font-bold text-secondary-900">Procesando archivos...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 py-10 px-6">
                        <div className="w-16 h-16 rounded-3xl bg-white shadow-xl border border-secondary-100 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-secondary-900 mb-1">Arrastra tus evidencias aquí</h3>
                            <p className="text-sm text-secondary-500 mb-6 font-medium">Soporta imágenes, videos y portapapeles</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <label htmlFor="image-upload" className="px-8 py-3 rounded-2xl font-bold text-sm bg-primary text-white hover:bg-primary/90 cursor-pointer transition-all shadow-lg shadow-primary/25 hover:-translate-y-1">
                                Seleccionar Archivos
                            </label>
                            <button
                                onClick={() => browserCaptureRef.current?.startSession()}
                                className="px-8 py-3 rounded-2xl font-bold text-sm bg-white text-secondary-700 border border-secondary-200 hover:border-primary/30 hover:text-primary transition-all shadow-md hover:-translate-y-1"
                            >
                                Capturar Pantalla
                            </button>
                        </div>
                    </div>
                )}
                <BrowserCapture ref={browserCaptureRef} onCapture={processFiles} showTrigger={false} />
            </div>

            {/* Evidence & Control Hub */}
            {hasFiles && (
                <div className="bg-white border border-[#E6E6E8] shadow-sm rounded-[32px] overflow-hidden animate-slide-up">
                    
                    {/* Integrated Control Hub (Top Bar) */}
                    <div className="bg-secondary-50/50 border-b border-secondary-100 p-4 px-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <h3 className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Evidencias</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-secondary-900">{currentImageFiles.length}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-secondary-200 text-secondary-600 rounded-md">
                                        {selectedIndices.length} seleccionadas
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleSelectAll}
                                className="text-xs font-bold text-secondary-600 hover:text-primary px-3 py-2 rounded-xl hover:bg-primary/5 transition-all"
                            >
                                {selectedIndices.length === currentImageFiles.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                            </button>
                            
                            {/* Input Oculto para añadir más */}
                            <input type="file" id="add-more" multiple accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />
                            <label htmlFor="add-more" className="p-2 text-secondary-600 hover:text-primary hover:bg-primary/5 rounded-xl cursor-pointer transition-all" title="Añadir más evidencias">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            </label>

                            <button
                                onClick={() => {
                                    const imagesToAnalyze = currentImageFiles.filter((_, index) => selectedIndices.includes(index));
                                    handleAnalysis(false, null, imagesToAnalyze);
                                }}
                                disabled={!canGenerate || loading.state || selectedIndices.length === 0}
                                className={`px-8 py-2.5 rounded-2xl font-black text-xs transition-all duration-300 flex items-center gap-2 shadow-lg ${canGenerate && !loading.state && selectedIndices.length > 0
                                    ? 'bg-primary text-white shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-secondary-200 text-secondary-400 cursor-not-allowed'
                                    }`}
                            >
                                {loading.state ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>GENERAR ANÁLISIS</span>
                                        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px]">{selectedIndices.length}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Grid de Evidencias - Expandido */}
                    <div className="p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {currentImageFiles.map((file, index) => (
                                <div
                                    key={index}
                                    onClick={() => toggleSelect(index)}
                                    className={`group relative bg-white border rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer ${selectedIndices.includes(index) 
                                        ? 'border-primary ring-2 ring-primary/20 shadow-md translate-y-[-2px]' 
                                        : 'border-secondary-100 hover:border-secondary-300 shadow-sm'}`}
                                >
                                    {/* Thumbnail container */}
                                    <div className="aspect-[4/3] w-full relative bg-secondary-50 overflow-hidden">
                                        {file.isVideo ? (
                                            <video src={file.dataURL} className="w-full h-full object-cover" />
                                        ) : (
                                            <OptimizedImage src={file.dataURL} alt={file.name} className="w-full h-full object-cover" />
                                        )}

                                        {/* Checkbox Indicator */}
                                        <div className={`absolute top-2 left-2 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedIndices.includes(index) 
                                            ? 'bg-primary border-primary' 
                                            : 'bg-white/80 border-secondary-300'}`}>
                                            {selectedIndices.includes(index) && (
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            )}
                                        </div>

                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-[1px]">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); window.open(file.dataURL, '_blank'); }}
                                                className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all"
                                                title="Ver pantalla completa"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                                                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-md transition-all"
                                                title="Eliminar"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="p-2 px-3 bg-white">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[10px] font-bold text-secondary-700 truncate flex-1" title={file.name}>
                                                {file.name}
                                            </p>
                                            <span className="text-[9px] font-black text-secondary-400 bg-secondary-50 px-1 rounded uppercase tracking-tighter">
                                                {file.isVideo ? 'vid' : file.type?.split('/')[1] || 'img'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ImageUploader;
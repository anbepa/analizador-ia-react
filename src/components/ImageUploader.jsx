import React, { useCallback, useState, useRef } from 'react';
import { readFileAsBase64 } from '../lib/apiService';
import { uploadVideoToSupabase, isVideoFile } from '../lib/videoService';
import { useAppContext } from '../context/AppContext';
import BrowserCapture from './BrowserCapture';
import OptimizedImage from './OptimizedImage';

function ImageUploader() {
    const { currentImageFiles, setCurrentImageFiles } = useAppContext();
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const browserCaptureRef = useRef(null);

    const processFiles = useCallback(async (filesToProcess) => {
        setIsProcessing(true);
        setUploadProgress(0);
        try {
            const newFiles = [];

            for (const file of Array.from(filesToProcess)) {
                if (isVideoFile(file)) {
                    // Process video file
                    try {
                        setUploadProgress(10); // Started
                        // Upload to Supabase Storage
                        const publicUrl = await uploadVideoToSupabase(file);
                        setUploadProgress(100); // Finished

                        newFiles.push({
                            name: file.name,
                            type: file.type,
                            dataURL: publicUrl, // Store URL instead of base64
                            isVideo: true,
                            file: file // Keep reference if needed
                        });
                    } catch (error) {
                        console.error('Error uploading video:', error);
                        alert(`Error al subir el video ${file.name}: ${error.message}`);
                    }
                } else if (file.type.startsWith('image/')) {
                    // Process image file
                    try {
                        const base64String = await readFileAsBase64(file);
                        newFiles.push({
                            name: file.name,
                            base64: base64String.split(',')[1],
                            type: file.type,
                            dataURL: base64String,
                            isVideo: false
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

    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    return (
        <div className="space-y-6">
            {/* Dropzone Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative w-full rounded-[32px] border transition-all duration-300 ease-out overflow-hidden bg-white ${currentImageFiles.length === 0
                    ? `min-h-[500px] flex flex-col items-center justify-center ${isDragging ? 'border-[#007AFF] bg-[#007AFF]/5 shadow-lg scale-[1.01]' : 'border-dashed border-secondary-200 hover:border-secondary-300'}`
                    : 'border-secondary-200 p-6'
                    }`}
            >
                {/* Hidden Input */}
                <input type="file" id="image-upload" multiple accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />

                <div className="flex flex-col items-center justify-center text-center gap-4 w-full">
                    {isProcessing ? (
                        <div className="flex flex-col items-center animate-pulse w-full max-w-xs">
                            <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-base font-medium text-secondary-900">Procesando archivos...</p>
                            {uploadProgress > 0 && (
                                <div className="w-full bg-secondary-100 rounded-full h-1.5 mt-3 overflow-hidden">
                                    <div className="bg-[#007AFF] h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center justify-center text-center gap-2 py-10 px-6 border-2 border-dashed border-secondary-200 rounded-[32px] bg-secondary-50/30 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 group relative cursor-default">
                            
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-secondary-100 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-secondary-900 mb-1">Arrastra tus evidencias aquí</h3>
                                <p className="text-sm text-secondary-500 mb-5">o selecciona cómo deseas agregarlas</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center relative z-10">
                                <label htmlFor="image-upload" className="px-6 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 cursor-pointer transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:-translate-y-0.5">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Subir Archivos
                                    </span>
                                </label>
                                <button
                                    onClick={() => browserCaptureRef.current?.startSession()}
                                    className="px-6 py-2.5 rounded-xl font-bold text-sm bg-white text-secondary-700 border border-secondary-200 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        </svg>
                                        Capturar Pantalla
                                    </span>
                                </button>
                            </div>
                            
                            <p className="text-xs text-secondary-400 font-medium absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                Soporta PNG, JPG, MP4 • (Ctrl+V) para pegar
                            </p>
                        </div>
                    )}
                </div>

                {/* Browser Capture Component (Hidden Trigger, Exposed via Ref) */}
                <BrowserCapture ref={browserCaptureRef} onCapture={processFiles} showTrigger={false} />
            </div>

            {/* Evidence List / Grid */}
            <div id="image-preview-container" className="mt-6">
                {currentImageFiles.length > 0 && (
                    <div className="space-y-4">
                        {/* Header & Controls */}
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-semibold text-secondary-900 uppercase tracking-wider">
                                Evidencias ({currentImageFiles.length})
                            </h3>

                            <div className="flex bg-secondary-100/50 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#007AFF] text-white shadow-sm' : 'text-secondary-400 hover:text-secondary-600'}`}
                                    title="Vista Cuadrícula"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#007AFF] text-white shadow-sm' : 'text-secondary-400 hover:text-secondary-600'}`}
                                    title="Vista Lista"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-3"}>
                            {currentImageFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className={`group relative bg-white border border-secondary-100 rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] hover:border-secondary-200 ${viewMode === 'list' ? 'flex items-center p-3 gap-4' : ''
                                        }`}
                                >
                                    {/* Thumbnail */}
                                    <div className={`${viewMode === 'list' ? 'w-24 h-16 flex-shrink-0' : 'aspect-[4/3] w-full'} relative bg-secondary-50 overflow-hidden rounded-xl`}>
                                        {file.isVideo ? (
                                            <video src={file.dataURL} className="w-full h-full object-cover" />
                                        ) : (
                                            <OptimizedImage src={file.dataURL} alt={file.name} className="w-full h-full object-cover" />
                                        )}

                                        {/* Overlay Actions (Grid Mode) */}
                                        {viewMode === 'grid' && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                <button
                                                    onClick={() => window.open(file.dataURL, '_blank')}
                                                    className="p-2.5 bg-black/60 rounded-full text-white hover:bg-black hover:scale-110 transition-all shadow-md backdrop-blur-md"
                                                    title="Ver completo"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="p-2.5 bg-black/60 rounded-full text-red-400 hover:text-red-300 hover:bg-black hover:scale-110 transition-all shadow-md backdrop-blur-md"
                                                    title="Eliminar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info (List Mode) */}
                                    {viewMode === 'list' && (
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-secondary-900 truncate">{file.name}</p>
                                            <p className="text-xs text-secondary-500">{file.isVideo ? 'Video' : 'Imagen'} • {(file.file?.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    )}

                                    {/* Actions (List Mode) */}
                                    {viewMode === 'list' && (
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => window.open(file.dataURL, '_blank')}
                                                className="p-2 text-secondary-400 hover:text-primary hover:bg-secondary-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleRemoveImage(index)}
                                                className="p-2 text-secondary-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    )}

                                    {/* Footer Info (Grid Mode) */}
                                    {viewMode === 'grid' && (
                                        <div className="p-3 bg-white">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-secondary-500 bg-secondary-100/50 border border-secondary-200/50 rounded-full w-6 h-6 flex items-center justify-center">
                                                    {index + 1}
                                                </span>
                                                <span className="text-[9px] text-secondary-400 uppercase tracking-wider font-semibold opacity-60">
                                                    {file.isVideo ? 'Video' : 'IMG'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ImageUploader;
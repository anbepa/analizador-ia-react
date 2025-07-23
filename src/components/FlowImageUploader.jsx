import React, { useState, useCallback, useEffect } from 'react';
import { readFileAsBase64 } from '../lib/apiService';
import BrowserCapture from './BrowserCapture';

function FlowImageUploader({
    label,
    images,
    setImages,
    onImageClick,
    onDragStart,
    onDropThumb,
}) {
    const [isDragging, setIsDragging] = useState(false);

    const assignRefs = useCallback((imgs) =>
        imgs.map((img, idx) => ({
            ...img,
            ref: `${label.includes('Flujo B') ? 'B' : 'A'}${idx + 1}`,
        })), [label]);

    const processFiles = useCallback(async (filesToProcess) => {
        const filePromises = Array.from(filesToProcess).map((file) =>
            readFileAsBase64(file).then((dataUrl) => ({
                name: file.name,
                base64: dataUrl.split(',')[1],
                type: file.type,
                dataUrl,
                annotation: '',
            }))
        );
        const newImages = await Promise.all(filePromises);
        setImages((prev) =>
            assignRefs([...prev, ...newImages].sort((a, b) => a.name.localeCompare(b.name)))
        );
    }, [setImages, assignRefs]);

    const handleImageUpload = (e) => {
        if (e.target.files.length === 0) return;
        processFiles(e.target.files);
    };

    const handleRemoveImage = (index) => {
        setImages((prev) => assignRefs(prev.filter((_, i) => i !== index)));
    };

    const handlePaste = useCallback(
        async (event) => {
            const items = event.clipboardData?.items;
            if (!items) return;
            const imageItems = Array.from(items).filter((item) => item.type.startsWith('image/'));
            if (imageItems.length > 0) {
                event.preventDefault();
                const blobs = imageItems.map((item) => item.getAsFile());
                processFiles(blobs);
            }
        },
        [processFiles]
    );

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDropZone = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);

    const inputId = `upload-${label.replace(/\s+/g, '-')}`;

    return (
        <div>
            <h3 className="font-semibold mb-2">{label}</h3>
            <label
                htmlFor={inputId}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDropZone}
                className={`w-full cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center hover:border-primary transition-colors duration-200 ${isDragging ? 'dropzone-dragging' : ''}`}
            >
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                <span className="mt-2 text-sm font-medium text-gray-600">Haz clic para seleccionar o pega imágenes aquí</span>
                <span className="mt-1 text-xs text-gray-500">PNG, JPG, GIF o pega desde el portapapeles</span>
            </label>
            <input type="file" id={inputId} multiple accept=".png,.jpg,.jpeg" className="hidden" onChange={handleImageUpload} />

            <BrowserCapture onCapture={processFiles} />

            <div className="thumb-gallery">
                {images.map((img, index) => (
                    <div
                        key={index}
                        className="relative group"
                        draggable
                        onDragStart={onDragStart(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDropThumb(index)}
                    >
                        <img src={img.dataUrl} alt={img.name} onClick={() => onImageClick(index)} />
                        <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 opacity-75 hover:opacity-100"
                        >
                            ✕
                        </button>
                        <p className="thumb-title">Img {index + 1}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FlowImageUploader;

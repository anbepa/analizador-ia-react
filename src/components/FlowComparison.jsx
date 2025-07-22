import React, { useState, useCallback } from 'react';
import { readFileAsBase64 } from '../lib/apiService';

const MAX_IMAGES = 10;
const MAX_SIZE = 4 * 1024 * 1024; // 4MB

function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function FlowComparison({ onComparisonGenerated }) {
    const [showForm, setShowForm] = useState(false);
    const [currentFlowTitle, setCurrentFlowTitle] = useState('');
    const [currentFlowSprint, setCurrentFlowSprint] = useState('');
    const [currentGeneratedId, setCurrentGeneratedId] = useState('');
    const [flowAImages, setFlowAImages] = useState([]);
    const [flowBImages, setFlowBImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null); // {flow: 'A'|'B', index: number}
    const [annotationText, setAnnotationText] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState(null);

    const resetForm = () => {
        setCurrentFlowTitle('');
        setCurrentFlowSprint('');
        setCurrentGeneratedId('');
        setFlowAImages([]);
        setFlowBImages([]);
        setResultData(null);
    };

    const handleCancel = () => {
        resetForm();
        setShowForm(false);
    };

    const handleTitleChange = (e) => {
        const value = e.target.value;
        setCurrentFlowTitle(value);
        setCurrentGeneratedId(slugify(value));
    };

    const processFiles = useCallback(async (files, setFlow, currentList) => {
        const validFiles = Array.from(files).slice(0, MAX_IMAGES - currentList.length);
        const processed = await Promise.all(
            validFiles.map(async (file) => {
                if (!file.type.match(/image\/(png|jpe?g)/)) return null;
                if (file.size > MAX_SIZE) return null;
                const dataUrl = await readFileAsBase64(file);
                return { name: file.name, dataUrl, annotation: '' };
            })
        );
        setFlow((prev) => [...prev, ...processed.filter(Boolean)]);
    }, []);

    const handleFileInput = (e, setFlow, currentList) => {
        if (e.target.files.length === 0) return;
        processFiles(e.target.files, setFlow, currentList);
        e.target.value = null;
    };

    const handleDragStart = (index) => (e) => {
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDrop = (index, flow, setFlow) => (e) => {
        e.preventDefault();
        const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (isNaN(from) || from === index) return;
        setFlow((prev) => {
            const arr = [...prev];
            const [moved] = arr.splice(from, 1);
            arr.splice(index, 0, moved);
            return arr;
        });
    };

    const removeImage = (index, setFlow) => {
        setFlow((prev) => prev.filter((_, i) => i !== index));
    };

    const openAnnotation = (flow, index) => {
        const list = flow === 'A' ? flowAImages : flowBImages;
        setAnnotationText(list[index].annotation || '');
        setSelectedImage({ flow, index });
    };

    const saveAnnotation = () => {
        if (!selectedImage) return;
        const { flow, index } = selectedImage;
        const setFlow = flow === 'A' ? setFlowAImages : setFlowBImages;
        setFlow((prev) =>
            prev.map((img, i) => (i === index ? { ...img, annotation: annotationText } : img))
        );
        setSelectedImage(null);
        setAnnotationText('');
    };

    const canGenerate = (flowAImages.length > 0 || flowBImages.length > 0) && !loading;

    const simulateAction = (action) => {
        setLoading(true);
        const payload = {
            id: currentGeneratedId,
            title: currentFlowTitle,
            sprint: currentFlowSprint,
            flowA: flowAImages.map((img) => ({ name: img.name, annotation: img.annotation })),
            flowB: flowBImages.map((img) => ({ name: img.name, annotation: img.annotation })),
            action,
        };
        setTimeout(() => {
            const data = { ...payload, status: 'ok' };
            setResultData(data);
            if (onComparisonGenerated) onComparisonGenerated(data);
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="mt-8">
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-800 text-white rounded font-semibold px-4 py-2"
                >
                    Comparar Flujos
                </button>
            )}

            {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6 mt-4">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                        Comparación de Flujos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Título</label>
                            <input
                                type="text"
                                value={currentFlowTitle}
                                onChange={handleTitleChange}
                                className="border border-gray-300 rounded px-3 py-2 w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Sprint</label>
                            <input
                                type="text"
                                value={currentFlowSprint}
                                onChange={(e) => setCurrentFlowSprint(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full"
                            />
                        </div>
                    </div>
                    {currentGeneratedId && (
                        <p className="text-xs text-gray-500 mt-1">ID: {currentGeneratedId}</p>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                        <div>
                            <h3 className="font-semibold mb-2">Flujo A</h3>
                            <input
                                type="file"
                                multiple
                                accept=".png,.jpg,.jpeg"
                                onChange={(e) => handleFileInput(e, setFlowAImages, flowAImages)}
                                className="mb-2"
                            />
                            <div className="thumb-gallery">
                                {flowAImages.map((img, index) => (
                                    <div
                                        key={index}
                                        className="relative group"
                                        draggable
                                        onDragStart={handleDragStart(index)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleDrop(index, 'A', setFlowAImages)}
                                    >
                                        <img
                                            src={img.dataUrl}
                                            alt={img.name}
                                            onClick={() => openAnnotation('A', index)}
                                        />
                                        <button
                                            onClick={() => removeImage(index, setFlowAImages)}
                                            className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 opacity-75 hover:opacity-100"
                                        >
                                            ✕
                                        </button>
                                        <p className="thumb-title">Img {index + 1}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Flujo B</h3>
                            <input
                                type="file"
                                multiple
                                accept=".png,.jpg,.jpeg"
                                onChange={(e) => handleFileInput(e, setFlowBImages, flowBImages)}
                                className="mb-2"
                            />
                            <div className="thumb-gallery">
                                {flowBImages.map((img, index) => (
                                    <div
                                        key={index}
                                        className="relative group"
                                        draggable
                                        onDragStart={handleDragStart(index)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleDrop(index, 'B', setFlowBImages)}
                                    >
                                        <img
                                            src={img.dataUrl}
                                            alt={img.name}
                                            onClick={() => openAnnotation('B', index)}
                                        />
                                        <button
                                            onClick={() => removeImage(index, setFlowBImages)}
                                            className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 opacity-75 hover:opacity-100"
                                        >
                                            ✕
                                        </button>
                                        <p className="thumb-title">Img {index + 1}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            onClick={handleCancel}
                            className="bg-gray-500 text-white rounded font-semibold px-4 py-2"
                        >
                            Cancelar
                        </button>
                        <button
                            disabled={!canGenerate}
                            onClick={() => simulateAction('generate')}
                            className="bg-blue-800 text-white rounded font-semibold px-4 py-2 disabled:bg-gray-400"
                        >
                            Generar Comparación
                        </button>
                        <button
                            disabled={!canGenerate}
                            onClick={() => simulateAction('refine')}
                            className="bg-blue-800 text-white rounded font-semibold px-4 py-2 disabled:bg-gray-400"
                        >
                            Guardar y Refinar
                        </button>
                    </div>

                    {resultData && (
                        <pre className="bg-gray-100 p-4 mt-4 rounded text-sm overflow-auto">
                            {JSON.stringify(resultData, null, 2)}
                        </pre>
                    )}
                </div>
            )}

            {selectedImage && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold mb-2">Editar Anotación</h3>
                        <textarea
                            rows="4"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={annotationText}
                            onChange={(e) => setAnnotationText(e.target.value)}
                        />
                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="bg-gray-500 text-white rounded px-3 py-1"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={saveAnnotation}
                                className="bg-blue-800 text-white rounded px-3 py-1"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FlowComparison;

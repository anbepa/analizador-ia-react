import React, { useState } from 'react';
import { callAiApi } from '../lib/apiService';
import { PROMPT_COMPARE_IMAGE_FLOWS_AND_REPORT_BUGS } from '../lib/prompts';
import { useAppContext } from '../context/AppContext';
import BugReport from './BugReport';
import FlowImageUploader from './FlowImageUploader';

function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function FlowComparison({ onComparisonGenerated }) {
    const [showForm, setShowForm] = useState(true);
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

    const { apiConfig } = useAppContext();
    const [error, setError] = useState(null);

    const canGenerate = (flowAImages.length > 0 || flowBImages.length > 0) && !loading;

    const handleGenerateComparison = async () => {
        setLoading(true);
        setError(null);
        try {
            const allImages = [...flowAImages, ...flowBImages].map((img) => ({
                base64: img.base64,
                type: img.type,
                dataUrl: img.dataUrl,
            }));

            const prompt = PROMPT_COMPARE_IMAGE_FLOWS_AND_REPORT_BUGS();
            const jsonText = await callAiApi(prompt, allImages, apiConfig);
            const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/s) || jsonText.match(/([\s\S]*)/);
            if (!jsonMatch) throw new Error('La respuesta de la IA no contiene JSON.');
            const cleaned = jsonMatch[1] || jsonMatch[0];
            const parsed = JSON.parse(cleaned);
            setResultData(parsed);
            if (onComparisonGenerated) onComparisonGenerated(parsed);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8">
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-800 text-white rounded font-semibold px-4 py-2"
                >
                    Generar Bugs
                </button>
            )}

            {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6 mt-4">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                        Generar Bugs
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
                        <FlowImageUploader
                            label="Flujo A"
                            images={flowAImages}
                            setImages={setFlowAImages}
                            onImageClick={(idx) => openAnnotation('A', idx)}
                            onDragStart={handleDragStart}
                            onDropThumb={(idx) => handleDrop(idx, 'A', setFlowAImages)}
                        />

                        <FlowImageUploader
                            label="Flujo B"
                            images={flowBImages}
                            setImages={setFlowBImages}
                            onImageClick={(idx) => openAnnotation('B', idx)}
                            onDragStart={handleDragStart}
                            onDropThumb={(idx) => handleDrop(idx, 'B', setFlowBImages)}
                        />
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
                            onClick={handleGenerateComparison}
                            className="bg-blue-800 text-white rounded font-semibold px-4 py-2 disabled:bg-gray-400"
                        >
                            Generar Bugs
                        </button>
                    </div>

                    {error && <p className="text-danger mt-2">Error: {error}</p>}

                    {resultData && (
                        <BugReport
                            data={resultData}
                            flowA={flowAImages}
                            flowB={flowBImages}
                            onClose={() => setResultData(null)}
                        />
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

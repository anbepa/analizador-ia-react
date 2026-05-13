import React from 'react';
import ImageUploader from './ImageUploader';

function UploadModal({ show, onClose }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary-900/40 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white rounded-[32px] shadow-2xl border border-secondary-100 w-full max-w-5xl max-h-[92vh] flex flex-col transform transition-all overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]">
                {/* Header */}
                <div className="flex justify-between items-center p-8 border-b border-secondary-50 bg-white">
                    <div>
                        <h3 className="text-2xl font-bold text-secondary-900 leading-tight">Gestión de Evidencias</h3>
                        <p className="text-xs text-secondary-400 mt-1 font-medium">Carga capturas de pantalla o videos para que la IA los procese</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary-100 rounded-full transition-all text-secondary-400 hover:text-secondary-600 active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-secondary-50/20 custom-scrollbar">
                    <ImageUploader />
                </div>

                {/* Footer */}
                <div className="px-8 py-6 flex justify-end items-center gap-4 bg-white border-t border-secondary-50">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-10 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Finalizar carga
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UploadModal;

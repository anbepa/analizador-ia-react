import React from 'react';
import { useAppContext } from '../../context/AppContext';

const HomeView = () => {
    const { setNavigationMode } = useAppContext();

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-8 text-center animate-fade-in">
            <div className="max-w-lg space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <div className="relative bg-white p-6 rounded-3xl shadow-apple-xl border border-white/50 w-32 h-32 mx-auto flex items-center justify-center">
                        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-secondary-900 mb-3">Bienvenido al Analizador IA</h2>
                    <p className="text-secondary-600 text-lg leading-relaxed">
                        ¡De imágenes a escenarios de prueba en segundos! Deja que la IA analice tus capturas y documente cada paso automáticamente.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => setNavigationMode('analysis')}
                        className="apple-button apple-button-primary text-lg px-8 py-4 shadow-xl shadow-primary/20 hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Análisis
                    </button>
                    <button
                        onClick={() => setNavigationMode('reports')}
                        className="apple-button apple-button-secondary text-lg px-8 py-4 hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Ver Reportes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomeView;

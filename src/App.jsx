import React, { useState } from 'react';
import ConfigurationPanel from './components/ConfigurationPanel';
import ReportDisplay from './components/ReportDisplay';
import TicketModal from './components/TicketModal';
import UploadModal from './components/UploadModal';
import { useAppContext } from './context/AppContext';

function App() {
    const {
        isRefining,
        modal,
        closeModal,
        reportRef,
        activeReport,
        loading,
        navigationState,
        setNavigationMode,
        currentImageFiles
    } = useAppContext();

    const [showUploadModal, setShowUploadModal] = useState(false);

    const showSidebar = navigationState.viewMode === 'sidebar' || isRefining;

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-40 pt-4 px-4 sm:px-8 lg:px-12 mb-8">
                <div className="glass-panel rounded-2xl px-6 py-4 flex items-center justify-between transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary/30">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-secondary-900 tracking-tight">Analizador IA</h1>
                            <p className="text-xs text-secondary-500 font-medium">QA Automation Assistant</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Status Indicators */}
                        <div className="hidden md:flex items-center gap-6 mr-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase tracking-wider text-secondary-400 font-bold">Evidencias</span>
                                <span className="text-sm font-semibold text-secondary-800">{currentImageFiles.length} archivos</span>
                            </div>
                            <div className="h-8 w-px bg-secondary-200" />
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase tracking-wider text-secondary-400 font-bold">Estado</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${loading.state ? 'bg-warning animate-pulse' : 'bg-success'}`} />
                                    <span className="text-sm font-semibold text-secondary-800">{loading.state ? 'Procesando' : 'Listo'}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setNavigationMode(navigationState.viewMode === 'sidebar' ? 'default' : 'sidebar')}
                            className={`apple-button ${navigationState.viewMode === 'sidebar' ? 'apple-button-primary' : 'apple-button-secondary'} flex items-center gap-2`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span className="hidden sm:inline">Área de Trabajo</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="w-full px-4 sm:px-8 lg:px-12 pb-12">
                <div className="flex gap-6 relative">
                    {/* Sidebar */}
                    <aside
                        className={`fixed lg:relative z-30 top-24 bottom-0 lg:top-auto lg:bottom-auto transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${showSidebar
                                ? 'w-[320px] translate-x-0 opacity-100'
                                : 'w-0 -translate-x-10 opacity-0 pointer-events-none lg:w-0 lg:translate-x-0'
                            }`}
                    >
                        <div className="h-[calc(100vh-140px)] lg:h-auto lg:sticky lg:top-28">
                            <ConfigurationPanel
                                mode="workspace"
                                onOpenUploadModal={() => setShowUploadModal(true)}
                            />
                        </div>
                    </aside>

                    {/* Overlay for mobile sidebar */}
                    {showSidebar && (
                        <div
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
                            onClick={() => setNavigationMode('default')}
                        />
                    )}

                    {/* Sidebar Toggle (Floating) */}
                    {!showSidebar && (
                        <button
                            onClick={() => setNavigationMode('sidebar')}
                            className="fixed left-6 top-32 z-30 bg-white/80 backdrop-blur-md border border-white/60 text-secondary-600 p-3 rounded-full shadow-apple-lg hover:scale-110 transition-all duration-300 group"
                            title="Abrir panel lateral"
                        >
                            <svg className="w-5 h-5 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}

                    {/* Main Content */}
                    <main className={`flex-1 min-w-0 transition-all duration-500 ${showSidebar ? 'lg:pl-0' : ''}`}>
                        <div className="space-y-6">
                            <div
                                className="glass-panel rounded-3xl min-h-[calc(100vh-200px)] relative overflow-hidden"
                                ref={reportRef}
                            >
                                {activeReport ? (
                                    <div className="p-6 sm:p-10 animate-fade-in">
                                        <ReportDisplay />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-8 text-center">
                                        {!showSidebar ? (
                                            <div className="max-w-lg space-y-8 animate-fade-in">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                                    <div className="relative bg-white p-6 rounded-3xl shadow-apple-xl border border-white/50 w-32 h-32 mx-auto flex items-center justify-center">
                                                        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h2 className="text-3xl font-bold text-secondary-900 mb-3">Comienza tu análisis</h2>
                                                    <p className="text-secondary-600 text-lg leading-relaxed">
                                                        Abre el panel lateral para cargar tus evidencias y deja que la IA genere un reporte detallado.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setNavigationMode('sidebar')}
                                                    className="apple-button apple-button-primary text-lg px-8 py-4 shadow-xl shadow-primary/20 hover:scale-105"
                                                >
                                                    Abrir Área de Trabajo
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="max-w-md space-y-6 animate-fade-in opacity-60">
                                                <div className="w-24 h-24 bg-secondary-50 rounded-full flex items-center justify-center mx-auto border border-secondary-100">
                                                    <svg className="w-10 h-10 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-xl font-semibold text-secondary-800">Esperando evidencias...</h3>
                                                <p className="text-secondary-500">Usa el panel izquierdo para cargar imágenes y configurar tu análisis.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Global Modals */}
            <UploadModal
                show={showUploadModal}
                onClose={() => setShowUploadModal(false)}
            />

            <TicketModal
                show={modal.show}
                title={modal.title}
                content={modal.content}
                onClose={closeModal}
            />
        </div>
    );
}

export default App;

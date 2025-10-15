import React, { useState, useEffect } from 'react';
import ConfigurationPanel from './components/ConfigurationPanel';
import ImageUploader from './components/ImageUploader';
import ReportDisplay from './components/ReportDisplay';
import TicketModal from './components/TicketModal';
import ReportTabs from './components/ReportTabs';
import { useAppContext } from './context/AppContext';

function App() {
    const {
        isRefining,
        modal,
        closeModal,
        reportRef,
        activeReport,
        // Navegación unificada
        navigationState,
        setNavigationMode
    } = useAppContext();

    const [showScenario, setShowScenario] = useState(false);

    // Sincronizar estados locales con el sistema de navegación unificado
    useEffect(() => {
        setShowScenario(navigationState.viewMode === 'sidebar');
    }, [navigationState]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Fixed Header with Navigation */}
            <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Analizador de Pruebas con IA
                            </h1>
                            <span className="text-sm text-slate-500 font-medium">
                                Analiza flujos de prueba con evidencias visuales
                            </span>
                        </div>
                        
                        {/* Compact Navigation Controls */}
                        <div className="flex items-center space-x-3">
                            {/* Sidebar Toggle */}
                            <button
                                onClick={() => {
                                    if (navigationState.viewMode === 'sidebar') {
                                        setNavigationMode('default');
                                        setShowScenario(false);
                                    } else {
                                        setNavigationMode('sidebar');
                                        setShowScenario(true);
                                    }
                                }}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    navigationState.viewMode === 'sidebar'
                                        ? 'bg-violet-600 text-white shadow-lg' 
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Área de Trabajo
                            </button>
                            
                            {/* Config Toggle */}
                            <div className="border-l border-slate-200 pl-3">
                                <button
                                    onClick={() => {
                                        setNavigationMode('fullConfig', 'panel-control', 'configuracion');
                                        setShowScenario(false);
                                    }}
                                    className={`p-2 rounded-lg transition-all duration-200 ${
                                        navigationState.viewMode === 'fullConfig'
                                            ? 'text-violet-600 bg-violet-50'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                    title="Configuración"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout with Collapsible Sidebar and Focused Report Area */}
            <div className="flex min-h-[calc(100vh-73px)] bg-slate-50">
                {/* Panel de Control - Full Width when Active */}
                {navigationState.viewMode === 'fullConfig' && (
                    <div className="w-full">
                        <ConfigurationPanel mode="full" />
                    </div>
                )}

                {/* Left Sidebar - Compact Controls & Upload (20-25%) - Only when not showing full config */}
                {navigationState.viewMode !== 'fullConfig' && (
                    <aside className={`transition-all duration-300 bg-white border-r border-slate-200 shadow-sm ${
                        (navigationState.viewMode === 'sidebar' || isRefining) ? 'w-72' : 'w-0 overflow-hidden'
                    }`}>
                        {/* Área de Trabajo - Sidebar simplificado */}
                        <ConfigurationPanel mode="workspace" />
                    </aside>
                )}

                {/* Sidebar Toggle Button (when hidden) */}
                {navigationState.viewMode !== 'sidebar' && navigationState.viewMode !== 'fullConfig' && !isRefining && (
                    <button
                        onClick={() => setNavigationMode('sidebar')}
                        className="fixed left-4 top-24 z-30 bg-white border border-slate-200 rounded-lg p-2 shadow-lg hover:shadow-xl transition-all duration-200 text-slate-600 hover:text-slate-900"
                        title="Mostrar área de trabajo"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}

                {/* Main Report Area (75-80%) - Focused Design - Only show when not in full config mode */}
                {navigationState.viewMode !== 'fullConfig' && (
                    <main className="flex-1 overflow-hidden">
                        <div className="h-full overflow-y-auto">
                            {/* Report Container - Centered with Max Width */}
                            <div className="max-w-6xl mx-auto px-8 py-8">
                                {/* Report Tabs - Only show when there are reports */}
                                {activeReport && (
                                    <div className="mb-6">
                                        <ReportTabs />
                                    </div>
                                )}

                                {/* Main Report Content - White Background with Focus */}
                                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 min-h-[calc(100vh-200px)]" ref={reportRef}>
                                    {/* Show Report Display ONLY if there's an active report */}
                                    {activeReport && (
                                        <div className="p-8">
                                            <ReportDisplay />
                                        </div>
                                    )}

                                    {/* Welcome screen when sidebar is open but no reports */}
                                    {navigationState.viewMode === 'sidebar' && !activeReport && (
                                        <div className="flex items-center justify-center h-96 p-8">
                                            <div className="text-center">
                                                <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Carga Evidencias Visuales</h3>
                                                <p className="text-slate-600 mb-6 max-w-md">Sube imágenes usando el panel lateral para generar un reporte de análisis automatizado</p>
                                                <div className="text-sm text-slate-500">
                                                    <p>1️⃣ Sube imágenes en "Evidencias Visuales"</p>
                                                    <p>2️⃣ Agrega contexto adicional (opcional)</p>
                                                    <p>3️⃣ Haz clic en "🚀 Generar" para crear el reporte</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!activeReport && navigationState.viewMode !== 'sidebar' && (
                                        <div className="flex items-center justify-center h-96 p-8">
                                            <div className="text-center">
                                                <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Analizador de Pruebas con IA</h3>
                                                <p className="text-slate-600 mb-6 max-w-md">Comienza cargando evidencias visuales para generar reportes de análisis automatizado</p>
                                                <button
                                                    onClick={() => setNavigationMode('sidebar')}
                                                    className="bg-violet-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                                >
                                                    Comenzar Análisis
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                )}
            </div>

            {/* Modals */}
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

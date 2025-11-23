import React from 'react';
import ConfigurationPanel from './components/ConfigurationPanel';
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
        loading,
        navigationState,
        setNavigationMode
    } = useAppContext();

    const showSidebar = navigationState.viewMode === 'sidebar' || isRefining;

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-secondary-50 via-white to-secondary-100 text-secondary-900">
            <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
                <div className="absolute -top-24 -left-28 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute top-10 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-secondary-100/80 blur-[120px]" />
            </div>

            {/* Fixed Header with Navigation */}
            <header className="sticky top-0 z-40">
                <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-10 pt-6">
                    <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-apple-md rounded-2xl px-6 py-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center shadow-apple-md">
                                    <span className="text-lg font-semibold">IA</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight text-secondary-900">Analizador de Pruebas</h1>
                                    <p className="text-sm text-secondary-600">Flujos guiados para subir evidencias y generar reportes claros</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-secondary-500">
                                <span className="px-2 py-1 rounded-full bg-secondary-50 border border-secondary-200">Gemini protegido</span>
                                <span className="px-2 py-1 rounded-full bg-secondary-50 border border-secondary-200">Encola peticiones automáticamente</span>
                            </div>
                        </div>

                        {/* Compact Navigation Controls */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary-50 border border-secondary-200 text-sm text-secondary-700">
                                <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_0_4px] shadow-success/10" />
                                Listo para generar
                            </div>
                            <button
                                onClick={() => {
                                    if (navigationState.viewMode === 'sidebar') {
                                        setNavigationMode('default');
                                    } else {
                                        setNavigationMode('sidebar');
                                    }
                                }}
                                className={`apple-button ${navigationState.viewMode === 'sidebar'
                                    ? 'apple-button-primary shadow-apple-lg'
                                    : 'apple-button-secondary'} text-sm`}
                            >
                                Área de trabajo
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout with Collapsible Sidebar and Focused Report Area */}
            <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-10 pb-12">
                <div className="flex gap-6 mt-6">
                    {/* Left Sidebar - Compact Controls & Upload */}
                    <aside
                        className={`transition-all duration-300 ease-out ${
                            showSidebar ? 'w-[360px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
                        }`}
                        aria-hidden={!showSidebar}
                    >
                        <div className="sticky top-28">
                            <ConfigurationPanel mode="workspace" />
                        </div>
                    </aside>

                    {/* Sidebar Toggle Button (when hidden) */}
                    {!showSidebar && (
                        <button
                            onClick={() => setNavigationMode('sidebar')}
                            className="fixed left-4 top-28 z-30 bg-white/90 backdrop-blur-lg border border-white/60 rounded-full p-3 shadow-apple-md hover:shadow-apple-lg transition-all duration-200 text-secondary-600 hover:text-secondary-900"
                            title="Mostrar área de trabajo"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}

                    {/* Main Report Area */}
                    <main className="flex-1 min-w-0">
                        <div className="h-full space-y-4">
                            {/* Report Tabs */}
                            {activeReport && (
                                <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-apple-md rounded-2xl px-5 py-4">
                                    <ReportTabs />
                                </div>
                            )}

                            {/* Main Report Content */}
                            <div
                                className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-apple-xl rounded-3xl min-h-[calc(100vh-260px)] overflow-hidden"
                                ref={reportRef}
                            >
                                {activeReport && (
                                    <div className="p-8">
                                        <ReportDisplay />
                                    </div>
                                )}

                                {/* Welcome screen when sidebar is open but no reports */}
                                {showSidebar && !activeReport && (
                                    <div className="flex items-center justify-center h-[460px] p-10">
                                        <div className="text-center space-y-6 max-w-xl">
                                            {loading.state ? (
                                                <>
                                                    <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                                        <div className="w-12 h-12 border-[6px] border-primary/70 border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-2xl font-semibold text-secondary-900">Generando análisis con IA</h3>
                                                        <p className="text-secondary-600">{loading.message || 'Procesando imágenes...'}</p>
                                                        <p className="text-sm text-secondary-500">⏳ Espera unos segundos mientras el servicio procesa las evidencias.</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-24 h-24 bg-secondary-50 border border-secondary-200 rounded-2xl flex items-center justify-center mx-auto">
                                                        <svg className="w-12 h-12 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-2xl font-semibold text-secondary-900">Prepara tu análisis</h3>
                                                    <p className="text-secondary-600">Sube evidencias en el panel lateral y agrega contexto para obtener un reporte pulido.</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-sm text-secondary-600">
                                                        <div className="p-4 rounded-2xl bg-secondary-50 border border-secondary-200">
                                                            <p className="font-semibold text-secondary-800">1. Sube imágenes</p>
                                                            <p className="text-secondary-600">Arrastra o selecciona tus capturas.</p>
                                                        </div>
                                                        <div className="p-4 rounded-2xl bg-secondary-50 border border-secondary-200">
                                                            <p className="font-semibold text-secondary-800">2. Añade contexto</p>
                                                            <p className="text-secondary-600">Comparte detalles clave del flujo.</p>
                                                        </div>
                                                        <div className="p-4 rounded-2xl bg-secondary-50 border border-secondary-200">
                                                            <p className="font-semibold text-secondary-800">3. Genera</p>
                                                            <p className="text-secondary-600">Obtén un reporte listo para compartir.</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Full welcome when sidebar hidden */}
                                {!activeReport && !showSidebar && (
                                    <div className="flex items-center justify-center h-[460px] p-10">
                                        <div className="text-center space-y-5 max-w-xl">
                                            <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m00V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-2xl font-semibold text-secondary-900">Analizador de Pruebas con IA</h3>
                                            <p className="text-secondary-600">Activa el panel lateral para empezar a subir evidencias y mantener el foco en la lectura del reporte.</p>
                                            <button
                                                onClick={() => setNavigationMode('sidebar')}
                                                className="apple-button apple-button-primary text-base px-8 shadow-apple-lg"
                                            >
                                                Abrir área de trabajo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
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

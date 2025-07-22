import React from 'react';
import ConfigurationPanel from './components/ConfigurationPanel';
import ImageUploader from './components/ImageUploader';
import ReportDisplay from './components/ReportDisplay';
import RefinementControls from './components/RefinementControls';
import TicketModal from './components/TicketModal';
import ReportTabs from './components/ReportTabs';
import ConfigToggler from './components/ConfigToggler';
import { useAppContext } from './context/AppContext';

function App() {
    const { 
        isRefining, 
        modal, 
        closeModal, 
        reportRef,
        reports,
        isConfigVisible
    } = useAppContext();

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900">Analizador de Pruebas con IA</h1>
                <p className="text-lg text-gray-600 mt-2">Analiza y refina flujos de prueba a partir de evidencias visuales.</p>
            </header>

            <div className="flex flex-col gap-8">
                {isConfigVisible ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ConfigurationPanel />
                        <ImageUploader />
                    </div>
                ) : (
                    reports.length > 0 && <ConfigToggler />
                )}

                <div ref={reportRef} className="space-y-8">
                     <ReportTabs />
                     <ReportDisplay />
                    {isRefining && <RefinementControls />}
                </div>
            </div>

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

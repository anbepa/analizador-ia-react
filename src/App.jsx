import React, { useState } from 'react';
import ConfigurationPanel from './components/ConfigurationPanel';
import ImageUploader from './components/ImageUploader';
import ReportDisplay from './components/ReportDisplay';
import RefinementControls from './components/RefinementControls';
import TicketModal from './components/TicketModal';
import ReportTabs from './components/ReportTabs';
import ConfigToggler from './components/ConfigToggler';
import FlowComparison from './components/FlowComparison';
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

    const [showScenario, setShowScenario] = useState(false);
    const [showBugs, setShowBugs] = useState(false);

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-primary">Analizador de Pruebas con IA</h1>
                <p className="text-lg text-gray-600 mt-2">Analiza y refina flujos de prueba a partir de evidencias visuales.</p>
            </header>

            <ConfigToggler
                onToggleScenario={() => setShowScenario(!showScenario)}
                onToggleBugs={() => setShowBugs(!showBugs)}
            />
            <div className="flex flex-col gap-8 mt-16 md:mt-0">
                {isConfigVisible && <ConfigurationPanel section="settings" />}

                {showScenario && (
                    <>
                        <ImageUploader />
                        <ConfigurationPanel section="actions" />
                        <div ref={reportRef} className="space-y-8">
                            <ReportTabs />
                            <ReportDisplay />
                            {isRefining && <RefinementControls />}
                        </div>
                    </>
                )}

                {showBugs && <FlowComparison />}
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

import React, { useState, useEffect } from 'react';
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
        showConfigurationPanel,
        setShowConfigurationPanel
    } = useAppContext();

    const [showScenario, setShowScenario] = useState(false);
    const [showBugs, setShowBugs] = useState(false);

    useEffect(() => {
        if (showScenario) {
            setShowConfigurationPanel(false);
            setShowBugs(false);
        }
    }, [showScenario, setShowConfigurationPanel]);

    useEffect(() => {
        if (showBugs) {
            setShowConfigurationPanel(false);
            setShowScenario(false);
        }
    }, [showBugs, setShowConfigurationPanel]);

    useEffect(() => {
        if (showConfigurationPanel) {
            setShowScenario(false);
            setShowBugs(false);
        }
    }, [showConfigurationPanel]);

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-primary">Analizador de Pruebas con IA</h1>
                <p className="text-lg text-gray-600 mt-2">Analiza y refina flujos de prueba a partir de evidencias visuales.</p>
            </header>

            <ConfigToggler
                onToggleScenario={() => setShowScenario(!showScenario)}
                onToggleBugs={() => {
                    if (!showBugs) setShowBugs(true);
                }}
            />
            <div className="flex flex-col gap-8 mt-16 md:mt-0">
                {showConfigurationPanel && (
                    <ConfigurationPanel mode="config" />
                )}

                {showScenario && (
                    <>
                        <div className="bg-white rounded-lg shadow-md p-6 glassmorphism">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Generar Escenarios con imágenes</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <ImageUploader />
                                <ConfigurationPanel mode="actions" />
                            </div>
                        </div>

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

import React from 'react';
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
    const [comparisonResult, setComparisonResult] = React.useState(null);

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-primary">Analizador de Pruebas con IA</h1>
                <p className="text-lg text-gray-600 mt-2">Analiza y refina flujos de prueba a partir de evidencias visuales.</p>
            </header>

            <ConfigToggler />
            <div className="flex flex-col gap-8 mt-16 md:mt-0">
                {isConfigVisible && (
                    <div className="bg-white rounded-lg shadow-md p-6 glassmorphism">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Configuración</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ConfigurationPanel />
                            <ImageUploader />
                        </div>
                    </div>
                )}

                <div ref={reportRef} className="space-y-8">
                     <ReportTabs />
                     <ReportDisplay />
                    {isRefining && <RefinementControls />}
                </div>

                <FlowComparison onComparisonGenerated={setComparisonResult} />

                {comparisonResult && (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-2">Resultado de Comparación</h3>
                        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                            {JSON.stringify(comparisonResult, null, 2)}
                        </pre>
                    </div>
                )}
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

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import HomeView from './components/views/HomeView';
import AnalysisView from './components/views/AnalysisView';
import ReportsView from './components/views/ReportsView';
import TicketModal from './components/TicketModal';
import UploadModal from './components/UploadModal';
import { useAppContext } from './context/AppContext';

function App() {
    const {
        modal,
        closeModal,
        navigationState,
    } = useAppContext();

    const [showUploadModal, setShowUploadModal] = useState(false);

    const renderContent = () => {
        switch (navigationState.viewMode) {
            case 'analysis':
                return <AnalysisView />;
            case 'reports':
                return <ReportsView />;
            case 'home':
            default:
                return <HomeView />;
        }
    };

    return (
        <div className="flex h-screen bg-secondary-50 overflow-hidden font-sans text-secondary-900">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative scroll-smooth">
                {renderContent()}
            </main>

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

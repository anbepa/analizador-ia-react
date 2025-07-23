import React from 'react';
import { useAppContext } from '../context/AppContext';

const ConfigToggler = ({ onToggleScenario, onToggleBugs }) => {
    const { showConfigurationPanel, setShowConfigurationPanel } = useAppContext();

    return (
        <div className="fixed bottom-4 right-4 z-50 md:static flex flex-col md:flex-row gap-2">
            <button
                onClick={() => setShowConfigurationPanel(!showConfigurationPanel)}
                className="bg-primary text-white font-semibold py-2 px-4 rounded-full shadow-md hover:bg-primary/90 transition-colors w-48 md:w-auto"
            >
                {showConfigurationPanel ? 'Ocultar Configuración' : 'Mostrar Configuración'}
            </button>
            <button
                onClick={onToggleScenario}
                className="bg-primary text-white font-semibold py-2 px-4 rounded-full shadow-md hover:bg-primary/90 transition-colors w-48 md:w-auto"
            >
                Generar Escenarios con imágenes
            </button>
            <button
                onClick={onToggleBugs}
                className="bg-blue-800 text-white font-semibold py-2 px-4 rounded-full shadow-md hover:bg-blue-900 transition-colors w-48 md:w-auto"
            >
                Generar Bugs
            </button>
        </div>
    );
};

export default ConfigToggler;

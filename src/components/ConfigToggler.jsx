import React from 'react';
import { useAppContext } from '../context/AppContext';

const ConfigToggler = () => {
    const { showConfigurationPanel, setShowConfigurationPanel } = useAppContext();

    return (
        <button
            onClick={() => setShowConfigurationPanel(!showConfigurationPanel)}
            className="fixed bottom-4 right-4 z-50 md:static bg-primary text-white font-semibold py-2 px-4 rounded-full shadow-md hover:bg-primary/90 transition-colors w-48 md:w-auto"
        >
            {showConfigurationPanel ? 'Ocultar Configuración' : 'Mostrar Configuración'}
        </button>
    );
};

export default ConfigToggler;

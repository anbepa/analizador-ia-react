import React from 'react';




function TicketModal({ show, title, content, onClose }) {
    if (!show) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(content)
            .then(() => alert('¡Copiado al portapapeles!'))
            .catch(() => alert('Oops, no se pudo copiar.'));
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
                <div className="p-6">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>
                    <div className="mt-4 modal-content">{content}</div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
                    <button onClick={copyToClipboard} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700">Copiar al Portapapeles</button>
                </div>
            </div>
        </div>
    );
}

export default TicketModal;
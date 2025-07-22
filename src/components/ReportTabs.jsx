import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

const ReportTabs = () => {
    const { reports, activeReportIndex, selectReport, deleteReport, updateReportName } = useAppContext();
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingValue, setEditingValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (editingIndex !== null && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingIndex]);

    const handleDoubleClick = (index, currentName) => {
        setEditingIndex(index);
        setEditingValue(currentName);
    };

    const handleNameChange = (e) => {
        setEditingValue(e.target.value);
    };

    const handleSaveName = (index) => {
        if (editingValue.trim()) {
            updateReportName(index, editingValue.trim());
        }
        setEditingIndex(null);
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            handleSaveName(index);
        } else if (e.key === 'Escape') {
            setEditingIndex(null);
        }
    };

    if (reports.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap border-b border-gray-200">
            {reports.map((report, index) => (
                <div
                    key={index}
                    className={`flex items-center py-2 px-4 cursor-pointer border-b-2 ${
                        activeReportIndex === index
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => selectReport(index)}
                >
                    {editingIndex === index ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editingValue}
                            onChange={handleNameChange}
                            onBlur={() => handleSaveName(index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="bg-transparent border-none focus:ring-0 p-0"
                        />
                    ) : (
                        <span onDoubleClick={() => handleDoubleClick(index, report.Nombre_del_Escenario || `Reporte ${index + 1}`)}>
                            {report.Nombre_del_Escenario || `Reporte ${index + 1}`}
                        </span>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteReport(index);
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ReportTabs;
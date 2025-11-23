import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

const ReportTabs = () => {
    const { reports, activeReportIndex, selectReport, deleteReport, updateReportName, handleMakeReportPermanent } = useAppContext();
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
        <div className="flex flex-wrap gap-2">
            {reports.map((report, index) => (
                <div
                    key={index}
                    className={`flex items-center px-4 py-2 cursor-pointer rounded-2xl transition-all duration-200 relative text-sm font-medium backdrop-blur ${
                        activeReportIndex === index
                            ? 'bg-primary text-white shadow-apple-lg border border-primary/20'
                            : 'text-secondary-700 hover:text-secondary-900 bg-white/80 border border-secondary-200 hover:border-primary/30 shadow-apple'
                    }`}
                    onClick={() => selectReport(index)}
                >
                        {/* Temporary report indicator */}
                        {report.is_temp && (
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse ${
                                activeReportIndex === index ? 'bg-yellow-300' : 'bg-yellow-500'
                            }`} title="Reporte temporal - se eliminará al cerrar la pestaña">
                                <div className="w-full h-full rounded-full opacity-75"></div>
                            </div>
                        )}
                        
                        {editingIndex === index ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editingValue}
                                onChange={handleNameChange}
                                onBlur={() => handleSaveName(index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="bg-transparent border-none focus:ring-0 p-0 text-secondary-900 placeholder-secondary-400 min-w-20"
                            />
                        ) : (
                            <span
                                onDoubleClick={() => {
                                    let scenarioName = report.Nombre_del_Escenario || `Reporte ${index + 1}`;
                                    if (scenarioName.startsWith('Escenario: ')) {
                                        scenarioName = scenarioName.substring(11);
                                    }
                                    handleDoubleClick(index, scenarioName);
                                }}
                                className="font-medium text-sm mr-1"
                            >
                                {(() => {
                                    let scenarioName = report.Nombre_del_Escenario || `Reporte ${index + 1}`;
                                    if (scenarioName.startsWith('Escenario: ')) {
                                        scenarioName = scenarioName.substring(11);
                                    }
                                    return scenarioName;
                                })()}
                            </span>
                        )}

                        {/* Make permanent button for temporary reports */}
                        {report.is_temp && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMakeReportPermanent(index);
                                }}
                                className={`ml-1 p-1 rounded-full hover:bg-black/10 transition-colors ${
                                    activeReportIndex === index ? 'text-white/70 hover:text-white' : 'text-secondary-400 hover:text-secondary-600'
                                }`}
                                title="Hacer permanente"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteReport(index);
                            }}
                            className={`ml-2 p-1 rounded-full transition-colors ${
                                activeReportIndex === index
                                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                                    : 'text-secondary-400 hover:text-secondary-700 hover:bg-secondary-100'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                </div>
            ))}
        </div>
    );
};

export default ReportTabs;
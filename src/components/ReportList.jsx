import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const ReportList = () => {
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
        return (
            <div className="text-center py-8 text-secondary-400">
                <p className="text-sm">No hay reportes generados</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {reports.map((report, index) => {
                const isActive = activeReportIndex === index;
                const scenarioName = report.Nombre_del_Escenario || `Reporte ${index + 1}`;
                const displayName = scenarioName.startsWith('Escenario: ') ? scenarioName.substring(11) : scenarioName;

                return (
                    <div
                        key={index}
                        onClick={() => selectReport(index)}
                        className={`group relative p-3 rounded-xl transition-all duration-200 cursor-pointer border ${isActive
                                ? 'bg-white/90 border-primary/30 shadow-apple-md'
                                : 'bg-white/40 border-transparent hover:bg-white/60 hover:border-secondary-200'
                            }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-primary' : 'bg-secondary-300'}`} />

                                {editingIndex === index ? (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={editingValue}
                                        onChange={handleNameChange}
                                        onBlur={() => handleSaveName(index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        className="bg-white border border-primary/30 rounded px-1 py-0.5 text-sm text-secondary-900 w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span
                                        className={`text-sm font-medium truncate ${isActive ? 'text-secondary-900' : 'text-secondary-600'}`}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            handleDoubleClick(index, displayName);
                                        }}
                                        title={displayName}
                                    >
                                        {displayName}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {report.is_temp && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMakeReportPermanent(index);
                                        }}
                                        className="p-1.5 rounded-lg text-secondary-400 hover:text-success hover:bg-success/10 transition-colors"
                                        title="Guardar permanente"
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
                                    className="p-1.5 rounded-lg text-secondary-400 hover:text-danger hover:bg-danger/10 transition-colors"
                                    title="Eliminar reporte"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Date or extra info could go here */}
                        {isActive && (
                            <div className="mt-1 ml-5 text-[10px] text-secondary-400">
                                {report.Pasos_Analizados?.length || 0} pasos • {report.is_temp ? 'Temporal' : 'Guardado'}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ReportList;

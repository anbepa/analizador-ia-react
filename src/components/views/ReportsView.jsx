import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import ReportDisplay from '../ReportDisplay';
import { downloadExcelReport, downloadMultipleTestCasesExcel } from '../../lib/excelService';
import { downloadDocReport } from '../../lib/downloadService';
import ReportFilters from '../reports/ReportFilters';
import ReportsTable from '../reports/ReportsTable';
import ConfirmationModal from '../reports/ConfirmationModal';

const ReportsView = () => {
    const {
        activeReport,
        selectReport,
        activeReportImages,
        isRefining,
        setIsRefining,
        handleSaveAndRefine,
        loading,
        canRefine,
        canDownload,
        userContext,
        setUserContext,
        filterUserStory,
        setFilterUserStory,
        userStorySuggestions,
        handleUserStorySearch,
        reports,

        deleteReport,
        handleUserStoryDelete
    } = useAppContext();

    const [storyNumber, setStoryNumber] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteStoryConfirm, setDeleteStoryConfirm] = useState(null);
    const searchTimeoutRef = useRef(null);
    const detailRef = useRef(null);

    const onStorySearchChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setStoryNumber(value);
        setShowSuggestions(true);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            handleUserStorySearch(value || '');
        }, 300);
    };

    const handleStoryInputVisibility = (resetInput) => {
        if (resetInput) {
            setStoryNumber('');
            setShowSuggestions(false);
            handleUserStorySearch('');
        } else {
            setShowSuggestions(true);
        }
    };

    const selectFilterStory = (story) => {
        setFilterUserStory(story);
        setStoryNumber('');
        setShowSuggestions(false);
        selectReport(-1);
    };

    const clearFilter = () => {
        setFilterUserStory(null);
        setStoryNumber('');
        setSearchQuery('');
        selectReport(-1);
    };

    const handleRefinementClick = () => {
        if (!isRefining) {
            setIsRefining(true);
            setUserContext('');
        } else {
            handleSaveAndRefine();
        }
    };

    const handleDownloadExcel = async () => {
        try {
            await downloadExcelReport(activeReport, activeReportImages || []);
        } catch (error) {
            console.error('Error generando Excel:', error);
            alert('Error al generar el archivo Excel: ' + error.message);
        }
    };

    const handleDownloadAllExcel = async () => {
        if (!filterUserStory || filteredReports.length === 0) {
            alert('No hay escenarios para exportar');
            return;
        }

        try {
            // Agrupar imágenes por ID de reporte
            const imagesByReport = {};
            filteredReports.forEach(report => {
                imagesByReport[report.id] = report.imageFiles || [];
            });

            await downloadMultipleTestCasesExcel(filteredReports, imagesByReport, filterUserStory);
        } catch (error) {
            console.error('Error generando Excel múltiple:', error);
            alert('Error al generar el archivo Excel: ' + error.message);
        }
    };

    const handleDownloadAllDoc = () => {
        if (!filterUserStory || filteredReports.length === 0) {
            alert('No hay escenarios para exportar');
            return;
        }
        downloadDocReport(filteredReports);
    };


    // Filtrar escenarios
    const filteredReports = useMemo(() => {
        if (!reports || !filterUserStory) return [];

        let processed = reports
            .map((r, i) => ({
                ...r,
                originalIndex: i,
                // Crear un ID único combinando varios campos
                uniqueId: `${r.id}-${r.created_at}-${i}`
            }))
            .filter(r => r.user_story_id === filterUserStory.id);

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            processed = processed.filter(r => {
                const scenarioName = (r.escenario_prueba || r.Nombre_del_Escenario || '').toLowerCase();
                const idCaso = (r.id_caso || '').toString().toLowerCase();
                return scenarioName.includes(query) || idCaso.includes(query);
            });
        }

        return processed.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
        });
    }, [reports, filterUserStory, searchQuery]);

    const handleDelete = async (reportId, originalIndex, uniqueId) => {
        try {
            await deleteReport(originalIndex);
            setDeleteConfirm(null);
            if (activeReport?.uniqueId === uniqueId) {
                selectReport(-1);
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar el escenario');
        }
    };

    const handleDeleteStory = async () => {
        if (!deleteStoryConfirm) return;
        try {
            await handleUserStoryDelete(deleteStoryConfirm);
            setDeleteStoryConfirm(null);
        } catch (error) {
            console.error('Error al eliminar HU:', error);
            alert('Error al eliminar la Historia de Usuario');
        }
    };

    // Función para seleccionar un reporte
    const handleSelectReport = (report) => {
        selectReport(report.originalIndex);
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] p-6 flex flex-col h-screen overflow-hidden">
            <div className="max-w-[1600px] mx-auto w-full flex flex-col h-full">
                {/* Header */}
                <div className="mb-6 flex-shrink-0">
                    <h1 className="text-3xl font-bold text-secondary-900 mb-2">Escenarios de Prueba</h1>
                    <p className="text-secondary-500">Consulta y gestiona los escenarios generados por Historia de Usuario</p>
                </div>

                {/* Resultados de la búsqueda */}
                {!filterUserStory ? (
                    <div className="flex-1 overflow-y-auto">
                        <ReportFilters
                            storyNumber={storyNumber}
                            onStorySearchChange={onStorySearchChange}
                            showSuggestions={showSuggestions}
                            userStorySuggestions={userStorySuggestions}
                            onSelectFilterStory={selectFilterStory}
                            onClearStoryInput={handleStoryInputVisibility}
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                            filterUserStory={filterUserStory}
                            filteredCount={filteredReports.length}
                            onClearFilter={clearFilter}
                            onRequestDeleteStory={() => setDeleteStoryConfirm(filterUserStory.id)}
                        />
                        <div className="bg-white rounded-2xl border border-secondary-200 p-12 text-center shadow-sm mt-6">
                            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <p className="text-secondary-500 font-medium">Selecciona una Historia de Usuario para ver sus escenarios</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-1 overflow-hidden gap-6 pb-6">
                        {/* Panel Izquierdo: Filtros y Tabla */}
                        <div className={`flex flex-col transition-all duration-300 ease-in-out ${activeReport ? 'w-5/12' : 'w-full'}`}>
                            <div className="flex flex-col h-full bg-white rounded-2xl border border-secondary-200 shadow-sm overflow-hidden">
                                <div className="flex-shrink-0 p-4 border-b border-secondary-100 bg-white z-10">
                                    <ReportFilters
                                        storyNumber={storyNumber}
                                        onStorySearchChange={onStorySearchChange}
                                        showSuggestions={showSuggestions}
                                        userStorySuggestions={userStorySuggestions}
                                        onSelectFilterStory={selectFilterStory}
                                        onClearStoryInput={handleStoryInputVisibility}
                                        searchQuery={searchQuery}
                                        onSearchQueryChange={setSearchQuery}
                                        filterUserStory={filterUserStory}
                                        filteredCount={filteredReports.length}
                                        onClearFilter={clearFilter}
                                        onRequestDeleteStory={() => setDeleteStoryConfirm(filterUserStory.id)}
                                        onExportAll={handleDownloadAllExcel}
                                        onExportAllDoc={handleDownloadAllDoc}
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                                    <ReportsTable
                                        filteredReports={filteredReports}
                                        activeReport={activeReport}
                                        onSelectReport={handleSelectReport}
                                        onRequestDelete={(uniqueId) => setDeleteConfirm(uniqueId)}
                                        filterUserStory={filterUserStory}
                                        onClearFilter={clearFilter}
                                        onRequestDeleteStory={() => setDeleteStoryConfirm(filterUserStory.id)}
                                        onExportAll={handleDownloadAllExcel}
                                        compactMode={!!activeReport}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Panel Derecho: Inspector / Detalle */}
                        {activeReport && (
                            <div className="w-7/12 bg-white flex flex-col overflow-hidden animate-slide-in-right shadow-xl z-20 rounded-2xl border border-secondary-200">
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <ReportDisplay
                                        report={activeReport}
                                        images={activeReportImages}
                                        onDownloadExcel={handleDownloadExcel}
                                        isRefining={isRefining}
                                        onRefine={handleRefinementClick}
                                        userContext={userContext}
                                        setUserContext={setUserContext}
                                        onSaveRefinement={handleSaveAndRefine}
                                        loading={loading}
                                        canRefine={canRefine}
                                        canDownload={canDownload}
                                        onDelete={() => {
                                            // Find the report in filteredReports to get the uniqueId
                                            const reportToDelete = filteredReports.find(r => r.id === activeReport.id);
                                            if (reportToDelete) {
                                                setDeleteConfirm(reportToDelete.uniqueId);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Confirmación */}
            {deleteConfirm && (
                <ConfirmationModal
                    title="¿Eliminar escenario?"
                    description="Esta acción no se puede deshacer. El escenario y todos sus pasos serán eliminados permanentemente."
                    confirmLabel="Eliminar"
                    onCancel={() => setDeleteConfirm(null)}
                    onConfirm={() => {
                        const report = filteredReports.find(r => r.uniqueId === deleteConfirm);
                        if (report) {
                            handleDelete(report.id, report.originalIndex, report.uniqueId);
                        }
                    }}
                />
            )}

            {deleteStoryConfirm && (
                <ConfirmationModal
                    title="¿Eliminar Historia de Usuario?"
                    description="Esta acción es permanente e irreversible. ⚠️ Se eliminarán todos los escenarios de prueba asociados."
                    confirmLabel="Eliminar HU"
                    onCancel={() => setDeleteStoryConfirm(null)}
                    onConfirm={handleDeleteStory}
                />
            )}
        </div>
    );
};

export default ReportsView;

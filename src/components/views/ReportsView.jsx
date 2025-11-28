import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import ReportDisplay from '../ReportDisplay';
import { downloadExcelReport } from '../../lib/excelService';
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
    const detailRef = useRef(null); // Referencia para hacer scroll al detalle

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

    // Función para seleccionar un reporte y hacer scroll al detalle
    const handleSelectReport = (report) => {
        selectReport(report.originalIndex);
        // Hacer scroll suave al detalle después de un pequeño delay
        setTimeout(() => {
            detailRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }, 100);
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] p-6">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-secondary-900 mb-2">Escenarios de Prueba</h1>
                    <p className="text-secondary-500">Consulta y gestiona los escenarios generados por Historia de Usuario</p>
                </div>

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

                {/* Resultados de la búsqueda */}
                {!filterUserStory ? (
                    <div className="bg-white rounded-2xl border border-secondary-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="text-secondary-500 font-medium">Selecciona una Historia de Usuario para ver sus escenarios</p>
                    </div>
                ) : (
                    <>
                        <ReportsTable
                            filteredReports={filteredReports}
                            activeReport={activeReport}
                            onSelectReport={handleSelectReport}
                            onRequestDelete={(uniqueId) => setDeleteConfirm(uniqueId)}
                            filterUserStory={filterUserStory}
                            onClearFilter={clearFilter}
                            onRequestDeleteStory={() => setDeleteStoryConfirm(filterUserStory.id)}
                        />

                        {/* Detalle del Escenario Seleccionado */}
                        {activeReport && (
                            <div ref={detailRef} className="bg-white rounded-2xl border border-secondary-200 shadow-sm overflow-hidden scroll-mt-6">
                                {/* Toolbar */}
                                <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-secondary-900">
                                        Detalle del Escenario
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleRefinementClick}
                                            disabled={!canRefine || loading.state}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${canRefine && !loading.state
                                                ? isRefining
                                                    ? 'bg-success/10 text-success-700 hover:bg-success/20'
                                                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                                                : 'bg-secondary-50 text-secondary-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {isRefining ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    Ejecutar Refinamiento
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Refinar con IA
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleDownloadExcel}
                                            disabled={!canDownload}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${canDownload
                                                ? 'bg-[#007AFF] text-white hover:bg-[#0062cc]'
                                                : 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Exportar Excel
                                        </button>
                                    </div>
                                </div>

                                {/* Contexto de Refinamiento */}
                                {isRefining && (
                                    <div className="bg-primary/5 border-b border-primary/10 px-6 py-4">
                                        <textarea
                                            value={userContext}
                                            onChange={(e) => setUserContext(e.target.value)}
                                            placeholder="Describe los cambios que quieres realizar..."
                                            className="w-full p-3 text-sm rounded-lg border border-primary/20 bg-white focus:ring-2 focus:ring-primary/20 resize-none h-20"
                                        />
                                    </div>
                                )}

                                {/* Contenido del Reporte */}
                                <div className="p-6">
                                    <ReportDisplay />
                                </div>
                            </div>
                        )}
                    </>
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

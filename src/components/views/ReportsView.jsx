import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import ReportDisplay from '../ReportDisplay';
import { downloadExcelReport } from '../../lib/excelService';

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
        deleteReportsBulk,
        handleUserStoryDelete,
        pagination,
        changePage,
        refreshReports
    } = useAppContext();

    const [storyNumber, setStoryNumber] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteBulkConfirm, setDeleteBulkConfirm] = useState(false);
    const [deleteStoryConfirm, setDeleteStoryConfirm] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' o 'detail'
    const [selectedReports, setSelectedReports] = useState([]); // Almacena originalIndex
    const [downloadProgress, setDownloadProgress] = useState(null);
    const searchTimeoutRef = useRef(null);

    const onStorySearchChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setStoryNumber(value);
        // Removemos la búsqueda automática
    };

    const handleSearchClick = () => {
        if (storyNumber) {
            handleUserStorySearch(storyNumber);
            setShowSuggestions(true);
        } else {
            handleUserStorySearch('');
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchClick();
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
            setDownloadProgress(0);
            await downloadExcelReport(activeReport, activeReportImages || [], (progress) => {
                setDownloadProgress(progress);
            });
        } catch (error) {
            console.error('Error generando Excel:', error);
            alert('Error al generar el archivo Excel: ' + error.message);
        } finally {
            setTimeout(() => setDownloadProgress(null), 500); // Pequeño delay para que el usuario vea el 100%
        }
    };

    // Filtrar escenarios
    const filteredReports = useMemo(() => {
        if (!reports) return [];

        // Por defecto, si no hay filtros activos (HU seleccionada o búsqueda de texto), retornar vacío
        if (!filterUserStory && !searchQuery.trim()) {
            return [];
        }

        let processed = reports
            .map((r, i) => ({
                ...r,
                originalIndex: i,
                uniqueId: `${r.id}-${r.created_at}-${i}`
            }));

        if (filterUserStory) {
            processed = processed.filter(r => r.user_story_id === filterUserStory.id);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            processed = processed.filter(r => {
                const scenarioName = (r.escenario_prueba || r.Nombre_del_Escenario || '').toLowerCase();
                const idCaso = (r.id_caso || '').toString().toLowerCase();
                const huNum = (r.user_story_data?.numero || '').toString().toLowerCase();
                return scenarioName.includes(query) || idCaso.includes(query) || huNum.includes(query);
            });
        }

        return processed.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
        });
    }, [reports, filterUserStory, searchQuery]);

    // Calcular reportes de la página actual para el "Select All"
    const currentPaginatedReports = useMemo(() => {
        const startIndex = (pagination.page - 1) * pagination.pageSize;
        return filteredReports.slice(startIndex, startIndex + pagination.pageSize);
    }, [filteredReports, pagination.page, pagination.pageSize]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const newSelected = new Set(selectedReports);
            currentPaginatedReports.forEach(r => newSelected.add(r.originalIndex));
            setSelectedReports(Array.from(newSelected));
        } else {
            const currentIds = currentPaginatedReports.map(r => r.originalIndex);
            setSelectedReports(prev => prev.filter(id => !currentIds.includes(id)));
        }
    };

    const handleToggleSelect = (e, originalIndex) => {
        e.stopPropagation();
        setSelectedReports(prev => 
            prev.includes(originalIndex) 
                ? prev.filter(id => id !== originalIndex)
                : [...prev, originalIndex]
        );
    };

    const handleBulkDelete = async () => {
        try {
            await deleteReportsBulk(selectedReports);
            setDeleteBulkConfirm(false);
            setSelectedReports([]);
        } catch (error) {
            console.error('Error al eliminar múltiple:', error);
            alert('Error al eliminar los escenarios seleccionados');
        }
    };

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

    const handleSelectReport = (report) => {
        selectReport(report.originalIndex);
        setViewMode('detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleGoBack = () => {
        setViewMode('list');
        selectReport(-1);
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] p-6">
            <div className="max-w-[1400px] mx-auto">
                {viewMode === 'list' ? (
                    <>
                        {/* Header Lista */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Escenarios de Prueba</h1>
                            <p className="text-secondary-500">Consulta y gestiona los escenarios generados por Historia de Usuario</p>
                        </div>

                        {/* Sección de Filtros */}
                        <div className="bg-white rounded-2xl border border-secondary-200 p-6 mb-6 shadow-sm">
                            <h2 className="text-sm font-bold text-secondary-700 uppercase tracking-wider mb-4">
                                Filtros de búsqueda
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Filtro 1: Buscar HU */}
                                <div>
                                    <label className="block text-xs font-semibold text-secondary-600 mb-2">
                                        Historia de Usuario
                                    </label>
                                    <div className="relative">
                                        <div className={`relative flex items-center bg-white border transition-all rounded-xl ${showSuggestions && userStorySuggestions.length > 0
                                            ? 'rounded-b-none border-primary ring-2 ring-primary/10'
                                            : 'border-secondary-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'
                                            }`}>
                                            <div className="pl-3 text-secondary-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                value={storyNumber}
                                                onChange={onStorySearchChange}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Buscar por número de HU..."
                                                className="w-full h-11 pl-2 pr-3 bg-transparent border-none focus:ring-0 text-sm font-medium text-secondary-900 placeholder-secondary-400"
                                            />
                                            {storyNumber && (
                                                <button
                                                    onClick={() => {
                                                        setStoryNumber('');
                                                        setShowSuggestions(false);
                                                        handleUserStorySearch('');
                                                    }}
                                                    className="p-2 mr-1 text-secondary-400 hover:text-secondary-600 rounded-full hover:bg-secondary-100 transition-colors"
                                                    title="Limpiar búsqueda"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={handleSearchClick}
                                                className="h-9 px-4 mr-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
                                            >
                                                Buscar
                                            </button>
                                        </div>

                                        {showSuggestions && storyNumber && (
                                            <div className="absolute top-full left-0 right-0 bg-white border-x border-b border-primary rounded-b-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto z-50">
                                                {userStorySuggestions.length > 0 ? (
                                                    userStorySuggestions.map(story => (
                                                        <button
                                                            key={story.id}
                                                            onClick={() => selectFilterStory(story)}
                                                            className="w-full text-left px-4 py-3 hover:bg-secondary-50 transition-colors border-b border-secondary-100 last:border-0"
                                                        >
                                                            <span className="font-bold text-primary text-sm block">HU-{story.numero}</span>
                                                            <span className="text-xs text-secondary-600 truncate block">{story.title}</span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-secondary-500">No se encontraron historias</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Filtro 2: Buscar en Escenarios */}
                                <div>
                                    <label className="block text-xs font-semibold text-secondary-600 mb-2">
                                        Filtrar Escenarios
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Buscar por nombre o ID de escenario..."
                                            className="w-full h-11 pl-10 pr-10 bg-white border border-secondary-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-secondary-50 disabled:text-secondary-400"
                                        />
                                        <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* HU Seleccionada */}
                            {filterUserStory && (
                                <div className="mt-4 pt-4 border-t border-secondary-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-primary">HU-{filterUserStory.numero}</span>
                                                    <span className="text-secondary-400">•</span>
                                                    <span className="text-sm text-secondary-600">{pagination.total} escenarios encontrados</span>
                                                </div>
                                                <p className="text-sm text-secondary-600 font-medium">{filterUserStory.title}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setDeleteStoryConfirm(filterUserStory.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                                title="Eliminar Historia de Usuario de BD"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Eliminar HU
                                            </button>
                                            <button
                                                onClick={clearFilter}
                                                className="text-sm font-medium text-secondary-500 hover:text-secondary-700 transition-colors"
                                            >
                                                Limpiar filtros
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tabla de Escenarios */}
                        <div className="bg-white rounded-2xl border border-secondary-200 shadow-sm overflow-hidden mb-6">
                            {selectedReports.length > 0 ? (
                                <div className="px-6 py-3 border-b border-secondary-200 flex items-center justify-between bg-primary/5 transition-all">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-primary">
                                            {selectedReports.length} {selectedReports.length === 1 ? 'escenario seleccionado' : 'escenarios seleccionados'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedReports([])}
                                            className="px-3 py-1.5 text-xs font-medium text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => setDeleteBulkConfirm(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Eliminar {selectedReports.length}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between transition-all">
                                    <h2 className="text-sm font-bold text-secondary-700 uppercase tracking-wider">
                                        Resultados de la búsqueda
                                    </h2>
                                    {filteredReports.length > 0 && (
                                        <span className="text-sm text-secondary-500">
                                            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1}-{Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} elementos
                                        </span>
                                    )}
                                </div>
                            )}

                            {filteredReports.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary-400">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-bold text-secondary-900 mb-1">
                                        {!filterUserStory && !searchQuery ? 'Comienza una búsqueda' : 'No se encontraron resultados'}
                                    </h3>
                                    <p className="text-xs text-secondary-500 max-w-xs mx-auto">
                                        {!filterUserStory && !searchQuery 
                                            ? 'Ingresa un número de HU o el nombre de un escenario para consultar los registros.' 
                                            : 'Intenta ajustar los filtros para encontrar lo que buscas.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-secondary-50 border-b border-secondary-200">
                                            <tr>
                                                <th className="px-6 py-3 w-12 text-left">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 text-primary bg-white border-secondary-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                                                        checked={currentPaginatedReports.length > 0 && currentPaginatedReports.every(r => selectedReports.includes(r.originalIndex))}
                                                        onChange={handleSelectAll}
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">ID Caso</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">HU</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">Nombre del Escenario</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">Pasos</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">Estado</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">Fecha Creación</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-secondary-100">
                                            {filteredReports.map((report, index) => {
                                                const stepCount = (report.pasos || report.Pasos_Analizados || []).length;
                                                const estado = report.estado_general || 'Pendiente';
                                                const huNumero = report.user_story_data?.numero || report.historia_usuario?.replace('HU-', '') || 'N/A';

                                                return (
                                                    <tr
                                                        key={`${report.id}-${index}`}
                                                        onClick={() => handleSelectReport(report)}
                                                        className={`cursor-pointer transition-all relative border-l-4 ${selectedReports.includes(report.originalIndex) ? 'bg-primary/5 border-l-primary' : 'hover:bg-secondary-50 border-l-transparent hover:border-l-primary/30'}`}
                                                    >
                                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                            <input 
                                                                type="checkbox" 
                                                                className="w-4 h-4 text-primary bg-white border-secondary-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                                                                checked={selectedReports.includes(report.originalIndex)}
                                                                onChange={(e) => handleToggleSelect(e, report.originalIndex)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="text-sm font-semibold text-secondary-900">{report.id_caso || 'N/A'}</span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-primary/10 text-primary uppercase">
                                                                HU-{huNumero}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-medium text-secondary-900 hover:text-primary transition-colors">{report.escenario_prueba || report.Nombre_del_Escenario || 'Sin nombre'}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-secondary-100 text-secondary-700 text-xs font-medium">{stepCount}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${estado === 'Exitoso' ? 'bg-green-50 text-green-700' : estado === 'Fallido' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${estado === 'Exitoso' ? 'bg-green-600' : estado === 'Fallido' ? 'bg-red-600' : 'bg-yellow-600'}`} />
                                                                {estado}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-secondary-600">
                                                            {new Date(report.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {pagination.total > pagination.pageSize && (
                                <div className="px-6 py-4 bg-secondary-50 border-t border-secondary-200 flex items-center justify-between">
                                    <div className="text-sm text-secondary-500 font-medium">Página {pagination.page} de {Math.ceil(pagination.total / pagination.pageSize)}</div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => changePage(pagination.page - 1)} disabled={pagination.page === 1 || loading.state} className="px-4 py-2 text-sm font-semibold rounded-xl border border-secondary-300 bg-white hover:bg-secondary-50 disabled:bg-secondary-50 disabled:text-secondary-400 transition-all shadow-sm">Anterior</button>
                                        <button onClick={() => changePage(pagination.page + 1)} disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize) || loading.state} className="px-4 py-2 text-sm font-semibold rounded-xl border border-secondary-300 bg-white hover:bg-secondary-50 disabled:bg-secondary-50 disabled:text-secondary-400 transition-all shadow-sm">Siguiente</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* === HEADER DETALLE === */}
                        <div className="mb-6 flex items-center justify-between">
                            {/* Breadcrumbs + Título */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleGoBack}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-secondary-200 text-secondary-600 text-sm font-semibold hover:bg-secondary-50 transition-all shadow-sm group"
                                >
                                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Volver a la lista
                                </button>
                                <span className="text-secondary-300">›</span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        {activeReport?.user_stories && (
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                HU-{activeReport.user_stories.numero}
                                            </span>
                                        )}
                                        <h1 className="text-xl font-bold text-secondary-900">Detalle del Escenario</h1>
                                    </div>
                                    <p className="text-xs text-secondary-400 mt-0.5">
                                        {activeReport?.escenario_prueba || 'Visualización completa de la ejecución y sus pasos'}
                                    </p>
                                </div>
                            </div>

                            {/* Botones — jerarquía visual clara */}
                            <div className="flex items-center gap-3">
                                {/* Refinamiento: botón PRINCIPAL (azul sólido) */}
                                <button
                                    onClick={handleRefinementClick}
                                    disabled={!canRefine || loading.state}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm ${
                                        !canRefine || loading.state
                                            ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                                            : isRefining
                                            ? 'bg-primary text-white hover:bg-primary-600 shadow-blue-200'
                                            : 'bg-[#007AFF] text-white hover:bg-[#007AFF]/90 shadow-blue-200 hover:shadow-md'
                                    }`}
                                >
                                    {loading.state ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>{loading.message || 'Procesando...'}</span>
                                        </>
                                    ) : isRefining ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            Ejecutar Refinamiento
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                            Refinar con IA
                                        </>
                                    )}
                                </button>

                                {/* Cancelar (solo en modo refinamiento) — ghost: no compite con el botón principal */}
                                {isRefining && !loading.state && (
                                    <button
                                        onClick={() => setIsRefining(false)}
                                        className="px-3 py-2 text-sm font-medium text-secondary-500 hover:text-secondary-800 transition-colors rounded-lg hover:bg-secondary-100"
                                    >
                                        Cancelar
                                    </button>
                                )}

                                {/* Exportar: botón SECUNDARIO (outlined) */}
                                <button
                                    onClick={handleDownloadExcel}
                                    disabled={!canDownload}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${
                                        canDownload
                                            ? 'bg-white border-secondary-300 text-secondary-700 hover:border-primary hover:text-primary hover:bg-primary/5 shadow-sm'
                                            : 'bg-secondary-50 border-secondary-100 text-secondary-400 cursor-not-allowed'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Exportar Excel
                                </button>
                            </div>
                        </div>

                        {/* === PANEL REFINAMIENTO COLAPSABLE === */}
                        {isRefining && (
                            <div className="mb-4 bg-primary/[0.04] border border-primary/20 rounded-2xl overflow-hidden animate-fade-in shadow-sm">
                                <div className="flex items-center gap-3 px-5 py-3 border-b border-primary/10 bg-primary/[0.03]">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-primary">Instrucciones para el Refinamiento con IA</p>
                                        <p className="text-xs text-primary/60">Describe qué cambios deseas hacer. Los pasos son editables en la tabla.</p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <textarea
                                        value={userContext}
                                        onChange={(e) => setUserContext(e.target.value)}
                                        placeholder="Ej: 'Reduce a un solo paso. El resultado fue exitoso porque aparecía el mensaje de confirmación en pantalla'..."
                                        className="w-full p-4 text-sm rounded-xl border border-primary/20 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-24 shadow-inner placeholder-secondary-400"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {/* === DETALLE DEL ESCENARIO === */}
                        {activeReport && (
                            <div className="bg-white rounded-2xl border border-secondary-200 shadow-xl overflow-hidden animate-slide-up">
                                <div className="p-8">
                                    <ReportDisplay />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal de Confirmación */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-secondary-200">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-secondary-900 mb-2">¿Eliminar escenario?</h3>
                                <p className="text-sm text-secondary-600">
                                    Esta acción no se puede deshacer. El escenario y todos sus pasos serán eliminados permanentemente.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    const report = filteredReports.find(r => r.uniqueId === deleteConfirm);
                                    if (report) {
                                        handleDelete(report.id, report.originalIndex, report.uniqueId);
                                    }
                                }}
                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación Eliminación Bulk */}
            {deleteBulkConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-secondary-200">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-secondary-900 mb-2">¿Eliminar {selectedReports.length} escenarios?</h3>
                                <p className="text-sm text-secondary-600">
                                    Esta acción no se puede deshacer. Los escenarios seleccionados serán eliminados permanentemente de la base de datos.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={() => setDeleteBulkConfirm(false)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                Eliminar Todos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación de HU */}
            {deleteStoryConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-secondary-200">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-secondary-900 mb-2">¿Eliminar Historia de Usuario?</h3>
                                <p className="text-sm text-secondary-600">
                                    Esta acción es <strong>permanente e irreversible</strong>.
                                    <br />
                                    <span className="font-semibold text-red-600 mt-2 block">
                                        ⚠️ ADVERTENCIA: Se eliminarán TODOS los escenarios de prueba asociados a esta HU.
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={() => setDeleteStoryConfirm(null)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteStory}
                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                Eliminar HU
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Download Progress Modal */}
            {downloadProgress !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-secondary-200 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-primary animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-secondary-900 mb-2">Generando Excel</h3>
                        <p className="text-secondary-500 text-sm mb-6">Procesando imágenes y estructurando el archivo. Por favor, espera...</p>
                        
                        <div className="w-full bg-secondary-100 rounded-full h-3 mb-2 overflow-hidden relative">
                            <div 
                                className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${downloadProgress}%` }}
                            />
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-bold text-primary">{downloadProgress}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;

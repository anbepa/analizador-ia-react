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
            if (value) {
                handleUserStorySearch(value);
            } else {
                handleUserStorySearch('');
            }
        }, 300);
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
                                        onFocus={() => setShowSuggestions(true)}
                                        placeholder="Buscar por número de HU..."
                                        className="w-full h-11 pl-2 pr-3 bg-transparent border-none focus:ring-0 text-sm font-medium text-secondary-900 placeholder-secondary-400"
                                    />
                                    {storyNumber && (
                                        <button
                                            onClick={() => {
                                                setStoryNumber('');
                                                setShowSuggestions(false);
                                            }}
                                            className="p-2 mr-2 text-secondary-400 hover:text-secondary-600 rounded-full hover:bg-secondary-100 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
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
                                    disabled={!filterUserStory}
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
                                            <span className="text-sm text-secondary-600">{filteredReports.length} escenarios encontrados</span>
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
                        {/* Tabla de Escenarios */}
                        <div className="bg-white rounded-2xl border border-secondary-200 shadow-sm overflow-hidden mb-6">
                            <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-secondary-700 uppercase tracking-wider">
                                    Resultados de la búsqueda
                                </h2>
                                <span className="text-sm text-secondary-500">
                                    Mostrando 1-{filteredReports.length} de {filteredReports.length} elementos
                                </span>
                            </div>

                            {filteredReports.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-secondary-500">No se encontraron escenarios con los filtros aplicados</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-secondary-50 border-b border-secondary-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                                    ID Caso
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                                    Nombre del Escenario
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                                    Pasos
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                                    Estado
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                                    Fecha Creación
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-secondary-700 uppercase tracking-wider">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-secondary-100">
                                            {filteredReports.map((report, index) => {
                                                // Comparación robusta:
                                                // 1. Si activeReport tiene uniqueId, comparar uniqueId
                                                // 2. Si no, comparar ID Y verificar si es el único con ese ID en la lista filtrada
                                                // 3. Si hay duplicados y no tiene uniqueId, asumir que es el primero o usar index si coincide
                                                const isActive = activeReport?.uniqueId
                                                    ? activeReport.uniqueId === report.uniqueId
                                                    : activeReport?.id === report.id;

                                                const stepCount = (report.pasos || report.Pasos_Analizados || []).length;
                                                const estado = report.estado_general || 'Pendiente';

                                                return (
                                                    <tr
                                                        key={`${report.id}-${index}`}
                                                        onClick={() => handleSelectReport(report)}
                                                        className={`cursor-pointer transition-all relative ${isActive
                                                            ? 'bg-primary/10 border-l-4 border-l-primary shadow-sm z-10'
                                                            : 'hover:bg-secondary-50 border-l-4 border-l-transparent hover:z-10'
                                                            }`}
                                                        style={{ pointerEvents: 'auto' }}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-semibold text-secondary-900">
                                                                {report.id_caso || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-secondary-900'}`}>
                                                                {report.escenario_prueba || report.Nombre_del_Escenario || 'Sin nombre'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-secondary-100 text-secondary-700 text-xs font-medium">
                                                                {stepCount}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${estado === 'Exitoso' ? 'bg-green-50 text-green-700' :
                                                                estado === 'Fallido' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                                                                }`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${estado === 'Exitoso' ? 'bg-green-600' :
                                                                    estado === 'Fallido' ? 'bg-red-600' : 'bg-yellow-600'
                                                                    }`} />
                                                                {estado}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-secondary-600">
                                                            {new Date(report.created_at).toLocaleDateString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteConfirm(report.uniqueId);
                                                                }}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

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
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Guardar
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Refinar
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
        </div>
    );
};

export default ReportsView;

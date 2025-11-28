import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';

const ITEMS_PER_PAGE = 10;

const ReportList = () => {
    const {
        reports,
        activeReport,
        setActiveReport,
        loading,
        filterUserStory,
        deleteReport
    } = useAppContext();

    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null); // ID del reporte a eliminar

    // Filtrar y ordenar reportes
    const filteredReports = useMemo(() => {
        if (!reports) return [];

        let processed = reports.map((r, i) => ({ ...r, originalIndex: i }));

        // Filtrar por HU seleccionada
        if (filterUserStory) {
            processed = processed.filter(r => r.user_story_id === filterUserStory.id);
        } else {
            return [];
        }

        // Filtrar por búsqueda local
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            processed = processed.filter(r => {
                const scenarioName = (r.escenario_prueba || r.Nombre_del_Escenario || '').toLowerCase();
                const idCaso = (r.id_caso || '').toString().toLowerCase();
                return scenarioName.includes(query) || idCaso.includes(query);
            });
        }

        // Ordenar por fecha descendente
        return processed.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
        });
    }, [reports, filterUserStory, searchQuery]);

    // Paginación
    const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredReports, currentPage]);

    // Resetear página al cambiar búsqueda
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, filterUserStory]);

    const handleDelete = async (reportId, originalIndex) => {
        try {
            await deleteReport(originalIndex);
            setDeleteConfirm(null);
            // Si el reporte eliminado era el activo, limpiar selección
            if (activeReport?.id === reportId) {
                setActiveReport(null);
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar el escenario');
        }
    };

    if (loading.state && loading.message === 'Cargando reportes...') {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (filteredReports.length === 0 && !searchQuery) {
        return (
            <div className="text-center py-12 bg-secondary-50/50 rounded-3xl border border-dashed border-secondary-200">
                <p className="text-secondary-500 font-medium">No hay escenarios generados para esta historia.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar: Búsqueda + Toggle Vista */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-secondary-100 shadow-sm">
                <div className="relative flex-1 w-full sm:max-w-md">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre o ID..."
                        className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
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

                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-secondary-500 mr-2">{filteredReports.length} escenarios</span>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                                ? 'bg-primary text-white'
                                : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                            }`}
                        title="Vista Grid"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'table'
                                ? 'bg-primary text-white'
                                : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                            }`}
                        title="Vista Tabla"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Vista Grid */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                    {paginatedReports.map((report) => {
                        const isActive = activeReport && activeReport.id === report.id;
                        const date = new Date(report.created_at || Date.now()).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        });
                        const stepCount = (report.pasos || report.Pasos_Analizados || []).length;

                        return (
                            <div
                                key={report.id}
                                className={`group relative flex flex-col items-start text-left p-5 h-full rounded-2xl transition-all duration-300 ease-out border ${isActive
                                        ? 'bg-white border-primary ring-2 ring-primary/10 shadow-lg shadow-primary/5 scale-[1.02]'
                                        : 'bg-white border-secondary-100 hover:border-secondary-300 hover:shadow-lg hover:shadow-secondary-200/50 hover:-translate-y-1'
                                    }`}
                            >
                                {/* Status Indicator Dot */}
                                <div className={`absolute top-5 right-5 w-2 h-2 rounded-full ${isActive ? 'bg-primary' : 'bg-secondary-200 group-hover:bg-secondary-300'}`} />

                                {/* Icon & Title */}
                                <div className="mb-4 pr-6 w-full" onClick={() => setActiveReport(report)}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors cursor-pointer ${isActive ? 'bg-primary/10 text-primary' : 'bg-secondary-50 text-secondary-400 group-hover:bg-secondary-100 group-hover:text-secondary-600'
                                        }`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className={`font-bold text-base line-clamp-2 cursor-pointer ${isActive ? 'text-primary-900' : 'text-secondary-900'}`}>
                                        {report.escenario_prueba || report.Nombre_del_Escenario || 'Escenario sin nombre'}
                                    </h3>
                                </div>

                                {/* Metadata Footer */}
                                <div className="mt-auto w-full pt-4 border-t border-secondary-50 flex items-center justify-between text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className={`${isActive ? 'text-primary-600' : 'text-secondary-500'}`}>
                                            {date}
                                        </span>
                                        <span className={`px-2 py-1 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'bg-secondary-100 text-secondary-600'
                                            }`}>
                                            {stepCount} pasos
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirm(report.id);
                                        }}
                                        className="p-1.5 rounded-lg text-secondary-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        title="Eliminar"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Vista Tabla */}
            {viewMode === 'table' && (
                <div className="bg-white rounded-2xl border border-secondary-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">Escenario</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">Pasos</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-secondary-600 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {paginatedReports.map((report) => {
                                    const isActive = activeReport && activeReport.id === report.id;
                                    const date = new Date(report.created_at || Date.now()).toLocaleDateString('es-ES');
                                    const stepCount = (report.pasos || report.Pasos_Analizados || []).length;

                                    return (
                                        <tr
                                            key={report.id}
                                            onClick={() => setActiveReport(report)}
                                            className={`cursor-pointer transition-colors ${isActive
                                                    ? 'bg-primary/5 hover:bg-primary/10'
                                                    : 'hover:bg-secondary-50'
                                                }`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-primary' : 'bg-secondary-300'}`} />
                                                    <span className={`font-semibold text-sm ${isActive ? 'text-primary' : 'text-secondary-900'}`}>
                                                        {report.escenario_prueba || report.Nombre_del_Escenario || 'Sin nombre'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-secondary-600">{report.id_caso || 'N/A'}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-secondary-100 text-secondary-700 text-xs font-medium">
                                                    {stepCount}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-secondary-600">{date}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirm(report.id);
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
                </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-secondary-100">
                    <p className="text-sm text-secondary-600">
                        Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)} de {filteredReports.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-secondary-200 text-secondary-700 hover:bg-secondary-50"
                        >
                            Anterior
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                            ? 'bg-primary text-white'
                                            : 'bg-white border border-secondary-200 text-secondary-700 hover:bg-secondary-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-secondary-200 text-secondary-700 hover:bg-secondary-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
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
                                    const report = reports.find(r => r.id === deleteConfirm);
                                    if (report) {
                                        handleDelete(deleteConfirm, report.originalIndex);
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

            {/* Empty State (después de búsqueda) */}
            {filteredReports.length === 0 && searchQuery && (
                <div className="text-center py-12 bg-secondary-50/50 rounded-3xl border border-dashed border-secondary-200">
                    <p className="text-secondary-500 font-medium">No se encontraron escenarios con "{searchQuery}"</p>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="mt-3 text-sm text-primary hover:underline"
                    >
                        Limpiar búsqueda
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReportList;

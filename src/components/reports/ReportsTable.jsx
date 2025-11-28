import React from 'react';

const ReportsTable = ({ filteredReports, activeReport, onSelectReport, onRequestDelete }) => {
  if (filteredReports.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-secondary-200 p-12 text-center shadow-sm">
        <p className="text-secondary-500">No se encontraron escenarios con los filtros aplicados</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-secondary-200 shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
        <h2 className="text-sm font-bold text-secondary-700 uppercase tracking-wider">
          Resultados de la búsqueda
        </h2>
        <span className="text-sm text-secondary-500">
          Mostrando 1-{filteredReports.length} de {filteredReports.length} elementos
        </span>
      </div>

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
              const isActive = activeReport?.uniqueId
                ? activeReport.uniqueId === report.uniqueId
                : activeReport?.id === report.id;

              const stepCount = (report.pasos || report.Pasos_Analizados || []).length;
              const estado = report.estado_general || 'Pendiente';

              return (
                <tr
                  key={`${report.id}-${index}`}
                  onClick={() => onSelectReport(report)}
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
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${estado === 'Exitoso' ? 'bg-green-50 text-green-700'
                      : estado === 'Fallido' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${estado === 'Exitoso' ? 'bg-green-600'
                        : estado === 'Fallido' ? 'bg-red-600' : 'bg-yellow-600'
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
                        onRequestDelete(report.uniqueId);
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
  );
};

export default ReportsTable;

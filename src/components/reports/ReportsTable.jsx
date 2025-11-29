import React from 'react';

const ReportsTable = ({ filteredReports, activeReport, onSelectReport, compactMode }) => {
  if (filteredReports.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-secondary-500">No se encontraron escenarios</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-secondary-100">
            <th className="py-3 px-4 text-xs font-semibold text-secondary-400 uppercase tracking-wider w-16">ID</th>
            <th className="py-3 px-4 text-xs font-semibold text-secondary-400 uppercase tracking-wider">Escenario</th>
            <th className="py-3 px-4 text-xs font-semibold text-secondary-400 uppercase tracking-wider w-24 text-right">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-50">
          {filteredReports.map((report) => {
            const isActive = activeReport && activeReport.id === report.id;
            const status = report.estado_general || 'Pendiente';
            const isSuccess = status.toLowerCase() === 'exitoso' || status.toLowerCase() === 'aprobado';

            return (
              <tr
                key={report.uniqueId}
                onClick={() => onSelectReport(report)}
                className={`
                  group cursor-pointer transition-all duration-200
                  ${isActive
                    ? 'bg-secondary-100'
                    : 'hover:bg-secondary-50'}
                `}
                style={{
                  boxShadow: isActive ? 'inset 4px 0 0 0 #2563EB' : 'none'
                }}
              >
                <td className="py-3 px-4 align-top">
                  <span className={`text-sm font-mono ${isActive ? 'text-primary font-bold' : 'text-secondary-500'}`}>
                    #{report.id_caso || report.id}
                  </span>
                </td>
                <td className="py-3 px-4 align-top">
                  <p className={`text-sm font-medium mb-0.5 ${isActive ? 'text-primary' : 'text-secondary-900'}`}>
                    {report.escenario_prueba || report.Nombre_del_Escenario || 'Sin nombre'}
                  </p>
                  {!compactMode && (
                    <p className="text-xs text-secondary-400 line-clamp-1">
                      {report.resultado_esperado || 'Sin descripción'}
                    </p>
                  )}
                </td>
                <td className="py-3 px-4 align-top text-right">
                  <span className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                    ${isSuccess
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'}
                  `}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsTable;

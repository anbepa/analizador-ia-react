import React from 'react';

const ReportFilters = ({
  storyNumber,
  onStorySearchChange,
  showSuggestions,
  userStorySuggestions,
  onSelectFilterStory,
  onClearStoryInput,
  searchQuery,
  onSearchQueryChange,
  filterUserStory,
  filteredCount,
  onClearFilter,
  onRequestDeleteStory,
  onExportAll
}) => (
  <div className="bg-white rounded-2xl border border-secondary-200 p-5 mb-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xs font-bold text-secondary-500 uppercase tracking-wider">
        Filtros
      </h2>

      {/* Acciones Globales para la HU seleccionada */}
      {filterUserStory && (
        <div className="flex items-center gap-2">
          <button
            onClick={onExportAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-700 bg-white border border-secondary-300 hover:bg-secondary-50 hover:text-secondary-900 rounded-lg transition-all shadow-sm"
            title="Exportar todos los escenarios a Excel"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar Todo
          </button>
          <button
            onClick={onRequestDeleteStory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-lg transition-all"
            title="Eliminar Historia de Usuario y sus escenarios"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar HU
          </button>
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Columna 1: Selección de HU o Info de HU */}
      <div>
        {!filterUserStory ? (
          <div className="relative">
            <div className={`relative flex items-center bg-white border transition-all rounded-xl h-11 ${showSuggestions && userStorySuggestions.length > 0
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
                onFocus={() => onClearStoryInput(false)}
                placeholder="Buscar HU..."
                className="w-full h-full pl-2 pr-3 bg-transparent border-none focus:ring-0 text-sm font-medium text-secondary-900 placeholder-secondary-400"
              />
              {storyNumber && (
                <button
                  onClick={() => onClearStoryInput(true)}
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
                      onClick={() => onSelectFilterStory(story)}
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
        ) : (
          /* Tarjeta de HU Seleccionada - Diseño Compacto Uniforme */
          <div className="relative flex items-center bg-secondary-50 border border-secondary-300 rounded-xl h-11 px-3 gap-3 transition-all">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-white border border-secondary-200 shadow-sm flex-shrink-0">
              <span className="text-[10px] font-bold text-secondary-600">HU</span>
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-sm font-bold text-secondary-900 whitespace-nowrap">
                HU-{filterUserStory.numero}
              </span>
              <span className="text-secondary-300">|</span>
              <span className="text-sm text-secondary-600 truncate" title={filterUserStory.title}>
                {filterUserStory.title}
              </span>
            </div>

            <button
              onClick={onClearFilter}
              className="p-1.5 text-secondary-400 hover:text-secondary-700 hover:bg-secondary-200 rounded-lg transition-all flex-shrink-0"
              title="Cambiar Historia de Usuario"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Columna 2: Filtro de Escenarios */}
      <div>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Filtrar escenarios..."
            disabled={!filterUserStory}
            className="w-full h-11 pl-10 pr-10 bg-white border border-secondary-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-secondary-50 disabled:text-secondary-400"
          />
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
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
  </div>
);

export default ReportFilters;

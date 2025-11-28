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
  onRequestDeleteStory
}) => (
  <div className="bg-white rounded-2xl border border-secondary-200 p-6 mb-6 shadow-sm">
    <h2 className="text-sm font-bold text-secondary-700 uppercase tracking-wider mb-4">
      Filtros de búsqueda
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onFocus={() => onClearStoryInput(false)}
              placeholder="Buscar por número de HU..."
              className="w-full h-11 pl-2 pr-3 bg-transparent border-none focus:ring-0 text-sm font-medium text-secondary-900 placeholder-secondary-400"
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
      </div>

      <div>
        <label className="block text-xs font-semibold text-secondary-600 mb-2">
          Filtrar Escenarios
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Buscar por nombre o ID de escenario..."
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

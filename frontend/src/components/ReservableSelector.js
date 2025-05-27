import React, { useState } from 'react';
import '../styles/ReservableSelector.css';

function ReservableSelector({ reservables, onReservableSelect, selectedReservables = [], count = 0, next, previous, onNextPage, onPrevPage, currentPage = 1, selectedType }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  const filteredReservables = reservables?.results?.filter(reservable => {
    const searchField = selectedType === 'classroom' ? reservable.slug : reservable.name;
    return (searchField && searchField.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (reservable.description && reservable.description.toLowerCase().includes(searchTerm.toLowerCase()));
  }) || [];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  React.useEffect(() => {
    const allFilteredSelected = filteredReservables.length > 0 && 
      filteredReservables.every(reservable => selectedReservables.includes(reservable.id));
    setSelectAll(allFilteredSelected);
  }, [filteredReservables, selectedReservables]);

  return (
    <div className="reservable-selector">
      <div className="selector-header">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Iskanje..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={clearSearch}
                className="clear-search-btn"
                aria-label="Počisti iskanje"
              >
                x
              </button>
            )}
          </div>
        </div>
        
      </div>

      <div className="reservable-pagination-info">
        <span className="reservable-pagination-count">
          {reservables?.results?.length > 0 ? ((currentPage - 1) * reservables.results.length + 1) : 0}
          -{reservables?.results?.length > 0 ? ((currentPage - 1) * reservables.results.length + reservables.results.length) : 0}
          {' '} / {count}
        </span>
        <div className="reservable-pagination-controls">
          <button onClick={onPrevPage} disabled={!previous} className="pagination-btn pagination-btn-prev">⟨</button>
          <span className="pagination-page">Stran {currentPage}</span>
          <button onClick={onNextPage} disabled={!next} className="pagination-btn pagination-btn-next">⟩</button>
        </div>
      </div>

      <div className="reservables-list">
        {filteredReservables.length === 0 ? (
          <div className="no-results">
            {searchTerm ? (
              <>
                <p>Ni rezultatov za "{searchTerm}"</p>
                <button onClick={clearSearch} className="clear-results-btn">
                  Počisti iskanje
                </button>
              </>
            ) : (
              <p>Ni na voljo nobenih objektov</p>
            )}
          </div>
        ) : (
          <ul className="reservables-ul">
            {filteredReservables.map(reservable => (
              <li 
                key={reservable.id} 
                className={`reservable-item ${selectedReservables.includes(reservable.id) ? 'selected' : ''}`}
                onClick={() => onReservableSelect(reservable.id)}
              >
                <div className="reservable-content">
                  <div className="reservable-info">
                    {selectedReservables.includes(reservable.id) && (
                      <span className="checkmark">✓</span>
                    )}
                    <span className="reservable-name">{selectedType === 'classroom' ? reservable.slug : reservable.name}</span>
                    {reservable.description && (
                      <span className="reservable-description">{reservable.description}</span>
                    )}
                    {reservable.location && (
                      <span className="reservable-location">📍 {reservable.location}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedReservables.length > 0 && (
        <div className="selection-summary">
          <div className="summary-content">
            <span className="summary-text">
              {selectedReservables.length} izbrano
            </span>
            <button 
              onClick={() => {
                selectedReservables.forEach(id => onReservableSelect(id));
              }}
              className="clear-selection-btn"
            >
              Počisti izbor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservableSelector;
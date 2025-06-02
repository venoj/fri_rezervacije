import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/ReservableSelector.css';

function ReservableSelector({ reservables, onReservableSelect, selectedReservables = [], selectedType }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const naturalSort = (a, b) => {
    if (selectedType === 'classroom') {
      const aSlug = a.slug || '';
      const bSlug = b.slug || '';
      return aSlug.localeCompare(bSlug, undefined, { numeric: true, sensitivity: 'base' });
    }
    return (a.name || '').localeCompare(b.name || '');
  };

  const filteredReservables = (Array.isArray(reservables) ? reservables : reservables?.results || [])
    .filter(reservable => !selectedReservables.includes(reservable.id))
    .filter(reservable => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        (reservable.name && reservable.name.toLowerCase().includes(searchTermLower)) ||
        (reservable.slug && reservable.slug.toLowerCase().includes(searchTermLower)) ||
        (reservable.description && reservable.description.toLowerCase().includes(searchTermLower))
      );
    })
    .sort(naturalSort);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="reservable-selector">
      <div className="selector-header">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={t('selector.search')}
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={clearSearch}
                className="clear-search-btn"
                aria-label={t('selector.clearSearch')}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="reservables-list">
        {filteredReservables.length === 0 ? (
          <div className="no-results">
            {searchTerm ? (
              <>
                <p>{t('selector.noResults', { searchTerm })}</p>
                <button onClick={clearSearch} className="clear-results-btn">
                  {t('selector.clearResults')}
                </button>
              </>
            ) : (
              <p>{t('selector.noObjects')}</p>
            )}
          </div>
        ) : (
          <ul className="reservables-ul">
            {filteredReservables.map(reservable => (
              <li 
                key={reservable.id} 
                className="reservable-item"
                onClick={() => onReservableSelect(reservable.id)}
              >
                <div className="reservable-content">
                  <div className="reservable-info">
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
    </div>
  );
}

export default ReservableSelector;
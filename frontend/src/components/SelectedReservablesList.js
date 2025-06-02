import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/ReservableSelector.css';

function SelectedReservablesList({ reservables, onReservableSelect, selectedReservables = [], selectedType }) {
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

  // Get all reservables
  const allReservables = (Array.isArray(reservables) ? reservables : reservables?.results || [])
    .sort(naturalSort);

  // Get selected reservables (always show all selected)
  const selectedReservableObjects = allReservables.filter(r => selectedReservables.includes(r.id));

  // Filter available reservables by search term
  const availableReservableObjects = allReservables
    .filter(r => !selectedReservables.includes(r.id))
    .filter(reservable => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        (reservable.name && reservable.name.toLowerCase().includes(searchTermLower)) ||
        (reservable.slug && reservable.slug.toLowerCase().includes(searchTermLower)) ||
        (reservable.description && reservable.description.toLowerCase().includes(searchTermLower))
      );
    });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="reservable-selector">
      {/* Selected items as tags - always show all selected */}
      {selectedReservableObjects.length > 0 && (
        <div className="selected-tags-container">
          {selectedReservableObjects.map(reservable => (
            <div 
              key={reservable.id} 
              className="selected-tag"
              onClick={() => onReservableSelect(reservable.id)}
            >
              <span className="tag-name">
                {selectedType === 'classroom' ? reservable.slug : reservable.name}
              </span>
              <span className="tag-remove">×</span>
            </div>
          ))}
        </div>
      )}

      {/* Search bar */}
      <div className="selector-header">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={t('selector.searchSelected')}
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Available items list */}
      <div className="reservables-list">
        {availableReservableObjects.length === 0 ? (
          <div className="no-results">
            {searchTerm ? (
              <p>{t('selector.noResults', { searchTerm })}</p>
            ) : (
              <p>{t('selector.noObjects')}</p>
            )}
          </div>
        ) : (
          <ul className="reservables-ul">
            {availableReservableObjects.map(reservable => (
              <li 
                key={reservable.id} 
                className={`reservable-item${selectedReservables.includes(reservable.id) ? ' selected' : ''}`}
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
                  {selectedReservables.includes(reservable.id) && (
                    <span className="checkmark">✓</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SelectedReservablesList; 
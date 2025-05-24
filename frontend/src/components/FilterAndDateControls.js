import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, Database } from 'lucide-react';
import '../styles/FilterAndDateControls.css';

function FilterAndDateControls({
  selectedSet,
  setSelectedSet,
  selectedType,
  setSelectedType,
  selectedDate,
  handleDateChange,
  handlePreviousDay,
  handleNextDay,
  handleToday
}) {
  const typeLabels = {
    classroom: 'Učilnica',
    vehicle: 'Vozilo',
    teacher: 'Učitelj',
    activity: 'Aktivnost',
    equipment: 'Oprema',
    group: 'Skupina',
  };

  const setLabels = {
    rezervacije_fri: 'FRI rezervacije',
    rezervacije_fkkt: 'FKKT rezervacije'
  };

  return (
    <div className="filters">
      <div className="filters-group">
        <div className="filter-item">
          <label htmlFor="set-select">
            <Database size={16} />
            <span>NABOR</span>
          </label>
          <select 
            id="set-select" 
            value={selectedSet} 
            onChange={(e) => setSelectedSet(e.target.value)}
            className="filter-select"
          >
            {Object.entries(setLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="type-select">
            <Filter size={16} />
            <span>TIP</span>
          </label>
          <select 
            id="type-select" 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-item date-selector">
        <button 
          onClick={handlePreviousDay} 
          className="nav-button"
          aria-label="Prejšnji dan"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={handleToday} 
          className="today-button"
          aria-label="Danes"
        >
          <Calendar size={16} />
          <span>Danes</span>
        </button>
        <div className="date-input-wrapper">
          <Calendar size={16} className="date-input-icon" />
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="date-input"
            aria-label="Izberi datum"
          />
        </div>
        <button 
          onClick={handleNextDay} 
          className="nav-button"
          aria-label="Naslednji dan"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default FilterAndDateControls; 
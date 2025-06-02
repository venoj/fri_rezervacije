import { Calendar, ChevronLeft, ChevronRight, Filter, Database } from 'lucide-react';
import '../styles/FilterAndDateControls.css';
import { useTranslation } from 'react-i18next';
import { getTypeLabel, getSetLabel, typeLabels, setLabels } from '../constants/labels';

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
  const { t } = useTranslation();

  return (
    <div className="filters">
      <div className="filters-group">
        <div className="filter-item">
          <label htmlFor="set-select">
            <Database size={16} />
            <span>{t('filters.set')}</span>
          </label>
          <select 
            id="set-select" 
            value={selectedSet} 
            onChange={(e) => setSelectedSet(e.target.value)}
            className="filter-select"
          >
            {Object.keys(setLabels).map((value) => (
              <option key={value} value={value}>{getSetLabel(value)}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="type-select">
            <Filter size={16} />
            <span>{t('filters.type')}</span>
          </label>
          <select 
            id="type-select" 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            {Object.keys(typeLabels).map((value) => (
              <option key={value} value={value}>{getTypeLabel(value)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-item date-selector">
        <button 
          onClick={handlePreviousDay} 
          className="nav-button"
          aria-label={t('filters.previousDay')}
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={handleToday} 
          className="today-button"
          aria-label={t('filters.today')}
        >
          <Calendar size={16} />
          <span>{t('filters.today')}</span>
        </button>
        <div className="date-input-wrapper">
          <Calendar size={16} className="date-input-icon" />
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="date-input"
            aria-label={t('filters.selectDate')}
          />
        </div>
        <button 
          onClick={handleNextDay} 
          className="nav-button"
          aria-label={t('filters.nextDay')}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default FilterAndDateControls; 
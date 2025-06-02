import React, { useState, useEffect } from 'react';
import './App.css';
import ReservableSelector from './components/ReservableSelector';
import { getReservableSets, getReservablesByType } from './services/api';
import TimelineGrid from './components/TimelineGrid';
import './styles/TimelineGrid.css';
import friLogo from './assets/fri-logo.png';
import FilterAndDateControls from './components/FilterAndDateControls';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

function App() {
	const { t } = useTranslation();
	const [selectedSet, setSelectedSet] = useState('rezervacije_fri');
	const [selectedType, setSelectedType] = useState('classroom');
	const [selectedReservables, setSelectedReservables] = useState([]);
	const [sets, setSets] = useState([]);
	const [types, setTypes] = useState(['classroom', 'vehicle', 'teacher', "activity", "equipment", "group"]);
	const [reservables, setReservables] = useState({ results: [], count: 0, next: null, previous: null });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [startDate, setStartDate] = useState(() => {
		// Get date from URL or use today's date
		const params = new URLSearchParams(window.location.search);
		const dateParam = params.get('date');
		const date = dateParam ? new Date(dateParam) : new Date();
		
		// If no date in URL, set it
		if (!dateParam) {
			const newParams = new URLSearchParams(window.location.search);
			newParams.set('date', date.toISOString().split('T')[0]);
			window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
		}
		
		return date;
	});

	// Update URL when date changes
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const currentDate = params.get('date');
		const newDate = startDate.toISOString().split('T')[0];
		
		// Only push new state if the date actually changed
		if (currentDate !== newDate) {
			params.set('date', newDate);
			window.history.pushState({ date: newDate }, '', `${window.location.pathname}?${params.toString()}`);
		}
	}, [startDate]);

	// Handle browser back/forward navigation
	useEffect(() => {
		const handlePopState = (event) => {
			const params = new URLSearchParams(window.location.search);
			const dateParam = params.get('date');
			if (dateParam) {
				setStartDate(new Date(dateParam));
			}
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	useEffect(() => {
		const fetchSets = async () => {
			try {
				const data = await getReservableSets();
				setSets(data.results);
			} catch (error) {
				console.error('Error fetching sets:', error);
				setError('Napaka pri pridobivanju naborov.');
			}
		};

		fetchSets();
	}, []);

	useEffect(() => {
		const fetchReservables = async () => {
			setLoading(true);
			try {
				let allResults = [];
				let currentUrl = null;
				let totalCount = 0;

				const initialData = await getReservablesByType(selectedSet, selectedType);
				allResults = [...initialData.results];
				totalCount = initialData.count;
				currentUrl = initialData.next;

				while (currentUrl) {
					const response = await fetch(currentUrl);
					const data = await response.json();
					allResults = [...allResults, ...data.results];
					currentUrl = data.next;
				}

				setReservables({
					results: allResults,
					count: totalCount,
					next: null,
					previous: null
				});
				setLoading(false);
			} catch (error) {
				console.error('Error fetching reservables:', error);
				setError('Napaka pri pridobivanju objektov.');
				setLoading(false);
			}
		};

		fetchReservables();
	}, [selectedType, selectedSet]);

	const handleReservableChange = (reservableId) => {
		setSelectedReservables(prev => {
			if (prev.includes(reservableId)) {
				return prev.filter(id => id !== reservableId);
			}
			return [...prev, reservableId];
		});
	};

	const handleDateChange = (e) => {
		const newDate = new Date(e.target.value);
		setStartDate(newDate);
	};

	const handlePrevDay = () => {
		const newDate = new Date(startDate);
		newDate.setDate(startDate.getDate() - 1);
		setStartDate(newDate);
	};

	const handleNextDay = () => {
		const newDate = new Date(startDate);
		newDate.setDate(startDate.getDate() + 1);
		setStartDate(newDate);
	};

	const handleToday = () => {
		setStartDate(new Date());
	};

	const getSelectedReservableObjects = () => {
		if (!reservables.results) return [];
		
		if (selectedReservables.length === 0) {
			return reservables.results;
		}
		
		return reservables.results.filter(r => selectedReservables.includes(r.id));
	};

	const currentPage = (() => {
		if (!reservables.results || reservables.results.length === 0) return 1;
		if (!reservables.previous) return 1;
		const prevUrl = new URL(reservables.previous, window.location.origin);
		const prevPage = prevUrl.searchParams.get('page');
		return prevPage ? parseInt(prevPage, 10) + 1 : 2;
	})();

	return (
		<div className="App">
			<header className="App-header modern-header">
				<div className="header-content">
					<img src={friLogo} alt="FRI Logo" className="fri-logo" />
					<h1>{t('common.reservations')}</h1>
					<LanguageSwitcher />
				</div>
			</header>
			<main>
				<FilterAndDateControls
					selectedSet={selectedSet}
					setSelectedSet={setSelectedSet}
					selectedType={selectedType}
					setSelectedType={setSelectedType}
					selectedDate={startDate.toISOString().split('T')[0]}
					handleDateChange={handleDateChange}
					handlePreviousDay={handlePrevDay}
					handleNextDay={handleNextDay}
					handleToday={handleToday}
				/>

				{error && <div className="error">{error}</div>}

				<div className="content">
					<aside className="sidebar">
						{loading ? (
							<p className="loading">{t('common.loading')}</p>
						) : (
							<ReservableSelector 
								reservables={reservables} 
								onReservableSelect={handleReservableChange}
								selectedReservables={selectedReservables}
								selectedType={selectedType}
							/>
						)}
					</aside>

					<div className="main-content">
						<TimelineGrid
							startDate={startDate}
							selectedType={selectedType}
							selectedSet={selectedSet}
							reservables={getSelectedReservableObjects()}
							selectedReservables={selectedReservables}
							reservablesCount={reservables.count}
							currentPage={currentPage}
						/>
					</div>
				</div>
			</main>
		</div>
	);
}

export default App;

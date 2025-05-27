import React, { useState, useEffect } from 'react';
import './App.css';
import ReservableSelector from './components/ReservableSelector';
import { getReservableSets, getReservablesByType } from './services/api';
import TimelineGrid from './components/TimelineGrid';
import './styles/TimelineGrid.css';
import friLogo from './assets/fri-logo.png';
import FilterAndDateControls from './components/FilterAndDateControls';

function App() {
	const [selectedSet, setSelectedSet] = useState('rezervacije_fri');
	const [selectedType, setSelectedType] = useState('classroom');
	const [selectedReservables, setSelectedReservables] = useState([]);
	const [sets, setSets] = useState([]);
	const [types, setTypes] = useState(['classroom', 'vehicle', 'teacher', "activity", "equipment", "group"]);
	const [reservables, setReservables] = useState({ results: [], count: 0, next: null, previous: null });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [startDate, setStartDate] = useState(new Date());
	const [reservablesPageUrl, setReservablesPageUrl] = useState(null);

	const typeLabels = {
		classroom: 'učilnica',
		vehicle: 'vozilo',
		teacher: 'učitelj',
		activity: 'aktivnost',
		equipment: 'oprema',
		group: 'skupina',
	};

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
		setReservablesPageUrl(null);
	}, [selectedType, selectedSet]);

	useEffect(() => {
		const fetchReservables = async () => {
			setLoading(true);
			try {
				let data;
				if (reservablesPageUrl) {
					const response = await fetch(reservablesPageUrl);
					data = await response.json();
				} else {
					data = await getReservablesByType(selectedSet, selectedType);
				}
				setReservables(data);
				setLoading(false);
			} catch (error) {
				console.error('Error fetching reservables:', error);
				setError('Napaka pri pridobivanju objektov.');
				setLoading(false);
			}
		};

		fetchReservables();
	}, [selectedType, selectedSet, reservablesPageUrl]);

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

	const handleReservablesNext = () => {
		if (reservables.next) setReservablesPageUrl(reservables.next);
	};
	const handleReservablesPrev = () => {
		if (reservables.previous) setReservablesPageUrl(reservables.previous);
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
					<h1>Rezervacije</h1>
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
						<h2>Izberite {selectedType}</h2>
						{loading ? (
							<p class="loading">Nalaganje...</p>
						) : (
							<ReservableSelector 
								reservables={reservables} 
								onReservableSelect={handleReservableChange}
								selectedReservables={selectedReservables}
								count={reservables.count}
								next={reservables.next}
								previous={reservables.previous}
								onNextPage={handleReservablesNext}
								onPrevPage={handleReservablesPrev}
								currentPage={currentPage}
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

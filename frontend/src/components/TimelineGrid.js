import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, Info, X } from 'lucide-react';
import { getReservations } from '../services/api';
import '../styles/TimelineGrid.css';

const TimelineGrid = ({ startDate, selectedType, selectedSet, reservables = [], selectedReservables = [] }) => {
	const [reservations, setReservations] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [selectedReservation, setSelectedReservation] = useState(null);
	const [newReservation, setNewReservation] = useState(null);
	const [reservationReason, setReservationReason] = useState('');
	const [firstColWidth, setFirstColWidth] = useState(200);

	const headerRef = useRef(null);
	const cellRefs = useRef([]);

	const HOUR_CELL_WIDTH = 90;

	const generateTimeSlots = () => {
		const slots = [];
		for (let hour = 7; hour <= 22; hour++) {
			slots.push({
				hour,
				displayTime: `${hour.toString().padStart(2, '0')}:00`,
				key: `${hour}:00`
			});
		}
		return slots;
	};

	const timeSlots = generateTimeSlots();

	// Natural sort function for classroom numbers
	const naturalSort = (a, b) => {
		if (selectedType === 'classroom') {
			const aSlug = a.slug || '';
			const bSlug = b.slug || '';
			return aSlug.localeCompare(bSlug, undefined, { numeric: true, sensitivity: 'base' });
		}
		return (a.name || '').localeCompare(b.name || '');
	};

	useEffect(() => {
		const fetchAllReservations = async () => {
			if (!reservables || reservables.length === 0) return;

			setLoading(true);
			setError(null);
			try {
				const reservationPromises = reservables.map(async (reservable) => {
					try {
						const start = new Date(startDate);
						start.setHours(0, 0, 0, 0);
						const end = new Date(startDate);
						end.setHours(23, 59, 59, 999);
						const data = await getReservations(
							start.toISOString(),
							end.toISOString(),
							reservable.id
						);
						return { reservableId: reservable.id, reservations: data.results || [] };
					} catch (error) {
						console.error(`Error fetching reservations for ${reservable.name}:`, error);
						return { reservableId: reservable.id, reservations: [] };
					}
				});
				const results = await Promise.all(reservationPromises);
				const reservationsMap = {};
				results.forEach(({ reservableId, reservations }) => {
					reservationsMap[reservableId] = reservations;
				});
				setReservations(reservationsMap);
			} catch (error) {
				console.error('Error fetching reservations:', error);
				setError('Napaka pri pridobivanju rezervacij.');
			} finally {
				setLoading(false);
			}
		};
		fetchAllReservations();
	}, [reservables, startDate]);

	const formatDate = (date) => {
		return date.toLocaleDateString('sl-SI', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	const formatTime = (timeString) => {
		const date = new Date(timeString);
		return date.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });
	};

	const handleReservationClick = (reservation) => {
		setSelectedReservation(reservation);
	};

	const handleEmptyCellClick = (reservable, hour) => {
		const start = new Date(startDate);
		start.setHours(hour, 0, 0, 0);
		const end = new Date(startDate);
		end.setHours(hour + 1, 0, 0, 0);
		setNewReservation({
			reservable,
			start,
			end
		});
		setReservationReason('');
	};

	const handleEndTimeChange = (e) => {
		const [hours] = e.target.value.split(':').map(Number);
		const newEnd = new Date(newReservation.start);
		newEnd.setHours(hours, 0, 0, 0);
		
		// Ensure end time is after start time
		if (newEnd > newReservation.start) {
			setNewReservation(prev => ({
				...prev,
				end: newEnd
			}));
		}
	};

	const handleCloseModal = () => {
		setSelectedReservation(null);
		setNewReservation(null);
		setReservationReason('');
	};

	if (loading) {
		return (
			<div className="timeline-grid-loading-state">
				<div className="timeline-grid-spinner" aria-label="Nalaganje">
					<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="24" cy="24" r="20" stroke="#e63946" strokeWidth="4" strokeDasharray="100" strokeDashoffset="60" strokeLinecap="round"/>
					</svg>
				</div>
				<div className="timeline-grid-loading-text">Nalaganje rezervacij ...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="timeline-grid-error-state">
				<div className="timeline-grid-error-title">Prišlo je do napake</div>
				<div className="timeline-grid-error-message">{error}</div>
				<button className="timeline-grid-retry-btn" onClick={() => window.location.reload()}>Poskusi znova</button>
			</div>
		);
	}

	if (!reservables || reservables.length === 0) {
		return (
			<div className="timeline-grid-empty-state">
				<div className="timeline-grid-empty-title">Na voljo ni nobenih objektov</div>
			</div>
		);
	}

	return (
		<div className="timeline-grid-container">
			<div className="timeline-header">
				<div className="timeline-header-title">
					<h2 className="timeline-header-text">
						Pregled rezervacij za {formatDate(startDate)}
					</h2>
				</div>
			</div>

			<div className="timeline-table-wrapper">
				<table className="timeline-table">
					<colgroup>
						<col style={{ width: `${firstColWidth}px` }} />
						{timeSlots.map((_, idx) => (
							<col key={idx} style={{ width: `${HOUR_CELL_WIDTH}px` }} />
						))}
					</colgroup>
					<thead>
						<tr>
							<th className="timeline-th-corner">
								<span className="timeline-th-corner-text">{selectedType}</span>
							</th>
							{timeSlots.map(slot => (
								<th key={slot.key} className="timeline-th-hour">
									<span>{slot.displayTime}</span>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{[...reservables].sort(naturalSort).map((reservable, rowIdx) => {
							const reservableReservations = reservations[reservable.id] || [];
							const sortedReservations = [...reservableReservations].sort((a, b) => new Date(a.start) - new Date(b.start));

							let tds = [];
							let i = 0;
							while (i < timeSlots.length) {
								const slotHour = timeSlots[i].hour;
								const reservation = sortedReservations.find(r => {
									const start = new Date(r.start);
									return start.getHours() === slotHour && start.getMinutes() === 0;
								});

								if (reservation) {
									const start = new Date(reservation.start);
									const end = new Date(reservation.end);
									let coveredSlots = 0;
									let slotTime = new Date(start);
									while (i + coveredSlots < timeSlots.length && slotTime < end) {
										slotTime.setHours(timeSlots[i + coveredSlots].hour + 1, 0, 0, 0);
										coveredSlots++;
									}
									tds.push(
										<td
											key={`${reservable.id}-${reservation.id}`}
											className={`timeline-cell timeline-cell-reserved${selectedReservables.includes(reservable.id) ? ' selected' : ''}`}
											colSpan={coveredSlots}
											style={{ 
												padding: 0, 
												backgroundColor: 'rgba(230, 57, 70, 0.2)', // Light red color
											}}
											onClick={() => handleReservationClick(reservation)}
										/>
									);
									i += coveredSlots;
								} else {
									tds.push(
										<td
											key={`${reservable.id}-${slotHour}`}
											className={`timeline-cell timeline-cell-available${selectedReservables.includes(reservable.id) ? ' selected' : ''}`}
											style={{ padding: 0 }}
											onClick={() => handleEmptyCellClick(reservable, slotHour)}
										></td>
									);
									i++;
								}
							}

							return (
								<tr key={reservable.id} className={`timeline-row${selectedReservables.includes(reservable.id) ? ' selected' : ''}`}>
									<td
										className="timeline-cell timeline-cell-reservable"
										ref={el => (cellRefs.current[rowIdx] = el)}
										style={{ width: `${firstColWidth}px` }}
									>
										<div className="reservable-info">
											<span className="reservable-name">{selectedType === 'classroom' ? reservable.slug : reservable.name}</span>
											{reservable.description && (
												<span className="reservable-description">{reservable.description}</span>
											)}
										</div>
									</td>
									{tds}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{selectedReservation && (
				<div className="modal-overlay" onClick={handleCloseModal}>
					<div className="modal-content" onClick={e => e.stopPropagation()}>
						<button className="modal-close" onClick={handleCloseModal} aria-label="Zapri podrobnosti">
							<X className="modal-close-icon" />
						</button>
						<h2 className="modal-title">
							<Info className="modal-title-icon" /> Podrobnosti rezervacije
						</h2>
						<div className="modal-details-grid">
							<div className="modal-detail-row">
								<span className="modal-detail-label">Naziv:</span>
								<span className="modal-detail-value">{selectedReservation.reason || 'Rezervacija'}</span>
							</div>
							<div className="modal-detail-row">
								<span className="modal-detail-label">Čas:</span>
								<span className="modal-detail-value">{formatTime(selectedReservation.start)} - {formatTime(selectedReservation.end)}</span>
							</div>
							<div className="modal-detail-row">
								<span className="modal-detail-label">Datum:</span>
								<span className="modal-detail-value">{formatDate(new Date(selectedReservation.start))}</span>
							</div>
							{selectedReservation.created_by && (
								<div className="modal-detail-row">
									<span className="modal-detail-label">Rezerviral:</span>
									<span className="modal-detail-value">{selectedReservation.created_by}</span>
								</div>
							)}
							{selectedReservation.owners && selectedReservation.owners.length > 0 && (
								<div className="modal-detail-row">
									<span className="modal-detail-label">Lastniki:</span>
									<span className="modal-detail-value">{selectedReservation.owners.join(', ')}</span>
								</div>
							)}
							{selectedReservation.requirements && selectedReservation.requirements.length > 0 && (
								<div className="modal-detail-row">
									<span className="modal-detail-label">Zahteve:</span>
									<span className="modal-detail-value">{selectedReservation.requirements.join(', ')}</span>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{newReservation && (
				<div className="modal-overlay" onClick={handleCloseModal}>
					<div className="modal-content" onClick={e => e.stopPropagation()}>
						<button className="modal-close" onClick={handleCloseModal} aria-label="Zapri">
							<X className="modal-close-icon" />
						</button>
						<h2 className="modal-title">
							<Info className="modal-title-icon" /> Nova rezervacija
						</h2>
						<div className="modal-details-grid">
							<div className="modal-detail-row">
								<span className="modal-detail-label">Objekt:</span>
								<span className="modal-detail-value">
									{selectedType === 'classroom' ? newReservation.reservable.slug : newReservation.reservable.name}
								</span>
							</div>
							<div className="modal-detail-row">
								<span className="modal-detail-label">Začetek:</span>
								<span className="modal-detail-value">
									{formatTime(newReservation.start)}
								</span>
							</div>
							<div className="modal-detail-row">
								<span className="modal-detail-label">Konec:</span>
								<select
									value={newReservation.end.getHours()}
									onChange={(e) => {
										const hours = parseInt(e.target.value);
										const newEnd = new Date(newReservation.start);
										newEnd.setHours(hours, 0, 0, 0);
										
										if (newEnd > newReservation.start) {
											setNewReservation(prev => ({
												...prev,
												end: newEnd
											}));
										}
									}}
									className="time-select"
								>
									{Array.from({ length: 24 }, (_, i) => i).map(hour => (
										<option 
											key={hour} 
											value={hour}
											disabled={hour <= newReservation.start.getHours()}
										>
											{hour.toString().padStart(2, '0')}:00
										</option>
									))}
								</select>
							</div>
							<div className="modal-detail-row">
								<span className="modal-detail-label">Datum:</span>
								<span className="modal-detail-value">{formatDate(newReservation.start)}</span>
							</div>
							<div className="modal-detail-row full-width">
								<span className="modal-detail-label">Razlog:</span>
								<input
									type="text"
									value={reservationReason}
									onChange={(e) => setReservationReason(e.target.value)}
									placeholder="Vnesite razlog za rezervacijo"
									className="reason-input"
								/>
							</div>
							<div className="modal-actions">
								<button 
									className="modal-button primary" 
									onClick={() => {
										// TODO: Implement reservation creation
										handleCloseModal();
									}}
									disabled={!reservationReason.trim()}
								>
									Ustvari rezervacijo
								</button>
								<button className="modal-button secondary" onClick={handleCloseModal}>
									Prekliči
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default TimelineGrid;
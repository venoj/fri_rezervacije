import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, Info, X } from 'lucide-react';
import { getReservations } from '../services/api';
import '../styles/TimelineGrid.css';

const TimelineGrid = ({ startDate, selectedType, selectedSet, reservables = [], selectedReservables = [] }) => {
	const [reservations, setReservations] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [selectedReservation, setSelectedReservation] = useState(null);
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

	const handleCloseModal = () => {
		setSelectedReservation(null);
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
						{reservables.map((reservable, rowIdx) => {
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
											style={{ padding: 0, whiteSpace: 'normal' }}
											onClick={() => handleReservationClick(reservation)}
										>
											<div className="reservation-block">
												<div className="reservation-title">{reservation.reason || 'Rezervacija'}</div>
												{reservation.created_by && (
													<div className="reservation-meta">
														<User className="reservation-meta-icon" />
														<span>{reservation.created_by}</span>
													</div>
												)}
												<div className="reservation-meta">
													<span>{formatTime(reservation.start)} - {formatTime(reservation.end)}</span>
												</div>
											</div>
										</td>
									);
									i += coveredSlots;
								} else {
									tds.push(
										<td
											key={`${reservable.id}-${slotHour}`}
											className={`timeline-cell timeline-cell-available${selectedReservables.includes(reservable.id) ? ' selected' : ''}`}
											style={{ padding: 0 }}
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
		</div>
	);
};

export default TimelineGrid;
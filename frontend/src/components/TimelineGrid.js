import React, { useState, useEffect, useRef } from 'react';
import { Info, X, Table, Trash2 } from 'lucide-react';
import { getBulkReservations, getReservableDetails, getClassroomResources, deleteReservation } from '../services/api';
import { useTranslation } from 'react-i18next';
import ReservableSelector from './ReservableSelector';
import '../styles/TimelineGrid.css';

// Cache for classroom resources
let cachedClassroomResources = null;

// Cache for reservations
const reservationsCache = new Map();

const TimelineGrid = ({ startDate, selectedType, selectedSet, reservables = [], selectedReservables = [] }) => {
	const { t } = useTranslation();
	const [reservations, setReservations] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [selectedReservation, setSelectedReservation] = useState(null);
	const [newReservation, setNewReservation] = useState(null);
	const [reservationReason, setReservationReason] = useState('');
	const [selectedReservableDetails, setSelectedReservableDetails] = useState(null);
	const [classroomResources, setClassroomResources] = useState(cachedClassroomResources);
	const [showResourcesTable, setShowResourcesTable] = useState(false);
	const [firstColWidth, setFirstColWidth] = useState(200);
	const [loadingResources, setLoadingResources] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deleteError, setDeleteError] = useState(null);
	const [selectedReservablesForNew, setSelectedReservablesForNew] = useState([]);
	const [backgroundLoading, setBackgroundLoading] = useState(false);

	const headerRef = useRef(null);
	const cellRefs = useRef([]);

	const HOUR_CELL_WIDTH = 60;

	// Helper function to get cache key for a date
	const getCacheKey = (date) => {
		return date.toISOString().split('T')[0];
	};

	// Helper function to check if a date is cached
	const isDateCached = (date) => {
		return reservationsCache.has(getCacheKey(date));
	};

	// Helper function to get cached data for a date
	const getCachedData = (date) => {
		return reservationsCache.get(getCacheKey(date));
	};

	// Helper function to set cached data for a date
	const setCachedData = (date, data) => {
		reservationsCache.set(getCacheKey(date), data);
	};

	const fetchReservationsForDate = async (date, isBackground = false) => {
		if (!reservables || !Array.isArray(reservables) || reservables.length === 0) {
			return;
		}

		const validReservables = reservables.filter(r => r && r.id);
		if (validReservables.length === 0) {
			return;
		}

		const cacheKey = getCacheKey(date);
		if (reservationsCache.has(cacheKey)) {
			if (!isBackground) {
				setReservations(reservationsCache.get(cacheKey));
			}
			return;
		}

		if (!isBackground) {
			setLoading(true);
		}
		setError(null);

		try {
			const start = new Date(date);
			start.setHours(0, 0, 0, 0);
			const end = new Date(date);
			end.setHours(23, 59, 59, 999);

			const data = await getBulkReservations(
				start.toISOString(),
				end.toISOString(),
				validReservables.map(r => r.id)
			);

			// Convert the response format to match the expected format
			const formattedData = {};
			Object.entries(data).forEach(([reservableId, reservations]) => {
				formattedData[reservableId] = reservations;
			});

			// Cache the data
			setCachedData(date, formattedData);

			// Only update state if this is not a background load
			if (!isBackground) {
				setReservations(formattedData);
			}
		} catch (error) {
			console.error(`Error fetching reservations${isBackground ? ' in background' : ''}:`, error);
			if (!isBackground) {
				setError(t('timeline.errorMessage'));
			}
		} finally {
			if (!isBackground) {
				setLoading(false);
			}
		}
	};

	// Load current day's reservations
	useEffect(() => {
		fetchReservationsForDate(startDate);
	}, [startDate, reservables, t]);

	// Background load surrounding days
	useEffect(() => {
		if (loading) return; // Don't start background loading until current day is loaded

		const preloadDays = [-2, -1, 1, 2];
		setBackgroundLoading(true);

		// Load each surrounding day in sequence
		const loadSurroundingDays = async () => {
			for (const dayOffset of preloadDays) {
				const preloadDate = new Date(startDate);
				preloadDate.setDate(startDate.getDate() + dayOffset);
				
				// Skip if already cached
				if (isDateCached(preloadDate)) continue;

				await fetchReservationsForDate(preloadDate, true);
			}
			setBackgroundLoading(false);
		};

		loadSurroundingDays();
	}, [startDate, loading, reservables, t]);

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
		setDeleteError(null);
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
		setSelectedReservablesForNew([reservable.id]);
		setReservationReason('');
	};

	const handleReservableSelect = (reservableId) => {
		setSelectedReservablesForNew(prev => {
			if (prev.includes(reservableId)) {
				return prev.filter(id => id !== reservableId);
			} else {
				return [...prev, reservableId];
			}
		});
	};

	const handleRemoveReservable = (reservableId) => {
		setSelectedReservablesForNew(prev => prev.filter(id => id !== reservableId));
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

	const handleReservableClick = async (reservable) => {
		try {
			const details = await getReservableDetails(reservable.id);
			setSelectedReservableDetails(details);
		} catch (error) {
			console.error('Error fetching reservable details:', error);
		}
	};

	const handleCloseModal = () => {
		setSelectedReservation(null);
		setNewReservation(null);
		setReservationReason('');
		setSelectedReservableDetails(null);
		setDeleteError(null);
	};

	const handleShowResourcesTable = async () => {
		setShowResourcesTable(true);
		setLoadingResources(true);
		
		// If we already have cached data, use it
		if (cachedClassroomResources) {
			setClassroomResources(cachedClassroomResources);
			setLoadingResources(false);
			return;
		}

		try {
			const data = await getClassroomResources();
			// Cache the result
			cachedClassroomResources = data;
			setClassroomResources(data);
		} catch (error) {
			console.error('Error fetching classroom resources:', error);
		} finally {
			setLoadingResources(false);
		}
	};

	const handleCloseResourcesTable = () => {
		setShowResourcesTable(false);
		setClassroomResources(null);
	};

	const handleDeleteReservation = async () => {
		if (!selectedReservation || !window.confirm(t('timeline.deleteConfirm'))) {
			return;
		}

		setDeleteLoading(true);
		setDeleteError(null);

		try {
			await deleteReservation(selectedReservation.id);
			// Refresh the reservations list
			await fetchReservationsForDate(new Date(startDate));
			// Close the modal
			handleCloseModal();
			// Show success message
			alert(t('timeline.deleteSuccess'));
		} catch (error) {
			console.error('Error deleting reservation:', error);
			setDeleteError(t('timeline.deleteError'));
		} finally {
			setDeleteLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="timeline-grid-loading-state">
				<div className="timeline-grid-spinner" aria-label={t('common.loading')}>
					<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="24" cy="24" r="20" stroke="#e63946" strokeWidth="4" strokeDasharray="100" strokeDashoffset="60" strokeLinecap="round"/>
					</svg>
				</div>
				<div className="timeline-grid-loading-text">{t('timeline.loading')}</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="timeline-grid-error-state">
				<div className="timeline-grid-error-title">{t('timeline.error')}</div>
				<div className="timeline-grid-error-message">{error}</div>
				<button className="timeline-grid-retry-btn" onClick={() => window.location.reload()}>{t('common.retry')}</button>
			</div>
		);
	}

	if (!reservables || reservables.length === 0) {
		return (
			<div className="timeline-grid-empty-state">
				<div className="timeline-grid-empty-title">{t('timeline.noObjects')}</div>
			</div>
		);
	}

	return (
		<div className="timeline-grid-container">
			<div className="timeline-header">
				<div className="timeline-header-title">
					<h2 className="timeline-header-text">
						{t('timeline.reservationsFor')} {formatDate(startDate)}
					</h2>
				</div>
				{selectedType === 'classroom' && (
					<button 
						className="resources-table-button"
						onClick={handleShowResourcesTable}
					>
						<Table className="button-icon" />
						{t('timeline.classroomProperties')}
					</button>
				)}
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
										<div 
											className="reservable-info"
											onClick={() => handleReservableClick(reservable)}
											style={{ cursor: 'pointer' }}
										>
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
						<button className="modal-close" onClick={handleCloseModal} aria-label={t('common.close')}>
							<X className="modal-close-icon" />
						</button>
						<h2 className="modal-title">
							<Info className="modal-title-icon" /> {t('timeline.reservationDetails')}
						</h2>
						<div className="modal-details-grid">
							<div className="modal-detail-row">
								<span className="modal-detail-label">{t('timeline.title')}:</span>
								<span className="modal-detail-value">{selectedReservation.reason || t('common.reservations')}</span>
							</div>
							<div className="modal-detail-row">
								<span className="modal-detail-label">{t('timeline.startTime')}:</span>
								<span className="modal-detail-value">{formatTime(selectedReservation.start)}</span>
							</div>
							<div className="modal-detail-row">
								<span className="modal-detail-label">{t('timeline.endTime')}:</span>
								<span className="modal-detail-value">{formatTime(selectedReservation.end)}</span>
							</div>
							<div className="modal-detail-row">
								<span className="modal-detail-label">{t('common.date')}:</span>
								<span className="modal-detail-value">{formatDate(new Date(selectedReservation.start))}</span>
							</div>
							{selectedReservation.created_by && (
								<div className="modal-detail-row">
									<span className="modal-detail-label">{t('timeline.reservedBy')}:</span>
									<span className="modal-detail-value">{selectedReservation.created_by}</span>
								</div>
							)}
							{selectedReservation.owners && selectedReservation.owners.length > 0 && (
								<div className="modal-detail-row">
									<span className="modal-detail-label">{t('timeline.owners')}:</span>
									<span className="modal-detail-value">{selectedReservation.owners.join(', ')}</span>
								</div>
							)}
							{selectedReservation.requirements && selectedReservation.requirements.length > 0 && (
								<div className="modal-detail-row">
									<span className="modal-detail-label">{t('timeline.requirements')}:</span>
									<span className="modal-detail-value">{selectedReservation.requirements.join(', ')}</span>
								</div>
							)}
							{deleteError && (
								<div className="modal-error-message">
									{deleteError}
								</div>
							)}
							<div className="modal-actions">
								<button 
									className="modal-button delete" 
									onClick={handleDeleteReservation}
									disabled={deleteLoading}
								>
									{t('timeline.deleteReservation')}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{newReservation && (
				<div className="modal-overlay" onClick={handleCloseModal}>
					<div className="modal-content" onClick={e => e.stopPropagation()}>
						<button className="modal-close" onClick={handleCloseModal} aria-label={t('common.close')}>
							<X className="modal-close-icon" />
						</button>
						<h2 className="modal-title">
							<Info className="modal-title-icon" /> {t('timeline.newReservation')}
						</h2>
						<div className="modal-details-grid">
							<div className="modal-detail-row full-width">
								<span className="modal-detail-label">{t('timeline.selectObjects')}:</span>
								<div className="selected-reservables">
									{selectedReservablesForNew.map(id => {
										const reservable = reservables.find(r => r.id === id);
										return reservable ? (
											<div key={id} className="selected-reservable-tag">
												<span>{selectedType === 'classroom' ? reservable.slug : reservable.name}</span>
												<button 
													className="remove-reservable-btn"
													onClick={() => handleRemoveReservable(id)}
													aria-label={t('common.remove')}
												>
													<X size={14} />
												</button>
											</div>
										) : null;
									})}
								</div>
								<div className="reservable-selector-container">
									<ReservableSelector
										reservables={reservables}
										onReservableSelect={handleReservableSelect}
										selectedReservables={selectedReservablesForNew}
										selectedType={selectedType}
									/>
								</div>
							</div>
							<div className="modal-detail-row">
								<span className="modal-detail-label">{t('timeline.startTime')}:</span>
								<div className="time-input-group">
									<input
										type="number"
										min="0"
										max="23"
										value={newReservation.start.getHours()}
										onChange={(e) => {
											const hours = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
											const newStart = new Date(newReservation.start);
											newStart.setHours(hours);
											setNewReservation(prev => ({
												...prev,
												start: newStart
											}));
										}}
										className="time-input"
									/>
									<span className="time-separator">:</span>
									<input
										type="number"
										min="0"
										max="55"
										step="5"
										value={newReservation.start.getMinutes()}
										onChange={(e) => {
											const minutes = Math.min(55, Math.max(0, parseInt(e.target.value) || 0));
											const newStart = new Date(newReservation.start);
											newStart.setMinutes(minutes);
											setNewReservation(prev => ({
												...prev,
												start: newStart
											}));
										}}
										className="time-input"
									/>
								</div>
							</div>
							<div className="modal-detail-row">
								<span className="modal-detail-label">{t('timeline.endTime')}:</span>
								<div className="time-input-group">
									<input
										type="number"
										min="7"
										max="23"
										value={newReservation.end.getHours()}
										onChange={(e) => {
											const hours = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
											const newEnd = new Date(newReservation.end);
											newEnd.setHours(hours);
											if (newEnd > newReservation.start) {
												setNewReservation(prev => ({
													...prev,
													end: newEnd
												}));
											}
										}}
										className="time-input"
										disabled={newReservation.start.getHours() >= 23}
									/>
									<span className="time-separator">:</span>
									<input
										type="number"
										min="0"
										max="55"
										step="5"
										value={newReservation.end.getMinutes()}
										onChange={(e) => {
											const minutes = Math.min(55, Math.max(0, parseInt(e.target.value) || 0));
											const newEnd = new Date(newReservation.end);
											newEnd.setMinutes(minutes);
											if (newEnd > newReservation.start) {
												setNewReservation(prev => ({
													...prev,
													end: newEnd
												}));
											}
										}}
										className="time-input"
										disabled={newReservation.start.getHours() === newReservation.end.getHours() && newReservation.start.getMinutes() >= 55}
									/>
								</div>
							</div>
							<div className="modal-detail-row">
								<span className="modal-detail-label">{t('common.date')}:</span>
								<span className="modal-detail-value">{formatDate(newReservation.start)}</span>
							</div>
							<div className="modal-detail-row full-width">
								<span className="modal-detail-label">{t('common.reason')}:</span>
								<input
									type="text"
									value={reservationReason}
									onChange={(e) => setReservationReason(e.target.value)}
									placeholder={t('timeline.enterReason')}
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
									{t('timeline.createReservation')}
								</button>
								<button className="modal-button secondary" onClick={handleCloseModal}>
									{t('common.cancel')}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{selectedReservableDetails && (
				<div className="modal-overlay" onClick={handleCloseModal}>
					<div className="modal-content" onClick={e => e.stopPropagation()}>
						<button className="modal-close" onClick={handleCloseModal} aria-label={t('common.close')}>
							<X className="modal-close-icon" />
						</button>
						<h2 className="modal-title">
							<Info className="modal-title-icon" /> {t('timeline.classroomDetails')}
						</h2>
						<div className="modal-details-grid">
							<div className="modal-detail-row">
								<span className="modal-detail-label">{t('timeline.name')}:</span>
								<span className="modal-detail-value">
									{selectedReservableDetails.name}
								</span>
							</div>
							{selectedReservableDetails.nresources_set && selectedReservableDetails.nresources_set.length > 0 && (
								<>
									{selectedReservableDetails.nresources_set.map((resource, index) => (
										<div key={index} className="modal-detail-row">
											<span className="modal-detail-label">{resource.resource.name}:</span>
											<span className="modal-detail-value">{resource.n}</span>
										</div>
									))}
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{showResourcesTable && (
				<div className="modal-overlay" onClick={handleCloseResourcesTable}>
					<div className="modal-content resources-table-modal" onClick={e => e.stopPropagation()}>
						<button className="modal-close" onClick={handleCloseResourcesTable} aria-label={t('common.close')}>
							<X className="modal-close-icon" />
						</button>
						<h2 className="modal-title">
							<Table className="modal-title-icon" /> {t('timeline.classroomProperties')}
						</h2>
						<div className="resources-table-container">
							{loadingResources ? (
								<div className="resources-loading-state">
									<div className="resources-spinner" aria-label={t('common.loading')}>
										<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
											<circle cx="24" cy="24" r="20" stroke="#e63946" strokeWidth="4" strokeDasharray="100" strokeDashoffset="60" strokeLinecap="round"/>
										</svg>
									</div>
									<div className="resources-loading-text">{t('timeline.loading')}</div>
								</div>
							) : !classroomResources ? (
								<div className="resources-error-state">
									<div className="resources-error-text">{t('timeline.errorMessage')}</div>
								</div>
							) : classroomResources.reservable_table.length === 0 ? (
								<div className="resources-empty-state">
									<div className="resources-empty-text">{t('timeline.noObjects')}</div>
								</div>
							) : (
								<table className="resources-table">
									<thead>
										<tr>
											<th>{t('timeline.name')}</th>
											{classroomResources.resources.map(resource => (
												<th key={resource.id}>{resource.name}</th>
											))}
										</tr>
									</thead>
									<tbody>
										{classroomResources.reservable_table.map(([classroom, resources]) => (
											<tr key={classroom.id}>
												<td className="classroom-name">{classroom.name}</td>
												{resources.map((value, index) => (
													<td key={index} className={value > 0 ? 'has-resource' : ''}>
														{value > 0 ? value : ''}
													</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default TimelineGrid;
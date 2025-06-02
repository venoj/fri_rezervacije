  <div className="reservable-selection">
    <h3>{t('createReservation.selectReservables')}</h3>
    <SelectedReservablesList
      reservables={reservables}
      onReservableSelect={handleReservableSelect}
      selectedReservables={selectedReservables}
      selectedType={selectedType}
    />
  </div> 
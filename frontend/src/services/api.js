const API_BASE_URL = '/api';

export const getReservations = async (start, end, reservableId) => {
  try {
    const queryParams = new URLSearchParams({
      start,
      end,
      reservables: reservableId
    });

    const response = await fetch(
      `${API_BASE_URL}/reservations/?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
};

export const getBulkReservations = async (start, end, reservableIds) => {
  try {
    // Validate input parameters
    if (!start || !end) {
      throw new Error('Missing required parameters: start or end');
    }
    
    if (!reservableIds || !Array.isArray(reservableIds) || reservableIds.length === 0) {
      throw new Error('Missing or invalid reservableIds parameter');
    }

    const queryParams = new URLSearchParams();
    queryParams.append('start', start);
    queryParams.append('end', end);
    // Add each reservable ID as a separate parameter
    reservableIds.forEach(id => {
      if (id) {  // Only add non-null/undefined IDs
        queryParams.append('reservable_ids[]', id);
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/reservations/bulk/?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bulk reservations:', error);
    throw error;
  }
};

export const getReservablesByType = async (setName, typeName) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sets/${setName}/types/${typeName}/reservables/`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching reservables by type:', error);
    throw error;
  }
};

export const getReservableSets = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/sets/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching reservable sets:', error);
    throw error;
  }
};

export const getReservableDetails = async (reservableId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reservables/${reservableId}/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching reservable details:', error);
    throw error;
  }
};

export const getClassroomResources = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/classroom-resources/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching classroom resources:', error);
    throw error;
  }
};

export const deleteReservation = async (reservationId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/reservations/${reservationId}/`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
};
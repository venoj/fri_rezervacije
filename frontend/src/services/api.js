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
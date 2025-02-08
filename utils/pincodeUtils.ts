interface Location {
  district: string;
  state: string;
}

export const fetchLocationFromPincode = async (pincode: string): Promise<Location> => {
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();
    
    if (data[0].Status === 'Success') {
      const postOffice = data[0].PostOffice[0];
      return {
        district: postOffice.District,
        state: postOffice.State
      };
    }
    throw new Error('Invalid pincode');
  } catch (error) {
    throw new Error('Failed to fetch location');
  }
}; 
interface Location {
  district: string;
  state: string;
}

interface PincodeData {
  District: string;
  State: string;
  Country: string;
}

export const fetchLocationFromPincode = async (
  pincode: string
): Promise<Location> => {
  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`
    );
    const data = await response.json();

    if (data[0].Status === "Success") {
      const postOffice = data[0].PostOffice[0];
      return {
        district: postOffice.District,
        state: postOffice.State,
      };
    }
    throw new Error("Invalid pincode");
  } catch (error) {
    throw new Error("Failed to fetch location");
  }
};

export const getPincodeDetails = async (
  pincode: string
): Promise<PincodeData | null> => {
  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`
    );
    const data = await response.json();

    if (data[0].Status === "Success") {
      const postOffice = data[0].PostOffice[0];
      return {
        District: postOffice.District,
        State: postOffice.State,
        Country: postOffice.Country,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching pincode details:", error);
    return null;
  }
};

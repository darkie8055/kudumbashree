interface PincodeData {
  district: string;
  range: [number, number];
}

// Kerala pincode ranges by district
const KERALA_PINCODES: PincodeData[] = [
  { district: "Alappuzha", range: [688001, 690559] },
  { district: "Ernakulam", range: [682001, 683599] },
  { district: "Idukki", range: [685501, 685619] },
  { district: "Kannur", range: [670001, 670699] },
  { district: "Kasaragod", range: [671121, 671359] },
  { district: "Kollam", range: [690101, 691579] },
  { district: "Kottayam", range: [686001, 686599] },
  { district: "Kozhikode", range: [673001, 673699] },
  { district: "Malappuram", range: [676301, 676319] },
  { district: "Palakkad", range: [678001, 678721] },
  { district: "Pathanamthitta", range: [689101, 689699] },
  { district: "Thiruvananthapuram", range: [695001, 695615] },
  { district: "Thrissur", range: [680001, 680721] },
  { district: "Wayanad", range: [673571, 673599] },
];

export const getDistrictFromPincode = (pincode: string): string | null => {
  const numericPincode = parseInt(pincode, 10);
  
  if (isNaN(numericPincode) || pincode.length !== 6) {
    return null;
  }

  const district = KERALA_PINCODES.find(
    ({ range }) => numericPincode >= range[0] && numericPincode <= range[1]
  );

  return district?.district || null;
};

export const isKeralaPincode = (pincode: string): boolean => {
  return getDistrictFromPincode(pincode) !== null;
};
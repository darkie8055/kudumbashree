import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import {
  getDistrictFromPincode,
  isKeralaPincode,
} from "../utils/keralaPincodes";

interface LocationInputProps {
  onLocationChange: (data: {
    pincode: string;
    district: string | null;
  }) => void;
  initialPincode?: string;
  error?: string;
}

export const LocationInput = ({
  onLocationChange,
  initialPincode = "",
  error,
}: LocationInputProps) => {
  const [pincode, setPincode] = useState(initialPincode);
  const [district, setDistrict] = useState<string | null>(
    initialPincode ? getDistrictFromPincode(initialPincode) : null
  );

  const handlePincodeChange = (text: string) => {
    setPincode(text);

    if (text.length === 6) {
      if (!isKeralaPincode(text)) {
        onLocationChange({ pincode: text, district: null });
        setDistrict(null);
      } else {
        const district = getDistrictFromPincode(text);
        setDistrict(district);
        onLocationChange({ pincode: text, district });
      }
    } else {
      setDistrict(null);
      onLocationChange({ pincode: text, district: null });
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholder="Enter Kerala PIN code"
        value={pincode}
        onChangeText={handlePincodeChange}
        keyboardType="numeric"
        maxLength={6}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : district ? (
        <Text style={styles.districtText}>District: {district}</Text>
      ) : pincode.length === 6 ? (
        <Text style={styles.errorText}>
          Please enter a valid Kerala PIN code
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  districtText: {
    marginTop: 8,
    fontSize: 14,
    color: "#22C55E",
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: "#ef4444",
  },
});

export default LocationInput;

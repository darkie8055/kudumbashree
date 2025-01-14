import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const App = () => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSignIn = () => {
    // Handle sign-in logic here
    console.log('Phone number:', phoneNumber);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileIcon}>
        {/* Profile icon */}
      </View>
      <Text style={styles.title}>Sign In / Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />
      <Button title="SIGN IN" onPress={handleSignIn} style={styles.button} />
      <Text style={styles.message}>Not a user? Register</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
  },
  button: {
    width: '80%',
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  message: {
    marginTop: 20,
  },
});

export default App;

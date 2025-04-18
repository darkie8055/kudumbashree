import type React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"

interface Props {
  goBack: () => void
}
// DO NOT STUDY THIS SCREEN!!!!!! NOT USED!!!
const TodaysStoryScreen: React.FC<Props> = ({ goBack }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Story</Text>
      <TouchableOpacity onPress={goBack} style={styles.button}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
})

export default TodaysStoryScreen


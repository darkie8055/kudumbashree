"use client"

import { useState } from "react"
import { View, TouchableOpacity, Text, Linking, StyleSheet, Animated } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const CUSTOMER_SERVICE_NUMBER = "+918891115593"
const WHATSAPP_NUMBER = "+918891115593" // You can change this if it's different

/*************  ✨ Codeium Command ⭐  *************/
/**
 * A floating button that can be used to display a menu with three options: to talk to an agent, call customer service, and open WhatsApp.
 *
 * @returns A React component that displays a floating button and a menu with three options.
 */

/******  80f48484-2e60-484a-8456-4c2f94d6b095  *******/
const FloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const animation = useState(new Animated.Value(0))[0]

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1
    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start()
    setIsOpen(!isOpen)
  }

  const rotation = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "45deg"],
        }),
      },
    ],
  }

  const callCustomerService = () => {
    Linking.openURL(`tel:${CUSTOMER_SERVICE_NUMBER}`)
  }

  const openWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=${WHATSAPP_NUMBER}`)
  }

  const talkWithAgent = () => {
    // Implement your bot system here
    // For now, we'll just show an alert
    alert("Connecting you with an agent...")
  }

  const buttonScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleMenu} style={styles.button}>
        <LinearGradient
          colors={["#8B5CF6", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Animated.View style={rotation}>
            <Ionicons name="add" size={24} color="white" />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.menu}>
          <Animated.View style={[styles.menuItem, { transform: [{ scale: buttonScale }] }]}>
            <TouchableOpacity onPress={talkWithAgent} style={styles.menuButton}>
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuGradient}
              >
                <Ionicons name="chatbubbles-outline" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.menuText}></Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.menuItem, { transform: [{ scale: buttonScale }] }]}>
            <TouchableOpacity onPress={callCustomerService} style={styles.menuButton}>
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuGradient}
              >
                <Ionicons name="call-outline" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.menuText}></Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.menuItem, { transform: [{ scale: buttonScale }] }]}>
            <TouchableOpacity onPress={openWhatsApp} style={styles.menuButton}>
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuGradient}
              >
                <Ionicons name="logo-whatsapp" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.menuText}></Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 10,
    paddingBottom:60,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  gradient: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    position: "absolute",
    bottom: 100,
    right: 0,
    
  },
  menuItem: {
    marginBottom: 15,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    width: 50,
    height: 50,
  },
  menuGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: -2,
    
  },
  menuText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#333",
  },
})

export default FloatingButton


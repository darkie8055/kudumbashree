import React, { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  SafeAreaView,
  Image,
  type FlatList,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../types/navigation"
import { useFonts, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins"

const { width, height } = Dimensions.get("window")

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, "Onboarding">

interface Props {
  navigation: OnboardingScreenNavigationProp
}

const onboardingData = [
  {
    id: "1",
    title: "Welcome to Kudumbashree",
    description: "Join our community of empowered women making a difference",
    image: "https://example.com/kudumbashree_welcome.png",
  },
  {
    id: "2",
    title: "Financial Growth",
    description: "Build savings and access micro-finance opportunities",
    image: "https://example.com/financial_growth.png",
  },
  {
    id: "3",
    title: "Skill Development",
    description: "Learn new skills and grow your entrepreneurial journey",
    image: "https://example.com/skill_development.png",
  },
  {
    id: "4",
    title: "Community Support",
    description: "Connect with other members and grow together",
    image: "https://example.com/community_support.png",
  },
]

export default function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollX = useRef(new Animated.Value(0)).current
  const slidesRef = useRef<FlatList>(null)

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  })

  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number }> }) => {
    setCurrentIndex(viewableItems[0]?.index ?? 0)
  }).current

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  const scrollTo = () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 })
    } else {
      navigation.navigate("Login")
    }
  }

  useEffect(() => {
    Animated.timing(scrollX, {
      toValue: currentIndex * width,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start()
  }, [currentIndex, scrollX])

  if (!fontsLoaded) {
    return null
  }

  const renderItem = ({ item, index }: { item: (typeof onboardingData)[0]; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width]

    const imageScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
    })

    const titleTranslate = scrollX.interpolate({
      inputRange,
      outputRange: [width * 0.2, 0, -width * 0.2],
    })

    const descriptionOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
    })

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.imageContainer, { transform: [{ scale: imageScale }] }]}>
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
        </Animated.View>
        <Animated.View style={[styles.textContainer, { transform: [{ translateX: titleTranslate }] }]}>
          <Text style={styles.title}>{item.title}</Text>
          <Animated.Text style={[styles.description, { opacity: descriptionOpacity }]}>
            {item.description}
          </Animated.Text>
        </Animated.View>
      </View>
    )
  }

  const Paginator = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width]

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: "clamp",
          })

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          })

          return <Animated.View style={[styles.dot, { width: dotWidth, opacity }]} key={i.toString()} />
        })}
      </View>
    )
  }

  return (
    <LinearGradient
      colors={["#8B5CF6", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <Animated.FlatList
          data={onboardingData}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
        <View style={styles.bottomContainer}>
          <Paginator />
          <TouchableOpacity style={styles.button} onPress={scrollTo}>
            <Text style={styles.buttonText}>{currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  imageContainer: {
    flex: 0.7,
    justifyContent: "center",
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    borderRadius: 20,
  },
  textContainer: {
    flex: 0.3,
    alignItems: "center",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    marginBottom: 10,
    color: "white",
    textAlign: "center",
  },
  description: {
    fontFamily: "Poppins_400Regular",
    color: "white",
    textAlign: "center",
    paddingHorizontal: 64,
    fontSize: 16,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
    marginHorizontal: 4,
  },
  button: {
    backgroundColor: "white",
    padding: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#8B5CF6",
  },
})


import { View } from "react-native"
import FloatingButton from "./FloatingButton"

const ScreenWithFloatingButton = ({ children }) => {
  return (
    <View style={{ flex: 1 }}>
      {children}
      <FloatingButton />
    </View>
  )
}

export default ScreenWithFloatingButton


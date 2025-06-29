"use client";

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

interface PaymentMethod {
  id: string;
  type: "visa" | "mastercard" | "upi";
  number?: string;
  expiry?: string;
  cvv?: string;
  isDefault?: boolean;
  upiApp?: string;
  upiIcon?: string;
  upiId?: string;
}

const samplePaymentMethods: PaymentMethod[] = [
  {
    id: "1",
    type: "visa",
    number: "XXXX XXXX XXXX 3694",
    expiry: "01/22",
    cvv: "658",
    isDefault: true,
  },
  {
    id: "2",
    type: "mastercard",
    number: "XXXX XXXX XXXX 3694",
    expiry: "01/22",
    cvv: "658",
  },
  {
    id: "3",
    type: "upi",
    upiApp: "BHIM",
    upiIcon:
      "https://play-lh.googleusercontent.com/B5cNBA15IxjCT-8UTXEWgiPcGkJ1C07iHKwm2Hbs8xR3PnJvZ0swTag3abdC_Fj5OfnP",
  },
  {
    id: "4",
    type: "upi",
    upiApp: "PhonePe",
    upiIcon:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAsJCQcJCQcJCQkJCwkJCQkJCQsJCwsMCwsLDA0QDBEODQ4MEhkSJRodJR0ZHxwpKRYlNzU2GioyPi0pMBk7IRP/2wBDAQcICAsJCxULCxUsHRkdLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCz/wAARCADqANsDASIAAhEBAxEB/8QAHAABAAEFAQEAAAAAAAAAAAAAAAcBAwQFBgII/8QATxAAAQQAAwQDCQsICAYDAAAAAQACAwQFESEGEjFBE1FhBxQiMnFygZGzFjRCUlV0dZOhorEVJDVDYoKy4SMzNkSUwdHSJVNUY4Pxo9Pw/8QAGgEBAAIDAQAAAAAAAAAAAAAAAAQFAgMGAf/EADERAAICAQMCBAUCBgMAAAAAAAABAgMRBBIxBSETIjJBUVKRobFh0RQVI3GB4TM08f/aAAwDAQACEQMRAD8AltERAEREAREQBFr8TxjCcIiEt+yyLeB6OPV00uXKONvhHy5Zdqj7F+6BiVkviwmIU4TmOmlDZLTh1gaxt+95VKo0lt/oXb4myFcp8Ek27tCjH01yzBXj1ydPI1gJHJu9qSuVvd0HAK+82nFZuvByDmjoIT+/KN77ii6exZtSumszTTzO8aSd7pHn95xJVpXFXSq497Hn7EmOnS5Oytd0PaCbMVYKVVueh3HzyAdrpCG/cWmsbUbVWd7pMWtgO4iFzYB6oWtWmRWENNTD0xRuVcVwi5JNPM8vllkke7xnSOc5x8pJzXjM9qoikGZXM9ZWdXxnHaga2tiV2JrRkGMmfuAeYc2/YsFUWLipLDR40nydPW262rrkdJYgstGXg2q7P4odx32rf0u6REdxuI4a9vxpKUoePq5cj98qOUUWzRUT5j9OxrdUH7E4YdtJs7ihaypfiMzssoZs4ZszyDJAMz5M1uF87rfYVtXtDhW4yK0Z6zcvze5nLHl1NcTvj0O9CrbelNd6n9f3NMtP8rJqRcrg222CYoY4bB7xtu0EdhwML3dUc2g9BA9K6pU9lU6pbZrDIsouLwwiItZ4EREAREQBERAERWLVupSrzWrczIa8Ld6WSQ5Bo4DhqSeAA4ok28IF5zmtDnOIDWgucXEAAAZkklcFtBt7HCZKmB7ksoza+84b0LDz6Bp0ce06acDmud2l2tu406SrW36+Fh2QjGklkA6OnI5cw3h15kacur/SdNSxO76fuTK6PeRdsWLVuaSxZmlmnkOb5JXF73ek8upWkVVdpJLCJRRERAEVV46SLPLpGZ9W83P8UB6REQBFVUQBFVUQBERAPwXS4Fthi2D9HBKTcoDToJXHpIh/2JTmR5DmPJxXNItdlULY7ZrKMZRUlhk8YXi+GYxXFmhMJGAhsrD4MsLyM92VnEH8eRK2CgKhiF/DLMdujO6GZuQJGrXt47kjeBb2f56iXdnNp6OPRBngwYhEwOsVieIGhkhJ4t+0c+t3N6vQyo80e8fwQrKnHuuDoERFWmgIiIAiKhLWglxAABJJOQAGpJJQFm1arUq89q1K2KvAwySyP4NaOwa5ngBz9Kh3aTaS3j1nIb8WHwvJq1ydc+HSy5aF5+zPIcy7K2u2kfjNo1aryMLqvPRZZgWZRoZnDq5M7NeeTeWXSaDReEvEn6vx/snU1be75CIitiQEREAXRbP7JYnj8T7TLENSkyZ0HSyMdLLI5uW90UYIGQ4Zl3HloudXTbLbUTYFKa9gOlwueTflY0ZyV3uyBmi6x8ZvPiNdHR9S7VW3TyYT3Y8vJ2dDuf7M1d11ptjEJRkSbb8oc+yGLdb6810TcKwZkfRMw6i2LIjcbWgDcjx03clkQT17UMNivKyWCZgkikjIcx7TwIIV1cnZfbN+eTK5yk+WcTtDsNh9qGWzg0MdW8wF/QR+BWs5alm74rXHkRkOvjmIuc17HPY9rmPY5zHseC1zXtO6WuB1zHNfQ64bbTZXv1suL4bH+ext3rkDBrajaMt9gH6xo9Y04gZ2eg1zi/Dtfb2Zvqtw9siMETQ5EcDqi6EmhERAEREAREQBXa9ixVmhsVpXxTwvD4pIzk5jhzH+Y5q0iNZ7MEy7L7SwY9XMcobFiNdgNmIaNkbw6aLPXdPMcj5QT0a+f6dy3QtV7lSUxWK7w+N44drXDm0jQhTVgONVccoRW4cmytPRWoc8zBMBmW+Q8WnmD6uY12j8B74el/YgXV7XlcG2REVYaAuE28x814RgtR+U1lm/fc06x13cItOb+fZ5663FcRr4VQuX59WV495rM8jJIfBZGPOOQ/8ASgu1ZsXbNm3Zfvz2JXyyu63OOeQ7BwHYFa9N03iz8SXC/JIohue5llERdKTgiIgCIiAIiIDotmtp7WAzdFIHzYXK/OeAauhceMsGfP4w59h1Mv1bVW7XhtVZWTV52B8UkZza5vDy5jgRyXz8t9s7tJdwGxpvzYfK4G1Wz56DpYc9A8eo8DyLarW6FW/1K/V+f9ke2rd3XJNSLGo3qeI1oLlOZsteZu8x7fta4HUEcCDwWSubaaeGQeCNNtdlRXM2NYdGegc4yYjAwf1TjqbEYHwT8McuPDPLgl9DuaHBzXAEEEEEZgg8QQVEu1+y5weY3qTCcLnfk5ozPecrj4h/YPwDy4dWd90/W7sU2Pv7fsTKbc+VnJIiK7JQREQBERAEREAW52cxybAsRjs5uNSbdhvRDXfhz8cD4zOI9I+EtMiwnCNkXCXDPGk1hn0LFJFNHFLE9r45WNkjew5texw3g4HqK9rgu59jRmgmwWw/OSo0z0S46url2T4xn8QkZdjv2V3q46+l02OD9itnFxlgjPuh4sZbVXCInf0dUNtWgDxnkb4DT5rTn+/2Lg1kXbU163cuTHOW1PJM/XQF5z3R2DQDyLHXWaapU1KBYQjtikERFIMyqKiIAqq7WqXrsphpVbFmYN33MrRukc1meW87LQDylZvue2o+RMT+o/msJWQi8N4Mdy9zWItn7ntqfkTE/qP5p7ntqPkTE/qP5rzxq/mX1G5fE1iLZ+57aj5ExP6j+ae57aj5ExP6j+aeNX8y+o3L4l7ANoL+AWjLDnLVlcO+6pdk2UDTfYToHjkefA/szHh2I0cVqQ3aUokgl06nMeOMcjTqHDmP/wAYW9z21HyJif1H81tsDj24wG33xWwXE3wyFot1nQ5R2GD06OHwXfiNFWa3T1XrfCS3f35NFsIy7p9yX1asQQWYZq9iNssEzHRyxyDNr2OGRBC81bHfVeCx0NiDpWBxhtRmOeI82yNzOo8pV9c73TIRC202zs+AWwG78mH2HONOZ2pB4mGU/GHLrGvEEDQKfcQw+lilSxSuRdJBM3Jw4Oa4ah7DycOIKii5sRtVBZsQ1qZt12PPQ2GTV4xKw6glkjwQeRGXHsXR6PXxsjtteGvuTqrk1iRzKLfe47bL5Jk/xFP/AO1Y1zZ3aXD4XWLmF2I4GAl8jDFMxgHN/QvcQO0hWCvqbwpL6o2qcX7mqREW4zKoqIgCIiAy8Ovz4ZepYhBmZKkzZN0Hx2eK+M+cMx6VOsFupZgr2IpozFYijmiJcASyRoe0kHsKgBX472IxMZHHZlaxg3WNDjk1o4Aa8Aq/WaL+Jw08NGmyvfwY6IisDcEREBVERASL3NAOh2idkM++abc+eQhcQM/SfWpCUU7BYxVw+7do2ntjixHoXQyvIDG2Is27jidBvA6doy5qVlynUYtaiTfv+xX3J72ERFANIREQBERAEREAREQBUIzBHXoqogIV2sw6vhmO3a9ZoZXkbFaijHCMTAlzGjqBBy7PItCup27lil2isCN7XdFVqwybpz3ZG77i05cxmM1yy7LTNumLlzgs63mKyVREUgzKIiIAiqqJkBERAEREAREQBZ0OLY5XY2KDE8RijaMmsjtztY0dQAdksFFjKKlyjzGTttiMTxi3j7YbeIXrEX5OuP6OxYlkZvtfCA7deSMxmfWpSyURbAf2kb9GXf44FLq5rqcVG/CXsQb1iYyXC90G9iNJmBd53LVYyOvdJ3tNJFv7oiy3twjPLM5eVd0o97pfibPediH4QLToUpaiKf6/gxq9aOL/AC7tH8sYp/jLH+5Py7tH8sYp/jLH+5a1F1PhQ+VE/ajYPx3aQMk/4ziniu/vljq85TVhL5JMKweSRznySYfSe97yXOc50LCXOJ1zPNQI/wASTzHfgp6wb9EYJ9G0PYMVP1WEYwjhY7kbUJJLBn5IiKhIhAFieyLFoCef3xP+ul/5jv2lb74tf9RY+ul/1Sx74tfOJ/aOVpdvGKwuxapLA/8AaIizPQiIgCIiAIiIAiIgCIiAIiIAiIgOq2A/tI36Mu/xwKXlEWwH9pG/Rl3+OBS6uZ6r/wA/+CBf6wo87pfibPediH4QKQ1HvdL8TZ7z8Q/CFaen/wDYj/n8Mxp9aI5REXWFieX+JJ5jvwU94N+iME+jKHsGKBX+JJ5jvwU9YN+iME+jaHsGKl6v6I/3Iup4RnoERc+Qz58se+LXzif2jlaV2x74tfOJ/aOVpdxHhFquAiIsj0IiIAiIgCIiAIiIAiIgCIiAIiIDqNgnhu0sAP6yhejb2kdG/wDyKmBQds1aFLaDArDjkw2xXkPINsNdBr6SFOK5vqsWrk/iiDqF5shcF3SYXOqYJOB4MVqxC49RljDh/CV3q1eO4THjWGW6DnBj5A2SvIRmIp4zvMcR1cj2EqDprFVdGb4RqhLbJMgtFkXqV7DLD6l+B1edpyyk8R4+NE/xXNPIg+rgsddipKSyiyTzwUf4knmO/BT1g36IwT6NoewYoE1lJihBlme1zWRQtMkjiRkAGMzd9in3CWSR4Vg8cjHMkjw+lHIx4ycx7YWAtcDzHNU3V/RFfqRtTwjNREXPkM+fLHvi184n9o5Wldse+LXzif2jlaXcR4RaoIiLI9CIiAIiIAiIgKqi9PZJG+SORpa+N7o3tcMi1zTukHyLygCIiAqioiAKqoiAa/BO64atcOLXDUEeRTls9i0eM4TSugjpi3obbB+rsxgNeD5eI7CFBq32zO0M2AXXPcHSULJa27CzVwy0bNGPjN6uY05DKv1+md9fl5RpuhvXYmr1J6lYqW6l6vFaqTRzV5m70ckZzaR1dYI5g6hX1yrWOzK8sz1qlpnRWYIJ4jqWTxskZ6ngha07L7Jl29+RMLz0/usWXqyy+xbhFnGyUe0Xg9y0Y9ejh9MFtSpVrg8RXhjiz8u4AshEWDbfdng9SIiA+fLHvi184n9o5Wldse+LXzif2jlaXcR4RargIiLI9KoqIgCIiAqqIg11GozI4HiDkV6DrNusKNHGHW2Nyr4mDYaQNBYbk2Vvp0d+92Lk1Nu0+DjGcJs12NBtRfnNMnL+uYD4GfU4Zt9PYoTIcCQ4EEEghwyII0IIVb06/wAWpJ8rsaKZ7o4+BRERWJvKoqIgCqqIgCIiA2GGYxi2Dyulw+y6LfIMsZAfBLl8eN2mfboe1dtS7pEZDW4lhrw74UlGRrmn/wAUxB++VHKKLdpKbu813Ncq4y5RLjNv9lXAFz7sZ+K+q4n/AOMkfavMndB2XYPBF+U9UdYN9q5qiVFF/ldH6/U1+BEkDEO6TMY5BhuGtY4NcWy3ZN/LTQ9FFkPvrvcNnls4dhliUgy2KVWeQgAAvkia9xAHaVAL/Ek8x34KesG/RGCfRtD2DFB6jpq6IR8NYNV0IwSwZ/qREVORj58se+LXzif2jlaV2x74tfOJ/aOVpdxHhFqgiIsj0qioiAIiID0xk0r4oYWb880jIYGDi+WRwY1vrKmSjsjgNWnTry12ySwwRMlkP6yQNG+/hzOZ9K43YDBjcvy4vO3OvhxMVXMaPuPbq4eY0+t37KlRc/1LVS3quD45Id8++EFFm3eAmnb/ACvWZ+a3pMrIaNIrR13vI/j5c+tSmse5UrX6tmnZYHwWI3Ryt55HmD1jiD2Ku0t709imuPc0Qm4PJ8/otnjeD28Evy0583MOclWbLJs8JOQcO0cHDr7DrrF18JKcVKPDLJPKygiIsj0IiIAiIgCIiAIiICj/ABJPMd+CnrBv0Rgn0bQ9gxQNpz4HQqXticZr4hhFWk6RovYbE2tLGT4b4WeDHM0cwRkD1Eeun6rBuuMl7MjahZimdUiJmBmSQANSToAFzpCPnyx74tfOJ/aOVpXJnNdPYc0gtdNM5pHAgvJBCtruI8ItVwERFkehERAFkUaVvErlShUbnYtSdGwkZtY0avkf+y0an+axycus6gAAZkk6AADXM8lLexmzZweqbt1mWKXYxvtOX5rBnvNgHbzf26fB1iavUrT17vf2NVk9iOgwvDqmE0alCqMoq8YbmfGkedXSP7XHMnyrNRFyLbk8vkrs57hEReA1OO4JTx2k+rOA2VuclWcDN8EuWQcOw8HDmO0ZiGMQw+7hlualdj6OeI65asew+LJG7m08v9RkJ9Wmx/Z+hj1XoZso7EYcatloBfC48iObT8IZ+ojMWWi1roeyXp/Bvqt2dnwQgiz8UwrEcHtvp3otyQZuje3MxTx/HidlqOvmOawF08ZKSzF9icnnugiIvT0IiIAiIgCIiAL3FLNBJHNBLJFNGd6OSF7mSMPW1zSCvCJz2Z4btu1e1rGhoxeyQOBc2Fx9Jcwn7Vbs7S7TW4ZK9jFLL4ZQWyMHRxh7SMi1xjaDkeYzWoRalRWnnavojzZH4BERbTIIiIAhIaCSQABmSeAT4o1Jc4NaGglznE5ANA1JPJSNsnsU6N1fFcajHStylp0HgEQni2WyOBfzDeXPXxY+o1EKI7p/+mE5qCyymxeyb2OgxvFYt2QASYdVlbrFmNLErT8L4g5ceJ8GQ0RcnffK+e+ZXzm5vLCIi0mAzTNEQDNM0RAYOJ4Xh2L1n1b0LZIzmWO8WSJ+WW/E8agqKMf2SxTBC+Zgdbw7UixGzw4h1WGN4ecNPJwUyqhAIIIBBBBB4EdSl6bV2ad+XuvgbIWOHB88elFK2N7CYZfMljDXNoW3ZuLGtzqSuOvhRjVp7W+oqOsUwTGsGcRiFR8ceeTbDP6Ss/ySt09ByPYuj0+sqv7Rff4E2FkZcGuREUw2hERAEREARVVEARVVEARF7hinsTMr14pZ7D/EhgY6SR37rdUyDwsqhQxHFLAqYfXfYn0Lw3RkTT8KaQ+C0eX0ZrrsG7n1+z0c+MympCcj3rXc11l46pJRmxvozPaFItDDsOwuuyrQrRV4G67sY1c74z3Hwie0kqq1HUoV+Wvu/sR53qPaJz+zextHBTHctOZbxTLSUtPQ1s+Irsdz63HXycF1aIuestnbLdN5ZClJyeWM0zRFrPBmmaIgCIiAIiIAiIgC8vYx7XMe1rmOBa5rgHNcOog6L0iA5XEthdnL2/JBG+hO7M79MgREnmYH5s9QC5G93P8AaGsXOpyVb0fINd3vNl5kpLPvqWFRTatffV2Tyv1Nsbpx9yBLeF4zRz78w67ABxc+B5j9EjAWfeWEHsJyD2k9QIJX0QtdiOG4TPDI6ehSldp4UteF59bmlWdPU3Y9so/ckQv3coglFtsZihixC0yKOONjXeC2NrWtHkDRktWVcp5WSQii8lzRxcB5SB+KvNA6gpP2TwzCJasUsuH0ZJNxvhyVoXP4D4Tm5rXbZ4cd2DyTwskWwsmsuDK0U07zoG1opJifqwVvqWx21t0tyw81Y3Zf0mISNhyHX0bd6T7qmVscUTQyJjGNHBsbQ1o9AXpUlnVZ8Qil9yLLUP2RwOH9zimzdfit+Ww4amGmO94fIXkmQ+tq7OhhmFYZF0OH04KzPhdCwBz+17z4RPlJWYirbdTbd65GiU5S5YREUcwCIiAIiIAiIgP/2Q==",
  },
  {
    id: "5",
    type: "upi",
    upiApp: "Paytm",
    upiIcon:
      "data:image/png;base64,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",
  },
  {
    id: "6",
    type: "upi",
    upiApp: "Google Pay",
    upiIcon:
      "https://play-lh.googleusercontent.com/HArtbyi53u0jnqhnnxkQnMx9dHOERNcprZyKnInd2nrfM7Wd9ivMNTiz7IJP6-mSpwk",
  },
];

export default function PaymentMethodScreen({ navigation, route }) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [selectedMethod, setSelectedMethod] = useState<string>(
    samplePaymentMethods[0].id
  );
  const [paymentType, setPaymentType] = useState<"card" | "upi">("card");
  const [upiId, setUpiId] = useState<string>("");
  const [showUpiInput, setShowUpiInput] = useState<boolean>(false);
  const [showUpiHelp, setShowUpiHelp] = useState<boolean>(false);
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [upiHolderDetails, setUpiHolderDetails] = useState<{
    name: string;
    bank: string;
  } | null>(null);
  const [verificationError, setVerificationError] = useState<string>("");

  // Reset modal state when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      // Reset all modal-related states
      setShowUpiInput(false);
      setShowUpiHelp(false);
      setIsUpiVerified(false);
      setIsVerifying(false);
      setUpiId("");
      setUpiHolderDetails(null);
      setVerificationError("");
    }, [])
  );

  const verifyUpiId = async () => {
    setIsVerifying(true);
    setVerificationError("");
    setUpiHolderDetails(null);

    // Basic UPI ID validation
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z0-9]{2,}$/;

    if (!upiRegex.test(upiId)) {
      setVerificationError(
        "Invalid UPI ID format. Please enter a valid UPI ID."
      );
      setIsVerifying(false);
      setIsUpiVerified(false);
      return;
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate verification success with mock data
    // In real app, this would be an actual API call
    const mockHolderData = {
      name: generateNameFromUpiId(upiId),
      bank: getBankFromUpiId(upiId),
    };

    setUpiHolderDetails(mockHolderData);
    setIsVerifying(false);
    setIsUpiVerified(true);
  };

  // Helper function to generate name from UPI ID username
  const generateNameFromUpiId = (upiId: string): string => {
    const username = upiId.split("@")[0];

    // Handle common separators in UPI IDs
    let processedUsername = username
      .replace(/[._-]/g, " ") // Replace dots, underscores, hyphens with spaces
      .replace(/\d+/g, "") // Remove numbers
      .trim();

    // If username is too short after cleaning, return a default
    if (processedUsername.length < 2) {
      return "Account Holder";
    }

    // Convert to proper case
    let name = processedUsername
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 0) // Remove empty strings
      .map((word) => {
        // Capitalize first letter of each word
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");

    // Handle camelCase within words (e.g., "johnDoe" -> "John Doe")
    name = name.replace(/([a-z])([A-Z])/g, "$1 $2");

    // If single word and short, likely first name - add common surname
    if (!name.includes(" ") && name.length < 8) {
      const commonSurnames = ["Kumar", "Singh", "Sharma", "Patel", "Gupta"];
      const surnameIndex = name.length % commonSurnames.length;
      name = name + " " + commonSurnames[surnameIndex];
    }

    // Limit name length for display
    if (name.length > 25) {
      name = name.substring(0, 22) + "...";
    }

    return name;
  };

  // Helper function to determine bank from UPI ID
  const getBankFromUpiId = (upiId: string): string => {
    const domain = upiId.split("@")[1].toLowerCase();
    const bankMap: { [key: string]: string } = {
      paytm: "Paytm Payments Bank",
      ybl: "Yes Bank",
      okhdfcbank: "HDFC Bank",
      okicici: "ICICI Bank",
      okaxis: "Axis Bank",
      oksbi: "State Bank of India",
      ibl: "IDBI Bank",
      axl: "Axis Bank",
      hdfcbank: "HDFC Bank",
      icici: "ICICI Bank",
      sbi: "State Bank of India",
    };

    return bankMap[domain] || "Bank";
  };

  const handlePaymentProceed = () => {
    const selectedPayment = samplePaymentMethods.find(
      (m) => m.id === selectedMethod
    );

    if (selectedPayment?.type === "upi") {
      setShowUpiInput(true);
    } else {
      navigation.navigate("OrderSummary", {
        ...route.params,
        paymentMethod: selectedPayment,
      });
    }
  };

  const handleUpiPayment = () => {
    const selectedPayment = samplePaymentMethods.find(
      (m) => m.id === selectedMethod
    );
    navigation.navigate("OrderSummary", {
      ...route.params,
      paymentMethod: {
        ...selectedPayment,
        upiId: upiId,
      },
    });
  };

  const handleNextPress = () => {
    if (!selectedMethod) {
      alert("Please select a payment method");
      return;
    }

    const selectedPayment = samplePaymentMethods.find(
      (m) => m.id === selectedMethod
    );
    if (selectedPayment?.type === "upi") {
      setShowUpiInput(true);
    } else {
      navigation.navigate("OrderSummary", {
        ...route.params,
        paymentMethod: selectedPayment,
      });
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Method</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, paymentType === "card" && styles.activeTab]}
          onPress={() => setPaymentType("card")}
        >
          <Text
            style={[
              styles.tabText,
              paymentType === "card" && styles.activeTabText,
            ]}
          >
            Cards
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, paymentType === "upi" && styles.activeTab]}
          onPress={() => setPaymentType("upi")}
        >
          <Text
            style={[
              styles.tabText,
              paymentType === "upi" && styles.activeTabText,
            ]}
          >
            UPI
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {paymentType === "card" ? (
          samplePaymentMethods
            .filter(
              (method) => method.type === "visa" || method.type === "mastercard"
            )
            .map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentCard,
                  selectedMethod === method.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>DEFAULT</Text>
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <Image
                    source={
                      method.type === "visa"
                        ? require("../assets/visa.png")
                        : require("../assets/mastercard.png")
                    }
                    style={styles.cardTypeImage}
                  />
                  <Text style={styles.cardNumber}>{method.number}</Text>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardDetailText}>
                      Expiry: {method.expiry}
                    </Text>
                    <Text style={styles.cardDetailText}>CVV: {method.cvv}</Text>
                  </View>
                </View>

                {selectedMethod === method.id && (
                  <View style={styles.checkmark}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#7C3AED"
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))
        ) : (
          <View style={styles.upiContainer}>
            <Text style={styles.upiTitle}>Select your UPI app</Text>
            <View style={styles.upiGrid}>
              {samplePaymentMethods
                .filter((method) => method.type === "upi")
                .map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.upiOption,
                      selectedMethod === method.id && styles.selectedUpiOption,
                    ]}
                    onPress={() => setSelectedMethod(method.id)}
                  >
                    <Image
                      source={{ uri: method.upiIcon }}
                      style={styles.upiIcon}
                    />
                    <Text style={styles.upiAppName}>{method.upiApp}</Text>
                    {selectedMethod === method.id && (
                      <View style={styles.upiCheckmark}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#7C3AED"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={styles.otherUpiButton}>
              <Text style={styles.otherUpiButtonText}>OTHER UPI APPS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpLink}
              onPress={() => setShowUpiHelp(true)}
            >
              <Text style={styles.helpLinkText}>How to pay using UPI?</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.nextButton, !selectedMethod && styles.disabledButton]}
        onPress={handleNextPress}
        disabled={!selectedMethod}
      >
        <LinearGradient
          colors={
            selectedMethod ? ["#7C3AED", "#C026D3"] : ["#9CA3AF", "#9CA3AF"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.nextButtonGradient}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* UPI Input Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUpiInput}
        onRequestClose={() => setShowUpiInput(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.upiIconContainer}>
                  <Ionicons name="card-outline" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.modalTitle}>Enter UPI ID</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowUpiInput(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Please enter your UPI ID to complete the payment
            </Text>

            <View style={styles.selectedUpiInfo}>
              {samplePaymentMethods
                .filter((method) => method.id === selectedMethod)
                .map((method) => (
                  <View key={method.id} style={styles.selectedUpiCard}>
                    <Image
                      source={{ uri: method.upiIcon }}
                      style={styles.selectedUpiIcon}
                    />
                    <Text style={styles.selectedUpiName}>{method.upiApp}</Text>
                  </View>
                ))}
            </View>

            <View style={styles.upiInputContainer}>
              <Text style={styles.inputLabel}>UPI ID</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.upiInput,
                    isUpiVerified && styles.upiInputVerified,
                  ]}
                  placeholder={`example@${
                    samplePaymentMethods
                      .find((m) => m.id === selectedMethod)
                      ?.upiApp?.toLowerCase() === "google pay"
                      ? "googlepay"
                      : samplePaymentMethods
                          .find((m) => m.id === selectedMethod)
                          ?.upiApp?.toLowerCase() === "phonepe"
                      ? "ybl"
                      : samplePaymentMethods
                          .find((m) => m.id === selectedMethod)
                          ?.upiApp?.toLowerCase() === "bhim"
                      ? "upi"
                      : "paytm"
                  }`}
                  placeholderTextColor="#9CA3AF"
                  value={upiId}
                  onChangeText={(text) => {
                    setUpiId(text);
                    setIsUpiVerified(false);
                    setUpiHolderDetails(null);
                    setVerificationError("");
                  }}
                  autoCapitalize="none"
                  autoFocus={true}
                />
                {isUpiVerified && (
                  <View style={styles.verifiedIconContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#059669"
                    />
                  </View>
                )}
              </View>
              <View style={styles.verifyButtonRow}>
                {isUpiVerified && upiHolderDetails && (
                  <View style={styles.holderDetailsContainer}>
                    <Text style={styles.holderName}>
                      {upiHolderDetails.name}
                    </Text>
                    <Text style={styles.holderBank}>
                      {upiHolderDetails.bank}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    isVerifying && styles.verifyingButton,
                    isUpiVerified && styles.verifiedButton,
                  ]}
                  onPress={verifyUpiId}
                  disabled={isVerifying || !upiId || isUpiVerified}
                >
                  <Text style={styles.verifyButtonText}>
                    {isVerifying
                      ? "Verifying..."
                      : isUpiVerified
                      ? "Verified"
                      : "Verify"}
                  </Text>
                </TouchableOpacity>
              </View>

              {verificationError && (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color="#EF4444"
                  />
                  <Text style={styles.errorText}>{verificationError}</Text>
                </View>
              )}
            </View>

            <View style={styles.upiHintContainer}>
              <View style={styles.upiHintRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#7C3AED"
                />
                <Text style={styles.upiHintText}>
                  Your UPI ID is linked to your bank account and mobile number
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUpiInput(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.proceedButton,
                  !isUpiVerified && styles.disabledButton,
                ]}
                onPress={handleUpiPayment}
                disabled={!isUpiVerified}
              >
                <LinearGradient
                  colors={
                    isUpiVerified
                      ? ["#7C3AED", "#C026D3"]
                      : ["#9CA3AF", "#9CA3AF"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.proceedButtonGradient}
                >
                  <Text style={styles.proceedButtonText}>Proceed</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* UPI Help Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUpiHelp}
        onRequestClose={() => setShowUpiHelp(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.upiIconContainer}>
                  <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.modalTitle}>How to Pay using UPI?</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowUpiHelp(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.helpContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Select UPI App</Text>
                  <Text style={styles.stepDescription}>
                    Choose your preferred UPI app from the available options
                    like PhonePe, Google Pay, Paytm, or BHIM.
                  </Text>
                </View>
              </View>

              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Enter UPI ID</Text>
                  <Text style={styles.stepDescription}>
                    Enter your UPI ID (e.g., yourname@paytm, yourname@ybl) in
                    the format: username@bankname
                  </Text>
                </View>
              </View>

              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Verify UPI ID</Text>
                  <Text style={styles.stepDescription}>
                    Click the "Verify" button to confirm your UPI ID is valid
                    and linked to your bank account.
                  </Text>
                </View>
              </View>

              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Complete Payment</Text>
                  <Text style={styles.stepDescription}>
                    After verification, proceed to complete the payment. You'll
                    be redirected to your UPI app to authorize the transaction.
                  </Text>
                </View>
              </View>

              <View style={styles.upiHintContainer}>
                <View style={styles.upiHintRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#7C3AED"
                  />
                  <Text style={styles.upiHintText}>
                    Make sure your UPI app is installed and your UPI ID is
                    active for seamless payments.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.helpModalButtons}>
              <TouchableOpacity
                style={styles.gotItButton}
                onPress={() => setShowUpiHelp(false)}
              >
                <LinearGradient
                  colors={["#7C3AED", "#C026D3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gotItButtonGradient}
                >
                  <Text style={styles.gotItButtonText}>Got It!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  paymentCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  selectedCard: {
    borderColor: "#7C3AED",
    borderWidth: 2,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.2,
  },
  defaultBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: "#7C3AED",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  cardInfo: {
    marginTop: 24,
  },
  cardTypeImage: {
    width: 80,
    height: 50,
    resizeMode: "contain",
    marginBottom: 16,
  },
  cardNumber: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1E293B",
    marginBottom: 12,
    letterSpacing: 1,
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardDetailText: {
    color: "#64748B",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  checkmark: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  upiContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  upiTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1E293B",
    marginBottom: 20,
  },
  upiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  upiOption: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedUpiOption: {
    borderColor: "#7C3AED",
    borderWidth: 2,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.2,
  },
  upiIcon: {
    width: 48,
    height: 48,
    resizeMode: "contain",
    marginBottom: 12,
    borderRadius: 8,
  },
  upiAppName: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#1E293B",
  },
  upiCheckmark: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  otherUpiButton: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  otherUpiButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#7C3AED",
  },
  helpLink: {
    alignItems: "center",
  },
  helpLinkText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#7C3AED",
    textDecorationLine: "underline",
  },
  nextButton: {
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#1E293B",
  },
  modalCloseButton: {
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 12,
  },
  upiInputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  upiInput: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    backgroundColor: "#F8FAFC",
  },
  upiInputVerified: {
    borderColor: "#059669",
    backgroundColor: "rgba(5, 150, 105, 0.05)",
  },
  verifyButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verifyButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    minWidth: 100,
  },
  verifyingButton: {
    backgroundColor: "#9CA3AF",
    shadowColor: "#9CA3AF",
  },
  verifiedButton: {
    backgroundColor: "#059669",
    shadowColor: "#059669",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  verifiedIconContainer: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  proceedButton: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  proceedButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  upiIconContainer: {
    backgroundColor: "#7C3AED",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#64748B",
    marginBottom: 20,
    lineHeight: 20,
  },
  selectedUpiInfo: {
    marginBottom: 20,
  },
  selectedUpiCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedUpiIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    borderRadius: 6,
  },
  selectedUpiName: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1E293B",
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#1E293B",
    marginBottom: 8,
  },
  upiHintContainer: {
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  upiHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  upiHintText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
    marginLeft: 6,
    flex: 1,
  },
  helpContent: {
    maxHeight: 400,
    marginBottom: 20,
  },
  helpStep: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1E293B",
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#64748B",
    lineHeight: 20,
  },
  helpModalButtons: {
    marginTop: 16,
  },
  gotItButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gotItButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  gotItButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.5,
  },
  holderDetailsContainer: {
    flex: 1,
    marginRight: 12,
  },
  holderName: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#1E293B",
    marginBottom: 2,
  },
  holderBank: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#64748B",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#EF4444",
    marginLeft: 8,
    flex: 1,
  },
});

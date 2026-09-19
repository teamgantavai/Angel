import React from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Colors, ThemeColors } from "@/components/constants/colors";

export interface UserAvatarProps {
  uri?: string | null;
  name?: string;
  size: number;
  isDark?: boolean;
  borderWidth?: number;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export default function UserAvatar({
  uri,
  name,
  size,
  isDark = true,
  borderWidth = 0,
  borderColor,
  style,
  imageStyle,
}: UserAvatarProps) {
  const theme: ThemeColors = isDark ? Colors.dark : Colors.light;
  const initial = (name?.trim()?.[0] ?? "U").toUpperCase();
  const effectiveBorderColor = borderColor ?? theme.border;

  if (uri) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: effectiveBorderColor,
            overflow: "hidden",
          },
          style,
        ]}>
        <Image
          source={{ uri }}
          style={[
            {
              width: "100%",
              height: "100%",
            },
            imageStyle,
          ]}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.initialsContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? "#1C1D26" : "#F1F5F9",
          borderWidth,
          borderColor: effectiveBorderColor,
        },
        style,
      ]}>
      <Text
        style={[
          styles.initialsText,
          {
            color: theme.text,
            fontSize: Math.round(size * 0.42),
          },
        ]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  initialsContainer: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initialsText: {
    fontWeight: "700",
    letterSpacing: -0.5,
  },
});

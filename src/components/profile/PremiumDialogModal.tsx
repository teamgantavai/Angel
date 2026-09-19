import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors, ThemeColors } from "@/components/constants/colors";

export interface PremiumDialogModalProps {
  visible: boolean;
  title: string;
  message: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  primaryButtonText?: string;
  primaryButtonDestructive?: boolean;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  onClose: () => void;
  isDark?: boolean;
}

export default function PremiumDialogModal({
  visible,
  title,
  message,
  iconName,
  iconColor,
  iconBgColor,
  primaryButtonText = "OK",
  primaryButtonDestructive = false,
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  onClose,
  isDark = true,
}: PremiumDialogModalProps) {
  const theme: ThemeColors = isDark ? Colors.dark : Colors.light;

  if (!visible) return null;

  const defaultIconColor = iconColor ?? (primaryButtonDestructive ? "#EF4444" : theme.text);
  const defaultIconBg =
    iconBgColor ??
    (primaryButtonDestructive
      ? isDark
        ? "rgba(239, 68, 68, 0.15)"
        : "rgba(239, 68, 68, 0.10)"
      : isDark
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(0, 0, 0, 0.05)");

  const handlePrimary = () => {
    onClose();
    if (onPrimaryPress) {
      setTimeout(onPrimaryPress, 100);
    }
  };

  const handleSecondary = () => {
    onClose();
    if (onSecondaryPress) {
      setTimeout(onSecondaryPress, 100);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        {/* Full-screen semi-transparent backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessible={false}
          importantForAccessibility="no"
        />

        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          {/* Optional Icon Header */}
          {iconName && (
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: defaultIconBg },
              ]}>
              <Ionicons
                name={iconName}
                size={28}
                color={defaultIconColor}
              />
            </View>
          )}

          {/* Title */}
          <Text style={[styles.dialogTitle, { color: theme.text }]}>
            {title}
          </Text>

          {/* Description Message */}
          <Text
            style={[
              styles.dialogMessage,
              { color: theme.textSecondary },
            ]}>
            {message}
          </Text>

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            {secondaryButtonText && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={secondaryButtonText}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.06)"
                      : "rgba(0, 0, 0, 0.04)",
                    borderColor: theme.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                onPress={handleSecondary}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.secondaryBtnText,
                    { color: theme.text },
                  ]}>
                  {secondaryButtonText}
                </Text>
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={primaryButtonText}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: primaryButtonDestructive
                    ? "#EF4444"
                    : theme.buttonPrimary,
                  opacity: pressed ? 0.8 : 1,
                },
                !secondaryButtonText && { flex: 1 },
              ]}
              onPress={handlePrimary}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.primaryBtnText,
                  {
                    color: primaryButtonDestructive
                      ? "#FFFFFF"
                      : theme.buttonPrimaryText,
                  },
                ]}>
                {primaryButtonText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 99999,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.40)",
    zIndex: 1,
    ...(Platform.OS === "web"
      ? {
          position: "fixed" as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }
      : {}),
  },
  dialogCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: 10,
  },
  secondaryBtn: {
    minWidth: 84,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryBtn: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});

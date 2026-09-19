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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, ThemeColors } from "@/components/constants/colors";

export interface AvatarPickerModalProps {
  visible: boolean;
  hasCustomPhoto?: boolean;
  isDark?: boolean;
  onClose: () => void;
  onPickFromGallery: () => void;
  onTakePhoto: () => void;
  onEditPhoto?: () => void;
  onEditCurrentPhoto?: () => void;
  onDeletePhoto?: () => void;
  onRemovePhoto?: () => void;
}

export default function AvatarPickerModal({
  visible,
  hasCustomPhoto = false,
  isDark = true,
  onClose,
  onPickFromGallery,
  onTakePhoto,
  onEditPhoto,
  onEditCurrentPhoto,
  onDeletePhoto,
  onRemovePhoto,
}: AvatarPickerModalProps) {
  const insets = useSafeAreaInsets();
  const theme: ThemeColors = isDark ? Colors.dark : Colors.light;

  if (!visible) return null;

  const handleEditPress = () => {
    onClose();
    setTimeout(() => {
      if (onEditPhoto) {
        onEditPhoto();
      } else if (onEditCurrentPhoto) {
        onEditCurrentPhoto();
      }
    }, 200);
  };

  const handleDeletePress = () => {
    onClose();
    setTimeout(() => {
      if (onDeletePhoto) {
        onDeletePhoto();
      } else if (onRemovePhoto) {
        onRemovePhoto();
      }
    }, 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View
        style={[
          styles.modalRoot,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}>
        {/* Full-screen semi-transparent backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessible={false}
          importantForAccessibility="no"
        />

        {/* Bottom Sheet Card Wrapper */}
        <View style={styles.sheetWrapper}>
          {/* Grouped Action Card */}
          <View
            style={[
              styles.menuCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            {/* Header Title */}
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>
                Change Profile Photo
              </Text>
            </View>

            {/* 1. Choose from Library */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose from Library"
              style={({ pressed }) => [
                styles.menuRow,
                {
                  backgroundColor: pressed
                    ? isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)"
                    : "transparent",
                },
              ]}
              onPress={() => {
                onClose();
                setTimeout(onPickFromGallery, 200);
              }}>
              <Ionicons
                name="image-outline"
                size={22}
                color={theme.text}
                style={styles.menuIcon}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.menuText, { color: theme.text }]}>
                Choose from Library
              </Text>
            </Pressable>

            <View
              style={[styles.rowDivider, { backgroundColor: theme.divider }]}
            />

            {/* 2. Take Photo */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take Photo"
              style={({ pressed }) => [
                styles.menuRow,
                {
                  backgroundColor: pressed
                    ? isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)"
                    : "transparent",
                },
              ]}
              onPress={() => {
                onClose();
                setTimeout(onTakePhoto, 200);
              }}>
              <Ionicons
                name="camera-outline"
                size={22}
                color={theme.text}
                style={styles.menuIcon}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.menuText, { color: theme.text }]}>
                Take Photo
              </Text>
            </Pressable>

            <View
              style={[styles.rowDivider, { backgroundColor: theme.divider }]}
            />

            {/* 3. Edit Photo */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit Photo"
              style={({ pressed }) => [
                styles.menuRow,
                {
                  backgroundColor: pressed
                    ? isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)"
                    : "transparent",
                },
              ]}
              onPress={handleEditPress}>
              <Ionicons
                name="crop-outline"
                size={22}
                color={theme.text}
                style={styles.menuIcon}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.menuText, { color: theme.text }]}>
                Edit Photo
              </Text>
            </Pressable>

            <View
              style={[styles.rowDivider, { backgroundColor: theme.divider }]}
            />

            {/* 4. Delete Photo */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete Photo"
              style={({ pressed }) => [
                styles.menuRow,
                {
                  backgroundColor: pressed
                    ? isDark
                      ? "rgba(239, 68, 68, 0.12)"
                      : "rgba(239, 68, 68, 0.08)"
                    : "transparent",
                },
              ]}
              onPress={handleDeletePress}>
              <Ionicons
                name="trash-outline"
                size={22}
                color="#EF4444"
                style={styles.menuIcon}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.menuText, { color: "#EF4444" }]}>
                Delete Photo
              </Text>
            </Pressable>
          </View>

          {/* Separate Cancel Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={({ pressed }) => [
              styles.cancelCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={onClose}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.cancelText, { color: theme.text }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
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
  sheetWrapper: {
    gap: 10,
    zIndex: 2,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  menuCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.15)",
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuIcon: {
    marginRight: 14,
    width: 24,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
  cancelCard: {
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Colors,
  ThemeColors,
} from "@/components/constants/colors";
import {
  formatFollowerCount,
  useProfile,
  UserProfile,
} from "@/context/ProfileContext";
import AvatarPickerModal from "./AvatarPickerModal";
import PhotoEditorModal from "./PhotoEditorModal";
import PremiumDialogModal from "./PremiumDialogModal";
import UserAvatar from "./UserAvatar";

export type ProfileViewMode = "profile" | "settings" | "edit_profile";

export interface ProfileSectionProps {
  initialViewMode?: ProfileViewMode;
  user?: UserProfile;
  onUpdateUser?: (updated: Partial<UserProfile>) => Promise<void> | void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
}

interface DialogConfig {
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
}

export default function ProfileSection({
  initialViewMode = "profile",
  user: propUser,
  onUpdateUser,
  onLogout,
  onDeleteAccount,
}: ProfileSectionProps = {}) {
  const {
    profile: contextUser,
    isDark,
    setIsModalOpen,
    updateProfile,
    togglePauseNotifications,
    toggleDarkMode,
    logout: contextLogout,
    deleteAccount: contextDeleteAccount,
  } = useProfile();

  // Active user data from props or context
  const activeUser = propUser ?? contextUser;
  const theme: ThemeColors = isDark ? Colors.dark : Colors.light;

  const [viewMode, setViewMode] = useState<ProfileViewMode>(initialViewMode);

  // Avatar Bottom Sheet & Photo Editor States
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [photoEditorVisible, setPhotoEditorVisible] = useState(false);
  const [photoToEditUri, setPhotoToEditUri] = useState<string | null>(null);
  const [photoDimensions, setPhotoDimensions] = useState<{
    width?: number;
    height?: number;
  } | null>(null);

  // Custom Premium Dialog State
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    visible: false,
    title: "",
    message: "",
  });

  const showDialog = (config: Omit<DialogConfig, "visible">) => {
    setDialogConfig({ ...config, visible: true });
  };

  const closeDialog = () => {
    setDialogConfig((prev) => ({ ...prev, visible: false }));
  };

  // Sync modal state with root app to automatically fade/hide navbar
  React.useEffect(() => {
    setIsModalOpen(
      avatarPickerVisible || photoEditorVisible || dialogConfig.visible
    );
  }, [avatarPickerVisible, photoEditorVisible, dialogConfig.visible, setIsModalOpen]);

  // Edit Profile Form State initialized from real user profile
  const [editFullName, setEditFullName] = useState(activeUser.fullName);
  const [editPhone, setEditPhone] = useState(activeUser.phone);
  const [editEmail, setEditEmail] = useState(activeUser.email);
  const [editUsername, setEditUsername] = useState(activeUser.username);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync edit form when activeUser updates
  React.useEffect(() => {
    setEditFullName(activeUser.fullName);
    setEditPhone(activeUser.phone);
    setEditEmail(activeUser.email);
    setEditUsername(activeUser.username);
  }, [activeUser]);

  /* ========================================================================
     PHOTO PICKER & CAMERA ACTIONS
     ======================================================================== */
  const handlePickFromGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showDialog({
          title: "Permission Required",
          message:
            "Please grant photo library access in system settings to select an avatar.",
          iconName: "image-outline",
          primaryButtonText: "OK",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false, // Handled inside our circular PhotoEditorModal
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedAsset = result.assets[0];
        setPhotoToEditUri(pickedAsset.uri);
        setPhotoDimensions({
          width: pickedAsset.width,
          height: pickedAsset.height,
        });
        setPhotoEditorVisible(true);
      }
    } catch (err) {
      showDialog({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to open gallery.",
        iconName: "alert-circle-outline",
        primaryButtonText: "OK",
      });
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showDialog({
          title: "Permission Required",
          message:
            "Please grant camera access in system settings to take an avatar photo.",
          iconName: "camera-outline",
          primaryButtonText: "OK",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const takenAsset = result.assets[0];
        setPhotoToEditUri(takenAsset.uri);
        setPhotoDimensions({
          width: takenAsset.width,
          height: takenAsset.height,
        });
        setPhotoEditorVisible(true);
      }
    } catch (err) {
      showDialog({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to launch camera.",
        iconName: "alert-circle-outline",
        primaryButtonText: "OK",
      });
    }
  };

  const handleAvatarPress = () => {
    setAvatarPickerVisible(true);
  };

  const handleRemoveAvatar = async () => {
    if (onUpdateUser) {
      await onUpdateUser({ avatarUri: null });
    } else {
      await updateProfile({ avatarUri: null });
    }
  };

  const handleSaveCroppedPhoto = async (finalUri: string) => {
    if (onUpdateUser) {
      await onUpdateUser({ avatarUri: finalUri });
    } else {
      await updateProfile({ avatarUri: finalUri });
    }
  };

  const handleSave = async () => {
    if (!editFullName.trim()) {
      showDialog({
        title: "Validation Error",
        message: "Full name cannot be empty.",
        iconName: "alert-circle-outline",
        primaryButtonText: "OK",
      });
      return;
    }
    if (!editEmail.trim() || !editEmail.includes("@")) {
      showDialog({
        title: "Validation Error",
        message: "Please provide a valid email address.",
        iconName: "alert-circle-outline",
        primaryButtonText: "OK",
      });
      return;
    }

    setIsSaving(true);
    const updates: Partial<UserProfile> = {
      fullName: editFullName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      username: editUsername.trim().startsWith("@")
        ? editUsername.trim()
        : `@${editUsername.trim()}`,
    };

    if (onUpdateUser) {
      await onUpdateUser(updates);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setViewMode("profile");
      }, 500);
    } else {
      const res = await updateProfile(updates);
      setIsSaving(false);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setViewMode("profile");
        }, 500);
      } else {
        showDialog({
          title: "Error",
          message: res.error ?? "Failed to save profile changes.",
          iconName: "alert-circle-outline",
          primaryButtonText: "OK",
        });
      }
    }
  };

  const handleLogout = () => {
    showDialog({
      title: "Log Out",
      message: "Are you sure you want to log out of your Angel account?",
      iconName: "log-out-outline",
      primaryButtonText: "Log Out",
      primaryButtonDestructive: true,
      secondaryButtonText: "Cancel",
      onPrimaryPress: () => {
        if (onLogout) {
          onLogout();
        } else {
          contextLogout();
        }
      },
    });
  };

  const handleDeleteAccount = () => {
    showDialog({
      title: "Delete Account",
      message:
        "This action is permanent and will permanently erase all your data. Are you sure?",
      iconName: "alert-circle-outline",
      primaryButtonText: "Delete Permanently",
      primaryButtonDestructive: true,
      secondaryButtonText: "Cancel",
      onPrimaryPress: () => {
        if (onDeleteAccount) {
          onDeleteAccount();
        } else {
          contextDeleteAccount();
        }
      },
    });
  };

  /* ========================================================================
     SCREEN 3: EDIT PROFILE VIEW
     ======================================================================== */
  const renderEditProfileView = () => (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backButton, { backgroundColor: theme.iconButtonBg }]}
          onPress={() => setViewMode("settings")}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>
          Edit Profile
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Large Avatar with Signature Camera Badge */}
      <View style={styles.avatarEditContainer}>
        <Pressable
          style={styles.avatarWrapperLarge}
          onPress={handleAvatarPress}
          accessibilityRole="button"
          accessibilityLabel="Change avatar">
          <UserAvatar
            uri={activeUser.avatarUri}
            name={activeUser.fullName}
            size={100}
            isDark={isDark}
            borderWidth={2}
            borderColor={theme.border}
          />
          <View
            style={[
              styles.cameraBadge,
              {
                backgroundColor: theme.cameraBadgeBg,
                borderColor: theme.background,
              },
            ]}>
            <Ionicons name="camera" size={14} color={theme.cameraBadgeIcon} />
          </View>
        </Pressable>
        <Pressable onPress={handleAvatarPress} style={styles.changePhotoPill}>
          <Text
            style={[styles.changePhotoText, { color: theme.text }]}>
            Change & Edit Photo
          </Text>
        </Pressable>
      </View>

      {/* Dynamic Form Group */}
      <View
        style={[
          styles.formGroup,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}>
        <View style={styles.inputRow}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Full name
          </Text>
          <TextInput
            style={[styles.inputField, { color: theme.text }]}
            value={editFullName}
            onChangeText={setEditFullName}
            placeholder="Your Name"
            placeholderTextColor={theme.textMuted}
            autoCorrect={false}
          />
        </View>

        <View style={[styles.inputDivider, { backgroundColor: theme.divider }]} />

        <View style={styles.inputRow}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Phone number
          </Text>
          <TextInput
            style={[styles.inputField, { color: theme.text }]}
            value={editPhone}
            onChangeText={setEditPhone}
            placeholder="0000-0000-0000"
            placeholderTextColor={theme.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={[styles.inputDivider, { backgroundColor: theme.divider }]} />

        <View style={styles.inputRow}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Email
          </Text>
          <TextInput
            style={[styles.inputField, { color: theme.text }]}
            value={editEmail}
            onChangeText={setEditEmail}
            placeholder="youremail@email.com"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={[styles.inputDivider, { backgroundColor: theme.divider }]} />

        <View style={styles.inputRow}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Username
          </Text>
          <TextInput
            style={[styles.inputField, { color: theme.text }]}
            value={editUsername}
            onChangeText={setEditUsername}
            placeholder="@yourname"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Signature Green-Teal Save Changes CTA Button (In both light & dark mode) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save Changes"
        disabled={isSaving}
        style={({ pressed }) => [
          styles.saveButton,
          {
            backgroundColor: theme.buttonPrimary,
            opacity: pressed || isSaving ? 0.85 : 1,
          },
        ]}
        onPress={handleSave}>
        {isSaving ? (
          <ActivityIndicator color={theme.buttonPrimaryText} size="small" />
        ) : (
          <Text
            style={[styles.saveButtonText, { color: theme.buttonPrimaryText }]}>
            {saveSuccess ? "Changes Saved!" : "Save Changes"}
          </Text>
        )}
      </Pressable>

      {/* Delete Account Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete Account"
        style={({ pressed }) => [
          styles.deleteButton,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
        onPress={handleDeleteAccount}>
        <Text style={[styles.deleteButtonText, { color: theme.textSecondary }]}>
          Delete Account
        </Text>
      </Pressable>
    </ScrollView>
  );

  /* ========================================================================
     SCREEN 2: SETTINGS VIEW
     ======================================================================== */
  const renderSettingsView = () => (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to profile"
          style={[styles.backButton, { backgroundColor: theme.iconButtonBg }]}
          onPress={() => setViewMode("profile")}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* User Profile Card Item */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit your profile"
        style={({ pressed }) => [
          styles.userCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={() => setViewMode("edit_profile")}>
        <UserAvatar
          uri={activeUser.avatarUri}
          name={activeUser.fullName}
          size={48}
          isDark={isDark}
          borderWidth={1}
          borderColor={theme.border}
        />
        <View style={styles.userCardInfo}>
          <Text style={[styles.userCardName, { color: theme.text }]}>
            {activeUser.fullName}
          </Text>
          <Text
            style={[
              styles.userCardUsername,
              { color: theme.textSecondary },
            ]}>
            {activeUser.username}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.icon} />
      </Pressable>

      {/* Group 1: Notifications & General Settings */}
      <View
        style={[
          styles.cardGroup,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelWrap}>
            <Ionicons
              name="notifications-off-outline"
              size={19}
              color={theme.icon}
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, { color: theme.text }]}>
              Pause notifications
            </Text>
          </View>
          <Switch
            value={activeUser.notificationsPaused}
            onValueChange={togglePauseNotifications}
            trackColor={{
              false: theme.switchTrackOff,
              true: theme.switchTrackOn,
            }}
            thumbColor={
              activeUser.notificationsPaused
                ? theme.switchThumbOn
                : theme.switchThumbOff
            }
          />
        </View>

        <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />

        <Pressable
          style={styles.settingRow}
          onPress={() => Alert.alert("General Settings", "Configured.")}>
          <View style={styles.settingLabelWrap}>
            <Ionicons
              name="options-outline"
              size={19}
              color={theme.icon}
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, { color: theme.text }]}>
              General settings
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.icon} />
        </Pressable>
      </View>

      {/* Group 2: Dark Mode, Language, Contacts */}
      <View
        style={[
          styles.cardGroup,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelWrap}>
            <Ionicons
              name="moon-outline"
              size={19}
              color={theme.icon}
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, { color: theme.text }]}>
              Dark mode
            </Text>
          </View>
          <Switch
            value={activeUser.darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{
              false: theme.switchTrackOff,
              true: theme.switchTrackOn,
            }}
            thumbColor={
              activeUser.darkMode ? theme.switchThumbOn : theme.switchThumbOff
            }
          />
        </View>

        <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />

        <Pressable
          style={styles.settingRow}
          onPress={() => Alert.alert("Language", `Current: ${activeUser.language}`)}>
          <View style={styles.settingLabelWrap}>
            <Ionicons
              name="language-outline"
              size={19}
              color={theme.icon}
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, { color: theme.text }]}>
              Language
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.icon} />
        </Pressable>

        <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />

        <Pressable
          style={styles.settingRow}
          onPress={() => Alert.alert("My Contact", "Syncing contacts...")}>
          <View style={styles.settingLabelWrap}>
            <Ionicons
              name="people-outline"
              size={19}
              color={theme.icon}
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, { color: theme.text }]}>
              My Contact
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.icon} />
        </Pressable>
      </View>

      {/* Group 3: Help & Policies */}
      <View
        style={[
          styles.cardGroup,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}>
        <Pressable
          style={styles.settingRow}
          onPress={() => Alert.alert("FAQ", "Frequently Asked Questions")}>
          <View style={styles.settingLabelWrap}>
            <Ionicons
              name="help-circle-outline"
              size={19}
              color={theme.icon}
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, { color: theme.text }]}>
              FAQ
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.icon} />
        </Pressable>

        <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />

        <Pressable
          style={styles.settingRow}
          onPress={() => Alert.alert("Terms of Service", "Terms & Conditions")}>
          <View style={styles.settingLabelWrap}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={theme.icon}
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, { color: theme.text }]}>
              Terms of service
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.icon} />
        </Pressable>

        <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />

        <Pressable
          style={styles.settingRow}
          onPress={() => Alert.alert("User Policy", "Privacy & Security Policy")}>
          <View style={styles.settingLabelWrap}>
            <Ionicons
              name="shield-checkmark-outline"
              size={19}
              color={theme.icon}
              style={styles.settingIcon}
            />
            <Text style={[styles.settingText, { color: theme.text }]}>
              User policy
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.icon} />
        </Pressable>
      </View>

      {/* Log Out Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log Out"
        style={({ pressed }) => [
          styles.logoutButton,
          {
            backgroundColor: theme.logoutBg,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={theme.danger} />
        <Text style={[styles.logoutText, { color: theme.danger }]}>
          Log Out
        </Text>
      </Pressable>
    </ScrollView>
  );

  /* ========================================================================
     SCREEN 1: MAIN PROFILE VIEW (Without feed, challenge, or badge)
     ======================================================================== */
  const renderMainProfileView = () => (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Top Header: "My profile" | Streak flame | Settings Gear */}
      <View style={styles.profileHeader}>
        <Text style={[styles.profileHeaderTitle, { color: theme.text }]}>
          My profile
        </Text>
        <View style={styles.profileHeaderActions}>
          {/* Flame Streak Pill */}
          <View
            style={[
              styles.streakPill,
              {
                backgroundColor: theme.streakBg,
                borderColor: theme.border,
              },
            ]}>
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={[styles.streakCount, { color: theme.text }]}>
              {activeUser.streakCount}
            </Text>
          </View>
          {/* Settings Gear Icon Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            style={[
              styles.settingsIconButton,
              {
                backgroundColor: theme.iconButtonBg,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setViewMode("settings")}>
            <Ionicons name="settings-outline" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {/* Profile Hero: Avatar, Name + Signature Green-Teal Verified Badge, Follower Counts */}
      <View style={styles.heroSection}>
        <Pressable
          onPress={handleAvatarPress}
          style={[
            styles.avatarGlowRing,
            {
              borderColor: isDark
                ? "rgba(255,255,255,0.15)"
                : "rgba(0,0,0,0.08)",
            },
          ]}>
          <UserAvatar
            uri={activeUser.avatarUri}
            name={activeUser.fullName}
            size={90}
            isDark={isDark}
            style={styles.avatarMain}
          />
        </Pressable>

        <View style={styles.nameRow}>
          <Text style={[styles.profileName, { color: theme.text }]}>
            {activeUser.fullName}
          </Text>
          {/* Signature Green-Teal Verified Badge (in both dark & light mode) */}
          {activeUser.isVerified && (
            <View
              style={[
                styles.verifiedBadge,
                { backgroundColor: theme.verifiedBadgeBg },
              ]}>
              <Ionicons
                name="checkmark"
                size={12}
                color={theme.verifiedBadgeIcon}
              />
            </View>
          )}
        </View>

        <Text style={[styles.statsText, { color: theme.textSecondary }]}>
          {formatFollowerCount(activeUser.followersCount)} followers ·{" "}
          {activeUser.followingCount} following
        </Text>
      </View>

      {/* Menu Cards (Excluding post feed, challenge, & badge pills as requested) */}
      <View style={styles.menuSection}>
        {/* User Account Card */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit Profile details"
          style={({ pressed }) => [
            styles.userCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => setViewMode("edit_profile")}>
          <UserAvatar
            uri={activeUser.avatarUri}
            name={activeUser.fullName}
            size={48}
            isDark={isDark}
            borderWidth={1}
            borderColor={theme.border}
          />
          <View style={styles.userCardInfo}>
            <Text style={[styles.userCardName, { color: theme.text }]}>
              {activeUser.fullName}
            </Text>
            <Text
              style={[
                styles.userCardUsername,
                { color: theme.textSecondary },
              ]}>
              {activeUser.username}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.icon} />
        </Pressable>

        {/* Preferences Group */}
        <View
          style={[
            styles.cardGroup,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelWrap}>
              <Ionicons
                name="notifications-off-outline"
                size={19}
                color={theme.icon}
                style={styles.settingIcon}
              />
              <Text style={[styles.settingText, { color: theme.text }]}>
                Pause notifications
              </Text>
            </View>
            <Switch
              value={activeUser.notificationsPaused}
              onValueChange={togglePauseNotifications}
              trackColor={{
                false: theme.switchTrackOff,
                true: theme.switchTrackOn,
              }}
              thumbColor={
                activeUser.notificationsPaused
                  ? theme.switchThumbOn
                  : theme.switchThumbOff
              }
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelWrap}>
              <Ionicons
                name="moon-outline"
                size={19}
                color={theme.icon}
                style={styles.settingIcon}
              />
              <Text style={[styles.settingText, { color: theme.text }]}>
                Dark mode
              </Text>
            </View>
            <Switch
              value={activeUser.darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{
                false: theme.switchTrackOff,
                true: theme.switchTrackOn,
              }}
              thumbColor={
                activeUser.darkMode ? theme.switchThumbOn : theme.switchThumbOff
              }
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />

          <Pressable
            style={styles.settingRow}
            onPress={() => setViewMode("edit_profile")}>
            <View style={styles.settingLabelWrap}>
              <Ionicons
                name="person-outline"
                size={19}
                color={theme.icon}
                style={styles.settingIcon}
              />
              <Text style={[styles.settingText, { color: theme.text }]}>
                Edit profile details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.icon} />
          </Pressable>
        </View>

        {/* Support & Policies Group */}
        <View
          style={[
            styles.cardGroup,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <Pressable
            style={styles.settingRow}
            onPress={() => Alert.alert("FAQ", "Frequently Asked Questions")}>
            <View style={styles.settingLabelWrap}>
              <Ionicons
                name="help-circle-outline"
                size={19}
                color={theme.icon}
                style={styles.settingIcon}
              />
              <Text style={[styles.settingText, { color: theme.text }]}>
                FAQ
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.icon} />
          </Pressable>

          <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />

          <Pressable
            style={styles.settingRow}
            onPress={() => Alert.alert("Terms of Service", "Terms & Conditions")}>
            <View style={styles.settingLabelWrap}>
              <Ionicons
                name="information-circle-outline"
                size={19}
                color={theme.icon}
                style={styles.settingIcon}
              />
              <Text style={[styles.settingText, { color: theme.text }]}>
                Terms of service
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.icon} />
          </Pressable>
        </View>

        {/* Log Out Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log Out"
          style={({ pressed }) => [
            styles.logoutButton,
            {
              backgroundColor: theme.logoutBg,
              borderColor: theme.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={theme.danger} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>
            Log Out
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {viewMode === "edit_profile" && renderEditProfileView()}
      {viewMode === "settings" && renderSettingsView()}
      {viewMode === "profile" && renderMainProfileView()}

      {/* Modern Premium Avatar Picker Bottom Sheet */}
      <AvatarPickerModal
        visible={avatarPickerVisible}
        hasCustomPhoto={Boolean(activeUser.avatarUri)}
        isDark={isDark}
        onClose={() => setAvatarPickerVisible(false)}
        onPickFromGallery={handlePickFromGallery}
        onTakePhoto={handleTakePhoto}
        onEditPhoto={() => {
          if (activeUser.avatarUri) {
            setPhotoToEditUri(activeUser.avatarUri);
            setPhotoDimensions(null);
            setPhotoEditorVisible(true);
          } else {
            showDialog({
              title: "No Photo to Edit",
              message:
                "You haven't uploaded a photo yet. Choose one from your library to edit.",
              iconName: "image-outline",
              primaryButtonText: "Choose from Library",
              secondaryButtonText: "Cancel",
              onPrimaryPress: handlePickFromGallery,
            });
          }
        }}
        onDeletePhoto={() => {
          if (activeUser.avatarUri) {
            showDialog({
              title: "Delete Photo",
              message:
                "Are you sure you want to delete your profile photo? Your avatar will show your name's initial.",
              iconName: "trash-outline",
              primaryButtonText: "Delete Photo",
              primaryButtonDestructive: true,
              secondaryButtonText: "Cancel",
              onPrimaryPress: handleRemoveAvatar,
            });
          } else {
            showDialog({
              title: "Default Avatar",
              message:
                "You are already using the default avatar with your name's initial.",
              iconName: "information-circle-outline",
              primaryButtonText: "Got It",
            });
          }
        }}
      />

      {/* Modern Premium Strictly-Circular Photo Editor Modal */}
      <PhotoEditorModal
        visible={photoEditorVisible}
        imageUri={photoToEditUri}
        initialWidth={photoDimensions?.width}
        initialHeight={photoDimensions?.height}
        isDark={isDark}
        onClose={() => setPhotoEditorVisible(false)}
        onSave={handleSaveCroppedPhoto}
      />

      {/* Modern Premium Dialog Box Modal for Alerts & Confirmations */}
      <PremiumDialogModal
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        iconName={dialogConfig.iconName}
        primaryButtonText={dialogConfig.primaryButtonText}
        primaryButtonDestructive={dialogConfig.primaryButtonDestructive}
        secondaryButtonText={dialogConfig.secondaryButtonText}
        onPrimaryPress={dialogConfig.onPrimaryPress}
        onSecondaryPress={dialogConfig.onSecondaryPress}
        onClose={closeDialog}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },

  /* Navigation Headers */
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  profileHeaderTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  profileHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
  },
  streakFlame: {
    fontSize: 13,
  },
  streakCount: {
    fontSize: 13,
    fontWeight: "700",
  },
  settingsIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 36,
  },

  /* Hero Section */
  heroSection: {
    alignItems: "center",
    paddingVertical: 10,
  },
  avatarGlowRing: {
    padding: 3,
    borderRadius: 52,
    borderWidth: 2,
    marginBottom: 12,
  },
  avatarMain: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  statsText: {
    fontSize: 13,
    fontWeight: "500",
  },

  /* Menu Cards */
  menuSection: {
    marginTop: 20,
    gap: 14,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userCardInfo: {
    flex: 1,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  userCardUsername: {
    fontSize: 13,
  },

  cardGroup: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  settingLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 12,
    width: 22,
  },
  settingText: {
    fontSize: 15,
    fontWeight: "500",
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
  },

  /* Buttons */
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
  },

  /* Edit Profile Specific */
  avatarEditContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  avatarWrapperLarge: {
    position: "relative",
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  changePhotoPill: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  formGroup: {
    borderRadius: 20,
    paddingHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  inputLabel: {
    fontSize: 14,
    width: 110,
    fontWeight: "500",
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
    padding: 0,
  },
  inputDivider: {
    height: StyleSheet.hairlineWidth,
  },

  saveButton: {
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  deleteButton: {
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

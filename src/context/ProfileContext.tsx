import { useColorScheme as useDeviceColorScheme } from "@/hooks/useColorScheme";
import { createContext, ReactNode, useContext, useState } from "react";

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  email: string;
  avatarUri?: string | null;
  followersCount: number;
  followingCount: number;
  streakCount: number;
  isVerified: boolean;
  notificationsPaused: boolean;
  darkMode: boolean;
  language: string;
}

export interface ProfileContextValue {
  profile: UserProfile;
  isDark: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<{ success: boolean; error?: string }>;
  togglePauseNotifications: () => void;
  toggleDarkMode: () => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// Default initial user data for the session
const INITIAL_PROFILE: UserProfile = {
  id: "a54d54sd",
  fullName: "Dilkhush Jha",
  username: "@dilkhush",
  phone: "6205409820",
  email: "official.diljha@gmail.com",
  avatarUri: null,
  followersCount: 10240,
  followingCount: 142,
  streakCount: 5,
  isVerified: true,
  notificationsPaused: false,
  darkMode: true,
  language: "English",
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: Partial<UserProfile>;
}) {
  const deviceColorScheme = useDeviceColorScheme();
  const [profile, setProfile] = useState<UserProfile>({
    ...INITIAL_PROFILE,
    ...initialUser,
    darkMode:
      initialUser?.darkMode !== undefined
        ? initialUser.darkMode
        : deviceColorScheme === "dark",
  });

  const isDark = profile.darkMode;

  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Production validation
      if (updates.email && !updates.email.includes("@")) {
        return { success: false, error: "Please enter a valid email address." };
      }
      if (updates.username && !updates.username.startsWith("@")) {
        updates.username = `@${updates.username.trim()}`;
      }

      setProfile((prev) => ({
        ...prev,
        ...updates,
      }));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update profile",
      };
    }
  };

  const togglePauseNotifications = () => {
    setProfile((prev) => ({
      ...prev,
      notificationsPaused: !prev.notificationsPaused,
    }));
  };

  const toggleDarkMode = () => {
    setProfile((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };

  const logout = async () => {
    // Production logout hook (e.g. clear tokens, reset auth state)
    console.log("User logged out successfully");
  };

  const deleteAccount = async () => {
    // Production delete account hook
    console.log("Account deletion requested");
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isDark,
        isModalOpen,
        setIsModalOpen,
        updateProfile,
        togglePauseNotifications,
        toggleDarkMode,
        logout,
        deleteAccount,
      }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}

/**
 * Helper to format numeric counts like 10240 -> '10.2k'
 */
export function formatFollowerCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}k`;
  }
  return count.toString();
}

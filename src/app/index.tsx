import { Colors } from "@/components/constants/colors";
import BasicNavigationBar, {
  NavigationTab,
} from "@/components/navigation/BasicNavigationBar";
import ProfileSection from "@/components/profile/ProfileSection";
import { useProfile } from "@/context/ProfileContext";
import { useState } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_DATA: Record<
  NavigationTab,
  { title: string; desc: string; tag: string }
> = {
  home: {
    title: "Home",
    desc: "Your daily feed, updates, and community activity.",
    tag: "Feed",
  },
  partner: {
    title: "Partner",
    desc: "Discover connections, partners, and collaborative projects.",
    tag: "Connections",
  },
  search: {
    title: "Dhruv",
    desc: "Explore trending topics, people, and community channels.",
    tag: "Explore",
  },
  chat: {
    title: "Chat",
    desc: "Direct messages and recent conversation threads.",
    tag: "Messages",
  },
  profile: {
    title: "Profile",
    desc: "Your account details, security settings, and preferences.",
    tag: "Account",
  },
};

export default function Index() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>("profile");
  const insets = useSafeAreaInsets();
  const { isDark } = useProfile();
  const theme = isDark ? Colors.dark : Colors.light;

  const isProfileTab = currentTab === "profile";
  const tabInfo = TAB_DATA[currentTab];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: 0,
        },
      ]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Clean Top Header (Shown on other tabs, Profile has its own header) */}
      {!isProfileTab && (
        <View
          style={[
            styles.header,
            {
              borderBottomColor: theme.divider,
            },
          ]}>
          <Text style={[styles.brand, { color: theme.text }]}>Angel</Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: theme.surfaceElevated },
            ]}>
            <Text style={[styles.badgeText, { color: theme.text }]}>
              {tabInfo.tag}
            </Text>
          </View>
        </View>
      )}

      {/* Screen Body */}
      {isProfileTab ? (
        <View style={styles.profileContainer}>
          <ProfileSection />
        </View>
      ) : (
        <View style={styles.content}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {tabInfo.title}
            </Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
              {tabInfo.desc}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Navigation Bar */}
      <BasicNavigationBar
        selectedTab={currentTab}
        onTabChange={setCurrentTab}
        showLabels={true}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    flex: 1,
  },
  header: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  brand: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
});

import BasicNavigationBar, {
  NavigationTab,
} from "@/components/navigation/BasicNavigationBar";
import { useColorScheme } from "@/hooks/useColorScheme";
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
    title: "Search",
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
  const [currentTab, setCurrentTab] = useState<NavigationTab>("home");
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

  const tabInfo = TAB_DATA[currentTab];
  const bg = isDark ? "#0F0F0F" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#0F0F0F";
  const subtextColor = isDark ? "#AAAAAA" : "#606060";
  const cardBg = isDark ? "#181818" : "#F8F9FA";
  const cardBorder = isDark ? "#2A2A2A" : "#EEEEEE";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          paddingTop: insets.top,
          paddingBottom: 0,
        },
      ]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Clean Top Header (like YouTube / Instagram) */}
      <View style={styles.header}>
        <Text style={[styles.brand, { color: textColor }]}>Angel</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: isDark ? "#262626" : "#F0F0F0" },
          ]}>
          <Text style={[styles.badgeText, { color: textColor }]}>
            {tabInfo.tag}
          </Text>
        </View>
      </View>

      {/* Screen Body */}
      <View style={styles.content}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>
            {tabInfo.title}
          </Text>
          <Text style={[styles.cardDesc, { color: subtextColor }]}>
            {tabInfo.desc}
          </Text>
        </View>
      </View>

      {/* Bottom Navigation Bar */}
      <BasicNavigationBar
        selectedTab={currentTab}
        onTabChange={setCurrentTab}
        showLabels={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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

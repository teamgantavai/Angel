import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

export type NavigationTab = "home" | "partner" | "search" | "chat" | "profile";

export interface BasicNavigationBarProps {
  selectedTab?: NavigationTab;
  onTabChange?: (tab: NavigationTab) => void;
  showLabels?: boolean;
}

type IoniconName = keyof typeof Ionicons.glyphMap;

interface NavItemConfig {
  id: NavigationTab;
  label: string;
  iconName?: IoniconName;
  badge?: number;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: "home",
    label: "Home",
  },
  {
    id: "partner",
    label: "Partner",
    iconName: "people-outline",
  },
  {
    id: "search",
    label: "Search",
    iconName: "search-outline",
  },
  {
    id: "chat",
    label: "Chat",
    badge: 3,
  },
  {
    id: "profile",
    label: "Profile",
    iconName: "person-circle-outline",
  },
];

/**
 * Exact Instagram Home Icon (Fixed Full Stroke):
 * Maintains consistent stroke outline geometry without transforming into a solid block.
 */
function InstagramHomeIcon({
  size = 25,
  color = "#000000",
  active = false,
}: {
  size?: number;
  color?: string;
  active?: boolean;
}) {
  const strokeWidth = active ? 2.8 : 2.0;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 11.2 12 3.5l8.5 7.7V20a1.5 1.5 0 0 1-1.5 1.5h-4a1 1 0 0 1-1-1v-4.5a2 2 0 0 0-4 0V20a1 1 0 0 1-1 1H5A1.5 1.5 0 0 1 3.5 20v-8.8z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Exact User Chat Bubble Icon (Fixed Full Stroke):
 * Maintains consistent stroke outline geometry without morphing into a solid block.
 */
function ExactUserChatBubbleIcon({
  size = 25,
  color = "#000000",
  active = false,
}: {
  size?: number;
  color?: string;
  active?: boolean;
}) {
  const strokeWidth = active ? 2.8 : 2.2;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.5 11.5c0 5.25-4.25 9.5-9.5 9.5-1.4 0-2.75-.3-4-.85l-4.5 1.25a.8.8 0 0 1-1-.95l1.1-4.2A9.45 9.45 0 0 1 2.5 11.5C2.5 6.25 6.75 2 12 2s9.5 4.25 9.5 9.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function BasicNavigationBar({
  selectedTab: controlledTab,
  onTabChange,
  showLabels = true,
}: BasicNavigationBarProps = {}) {
  const [internalTab, setInternalTab] = useState<NavigationTab>("home");
  const activeTab = controlledTab ?? internalTab;
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleSelect = (tab: NavigationTab) => {
    if (controlledTab === undefined) {
      setInternalTab(tab);
    }
    onTabChange?.(tab);
  };

  // Modern YouTube / Instagram / Facebook palette
  const barBg = isDark ? "#000000" : "#FFFFFF";
  const borderTopColor = isDark ? "#262626" : "#E5E5E5";
  const activeColor = isDark ? "#FFFFFF" : "#000000";
  const inactiveColor = isDark ? "#8E8E93" : "#737373";

  return (
    <View
      style={[
        styles.barContainer,
        {
          backgroundColor: barBg,
          borderTopColor,
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const color = isActive ? activeColor : inactiveColor;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
            style={({ pressed }) => [
              styles.tabItem,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            onPress={() => handleSelect(item.id)}>
            <View style={styles.iconWrapper}>
              {item.id === "home" ? (
                <InstagramHomeIcon
                  size={25}
                  color={color}
                  active={isActive}
                />
              ) : item.id === "chat" ? (
                <ExactUserChatBubbleIcon
                  size={25}
                  color={color}
                  active={isActive}
                />
              ) : (
                <Ionicons
                  name={item.iconName as IoniconName}
                  size={25}
                  color={color}
                />
              )}

              {/* Notification Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </Text>
                </View>
              )}
            </View>

            {showLabels && (
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color,
                    fontWeight: isActive ? "700" : "400",
                  },
                ]}
                numberOfLines={1}>
                {item.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.04,
        shadowRadius: 1,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },
  iconWrapper: {
    width: 32,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#E11D48",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 11,
  },
});

export { BasicNavigationBar };

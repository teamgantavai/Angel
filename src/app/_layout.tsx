import { ProfileProvider } from "@/context/ProfileContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ProfileProvider>
  );
}

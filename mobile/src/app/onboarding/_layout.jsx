import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="create-wallet" />
      <Stack.Screen name="import-wallet" />
      <Stack.Screen name="wallet-ready" />
    </Stack>
  );
}

import { useEffect } from "react";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Search,
  ShieldCheck,
  UserCircle,
} from "lucide-react-native";
import useStore from "@/store/useStore";

export default function EnterpriseLayout() {
  const { checkEnterpriseVerification, isEnterpriseVerified, enterpriseVerificationLoading } = useStore();

  useEffect(() => {
    checkEnterpriseVerification();
  }, []);

  const isLocked = !isEnterpriseVerified && !enterpriseVerificationLoading;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_600SemiBold",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <LayoutDashboard color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="issue"
        options={{
          title: "Issue",
          tabBarIcon: ({ color }) => (
            <PlusCircle color={isLocked ? "#d1d5db" : color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="workers"
        options={{
          title: "Workers",
          tabBarIcon: ({ color }) => (
            <Users color={isLocked ? "#d1d5db" : color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => (
            <Search color={isLocked ? "#d1d5db" : color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="verify"
        options={{
          title: "Verify",
          tabBarIcon: ({ color }) => (
            <ShieldCheck color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <UserCircle color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}

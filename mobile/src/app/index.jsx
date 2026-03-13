import { useEffect } from "react";
import { useRouter } from "expo-router";
import useStore from "@/store/useStore";

export default function Index() {
  const router = useRouter();
  const { isInitialized, role } = useStore();

  useEffect(() => {
    if (!isInitialized) {
      router.replace("/onboarding/welcome");
    } else if (role === "worker") {
      router.replace("/(worker)");
    } else if (role === "enterprise") {
      router.replace("/(enterprise)");
    } else {
      router.replace("/onboarding/role-selection");
    }
  }, [isInitialized, role, router]);

  return null;
}

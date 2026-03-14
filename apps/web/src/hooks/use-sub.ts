import { subscribeUser, unsubscribeUser } from "@/lib/push";
import { urlBase64ToUint8Array } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useSubscriptions() {
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker().then(() => setIsLoading(false));
    }
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    const sub = await registration.pushManager.getSubscription();
    console.log("sub", sub);
    setSubscription(sub);
  }

  const subscribeToPush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      setSubscription(sub);
     await subscribeUser(sub)
     // .catch(() => {
     //    toast.error("Failed to subscribe to push notifications");
     //  });
    } catch (err) {
      console.log("error", err);
    }
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    if (subscription) {
      await subscription?.unsubscribe();
      setSubscription(null);
      unsubscribeUser(subscription).catch(() => {
        toast.error("Failed to unsubscribe from push notifications");
      });
    }
  }, [subscription]);
  return {
    isSupported,
    loading,
    subscription,
    subscribeToPush,
    unsubscribeFromPush,
  };
}

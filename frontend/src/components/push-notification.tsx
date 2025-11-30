import { useSubscriptions } from "@/hooks/use-sub";
import { Switch } from "./ui/switch";

export function PushNotificationManager() {
  const {
    isSupported,
    subscription,
    subscribeToPush,
    unsubscribeFromPush,
    loading,
  } = useSubscriptions();
  // const [message, setMessage] = useState("");
  // async function sendTestNotification() {
  //   if (subscription) {
  //     await sendNotification(message, "Test Notification", subscription)
  //     setMessage('')
  //   }
  // }
  if (loading) {
    return null;
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>;
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribeToPush();
    } else {
      await unsubscribeFromPush();
    }
  };

  const isSubscribed = Boolean(subscription);

  return (
    // <div className="flex flex-col gap-3">
    <Switch
      id="pushNotifications"
      checked={isSubscribed}
      onCheckedChange={handleToggle}
    />
  );
  {
    /*{isSubscribed && (
        <div className="flex flex-col gap-2">
          <Input
            type="text"
            placeholder="Enter notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border p-2 rounded-md text-sm"
          />
          <div>
            <Button
             onClick={sendTestNotification}
            >
              Send Test
            </Button>
          </div>
        </div>
      )}*/
  }
  {
    /*</div>*/
  }
}

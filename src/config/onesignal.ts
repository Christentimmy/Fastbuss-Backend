import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const sendPushNotification = async (
  playerId: string, 
  message: string,
  title?: string,
  link?: string
) => {
  const oneSignalAppId = process.env.ONESIGNAL_APP_ID;
  const oneSignalApiKey = process.env.ONESIGNAL_API_KEY;

  if (!playerId) {
    console.warn(`User has no OneSignal Player ID, skipping push notification.`);
    return;
  }

  const payload = {
    app_id: oneSignalAppId,
    include_player_ids: [playerId], // OneSignal Player ID
    headings: { en: title || "New Notification" },
    contents: { en: message },
    url: link, // Optional deep link
  };

  try {
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      payload,
      {
        headers: {
          Authorization: `Basic ${oneSignalApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending push notification:", error.response?.data || error.message);
  }
};

export default sendPushNotification;
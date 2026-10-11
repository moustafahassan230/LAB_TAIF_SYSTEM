import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { supabase } from "./lib/supabase.js";

const WEB_PUSH_VAPID_PUBLIC_KEY =
  "BFhHOUkSNbeZVDoTHVy77AQSJcU8wcdZXb8ye_If5fzfPlBlRvDdHV3qSvLUtoYsgZTWUt5dhyyVSjwUkX4XBMw";

const WEB_PUSH_SW_PATH = "/sw.js";

let nativeListenersRegistered = false;
let webPushInitialized = false;

/* =========================================================
   WEB PUSH HELPERS
========================================================= */

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (
    base64String +
    padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) => char.charCodeAt(0))
  );
}

async function saveWebPushSubscription(subscription) {
  try {
    if (!subscription) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      console.log(
        "LAB TAIF WEB PUSH: No authenticated user."
      );
      return;
    }

    const json = subscription.toJSON();

    const endpoint = json.endpoint;
    const p256dh = json.keys?.p256dh;
    const auth = json.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      console.error(
        "LAB TAIF WEB PUSH: Invalid subscription."
      );
      return;
    }

    const { error } = await supabase
      .from("web_push_subscriptions")
      .upsert(
        {
          user_id: session.user.id,
          endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        }
      );

    if (error) {
      console.error(
        "LAB TAIF WEB PUSH: Failed to save subscription:",
        error
      );
      return;
    }

    console.log(
      "LAB TAIF WEB PUSH: Subscription saved successfully."
    );
  } catch (error) {
    console.error(
      "LAB TAIF WEB PUSH: Save subscription error:",
      error
    );
  }
}

async function initWebPush() {
  if (webPushInitialized) return;

  webPushInitialized = true;

  try {
    if (!("serviceWorker" in navigator)) {
      console.log(
        "LAB TAIF WEB PUSH: Service Worker not supported."
      );
      return;
    }

    if (!("PushManager" in window)) {
      console.log(
        "LAB TAIF WEB PUSH: Push API not supported."
      );
      return;
    }

    if (!("Notification" in window)) {
      console.log(
        "LAB TAIF WEB PUSH: Notifications API not supported."
      );
      return;
    }

    const registration =
      await navigator.serviceWorker.register(
        WEB_PUSH_SW_PATH
      );

    console.log(
      "LAB TAIF WEB PUSH: Service Worker registered."
    );

    let permission = Notification.permission;

    console.log(
      "LAB TAIF WEB PUSH: Current permission:",
      permission
    );

    if (permission === "default") {
      permission =
        await Notification.requestPermission();

      console.log(
        "LAB TAIF WEB PUSH: Requested permission:",
        permission
      );
    }

    if (permission !== "granted") {
      console.log(
        "LAB TAIF WEB PUSH: Permission not granted."
      );
      return;
    }

    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(
              WEB_PUSH_VAPID_PUBLIC_KEY
            ),
        });

      console.log(
        "LAB TAIF WEB PUSH: New subscription created."
      );
    } else {
      console.log(
        "LAB TAIF WEB PUSH: Existing subscription found."
      );
    }

    await saveWebPushSubscription(subscription);
  } catch (error) {
    console.error(
      "LAB TAIF WEB PUSH: Initialization error:",
      error
    );
  }
}

/* =========================================================
   NATIVE TOKEN
========================================================= */

async function saveDeviceToken(token) {
  try {
    if (!token) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      console.log(
        "LAB TAIF: No authenticated user. Device token was not saved."
      );
      return;
    }

    const platform = Capacitor.getPlatform();

    const { error } = await supabase
      .from("device_tokens")
      .upsert(
        {
          user_id: session.user.id,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "token",
        }
      );

    if (error) {
      console.error(
        "LAB TAIF: Failed to save device token:",
        error
      );
      return;
    }

    console.log(
      "LAB TAIF: Device token saved successfully."
    );
  } catch (error) {
    console.error(
      "LAB TAIF: Device token save error:",
      error
    );
  }
}

/* =========================================================
   NATIVE ANDROID / IOS
========================================================= */

async function registerNativeNotificationListeners() {
  if (nativeListenersRegistered) return;

  nativeListenersRegistered = true;

  await PushNotifications.addListener(
    "registration",
    async (token) => {
      console.log(
        "LAB TAIF: Push registration successful."
      );

      await saveDeviceToken(token.value);
    }
  );

  await PushNotifications.addListener(
    "registrationError",
    (error) => {
      console.error(
        "LAB TAIF NOTIFICATION REGISTRATION ERROR:",
        error
      );
    }
  );

  await PushNotifications.addListener(
    "pushNotificationReceived",
    (notification) => {
      console.log(
        "LAB TAIF NOTIFICATION RECEIVED:",
        notification
      );
    }
  );

  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action) => {
      console.log(
        "LAB TAIF NOTIFICATION ACTION:",
        action
      );
    }
  );
}

/* =========================================================
   MAIN
========================================================= */

export async function initNotifications() {
  try {
    console.log(
      "LAB TAIF: Starting notifications..."
    );

    /*
      WEB
    */
    if (!Capacitor.isNativePlatform()) {
      console.log(
        "LAB TAIF: Web detected - starting Web Push..."
      );

      await initWebPush();

      return;
    }

    /*
      ANDROID / IOS
    */
    await registerNativeNotificationListeners();

    let permission =
      await PushNotifications.checkPermissions();

    console.log(
      "LAB TAIF: Current notification permission:",
      permission.receive
    );

    if (permission.receive !== "granted") {
      permission =
        await PushNotifications.requestPermissions();

      console.log(
        "LAB TAIF: Requested notification permission:",
        permission.receive
      );
    }

    if (permission.receive !== "granted") {
      console.log(
        "LAB TAIF: Notifications permission denied."
      );

      return;
    }

    await PushNotifications.register();

    console.log(
      "LAB TAIF: Device registration requested successfully."
    );
  } catch (error) {
    console.error(
      "LAB TAIF: Notification initialization error:",
      error
    );
  }
}
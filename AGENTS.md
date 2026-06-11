# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Local run / physical-device test notes

Status: build complete (0 TS errors, Phases 4/6/7/8 done). Currently in local run/test phase on a physical Android phone via Expo Go (started 2026-06-06).

## Start Metro
```
npx expo start
```
Use the **plain** command — no `--lan` (threw `ERR_STREAM_PREMATURE_CLOSE`) and no `--tunnel` (needs `@expo/ngrok`, not installed). Plain start displays a scannable QR like `exp://192.168.7.4:8082`.

## Requirements before scanning the QR
- Backend must be running (`npm run dev` in `../backend`) and reachable — `mobile/.env` → `EXPO_PUBLIC_API_URL=http://192.168.7.4:5000/api/v1` must point at the PC's current LAN IP (find via `Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" }`). If the IP changes, update this and restart Expo.
- Phone and PC must be on the **same WiFi**.
- Phone needs an **Expo Go build matching SDK 56** — the Play Store version often lags and throws "Project is incompatible with this version of Expo Go". Fix: download directly from `expo.dev/go` (auto-detects the right SDK build), not the Play Store.
- On first connect you may see "recommended to log in with your Expo account" / "unverified app" prompts — choose **Proceed anonymously**.

## Razorpay webhook security
The backend verifies each webhook payload with HMAC-SHA256 (`rawBody + RAZORPAY_WEBHOOK_SECRET`). As defense-in-depth, **allowlist Razorpay's static IPs** in your firewall/hosting platform. Current documented IPs: `52.44.130.86`, `52.44.130.87`, `52.90.3.196`, `52.90.3.197`, `54.210.151.36`, `54.210.151.37` — always verify the latest list at `razorpay.com/docs/webhooks/setup-edit` before deploying, as they can change.

## Cron-in-same-process risk (production)
All three cron jobs (`generate-dues`, `payment-reminder`, `event-reminder`) run in the same Node.js process as the HTTP server. This is fine for a single-instance deployment but **will fire duplicate tasks if you scale horizontally** (e.g. two EC2 instances, two Railway replicas, etc.). In that scenario replace the cron jobs with one of:
- A dedicated worker dyno/container that runs only cron (and is scaled to exactly 1 replica)
- A distributed lock (e.g. `redlock` over Redis) that ensures only one instance fires per tick
- A managed scheduler service (AWS EventBridge, Railway Cron, etc.) that invokes a protected internal endpoint

## Known incompatibilities already patched (don't re-break these)
- `react-native-razorpay` is a native module that crashes Expo Go ("something went wrong"). It's mocked at `src/lib/razorpay-mock.ts` and imported in `src/features/payments/hooks/usePayments.ts:3` instead of the real package. Real payment testing requires `eas build --profile development`.
- `app.json` → `android.adaptiveIcon` and the `expo-notifications` plugin icon were repointed to files that actually exist in `/assets` (`android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`) — the original `adaptive-icon.png`/`notification-icon.png` referenced don't exist and break asset resolution.
- `expo-notifications` remote push was removed from Expo Go in SDK 53+ — merely *importing* the real module crashes the whole app at startup with `[runtime not ready]: Error: expo-notifications: ... addPushTokenListener` (blocks every screen from rendering). It's mocked at `src/lib/notifications-mock.ts` and imported in `src/hooks/usePushNotifications.ts` instead of the real package. Real push notification testing requires `eas build --profile development`.

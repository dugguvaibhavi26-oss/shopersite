# shopersite: Android & iOS App Setup

One codebase now serves three targets: the website, an Android app, and an iOS app. The apps are
built with [Capacitor 8](https://capacitorjs.com/) around the existing Next.js site.

| | |
|---|---|
| App name | `shopersite` |
| Android application ID / iOS bundle ID | `com.roxten.shopersite` |
| Version | `1.0.0` (Android `versionCode 1`, iOS build `1`) |
| Android project | `android/` (open in Android Studio) |
| iOS project | `ios/App/App.xcodeproj` (open in Xcode on a Mac) |
| Capacitor config | `capacitor.config.ts` |
| Production site the apps load | `https://shopersite-app.vercel.app` (change with `CAP_SERVER_URL`) |
| Minimum OS | Android 7.0 (API 24), iOS 15 |
| Android target / compile SDK | 36 |

---

## 1. How it works (architecture)

The project was analysed before anything changed. Here is what was found:

- **Framework:** Next.js 16 (App Router), React 19, Tailwind 4. Built with `next build`, served by `next start` / Vercel.
- **Needs a server:** `src/middleware.ts` rewrites store subdomains (`roxtenn.shopersite.in`) to `/s/[subdomain]`, and the store, product, category and order routes are dynamic (`ƒ` in the build output). A static export (`output: "export"`) would break them.
- **Data and auth:** all in the browser through the Firebase client SDK (Firestore, Firebase Auth with email/password and Google). The Postgres / Drizzle code (`src/db`) is schema only and is not used by any page.
- **Payments:** sellers pay the platform by UPI (QR code and `upi://pay` deep link). Buyers pay sellers directly (COD, UPI, payment link, bank transfer). There is no card SDK inside the app.

**Chosen design:** the apps are native shells that open the deployed site (`server.url`). The website code, Firebase project, routes, middleware and business logic are shared exactly. The local folder `mobile/www` only holds an offline page shown when the site can't be reached.

What this means in practice:

- **Deploying the website updates the apps.** No store release is needed for web changes. A new store build is needed only for changes to `android/`, `ios/`, `capacitor.config.ts`, plugins, icons or permissions.
- **The website must be redeployed once with this change** so the deployed site contains the app bridge (back button, link handling, native Google sign-in). Until then the app opens the old site and those app features are missing.
- The app needs an internet connection, just like the website. Without one it shows an offline screen with a "Try again" button, and an offline banner while you're using it.

### How the app starts (onboarding and login)

The app opens at `/app` (`server.appStartPath`), never the website's marketing home page:

| Who | Where they land |
|---|---|
| Signed in | Straight to the dashboard. Onboarding and login never show again until they log out. |
| Signed out, onboarding already seen or skipped | App login screen `/app/login` |
| First launch | Onboarding slides `/app/welcome`: Build, Share, Get paid. The last slide offers **Create my shop** (the step-by-step signup at `/register`) and **I already have a shop** (app login). |

The screens use the photo-led design: the website's drifting product photos on top and a white sheet with the content below. Onboarding is remembered on the phone, and Firebase keeps the login. Inside the app, the website home page (`/`) and desktop login (`/login`) are swapped for these screens. Logging out from the dashboard therefore lands on the app login. Files: `src/app/app/` (launch, welcome, login), `src/components/app/photo-hero.tsx` and `src/lib/native/app-start.ts`.

These pages are part of the website, so **the website must be deployed before a production app build can open them**. Until then, test with a dev build (section 5).

### Store addresses (storename.shopersite.in)

Store links work in two modes, switched by `NEXT_PUBLIC_STORE_SUBDOMAINS_LIVE`:

- **Now (`false`):** links are `https://shopersite-app.vercel.app/s/<store>`. These work today.
- **After you connect the domain (`true`):** every store link becomes `https://<store>.shopersite.in`.

To connect the domain:
1. Buy `shopersite.in`.
2. In Vercel › shopersite-app › Settings › Domains, add `shopersite.in` and `*.shopersite.in`. The wildcard needs Vercel's nameservers on the domain.
3. Set `NEXT_PUBLIC_STORE_SUBDOMAINS_LIVE=true` and redeploy.

The subdomain routing (`src/middleware.ts`) is already in place.

A format like `<store>.rox-shop.vercel.app` can't work. Vercel's certificates only cover one level under vercel.app, so browsers refuse a second level.

In the app, **Open store** (and order-tracking links) open in the phone's own browser through `@capacitor/app-launcher`, so sellers see the shop exactly as buyers do.

### App-only behaviour (does nothing in a normal browser)

`src/components/native/native-bridge.tsx` is mounted in the root layout. It switches on only when `window.Capacitor` reports Android or iOS:

| Feature | What it does in the app |
|---|---|
| Android back button | Closes an open dialog first. Then it steps back through dashboard tabs, then back through pages. From a home screen (`/`, `/dashboard`, `/admin`) it leaves the app, so back never loops through the login redirect. |
| Links | `tel:`, `mailto:`, `upi://` and WhatsApp links open the dialler, mail app, UPI app or WhatsApp. Other websites open in an in-app browser sheet (Chrome Custom Tabs / Safari). Same-site "new tab" links open in place. `window.open` is handled the same way. |
| Offline | A banner appears while there is no connection. `offline.html` is shown if the site can't load at all, and it retries automatically when the connection returns. |
| Splash screen | Hidden as soon as the site has loaded (3 s safety timeout). |
| Keyboard | The web view shrinks above the keyboard, and the focused field is scrolled into view. |
| Safe areas | Android keeps the page clear of the status and navigation bars natively. iOS keeps it below the status bar natively, and the page, bottom navigation, sheets and payment button are padded above the home indicator. |
| Google sign-in | Uses the phone's Google account picker instead of a popup. Google blocks its sign-in page inside apps. See section 4. |
| Orientation | Portrait on phones. Android 16+ tablets and iPads may rotate. |

---

## 2. What was changed

**Website (shared, unchanged in browsers):**
- `src/app/layout.tsx`: mounts `<NativeBridge />`.
- `src/components/native/native-bridge.tsx` (new): the app-only behaviour above.
- `src/lib/native/platform.ts`, `links.ts`, `google-auth.ts` (new): app detection, link routing, native Google sign-in.
- `src/lib/auth-context.tsx`: `signInWithGoogle` uses native sign-in in the app and the popup on the web.
- `src/app/dashboard/page.tsx`: back button steps through dashboard tabs, and the bottom navigation sits above the iOS home indicator.
- `src/components/ui/modal.tsx` and `src/components/dashboard/subscription-payment-modal.tsx`: bottom padding for the iOS home indicator. This is `env(safe-area-inset-bottom)`, which is `0` in browsers.
- `src/app/globals.css`: app-only rules under `html.cap-native` / `html.cap-ios`.
- `next.config.ts`: optional `NEXT_DEV_ALLOWED_ORIGINS` so a phone can reach `next dev`. It is empty by default.

**Mobile (new):**
- `capacitor.config.ts`: app ID, name, server URLs per environment, plugins.
- `android/`: Android Studio project (portrait, adjust-resize keyboard, release signing, http only in debug builds).
- `ios/`: Xcode project (Swift Package Manager, so CocoaPods is not needed), usage descriptions, portrait on iPhone, `ios/ExportOptions.plist`.
- `mobile/www/`: offline page plus a generated `config.js`.
- `mobile/assets/`: icon and splash source images. `scripts/mobile-icons.mjs` renders them from the logo.
- `scripts/mobile.mjs`: cross-platform helper behind the npm scripts.
- `.env.mobile.example`, `android/keystore.properties.example`, `.env.example` (Google client IDs).
- `tests/unit/native-links.test.ts`, `tests/unit/native-bridge.test.tsx`.

**Capacitor plugins:** `@capacitor/app` (back button, lifecycle), `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/network`, `@capacitor/keyboard`, `@capacitor/browser`, `@capgo/capacitor-social-login` (Google only; Facebook, Apple and X are excluded).

**Permissions:** The app itself asks only for `INTERNET` and `ACCESS_NETWORK_STATE`. The Google sign-in libraries also add `USE_CREDENTIALS`, `USE_BIOMETRIC` and `USE_FINGERPRINT` (Android Credential Manager). These are install-time permissions with no prompt to the user. iOS has camera and photo-library usage texts because the photo upload picker offers "Take Photo". No location, contacts, notifications or storage permissions are requested.

---

## 3. Prerequisites

| For | Install |
|---|---|
| Everything | Node.js 22 or newer (`node -v`), then `npm install` in this folder |
| Android | [Android Studio](https://developer.android.com/studio) (latest). It brings the Android SDK and JDK 21. In SDK Manager install **Android SDK Platform 36** and **Build-Tools 36**. |
| iOS | A Mac with the latest **Xcode** from the App Store (App Store Connect only accepts builds from recent Xcode versions), plus an **Apple Developer Program** membership for devices, TestFlight and the App Store |

To build Android from the command line instead of Android Studio, set `JAVA_HOME` to a JDK 21. Android Studio's bundled one works, for example `C:\Program Files\Android\Android Studio\jbr`. Also set `ANDROID_HOME` to the SDK, usually `%LOCALAPPDATA%\Android\Sdk`. Opening `android/` once in Android Studio also writes `android/local.properties` with the SDK path.

**Windows: "Unable to establish loopback connection".** Gradle or the SDK tools may crash with this error when your Windows user name contains a space, as on the PC this was set up on. Java can't create its internal socket under your user's temp folder. Point it at a short folder for that terminal session, then rebuild. In PowerShell:

```bash
$env:JAVA_TOOL_OPTIONS="-Djdk.net.unixdomain.tmpdir=C:\Users\Public\jdk-uds"
```

To make it permanent, add `JAVA_TOOL_OPTIONS` with that value under Windows Settings › System › About › Advanced system settings › Environment Variables. Create the `C:\Users\Public\jdk-uds` folder first.

---

## 4. One-time setup

### 4.1 Deploy the website with these changes
The apps load **`https://shopersite-app.vercel.app`**. It is a separate Vercel project (`shopersite-app`), published from this folder on 2026-11-01, so `rox-shop.vercel.app` is left as it was. To publish website changes to the apps, run this from this folder:

```bash
npx vercel deploy --prod
```

It uploads this folder without the signing key, native projects or env files (see `.vercelignore`). The installed apps pick the changes up on their next launch, with no new APK needed.

### 4.2 Choose the site the apps open
The default is `https://shopersite-app.vercel.app`. To change it, for example when `shopersite.in` goes live:

```bash
cp .env.mobile.example .env.mobile
```

Set `CAP_SERVER_URL=https://shopersite.in` in `.env.mobile`, then run `npm run cap:sync`. Production builds refuse non-https URLs.

### 4.3 Google sign-in inside the apps
**Already done:** Google sign-in is enabled in Firebase (`rox-shoppersite`), and `shopersite-app.vercel.app` is an authorized domain. The project's web OAuth client ID is built into `src/lib/firebase.ts`. The website, the app login screen and the create-shop account step all offer **Continue with Google**.

**Android app registered in Firebase:** `com.roxten.shopersite` (app ID `1:849711979912:android:29873109483837c89b6e3d`). Its `google-services.json` is in `android/app/`. The Google services plugin (4.5.0), the Firebase BoM (35.1.0) and Firebase Analytics are added to the Gradle files, in the Groovy `buildscript` style this project uses. Analytics runs without the advertising ID, because the ad-ID permissions are removed in `AndroidManifest.xml`.

**One step left (in your Firebase console):** Google only lets the Android app use your sign-in once it knows the signing key.

1. Open Firebase console › project **rox-shoppersite** › Project settings › General › your Android app `com.roxten.shopersite`.
2. Choose **Add fingerprint** and add both SHA-1 fingerprints:
   ```
   86:FB:FC:F6:22:20:74:8E:25:D4:3A:03:D6:59:8A:E6:7F:95:A1:69
   ```
   That is the release key, used by the APK you share.
   ```
   29:9E:8C:82:FA:31:C9:A7:53:7F:B3:58:B1:1E:F4:1D:39:53:EC:9E
   ```
   That is the debug key on the setup PC.
3. Wait a few minutes. No new APK is needed, and you don't need to download a new google-services.json for sign-in.

If you later publish on Google Play, also add the **Play App Signing** SHA-1 from Play Console › App integrity.

Until this is done, tapping Google in the Android app shows an error, but email sign-in works. iOS also needs an iOS OAuth client: set `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID` and add its reversed client ID as a URL type in Xcode.

### 4.4 Android release key (once, keep it safe forever)

**Already done on the setup PC (2026-11-01):** a key was created at `release-keys/shopersite-upload.jks`, and its passwords are in `android/keystore.properties`. Both are git-ignored. **Back both files up now**, for example to a password manager or an encrypted drive. Every future update of the shared APK must be signed with this same key, or phones will refuse to update. Its SHA-1, needed for the Google sign-in Android client in section 4.3, is:

```
86:FB:FC:F6:22:20:74:8E:25:D4:3A:03:D6:59:8A:E6:7F:95:A1:69
```

The signed APK to share is copied to `mobile/builds/shopersite-1.0.0.apk`. That folder is git-ignored.

To create a key on another machine instead:
Losing this key means you can no longer update the app on Google Play (unless Play App Signing is on, which is recommended).

```bash
mkdir release-keys
```

```bash
keytool -genkeypair -v -keystore release-keys/shopersite-upload.jks -alias shopersite -keyalg RSA -keysize 2048 -validity 10000
```

Then copy `android/keystore.properties.example` to `android/keystore.properties` and fill in the passwords. Both `release-keys/` and `keystore.properties` are git-ignored. On a CI server, set `ANDROID_KEYSTORE_FILE`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD` instead. Back the keystore and passwords up somewhere safe, such as a password manager.

---

## 5. Everyday commands

| Task | Command |
|---|---|
| Build the website (unchanged) | `npm run build` |
| Copy config/plugins into both native projects (production URL) | `npm run cap:sync` |
| Same, but point the apps at your local dev server | `npm run cap:sync:dev` |
| Start `next dev` reachable from phones on your Wi-Fi | `npm run mobile:dev-server` |
| Open Android Studio | `npm run android:open` |
| Build and run on a connected Android phone/emulator | `npm run android:run` (or `android:run:dev`) |
| Debug APK | `npm run android:apk:debug` |
| Signed release APK | `npm run android:apk:release` |
| Play Store bundle (.aab) | `npm run android:aab` |
| Open Xcode (Mac) | `npm run ios:open` |
| Build and run on an iPhone/simulator (Mac) | `npm run ios:run` (or `ios:run:dev`) |
| Regenerate icons and splash screens | `node scripts/mobile-icons.mjs` then `npm run mobile:assets` |

Run `npm run cap:sync` after changing `capacitor.config.ts`, plugins, `.env.mobile` or `mobile/www`. After a `--dev` sync, run `npm run cap:sync` again before making store builds. Otherwise the build points at your computer.

### Developing against your local code
1. `npm run mobile:dev-server`. This prints your LAN address, for example `http://192.168.1.20:3000`.
2. In a second terminal, run `npm run android:run:dev` or `npm run ios:run:dev`. The phone must be on the same Wi-Fi. The Android emulator can use `CAP_DEV_SERVER_URL=http://10.0.2.2:3000` and the iOS simulator `http://localhost:3000`, set in `.env.mobile`.
3. Debug the web view: Chrome › `chrome://inspect` for Android, or Safari › Develop menu for iOS. Inspection is switched on only in dev syncs.

---

## 6. Android builds

### 6.1 Step by step
1. **Build the web app:** `npm run build`. This is optional for the app itself, which loads the deployed site, but it confirms the code compiles. Deploy it so the app gets the changes.
2. **Sync Capacitor:** `npm run cap:sync`
3. **Open Android Studio:** `npm run android:open`. Let Gradle sync finish the first time.
4. **Run the app:** pick a device in the toolbar and press ▶ Run. You can also use `npm run android:run`.
5. **Debug APK:**
   ```bash
   npm run android:apk:debug
   ```
   The output is `android/app/build/outputs/apk/debug/app-debug.apk`.
6. **Signed release APK** (needs section 4.4):
   ```bash
   npm run android:apk:release
   ```
   The output is `android/app/build/outputs/apk/release/app-release.apk`.
7. **Android App Bundle for Google Play** (needs section 4.4):
   ```bash
   npm run android:aab
   ```
   The output is `android/app/build/outputs/bundle/release/app-release.aab`.

To build in Android Studio instead, use **Build › Generate Signed App Bundle or APK…**, choose your keystore, and pick the `release` variant.

The same Gradle tasks can be run directly. On Windows:

```bash
cd android && gradlew.bat assembleDebug
```

On macOS or Linux, run `./gradlew bundleRelease` from the `android` folder.

### 6.2 Test on a physical Android phone
1. On the phone, tap Settings › About phone › Build number 7 times. Then enable Developer options › **USB debugging**.
2. Connect it by USB and accept the prompt. Check that `adb devices` lists it.
3. Run `npm run android:run`, or install a built APK:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

### 6.3 Publishing on Google Play
1. Create the app in [Play Console](https://play.google.com/console) and keep **Play App Signing** on.
2. Upload `app-release.aab` to an **Internal testing** track first.
3. Fill in Store listing, **Privacy policy URL**, **Data safety**, Content rating and Target audience. Data safety must cover the email, name, store data and photos that Firebase stores. Ads: none. The Facebook SDK is excluded, so no advertising ID is used.
4. Add the Play App Signing SHA-1 to the Android OAuth client (section 4.3).
5. For each update, raise `versionCode` (by 1) and `versionName` in `android/app/build.gradle`.

---

## 7. iOS builds (needs a Mac with Xcode)

No iOS build has been produced yet. This project was set up on Windows, where Xcode can't run. The Xcode project is complete and ready to build on a Mac.

### 7.1 Open and sign
1. Copy or clone the project to the Mac, then run `npm install` and `npm run cap:sync`.
2. Run `npm run ios:open`, or open `ios/App/App.xcodeproj`. Xcode resolves the Swift packages automatically.
3. Select the **App** target › **Signing & Capabilities**. Tick *Automatically manage signing* and choose your **Team**. The bundle identifier is `com.roxten.shopersite`. If Apple says it's taken, change it here and in `capacitor.config.ts`.
4. Under **General**, check Display Name `shopersite`, Version `1.0.0` and Build `1`.
5. Do section 4.3 step 5 (Google URL scheme) if you use Google sign-in.

### 7.2 Run on a simulator or iPhone
- Simulator: pick an iPhone in the toolbar, then press ▶.
- Physical iPhone: connect it, trust the Mac, and turn on **Developer Mode** in Settings › Privacy & Security on the phone. Pick it in the toolbar and press ▶. The first time, trust the developer under Settings › General › VPN & Device Management.
- From the terminal: `npm run ios:run`.

### 7.3 TestFlight and App Store
1. In [App Store Connect](https://appstoreconnect.apple.com) create a new app with bundle ID `com.roxten.shopersite`.
2. In Xcode, set the run destination to **Any iOS Device (arm64)** and choose **Product › Archive**.
3. In the Organizer, choose **Distribute App › App Store Connect › Upload**.
4. After processing, the build appears in **TestFlight**. Add testers, test, then submit it for review from the App Store tab.
5. For each update, raise **Build** (and **Version** for user-visible releases).

Command-line alternative, run on the Mac from the project root:

```bash
npm run cap:sync
```

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination "generic/platform=iOS" -archivePath build/ios/App.xcarchive -allowProvisioningUpdates archive
```

```bash
xcodebuild -exportArchive -archivePath build/ios/App.xcarchive -exportPath build/ios/export -exportOptionsPlist ios/ExportOptions.plist -allowProvisioningUpdates
```

The `.ipa` lands in `build/ios/export/`. Upload it with the **Transporter** app or Xcode's Organizer.

### 7.4 App Review notes (read before submitting)
- **Guideline 4.2 (minimum functionality):** Apple sometimes rejects apps that only wrap a website. This app adds native back navigation, native Google sign-in, in-app browser, UPI/WhatsApp hand-off, offline handling and a native splash. In the review notes, describe it as the seller app for managing a store, products and orders.
- **Guideline 4.8 (login services):** apps that offer Google sign-in may be asked to also offer Sign in with Apple, or another login that keeps the email private. Email/password is already offered. If review insists, add Sign in with Apple (the plugin supports it; enable `apple: true` and the Firebase Apple provider) or hide Google on iOS.
- **Demo account:** give the reviewer an email/password seller account with a store.
- **Privacy:** fill in App Privacy (email, name, user content/photos) and give a privacy policy URL. Set `NEXT_PUBLIC_PRIVACY_URL` so the dashboard links to it.

---

## 8. Testing checklist (both platforms)

Run through this on a real Android phone and a real iPhone after each store build:

- [ ] App opens with the splash, then the home page. No white flash, and nothing under the status bar or notch.
- [ ] Register a seller account, log out, log in again. Close and reopen the app: you are still logged in.
- [ ] Google sign-in (after section 4.3), and cancelling it shows no error.
- [ ] Dashboard: every tab, add/edit a product with a photo (camera and gallery), categories, orders, settings.
- [ ] Bottom navigation is fully visible above the iPhone home indicator and the Android navigation bar.
- [ ] Forms: the keyboard doesn't cover the field being typed in. Validation messages appear.
- [ ] Storefront: `/s/<store>` home, category, product, bag, checkout, order tracking `/orders/<token>`.
- [ ] Subscription payment: the UPI button opens a UPI app (GPay/PhonePe/Paytm). The QR code is visible. You can upload the payment screenshot.
- [ ] WhatsApp buttons open WhatsApp. Phone numbers open the dialler. Email opens the mail app. Instagram and other links open in the in-app browser and close back to the app.
- [ ] Copy store link works.
- [ ] Android back button: closes a dialog, returns to the previous dashboard tab, goes back a page, and leaves the app from the dashboard home. It never loops.
- [ ] Airplane mode while using: the offline banner appears and disappears when back online. Start the app in airplane mode: the offline page appears, and "Try again" works once online.
- [ ] Pull the app to the background and back. Rotate the phone: it stays portrait.
- [ ] Desktop browser: the website looks and works exactly as before.

Automated checks (run on any computer):

```bash
npx tsc --noEmit
```

```bash
npm test
```

```bash
npm run build
```

---

## 9. Remaining manual requirements

1. **Redeploy the website** with these changes (section 4.1).
2. **Android toolchain on other machines.** The PC this was set up on now has JDK 21 in `%LOCALAPPDATA%\Programs\jdk-21.0.13+9` and the Android SDK in `%LOCALAPPDATA%\Android\Sdk` (platform 36, build-tools 35 and 36). The debug APK, the release APK (unsigned) and the release AAB (unsigned) were built there successfully on 2026-11-01. They were not yet installed on a phone. Other machines need Android Studio (section 3).
3. **Release keystore** (section 4.4), and its backup.
4. **Google sign-in client IDs** and the iOS URL scheme (section 4.3).
5. **Apple Developer account, Mac with Xcode, signing team** (section 7).
6. **Store listings:** privacy policy URL, Data safety (Play) / App Privacy (Apple), screenshots, demo account.
7. Optional: point `CAP_SERVER_URL` at `https://shopersite.in` once that domain is live, and add `shopersite.in` to Firebase › Authentication › Settings › Authorized domains.

## 10. Not implemented, and why

| Feature | Why not |
|---|---|
| Push notifications | The site has no server-side push today; its "notifications" are in-app lists. Push needs FCM/APNs setup and a sender (e.g. Cloud Functions). It can be added later with `@capacitor/push-notifications`. |
| Camera plugin | Not needed. The existing `<input type="file" accept="image/*">` already offers camera and gallery in both apps. |
| Geolocation, contacts | The site doesn't use them, so no permission is requested. |
| Native share sheet | The site shares through WhatsApp links and copy-link, which work as-is. |
| File downloads | The site has no file downloads. |
| Full offline mode | Store data lives in Firebase and the site is server-rendered. The apps show an offline banner and an offline page instead of a cached copy. Firestore's own cache still serves recently seen data. |
| Static/bundled build of the site | Would break the subdomain middleware and dynamic routes (section 1). |
| iOS `.ipa` | Can only be built on a Mac with Xcode (section 7). |
| Sign in with Apple | Not in the website today. It may be requested by App Review (section 7.4). |

Notes:
- The Firebase web config in `src/lib/firebase.ts` is a public client key by design, not a secret. Restrict it in Google Cloud Console to your domains and the app IDs. No other secrets are in the repository. Signing keys, keystore passwords and `.env*` files are git-ignored.
- `android:allowBackup` is off, so a login session isn't restored onto another phone from a cloud backup.

import type { CapacitorConfig } from "@capacitor/cli";
import type { KeyboardResize } from "@capacitor/keyboard";

/**
 * Capacitor configuration for the shopersite Android and iOS apps.
 *
 * Architecture: the app is a native shell around the deployed Next.js site. The site needs a
 * server (subdomain middleware, dynamic store/product/order routes), so it is NOT exported as static
 * files. The shell loads `server.url`, and the website, its Firebase auth/data and its business logic
 * are shared 1:1 with the web version. `mobile/www` only holds the offline/error page that the
 * shell shows when the site can't be reached.
 *
 * Environments (pick with CAP_ENV, normally through `node scripts/mobile.mjs ...` / npm scripts):
 *   production  (default)  CAP_SERVER_URL      -> deployed site, HTTPS only
 *   development            CAP_DEV_SERVER_URL  -> `next dev` on your computer's LAN IP (http allowed)
 *
 * Run `npm run cap:sync` (or `npm run cap:sync:dev`) after changing anything here.
 */

const PRODUCTION_URL_DEFAULT = "https://shopersite-app.vercel.app";

const isDev = process.env.CAP_ENV === "development";
const serverUrl = isDev
  ? process.env.CAP_DEV_SERVER_URL || "http://10.0.2.2:3000" // 10.0.2.2 = the host computer, seen from the Android emulator
  : process.env.CAP_SERVER_URL || PRODUCTION_URL_DEFAULT;

if (!isDev && !serverUrl.startsWith("https://")) {
  throw new Error(`CAP_SERVER_URL must be an https:// URL for production builds (got "${serverUrl}").`);
}

const config: CapacitorConfig = {
  appId: "com.roxten.shopersite",
  appName: "shopersite",
  webDir: "mobile/www",
  backgroundColor: "#ffffff",
  // Lets the website (and analytics) recognise traffic from the app
  appendUserAgent: "ShopersiteApp",
  loggingBehavior: isDev ? "debug" : "none",

  server: {
    url: serverUrl,
    cleartext: isDev, // plain http only for the local dev server
    errorPath: "offline.html",
    // The app opens straight on its own launch screen (/app → welcome slides, app login or the
    // dashboard), never the website's marketing home page.
    appStartPath: "/app",
  },

  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: isDev,
  },

  ios: {
    contentInset: "never",
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
    webContentsDebuggingEnabled: isDev,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // safety net; the site hides it as soon as it has loaded
      launchAutoHide: true,
      launchFadeOutDuration: 200,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      // iOS: keep the web view below the status bar (Android 15+ ignores this; SystemBars handles it)
      overlaysWebView: false,
      style: "LIGHT", // dark icons on the white background
      backgroundColor: "#ffffff",
    },
    SystemBars: {
      // Android: the site doesn't opt into viewport-fit=cover there, so the web view is kept clear
      // of the status and navigation bars and no page needs safe-area padding.
      insetsHandling: "css",
      style: "LIGHT",
    },
    Keyboard: {
      resize: "native" as KeyboardResize, // whole web view shrinks above the keyboard
      resizeOnFullScreen: true,
    },
    SocialLogin: {
      // Only Google sign-in is used; leaving the others out keeps the app small and avoids the
      // Facebook SDK's advertising-ID permission on Google Play.
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
      logLevel: 1,
    },
  },
};

export default config;

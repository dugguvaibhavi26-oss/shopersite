import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";

// Capture the native listeners the bridge registers so tests can fire them.
const listeners: Record<string, (data?: any) => void> = {};
const handle = (name: string, fn: (d?: any) => void) => {
  listeners[name] = fn;
  return Promise.resolve({ remove: vi.fn() });
};
const minimizeApp = vi.fn(() => Promise.resolve());
const browserOpen = vi.fn(() => Promise.resolve());
const splashHide = vi.fn(() => Promise.resolve());
let connected = true;

vi.mock("@capacitor/app", () => ({
  App: { addListener: (n: string, fn: any) => handle(`app:${n}`, fn), minimizeApp, exitApp: vi.fn() },
}));
vi.mock("@capacitor/splash-screen", () => ({ SplashScreen: { hide: splashHide } }));
vi.mock("@capacitor/network", () => ({
  Network: {
    getStatus: () => Promise.resolve({ connected }),
    addListener: (n: string, fn: any) => handle(`net:${n}`, fn),
  },
}));
vi.mock("@capacitor/keyboard", () => ({ Keyboard: { addListener: (n: string, fn: any) => handle(`kb:${n}`, fn) } }));
vi.mock("@capacitor/browser", () => ({ Browser: { open: vi.fn() } }));
// external pages open in the phone's browser via AppLauncher (browserOpen records the URL)
vi.mock("@capacitor/app-launcher", () => ({ AppLauncher: { openUrl: browserOpen } }));
const routerReplace = vi.fn();
let currentPath = "/login";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPath,
  useRouter: () => ({ replace: routerReplace, push: vi.fn() }),
}));

import { NativeBridge } from "@/components/native/native-bridge";

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

describe("NativeBridge", () => {
  let assign: ReturnType<typeof vi.fn>;
  let back: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    connected = true;
    for (const k of Object.keys(listeners)) delete listeners[k];
    vi.clearAllMocks();
    assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, href: "https://rox-shop.vercel.app/login", pathname: "/login", assign },
    });
    back = vi.spyOn(window.history, "back").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    delete (window as any).Capacitor;
    document.documentElement.className = "";
    back.mockRestore();
  });

  it("does nothing in a normal browser", async () => {
    render(<NativeBridge />);
    await flush();
    expect(document.documentElement.className).toBe("");
    expect(splashHide).not.toHaveBeenCalled();
    expect(listeners["app:backButton"]).toBeUndefined();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  describe("inside the app", () => {
    beforeEach(() => {
      (window as any).Capacitor = { isNativePlatform: () => true, getPlatform: () => "android" };
    });

    it("swaps the website home page and desktop login for the app screens", async () => {
      currentPath = "/";
      const { unmount } = render(<NativeBridge />);
      await flush();
      expect(routerReplace).toHaveBeenCalledWith("/app");
      // the native launch screen stays up while the app moves to its own start page
      expect(splashHide).not.toHaveBeenCalled();
      unmount();
      currentPath = "/login";
      render(<NativeBridge />);
      await flush();
      expect(routerReplace).toHaveBeenLastCalledWith("/app/login");
    });

    it("tags <html> and hides the splash screen once an app page shows", async () => {
      currentPath = "/dashboard";
      render(<NativeBridge />);
      await flush();
      expect(document.documentElement.classList.contains("cap-native")).toBe(true);
      expect(document.documentElement.classList.contains("cap-android")).toBe(true);
      expect(splashHide).toHaveBeenCalled();
    });

    it("back button: closes an open dialog first", async () => {
      render(<NativeBridge />);
      await flush();
      const dialog = document.createElement("div");
      dialog.setAttribute("role", "dialog");
      document.body.appendChild(dialog);
      const onEsc = vi.fn();
      window.addEventListener("keydown", onEsc);
      listeners["app:backButton"]({ canGoBack: true });
      expect(onEsc).toHaveBeenCalledWith(expect.objectContaining({ key: "Escape" }));
      expect(back).not.toHaveBeenCalled();
      window.removeEventListener("keydown", onEsc);
      dialog.remove();
    });

    it("back button: lets a page handle it, then goes back, then leaves from home screens", async () => {
      render(<NativeBridge />);
      await flush();

      const pageHandler = (e: Event) => e.preventDefault();
      window.addEventListener("app:back", pageHandler);
      listeners["app:backButton"]({ canGoBack: true });
      expect(back).not.toHaveBeenCalled();
      window.removeEventListener("app:back", pageHandler);

      listeners["app:backButton"]({ canGoBack: true });
      expect(back).toHaveBeenCalledTimes(1);

      (window.location as any).pathname = "/dashboard";
      listeners["app:backButton"]({ canGoBack: true });
      expect(minimizeApp).toHaveBeenCalled();
      expect(back).toHaveBeenCalledTimes(1);
    });

    it("routes links: WhatsApp and UPI to the phone, other sites to the in-app browser", async () => {
      render(
        <div>
          <a href="https://wa.me/919800000000" target="_blank">wa</a>
          <a href="upi://pay?pa=x@ybl">upi</a>
          <a href="https://instagram.com/x" target="_blank">ig</a>
          <a href="/register">internal</a>
          <NativeBridge />
        </div>
      );
      await flush();
      screen.getByText("wa").click();
      expect(assign).toHaveBeenCalledWith("https://wa.me/919800000000");
      screen.getByText("upi").click();
      expect(assign).toHaveBeenLastCalledWith("upi://pay?pa=x@ybl");
      screen.getByText("ig").click();
      await flush();
      expect(browserOpen).toHaveBeenCalledWith({ url: "https://instagram.com/x" });
      assign.mockClear();
      // registered after the bridge, so it runs after it: only stops jsdom's real navigation
      const stopJsdomNav = (e: Event) => e.preventDefault();
      window.addEventListener("click", stopJsdomNav);
      screen.getByText("internal").click();
      window.removeEventListener("click", stopJsdomNav);
      expect(assign).not.toHaveBeenCalled();
    });

    it("window.open opens external pages in the in-app browser", async () => {
      render(<NativeBridge />);
      await flush();
      expect(window.open("https://mail.google.com/mail/?view=cm", "_blank")).toBeNull();
      await flush();
      expect(browserOpen).toHaveBeenCalledWith({ url: "https://mail.google.com/mail/?view=cm" });
    });

    it("shows an offline banner while disconnected", async () => {
      connected = false;
      render(<NativeBridge />);
      await flush();
      expect(screen.getByRole("status").textContent).toMatch(/offline/i);
      await act(async () => listeners["net:networkStatusChange"]({ connected: true }));
      expect(screen.queryByRole("status")).toBeNull();
    });
  });
});

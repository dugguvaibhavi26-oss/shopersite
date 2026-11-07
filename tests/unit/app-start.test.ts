import { describe, it, expect, beforeEach } from "vitest";
import { appReplacementFor, decideStartPath, hasOnboarded, markOnboarded } from "@/lib/native/app-start";

describe("decideStartPath (where the app opens)", () => {
  it("waits while the session is being restored", () => {
    expect(decideStartPath({ loading: true, signedIn: false, onboarded: false })).toBeNull();
  });

  it("sends signed-in sellers straight to the dashboard", () => {
    expect(decideStartPath({ loading: false, signedIn: true, storeSubdomain: "roxtenn", onboarded: true })).toBe(
      "/dashboard?store=roxtenn"
    );
    expect(decideStartPath({ loading: false, signedIn: true, onboarded: false })).toBe("/dashboard");
  });

  it("shows onboarding only the first time, then the login screen", () => {
    expect(decideStartPath({ loading: false, signedIn: false, onboarded: false })).toBe("/app/welcome");
    expect(decideStartPath({ loading: false, signedIn: false, onboarded: true })).toBe("/app/login");
  });
});

describe("onboarding flag", () => {
  beforeEach(() => localStorage.clear());

  it("is remembered once set", () => {
    expect(hasOnboarded()).toBe(false);
    markOnboarded();
    expect(hasOnboarded()).toBe(true);
  });
});

describe("appReplacementFor", () => {
  it("maps website pages that have an app version", () => {
    expect(appReplacementFor("/")).toBe("/app");
    expect(appReplacementFor("/login")).toBe("/app/login");
    expect(appReplacementFor("/login/")).toBe("/app/login");
    expect(appReplacementFor("/signup")).toBe("/register");
  });

  it("leaves everything else alone", () => {
    expect(appReplacementFor("/dashboard")).toBeNull();
    expect(appReplacementFor("/register")).toBeNull();
    expect(appReplacementFor("/app/login")).toBeNull();
    expect(appReplacementFor("/s/roxtenn")).toBeNull();
  });
});

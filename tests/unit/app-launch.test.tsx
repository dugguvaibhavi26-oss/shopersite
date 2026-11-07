import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, prefetch: vi.fn(), push: vi.fn() }),
}));

let auth: { user: { uid: string; email: string } | null; loading: boolean; stores: { subdomain: string }[] } = {
  user: null,
  loading: false,
  stores: [],
};
vi.mock("@/lib/auth-context", () => ({ useAuth: () => auth }));

import AppLaunchPage from "@/app/app/page";

describe("app launch screen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    localStorage.clear();
    auth = { user: null, loading: false, stores: [] };
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("plays the intro, then always moves on to onboarding (never stuck on a blank screen)", () => {
    const { container } = render(<AppLaunchPage />);
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(2200));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/app/welcome");
    // the bag stays on screen while the next page loads
    expect(container.querySelector(".launch-bag")).not.toBeNull();
    act(() => vi.advanceTimersByTime(5000));
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("uses the shorter intro and goes to login for returning signed-out users", () => {
    localStorage.setItem("shopersite_app_onboarded", "1");
    render(<AppLaunchPage />);
    act(() => vi.advanceTimersByTime(1300));
    expect(replace).toHaveBeenCalledWith("/app/login");
  });

  it("waits for the session, then opens the dashboard for signed-in sellers", () => {
    auth = { user: null, loading: true, stores: [] };
    const { rerender } = render(<AppLaunchPage />);
    act(() => vi.advanceTimersByTime(3000));
    expect(replace).not.toHaveBeenCalled();
    auth = { user: { uid: "u1", email: "a@b.in" }, loading: false, stores: [{ subdomain: "yourshop" }] };
    rerender(<AppLaunchPage />);
    expect(replace).toHaveBeenCalledWith("/dashboard?store=yourshop");
  });
});

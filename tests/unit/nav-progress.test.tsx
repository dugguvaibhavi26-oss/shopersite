import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";

let pathname = "/app/login";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { NavProgress, startNavProgress } from "@/components/nav-progress";

const bar = (c: HTMLElement) => c.querySelector(".nav-progress-bar");

describe("NavProgress (loading bar)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pathname = "/app/login";
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows while an internal link loads and finishes when the page changes", () => {
    const { container, rerender } = render(
      <div>
        <a href="/register">Create a shop</a>
        <NavProgress />
      </div>
    );
    expect(bar(container)).toBeNull();
    // registered after the bar's listener, so it only stops jsdom's real navigation
    const stop = (e: Event) => e.preventDefault();
    window.addEventListener("click", stop);
    act(() => {
      screen.getByText("Create a shop").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    expect(bar(container)?.className).toContain("is-loading");
    window.removeEventListener("click", stop);

    pathname = "/register";
    rerender(
      <div>
        <a href="/register">Create a shop</a>
        <NavProgress />
      </div>
    );
    expect(bar(container)?.className).toContain("is-done");
    act(() => vi.advanceTimersByTime(400));
    expect(bar(container)).toBeNull();
  });

  it("starts from code and never hangs if the page doesn't change", () => {
    const { container } = render(<NavProgress />);
    act(() => startNavProgress());
    expect(bar(container)?.className).toContain("is-loading");
    act(() => vi.advanceTimersByTime(10001));
    expect(bar(container)).toBeNull();
  });

  it("ignores external links", () => {
    const { container } = render(
      <div>
        <a href="https://wa.me/91">WhatsApp</a>
        <NavProgress />
      </div>
    );
    const stop = (e: Event) => e.preventDefault();
    window.addEventListener("click", stop);
    act(() => {
      screen.getByText("WhatsApp").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    window.removeEventListener("click", stop);
    expect(bar(container)).toBeNull();
  });
});

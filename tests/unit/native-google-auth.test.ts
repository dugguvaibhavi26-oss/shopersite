import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const login = vi.fn();
const initialize = vi.fn(() => Promise.resolve());
vi.mock("@capgo/capacitor-social-login", () => ({ SocialLogin: { login, initialize } }));

const signInWithCredential = vi.fn((_auth: unknown, cred: unknown) => Promise.resolve({ user: { uid: "u1" }, cred }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: { credential: (idToken: string) => ({ providerId: "google.com", idToken }) },
  signInWithCredential: (a: unknown, c: unknown) => signInWithCredential(a, c),
}));
vi.mock("@/lib/firebase", () => ({ GOOGLE_WEB_CLIENT_ID: "web-client.apps.googleusercontent.com" }));

import { signInWithGoogleNative } from "@/lib/native/google-auth";

describe("native Google sign-in", () => {
  beforeEach(() => {
    login.mockReset();
    signInWithCredential.mockClear();
    (window as any).Capacitor = { isNativePlatform: () => true, getPlatform: () => "android" };
  });
  afterEach(() => {
    delete (window as any).Capacitor;
  });

  it("never passes custom scopes (Android rejects them without a modified MainActivity)", async () => {
    login.mockResolvedValue({ provider: "google", result: { responseType: "online", idToken: "id-token-123" } });
    await signInWithGoogleNative({} as any);
    const opts = login.mock.calls[0][0];
    expect(opts.provider).toBe("google");
    expect(opts.options?.scopes).toBeUndefined();
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ google: expect.objectContaining({ webClientId: "web-client.apps.googleusercontent.com" }) })
    );
  });

  it("signs in to Firebase with the Google ID token", async () => {
    login.mockResolvedValue({ provider: "google", result: { responseType: "online", idToken: "id-token-123" } });
    await signInWithGoogleNative({} as any);
    expect(signInWithCredential).toHaveBeenCalledWith({}, { providerId: "google.com", idToken: "id-token-123" });
  });

  it("treats a cancelled picker like a closed popup (no error shown)", async () => {
    login.mockRejectedValue({ code: "USER_CANCELLED" });
    await expect(signInWithGoogleNative({} as any)).rejects.toMatchObject({ code: "auth/popup-closed-by-user" });
  });
});

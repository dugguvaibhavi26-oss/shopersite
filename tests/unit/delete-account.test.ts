import { describe, expect, it, vi } from "vitest";
import { isReservedSubdomain } from "@/lib/reserved-names";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/firebase-admin", () => ({
  adminDb: () => {
    throw new Error("No database in unit test");
  },
}));
vi.mock("@/lib/server/platform-mail", () => ({
  sendPlatformMail: vi.fn().mockResolvedValue(true),
}));

const { POST } = await import("@/app/api/account/delete-request/route");

describe("Delete Account Ecosystem", () => {
  it("reserves 'delete-account' as a protected platform subdomain", () => {
    expect(isReservedSubdomain("delete-account")).toBe(true);
    expect(isReservedSubdomain("DELETE-ACCOUNT")).toBe(true);
  });

  it("rejects deletion requests with missing or invalid email", async () => {
    const req = new Request("http://localhost:3000/api/account/delete-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "notanemail",
        accountType: "seller",
        confirmed: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("rejects deletion requests without confirmation", async () => {
    const req = new Request("http://localhost:3000/api/account/delete-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "seller@example.com",
        accountType: "seller",
        confirmed: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("accepts a valid deletion request and returns reference ID with 30-day grace period", async () => {
    const req = new Request("http://localhost:3000/api/account/delete-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "merchant@brand.in",
        accountType: "seller",
        storeSubdomain: "mybrand",
        reason: "Closing my business / store",
        confirmed: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.referenceId).toMatch(/^DEL-[A-Z0-9]+$/);
    expect(data.email).toBe("merchant@brand.in");
    expect(data.accountType).toBe("seller");
    expect(data.gracePeriodDays).toBe(30);

    const created = new Date(data.createdAt).getTime();
    const purge = new Date(data.scheduledPurgeDate).getTime();
    const diffDays = Math.round((purge - created) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });
});

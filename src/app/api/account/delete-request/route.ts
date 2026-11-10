import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/server/firebase-admin";
import { sendPlatformMail } from "@/lib/server/platform-mail";
import { siteConfig } from "@/lib/config/site";

const RequestSchema = z.object({
  email: z.string().trim().email("Please provide a valid registered email address."),
  accountType: z.enum(["seller", "admin", "collaborator"]).default("seller"),
  storeSubdomain: z.string().trim().optional(),
  reason: z.string().trim().optional(),
  reasonDetails: z.string().trim().optional(),
  confirmed: z.boolean().refine((v) => v === true, {
    message: "You must confirm that you understand the deletion terms.",
  }),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = RequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid deletion request data.",
        },
        { status: 400 }
      );
    }

    const { email, accountType, storeSubdomain, reason, reasonDetails } = parsed.data;

    // Generate unique reference ID
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referenceId = `DEL-${randomHex}`;

    const now = new Date();
    const purgeDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day grace period

    const record = {
      referenceId,
      email: email.toLowerCase(),
      accountType,
      storeSubdomain: storeSubdomain || null,
      reason: reason || "Not specified",
      reasonDetails: reasonDetails || null,
      status: "pending_review",
      createdAt: now.toISOString(),
      scheduledPurgeDate: purgeDate.toISOString(),
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    };

    // Store in Firestore if adminDb is configured
    try {
      const db = adminDb();
      await db.collection("account_deletion_requests").doc(referenceId).set(record);
    } catch (dbErr) {
      // Graceful fallback if service account is not mounted in dev / staging
      console.warn("[delete-account] Could not persist to Firestore:", dbErr);
    }

    // Send confirmation email via platform mail if configured
    try {
      await sendPlatformMail({
        to: email,
        subject: `[${siteConfig.name.toUpperCase()}] Account Deletion Request Received (${referenceId})`,
        text: `Hello,\n\nWe received a request to permanently delete your Shopersite ${accountType} account (${email}).\n\nReference ID: ${referenceId}\nRequested Date: ${now.toUTCString()}\nScheduled Purge Date: ${purgeDate.toUTCString()} (30-day grace period)\n\nWhat happens next:\n1. Your storefront and access are placed into deactivation.\n2. You have a 30-day grace period to change your mind. If this request was made in error, email support@${siteConfig.domain} with reference ${referenceId} to restore your account.\n3. After 30 days, your store data, product catalogs, customer PII, and custom domains will be permanently and irreversibly purged.\n\nThank you,\nThe ${siteConfig.name} Security & Data Privacy Team\nhttps://${siteConfig.domain}`,
      });
    } catch (mailErr) {
      console.warn("[delete-account] Could not send confirmation mail:", mailErr);
    }

    return NextResponse.json({
      success: true,
      referenceId,
      email: email.toLowerCase(),
      accountType,
      createdAt: now.toISOString(),
      scheduledPurgeDate: purgeDate.toISOString(),
      gracePeriodDays: 30,
      message: "Account deletion request successfully submitted.",
    });
  } catch (err) {
    console.error("[delete-account] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while processing your request. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}


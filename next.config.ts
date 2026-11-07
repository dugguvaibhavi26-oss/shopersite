import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // store pages are served on subdomains (roxtenn.localhost:3000 in development)
  // NEXT_DEV_ALLOWED_ORIGINS (comma separated) adds e.g. your computer's LAN IP so the Android/iOS
  // app can load the dev server from a phone (set automatically by `npm run mobile:dev-server`)
  allowedDevOrigins: [
    "*.localhost",
    ...(process.env.NEXT_DEV_ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), usb=(), interest-cohort=()",
          },
          {
            // no other site can frame ours (clickjacking); no plugins; no <base> tricks
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

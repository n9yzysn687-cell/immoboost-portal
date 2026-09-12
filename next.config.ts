import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const previewHeaders = process.env.VERCEL_ENV === "preview"
      ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
      : [];
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
          ...previewHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;

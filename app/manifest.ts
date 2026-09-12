import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ImmoBoost",
    short_name: "ImmoBoost",
    description: "Le cockpit quotidien des agents immobiliers.",
    start_url: "/",
    display: "standalone",
    background_color: "#050711",
    theme_color: "#050711",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

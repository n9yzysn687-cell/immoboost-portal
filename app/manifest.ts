import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agent Daily",
    short_name: "Agent Daily",
    description: "Cockpit IA immobilier avec Mission Brain et crédits signés.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef4ff",
    theme_color: "#07111f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

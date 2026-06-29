import type { MetadataRoute } from "next";
import { faviconHref } from "@/lib/constants/favicon";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — GTA VI Community Hub`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#000000",
    icons: [
      {
        src: faviconHref("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: faviconHref("/icon-32.png"),
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: faviconHref("/apple-touch-icon.png"),
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: faviconHref("/apple-touch-icon.png"),
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

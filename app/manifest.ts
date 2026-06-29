import type { MetadataRoute } from "next";
import { FAVICON_PATHS } from "@/lib/constants/favicon";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — GTA VI Community Hub`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#f06aad",
    icons: [
      {
        src: FAVICON_PATHS.png192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: FAVICON_PATHS.png48,
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: FAVICON_PATHS.apple,
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: FAVICON_PATHS.apple,
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

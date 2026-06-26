import type { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE, absoluteUrl, getSiteUrl } from "@/lib/constants/site";

export function createPageMetadata(options: {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
}): Metadata {
  const description = options.description ?? SITE_DESCRIPTION;
  const url = options.path ? absoluteUrl(options.path) : getSiteUrl();
  const image = options.image ?? DEFAULT_OG_IMAGE;

  return {
    title: options.title,
    description,
    openGraph: {
      title: `${options.title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: options.type ?? "website",
      images: [{ url: absoluteUrl(image) }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${options.title} | ${SITE_NAME}`,
      description,
      images: [absoluteUrl(image)],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} — GTA VI Community Hub`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: `${SITE_NAME} — GTA VI Community Hub`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE) }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — GTA VI Community Hub`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
};

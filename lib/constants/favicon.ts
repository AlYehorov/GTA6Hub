/** Static favicon paths — no query strings (Safari ignores ?v= on favicons). */
export const FAVICON_PATHS = {
  ico: "/favicon.ico",
  svg: "/favicon.svg",
  png32: "/icon-32.png",
  png48: "/icon-48.png",
  png192: "/icon-192.png",
  apple: "/apple-touch-icon.png",
  applePrecomposed: "/apple-touch-icon-precomposed.png",
  maskIcon: "/safari-pinned-tab.svg",
} as const;

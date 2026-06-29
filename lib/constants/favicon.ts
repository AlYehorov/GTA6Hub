/** Bump when favicon assets change — busts Safari/Chrome aggressive cache. */
export const FAVICON_VERSION = "2";

export function faviconHref(path: string): string {
  return `${path}?v=${FAVICON_VERSION}`;
}

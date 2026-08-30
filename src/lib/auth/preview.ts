/** Preview-host helper used by auth popup/session wiring. */
export function isPreviewHost(hostname: string): boolean {
  return hostname === "localhost" || hostname.endsWith(".grok.x.ai") || hostname.includes("preview");
}

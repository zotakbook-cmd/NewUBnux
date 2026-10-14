/**
 * UBnux BusinessKey Wildcard Worker
 * Version: 1.0.0
 *
 * Purpose:
 *   *.ubnux.com -> one Worker -> existing UBnux Pages origin
 *
 * Example:
 *   mk.ubnux.com/
 *   siwan-fashion-house.ubnux.com/
 *
 * The Worker does NOT create a DNS record per business.
 * It serves business.html for a BusinessKey hostname and proxies
 * static assets from the existing UBnux origin.
 */

const ORIGIN = "https://ubnux.com";

const RESERVED_HOSTS = new Set([
  "www",
  "api",
  "admin",
  "mail",
  "smtp",
  "imap",
  "pop",
  "ftp",
  "cdn",
  "static",
  "assets",
  "status"
]);

function getBusinessKey(hostname) {
  const host = String(hostname || "").toLowerCase().trim();

  if (!host.endsWith(".ubnux.com")) return "";

  const suffix = ".ubnux.com";
  const subdomain = host.slice(0, -suffix.length);

  // Only a single BusinessKey label is accepted.
  if (!subdomain || subdomain.includes(".")) return "";

  if (RESERVED_HOSTS.has(subdomain)) return "";

  // Keep this aligned with the Apps Script BusinessKey rules.
  if (!/^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/.test(subdomain)) {
    return "";
  }

  return subdomain;
}

function originURL(pathname, search) {
  return ORIGIN + pathname + (search || "");
}

function cloneResponse(response, headers = {}) {
  const h = new Headers(response.headers);
  Object.entries(headers).forEach(([k, v]) => h.set(k, v));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: h
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const businessKey = getBusinessKey(url.hostname);

    // Do not interfere with the apex site.
    if (!businessKey) {
      return fetch(request);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          "Allow": "GET, HEAD"
        }
      });
    }

    /*
     * Static assets and public files are served from the existing
     * UBnux Pages origin. This keeps the existing frontend unchanged.
     */
    const staticPrefixes = [
      "/assets/",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml"
    ];

    const isStatic =
      staticPrefixes.some(prefix =>
        url.pathname === prefix ||
        url.pathname.startsWith(prefix)
      );

    if (isStatic) {
      const response = await fetch(
        originURL(url.pathname, url.search),
        request
      );

      return cloneResponse(response, {
        "X-UBnux-BusinessKey": businessKey,
        "X-UBnux-Subdomain": "1"
      });
    }

    /*
     * Every business hostname gets the existing business shell.
     * The browser remains on:
     *
     *   https://<BusinessKey>.ubnux.com/
     *
     * BusinessKey is detected client-side from hostname and then
     * resolved through the existing business-key API.
     */
    const shellResponse = await fetch(
      originURL("/business.html", ""),
      request
    );

    return cloneResponse(shellResponse, {
      "X-UBnux-BusinessKey": businessKey,
      "X-UBnux-Subdomain": "1",
      "Cache-Control": "no-cache"
    });
  }
};

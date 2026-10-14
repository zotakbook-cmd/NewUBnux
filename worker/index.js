/**
 * UBnux BusinessKey Wildcard Worker
 * Version: 2.0.0
 *
 * One Worker handles ALL BusinessKey subdomains:
 *   mk.ubnux.com
 *   siwan-fashion-house.ubnux.com
 *   abc-business.ubnux.com
 *
 * No per-business DNS records are required.
 *
 * The Worker:
 *  1. Detects <BusinessKey>.ubnux.com
 *  2. Serves the existing UBnux business.html shell from the apex site
 *  3. Injects a small bridge BEFORE business-page.js
 *  4. The bridge makes the existing frontend treat the hostname as a
 *     BusinessKey route and calls the existing `business-key` API
 *  5. Existing SEO/business template pipeline remains authoritative
 */

const ORIGIN = "https://ubnux.com";
const HOST_SUFFIX = ".ubnux.com";
const BUSINESS_KEY_RE = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/;

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
  "status",
  "app",
  "login",
  "verify"
]);

function getBusinessKey(hostname) {
  const host = String(hostname || "").toLowerCase().trim();

  if (!host.endsWith(HOST_SUFFIX)) return "";

  const subdomain = host.slice(0, -HOST_SUFFIX.length);

  // Only one hostname label is accepted.
  if (!subdomain || subdomain.includes(".")) return "";
  if (RESERVED_HOSTS.has(subdomain)) return "";
  if (!BUSINESS_KEY_RE.test(subdomain)) return "";

  return subdomain;
}

function originURL(pathname, search = "") {
  return ORIGIN + pathname + search;
}

function withHeaders(response, extra = {}) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(extra)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function bridgeScript() {
  // This script executes after config/api/seo-router/schema have loaded,
  // but BEFORE the existing business-page.js controller.
  return `
<script>
(function () {
  "use strict";

  var host = String(window.location.hostname || "").toLowerCase();
  var suffix = ".ubnux.com";
  if (!host.endsWith(suffix)) return;

  var key = host.slice(0, -suffix.length);
  if (!key || key.indexOf(".") !== -1) return;
  if (!/^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/.test(key)) return;

  var reserved = {
    www:1, api:1, admin:1, mail:1, smtp:1, imap:1, pop:1,
    ftp:1, cdn:1, static:1, assets:1, status:1, app:1,
    login:1, verify:1
  };
  if (reserved[key]) return;

  window.UBNUX_BUSINESS_KEY_HOST = key;
  window.UBNUX_BUSINESS_KEY_ROUTE = true;

  var SENTINEL = "business-key";

  /* ---------------------------------------------------------
     SEO router bridge
     --------------------------------------------------------- */
  var router = window.UBNUX_SEO_ROUTER || window.UBnuxSEORouter;
  if (router) {
    var originalGetCurrentRoute = router.getCurrentRoute;
    var originalIsBusinessPage = router.isBusinessPage;

    router.getCurrentRoute = function () {
      return {
        type: "business",
        isBusinessPage: true,
        isSEOPage: false,
        isBusinessKeyPage: true,
        stateSlug: SENTINEL,
        districtSlug: SENTINEL,
        categorySlug: SENTINEL,
        businessSlug: key,
        canonicalPath: "/"
      };
    };

    router.isBusinessPage = function () {
      return true;
    };

    // Keep parse() unchanged for normal apex-site routes.
    router.__ubnuxBusinessKeyPatched = true;
    router.__ubnuxBusinessKeyOriginalGetCurrentRoute = originalGetCurrentRoute;
    router.__ubnuxBusinessKeyOriginalIsBusinessPage = originalIsBusinessPage;
  }

  /* ---------------------------------------------------------
     API bridge
     --------------------------------------------------------- */
  var api = window.UBnuxAPI || window.ZilaBizAPI;
  if (api && typeof api.getBusiness === "function" && !api.__ubnuxBusinessKeyPatched) {
    var originalGetBusiness = api.getBusiness;

    api.getBusiness = async function (input, options) {
      if (input && typeof input === "object") {
        var state = String(input.state || input.stateSlug || "").toLowerCase();
        var district = String(input.district || input.districtSlug || "").toLowerCase();
        var category = String(input.category || input.categorySlug || "").toLowerCase();
        var slug = String(input.slug || input.businessSlug || "").toLowerCase();

        if (state === SENTINEL && district === SENTINEL && category === SENTINEL && slug === key) {
          if (typeof api.request !== "function") {
            throw new Error("UBnux API request() is unavailable.");
          }

          return api.request(
            "business-key",
            { key: key },
            Object.assign({}, options || {}, { cache: false })
          );
        }
      }

      return originalGetBusiness.call(api, input, options);
    };

    api.__ubnuxBusinessKeyPatched = true;
  }

  window.dispatchEvent(new CustomEvent("ubnux:business-key-ready", {
    detail: { businessKey: key }
  }));
})();
</script>
`;
}

async function serveBusinessShell(request, businessKey) {
  const response = await fetch(originURL("/business.html"), {
    method: request.method,
    headers: request.headers
  });

  if (!response.ok) {
    return withHeaders(response, {
      "X-UBnux-BusinessKey": businessKey,
      "X-UBnux-Subdomain": "1"
    });
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) {
    return withHeaders(response, {
      "X-UBnux-BusinessKey": businessKey,
      "X-UBnux-Subdomain": "1"
    });
  }

  let html = await response.text();

  const scriptMarker = /<script[^>]+assets\/js\/seo\/business-page\.js[^>]*><\/script>/i;
  const injected = bridgeScript();

  if (scriptMarker.test(html)) {
    html = html.replace(scriptMarker, injected + "\n" + "$&");
  } else {
    // Fail-safe: insert before </body> if the script filename changes later.
    html = html.replace(/<\/body>/i, injected + "\n</body>");
  }

  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/html; charset=UTF-8");
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  headers.set("X-UBnux-BusinessKey", businessKey);
  headers.set("X-UBnux-Subdomain", "1");

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const businessKey = getBusinessKey(url.hostname);

    // Apex + reserved hosts continue to use the existing deployment.
    if (!businessKey) {
      return fetch(request);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" }
      });
    }

    const staticPrefixes = [
      "/assets/",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml"
    ];

    const isStatic = staticPrefixes.some(prefix =>
      url.pathname === prefix || url.pathname.startsWith(prefix)
    );

    if (isStatic) {
      const response = await fetch(
        originURL(url.pathname, url.search),
        request
      );

      return withHeaders(response, {
        "X-UBnux-BusinessKey": businessKey,
        "X-UBnux-Subdomain": "1"
      });
    }

    return serveBusinessShell(request, businessKey);
  }
};

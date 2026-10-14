/**
 * UBnux BusinessKey Wildcard Worker
 * Version: 3.1.0
 *
 * Architecture:
 *
 *   mk.ubnux.com
 *          ↓
 *   *.ubnux.com/* Worker Route
 *          ↓
 *   BusinessKey = "mk"
 *          ↓
 *   newubnux.pages.dev/business.html
 *          ↓
 *   injected BusinessKey bridge
 *          ↓
 *   existing UBnux API
 *          ↓
 *   Google Apps Script
 *
 * IMPORTANT:
 * Do NOT use https://ubnux.com as the Worker origin.
 * This Worker itself handles *.ubnux.com/*.
 */

const PAGES_ORIGIN = "https://newubnux.pages.dev";

const HOST_SUFFIX = ".ubnux.com";

/*
 * 3–50 characters.
 * Lowercase letters, numbers and hyphen.
 * Cannot start/end with hyphen.
 */
const BUSINESS_KEY_RE =
  /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/;


/* =========================================================
   RESERVED SUBDOMAINS
========================================================= */

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


/* =========================================================
   BUSINESS KEY FROM HOSTNAME
========================================================= */

function getBusinessKey(hostname) {

  const host =
    String(hostname || "")
      .toLowerCase()
      .trim();


  if (!host.endsWith(HOST_SUFFIX)) {
    return "";
  }


  /*
   * Example:
   *
   * mk.ubnux.com
   *
   * becomes:
   *
   * mk
   */

  const subdomain =
    host.slice(
      0,
      -HOST_SUFFIX.length
    );


  /*
   * Only one hostname label is allowed.
   *
   * Valid:
   * mk.ubnux.com
   *
   * Invalid:
   * abc.mk.ubnux.com
   */

  if (
    !subdomain ||
    subdomain.includes(".")
  ) {
    return "";
  }


  if (
    RESERVED_HOSTS.has(subdomain)
  ) {
    return "";
  }


  if (
    !BUSINESS_KEY_RE.test(subdomain)
  ) {
    return "";
  }


  return subdomain;
}


/* =========================================================
   PAGES URL
========================================================= */

function pagesURL(
  pathname,
  search = ""
) {

  const safePath =
    pathname &&
    pathname.startsWith("/")
      ? pathname
      : "/" + String(pathname || "");


  return (
    PAGES_ORIGIN +
    safePath +
    search
  );
}


/* =========================================================
   CREATE REQUEST FOR PAGES ORIGIN
========================================================= */

function makeOriginRequest(
  request,
  targetURL
) {

  const headers =
    new Headers(
      request.headers
    );


  /*
   * VERY IMPORTANT
   *
   * Do not forward the BusinessKey hostname
   * or browser Origin to the Pages origin.
   *
   * Host:
   *   mukesh.ubnux.com
   *
   * must NOT be sent to:
   *   newubnux.pages.dev
   *
   * Origin:
   *   https://mukesh.ubnux.com
   *
   * is also removed for the internal Pages/API
   * request. The Worker adds the correct CORS
   * headers on the response.
   */

  headers.delete("host");
  headers.delete("origin");


  /*
   * Content-Length belongs to the
   * original request and may become
   * invalid after request rewriting.
   */

  headers.delete(
    "content-length"
  );


  const init = {
    method:
      request.method,

    headers,

    redirect:
      "follow"
  };


  /*
   * Preserve request body for POST/PUT/PATCH.
   */

  if (
    request.method !== "GET" &&
    request.method !== "HEAD"
  ) {

    init.body =
      request.body;

  }


  return new Request(
    targetURL,
    init
  );
}


/* =========================================================
   COPY RESPONSE
========================================================= */

function copyResponse(
  response,
  extraHeaders = {}
) {

  const headers =
    new Headers(
      response.headers
    );


  for (
    const [
      key,
      value
    ] of Object.entries(
      extraHeaders
    )
  ) {

    headers.set(
      key,
      value
    );

  }


  return new Response(
    response.body,
    {
      status:
        response.status,

      statusText:
        response.statusText,

      headers
    }
  );
}


/* =========================================================
   BUSINESS ROUTE OBJECT
========================================================= */

function createBusinessRoute(
  businessKey
) {

  return {

    type:
      "business",

    isBusinessPage:
      true,

    isSEOPage:
      false,

    isBusinessKeyPage:
      true,

    /*
     * Sentinel values.
     *
     * business-page.js only needs
     * these values to be non-empty.
     */

    stateSlug:
      "business-key",

    districtSlug:
      "business-key",

    categorySlug:
      "business-key",

    businessSlug:
      businessKey,

    canonicalPath:
      "/"

  };
}


/* =========================================================
   BUSINESS KEY BRIDGE
========================================================= */

function bridgeScript(
  businessKey
) {

  /*
   * JSON.stringify makes the value
   * safe to inject into JavaScript.
   */

  const safeKey =
    JSON.stringify(
      businessKey
    );


  return `
<script>
(function () {

  "use strict";


  /* =======================================================
     BUSINESS KEY
  ======================================================= */

  var key =
    ${safeKey};


  var SENTINEL =
    "business-key";


  window.UBNUX_BUSINESS_KEY_HOST =
    key;


  window.UBNUX_BUSINESS_KEY =
    key;


  window.UBNUX_BUSINESS_KEY_ROUTE =
    true;


  /* =======================================================
     ROUTE OBJECT
  ======================================================= */

  function routeObject() {

    return {

      type:
        "business",

      isBusinessPage:
        true,

      isSEOPage:
        false,

      isBusinessKeyPage:
        true,

      stateSlug:
        SENTINEL,

      districtSlug:
        SENTINEL,

      categorySlug:
        SENTINEL,

      businessSlug:
        key,

      canonicalPath:
        "/"

    };

  }


  /* =======================================================
     SEO ROUTER PATCH
  ======================================================= */

  function patchRouter(
    router
  ) {

    if (
      !router ||
      router.__ubnuxBusinessKeyPatched
    ) {

      return;

    }


    router.__ubnuxBusinessKeyPatched =
      true;


    /*
     * BusinessKey URL is always
     * treated as a business page.
     */

    router.getCurrentRoute =
      function () {

        return routeObject();

      };


    router.isBusinessPage =
      function () {

        return true;

      };


    router.parse =
      function () {

        return routeObject();

      };

  }


  /*
   * Current UBnux SEO router.
   */

  patchRouter(
    window.UBNUX_SEO_ROUTER
  );


  patchRouter(
    window.UBnuxSEORouter
  );


  /*
   * Compatibility namespace.
   */

  if (
    window.App &&
    window.App.seoRouter
  ) {

    patchRouter(
      window.App.seoRouter
    );

  }


  /* =======================================================
     API PATCH
  ======================================================= */

  var api =
    window.UBnuxAPI ||
    window.ZilaBizAPI;


  if (
    api &&
    !api.__ubnuxBusinessKeyPatched
  ) {

    api.__ubnuxBusinessKeyPatched =
      true;


    /*
     * Save original functions.
     */

    var originalGetBusiness =
      api.getBusiness;


    var originalGetBusinessBySEO =
      api.getBusinessBySEO;


    var originalGetBusinessBySlug =
      api.getBusinessBySlug;


    /* =====================================================
       DETECT BUSINESS KEY PARAMETERS
    ===================================================== */

    function isBusinessKeyParams(
      input
    ) {

      if (
        !input ||
        typeof input !== "object"
      ) {

        return false;

      }


      var state =
        String(
          input.state ||
          input.stateSlug ||
          ""
        ).toLowerCase();


      var district =
        String(
          input.district ||
          input.districtSlug ||
          ""
        ).toLowerCase();


      var category =
        String(
          input.category ||
          input.categorySlug ||
          ""
        ).toLowerCase();


      var slug =
        String(
          input.slug ||
          input.businessSlug ||
          ""
        ).toLowerCase();


      return (

        state ===
          SENTINEL &&

        district ===
          SENTINEL &&

        category ===
          SENTINEL &&

        slug ===
          key

      );

    }


    /* =====================================================
       BUSINESS KEY API REQUEST
    ===================================================== */

    function requestBusinessKey(
      options
    ) {

      if (
        !api ||
        typeof api.request !==
          "function"
      ) {

        return Promise.reject(
          new Error(
            "UBnux API request() is unavailable."
          )
        );

      }


      return api.request(

        "business-key",

        {
          key:
            key
        },

        Object.assign(
          {},
          options || {},
          {
            cache:
              false
          }
        )

      );

    }


    /* =====================================================
       getBusiness()
    ===================================================== */

    api.getBusiness =
      async function (
        input,
        options
      ) {

        /*
         * BusinessKey request.
         */

        if (
          isBusinessKeyParams(
            input
          )
        ) {

          return requestBusinessKey(
            options
          );

        }


        /*
         * Normal UBnux business
         * request remains unchanged.
         */

        return originalGetBusiness.call(
          api,
          input,
          options
        );

      };


    /* =====================================================
       getBusinessBySEO()
    ===================================================== */

    if (
      typeof originalGetBusinessBySEO ===
      "function"
    ) {

      api.getBusinessBySEO =
        async function (
          input,
          options
        ) {

          if (
            isBusinessKeyParams(
              input
            )
          ) {

            return requestBusinessKey(
              options
            );

          }


          return originalGetBusinessBySEO.call(
            api,
            input,
            options
          );

        };

    }


    /* =====================================================
       getBusinessBySlug()
    ===================================================== */

    if (
      typeof originalGetBusinessBySlug ===
      "function"
    ) {

      api.getBusinessBySlug =
        async function () {

          var args =
            Array.prototype.slice.call(
              arguments
            );


          /*
           * Object format:
           *
           * getBusinessBySlug({
           *   state: "business-key",
           *   district: "business-key",
           *   category: "business-key",
           *   slug: "mk"
           * })
           */

          if (
            args.length === 1 &&
            isBusinessKeyParams(
              args[0]
            )
          ) {

            return requestBusinessKey(
              args[1]
            );

          }


          return originalGetBusinessBySlug.apply(
            api,
            args
          );

        };

    }

  }


  /* =======================================================
     READY EVENT
  ======================================================= */

  window.dispatchEvent(

    new CustomEvent(
      "ubnux:business-key-ready",
      {
        detail: {
          businessKey:
            key
        }
      }
    )

  );


})();
</script>
`;

}


/* =========================================================
   FETCH FROM CLOUDFLARE PAGES
========================================================= */

async function fetchPages(
  request,
  pathname,
  search = ""
) {

  const target =
    pagesURL(
      pathname,
      search
    );


  const originRequest =
    makeOriginRequest(
      request,
      target
    );


  return fetch(
    originRequest
  );
}


/* =========================================================
   BUSINESS HTML SHELL
========================================================= */

async function serveBusinessShell(
  request,
  businessKey
) {

  const response =
    await fetchPages(
      request,
      "/business.html"
    );


  /*
   * If Pages origin fails,
   * return the original error.
   */

  if (
    !response.ok
  ) {

    return copyResponse(
      response,
      {
        "X-UBnux-BusinessKey":
          businessKey,

        "X-UBnux-Subdomain":
          "1",

        "X-UBnux-Origin":
          "pages"
      }
    );

  }


  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  if (
    !contentType
      .toLowerCase()
      .includes("text/html")
  ) {

    return copyResponse(
      response,
      {
        "X-UBnux-BusinessKey":
          businessKey,

        "X-UBnux-Subdomain":
          "1",

        "X-UBnux-Origin":
          "pages"
      }
    );

  }


  let html =
    await response.text();


  const injected =
    bridgeScript(
      businessKey
    );


  /* =======================================================
     INJECT BEFORE business-page.js
  ======================================================= */

  const scriptMarker =
    /<script[^>]+assets\/js\/seo\/business-page\.js[^>]*><\/script>/i;


  if (
    scriptMarker.test(
      html
    )
  ) {

    html =
      html.replace(
        scriptMarker,
        injected +
          "\n" +
          "$&"
      );

  } else {

    /*
     * Fail-safe if the filename
     * changes in future.
     */

    html =
      html.replace(
        /<\/body>/i,
        injected +
          "\n</body>"
      );

  }


  const headers =
    new Headers(
      response.headers
    );


  headers.set(
    "Content-Type",
    "text/html; charset=UTF-8"
  );


  /*
   * Do not cache the generated
   * BusinessKey HTML shell.
   */

  headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );


  headers.set(
    "X-UBnux-BusinessKey",
    businessKey
  );


  headers.set(
    "X-UBnux-Subdomain",
    "1"
  );


  headers.set(
    "X-UBnux-Origin",
    "pages"
  );

  headers.set(
    "X-UBnux-API",
    "worker-proxy"
  );


  return new Response(
    html,
    {
      status:
        response.status,

      statusText:
        response.statusText,

      headers
    }
  );

}


/* =========================================================
   API PROXY
========================================================= */

/*
 * BusinessKey pages use:
 *
 *   https://business-key.ubnux.com/api
 *
 * instead of directly calling:
 *
 *   https://ubnux.com/api
 *
 * The Worker proxies that request to the existing
 * Cloudflare Pages Function at:
 *
 *   https://newubnux.pages.dev/api
 *
 * This keeps the existing Apps Script backend unchanged
 * while allowing every BusinessKey subdomain to use the
 * same API endpoint.
 */


function getRequestOrigin(request) {

  const origin =
    request.headers.get("Origin");

  if (
    origin &&
    /^https:\/\/[a-z0-9-]+\.ubnux\.com$/i.test(origin)
  ) {

    return origin;

  }


  /*
   * Main UBnux origins are also accepted.
   */

  if (
    origin === "https://ubnux.com" ||
    origin === "https://www.ubnux.com"
  ) {

    return origin;

  }


  return "";

}


function apiCorsHeaders(request) {

  const origin =
    getRequestOrigin(request);


  const headers = {

    "Access-Control-Allow-Methods":
      "GET, HEAD, POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Accept, Content-Type, Authorization",

    "Access-Control-Max-Age":
      "86400",

    "Vary":
      "Origin"

  };


  if (origin) {

    headers[
      "Access-Control-Allow-Origin"
    ] = origin;

  }


  return headers;

}


function handleAPIOptions(request) {

  const headers =
    apiCorsHeaders(request);


  return new Response(
    null,
    {
      status:
        204,

      headers
    }
  );

}


async function proxyAPI(
  request,
  url
) {

  /*
   * Only the path/query changes.
   *
   * Example:
   *
   * https://mukesh.ubnux.com/api?action=business-key&key=mukesh
   *
   * becomes:
   *
   * https://newubnux.pages.dev/api?action=business-key&key=mukesh
   */

  const target =
    pagesURL(
      url.pathname,
      url.search
    );


  const originRequest =
    makeOriginRequest(
      request,
      target
    );


  const response =
    await fetch(
      originRequest
    );


  /*
   * Copy the Pages Function response,
   * then replace CORS headers so the
   * browser accepts the BusinessKey origin.
   */

  const headers =
    new Headers(
      response.headers
    );


  const cors =
    apiCorsHeaders(request);


  for (
    const [
      key,
      value
    ] of Object.entries(cors)
  ) {

    headers.set(
      key,
      value
    );

  }


  /*
   * Never expose the Pages Function's
   * original CORS origin to the browser.
   */

  headers.delete(
    "Access-Control-Allow-Credentials"
  );


  headers.set(
    "X-UBnux-API-Proxy",
    "business-key-worker"
  );


  headers.set(
    "X-UBnux-Origin",
    "pages-function"
  );


  return new Response(
    response.body,
    {
      status:
        response.status,

      statusText:
        response.statusText,

      headers
    }
  );

}


function isAPIPath(
  pathname
) {

  return (
    pathname === "/api" ||
    pathname.startsWith("/api/")
  );

}


/* =========================================================
   STATIC FILES
========================================================= */

const STATIC_PREFIXES = [

  "/assets/",

  "/favicon.ico",

  "/robots.txt",

  "/sitemap.xml"

];


function isStaticPath(
  pathname
) {

  return STATIC_PREFIXES.some(
    function (
      prefix
    ) {

      return (
        pathname === prefix ||
        pathname.startsWith(
          prefix
        )
      );

    }
  );

}


/* =========================================================
   WORKER
========================================================= */

export default {

  async fetch(
    request
  ) {

    const url =
      new URL(
        request.url
      );


    const host =
      url.hostname
        .toLowerCase();


    const businessKey =
      getBusinessKey(
        host
      );


    /* =====================================================
       API
    ===================================================== */

    /*
     * IMPORTANT:
     *
     * /api is a PATH on the current hostname.
     *
     * It is NOT the reserved api.ubnux.com
     * hostname.
     *
     * BusinessKey API request:
     *
     *   https://mukesh.ubnux.com/api
     *
     * is proxied to:
     *
     *   https://newubnux.pages.dev/api
     */

    if (
      isAPIPath(
        url.pathname
      )
    ) {

      if (
        request.method ===
        "OPTIONS"
      ) {

        return handleAPIOptions(
          request
        );

      }


      if (
        request.method !== "GET" &&
        request.method !== "HEAD" &&
        request.method !== "POST"
      ) {

        return new Response(
          "Method Not Allowed",
          {
            status:
              405,

            headers: {
              "Allow":
                "GET, HEAD, POST, OPTIONS",

              "Cache-Control":
                "no-store"
            }
          }
        );

      }


      try {

        return await proxyAPI(
          request,
          url
        );

      } catch (
        error
      ) {

        const headers =
          new Headers(
            apiCorsHeaders(request)
          );


        headers.set(
          "Content-Type",
          "application/json; charset=UTF-8"
        );

        headers.set(
          "Cache-Control",
          "no-store"
        );


        return new Response(
          JSON.stringify({
            success:
              false,

            error:
              "UBnux API proxy error",

            message:
              String(
                (
                  error &&
                  error.message
                ) ||
                error
              )
          }),
          {
            status:
              502,

            headers
          }
        );

      }

    }


    /* =====================================================
       RESERVED / INVALID HOST
    ===================================================== */

    if (
      !businessKey
    ) {

      /*
       * www.ubnux.com is allowed
       * to continue using Pages.
       *
       * IMPORTANT:
       * We do NOT use fetch(request)
       * here because that can target
       * this same Worker route again.
       */

      if (
        host ===
        "www.ubnux.com"
      ) {

        try {

          return await fetchPages(
            request,
            url.pathname,
            url.search
          );

        } catch (
          error
        ) {

          return new Response(
            "UBnux www origin error",
            {
              status:
                502,

              headers: {
                "Content-Type":
                  "text/plain; charset=UTF-8",

                "Cache-Control":
                  "no-store"
              }
            }
          );

        }

      }


      /*
       * Unknown / reserved
       * subdomain.
       */

      return new Response(
        "UBnux hostname not configured",
        {
          status:
            404,

          headers: {
            "Content-Type":
              "text/plain; charset=UTF-8",

            "Cache-Control":
              "no-store"
          }
        }
      );

    }


    /* =====================================================
       METHODS
    ===================================================== */

    if (
      request.method !== "GET" &&
      request.method !== "HEAD"
    ) {

      return new Response(
        "Method Not Allowed",
        {
          status:
            405,

          headers: {
            Allow:
              "GET, HEAD",

            "Cache-Control":
              "no-store"
          }
        }
      );

    }


    /* =====================================================
       HEAD
    ===================================================== */

    if (
      request.method ===
      "HEAD"
    ) {

      try {

        const response =
          await fetchPages(
            request,
            "/business.html"
          );


        return copyResponse(
          response,
          {
            "X-UBnux-BusinessKey":
              businessKey,

            "X-UBnux-Subdomain":
              "1",

            "X-UBnux-Origin":
              "pages"
          }
        );

      } catch (
        error
      ) {

        return new Response(
          null,
          {
            status:
              502,

            headers: {
              "Cache-Control":
                "no-store",

              "X-UBnux-BusinessKey":
                businessKey
            }
          }
        );

      }

    }


    /* =====================================================
       STATIC ASSETS
    ===================================================== */

    if (
      isStaticPath(
        url.pathname
      )
    ) {

      try {

        const response =
          await fetchPages(
            request,
            url.pathname,
            url.search
          );


        return copyResponse(
          response,
          {
            "X-UBnux-BusinessKey":
              businessKey,

            "X-UBnux-Subdomain":
              "1",

            "X-UBnux-Origin":
              "pages"
          }
        );

      } catch (
        error
      ) {

        return new Response(
          "Static asset origin error",
          {
            status:
              502,

            headers: {
              "Content-Type":
                "text/plain; charset=UTF-8",

              "Cache-Control":
                "no-store",

              "X-UBnux-BusinessKey":
                businessKey
            }
          }
        );

      }

    }


    /* =====================================================
       BUSINESS PAGE
    ===================================================== */

    try {

      return await serveBusinessShell(
        request,
        businessKey
      );

    } catch (
      error
    ) {

      return new Response(
        "UBnux BusinessKey Worker origin error",
        {
          status:
            502,

          headers: {
            "Content-Type":
              "text/plain; charset=UTF-8",

            "Cache-Control":
              "no-store",

            "X-UBnux-BusinessKey":
              businessKey,

            "X-UBnux-Error":
              String(
                (
                  error &&
                  error.message
                ) ||
                error
              )
          }
        }
      );

    }

  }

};

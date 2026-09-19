/* =========================================================
   UBnux - Business SEO Router
   File: assets/js/seo/seo-router.js
   Version: 2.2.0

   Responsibilities:
   - Read current URL
   - Detect Business SEO route
   - Extract state/district/category/business slug
   - Provide parse() API
   - Maintain compatibility with business-page.js
   - NEVER overwrite the main UBnux router
   - Support permanent /in/ business URLs
   - Safe with Cloudflare Pages rewrites
   - Safe with query strings / hashes
   - Never redirect the browser

   BUSINESS URL
   ---------------------------------------------------------
   /in/bihar/siwan/clothing-and-fashion/siwan-fashion-house/

   IMPORTANT:
   - This is NOT the main application router.
   - Main routing is handled by assets/js/router.js
   - This router is specifically for business-page.js
   - This file NEVER changes window.location
========================================================= */

(function (
  window,
  document
) {

  "use strict";


  /* =======================================================
     SAFE VALUE
  ======================================================= */

  function clean(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(value).trim();

  }


  /* =======================================================
     SAFE DECODE
  ======================================================= */

  function safeDecode(value) {

    const input =
      clean(value);

    if (!input) {

      return "";

    }

    try {

      return decodeURIComponent(
        input
      );

    } catch (error) {

      /*
       * Invalid encoded URL must never
       * break the business page.
       */

      return input;

    }

  }


  /* =======================================================
     SAFE SLUG
     -------------------------------------------------------
     Converts:

       "Siwan Fashion House"
       "siwan-fashion-house"
       "%20"

     into:

       "siwan-fashion-house"
  ======================================================= */

  function cleanSlug(value) {

    return safeDecode(
      value
    )
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  }


  /* =======================================================
     NORMALIZE PATH
     -------------------------------------------------------
     IMPORTANT:
     - pathname only
     - query string ignored
     - hash ignored
     - duplicate slash removed
     - trailing slash removed internally
  ======================================================= */

  function normalizePath(path) {

    let value =
      clean(
        path
      );


    /*
     * If path was not supplied,
     * use current browser pathname.
     */

    if (!value) {

      value =
        (
          window.location &&
          window.location.pathname
        ) ||
        "/";

    }


    /*
     * Remove query string.
     */

    value =
      value.split("?")[0];


    /*
     * Remove hash.
     */

    value =
      value.split("#")[0];


    /*
     * Decode safely before parsing.
     */

    value =
      safeDecode(
        value
      );


    /*
     * Convert duplicate slashes:
     *
     * //in//bihar//
     *
     * into:
     *
     * /in/bihar/
     */

    value =
      value.replace(
        /\/+/g,
        "/"
      );


    /*
     * Always start with /
     */

    if (
      value.charAt(0) !== "/"
    ) {

      value =
        "/" + value;

    }


    /*
     * Remove trailing slash
     * for internal parsing.
     */

    value =
      value.replace(
        /\/+$/,
        ""
      );


    return value || "/";

  }


  /* =======================================================
     GET CURRENT PATH
  ======================================================= */

  function getPath() {

    return normalizePath(
      window.location &&
      window.location.pathname
    );

  }


  /* =======================================================
     GET SEGMENTS
  ======================================================= */

  function getSegments(path) {

    const normalized =
      normalizePath(
        path
      );


    if (
      normalized === "/"
    ) {

      return [];

    }


    return normalized
      .split("/")
      .filter(
        function (item) {

          return Boolean(
            clean(item)
          );

        }
      )
      .map(
        function (item) {

          return cleanSlug(
            item
          );

        }
      );

  }


  /* =======================================================
     BUILD BUSINESS ROUTE
     -------------------------------------------------------
     Required:

       /in/
       state
       district
       category
       business

     Exactly 5 segments.
  ======================================================= */

  function buildBusinessRoute(
    parts
  ) {

    if (
      !Array.isArray(parts) ||
      parts.length !== 5
    ) {

      return null;

    }


    /*
     * First segment MUST be "in".
     */

    if (
      cleanSlug(
        parts[0]
      ) !== "in"
    ) {

      return null;

    }


    const stateSlug =
      cleanSlug(
        parts[1]
      );


    const districtSlug =
      cleanSlug(
        parts[2]
      );


    const categorySlug =
      cleanSlug(
        parts[3]
      );


    const businessSlug =
      cleanSlug(
        parts[4]
      );


    /*
     * Every SEO segment is mandatory.
     */

    if (
      !stateSlug ||
      !districtSlug ||
      !categorySlug ||
      !businessSlug
    ) {

      return null;

    }


    /*
     * "in" itself cannot be used as
     * a business slug.
     */

    if (
      businessSlug === "in"
    ) {

      return null;

    }


    return {

      type:
        "business",

      isBusinessPage:
        true,

      isSEOPage:
        true,

      stateSlug:
        stateSlug,

      districtSlug:
        districtSlug,

      categorySlug:
        categorySlug,

      businessSlug:
        businessSlug,

      canonicalPath:
        "/in/" +
        stateSlug +
        "/" +
        districtSlug +
        "/" +
        categorySlug +
        "/" +
        businessSlug +
        "/"

    };

  }


  /* =======================================================
     PARSE BUSINESS ROUTE
  ======================================================= */

  function parseBusinessRoute(
    path
  ) {

    const currentPath =
      (
        path !== undefined &&
        path !== null
      )

        ? path

        : getPath();


    const parts =
      getSegments(
        currentPath
      );


    return buildBusinessRoute(
      parts
    );

  }


  /* =======================================================
     GENERIC PARSE
     -------------------------------------------------------
     business-page.js uses:

       UBnuxSEORouter.parse(
         window.location.pathname
       );
  ======================================================= */

  function parse(
    path
  ) {

    const businessRoute =
      parseBusinessRoute(
        path
      );


    /*
     * Valid Business SEO URL.
     */

    if (
      businessRoute
    ) {

      return businessRoute;

    }


    /*
     * Non-business route.

     * IMPORTANT:
     * Never convert category/state/district
     * routes into business routes.
     */

    return {

      type:
        "unknown",

      isBusinessPage:
        false,

      isSEOPage:
        false,

      stateSlug:
        "",

      districtSlug:
        "",

      categorySlug:
        "",

      businessSlug:
        "",

      canonicalPath:
        normalizePath(
          path
        )

    };

  }


  /* =======================================================
     CHECK BUSINESS PAGE
  ======================================================= */

  function isBusinessPage(
    path
  ) {

    const route =
      parse(
        path
      );


    return Boolean(

      route &&

      route.type ===
        "business" &&

      route.isBusinessPage ===
        true &&

      route.stateSlug &&

      route.districtSlug &&

      route.categorySlug &&

      route.businessSlug

    );

  }


  /* =======================================================
     GET CURRENT ROUTE
  ======================================================= */

  function getCurrentRoute() {

    return parse(
      getPath()
    );

  }


  /* =======================================================
     PUBLIC SEO ROUTER
  ======================================================= */

  const UBNUX_SEO_ROUTER = {

    version:
      "2.2.0",

    getPath:
      getPath,

    getSegments:
      getSegments,

    parse:
      parse,

    parseBusinessRoute:
      parseBusinessRoute,

    getCurrentRoute:
      getCurrentRoute,

    isBusinessPage:
      isBusinessPage

  };


  /* =======================================================
     GLOBAL EXPORTS
  ======================================================= */

  /*
   * Primary SEO router.
   */

  window.UBNUX_SEO_ROUTER =
    UBNUX_SEO_ROUTER;


  /*
   * Compatibility name required by
   * business-page.js.
   */

  window.UBnuxSEORouter =
    UBNUX_SEO_ROUTER;


  /* =======================================================
     APP NAMESPACE
  ======================================================= */

  /*
   * Do NOT replace the main router.
   *
   * WRONG:
   *
   * window.App.router =
   *   UBNUX_SEO_ROUTER;
   */

  window.App =
    window.App ||
    {};


  /*
   * SEO router gets its own namespace.
   */

  window.App.seoRouter =
    UBNUX_SEO_ROUTER;


  /* =======================================================
     DEBUG
  ======================================================= */

  if (
    window.console &&
    typeof window.console.debug ===
      "function"
  ) {

    const currentRoute =
      UBNUX_SEO_ROUTER.getCurrentRoute();


    console.debug(
      "UBnux Business SEO Router initialized.",
      {
        version:
          UBNUX_SEO_ROUTER.version,

        path:
          UBNUX_SEO_ROUTER.getPath(),

        businessPage:
          UBNUX_SEO_ROUTER.isBusinessPage(),

        currentRoute:
          currentRoute

      }
    );

  }


})(window, document);

/* =========================================================
   UBnux - Business SEO Router
   File: assets/js/seo/seo-router.js
   Version: 2.1.0

   Responsibilities:
   - Read current URL
   - Detect Business SEO route
   - Extract state/district/category/business slug
   - Provide parse() API
   - Maintain compatibility with business-page.js
   - NEVER overwrite the main UBnux router
   - Support permanent /in/ business URLs

   BUSINESS URL
   ---------------------------------------------------------
   /in/bihar/siwan/clothing-and-fashion/siwan-fashion-house/

   IMPORTANT:
   - This is NOT the main application router.
   - Main routing is handled by assets/js/router.js
   - This router is specifically for business-page.js
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

    return String(
      value
    ).trim();

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
       * Invalid encoded URL should not
       * crash the business page.
       */

      return input;

    }

  }


  /* =======================================================
     SAFE SLUG
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
  ======================================================= */

  function normalizePath(path) {

    let value =
      clean(
        path ||
        (
          window.location &&
          window.location.pathname
        ) ||
        "/"
      );


    /*
     * Remove duplicate slashes.
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
     * Remove trailing slash for
     * internal parsing.
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
  ======================================================= */

  function buildBusinessRoute(
    parts
  ) {

    /*
     * Expected:
     *
     * /in/bihar/siwan/
     * clothing-and-fashion/
     * siwan-fashion-house/
     *
     * Parts:
     *
     * 0 = in
     * 1 = bihar
     * 2 = siwan
     * 3 = clothing-and-fashion
     * 4 = siwan-fashion-house
     */

    if (
      !Array.isArray(parts) ||
      parts.length !== 5 ||
      parts[0] !== "in"
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
     * Every part is mandatory.
     */

    if (
      !stateSlug ||
      !districtSlug ||
      !categorySlug ||
      !businessSlug
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
      path !== undefined &&
      path !== null

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


    if (
      businessRoute
    ) {

      return businessRoute;

    }


    /*
     * Non-business route.
     *
     * IMPORTANT:
     * Do not invent business information.
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
      "2.1.0",

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
   * Main compatibility name.
   */

  window.UBNUX_SEO_ROUTER =
    UBNUX_SEO_ROUTER;


  /*
   * business-page.js specifically expects
   * this name.
   */

  window.UBnuxSEORouter =
    UBNUX_SEO_ROUTER;


  /*
   * IMPORTANT:
   *
   * DO NOT DO THIS:
   *
   * window.App.router =
   *   UBNUX_SEO_ROUTER;
   *
   * Because assets/js/router.js already owns
   * the main UBnux router.
   */


  /*
   * Keep App namespace only as a
   * compatibility container.
   */

  window.App =
    window.App ||
    {};


  /*
   * Business-specific router alias.
   *
   * Do NOT overwrite App.router.
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

    console.debug(
      "UBnux Business SEO Router initialized.",
      {
        version:
          UBNUX_SEO_ROUTER.version,

        businessPage:
          UBnuxSEORouter.isBusinessPage(),

        currentRoute:
          UBnuxSEORouter.getCurrentRoute()
      }
    );

  }


})(window, document);

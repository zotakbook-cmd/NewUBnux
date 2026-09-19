
/* =========================================================
   UBnux - SEO Router
   File: assets/js/router.js
   Version: 2.0.0

   Responsibilities:
   - Parse UBnux SEO URLs
   - Detect current page type
   - Extract state / district / category / business slug
   - Generate canonical page URLs
   - Keep routing logic centralized
   - Support permanent /in/ SEO architecture
   - Future Cloudflare Worker compatible

   URL STRUCTURE
   ---------------------------------------------------------
   /in/bihar/
   /in/bihar/siwan/
   /in/bihar/siwan/libraries/
   /in/bihar/siwan/libraries/abc-library/

   IMPORTANT:
   - Does NOT fetch data
   - Does NOT render businesses
   - Does NOT modify existing filters
   - Does NOT interfere with app.js
========================================================= */

(function (window) {

  "use strict";


  /* =======================================================
     NAMESPACE
  ======================================================= */

  window.UBnux =
    window.UBnux ||
    window.ZilaBiz ||
    {};

  window.ZilaBiz =
    window.UBnux;

  var App =
    window.UBnux;


  /* =======================================================
     CONSTANTS
  ======================================================= */

  var SITE_ORIGIN =
    "https://ubnux.com";


  var SEO_PREFIX =
    "in";


  var RESERVED_PATHS = {

    business: true,
    search: true,
    about: true,
    contact: true,
    privacy: true,
    "privacy-policy": true,
    terms: true,
    login: true,
    admin: true,
    api: true,
    assets: true,
    sitemap: true,
    "sitemap.xml": true,
    "robots.txt": true

  };


  /* =======================================================
     HELPERS
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


  function cleanSlug(value) {

    var slug =
      clean(value)
        .toLowerCase()
        .replace(/^\/+|\/+$/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");


    return slug;

  }


  function safeDecode(value) {

    try {

      return decodeURIComponent(
        clean(value)
      );

    } catch (error) {

      return clean(value);

    }

  }


  function normalizePath(pathname) {

    var path =
      clean(
        pathname || "/"
      );


    try {

      path =
        safeDecode(
          path
        );

    } catch (error) {}


    path =
      path
        .replace(/\/+/g, "/");


    if (
      path.charAt(0) !== "/"
    ) {

      path =
        "/" + path;

    }


    /*
     * Keep file URLs as-is:
     *
     * /robots.txt
     * /sitemap.xml
     * /favicon.ico
     */

    if (
      /\.[a-z0-9]+$/i.test(path)
    ) {

      return path;

    }


    /*
     * All normal SEO pages end with /
     */

    if (
      path !== "/" &&
      path.charAt(
        path.length - 1
      ) !== "/"
    ) {

      path += "/";

    }


    return path;

  }


  function getSegments(pathname) {

    var path =
      normalizePath(
        pathname
      );


    return path
      .split("/")
      .filter(function (item) {

        return Boolean(
          clean(item)
        );

      })
      .map(function (item) {

        return cleanSlug(
          item
        );

      });

  }


  function joinURL(path) {

    var normalized =
      normalizePath(
        path
      );


    return (
      SITE_ORIGIN +
      normalized
    );

  }


  /* =======================================================
     INTERNAL SEO PATH CHECK
  ======================================================= */

  function isSEOPath(
    segments
  ) {

    return (
      segments.length >= 2 &&
      segments[0] === SEO_PREFIX
    );

  }


  /* =======================================================
     ROUTE DETECTION
  ======================================================= */

  function parseRoute(pathname) {

    var path =
      normalizePath(
        pathname ||
        window.location.pathname
      );


    var segments =
      getSegments(
        path
      );


    var route = {

      type:
        "unknown",

      path:
        path,

      canonicalPath:
        path,

      canonicalURL:
        joinURL(
          path
        ),

      stateSlug:
        "",

      districtSlug:
        "",

      categorySlug:
        "",

      businessSlug:
        "",

      segments:
        segments.slice()

    };


    /* =====================================================
       HOME
    ===================================================== */

    if (
      segments.length === 0
    ) {

      route.type =
        "home";

      route.canonicalPath =
        "/";

      route.canonicalURL =
        SITE_ORIGIN +
        "/";

      return route;

    }


    /* =====================================================
       RESERVED STATIC PAGES
    ===================================================== */

    if (
      RESERVED_PATHS[
        segments[0]
      ]
    ) {

      route.type =
        "static";

      return route;

    }


    /* =====================================================
       LEGACY BUSINESS URL

       /business/abc-library/

       Kept for compatibility only.
    ===================================================== */

    if (
      segments[0] === "business"
    ) {

      if (
        segments.length === 2 &&
        segments[1]
      ) {

        route.type =
          "business";

        route.businessSlug =
          segments[1];

        route.canonicalPath =
          "/business/" +
          route.businessSlug +
          "/";

        route.canonicalURL =
          joinURL(
            route.canonicalPath
          );

        return route;

      }


      route.type =
        "business-index";

      route.canonicalPath =
        "/business/";

      route.canonicalURL =
        joinURL(
          route.canonicalPath
        );

      return route;

    }


    /* =====================================================
       SEO ROOT

       /in/
    ===================================================== */

    if (
      segments.length === 1 &&
      segments[0] === SEO_PREFIX
    ) {

      route.type =
        "seo-root";

      route.canonicalPath =
        "/in/";

      route.canonicalURL =
        joinURL(
          route.canonicalPath
        );

      return route;

    }


    /* =====================================================
       STATE

       /in/bihar/
    ===================================================== */

    if (
      isSEOPath(segments) &&
      segments.length === 2
    ) {

      route.type =
        "state";

      route.stateSlug =
        segments[1];

      route.canonicalPath =
        "/in/" +
        route.stateSlug +
        "/";

      route.canonicalURL =
        joinURL(
          route.canonicalPath
        );

      return route;

    }


    /* =====================================================
       DISTRICT

       /in/bihar/siwan/
    ===================================================== */

    if (
      isSEOPath(segments) &&
      segments.length === 3
    ) {

      route.type =
        "district";

      route.stateSlug =
        segments[1];

      route.districtSlug =
        segments[2];

      route.canonicalPath =
        "/in/" +
        route.stateSlug +
        "/" +
        route.districtSlug +
        "/";

      route.canonicalURL =
        joinURL(
          route.canonicalPath
        );

      return route;

    }


    /* =====================================================
       CATEGORY

       /in/bihar/siwan/libraries/
    ===================================================== */

    if (
      isSEOPath(segments) &&
      segments.length === 4
    ) {

      route.type =
        "category";

      route.stateSlug =
        segments[1];

      route.districtSlug =
        segments[2];

      route.categorySlug =
        segments[3];

      route.canonicalPath =
        "/in/" +
        route.stateSlug +
        "/" +
        route.districtSlug +
        "/" +
        route.categorySlug +
        "/";

      route.canonicalURL =
        joinURL(
          route.canonicalPath
        );

      return route;

    }


    /* =====================================================
       BUSINESS

       /in/bihar/siwan/libraries/abc-library/
    ===================================================== */

    if (
      isSEOPath(segments) &&
      segments.length === 5
    ) {

      route.type =
        "business";

      route.stateSlug =
        segments[1];

      route.districtSlug =
        segments[2];

      route.categorySlug =
        segments[3];

      route.businessSlug =
        segments[4];

      route.canonicalPath =
        "/in/" +
        route.stateSlug +
        "/" +
        route.districtSlug +
        "/" +
        route.categorySlug +
        "/" +
        route.businessSlug +
        "/";

      route.canonicalURL =
        joinURL(
          route.canonicalPath
        );

      return route;

    }


    /* =====================================================
       UNKNOWN
    ===================================================== */

    return route;

  }


  /* =======================================================
     URL BUILDERS
  ======================================================= */

  function buildHomeURL() {

    return (
      SITE_ORIGIN +
      "/"
    );

  }


  function buildStateURL(
    stateSlug
  ) {

    stateSlug =
      cleanSlug(
        stateSlug
      );


    if (
      !stateSlug
    ) {

      return buildHomeURL();

    }


    return joinURL(

      "/in/" +
      stateSlug +
      "/"

    );

  }


  function buildDistrictURL(
    stateSlug,
    districtSlug
  ) {

    stateSlug =
      cleanSlug(
        stateSlug
      );


    districtSlug =
      cleanSlug(
        districtSlug
      );


    if (
      !stateSlug ||
      !districtSlug
    ) {

      return buildHomeURL();

    }


    return joinURL(

      "/in/" +
      stateSlug +
      "/" +
      districtSlug +
      "/"

    );

  }


  function buildCategoryURL(
    stateSlug,
    districtSlug,
    categorySlug
  ) {

    stateSlug =
      cleanSlug(
        stateSlug
      );


    districtSlug =
      cleanSlug(
        districtSlug
      );


    categorySlug =
      cleanSlug(
        categorySlug
      );


    if (
      !stateSlug ||
      !districtSlug ||
      !categorySlug
    ) {

      return buildHomeURL();

    }


    return joinURL(

      "/in/" +
      stateSlug +
      "/" +
      districtSlug +
      "/" +
      categorySlug +
      "/"

    );

  }


  function buildBusinessURL(
    stateSlug,
    districtSlug,
    categorySlug,
    businessSlug
  ) {

    stateSlug =
      cleanSlug(
        stateSlug
      );


    districtSlug =
      cleanSlug(
        districtSlug
      );


    categorySlug =
      cleanSlug(
        categorySlug
      );


    businessSlug =
      cleanSlug(
        businessSlug
      );


    /*
     * New permanent SEO business URL
     */

    if (
      stateSlug &&
      districtSlug &&
      categorySlug &&
      businessSlug
    ) {

      return joinURL(

        "/in/" +
        stateSlug +
        "/" +
        districtSlug +
        "/" +
        categorySlug +
        "/" +
        businessSlug +
        "/"

      );

    }


    /*
     * Legacy fallback
     */

    if (
      businessSlug
    ) {

      return joinURL(

        "/business/" +
        businessSlug +
        "/"

      );

    }


    return (
      SITE_ORIGIN +
      "/business/"
    );

  }


  /* =======================================================
     CURRENT ROUTE
  ======================================================= */

  function getCurrentRoute() {

    return parseRoute(
      window.location.pathname
    );

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  App.router = {

    SITE_ORIGIN:
      SITE_ORIGIN,

    SEO_PREFIX:
      SEO_PREFIX,

    normalizePath:
      normalizePath,

    cleanSlug:
      cleanSlug,

    parseRoute:
      parseRoute,

    getCurrentRoute:
      getCurrentRoute,

    buildHomeURL:
      buildHomeURL,

    buildStateURL:
      buildStateURL,

    buildDistrictURL:
      buildDistrictURL,

    buildCategoryURL:
      buildCategoryURL,

    buildBusinessURL:
      buildBusinessURL

  };


  /* =======================================================
     GLOBAL COMPATIBILITY HELPERS
  ======================================================= */

  App.getCurrentRoute =
    getCurrentRoute;

  App.buildBusinessURL =
    buildBusinessURL;

  App.buildCategoryURL =
    buildCategoryURL;

  App.buildDistrictURL =
    buildDistrictURL;

  App.buildStateURL =
    buildStateURL;


})(window);

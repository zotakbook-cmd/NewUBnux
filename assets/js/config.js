/* =========================================================
   UBnux
   File: assets/js/config.js
   Version: 4.0.0
   Static-First Architecture
========================================================= */

(function (window) {

  "use strict";


  /* =====================================================
     CURRENT ORIGIN
  ===================================================== */

  var CURRENT_ORIGIN =
    window.location.origin;


  /*
   * Main API remains same-origin.
   *
   * Browser
   *   ↓
   * Current Origin /api
   *   ↓
   * Cloudflare Worker / Pages Function
   *   ↓
   * Google Apps Script
   *
   * IMPORTANT:
   * Google Apps Script URL must NOT be exposed here.
   */

  var API_URL =
    CURRENT_ORIGIN + "/api";


  /* =====================================================
     STATIC DATA
  ===================================================== */

  /*
   * Static-first architecture:
   *
   * Homepage does NOT need Apps Script / API for master data.
   *
   * Browser
   *   ↓
   * Static JSON
   *   ↓
   * Cloudflare
   *
   * Business data is loaded separately only after
   * an explicit search/filter/detail action.
   */

  var STATIC_DATA_BASE =
    "/assets/data";


  var STATES_JSON_URL =
    STATIC_DATA_BASE + "/states.json";


  var DISTRICTS_JSON_URL =
    STATIC_DATA_BASE + "/districts.json";


  var CATEGORIES_JSON_URL =
    STATIC_DATA_BASE + "/categories.json";


  /* =====================================================
     SITE
  ===================================================== */

  window.UBNUX_CONFIG = {

    /* =====================================================
       API
    ===================================================== */

    API_URL:
      API_URL,


    /* =====================================================
       STATIC DATA
    ===================================================== */

    STATIC_DATA_BASE:
      STATIC_DATA_BASE,

    STATES_JSON_URL:
      STATES_JSON_URL,

    DISTRICTS_JSON_URL:
      DISTRICTS_JSON_URL,

    CATEGORIES_JSON_URL:
      CATEGORIES_JSON_URL,


    /* =====================================================
       SITE
    ===================================================== */

    SITE_NAME:
      "UBnux",

    SITE_URL:
      "https://ubnux.com",

    PUBLIC_ORIGIN:
      "https://ubnux.com",


    /* =====================================================
       BUSINESS LISTING
    ===================================================== */

    BUSINESS_PAGE_SIZE:
      18,

    DEFAULT_SORT:
      "featured",


    /* =====================================================
       CACHE
    ===================================================== */

    /*
     * Static JSON is controlled by browser/CDN caching.
     *
     * API cache remains disabled during current testing.
     */

    CACHE_TTL:
      1000 * 60 * 10,

    API_CACHE_TTL:
      0,


    /* =====================================================
       LOADER
    ===================================================== */

    MINIMUM_LOADER_TIME:
      350,


    /* =====================================================
       LOCAL STORAGE
    ===================================================== */

    STORAGE_PREFIX:
      "ubnux_",


    /* =====================================================
       SEO
    ===================================================== */

    SEO: {

      DEFAULT_TITLE:
        "UBnux - Find Local Businesses, Shops & Services Near You",

      DEFAULT_DESCRIPTION:
        "Discover local businesses, shops, services and professionals near you with UBnux.",

      DEFAULT_ROBOTS:
        "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",

      DEFAULT_IMAGE:
        "https://ubnux.com/assets/images/default-business.jpg"

    },


    /* =====================================================
       FEATURE FLAGS
    ===================================================== */

    FEATURES: {

      BUSINESS_SEO:
        true,

      BUSINESS_TEMPLATES:
        true,

      BUSINESS_SCHEMA:
        true,

      BUSINESS_BREADCRUMBS:
        true

    },


    /* =====================================================
       STATIC-FIRST FLAGS
    ===================================================== */

    STATIC_FIRST:
      true,

    LOAD_BUSINESSES_ON_START:
      false,

    LOAD_MASTER_DATA_FROM_API_ON_START:
      false,

    ENABLE_STATIC_MASTER_DATA:
      true

  };


  /* =======================================================
     BACKWARD COMPATIBILITY
  ====================================================== */

  window.ZilaBizConfig =
    window.UBNUX_CONFIG;


  /* =======================================================
     DEBUG
  ====================================================== */

  if (
    window.console &&
    typeof window.console.debug === "function"
  ) {

    window.console.debug(
      "[UBnux Config] Static-first configuration loaded.",
      {
        version: "4.0.0",
        apiURL: API_URL,
        staticDataBase: STATIC_DATA_BASE,
        statesJSON: STATES_JSON_URL,
        districtsJSON: DISTRICTS_JSON_URL,
        categoriesJSON: CATEGORIES_JSON_URL,
        staticFirst: true
      }
    );

  }


})(window);

/* =========================================================
   UBnux
   File: assets/js/config.js
   Version: 3.0.0
========================================================= */

(function (window) {

  "use strict";


  /* =======================================================
     UBNux GLOBAL CONFIG
  ======================================================= */

  window.UBNUX_CONFIG = {

    /* =====================================================
       API
    ===================================================== */

    /*
     * Google Apps Script Web App /exec URL
     *
     * IMPORTANT:
     * Keep this as the canonical GAS /exec endpoint.
     *
     * Do NOT add:
     * ?action=...
     * ?callback=...
     * trailing parameters
     */

    API_URL:
      "https://script.google.com/macros/s/AKfycbzZ3GtCryDG8WB5YkutJiXk-2YoHEN7KPTAeYWtmqq0mKp6oHRdV2g2WMg-BWyQSB07rg/exec",


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
     * Frontend cache lifetime.
     *
     * 10 minutes
     */

    CACHE_TTL:
      1000 * 60 * 10,


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

    }

  };


  /* =======================================================
     BACKWARD COMPATIBILITY
  ======================================================= */

  window.ZilaBizConfig =
    window.UBNUX_CONFIG;


})(window);

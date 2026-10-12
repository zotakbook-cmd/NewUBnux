/* =========================================================
   UBnux
   File: assets/js/config.js
   Version: 3.0.2
========================================================= */

(function (window) {

  "use strict";


  window.UBNUX_CONFIG = {

    /* =====================================================
       API
    ===================================================== */

    /*
     * Cloudflare Pages Function
     *
     * Browser → Cloudflare → Google Apps Script
     *
     * DO NOT put Google Apps Script URL here.
     */

    API_URL:
      "https://ubnux.com/api",


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

    CACHE_TTL:
      1000 * 60 * 10,

    /*
     * API cache intentionally disabled
     * during current testing phase.
     */

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

    }

  };


  /* =======================================================
     BACKWARD COMPATIBILITY
  ====================================================== */

  window.ZilaBizConfig =
    window.UBNUX_CONFIG;


})(window);

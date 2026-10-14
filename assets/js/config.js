/* =========================================================
   UBnux
   File: assets/js/config.js
   Version: 3.0.3
========================================================= */

(function (window) {

  "use strict";


  /* =====================================================
     CURRENT ORIGIN
  ===================================================== */

  /*
   * API अब current domain/origin से चलेगी.
   *
   * Main site:
   * https://ubnux.com/api
   *
   * BusinessKey site:
   * https://siwan-fashion-house.ubnux.com/api
   *
   * https://mukesh.ubnux.com/api
   *
   * इससे BusinessKey subdomain पर CORS problem नहीं होगी,
   * क्योंकि request उसी hostname के /api endpoint पर जाएगी.
   */

  var CURRENT_ORIGIN =
    window.location.origin;


  window.UBNUX_CONFIG = {

    /* =====================================================
       API
    ===================================================== */

    /*
     * Cloudflare Pages / Worker API proxy
     *
     * Browser
     *    ↓
     * Current Origin /api
     *    ↓
     * Cloudflare Worker / Pages Function
     *    ↓
     * Google Apps Script
     *
     * IMPORTANT:
     * Google Apps Script URL यहाँ नहीं डालना है.
     */

    API_URL:
      CURRENT_ORIGIN + "/api",


    /* =====================================================
       SITE
    ===================================================== */

    SITE_NAME:
      "UBnux",

    /*
     * Main canonical website origin.
     *
     * BusinessKey subdomains भी इसी main website
     * को canonical SEO origin के रूप में use करेंगे.
     */

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

      /*
       * Default image remains on main UBnux domain.
       */

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

/* UBnux Config v5.0.1 Secure Static First */
(function(window){
  "use strict";
  var origin = window.location.origin || "https://ubnux.com";
  window.UBNUX_CONFIG = {
    VERSION: "5.0.1-secure",
    SITE_NAME: "UBnux",
    SITE_URL: "https://ubnux.com",
    PUBLIC_ORIGIN: origin,
    API_URL: origin + "/api",
    STATIC_DATA_BASE: "/assets/data",
    STATIC_DATA_MANIFEST_URL: "/assets/data/business-manifest.json",
    STATES_JSON_URL: "/assets/data/states.json",
    DISTRICTS_JSON_URL: "/assets/data/districts.json",
    CATEGORIES_JSON_URL: "/assets/data/categories.json",
    BUSINESS_INDEX_JSON_URL: "/assets/data/business-index.json",
    DISTRICT_INDEX_JSON_URL: "/assets/data/district-index.json",
    CATEGORY_INDEX_JSON_URL: "/assets/data/category-index.json",
    BUSINESS_PAGE_SIZE: 18,
    DEFAULT_SORT: "featured",
    STATIC_FIRST: true,
    LOAD_BUSINESSES_ON_START: false,
    LOAD_MASTER_DATA_FROM_API_ON_START: false,
    ENABLE_STATIC_MASTER_DATA: true,
    CONTACTS_API_ONLY: true,
    JSON_REVALIDATE: true,
    DEBUG: false,
    STORAGE_PREFIX: "ubnux_v5_1_",
    SEO: { DEFAULT_TITLE: "UBnux - Local Business Discovery", DEFAULT_DESCRIPTION: "Discover local businesses, shops and services on UBnux." }
  };
})(window);

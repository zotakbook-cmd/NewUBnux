/* =========================================================
   UBnux
   File: assets/js/config.js
========================================================= */

(function (window) {

  "use strict";


  window.UBNUX_CONFIG = {

    /*
     * Google Apps Script Web App /exec URL
     *
     * Example:
     * https://script.google.com/macros/s/XXXXXXXX/exec
     */

    API_URL:
      "https://script.google.com/macros/s/AKfycbzZ3GtCryDG8WB5YkutJiXk-2YoHEN7KPTAeYWtmqq0mKp6oHRdV2g2WMg-BWyQSB07rg/exec",


    BUSINESS_PAGE_SIZE:
      18,


    CACHE_TTL:
      1000 * 60 * 10,


    MINIMUM_LOADER_TIME:
      350,


    STORAGE_PREFIX:
      "ubnux_",


    DEFAULT_SORT:
      "featured"

  };


})(window);
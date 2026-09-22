(function (window) {

  "use strict";

  window.UBnuxManagerConfig = {

    /*
     * Browser -> Cloudflare Pages Function
     * Cloudflare Function -> Google Apps Script
     *
     * Browser NEVER calls Apps Script directly.
     */

    API_URL: "/api/",

    PUBLIC_ORIGIN: "https://ubnux.com",

    SESSION_KEY: "ubnuxBusinessManagerSession",

    REQUEST_TIMEOUT: 25000

  };

})(window);

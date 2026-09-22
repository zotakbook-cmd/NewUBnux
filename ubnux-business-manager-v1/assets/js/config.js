window.UBnuxManagerConfig={
  (function (window) {

  "use strict";


  window.UBnuxManagerConfig = {

    /*
     * Browser NEVER calls Apps Script directly.
     *
     * Browser -> Cloudflare Function
     */

    API_URL:
      "/api/",


    PUBLIC_ORIGIN:
      "https://ubnux.com",


    SESSION_KEY:
      "ubnuxBusinessManagerSession",


    REQUEST_TIMEOUT:
      25000

  };

})(window);,
  PUBLIC_ORIGIN:"https://ubnux.com",
  SESSION_KEY:"ubnuxBusinessManagerSession",
  REQUEST_TIMEOUT:25000
};

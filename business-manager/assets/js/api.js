/* =========================================================
   UBnux Business Manager API
   File: assets/js/api.js
   Version: 1.0.0

   Browser
      ↓
   Cloudflare Pages Function /api/
      ↓
   Google Apps Script /exec

   Browser NEVER calls Apps Script directly.
   ========================================================= */

(function (window) {

  "use strict";


  /* =======================================================
     CONFIG CHECK
     ======================================================= */

  const Config =
    window.UBnuxManagerConfig;


  if (!Config) {

    console.error(
      "UBnuxManagerConfig is not loaded."
    );

    return;

  }


  /* =======================================================
     API OBJECT
     ======================================================= */

  const API = {};


  /* =======================================================
     API URL
     ======================================================= */

  function getAPIURL(action, params) {

    let baseURL =
      String(
        Config.API_URL || "/api/"
      ).trim();


    if (!baseURL) {

      baseURL = "/api/";

    }


    /*
     * Ensure trailing slash
     */

    if (!baseURL.endsWith("/")) {

      baseURL += "/";

    }


    const url =
      new URL(
        baseURL,
        window.location.origin
      );


    if (action) {

      url.searchParams.set(
        "action",
        action
      );

    }


    /*
     * Additional GET parameters
     */

    if (
      params &&
      typeof params === "object"
    ) {

      Object.keys(params).forEach(
        function (key) {

          const value =
            params[key];

          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {

            url.searchParams.set(
              key,
              String(value)
            );

          }

        }
      );

    }


    return url.toString();

  }


  /* =======================================================
     TIMEOUT
     ======================================================= */

  function createTimeoutSignal(
    timeout
  ) {

    if (
      typeof AbortController ===
      "undefined"
    ) {

      return {
        signal: undefined,
        cancel: function () {}
      };

    }


    const controller =
      new AbortController();


    const timer =
      setTimeout(
        function () {

          controller.abort();

        },
        Number(timeout) ||
        25000
      );


    return {

      signal:
        controller.signal,

      cancel:
        function () {

          clearTimeout(timer);

        }

    };

  }


  /* =======================================================
     PARSE RESPONSE
     ======================================================= */

  async function parseResponse(
    response
  ) {

    const text =
      await response.text();


    /*
     * Empty response
     */

    if (!text) {

      return {

        success:
          response.ok,

        status:
          response.status,

        message:
          response.ok
            ? "Request completed."
            : "Empty server response."

      };

    }


    /*
     * JSON response
     */

    try {

      const data =
        JSON.parse(text);


      return data;

    } catch (error) {

      /*
       * Server returned HTML/text instead
       * of JSON.
       */

      console.error(
        "UBnux API returned non-JSON response:",
        text.substring(0, 500)
      );


      return {

        success: false,

        status:
          response.status,

        message:
          "Server returned an invalid response.",

        raw:
          text.substring(0, 1000)

      };

    }

  }


  /* =======================================================
     POST REQUEST
     ======================================================= */

  async function post(
    action,
    payload
  ) {

    const url =
      getAPIURL(action);


    const timeout =
      createTimeoutSignal(
        Config.REQUEST_TIMEOUT
      );


    try {

      const response =
        await fetch(
          url,
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Accept":
                "application/json"

            },

            body:
              JSON.stringify(
                payload || {}
              ),

            signal:
              timeout.signal,

            credentials:
              "same-origin"

          }
        );


      const data =
        await parseResponse(
          response
        );


      if (!response.ok) {

        return {

          success: false,

          status:
            response.status,

          message:
            data.message ||
            data.error ||
            "API request failed.",

          data:
            data

        };

      }


      return data;


    } catch (error) {

      console.error(
        "UBnux API POST error:",
        error
      );


      if (
        error &&
        error.name ===
        "AbortError"
      ) {

        return {

          success: false,

          message:
            "Request timed out. Please try again.",

          code:
            "TIMEOUT"

        };

      }


      return {

        success: false,

        message:
          error &&
          error.message
            ? error.message
            : "Network request failed.",

        code:
          "NETWORK_ERROR"

      };


    } finally {

      timeout.cancel();

    }

  }


  /* =======================================================
     GET REQUEST
     ======================================================= */

  async function get(
    action,
    params
  ) {

    const url =
      getAPIURL(
        action,
        params
      );


    const timeout =
      createTimeoutSignal(
        Config.REQUEST_TIMEOUT
      );


    try {

      const response =
        await fetch(
          url,
          {

            method:
              "GET",

            headers: {

              "Accept":
                "application/json"

            },

            signal:
              timeout.signal,

            credentials:
              "same-origin"

          }
        );


      const data =
        await parseResponse(
          response
        );


      if (!response.ok) {

        return {

          success: false,

          status:
            response.status,

          message:
            data.message ||
            data.error ||
            "API request failed.",

          data:
            data

        };

      }


      return data;


    } catch (error) {

      console.error(
        "UBnux API GET error:",
        error
      );


      if (
        error &&
        error.name ===
        "AbortError"
      ) {

        return {

          success: false,

          message:
            "Request timed out.",

          code:
            "TIMEOUT"

        };

      }


      return {

        success: false,

        message:
          error &&
          error.message
            ? error.message
            : "Network request failed.",

        code:
          "NETWORK_ERROR"

      };


    } finally {

      timeout.cancel();

    }

  }


  /* =======================================================
     LOGIN
     ======================================================= */

  API.login =
    function (
      userId,
      password
    ) {

      return post(
        "manager-login",
        {

          userId:
            String(
              userId || ""
            ).trim(),

          password:
            String(
              password || ""
            )

        }
      );

    };


  /* =======================================================
     LOGOUT
     ======================================================= */

  API.logout =
    function (
      sessionToken
    ) {

      return post(
        "manager-logout",
        {

          sessionToken:
            String(
              sessionToken || ""
            ).trim()

        }
      );

    };


  /* =======================================================
     BOOTSTRAP
     ======================================================= */

  API.bootstrap =
    function (
      sessionToken
    ) {

      return post(
        "manager-bootstrap",
        {

          sessionToken:
            String(
              sessionToken || ""
            ).trim()

        }
      );

    };


  /* =======================================================
     BUSINESSES
     ======================================================= */

  API.getBusinesses =
    function (
      sessionToken,
      params
    ) {

      return post(
        "manager-businesses",
        {

          sessionToken:
            String(
              sessionToken || ""
            ).trim(),

          params:
            params || {}

        }
      );

    };


  /* =======================================================
     SINGLE BUSINESS
     ======================================================= */

  API.getBusiness =
    function (
      sessionToken,
      businessId
    ) {

      return post(
        "manager-business",
        {

          sessionToken:
            String(
              sessionToken || ""
            ).trim(),

          businessId:
            String(
              businessId || ""
            ).trim()

        }
      );

    };


  /* =======================================================
     SAVE BUSINESS
     ======================================================= */

  API.saveBusiness =
    function (
      sessionToken,
      business
    ) {

      return post(
        "manager-save-business",
        {

          sessionToken:
            String(
              sessionToken || ""
            ).trim(),

          business:
            business || {}

        }
      );

    };


  /* =======================================================
     DELETE BUSINESS
     ======================================================= */

  API.deleteBusiness =
    function (
      sessionToken,
      businessId
    ) {

      return post(
        "manager-delete-business",
        {

          sessionToken:
            String(
              sessionToken || ""
            ).trim(),

          businessId:
            String(
              businessId || ""
            ).trim()

        }
      );

    };


  /* =======================================================
     CHECK SLUG
     ======================================================= */

  API.checkSlug =
    function (
      sessionToken,
      slug,
      businessId
    ) {

      return post(
        "manager-check-slug",
        {

          sessionToken:
            String(
              sessionToken || ""
            ).trim(),

          slug:
            String(
              slug || ""
            ).trim(),

          businessId:
            String(
              businessId || ""
            ).trim()

        }
      );

    };


  /* =======================================================
     CUSTOM SLUG PUBLIC LOOKUP
     ======================================================= */

  API.getBusinessBySlug =
    function (
      slug
    ) {

      return get(
        "business-slug",
        {

          slug:
            String(
              slug || ""
            ).trim()

        }
      );

    };


  /* =======================================================
     RAW METHODS
     ======================================================= */

  API.get =
    get;

  API.post =
    post;


  /* =======================================================
     DEBUG
     ======================================================= */

  API.getURL =
    getAPIURL;


  /* =======================================================
     EXPORT
     ======================================================= */

  window.UBnuxManagerAPI =
    API;


  /*
   * Backward-compatible alias
   */

  window.UBnuxManagerApi =
    API;


  console.log(
    "UBnux Manager API initialized."
  );


})(window);

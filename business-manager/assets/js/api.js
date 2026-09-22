/* =========================================================
   UBnux Business Manager API
   File: assets/js/api.js
   Version: 2.0.0

   Architecture:

   Browser
      ↓
   Cloudflare Pages Function
      ↓
   Google Apps Script doGet()
      ↓
   Google Sheets

   NOTE:
   Current Apps Script backend uses GET / doGet().
   ========================================================= */

(function (window) {

  "use strict";


  /* =======================================================
     CONFIG
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
     BUILD API URL
  ======================================================= */

  function getAPIURL(
    action,
    params
  ) {

    let baseURL =
      String(
        Config.API_URL || "/api/"
      ).trim();


    if (!baseURL) {

      baseURL = "/api/";

    }


    if (
      !baseURL.endsWith("/")
    ) {

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

        signal:
          undefined,

        cancel:
          function () {}

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

          clearTimeout(
            timer
          );

        }

    };

  }


  /* =======================================================
     RESPONSE PARSER
  ======================================================= */

  async function parseResponse(
    response
  ) {

    const text =
      await response.text();


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


    try {

      return JSON.parse(
        text
      );

    } catch (error) {

      console.error(
        "UBnux API returned non-JSON response:",
        text.substring(
          0,
          1000
        )
      );


      return {

        success:
          false,

        status:
          response.status,

        message:
          "Server returned an invalid response.",

        raw:
          text.substring(
            0,
            1000
          )

      };

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


    console.log(
      "UBnux API GET:",
      url
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

          success:
            false,

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

          success:
            false,

          message:
            "Request timed out. Please try again.",

          code:
            "TIMEOUT"

        };

      }


      return {

        success:
          false,

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

      return get(
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

      return get(
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
     SESSION / BOOTSTRAP
  ======================================================= */

  API.bootstrap =
    function (
      sessionToken
    ) {

      return get(
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
     GET BUSINESSES
  ======================================================= */

  API.getBusinesses =
    function (
      sessionToken,
      params
    ) {

      return get(
        "manager-businesses",
        {

          sessionToken:
            String(
              sessionToken || ""
            ).trim(),

          ...(params || {})

        }
      );

    };


  /* =======================================================
     GET SINGLE BUSINESS
  ======================================================= */

  API.getBusiness =
    function (
      sessionToken,
      businessId
    ) {

      return get(
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

      /*
       * Current backend is GET based.
       *
       * Business object is therefore encoded
       * as JSON inside one query parameter.
       */

      return get(
        "manager-save-business",
        {

          sessionToken:
            String(
              sessionToken || ""
            ).trim(),

          business:
            JSON.stringify(
              business || {}
            )

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

      return get(
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

      return get(
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
     CUSTOM SLUG LOOKUP
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
     RAW GET
  ======================================================= */

  API.get =
    get;


  /* =======================================================
     URL HELPER
  ======================================================= */

  API.getURL =
    getAPIURL;


  /* =======================================================
     EXPORT
  ======================================================= */

  window.UBnuxManagerAPI =
    API;


  window.UBnuxManagerApi =
    API;


  console.log(
    "UBnux Manager API v2.0.0 initialized."
  );


})(window);

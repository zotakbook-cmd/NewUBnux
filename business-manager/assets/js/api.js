/* =========================================================
   UBnux Business Manager API
   File: assets/js/api.js
   Version: 2.1.0
   ========================================================= */

(function (window) {

  "use strict";


  const Config =
    window.UBnuxManagerConfig;


  if (!Config) {

    console.error(
      "UBnuxManagerConfig is not loaded."
    );

    return;

  }


  const API = {};


  /* =======================================================
     BUILD URL
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
     PARSE RESPONSE
  ======================================================= */

  async function parseResponse(
    response
  ) {

    const contentType =
      String(
        response.headers.get(
          "content-type"
        ) || ""
      ).toLowerCase();


    const text =
      await response.text();


    console.log(
      "UBnux API status:",
      response.status
    );


    console.log(
      "UBnux API content-type:",
      contentType
    );


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
     * HTML response
     *
     * This is the important diagnostic.
     */

    if (
      text.trim()
        .startsWith(
          "<!"
        ) ||
      text.trim()
        .startsWith(
          "<html"
        ) ||
      contentType.includes(
        "text/html"
      )
    ) {

      console.error(
        "UBnux API returned HTML instead of JSON:",
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

        code:
          "HTML_RESPONSE",

        message:
          "API returned an HTML page instead of JSON.",

        raw:
          text.substring(
            0,
            1000
          )

      };

    }


    /*
     * JSON
     */

    try {

      return JSON.parse(
        text
      );

    } catch (error) {

      console.error(
        "Invalid JSON response:",
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

        code:
          "INVALID_JSON",

        message:
          "API returned invalid JSON.",

        raw:
          text.substring(
            0,
            1000
          )

      };

    }

  }


  /* =======================================================
     GET
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

            credentials:
              "same-origin",

            signal:
              timeout.signal

          }
        );


      const data =
        await parseResponse(
          response
        );


      if (
        !response.ok
      ) {

        return {

          success:
            false,

          status:
            response.status,

          code:
            data.code ||
            "HTTP_ERROR",

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

          code:
            "TIMEOUT",

          message:
            "Request timed out."

        };

      }


      return {

        success:
          false,

        code:
          "NETWORK_ERROR",

        message:
          error &&
          error.message
            ? error.message
            : "Network request failed."

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
     BOOTSTRAP
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
     BUSINESSES
  ======================================================= */

  API.getBusinesses =
    function (
      sessionToken,
      params
    ) {

      return get(
        "manager-businesses",
        Object.assign(
          {},
          params || {},
          {

            sessionToken:
              String(
                sessionToken || ""
              ).trim()

          }
        )
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
     SAVE
  ======================================================= */

  API.saveBusiness =
    function (
      sessionToken,
      business
    ) {

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
     DELETE
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
     CUSTOM URL
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


  API.get =
    get;

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
    "UBnux Manager API v2.1.0 initialized."
  );


})(window);

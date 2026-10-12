const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzZ3GtCryDG8WB5YkutJiXk-2YoHEN7KPTAeYWtmqq0mKp6oHRdV2g2WMg-BWyQSB07rg/exec";


export async function onRequest(context) {

  const request = context.request;

  const origin =
    request.headers.get("Origin") || "";


  /*
   * Allowed frontend origins
   */
  const allowedOrigins = [
    "https://ubnux.com",
    "https://www.ubnux.com"
  ];


  const allowOrigin =
    allowedOrigins.includes(origin)
      ? origin
      : "https://ubnux.com";


  /*
   * CORS headers
   */
  const corsHeaders = {

    "Access-Control-Allow-Origin":
      allowOrigin,

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",

    "Access-Control-Max-Age":
      "86400",

    "Vary":
      "Origin"

  };


  /*
   * Browser preflight
   */
  if (request.method === "OPTIONS") {

    return new Response(
      null,
      {
        status: 204,
        headers: corsHeaders
      }
    );

  }


  try {

    /*
     * Incoming URL
     */
    const incomingURL =
      new URL(request.url);


    /*
     * Apps Script URL
     */
    const targetURL =
      new URL(APPS_SCRIPT_URL);


    /*
     * Copy ALL query parameters
     *
     * Example:
     *
     * /api?action=states
     *
     * becomes:
     *
     * Apps Script
     * ?action=states
     */
    incomingURL.searchParams.forEach(
      (value, key) => {

        targetURL.searchParams.set(
          key,
          value
        );

      }
    );


    /*
     * Request options
     */
    const options = {

      method:
        request.method,

      redirect:
        "follow",

      headers: {

        "Accept":
          request.headers.get(
            "Accept"
          ) ||
          "application/json"

      }

    };


    /*
     * Forward POST body
     */
    if (
      request.method !== "GET" &&
      request.method !== "HEAD"
    ) {

      options.body =
        await request.arrayBuffer();


      const contentType =
        request.headers.get(
          "Content-Type"
        );


      if (contentType) {

        options.headers[
          "Content-Type"
        ] =
          contentType;

      }

    }


    /*
     * Call Google Apps Script
     */
    const response =
      await fetch(
        targetURL.toString(),
        options
      );


    /*
     * Read Apps Script response
     */
    const body =
      await response.text();


    /*
     * Return response to UBnux
     */
    return new Response(

      body,

      {

        status:
          response.status,

        headers: {

          "Content-Type":
            response.headers.get(
              "Content-Type"
            ) ||
            "application/json",

          ...corsHeaders

        }

      }

    );


  } catch (error) {

    /*
     * Proxy error
     */
    return new Response(

      JSON.stringify({

        success:
          false,

        error:
          "Cloudflare Proxy Error",

        message:
          error &&
          error.message
            ? error.message
            : String(error)

      }),

      {

        status:
          502,

        headers: {

          "Content-Type":
            "application/json",

          ...corsHeaders

        }

      }

    );

  }

}

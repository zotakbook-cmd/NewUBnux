const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzZ3GtCryDG8WB5YkutJiXk-2YoHEN7KPTAeYWtmqq0mKp6oHRdV2g2WMg-BWyQSB07rg/exec";


export async function onRequest(context) {

  const request = context.request;

  /*
   * Handle browser preflight
   */
  if (request.method === "OPTIONS") {

    return new Response(null, {
      status: 204,

      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });

  }


  try {

    const incomingURL =
      new URL(request.url);


    /*
     * Preserve query parameters
     */
    const targetURL =
      APPS_SCRIPT_URL +
      incomingURL.search;


    const headers = new Headers();

    headers.set(
      "Content-Type",
      request.headers.get("Content-Type") ||
      "application/json"
    );


    const options = {
      method: request.method,
      headers: headers,
      redirect: "follow"
    };


    /*
     * POST body
     */
    if (
      request.method !== "GET" &&
      request.method !== "HEAD"
    ) {

      options.body =
        await request.arrayBuffer();

    }


    const response =
      await fetch(
        targetURL,
        options
      );


    const body =
      await response.text();


    /*
     * IMPORTANT:
     * Return Apps Script response as-is.
     */
    return new Response(
      body,
      {
        status: response.status,

        headers: {
          "Content-Type":
            response.headers.get(
              "Content-Type"
            ) ||
            "application/json",

          "Access-Control-Allow-Origin":
            "*",

          "Access-Control-Allow-Methods":
            "GET, POST, OPTIONS",

          "Access-Control-Allow-Headers":
            "Content-Type"
        }
      }
    );


  } catch (error) {

    return new Response(

      JSON.stringify({

        success: false,

        error:
          "Cloudflare Proxy Error",

        message:
          String(error)

      }),

      {
        status: 502,

        headers: {
          "Content-Type":
            "application/json",

          "Access-Control-Allow-Origin":
            "*"
        }
      }

    );

  }

}

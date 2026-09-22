export async function onRequest(context) {

  const { request } = context;

  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzZ3GtCryDG8WB5YkutJiXk-2YoHEN7KPTAeYWtmqq0mKp6oHRdV2g2WMg-BWyQSB07rg/exec";

  try {

    const url = new URL(request.url);

    const targetURL =
      APPS_SCRIPT_URL +
      url.search;

    const init = {
      method: request.method,
      headers: {
        "Content-Type":
          request.headers.get("Content-Type") ||
          "application/json"
      },
      redirect: "follow"
    };

    /*
     * GET / HEAD don't have a body.
     */
    if (
      request.method !== "GET" &&
      request.method !== "HEAD"
    ) {
      init.body = await request.arrayBuffer();
    }

    const response =
      await fetch(targetURL, init);

    const responseText =
      await response.text();

    return new Response(
      responseText,
      {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("Content-Type") ||
            "application/json",

          "Access-Control-Allow-Origin":
            "*",

          "Access-Control-Allow-Methods":
            "GET,POST,OPTIONS",

          "Access-Control-Allow-Headers":
            "Content-Type"
        }
      }
    );

  } catch (error) {

    return new Response(
      JSON.stringify({
        success: false,
        error: "Cloudflare API Proxy Error",
        message: String(error)
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

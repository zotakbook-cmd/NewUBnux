/**
 * =========================================================
 * UBnux Cloudflare API Proxy
 * File:
 * functions/api/[[path]].js
 *
 * Purpose:
 * Browser
 *   -> Cloudflare
 *   -> Google Apps Script
 *
 * This prevents browser -> Apps Script CORS problems.
 * =========================================================
 */

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzZ3GtCryDG8WB5YkutJiXk-2YoHEN7KPTAeYWtmqq0mKp6oHRdV2g2WMg-BWyQSB07rg/exec";


function corsHeaders(origin) {

  const allowedOrigin =
    origin === "https://newubnux.pages.dev" ||
    origin === "https://ubnux.com"
      ? origin
      : "https://newubnux.pages.dev";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };

}


function jsonResponse(data, status, origin) {

  return new Response(
    JSON.stringify(data),
    {
      status: status || 200,

      headers: {
        "Content-Type": "application/json; charset=utf-8",

        ...corsHeaders(origin)
      }
    }
  );

}


export async function onRequestOptions(context) {

  return new Response(
    null,
    {
      status: 204,

      headers: corsHeaders(
        context.request.headers.get("Origin")
      )
    }
  );

}


export async function onRequest(context) {

  const request =
    context.request;

  const origin =
    request.headers.get("Origin") || "";


  try {

    const url =
      new URL(request.url);


    /*
     * =====================================================
     * GET
     * =====================================================
     */

    if (request.method === "GET") {

      const target =
        new URL(
          GOOGLE_APPS_SCRIPT_URL
        );


      /*
       * Copy all query parameters.
       *
       * Example:
       *
       * /api/?action=manager-bootstrap
       *
       * becomes:
       *
       * Apps Script /exec?action=manager-bootstrap
       */

      url.searchParams.forEach(
        function (value, key) {

          target.searchParams.set(
            key,
            value
          );

        }
      );


      const response =
        await fetch(
          target.toString(),
          {
            method: "GET",

            headers: {
              "Accept":
                "application/json"
            },

            redirect: "follow"
          }
        );


      const text =
        await response.text();


      /*
       * Apps Script should return JSON.
       */

      let data;

      try {

        data =
          JSON.parse(text);

      } catch (error) {

        return jsonResponse(
          {
            success: false,

            message:
              "Google Apps Script returned a non-JSON response.",

            upstreamStatus:
              response.status
          },

          502,

          origin
        );

      }


      return jsonResponse(
        data,
        response.ok ? 200 : response.status,
        origin
      );

    }


    /*
     * =====================================================
     * POST
     * =====================================================
     */

    if (request.method === "POST") {

      const body =
        await request.text();


      const response =
        await fetch(
          GOOGLE_APPS_SCRIPT_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "text/plain;charset=utf-8",

              "Accept":
                "application/json"
            },

            body: body,

            redirect: "follow"
          }
        );


      const text =
        await response.text();


      let data;

      try {

        data =
          JSON.parse(text);

      } catch (error) {

        return jsonResponse(
          {
            success: false,

            message:
              "Google Apps Script returned a non-JSON response.",

            upstreamStatus:
              response.status
          },

          502,

          origin
        );

      }


      return jsonResponse(
        data,
        response.ok ? 200 : response.status,
        origin
      );

    }


    return jsonResponse(
      {
        success: false,
        message: "Method not allowed."
      },

      405,

      origin
    );


  } catch (error) {

    return jsonResponse(
      {
        success: false,

        message:
          error &&
          error.message
            ? error.message
            : "API proxy error."
      },

      500,

      origin
    );

  }

}

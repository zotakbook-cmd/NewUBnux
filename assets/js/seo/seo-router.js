/* =========================================================
   UBnux SEO Router
   File: assets/js/seo/seo-router.js

   Responsibilities:
   - Read current URL
   - Detect SEO route
   - Extract state/district/category/business slug
   - Provide parse() API
   - Maintain compatibility with existing UBnux code
   ========================================================= */

(function (
  window,
  document
) {

  "use strict";


  /* =======================================================
     UBNUX SEO ROUTER
  ======================================================= */

  const UBNUX_SEO_ROUTER = {


    /* =====================================================
       GET CURRENT PATH
    ===================================================== */

    getPath() {

      return (
        window.location.pathname ||
        "/"
      )
        .replace(
          /\/+/g,
          "/"
        )
        .replace(
          /^\/|\/$/g,
          "");

    },


    /* =====================================================
       PARSE BUSINESS ROUTE
       
       Expected:

       /in/bihar/siwan/
          clothing-and-fashion/
          siwan-fashion-house/
    ===================================================== */

    parseBusinessRoute() {

      const path =
        this.getPath();


      const parts =
        path
          ? path.split("/")
          : [];


      if (
        parts.length !== 5 ||
        parts[0] !== "in"
      ) {

        return null;

      }


      return {

        type:
          "business",

        isBusinessPage:
          true,

        stateSlug:
          decodeURIComponent(
            parts[1]
          ),

        districtSlug:
          decodeURIComponent(
            parts[2]
          ),

        categorySlug:
          decodeURIComponent(
            parts[3]
          ),

        businessSlug:
          decodeURIComponent(
            parts[4]
          )

      };

    },


    /* =====================================================
       GENERIC PARSE

       business-page.js uses:

       UBnuxSEORouter.parse(
         window.location.pathname
       );
    ===================================================== */

    parse(path) {

      const currentPath =
        path !== undefined &&
        path !== null
          ? String(path)
          : window.location.pathname;


      const normalizedPath =
        currentPath
          .replace(
            /\/+/g,
            "/"
          )
          .replace(
            /^\/|\/$/g,
            ""
          );


      const parts =
        normalizedPath
          ? normalizedPath.split("/")
          : [];


      /* =================================================
         BUSINESS SEO URL
      ================================================= */

      if (
        parts.length === 5 &&
        parts[0] === "in"
      ) {

        return {

          type:
            "business",

          isBusinessPage:
            true,

          stateSlug:
            decodeURIComponent(
              parts[1]
            ),

          districtSlug:
            decodeURIComponent(
              parts[2]
            ),

          categorySlug:
            decodeURIComponent(
              parts[3]
            ),

          businessSlug:
            decodeURIComponent(
              parts[4]
            )

        };

      }


      /* =================================================
         UNKNOWN / NON-BUSINESS ROUTE
      ================================================= */

      return {

        type:
          "unknown",

        isBusinessPage:
          false

      };

    },


    /* =====================================================
       CHECK BUSINESS PAGE
    ===================================================== */

    isBusinessPage() {

      return !!(
        this.parseBusinessRoute()
      );

    }

  };


  /* =======================================================
     GLOBAL EXPORTS

     IMPORTANT:
     business-page.js expects:

       window.UBnuxSEORouter

     Other existing code may use:

       window.UBNUX_SEO_ROUTER
       window.App.router
  ======================================================= */

  window.UBNUX_SEO_ROUTER =
    UBNUX_SEO_ROUTER;


  window.UBnuxSEORouter =
    UBNUX_SEO_ROUTER;


  window.App =
    window.App ||
    {};


  window.App.router =
    UBNUX_SEO_ROUTER;


  /* =======================================================
     DEBUG
  ======================================================= */

  console.log(
    "UBnux SEO Router initialized:",
    {
      router:
        !!window.UBnuxSEORouter,

      parse:
        typeof
        window.UBnuxSEORouter.parse,

      businessParser:
        typeof
        window.UBnuxSEORouter.parseBusinessRoute
    }
  );


})(window, document);

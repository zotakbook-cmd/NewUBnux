/* =========================================================
   UBnux SEO Router
   File: assets/js/seo/seo-router.js

   Responsibilities:
   - Read current URL
   - Detect SEO route
   - Extract state/district/category/business slug
   - Provide backward-compatible parse() API
   ========================================================= */

(function (
  window,
  document
) {

  "use strict";


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
          ""
        );

    },


    /* =====================================================
       PARSE BUSINESS ROUTE
    ===================================================== */

    parseBusinessRoute() {

      const path =
        this.getPath();


      const parts =
        path
          ? path.split("/")
          : [];


      /*
        Expected:

        /in/
          state
          district
          category
          business
      */


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
       -----------------------------------------------------
       business-page.js uses:
         UBnuxSEORouter.parse(path)

       So this method must exist.
    ===================================================== */

    parse(path) {

      /*
        If a path is explicitly supplied,
        temporarily parse that path directly.
      */

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
         BUSINESS SEO ROUTE
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


      /*
        Unknown / non-business route.
      */

      return {

        type:
          "unknown",

        isBusinessPage:
          false

      };

    },


    /* =====================================================
       CHECK BUSINESS ROUTE
    ===================================================== */

    isBusinessPage() {

      return !!(
        this.parseBusinessRoute()
      );

    }

  };


  /* =======================================================
     GLOBAL EXPORT
  ====================================================== */

  window.UBNUX_SEO_ROUTER =
    UBNUX_SEO_ROUTER;


  /*
    Optional compatibility alias.

    This keeps the router usable by older
    frontend code which may expect App.router.
  */

  window.App =
    window.App ||
    {};

  window.App.router =
    UBNUX_SEO_ROUTER;


})(window, document);

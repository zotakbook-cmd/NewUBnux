/* =========================================================
   UBnux SEO Router
   File: assets/js/seo/seo-router.js

   Responsibilities:
   - Read current URL
   - Detect SEO route
   - Extract state/district/category/business slug
   ========================================================= */

(function (
  window,
  document
) {

  "use strict";


  const UBNUX_SEO_ROUTER = {


    /* =====================================================
       GET CURRENT PATH
    ==================================================== */

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
    ==================================================== */

    parseBusinessRoute() {

      const path =
        this.getPath();


      const parts =
        path
          ? path.split("/")
          : [];


      /*
       Expected:

       in
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
       CHECK BUSINESS ROUTE
    ==================================================== */

    isBusinessPage() {

      return !!(
        this.parseBusinessRoute()
      );

    }

  };


  window.UBNUX_SEO_ROUTER =
    UBNUX_SEO_ROUTER;


})(window, document);
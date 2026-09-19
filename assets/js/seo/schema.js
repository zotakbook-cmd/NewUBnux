/* =========================================================
   UBnux Schema Generator
   File: assets/js/seo/schema.js

   Responsibilities:
   - LocalBusiness JSON-LD
   - BreadcrumbList JSON-LD
========================================================= */

(function (
  window,
  document
) {

  "use strict";


  const UBNUX_SCHEMA = {


    /* =====================================================
       INSERT JSON-LD
    ==================================================== */

    insert(
      elementId,
      data
    ) {

      const element =
        document.getElementById(
          elementId
        );


      if (!element) {

        return;

      }


      element.textContent =
        JSON.stringify(
          data
        );

    },


    /* =====================================================
       BUSINESS SCHEMA
    ==================================================== */

    buildBusinessSchema(
      business,
      seo
    ) {

      if (!business) {

        return null;

      }


      const schema = {

        "@context":
          "https://schema.org",

        "@type":
          "LocalBusiness",

        "@id":
          seo.canonicalURL +
          "#business",

        "name":
          business.name,

        "url":
          seo.canonicalURL

      };


      /* ================================================
         DESCRIPTION
      ================================================= */

      if (
        business.description
      ) {

        schema.description =
          business.description;

      }


      /* ================================================
         IMAGE
      ================================================= */

      const image =
        business.cover ||
        business.logo;


      if (image) {

        schema.image =
          image;

      }


      /* ================================================
         LOGO
      ================================================= */

      if (
        business.logo
      ) {

        schema.logo =
          business.logo;

      }


      /* ================================================
         TELEPHONE
      ================================================= */

      if (
        business.mobile
      ) {

        schema.telephone =
          business.mobile;

      }


      /* ================================================
         ADDRESS
      ================================================= */

      if (
        business.address
      ) {

        schema.address = {

          "@type":
            "PostalAddress",

          "streetAddress":
            business.address,

          "addressCountry":
            "IN"

        };

      }


      /* ================================================
         AREA
      ================================================= */

      if (
        business.area
      ) {

        schema.areaServed =
          business.area;

      }


      /* ================================================
         RATING
      ================================================= */

      if (
        business.rating > 0 &&
        business.reviewCount > 0
      ) {

        schema.aggregateRating = {

          "@type":
            "AggregateRating",

          "ratingValue":
            business.rating,

          "reviewCount":
            business.reviewCount

        };

      }


      return schema;

    },


    /* =====================================================
       BREADCRUMB SCHEMA
    ==================================================== */

    buildBreadcrumbSchema(
      breadcrumbs
    ) {

      if (
        !Array.isArray(
          breadcrumbs
        )
      ) {

        return null;

      }


      return {

        "@context":
          "https://schema.org",

        "@type":
          "BreadcrumbList",

        "itemListElement":
          breadcrumbs.map(
            function (
              item,
              index
            ) {

              return {

                "@type":
                  "ListItem",

                "position":
                  index + 1,

                "name":
                  item.name,

                "item":
                  item.url

              };

            }
          )

      };

    },


    /* =====================================================
       RENDER
    ==================================================== */

    render(
      seo
    ) {

      if (!seo) {

        return;

      }


      const businessSchema =
        this.buildBusinessSchema(
          seo.business,
          seo
        );


      const breadcrumbSchema =
        this.buildBreadcrumbSchema(
          seo.breadcrumbs
        );


      if (
        businessSchema
      ) {

        this.insert(
          "businessSchema",
          businessSchema
        );

      }


      if (
        breadcrumbSchema
      ) {

        this.insert(
          "breadcrumbSchema",
          breadcrumbSchema
        );

      }

    }

  };


  window.UBNUX_SCHEMA =
    UBNUX_SCHEMA;


})(window, document);
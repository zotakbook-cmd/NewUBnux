/* =========================================================
   UBnux SEO Meta
   File: assets/js/seo/seo-meta.js

   Responsibilities:
   - Document title
   - Meta description
   - Canonical
   - Robots
   - OpenGraph
   - Twitter Card
========================================================= */

(function (
  window,
  document
) {

  "use strict";


  /* =======================================================
     SET META
  ====================================================== */

  function setMeta(
    attribute,
    value,
    content
  ) {

    if (!content) {

      return;

    }


    let element =
      document.head.querySelector(
        `meta[${attribute}="${CSS.escape(value)}"]`
      );


    if (!element) {

      element =
        document.createElement(
          "meta"
        );


      element.setAttribute(
        attribute,
        value
      );


      document.head.appendChild(
        element
      );

    }


    element.setAttribute(
      "content",
      content
    );

  }


  /* =======================================================
     SET CANONICAL
  ====================================================== */

  function setCanonical(
    url
  ) {

    if (!url) {

      return;

    }


    let link =
      document.head.querySelector(
        'link[rel="canonical"]'
      );


    if (!link) {

      link =
        document.createElement(
          "link"
        );


      link.rel =
        "canonical";


      document.head.appendChild(
        link
      );

    }


    link.href =
      url;

  }


  /* =======================================================
     APPLY SEO
  ====================================================== */

  function apply(
    seo
  ) {

    if (
      !seo
    ) {

      return;

    }


    /* =====================================================
       TITLE
    ==================================================== */

    if (
      seo.title
    ) {

      document.title =
        seo.title;

    }


    /* =====================================================
       DESCRIPTION
    ==================================================== */

    if (
      seo.description
    ) {

      setMeta(
        "name",
        "description",
        seo.description
      );

    }


    /* =====================================================
       ROBOTS
    ==================================================== */

    setMeta(
      "name",
      "robots",
      seo.robots ||
      "index,follow"
    );


    /* =====================================================
       CANONICAL
    ==================================================== */

    setCanonical(
      seo.canonicalURL
    );


    /* =====================================================
       OPEN GRAPH
    ==================================================== */

    setMeta(
      "property",
      "og:title",
      seo.title
    );


    setMeta(
      "property",
      "og:description",
      seo.description
    );


    setMeta(
      "property",
      "og:url",
      seo.canonicalURL
    );


    setMeta(
      "property",
      "og:type",
      "website"
    );


    if (
      seo.business &&
      seo.business.logoURL
    ) {

      setMeta(
        "property",
        "og:image",
        seo.business.logoURL
      );

    } else if (
      seo.business &&
      seo.business.coverURL
    ) {

      setMeta(
        "property",
        "og:image",
        seo.business.coverURL
      );

    }


    /* =====================================================
       TWITTER
    ==================================================== */

    setMeta(
      "name",
      "twitter:card",
      "summary_large_image"
    );


    setMeta(
      "name",
      "twitter:title",
      seo.title
    );


    setMeta(
      "name",
      "twitter:description",
      seo.description
    );


    if (
      seo.business &&
      seo.business.coverURL
    ) {

      setMeta(
        "name",
        "twitter:image",
        seo.business.coverURL
      );

    }

  }


  /* =======================================================
     PUBLIC
  ====================================================== */

  window.UBnuxSEOMeta = {

    apply

  };


})(
  window,
  document
);
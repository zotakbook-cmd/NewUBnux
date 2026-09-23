/* =========================================================
   UBnux SEO Meta Manager
   File: assets/js/seo/seo-meta.js

   Version:
   3.0.0

   Responsibilities:
   - Document title
   - Meta description
   - Robots
   - Canonical
   - OpenGraph
   - Twitter Card
   - Social image
   - Safe duplicate prevention
========================================================= */

(function (
  window,
  document
) {

  "use strict";


  /* =======================================================
     CONFIG
  ====================================================== */

  const CONFIG = {

    SITE_NAME:
      "UBnux",

    DEFAULT_IMAGE:
      "https://ubnux.com/assets/images/default-business.jpg",

    DEFAULT_ROBOTS:
      "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",

    DEFAULT_NOINDEX:
      "noindex,follow"

  };


  /* =======================================================
     SAFE VALUE
  ====================================================== */

  function clean(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(value).trim();

  }


  /* =======================================================
     SET META
  ====================================================== */

  function setMeta(
    attribute,
    value,
    content
  ) {

    content =
      clean(content);

    if (!content) {

      return null;

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


    return element;

  }


  /* =======================================================
     REMOVE META
  ====================================================== */

  function removeMeta(
    attribute,
    value
  ) {

    const element =
      document.head.querySelector(
        `meta[${attribute}="${CSS.escape(value)}"]`
      );


    if (
      element
    ) {

      element.remove();

    }

  }


  /* =======================================================
     SET CANONICAL
  ====================================================== */

  function setCanonical(
    url
  ) {

    url =
      clean(url);

    if (!url) {

      return null;

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


    return link;

  }


  /* =======================================================
     GET BUSINESS IMAGE
  ====================================================== */

  function getImage(
    seo
  ) {

    if (
      seo &&
      seo.image
    ) {

      return clean(
        seo.image
      );

    }


    if (
      seo &&
      seo.business
    ) {

      if (
        seo.business.coverURL
      ) {

        return clean(
          seo.business.coverURL
        );

      }


      if (
        seo.business.logoURL
      ) {

        return clean(
          seo.business.logoURL
        );

      }


      if (
        seo.business.cover
      ) {

        return clean(
          seo.business.cover
        );

      }


      if (
        seo.business.logo
      ) {

        return clean(
          seo.business.logo
        );

      }

    }


    return CONFIG.DEFAULT_IMAGE;

  }


  /* =======================================================
     GET ROBOTS
  ====================================================== */

  function getRobots(
  seo
) {

  if (
    seo &&
    seo.robots
  ) {

    return clean(
      seo.robots
    );

  }


  if (
    seo &&
    (
      seo.indexable === false ||
      String(
        seo.indexable
      ).trim().toLowerCase() === "false"
    )
  ) {

    return CONFIG.DEFAULT_NOINDEX;

  }


  return CONFIG.DEFAULT_ROBOTS;

}

  /* =======================================================
     OPEN GRAPH
  ====================================================== */

  function applyOpenGraph(
    seo
  ) {

    if (!seo) {

      return;

    }


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


    setMeta(
      "property",
      "og:site_name",
      CONFIG.SITE_NAME
    );


    setMeta(
      "property",
      "og:image",
      getImage(seo)
    );

  }


  /* =======================================================
     TWITTER
  ====================================================== */

  function applyTwitter(
    seo
  ) {

    if (!seo) {

      return;

    }


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


    setMeta(
      "name",
      "twitter:image",
      getImage(seo)
    );

  }


  /* =======================================================
     APPLY SEO
  ====================================================== */

  function apply(
    seo
  ) {

    if (!seo) {

      return;

    }


    /* =====================================================
       TITLE
    ================================================== */

    if (
      seo.title
    ) {

      document.title =
        clean(
          seo.title
        );

    }


    /* =====================================================
       DESCRIPTION
    ================================================== */

    setMeta(
      "name",
      "description",
      seo.description
    );


    /* =====================================================
       ROBOTS
    ================================================== */

    setMeta(
      "name",
      "robots",
      getRobots(seo)
    );


    /* =====================================================
       CANONICAL
    ================================================== */

    setCanonical(
      seo.canonicalURL
    );


    /* =====================================================
       OPEN GRAPH
    ================================================== */

    applyOpenGraph(
      seo
    );


    /* =====================================================
       TWITTER
    ================================================== */

    applyTwitter(
      seo
    );


    /* =====================================================
       THEME / SITE
    ================================================== */

    setMeta(
      "name",
      "application-name",
      CONFIG.SITE_NAME
    );

  }


  /* =======================================================
     PUBLIC API
  ====================================================== */

  window.UBnuxSEOMeta = {

    version:
      "3.0.0",

    apply:
      apply,

    setMeta:
      setMeta,

    setCanonical:
      setCanonical,

    removeMeta:
      removeMeta,

    getImage:
      getImage

  };


})(window, document);

/* =========================================================
   UBnux SEO Meta Manager
   File: assets/js/seo/seo-meta.js

   Version:
   3.1.0

   Responsibilities:
   - Document title
   - Meta description
   - Robots
   - Canonical
   - OpenGraph
   - Twitter Card
   - Social image
   - Duplicate prevention
   - Safe SEO value handling
   - Business SEO compatibility
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

    VERSION:
      "3.1.0",

    SITE_NAME:
      "UBnux",

    SITE_URL:
      "https://ubnux.com",

    DEFAULT_IMAGE:
      "https://ubnux.com/assets/images/default-business.jpg",

    DEFAULT_ROBOTS:
      "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",

    DEFAULT_NOINDEX:
      "noindex,follow",

    DEFAULT_LOCALE:
      "en_IN"

  };


  /* =======================================================
     SAFE VALUE
  ====================================================== */

  function clean(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }


    return String(
      value
    ).trim();

  }


  /* =======================================================
     BOOLEAN
  ====================================================== */

  function isFalse(
    value
  ) {

    return (
      value === false ||
      clean(value).toLowerCase() ===
        "false"
    );

  }


  /* =======================================================
     CSS ESCAPE
  ====================================================== */

  function escapeSelector(
    value
  ) {

    value =
      clean(value);


    if (
      window.CSS &&
      typeof window.CSS.escape ===
        "function"
    ) {

      return window.CSS.escape(
        value
      );

    }


    /*
     * Fallback for older browsers.
     */

    return value.replace(
      /([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g,
      "\\$1"
    );

  }


  /* =======================================================
     NORMALIZE URL
  ====================================================== */

  function normalizeURL(
    value
  ) {

    value =
      clean(value);


    if (!value) {

      return "";

    }


    try {

      const url =
        new URL(
          value,
          CONFIG.SITE_URL
        );


      /*
       * Only HTTP/HTTPS URLs are allowed.
       */

      if (
        url.protocol !==
          "http:" &&
        url.protocol !==
          "https:"
      ) {

        return "";

      }


      return url.href;

    } catch (
      error
    ) {

      return "";

    }

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
      clean(
        content
      );


    if (!content) {

      return null;

    }


    attribute =
      clean(
        attribute
      );


    value =
      clean(
        value
      );


    if (
      !attribute ||
      !value
    ) {

      return null;

    }


    const selector =
      `meta[${escapeSelector(attribute)}="${escapeSelector(value)}"]`;


    let element =
      document.head.querySelector(
        selector
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

    attribute =
      clean(
        attribute
      );


    value =
      clean(
        value
      );


    if (
      !attribute ||
      !value
    ) {

      return false;

    }


    const selector =
      `meta[${escapeSelector(attribute)}="${escapeSelector(value)}"]`;


    const elements =
      document.head.querySelectorAll(
        selector
      );


    elements.forEach(
      function (
        element
      ) {

        element.remove();

      }
    );


    return (
      elements.length >
      0
    );

  }


  /* =======================================================
     SET CANONICAL
  ====================================================== */

  function setCanonical(
    url
  ) {

    url =
      normalizeURL(
        url
      );


    if (!url) {

      return null;

    }


    let links =
      document.head.querySelectorAll(
        'link[rel="canonical"]'
      );


    let link =
      links.length
        ? links[0]
        : null;


    /*
     * If multiple canonical tags
     * already exist, remove duplicates.
     */

    if (
      links.length >
      1
    ) {

      for (
        let i = 1;
        i < links.length;
        i++
      ) {

        links[i].remove();

      }

    }


    if (!link) {

      link =
        document.createElement(
          "link"
        );


      link.setAttribute(
        "rel",
        "canonical"
      );


      document.head.appendChild(
        link
      );

    }


    link.setAttribute(
      "href",
      url
    );


    return link;

  }


  /* =======================================================
     GET CANONICAL
  ====================================================== */

  function getCanonical(
    seo
  ) {

    if (!seo) {

      return "";

    }


    return normalizeURL(

      seo.canonicalURL ||

      seo.canonical ||

      seo.url ||

      ""

    );

  }


  /* =======================================================
     GET BUSINESS IMAGE
  ====================================================== */

  function getImage(
    seo
  ) {

    let image =
      "";


    if (
      seo
    ) {

      image =
        firstValue(

          seo.image,

          seo.imageURL,

          seo.imageUrl

        );


      if (
        !image &&
        seo.business
      ) {

        image =
          firstValue(

            seo.business.CoverURL,

            seo.business.coverURL,

            seo.business.LogoURL,

            seo.business.logoURL,

            seo.business.cover,

            seo.business.logo

          );

      }

    }


    image =
      normalizeURL(
        image
      );


    if (!image) {

      image =
        CONFIG.DEFAULT_IMAGE;

    }


    return image;

  }


  /* =======================================================
     FIRST VALUE
  ====================================================== */

  function firstValue() {

    const values =
      Array.prototype.slice.call(
        arguments
      );


    for (
      let i = 0;
      i < values.length;
      i++
    ) {

      const value =
        clean(
          values[i]
        );


      if (value) {

        return value;

      }

    }


    return "";

  }


  /* =======================================================
     GET ROBOTS
  ====================================================== */

  function getRobots(
    seo
  ) {

    if (!seo) {

      return CONFIG.DEFAULT_ROBOTS;

    }


    /*
     * Explicit backend robots
     * always gets priority.
     */

    if (
      seo.robots
    ) {

      return clean(
        seo.robots
      );

    }


    /*
     * Explicit noindex.
     */

    if (
      isFalse(
        seo.indexable
      )
    ) {

      return CONFIG.DEFAULT_NOINDEX;

    }


    /*
     * Backend indexability object.
     */

    if (
      seo.indexability &&
      isFalse(
        seo.indexability.indexable
      )
    ) {

      return CONFIG.DEFAULT_NOINDEX;

    }


    return CONFIG.DEFAULT_ROBOTS;

  }


  /* =======================================================
     GET TITLE
  ====================================================== */

  function getTitle(
    seo
  ) {

    if (!seo) {

      return "";

    }


    return firstValue(

      seo.title,

      seo.Title,

      seo.seoTitle

    );

  }


  /* =======================================================
     GET DESCRIPTION
  ====================================================== */

  function getDescription(
    seo
  ) {

    if (!seo) {

      return "";

    }


    return firstValue(

      seo.description,

      seo.Description,

      seo.metaDescription,

      seo.seoDescription

    );

  }


  /* =======================================================
     GET IMAGE ALT
  ====================================================== */

  function getImageAlt(
    seo
  ) {

    if (!seo) {

      return CONFIG.SITE_NAME;

    }


    return firstValue(

      seo.imageAlt,

      seo.image_alt,

      seo.business &&
        seo.business.BusinessName,

      seo.business &&
        seo.business.businessName,

      getTitle(seo),

      CONFIG.SITE_NAME

    );

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


    const title =
      getTitle(
        seo
      );


    const description =
      getDescription(
        seo
      );


    const canonical =
      getCanonical(
        seo
      );


    const image =
      getImage(
        seo
      );


    const imageAlt =
      getImageAlt(
        seo
      );


    if (title) {

      setMeta(
        "property",
        "og:title",
        title
      );

    }


    if (description) {

      setMeta(
        "property",
        "og:description",
        description
      );

    }


    if (canonical) {

      setMeta(
        "property",
        "og:url",
        canonical
      );

    }


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
      "og:locale",
      CONFIG.DEFAULT_LOCALE
    );


    if (image) {

      setMeta(
        "property",
        "og:image",
        image
      );

    }


    if (imageAlt) {

      setMeta(
        "property",
        "og:image:alt",
        imageAlt
      );

    }

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


    const title =
      getTitle(
        seo
      );


    const description =
      getDescription(
        seo
      );


    const image =
      getImage(
        seo
      );


    const imageAlt =
      getImageAlt(
        seo
      );


    setMeta(
      "name",
      "twitter:card",
      "summary_large_image"
    );


    if (title) {

      setMeta(
        "name",
        "twitter:title",
        title
      );

    }


    if (description) {

      setMeta(
        "name",
        "twitter:description",
        description
      );

    }


    if (image) {

      setMeta(
        "name",
        "twitter:image",
        image
      );

    }


    if (imageAlt) {

      setMeta(
        "name",
        "twitter:image:alt",
        imageAlt
      );

    }

  }


  /* =======================================================
     CLEAN OLD UBNUX META
  ====================================================== */

  function removeOldUBnuxMeta() {

    const selectors = [

      'meta[data-ubnux-seo="true"]',

      'meta[data-ubnux-meta="true"]'

    ];


    selectors.forEach(
      function (
        selector
      ) {

        document
          .head
          .querySelectorAll(
            selector
          )
          .forEach(
            function (
              element
            ) {

              element.remove();

            }
          );

      }
    );

  }


  /* =======================================================
     MARK UBNUX META
  ====================================================== */

  function markUBnuxMeta() {

    const names = [

      "description",

      "robots",

      "application-name",

      "twitter:card",

      "twitter:title",

      "twitter:description",

      "twitter:image",

      "twitter:image:alt"

    ];


    names.forEach(
      function (
        name
      ) {

        const element =
          document.head.querySelector(
            `meta[name="${escapeSelector(name)}"]`
          );


        if (element) {

          element.setAttribute(
            "data-ubnux-seo",
            "true"
          );

        }

      }
    );


    const properties = [

      "og:title",

      "og:description",

      "og:url",

      "og:type",

      "og:site_name",

      "og:locale",

      "og:image",

      "og:image:alt"

    ];


    properties.forEach(
      function (
        property
      ) {

        const element =
          document.head.querySelector(
            `meta[property="${escapeSelector(property)}"]`
          );


        if (element) {

          element.setAttribute(
            "data-ubnux-seo",
            "true"
          );

        }

      }
    );

  }


  /* =======================================================
     APPLY SEO
  ====================================================== */

  function apply(
    seo
  ) {

    if (!seo) {

      return false;

    }


    /*
     * Do NOT clear all page metadata.
     * Only update UBnux-managed fields.
     */

    removeOldUBnuxMeta();


    /* =====================================================
       TITLE
    ================================================== */

    const title =
      getTitle(
        seo
      );


    if (title) {

      document.title =
        title;

    }


    /* =====================================================
       DESCRIPTION
    ================================================== */

    const description =
      getDescription(
        seo
      );


    if (description) {

      setMeta(
        "name",
        "description",
        description
      );

    }


    /* =====================================================
       ROBOTS
    ================================================== */

    setMeta(
      "name",
      "robots",
      getRobots(
        seo
      )
    );


    /* =====================================================
       CANONICAL
    ================================================== */

    const canonical =
      getCanonical(
        seo
      );


    if (canonical) {

      setCanonical(
        canonical
      );

    }


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
       APPLICATION NAME
    ================================================== */

    setMeta(
      "name",
      "application-name",
      CONFIG.SITE_NAME
    );


    /* =====================================================
       MARK UBNUX META
    ================================================== */

    markUBnuxMeta();


    return true;

  }


  /* =======================================================
     RESET BUSINESS SEO
  ====================================================== */

  function reset() {

    /*
     * Restore homepage/default canonical
     * only when explicitly requested.
     */

    const config =
      window.UBNUX_CONFIG ||
      {};


    const defaultTitle =
      firstValue(

        config.SEO &&
          config.SEO.DEFAULT_TITLE,

        CONFIG.SITE_NAME

      );


    const defaultDescription =
      firstValue(

        config.SEO &&
          config.SEO.DEFAULT_DESCRIPTION,

        ""

      );


    const defaultRobots =
      firstValue(

        config.SEO &&
          config.SEO.DEFAULT_ROBOTS,

        CONFIG.DEFAULT_ROBOTS

      );


    document.title =
      defaultTitle;


    if (
      defaultDescription
    ) {

      setMeta(
        "name",
        "description",
        defaultDescription
      );

    }


    setMeta(
      "name",
      "robots",
      defaultRobots
    );


    setCanonical(
      CONFIG.SITE_URL + "/"
    );


    return true;

  }


  /* =======================================================
     GET CURRENT SEO
  ====================================================== */

  function getCurrent() {

    const title =
      clean(
        document.title
      );


    const descriptionElement =
      document.head.querySelector(
        'meta[name="description"]'
      );


    const robotsElement =
      document.head.querySelector(
        'meta[name="robots"]'
      );


    const canonicalElement =
      document.head.querySelector(
        'link[rel="canonical"]'
      );


    return {

      title:
        title,

      description:
        descriptionElement
          ? clean(
              descriptionElement
                .getAttribute(
                  "content"
                )
            )
          : "",

      robots:
        robotsElement
          ? clean(
              robotsElement
                .getAttribute(
                  "content"
                )
            )
          : "",

      canonical:
        canonicalElement
          ? clean(
              canonicalElement
                .getAttribute(
                  "href"
                )
            )
          : ""

    };

  }


  /* =======================================================
     PUBLIC API
  ====================================================== */

  window.UBnuxSEOMeta = {

    version:
      CONFIG.VERSION,

    apply:
      apply,

    reset:
      reset,

    getCurrent:
      getCurrent,

    setMeta:
      setMeta,

    removeMeta:
      removeMeta,

    setCanonical:
      setCanonical,

    getImage:
      getImage,

    getRobots:
      getRobots,

    getCanonical:
      getCanonical

  };


})(window, document);

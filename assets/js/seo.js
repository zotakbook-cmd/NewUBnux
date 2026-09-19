/* =========================================================
   UBnux - SEO Foundation Engine
   File: assets/js/seo.js
   Version: 1.0.0

   Responsibilities:
   - Central SEO metadata manager
   - Page title
   - Meta description
   - Canonical URL
   - Robots directive
   - Open Graph
   - Twitter metadata
   - JSON-LD management
   - Homepage SEO initialization
   - Future Business / District / Category SEO support

   IMPORTANT:
   This is the frontend SEO helper.

   High-level SEO pages will later be rendered through
   Cloudflare Worker so important SEO HTML exists in the
   initial server response.
   ========================================================= */

(function (
  window,
  document
) {

  "use strict";


  /* =======================================================
     NAMESPACE
     ======================================================= */

  window.UBnux =
    window.UBnux ||
    window.ZilaBiz ||
    {};

  window.ZilaBiz =
    window.UBnux;

  var App =
    window.UBnux;


  /* =======================================================
     DEFAULT CONFIG
     ======================================================= */

  var DEFAULTS = {

    siteName:
      "UBnux",

    siteURL:
      "https://ubnux.com",

    locale:
      "en_IN",

    defaultTitle:
      "UBnux - Find Local Businesses, Shops & Services",

    defaultDescription:
      "Discover local businesses, shops, services and professionals near you with UBnux.",

    defaultImage:
      "",

    twitterCard:
      "summary_large_image"

  };


  /* =======================================================
     BASIC HELPERS
     ======================================================= */

  function clean(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(value).trim();

  }


  function absoluteURL(
    value
  ) {

    value =
      clean(value);


    if (!value) {

      return "";

    }


    try {

      return new URL(
        value,
        DEFAULTS.siteURL
      ).href;

    } catch (error) {

      return "";

    }

  }


  function currentCanonicalURL() {

    if (
      App.router &&
      typeof App.router
        .getCurrentRoute ===
        "function"
    ) {

      return (
        App.router
          .getCurrentRoute()
          .canonicalURL
      );

    }


    return (
      DEFAULTS.siteURL +
      window.location.pathname
    );

  }


  /* =======================================================
     META ELEMENT HELPERS
     ======================================================= */

  function findOrCreateMeta(
    attribute,
    value
  ) {

    var selector =
      "meta[" +
      attribute +
      "=\"" +
      value +
      "\"]";


    var element =
      document.head
        .querySelector(
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

      document.head
        .appendChild(
          element
        );

    }


    return element;

  }


  function setMeta(
    name,
    content
  ) {

    content =
      clean(content);


    if (!content) {

      return;

    }


    var element =
      findOrCreateMeta(
        "name",
        name
      );


    element.setAttribute(
      "content",
      content
    );

  }


  function setPropertyMeta(
    property,
    content
  ) {

    content =
      clean(content);


    if (!content) {

      return;

    }


    var element =
      findOrCreateMeta(
        "property",
        property
      );


    element.setAttribute(
      "content",
      content
    );

  }


  /* =======================================================
     CANONICAL
     ======================================================= */

  function setCanonical(
    url
  ) {

    url =
      absoluteURL(
        url ||
        currentCanonicalURL()
      );


    if (!url) {

      return;

    }


    var link =
      document.head
        .querySelector(
          'link[rel="canonical"]'
        );


    if (!link) {

      link =
        document.createElement(
          "link"
        );

      link.setAttribute(
        "rel",
        "canonical"
      );

      document.head
        .appendChild(
          link
        );

    }


    link.setAttribute(
      "href",
      url
    );

  }


  /* =======================================================
     TITLE
     ======================================================= */

  function setTitle(
    title
  ) {

    title =
      clean(title) ||
      DEFAULTS.defaultTitle;


    document.title =
      title;


    setPropertyMeta(
      "og:title",
      title
    );


    setMeta(
      "twitter:title",
      title
    );

  }


  /* =======================================================
     DESCRIPTION
     ======================================================= */

  function setDescription(
    description
  ) {

    description =
      clean(description) ||
      DEFAULTS.defaultDescription;


    setMeta(
      "description",
      description
    );


    setPropertyMeta(
      "og:description",
      description
    );


    setMeta(
      "twitter:description",
      description
    );

  }


  /* =======================================================
     ROBOTS
     ======================================================= */

  function setRobots(
    value
  ) {

    value =
      clean(value) ||
      "index, follow";


    setMeta(
      "robots",
      value
    );

  }


  /* =======================================================
     OPEN GRAPH
     ======================================================= */

  function setOpenGraph(
    data
  ) {

    data =
      data ||
      {};


    var url =
      absoluteURL(
        data.url ||
        currentCanonicalURL()
      );


    setPropertyMeta(
      "og:site_name",
      DEFAULTS.siteName
    );


    setPropertyMeta(
      "og:locale",
      data.locale ||
      DEFAULTS.locale
    );


    setPropertyMeta(
      "og:type",
      data.type ||
      "website"
    );


    if (url) {

      setPropertyMeta(
        "og:url",
        url
      );

    }


    var image =
      absoluteURL(
        data.image ||
        DEFAULTS.defaultImage
      );


    if (image) {

      setPropertyMeta(
        "og:image",
        image
      );


      if (
        clean(
          data.imageAlt
        )
      ) {

        setPropertyMeta(
          "og:image:alt",
          data.imageAlt
        );

      }

    }

  }


  /* =======================================================
     TWITTER
     ======================================================= */

  function setTwitter(
    data
  ) {

    data =
      data ||
      {};


    setMeta(
      "twitter:card",
      data.card ||
      DEFAULTS.twitterCard
    );


    var image =
      absoluteURL(
        data.image ||
        DEFAULTS.defaultImage
      );


    if (image) {

      setMeta(
        "twitter:image",
        image
      );

    }


    if (
      clean(
        data.imageAlt
      )
    ) {

      setMeta(
        "twitter:image:alt",
        data.imageAlt
      );

    }

  }


  /* =======================================================
     JSON-LD
     ======================================================= */

  function removeJSONLD(
    id
  ) {

    id =
      clean(id);


    if (!id) {

      return;

    }


    var existing =
      document.getElementById(
        id
      );


    if (
      existing &&
      existing.parentNode
    ) {

      existing.parentNode
        .removeChild(
          existing
        );

    }

  }


  function setJSONLD(
    id,
    data
  ) {

    id =
      clean(id);


    if (
      !id ||
      !data ||
      typeof data !==
        "object"
    ) {

      return;

    }


    removeJSONLD(
      id
    );


    var script =
      document.createElement(
        "script"
      );


    script.type =
      "application/ld+json";


    script.id =
      id;


    script.textContent =
      JSON.stringify(
        data
      );


    document.head
      .appendChild(
        script
      );

  }


  /* =======================================================
     WEBSITE SCHEMA
     ======================================================= */

  function createWebsiteSchema() {

    return {

      "@context":
        "https://schema.org",

      "@type":
        "WebSite",

      "@id":
        DEFAULTS.siteURL +
        "/#website",

      "url":
        DEFAULTS.siteURL +
        "/",

      "name":
        DEFAULTS.siteName,

      "description":
        DEFAULTS.defaultDescription

    };

  }


  /* =======================================================
     ORGANIZATION SCHEMA
     ======================================================= */

  function createOrganizationSchema() {

    return {

      "@context":
        "https://schema.org",

      "@type":
        "Organization",

      "@id":
        DEFAULTS.siteURL +
        "/#organization",

      "name":
        DEFAULTS.siteName,

      "url":
        DEFAULTS.siteURL +
        "/"

    };

  }


  /* =======================================================
     GENERIC PAGE SEO
     ======================================================= */

  function applyPageSEO(
    data
  ) {

    data =
      data ||
      {};


    var title =
      clean(
        data.title
      ) ||
      DEFAULTS.defaultTitle;


    var description =
      clean(
        data.description
      ) ||
      DEFAULTS.defaultDescription;


    var canonical =
      data.canonical ||
      currentCanonicalURL();


    setTitle(
      title
    );


    setDescription(
      description
    );


    setCanonical(
      canonical
    );


    setRobots(
      data.robots ||
      "index, follow"
    );


    setOpenGraph({

      type:
        data.ogType ||
        "website",

      url:
        canonical,

      image:
        data.image ||
        "",

      imageAlt:
        data.imageAlt ||
        title

    });


    setTwitter({

      image:
        data.image ||
        "",

      imageAlt:
        data.imageAlt ||
        title

    });

  }


  /* =======================================================
     HOMEPAGE SEO
     ======================================================= */

  function applyHomeSEO() {

    applyPageSEO({

      title:
        "UBnux - Find Local Businesses, Shops & Services Near You",

      description:
        "Discover local businesses, shops, services and professionals near you. Find business details, locations, services and contact information with UBnux.",

      canonical:
        DEFAULTS.siteURL +
        "/",

      robots:
        "index, follow"

    });


    setJSONLD(

      "ubnux-website-schema",

      createWebsiteSchema()

    );


    setJSONLD(

      "ubnux-organization-schema",

      createOrganizationSchema()

    );

  }


  /* =======================================================
     PAGE INITIALIZATION
     ======================================================= */

  function initialize() {

    var route = null;


    if (
      App.router &&
      typeof App.router
        .getCurrentRoute ===
        "function"
    ) {

      route =
        App.router
          .getCurrentRoute();

    }


    /*
     * Part 1 only initializes homepage automatically.
     *
     * State / district / category / business SEO metadata
     * will be generated after their real data is loaded in
     * the upcoming parts.
     */

    if (
      !route ||
      route.type === "home"
    ) {

      applyHomeSEO();

    }

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  App.seo = {

    applyPageSEO:
      applyPageSEO,

    applyHomeSEO:
      applyHomeSEO,

    setTitle:
      setTitle,

    setDescription:
      setDescription,

    setCanonical:
      setCanonical,

    setRobots:
      setRobots,

    setOpenGraph:
      setOpenGraph,

    setTwitter:
      setTwitter,

    setJSONLD:
      setJSONLD,

    removeJSONLD:
      removeJSONLD,

    createWebsiteSchema:
      createWebsiteSchema,

    createOrganizationSchema:
      createOrganizationSchema,

    getCanonicalURL:
      currentCanonicalURL

  };


  App.applySEO =
    applyPageSEO;


  /* =======================================================
     AUTO INITIALIZE
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(

      "DOMContentLoaded",

      initialize,

      {
        once: true
      }

    );

  } else {

    initialize();

  }


})(window, document);
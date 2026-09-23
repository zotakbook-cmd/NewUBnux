/* =========================================================
   UBnux Schema Renderer
   File: assets/js/seo/schema.js

   Version:
   2.0.0

   Responsibilities:
   - Render backend-generated JSON-LD
   - Remove previous UBnux schema
   - Prevent duplicate schema
   - Support @graph
   - Support BusinessSEO response.schema
   - No fake schema generation
   - No frontend rating generation

   IMPORTANT:
   Schema generation is handled by:

   SchemaEngine.gs
        ↓
   BusinessSEO.gs
        ↓
   response.schema

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
      "2.0.0",

    SCRIPT_ATTRIBUTE:
      "data-ubnux-schema"

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
     REMOVE EXISTING UBNUX SCHEMA
  ====================================================== */

  function removeExisting() {

    const scripts =
      document.querySelectorAll(
        `script[type="application/ld+json"][${CONFIG.SCRIPT_ATTRIBUTE}]`
      );


    scripts.forEach(
      function (script) {

        script.remove();

      }
    );

  }


  /* =======================================================
     NORMALIZE SCHEMA
  ====================================================== */

  function normalizeSchema(
    schema
  ) {

    if (!schema) {

      return null;

    }


    /*
      BusinessSEO may return:

      {
        schema: {...}
      }
    */

    if (
      schema.schema
    ) {

      schema =
        schema.schema;

    }


    /*
      Array → @graph
    */

    if (
      Array.isArray(schema)
    ) {

      return {

        "@context":
          "https://schema.org",

        "@graph":
          schema

      };

    }


    /*
      Object without @context
    */

    if (
      typeof schema === "object" &&
      !schema["@context"]
    ) {

      return Object.assign(

        {
          "@context":
            "https://schema.org"
        },

        schema

      );

    }


    return schema;

  }


  /* =======================================================
     INSERT
  ====================================================== */

  function insert(
    schema
  ) {

    const normalized =
      normalizeSchema(
        schema
      );


    if (
      !normalized
    ) {

      return false;

    }


    const json =
      JSON.stringify(
        normalized
      );


    if (!json) {

      return false;

    }


    const script =
      document.createElement(
        "script"
      );


    script.type =
      "application/ld+json";


    script.setAttribute(
      CONFIG.SCRIPT_ATTRIBUTE,
      "true"
    );


    script.textContent =
      json;


    document.head.appendChild(
      script
    );


    return true;

  }


  /* =======================================================
     RENDER
  ====================================================== */

  function render(
    schema
  ) {

    removeExisting();

    return insert(
      schema
    );

  }


  /* =======================================================
     RENDER BUSINESS SEO RESPONSE
  ====================================================== */

  function renderFromSEO(
    seoResponse
  ) {

    if (!seoResponse) {

      return false;

    }


    const schema =
      seoResponse.schema ||
      seoResponse.seo &&
      seoResponse.seo.schema;


    if (!schema) {

      return false;

    }


    return render(
      schema
    );

  }


  /* =======================================================
     GET CURRENT SCHEMA
  ====================================================== */

  function getCurrent() {

    const script =
      document.querySelector(
        `script[type="application/ld+json"][${CONFIG.SCRIPT_ATTRIBUTE}]`
      );


    if (!script) {

      return null;

    }


    try {

      return JSON.parse(
        script.textContent
      );

    } catch (error) {

      return null;

    }

  }


  /* =======================================================
     PUBLIC API
  ====================================================== */

  window.UBNUX_SCHEMA = {

    version:
      CONFIG.VERSION,

    insert:
      insert,

    render:
      render,

    renderFromSEO:
      renderFromSEO,

    remove:
      removeExisting,

    getCurrent:
      getCurrent

  };


})(window, document);

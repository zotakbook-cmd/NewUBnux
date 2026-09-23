/* =========================================================
   UBnux Schema Renderer
   File: assets/js/seo/schema.js

   Version:
   2.1.0

   Responsibilities:
   ---------------------------------------------------------
   - Render backend-generated JSON-LD
   - Remove previous UBnux schema
   - Prevent duplicate UBnux schema
   - Support @graph
   - Support BusinessSEO response.schema
   - Support seo.schema compatibility
   - Validate basic schema structure
   - No fake schema generation
   - No frontend rating generation
   - No frontend review generation

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
      "2.1.0",

    SCRIPT_ATTRIBUTE:
      "data-ubnux-schema",

    JSON_TYPE:
      "application/ld+json",

    CONTEXT:
      "https://schema.org"

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
     IS OBJECT
  ====================================================== */

  function isObject(
    value
  ) {

    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );

  }


  /* =======================================================
     REMOVE EXISTING UBNUX SCHEMA
  ====================================================== */

  function removeExisting() {

    const scripts =
      document.querySelectorAll(
        `script[type="${CONFIG.JSON_TYPE}"][${CONFIG.SCRIPT_ATTRIBUTE}]`
      );


    scripts.forEach(
      function (
        script
      ) {

        script.remove();

      }
    );


    return scripts.length;

  }


  /* =======================================================
     NORMALIZE SCHEMA
  ====================================================== */

  function normalizeSchema(
    schema
  ) {

    if (
      !schema
    ) {

      return null;

    }


    /*
     * BusinessSEO compatibility:
     *
     * {
     *   schema: {...}
     * }
     */

    if (
      isObject(schema) &&
      schema.schema
    ) {

      schema =
        schema.schema;

    }


    /*
     * Array → @graph
     */

    if (
      Array.isArray(schema)
    ) {

      if (
        schema.length === 0
      ) {

        return null;

      }


      return {

        "@context":
          CONFIG.CONTEXT,

        "@graph":
          schema

      };

    }


    /*
     * Schema must be an object
     */

    if (
      !isObject(schema)
    ) {

      return null;

    }


    /*
     * Clone object.
     *
     * Do not mutate backend response.
     */

    const normalized =
      Object.assign(
        {},
        schema
      );


    /*
     * Add @context only when backend
     * did not provide one.
     */

    if (
      !normalized["@context"]
    ) {

      normalized["@context"] =
        CONFIG.CONTEXT;

    }


    return normalized;

  }


  /* =======================================================
     BASIC SCHEMA VALIDATION
  ====================================================== */

  function isValidSchema(
    schema
  ) {

    if (
      !schema ||
      !isObject(schema)
    ) {

      return false;

    }


    /*
     * @graph schema
     */

    if (
      Array.isArray(
        schema["@graph"]
      )
    ) {

      return (
        schema["@graph"].length >
        0
      );

    }


    /*
     * Normal single schema
     */

    if (
      schema["@type"]
    ) {

      return true;

    }


    /*
     * Some valid schema structures
     * may primarily use @id.
     */

    if (
      schema["@id"]
    ) {

      return true;

    }


    return false;

  }


  /* =======================================================
     SANITIZE SCHEMA
  ====================================================== */

  function sanitizeSchema(
    schema
  ) {

    if (
      !schema
    ) {

      return null;

    }


    /*
     * Do not modify original object.
     */

    let output;


    try {

      output =
        JSON.parse(
          JSON.stringify(
            schema
          )
        );

    } catch (
      error
    ) {

      return null;

    }


    return output;

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


    const sanitized =
      sanitizeSchema(
        normalized
      );


    if (
      !sanitized
    ) {

      return false;

    }


    if (
      !isValidSchema(
        sanitized
      )
    ) {

      return false;

    }


    let json;


    try {

      json =
        JSON.stringify(
          sanitized
        );

    } catch (
      error
    ) {

      console.error(
        "[UBnux Schema] JSON serialization failed:",
        error
      );


      return false;

    }


    if (
      !json
    ) {

      return false;

    }


    /*
     * Prevent accidental duplicate insertion
     * inside the same render cycle.
     */

    removeExisting();


    const script =
      document.createElement(
        "script"
      );


    script.type =
      CONFIG.JSON_TYPE;


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

    /*
     * Always remove old UBnux schema
     * before rendering the new one.
     */

    removeExisting();


    const normalized =
      normalizeSchema(
        schema
      );


    if (
      !normalized
    ) {

      return false;

    }


    return insert(
      normalized
    );

  }


  /* =======================================================
     RENDER BUSINESS SEO RESPONSE
  ====================================================== */

  function renderFromSEO(
    seoResponse
  ) {

    if (
      !seoResponse
    ) {

      return false;

    }


    let schema =
      null;


    /*
     * Preferred:
     *
     * response.schema
     */

    if (
      seoResponse.schema
    ) {

      schema =
        seoResponse.schema;

    }


    /*
     * Compatibility:
     *
     * response.seo.schema
     */

    else if (
      seoResponse.seo &&
      seoResponse.seo.schema
    ) {

      schema =
        seoResponse.seo.schema;

    }


    /*
     * Direct SEO object compatibility.
     */

    else if (
      seoResponse["@context"] ||
      seoResponse["@type"] ||
      seoResponse["@graph"]
    ) {

      schema =
        seoResponse;

    }


    if (
      !schema
    ) {

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
        `script[type="${CONFIG.JSON_TYPE}"][${CONFIG.SCRIPT_ATTRIBUTE}]`
      );


    if (
      !script
    ) {

      return null;

    }


    const text =
      clean(
        script.textContent
      );


    if (!text) {

      return null;

    }


    try {

      return JSON.parse(
        text
      );

    } catch (
      error
    ) {

      console.error(
        "[UBnux Schema] Existing schema JSON is invalid:",
        error
      );


      return null;

    }

  }


  /* =======================================================
     HAS SCHEMA
  ====================================================== */

  function hasSchema() {

    return !!document.querySelector(
      `script[type="${CONFIG.JSON_TYPE}"][${CONFIG.SCRIPT_ATTRIBUTE}]`
    );

  }


  /* =======================================================
     GET SCHEMA COUNT
  ====================================================== */

  function getCount() {

    return document.querySelectorAll(
      `script[type="${CONFIG.JSON_TYPE}"][${CONFIG.SCRIPT_ATTRIBUTE}]`
    ).length;

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
      getCurrent,

    hasSchema:
      hasSchema,

    getCount:
      getCount

  };


})(window, document);

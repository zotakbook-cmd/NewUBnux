/* =========================================================
   UBnux API Client
   File: assets/js/api.js

   Version:
   2.3.0

   Responsibilities:
   - Centralized Google Apps Script API client
   - States
   - Districts
   - Categories
   - Businesses
   - Business by ID
   - Business by SEO path
   - Centralized request handling
   - Safe API URL handling
   - Consistent error handling
========================================================= */

(function (window) {

  "use strict";


  /* =======================================================
     CONFIG
  ====================================================== */

  const config =
    window.UBNUX_CONFIG || {};


  /* =======================================================
     VALIDATE CONFIG
  ====================================================== */

  if (
    !config ||
    !config.API_URL
  ) {

    console.error(
      "[UBnux API] API configuration is missing."
    );

  }


  /* =======================================================
     NORMALIZE API URL
  ====================================================== */

  function getAPIURL() {

    const apiURL =
      String(
        config.API_URL || ""
      ).trim();


    if (!apiURL) {

      throw new Error(
        "UBnux API URL is not configured."
      );

    }


    /*
     * Remove accidental trailing
     * ? or &
     */

    return apiURL.replace(
      /[?&]+$/,
      ""
    );

  }


  /* =======================================================
     BUILD REQUEST URL
  ====================================================== */

  function buildURL(
    action,
    params
  ) {

    if (!action) {

      throw new Error(
        "API action is required."
      );

    }


    params =
      params || {};


    const query =
      new URLSearchParams();


    /*
     * API ACTION
     */

    query.set(
      "action",
      String(action).trim()
    );


    /*
     * PARAMETERS
     */

    Object.keys(params)
      .forEach(function (key) {

        const value =
          params[key];


        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {

          query.set(
            key,
            String(value).trim()
          );

        }

      });


    return (
      getAPIURL() +
      "?" +
      query.toString()
    );

  }


  /* =======================================================
     CENTRAL REQUEST
  ====================================================== */

  async function request(
    action,
    params
  ) {

    if (!action) {

      throw new Error(
        "API action is required."
      );

    }


    const url =
      buildURL(
        action,
        params
      );


    let response;


    /* =====================================================
       FETCH
    ===================================================== */

    try {

      response =
        await fetch(
          url,
          {
            method:
              "GET",

            cache:
              "no-store",

            headers: {

              "Accept":
                "application/json"

            }
          }
        );

    } catch (
      error
    ) {

      console.error(
        "[UBnux API] Network error:",
        error
      );


      throw new Error(
        "Unable to connect to UBnux API."
      );

    }


    /* =====================================================
       HTTP ERROR
    ===================================================== */

    if (
      !response.ok
    ) {

      throw new Error(
        "API request failed: " +
        response.status
      );

    }


    /* =====================================================
       JSON PARSE
    ===================================================== */

    let data;


    try {

      data =
        await response.json();

    } catch (
      error
    ) {

      console.error(
        "[UBnux API] Invalid JSON response:",
        error
      );


      throw new Error(
        "API returned invalid JSON."
      );

    }


    /* =====================================================
       API RESPONSE VALIDATION
    ===================================================== */

    if (
      !data ||
      data.success !== true
    ) {

      const message =
        data &&
        data.message
          ? String(data.message)
          : "API returned an error.";


      console.error(
        "[UBnux API] Server error:",
        {
          action:
            action,

          params:
            params || {},

          message:
            message,

          response:
            data
        }
      );


      throw new Error(
        message
      );

    }


    return data;

  }


  /* =======================================================
     STATES
  ====================================================== */

  async function getStates() {

    return request(
      "states"
    );

  }


  /* =======================================================
     DISTRICTS
  ====================================================== */

  async function getDistricts(
    stateCode
  ) {

    if (
      !stateCode
    ) {

      throw new Error(
        "State code is required."
      );

    }


    return request(
      "districts",
      {

        state:
          stateCode

      }
    );

  }


  /* =======================================================
     CATEGORIES
  ====================================================== */

  async function getCategories() {

    return request(
      "categories"
    );

  }


  /* =======================================================
     BUSINESSES LIST
  ====================================================== */

  async function getBusinesses(
    options
  ) {

    options =
      options || {};


    const page =
      Number(
        options.page || 1
      );


    const limit =
      Number(
        options.limit ||
        config.BUSINESS_PAGE_SIZE ||
        20
      );


    return request(
      "businesses",
      {

        state:
          options.state ||
          "",

        district:
          options.district ||
          "",

        category:
          options.category ||
          "",

        page:
          page > 0
            ? page
            : 1,

        limit:
          limit > 0
            ? limit
            : 20,

        sort:
          options.sort ||
          config.DEFAULT_SORT ||
          ""

      }
    );

  }


  /* =======================================================
     BUSINESS
     
     Supports BOTH:

     1. Business ID

        getBusiness("B001")

     2. SEO parameters

        getBusiness({
          state: "bihar",
          district: "siwan",
          category: "clothing-and-fashion",
          slug: "siwan-fashion-house"
        })

     Backend action:

        action=business
  ====================================================== */

  async function getBusiness(
    input
  ) {

    /* =====================================================
       CASE 1
       Simple Business ID
    ===================================================== */

    if (
      typeof input === "string" ||
      typeof input === "number"
    ) {

      const businessId =
        String(input).trim();


      if (!businessId) {

        throw new Error(
          "Business ID is required."
        );

      }


      return request(
        "business",
        {

          id:
            businessId

        }
      );

    }


    /* =====================================================
       CASE 2
       Object Parameters
    ===================================================== */

    if (
      !input ||
      typeof input !== "object"
    ) {

      throw new Error(
        "Business ID or SEO parameters are required."
      );

    }


    const stateSlug =
      String(
        input.state ||
        input.stateSlug ||
        ""
      ).trim();


    const districtSlug =
      String(
        input.district ||
        input.districtSlug ||
        ""
      ).trim();


    const categorySlug =
      String(
        input.category ||
        input.categorySlug ||
        ""
      ).trim();


    const businessSlug =
      String(
        input.slug ||
        input.businessSlug ||
        ""
      ).trim();


    /* =====================================================
       SEO REQUEST
    ===================================================== */

    if (
      stateSlug &&
      districtSlug &&
      categorySlug &&
      businessSlug
    ) {

      return request(
        "business",
        {

          state:
            stateSlug,

          district:
            districtSlug,

          category:
            categorySlug,

          slug:
            businessSlug

        }
      );

    }


    /* =====================================================
       OBJECT WITH BUSINESS ID
    ===================================================== */

    const businessId =
      String(
        input.id ||
        input.BusinessID ||
        input.businessId ||
        ""
      ).trim();


    if (
      businessId
    ) {

      return request(
        "business",
        {

          id:
            businessId

        }
      );

    }


    /* =====================================================
       INVALID PARAMETERS
    ===================================================== */

    throw new Error(
      "Complete business SEO path or Business ID is required."
    );

  }


  /* =======================================================
     BUSINESS BY SEO SLUG
     
     Example:

     /in/bihar/siwan/libraries/abc-library/

     Backend:

     ?action=business
     &state=bihar
     &district=siwan
     &category=libraries
     &slug=abc-library
  ====================================================== */

  async function getBusinessBySlug(
    stateSlug,
    districtSlug,
    categorySlug,
    businessSlug
  ) {

    if (
      !stateSlug
    ) {

      throw new Error(
        "State slug is required."
      );

    }


    if (
      !districtSlug
    ) {

      throw new Error(
        "District slug is required."
      );

    }


    if (
      !categorySlug
    ) {

      throw new Error(
        "Category slug is required."
      );

    }


    if (
      !businessSlug
    ) {

      throw new Error(
        "Business slug is required."
      );

    }


    return getBusiness({

      state:
        stateSlug,

      district:
        districtSlug,

      category:
        categorySlug,

      slug:
        businessSlug

    });

  }


  /* =======================================================
     BUSINESS BY SEO OBJECT
     
     Convenience method:

     getBusinessBySEO({
       state,
       district,
       category,
       slug
     })
  ====================================================== */

  async function getBusinessBySEO(
    params
  ) {

    if (
      !params ||
      typeof params !== "object"
    ) {

      throw new Error(
        "SEO business parameters are required."
      );

    }


    return getBusiness(
      params
    );

  }


  /* =======================================================
     PUBLIC API
  ====================================================== */

  const api = {

    /*
     * Core
     */

    request:
      request,

    buildURL:
      buildURL,

    getAPIURL:
      getAPIURL,


    /*
     * Master data
     */

    getStates:
      getStates,

    getDistricts:
      getDistricts,

    getCategories:
      getCategories,


    /*
     * Businesses
     */

    getBusinesses:
      getBusinesses,

    getBusiness:
      getBusiness,

    getBusinessBySlug:
      getBusinessBySlug,

    getBusinessBySEO:
      getBusinessBySEO

  };


  /* =======================================================
     EXPORT
  ====================================================== */

  window.UBnuxAPI =
    api;


  /*
   * Backward compatibility
   */

  window.ZilaBizAPI =
    api;


  /* =======================================================
     DEBUG
  ====================================================== */

  console.debug(
    "[UBnux API] Initialized.",
    {
      version:
        "2.3.0",

      apiURL:
        getSafeAPIURLForDebug()
    }
  );


  /* =======================================================
     SAFE DEBUG URL
  ====================================================== */

  function getSafeAPIURLForDebug() {

    try {

      const url =
        getAPIURL();


      /*
       * API URL को console में पूरा expose
       * करने के बजाय केवल origin/path दिखाएं.
       */

      const parsed =
        new URL(url);


      return (
        parsed.origin +
        parsed.pathname
      );

    } catch (
      error
    ) {

      return "";

    }

  }


})(window);

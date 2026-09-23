/* =========================================================
   UBnux API Client
   File: assets/js/api.js

   Version:
   3.0.0

   Responsibilities:
   ---------------------------------------------------------
   - Centralized Google Apps Script API client
   - States
   - Districts
   - Categories
   - Businesses
   - Business by ID
   - Business by SEO path
   - Centralized request handling
   - Safe API URL handling
   - Request timeout
   - Consistent error handling
   - SEO business lookup
   - Backward compatibility
   - Optional response cache
   - Safe debug logging
========================================================= */

(function (window) {

  "use strict";


  /* =======================================================
     CONFIG
  ====================================================== */

  const config =
    window.UBNUX_CONFIG ||
    {};


  const VERSION =
    "3.0.0";


  /* =======================================================
     DEFAULTS
  ====================================================== */

  const DEFAULTS = {

    REQUEST_TIMEOUT:
      25000,

    CACHE_TTL:
      Number(
        config.API_CACHE_TTL ||
        0
      ),

    BUSINESS_PAGE_SIZE:
      Number(
        config.BUSINESS_PAGE_SIZE ||
        18
      ),

    DEFAULT_SORT:
      config.DEFAULT_SORT ||
      "featured"

  };


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
     INTERNAL CACHE
  ====================================================== */

  const responseCache =
    new Map();


  /* =======================================================
     SAFE STRING
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
     NORMALIZE SLUG
  ====================================================== */

  function normalizeSlug(
    value
  ) {

    return clean(
      value
    )
      .toLowerCase()
      .replace(
        /^\/+|\/+$/g,
        ""
      );

  }


  /* =======================================================
     API URL
  ====================================================== */

  function getAPIURL() {

    const apiURL =
      clean(
        config.API_URL
      );


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

    action =
      clean(
        action
      );


    if (!action) {

      throw new Error(
        "API action is required."
      );

    }


    params =
      params ||
      {};


    const query =
      new URLSearchParams();


    /*
     * ACTION
     */

    query.set(
      "action",
      action
    );


    /*
     * PARAMETERS
     */

    Object.keys(
      params
    ).forEach(
      function (
        key
      ) {

        const value =
          params[key];


        if (
          value === undefined ||
          value === null
        ) {

          return;

        }


        const stringValue =
          clean(
            value
          );


        if (!stringValue) {

          return;

        }


        query.set(
          key,
          stringValue
        );

      }
    );


    return (
      getAPIURL() +
      "?" +
      query.toString()
    );

  }


  /* =======================================================
     CACHE KEY
  ====================================================== */

  function buildCacheKey(
    action,
    params
  ) {

    return (
      clean(
        action
      ) +
      "|" +
      JSON.stringify(
        params ||
        {}
      )
    );

  }


  /* =======================================================
     CACHE READ
  ====================================================== */

  function getCached(
    key
  ) {

    if (
      !DEFAULTS.CACHE_TTL ||
      DEFAULTS.CACHE_TTL <= 0
    ) {

      return null;

    }


    const item =
      responseCache.get(
        key
      );


    if (!item) {

      return null;

    }


    if (
      Date.now() -
      item.time >
      DEFAULTS.CACHE_TTL
    ) {

      responseCache.delete(
        key
      );


      return null;

    }


    return item.data;

  }


  /* =======================================================
     CACHE WRITE
  ====================================================== */

  function setCached(
    key,
    data
  ) {

    if (
      !DEFAULTS.CACHE_TTL ||
      DEFAULTS.CACHE_TTL <= 0
    ) {

      return;

    }


    responseCache.set(
      key,
      {

        time:
          Date.now(),

        data:
          data

      }
    );

  }


  /* =======================================================
     CLEAR CACHE
  ====================================================== */

  function clearCache() {

    responseCache.clear();

  }


  /* =======================================================
     REQUEST WITH TIMEOUT
  ====================================================== */

  async function fetchWithTimeout(
    url,
    options
  ) {

    options =
      options ||
      {};


    /*
     * AbortController support
     */

    if (
      typeof AbortController !==
      "undefined"
    ) {

      const controller =
        new AbortController();


      const timeout =
        setTimeout(
          function () {

            controller.abort();

          },
          DEFAULTS.REQUEST_TIMEOUT
        );


      try {

        const response =
          await fetch(
            url,
            Object.assign(
              {},
              options,
              {
                signal:
                  controller.signal
              }
            )
          );


        return response;

      } finally {

        clearTimeout(
          timeout
        );

      }

    }


    /*
     * Fallback for browsers
     * without AbortController
     */

    return fetch(
      url,
      options
    );

  }


  /* =======================================================
     CENTRAL REQUEST
  ====================================================== */

  async function request(
    action,
    params,
    options
  ) {

    options =
      options ||
      {};


    if (!action) {

      throw new Error(
        "API action is required."
      );

    }


    params =
      params ||
      {};


    const url =
      buildURL(
        action,
        params
      );


    const cacheKey =
      buildCacheKey(
        action,
        params
      );


    /*
     * CACHE
     */

    if (
      options.cache !== false
    ) {

      const cached =
        getCached(
          cacheKey
        );


      if (cached) {

        return cached;

      }

    }


    let response;


    /* =====================================================
       FETCH
    ==================================================== */

    try {

      response =
        await fetchWithTimeout(
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


      if (
        error &&
        error.name ===
        "AbortError"
      ) {

        throw new Error(
          "UBnux API request timed out."
        );

      }


      throw new Error(
        "Unable to connect to UBnux API."
      );

    }


    /* =====================================================
       HTTP ERROR
    ==================================================== */

    if (
      !response.ok
    ) {

      throw new Error(
        "API request failed: HTTP " +
        response.status
      );

    }


    /* =====================================================
       JSON
    ==================================================== */

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
       RESPONSE VALIDATION
    ==================================================== */

    if (
      !data ||
      data.success !== true
    ) {

      const message =
        data &&
        data.message
          ? String(
              data.message
            )
          : "API returned an error.";


      console.error(
        "[UBnux API] Server error:",
        {

          action:
            action,

          params:
            params,

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


    /*
     * SAVE CACHE
     */

    if (
      options.cache !== false
    ) {

      setCached(
        cacheKey,
        data
      );

    }


    return data;

  }


  /* =======================================================
     STATES
  ====================================================== */

  async function getStates(
    options
  ) {

    return request(
      "states",
      {},
      options
    );

  }


  /* =======================================================
     DISTRICTS
  ====================================================== */

  async function getDistricts(
    stateCode,
    options
  ) {

    stateCode =
      clean(
        stateCode
      );


    if (!stateCode) {

      throw new Error(
        "State code is required."
      );

    }


    return request(
      "districts",
      {

        state:
          stateCode

      },
      options
    );

  }


  /* =======================================================
     CATEGORIES
  ====================================================== */

  async function getCategories(
    options
  ) {

    return request(
      "categories",
      {},
      options
    );

  }


  /* =======================================================
     BUSINESSES LIST
  ====================================================== */

  async function getBusinesses(
    options
  ) {

    options =
      options ||
      {};


    let page =
      Number(
        options.page ||
        1
      );


    let limit =
      Number(
        options.limit ||
        DEFAULTS.BUSINESS_PAGE_SIZE
      );


    if (
      !Number.isFinite(page) ||
      page < 1
    ) {

      page =
        1;

    }


    if (
      !Number.isFinite(limit) ||
      limit < 1
    ) {

      limit =
        DEFAULTS.BUSINESS_PAGE_SIZE;

    }


    return request(
      "businesses",
      {

        state:
          clean(
            options.state ||
            options.stateSlug ||
            ""
          ),

        district:
          clean(
            options.district ||
            options.districtSlug ||
            ""
          ),

        category:
          clean(
            options.category ||
            options.categorySlug ||
            ""
          ),

        page:
          page,

        limit:
          limit,

        sort:
          clean(
            options.sort ||
            DEFAULTS.DEFAULT_SORT
          )

      },
      options
    );

  }


  /* =======================================================
     BUSINESS
     
     Supports:

     1. Business ID

        getBusiness("B001")

     2. SEO object

        getBusiness({
          state: "bihar",
          district: "siwan",
          category: "clothing-and-fashion",
          slug: "siwan-fashion-house"
        })

     3. Business object

        getBusiness({
          id: "B001"
        })
  ====================================================== */

  async function getBusiness(
    input,
    options
  ) {

    /*
     * CASE 1
     * Business ID
     */

    if (
      typeof input === "string" ||
      typeof input === "number"
    ) {

      const businessId =
        clean(
          input
        );


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

        },
        options
      );

    }


    /*
     * CASE 2
     * Object
     */

    if (
      !input ||
      typeof input !==
      "object"
    ) {

      throw new Error(
        "Business ID or SEO parameters are required."
      );

    }


    const stateSlug =
      normalizeSlug(
        input.state ||
        input.stateSlug ||
        ""
      );


    const districtSlug =
      normalizeSlug(
        input.district ||
        input.districtSlug ||
        ""
      );


    const categorySlug =
      normalizeSlug(
        input.category ||
        input.categorySlug ||
        ""
      );


    const businessSlug =
      normalizeSlug(
        input.slug ||
        input.businessSlug ||
        ""
      );


    /*
     * SEO LOOKUP
     */

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

        },
        options
      );

    }


    /*
     * BUSINESS ID LOOKUP
     */

    const businessId =
      clean(
        input.id ||
        input.BusinessID ||
        input.businessId ||
        ""
      );


    if (businessId) {

      return request(
        "business",
        {

          id:
            businessId

        },
        options
      );

    }


    throw new Error(
      "Complete business SEO path or Business ID is required."
    );

  }


  /* =======================================================
     BUSINESS BY SEO SLUG
     
     Supports BOTH:

     Positional:

     getBusinessBySlug(
       "bihar",
       "siwan",
       "clothing-and-fashion",
       "siwan-fashion-house"
     )

     Object:

     getBusinessBySlug({
       state: "bihar",
       district: "siwan",
       category: "clothing-and-fashion",
       slug: "siwan-fashion-house"
     })
  ====================================================== */

  async function getBusinessBySlug(
    stateSlug,
    districtSlug,
    categorySlug,
    businessSlug,
    options
  ) {

    /*
     * OBJECT FORMAT
     */

    if (
      stateSlug &&
      typeof stateSlug ===
      "object"
    ) {

      const params =
        stateSlug;


      /*
       * Allow second argument
       * to act as options.
       */

      const requestOptions =
        districtSlug &&
        typeof districtSlug ===
        "object"
          ? districtSlug
          : options;


      return getBusiness(
        {

          state:
            params.state ||
            params.stateSlug ||
            "",

          district:
            params.district ||
            params.districtSlug ||
            "",

          category:
            params.category ||
            params.categorySlug ||
            "",

          slug:
            params.slug ||
            params.businessSlug ||
            ""

        },
        requestOptions
      );

    }


    /*
     * POSITIONAL FORMAT
     */

    stateSlug =
      normalizeSlug(
        stateSlug
      );


    districtSlug =
      normalizeSlug(
        districtSlug
      );


    categorySlug =
      normalizeSlug(
        categorySlug
      );


    businessSlug =
      normalizeSlug(
        businessSlug
      );


    if (!stateSlug) {

      throw new Error(
        "State slug is required."
      );

    }


    if (!districtSlug) {

      throw new Error(
        "District slug is required."
      );

    }


    if (!categorySlug) {

      throw new Error(
        "Category slug is required."
      );

    }


    if (!businessSlug) {

      throw new Error(
        "Business slug is required."
      );

    }


    return getBusiness(
      {

        state:
          stateSlug,

        district:
          districtSlug,

        category:
          categorySlug,

        slug:
          businessSlug

      },
      options
    );

  }


  /* =======================================================
     BUSINESS BY SEO OBJECT
  ====================================================== */

  async function getBusinessBySEO(
    params,
    options
  ) {

    if (
      !params ||
      typeof params !==
      "object"
    ) {

      throw new Error(
        "SEO business parameters are required."
      );

    }


    return getBusiness(
      params,
      options
    );

  }


  /* =======================================================
     API HEALTH
  ====================================================== */

  async function healthCheck() {

    try {

      const result =
        await request(
          "states",
          {},
          {
            cache:
              false
          }
        );


      return {

        success:
          true,

        data:
          result

      };

    } catch (
      error
    ) {

      return {

        success:
          false,

        message:
          error &&
          error.message
            ? error.message
            : "API health check failed."

      };

    }

  }


  /* =======================================================
     CLEAR API CACHE
  ====================================================== */

  function clearAPICache() {

    clearCache();

  }


  /* =======================================================
     GET CONFIG
  ====================================================== */

  function getConfig() {

    return {

      version:
        VERSION,

      apiURL:
        getSafeAPIURLForDebug(),

      cacheTTL:
        DEFAULTS.CACHE_TTL,

      requestTimeout:
        DEFAULTS.REQUEST_TIMEOUT,

      businessPageSize:
        DEFAULTS.BUSINESS_PAGE_SIZE,

      defaultSort:
        DEFAULTS.DEFAULT_SORT

    };

  }


  /* =======================================================
     PUBLIC API
  ====================================================== */

  const api = {

    /*
     * Version
     */

    version:
      VERSION,


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
     * Cache
     */

    clearCache:
      clearAPICache,


    /*
     * Config
     */

    getConfig:
      getConfig,


    /*
     * Health
     */

    healthCheck:
      healthCheck,


    /*
     * Master Data
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
     SAFE DEBUG URL
  ====================================================== */

  function getSafeAPIURLForDebug() {

    try {

      const url =
        getAPIURL();


      const parsed =
        new URL(
          url
        );


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


  /* =======================================================
     DEBUG
  ====================================================== */

  if (
    window.console &&
    typeof window.console.debug ===
      "function"
  ) {

    window.console.debug(
      "[UBnux API] Initialized.",
      {

        version:
          VERSION,

        apiURL:
          getSafeAPIURLForDebug(),

        businessPageSize:
          DEFAULTS.BUSINESS_PAGE_SIZE

      }
    );

  }


})(window);

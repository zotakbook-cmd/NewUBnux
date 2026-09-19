
/* =========================================================
   UBnux API Client
   File: assets/js/api.js

   Responsibilities:
   - Centralized Google Apps Script API client
   - States
   - Districts
   - Categories
   - Businesses
   - Business by ID
   - Business by SEO slug
   - Centralized request handling
========================================================= */

(function (window) {

  "use strict";


  /* =======================================================
     CONFIG
  ====================================================== */

  const config =
    window.UBNUX_CONFIG;


  /* =======================================================
     VALIDATE CONFIG
  ====================================================== */

  if (
    !config ||
    !config.API_URL
  ) {

    console.error(
      "UBnux API configuration is missing."
    );

  }


  /* =======================================================
     NORMALIZE API URL
  ====================================================== */

  function getAPIURL() {

    const apiURL =
      String(
        config &&
        config.API_URL
          ? config.API_URL
          : ""
      )
        .trim();


    if (!apiURL) {

      throw new Error(
        "UBnux API URL is not configured."
      );

    }


    /*
     * Prevent accidental duplicate ?
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

    params =
      params || {};


    const query =
      new URLSearchParams();


    query.set(
      "action",
      action
    );


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

      throw new Error(
        "Unable to connect to UBnux API."
      );

    }


    if (!response.ok) {

      throw new Error(
        "API request failed: " +
        response.status
      );

    }


    let data;


    try {

      data =
        await response.json();

    } catch (
      error
    ) {

      throw new Error(
        "API returned invalid JSON."
      );

    }


    if (
      !data ||
      data.success !== true
    ) {

      throw new Error(
        data &&
        data.message
          ? data.message
          : "API returned an error."
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
     BUSINESSES
  ====================================================== */

  async function getBusinesses(
    options
  ) {

    options =
      options || {};


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
          options.page ||
          1,

        limit:
          options.limit ||
          config.BUSINESS_PAGE_SIZE,

        sort:
          options.sort ||
          config.DEFAULT_SORT

      }
    );

  }


  /* =======================================================
     BUSINESS BY ID
  ====================================================== */

  async function getBusiness(
    businessId
  ) {

    if (
      !businessId
    ) {

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


  /* =======================================================
     BUSINESS BY SEO SLUG
     
     Example URL:

     /in/bihar/siwan/libraries/abc-library/

     Request:

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


  /* =======================================================
     PUBLIC API
  ====================================================== */

  window.UBnuxAPI = {

    request,

    buildURL,

    getStates,

    getDistricts,

    getCategories,

    getBusinesses,

    getBusiness,

    getBusinessBySlug

  };


})(window);

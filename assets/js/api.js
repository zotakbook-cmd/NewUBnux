/* =========================================================
   UBnux API Client
   File: assets/js/api.js
========================================================= */

(function (window) {

  "use strict";


  const config =
    window.UBNUX_CONFIG;


  async function request(
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
            String(value)
          );

        }

      });


    const url =
      config.API_URL +
      "?" +
      query.toString();


    const response =
      await fetch(
        url,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        "API request failed: " +
        response.status
      );

    }


    const data =
      await response.json();


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


  async function getStates() {

    return request(
      "states"
    );

  }


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


  async function getCategories() {

    return request(
      "categories"
    );

  }


  async function getBusinesses(
    options
  ) {

    options =
      options || {};


    return request(
      "businesses",
      {

        state:
          options.state || "",

        district:
          options.district || "",

        category:
          options.category || "",

        page:
          options.page || 1,

        limit:
          options.limit ||
          config.BUSINESS_PAGE_SIZE,

        sort:
          options.sort ||
          config.DEFAULT_SORT

      }
    );

  }


  async function getBusiness(
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


  window.UBnuxAPI = {

    request,

    getStates,

    getDistricts,

    getCategories,

    getBusinesses,

    getBusiness

  };


})(window);
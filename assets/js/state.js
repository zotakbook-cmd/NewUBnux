/* =========================================================
   UBnux State Manager
   File: assets/js/state.js
   Version: 2.0.0

   PURPOSE:
   ---------------------------------------------------------
   - Central application state only
   - NO API calls
   - NO Google Sheets calls
   - NO business data loading
   - Safe for static-first homepage architecture
========================================================= */

(function (window) {

  "use strict";


  /* =======================================================
     INTERNAL APPLICATION STATE
  ======================================================= */

  const state = {

    /*
     * Static master data
     * These are populated by the respective modules:
     * - states.js / state loader
     * - districts.js
     * - categories.js
     *
     * This file does NOT fetch them.
     */
    states: [],

    districts: [],

    categories: [],


    /*
     * Business results
     *
     * IMPORTANT:
     * This remains empty when index.html first opens.
     *
     * Business data is populated only after:
     * - search
     * - filter
     * - category selection
     * - district selection
     */
    businesses: [],


    /* =====================================================
       PAGINATION
    ===================================================== */

    currentPage: 1,

    totalBusinesses: 0,

    hasMore: false,

    nextCursor: "",


    /* =====================================================
       CURRENT SELECTION
    ===================================================== */

    selected: {

      state: "",

      district: "",

      category: "",

      stateName: "",

      districtName: "",

      categoryName: ""

    },


    /* =====================================================
       SORTING
    ===================================================== */

    sort:
      (
        window.UBNUX_CONFIG &&
        window.UBNUX_CONFIG.DEFAULT_SORT
      )
        ? window.UBNUX_CONFIG.DEFAULT_SORT
        : "featured"

  };


  /* =======================================================
     SET SELECTION
  ======================================================= */

  function setSelection(key, value) {

    if (
      Object.prototype.hasOwnProperty.call(
        state.selected,
        key
      )
    ) {

      state.selected[key] =
        value == null
          ? ""
          : String(value);

    }

  }


  /* =======================================================
     GET SELECTION
     Returns a copy so external modules cannot
     accidentally replace the internal object.
  ======================================================= */

  function getSelection() {

    return {
      ...state.selected
    };

  }


  /* =======================================================
     RESET BUSINESS RESULTS
     
     Called before a new search/filter request.

     IMPORTANT:
     This does NOT fetch anything.
  ======================================================= */

  function resetBusinesses() {

    state.businesses = [];

    state.currentPage = 1;

    state.totalBusinesses = 0;

    state.hasMore = false;

    state.nextCursor = "";

  }


  /* =======================================================
     SET STATIC DATA
     
     These methods allow the data modules to place
     already-loaded static JSON data into the state.
     
     NO NETWORK REQUEST IS MADE HERE.
  ======================================================= */

  function setStates(data) {

    state.states =
      Array.isArray(data)
        ? data
        : [];

  }


  function setDistricts(data) {

    state.districts =
      Array.isArray(data)
        ? data
        : [];

  }


  function setCategories(data) {

    state.categories =
      Array.isArray(data)
        ? data
        : [];

  }


  /* =======================================================
     SET BUSINESS RESULTS
     
     Only called after user actually requests business data.
  ======================================================= */

  function setBusinesses(data) {

    state.businesses =
      Array.isArray(data)
        ? data
        : [];

  }


  /* =======================================================
     SET PAGINATION
  ======================================================= */

  function setPagination(data) {

    data = data || {};

    if (
      data.page !== undefined &&
      data.page !== null
    ) {

      state.currentPage =
        Number(data.page) || 1;

    }


    if (
      data.total !== undefined &&
      data.total !== null
    ) {

      state.totalBusinesses =
        Number(data.total) || 0;

    }


    state.hasMore =
      Boolean(data.hasMore);


    state.nextCursor =
      data.nextCursor
        ? String(data.nextCursor)
        : "";

  }


  /* =======================================================
     SET SORT
  ======================================================= */

  function setSort(value) {

    state.sort =
      value
        ? String(value)
        : (
            window.UBNUX_CONFIG &&
            window.UBNUX_CONFIG.DEFAULT_SORT
          )
            ? window.UBNUX_CONFIG.DEFAULT_SORT
            : "featured";

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  window.UBnuxState = {

    state,

    setSelection,

    getSelection,

    resetBusinesses,

    setStates,

    setDistricts,

    setCategories,

    setBusinesses,

    setPagination,

    setSort

  };


})(window);

/* =========================================================
   UBnux State Manager
   File: assets/js/state.js
========================================================= */

(function (window) {

  "use strict";


  const state = {

    states: [],

    districts: [],

    categories: [],

    businesses: [],

    currentPage: 1,

    totalBusinesses: 0,

    hasMore: false,

    selected: {

      state: "",

      district: "",

      category: "",

      stateName: "",

      districtName: "",

      categoryName: ""

    },

    sort:
      window.UBNUX_CONFIG.DEFAULT_SORT

  };


  function setSelection(
    key,
    value
  ) {

    if (
      Object.prototype.hasOwnProperty.call(
        state.selected,
        key
      )
    ) {

      state.selected[key] =
        value || "";

    }

  }


  function getSelection() {

    return {
      ...state.selected
    };

  }


  function resetBusinesses() {

    state.businesses = [];

    state.currentPage = 1;

    state.totalBusinesses = 0;

    state.hasMore = false;

  }


  window.UBnuxState = {

    state,

    setSelection,

    getSelection,

    resetBusinesses

  };


})(window);
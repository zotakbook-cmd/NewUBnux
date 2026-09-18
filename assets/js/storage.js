/* =========================================================
   UBnux Storage
   File: assets/js/storage.js
========================================================= */

(function (window) {

  "use strict";


  const config =
    window.UBNUX_CONFIG;


  const prefix =
    config.STORAGE_PREFIX;


  function set(
    key,
    value
  ) {

    try {

      localStorage.setItem(
        prefix + key,
        JSON.stringify(value)
      );

    } catch (error) {

      console.warn(
        "UBnux storage write failed:",
        error
      );

    }

  }


  function get(
    key,
    fallback
  ) {

    try {

      const value =
        localStorage.getItem(
          prefix + key
        );


      if (
        value === null
      ) {

        return fallback;

      }


      return JSON.parse(
        value
      );

    } catch (error) {

      return fallback;

    }

  }


  function remove(
    key
  ) {

    try {

      localStorage.removeItem(
        prefix + key
      );

    } catch (error) {

      console.warn(
        "UBnux storage remove failed:",
        error
      );

    }

  }


  function saveSelection(
    selection
  ) {

    set(
      "selection",
      {

        state:
          selection.state || "",

        district:
          selection.district || "",

        category:
          selection.category || "",

        stateName:
          selection.stateName || "",

        districtName:
          selection.districtName || "",

        categoryName:
          selection.categoryName || ""

      }
    );

  }


  function getSelection() {

    return get(
      "selection",
      {

        state: "",

        district: "",

        category: "",

        stateName: "",

        districtName: "",

        categoryName: ""

      }
    );

  }


  function clearSelection() {

    remove(
      "selection"
    );

  }


  window.UBnuxStorage = {

    set,

    get,

    remove,

    saveSelection,

    getSelection,

    clearSelection

  };


})(window);
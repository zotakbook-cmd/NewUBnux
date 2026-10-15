/* =========================================================
   UBnux Storage
   File: assets/js/storage.js
   Version: 4.0.0 - Static First
========================================================= */

(function (window) {

  "use strict";

  const config = window.UBNUX_CONFIG || {};

  /*
   * Storage is intentionally LOCAL-ONLY.
   *
   * IMPORTANT:
   * - No API calls
   * - No Google Sheets calls
   * - No business loading
   * - No static JSON loading
   * - Safe to execute during the initial static-first bootstrap
   */

  const prefix =
    typeof config.STORAGE_PREFIX === "string" &&
    config.STORAGE_PREFIX
      ? config.STORAGE_PREFIX
      : "ubnux_";


  function set(key, value) {

    try {

      localStorage.setItem(
        prefix + key,
        JSON.stringify(value)
      );

      return true;

    } catch (error) {

      console.warn(
        "UBnux storage write failed:",
        error
      );

      return false;

    }

  }


  function get(key, fallback) {

    try {

      const value =
        localStorage.getItem(
          prefix + key
        );

      if (value === null) {
        return fallback;
      }

      return JSON.parse(value);

    } catch (error) {

      return fallback;

    }

  }


  function remove(key) {

    try {

      localStorage.removeItem(
        prefix + key
      );

      return true;

    } catch (error) {

      console.warn(
        "UBnux storage remove failed:",
        error
      );

      return false;

    }

  }


  function clearAll() {

    try {

      const keys = [];

      for (
        let i = 0;
        i < localStorage.length;
        i++
      ) {

        const key =
          localStorage.key(i);

        if (
          key &&
          key.indexOf(prefix) === 0
        ) {

          keys.push(key);

        }

      }

      keys.forEach(function (key) {
        localStorage.removeItem(key);
      });

      return true;

    } catch (error) {

      console.warn(
        "UBnux storage clear failed:",
        error
      );

      return false;

    }

  }


  function normalizeSelection(selection) {

    selection =
      selection &&
      typeof selection === "object"
        ? selection
        : {};

    return {

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

    };

  }


  function saveSelection(selection) {

    return set(
      "selection",
      normalizeSelection(selection)
    );

  }


  function getSelection() {

    return get(
      "selection",
      normalizeSelection({})
    );

  }


  function clearSelection() {

    return remove(
      "selection"
    );

  }


  /*
   * Static-first preference.
   *
   * This does NOT trigger any data loading.
   * It only exposes whether the current application
   * configuration is operating in static-first mode.
   */

  function isStaticFirst() {

    return config.STATIC_FIRST === true;

  }


  window.UBnuxStorage = {

    VERSION: "4.0.0",

    STATIC_FIRST: true,

    set,

    get,

    remove,

    clearAll,

    saveSelection,

    getSelection,

    clearSelection,

    isStaticFirst

  };


  /*
   * Diagnostic flag.
   * No network request is performed here.
   */

  window.UBnuxStorageStaticFirst = true;


  if (
    config.DEBUG === true ||
    config.ENABLE_DEBUG === true
  ) {

    console.info(
      "[UBnux Storage v4.0.0] " +
      "LocalStorage only | Static-first safe"
    );

  }


})(window);

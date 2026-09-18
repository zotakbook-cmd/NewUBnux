/* =========================================================
   UBnux Main Application
   File: assets/js/app.js
========================================================= */

(function (window, document) {

  "use strict";


  const config =
    window.UBNUX_CONFIG;


  const state =
    window.UBnuxState.state;


  const stateFilter =
    document.getElementById(
      "stateFilter"
    );


  const districtFilter =
    document.getElementById(
      "districtFilter"
    );


  const categoryFilter =
    document.getElementById(
      "categoryFilter"
    );


  const sortFilter =
    document.getElementById(
      "sortFilter"
    );


  const selectionMessage =
    document.getElementById(
      "selectionMessage"
    );


  const pageLoader =
    document.getElementById(
      "pageLoader"
    );


  const loaderText =
    document.getElementById(
      "loaderText"
    );


  const mobileMenuButton =
    document.getElementById(
      "mobileMenuButton"
    );


  const mainNav =
    document.getElementById(
      "mainNav"
    );


  const currentYear =
    document.getElementById(
      "currentYear"
    );


  let startedAt =
    Date.now();


  function showLoader(
    message
  ) {

    loaderText.textContent =
      message ||
      "Loading UBnux...";


    pageLoader.classList.remove(
      "hidden"
    );

  }


  async function hideLoader() {

    const elapsed =
      Date.now() -
      startedAt;


    const remaining =
      Math.max(
        0,
        config.MINIMUM_LOADER_TIME -
        elapsed
      );


    if (remaining > 0) {

      await new Promise(
        function (resolve) {

          setTimeout(
            resolve,
            remaining
          );

        }
      );

    }


    pageLoader.classList.add(
      "hidden"
    );

  }


  function setMessage(
    message
  ) {

    selectionMessage.textContent =
      message;

  }


  function getStateName(
    code
  ) {

    const item =
      state.states.find(
        function (item) {

          return String(
            item.StateCode
          ) === String(code);

        }
      );


    return item
      ? item.State
      : "";

  }


  function updateURL() {

    const selected =
      window.UBnuxState
        .getSelection();


    if (
      !selected.state ||
      !selected.district ||
      !selected.category
    ) {

      return;

    }


    const path =
      "/" +
      encodeURIComponent(
        selected.state.toLowerCase()
      ) +
      "/" +
      encodeURIComponent(
        selected.district.toLowerCase()
      ) +
      "/" +
      encodeURIComponent(
        selected.category.toLowerCase()
      );


    try {

      window.history.replaceState(
        {},
        "",
        path
      );

    } catch (error) {

      console.warn(
        "URL state update failed:",
        error
      );

    }

  }


  function saveSelection() {

    const selected =
      window.UBnuxState
        .getSelection();


    window.UBnuxStorage
      .saveSelection(
        selected
      );


    updateURL();

  }


  async function initializeBaseData() {

    showLoader(
      "Loading UBnux..."
    );


    try {

      const results =
        await Promise.all([

          window.UBnuxAPI
            .getStates(),

          window.UBnuxAPI
            .getCategories()

        ]);


      window.UBnuxDistricts
        .renderStates(
          results[0].data || []
        );


      window.UBnuxCategories
        .renderCategories(
          results[1].data || []
        );


    } catch (error) {

      console.error(
        "Initial data error:",
        error
      );


      setMessage(
        "Unable to load UBnux data. Please refresh the page."
      );


      throw error;

    }

  }


  function restoreDropdownValues(
    selection
  ) {

    if (
      selection.state
    ) {

      stateFilter.value =
        selection.state;

    }


    if (
      selection.district
    ) {

      districtFilter.value =
        selection.district;

    }


    if (
      selection.category
    ) {

      categoryFilter.value =
        selection.category;

    }

  }


  async function restoreUserSelection() {

    const saved =
      window.UBnuxStorage
        .getSelection();


    if (
      !saved.state
    ) {

      stateFilter.disabled =
        false;

      setMessage(
        "Please select your state to continue."
      );

      return;

    }


    state.selected =
      {

        state:
          saved.state,

        district:
          saved.district || "",

        category:
          saved.category || "",

        stateName:
          saved.stateName || "",

        districtName:
          saved.districtName || "",

        categoryName:
          saved.categoryName || ""

      };


    stateFilter.value =
      saved.state;


    await window.UBnuxDistricts
      .loadDistricts(
        saved.state
      );


    if (
      saved.district
    ) {

      districtFilter.value =
        saved.district;

    }


    if (
      saved.category
    ) {

      categoryFilter.value =
        saved.category;

    }


    if (
      saved.district &&
      saved.category
    ) {

      sortFilter.disabled =
        false;


      await window.UBnuxBusinesses
        .loadBusinesses(
          false
        );


      setMessage(
        saved.stateName +
        " → " +
        saved.districtName +
        " → " +
        saved.categoryName
      );


    } else if (
      saved.district
    ) {

      categoryFilter.disabled =
        false;


      setMessage(
        "Now select your business category."
      );


    } else {

      setMessage(
        "Now select your district."
      );

    }

  }


  async function handleStateChange() {

    const stateCode =
      stateFilter.value;


    window.UBnuxState
      .resetBusinesses();


    categoryFilter.value =
      "";


    categoryFilter.disabled =
      true;


    sortFilter.disabled =
      true;


    if (!stateCode) {

      window.UBnuxDistricts
        .clearDistricts();


      window.UBnuxStorage
        .clearSelection();


      state.selected =
        {

          state: "",
          district: "",
          category: "",
          stateName: "",
          districtName: "",
          categoryName: ""

        };


      setMessage(
        "Please select your state to continue."
      );


      return;

    }


    const stateName =
      getStateName(
        stateCode
      );


    state.selected.state =
      stateCode;

    state.selected.stateName =
      stateName;

    state.selected.district =
      "";

    state.selected.category =
      "";

    state.selected.districtName =
      "";

    state.selected.categoryName =
      "";


    saveSelection();


    setMessage(
      "Loading districts..."
    );


    await window.UBnuxDistricts
      .loadDistricts(
        stateCode
      );


    setMessage(
      "Now select your district."
    );

  }


  async function handleDistrictChange() {

    const districtCode =
      districtFilter.value;


    categoryFilter.disabled =
      !districtCode;


    sortFilter.disabled =
      true;


    if (!districtCode) {

      state.selected.district =
        "";

      state.selected.category =
        "";

      state.selected.districtName =
        "";

      state.selected.categoryName =
        "";


      saveSelection();


      setMessage(
        "Now select your district."
      );


      return;

    }


    const districtName =
      window.UBnuxDistricts
        .getDistrictName(
          districtCode
        );


    state.selected.district =
      districtCode;

    state.selected.districtName =
      districtName;

    state.selected.category =
      "";

    state.selected.categoryName =
      "";


    saveSelection();


    setMessage(
      "Now select your business category."
    );

  }


  async function handleCategoryChange() {

    const category =
      categoryFilter.value;


    if (!category) {

      state.selected.category =
        "";

      state.selected.categoryName =
        "";

      sortFilter.disabled =
        true;


      saveSelection();


      setMessage(
        "Now select your business category."
      );


      return;

    }


    const categoryName =
      window.UBnuxCategories
        .getCategoryName(
          category
        );


    state.selected.category =
      category;

    state.selected.categoryName =
      categoryName;


    sortFilter.disabled =
      false;


    state.sort =
      sortFilter.value ||
      config.DEFAULT_SORT;


    saveSelection();


    setMessage(
      state.selected.stateName +
      " → " +
      state.selected.districtName +
      " → " +
      categoryName
    );


    await window.UBnuxBusinesses
      .loadBusinesses(
        false
      );


    document.getElementById(
      "businesses"
    ).scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }


  async function handleSortChange() {

    state.sort =
      sortFilter.value ||
      config.DEFAULT_SORT;


    if (
      state.selected.state &&
      state.selected.district &&
      state.selected.category
    ) {

      await window.UBnuxBusinesses
        .loadBusinesses(
          false
        );

    }

  }


  function setupEvents() {

    stateFilter.addEventListener(
      "change",
      function () {

        handleStateChange();

      }
    );


    districtFilter.addEventListener(
      "change",
      function () {

        handleDistrictChange();

      }
    );


    categoryFilter.addEventListener(
      "change",
      function () {

        handleCategoryChange();

      }
    );


    sortFilter.addEventListener(
      "change",
      function () {

        handleSortChange();

      }
    );


    mobileMenuButton.addEventListener(
      "click",
      function () {

        mainNav.classList.toggle(
          "open"
        );

      }
    );


    mainNav
      .querySelectorAll("a")
      .forEach(function (link) {

        link.addEventListener(
          "click",
          function () {

            mainNav.classList.remove(
              "open"
            );

          }
        );

      });

  }


  async function initializeApp() {

    currentYear.textContent =
      new Date()
        .getFullYear();


    setupEvents();


    try {

      await initializeBaseData();

      await restoreUserSelection();

    } catch (error) {

      console.error(
        "UBnux initialization failed:",
        error
      );

    } finally {

      await hideLoader();

    }

  }


  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );


})(window, document);
 /* =========================================================
    UBnux Main Application
    File: assets/js/app.js
    Version: 3.0.0

    Responsibilities:
    - Application initialization
    - State selection
    - District selection
    - Custom Category selection
    - User selection restore
    - Business loading trigger
    - Sorting
    - URL state
    - Mobile navigation
    - Safe DOM initialization
    - SEO route detection
    - Listing / Business page separation

    IMPORTANT:
    - Business SEO URL is NOT redirected to /business/
    - /in/<state>/<district>/<category>/<business>/ is
      treated as a Business Page
    - Normal listing routes continue to work
    - Saved selection is NOT allowed to overwrite
      a business SEO URL
 ========================================================= */

(function (window, document) {

  "use strict";


  /* =======================================================
     CONFIG
  ======================================================= */

  const config =
    window.UBNUX_CONFIG || {};


  /* =======================================================
     ROUTE DETECTION
  ======================================================= */

  function getCurrentRoute() {

    try {

      if (
        window.UBnux &&
        window.UBnux.router &&
        typeof window.UBnux.router
          .getCurrentRoute === "function"
      ) {

        return window.UBnux.router
          .getCurrentRoute();

      }

    } catch (error) {

      console.warn(
        "UBnux route detection failed:",
        error
      );

    }


    return {
      type: "unknown",
      isBusinessPage: false,
      isSEOPage: false
    };

  }


  const CURRENT_ROUTE =
    getCurrentRoute();


  /* =======================================================
     BUSINESS PAGE DETECTION
  ======================================================= */

  const IS_BUSINESS_PAGE =
    (
      CURRENT_ROUTE &&
      CURRENT_ROUTE.type === "business" &&
      CURRENT_ROUTE.isBusinessPage === true &&
      Boolean(
        CURRENT_ROUTE.stateSlug
      ) &&
      Boolean(
        CURRENT_ROUTE.districtSlug
      ) &&
      Boolean(
        CURRENT_ROUTE.categorySlug
      ) &&
      Boolean(
        CURRENT_ROUTE.businessSlug
      )
    );


  /* =======================================================
     IMPORTANT:
     DO NOT RUN LISTING APP ON BUSINESS PAGE
  ======================================================= */

  if (IS_BUSINESS_PAGE) {

    /*
     * Business page has its own controller:
     *
     * business-page.js
     *
     * Therefore:
     *
     * - do not load states
     * - do not restore listing selection
     * - do not update listing URL
     * - do not load business cards
     * - do not overwrite the SEO URL
     */

    console.debug(
      "UBnux: Business SEO route detected.",
      CURRENT_ROUTE
    );


    /*
     * If this file is accidentally loaded on a
     * business page, simply stop here.
     */

    return;

  }


  /* =======================================================
     STATE SAFETY
  ======================================================= */

  if (
    !window.UBnuxState ||
    !window.UBnuxState.state
  ) {

    console.error(
      "UBnuxState is not available."
    );

    return;

  }


  const state =
    window.UBnuxState.state;


  /* =======================================================
     DOM HELPER
  ======================================================= */

  function getElement(id) {

    return document.getElementById(
      id
    );

  }


  /* =======================================================
     DOM ELEMENTS
  ======================================================= */

  const stateFilter =
    getElement(
      "stateFilter"
    );


  const districtFilter =
    getElement(
      "districtFilter"
    );


  /*
   * IMPORTANT:
   *
   * No #categoryFilter.
   *
   * Category is controlled by:
   *
   * categories.js
   */

  const sortFilter =
    getElement(
      "sortFilter"
    );


  const selectionMessage =
    getElement(
      "selectionMessage"
    );


  const pageLoader =
    getElement(
      "pageLoader"
    );


  const loaderText =
    getElement(
      "loaderText"
    );


  const mobileMenuButton =
    getElement(
      "mobileMenuButton"
    );


  const mainNav =
    getElement(
      "mainNav"
    );


  const currentYear =
    getElement(
      "currentYear"
    );


  /* =======================================================
     START TIME
  ======================================================= */

  let startedAt =
    Date.now();


  /* =======================================================
     LOADER
  ======================================================= */

  function showLoader(message) {

    if (!pageLoader) {

      return;

    }


    if (loaderText) {

      loaderText.textContent =
        message ||
        "Loading UBnux...";

    }


    pageLoader.classList.remove(
      "hidden"
    );

  }


  async function hideLoader() {

    const elapsed =
      Date.now() -
      startedAt;


    const minimumLoaderTime =
      Number(
        config.MINIMUM_LOADER_TIME || 0
      );


    const remaining =
      Math.max(
        0,
        minimumLoaderTime -
        elapsed
      );


    if (
      remaining > 0
    ) {

      await new Promise(
        function (resolve) {

          setTimeout(
            resolve,
            remaining
          );

        }
      );

    }


    if (pageLoader) {

      pageLoader.classList.add(
        "hidden"
      );

    }

  }


  /* =======================================================
     MESSAGE
  ======================================================= */

  function setMessage(message) {

    if (!selectionMessage) {

      return;

    }


    selectionMessage.textContent =
      message || "";

  }


  /* =======================================================
     GET STATE NAME
  ======================================================= */

  function getStateName(code) {

    const states =
      Array.isArray(
        state.states
      )
        ? state.states
        : [];


    const item =
      states.find(
        function (item) {

          return String(
            item.StateCode
          ) === String(
            code
          );

        }
      );


    return item
      ? (
          item.State ||
          item.StateName ||
          ""
        )
      : "";

  }


  /* =======================================================
     GET SELECTED CATEGORY
  ======================================================= */

  function getSelectedCategory() {

    if (
      window.UBnuxCategories &&
      typeof window.UBnuxCategories
        .getSelectedCategory ===
        "function"
    ) {

      return window.UBnuxCategories
        .getSelectedCategory();

    }


    return (
      state.selected &&
      state.selected.category
    ) || "";

  }


  /* =======================================================
     UPDATE LISTING URL
  ======================================================= */

  function updateURL() {

    /*
     * Never modify URL when the current page
     * is a business page.
     */

    if (
      IS_BUSINESS_PAGE
    ) {

      return;

    }


    const selected =
      window.UBnuxState
        .getSelection();


    if (
      !selected ||
      !selected.state ||
      !selected.district ||
      !selected.category
    ) {

      return;

    }


    const stateName =
      selected.stateName ||
      getStateName(
        selected.state
      );


    const districtName =
      selected.districtName ||
      selected.district;


    const categorySlug =
      selected.category;


    /* =====================================================
       CENTRAL ROUTER
    ===================================================== */

    try {

      if (
        window.UBnux &&
        window.UBnux.router &&
        typeof window.UBnux.router
          .buildCategoryURL ===
          "function"
      ) {

        const fullURL =
          window.UBnux.router
            .buildCategoryURL(

              stateName,

              districtName,

              categorySlug

            );


        const parsedURL =
          new URL(
            fullURL,
            window.location.origin
          );


        window.history.replaceState(
          {},
          "",
          parsedURL.pathname
        );


        return;

      }

    } catch (error) {

      console.warn(
        "UBnux router URL update failed:",
        error
      );

    }


    /* =====================================================
       FALLBACK
    ===================================================== */

    function slugify(value) {

      return String(
        value || ""
      )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

    }


    const stateSlug =
      slugify(
        stateName
      );


    const districtSlug =
      slugify(
        districtName
      );


    const categorySlugSafe =
      slugify(
        categorySlug
      );


    if (
      !stateSlug ||
      !districtSlug ||
      !categorySlugSafe
    ) {

      return;

    }


    const path =
      "/in/" +
      stateSlug +
      "/" +
      districtSlug +
      "/" +
      categorySlugSafe +
      "/";


    try {

      window.history.replaceState(
        {},
        "",
        path
      );

    } catch (error) {

      console.warn(
        "UBnux URL state update failed:",
        error
      );

    }

  }


  /* =======================================================
     SAVE SELECTION
  ======================================================= */

  function saveSelection() {

    /*
     * Never save/modify listing URL from
     * business SEO route.
     */

    if (
      IS_BUSINESS_PAGE
    ) {

      return;

    }


    const selected =
      window.UBnuxState
        .getSelection();


    if (
      window.UBnuxStorage &&
      typeof window.UBnuxStorage
        .saveSelection ===
        "function"
    ) {

      window.UBnuxStorage
        .saveSelection(
          selected
        );

    }


    updateURL();

  }


  /* =======================================================
     INITIAL BASE DATA
  ======================================================= */

  async function initializeBaseData() {

    showLoader(
      "Loading UBnux..."
    );


    if (
      !window.UBnuxAPI
    ) {

      throw new Error(
        "UBnux API is not available."
      );

    }


    if (
      !window.UBnuxDistricts
    ) {

      throw new Error(
        "UBnux District module is not available."
      );

    }


    if (
      !window.UBnuxCategories
    ) {

      throw new Error(
        "UBnux Category module is not available."
      );

    }


    const results =
      await Promise.all([

        window.UBnuxAPI
          .getStates(),

        window.UBnuxAPI
          .getCategories()

      ]);


    const statesData =
      Array.isArray(
        results[0] &&
        results[0].data
      )
        ? results[0].data
        : [];


    const categoriesData =
      Array.isArray(
        results[1] &&
        results[1].data
      )
        ? results[1].data
        : [];


    state.states =
      statesData;


    window.UBnuxDistricts
      .renderStates(
        statesData
      );


    window.UBnuxCategories
      .renderCategories(
        categoriesData
      );


    window.UBnuxCategories
      .setEnabled(
        false
      );

  }


  /* =======================================================
     RESTORE USER SELECTION
  ======================================================= */

  async function restoreUserSelection() {

    /*
     * Safety:
     * Business page must NEVER enter this method.
     */

    if (
      IS_BUSINESS_PAGE
    ) {

      return;

    }


    if (
      !window.UBnuxStorage
    ) {

      setInitialFilterState();

      return;

    }


    const saved =
      window.UBnuxStorage
        .getSelection();


    if (
      !saved ||
      !saved.state
    ) {

      setInitialFilterState();

      return;

    }


    state.selected = {

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


    if (stateFilter) {

      stateFilter.value =
        saved.state;

    }


    if (
      window.UBnuxDistricts &&
      typeof window.UBnuxDistricts
        .loadDistricts ===
        "function"
    ) {

      await window.UBnuxDistricts
        .loadDistricts(
          saved.state
        );

    }


    if (
      saved.district &&
      districtFilter
    ) {

      districtFilter.value =
        saved.district;

    }


    if (
      saved.district &&
      window.UBnuxCategories
    ) {

      window.UBnuxCategories
        .setEnabled(
          true
        );

    } else if (
      window.UBnuxCategories
    ) {

      window.UBnuxCategories
        .setEnabled(
          false
        );

    }


    if (
      saved.category &&
      window.UBnuxCategories
    ) {

      const categorySet =
        window.UBnuxCategories
          .setCategory(
            saved.category
          );


      if (!categorySet) {

        state.selected.category =
          "";

        state.selected.categoryName =
          "";

      }

    }


    if (
      saved.district &&
      saved.category
    ) {

      if (sortFilter) {

        sortFilter.disabled =
          false;

        state.sort =
          sortFilter.value ||
          config.DEFAULT_SORT ||
          "featured";

      }


      setMessage(

        (
          saved.stateName ||
          saved.state
        ) +
        " → " +
        (
          saved.districtName ||
          saved.district
        ) +
        " → " +
        (
          state.selected.categoryName ||
          saved.categoryName ||
          saved.category
        )

      );


      if (
        window.UBnuxBusinesses
      ) {

        await window.UBnuxBusinesses
          .loadBusinesses(
            false
          );

      }


      return;

    }


    if (
      saved.district
    ) {

      setMessage(
        "Now select your business category."
      );

      return;

    }


    setMessage(
      "Now select your district."
    );

  }


  /* =======================================================
     INITIAL FILTER STATE
  ======================================================= */

  function setInitialFilterState() {

    if (stateFilter) {

      stateFilter.disabled =
        false;

    }


    if (districtFilter) {

      districtFilter.disabled =
        true;

    }


    if (
      window.UBnuxCategories
    ) {

      window.UBnuxCategories
        .clearCategory();

      window.UBnuxCategories
        .setEnabled(
          false
        );

    }


    if (sortFilter) {

      sortFilter.disabled =
        true;

    }


    setMessage(
      "Please select your state to continue."
    );

  }


  /* =======================================================
     STATE CHANGE
  ======================================================= */

  async function handleStateChange() {

    if (
      IS_BUSINESS_PAGE
    ) {

      return;

    }


    const stateCode =
      stateFilter
        ? stateFilter.value
        : "";


    if (
      window.UBnuxState &&
      typeof window.UBnuxState
        .resetBusinesses ===
        "function"
    ) {

      window.UBnuxState
        .resetBusinesses();

    }


    if (
      window.UBnuxCategories
    ) {

      window.UBnuxCategories
        .clearCategory();

      window.UBnuxCategories
        .setEnabled(
          false
        );

    }


    if (sortFilter) {

      sortFilter.disabled =
        true;

    }


    if (!stateCode) {

      if (
        window.UBnuxDistricts
      ) {

        window.UBnuxDistricts
          .clearDistricts();

      }


      if (
        window.UBnuxStorage
      ) {

        window.UBnuxStorage
          .clearSelection();

      }


      state.selected = {

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


    state.selected = {

      state:
        stateCode,

      district: "",

      category: "",

      stateName:
        stateName,

      districtName: "",

      categoryName: ""

    };


    saveSelection();


    setMessage(
      "Loading districts..."
    );


    if (
      window.UBnuxDistricts
    ) {

      await window.UBnuxDistricts
        .loadDistricts(
          stateCode
        );

    }


    setMessage(
      "Now select your district."
    );

  }


  /* =======================================================
     DISTRICT CHANGE
  ======================================================= */

  async function handleDistrictChange() {

    if (
      IS_BUSINESS_PAGE
    ) {

      return;

    }


    const districtCode =
      districtFilter
        ? districtFilter.value
        : "";


    if (
      window.UBnuxState &&
      typeof window.UBnuxState
        .resetBusinesses ===
        "function"
    ) {

      window.UBnuxState
        .resetBusinesses();

    }


    if (
      window.UBnuxCategories
    ) {

      window.UBnuxCategories
        .clearCategory();

    }


    if (sortFilter) {

      sortFilter.disabled =
        true;

    }


    if (!districtCode) {

      state.selected.district =
        "";

      state.selected.category =
        "";

      state.selected.districtName =
        "";

      state.selected.categoryName =
        "";


      if (
        window.UBnuxCategories
      ) {

        window.UBnuxCategories
          .setEnabled(
            false
          );

      }


      saveSelection();


      setMessage(
        "Now select your district."
      );


      return;

    }


    const districtName =
      window.UBnuxDistricts &&
      typeof window.UBnuxDistricts
        .getDistrictName ===
        "function"

        ? window.UBnuxDistricts
            .getDistrictName(
              districtCode
            )

        : "";


    state.selected.district =
      districtCode;


    state.selected.districtName =
      districtName;


    state.selected.category =
      "";


    state.selected.categoryName =
      "";


    if (
      window.UBnuxCategories
    ) {

      window.UBnuxCategories
        .setEnabled(
          true
        );

    }


    saveSelection();


    setMessage(
      "Now select your business category."
    );

  }


  /* =======================================================
     CATEGORY CHANGE
  ======================================================= */

  async function handleCategoryChange(
    detail
  ) {

    if (
      IS_BUSINESS_PAGE
    ) {

      return;

    }


    const category =
      detail &&
      detail.slug
        ? detail.slug
        : getSelectedCategory();


    if (!category) {

      state.selected.category =
        "";

      state.selected.categoryName =
        "";


      if (sortFilter) {

        sortFilter.disabled =
          true;

      }


      saveSelection();


      setMessage(
        "Now select your business category."
      );


      return;

    }


    const categoryName =
      detail &&
      detail.name

        ? detail.name

        : (
            window.UBnuxCategories &&
            typeof window.UBnuxCategories
              .getCategoryName ===
              "function"

              ? window.UBnuxCategories
                  .getCategoryName(
                    category
                  )

              : category
          );


    state.selected.category =
      category;


    state.selected.categoryName =
      categoryName;


    if (sortFilter) {

      sortFilter.disabled =
        false;


      state.sort =
        sortFilter.value ||
        config.DEFAULT_SORT ||
        "featured";

    }


    saveSelection();


    setMessage(

      (
        state.selected.stateName ||
        state.selected.state
      ) +
      " → " +
      (
        state.selected.districtName ||
        state.selected.district
      ) +
      " → " +
      categoryName

    );


    if (
      window.UBnuxBusinesses
    ) {

      await window.UBnuxBusinesses
        .loadBusinesses(
          false
        );

    }


    const businessesSection =
      document.getElementById(
        "businesses"
      );


    if (
      businessesSection
    ) {

      businessesSection.scrollIntoView({

        behavior:
          "smooth",

        block:
          "start"

      });

    }

  }


  /* =======================================================
     SORT CHANGE
  ======================================================= */

  async function handleSortChange() {

    if (
      IS_BUSINESS_PAGE
    ) {

      return;

    }


    state.sort =
      (
        sortFilter &&
        sortFilter.value
      ) ||
      config.DEFAULT_SORT ||
      "featured";


    if (
      state.selected.state &&
      state.selected.district &&
      state.selected.category
    ) {

      if (
        window.UBnuxBusinesses
      ) {

        await window.UBnuxBusinesses
          .loadBusinesses(
            false
          );

      }

    }

  }


  /* =======================================================
     EVENT SETUP
  ======================================================= */

  function setupEvents() {


    /* =====================================================
       STATE
    ===================================================== */

    if (stateFilter) {

      stateFilter.addEventListener(
        "change",
        function () {

          handleStateChange()
            .catch(
              function (error) {

                console.error(
                  "State change error:",
                  error
                );

              }
            );

        }
      );

    }


    /* =====================================================
       DISTRICT
    ===================================================== */

    if (districtFilter) {

      districtFilter.addEventListener(
        "change",
        function () {

          handleDistrictChange()
            .catch(
              function (error) {

                console.error(
                  "District change error:",
                  error
                );

              }
            );

        }
      );

    }


    /* =====================================================
       CUSTOM CATEGORY
    ===================================================== */

    document.addEventListener(
      "ubnux:categorychange",
      function (event) {

        handleCategoryChange(
          event.detail || {}
        )
          .catch(
            function (error) {

              console.error(
                "Category change error:",
                error
              );

            }
          );

      }
    );


    /* =====================================================
       SORT
    ===================================================== */

    if (sortFilter) {

      sortFilter.addEventListener(
        "change",
        function () {

          handleSortChange()
            .catch(
              function (error) {

                console.error(
                  "Sort change error:",
                  error
                );

              }
            );

        }
      );

    }


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    if (
      mobileMenuButton &&
      mainNav
    ) {

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
        .forEach(
          function (link) {

            link.addEventListener(
              "click",
              function () {

                mainNav.classList.remove(
                  "open"
                );

              }
            );

          }
        );

    }

  }


  /* =======================================================
     INITIALIZE APP
  ======================================================= */

  async function initializeApp() {

    startedAt =
      Date.now();


    if (currentYear) {

      currentYear.textContent =
        new Date()
          .getFullYear();

    }


    setupEvents();


    try {

      await initializeBaseData();

      await restoreUserSelection();


    } catch (error) {

      console.error(
        "UBnux initialization failed:",
        error
      );


      setMessage(

        error &&
        error.message

          ? error.message

          : "Unable to initialize UBnux."

      );


    } finally {

      await hideLoader();

    }

  }


  /* =======================================================
     DOM READY
  ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initializeApp,
      {
        once: true
      }
    );

  } else {

    initializeApp();

  }


})(window, document);

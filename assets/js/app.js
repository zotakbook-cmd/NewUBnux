/* =========================================================
   UBnux Main Application
   File: assets/js/app.js

   Version: 3.3.0

   RESPONSIBILITIES
   ---------------------------------------------------------
   - Application initialization
   - State selection
   - District selection
   - Category selection
   - SEO category route restore
   - SEO business route protection
   - Saved user selection restore
   - Business listing loading
   - Sorting
   - URL state
   - Mobile navigation
   - Safe DOM initialization
   - Business-page isolation
   - Homepage loader protection

   IMPORTANT ROUTES
   ---------------------------------------------------------

   CATEGORY:
   /in/bihar/siwan/clothing-and-fashion/

   BUSINESS:
   /in/bihar/siwan/clothing-and-fashion/siwan-fashion-house/

   IMPORTANT RULE
   ---------------------------------------------------------
   Business SEO URLs must NEVER be converted to:

   /business

   This file does not redirect business SEO URLs.

   Business SEO pages are handled by:
   - business-page.js
   - business template system

   The listing application must completely stop on
   a business SEO URL.
   ========================================================= */

(function (window, document) {

  "use strict";


  /* =========================================================
     CONFIG
  ========================================================= */

  const config =
    window.UBNUX_CONFIG || {};


  /* =========================================================
     SAFE VALUE
  ========================================================= */

  function clean(value) {

    if (
      value === undefined ||
      value === null
    ) {

      return "";

    }

    return String(value).trim();

  }


  /* =========================================================
     SAFE DECODE
  ========================================================= */

  function safeDecode(value) {

    const input =
      clean(value);

    if (!input) {

      return "";

    }

    try {

      return decodeURIComponent(input);

    } catch (error) {

      return input;

    }

  }


  /* =========================================================
     SLUGIFY
  ========================================================= */

  function slugify(value) {

    return safeDecode(value)
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  }


  /* =========================================================
     NORMALIZE PATH
  ========================================================= */

  function normalizePath(path) {

    let value =
      clean(path);

    if (!value) {

      value =
        (
          window.location &&
          window.location.pathname
        ) || "/";

    }

    value =
      value.split("?")[0];

    value =
      value.split("#")[0];

    value =
      value.replace(
        /\/+/g,
        "/"
      );

    if (
      value.charAt(0) !== "/"
    ) {

      value =
        "/" + value;

    }

    value =
      value.replace(
        /\/+$/,
        ""
      );

    return value || "/";

  }


  /* =========================================================
     PATH SEGMENTS
  ========================================================= */

  function getPathSegments(path) {

    const normalized =
      normalizePath(path);

    if (
      normalized === "/"
    ) {

      return [];

    }

    return normalized
      .split("/")
      .filter(
        function (item) {

          return Boolean(
            clean(item)
          );

        }
      )
      .map(
        function (item) {

          return slugify(item);

        }
      );

  }


  /* =========================================================
     DIRECT SEO ROUTE DETECTION
     ---------------------------------------------------------
     Browser pathname is the primary source of truth.

     BUSINESS:
     /in/state/district/category/business/

     CATEGORY:
     /in/state/district/category/
  ========================================================= */

  function detectDirectSEORoute() {

    const parts =
      getPathSegments(
        window.location &&
        window.location.pathname
      );


    if (
      parts.length >= 1 &&
      parts[0] === "in"
    ) {

      /* =====================================================
         BUSINESS SEO URL
      ===================================================== */

      if (
        parts.length === 5 &&
        parts[1] &&
        parts[2] &&
        parts[3] &&
        parts[4]
      ) {

        return {

          type:
            "business",

          isSEOPage:
            true,

          isBusinessPage:
            true,

          isCategoryPage:
            false,

          stateSlug:
            parts[1],

          districtSlug:
            parts[2],

          categorySlug:
            parts[3],

          businessSlug:
            parts[4]

        };

      }


      /* =====================================================
         CATEGORY SEO URL
      ===================================================== */

      if (
        parts.length === 4 &&
        parts[1] &&
        parts[2] &&
        parts[3]
      ) {

        return {

          type:
            "category",

          isSEOPage:
            true,

          isBusinessPage:
            false,

          isCategoryPage:
            true,

          stateSlug:
            parts[1],

          districtSlug:
            parts[2],

          categorySlug:
            parts[3],

          businessSlug:
            ""

        };

      }

    }


    return {

      type:
        "normal",

      isSEOPage:
        false,

      isBusinessPage:
        false,

      isCategoryPage:
        false

    };

  }


  /* =========================================================
     MAIN ROUTE DETECTION

     Direct browser route has priority.

     Main router is used only for normal routes.
  ========================================================= */

  function getCurrentRoute() {

    const directRoute =
      detectDirectSEORoute();


    /* =====================================================
       BUSINESS SEO ROUTE
    ===================================================== */

    if (
      directRoute &&
      directRoute.isBusinessPage === true
    ) {

      return directRoute;

    }


    /* =====================================================
       CATEGORY SEO ROUTE
    ===================================================== */

    if (
      directRoute &&
      directRoute.isCategoryPage === true
    ) {

      return directRoute;

    }


    /* =====================================================
       CENTRAL ROUTER
    ===================================================== */

    try {

      if (
        window.UBnux &&
        window.UBnux.router &&
        typeof
          window.UBnux.router
            .getCurrentRoute ===
          "function"
      ) {

        const route =
          window
            .UBnux
            .router
            .getCurrentRoute();

        if (route) {

          return route;

        }

      }

    } catch (error) {

      console.warn(
        "UBnux route detection failed:",
        error
      );

    }


    return {

      type:
        "unknown",

      isBusinessPage:
        false,

      isCategoryPage:
        false,

      isSEOPage:
        false

    };

  }


  /* =========================================================
     FALLBACK SEO ROUTE
  ========================================================= */

  function getFallbackSEORoute() {

    return detectDirectSEORoute();

  }


  /* =========================================================
     INITIAL ROUTES
  ========================================================= */

  const CURRENT_ROUTE =
    getCurrentRoute();

  const FALLBACK_ROUTE =
    getFallbackSEORoute();


  /* =========================================================
     BUSINESS PAGE DETECTION
     ---------------------------------------------------------
     Direct browser URL has final authority.
  ========================================================= */

  const IS_BUSINESS_PAGE =
    Boolean(

      (
        FALLBACK_ROUTE &&
        FALLBACK_ROUTE.type ===
          "business" &&
        FALLBACK_ROUTE.isBusinessPage ===
          true
      )

      ||

      (
        CURRENT_ROUTE &&
        CURRENT_ROUTE.type ===
          "business" &&
        CURRENT_ROUTE.isBusinessPage ===
          true
      )

    );


  /* =========================================================
     CATEGORY PAGE DETECTION
  ========================================================= */

  const IS_INITIAL_CATEGORY_PAGE =
    Boolean(

      (
        FALLBACK_ROUTE &&
        FALLBACK_ROUTE.type ===
          "category" &&
        FALLBACK_ROUTE.isCategoryPage ===
          true
      )

      ||

      (
        CURRENT_ROUTE &&
        CURRENT_ROUTE.type ===
          "category" &&
        CURRENT_ROUTE.isCategoryPage ===
          true
      )

    );


  /* =========================================================
     INITIAL CATEGORY ROUTE
  ========================================================= */

  function getInitialCategoryRoute() {

    if (
      FALLBACK_ROUTE &&
      FALLBACK_ROUTE.type ===
        "category" &&
      FALLBACK_ROUTE.isCategoryPage ===
        true
    ) {

      return FALLBACK_ROUTE;

    }


    if (
      CURRENT_ROUTE &&
      CURRENT_ROUTE.type ===
        "category" &&
      CURRENT_ROUTE.isCategoryPage ===
        true
    ) {

      return CURRENT_ROUTE;

    }


    return null;

  }


  const INITIAL_CATEGORY_ROUTE =
    getInitialCategoryRoute();


  /* =========================================================
     DOM HELPER
  ========================================================= */

  function getElement(id) {

    return document.getElementById(id);

  }


  /* =========================================================
     DOM ELEMENTS
  ========================================================= */

  const pageLoader =
    getElement(
      "pageLoader"
    );

  const loaderText =
    getElement(
      "loaderText"
    );

  const stateFilter =
    getElement(
      "stateFilter"
    );

  const districtFilter =
    getElement(
      "districtFilter"
    );

  const sortFilter =
    getElement(
      "sortFilter"
    );

  const selectionMessage =
    getElement(
      "selectionMessage"
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


  /* =========================================================
     BUSINESS PAGE LOADER SAFETY
     ---------------------------------------------------------
     business-page.js owns business-page loading.

     app.js only makes sure homepage loader does not remain
     visible when business-page route is active.
  ========================================================= */

  function releaseHomepageLoaderForBusinessPage() {

    if (
      !IS_BUSINESS_PAGE
    ) {

      return;

    }

    if (
      pageLoader
    ) {

      pageLoader.classList.add(
        "hidden"
      );

      pageLoader.setAttribute(
        "aria-hidden",
        "true"
      );

    }

  }


  /* =========================================================
     INTERNAL FLAGS
  ========================================================= */

  let startedAt =
    Date.now();

  let suppressURLUpdate =
    false;

  let restoringRoute =
    false;


  /* =========================================================
     LOADER
  ========================================================= */

  function showLoader(message) {

    if (
      IS_BUSINESS_PAGE
    ) {

      return;

    }

    if (
      !pageLoader
    ) {

      return;

    }

    if (
      loaderText
    ) {

      loaderText.textContent =
        message ||
        "Loading UBnux...";

    }

    pageLoader.classList.remove(
      "hidden"
    );

    pageLoader.removeAttribute(
      "aria-hidden"
    );

  }


  async function hideLoader() {

    /*
     * Business page is NOT owned by listing app.
     */

    if (
      IS_BUSINESS_PAGE
    ) {

      releaseHomepageLoaderForBusinessPage();

      return;

    }


    const elapsed =
      Date.now() -
      startedAt;

    const minimumLoaderTime =
      Number(
        config.MINIMUM_LOADER_TIME ||
        0
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


    if (
      pageLoader
    ) {

      pageLoader.classList.add(
        "hidden"
      );

      pageLoader.setAttribute(
        "aria-hidden",
        "true"
      );

    }

  }


  /* =========================================================
     MESSAGE
  ========================================================= */

  function setMessage(message) {

    if (
      !selectionMessage
    ) {

      return;

    }

    selectionMessage.textContent =
      message ||
      "";

  }


  /* =========================================================
     GET STATE NAME
  ========================================================= */

  function getStateName(code) {

    const states =
      Array.isArray(
        window.UBnuxState &&
        window.UBnuxState.state &&
        window.UBnuxState.state.states
      )
        ? window.UBnuxState.state.states
        : [];

    const item =
      states.find(
        function (item) {

          return String(
            item.StateCode ||
            item.StateID ||
            ""
          ) ===
          String(
            code ||
            ""
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


  /* =========================================================
     GET SELECTED CATEGORY
  ========================================================= */

  function getSelectedCategory() {

    if (
      window.UBnuxCategories &&
      typeof
        window.UBnuxCategories
          .getSelectedCategory ===
        "function"
    ) {

      return window
        .UBnuxCategories
        .getSelectedCategory();

    }


    return (
      window.UBnuxState &&
      window.UBnuxState.state &&
      window.UBnuxState.state.selected &&
      window.UBnuxState.state.selected.category
    ) || "";

  }


  /* =========================================================
     NORMALIZE ITEM SLUG
  ========================================================= */

  function getItemSlug(
    item,
    fields
  ) {

    if (
      !item ||
      !Array.isArray(fields)
    ) {

      return "";

    }


    for (
      let i = 0;
      i < fields.length;
      i += 1
    ) {

      const value =
        item[
          fields[i]
        ];


      if (
        clean(value)
      ) {

        return slugify(
          value
        );

      }

    }


    return "";

  }


  /* =========================================================
     FIND STATE BY SEO SLUG
  ========================================================= */

  function findStateBySlug(
    stateSlug
  ) {

    const expected =
      slugify(
        stateSlug
      );

    const appState =
      window.UBnuxState &&
      window.UBnuxState.state;

    const states =
      appState &&
      Array.isArray(
        appState.states
      )
        ? appState.states
        : [];


    return states.find(
      function (item) {

        const itemSlug =
          getItemSlug(
            item,
            [
              "Slug",
              "StateSlug",
              "State",
              "StateName"
            ]
          );

        return (
          itemSlug ===
          expected
        );

      }
    ) || null;

  }


  /* =========================================================
     FIND DISTRICT OPTION BY SEO SLUG
  ========================================================= */

  function findDistrictOptionBySlug(
    districtSlug
  ) {

    if (
      !districtFilter
    ) {

      return null;

    }


    const expected =
      slugify(
        districtSlug
      );


    const options =
      Array.from(
        districtFilter.options ||
        []
      );


    return options.find(
      function (option) {

        if (
          !option ||
          !clean(
            option.value
          )
        ) {

          return false;

        }


        const candidates = [

          option.dataset &&
          option.dataset.slug,

          option.dataset &&
          option.dataset.districtSlug,

          option.textContent,

          option.label,

          option.getAttribute &&
          option.getAttribute(
            "data-name"
          )

        ];


        return candidates.some(
          function (value) {

            return (
              slugify(value) ===
              expected
            );

          }
        );

      }
    ) || null;

  }


  /* =========================================================
     UPDATE LISTING URL
     ---------------------------------------------------------
     NEVER RUN ON BUSINESS PAGE.
  ========================================================= */

  function updateURL() {

    if (
      IS_BUSINESS_PAGE
    ) {

      return;

    }


    if (
      suppressURLUpdate
    ) {

      return;

    }


    if (
      !window.UBnuxState ||
      typeof
        window.UBnuxState
          .getSelection !==
        "function"
    ) {

      return;

    }


    const selected =
      window
        .UBnuxState
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
        typeof
          window.UBnux.router
            .buildCategoryURL ===
          "function"
      ) {

        const fullURL =
          window
            .UBnux
            .router
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


        const generatedPath =
          normalizePath(
            parsedURL.pathname
          );


        const generatedParts =
          getPathSegments(
            generatedPath
          );


        if (
          generatedParts.length === 4 &&
          generatedParts[0] === "in"
        ) {

          window.history.replaceState(
            {},
            "",
            generatedPath
          );

          return;

        }


        console.warn(
          "UBnux: Router generated invalid listing URL. Using fallback.",
          generatedPath
        );

      }

    } catch (error) {

      console.warn(
        "UBnux router URL update failed:",
        error
      );

    }


    /* =====================================================
       FALLBACK URL BUILDER
    ===================================================== */

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


  /* =========================================================
     SAVE SELECTION
  ========================================================= */

  function saveSelection(
    options
  ) {

    const opts =
      options ||
      {};


    if (
      IS_BUSINESS_PAGE
    ) {

      return;

    }


    if (
      !window.UBnuxState ||
      typeof
        window.UBnuxState
          .getSelection !==
        "function"
    ) {

      return;

    }


    const selected =
      window
        .UBnuxState
        .getSelection();


    if (
      window.UBnuxStorage &&
      typeof
        window.UBnuxStorage
          .saveSelection ===
        "function"
    ) {

      window
        .UBnuxStorage
        .saveSelection(
          selected
        );

    }


    if (
      opts.skipURL ===
      true
    ) {

      return;

    }


    updateURL();

  }


  /* =========================================================
     INITIAL BASE DATA
  ========================================================= */

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

        window
          .UBnuxAPI
          .getStates(),

        window
          .UBnuxAPI
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


    if (
      window.UBnuxState &&
      window.UBnuxState.state
    ) {

      window
        .UBnuxState
        .state
        .states =
        statesData;

    }


    window
      .UBnuxDistricts
      .renderStates(
        statesData
      );


    window
      .UBnuxCategories
      .renderCategories(
        categoriesData
      );


    window
      .UBnuxCategories
      .setEnabled(
        false
      );

  }


  /* =========================================================
     RESTORE CATEGORY SEO ROUTE
  ========================================================= */

  async function restoreCategorySEORoute() {

    const route =
      INITIAL_CATEGORY_ROUTE;


    if (
      !route ||
      !route.stateSlug ||
      !route.districtSlug ||
      !route.categorySlug
    ) {

      return false;

    }


    restoringRoute =
      true;

    suppressURLUpdate =
      true;


    try {

      /* ===================================================
         STATE
      =================================================== */

      const matchedState =
        findStateBySlug(
          route.stateSlug
        );


      if (
        !matchedState
      ) {

        console.warn(
          "UBnux: State from SEO URL not found:",
          route.stateSlug
        );

        return false;

      }


      const stateCode =
        clean(
          matchedState.StateCode ||
          matchedState.StateID
        );

      const stateName =
        clean(
          matchedState.State ||
          matchedState.StateName ||
          route.stateSlug
        );


      if (
        !stateCode
      ) {

        return false;

      }


      if (
        window.UBnuxState &&
        window.UBnuxState.state
      ) {

        window
          .UBnuxState
          .state
          .selected = {

            state:
              stateCode,

            district:
              "",

            category:
              "",

            stateName:
              stateName,

            districtName:
              "",

            categoryName:
              ""

          };

      }


      if (
        stateFilter
      ) {

        stateFilter.disabled =
          false;

        stateFilter.value =
          stateCode;

      }


      /* ===================================================
         LOAD DISTRICTS
      =================================================== */

      await window
        .UBnuxDistricts
        .loadDistricts(
          stateCode
        );


      /* ===================================================
         DISTRICT
      =================================================== */

      const matchedDistrictOption =
        findDistrictOptionBySlug(
          route.districtSlug
        );


      if (
        !matchedDistrictOption
      ) {

        console.warn(
          "UBnux: District from SEO URL not found:",
          route.districtSlug
        );

        return false;

      }


      const districtCode =
        clean(
          matchedDistrictOption.value
        );


      if (
        !districtCode
      ) {

        return false;

      }


      if (
        districtFilter
      ) {

        districtFilter.disabled =
          false;

        districtFilter.value =
          districtCode;

      }


      let districtName =
        clean(
          matchedDistrictOption.textContent
        );


      if (
        window.UBnuxDistricts &&
        typeof
          window.UBnuxDistricts
            .getDistrictName ===
          "function"
      ) {

        districtName =
          window
            .UBnuxDistricts
            .getDistrictName(
              districtCode
            ) ||
          districtName;

      }


      if (
        window.UBnuxState &&
        window.UBnuxState.state &&
        window.UBnuxState.state.selected
      ) {

        window
          .UBnuxState
          .state
          .selected
          .district =
            districtCode;

        window
          .UBnuxState
          .state
          .selected
          .districtName =
            districtName ||
            route.districtSlug;

      }


      /* ===================================================
         CATEGORY
      =================================================== */

      window
        .UBnuxCategories
        .setEnabled(
          true
        );


      const categorySet =
        window
          .UBnuxCategories
          .setCategory(
            route.categorySlug
          );


      if (
        !categorySet
      ) {

        console.warn(
          "UBnux: Category from SEO URL not found:",
          route.categorySlug
        );

        return false;

      }


      const selectedCategory =
        getSelectedCategory() ||
        route.categorySlug;


      if (
        window.UBnuxState &&
        window.UBnuxState.state &&
        window.UBnuxState.state.selected
      ) {

        window
          .UBnuxState
          .state
          .selected
          .category =
            selectedCategory;

      }


      if (
        window.UBnuxCategories &&
        typeof
          window.UBnuxCategories
            .getCategoryName ===
          "function"
      ) {

        window
          .UBnuxState
          .state
          .selected
          .categoryName =
            window
              .UBnuxCategories
              .getCategoryName(
                selectedCategory
              ) ||
            route.categorySlug;

      } else {

        window
          .UBnuxState
          .state
          .selected
          .categoryName =
            route.categorySlug;

      }


      /* ===================================================
         SORT
      =================================================== */

      if (
        sortFilter
      ) {

        sortFilter.disabled =
          false;

        window
          .UBnuxState
          .state
          .sort =
            sortFilter.value ||
            config.DEFAULT_SORT ||
            "featured";

      }


      /* ===================================================
         MESSAGE
      =================================================== */

      setMessage(

        (
          window
            .UBnuxState
            .state
            .selected
            .stateName ||
          route.stateSlug
        ) +

        " → " +

        (
          window
            .UBnuxState
            .state
            .selected
            .districtName ||
          route.districtSlug
        ) +

        " → " +

        (
          window
            .UBnuxState
            .state
            .selected
            .categoryName ||
          route.categorySlug
        )

      );


      /* ===================================================
         SAVE WITHOUT URL CHANGE
      =================================================== */

      saveSelection({
        skipURL:
          true
      });


      /* ===================================================
         LOAD BUSINESSES
      =================================================== */

      if (
        window.UBnuxBusinesses &&
        typeof
          window.UBnuxBusinesses
            .loadBusinesses ===
          "function"
      ) {

        await window
          .UBnuxBusinesses
          .loadBusinesses(
            false
          );

      }


      console.debug(
        "UBnux: Category SEO route restored successfully.",
        {
          route:
            route,

          selection:
            window
              .UBnuxState
              .getSelection()
        }
      );


      return true;

    } catch (error) {

      console.error(
        "UBnux SEO category restore failed:",
        error
      );

      return false;

    } finally {

      restoringRoute =
        false;

      suppressURLUpdate =
        false;

    }

  }


  /* =========================================================
     RESTORE SAVED USER SELECTION
  ========================================================= */

  async function restoreUserSelection() {

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
      window
        .UBnuxStorage
        .getSelection();


    if (
      !saved ||
      !saved.state
    ) {

      setInitialFilterState();

      return;

    }


    if (
      !window.UBnuxState ||
      !window.UBnuxState.state
    ) {

      return;

    }


    window
      .UBnuxState
      .state
      .selected = {

        state:
          saved.state,

        district:
          saved.district ||
          "",

        category:
          saved.category ||
          "",

        stateName:
          saved.stateName ||
          "",

        districtName:
          saved.districtName ||
          "",

        categoryName:
          saved.categoryName ||
          ""

      };


    /* =====================================================
       STATE
    ===================================================== */

    if (
      stateFilter
    ) {

      stateFilter.disabled =
        false;

      stateFilter.value =
        saved.state;

    }


    /* =====================================================
       DISTRICTS
    ===================================================== */

    if (
      window.UBnuxDistricts &&
      typeof
        window.UBnuxDistricts
          .loadDistricts ===
        "function"
    ) {

      await window
        .UBnuxDistricts
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


    /* =====================================================
       CATEGORY ENABLE
    ===================================================== */

    if (
      saved.district &&
      window.UBnuxCategories
    ) {

      window
        .UBnuxCategories
        .setEnabled(
          true
        );

    } else if (
      window.UBnuxCategories
    ) {

      window
        .UBnuxCategories
        .setEnabled(
          false
        );

    }


    /* =====================================================
       RESTORE CATEGORY
    ===================================================== */

    if (
      saved.category &&
      window.UBnuxCategories
    ) {

      const categorySet =
        window
          .UBnuxCategories
          .setCategory(
            saved.category
          );


      if (
        !categorySet
      ) {

        window
          .UBnuxState
          .state
          .selected
          .category =
            "";

        window
          .UBnuxState
          .state
          .selected
          .categoryName =
            "";

      }

    }


    /* =====================================================
       COMPLETE SELECTION
    ===================================================== */

    if (
      saved.district &&
      window
        .UBnuxState
        .state
        .selected
        .category
    ) {

      if (
        sortFilter
      ) {

        sortFilter.disabled =
          false;

        window
          .UBnuxState
          .state
          .sort =
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
          window
            .UBnuxState
            .state
            .selected
            .categoryName ||
          saved.categoryName ||
          saved.category
        )

      );


      if (
        window.UBnuxBusinesses
      ) {

        await window
          .UBnuxBusinesses
          .loadBusinesses(
            false
          );

      }


      updateURL();

      return;

    }


    /* =====================================================
       DISTRICT ONLY
    ===================================================== */

    if (
      saved.district
    ) {

      setMessage(
        "Now select your business category."
      );

      return;

    }


    /* =====================================================
       STATE ONLY
    ===================================================== */

    setMessage(
      "Now select your district."
    );

  }


  /* =========================================================
     INITIAL FILTER STATE
  ========================================================= */

  function setInitialFilterState() {

    if (
      !window.UBnuxState ||
      !window.UBnuxState.state
    ) {

      return;

    }


    window
      .UBnuxState
      .state
      .selected = {

        state:
          "",

        district:
          "",

        category:
          "",

        stateName:
          "",

        districtName:
          "",

        categoryName:
          ""

      };


    if (
      stateFilter
    ) {

      stateFilter.disabled =
        false;

    }


    if (
      districtFilter
    ) {

      districtFilter.disabled =
        true;

    }


    if (
      window.UBnuxCategories
    ) {

      window
        .UBnuxCategories
        .clearCategory();

      window
        .UBnuxCategories
        .setEnabled(
          false
        );

    }


    if (
      sortFilter
    ) {

      sortFilter.disabled =
        true;

    }


    setMessage(
      "Please select your state to continue."
    );

  }


  /* =========================================================
     STATE CHANGE
  ========================================================= */

  async function handleStateChange() {

    if (
      IS_BUSINESS_PAGE ||
      restoringRoute
    ) {

      return;

    }


    const stateCode =
      stateFilter
        ? stateFilter.value
        : "";


    if (
      window.UBnuxState &&
      typeof
        window.UBnuxState
          .resetBusinesses ===
        "function"
    ) {

      window
        .UBnuxState
        .resetBusinesses();

    }


    if (
      window.UBnuxCategories
    ) {

      window
        .UBnuxCategories
        .clearCategory();

      window
        .UBnuxCategories
        .setEnabled(
          false
        );

    }


    if (
      sortFilter
    ) {

      sortFilter.disabled =
        true;

    }


    if (
      !stateCode
    ) {

      if (
        window.UBnuxDistricts
      ) {

        window
          .UBnuxDistricts
          .clearDistricts();

      }


      if (
        window.UBnuxStorage
      ) {

        window
          .UBnuxStorage
          .clearSelection();

      }


      window
        .UBnuxState
        .state
        .selected = {

          state:
            "",

          district:
            "",

          category:
            "",

          stateName:
            "",

          districtName:
            "",

          categoryName:
            ""

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


    window
      .UBnuxState
      .state
      .selected = {

        state:
          stateCode,

        district:
          "",

        category:
          "",

        stateName:
          stateName,

        districtName:
          "",

        categoryName:
          ""

      };


    saveSelection();


    setMessage(
      "Loading districts..."
    );


    if (
      window.UBnuxDistricts
    ) {

      await window
        .UBnuxDistricts
        .loadDistricts(
          stateCode
        );

    }


    setMessage(
      "Now select your district."
    );

  }


  /* =========================================================
     DISTRICT CHANGE
  ========================================================= */

  async function handleDistrictChange() {

    if (
      IS_BUSINESS_PAGE ||
      restoringRoute
    ) {

      return;

    }


    const districtCode =
      districtFilter
        ? districtFilter.value
        : "";


    if (
      window.UBnuxState &&
      typeof
        window.UBnuxState
          .resetBusinesses ===
        "function"
    ) {

      window
        .UBnuxState
        .resetBusinesses();

    }


    if (
      window.UBnuxCategories
    ) {

      window
        .UBnuxCategories
        .clearCategory();

    }


    if (
      sortFilter
    ) {

      sortFilter.disabled =
        true;

    }


    if (
      !districtCode
    ) {

      window
        .UBnuxState
        .state
        .selected
        .district =
          "";

      window
        .UBnuxState
        .state
        .selected
        .category =
          "";

      window
        .UBnuxState
        .state
        .selected
        .districtName =
          "";

      window
        .UBnuxState
        .state
        .selected
        .categoryName =
          "";


      if (
        window.UBnuxCategories
      ) {

        window
          .UBnuxCategories
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
      typeof
        window.UBnuxDistricts
          .getDistrictName ===
        "function"

        ? window
            .UBnuxDistricts
            .getDistrictName(
              districtCode
            )

        : (
            districtFilter &&
            districtFilter.selectedOptions &&
            districtFilter.selectedOptions[0]
          ? clean(
              districtFilter
                .selectedOptions[0]
                .textContent
            )
          : ""
          );


    window
      .UBnuxState
      .state
      .selected
      .district =
        districtCode;


    window
      .UBnuxState
      .state
      .selected
      .districtName =
        districtName;


    window
      .UBnuxState
      .state
      .selected
      .category =
        "";

    window
      .UBnuxState
      .state
      .selected
      .categoryName =
        "";


    if (
      window.UBnuxCategories
    ) {

      window
        .UBnuxCategories
        .setEnabled(
          true
        );

    }


    saveSelection();


    setMessage(
      "Now select your business category."
    );

  }


  /* =========================================================
     CATEGORY CHANGE
  ========================================================= */

  async function handleCategoryChange(
    detail
  ) {

    if (
      IS_BUSINESS_PAGE ||
      restoringRoute
    ) {

      return;

    }


    const category =
      detail &&
      detail.slug

        ? detail.slug

        : getSelectedCategory();


    if (
      !category
    ) {

      window
        .UBnuxState
        .state
        .selected
        .category =
          "";

      window
        .UBnuxState
        .state
        .selected
        .categoryName =
          "";


      if (
        sortFilter
      ) {

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
            typeof
              window.UBnuxCategories
                .getCategoryName ===
              "function"

              ? window
                  .UBnuxCategories
                  .getCategoryName(
                    category
                  )

              : category
          );


    window
      .UBnuxState
      .state
      .selected
      .category =
        category;


    window
      .UBnuxState
      .state
      .selected
      .categoryName =
        categoryName;


    if (
      sortFilter
    ) {

      sortFilter.disabled =
        false;

      window
        .UBnuxState
        .state
        .sort =
          sortFilter.value ||
          config.DEFAULT_SORT ||
          "featured";

    }


    saveSelection();


    setMessage(

      (
        window
          .UBnuxState
          .state
          .selected
          .stateName ||
        window
          .UBnuxState
          .state
          .selected
          .state
      ) +

      " → " +

      (
        window
          .UBnuxState
          .state
          .selected
          .districtName ||
        window
          .UBnuxState
          .state
          .selected
          .district
      ) +

      " → " +

      categoryName

    );


    if (
      window.UBnuxBusinesses
    ) {

      await window
        .UBnuxBusinesses
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


  /* =========================================================
     SORT CHANGE
  ========================================================= */

  async function handleSortChange() {

    if (
      IS_BUSINESS_PAGE ||
      restoringRoute
    ) {

      return;

    }


    if (
      !window.UBnuxState ||
      !window.UBnuxState.state
    ) {

      return;

    }


    window
      .UBnuxState
      .state
      .sort =
      (
        sortFilter &&
        sortFilter.value
      ) ||
      config.DEFAULT_SORT ||
      "featured";


    if (
      window
        .UBnuxState
        .state
        .selected
        .state &&
      window
        .UBnuxState
        .state
        .selected
        .district &&
      window
        .UBnuxState
        .state
        .selected
        .category
    ) {

      if (
        window.UBnuxBusinesses
      ) {

        await window
          .UBnuxBusinesses
          .loadBusinesses(
            false
          );

      }

    }

  }


  /* =========================================================
     EVENT SETUP
  ========================================================= */

  function setupEvents() {

    /* =======================================================
       STATE
    ======================================================= */

    if (
      stateFilter
    ) {

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


    /* =======================================================
       DISTRICT
    ======================================================= */

    if (
      districtFilter
    ) {

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


    /* =======================================================
       CATEGORY
    ======================================================= */

    document.addEventListener(
      "ubnux:categorychange",
      function (event) {

        handleCategoryChange(
          event.detail ||
          {}
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


    /* =======================================================
       SORT
    ======================================================= */

    if (
      sortFilter
    ) {

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


    /* =======================================================
       MOBILE MENU
    ======================================================= */

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
        .querySelectorAll(
          "a"
        )
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


  /* =========================================================
     INITIALIZE APP
  ========================================================= */

  async function initializeApp() {

    startedAt =
      Date.now();


    /* =====================================================
       YEAR
    ===================================================== */

    if (
      currentYear
    ) {

      currentYear.textContent =
        new Date()
          .getFullYear();

    }


    /* =====================================================
       CRITICAL BUSINESS PAGE GUARD
       -----------------------------------------------------
       This must happen BEFORE:
       - event setup
       - API calls
       - state restore
       - category restore
       - business listing
       - history changes
    ===================================================== */

    if (
      IS_BUSINESS_PAGE
    ) {

      releaseHomepageLoaderForBusinessPage();

      console.debug(
        "UBnux: Business SEO page detected.",
        {
          pathname:
            window.location.pathname,

          route:
            CURRENT_ROUTE,

          fallback:
            FALLBACK_ROUTE
        }
      );

      /*
       * Do NOT:
       *
       * - initialize listing app
       * - call API
       * - restore saved selection
       * - modify URL
       * - modify history
       * - load businesses
       * - redirect
       *
       * business-page.js owns this page.
       */

      return;

    }


    /* =====================================================
       NORMAL LISTING APP
    ===================================================== */

    setupEvents();


    try {

      /* ===================================================
         BASE DATA
      =================================================== */

      await initializeBaseData();


      /* ===================================================
         CATEGORY SEO ROUTE
      =================================================== */

      if (
        IS_INITIAL_CATEGORY_PAGE
      ) {

        const restored =
          await restoreCategorySEORoute();


        if (
          restored
        ) {

          return;

        }


        console.warn(
          "UBnux: Unable to restore requested category SEO route.",
          INITIAL_CATEGORY_ROUTE
        );


        setInitialFilterState();


        setMessage(
          "The requested location or category could not be loaded."
        );


        return;

      }


      /* ===================================================
         NORMAL PAGE
      =================================================== */

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


  /* =========================================================
     DOM READY
  ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initializeApp,
      {
        once:
          true
      }
    );

  } else {

    initializeApp();

  }


  /* =========================================================
     PUBLIC DEBUG API
  ========================================================= */

  window.UBnuxApp = {

    version:
      "3.3.0",


    getRoute:
      function () {

        return getCurrentRoute();

      },


    getFallbackRoute:
      function () {

        return getFallbackSEORoute();

      },


    isBusinessPage:
      function () {

        return IS_BUSINESS_PAGE;

      },


    isInitialCategoryPage:
      function () {

        return IS_INITIAL_CATEGORY_PAGE;

      },


    updateURL:
      updateURL,


    restoreCategorySEORoute:
      restoreCategorySEORoute

  };


})(
  window,
  document
);

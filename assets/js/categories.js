/* =========================================================
   UBnux Category Manager
   File: assets/js/categories.js
   Version: 6.0.0

   STATIC-FIRST ARCHITECTURE
   ---------------------------------------------------------
   Initial page:
     categories.json
          ↓
     local category state
          ↓
     dropdown

   NO API / NO Apps Script call on initial load.

   API refresh is available only through:
     UBnuxCategories.refreshFromAPI()

   Compatible with:
   - Custom category dropdown
   - UBnux Main Application
   - UBnuxState
========================================================= */

(function (window, document) {

  "use strict";


  /* =======================================================
     STATE SAFETY
  ====================================================== */

  if (
    !window.UBnuxState ||
    !window.UBnuxState.state
  ) {

    console.error(
      "UBnuxState is not available for categories module."
    );

    return;
  }


  const state =
    window.UBnuxState.state;


  /* =======================================================
     CONFIG
  ====================================================== */

  const CONFIG =
    window.UBNUX_CONFIG || {};


  const STATIC_URL =
    CONFIG.CATEGORIES_JSON_URL ||
    "/assets/data/categories.json";


  /* =======================================================
     DOM ELEMENTS
  ====================================================== */

  const dropdown =
    document.getElementById(
      "categoryDropdown"
    );


  const dropdownButton =
    document.getElementById(
      "categoryDropdownButton"
    );


  const dropdownMenu =
    document.getElementById(
      "categoryDropdownMenu"
    );


  const selectedIcon =
    document.getElementById(
      "selectedCategoryIcon"
    );


  const selectedText =
    document.getElementById(
      "selectedCategoryText"
    );


  const searchInput =
    document.getElementById(
      "categorySearchInput"
    );


  const categoryOptions =
    document.getElementById(
      "categoryOptions"
    );


  const emptyState =
    document.getElementById(
      "categoryEmptyState"
    );


  /* =======================================================
     INTERNAL STATE
  ====================================================== */

  let categories = [];

  let selectedCategorySlug = "";

  let staticLoaded = false;

  let staticLoadingPromise = null;


  /* =======================================================
     HELPERS
  ====================================================== */

  function normalize(value) {

    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    )
      .trim()
      .toLowerCase();

  }


  function escapeHTML(value) {

    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  /* =======================================================
     GET CATEGORY ICON
  ====================================================== */

  function getCategoryIcon(item) {

    if (
      item &&
      item.Icon
    ) {

      return String(
        item.Icon
      );

    }

    return "🏪";

  }


  /* =======================================================
     NORMALIZE CATEGORY OBJECT
  ====================================================== */

  function normalizeCategory(item) {

    if (!item || typeof item !== "object") {
      return null;
    }


    const category = {
      ...item
    };


    category.CategoryID =
      String(
        item.CategoryID ||
        item.categoryId ||
        item.id ||
        ""
      ).trim();


    category.CategoryName =
      String(
        item.CategoryName ||
        item.categoryName ||
        item.name ||
        ""
      ).trim();


    category.Slug =
      String(
        item.Slug ||
        item.slug ||
        ""
      )
        .trim()
        .toLowerCase();


    category.Icon =
      item.Icon ||
      item.icon ||
      "🏪";


    /*
     * Active handling
     *
     * Only explicit false disables a category.
     */

    category.Active =
      !(
        item.Active === false ||
        normalize(item.Active) === "false" ||
        normalize(item.Active) === "0"
      );


    return category;

  }


  /* =======================================================
     EXTRACT ARRAY FROM STATIC JSON
  ====================================================== */

  function extractCategories(response) {

    if (Array.isArray(response)) {
      return response;
    }


    if (
      response &&
      Array.isArray(response.categories)
    ) {
      return response.categories;
    }


    if (
      response &&
      response.data &&
      Array.isArray(response.data.categories)
    ) {
      return response.data.categories;
    }


    if (
      response &&
      response.data &&
      Array.isArray(response.data)
    ) {
      return response.data;
    }


    if (
      response &&
      Array.isArray(response.rows)
    ) {
      return response.rows;
    }


    return [];

  }


  /* =======================================================
     SORT CATEGORIES
  ====================================================== */

  function sortCategories(list) {

    return list.sort(
      function (a, b) {

        const sortA =
          Number(a.SortOrder) || 999999;


        const sortB =
          Number(b.SortOrder) || 999999;


        if (sortA !== sortB) {
          return sortA - sortB;
        }


        return String(
          a.CategoryName || ""
        ).localeCompare(
          String(
            b.CategoryName || ""
          ),
          undefined,
          {
            sensitivity: "base"
          }
        );

      }
    );

  }


  /* =======================================================
     FIND CATEGORY
  ====================================================== */

  function findCategory(slug) {

    const target =
      normalize(slug);


    if (!target) {
      return null;
    }


    return categories.find(
      function (item) {

        return (
          normalize(item.Slug) ===
          target
        );

      }
    ) || null;

  }


  /* =======================================================
     UPDATE SELECTED DISPLAY
  ====================================================== */

  function updateSelectedDisplay(slug) {

    const item =
      findCategory(slug);


    if (!item) {

      selectedCategorySlug = "";


      if (selectedIcon) {
        selectedIcon.textContent =
          "🏪";
      }


      if (selectedText) {
        selectedText.textContent =
          "Select Business Category";
      }


      return;
    }


    selectedCategorySlug =
      String(
        item.Slug || ""
      );


    if (selectedIcon) {

      selectedIcon.textContent =
        getCategoryIcon(item);

    }


    if (selectedText) {

      selectedText.textContent =
        String(
          item.CategoryName || ""
        );

    }

  }


  /* =======================================================
     CLOSE DROPDOWN
  ====================================================== */

  function closeDropdown() {

    if (dropdownMenu) {

      dropdownMenu.hidden =
        true;

    }


    if (dropdownButton) {

      dropdownButton.setAttribute(
        "aria-expanded",
        "false"
      );

    }

  }


  /* =======================================================
     OPEN DROPDOWN
  ====================================================== */

  function openDropdown() {

    if (
      !dropdownMenu ||
      !dropdownButton ||
      dropdownButton.disabled
    ) {
      return;
    }


    /*
     * If static data has not arrived yet,
     * still allow dropdown to open.
     */

    dropdownMenu.hidden =
      false;


    dropdownButton.setAttribute(
      "aria-expanded",
      "true"
    );


    if (searchInput) {

      searchInput.value = "";


      renderOptions(
        categories
      );


      setTimeout(
        function () {

          try {
            searchInput.focus();
          } catch (e) {}

        },
        0
      );

    }

  }


  /* =======================================================
     TOGGLE DROPDOWN
  ====================================================== */

  function toggleDropdown() {

    if (!dropdownMenu) {
      return;
    }


    if (dropdownMenu.hidden) {

      openDropdown();

    } else {

      closeDropdown();

    }

  }


  /* =======================================================
     RENDER OPTIONS
  ====================================================== */

  function renderOptions(list) {

    if (!categoryOptions) {
      return;
    }


    const items =
      Array.isArray(list)
        ? list
        : [];


    categoryOptions.innerHTML =
      "";


    if (!items.length) {

      if (emptyState) {

        emptyState.hidden =
          false;

      }

      return;
    }


    if (emptyState) {

      emptyState.hidden =
        true;

    }


    items.forEach(
      function (item) {

        const slug =
          String(
            item.Slug || ""
          ).trim();


        const name =
          String(
            item.CategoryName || ""
          ).trim();


        if (!slug || !name) {
          return;
        }


        const option =
          document.createElement(
            "button"
          );


        option.type =
          "button";


        option.className =
          "category-option";


        option.setAttribute(
          "role",
          "option"
        );


        option.setAttribute(
          "data-category",
          slug
        );


        option.setAttribute(
          "aria-selected",
          normalize(
            selectedCategorySlug
          ) ===
          normalize(slug)
            ? "true"
            : "false"
        );


        option.innerHTML =
          '<span class="category-option-icon">' +
            escapeHTML(
              getCategoryIcon(item)
            ) +
          "</span>" +

          '<span class="category-option-text">' +
            escapeHTML(name) +
          "</span>";


        option.addEventListener(
          "click",
          function () {

            selectCategory(
              slug
            );

          }
        );


        categoryOptions.appendChild(
          option
        );

      }
    );

  }


  /* =======================================================
     SEARCH CATEGORIES
  ====================================================== */

  function searchCategories(query) {

    const search =
      normalize(query);


    if (!search) {

      renderOptions(
        categories
      );

      return;

    }


    const filtered =
      categories.filter(
        function (item) {

          const name =
            normalize(
              item.CategoryName
            );


          const slug =
            normalize(
              item.Slug
            );


          const id =
            normalize(
              item.CategoryID
            );


          return (
            name.includes(search) ||
            slug.includes(search) ||
            id.includes(search)
          );

        }
      );


    renderOptions(
      filtered
    );

  }


  /* =======================================================
     SELECT CATEGORY
  ====================================================== */

  function selectCategory(slug) {

    const item =
      findCategory(slug);


    if (!item) {
      return;
    }


    selectedCategorySlug =
      String(
        item.Slug || ""
      );


    state.selected =
      state.selected || {};


    state.selected.category =
      selectedCategorySlug;


    state.selected.categoryName =
      String(
        item.CategoryName || ""
      );


    /*
     * Use State API when available.
     */

    if (
      window.UBnuxState &&
      typeof window.UBnuxState.setSelection ===
        "function"
    ) {

      window.UBnuxState.setSelection(
        "category",
        selectedCategorySlug
      );

      window.UBnuxState.setSelection(
        "categoryName",
        String(
          item.CategoryName || ""
        )
      );

    }


    updateSelectedDisplay(
      selectedCategorySlug
    );


    closeDropdown();


    document.dispatchEvent(
      new CustomEvent(
        "ubnux:categorychange",
        {
          detail: {
            slug:
              selectedCategorySlug,

            name:
              String(
                item.CategoryName || ""
              ),

            category:
              item
          }
        }
      )
    );

  }


  /* =======================================================
     SET CATEGORY
  ====================================================== */

  function setCategory(slug) {

    const item =
      findCategory(slug);


    if (!item) {

      updateSelectedDisplay(
        ""
      );

      return false;

    }


    selectedCategorySlug =
      String(
        item.Slug || ""
      );


    state.selected =
      state.selected || {};


    state.selected.category =
      selectedCategorySlug;


    state.selected.categoryName =
      String(
        item.CategoryName || ""
      );


    if (
      window.UBnuxState &&
      typeof window.UBnuxState.setSelection ===
        "function"
    ) {

      window.UBnuxState.setSelection(
        "category",
        selectedCategorySlug
      );

      window.UBnuxState.setSelection(
        "categoryName",
        String(
          item.CategoryName || ""
        )
      );

    }


    updateSelectedDisplay(
      selectedCategorySlug
    );


    return true;

  }


  /* =======================================================
     CLEAR CATEGORY
  ====================================================== */

  function clearCategory() {

    selectedCategorySlug =
      "";


    state.selected =
      state.selected || {};


    state.selected.category =
      "";


    state.selected.categoryName =
      "";


    if (
      window.UBnuxState &&
      typeof window.UBnuxState.setSelection ===
        "function"
    ) {

      window.UBnuxState.setSelection(
        "category",
        ""
      );

      window.UBnuxState.setSelection(
        "categoryName",
        ""
      );

    }


    updateSelectedDisplay(
      ""
    );


    if (searchInput) {
      searchInput.value = "";
    }


    renderOptions(
      categories
    );

  }


  /* =======================================================
     ENABLE / DISABLE DROPDOWN
  ====================================================== */

  function setEnabled(enabled) {

    const value =
      Boolean(enabled);


    if (dropdownButton) {

      dropdownButton.disabled =
        !value;

    }


    if (!value) {
      closeDropdown();
    }

  }


  /* =======================================================
     RENDER CATEGORIES
  ====================================================== */

  function renderCategories(data) {

    const source =
      Array.isArray(data)
        ? data
        : [];


    const normalized =
      source
        .map(normalizeCategory)
        .filter(
          function (item) {

            return (
              item &&
              item.CategoryName &&
              item.Slug &&
              item.Active !== false
            );

          }
        );


    /*
     * Remove duplicate slugs.
     */

    const unique =
      [];

    const seen =
      new Set();


    normalized.forEach(
      function (item) {

        const key =
          normalize(item.Slug);


        if (
          !key ||
          seen.has(key)
        ) {
          return;
        }


        seen.add(key);

        unique.push(item);

      }
    );


    categories =
      sortCategories(unique);


    state.categories =
      categories;


    /*
     * Sync through state manager.
     */

    if (
      window.UBnuxState &&
      typeof window.UBnuxState.setCategories ===
        "function"
    ) {

      window.UBnuxState.setCategories(
        categories
      );

    }


    renderOptions(
      categories
    );


    if (selectedCategorySlug) {

      updateSelectedDisplay(
        selectedCategorySlug
      );

    } else {

      updateSelectedDisplay(
        ""
      );

    }


    /*
     * Category dropdown should remain
     * available globally.
     */

    setEnabled(true);


    document.dispatchEvent(
      new CustomEvent(
        "ubnux:categoriesloaded",
        {
          detail: {
            categories:
              categories,

            count:
              categories.length,

            source:
              staticLoaded
                ? "static"
                : "runtime"
          }
        }
      )
    );


    return categories;

  }


  /* =======================================================
     STATIC JSON FETCH
  ====================================================== */

  function fetchStaticCategories() {

    if (staticLoadingPromise) {
      return staticLoadingPromise;
    }


    staticLoadingPromise =
      fetch(
        STATIC_URL,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "force-cache",
          headers: {
            "Accept":
              "application/json"
          }
        }
      )
        .then(
          function (response) {

            if (!response.ok) {

              throw new Error(
                "Categories JSON HTTP " +
                response.status
              );

            }


            return response.json();

          }
        )
        .then(
          function (json) {

            const data =
              extractCategories(json);


            if (!data.length) {

              throw new Error(
                "categories.json contains no categories."
              );

            }


            staticLoaded =
              true;


            renderCategories(
              data
            );


            return categories;

          }
        )
        .catch(
          function (error) {

            console.error(
              "UBnux static categories load failed:",
              error
            );


            /*
             * Important:
             * Do not call API automatically here.
             *
             * This keeps homepage strictly
             * static-first.
             */

            return [];

          }
        );


    return staticLoadingPromise;

  }


  /* =======================================================
     EXPLICIT API REFRESH
     -------------------------------------------------------
     This is NOT called during normal page load.
  ====================================================== */

  function refreshFromAPI() {

    if (
      !window.UBnuxAPI ||
      typeof window.UBnuxAPI.getCategories !==
        "function"
    ) {

      return Promise.reject(
        new Error(
          "UBnuxAPI.getCategories is not available."
        )
      );

    }


    return window.UBnuxAPI
      .getCategories()
      .then(
        function (response) {

          const data =
            extractCategories(response);


          renderCategories(
            data
          );


          return categories;

        }
      );

  }


  /* =======================================================
     GET CATEGORY NAME
  ====================================================== */

  function getCategoryName(slug) {

    const item =
      findCategory(slug);


    return item
      ? String(
          item.CategoryName || ""
        )
      : "";

  }


  /* =======================================================
     GET CATEGORY
  ====================================================== */

  function getCategory(slug) {

    return findCategory(
      slug
    );

  }


  /* =======================================================
     GET SELECTED CATEGORY
  ====================================================== */

  function getSelectedCategory() {

    return selectedCategorySlug || "";

  }


  /* =======================================================
     GET ALL CATEGORIES
  ====================================================== */

  function getCategories() {

    return categories.slice();

  }


  /* =======================================================
     STATIC STATUS
  ====================================================== */

  function isStaticLoaded() {

    return Boolean(
      staticLoaded
    );

  }


  /* =======================================================
     EVENT SETUP
  ====================================================== */

  function setupEvents() {

    if (dropdownButton) {

      dropdownButton.addEventListener(
        "click",
        function () {

          toggleDropdown();

        }
      );

    }


    if (searchInput) {

      searchInput.addEventListener(
        "input",
        function () {

          searchCategories(
            searchInput.value
          );

        }
      );


      searchInput.addEventListener(
        "keydown",
        function (event) {

          if (
            event.key ===
            "Escape"
          ) {

            closeDropdown();


            if (dropdownButton) {

              dropdownButton.focus();

            }

          }

        }
      );

    }


    document.addEventListener(
      "click",
      function (event) {

        if (
          dropdown &&
          !dropdown.contains(
            event.target
          )
        ) {

          closeDropdown();

        }

      }
    );

  }


  /* =======================================================
     INITIALIZE
  ====================================================== */

  setupEvents();


  /*
   * IMPORTANT:
   *
   * This is a STATIC request only.
   * No Apps Script / API call happens here.
   */

  fetchStaticCategories();


  /* =======================================================
     PUBLIC API
  ====================================================== */

  window.UBnuxCategories = {

    renderCategories,

    getCategories,

    getCategoryName,

    getCategory,

    getSelectedCategory,

    setCategory,

    selectCategory,

    clearCategory,

    setEnabled,

    openDropdown,

    closeDropdown,

    searchCategories,

    refreshFromAPI,

    isStaticLoaded,

    getStaticURL:
      function () {
        return STATIC_URL;
      }

  };


})(window, document);

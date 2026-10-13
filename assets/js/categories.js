
/* =========================================================
   UBnux Category Manager
   File: assets/js/categories.js

   Responsibilities:
   - Load category data
   - Render custom category dropdown
   - Category search
   - Category selection
   - Selected category display
   - Category name lookup
   - Safe DOM handling

   Compatible with:
   - Custom category dropdown in index.html
   - District-wise business backend
   - UBnux Main Application
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
  let categoryIndex = new Map();


  let selectedCategorySlug = "";


  /* =======================================================
     NORMALIZE
  ====================================================== */

  function normalize(
    value
  ) {

    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    )
      .trim()
      .toLowerCase();

  }


  /* =======================================================
     ESCAPE HTML
  ====================================================== */

  function escapeHTML(
    value
  ) {

    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  /* =======================================================
     GET CATEGORY ICON
  ====================================================== */

  function getCategoryIcon(
    item
  ) {

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
     FIND CATEGORY
  ====================================================== */

  function findCategory(
    slug
  ) {

    const target =
      normalize(
        slug
      );


    if (!target) {

      return null;

    }


    return categories.find(
      function (item) {

        return (
          normalize(
            item.Slug
          ) === target
        );

      }
    ) || null;

  }


  /* =======================================================
     UPDATE SELECTED DISPLAY
  ====================================================== */

  function updateSelectedDisplay(
    slug
  ) {

    const item =
      findCategory(
        slug
      );


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
        getCategoryIcon(
          item
        );

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


    dropdownMenu.hidden =
      false;


    dropdownButton.setAttribute(
      "aria-expanded",
      "true"
    );


    if (searchInput) {

      searchInput.value =
        "";


      renderOptions(
        categories
      );


      setTimeout(
        function () {

          searchInput.focus();

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

  function renderOptions(
    list
  ) {
    if (!categoryOptions) return;

    const items = Array.isArray(list) ? list : [];
    const fragment = document.createDocumentFragment();
    let count = 0;

    items.forEach(function (item) {
      const slug = String(item && item.Slug || "").trim();
      const name = String(item && item.CategoryName || "").trim();
      if (!slug || !name) return;

      const option = document.createElement("button");
      option.type = "button";
      option.className = "category-option";
      option.setAttribute("role", "option");
      option.setAttribute("data-category", slug);
      option.setAttribute(
        "aria-selected",
        normalize(selectedCategorySlug) === normalize(slug) ? "true" : "false"
      );

      const icon = document.createElement("span");
      icon.className = "category-option-icon";
      icon.textContent = getCategoryIcon(item);

      const label = document.createElement("span");
      label.className = "category-option-name";
      label.textContent = name;

      option.appendChild(icon);
      option.appendChild(label);
      fragment.appendChild(option);
      count++;
    });

    categoryOptions.replaceChildren(fragment);

    if (emptyState) emptyState.hidden = count !== 0;
  }


  /* =======================================================
     SEARCH CATEGORIES
  ====================================================== */

  function searchCategories(
    query
  ) {

    const search =
      normalize(
        query
      );


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


          return (
            name.includes(
              search
            ) ||
            slug.includes(
              search
            )
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

  function selectCategory(
    slug
  ) {

    const item =
      findCategory(
        slug
      );


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

  function setCategory(
    slug
  ) {

    const item =
      findCategory(
        slug
      );


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


    updateSelectedDisplay(
      ""
    );


    if (searchInput) {

      searchInput.value =
        "";

    }


    renderOptions(
      categories
    );

  }


  /* =======================================================
     ENABLE DROPDOWN
  ====================================================== */

  function setEnabled(
    enabled
  ) {

    const value =
      Boolean(
        enabled
      );


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

  function renderCategories(
    data
  ) {
    const input = Array.isArray(data) ? data : [];
    const seen = new Set();
    categoryIndex = new Map();

    categories = input.filter(function (item) {
      if (!item) return false;
      const active = normalize(item.Active);
      if (active === "false" || active === "0" || active === "no") return false;
      const slug = normalize(item.Slug || item.CategoryName);
      if (!slug || seen.has(slug)) return false;
      seen.add(slug);
      categoryIndex.set(slug, item);
      return true;
    });

    categories.sort(function(a,b) {
      const sa = Number(a.SortOrder);
      const sb = Number(b.SortOrder);
      const va = Number.isFinite(sa) ? sa : 999999;
      const vb = Number.isFinite(sb) ? sb : 999999;
      return va - vb;
    });

    state.categories = categories;
    renderOptions(categories);
    updateSelectedDisplay(selectedCategorySlug || "");
  }


  /* =======================================================
     PUBLIC API
  ====================================================== */

  window.UBnuxCategories = {

    renderCategories,

    getCategoryName,

    getCategory,

    getSelectedCategory,

    setCategory,

    selectCategory,

    clearCategory,

    setEnabled,

    openDropdown,

    closeDropdown,

    searchCategories

  };


})(window, document);
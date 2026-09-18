/* =========================================================
   UBnux Category Manager
   File: assets/js/categories.js
========================================================= */

(function (window, document) {

  "use strict";


  const state =
    window.UBnuxState.state;


  const categoryFilter =
    document.getElementById(
      "categoryFilter"
    );


  function renderCategories(
    categories
  ) {

    state.categories =
      Array.isArray(categories)
        ? categories
        : [];


    categoryFilter.innerHTML =
      '<option value="">Select Business Category</option>';


    state.categories
      .forEach(function (item) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          item.Slug;


        option.textContent =
          item.CategoryName;


        categoryFilter.appendChild(
          option
        );

      });


    categoryFilter.disabled =
      false;

  }


  function getCategoryName(
    slug
  ) {

    const item =
      state.categories.find(
        function (category) {

          return String(
            category.Slug
          ).toLowerCase() ===
          String(slug).toLowerCase();

        }
      );


    return item
      ? item.CategoryName
      : "";

  }


  window.UBnuxCategories = {

    renderCategories,

    getCategoryName

  };


})(window, document);
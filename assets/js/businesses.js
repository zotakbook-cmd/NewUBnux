
/* =========================================================
   UBnux - Business Listing Manager
   File: assets/js/businesses.js

   Responsibilities:
   - Business API loading
   - Business card rendering
   - Business count
   - Pagination
   - Load More
   - Sorting
   - Skeleton loading
   - Empty state
   - API response normalization

   IMPORTANT:
   - Does NOT contain search-engine logic
   - Does NOT contain district/category logic
   - Works with current UBnuxAPI
========================================================= */

(function (window, document) {

  "use strict";


  /* =========================================================
     CONFIG
  ========================================================= */

  const config =
    window.UBNUX_CONFIG || {};


  const PAGE_SIZE =
    Number(
      config.BUSINESS_PAGE_SIZE || 18
    );


  const DEFAULT_SORT =
    String(
      config.DEFAULT_SORT || "featured"
    );


  /* =========================================================
     STATE
  ========================================================= */

  const state = {

    businesses: [],

    currentPage: 1,

    total: 0,

    hasMore: false,

    isLoading: false,

    selectedState: "",

    selectedDistrict: "",

    selectedCategory: "",

    selectedSort: DEFAULT_SORT

  };


  /* =========================================================
     DOM
  ========================================================= */

  const businessGrid =
    document.getElementById(
      "businessGrid"
    );


  const emptyState =
    document.getElementById(
      "emptyState"
    );


  const loadMoreWrapper =
    document.getElementById(
      "loadMoreWrapper"
    );


  const loadMoreButton =
    document.getElementById(
      "loadMoreButton"
    );


  const businessSummary =
    document.getElementById(
      "businessSummary"
    );


  /* =========================================================
     HELPERS
  ========================================================= */

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


  function safeNumber(value, fallback) {

    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : (
          fallback === undefined
            ? 0
            : fallback
        );

  }


  function isTrue(value) {

    if (
      value === true ||
      value === 1
    ) {
      return true;
    }

    const text =
      String(value || "")
        .trim()
        .toLowerCase();

    return (
      text === "true" ||
      text === "yes" ||
      text === "1" ||
      text === "active"
    );

  }


  function imageOrPlaceholder(url) {

    const image =
      String(url || "").trim();

    if (image) {
      return escapeHTML(image);
    }

    return (
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(
        `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="600"
          height="400"
          viewBox="0 0 600 400"
        >
          <rect
            width="600"
            height="400"
            fill="#f1f5f9"
          />
          <text
            x="300"
            y="200"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial"
            font-size="28"
            fill="#64748b"
          >
            UBnux Business
          </text>
        </svg>
        `
      )
    );

  }


  /* =========================================================
     BUSINESS URL
  ========================================================= */

  function getBusinessURL(business) {

    const stateSlug =
      String(
        business.StateSlug ||
        business.stateSlug ||
        ""
      ).trim();


    const districtSlug =
      String(
        business.DistrictSlug ||
        business.districtSlug ||
        ""
      ).trim();


    const categorySlug =
      String(
        business.CategorySlug ||
        business.categorySlug ||
        ""
      ).trim();


    const businessSlug =
      String(
        business.Slug ||
        business.slug ||
        ""
      ).trim();


    /*
       Preferred permanent SEO URL
    */

    if (
      stateSlug &&
      districtSlug &&
      categorySlug &&
      businessSlug
    ) {

      return (
        "/in/" +
        encodeURIComponent(stateSlug) +
        "/" +
        encodeURIComponent(districtSlug) +
        "/" +
        encodeURIComponent(categorySlug) +
        "/" +
        encodeURIComponent(businessSlug) +
        "/"
      );

    }


    /*
       Current fallback URL

       This keeps the listing working even when
       the backend does not yet return SEO slugs.
    */

    const id =
      String(
        business.BusinessID ||
        business.businessID ||
        business.id ||
        businessSlug ||
        ""
      ).trim();


    if (!id) {
      return "#";
    }


    return (
      "/business/" +
      encodeURIComponent(id)
    );

  }


  /* =========================================================
     LOCATION
  ========================================================= */

  function getBusinessLocation(business) {

    const area =
      String(
        business.Area || ""
      ).trim();


    const address =
      String(
        business.Address || ""
      ).trim();


    if (
      area &&
      address
    ) {

      return (
        escapeHTML(area) +
        ", " +
        escapeHTML(address)
      );

    }


    if (area) {
      return escapeHTML(area);
    }


    if (address) {
      return escapeHTML(address);
    }


    return "Location not available";

  }


  /* =========================================================
     RATING
  ========================================================= */

  function renderRating(business) {

    const rating =
      safeNumber(
        business.Rating,
        0
      );


    const reviewCount =
      safeNumber(
        business.ReviewCount,
        0
      );


    if (rating <= 0) {

      return `
        <div class="business-rating">
          <span class="rating-star">★</span>
          <span>No rating</span>
        </div>
      `;

    }


    return `
      <div class="business-rating">
        <span class="rating-star">★</span>
        <strong>${rating.toFixed(1)}</strong>
        ${
          reviewCount > 0
            ? `<span>(${reviewCount})</span>`
            : ""
        }
      </div>
    `;

  }


  /* =========================================================
     BADGES
  ========================================================= */

  function renderBadges(business) {

    let html = "";


    if (
      isTrue(
        business.Verified
      )
    ) {

      html += `
        <span class="business-badge verified">
          ✓ Verified
        </span>
      `;

    }


    if (
      isTrue(
        business.Featured
      )
    ) {

      html += `
        <span class="business-badge featured">
          Featured
        </span>
      `;

    }


    return html;

  }


  /* =========================================================
     BUSINESS CARD
  ========================================================= */

  function renderBusinessCard(business) {

    const name =
      String(
        business.BusinessName ||
        business.Name ||
        "Business"
      ).trim();


    const description =
      String(
        business.ShortDescription ||
        business.Description ||
        "Local business listed on UBnux."
      ).trim();


    const logo =
      imageOrPlaceholder(
        business.LogoURL ||
        business.CoverURL
      );


    const businessURL =
      getBusinessURL(
        business
      );


    const location =
      getBusinessLocation(
        business
      );


    const badges =
      renderBadges(
        business
      );


    return `
      <article
        class="business-card"
        data-business-id="${
          escapeHTML(
            business.BusinessID ||
            business.businessID ||
            ""
          )
        }"
      >

        <a
          class="business-card-image"
          href="${businessURL}"
          aria-label="${escapeHTML(name)}"
        >

          <img
            src="${logo}"
            alt="${escapeHTML(name)}"
            loading="lazy"
            decoding="async"
            onerror="this.onerror=null;this.src='${imageOrPlaceholder("")}'"
          >

          ${
            badges
              ? `
                <div class="business-card-badges">
                  ${badges}
                </div>
              `
              : ""
          }

        </a>


        <div class="business-card-content">

          <h3 class="business-card-title">

            <a
              href="${businessURL}"
            >
              ${escapeHTML(name)}
            </a>

          </h3>


          ${renderRating(business)}


          <div class="business-location">

            <span
              class="business-location-icon"
              aria-hidden="true"
            >
              📍
            </span>

            <span>
              ${location}
            </span>

          </div>


          <p class="business-description">

            ${escapeHTML(
              description
            )}

          </p>


          <div class="business-card-footer">

            <a
              class="business-view-button"
              href="${businessURL}"
            >
              View Business
            </a>

          </div>

        </div>

      </article>
    `;

  }


  /* =========================================================
     SKELETON
  ========================================================= */

  function renderSkeletons(count) {

    if (!businessGrid) {
      return;
    }


    const total =
      Math.max(
        1,
        Number(count || 6)
      );


    let html = "";


    for (
      let i = 0;
      i < total;
      i++
    ) {

      html += `
        <div
          class="business-card business-card-skeleton"
          aria-hidden="true"
        >

          <div class="skeleton skeleton-image"></div>

          <div class="business-card-content">

            <div class="skeleton skeleton-title"></div>

            <div class="skeleton skeleton-line short"></div>

            <div class="skeleton skeleton-line"></div>

            <div class="skeleton skeleton-line"></div>

            <div class="skeleton skeleton-button"></div>

          </div>

        </div>
      `;

    }


    businessGrid.innerHTML =
      html;

  }


  /* =========================================================
     EMPTY STATE
  ========================================================= */

  function showEmptyState(show) {

    if (!emptyState) {
      return;
    }


    emptyState.hidden =
      !show;

  }


  /* =========================================================
     SUMMARY
  ========================================================= */

  function updateSummary() {

    if (!businessSummary) {
      return;
    }


    const count =
      state.businesses.length;


    const total =
      state.total;


    if (state.isLoading) {

      businessSummary.textContent =
        "Loading businesses...";

      return;

    }


    if (!total) {

      businessSummary.textContent =
        "0 businesses found";

      return;

    }


    if (total === count) {

      businessSummary.textContent =
        `${total} businesses found`;

      return;

    }


    businessSummary.textContent =
      `Showing ${count} of ${total} businesses`;

  }


  /* =========================================================
     LOAD MORE UI
  ========================================================= */

  function updateLoadMore() {

    if (
      !loadMoreWrapper ||
      !loadMoreButton
    ) {
      return;
    }


    if (
      state.hasMore &&
      state.businesses.length > 0
    ) {

      loadMoreWrapper.hidden =
        false;

      loadMoreButton.disabled =
        state.isLoading;


      loadMoreButton.textContent =
        state.isLoading
          ? "Loading..."
          : "Load More";

    } else {

      loadMoreWrapper.hidden =
        true;

    }

  }


  /* =========================================================
     RENDER BUSINESSES
  ========================================================= */

  function renderBusinesses() {

    if (!businessGrid) {
      return;
    }


    if (
      !state.businesses.length
    ) {

      businessGrid.innerHTML =
        "";

      showEmptyState(
        true
      );

      updateSummary();
      updateLoadMore();

      return;

    }


    showEmptyState(
      false
    );


    businessGrid.innerHTML =
      state.businesses
        .map(
          renderBusinessCard
        )
        .join("");


    updateSummary();
    updateLoadMore();

  }


  /* =========================================================
     NORMALIZE API RESPONSE
  ========================================================= */

  function normalizeResponse(response) {

    response =
      response || {};


    /*
       Backend may return:

       response.businesses
       response.data
       response.data.businesses
       response.results
    */

    let businesses = [];


    if (
      Array.isArray(
        response.businesses
      )
    ) {

      businesses =
        response.businesses;

    } else if (
      Array.isArray(
        response.data
      )
    ) {

      businesses =
        response.data;

    } else if (
      response.data &&
      Array.isArray(
        response.data.businesses
      )
    ) {

      businesses =
        response.data.businesses;

    } else if (
      Array.isArray(
        response.results
      )
    ) {

      businesses =
        response.results;

    }


    const page =
      safeNumber(
        response.page ||
        (
          response.data &&
          response.data.page
        ),
        state.currentPage
      );


    const total =
      safeNumber(
        response.total ||
        (
          response.data &&
          response.data.total
        ),
        businesses.length
      );


    let hasMore;


    if (
      response.hasMore !== undefined
    ) {

      hasMore =
        Boolean(
          response.hasMore
        );

    } else if (
      response.data &&
      response.data.hasMore !== undefined
    ) {

      hasMore =
        Boolean(
          response.data.hasMore
        );

    } else {

      hasMore =
        (
          page * PAGE_SIZE
        ) < total;

    }


    return {

      businesses,
      page,
      total,
      hasMore

    };

  }


  /* =========================================================
     LOAD BUSINESSES
  ========================================================= */

  async function loadBusinesses(
    append
  ) {

    append =
      Boolean(
        append
      );


    if (
      state.isLoading
    ) {

      return;

    }

/* =========================================================
   SYNC WITH GLOBAL UBNUX SELECTION
========================================================= */

try {

  if (
    window.UBnuxState &&
    typeof window.UBnuxState.getSelection === "function"
  ) {

    const selected =
      window.UBnuxState.getSelection();

    if (selected) {

      state.selectedState =
        String(
          selected.state || ""
        ).trim();

      state.selectedDistrict =
        String(
          selected.district || ""
        ).trim();

      state.selectedCategory =
        String(
          selected.category || ""
        ).trim();

    }

  }

} catch (error) {

  console.warn(
    "UBnux business selection sync failed:",
    error
  );

}
    if (
      !state.selectedState ||
      !state.selectedDistrict ||
      !state.selectedCategory
    ) {

      state.businesses = [];
      state.total = 0;
      state.currentPage = 1;
      state.hasMore = false;

      renderBusinesses();

      return;

    }


    state.isLoading =
      true;


    const page =
      append
        ? state.currentPage + 1
        : 1;


    if (!append) {

      state.currentPage =
        1;

      state.businesses =
        [];

      state.total =
        0;

      state.hasMore =
        false;

      renderSkeletons(
        Math.min(
          PAGE_SIZE,
          6
        )
      );

      showEmptyState(
        false
      );

      updateSummary();
      updateLoadMore();

    } else {

      updateLoadMore();

    }


    try {

      const response =
        await window.UBnuxAPI.getBusinesses({

          state:
            state.selectedState,

          district:
            state.selectedDistrict,

          category:
            state.selectedCategory,

          page:
            page,

          limit:
            PAGE_SIZE,

          sort:
            state.selectedSort

        });


      console.log(
        "UBnux businesses API response:",
        response
      );


      const normalized =
        normalizeResponse(
          response
        );


      console.log(
        "UBnux businesses received:",
        normalized.businesses.length
      );


      if (append) {

        state.businesses =
          state.businesses.concat(
            normalized.businesses
          );

      } else {

        state.businesses =
          normalized.businesses;

      }


      state.currentPage =
        normalized.page;


      state.total =
        normalized.total;


      state.hasMore =
        normalized.hasMore;


      renderBusinesses();


    } catch (error) {

      console.error(
        "UBnux business loading error:",
        error
      );


      if (!append) {

        state.businesses =
          [];

        state.total =
          0;

        state.currentPage =
          1;

        state.hasMore =
          false;


        if (businessGrid) {

          businessGrid.innerHTML = `
            <div class="business-error">
              <h3>
                Unable to load businesses
              </h3>

              <p>
                ${
                  escapeHTML(
                    error &&
                    error.message
                      ? error.message
                      : "Please try again."
                  )
                }
              </p>

              <button
                type="button"
                class="business-retry-button"
                id="businessRetryButton"
              >
                Try Again
              </button>
            </div>
          `;


          const retryButton =
            document.getElementById(
              "businessRetryButton"
            );


          if (retryButton) {

            retryButton.addEventListener(
              "click",
              function () {

                loadBusinesses(
                  false
                );

              }
            );

          }

        }

      }

    } finally {

      state.isLoading =
        false;

      updateSummary();
      updateLoadMore();

    }

  }


  /* =========================================================
     LOAD MORE
  ========================================================= */

  if (
    loadMoreButton
  ) {

    loadMoreButton.addEventListener(
      "click",
      function () {

        loadBusinesses(
          true
        );

      }
    );

  }


  /* =========================================================
     CATEGORY CHANGE
  ========================================================= */

  document.addEventListener(
    "ubnux:categorychange",
    function (event) {

      const detail =
        event &&
        event.detail
          ? event.detail
          : {};


      state.selectedCategory =
        String(
          detail.slug ||
          detail.name ||
          ""
        ).trim();


      /*
         Category slug is preferred.
         The API backend already supports
         both category slug and category name.
      */


      loadBusinesses(
        false
      );

    }
  );


  /* =========================================================
     STATE / DISTRICT CHANGE
  ========================================================= */

  document.addEventListener(
    "ubnux:selectionchange",
    function (event) {

      const detail =
        event &&
        event.detail
          ? event.detail
          : {};


      if (
        detail.state !== undefined
      ) {

        state.selectedState =
          String(
            detail.state || ""
          ).trim();

      }


      if (
        detail.district !== undefined
      ) {

        state.selectedDistrict =
          String(
            detail.district || ""
          ).trim();

      }


      if (
        detail.sort !== undefined
      ) {

        state.selectedSort =
          String(
            detail.sort ||
            DEFAULT_SORT
          ).trim();

      }

    }
  );


  /* =========================================================
     PUBLIC SETTERS
  ========================================================= */

  function setSelection(
    options
  ) {

    options =
      options || {};


    if (
      options.state !== undefined
    ) {

      state.selectedState =
        String(
          options.state || ""
        ).trim();

    }


    if (
      options.district !== undefined
    ) {

      state.selectedDistrict =
        String(
          options.district || ""
        ).trim();

    }


    if (
      options.category !== undefined
    ) {

      state.selectedCategory =
        String(
          options.category || ""
        ).trim();

    }


    if (
      options.sort !== undefined
    ) {

      state.selectedSort =
        String(
          options.sort ||
          DEFAULT_SORT
        ).trim();

    }

  }


  /* =========================================================
     PUBLIC API
  ========================================================= */

  window.UBnuxBusinesses = {

    state,

    loadBusinesses,

    renderBusinesses,

    setSelection,

    getBusinesses: function () {

      return state.businesses.slice();

    },

    getState: function () {

      return {
        ...state,
        businesses:
          state.businesses.slice()
      };

    }

  };


})(window, document);

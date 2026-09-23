/* =========================================================
   UBnux - Business Listing Manager
   File: assets/js/businesses.js

   Version:
   4.0.0

   Responsibilities:
   ---------------------------------------------------------
   - Business API loading
   - Business card rendering
   - Business count
   - Pagination
   - Load More
   - Sorting
   - Skeleton loading
   - Empty state
   - Error state
   - Retry
   - API response normalization
   - Selection synchronization
   - SEO business URL generation
   - Duplicate protection
   - Stale response protection

   IMPORTANT:
   ---------------------------------------------------------
   - Does NOT contain search-engine logic
   - Does NOT contain district/category ownership
   - Does NOT modify browser URL
   - Does NOT redirect
   - Works with current UBnuxAPI
   - app.js controls category/state/district flow
   - Search modules remain independent

   BUSINESS URL:
   ---------------------------------------------------------
   /in/{state}/{district}/{category}/{business}/

   LEGACY:
   ---------------------------------------------------------
   /business/... URLs are NEVER generated.
   ========================================================= */

(function (window, document) {

  "use strict";


  /* =========================================================
     CONFIG
  ========================================================= */

  const config =
    window.UBNUX_CONFIG || {};


  const VERSION =
    "4.0.0";


  const PAGE_SIZE =
    Number(
      config.BUSINESS_PAGE_SIZE || 18
    );


  const DEFAULT_SORT =
    String(
      config.DEFAULT_SORT || "featured"
    ).trim() || "featured";


  /* =========================================================
     GLOBAL APP STATE
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

    selectedSort:
      DEFAULT_SORT,

    lastRequestId: 0,

    lastLoadedAt: 0

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
     HTML ESCAPE
  ========================================================= */

  function escapeHTML(value) {

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


  /* =========================================================
     NUMBER
  ========================================================= */

  function safeNumber(
    value,
    fallback
  ) {

    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : (
          fallback === undefined
            ? 0
            : fallback
        );

  }


  /* =========================================================
     BOOLEAN
  ========================================================= */

  function isTrue(value) {

    if (
      value === true ||
      value === 1
    ) {

      return true;

    }


    const text =
      String(
        value || ""
      )
        .trim()
        .toLowerCase();


    return (
      text === "true" ||
      text === "yes" ||
      text === "1" ||
      text === "active"
    );

  }


  /* =========================================================
     SLUG
  ========================================================= */

  function normalizeSlug(
    value
  ) {

    return clean(value)
      .toLowerCase()
      .replace(
        /^\/+|\/+$/g,
        ""
      );

  }


  /* =========================================================
     IMAGE
  ========================================================= */

  function imageOrPlaceholder(
    url
  ) {

    const image =
      clean(url);


    if (
      image
    ) {

      return escapeHTML(
        image
      );

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
     ---------------------------------------------------------
     Permanent SEO URL only.
  ========================================================= */

  function getBusinessURL(
    business
  ) {

    if (
      !business
    ) {

      return "#";

    }


    const stateSlug =
      normalizeSlug(
        business.StateSlug ||
        business.stateSlug ||
        business.State ||
        business.state
      );


    const districtSlug =
      normalizeSlug(
        business.DistrictSlug ||
        business.districtSlug ||
        business.District ||
        business.district
      );


    const categorySlug =
      normalizeSlug(
        business.CategorySlug ||
        business.categorySlug ||
        business.Category ||
        business.category
      );


    const businessSlug =
      normalizeSlug(
        business.Slug ||
        business.slug
      );


    if (
      !stateSlug ||
      !districtSlug ||
      !categorySlug ||
      !businessSlug
    ) {

      console.warn(
        "UBnux: Business SEO URL could not be generated.",
        {
          BusinessID:
            business.BusinessID ||
            business.businessID ||
            business.id ||
            "",

          StateSlug:
            stateSlug,

          DistrictSlug:
            districtSlug,

          CategorySlug:
            categorySlug,

          Slug:
            businessSlug
        }
      );


      return "#";

    }


    return (
      "/in/" +
      encodeURIComponent(
        stateSlug
      ) +
      "/" +
      encodeURIComponent(
        districtSlug
      ) +
      "/" +
      encodeURIComponent(
        categorySlug
      ) +
      "/" +
      encodeURIComponent(
        businessSlug
      ) +
      "/"
    );

  }


  /* =========================================================
     LOCATION
  ========================================================= */

  function getBusinessLocation(
    business
  ) {

    const area =
      clean(
        business.Area
      );


    const address =
      clean(
        business.Address
      );


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


    if (
      area
    ) {

      return escapeHTML(
        area
      );

    }


    if (
      address
    ) {

      return escapeHTML(
        address
      );

    }


    return "Location not available";

  }


  /* =========================================================
     RATING
  ========================================================= */

  function renderRating(
    business
  ) {

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


    if (
      rating <= 0
    ) {

      return `
        <div
          class="business-rating"
          aria-label="No rating available"
        >
          <span
            class="rating-star"
            aria-hidden="true"
          >
            ★
          </span>

          <span>
            No rating
          </span>

        </div>
      `;

    }


    return `
      <div
        class="business-rating"
        aria-label="Rating ${rating.toFixed(1)}"
      >

        <span
          class="rating-star"
          aria-hidden="true"
        >
          ★
        </span>

        <strong>
          ${rating.toFixed(1)}
        </strong>

        ${
          reviewCount > 0
            ? `
              <span>
                (${reviewCount})
              </span>
            `
            : ""
        }

      </div>
    `;

  }


  /* =========================================================
     BADGES
  ========================================================= */

  function renderBadges(
    business
  ) {

    let html =
      "";


    if (
      isTrue(
        business.Verified
      )
    ) {

      html += `
        <span
          class="business-badge verified"
        >
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
        <span
          class="business-badge featured"
        >
          Featured
        </span>
      `;

    }


    return html;

  }


  /* =========================================================
     BUSINESS CARD
  ========================================================= */

  function renderBusinessCard(
    business
  ) {

    const name =
      clean(
        business.BusinessName ||
        business.Name ||
        "Business"
      );


    const description =
      clean(
        business.ShortDescription ||
        business.Description ||
        "Local business listed on UBnux."
      );


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


    const businessID =
      clean(
        business.BusinessID ||
        business.businessID ||
        business.id
      );


    return `
      <article
        class="business-card"
        data-business-id="${escapeHTML(
          businessID
        )}"
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
                <div
                  class="business-card-badges"
                >
                  ${badges}
                </div>
              `
              : ""
          }

        </a>


        <div
          class="business-card-content"
        >

          <h3
            class="business-card-title"
          >

            <a
              href="${businessURL}"
            >
              ${escapeHTML(name)}
            </a>

          </h3>


          ${renderRating(
            business
          )}


          <div
            class="business-location"
          >

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


          <p
            class="business-description"
          >
            ${escapeHTML(
              description
            )}
          </p>


          <div
            class="business-card-footer"
          >

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

  function renderSkeletons(
    count
  ) {

    if (
      !businessGrid
    ) {

      return;

    }


    const total =
      Math.max(
        1,
        Number(
          count || 6
        )
      );


    let html =
      "";


    for (
      let i = 0;
      i < total;
      i += 1
    ) {

      html += `
        <div
          class="business-card business-card-skeleton"
          aria-hidden="true"
        >

          <div
            class="skeleton skeleton-image"
          ></div>

          <div
            class="business-card-content"
          >

            <div
              class="skeleton skeleton-title"
            ></div>

            <div
              class="skeleton skeleton-line short"
            ></div>

            <div
              class="skeleton skeleton-line"
            ></div>

            <div
              class="skeleton skeleton-line"
            ></div>

            <div
              class="skeleton skeleton-button"
            ></div>

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

  function showEmptyState(
    show
  ) {

    if (
      !emptyState
    ) {

      return;

    }


    emptyState.hidden =
      !show;

  }


  /* =========================================================
     SUMMARY
  ========================================================= */

  function updateSummary() {

    if (
      !businessSummary
    ) {

      return;

    }


    const count =
      state.businesses.length;


    const total =
      state.total;


    if (
      state.isLoading
    ) {

      businessSummary.textContent =
        "Loading businesses...";

      return;

    }


    if (
      !total
    ) {

      businessSummary.textContent =
        "0 businesses found";

      return;

    }


    if (
      total === count
    ) {

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

    if (
      !businessGrid
    ) {

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

  function normalizeResponse(
    response
  ) {

    response =
      response || {};


    let businesses =
      [];


    /*
     * Supported backend formats:
     *
     * response.businesses
     * response.data
     * response.data.businesses
     * response.results
     */

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
      response.data.hasMore !==
        undefined
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

      businesses:
        Array.isArray(
          businesses
        )
          ? businesses
          : [],

      page,

      total,

      hasMore

    };

  }


  /* =========================================================
     BUSINESS UNIQUE KEY
  ========================================================= */

  function getBusinessKey(
    business,
    index
  ) {

    if (
      !business
    ) {

      return (
        "empty-" +
        index
      );

    }


    const id =
      clean(
        business.BusinessID ||
        business.businessID ||
        business.id
      );


    if (
      id
    ) {

      return "id:" + id;

    }


    const slug =
      clean(
        business.Slug ||
        business.slug
      );


    if (
      slug
    ) {

      return "slug:" + slug;

    }


    const name =
      clean(
        business.BusinessName ||
        business.Name
      );


    return (
      "name:" +
      name.toLowerCase() +
      ":" +
      index
    );

  }


  /* =========================================================
     DEDUPLICATE BUSINESSES
  ========================================================= */

  function deduplicateBusinesses(
    businesses
  ) {

    if (
      !Array.isArray(
        businesses
      )
    ) {

      return [];

    }


    const seen =
      new Set();

    const output =
      [];


    businesses.forEach(
      function (
        business,
        index
      ) {

        const key =
          getBusinessKey(
            business,
            index
          );


        if (
          seen.has(key)
        ) {

          return;

        }


        seen.add(
          key
        );

        output.push(
          business
        );

      }
    );


    return output;

  }


  /* =========================================================
     SYNC WITH GLOBAL SELECTION
     ---------------------------------------------------------
     Global UBnuxState is the source of truth.
  ========================================================= */

  function syncSelection() {

    try {

      if (
        window.UBnuxState &&
        typeof
          window.UBnuxState
            .getSelection ===
          "function"
      ) {

        const selected =
          window
            .UBnuxState
            .getSelection();


        if (
          selected
        ) {

          state.selectedState =
            clean(
              selected.state
            );


          state.selectedDistrict =
            clean(
              selected.district
            );


          state.selectedCategory =
            clean(
              selected.category
            );


          if (
            selected.sort
          ) {

            state.selectedSort =
              clean(
                selected.sort
              ) ||
              DEFAULT_SORT;

          }

        }

      }

    } catch (error) {

      console.warn(
        "UBnux business selection sync failed:",
        error
      );

    }

  }


  /* =========================================================
     SELECTION VALIDATION
  ========================================================= */

  function hasValidSelection() {

    return Boolean(

      state.selectedState &&
      state.selectedDistrict &&
      state.selectedCategory

    );

  }


  /* =========================================================
     RESET LIST
  ========================================================= */

  function resetList() {

    state.businesses =
      [];

    state.currentPage =
      1;

    state.total =
      0;

    state.hasMore =
      false;

  }


  /* =========================================================
     BUSINESS PAGE SAFETY
     ---------------------------------------------------------
     Never load listing data on a business SEO URL.
  ========================================================= */

  function isBusinessSEOPage() {

    try {

      if (
        window.UBnuxApp &&
        typeof
          window.UBnuxApp
            .isBusinessPage ===
          "function"
      ) {

        if (
          window
            .UBnuxApp
            .isBusinessPage()
        ) {

          return true;

        }

      }


      const pathname =
        (
          window.location &&
          window.location.pathname
        ) || "";


      const parts =
        pathname
          .split("/")
          .filter(
            function (item) {

              return Boolean(
                clean(item)
              );

            }
          );


      return (
        parts.length === 5 &&
        parts[0].toLowerCase() ===
          "in"
      );

    } catch (error) {

      return false;

    }

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


    /* =====================================================
       BUSINESS PAGE PROTECTION
    ===================================================== */

    if (
      isBusinessSEOPage()
    ) {

      console.debug(
        "UBnux: Business SEO page detected. Business listing load skipped."
      );

      return;

    }


    /* =====================================================
       SYNC SELECTION
    ===================================================== */

    syncSelection();


    /* =====================================================
       VALIDATE SELECTION
    ===================================================== */

    if (
      !hasValidSelection()
    ) {

      resetList();

      renderBusinesses();

      return;

    }


    /* =====================================================
       PREVENT CONCURRENT REQUEST
    ===================================================== */

    if (
      state.isLoading
    ) {

      return;

    }


    /* =====================================================
       REQUEST ID
       -----------------------------------------------------
       Protects against stale responses.
    ===================================================== */

    const requestId =
      ++state.lastRequestId;


    state.isLoading =
      true;


    const page =
      append
        ? state.currentPage + 1
        : 1;


    if (
      !append
    ) {

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

      /* ===================================================
         API
      =================================================== */

      if (
        !window.UBnuxAPI ||
        typeof
          window.UBnuxAPI
            .getBusinesses !==
          "function"
      ) {

        throw new Error(
          "UBnux API is not available."
        );

      }


      const response =
        await window
          .UBnuxAPI
          .getBusinesses({

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


      /* ===================================================
         STALE RESPONSE CHECK
      =================================================== */

      if (
        requestId !==
        state.lastRequestId
      ) {

        return;

      }


      const normalized =
        normalizeResponse(
          response
        );


      const incomingBusinesses =
        deduplicateBusinesses(
          normalized.businesses
        );


      /* ===================================================
         APPEND
      =================================================== */

      if (
        append
      ) {

        state.businesses =
          deduplicateBusinesses(
            state.businesses.concat(
              incomingBusinesses
            )
          );

      } else {

        state.businesses =
          incomingBusinesses;

      }


      state.currentPage =
        normalized.page;


      state.total =
        normalized.total;


      state.hasMore =
        normalized.hasMore;


      state.lastLoadedAt =
        Date.now();


      renderBusinesses();


    } catch (error) {

      /* ===================================================
         IGNORE STALE ERROR
      =================================================== */

      if (
        requestId !==
        state.lastRequestId
      ) {

        return;

      }


      console.error(
        "UBnux business loading error:",
        error
      );


      if (
        !append
      ) {

        resetList();


        if (
          businessGrid
        ) {

          businessGrid.innerHTML = `
            <div
              class="business-error"
              role="alert"
            >

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


          if (
            retryButton
          ) {

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

      /*
       * Only the latest request may release loading state.
       */

      if (
        requestId ===
        state.lastRequestId
      ) {

        state.isLoading =
          false;

        updateSummary();

        updateLoadMore();

      }

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

        if (
          state.isLoading
        ) {

          return;

        }


        if (
          !state.hasMore
        ) {

          return;

        }


        loadBusinesses(
          true
        );

      }
    );

  }


  /* =========================================================
     SORT CHANGE
     ---------------------------------------------------------
     app.js owns actual sorting event.
     This module only syncs the value.
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
        detail.state !==
        undefined
      ) {

        state.selectedState =
          clean(
            detail.state
          );

      }


      if (
        detail.district !==
        undefined
      ) {

        state.selectedDistrict =
          clean(
            detail.district
          );

      }


      if (
        detail.category !==
        undefined
      ) {

        state.selectedCategory =
          clean(
            detail.category
          );

      }


      if (
        detail.sort !==
        undefined
      ) {

        state.selectedSort =
          clean(
            detail.sort
          ) ||
          DEFAULT_SORT;

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
      options ||
      {};


    if (
      options.state !==
      undefined
    ) {

      state.selectedState =
        clean(
          options.state
        );

    }


    if (
      options.district !==
      undefined
    ) {

      state.selectedDistrict =
        clean(
          options.district
        );

    }


    if (
      options.category !==
      undefined
    ) {

      state.selectedCategory =
        clean(
          options.category
        );

    }


    if (
      options.sort !==
      undefined
    ) {

      state.selectedSort =
        clean(
          options.sort
        ) ||
        DEFAULT_SORT;

    }

  }


  /* =========================================================
     PUBLIC RESET
  ========================================================= */

  function reset() {

    /*
     * Invalidate active request.
     */

    state.lastRequestId +=
      1;


    state.isLoading =
      false;


    resetList();


    renderBusinesses();

  }


  /* =========================================================
     PUBLIC REFRESH
  ========================================================= */

  async function refresh() {

    return loadBusinesses(
      false
    );

  }


  /* =========================================================
     PUBLIC API
  ========================================================= */

  window.UBnuxBusinesses = {

    version:
      VERSION,

    state:

      state,

    loadBusinesses:

      loadBusinesses,

    refresh:

      refresh,

    reset:

      reset,

    renderBusinesses:

      renderBusinesses,

    setSelection:

      setSelection,

    getBusinessURL:

      getBusinessURL,

    getBusinesses:
      function () {

        return state.businesses.slice();

      },

    getState:
      function () {

        return {

          ...state,

          businesses:
            state.businesses.slice()

        };

      }

  };


  /* =========================================================
     DEBUG
  ========================================================= */

  if (
    window.console &&
    typeof
      window.console.debug ===
      "function"
  ) {

    window.console.debug(
      "[UBnux Businesses] Initialized.",
      {
        version:
          VERSION,

        pageSize:
          PAGE_SIZE,

        defaultSort:
          DEFAULT_SORT

      }
    );

  }


})(window, document);

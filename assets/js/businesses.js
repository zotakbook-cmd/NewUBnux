/* =========================================================
   UBnux - Business Listing Manager
   File: assets/js/businesses.js
   Version: 5.0.0

   STATIC-FIRST ARCHITECTURE
   ---------------------------------------------------------
   IMPORTANT:

   This module NEVER loads businesses automatically
   when the homepage opens.

   Business data is requested ONLY when:
   - User searches
   - User selects State / District / Category
   - User clicks Load More
   - Another module explicitly calls loadBusinesses()

   Initial homepage:
      HTML
       ↓
      Static master data
       ↓
      No business API call

   User action:
      Search / Filter
       ↓
      loadBusinesses()
       ↓
      API / future static index
       ↓
      Business results

   RESPONSIBILITIES:
   ---------------------------------------------------------
   - Business loading on demand
   - Business card rendering
   - Business count
   - Pagination
   - Load More
   - Sorting
   - Skeleton loading
   - Empty state
   - Error state
   - Retry
   - Response normalization
   - Selection synchronization
   - SEO business URL generation
   - Duplicate protection
   - Stale response protection

   DOES NOT:
   ---------------------------------------------------------
   - Load business data on initial page load
   - Start API request automatically
   - Control Smart Search logic
   - Modify browser URL
   - Redirect
   - Own district/category data

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
    "5.0.0";


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

    nextCursor: "",

    isLoading: false,

    selectedState: "",

    selectedDistrict: "",

    selectedCategory: "",

    selectedSort:
      DEFAULT_SORT,

    lastRequestId: 0,

    lastLoadedAt: 0,

    hasUserRequestedData: false

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


    if (image) {

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
  ========================================================= */

  function getBusinessURL(
    business
  ) {

    if (
      !business
    ) {

      return "#";

    }


    /* =======================================================
       BACKEND CANONICAL URL
    ======================================================= */

    const backendSEOPath =
      clean(
        business.SEOPath ||
        business.seoPath ||
        business.CanonicalURL ||
        business.canonicalURL ||
        business.canonicalPath ||
        business.url ||
        business.URL
      );


    if (
      backendSEOPath
    ) {

      try {

        const parsed =
          new URL(
            backendSEOPath,
            window.location.origin
          );


        if (
          parsed.origin ===
            window.location.origin &&
          parsed.pathname
            .indexOf("/in/") === 0
        ) {

          return parsed.pathname;

        }

      } catch (error) {

        console.warn(
          "UBnux: Invalid backend SEOPath; using selection fallback.",
          error
        );

      }

    }


    /* =======================================================
       GET GLOBAL SELECTION
    ======================================================= */

    let selected = null;


    try {

      if (
        window.UBnuxState &&
        typeof
          window.UBnuxState.getSelection ===
            "function"
      ) {

        selected =
          window.UBnuxState.getSelection();

      }

    } catch (error) {

      selected = null;

    }


    /* =======================================================
       STATE NAME RESOLUTION
    ======================================================= */

    let selectedStateName =
      clean(
        selected &&
        (
          selected.stateName ||
          selected.StateName
        )
      );


    if (
      !selectedStateName &&
      selected &&
      selected.state
    ) {

      try {

        const stateList =
          window.UBnuxState &&
          window.UBnuxState.state &&
          Array.isArray(
            window.UBnuxState.state.states
          )
            ? window.UBnuxState.state.states
            : [];


        const stateItem =
          stateList.find(
            function (item) {

              return String(
                item.StateCode ||
                item.stateCode ||
                item.Code ||
                item.code ||
                ""
              )
                .trim()
                .toUpperCase() ===
                String(
                  selected.state
                )
                  .trim()
                  .toUpperCase();

            }
          );


        if (
          stateItem
        ) {

          selectedStateName =
            clean(
              stateItem.State ||
              stateItem.StateName ||
              stateItem.name
            );

        }

      } catch (error) {

        /* Keep fallback sources. */

      }

    }


    /* =======================================================
       SLUGS
    ======================================================= */

    const stateSlug =
      normalizeSlug(
        business.StateSlug ||
        business.stateSlug ||
        business.State ||
        business.state ||
        selectedStateName
      );


    const districtSlug =
      normalizeSlug(
        business.DistrictSlug ||
        business.districtSlug ||
        business.District ||
        business.district ||
        (
          selected &&
          (
            selected.districtName ||
            selected.DistrictName ||
            selected.district
          )
        )
      );


    const categorySlug =
      normalizeSlug(
        business.CategorySlug ||
        business.categorySlug ||
        business.Category ||
        business.category ||
        (
          selected &&
          (
            selected.categorySlug ||
            selected.category
          )
        )
      );


    const businessSlug =
      normalizeSlug(
        business.Slug ||
        business.slug ||
        business.BusinessSlug ||
        business.businessSlug
      );


    /* =======================================================
       VALIDATION
    ======================================================= */

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
            businessSlug,

          Selection:
            selected

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
     NORMALIZE RESPONSE
  ========================================================= */

  function normalizeResponse(
    response
  ) {

    response =
      response || {};


    let businesses =
      [];


    /*
     * Supported formats:
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


    const pagination =
      response.pagination ||
      (
        response.data &&
        response.data.pagination
      ) ||
      {};


    const page =
      safeNumber(
        response.page !== undefined
          ? response.page
          : (
              pagination.page !== undefined
                ? pagination.page
                : (
                    response.data &&
                    response.data.page
                  )
            ),
        state.currentPage
      );


    const total =
      safeNumber(
        response.total !== undefined
          ? response.total
          : (
              pagination.total !== undefined
                ? pagination.total
                : (
                    response.data &&
                    response.data.total !== undefined
                      ? response.data.total
                      : businesses.length
                  )
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
      pagination.hasMore !== undefined
    ) {

      hasMore =
        Boolean(
          pagination.hasMore
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


    const nextCursor =
      clean(
        response.nextCursor ||
        pagination.nextCursor ||
        (
          response.data &&
          response.data.nextCursor
        ) ||
        (
          response.data &&
          response.data.pagination &&
          response.data.pagination.nextCursor
        )
      );


    return {

      businesses:
        Array.isArray(
          businesses
        )
          ? businesses
          : [],

      page,

      total,

      hasMore,

      nextCursor

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
     DEDUPLICATE
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
     SYNC GLOBAL SELECTION
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


    state.nextCursor =
      "";

  }


  /* =========================================================
     BUSINESS SEO PAGE SAFETY
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
     
     IMPORTANT:
     ---------------------------------------------------------
     This function is NOT called automatically.

     It only runs when another module explicitly requests
     business data.
  ========================================================= */


  /* =========================================================
     STATIC BUSINESS SOURCE
  ========================================================= */
  const STATIC_BUSINESS_INDEX_URL =
    (window.UBnuxConfig && window.UBnuxConfig.BUSINESS_INDEX_JSON_URL) ||
    "/assets/data/business-index.json";
  const STATIC_BUSINESS_MANIFEST_URL =
    (window.UBnuxConfig && window.UBnuxConfig.BUSINESS_MANIFEST_JSON_URL) ||
    "/assets/data/business-manifest.json";
  const STATIC_DISTRICT_INDEX_URL =
    (window.UBnuxConfig && window.UBnuxConfig.DISTRICT_BUSINESS_INDEX_JSON_URL) ||
    "/assets/data/district-index.json";
  const STATIC_CATEGORY_INDEX_URL =
    (window.UBnuxConfig && window.UBnuxConfig.CATEGORY_BUSINESS_INDEX_JSON_URL) ||
    "/assets/data/category-index.json";

  let staticIndexPromise = null;
  let staticDistrictIndexPromise = null;
  let staticCategoryIndexPromise = null;
  const staticChunkCache = new Map();

  function staticFetchJSON(url) {
    return fetch(url, {
      method: "GET",
      credentials: "same-origin",
      cache: "force-cache",
      headers: { Accept: "application/json" }
    }).then(function (response) {
      if (!response.ok) throw new Error("Static data HTTP " + response.status);
      return response.json();
    });
  }

  function getStaticBusinessIndex() {
    if (!staticIndexPromise) staticIndexPromise = staticFetchJSON(STATIC_BUSINESS_INDEX_URL);
    return staticIndexPromise;
  }

  function getStaticDistrictIndex() {
    if (!staticDistrictIndexPromise) staticDistrictIndexPromise = staticFetchJSON(STATIC_DISTRICT_INDEX_URL);
    return staticDistrictIndexPromise;
  }

  function getStaticCategoryIndex() {
    if (!staticCategoryIndexPromise) staticCategoryIndexPromise = staticFetchJSON(STATIC_CATEGORY_INDEX_URL);
    return staticCategoryIndexPromise;
  }

  function loadStaticDistrictChunk(district) {
    const key = String(district || "").toLowerCase().trim();
    if (!key) return Promise.resolve([]);
    if (staticChunkCache.has(key)) return staticChunkCache.get(key);
    const promise = getStaticDistrictIndex().then(function (data) {
      const rows = Array.isArray(data && data.districts) ? data.districts : [];
      const row = rows.find(function (x) {
        return [x.district, x.Slug, x.districtId, x.DistrictID, x.DistrictCode]
          .some(function (v) { return String(v || "").toLowerCase() === key; });
      });
      if (!row || !row.file) return [];
      return staticFetchJSON(row.file).then(function (chunk) {
        return Array.isArray(chunk && chunk.businesses) ? chunk.businesses : [];
      });
    });
    staticChunkCache.set(key, promise);
    return promise;
  }

  function normalizeStaticBusiness(row) {
    if (!row) return null;
    return Object.assign({}, row, {
      BusinessID: row.BusinessID || row.id,
      BusinessName: row.BusinessName || row.name,
      Slug: row.Slug || row.slug,
      DistrictName: row.DistrictName || row.district,
      CategoryName: row.CategoryName || row.category,
      ShortDescription: row.ShortDescription || row.short,
      Rating: row.Rating == null ? row.rating : row.Rating,
      ReviewCount: row.ReviewCount == null ? row.reviews : row.ReviewCount
    });
  }

  async function getStaticBusinesses(params) {
    params = params || {};
    const district = String(params.district || "").toLowerCase().trim();
    const category = String(params.category || "").toLowerCase().trim();
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || PAGE_SIZE);

    let rows = [];
    if (district) {
      rows = await loadStaticDistrictChunk(district);
    } else {
      const index = await getStaticBusinessIndex();
      rows = Array.isArray(index && index.businesses) ? index.businesses : [];
    }

    if (category) {
      rows = rows.filter(function (row) {
        const value = String(row.category || row.CategoryName || row.categoryId || row.CategoryID || "").toLowerCase();
        return value === category || value.indexOf(category) !== -1;
      });
      if (!rows.length) {
        try {
          const catIndex = await getStaticCategoryIndex();
          let ids = (catIndex.categories && catIndex.categories[category]) || [];
          if (!ids.length && catIndex.categories) {
            const matchingKey = Object.keys(catIndex.categories).find(function (k) { return String(k).toLowerCase() === category; });
            if (matchingKey) ids = catIndex.categories[matchingKey] || [];
          }
          if (ids.length) {
            const set = new Set(ids.map(String));
            const index = await getStaticBusinessIndex();
            rows = (index.businesses || []).filter(function (r) { return set.has(String(r.id || r.BusinessID)); });
          }
        } catch (e) {}
      }
    }

    rows = rows.map(normalizeStaticBusiness).filter(Boolean);
    rows.sort(function (a, b) {
      if (String(params.sort || "featured") === "featured") return Number(Boolean(b.Featured || b.featured)) - Number(Boolean(a.Featured || a.featured));
      return String(a.BusinessName || "").localeCompare(String(b.BusinessName || ""));
    });
    const start = (page - 1) * limit;
    return {
      success: true,
      source: "static",
      businesses: rows.slice(start, start + limit),
      total: rows.length,
      page: page,
      limit: limit,
      hasMore: start + limit < rows.length,
      nextCursor: ""
    };
  }

  async function loadBusinesses(
    append,
    forcedSelection
  ) {

    append =
      Boolean(
        append
      );


    /* =======================================================
       BUSINESS SEO PAGE PROTECTION
    ======================================================= */

    if (
      isBusinessSEOPage()
    ) {

      console.debug(
        "UBnux: Business SEO page detected. Listing load skipped."
      );


      return;

    }


    /* =======================================================
       SELECTION
    ======================================================= */

    if (
      forcedSelection &&
      typeof forcedSelection ===
        "object"
    ) {

      state.selectedState =
        clean(
          forcedSelection.state
        );


      state.selectedDistrict =
        clean(
          forcedSelection.district
        );


      state.selectedCategory =
        clean(
          forcedSelection.category
        );


      if (
        forcedSelection.sort
      ) {

        state.selectedSort =
          clean(
            forcedSelection.sort
          ) ||
          DEFAULT_SORT;

      }

    } else {

      syncSelection();

    }


    console.debug(
      "[UBnux Businesses] loadBusinesses selection:",
      {
        state:
          state.selectedState,

        district:
          state.selectedDistrict,

        category:
          state.selectedCategory,

        sort:
          state.selectedSort,

        forced:
          Boolean(forcedSelection)
      }
    );


    /* =======================================================
       VALIDATE
    ======================================================= */

    if (
      !hasValidSelection()
    ) {

      console.warn(
        "[UBnux Businesses] Invalid selection. Request skipped.",
        {
          state:
            state.selectedState,

          district:
            state.selectedDistrict,

          category:
            state.selectedCategory
        }
      );


      resetList();

      renderBusinesses();

      return;

    }


    /* =======================================================
       PREVENT CONCURRENT REQUEST
    ======================================================= */

    if (
      state.isLoading
    ) {

      return;

    }


    /* =======================================================
       THIS IS A USER / MODULE REQUEST
       -------------------------------------------------------
       From this point business data is allowed to load.
    ======================================================= */

    state.hasUserRequestedData =
      true;


    /* =======================================================
       REQUEST ID
    ======================================================= */

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


      state.nextCursor =
        "";


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

      /* =====================================================
         STATIC-FIRST BUSINESS LOAD
         API is retained only as a fallback when static data is
         unavailable or does not contain the requested dataset.
      ===================================================== */
      const requestParams = {
        state: state.selectedState,
        district: state.selectedDistrict,
        category: state.selectedCategory,
        page: page,
        limit: PAGE_SIZE,
        sort: state.selectedSort
      };

      let response;
      try {
        response = await getStaticBusinesses(requestParams);
        console.debug("[UBnux Businesses] Static response:", response);
      } catch (staticError) {
        console.warn("[UBnux Businesses] Static data unavailable; using API fallback.", staticError);
        if (!window.UBnuxAPI || typeof window.UBnuxAPI.getBusinesses !== "function") {
          throw staticError;
        }
        const apiParams = Object.assign({}, requestParams);
        if (append && state.nextCursor) apiParams.cursor = state.nextCursor;
        response = await window.UBnuxAPI.getBusinesses(apiParams);
        console.debug("[UBnux Businesses] API fallback response:", response);
      }

      console.debug(
        "[UBnux Businesses] API response:",
        response
      );


      /* =====================================================
         NORMALIZE
      ===================================================== */

      const normalized =
        normalizeResponse(
          response
        );


      console.debug(
        "[UBnux Businesses] API result:",
        {
          received:
            normalized.businesses.length,

          total:
            normalized.total,

          page:
            normalized.page,

          hasMore:
            normalized.hasMore,

          nextCursor:
            normalized.nextCursor
        }
      );


      /* =====================================================
         STALE RESPONSE CHECK
      ===================================================== */

      if (
        requestId !==
        state.lastRequestId
      ) {

        return;

      }


      const incomingBusinesses =
        deduplicateBusinesses(
          normalized.businesses
        );


      /* =====================================================
         APPEND
      ===================================================== */

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


      state.nextCursor =
        normalized.nextCursor;


      state.lastLoadedAt =
        Date.now();


      /* =====================================================
         GLOBAL STATE SYNC
      ===================================================== */

      if (
        window.UBnuxState
      ) {

        if (
          typeof
            window.UBnuxState
              .setBusinesses ===
            "function"
        ) {

          window.UBnuxState.setBusinesses(
            state.businesses
          );

        }


        if (
          typeof
            window.UBnuxState
              .setPagination ===
            "function"
        ) {

          window.UBnuxState.setPagination(
            {
              page:
                state.currentPage,

              total:
                state.total,

              hasMore:
                state.hasMore,

              nextCursor:
                state.nextCursor
            }
          );

        }

      }


      renderBusinesses();


      document.dispatchEvent(
        new CustomEvent(
          "ubnux:businessesloaded",
          {
            detail: {
              businesses:
                state.businesses.slice(),

              page:
                state.currentPage,

              total:
                state.total,

              hasMore:
                state.hasMore,

              nextCursor:
                state.nextCursor
            }
          }
        )
      );


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


      document.dispatchEvent(
        new CustomEvent(
          "ubnux:businesseserror",
          {
            detail: {
              error:
                error
            }
          }
        )
      );


    } finally {

      /*
       * Only latest request releases loading.
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
     SELECTION CHANGE
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
     PUBLIC SET SELECTION
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


    state.hasUserRequestedData =
      false;


    resetList();


    if (
      window.UBnuxState &&
      typeof
        window.UBnuxState
          .resetBusinesses ===
        "function"
    ) {

      window.UBnuxState.resetBusinesses();

    }


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

      },

    hasUserRequestedData:
      function () {

        return Boolean(
          state.hasUserRequestedData
        );

      }

  };


  /* =========================================================
     INITIALIZATION
     
     VERY IMPORTANT:
     ---------------------------------------------------------
     No loadBusinesses() here.
     No API call here.
     No business JSON call here.

     Homepage remains business-data free until
     user/module explicitly requests it.
  ========================================================= */

  if (
    window.console &&
    typeof
      window.console.debug ===
      "function"
  ) {

    window.console.debug(
      "[UBnux Businesses] Initialized in static-first mode.",
      {
        version:
          VERSION,

        pageSize:
          PAGE_SIZE,

        defaultSort:
          DEFAULT_SORT,

        initialBusinessLoad:
          false
      }
    );

  }


})(window, document);
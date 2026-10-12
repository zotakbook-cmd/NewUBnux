/* =========================================================
   UBnux Smart Search Frontend
   File: assets/js/smart-search.js
   Version: 1.2.0

   Connects:
   Browser URL / search form
        ↓
   UBnuxAPI.smartSearch()
        ↓
   Cloudflare /api
        ↓
   GAS SmartSearchEngine
        ↓
   district-wise Google Sheets

   Supports:
   /siwan/
   /fashion/
   /siwan/fashion/
   /green-india-siwan/
   /siwaan-fashon-siwan/
   plus search form submission.

   Business SEO URLs (/in/...) and short business URLs are never
   intercepted.
========================================================= */

(function (window, document) {
  "use strict";

  var CONFIG = {
    PAGE_SIZE: 50,
    ROOT_ID: "ubnuxSmartSearch",
    SEARCH_IDS: [
      "searchInput",
      "globalSearchInput",
      "mainSearchInput",
      "businessSearchInput",
      "searchBox",
      "search"
    ],
    FORM_IDS: [
      "searchForm",
      "globalSearchForm",
      "mainSearchForm",
      "businessSearchForm"
    ]
  };

  var state = {
    active: false,
    query: "",
    nextCursor: "",
    hasMore: false,
    loading: false,
    requestId: 0,
    firstResponse: null
  };

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function slugify(value) {
    return clean(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getAPI() {
    return window.UBnuxAPI || window.ZilaBizAPI || null;
  }

  function getPathParts() {
    var path = (window.location.pathname || "/")
      .split("?")[0]
      .split("#")[0]
      .split("/")
      .filter(Boolean)
      .map(function (item) {
        try {
          return decodeURIComponent(item);
        } catch (e) {
          return item;
        }
      })
      .map(slugify);

    return path;
  }

  function isProtectedRoute() {
    var parts = getPathParts();

    if (!parts.length) return false;

    if (parts[0] === "in") return true;

    try {
      if (
        window.UBNUX_SEO_ROUTER &&
        typeof window.UBNUX_SEO_ROUTER.isBusinessPage === "function" &&
        window.UBNUX_SEO_ROUTER.isBusinessPage()
      ) {
        return true;
      }
    } catch (e) {}

    var reserved = [
      "business",
      "search",
      "about",
      "contact",
      "privacy",
      "privacy-policy",
      "terms",
      "login",
      "admin",
      "api",
      "assets",
      "sitemap",
      "sitemap.xml",
      "robots.txt"
    ];

    return reserved.indexOf(parts[0]) !== -1;
  }

  function isSmartRoute() {
    if (isProtectedRoute()) return false;

    var parts = getPathParts();

    if (!parts.length) return false;

    /*
     * A one/two/multi-segment public path is treated as a smart
     * search route. Short business URLs are excluded above.
     */
    return parts.length >= 1 && parts.length <= 4;
  }

  function getRouteQuery() {
    var parts = getPathParts();

    if (!parts.length) return "";

    return parts.join("-");
  }

  function getBusinessGrid() {
    return document.getElementById("businessGrid");
  }

  function getSummary() {
    return document.getElementById("businessSummary");
  }

  function getEmptyState() {
    return document.getElementById("emptyState");
  }

  function getLoadMoreWrapper() {
    return document.getElementById("loadMoreWrapper");
  }

  function getLoadMoreButton() {
    return document.getElementById("loadMoreButton");
  }

  function getPageLoader() {
    return document.getElementById("pageLoader");
  }

  function getLoaderText() {
    return document.getElementById("loaderText");
  }

  function showPageLoader(message) {
    var loader = getPageLoader();
    var text = getLoaderText();

    if (text) text.textContent = message || "Searching UBnux...";
    if (loader) loader.classList.remove("hidden");
  }

  function hidePageLoader() {
    var loader = getPageLoader();
    if (loader) loader.classList.add("hidden");
  }

  function getSearchInput() {
    for (var i = 0; i < CONFIG.SEARCH_IDS.length; i++) {
      var el = document.getElementById(CONFIG.SEARCH_IDS[i]);
      if (el && (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA"
      )) {
        return el;
      }
    }

    var selector = [
      'input[type="search"]',
      'input[name="search"]',
      'input[name="q"]',
      '[data-ubnux-search]'
    ].join(",");

    return document.querySelector(selector);
  }

  function getSearchForm() {
    for (var i = 0; i < CONFIG.FORM_IDS.length; i++) {
      var form = document.getElementById(CONFIG.FORM_IDS[i]);
      if (form && form.tagName === "FORM") return form;
    }

    var input = getSearchInput();
    return input ? input.closest("form") : null;
  }

  function ensureSearchUI() {
    var existingInput = getSearchInput();
    var existingForm = getSearchForm();

    if (existingInput) {
      existingInput.setAttribute("autocomplete", "off");
      existingInput.setAttribute("data-ubnux-smart-search", "true");

      if (!existingInput.getAttribute("placeholder")) {
        existingInput.setAttribute(
          "placeholder",
          "Search businesses, services, shops..."
        );
      }

      return existingInput;
    }

    var home = document.getElementById("homePage");
    if (!home) return null;

    var root = document.createElement("section");
    root.id = CONFIG.ROOT_ID;
    root.className = "ubnux-smart-search";

    root.innerHTML =
      '<div class="ubnux-smart-search-inner">' +
        '<form id="ubnuxSmartSearchForm" class="ubnux-smart-search-form" role="search">' +
          '<span class="ubnux-smart-search-icon" aria-hidden="true">⌕</span>' +
          '<input id="ubnuxSmartSearchInput" type="search" ' +
            'autocomplete="off" spellcheck="false" ' +
            'placeholder="Search businesses, services, shops..." ' +
            'aria-label="Search businesses">' +
          '<button type="submit">Search</button>' +
        '</form>' +
        '<div id="ubnuxSmartSearchHint" class="ubnux-smart-search-hint">' +
          'Try: <b>Siwan</b>, <b>Fashion</b>, <b>Siwan Fashion</b> or a business name' +
        '</div>' +
      '</div>';

    /*
     * Insert after the first major child when possible so the
     * existing header/hero structure is not destroyed.
     */
    var firstSection = home.querySelector("section");
    if (firstSection && firstSection.parentNode === home) {
      firstSection.insertAdjacentElement("afterend", root);
    } else {
      home.insertBefore(root, home.firstChild);
    }

    return document.getElementById("ubnuxSmartSearchInput");
  }

  function bindSearchForm() {
    var input = ensureSearchUI();
    if (!input) return;

    var form = getSearchForm();

    if (!form) {
      form = document.getElementById("ubnuxSmartSearchForm");
    }

    if (!form || form.getAttribute("data-ubnux-bound") === "1") {
      return;
    }

    form.setAttribute("data-ubnux-bound", "1");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var query = clean(input.value);

      if (!query) {
        input.focus();
        return;
      }

      navigateToSearch(query);
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        input.value = "";
        input.blur();
      }
    });
  }

  function navigateToSearch(query) {
    var slug = slugify(query);

    if (!slug) return;

    var target = "/" + slug + "/";

    if (
      window.location.pathname.replace(/\/+$/, "") !==
      target.replace(/\/+$/, "")
    ) {
      window.history.pushState(
        { ubnuxSmartSearch: true, query: query },
        "",
        target
      );
    }

    run(query);
  }

  function getResultBusiness(item) {
    if (!item) return null;

    var business = item.business || item.Business || item;

    if (!business || typeof business !== "object") {
      return null;
    }

    /*
     * SmartSearchEngine returns the canonical match separately.
     * Copy those values onto the business object so the existing
     * business card renderer can build /in/.../ URLs normally.
     */
    var match = item.match || {};

    if (!business.StateSlug && match.state) {
      business.StateSlug = match.state;
    }

    if (!business.DistrictSlug && match.district) {
      business.DistrictSlug = match.district;
    }

    if (!business.CategorySlug && match.category) {
      business.CategorySlug = match.category;
    }

    if (!business.Slug && match.business) {
      business.Slug = match.business;
    }

    return business;
  }

  function normalizeResponse(response) {
    response = response || {};

    var raw =
      Array.isArray(response.results)
        ? response.results
        : (
          response.data &&
          Array.isArray(response.data.results)
            ? response.data.results
            : (
              Array.isArray(response.businesses)
                ? response.businesses
                : []
            )
        );

    var businesses = raw
      .map(getResultBusiness)
      .filter(Boolean);

    var rawTotal =
      response.total !== undefined
        ? response.total
        : (response.data && response.data.total !== undefined
            ? response.data.total
            : null);

    var total =
      rawTotal === null || rawTotal === ""
        ? null
        : Number(rawTotal);

    if (!Number.isFinite(total)) total = null;

    var hasMore =
      response.hasMore !== undefined
        ? Boolean(response.hasMore)
        : Boolean(
            response.data &&
            response.data.hasMore
          );

    var nextCursor =
      clean(
        response.nextCursor ||
        (response.data && response.data.nextCursor)
      );

    return {
      businesses: businesses,
      total: total,
      hasMore: hasMore,
      nextCursor: nextCursor
    };
  }

  function updateBusinessesState(items, append, total, hasMore) {
    var businessesAPI = window.UBnuxBusinesses;

    if (!businessesAPI || !businessesAPI.state) {
      throw new Error("UBnux business renderer is not loaded.");
    }

    var businessState = businessesAPI.state;

    if (!append) {
      businessState.businesses = [];
    }

    var existing = businessState.businesses || [];
    var seen = {};

    existing.forEach(function (item) {
      var key =
        clean(
          item.BusinessID ||
          item.businessID ||
          item.id ||
          item.Slug ||
          item.slug ||
          item.BusinessName ||
          item.Name
        ).toLowerCase();

      if (key) seen[key] = true;
    });

    items.forEach(function (item) {
      var key =
        clean(
          item.BusinessID ||
          item.businessID ||
          item.id ||
          item.Slug ||
          item.slug ||
          item.BusinessName ||
          item.Name
        ).toLowerCase();

      if (!key || !seen[key]) {
        existing.push(item);
        if (key) seen[key] = true;
      }
    });

    businessState.businesses = existing;
    businessState.total = Number(total) || existing.length;
    businessState.hasMore = Boolean(hasMore);
    businessState.isLoading = false;

    businessesAPI.renderBusinesses();
  }

  function setSummary(total, shown, loading, hasMore) {
    var el = getSummary();
    if (!el) return;

    if (loading) {
      el.textContent = "Searching...";
      return;
    }

    if (!shown) {
      el.textContent = "0 businesses found";
      return;
    }

    /* Global/category search is cursor based; total is intentionally
       not calculated by scanning every district on every request. */
    if (total !== null && total !== undefined) {
      el.textContent =
        "Showing " + shown + " of " + total + " businesses";
    } else if (hasMore) {
      el.textContent =
        "Showing " + shown + " businesses • More available";
    } else {
      el.textContent =
        "Showing " + shown + " businesses";
    }
  }

  function setLoadMore(hasMore, loading) {
    var wrapper = getLoadMoreWrapper();
    var button = getLoadMoreButton();

    if (!wrapper || !button) return;

    if (hasMore) {
      wrapper.hidden = false;
      wrapper.classList.remove("hidden");
      button.disabled = Boolean(loading);
      button.textContent = loading
        ? "Loading..."
        : "Load More";
    } else {
      wrapper.hidden = true;
      wrapper.classList.add("hidden");
    }
  }

  function setEmpty(show, message) {
    var el = getEmptyState();

    if (!el) return;

    el.hidden = !show;
    el.classList.toggle("hidden", !show);

    if (show) {
      var title = el.querySelector("h3");
      var text = el.querySelector("p");

      if (title) title.textContent = "No businesses found";
      if (text) {
        text.textContent =
          message ||
          "We couldn't find businesses for this search.";
      }
    }
  }

  function updateSEO(query, response) {
    var title =
      query
        ? query.replace(/\b\w/g, function (m) {
            return m.toUpperCase();
          }) + " Businesses | UBnux"
        : "Local Businesses | UBnux";

    var description =
      "Find local businesses, shops, services and professionals for " +
      query +
      " on UBnux.";

    document.title = title;

    var meta = document.querySelector(
      'meta[name="description"]'
    );

    if (meta) meta.setAttribute("content", description);

    /*
     * Dynamic smart-search URLs are intentionally noindex.
     * Permanent business URLs remain indexable through /in/...
     */
    var robots = document.getElementById("robotsMeta");

    if (!robots) {
      robots = document.querySelector(
        'meta[name="robots"]'
      );
    }

    if (robots) {
      robots.setAttribute(
        "content",
        "noindex,follow,max-image-preview:large"
      );
    }

    var canonical =
      document.getElementById("canonicalLink") ||
      document.querySelector('link[rel="canonical"]');

    if (canonical) {
      canonical.setAttribute(
        "href",
        window.location.origin +
        window.location.pathname
      );
    }

    var ogTitle = document.getElementById("ogTitle");
    var ogDescription = document.getElementById("ogDescription");
    var ogUrl = document.getElementById("ogUrl");

    if (ogTitle) ogTitle.setAttribute("content", title);
    if (ogDescription) {
      ogDescription.setAttribute("content", description);
    }
    if (ogUrl) {
      ogUrl.setAttribute("content", window.location.href);
    }
  }

  function setSearchInputValue(query) {
    var input = getSearchInput();

    if (input) {
      input.value = query;
    }
  }

  async function run(query, options) {
    options = options || {};

    var API = getAPI();

    if (!API || typeof API.smartSearch !== "function") {
      console.error(
        "[UBnux Smart Search] UBnuxAPI.smartSearch() is not available."
      );
      return;
    }

    query = clean(query);

    if (!query) return;

    var requestId = ++state.requestId;

    state.active = true;
    state.query = query;
    state.nextCursor = "";
    state.hasMore = false;
    state.loading = true;
    state.firstResponse = null;

    setSearchInputValue(query);
    showPageLoader("Searching for " + query + "...");
    setSummary(0, 0, true);
    setLoadMore(false, true);

    try {
      var response = await API.smartSearch(
        {
          q: query,
          limit: CONFIG.PAGE_SIZE
        },
        {
          cache: false,
          limit: CONFIG.PAGE_SIZE
        }
      );

      if (requestId !== state.requestId) return;

      var normalized = normalizeResponse(response);

      state.firstResponse = response;
      state.nextCursor = normalized.nextCursor;
      state.hasMore = normalized.hasMore;
      state.loading = false;

      updateBusinessesState(
        normalized.businesses,
        false,
        normalized.total,
        normalized.hasMore
      );

      setSummary(
        normalized.total,
        normalized.businesses.length,
        false,
        normalized.hasMore
      );

      setLoadMore(
        normalized.hasMore,
        false
      );

      /*
       * Auto-load every cursor batch.
       * SmartSearchEngine returns results in cursor-based batches, so
       * the first response may contain only PAGE_SIZE businesses even
       * when many more businesses match the route/query.
       */
      if (
        normalized.businesses.length > 0 &&
        normalized.hasMore &&
        normalized.nextCursor
      ) {
        var autoPages = 0;
        while (
          state.hasMore &&
          state.nextCursor &&
          !state.loading &&
          requestId === state.requestId &&
          autoPages < 100
        ) {
          autoPages++;
          await next();
        }
      }

      var loadedState = window.UBnuxBusinesses && window.UBnuxBusinesses.state;
      setSummary(
        normalized.total,
        loadedState ? loadedState.businesses.length : normalized.businesses.length,
        false,
        state.hasMore
      );

      setLoadMore(state.hasMore, false);

      setEmpty(
        normalized.businesses.length === 0,
        "No businesses matched “" + query + "”. Try a district, category or business name."
      );

      updateSEO(query, response);

      var message = document.getElementById("selectionMessage");
      if (message) {
        message.textContent =
          normalized.total
            ? "Search results for " + query
            : "No results found for " + query;
      }

      var grid = getBusinessGrid();
      if (grid) {
        grid.scrollIntoView({
          behavior: options.noScroll ? "auto" : "smooth",
          block: "start"
        });
      }
    } catch (error) {
      if (requestId !== state.requestId) return;

      state.loading = false;
      state.nextCursor = "";
      state.hasMore = false;

      var businessesAPI = window.UBnuxBusinesses;

      if (
        businessesAPI &&
        businessesAPI.state
      ) {
        businessesAPI.state.businesses = [];
        businessesAPI.state.total = 0;
        businessesAPI.state.hasMore = false;
        businessesAPI.state.isLoading = false;

        try {
          businessesAPI.renderBusinesses();
        } catch (e) {}
      }

      setEmpty(
        true,
        error && error.message
          ? error.message
          : "Unable to search right now."
      );

      setLoadMore(false, false);

      console.error(
        "[UBnux Smart Search] Search failed:",
        error
      );
    } finally {
      if (requestId === state.requestId) {
        hidePageLoader();
      }
    }
  }

  async function next() {
    if (
      !state.active ||
      state.loading ||
      !state.nextCursor
    ) {
      return;
    }

    var API = getAPI();

    if (!API || typeof API.smartSearch !== "function") {
      return;
    }

    var requestId = state.requestId;

    state.loading = true;
    setLoadMore(true, true);

    try {
      var response = await API.smartSearch(
        {
          q: state.query,
          cursor: state.nextCursor,
          limit: CONFIG.PAGE_SIZE
        },
        {
          cache: false,
          limit: CONFIG.PAGE_SIZE
        }
      );

      if (requestId !== state.requestId) return;

      var normalized = normalizeResponse(response);

      state.nextCursor = normalized.nextCursor;
      state.hasMore = normalized.hasMore;
      state.loading = false;

      updateBusinessesState(
        normalized.businesses,
        true,
        normalized.total,
        normalized.hasMore
      );

      var businessState =
        window.UBnuxBusinesses &&
        window.UBnuxBusinesses.state;

      setSummary(
        normalized.total,
        businessState
          ? businessState.businesses.length
          : normalized.businesses.length,
        false,
        normalized.hasMore
      );

      setLoadMore(
        normalized.hasMore,
        false
      );
    } catch (error) {
      state.loading = false;
      setLoadMore(true, false);

      console.error(
        "[UBnux Smart Search] Next batch failed:",
        error
      );
    }
  }

  function bindLoadMore() {
    var button = getLoadMoreButton();

    if (!button || button.getAttribute("data-ubnux-smart-bound") === "1") {
      return;
    }

    button.setAttribute("data-ubnux-smart-bound", "1");

    button.addEventListener("click", function (event) {
      if (!state.active) return;

      event.preventDefault();
      next();
    });
  }

  function onPopState() {
    if (!isSmartRoute()) return;

    var query = getRouteQuery();

    if (query) {
      run(query, { noScroll: true });
    }
  }

  function initialize() {
    bindSearchForm();
    bindLoadMore();

    if (!isSmartRoute()) {
      return;
    }

    state.active = true;

    var query = getRouteQuery();

    if (query) {
      run(query, { noScroll: true });
    }
  }

  window.addEventListener("popstate", onPopState);

  /*
   * Expose a small public controller.
   */
  window.UBnuxSmartSearch = {
    version: "1.3.0",
    state: state,
    isSmartRoute: isSmartRoute,
    getRouteQuery: getRouteQuery,
    search: navigateToSearch,
    run: run,
    next: next
  };

  /*
   * Let app.js know that this URL belongs to the smart search
   * controller and must not run its normal directory bootstrap.
   */
  window.UBnuxSmartSearchRoute = isSmartRoute();

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }

})(window, document);

/* UBnux App v5.1.2 - resilient static bootstrap + loader failsafe */
(function (window, document) {
  "use strict";

  var app = {};
  var loaderTimer = null;

  /* =========================================================
     BASIC HELPERS
  ========================================================= */

  function el(id) {
    return document.getElementById(id);
  }

  function clean(v) {
    return String(v == null ? "" : v).trim();
  }

  function val(x) {
    return clean(x).toLowerCase();
  }

  function rows(x, key) {
    return Array.isArray(x)
      ? x
      : (x && Array.isArray(x[key]) ? x[key] : []);
  }

  /* =========================================================
     PAGE LOADER
     IMPORTANT: Prevent "Loading UBnux..." permanent lock
  ========================================================= */

  function hideLoader() {
    var loader = el("pageLoader");

    if (loader) {
      loader.classList.add("hidden");
      loader.setAttribute("aria-hidden", "true");

      /*
       * Extra safety:
       * If CSS does not contain .hidden correctly,
       * inline styles will still hide the loader.
       */
      loader.style.opacity = "0";
      loader.style.visibility = "hidden";
      loader.style.pointerEvents = "none";
    }

    if (loaderTimer) {
      window.clearTimeout(loaderTimer);
      loaderTimer = null;
    }
  }

  function showLoader() {
    var loader = el("pageLoader");

    if (loader) {
      loader.classList.remove("hidden");
      loader.removeAttribute("aria-hidden");

      loader.style.opacity = "";
      loader.style.visibility = "";
      loader.style.pointerEvents = "";
    }
  }

  function revealApp() {
    hideLoader();

    if (document.body) {
      document.body.classList.add("ubnux-ready");
    }
  }

  /*
   * NEVER allow loader to remain forever.
   * Even if JS/data/API fails, page becomes visible.
   */
  function startLoaderFailsafe() {
    if (loaderTimer) {
      window.clearTimeout(loaderTimer);
    }

    loaderTimer = window.setTimeout(function () {
      console.warn("UBnux loader failsafe activated.");
      revealApp();
    }, 8000);
  }

  /* =========================================================
     STATIC STATES
  ========================================================= */

  function loadStates() {
    if (
      !window.UBnuxStaticCache ||
      typeof window.UBnuxStaticCache.getJSON !== "function"
    ) {
      return Promise.reject(
        new Error("UBnuxStaticCache.getJSON is unavailable")
      );
    }

    if (!window.UBNUX_CONFIG) {
      return Promise.reject(
        new Error("UBNUX_CONFIG is unavailable")
      );
    }

    return window.UBnuxStaticCache
      .getJSON(
        window.UBNUX_CONFIG.STATES_JSON_URL ||
        "/assets/data/states.json"
      )
      .then(function (x) {
        var states = rows(x, "states");

        if (!window.UBnuxState) {
          throw new Error("UBnuxState is unavailable");
        }

        window.UBnuxState.setStates(states);

        var s = el("stateFilter");

        if (s) {
          s.innerHTML = '<option value="">All States</option>';

          states
            .filter(function (item) {
              return item.Active !== false;
            })
            .sort(function (a, b) {
              return (
                Number(a.SortOrder || 9999) -
                Number(b.SortOrder || 9999)
              );
            })
            .forEach(function (item) {
              var o = document.createElement("option");

              o.value =
                item.Slug ||
                item.StateCode ||
                item.StateName ||
                "";

              o.textContent =
                item.StateName ||
                item.Name ||
                o.value;

              s.appendChild(o);
            });
        }

        return states;
      });
  }

  /* =========================================================
     FILTERS
     IMPORTANT: Pass the FULL filtered dataset to businesses.js.
     businesses.js handles the first 18 records and local Load More.
  ========================================================= */

  function applyFilters() {
    if (
      !window.UBnuxSmartSearch ||
      typeof window.UBnuxSmartSearch.loadIndex !== "function"
    ) {
      return Promise.resolve([]);
    }

    var stateEl = el("stateFilter");
    var districtEl = el("districtFilter");

    var s = val(stateEl && stateEl.value);
    var d = val(districtEl && districtEl.value);

    var c = "";

    if (
      window.UBnuxState &&
      window.UBnuxState.state
    ) {
      c = val(
        window.UBnuxState.state.selectedCategory || ""
      );
    }

    return window.UBnuxSmartSearch
      .loadIndex()
      .then(function (index) {
        index = Array.isArray(index) ? index : [];

        var p = index.filter(function (b) {
          b = b || {};

          var stateMatch =
            !s ||
            val(b.state) === s ||
            val(b.stateName) === s ||
            val(b.stateCode) === s ||
            val(b.stateSlug) === s;

          var districtMatch =
            !d ||
            val(b.district) === d ||
            val(b.districtName) === d ||
            val(b.districtCode) === d ||
            val(b.districtSlug) === d;

          var categoryMatch =
            !c ||
            val(b.category) === c ||
            val(b.categoryId) === c ||
            val(b.categoryName) === c ||
            val(b.categorySlug) === c;

          return (
            stateMatch &&
            districtMatch &&
            categoryMatch
          );
        });

        var sortEl = el("sortFilter");

        var sort =
          val(sortEl && sortEl.value) ||
          "featured";

        p.sort(function (a, b) {
          if (sort === "name") {
            return val(a.name).localeCompare(
              val(b.name)
            );
          }

          if (sort === "rating") {
            return (
              Number(b.rating || 0) -
              Number(a.rating || 0)
            );
          }

          return (
            Number(!!b.featured) -
              Number(!!a.featured) ||
            val(a.name).localeCompare(
              val(b.name)
            )
          );
        });

        if (
          window.UBnuxBusinesses &&
          typeof window.UBnuxBusinesses.render === "function"
        ) {
          window.UBnuxBusinesses.render(
            p,
            p.length
          );
        }

        return p;
      })
      .catch(function (e) {
        console.error(
          "UBnux filter failed:",
          e
        );

        if (
          window.UBnuxBusinesses &&
          typeof window.UBnuxBusinesses.render === "function"
        ) {
          window.UBnuxBusinesses.render([], 0);
        }

        return [];
      });
  }

  /* =========================================================
     EVENTS / UI BINDINGS
  ========================================================= */

  function bind() {
    var s = el("stateFilter");
    var d = el("districtFilter");
    var sort = el("sortFilter");

    /* STATE */
    if (s) {
      s.addEventListener("change", function () {
        try {
          var st =
            window.UBnuxState &&
            typeof window.UBnuxState.get === "function"
              ? window.UBnuxState.get()
              : {};

          var districts =
            st &&
            Array.isArray(st.districts)
              ? st.districts
              : [];

          var selectedState = val(s.value);

          var ds = districts.filter(function (x) {
            x = x || {};

            return (
              val(x.State) === selectedState ||
              val(x.StateName) === selectedState ||
              val(x.StateCode) === selectedState ||
              val(x.Slug) === selectedState
            );
          });

          if (
            window.UBnuxDistricts &&
            typeof window.UBnuxDistricts.render === "function"
          ) {
            window.UBnuxDistricts.render(ds);
          }
        } catch (e) {
          console.error(
            "UBnux state selector error:",
            e
          );
        }

        applyFilters();
      });
    }

    /* DISTRICT */
    if (d) {
      d.addEventListener(
        "change",
        applyFilters
      );
    }

    /* SORT */
    if (sort) {
      sort.addEventListener(
        "change",
        applyFilters
      );
    }

    /* CATEGORY DROPDOWN */
    var cb = el("categoryDropdownButton");
    var menu = el("categoryDropdownMenu");

    if (cb && menu) {
      cb.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var open = !menu.classList.contains("open");

        if (open) {
          menu.hidden = false;
          menu.removeAttribute("hidden");
          menu.classList.add("open");
        } else {
          menu.classList.remove("open");
          menu.hidden = true;
          menu.setAttribute("hidden", "");
        }

        cb.setAttribute(
          "aria-expanded",
          open ? "true" : "false"
        );
      });

      /* Close category dropdown when clicking outside */
      document.addEventListener("click", function (ev) {
        if (!menu.classList.contains("open")) return;

        var dropdown = el("categoryDropdown");
        if (dropdown && !dropdown.contains(ev.target)) {
          menu.classList.remove("open");
          menu.hidden = true;
          menu.setAttribute("hidden", "");
          cb.setAttribute("aria-expanded", "false");
        }
      });

      /* Close category dropdown with Escape */
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && menu.classList.contains("open")) {
          menu.classList.remove("open");
          menu.hidden = true;
          menu.setAttribute("hidden", "");
          cb.setAttribute("aria-expanded", "false");
          cb.focus();
        }
      });
    }

    /* CATEGORY SEARCH */
    var catSearch =
      el("categorySearchInput");

    if (catSearch) {
      catSearch.addEventListener(
        "input",
        function () {
          var q = val(catSearch.value);

          document
            .querySelectorAll(
              ".category-option"
            )
            .forEach(function (x) {
              x.hidden =
                !!q &&
                val(x.textContent).indexOf(q) < 0;
            });
        }
      );
    }

    /* LOAD MORE */
    var more = el("loadMoreButton");

    if (more) {
      more.addEventListener(
        "click",
        function () {
          if (
            window.UBnuxBusinesses &&
            typeof window.UBnuxBusinesses.appendMore ===
              "function"
          ) {
            window.UBnuxBusinesses.appendMore(18);
          }
        }
      );
    }

    /* MOBILE MENU */
    var menuButton =
      el("mobileMenuButton");

    var nav =
      el("mainNav");

    if (menuButton && nav) {
      menuButton.addEventListener(
        "click",
        function () {
          var open =
            nav.classList.toggle("open");

          menuButton.setAttribute(
            "aria-expanded",
            open ? "true" : "false"
          );
        }
      );
    }
  }

  /* =========================================================
     ENABLE SELECTORS
  ========================================================= */

  function enableSelectors() {
    [
      "stateFilter",
      "districtFilter",
      "categoryDropdownButton",
      "sortFilter"
    ].forEach(function (id) {
      var e = el(id);

      if (e) {
        e.disabled = false;
      }
    });
  }

  /* =========================================================
     DEPENDENCY CHECK
  ========================================================= */

  function dependenciesReady() {
    var required = [
      "UBnuxStaticCache",
      "UBnuxState",
      "UBnuxDistricts",
      "UBnuxCategories",
      "UBnuxBusinesses",
      "UBnuxSmartSearch"
    ];

    var missing = [];

    required.forEach(function (name) {
      if (!window[name]) {
        missing.push(name);
      }
    });

    if (missing.length) {
      console.error(
        "UBnux missing dependencies:",
        missing
      );

      return false;
    }

    return true;
  }

  /* =========================================================
     INITIALIZATION
  ========================================================= */

  function init() {
    var y = el("currentYear");

    if (y) {
      y.textContent =
        new Date().getFullYear();
    }

    /*
     * Start immediately so loader can never become
     * a permanent blocking screen.
     */
    startLoaderFailsafe();

    /*
     * Make sure loader exists in a known state.
     */
    showLoader();

    /*
     * Check dependencies first.
     */
    if (!dependenciesReady()) {
      console.error(
        "UBnux bootstrap stopped because dependencies are missing."
      );

      enableSelectors();
      revealApp();

      var missingMsg =
        el("selectionMessage");

      if (missingMsg) {
        missingMsg.textContent =
          "Some UBnux components could not initialize. Please refresh the page.";
      }

      return;
    }

    /*
     * MAIN BOOTSTRAP
     */
    Promise.resolve()
      .then(function () {
        return loadStates();
      })

      .then(function () {
        if (
          window.UBnuxDistricts &&
          typeof window.UBnuxDistricts.load ===
            "function"
        ) {
          return window.UBnuxDistricts.load();
        }

        return null;
      })

      .then(function () {
        if (
          window.UBnuxCategories &&
          typeof window.UBnuxCategories.load ===
            "function"
        ) {
          return window.UBnuxCategories.load();
        }

        return null;
      })

      .then(function () {
        bind();

        /*
         * Smart Search initialization should not
         * prevent the page from becoming visible.
         */
        try {
          if (
            window.UBnuxSmartSearch &&
            typeof window.UBnuxSmartSearch.init ===
              "function"
          ) {
            window.UBnuxSmartSearch.init();
          }
        } catch (searchError) {
          console.error(
            "UBnux Smart Search init failed:",
            searchError
          );
        }

        /*
         * Restore saved selection safely.
         */
        try {
          var sel = {};

          if (
            window.UBnuxStorage &&
            typeof window.UBnuxStorage.getSelection ===
              "function"
          ) {
            sel =
              window.UBnuxStorage.getSelection() ||
              {};
          }

          if (
            sel.state &&
            el("stateFilter")
          ) {
            el("stateFilter").value =
              sel.state;

            el("stateFilter").dispatchEvent(
              new Event("change")
            );
          }
        } catch (storageError) {
          console.warn(
            "UBnux saved selection restore failed:",
            storageError
          );
        }

        enableSelectors();

        /*
         * IMPORTANT:
         * Successful initialization -> hide loader.
         */
        revealApp();
      })

      .catch(function (e) {
        /*
         * Even if ANY initialization step fails,
         * NEVER leave the loader on screen.
         */
        console.error(
          "UBnux bootstrap failed:",
          e
        );

        enableSelectors();

        /*
         * Try to keep Smart Search usable.
         */
        try {
          if (
            window.UBnuxSmartSearch &&
            typeof window.UBnuxSmartSearch.init ===
              "function"
          ) {
            window.UBnuxSmartSearch.init();
          }
        } catch (searchError) {
          console.error(
            "UBnux Smart Search fallback failed:",
            searchError
          );
        }

        /*
         * ALWAYS reveal page.
         */
        revealApp();

        var msg =
          el("selectionMessage");

        if (msg) {
          msg.textContent =
            "Directory data could not load. Please refresh and try again.";
        }
      });
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */

  app.applyFilters = applyFilters;
  app.init = init;
  app.hideLoader = hideLoader;
  app.showLoader = showLoader;

  window.UBnuxApp = app;

  /* =========================================================
     GLOBAL ERROR FAILSAFE
  ========================================================= */

  /*
   * Any uncaught JavaScript error must NOT keep
   * the entire website behind Loading UBnux.
   */
  window.addEventListener(
    "error",
    function (event) {
      console.error(
        "UBnux global error:",
        event && event.error
      );

      revealApp();
    }
  );

  window.addEventListener(
    "unhandledrejection",
    function (event) {
      console.error(
        "UBnux unhandled promise rejection:",
        event && event.reason
      );

      revealApp();
    }
  );

  /* =========================================================
     START
  ========================================================= */

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})(window, document);
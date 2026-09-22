/* =========================================================
   UBnux Business Manager
   File: assets/js/dashboard.js
   Version: 2.0.0

   Responsibilities:
   - Dashboard statistics
   - Recent businesses
   - Business count handling
   - Dashboard refresh
   - Business-load synchronization
   - Recent business actions
   ========================================================= */

(function (window, document) {

  "use strict";


  /* =======================================================
     MODULE
  ======================================================= */

  const Dashboard = {};


  const state = {

    items: [],

    total: 0,

    active: 0,

    verified: 0,

    customUrls: 0,

    loading: false,

    lastUpdated: null

  };


  /* =======================================================
     DOM
  ======================================================= */

  function el(id) {

    return document.getElementById(id);

  }


  /* =======================================================
     TEXT
  ======================================================= */

  function text(value) {

    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    );

  }


  /* =======================================================
     ESCAPE HTML
  ======================================================= */

  function escapeHTML(value) {

    return text(value)
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
     BOOLEAN NORMALIZER
  ======================================================= */

  function isTrue(value) {

    if (
      value === true ||
      value === 1
    ) {

      return true;

    }


    const normalized =
      text(value)
        .trim()
        .toLowerCase();


    return (
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "1" ||
      normalized === "active" ||
      normalized === "verified"
    );

  }


  /* =======================================================
     STATUS NORMALIZER
  ======================================================= */

  function getStatus(item) {

    const status =
      text(
        item.BusinessStatus ||
        item.businessStatus ||
        item.Status ||
        item.status ||
        ""
      )
        .trim();


    return status ||
      "Active";

  }


  /* =======================================================
     BUSINESS NAME
  ======================================================= */

  function getBusinessName(item) {

    return text(
      item.BusinessName ||
      item.businessName ||
      item.name ||
      "Untitled Business"
    ).trim();

  }


  /* =======================================================
     BUSINESS ID
  ======================================================= */

  function getBusinessID(item) {

    return text(
      item.BusinessID ||
      item.businessID ||
      item.businessId ||
      item.id ||
      ""
    ).trim();

  }


  /* =======================================================
     DISTRICT
  ======================================================= */

  function getDistrict(item) {

    return text(
      item.DistrictName ||
      item.districtName ||
      item.DistrictID ||
      item.districtId ||
      "—"
    ).trim();

  }


  /* =======================================================
     CATEGORY
  ======================================================= */

  function getCategory(item) {

    return text(
      item.CategoryName ||
      item.categoryName ||
      item.CategoryID ||
      item.categoryId ||
      "—"
    ).trim();

  }


  /* =======================================================
     SLUG
  ======================================================= */

  function getSlug(item) {

    return text(
      item.Slug ||
      item.slug ||
      ""
    ).trim();

  }


  /* =======================================================
     DATE VALUE
  ======================================================= */

  function getDateValue(item) {

    const value =
      item.UpdatedAt ||
      item.updatedAt ||
      item.CreatedAt ||
      item.createdAt ||
      "";


    if (!value) {

      return 0;

    }


    const timestamp =
      Date.parse(
        value
      );


    if (
      Number.isFinite(
        timestamp
      )
    ) {

      return timestamp;

    }


    /*
     * Google Sheets may sometimes
     * return a Date-like string.
     */

    const fallback =
      new Date(
        value
      ).getTime();


    return Number.isFinite(
      fallback
    )
      ? fallback
      : 0;

  }


  /* =======================================================
     FORMAT DATE
  ======================================================= */

  function formatDate(item) {

    const timestamp =
      getDateValue(
        item
      );


    if (!timestamp) {

      return "";

    }


    try {

      return new Intl.DateTimeFormat(
        "en-IN",
        {

          day:
            "2-digit",

          month:
            "short",

          year:
            "numeric"

        }
      ).format(
        new Date(
          timestamp
        )
      );

    } catch (error) {

      return "";

    }

  }


  /* =======================================================
     SET STAT
  ======================================================= */

  function setStat(
    id,
    value
  ) {

    const node =
      el(
        id
      );


    if (!node) {

      return;

    }


    node.textContent =
      String(
        Number(
          value || 0
        )
      );

  }


  /* =======================================================
     CALCULATE STATS
  ======================================================= */

  function calculateStats(
    items
  ) {

    items =
      Array.isArray(
        items
      )
        ? items
        : [];


    const total =
      items.length;


    const active =
      items.filter(
        function (item) {

          return (
            getStatus(
              item
            )
              .toLowerCase() ===
            "active"
          );

        }
      ).length;


    const verified =
      items.filter(
        function (item) {

          return isTrue(
            item.Verified ||
            item.verified
          );

        }
      ).length;


    const customUrls =
      items.filter(
        function (item) {

          return !!getSlug(
            item
          );

        }
      ).length;


    state.total =
      total;

    state.active =
      active;

    state.verified =
      verified;

    state.customUrls =
      customUrls;


    return {

      total:
        total,

      active:
        active,

      verified:
        verified,

      customUrls:
        customUrls

    };

  }


  /* =======================================================
     RENDER STATS
  ======================================================= */

  function renderStats(
    stats
  ) {

    stats =
      stats || {};


    setStat(
      "statTotal",
      stats.total
    );


    setStat(
      "statActive",
      stats.active
    );


    setStat(
      "statVerified",
      stats.verified
    );


    setStat(
      "statUrls",
      stats.customUrls
    );

  }


  /* =======================================================
     UPDATE
  ======================================================= */

  function update(
    items,
    metadata
  ) {

    items =
      Array.isArray(
        items
      )
        ? items
        : [];


    state.items =
      items.slice();


    state.lastUpdated =
      Date.now();


    const calculated =
      calculateStats(
        items
      );


    /*
     * If backend provides aggregate
     * counts, use them.
     *
     * This allows the dashboard to
     * support large datasets later.
     */

    metadata =
      metadata || {};


    const total =
      Number.isFinite(
        Number(
          metadata.total
        )
      )
        ? Number(
            metadata.total
          )
        : calculated.total;


    const active =
      Number.isFinite(
        Number(
          metadata.active
        )
      )
        ? Number(
            metadata.active
          )
        : calculated.active;


    const verified =
      Number.isFinite(
        Number(
          metadata.verified
        )
      )
        ? Number(
            metadata.verified
          )
        : calculated.verified;


    const customUrls =
      Number.isFinite(
        Number(
          metadata.customUrls
        )
      )
        ? Number(
            metadata.customUrls
          )
        : calculated.customUrls;


    state.total =
      total;

    state.active =
      active;

    state.verified =
      verified;

    state.customUrls =
      customUrls;


    renderStats({

      total:
        total,

      active:
        active,

      verified:
        verified,

      customUrls:
        customUrls

    });


    renderRecent(
      items
    );

  }


  /* =======================================================
     LOADING STATE
  ======================================================= */

  function renderLoading() {

    const host =
      el(
        "recentTable"
      );


    if (!host) {

      return;

    }


    state.loading =
      true;


    host.innerHTML =

      '<div class="empty-state">' +

      "<p>Loading recent businesses...</p>" +

      "</div>";

  }


  /* =======================================================
     EMPTY STATE
  ======================================================= */

  function renderEmpty() {

    const host =
      el(
        "recentTable"
      );


    if (!host) {

      return;

    }


    host.innerHTML =

      '<div class="empty-state">' +

      "<strong>No businesses yet.</strong>" +

      "<p>" +

      "Add your first business from the Business Manager." +

      "</p>" +

      "</div>";

  }


  /* =======================================================
     ERROR STATE
  ======================================================= */

  function renderError(
    message
  ) {

    const host =
      el(
        "recentTable"
      );


    if (!host) {

      return;

    }


    host.innerHTML =

      '<div class="empty-state">' +

      "<strong>Unable to load dashboard.</strong>" +

      "<p>" +

      escapeHTML(
        message ||
        "Please try again."
      ) +

      "</p>" +

      "</div>";

  }


  /* =======================================================
     RECENT BUSINESSES
  ======================================================= */

  function getRecent(
    items
  ) {

    return items
      .slice()
      .sort(
        function (
          a,
          b
        ) {

          return (
            getDateValue(
              b
            ) -
            getDateValue(
              a
            )
          );

        }
      )
      .slice(
        0,
        8
      );

  }


  /* =======================================================
     PUBLIC URL
  ======================================================= */

  function getPublicURL(
    item
  ) {

    const slug =
      getSlug(
        item
      );


    if (!slug) {

      return "";

    }


    /*
     * Prefer CustomURL module.
     */

    if (
      window.UBnuxCustomURL &&
      typeof window.UBnuxCustomURL.buildPublicURL ===
      "function"
    ) {

      return window
        .UBnuxCustomURL
        .buildPublicURL(
          slug
        );

    }


    /*
     * Fallback.
     */

    const origin =
      window.UBnuxManagerConfig &&
      window.UBnuxManagerConfig.PUBLIC_ORIGIN
        ? String(
            window
              .UBnuxManagerConfig
              .PUBLIC_ORIGIN
          )
            .replace(
              /\/+$/,
              ""
            )
        : "https://ubnux.com";


    return (
      origin +
      "/" +
      encodeURIComponent(
        slug
      ) +
      "/"
    );

  }


  /* =======================================================
     STATUS BADGE
  ======================================================= */

  function renderStatus(
    status
  ) {

    const normalized =
      text(
        status ||
        "Active"
      )
        .trim()
        .toLowerCase();


    const className =
      normalized === "active"
        ? "active"
        : (
            normalized ===
            "pending"
              ? "pending"
              : "inactive"
          );


    return (

      '<span class="status-pill ' +
      className +
      '">' +

      escapeHTML(
        status ||
        "Active"
      ) +

      "</span>"

    );

  }


  /* =======================================================
     VERIFIED BADGE
  ======================================================= */

  function renderVerified(
    item
  ) {

    const verified =
      isTrue(
        item.Verified ||
        item.verified
      );


    if (verified) {

      return (
        '<span class="verified-badge">' +
        "✓ Verified" +
        "</span>"
      );

    }


    return (
      '<span class="muted-badge">' +
      "Not verified" +
      "</span>"
    );

  }


  /* =======================================================
     RENDER RECENT
  ======================================================= */

  function renderRecent(
    items
  ) {

    const host =
      el(
        "recentTable"
      );


    if (!host) {

      return;

    }


    items =
      Array.isArray(
        items
      )
        ? items
        : [];


    state.loading =
      false;


    if (!items.length) {

      renderEmpty();

      return;

    }


    const recent =
      getRecent(
        items
      );


    let html =

      '<div class="table-wrap">' +

      '<table class="data-table">' +

      "<thead>" +

      "<tr>" +

      "<th>Business</th>" +

      "<th>District</th>" +

      "<th>Category</th>" +

      "<th>Status</th>" +

      "<th>Verified</th>" +

      "<th>Updated</th>" +

      "<th>Action</th>" +

      "</tr>" +

      "</thead>" +

      "<tbody>";


    recent.forEach(
      function (
        item
      ) {

        const id =
          getBusinessID(
            item
          );


        const name =
          getBusinessName(
            item
          );


        const district =
          getDistrict(
            item
          );


        const category =
          getCategory(
            item
          );


        const status =
          getStatus(
            item
          );


        const updated =
          formatDate(
            item
          );


        const url =
          getPublicURL(
            item
          );


        html +=

          "<tr>" +


          /* BUSINESS */

          "<td>" +

          '<div class="business-cell">' +

          "<strong>" +

          escapeHTML(
            name
          ) +

          "</strong>" +

          (
            id
              ? (
                  "<small>" +
                  escapeHTML(
                    id
                  ) +
                  "</small>"
                )
              : ""
          ) +

          "</div>" +

          "</td>" +


          /* DISTRICT */

          "<td>" +

          escapeHTML(
            district
          ) +

          "</td>" +


          /* CATEGORY */

          "<td>" +

          escapeHTML(
            category
          ) +

          "</td>" +


          /* STATUS */

          "<td>" +

          renderStatus(
            status
          ) +

          "</td>" +


          /* VERIFIED */

          "<td>" +

          renderVerified(
            item
          ) +

          "</td>" +


          /* UPDATED */

          "<td>" +

          escapeHTML(
            updated ||
            "—"
          ) +

          "</td>" +


          /* ACTION */

          "<td>" +

          '<div class="row-actions zero">' +


          (
            id
              ? (

                  '<button ' +

                  'type="button" ' +

                  'class="btn light" ' +

                  'data-dashboard-edit="' +

                  escapeHTML(
                    id
                  ) +

                  '">' +

                  "Edit" +

                  "</button>"

                )
              : ""
          ) +


          (
            url
              ? (

                  '<a ' +

                  'class="btn light" ' +

                  'href="' +

                  escapeHTML(
                    url
                  ) +

                  '" ' +

                  'target="_blank" ' +

                  'rel="noopener noreferrer">' +

                  "Open" +

                  "</a>"

                )
              : ""
          ) +


          "</div>" +

          "</td>" +


          "</tr>";

      }
    );


    html +=

      "</tbody>" +

      "</table>" +

      "</div>";


    host.innerHTML =
      html;

  }


  /* =======================================================
     REFRESH FROM BUSINESS MODULE
  ======================================================= */

  function refresh() {

    const Businesses =
      window.UBnuxBusinesses;


    if (
      !Businesses ||
      typeof Businesses.getItems !==
      "function"
    ) {

      /*
       * Businesses module may not have
       * loaded data yet.
       */

      return;

    }


    const items =
      Businesses.getItems();


    update(
      items
    );

  }


  /* =======================================================
     REFRESH DATA
  ======================================================= */

  async function reload() {

    const Businesses =
      window.UBnuxBusinesses;


    if (
      !Businesses ||
      typeof Businesses.loadBusinesses !==
      "function"
    ) {

      renderError(
        "Business module is unavailable."
      );


      return {

        success:
          false,

        message:
          "Business module unavailable."

      };

    }


    renderLoading();


    try {

      const response =
        await Businesses.loadBusinesses();


      if (
        !response ||
        response.success !==
        true
      ) {

        renderError(
          response &&
          response.message
            ? response.message
            : "Unable to load businesses."
        );


        return response;

      }


      /*
       * Businesses module dispatches
       * ubnux:businesses-loaded.
       *
       * But update once more here as
       * a safe fallback.
       */

      refresh();


      return response;


    } catch (error) {

      console.error(
        "Dashboard reload error:",
        error
      );


      renderError(
        error.message ||
        "Unable to load businesses."
      );


      return {

        success:
          false,

        message:
          error.message

      };

    }

  }


  /* =======================================================
     RECENT BUSINESS EDIT
  ======================================================= */

  function editBusiness(
    businessId
  ) {

    if (!businessId) {

      return;

    }


    if (
      window.UBnuxBusinesses &&
      typeof window.UBnuxBusinesses.editBusiness ===
      "function"
    ) {

      window
        .UBnuxBusinesses
        .editBusiness(
          businessId
        );


      return;

    }


    /*
     * Current businesses.js also exposes
     * edit().
     */

    if (
      window.UBnuxBusinesses &&
      typeof window.UBnuxBusinesses.edit ===
      "function"
    ) {

      window
        .UBnuxBusinesses
        .edit(
          businessId
        );


      return;

    }


    /*
     * Fallback:
     * switch to editor if available.
     */

    if (
      window.UBnuxManagerApp &&
      typeof window.UBnuxManagerApp.showView ===
      "function"
    ) {

      window
        .UBnuxManagerApp
        .showView(
          "editor"
        );

    }

  }


  /* =======================================================
     EVENT BINDING
  ======================================================= */

  function bindEvents() {

    /*
     * Recent table actions.
     */

    const recent =
      el(
        "recentTable"
      );


    if (recent) {

      recent.addEventListener(
        "click",
        function (
          event
        ) {

          const editButton =
            event.target.closest(
              "[data-dashboard-edit]"
            );


          if (!editButton) {

            return;

          }


          const businessId =
            editButton.getAttribute(
              "data-dashboard-edit"
            );


          editBusiness(
            businessId
          );

        }
      );

    }


    /*
     * Businesses loaded event.
     */

    window.addEventListener(
      "ubnux:businesses-loaded",
      function (
        event
      ) {

        const detail =
          event &&
          event.detail
            ? event.detail
            : {};


        const items =
          Array.isArray(
            detail.items
          )
            ? detail.items
            : [];


        /*
         * Optional aggregate metadata.
         */

        const response =
          detail.response ||
          {};


        const metadata =
          response.stats ||
          response.statistics ||
          (
            response.data &&
            (
              response.data.stats ||
              response.data.statistics
            )
          ) ||
          {};


        update(
          items,
          metadata
        );

      }
    );


    /*
     * Business saved.
     */

    window.addEventListener(
      "ubnux:business-saved",
      function () {

        reload();

      }
    );


    /*
     * Business deleted.
     */

    window.addEventListener(
      "ubnux:business-deleted",
      function () {

        reload();

      }
    );

  }


  /* =======================================================
     INITIAL UI
  ======================================================= */

  function initialize() {

    /*
     * Keep dashboard visually
     * initialized even before API load.
     */

    renderStats({

      total:
        0,

      active:
        0,

      verified:
        0,

      customUrls:
        0

    });


    bindEvents();

  }


  /* =======================================================
     EXPORT
  ======================================================= */

  Dashboard.version =
    "2.0.0";


  Dashboard.update =
    update;


  Dashboard.refresh =
    refresh;


  Dashboard.reload =
    reload;


  Dashboard.renderStats =
    renderStats;


  Dashboard.renderRecent =
    renderRecent;


  Dashboard.calculateStats =
    calculateStats;


  Dashboard.getState =
    function () {

      return Object.assign(
        {},
        state,
        {

          items:
            state.items.slice()

        }
      );

    };


  window.UBnuxDashboard =
    Dashboard;


  /* =======================================================
     INIT
  ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  } else {

    initialize();

  }


  console.log(
    "UBnux Dashboard v2.0.0 initialized."
  );


})(window, document);

/* =========================================================
   UBnux Business Manager
   File: dashboard.js
   Version: 1.0.0

   Responsibilities:
   - Dashboard statistics
   - Recent businesses
   - Dashboard refresh
   ========================================================= */

(function (window, document) {

  "use strict";


  const Dashboard = {};


  let state = {

    items:
      []

  };


  /* =======================================================
     DOM
  ======================================================= */

  function el(id) {

    return document.getElementById(id);

  }


  /* =======================================================
     UTILITIES
  ======================================================= */

  function text(
    value
  ) {

    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    );

  }


  function escapeHTML(
    value
  ) {

    return text(
      value
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


  function truthy(
    value
  ) {

    if (
      value === true ||
      value === 1
    ) {

      return true;

    }


    const v =
      text(
        value
      )
        .trim()
        .toLowerCase();


    return (
      v === "true" ||
      v === "yes" ||
      v === "1" ||
      v === "active"
    );

  }


  /* =======================================================
     STAT SETTER
  ======================================================= */

  function setStat(
    id,
    value
  ) {

    const node =
      el(
        id
      );


    if (node) {

      node.textContent =
        String(
          value || 0
        );

    }

  }


  /* =======================================================
     UPDATE
  ======================================================= */

  function update(
    items
  ) {

    items =
      Array.isArray(
        items
      )
        ? items
        : [];


    state.items =
      items.slice();


    const total =
      items.length;


    const active =
      items.filter(
        function (item) {

          return (
            text(
              item.BusinessStatus
            )
              .trim()
              .toLowerCase() ===
            "active"
          );

        }
      ).length;


    const verified =
      items.filter(
        function (item) {

          return truthy(
            item.Verified
          );

        }
      ).length;


    const urls =
      items.filter(
        function (item) {

          return !!text(
            item.Slug
          ).trim();

        }
      ).length;


    setStat(
      "statTotal",
      total
    );

    setStat(
      "statActive",
      active
    );

    setStat(
      "statVerified",
      verified
    );

    setStat(
      "statUrls",
      urls
    );


    renderRecent(
      items
    );

  }


  /* =======================================================
     RECENT
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


    if (
      !items.length
    ) {

      host.innerHTML =
        '<div class="empty-state">' +
        "<p>No businesses yet.</p>" +
        "</div>";

      return;

    }


    const recent =
      items
        .slice()
        .sort(
          function (
            a,
            b
          ) {

            const aTime =
              Date.parse(
                a.UpdatedAt ||
                a.CreatedAt ||
                ""
              ) ||
              0;


            const bTime =
              Date.parse(
                b.UpdatedAt ||
                b.CreatedAt ||
                ""
              ) ||
              0;


            return (
              bTime -
              aTime
            );

          }
        )
        .slice(
          0,
          8
        );


    let html =

      '<div class="table-wrap">' +

      '<table class="data-table">' +

      "<thead>" +

      "<tr>" +

      "<th>Business</th>" +

      "<th>District</th>" +

      "<th>Status</th>" +

      "<th>Verified</th>" +

      "</tr>" +

      "</thead>" +

      "<tbody>";


    recent.forEach(
      function (item) {

        html +=

          "<tr>" +

          "<td>" +

          '<div class="business-cell">' +

          "<strong>" +
          escapeHTML(
            item.BusinessName ||
            "Untitled"
          ) +
          "</strong>" +

          "<small>" +
          escapeHTML(
            item.BusinessID ||
            ""
          ) +
          "</small>" +

          "</div>" +

          "</td>" +

          "<td>" +
          escapeHTML(
            item.DistrictName ||
            item.DistrictID ||
            "—"
          ) +
          "</td>" +

          "<td>" +
          escapeHTML(
            item.BusinessStatus ||
            "Active"
          ) +
          "</td>" +

          "<td>" +
          (
            truthy(
              item.Verified
            )
              ? "Yes"
              : "No"
          ) +
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
     REFRESH FROM BUSINESSES MODULE
  ======================================================= */

  function refresh() {

    if (
      window.UBnuxBusinesses &&
      typeof window.UBnuxBusinesses.getItems ===
      "function"
    ) {

      update(
        window.UBnuxBusinesses.getItems()
      );

    }

  }


  /* =======================================================
     LISTEN FOR BUSINESS LOAD
  ======================================================= */

  window.addEventListener(
    "ubnux:businesses-loaded",
    function (
      event
    ) {

      const items =
        event &&
        event.detail &&
        Array.isArray(
          event.detail.items
        )
          ? event.detail.items
          : [];


      update(
        items
      );

    }
  );


  /* =======================================================
     EXPORT
  ======================================================= */

  Dashboard.update =
    update;

  Dashboard.refresh =
    refresh;

  Dashboard.renderRecent =
    renderRecent;

  Dashboard.getState =
    function () {

      return state;

    };


  window.UBnuxDashboard =
    Dashboard;


  console.log(
    "UBnux Dashboard v1.0.0 initialized."
  );


})(window, document);

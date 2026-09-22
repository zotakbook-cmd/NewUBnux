(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;

  var U =
    T.utils;


  T.register(
    "grocery",
    {

      render:
        function (
          business,
          route
        ) {

          return (
            '<div class="ubx-business-template ubx-template-grocery">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route,
              {
                className:
                  "ubx-grocery-hero",

                actions: {
                  callText:
                    "Call Store",

                  whatsappText:
                    "Order on WhatsApp",

                  websiteText:
                    "Shop Online"
                }
              }
            ) +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business,
              "About Store"
            ) +

            '<section class="ubx-section">' +
            "<h2>Shop Categories</h2>" +

            '<div class="ubx-feature-grid">' +
            '<div class="ubx-feature-card">Groceries</div>' +
            '<div class="ubx-feature-card">Daily Essentials</div>' +
            '<div class="ubx-feature-card">Beverages</div>' +
            '<div class="ubx-feature-card">Household Items</div>' +
            "</div>" +

            "</section>" +

            '<section class="ubx-section">' +
            "<h2>Products</h2>" +
            '<div class="ubx-placeholder-card">' +
            "Store products will appear here." +
            "</div>" +
            "</section>" +

            U.locationHTML(
              business
            ) +

            "</main>" +

            '<aside class="ubx-sidebar">' +

            U.hoursHTML(
              business
            ) +

            "</aside>" +

            "</div>" +

            "</div>"
          );

        }

    }
  );


})(window);

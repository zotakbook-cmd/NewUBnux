(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;

  var U =
    T.utils;


  T.register(
    "restaurant",
    {

      render:
        function (
          business,
          route
        ) {

          var cuisine =
            U.value(
              business,
              [
                "Cuisine",
                "CuisineType",
                "cuisine"
              ]
            );


          var priceRange =
            U.value(
              business,
              [
                "PriceRange",
                "priceRange"
              ]
            );


          return (
            '<div class="ubx-business-template ubx-template-restaurant">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route,
              {
                className:
                  "ubx-restaurant-hero",

                actions: {
                  callText:
                    "Call Restaurant",

                  whatsappText:
                    "WhatsApp",

                  websiteText:
                    "View Menu"
                }
              }
            ) +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business,
              "About Restaurant"
            ) +

            (
              cuisine ||
              priceRange

                ? '<section class="ubx-section">' +
                  "<h2>Restaurant Details</h2>" +
                  '<div class="ubx-info-grid">' +

                  (
                    cuisine
                      ? '<div class="ubx-info-card">' +
                        "<strong>Cuisine</strong>" +
                        "<span>" +
                        U.escapeHTML(
                          cuisine
                        ) +
                        "</span>" +
                        "</div>"
                      : ""
                  ) +

                  (
                    priceRange
                      ? '<div class="ubx-info-card">' +
                        "<strong>Price Range</strong>" +
                        "<span>" +
                        U.escapeHTML(
                          priceRange
                        ) +
                        "</span>" +
                        "</div>"
                      : ""
                  ) +

                  "</div>" +
                  "</section>"

                : ""
            ) +

            '<section class="ubx-section">' +
            "<h2>Menu & Popular Items</h2>" +
            '<div class="ubx-placeholder-card">' +
            "Menu and popular dishes will appear here." +
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

            '<div class="ubx-info-card">' +
            "<h3>Quick Actions</h3>" +
            '<div class="ubx-actions ubx-actions-column">' +
            U.actionsHTML(
              business,
              {
                callText:
                  "Call",

                whatsappText:
                  "Order / WhatsApp"
              }
            ) +
            "</div>" +
            "</div>" +

            "</aside>" +

            "</div>" +

            "</div>"
          );

        }

    }
  );


})(window);

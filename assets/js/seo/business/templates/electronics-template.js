(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;

  var U =
    T.utils;


  T.register(
    "electronics",
    {

      render:
        function (
          business,
          route
        ) {

          return (
            '<div class="ubx-business-template ubx-template-electronics">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route,
              {
                className:
                  "ubx-electronics-hero",

                actions: {
                  callText:
                    "Call Store",

                  whatsappText:
                    "WhatsApp Store",

                  websiteText:
                    "Shop Online"
                }
              }
            ) +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business,
              "About Electronics Store"
            ) +

            '<section class="ubx-section">' +
            "<h2>Products</h2>" +

            '<div class="ubx-feature-grid">' +
            '<div class="ubx-feature-card">Smartphones</div>' +
            '<div class="ubx-feature-card">Laptops</div>' +
            '<div class="ubx-feature-card">Accessories</div>' +
            '<div class="ubx-feature-card">Home Electronics</div>' +
            "</div>" +

            "</section>" +

            '<section class="ubx-section">' +
            "<h2>Featured Products</h2>" +
            '<div class="ubx-placeholder-card">' +
            "Products will appear here." +
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

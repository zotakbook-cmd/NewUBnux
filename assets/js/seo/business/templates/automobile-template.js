(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;

  var U =
    T.utils;


  T.register(
    "automobile",
    {

      render:
        function (
          business,
          route
        ) {

          return (
            '<div class="ubx-business-template ubx-template-automobile">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route,
              {
                className:
                  "ubx-auto-hero",

                actions: {
                  callText:
                    "Call Dealer",

                  whatsappText:
                    "WhatsApp Dealer",

                  websiteText:
                    "View Website"
                }
              }
            ) +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business,
              "About Dealer"
            ) +

            '<section class="ubx-section">' +
            "<h2>Vehicles</h2>" +

            '<div class="ubx-feature-grid">' +
            '<div class="ubx-feature-card">Cars</div>' +
            '<div class="ubx-feature-card">Bikes</div>' +
            '<div class="ubx-feature-card">Used Vehicles</div>' +
            '<div class="ubx-feature-card">Accessories</div>' +
            "</div>" +

            "</section>" +

            '<section class="ubx-section">' +
            "<h2>Available Vehicles</h2>" +
            '<div class="ubx-placeholder-card">' +
            "Vehicle inventory will appear here." +
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

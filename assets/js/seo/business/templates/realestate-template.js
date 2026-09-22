(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;

  var U =
    T.utils;


  T.register(
    "realestate",
    {

      render:
        function (
          business,
          route
        ) {

          return (
            '<div class="ubx-business-template ubx-template-realestate">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route,
              {
                className:
                  "ubx-property-hero",

                actions: {
                  callText:
                    "Call Agent",

                  whatsappText:
                    "WhatsApp",

                  websiteText:
                    "View Properties"
                }
              }
            ) +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business,
              "About Property Dealer"
            ) +

            '<section class="ubx-section">' +
            "<h2>Properties</h2>" +
            '<div class="ubx-placeholder-card">' +
            "Property listings will appear here." +
            "</div>" +
            "</section>" +

            '<section class="ubx-section">' +
            "<h2>Property Services</h2>" +

            '<div class="ubx-feature-grid">' +

            '<div class="ubx-feature-card">Buy Property</div>' +
            '<div class="ubx-feature-card">Sell Property</div>' +
            '<div class="ubx-feature-card">Rent Property</div>' +
            '<div class="ubx-feature-card">Commercial Property</div>' +

            "</div>" +
            "</section>" +

            U.locationHTML(
              business
            ) +

            "</main>" +

            '<aside class="ubx-sidebar">' +

            '<div class="ubx-info-card">' +
            "<h3>Contact Agent</h3>" +
            '<div class="ubx-actions ubx-actions-column">' +
            U.actionsHTML(
              business
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

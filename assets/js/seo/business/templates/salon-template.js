(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;

  var U =
    T.utils;


  T.register(
    "salon",
    {

      render:
        function (
          business,
          route
        ) {

          return (
            '<div class="ubx-business-template ubx-template-salon">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route,
              {
                className:
                  "ubx-salon-hero",

                actions: {
                  callText:
                    "Call Salon",

                  whatsappText:
                    "Book Appointment",

                  websiteText:
                    "View Website"
                }
              }
            ) +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business,
              "About Salon"
            ) +

            '<section class="ubx-section">' +
            "<h2>Services</h2>" +

            '<div class="ubx-feature-grid">' +

            '<div class="ubx-feature-card">Haircut & Styling</div>' +

            '<div class="ubx-feature-card">Skin Care</div>' +

            '<div class="ubx-feature-card">Facial</div>' +

            '<div class="ubx-feature-card">Bridal Services</div>' +

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
            "<h3>Book Appointment</h3>" +
            '<div class="ubx-actions ubx-actions-column">' +
            U.actionsHTML(
              business,
              {
                whatsappText:
                  "Book on WhatsApp"
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

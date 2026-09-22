(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;

  var U =
    T.utils;


  T.register(
    "hotel",
    {

      render:
        function (
          business,
          route
        ) {

          return (
            '<div class="ubx-business-template ubx-template-hotel">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route,
              {
                className:
                  "ubx-hotel-hero",

                actions: {
                  callText:
                    "Call Hotel",

                  whatsappText:
                    "Book on WhatsApp",

                  websiteText:
                    "Book Now"
                }
              }
            ) +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business,
              "About Hotel"
            ) +

            '<section class="ubx-section">' +
            "<h2>Rooms</h2>" +
            '<div class="ubx-feature-grid">' +

            '<div class="ubx-feature-card">' +
            "<h3>Standard Room</h3>" +
            "<p>Room information will appear here.</p>" +
            "</div>" +

            '<div class="ubx-feature-card">' +
            "<h3>Deluxe Room</h3>" +
            "<p>Room information will appear here.</p>" +
            "</div>" +

            "</div>" +
            "</section>" +

            '<section class="ubx-section">' +
            "<h2>Amenities</h2>" +
            '<div class="ubx-feature-grid">' +

            '<div class="ubx-feature-card">WiFi</div>' +
            '<div class="ubx-feature-card">Parking</div>' +
            '<div class="ubx-feature-card">Room Service</div>' +
            '<div class="ubx-feature-card">Restaurant</div>' +

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
            "<h3>Reservation</h3>" +
            '<div class="ubx-actions ubx-actions-column">' +
            U.actionsHTML(
              business,
              {
                callText:
                  "Call for Booking",

                whatsappText:
                  "WhatsApp Booking",

                websiteText:
                  "Book Online"
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

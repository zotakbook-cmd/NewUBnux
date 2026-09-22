(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;

  var U =
    T.utils;


  T.register(
    "service",
    {

      render:
        function (
          business,
          route
        ) {

          return (
            '<div class="ubx-business-template ubx-template-service">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route,
              {
                className:
                  "ubx-service-hero",

                actions: {
                  callText:
                    "Call",

                  whatsappText:
                    "Get Quote",

                  websiteText:
                    "Website"
                }
              }
            ) +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business,
              "About Service Provider"
            ) +

            '<section class="ubx-section">' +
            "<h2>Services</h2>" +
            '<div class="ubx-placeholder-card">' +
            "Services offered by this business will appear here." +
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
            "<h3>Get in Touch</h3>" +
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

(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;

  var U =
    T.utils;


  T.register(
    "coaching",
    {

      render:
        function (
          business,
          route
        ) {

          return (
            '<div class="ubx-business-template ubx-template-coaching">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route,
              {
                className:
                  "ubx-coaching-hero",

                actions: {
                  callText:
                    "Call Institute",

                  whatsappText:
                    "Enquire Now",

                  websiteText:
                    "Visit Website"
                }
              }
            ) +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business,
              "About Institute"
            ) +

            '<section class="ubx-section">' +
            "<h2>Courses</h2>" +
            '<div class="ubx-placeholder-card">' +
            "Available courses will appear here." +
            "</div>" +
            "</section>" +

            '<section class="ubx-section">' +
            "<h2>Facilities</h2>" +

            '<div class="ubx-feature-grid">' +
            '<div class="ubx-feature-card">Classroom</div>' +
            '<div class="ubx-feature-card">Study Material</div>' +
            '<div class="ubx-feature-card">Tests</div>' +
            '<div class="ubx-feature-card">Doubt Support</div>' +
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
            "<h3>Admission Enquiry</h3>" +
            '<div class="ubx-actions ubx-actions-column">' +
            U.actionsHTML(
              business,
              {
                callText:
                  "Call for Admission",

                whatsappText:
                  "WhatsApp Enquiry"
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

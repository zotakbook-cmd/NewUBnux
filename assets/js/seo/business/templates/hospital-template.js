(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;

  var U =
    T.utils;


  T.register(
    "hospital",
    {

      render:
        function (
          business,
          route
        ) {

          return (
            '<div class="ubx-business-template ubx-template-hospital">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route,
              {
                className:
                  "ubx-hospital-hero",

                actions: {
                  callText:
                    "Call Hospital",

                  whatsappText:
                    "Contact",

                  websiteText:
                    "Hospital Website"
                }
              }
            ) +

            '<div class="ubx-emergency-strip">' +
            "<strong>Emergency Contact</strong>" +
            '<div class="ubx-actions">' +
            U.actionsHTML(
              business,
              {
                callText:
                  "Call Emergency"
              }
            ) +
            "</div>" +
            "</div>" +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business,
              "About Hospital"
            ) +

            '<section class="ubx-section">' +
            "<h2>Departments</h2>" +
            '<div class="ubx-feature-grid">' +
            '<div class="ubx-feature-card">General Medicine</div>' +
            '<div class="ubx-feature-card">Emergency</div>' +
            '<div class="ubx-feature-card">Diagnostics</div>' +
            '<div class="ubx-feature-card">Specialist Care</div>' +
            "</div>" +
            "</section>" +

            '<section class="ubx-section">' +
            "<h2>Doctors</h2>" +
            '<div class="ubx-placeholder-card">' +
            "Doctors and OPD information will appear here." +
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

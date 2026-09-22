/* =========================================================
   UBnux - Default Business Template
   ========================================================= */

(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;


  var U =
    T.utils;


  T.register(
    "default",
    {

      render:
        function (
          business,
          route
        ) {

          return (
            '<div class="ubx-business-template ubx-template-default">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route
            ) +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business
            ) +

            U.locationHTML(
              business
            ) +

            "</main>" +

            '<aside class="ubx-sidebar">' +

            U.hoursHTML(
              business
            ) +

            U.socialHTML(
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

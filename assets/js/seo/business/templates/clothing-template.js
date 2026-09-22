(function (window) {

  "use strict";


  var T =
    window.UBnuxBusinessTemplates;

  var U =
    T.utils;


  T.register(
    "clothing",
    {

      render:
        function (
          business,
          route
        ) {

          return (
            '<div class="ubx-business-template ubx-template-clothing">' +

            U.breadcrumbs(
              route,
              business
            ) +

            U.heroHTML(
              business,
              route,
              {
                className:
                  "ubx-fashion-hero",

                actions: {
                  callText:
                    "Call Store",

                  whatsappText:
                    "Shop on WhatsApp",

                  websiteText:
                    "Visit Store"
                }
              }
            ) +

            '<div class="ubx-layout">' +

            '<main class="ubx-main">' +

            U.aboutHTML(
              business,
              "About This Store"
            ) +

            '<section class="ubx-section">' +
            "<h2>Products</h2>" +

            '<div class="ubx-feature-grid">' +

            '<div class="ubx-feature-card">' +
            "<h3>Men's Wear</h3>" +
            "<p>Explore available men's fashion.</p>" +
            "</div>" +

            '<div class="ubx-feature-card">' +
            "<h3>Women's Wear</h3>" +
            "<p>Explore women's fashion collection.</p>" +
            "</div>" +

            '<div class="ubx-feature-card">' +
            "<h3>Kids Wear</h3>" +
            "<p>Clothing and fashion for kids.</p>" +
            "</div>" +

            '<div class="ubx-feature-card">' +
            "<h3>Accessories</h3>" +
            "<p>Fashion accessories and related products.</p>" +
            "</div>" +

            "</div>" +
            "</section>" +

            '<section class="ubx-section">' +
            "<h2>Latest Collection</h2>" +
            '<div class="ubx-placeholder-card">' +
            "Business products and gallery will appear here." +
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

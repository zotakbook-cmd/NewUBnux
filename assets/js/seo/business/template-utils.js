/* =========================================================
   UBnux - Business Template Utilities
   File:
   assets/js/seo/business/template-utils.js

   Version:
   1.0.0
   ========================================================= */

(function (window, document) {

  "use strict";


  window.UBnuxBusinessTemplates =
    window.UBnuxBusinessTemplates || {};


  var Templates =
    window.UBnuxBusinessTemplates;


  /* =======================================================
     BASIC HELPERS
     ======================================================= */

  function safe(value) {

    return String(
      value == null
        ? ""
        : value
    ).trim();

  }


  function escapeHTML(value) {

    return String(
      value == null
        ? ""
        : value
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function value(
    business,
    keys
  ) {

    business =
      business || {};


    for (
      var i = 0;
      i < keys.length;
      i++
    ) {

      var key =
        keys[i];


      if (
        business[key] !== undefined &&
        business[key] !== null &&
        String(
          business[key]
        ).trim() !== ""
      ) {

        return business[key];

      }

    }


    return "";

  }


  function yes(value) {

    var text =
      safe(value)
        .toLowerCase();


    return (
      text === "yes" ||
      text === "true" ||
      text === "1"
    );

  }


  function normalizeURL(url) {

    url =
      safe(url);


    if (!url) {
      return "";
    }


    if (
      /^https?:\/\//i.test(url)
    ) {

      return url;

    }


    return "https://" + url;

  }


  function digits(value) {

    return safe(value)
      .replace(
        /[^0-9]/g,
        ""
      );

  }


  function slug(value) {

    return safe(value)
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  }


  /* =======================================================
     BUSINESS GETTERS
     ======================================================= */

  function name(business) {

    return safe(
      value(
        business,
        [
          "BusinessName",
          "businessName",
          "Name",
          "name"
        ]
      )
    );

  }


  function description(business) {

    return safe(
      value(
        business,
        [
          "LongDescription",
          "longDescription",
          "Description",
          "description",
          "ShortDescription",
          "shortDescription"
        ]
      )
    );

  }


  function shortDescription(
    business
  ) {

    return safe(
      value(
        business,
        [
          "ShortDescription",
          "shortDescription",
          "Description",
          "description"
        ]
      )
    );

  }


  function logo(business) {

    return safe(
      value(
        business,
        [
          "LogoURL",
          "logoURL",
          "LogoUrl",
          "logoUrl"
        ]
      )
    );

  }


  function cover(business) {

    return safe(
      value(
        business,
        [
          "CoverURL",
          "coverURL",
          "CoverUrl",
          "coverUrl",
          "LogoURL",
          "logoURL"
        ]
      )
    );

  }


  function mobile(business) {

    return safe(
      value(
        business,
        [
          "Mobile",
          "mobile",
          "Phone",
          "phone"
        ]
      )
    );

  }


  function whatsapp(business) {

    return safe(
      value(
        business,
        [
          "WhatsApp",
          "Whatsapp",
          "whatsapp"
        ]
      )
    );

  }


  function website(business) {

    return safe(
      value(
        business,
        [
          "WebsiteURL",
          "websiteURL",
          "WebsiteUrl",
          "websiteUrl"
        ]
      )
    );

  }


  function address(business) {

    var parts = [];


    var addressValue =
      safe(
        value(
          business,
          [
            "Address",
            "address"
          ]
        )
      );


    var area =
      safe(
        value(
          business,
          [
            "Area",
            "area"
          ]
        )
      );


    var pincode =
      safe(
        value(
          business,
          [
            "Pincode",
            "pincode"
          ]
        )
      );


    if (addressValue) {
      parts.push(addressValue);
    }


    if (area) {
      parts.push(area);
    }


    if (pincode) {
      parts.push(pincode);
    }


    return parts.join(", ");

  }


  function categoryName(
    business
  ) {

    return safe(
      value(
        business,
        [
          "CategoryName",
          "categoryName"
        ]
      )
    );

  }


  function rating(business) {

    return safe(
      value(
        business,
        [
          "Rating",
          "rating"
        ]
      )
    );

  }


  function reviewCount(
    business
  ) {

    return safe(
      value(
        business,
        [
          "ReviewCount",
          "reviewCount"
        ]
      )
    );

  }


  function openingTime(
    business
  ) {

    return safe(
      value(
        business,
        [
          "OpeningTime",
          "openingTime"
        ]
      )
    );

  }


  function closingTime(
    business
  ) {

    return safe(
      value(
        business,
        [
          "ClosingTime",
          "closingTime"
        ]
      )
    );

  }


  function workingDays(
    business
  ) {

    return safe(
      value(
        business,
        [
          "WorkingDays",
          "workingDays"
        ]
      )
    );

  }


  /* =======================================================
     UI HELPERS
     ======================================================= */

  function ratingHTML(
    business
  ) {

    var r =
      rating(business);

    var count =
      reviewCount(business);


    if (!r) {
      return "";
    }


    return (
      '<div class="ubx-rating">' +
      '<span class="ubx-rating-star">★</span>' +
      '<strong>' +
      escapeHTML(r) +
      "</strong>" +
      (
        count
          ? '<span class="ubx-rating-count">(' +
            escapeHTML(count) +
            " reviews)</span>"
          : ""
      ) +
      "</div>"
    );

  }


  function badgeHTML(
    business
  ) {

    var html = "";


    if (
      yes(
        value(
          business,
          [
            "Verified",
            "verified"
          ]
        )
      )
    ) {

      html +=
        '<span class="ubx-badge ubx-badge-verified">' +
        "Verified" +
        "</span>";

    }


    if (
      yes(
        value(
          business,
          [
            "Featured",
            "featured"
          ]
        )
      )
    ) {

      html +=
        '<span class="ubx-badge ubx-badge-featured">' +
        "Featured" +
        "</span>";

    }


    return html;

  }


  function actionsHTML(
    business,
    options
  ) {

    options =
      options || {};


    var html = "";


    var phone =
      mobile(business);


    var wa =
      digits(
        whatsapp(business)
      );


    var site =
      normalizeURL(
        website(business)
      );


    if (phone) {

      html +=
        '<a class="ubx-action ubx-action-call" href="tel:' +
        encodeURIComponent(phone) +
        '">' +
        (
          options.callText ||
          "Call"
        ) +
        "</a>";

    }


    if (wa) {

      html +=
        '<a class="ubx-action ubx-action-whatsapp" ' +
        'href="https://wa.me/' +
        wa +
        '" target="_blank" rel="noopener noreferrer">' +
        (
          options.whatsappText ||
          "WhatsApp"
        ) +
        "</a>";

    }


    if (site) {

      html +=
        '<a class="ubx-action ubx-action-website" ' +
        'href="' +
        escapeHTML(site) +
        '" target="_blank" rel="noopener noreferrer">' +
        (
          options.websiteText ||
          "Website"
        ) +
        "</a>";

    }


    return html;

  }


  function hoursHTML(
    business
  ) {

    var open =
      openingTime(business);

    var close =
      closingTime(business);

    var days =
      workingDays(business);


    if (
      !open &&
      !close &&
      !days
    ) {

      return "";

    }


    return (
      '<div class="ubx-info-card">' +
      "<h3>Opening Hours</h3>" +
      (
        open || close
          ? "<p>" +
            escapeHTML(open) +
            (
              close
                ? " - " +
                  escapeHTML(close)
                : ""
            ) +
            "</p>"
          : ""
      ) +
      (
        days
          ? "<small>" +
            escapeHTML(days) +
            "</small>"
          : ""
      ) +
      "</div>"
    );

  }


  function aboutHTML(
    business,
    heading
  ) {

    var text =
      description(business);


    if (!text) {
      return "";
    }


    return (
      '<section class="ubx-section">' +
      "<h2>" +
      escapeHTML(
        heading ||
        (
          "About " +
          name(business)
        )
      ) +
      "</h2>" +
      '<div class="ubx-rich-text">' +
      escapeHTML(text)
        .replace(
          /\n/g,
          "<br>"
        ) +
      "</div>" +
      "</section>"
    );

  }


  function locationHTML(
    business
  ) {

    var fullAddress =
      address(business);


    if (!fullAddress) {
      return "";
    }


    return (
      '<section class="ubx-section">' +
      "<h2>Location</h2>" +
      '<div class="ubx-location-card">' +
      "<p>" +
      escapeHTML(fullAddress) +
      "</p>" +
      "</div>" +
      "</section>"
    );

  }


  function socialHTML(
    business
  ) {

    var fields = [
      [
        "FacebookURL",
        "Facebook"
      ],
      [
        "InstagramURL",
        "Instagram"
      ],
      [
        "YoutubeURL",
        "YouTube"
      ]
    ];


    var html = "";


    fields.forEach(
      function (item) {

        var url =
          normalizeURL(
            value(
              business,
              [
                item[0],
                item[0].charAt(0).toLowerCase() +
                item[0].slice(1)
              ]
            )
          );


        if (url) {

          html +=
            '<a href="' +
            escapeHTML(url) +
            '" target="_blank" rel="noopener noreferrer">' +
            item[1] +
            "</a>";

        }

      }
    );


    if (!html) {
      return "";
    }


    return (
      '<section class="ubx-section">' +
      "<h2>Social Media</h2>" +
      '<div class="ubx-social-links">' +
      html +
      "</div>" +
      "</section>"
    );

  }


  function breadcrumbs(
    route,
    business
  ) {

    return (
      '<nav class="ubx-breadcrumb">' +
      '<a href="/">Home</a>' +
      "<span>›</span>" +
      '<a href="/in/' +
      encodeURIComponent(
        route.stateSlug
      ) +
      "/" +
      encodeURIComponent(
        route.districtSlug
      ) +
      '/">' +
      escapeHTML(
        route.districtSlug
      ) +
      "</a>" +
      "<span>›</span>" +
      '<a href="/in/' +
      encodeURIComponent(
        route.stateSlug
      ) +
      "/" +
      encodeURIComponent(
        route.districtSlug
      ) +
      "/" +
      encodeURIComponent(
        route.categorySlug
      ) +
      '/">' +
      escapeHTML(
        categoryName(business) ||
        route.categorySlug
      ) +
      "</a>" +
      "</nav>"
    );

  }


  function heroHTML(
    business,
    route,
    options
  ) {

    options =
      options || {};


    var businessName =
      name(business);


    var coverImage =
      cover(business);


    var logoImage =
      logo(business);


    return (
      '<section class="ubx-hero ' +
      escapeHTML(
        options.className || ""
      ) +
      '">' +

      (
        coverImage
          ? '<div class="ubx-cover-wrap">' +
            '<img class="ubx-cover" src="' +
            escapeHTML(coverImage) +
            '" alt="' +
            escapeHTML(businessName) +
            '">' +
            "</div>"
          : ""
      ) +

      '<div class="ubx-profile">' +

      (
        logoImage
          ? '<div class="ubx-logo-wrap">' +
            '<img class="ubx-logo" src="' +
            escapeHTML(logoImage) +
            '" alt="' +
            escapeHTML(businessName) +
            ' logo">' +
            "</div>"
          : ""
      ) +

      '<div class="ubx-profile-main">' +

      '<div class="ubx-badges">' +
      badgeHTML(business) +
      "</div>" +

      "<h1>" +
      escapeHTML(businessName) +
      "</h1>" +

      (
        categoryName(business)
          ? '<div class="ubx-category">' +
            escapeHTML(
              categoryName(business)
            ) +
            "</div>"
          : ""
      ) +

      ratingHTML(business) +

      (
        address(business)
          ? '<div class="ubx-address">' +
            escapeHTML(
              address(business)
            ) +
            "</div>"
          : ""
      ) +

      '<div class="ubx-actions">' +
      actionsHTML(
        business,
        options.actions || {}
      ) +
      "</div>" +

      "</div>" +
      "</div>" +
      "</section>"
    );

  }


  /* =======================================================
     EXPORT
     ======================================================= */

  Templates.utils = {

    safe:
      safe,

    escapeHTML:
      escapeHTML,

    value:
      value,

    yes:
      yes,

    slug:
      slug,

    name:
      name,

    description:
      description,

    shortDescription:
      shortDescription,

    logo:
      logo,

    cover:
      cover,

    mobile:
      mobile,

    whatsapp:
      whatsapp,

    website:
      website,

    address:
      address,

    categoryName:
      categoryName,

    rating:
      rating,

    reviewCount:
      reviewCount,

    openingTime:
      openingTime,

    closingTime:
      closingTime,

    workingDays:
      workingDays,

    ratingHTML:
      ratingHTML,

    badgeHTML:
      badgeHTML,

    actionsHTML:
      actionsHTML,

    hoursHTML:
      hoursHTML,

    aboutHTML:
      aboutHTML,

    locationHTML:
      locationHTML,

    socialHTML:
      socialHTML,

    breadcrumbs:
      breadcrumbs,

    heroHTML:
      heroHTML

  };


})(window, document);

/* =========================================================
   UBnux - Business Detail Page
   File:
   assets/js/seo/business-page.js

   Version:
   3.2.0

   Responsibilities:
   - Read SEO business URL
   - Resolve business through UBnux API
   - Render business detail
   - Update SEO metadata
   - Generate basic Schema data
   - Handle loading / error states
   - Control page visibility
   - NEVER redirect the browser
   ========================================================= */

(function (window, document) {

  "use strict";


  /* =======================================================
     NAMESPACE
     ======================================================= */

  window.UBnux =
    window.UBnux ||
    window.ZilaBiz ||
    {};

  window.ZilaBiz =
    window.UBnux;

  var App =
    window.UBnux;


  /* =======================================================
     CONFIG
     ======================================================= */

  var CONFIG = {

    SITE_NAME:
      "UBnux",

    SITE_URL:
      "https://ubnux.com",

    DEFAULT_IMAGE:
      "/assets/images/default-business.jpg"

  };


  /* =======================================================
     DOM HELPERS
     ======================================================= */

  function $(selector) {

    return document.querySelector(
      selector
    );

  }


  function escapeHTML(value) {

    return String(
      value == null
        ? ""
        : value
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  function safe(value) {

    return String(
      value == null
        ? ""
        : value
    ).trim();

  }


  /* =======================================================
     LOADER
     ======================================================= */

  function showLoader() {

    var loader =
      $("#businessPageLoader");

    if (!loader) {
      return;
    }

    loader.style.display =
      "flex";

  }


  function hideLoader() {

    var loader =
      $("#businessPageLoader");

    if (!loader) {
      return;
    }

    loader.style.display =
      "none";

  }


  /* =======================================================
     ERROR
     ======================================================= */

  function showError(
    message
  ) {

    hideLoader();

    var page =
      $("#businessPage");

    var content =
      $("#businessPageContent");

    var errorBox =
      $("#businessPageError");


    /*
       Show parent page so that
       error section can actually be seen.
    */

    if (page) {

      page.hidden = false;

      page.removeAttribute(
        "hidden"
      );

      page.style.display =
        "";

    }


    /*
       Hide normal business content.
    */

    if (content) {

      content.hidden = true;

      content.style.display =
        "none";

    }


    /*
       Error container missing.
    */

    if (!errorBox) {

      console.error(
        "[UBnux Business]",
        message
      );

      return;

    }


    /*
       Show error.
    */

    errorBox.hidden = false;

    errorBox.removeAttribute(
      "hidden"
    );

    errorBox.style.display =
      "block";


    var messageElement =
      errorBox.querySelector(
        "[data-error-message]"
      );


    /*
       Support existing static
       #businessErrorMessage also.
    */

    if (!messageElement) {

      messageElement =
        $("#businessErrorMessage");

    }


    if (messageElement) {

      messageElement.textContent =
        message;

    } else {

      errorBox.innerHTML =
        "<div class=\"business-error-inner\">" +
        "<h2>Business not found</h2>" +
        "<p>" +
        escapeHTML(
          message
        ) +
        "</p>" +
        "<a href=\"/\" class=\"business-error-home\">" +
        "Go to Home" +
        "</a>" +
        "</div>";

    }

  }


  /* =======================================================
     BUSINESS PAGE VISIBILITY
     ======================================================= */

  function showBusinessPage() {

    var page =
      $("#businessPage");

    var content =
      $("#businessPageContent");

    var errorBox =
      $("#businessPageError");


    /*
       IMPORTANT:

       business.html contains:

       <main
         id="businessPage"
         class="business-page"
         hidden
       >

       Therefore content alone cannot
       make the page visible.

       We explicitly remove hidden.
    */

    if (page) {

      page.hidden = false;

      page.removeAttribute(
        "hidden"
      );

      page.style.display =
        "";

    }


    /*
       Show business content.
    */

    if (content) {

      content.hidden = false;

      content.removeAttribute(
        "hidden"
      );

      content.style.display =
        "block";

    }


    /*
       Hide error state.
    */

    if (errorBox) {

      errorBox.hidden = true;

      errorBox.style.display =
        "none";

    }


    console.debug(
      "[UBnux Business] Business page visible."
    );

  }


  function hideBusinessPage() {

    var page =
      $("#businessPage");

    var content =
      $("#businessPageContent");

    var errorBox =
      $("#businessPageError");


    /*
       Hide parent.
    */

    if (page) {

      page.hidden = true;

      page.setAttribute(
        "hidden",
        ""
      );

      page.style.display =
        "none";

    }


    /*
       Hide content.
    */

    if (content) {

      content.hidden = true;

      content.style.display =
        "none";

    }


    /*
       Hide error.
    */

    if (errorBox) {

      errorBox.hidden = true;

      errorBox.style.display =
        "none";

    }

  }


  /* =======================================================
     URL / PATH
     ======================================================= */

  function getPathSegments() {

    var pathname =
      window.location.pathname ||
      "/";


    return pathname
      .split("/")
      .map(function (part) {

        return decodeURIComponent(
          part || ""
        ).trim();

      })
      .filter(function (part) {

        return part !== "";

      });

  }


  /* =======================================================
     BUSINESS ROUTE
     ======================================================= */

  function getBusinessRoute() {

    var segments =
      getPathSegments();


    /*
       Expected:

       /in/bihar/siwan/
       clothing-and-fashion/
       siwan-fashion-house/

       segments:

       0 = in
       1 = state
       2 = district
       3 = category
       4 = business
    */


    if (
      segments.length !== 5
    ) {

      return null;

    }


    if (
      String(
        segments[0]
      ).toLowerCase() !== "in"
    ) {

      return null;

    }


    var route = {

      type:
        "business",

      isBusinessPage:
        true,

      isSEOPage:
        true,

      stateSlug:
        safe(
          segments[1]
        ),

      districtSlug:
        safe(
          segments[2]
        ),

      categorySlug:
        safe(
          segments[3]
        ),

      businessSlug:
        safe(
          segments[4]
        )

    };


    /*
       Validate all SEO segments.
    */

    if (
      !route.stateSlug ||
      !route.districtSlug ||
      !route.categorySlug ||
      !route.businessSlug
    ) {

      return null;

    }


    /*
       Build canonical path.
    */

    route.canonicalPath =
      "/in/" +
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
      "/" +
      encodeURIComponent(
        route.businessSlug
      ) +
      "/";


    /*
       Build canonical URL.
    */

    route.canonicalURL =
      CONFIG.SITE_URL +
      route.canonicalPath;


    return route;

  }


  /* =======================================================
     CANONICAL
     ======================================================= */

  function setCanonical(
    url
  ) {

    if (!url) {
      return;
    }


    var canonical =
      document.querySelector(
        'link[rel="canonical"]'
      );


    if (!canonical) {

      canonical =
        document.createElement(
          "link"
        );

      canonical.rel =
        "canonical";

      document.head.appendChild(
        canonical
      );

    }


    canonical.href =
      url;

  }


  /* =======================================================
     META
     ======================================================= */

  function setMeta(
    name,
    content
  ) {

    if (
      !name ||
      content == null
    ) {

      return;

    }


    var selector =
      'meta[name="' +
      name +
      '"]';


    var element =
      document.querySelector(
        selector
      );


    if (!element) {

      element =
        document.createElement(
          "meta"
        );

      element.setAttribute(
        "name",
        name
      );

      document.head.appendChild(
        element
      );

    }


    element.setAttribute(
      "content",
      String(
        content
      )
    );

  }


  function setPropertyMeta(
    property,
    content
  ) {

    if (
      !property ||
      content == null
    ) {

      return;

    }


    var element =
      document.querySelector(
        'meta[property="' +
        property +
        '"]'
      );


    if (!element) {

      element =
        document.createElement(
          "meta"
        );

      element.setAttribute(
        "property",
        property
      );

      document.head.appendChild(
        element
      );

    }


    element.setAttribute(
      "content",
      String(
        content
      )
    );

  }


  /* =======================================================
     BUSINESS VALUE HELPERS
     ======================================================= */

  function businessValue(
    business,
    keys
  ) {

    for (
      var i = 0;
      i < keys.length;
      i++
    ) {

      var key =
        keys[i];


      if (
        business[key] !==
        undefined &&
        business[key] !==
        null &&
        String(
          business[key]
        ).trim() !== ""
      ) {

        return business[key];

      }

    }


    return "";

  }


  function getBusinessName(
    business
  ) {

    return safe(
      businessValue(
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


  function getBusinessDescription(
    business
  ) {

    return safe(
      businessValue(
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


  function getBusinessImage(
    business
  ) {

    return safe(
      businessValue(
        business,
        [
          "CoverURL",
          "coverURL",
          "CoverUrl",
          "coverUrl",
          "LogoURL",
          "logoURL",
          "LogoUrl",
          "logoUrl",
          "ImageURL",
          "imageURL",
          "image"
        ]
      )
    ) ||
    CONFIG.DEFAULT_IMAGE;

  }


  /* =======================================================
     SEO UPDATE
     ======================================================= */

  function updateSEO(
    business,
    route,
    seoData
  ) {

    var name =
      getBusinessName(
        business
      );


    var description =
      getBusinessDescription(
        business
      );


    var seoTitle =
      safe(
        businessValue(
          business,
          [
            "SEO_Title",
            "seoTitle",
            "SeoTitle"
          ]
        )
      );


    var seoDescription =
      safe(
        businessValue(
          business,
          [
            "SEO_Description",
            "seoDescription",
            "SeoDescription"
          ]
        )
      );


    /*
       Backend SEO data has priority
       only when business sheet value
       is not already available.
    */

    if (
      seoData &&
      typeof seoData ===
      "object"
    ) {

      seoTitle =
        seoTitle ||
        safe(
          seoData.title ||
          seoData.seoTitle ||
          seoData.SEO_Title
        );


      seoDescription =
        seoDescription ||
        safe(
          seoData.description ||
          seoData.seoDescription ||
          seoData.SEO_Description
        );

    }


    /*
       Default SEO title.
    */

    if (!seoTitle) {

      seoTitle =
        name
          ? name +
            " | UBnux"
          : "Business | UBnux";

    }


    /*
       Default description.
    */

    if (!seoDescription) {

      seoDescription =
        description ||
        (
          name
            ? name +
              " business information on UBnux."
            : "Business information on UBnux."
        );

    }


    /*
       Keep description within
       normal search snippet length.
    */

    if (
      seoDescription.length >
      160
    ) {

      seoDescription =
        seoDescription.substring(
          0,
          157
        ) +
        "...";

    }


    /*
       Document title.
    */

    document.title =
      seoTitle;


    /*
       Standard meta.
    */

    setMeta(
      "description",
      seoDescription
    );


    setMeta(
      "robots",
      "index,follow,max-image-preview:large"
    );


    /*
       Canonical.
    */

    setCanonical(
      route.canonicalURL
    );


    /*
       Image.
    */

    var image =
      getBusinessImage(
        business
      );


    /*
       Open Graph.
    */

    setPropertyMeta(
      "og:title",
      seoTitle
    );


    setPropertyMeta(
      "og:description",
      seoDescription
    );


    setPropertyMeta(
      "og:type",
      "business.business"
    );


    setPropertyMeta(
      "og:url",
      route.canonicalURL
    );


    setPropertyMeta(
      "og:image",
      image
    );


    setPropertyMeta(
      "og:site_name",
      CONFIG.SITE_NAME
    );


    /*
       Twitter.
    */

    setMeta(
      "twitter:card",
      "summary_large_image"
    );


    setMeta(
      "twitter:title",
      seoTitle
    );


    setMeta(
      "twitter:description",
      seoDescription
    );


    setMeta(
      "twitter:image",
      image
    );

  }


  /* =======================================================
     SCHEMA
     ======================================================= */

  function removeOldSchema() {

    var old =
      document.querySelector(
        "#ubnux-business-schema"
      );


    if (old) {

      old.remove();

    }

  }


  function createSchema(
    business,
    route
  ) {

    removeOldSchema();


    var name =
      getBusinessName(
        business
      );


    if (!name) {
      return;
    }


    var description =
      getBusinessDescription(
        business
      );


    var image =
      getBusinessImage(
        business
      );


    var address =
      safe(
        businessValue(
          business,
          [
            "Address",
            "address"
          ]
        )
      );


    var area =
      safe(
        businessValue(
          business,
          [
            "Area",
            "area"
          ]
        )
      );


    var pincode =
      safe(
        businessValue(
          business,
          [
            "Pincode",
            "pincode"
          ]
        )
      );


    var district =
      safe(
        businessValue(
          business,
          [
            "DistrictName",
            "districtName",
            "District",
            "district"
          ]
        )
      );


    var state =
      safe(
        businessValue(
          business,
          [
            "State",
            "state",
            "StateName",
            "stateName"
          ]
        )
      );


    var telephone =
      safe(
        businessValue(
          business,
          [
            "Mobile",
            "mobile",
            "Phone",
            "phone"
          ]
        )
      );


    var whatsapp =
      safe(
        businessValue(
          business,
          [
            "WhatsApp",
            "Whatsapp",
            "whatsapp"
          ]
        )
      );


    var latitude =
      safe(
        businessValue(
          business,
          [
            "Latitude",
            "latitude"
          ]
        )
      );


    var longitude =
      safe(
        businessValue(
          business,
          [
            "Longitude",
            "longitude"
          ]
        )
      );


    var rating =
      safe(
        businessValue(
          business,
          [
            "Rating",
            "rating"
          ]
        )
      );


    var reviewCount =
      safe(
        businessValue(
          business,
          [
            "ReviewCount",
            "reviewCount"
          ]
        )
      );


    var schema = {

      "@context":
        "https://schema.org",

      "@type":
        "LocalBusiness",

      "@id":
        route.canonicalURL +
        "#business",

      name:
        name,

      url:
        route.canonicalURL,

      description:
        description,

      image:
        image

    };


    /*
       Telephone.
    */

    if (telephone) {

      schema.telephone =
        telephone;

    }


    /*
       Address.
    */

    if (
      address ||
      area ||
      district ||
      state ||
      pincode
    ) {

      schema.address = {

        "@type":
          "PostalAddress",

        streetAddress:
          address,

        addressLocality:
          area ||
          district,

        addressRegion:
          state,

        postalCode:
          pincode,

        addressCountry:
          "IN"

      };

    }


    /*
       Geo.
    */

    if (
      latitude &&
      longitude
    ) {

      schema.geo = {

        "@type":
          "GeoCoordinates",

        latitude:
          latitude,

        longitude:
          longitude

      };

    }


    /*
       Rating.
    */

    if (
      rating &&
      reviewCount
    ) {

      var ratingNumber =
        Number(
          rating
        );


      var reviewNumber =
        Number(
          reviewCount
        );


      if (
        !isNaN(
          ratingNumber
        ) &&
        !isNaN(
          reviewNumber
        ) &&
        reviewNumber > 0
      ) {

        schema.aggregateRating = {

          "@type":
            "AggregateRating",

          ratingValue:
            ratingNumber,

          reviewCount:
            reviewNumber

        };

      }

    }


    /*
       Website.
    */

    var website =
      safe(
        businessValue(
          business,
          [
            "WebsiteURL",
            "websiteURL",
            "WebsiteUrl",
            "websiteUrl"
          ]
        )
      );


    if (website) {

      schema.sameAs =
        [
          website
        ];

    }


    /*
       Inject JSON-LD.
    */

    var script =
      document.createElement(
        "script"
      );


    script.id =
      "ubnux-business-schema";


    script.type =
      "application/ld+json";


    script.textContent =
      JSON.stringify(
        schema
      );


    document.head.appendChild(
      script
    );

  }


  /* =======================================================
     RESPONSE EXTRACTION
     ======================================================= */

  function extractBusiness(
    response
  ) {

    if (!response) {
      return null;
    }


    /*
       Possible response structures:

       {
         success:true,
         business:{...}
       }

       {
         success:true,
         data:{
           business:{...}
         }
       }

       {
         success:true,
         seo:{
           business:{...}
         }
       }

       {
         success:true,
         result:{
           business:{...}
         }
       }

       {
         success:true,
         data:{...business...}
       }

       {
         BusinessID:"..."
       }
    */


    if (
      response.business &&
      typeof response.business ===
      "object"
    ) {

      return response.business;

    }


    if (
      response.data &&
      response.data.business &&
      typeof response.data.business ===
      "object"
    ) {

      return response.data.business;

    }


    if (
      response.seo &&
      response.seo.business &&
      typeof response.seo.business ===
      "object"
    ) {

      return response.seo.business;

    }


    if (
      response.result &&
      response.result.business &&
      typeof response.result.business ===
      "object"
    ) {

      return response.result.business;

    }


    if (
      response.data &&
      typeof response.data ===
      "object" &&
      (
        response.data.BusinessID ||
        response.data.businessID ||
        response.data.BusinessName ||
        response.data.businessName
      )
    ) {

      return response.data;

    }


    if (
      response.BusinessID ||
      response.businessID ||
      response.BusinessName ||
      response.businessName
    ) {

      return response;

    }


    return null;

  }


  function extractSEO(
    response
  ) {

    if (!response) {
      return {};
    }


    if (
      response.seo &&
      typeof response.seo ===
      "object"
    ) {

      return response.seo;

    }


    if (
      response.data &&
      response.data.seo &&
      typeof response.data.seo ===
      "object"
    ) {

      return response.data.seo;

    }


    return {};

  }


  /* =======================================================
     API LOAD
     ======================================================= */

  async function loadBusiness(
    route
  ) {

    /*
       IMPORTANT:

       api.js currently exports:

       UBnuxAPI.getBusiness(params)

       NOT:

       getBusinessBySlug()

       Therefore use getBusiness()
       with SEO parameters.
    */


    if (
      !window.UBnuxAPI ||
      typeof
      window.UBnuxAPI.getBusiness !==
      "function"
    ) {

      throw new Error(
        "UBnux Business API is not available. Check api.js loading."
      );

    }


    console.debug(
      "[UBnux Business] Loading:",
      {
        state:
          route.stateSlug,

        district:
          route.districtSlug,

        category:
          route.categorySlug,

        slug:
          route.businessSlug
      }
    );


    var response =
      await
        window
          .UBnuxAPI
          .getBusiness({

            state:
              route.stateSlug,

            district:
              route.districtSlug,

            category:
              route.categorySlug,

            slug:
              route.businessSlug

          });


    console.debug(
      "[UBnux Business] API response:",
      response
    );


    if (!response) {

      throw new Error(
        "Empty response received from business API."
      );

    }


    if (
      response.success === false
    ) {

      throw new Error(
        safe(
          response.message
        ) ||
        "Business not found."
      );

    }


    var business =
      extractBusiness(
        response
      );


    if (!business) {

      throw new Error(
        "Business data was not found in API response."
      );

    }


    return {

      response:
        response,

      business:
        business,

      seo:
        extractSEO(
          response
        )

    };

  }


  /* =======================================================
     BUSINESS HTML
     ======================================================= */

  function renderBusiness(
    business,
    route
  ) {

    var content =
      $("#businessPageContent");


    if (!content) {

      console.error(
        "[UBnux Business] #businessPageContent not found."
      );

      return;

    }


    var name =
      getBusinessName(
        business
      );


    var description =
      getBusinessDescription(
        business
      );


    var image =
      getBusinessImage(
        business
      );


    var address =
      safe(
        businessValue(
          business,
          [
            "Address",
            "address"
          ]
        )
      );


    var area =
      safe(
        businessValue(
          business,
          [
            "Area",
            "area"
          ]
        )
      );


    var pincode =
      safe(
        businessValue(
          business,
          [
            "Pincode",
            "pincode"
          ]
        )
      );


    var mobile =
      safe(
        businessValue(
          business,
          [
            "Mobile",
            "mobile"
          ]
        )
      );


    var whatsapp =
      safe(
        businessValue(
          business,
          [
            "WhatsApp",
            "Whatsapp",
            "whatsapp"
          ]
        )
      );


    var website =
      safe(
        businessValue(
          business,
          [
            "WebsiteURL",
            "websiteURL",
            "WebsiteUrl",
            "websiteUrl"
          ]
        )
      );


    var rating =
      safe(
        businessValue(
          business,
          [
            "Rating",
            "rating"
          ]
        )
      );


    var reviewCount =
      safe(
        businessValue(
          business,
          [
            "ReviewCount",
            "reviewCount"
          ]
        )
      );


    var verified =
      safe(
        businessValue(
          business,
          [
            "Verified",
            "verified"
          ]
        )
      );


    var featured =
      safe(
        businessValue(
          business,
          [
            "Featured",
            "featured"
          ]
        )
      );


    var openingTime =
      safe(
        businessValue(
          business,
          [
            "OpeningTime",
            "openingTime"
          ]
        )
      );


    var closingTime =
      safe(
        businessValue(
          business,
          [
            "ClosingTime",
            "closingTime"
          ]
        )
      );


    var workingDays =
      safe(
        businessValue(
          business,
          [
            "WorkingDays",
            "workingDays"
          ]
        )
      );


    var businessStatus =
      safe(
        businessValue(
          business,
          [
            "BusinessStatus",
            "businessStatus"
          ]
        )
      );


    /* =====================================================
       CALL BUTTON
       ===================================================== */

    var phoneHTML =
      "";


    if (mobile) {

      phoneHTML =
        '<a class="business-action-btn business-phone-btn" ' +
        'href="tel:' +
        encodeURIComponent(
          mobile
        ) +
        '">' +
        "Call" +
        "</a>";

    }


    /* =====================================================
       WHATSAPP BUTTON
       ===================================================== */

    var whatsappHTML =
      "";


    if (whatsapp) {

      var whatsappNumber =
        whatsapp.replace(
          /[^0-9]/g,
          ""
        );


      if (
        whatsappNumber
      ) {

        whatsappHTML =
          '<a class="business-action-btn business-whatsapp-btn" ' +
          'href="https://wa.me/' +
          whatsappNumber +
          '" ' +
          'target="_blank" ' +
          'rel="noopener noreferrer">' +
          "WhatsApp" +
          "</a>";

      }

    }


    /* =====================================================
       WEBSITE BUTTON
       ===================================================== */

    var websiteHTML =
      "";


    if (website) {

      websiteHTML =
        '<a class="business-action-btn business-website-btn" ' +
        'href="' +
        escapeHTML(
          website
        ) +
        '" ' +
        'target="_blank" ' +
        'rel="noopener noreferrer">' +
        "Website" +
        "</a>";

    }


    /* =====================================================
       VERIFIED BADGE
       ===================================================== */

    var verifiedHTML =
      "";


    if (
      String(
        verified
      ).toLowerCase() ===
      "yes" ||

      String(
        verified
      ).toLowerCase() ===
      "true" ||

      verified === "1"
    ) {

      verifiedHTML =
        '<span class="business-badge business-verified">' +
        "Verified" +
        "</span>";

    }


    /* =====================================================
       FEATURED BADGE
       ===================================================== */

    var featuredHTML =
      "";


    if (
      String(
        featured
      ).toLowerCase() ===
      "yes" ||

      String(
        featured
      ).toLowerCase() ===
      "true" ||

      featured === "1"
    ) {

      featuredHTML =
        '<span class="business-badge business-featured">' +
        "Featured" +
        "</span>";

    }


    /* =====================================================
       RATING
       ===================================================== */

    var ratingHTML =
      "";


    if (rating) {

      ratingHTML =
        '<div class="business-rating">' +
        "<strong>" +
        escapeHTML(
          rating
        ) +
        "</strong>" +
        (
          reviewCount
            ? " (" +
              escapeHTML(
                reviewCount
              ) +
              " reviews)"
            : ""
        ) +
        "</div>";

    }


    /* =====================================================
       ADDRESS
       ===================================================== */

    var addressParts =
      [];


    if (address) {

      addressParts.push(
        address
      );

    }


    if (area) {

      addressParts.push(
        area
      );

    }


    if (pincode) {

      addressParts.push(
        pincode
      );

    }


    var addressHTML =
      addressParts.length
        ? escapeHTML(
            addressParts.join(
              ", "
            )
          )
        : "Address not available";


    /* =====================================================
       OPENING HOURS
       ===================================================== */

    var hoursHTML =
      "";


    if (
      openingTime ||
      closingTime
    ) {

      hoursHTML =
        "<div>" +
        "<strong>Opening Hours:</strong> " +
        escapeHTML(
          openingTime ||
          ""
        ) +
        (
          closingTime
            ? " - " +
              escapeHTML(
                closingTime
              )
            : ""
        ) +
        "</div>";

    }


    /* =====================================================
       WORKING DAYS
       ===================================================== */

    var workingDaysHTML =
      "";


    if (workingDays) {

      workingDaysHTML =
        "<div>" +
        "<strong>Working Days:</strong> " +
        escapeHTML(
          workingDays
        ) +
        "</div>";

    }


    /* =====================================================
       BUSINESS STATUS
       ===================================================== */

    var statusHTML =
      "";


    if (businessStatus) {

      statusHTML =
        '<span class="business-status">' +
        escapeHTML(
          businessStatus
        ) +
        "</span>";

    }


    /* =====================================================
       RENDER HTML
       ===================================================== */

    content.innerHTML =

      '<div class="business-detail-page">' +

        '<div class="business-detail-hero">' +

          '<div class="business-detail-image-wrap">' +

            '<img ' +
              'class="business-detail-image" ' +
              'src="' +
              escapeHTML(
                image
              ) +
              '" ' +
              'alt="' +
              escapeHTML(
                name
              ) +
              '" ' +
              'loading="eager" ' +
              'onerror="this.onerror=null;this.src=\'' +
              escapeHTML(
                CONFIG.DEFAULT_IMAGE
              ) +
              '\';">' +

          "</div>" +

          '<div class="business-detail-info">' +

            '<div class="business-detail-badges">' +
              verifiedHTML +
              featuredHTML +
              statusHTML +
            "</div>" +

            '<h1 class="business-detail-title">' +
              escapeHTML(
                name ||
                "Business"
              ) +
            "</h1>" +

            ratingHTML +

            '<div class="business-detail-location">' +
              addressHTML +
            "</div>" +

            '<div class="business-detail-actions">' +
              phoneHTML +
              whatsappHTML +
              websiteHTML +
            "</div>" +

          "</div>" +

        "</div>" +


        '<div class="business-detail-body">' +

          '<section class="business-detail-section">' +

            "<h2>About " +
              escapeHTML(
                name
              ) +
            "</h2>" +

            '<div class="business-description">' +

              (
                description

                  ? escapeHTML(
                      description
                    ).replace(
                      /\n/g,
                      "<br>"
                    )

                  : "Business description is not available."
              ) +

            "</div>" +

          "</section>" +


          '<section class="business-detail-section">' +

            "<h2>Business Information</h2>" +

            '<div class="business-information-grid">' +

              (
                mobile

                  ? "<div>" +
                    "<strong>Mobile</strong>" +
                    "<span>" +
                    escapeHTML(
                      mobile
                    ) +
                    "</span>" +
                    "</div>"

                  : ""
              ) +


              (
                address

                  ? "<div>" +
                    "<strong>Address</strong>" +
                    "<span>" +
                    escapeHTML(
                      address
                    ) +
                    "</span>" +
                    "</div>"

                  : ""
              ) +


              (
                area

                  ? "<div>" +
                    "<strong>Area</strong>" +
                    "<span>" +
                    escapeHTML(
                      area
                    ) +
                    "</span>" +
                    "</div>"

                  : ""
              ) +


              (
                pincode

                  ? "<div>" +
                    "<strong>Pincode</strong>" +
                    "<span>" +
                    escapeHTML(
                      pincode
                    ) +
                    "</span>" +
                    "</div>"

                  : ""
              ) +


              (
                hoursHTML

                  ? "<div>" +
                    hoursHTML +
                    "</div>"

                  : ""
              ) +


              (
                workingDaysHTML

                  ? "<div>" +
                    workingDaysHTML +
                    "</div>"

                  : ""
              ) +

            "</div>" +

          "</section>" +

        "</div>" +

      "</div>";


    /* =====================================================
       FORCE VISIBILITY AFTER RENDER
       ===================================================== */

    var page =
      $("#businessPage");

    var errorBox =
      $("#businessPageError");


    /*
       Main parent was hidden in business.html.
    */

    if (page) {

      page.hidden = false;

      page.removeAttribute(
        "hidden"
      );

      page.style.display =
        "";

    }


    /*
       Content visible.
    */

    content.hidden = false;

    content.removeAttribute(
      "hidden"
    );

    content.style.display =
      "block";


    /*
       Error hidden.
    */

    if (errorBox) {

      errorBox.hidden = true;

      errorBox.style.display =
        "none";

    }


    console.debug(
      "[UBnux Business] Business HTML rendered."
    );

  }


  /* =======================================================
     MAIN INITIALIZATION
     ======================================================= */

  async function initializeBusinessPage() {

    console.debug(
      "[UBnux Business] Initializing..."
    );


    /*
       Keep page hidden while data loads.
       Loader works independently.
    */

    hideBusinessPage();

    showLoader();


    /*
       IMPORTANT:

       NEVER modify:

       window.location.href
       window.location.replace()
       window.location.assign()

       Browser URL remains:

       /in/bihar/siwan/
       clothing-and-fashion/
       siwan-fashion-house/
    */


    var route =
      getBusinessRoute();


    console.debug(
      "[UBnux Business] Route:",
      route
    );


    /* =====================================================
       INVALID ROUTE
       ===================================================== */

    if (!route) {

      showError(
        "Invalid business URL."
      );

      return;

    }


    try {

      /* ===================================================
         LOAD BUSINESS
         =================================================== */

      var loaded =
        await
          loadBusiness(
            route
          );


      /* ===================================================
         VALIDATE RESPONSE
         =================================================== */

      if (
        !loaded ||
        !loaded.business
      ) {

        throw new Error(
          "Business information was not found."
        );

      }


      var business =
        loaded.business;


      var seo =
        loaded.seo || {};


      /* ===================================================
         SEO
         =================================================== */

      try {

        updateSEO(
          business,
          route,
          seo
        );

      } catch (seoError) {

        console.warn(
          "[UBnux Business] SEO update failed:",
          seoError
        );

      }


      /* ===================================================
         SCHEMA
         =================================================== */

      try {

        createSchema(
          business,
          route
        );

      } catch (schemaError) {

        console.warn(
          "[UBnux Business] Schema creation failed:",
          schemaError
        );

      }


      /* ===================================================
         RENDER
         =================================================== */

      renderBusiness(
        business,
        route
      );


      /*
         VERY IMPORTANT:

         business.html contains:

         <main
           id="businessPage"
           class="business-page"
           hidden
         >

         Therefore renderBusiness()
         alone is not enough.

         Explicitly show parent page.
      */

      showBusinessPage();


      /* ===================================================
         HIDE LOADER
         =================================================== */

      hideLoader();


      /* ===================================================
         SUCCESS
         =================================================== */

      console.info(
        "[UBnux Business] Loaded successfully:",
        getBusinessName(
          business
        )
      );


    } catch (error) {

      console.error(
        "[UBnux Business] Failed:",
        error
      );


      showError(
        error &&
        error.message
          ? error.message
          : "Unable to load business information."
      );

    }

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  window.UBNUX_BUSINESS_PAGE = {

    version:
      "3.2.0",

    init:
      initializeBusinessPage,

    getRoute:
      getBusinessRoute,

    show:
      showBusinessPage,

    hide:
      hideBusinessPage

  };


  /* =======================================================
     DOM READY
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initializeBusinessPage
    );

  } else {

    initializeBusinessPage();

  }


})(window, document);

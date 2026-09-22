/* =========================================================
   UBnux - Business Detail Page Controller
   File:
   assets/js/seo/business-page.js

   Version:
   4.0.0

   Responsibilities:
   - Read permanent SEO URL
   - Fetch business data
   - Update SEO metadata
   - Generate Schema.org JSON-LD
   - Detect category template
   - Render correct category business page
   - Handle loading / errors
   - NEVER redirect browser
   ========================================================= */

(function (window, document) {

  "use strict";


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
     HELPERS
     ======================================================= */

  function $(selector) {

    return document.querySelector(
      selector
    );

  }


  function safe(value) {

    return String(
      value == null
        ? ""
        : value
    ).trim();

  }


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
          "LogoURL",
          "logoURL"
        ]
      )
    ) ||
    CONFIG.DEFAULT_IMAGE;

  }


  /* =======================================================
     VISIBILITY
     ======================================================= */

  function showLoader() {

    var loader =
      $("#businessPageLoader");


    if (loader) {

      loader.style.display =
        "flex";

    }

  }


  function hideLoader() {

    var loader =
      $("#businessPageLoader");


    if (loader) {

      loader.style.display =
        "none";

    }

  }


  function hideBusinessPage() {

    var page =
      $("#businessPage");


    var content =
      $("#businessPageContent");


    var errorBox =
      $("#businessPageError");


    if (page) {

      page.hidden =
        true;

      page.style.display =
        "none";

    }


    if (content) {

      content.style.display =
        "none";

    }


    if (errorBox) {

      errorBox.hidden =
        true;

      errorBox.style.display =
        "none";

    }

  }


  function showBusinessPage() {

    var page =
      $("#businessPage");


    var content =
      $("#businessPageContent");


    var errorBox =
      $("#businessPageError");


    if (page) {

      page.hidden =
        false;

      page.removeAttribute(
        "hidden"
      );

      page.style.display =
        "";

    }


    if (content) {

      content.hidden =
        false;

      content.removeAttribute(
        "hidden"
      );

      content.style.display =
        "block";

    }


    if (errorBox) {

      errorBox.hidden =
        true;

      errorBox.style.display =
        "none";

    }

  }


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


    var errorMessage =
      $("#businessErrorMessage");


    if (page) {

      page.hidden =
        false;

      page.removeAttribute(
        "hidden"
      );

      page.style.display =
        "";

    }


    if (content) {

      content.style.display =
        "none";

    }


    if (errorBox) {

      errorBox.hidden =
        false;

      errorBox.removeAttribute(
        "hidden"
      );

      errorBox.style.display =
        "block";

    }


    if (errorMessage) {

      errorMessage.textContent =
        message;

    }


    console.error(
      "[UBnux Business]",
      message
    );

  }


  /* =======================================================
     ROUTE
     ======================================================= */

  function getBusinessRoute() {

    var segments =
      (
        window.location.pathname ||
        "/"
      )
        .split("/")
        .map(
          function (part) {

            return decodeURIComponent(
              part || ""
            ).trim();

          }
        )
        .filter(
          function (part) {

            return part !== "";

          }
        );


    if (
      segments.length !== 5
    ) {

      return null;

    }


    if (
      String(
        segments[0]
      ).toLowerCase() !==
      "in"
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


    if (
      !route.stateSlug ||
      !route.districtSlug ||
      !route.categorySlug ||
      !route.businessSlug
    ) {

      return null;

    }


    route.canonicalPath =
      "/in/" +
      route.stateSlug +
      "/" +
      route.districtSlug +
      "/" +
      route.categorySlug +
      "/" +
      route.businessSlug +
      "/";


    route.canonicalURL =
      CONFIG.SITE_URL +
      route.canonicalPath;


    return route;

  }


  /* =======================================================
     API
     ======================================================= */

  function extractBusiness(
    response
  ) {

    if (!response) {
      return null;
    }


    if (
      response.business &&
      typeof response.business ===
      "object"
    ) {

      return response.business;

    }


    if (
      response.data &&
      response.data.business
    ) {

      return response.data.business;

    }


    if (
      response.result &&
      response.result.business
    ) {

      return response.result.business;

    }


    if (
      response.data &&
      (
        response.data.BusinessID ||
        response.data.BusinessName
      )
    ) {

      return response.data;

    }


    if (
      response.BusinessID ||
      response.BusinessName
    ) {

      return response;

    }


    return null;

  }


  function extractSEO(
    response
  ) {

    if (
      response &&
      response.seo
    ) {

      return response.seo;

    }


    if (
      response &&
      response.data &&
      response.data.seo
    ) {

      return response.data.seo;

    }


    return {};

  }


  async function loadBusiness(
    route
  ) {

    if (
      !window.UBnuxAPI ||
      typeof
      window.UBnuxAPI.getBusiness !==
      "function"
    ) {

      throw new Error(
        "UBnux API is not available."
      );

    }


    console.debug(
      "[UBnux Business] Loading:",
      route
    );


    var response =
      await
      window.UBnuxAPI.getBusiness({

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


    if (
      !response
    ) {

      throw new Error(
        "Empty business API response."
      );

    }


    if (
      response.success === false
    ) {

      throw new Error(
        response.message ||
        "Business not found."
      );

    }


    var business =
      extractBusiness(
        response
      );


    if (!business) {

      throw new Error(
        "Business data not found."
      );

    }


    /*
       Ensure frontend always has category slug.
    */

    if (
      !business.CategorySlug
    ) {

      business.CategorySlug =
        route.categorySlug;

    }


    return {

      business:
        business,

      seo:
        extractSEO(
          response
        ),

      response:
        response

    };

  }


  /* =======================================================
     SEO
     ======================================================= */

  function setMeta(
    name,
    content
  ) {

    var element =
      document.querySelector(
        'meta[name="' +
        name +
        '"]'
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
      content
    );

  }


  function setProperty(
    property,
    content
  ) {

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
      content
    );

  }


  function setCanonical(
    url
  ) {

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


  function updateSEO(
    business,
    route,
    seo
  ) {

    seo =
      seo || {};


    var name =
      getBusinessName(
        business
      );


    var description =
      safe(
        businessValue(
          business,
          [
            "SEO_Description",
            "seoDescription"
          ]
        )
      ) ||
      safe(
        seo.description
      ) ||
      getBusinessDescription(
        business
      ) ||
      (
        name +
        " business information on UBnux."
      );


    var title =
      safe(
        businessValue(
          business,
          [
            "SEO_Title",
            "seoTitle"
          ]
        )
      ) ||
      safe(
        seo.title
      ) ||
      (
        name +
        " | UBnux"
      );


    if (
      description.length >
      160
    ) {

      description =
        description.substring(
          0,
          157
        ) +
        "...";

    }


    document.title =
      title;


    setMeta(
      "description",
      description
    );


    setMeta(
      "robots",
      "index,follow,max-image-preview:large"
    );


    setCanonical(
      route.canonicalURL
    );


    var image =
      getBusinessImage(
        business
      );


    setProperty(
      "og:title",
      title
    );


    setProperty(
      "og:description",
      description
    );


    setProperty(
      "og:type",
      "business.business"
    );


    setProperty(
      "og:url",
      route.canonicalURL
    );


    setProperty(
      "og:image",
      image
    );


    setProperty(
      "og:site_name",
      CONFIG.SITE_NAME
    );


    setMeta(
      "twitter:card",
      "summary_large_image"
    );


    setMeta(
      "twitter:title",
      title
    );


    setMeta(
      "twitter:description",
      description
    );


    setMeta(
      "twitter:image",
      image
    );

  }


  /* =======================================================
     SCHEMA
     ======================================================= */

  function createSchema(
    business,
    route
  ) {

    var old =
      $("#ubnux-business-schema");


    if (old) {

      old.remove();

    }


    var schema = {

      "@context":
        "https://schema.org",

      "@type":
        "LocalBusiness",

      "@id":
        route.canonicalURL +
        "#business",

      name:
        getBusinessName(
          business
        ),

      url:
        route.canonicalURL,

      description:
        getBusinessDescription(
          business
        ),

      image:
        getBusinessImage(
          business
        )

    };


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


    if (mobile) {

      schema.telephone =
        mobile;

    }


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


    if (
      address ||
      area ||
      pincode
    ) {

      schema.address = {

        "@type":
          "PostalAddress",

        streetAddress:
          address,

        addressLocality:
          area,

        postalCode:
          pincode,

        addressCountry:
          "IN"

      };

    }


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
     TEMPLATE RENDER
     ======================================================= */

  function renderBusiness(
    business,
    route
  ) {

    var content =
      $("#businessPageContent");


    if (!content) {

      throw new Error(
        "#businessPageContent was not found."
      );

    }


    if (
      !window.UBnuxBusinessTemplates ||
      typeof
      window.UBnuxBusinessTemplates.get !==
      "function"
    ) {

      throw new Error(
        "Business template registry is not loaded."
      );

    }


    var templateName =
      window
        .UBnuxBusinessTemplates
        .resolveTemplateName(
          business,
          route
        );


    var template =
      window
        .UBnuxBusinessTemplates
        .get(
          business,
          route
        );


    if (
      !template ||
      typeof template.render !==
      "function"
    ) {

      throw new Error(
        "Business template could not be resolved."
      );

    }


    console.info(
      "[UBnux Business] Template:",
      templateName
    );


    var html =
      template.render(
        business,
        route
      );


    content.innerHTML =
      html;


    content.setAttribute(
      "data-business-template",
      templateName
    );


    showBusinessPage();

  }


  /* =======================================================
     INITIALIZE
     ======================================================= */

  async function initializeBusinessPage() {

    hideBusinessPage();

    showLoader();


    var route =
      getBusinessRoute();


    console.debug(
      "[UBnux Business] Route:",
      route
    );


    if (!route) {

      showError(
        "Invalid business URL."
      );

      return;

    }


    try {

      var loaded =
        await loadBusiness(
          route
        );


      var business =
        loaded.business;


      updateSEO(
        business,
        route,
        loaded.seo
      );


      createSchema(
        business,
        route
      );


      renderBusiness(
        business,
        route
      );


      hideLoader();


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
          : "Unable to load business."
      );

    }

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  window.UBNUX_BUSINESS_PAGE = {

    version:
      "4.0.0",

    init:
      initializeBusinessPage,

    getRoute:
      getBusinessRoute,

    render:
      renderBusiness

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

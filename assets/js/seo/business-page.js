/* =========================================================
   UBnux - Business SEO Page Controller
   File: assets/js/seo/business-page.js

   Version:
   6.0.0

   Responsibilities:
   ---------------------------------------------------------
   - Detect SEO business route
   - Load business from UBnux API
   - Consume backend BusinessSEO response
   - Load category BusinessTemplate
   - Inject template HTML
   - Load template CSS
   - Load template JS
   - Bind business data
   - Update SEO title
   - Update meta description
   - Update robots
   - Update canonical
   - Update OpenGraph
   - Update Twitter cards
   - Inject backend JSON-LD
   - Inject BreadcrumbList
   - Prevent duplicate JSON-LD
   - Prevent duplicate CSS/JS
   - Support custom business URLs
   - Never redirect SEO business pages
   - Graceful fallback/error state
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

    VERSION:
      "6.0.0",

    SITE_NAME:
      "UBnux",

    SITE_ORIGIN:
      "https://ubnux.com",

    TEMPLATE_ROOT:
      "/assets/business-sites/",

    DEFAULT_TEMPLATE:
      "default",

    DEFAULT_DESCRIPTION:
      "Find local businesses, products and services on UBnux.",

    DEFAULT_IMAGE:
      "https://ubnux.com/assets/images/default-business.jpg",

    REQUEST_TIMEOUT:
      25000,

    CONTENT_SELECTOR:
      "#businessPageContent",

    LOADER_SELECTOR:
      "#businessPageLoader",

    ERROR_SELECTOR:
      "#businessPageError"

  };


  /* =======================================================
     INTERNAL STATE
     ======================================================= */

  var state = {

    initialized:
      false,

    loading:
      false,

    loaded:
      false,

    business:
      null,

    seo:
      null,

    schema:
      null,

    route:
      null,

    template:
      null,

    templateScriptLoaded:
      false,

    templateStyleLoaded:
      false,

    templateInitialized:
      false

  };


  /* =======================================================
     LOGGER
     ======================================================= */

  function log() {

    if (
      window.console &&
      typeof window.console.log === "function"
    ) {

      console.log.apply(
        console,
        [
          "[UBnux BusinessPage]"
        ].concat(
          Array.prototype.slice.call(arguments)
        )
      );

    }

  }


  function warn() {

    if (
      window.console &&
      typeof window.console.warn === "function"
    ) {

      console.warn.apply(
        console,
        [
          "[UBnux BusinessPage]"
        ].concat(
          Array.prototype.slice.call(arguments)
        )
      );

    }

  }


  function errorLog() {

    if (
      window.console &&
      typeof window.console.error === "function"
    ) {

      console.error.apply(
        console,
        [
          "[UBnux BusinessPage]"
        ].concat(
          Array.prototype.slice.call(arguments)
        )
      );

    }

  }


  /* =======================================================
     GENERIC HELPERS
     ======================================================= */

  function clean(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(value).trim();

  }


  function firstValue() {

    var args =
      Array.prototype.slice.call(
        arguments
      );

    for (
      var i = 0;
      i < args.length;
      i++
    ) {

      var value =
        clean(args[i]);

      if (value) {

        return value;

      }

    }

    return "";

  }


  function escapeHTML(value) {

    return clean(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function escapeAttribute(value) {

    return escapeHTML(value);

  }


  function normalizeSlug(value) {

    return clean(value)
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "");

  }


  function joinURL(path) {

    var value =
      clean(path);

    if (!value) {

      return CONFIG.SITE_ORIGIN + "/";

    }

    if (
      /^https?:\/\//i.test(value)
    ) {

      return value;

    }

    if (value.charAt(0) !== "/") {

      value =
        "/" + value;

    }

    return (
      CONFIG.SITE_ORIGIN +
      value
    );

  }


  function safeURL(value) {

    var url =
      clean(value);

    if (!url) {

      return "";

    }

    try {

      return new URL(
        url,
        CONFIG.SITE_ORIGIN
      ).href;

    } catch (e) {

      return "";

    }

  }


  /* =======================================================
     DOM HELPERS
     ======================================================= */

  function getContentElement() {

    return document.querySelector(
      CONFIG.CONTENT_SELECTOR
    );

  }


  function getLoaderElement() {

    return document.querySelector(
      CONFIG.LOADER_SELECTOR
    );

  }


  function getErrorElement() {

    return document.querySelector(
      CONFIG.ERROR_SELECTOR
    );

  }


  function showLoader() {

    var loader =
      getLoaderElement();

    if (loader) {

      loader.hidden =
        false;

      loader.style.display =
        "";

    }

    var error =
      getErrorElement();

    if (error) {

      error.hidden =
        true;

      error.style.display =
        "none";

    }

  }


  function hideLoader() {

    var loader =
      getLoaderElement();

    if (loader) {

      loader.hidden =
        true;

      loader.style.display =
        "none";

    }

  }


  function showError(message) {

    hideLoader();

    var error =
      getErrorElement();

    if (!error) {

      return;

    }

    error.hidden =
      false;

    error.style.display =
      "";

    error.innerHTML =
      "<div class=\"business-page-error-inner\">" +

        "<h2>Business page unavailable</h2>" +

        "<p>" +
          escapeHTML(
            message ||
            "We could not load this business page."
          ) +
        "</p>" +

        "<a href=\"/\" class=\"business-page-error-link\">" +
          "Go to UBnux" +
        "</a>" +

      "</div>";

  }


  /* =======================================================
     ROUTE DETECTION
     ======================================================= */

  function getCurrentPath() {

    return clean(
      window.location.pathname
    )
      .replace(/^\/+|\/+$/g, "");

  }


  function parseBusinessPath() {

    var path =
      getCurrentPath();

    var parts =
      path
        ? path.split("/")
        : [];

    /*
      Expected:

      /in/
      {state}/
      {district}/
      {category}/
      {business}/
    */

    if (
      parts.length !== 5
    ) {

      return null;

    }

    if (
      parts[0].toLowerCase() !== "in"
    ) {

      return null;

    }

    var stateSlug =
      normalizeSlug(
        parts[1]
      );

    var districtSlug =
      normalizeSlug(
        parts[2]
      );

    var categorySlug =
      normalizeSlug(
        parts[3]
      );

    var businessSlug =
      normalizeSlug(
        parts[4]
      );

    if (
      !stateSlug ||
      !districtSlug ||
      !categorySlug ||
      !businessSlug
    ) {

      return null;

    }

    var canonicalPath =
      "/in/" +
      stateSlug +
      "/" +
      districtSlug +
      "/" +
      categorySlug +
      "/" +
      businessSlug +
      "/";

    return {

      type:
        "business",

      isSEOPage:
        true,

      isBusinessPage:
        true,

      stateSlug:
        stateSlug,

      districtSlug:
        districtSlug,

      categorySlug:
        categorySlug,

      businessSlug:
        businessSlug,

      canonicalPath:
        canonicalPath,

      canonicalURL:
        joinURL(
          canonicalPath
        )

    };

  }


  function getRoute() {

    /*
      First use main router.
    */

    try {

      if (
        App.router &&
        typeof App.router.getCurrentRoute === "function"
      ) {

        var route =
          App.router.getCurrentRoute();

        if (
          route &&
          route.isBusinessPage
        ) {

          return route;

        }

      }

    } catch (e) {

      warn(
        "Main router failed:",
        e
      );

    }


    /*
      Then SEO router.
    */

    try {

      var seoRouter =
        window.UBNUX_SEO_ROUTER ||
        window.UBnuxSEORouter;

      if (
        seoRouter &&
        typeof seoRouter.getRoute === "function"
      ) {

        var seoRoute =
          seoRouter.getRoute();

        if (
          seoRoute &&
          seoRoute.isBusinessPage
        ) {

          return seoRoute;

        }

      }

    } catch (e2) {

      warn(
        "SEO router failed:",
        e2
      );

    }


    /*
      Final direct route parser.
    */

    return parseBusinessPath();

  }


  /* =======================================================
     API
     ======================================================= */

  async function loadBusiness(route) {

    if (
      !route
    ) {

      throw new Error(
        "Business route not found."
      );

    }


    var API =
      window.UBnuxAPI ||
      window.ZilaBizAPI;

    if (
      !API
    ) {

      throw new Error(
        "UBnux API client is not loaded."
      );

    }


    /*
      Preferred API method.
    */

    if (
      typeof API.getBusiness === "function"
    ) {

      return await API.getBusiness({

        state:
          route.stateSlug,

        district:
          route.districtSlug,

        category:
          route.categorySlug,

        slug:
          route.businessSlug

      });

    }


    /*
      Compatibility fallback.
    */

    if (
      typeof API.getBusinessBySlug === "function"
    ) {

      return await API.getBusinessBySlug({

        state:
          route.stateSlug,

        district:
          route.districtSlug,

        category:
          route.categorySlug,

        slug:
          route.businessSlug

      });

    }


    throw new Error(
      "No compatible business API method found."
    );

  }


  /* =======================================================
     API RESPONSE NORMALIZATION
     ======================================================= */

  function normalizeAPIResponse(response) {

    if (
      !response
    ) {

      throw new Error(
        "Empty API response."
      );

    }


    /*
      Some API clients return:

      {
        success: true,
        business: {...},
        seo: {...},
        schema: {...}
      }
    */

    if (
      response.success === false
    ) {

      throw new Error(
        clean(
          response.message ||
          response.error ||
          "Business not found."
        )
      );

    }


    var business =
      response.business ||
      response.data ||
      response.result ||
      null;


    var seo =
      response.seo ||
      null;


    var schema =
      response.schema ||
      null;


    /*
      If API returned business directly.
    */

    if (
      !business &&
      (
        response.BusinessID ||
        response.BusinessName ||
        response.Business
      )
    ) {

      business =
        response;

    }


    if (
      !business
    ) {

      throw new Error(
        "Business data was not returned by API."
      );

    }


    return {

      success:
        true,

      business:
        business,

      seo:
        seo,

      schema:
        schema,

      location:
        response.location ||
        null,

      category:
        response.category ||
        null,

      indexability:
        response.indexability ||
        null,

      source:
        response.source ||
        null

    };

  }


  /* =======================================================
     BUSINESS FIELD HELPERS
     ======================================================= */

  function getBusinessName(business) {

    return firstValue(

      business.BusinessName,

      business.businessName,

      business.name,

      business.Name

    );

  }


  function getBusinessSlug(business, route) {

    return firstValue(

      business.Slug,

      business.slug,

      business.BusinessSlug,

      route &&
      route.businessSlug

    );

  }


  function getCategoryName(business, response, route) {

    return firstValue(

      business.CategoryName,

      response.category &&
      response.category.CategoryName,

      response.category &&
      response.category.categoryName,

      business.categoryName,

      route &&
      route.categorySlug

    );

  }


  function getCategorySlug(business, response, route) {

    return firstValue(

      business.CategorySlug,

      response.category &&
      response.category.Slug,

      response.category &&
      response.category.slug,

      route &&
      route.categorySlug

    );

  }


  function getDistrictName(business, response, route) {

    return firstValue(

      business.DistrictName,

      response.location &&
      response.location.DistrictName,

      response.location &&
      response.location.districtName,

      route &&
      route.districtSlug

    );

  }


  function getDistrictSlug(business, response, route) {

    return firstValue(

      business.DistrictSlug,

      response.location &&
      response.location.Slug,

      response.location &&
      response.location.DistrictSlug,

      route &&
      route.districtSlug

    );

  }


  function getStateName(business, response, route) {

    return firstValue(

      business.StateName,

      response.location &&
      response.location.StateName,

      response.location &&
      response.location.stateName,

      "Bihar"

    );

  }


  function getStateSlug(business, response, route) {

    return firstValue(

      business.StateSlug,

      response.location &&
      response.location.StateSlug,

      response.location &&
      response.location.stateSlug,

      route &&
      route.stateSlug

    );

  }


  function getBusinessDescription(business) {

    return firstValue(

      business.LongDescription,

      business.Description,

      business.ShortDescription,

      business.description

    );

  }


  function getBusinessImage(business) {

    return firstValue(

      business.CoverURL,

      business.coverURL,

      business.LogoURL,

      business.logoURL,

      CONFIG.DEFAULT_IMAGE

    );

  }


  function getBusinessPhone(business) {

    return firstValue(

      business.Mobile,

      business.Phone,

      business.Telephone,

      business.phone

    );

  }


  function getBusinessEmail(business) {

    return firstValue(

      business.Email,

      business.email

    );

  }


  function getBusinessWebsite(business) {

    return firstValue(

      business.WebsiteURL,

      business.Website,

      business.website

    );

  }


  /* =======================================================
     TEMPLATE RESOLUTION
     ======================================================= */

  function normalizeTemplateName(value) {

    var template =
      normalizeSlug(value);

    /*
      Prevent path traversal.
    */

    template =
      template
        .replace(/\.\./g, "")
        .replace(/[^a-z0-9_-]/g, "");

    return template;

  }


  function resolveBusinessTemplate(response) {

    var business =
      response.business ||
      {};

    var category =
      response.category ||
      {};


    /*
      Business-level template has priority.
    */

    var businessTemplate =
      firstValue(

        business.BusinessTemplate,

        business.businessTemplate,

        business.Template,

        business.template

      );


    if (
      businessTemplate
    ) {

      return normalizeTemplateName(
        businessTemplate
      );

    }


    /*
      Category-level template.
    */

    var categoryTemplate =
      firstValue(

        category.BusinessTemplate,

        category.businessTemplate,

        category.Template,

        category.template

      );


    if (
      categoryTemplate
    ) {

      return normalizeTemplateName(
        categoryTemplate
      );

    }


    /*
      Category slug aliases.
    */

    var categorySlug =
      normalizeSlug(
        getCategorySlug(
          business,
          response,
          state.route
        )
      );


    var aliases = {

      "clothing-and-fashion":
        "clothing",

      "restaurants":
        "restaurant",

      "hotels-and-resorts":
        "hotel",

      "beauty-and-salon":
        "beauty",

      "mobile-and-electronics":
        "electronics",

      "automobile":
        "automobile",

      "healthcare-and-medical":
        "healthcare",

      "education-and-coaching":
        "education",

      "home-services":
        "home-services",

      "real-estate":
        "real-estate"

    };


    if (
      aliases[categorySlug]
    ) {

      return aliases[categorySlug];

    }


    return CONFIG.DEFAULT_TEMPLATE;

  }


  /* =======================================================
     TEMPLATE URL
     ======================================================= */

  function getTemplateBaseURL(template) {

    return (
      CONFIG.TEMPLATE_ROOT +
      encodeURIComponent(
        template
      ) +
      "/"
    );

  }


  function getTemplateHTMLURL(template) {

    return (
      getTemplateBaseURL(template) +
      "index.html"
    );

  }


  function getTemplateCSSURL(template) {

    return (
      getTemplateBaseURL(template) +
      "style.css"
    );

  }


  function getTemplateJSURL(template) {

    return (
      getTemplateBaseURL(template) +
      "script.js"
    );

  }


  /* =======================================================
     TEMPLATE HTML LOADER
     ======================================================= */

  async function fetchText(url) {

    var controller =
      null;

    var timeout =
      null;


    if (
      typeof AbortController !== "undefined"
    ) {

      controller =
        new AbortController();

      timeout =
        setTimeout(
          function () {

            controller.abort();

          },
          CONFIG.REQUEST_TIMEOUT
        );

    }


    try {

      var response =
        await fetch(
          url,
          {

            method:
              "GET",

            cache:
              "no-cache",

            credentials:
              "same-origin",

            signal:
              controller
                ? controller.signal
                : undefined

          }
        );


      if (
        !response.ok
      ) {

        throw new Error(
          "HTTP " +
          response.status +
          " while loading " +
          url
        );

      }


      return await response.text();

    } finally {

      if (timeout) {

        clearTimeout(
          timeout
        );

      }

    }

  }


  async function loadTemplateHTML(template) {

    var content =
      getContentElement();

    if (
      !content
    ) {

      throw new Error(
        "Business page content container not found: " +
        CONFIG.CONTENT_SELECTOR
      );

    }


    var url =
      getTemplateHTMLURL(
        template
      );


    try {

      var html =
        await fetchText(
          url
        );

      content.innerHTML =
        html;

      return true;

    } catch (e) {

      /*
        If selected category template
        doesn't exist, try default.
      */

      if (
        template !==
        CONFIG.DEFAULT_TEMPLATE
      ) {

        warn(
          "Template not found:",
          template,
          "Trying default template."
        );


        var fallbackHTML =
          await fetchText(
            getTemplateHTMLURL(
              CONFIG.DEFAULT_TEMPLATE
            )
          );


        content.innerHTML =
          fallbackHTML;


        state.template =
          CONFIG.DEFAULT_TEMPLATE;


        return true;

      }


      throw e;

    }

  }


  /* =======================================================
     DYNAMIC CSS
     ======================================================= */

  function removePreviousTemplateStyles() {

    var oldStyles =
      document.querySelectorAll(
        "link[data-ubnux-business-template-style]"
      );

    Array.prototype.forEach.call(
      oldStyles,
      function (node) {

        node.parentNode.removeChild(
          node
        );

      }
    );

  }


  function loadTemplateCSS(template) {

    return new Promise(
      function (resolve, reject) {

        var href =
          getTemplateCSSURL(
            template
          );


        var existing =
          document.querySelector(
            'link[data-ubnux-business-template-style="' +
            CSS.escape(template) +
            '"]'
          );


        if (existing) {

          state.templateStyleLoaded =
            true;

          resolve();

          return;

        }


        removePreviousTemplateStyles();


        var link =
          document.createElement(
            "link"
          );


        link.rel =
          "stylesheet";

        link.href =
          href;

        link.dataset.ubnuxBusinessTemplateStyle =
          template;

        link.onload =
          function () {

            state.templateStyleLoaded =
              true;

            resolve();

          };


        link.onerror =
          function () {

            reject(
              new Error(
                "Business template CSS could not be loaded: " +
                href
              )
            );

          };


        document.head.appendChild(
          link
        );

      }
    );

  }


  /* =======================================================
     DYNAMIC TEMPLATE JS
     ======================================================= */

  function removePreviousTemplateScripts() {

    var oldScripts =
      document.querySelectorAll(
        "script[data-ubnux-business-template-script]"
      );

    Array.prototype.forEach.call(
      oldScripts,
      function (node) {

        node.parentNode.removeChild(
          node
        );

      }
    );

  }


  function loadTemplateJS(template) {

    return new Promise(
      function (resolve, reject) {

        var src =
          getTemplateJSURL(
            template
          );


        var existing =
          document.querySelector(
            'script[data-ubnux-business-template-script="' +
            CSS.escape(template) +
            '"]'
          );


        if (existing) {

          state.templateScriptLoaded =
            true;

          resolve();

          return;

        }


        removePreviousTemplateScripts();


        var script =
          document.createElement(
            "script"
          );


        script.src =
          src;

        script.async =
          false;

        script.dataset.ubnuxBusinessTemplateScript =
          template;


        script.onload =
          function () {

            state.templateScriptLoaded =
              true;

            resolve();

          };


        script.onerror =
          function () {

            reject(
              new Error(
                "Business template JS could not be loaded: " +
                src
              )
            );

          };


        document.body.appendChild(
          script
        );

      }
    );

  }


  /* =======================================================
     TEMPLATE DATA OBJECT
     ======================================================= */

  function buildTemplateContext(response, route) {

    var business =
      response.business ||
      {};

    var seo =
      response.seo ||
      {};

    var category =
      response.category ||
      {};

    var location =
      response.location ||
      {};


    var name =
      getBusinessName(
        business
      );


    var categoryName =
      getCategoryName(
        business,
        response,
        route
      );


    var districtName =
      getDistrictName(
        business,
        response,
        route
      );


    var stateName =
      getStateName(
        business,
        response,
        route
      );


    var description =
      getBusinessDescription(
        business
      );


    return {

      business:
        business,

      seo:
        seo,

      category:
        category,

      location:
        location,

      route:
        route,

      name:
        name,

      businessName:
        name,

      slug:
        getBusinessSlug(
          business,
          route
        ),

      categoryName:
        categoryName,

      categorySlug:
        getCategorySlug(
          business,
          response,
          route
        ),

      districtName:
        districtName,

      districtSlug:
        getDistrictSlug(
          business,
          response,
          route
        ),

      stateName:
        stateName,

      stateSlug:
        getStateSlug(
          business,
          response,
          route
        ),

      description:
        description,

      image:
        getBusinessImage(
          business
        ),

      phone:
        getBusinessPhone(
          business
        ),

      email:
        getBusinessEmail(
          business
        ),

      website:
        getBusinessWebsite(
          business
        ),

      canonical:
        firstValue(

          seo.canonical,

          seo.canonicalURL,

          route.canonicalURL

        )

    };

  }


  /* =======================================================
     GENERIC TEMPLATE DATA BINDING
     ======================================================= */

  function getBindingValue(element, context) {

    var key =
      clean(
        element.getAttribute(
          "data-business-bind"
        )
      );


    if (!key) {

      return "";

    }


    var value =
      context;


    var parts =
      key.split(".");


    for (
      var i = 0;
      i < parts.length;
      i++
    ) {

      if (
        value === null ||
        value === undefined
      ) {

        return "";

      }

      value =
        value[
          parts[i]
        ];

    }


    return value === null ||
      value === undefined
      ? ""
      : String(value);

  }


  function bindTextElements(context) {

    var nodes =
      document.querySelectorAll(
        "[data-business-bind]"
      );


    Array.prototype.forEach.call(
      nodes,
      function (element) {

        var value =
          getBindingValue(
            element,
            context
          );


        if (
          element.tagName === "INPUT" ||
          element.tagName === "TEXTAREA"
        ) {

          element.value =
            value;

        } else {

          element.textContent =
            value;

        }

      }
    );

  }


  /* =======================================================
     SPECIAL DATA ATTRIBUTES
     ======================================================= */

  function bindDataAttributes(context) {

    /*
      data-business-name
    */

    var nameNodes =
      document.querySelectorAll(
        "[data-business-name]"
      );


    Array.prototype.forEach.call(
      nameNodes,
      function (node) {

        node.textContent =
          context.businessName;

      }
    );


    /*
      data-business-description
    */

    var descriptionNodes =
      document.querySelectorAll(
        "[data-business-description]"
      );


    Array.prototype.forEach.call(
      descriptionNodes,
      function (node) {

        node.textContent =
          context.description;

      }
    );


    /*
      data-business-image
    */

    var imageNodes =
      document.querySelectorAll(
        "[data-business-image]"
      );


    Array.prototype.forEach.call(
      imageNodes,
      function (node) {

        if (
          node.tagName === "IMG"
        ) {

          node.src =
            context.image;

          node.alt =
            context.businessName;

        } else {

          node.style.backgroundImage =
            "url(\"" +
            context.image.replace(
              /"/g,
              "%22"
            ) +
            "\")";

        }

      }
    );


    /*
      data-business-phone
    */

    var phoneNodes =
      document.querySelectorAll(
        "[data-business-phone]"
      );


    Array.prototype.forEach.call(
      phoneNodes,
      function (node) {

        node.textContent =
          context.phone;

        if (
          node.tagName === "A" &&
          context.phone
        ) {

          node.href =
            "tel:" +
            context.phone.replace(
              /[^0-9+]/g,
              ""
            );

        }

      }
    );


    /*
      data-business-email
    */

    var emailNodes =
      document.querySelectorAll(
        "[data-business-email]"
      );


    Array.prototype.forEach.call(
      emailNodes,
      function (node) {

        node.textContent =
          context.email;

        if (
          node.tagName === "A" &&
          context.email
        ) {

          node.href =
            "mailto:" +
            context.email;

        }

      }
    );


    /*
      data-business-website
    */

    var websiteNodes =
      document.querySelectorAll(
        "[data-business-website]"
      );


    Array.prototype.forEach.call(
      websiteNodes,
      function (node) {

        if (
          node.tagName === "A"
        ) {

          node.href =
            safeURL(
              context.website
            ) ||
            "#";

        }

      }
    );


    /*
      data-business-whatsapp
    */

    var whatsappNodes =
      document.querySelectorAll(
        "[data-business-whatsapp]"
      );


    var whatsapp =
      firstValue(
        context.business.WhatsApp,
        context.business.whatsapp,
        context.phone
      );


    Array.prototype.forEach.call(
      whatsappNodes,
      function (node) {

        var number =
          whatsapp.replace(
            /[^0-9]/g,
            ""
          );


        if (
          number
        ) {

          node.href =
            "https://wa.me/" +
            number;

          node.target =
            "_blank";

          node.rel =
            "noopener noreferrer";

        }

      }
    );

  }


  /* =======================================================
     SEO HELPERS
     ======================================================= */

  function ensureMeta(name, content) {

    if (
      !content
    ) {

      return null;

    }


    var selector =
      'meta[name="' +
      CSS.escape(name) +
      '"]';


    var meta =
      document.head.querySelector(
        selector
      );


    if (!meta) {

      meta =
        document.createElement(
          "meta"
        );

      meta.name =
        name;

      document.head.appendChild(
        meta
      );

    }


    meta.content =
      content;


    return meta;

  }


  function ensureProperty(property, content) {

    if (
      !content
    ) {

      return null;

    }


    var selector =
      'meta[property="' +
      CSS.escape(property) +
      '"]';


    var meta =
      document.head.querySelector(
        selector
      );


    if (!meta) {

      meta =
        document.createElement(
          "meta"
        );

      meta.setAttribute(
        "property",
        property
      );

      document.head.appendChild(
        meta
      );

    }


    meta.content =
      content;


    return meta;

  }


  function ensureLink(rel, href) {

    if (
      !href
    ) {

      return null;

    }


    var selector =
      'link[rel="' +
      CSS.escape(rel) +
      '"]';


    var link =
      document.head.querySelector(
        selector
      );


    if (!link) {

      link =
        document.createElement(
          "link"
        );

      link.rel =
        rel;

      document.head.appendChild(
        link
      );

    }


    link.href =
      href;


    return link;

  }


  /* =======================================================
     TITLE
     ======================================================= */

  function buildFallbackTitle(context) {

    var title =
      context.businessName;


    if (
      context.categoryName &&
      context.districtName
    ) {

      title +=
        " - " +
        context.categoryName +
        " in " +
        context.districtName;

    }


    if (
      context.stateName
    ) {

      title +=
        ", " +
        context.stateName;

    }


    title +=
      " | " +
      CONFIG.SITE_NAME;


    return title;

  }


  function getSEOTitle(context) {

    return firstValue(

      context.seo &&
      context.seo.title,

      context.seo &&
      context.seo.seoTitle,

      context.business.SEO_Title,

      buildFallbackTitle(
        context
      )

    );

  }


  /* =======================================================
     DESCRIPTION
     ======================================================= */

  function buildFallbackDescription(context) {

    var text =
      context.description;


    if (
      !text
    ) {

      text =
        context.businessName +
        " is a local " +
        context.categoryName +
        " business in " +
        context.districtName +
        ", " +
        context.stateName +
        ". Find business information, contact details and services on UBnux.";

    }


    return text;

  }


  function getSEODescription(context) {

    return firstValue(

      context.seo &&
      context.seo.description,

      context.seo &&
      context.seo.seoDescription,

      context.business.SEO_Description,

      buildFallbackDescription(
        context
      )

    );

  }


  /* =======================================================
     H1
     ======================================================= */

  function buildFallbackH1(context) {

    return firstValue(

      context.business.SEO_H1,

      context.businessName

    );

  }


  function applySEOH1(context) {

    var h1 =
      firstValue(

        context.seo &&
        context.seo.h1,

        context.seo &&
        context.seo.seoH1,

        context.business.SEO_H1,

        buildFallbackH1(
          context
        )

      );


    /*
      Do not force-create H1 if template
      already has one.

      If no H1 exists, add one at
      beginning of business content.
    */

    var existingH1 =
      document.querySelector(
        "#businessPageContent h1"
      );


    if (
      existingH1
    ) {

      existingH1.textContent =
        h1;

      return;

    }


    var content =
      getContentElement();


    if (
      !content
    ) {

      return;

    }


    var newH1 =
      document.createElement(
        "h1"
      );


    newH1.textContent =
      h1;

    newH1.className =
      "ubnux-business-page-h1";


    content.insertBefore(
      newH1,
      content.firstChild
    );

  }


  /* =======================================================
     ROBOTS
     ======================================================= */

  function getRobots(context) {

    var indexable =
      true;


    if (
      context.seo &&
      context.seo.indexable === false
    ) {

      indexable =
        false;

    }


    if (
      context.seo &&
      context.seo.indexable === "false"
    ) {

      indexable =
        false;

    }


    if (
      context.business.Indexable === false ||
      String(
        context.business.Indexable || ""
      ).toLowerCase() === "false"
    ) {

      indexable =
        false;

    }


    if (
      context.business.BusinessStatus &&
      String(
        context.business.BusinessStatus
      ).toLowerCase() === "inactive"
    ) {

      indexable =
        false;

    }


    if (
      context.seo &&
      context.seo.robots
    ) {

      return context.seo.robots;

    }


    if (
      indexable
    ) {

      return (
        "index,follow," +
        "max-image-preview:large," +
        "max-snippet:-1," +
        "max-video-preview:-1"
      );

    }


    return "noindex,follow";

  }


  /* =======================================================
     CANONICAL
     ======================================================= */

  function getCanonical(context) {

    return firstValue(

      context.seo &&
      context.seo.canonical,

      context.seo &&
      context.seo.canonicalURL,

      context.canonical,

      context.route &&
      context.route.canonicalURL

    );

  }


  /* =======================================================
     IMAGE
     ======================================================= */

  function getSEOImage(context) {

    return safeURL(

      firstValue(

        context.seo &&
        context.seo.image,

        context.seo &&
        context.seo.imageURL,

        context.business.CoverURL,

        context.business.LogoURL,

        CONFIG.DEFAULT_IMAGE

      )

    ) || CONFIG.DEFAULT_IMAGE;

  }


  /* =======================================================
     APPLY COMPLETE SEO
     ======================================================= */

  function applySEO(context) {

    var title =
      getSEOTitle(
        context
      );


    var description =
      getSEODescription(
        context
      );


    var canonical =
      getCanonical(
        context
      );


    var robots =
      getRobots(
        context
      );


    var image =
      getSEOImage(
        context
      );


    /*
      Document title
    */

    document.title =
      title;


    /*
      Meta description
    */

    ensureMeta(
      "description",
      description
    );


    /*
      Robots
    */

    ensureMeta(
      "robots",
      robots
    );


    /*
      Canonical
    */

    if (
      canonical
    ) {

      ensureLink(
        "canonical",
        canonical
      );

    }


    /*
      OpenGraph
    */

    ensureProperty(
      "og:title",
      title
    );

    ensureProperty(
      "og:description",
      description
    );

    ensureProperty(
      "og:type",
      "business.business"
    );

    ensureProperty(
      "og:url",
      canonical
    );

    ensureProperty(
      "og:image",
      image
    );

    ensureProperty(
      "og:site_name",
      CONFIG.SITE_NAME
    );


    /*
      Twitter
    */

    ensureMeta(
      "twitter:card",
      "summary_large_image"
    );

    ensureMeta(
      "twitter:title",
      title
    );

    ensureMeta(
      "twitter:description",
      description
    );

    ensureMeta(
      "twitter:image",
      image
    );


    /*
      Author / application.
    */

    ensureMeta(
      "application-name",
      CONFIG.SITE_NAME
    );


    /*
      H1
    */

    applySEOH1(
      context
    );

  }


  /* =======================================================
     REMOVE OLD JSON-LD
     ======================================================= */

  function removeBusinessJSONLD() {

    var scripts =
      document.querySelectorAll(
        'script[type="application/ld+json"][data-ubnux-business-schema]'
      );


    Array.prototype.forEach.call(
      scripts,
      function (script) {

        script.parentNode.removeChild(
          script
        );

      }
    );

  }


  /* =======================================================
     JSON SERIALIZATION
     ======================================================= */

  function safeJSON(value) {

    try {

      return JSON.stringify(
        value
      );

    } catch (e) {

      errorLog(
        "JSON-LD serialization failed:",
        e
      );

      return "";

    }

  }


  /* =======================================================
     JSON-LD
     ======================================================= */

  function injectJSONLD(schema, context) {

    removeBusinessJSONLD();


    var finalSchema =
      schema;


    /*
      Backend SchemaEngine normally returns
      a @graph object.

      If schema is wrapped, unwrap it.
    */

    if (
      schema &&
      schema.schema
    ) {

      finalSchema =
        schema.schema;

    }


    if (
      !finalSchema
    ) {

      warn(
        "No backend schema received."
      );

      return;

    }


    /*
      Ensure canonical URL if schema has WebPage.
    */

    var canonical =
      getCanonical(
        context
      );


    /*
      Do not mutate backend schema unnecessarily.
      Clone first.
    */

    try {

      finalSchema =
        JSON.parse(
          JSON.stringify(
            finalSchema
          )
        );

    } catch (e) {

      warn(
        "Could not clone schema.",
        e
      );

    }


    /*
      If schema itself is an array,
      wrap as @graph.
    */

    if (
      Array.isArray(
        finalSchema
      )
    ) {

      finalSchema = {

        "@context":
          "https://schema.org",

        "@graph":
          finalSchema

      };

    }


    /*
      If no @context exists.
    */

    if (
      finalSchema &&
      !finalSchema["@context"]
    ) {

      finalSchema["@context"] =
        "https://schema.org";

    }


    /*
      Keep canonical synchronized.
    */

    if (
      canonical &&
      finalSchema &&
      Array.isArray(
        finalSchema["@graph"]
      )
    ) {

      finalSchema["@graph"].forEach(
        function (item) {

          if (
            !item ||
            typeof item !== "object"
          ) {

            return;

          }


          if (
            item["@type"] ===
            "WebPage"
          ) {

            item.url =
              canonical;

            item.mainEntityOfPage =
              canonical;

          }

        }
      );

    }


    var json =
      safeJSON(
        finalSchema
      );


    if (
      !json
    ) {

      return;

    }


    var script =
      document.createElement(
        "script"
      );


    script.type =
      "application/ld+json";

    script.dataset.ubnuxBusinessSchema =
      "true";

    script.text =
      json;


    document.head.appendChild(
      script
    );

  }


  /* =======================================================
     FALLBACK SCHEMA
     ======================================================= */

  function buildFallbackSchema(context) {

    var business =
      context.business;


    var canonical =
      getCanonical(
        context
      );


    var name =
      context.businessName;


    var schema = {

      "@context":
        "https://schema.org",

      "@type":
        firstValue(

          business.SchemaType,

          context.seo &&
          context.seo.schemaType,

          "LocalBusiness"

        ),

      "@id":
        canonical +
        "#business",

      name:
        name,

      url:
        canonical,

      description:
        getSEODescription(
          context
        ),

      image:
        getSEOImage(
          context
        )

    };


    if (
      context.phone
    ) {

      schema.telephone =
        context.phone;

    }


    if (
      context.email
    ) {

      schema.email =
        context.email;

    }


    if (
      context.website
    ) {

      schema.sameAs =
        [
          safeURL(
            context.website
          )
        ].filter(Boolean);

    }


    if (
      business.Address ||
      business.Area ||
      business.Pincode
    ) {

      schema.address = {

        "@type":
          "PostalAddress",

        streetAddress:
          firstValue(
            business.Address,
            business.Area
          ),

        addressLocality:
          context.districtName,

        addressRegion:
          context.stateName,

        postalCode:
          clean(
            business.Pincode
          ),

        addressCountry:
          "IN"

      };

    }


    if (
      business.Latitude &&
      business.Longitude
    ) {

      schema.geo = {

        "@type":
          "GeoCoordinates",

        latitude:
          Number(
            business.Latitude
          ),

        longitude:
          Number(
            business.Longitude
          )

      };

    }


    return {

      "@context":
        "https://schema.org",

      "@graph":
        [

          schema

        ]

    };

  }


  /* =======================================================
     APPLY SCHEMA
     ======================================================= */

  function applySchema(response, context) {

    var schema =
      response.schema;


    if (
      !schema
    ) {

      schema =
        buildFallbackSchema(
          context
        );

    }


    injectJSONLD(
      schema,
      context
    );

  }


  /* =======================================================
     BREADCRUMB UI
     ======================================================= */

  function renderBreadcrumbs(response, context) {

    /*
      If template already contains
      breadcrumb container, populate it.
    */

    var containers =
      document.querySelectorAll(
        "[data-business-breadcrumbs]"
      );


    if (
      !containers.length
    ) {

      return;

    }


    var items = [

      {
        name:
          "Home",

        url:
          "/"

      },

      {
        name:
          context.stateName,

        url:
          "/in/" +
          context.stateSlug +
          "/"

      },

      {
        name:
          context.districtName,

        url:
          "/in/" +
          context.stateSlug +
          "/" +
          context.districtSlug +
          "/"

      },

      {
        name:
          context.categoryName,

        url:
          "/in/" +
          context.stateSlug +
          "/" +
          context.districtSlug +
          "/" +
          context.categorySlug +
          "/"

      },

      {
        name:
          context.businessName,

        url:
          context.canonical

      }

    ];


    Array.prototype.forEach.call(
      containers,
      function (container) {

        container.innerHTML =
          "";


        items.forEach(
          function (item, index) {

            var span =
              document.createElement(
                "span"
              );


            span.className =
              "ubnux-breadcrumb-item";


            if (
              index <
              items.length - 1
            ) {

              var link =
                document.createElement(
                  "a"
                );


              link.href =
                item.url;

              link.textContent =
                item.name;

              span.appendChild(
                link
              );

            } else {

              span.textContent =
                item.name;

              span.setAttribute(
                "aria-current",
                "page"
              );

            }


            container.appendChild(
              span
            );


            if (
              index <
              items.length - 1
            ) {

              var separator =
                document.createElement(
                  "span"
                );


              separator.className =
                "ubnux-breadcrumb-separator";

              separator.textContent =
                "›";


              container.appendChild(
                separator
              );

            }

          }
        );

      }
    );

  }


  /* =======================================================
     TEMPLATE INITIALIZER
     ======================================================= */

  function initializeTemplate(context) {

    if (
      state.templateInitialized
    ) {

      return;

    }


    /*
      Preferred template API.
    */

    var templateAPI =
      window.UBnuxBusinessSite;


    if (
      templateAPI
    ) {

      if (
        typeof templateAPI.init === "function"
      ) {

        templateAPI.init(
          context
        );

        state.templateInitialized =
          true;

        return;

      }


      if (
        typeof templateAPI.initialize === "function"
      ) {

        templateAPI.initialize(
          context
        );

        state.templateInitialized =
          true;

        return;

      }

    }


    /*
      Global category-specific initializer
      compatibility.
    */

    if (
      typeof window.initBusinessSite ===
      "function"
    ) {

      window.initBusinessSite(
        context
      );

      state.templateInitialized =
        true;

      return;

    }


    /*
      Template may only use
      data attributes.

      That is valid.
    */

    state.templateInitialized =
      true;

  }


  /* =======================================================
     TEMPLATE LOADING
     ======================================================= */

  async function renderTemplate(response, context) {

    var template =
      resolveBusinessTemplate(
        response
      );


    if (
      !template
    ) {

      template =
        CONFIG.DEFAULT_TEMPLATE;

    }


    state.template =
      template;


    log(
      "Using business template:",
      template
    );


    /*
      CSS first.
    */

    try {

      await loadTemplateCSS(
        template
      );

    } catch (cssError) {

      warn(
        "Template CSS failed:",
        cssError
      );

    }


    /*
      HTML.
    */

    await loadTemplateHTML(
      template
    );


    /*
      Generic bindings.
    */

    bindTextElements(
      context
    );

    bindDataAttributes(
      context
    );


    /*
      Breadcrumbs.
    */

    renderBreadcrumbs(
      response,
      context
    );


    /*
      Template JS.
    */

    try {

      await loadTemplateJS(
        template
      );

    } catch (jsError) {

      warn(
        "Template JS failed:",
        jsError
      );

    }


    /*
      Run template initializer
      AFTER HTML + JS.
    */

    initializeTemplate(
      context
    );

  }


  /* =======================================================
     PAGE BODY CLASSES
     ======================================================= */

  function applyBodyClasses(context) {

    var body =
      document.body;


    if (
      !body
    ) {

      return;

    }


    body.classList.add(
      "ubnux-business-page"
    );


    if (
      context.categorySlug
    ) {

      body.classList.add(
        "ubnux-category-" +
        normalizeSlug(
          context.categorySlug
        )
      );

    }


    if (
      state.template
    ) {

      body.classList.add(
        "ubnux-template-" +
        normalizeSlug(
          state.template
        )
      );

    }

  }


  /* =======================================================
     PAGE DATA GLOBAL
     ======================================================= */

  function exposePageData(response, context) {

    window.UBnuxBusinessPageData = {

      version:
        CONFIG.VERSION,

      route:
        context.route,

      business:
        context.business,

      seo:
        context.seo,

      schema:
        response.schema,

      category:
        context.category,

      location:
        context.location,

      template:
        state.template,

      canonical:
        context.canonical

    };

  }


  /* =======================================================
     CLEAN URL HANDLING
     ======================================================= */

  function ensureCanonicalPath(route) {

    /*
      IMPORTANT:

      Never redirect.

      This function only verifies that
      current route and canonical route
      are structurally valid.

      It intentionally does NOT call
      history.replaceState().
    */

    if (
      !route
    ) {

      return;

    }


    if (
      route.canonicalURL
    ) {

      log(
        "Canonical business URL:",
        route.canonicalURL
      );

    }

  }


  /* =======================================================
     MAIN INITIALIZER
     ======================================================= */

  async function initialize(options) {

    if (
      state.initialized &&
      !(
        options &&
        options.force
      )
    ) {

      return;

    }


    if (
      state.loading
    ) {

      return;

    }


    state.loading =
      true;


    showLoader();


    try {

      /*
        1. Route
      */

      var route =
        getRoute();


      if (
        !route ||
        !route.isBusinessPage
      ) {

        hideLoader();

        state.loading =
          false;

        return;

      }


      state.route =
        route;


      ensureCanonicalPath(
        route
      );


      /*
        2. Load business
      */

      log(
        "Loading business:",
        route
      );


      var rawResponse =
        await loadBusiness(
          route
        );


      /*
        3. Normalize response
      */

      var response =
        normalizeAPIResponse(
          rawResponse
        );


      state.business =
        response.business;

      state.seo =
        response.seo;

      state.schema =
        response.schema;


      /*
        4. Build template context
      */

      var context =
        buildTemplateContext(
          response,
          route
        );


      /*
        5. SEO FIRST

        Apply before template rendering
        so browser metadata is available
        immediately.
      */

      applySEO(
        context
      );


      /*
        6. Schema
      */

      applySchema(
        response,
        context
      );


      /*
        7. Template
      */

      await renderTemplate(
        response,
        context
      );


      /*
        8. Body classes
      */

      applyBodyClasses(
        context
      );


      /*
        9. Expose data
      */

      exposePageData(
        response,
        context
      );


      /*
        10. Final state
      */

      state.loaded =
        true;

      state.initialized =
        true;


      hideLoader();


      log(
        "Business page loaded successfully:",
        context.businessName
      );


      /*
        Dispatch custom event.
      */

      try {

        document.dispatchEvent(
          new CustomEvent(
            "ubnux:business-page-ready",
            {

              detail:
                window.UBnuxBusinessPageData

            }
          )
        );

      } catch (eventError) {

        /*
          Older browsers may not support
          CustomEvent constructor.
        */

      }


    } catch (e) {

      errorLog(
        "Business page initialization failed:",
        e
      );


      state.loaded =
        false;


      state.initialized =
        false;


      showError(
        e.message ||
        "Unable to load this business page."
      );


    } finally {

      state.loading =
        false;

    }

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  var BusinessPage = {

    VERSION:
      CONFIG.VERSION,

    init:
      initialize,

    initialize:
      initialize,

    reload:
      function () {

        state.initialized =
          false;

        state.loaded =
          false;

        state.templateInitialized =
          false;

        return initialize({
          force:
            true
        });

      },

    getState:
      function () {

        return {

          version:
            CONFIG.VERSION,

          initialized:
            state.initialized,

          loading:
            state.loading,

          loaded:
            state.loaded,

          route:
            state.route,

          business:
            state.business,

          seo:
            state.seo,

          schema:
            state.schema,

          template:
            state.template

        };

      },

    getBusiness:
      function () {

        return state.business;

      },

    getSEO:
      function () {

        return state.seo;

      },

    getSchema:
      function () {

        return state.schema;

      },

    getTemplate:
      function () {

        return state.template;

      }

  };


  /* =======================================================
     GLOBAL EXPORTS
     ======================================================= */

  window.UBnuxBusinessPage =
    BusinessPage;

  window.UBNUX_BUSINESS_PAGE =
    BusinessPage;

  App.businessPage =
    BusinessPage;


  /* =======================================================
     AUTO INIT
     ======================================================= */

  function boot() {

    /*
      Allow router/API scripts to initialize first.
    */

    setTimeout(
      function () {

        initialize();

      },
      0
    );

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {
        once:
          true
      }
    );

  } else {

    boot();

  }


})(window, document);

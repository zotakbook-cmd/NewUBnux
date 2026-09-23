/* =========================================================
   UBnux - Business SEO Page Controller
   File: assets/js/seo/business-page.js

   Version:
   7.0.0

   Responsibilities:
   ---------------------------------------------------------
   - Detect Business SEO route
   - Load business from UBnux API
   - Consume BusinessSEO backend response
   - Resolve BusinessTemplate
   - Load template HTML
   - Load template CSS
   - Load template JS
   - Bind business data
   - Call UBnuxSEOMeta
   - Call UBNUX_SCHEMA
   - Render breadcrumbs
   - Expose business page data
   - Initialize business template
   - Never redirect
   ========================================================= */

(function (
  window,
  document
) {

  "use strict";


  /* =======================================================
     NAMESPACE
  ====================================================== */

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
  ====================================================== */

  var CONFIG = {

    VERSION:
      "7.0.0",

    SITE_NAME:
      "UBnux",

    SITE_ORIGIN:
      "https://ubnux.com",

    TEMPLATE_ROOT:
      "/assets/business-sites/",

    DEFAULT_TEMPLATE:
      "default",

    CONTENT_SELECTOR:
      "#businessPageContent",

    LOADER_SELECTOR:
      "#businessPageLoader",

    ERROR_SELECTOR:
      "#businessPageError",

    REQUEST_TIMEOUT:
      25000

  };


  /* =======================================================
     STATE
  ====================================================== */

  var state = {

    initialized:
      false,

    loading:
      false,

    loaded:
      false,

    route:
      null,

    response:
      null,

    business:
      null,

    seo:
      null,

    schema:
      null,

    category:
      null,

    location:
      null,

    template:
      null,

    templateInitialized:
      false

  };


  /* =======================================================
     LOGGING
  ====================================================== */

  function log() {

    if (
      window.console &&
      typeof window.console.log ===
        "function"
    ) {

      console.log.apply(
        console,
        [
          "[UBnux BusinessPage]"
        ].concat(
          Array.prototype.slice.call(
            arguments
          )
        )
      );

    }

  }


  function warn() {

    if (
      window.console &&
      typeof window.console.warn ===
        "function"
    ) {

      console.warn.apply(
        console,
        [
          "[UBnux BusinessPage]"
        ].concat(
          Array.prototype.slice.call(
            arguments
          )
        )
      );

    }

  }


  function logError() {

    if (
      window.console &&
      typeof window.console.error ===
        "function"
    ) {

      console.error.apply(
        console,
        [
          "[UBnux BusinessPage]"
        ].concat(
          Array.prototype.slice.call(
            arguments
          )
        )
      );

    }

  }


  /* =======================================================
     SAFE HELPERS
  ====================================================== */

  function clean(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(
      value
    ).trim();

  }


  function firstValue() {

    var values =
      Array.prototype.slice.call(
        arguments
      );


    for (
      var i = 0;
      i < values.length;
      i++
    ) {

      var value =
        clean(
          values[i]
        );


      if (value) {

        return value;

      }

    }


    return "";

  }


  function normalizeSlug(value) {

    return clean(
      value
    )
      .toLowerCase()
      .replace(
        /^\/+|\/+$/g,
        ""
      )
      .replace(
        /\s+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      );

  }


  function safeURL(value) {

    var url =
      clean(
        value
      );


    if (!url) {

      return "";

    }


    try {

      return new URL(
        url,
        CONFIG.SITE_ORIGIN
      ).href;

    } catch (error) {

      return "";

    }

  }


  function escapeHTML(value) {

    return clean(
      value
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


  /* =======================================================
     DOM
  ====================================================== */

  function getContent() {

    return document.querySelector(
      CONFIG.CONTENT_SELECTOR
    );

  }


  function getLoader() {

    return document.querySelector(
      CONFIG.LOADER_SELECTOR
    );

  }


  function getError() {

    return document.querySelector(
      CONFIG.ERROR_SELECTOR
    );

  }


  function showLoader() {

    var loader =
      getLoader();


    if (loader) {

      loader.hidden =
        false;

      loader.style.display =
        "";

    }


    var error =
      getError();


    if (error) {

      error.hidden =
        true;

      error.style.display =
        "none";

    }

  }


  function hideLoader() {

    var loader =
      getLoader();


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
      getError();


    if (!error) {

      return;

    }


    error.hidden =
      false;

    error.style.display =
      "";


    error.innerHTML =

      '<div class="business-page-error-inner">' +

        "<h2>Business page unavailable</h2>" +

        "<p>" +
          escapeHTML(
            message ||
            "We could not load this business page."
          ) +
        "</p>" +

        '<a href="/" class="business-page-error-link">' +
          "Go to UBnux" +
        "</a>" +

      "</div>";

  }


  /* =======================================================
     ROUTE
  ====================================================== */

  function getRoute() {

    /*
      PRIMARY:
      Existing SEO router
    */

    try {

      var seoRouter =
        window.UBNUX_SEO_ROUTER ||
        window.UBnuxSEORouter;


      if (
        seoRouter &&
        typeof seoRouter.getCurrentRoute ===
          "function"
      ) {

        var seoRoute =
          seoRouter.getCurrentRoute();


        if (
          seoRoute &&
          seoRoute.isBusinessPage
        ) {

          return normalizeRoute(
            seoRoute
          );

        }

      }

    } catch (error) {

      warn(
        "SEO router failed:",
        error
      );

    }


    /*
      FALLBACK:
      Main router
    */

    try {

      if (
        App.router &&
        typeof App.router.getCurrentRoute ===
          "function"
      ) {

        var mainRoute =
          App.router.getCurrentRoute();


        if (
          mainRoute &&
          mainRoute.isBusinessPage
        ) {

          return normalizeRoute(
            mainRoute
          );

        }

      }

    } catch (error2) {

      warn(
        "Main router failed:",
        error2
      );

    }


    return null;

  }


  function normalizeRoute(route) {

    if (!route) {

      return null;

    }


    var stateSlug =
      normalizeSlug(
        route.stateSlug
      );


    var districtSlug =
      normalizeSlug(
        route.districtSlug
      );


    var categorySlug =
      normalizeSlug(
        route.categorySlug
      );


    var businessSlug =
      normalizeSlug(
        route.businessSlug
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

      isBusinessPage:
        true,

      isSEOPage:
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
        CONFIG.SITE_ORIGIN +
        canonicalPath

    };

  }


  /* =======================================================
     API
  ====================================================== */

  async function loadBusiness(
    route
  ) {

    var API =
      window.UBnuxAPI ||
      window.ZilaBizAPI;


    if (!API) {

      throw new Error(
        "UBnux API client is not loaded."
      );

    }


    /*
      Preferred method.
    */

    if (
      typeof API.getBusiness ===
        "function"
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
      Compatibility method.
    */

    if (
      typeof API.getBusinessBySlug ===
        "function"
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
      "UBnux API does not provide getBusiness()."
    );

  }


  /* =======================================================
     API RESPONSE
  ====================================================== */

  function normalizeResponse(
    response
  ) {

    if (!response) {

      throw new Error(
        "Empty business API response."
      );

    }


    if (
      response.success === false
    ) {

      throw new Error(
        firstValue(
          response.message,
          response.error,
          "Business not found."
        )
      );

    }


    var business =
      response.business ||
      null;


    /*
      Compatibility:
      direct business response.
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


    if (!business) {

      throw new Error(
        "Business data missing from API response."
      );

    }


    return {

      success:
        true,

      business:
        business,

      seo:
        response.seo ||
        null,

      schema:
        response.schema ||
        null,

      category:
        response.category ||
        null,

      location:
        response.location ||
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
     BUSINESS HELPERS
  ====================================================== */

  function getBusinessName(
    business
  ) {

    return firstValue(

      business.BusinessName,

      business.businessName,

      business.name,

      business.Name

    );

  }


  function getBusinessSlug(
    business,
    route
  ) {

    return firstValue(

      business.Slug,

      business.slug,

      business.BusinessSlug,

      route.businessSlug

    );

  }


  function getCategoryName(
    response,
    route
  ) {

    return firstValue(

      response.business &&
      response.business.CategoryName,

      response.category &&
      response.category.CategoryName,

      response.category &&
      response.category.categoryName,

      route.categorySlug

    );

  }


  function getCategorySlug(
    response,
    route
  ) {

    return firstValue(

      response.business &&
      response.business.CategorySlug,

      response.category &&
      response.category.Slug,

      response.category &&
      response.category.slug,

      route.categorySlug

    );

  }


  function getDistrictName(
    response,
    route
  ) {

    return firstValue(

      response.business &&
      response.business.DistrictName,

      response.location &&
      response.location.DistrictName,

      response.location &&
      response.location.districtName,

      route.districtSlug

    );

  }


  function getDistrictSlug(
    response,
    route
  ) {

    return firstValue(

      response.business &&
      response.business.DistrictSlug,

      response.location &&
      response.location.DistrictSlug,

      response.location &&
      response.location.Slug,

      route.districtSlug

    );

  }


  function getStateName(
    response,
    route
  ) {

    return firstValue(

      response.business &&
      response.business.StateName,

      response.location &&
      response.location.StateName,

      response.location &&
      response.location.stateName,

      "Bihar"

    );

  }


  function getStateSlug(
    response,
    route
  ) {

    return firstValue(

      response.business &&
      response.business.StateSlug,

      response.location &&
      response.location.StateSlug,

      response.location &&
      response.location.stateSlug,

      route.stateSlug

    );

  }


  function getDescription(
    business
  ) {

    return firstValue(

      business.LongDescription,

      business.Description,

      business.ShortDescription,

      business.description

    );

  }


  function getImage(
    business
  ) {

    return firstValue(

      business.CoverURL,

      business.coverURL,

      business.LogoURL,

      business.logoURL,

      business.cover,

      business.logo

    );

  }


  function getPhone(
    business
  ) {

    return firstValue(

      business.Mobile,

      business.Phone,

      business.Telephone,

      business.phone

    );

  }


  function getEmail(
    business
  ) {

    return firstValue(

      business.Email,

      business.email

    );

  }


  function getWebsite(
    business
  ) {

    return firstValue(

      business.WebsiteURL,

      business.Website,

      business.website

    );

  }


  /* =======================================================
     TEMPLATE
  ====================================================== */

  function normalizeTemplateName(
    value
  ) {

    var template =
      normalizeSlug(
        value
      );


    /*
      Prevent path traversal.
    */

    return template
      .replace(
        /\.\./g,
        ""
      )
      .replace(
        /[^a-z0-9_-]/g,
        ""
      );

  }


  function resolveTemplate(
    response,
    route
  ) {

    var business =
      response.business ||
      {};


    var category =
      response.category ||
      {};


    /*
      1. Business template
    */

    var template =
      firstValue(

        business.BusinessTemplate,

        business.businessTemplate,

        business.Template,

        business.template

      );


    if (template) {

      return normalizeTemplateName(
        template
      );

    }


    /*
      2. Category template
    */

    template =
      firstValue(

        category.BusinessTemplate,

        category.businessTemplate,

        category.Template,

        category.template

      );


    if (template) {

      return normalizeTemplateName(
        template
      );

    }


    /*
      3. Category aliases
    */

    var categorySlug =
      normalizeSlug(
        getCategorySlug(
          response,
          route
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
  ====================================================== */

  function getTemplateURL(
    template,
    file
  ) {

    return (
      CONFIG.TEMPLATE_ROOT +
      encodeURIComponent(
        template
      ) +
      "/" +
      file
    );

  }


  /* =======================================================
     FETCH TEXT
  ====================================================== */

  async function fetchText(
    url
  ) {

    var controller =
      null;


    var timer =
      null;


    if (
      typeof AbortController !==
        "undefined"
    ) {

      controller =
        new AbortController();


      timer =
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


      if (!response.ok) {

        throw new Error(
          "HTTP " +
          response.status +
          ": " +
          url
        );

      }


      return await response.text();

    } finally {

      if (timer) {

        clearTimeout(
          timer
        );

      }

    }

  }


  /* =======================================================
     LOAD HTML
  ====================================================== */

  async function loadTemplateHTML(
    template
  ) {

    var content =
      getContent();


    if (!content) {

      throw new Error(
        "Missing #businessPageContent."
      );

    }


    try {

      var html =
        await fetchText(
          getTemplateURL(
            template,
            "index.html"
          )
        );


      content.innerHTML =
        html;


      return template;

    } catch (error) {

      /*
        Category template missing:
        fallback to default.
      */

      if (
        template !==
        CONFIG.DEFAULT_TEMPLATE
      ) {

        warn(
          "Template not found:",
          template
        );


        var fallback =
          await fetchText(
            getTemplateURL(
              CONFIG.DEFAULT_TEMPLATE,
              "index.html"
            )
          );


        content.innerHTML =
          fallback;


        return CONFIG.DEFAULT_TEMPLATE;

      }


      throw error;

    }

  }


  /* =======================================================
     TEMPLATE CSS
  ====================================================== */

  function removeTemplateCSS() {

    var links =
      document.querySelectorAll(
        "link[data-ubnux-business-template-style]"
      );


    links.forEach(
      function (link) {

        link.remove();

      }
    );

  }


  function loadTemplateCSS(
    template
  ) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        var existing =
          document.querySelector(
            "link[data-ubnux-business-template-style]"
          );


        if (
          existing &&
          existing.dataset.ubnuxBusinessTemplateStyle ===
            template
        ) {

          resolve();

          return;

        }


        removeTemplateCSS();


        var link =
          document.createElement(
            "link"
          );


        link.rel =
          "stylesheet";


        link.href =
          getTemplateURL(
            template,
            "style.css"
          );


        link.dataset.ubnuxBusinessTemplateStyle =
          template;


        link.onload =
          function () {

            resolve();

          };


        link.onerror =
          function () {

            reject(
              new Error(
                "Template CSS failed: " +
                link.href
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
     TEMPLATE JS
  ====================================================== */

  function removeTemplateJS() {

    var scripts =
      document.querySelectorAll(
        "script[data-ubnux-business-template-script]"
      );


    scripts.forEach(
      function (script) {

        script.remove();

      }
    );

  }


  function loadTemplateJS(
    template
  ) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        var existing =
          document.querySelector(
            "script[data-ubnux-business-template-script]"
          );


        if (
          existing &&
          existing.dataset.ubnuxBusinessTemplateScript ===
            template
        ) {

          resolve();

          return;

        }


        removeTemplateJS();


        var script =
          document.createElement(
            "script"
          );


        script.src =
          getTemplateURL(
            template,
            "script.js"
          );


        script.async =
          false;


        script.dataset.ubnuxBusinessTemplateScript =
          template;


        script.onload =
          function () {

            resolve();

          };


        script.onerror =
          function () {

            reject(
              new Error(
                "Template JS failed: " +
                script.src
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
     TEMPLATE CONTEXT
  ====================================================== */

  function buildContext(
    response,
    route
  ) {

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


    var context = {

      version:
        CONFIG.VERSION,

      business:
        business,

      seo:
        seo,

      schema:
        response.schema,

      category:
        category,

      location:
        location,

      indexability:
        response.indexability,

      route:
        route,

      businessName:
        getBusinessName(
          business
        ),

      businessSlug:
        getBusinessSlug(
          business,
          route
        ),

      categoryName:
        getCategoryName(
          response,
          route
        ),

      categorySlug:
        getCategorySlug(
          response,
          route
        ),

      districtName:
        getDistrictName(
          response,
          route
        ),

      districtSlug:
        getDistrictSlug(
          response,
          route
        ),

      stateName:
        getStateName(
          response,
          route
        ),

      stateSlug:
        getStateSlug(
          response,
          route
        ),

      description:
        getDescription(
          business
        ),

      image:
        getImage(
          business
        ),

      phone:
        getPhone(
          business
        ),

      email:
        getEmail(
          business
        ),

      website:
        getWebsite(
          business
        ),

      canonical:
        firstValue(

          seo.canonicalURL,

          seo.canonical,

          route.canonicalURL

        )

    };


    return context;

  }


  /* =======================================================
     DATA-BIND
  ====================================================== */

  function getNestedValue(
    object,
    path
  ) {

    var value =
      object;


    var parts =
      clean(
        path
      ).split(".");


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


    return (
      value === null ||
      value === undefined
    )
      ? ""
      : value;

  }


  function bindGenericData(
    context
  ) {

    var elements =
      document.querySelectorAll(
        "[data-business-bind]"
      );


    elements.forEach(
      function (element) {

        var key =
          element.getAttribute(
            "data-business-bind"
          );


        var value =
          getNestedValue(
            context,
            key
          );


        if (
          element.tagName ===
            "INPUT" ||
          element.tagName ===
            "TEXTAREA"
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
     BUSINESS NAME
  ====================================================== */

  function bindBusinessName(
    context
  ) {

    document
      .querySelectorAll(
        "[data-business-name]"
      )
      .forEach(
        function (element) {

          element.textContent =
            context.businessName;

        }
      );

  }


  /* =======================================================
     DESCRIPTION
  ====================================================== */

  function bindDescription(
    context
  ) {

    document
      .querySelectorAll(
        "[data-business-description]"
      )
      .forEach(
        function (element) {

          element.textContent =
            context.description;

        }
      );

  }


  /* =======================================================
     IMAGE
  ====================================================== */

  function bindImages(
    context
  ) {

    document
      .querySelectorAll(
        "[data-business-image]"
      )
      .forEach(
        function (element) {

          if (
            !context.image
          ) {

            return;

          }


          if (
            element.tagName ===
              "IMG"
          ) {

            element.src =
              context.image;


            element.alt =
              context.businessName;

          } else {

            element.style.backgroundImage =
              "url(\"" +
              context.image.replace(
                /"/g,
                "%22"
              ) +
              "\")";

          }

        }
      );

  }


  /* =======================================================
     PHONE
  ====================================================== */

  function bindPhone(
    context
  ) {

    document
      .querySelectorAll(
        "[data-business-phone]"
      )
      .forEach(
        function (element) {

          element.textContent =
            context.phone;


          if (
            element.tagName ===
              "A" &&
            context.phone
          ) {

            element.href =
              "tel:" +
              context.phone.replace(
                /[^0-9+]/g,
                ""
              );

          }

        }
      );

  }


  /* =======================================================
     EMAIL
  ====================================================== */

  function bindEmail(
    context
  ) {

    document
      .querySelectorAll(
        "[data-business-email]"
      )
      .forEach(
        function (element) {

          element.textContent =
            context.email;


          if (
            element.tagName ===
              "A" &&
            context.email
          ) {

            element.href =
              "mailto:" +
              context.email;

          }

        }
      );

  }


  /* =======================================================
     WEBSITE
  ====================================================== */

  function bindWebsite(
    context
  ) {

    document
      .querySelectorAll(
        "[data-business-website]"
      )
      .forEach(
        function (element) {

          if (
            element.tagName ===
              "A"
          ) {

            element.href =
              safeURL(
                context.website
              ) ||
              "#";

            element.target =
              "_blank";

            element.rel =
              "noopener noreferrer";

          }

        }
      );

  }


  /* =======================================================
     WHATSAPP
  ====================================================== */

  function bindWhatsApp(
    context
  ) {

    var whatsapp =
      firstValue(

        context.business.WhatsApp,

        context.business.whatsapp,

        context.phone

      );


    var number =
      whatsapp.replace(
        /[^0-9]/g,
        ""
      );


    document
      .querySelectorAll(
        "[data-business-whatsapp]"
      )
      .forEach(
        function (element) {

          if (!number) {

            element.hidden =
              true;

            return;

          }


          element.hidden =
            false;


          if (
            element.tagName ===
              "A"
          ) {

            element.href =
              "https://wa.me/" +
              number;


            element.target =
              "_blank";


            element.rel =
              "noopener noreferrer";

          }

        }
      );

  }


  /* =======================================================
     BIND ALL
  ====================================================== */

  function bindBusinessData(
    context
  ) {

    bindGenericData(
      context
    );

    bindBusinessName(
      context
    );

    bindDescription(
      context
    );

    bindImages(
      context
    );

    bindPhone(
      context
    );

    bindEmail(
      context
    );

    bindWebsite(
      context
    );

    bindWhatsApp(
      context
    );

  }


  /* =======================================================
     BREADCRUMBS
  ====================================================== */

  function renderBreadcrumbs(
    context
  ) {

    var containers =
      document.querySelectorAll(
        "[data-business-breadcrumbs]"
      );


    if (!containers.length) {

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


    containers.forEach(
      function (container) {

        container.innerHTML =
          "";


        items.forEach(
          function (
            item,
            index
          ) {

            var wrapper =
              document.createElement(
                "span"
              );


            wrapper.className =
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


              wrapper.appendChild(
                link
              );

            } else {

              wrapper.textContent =
                item.name;


              wrapper.setAttribute(
                "aria-current",
                "page"
              );

            }


            container.appendChild(
              wrapper
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
     SEO MODULE
  ====================================================== */

  function applySEO(
    context
  ) {

    /*
      seo-meta.js
    */

    if (
      window.UBnuxSEOMeta &&
      typeof window.UBnuxSEOMeta.apply ===
        "function"
    ) {

      window.UBnuxSEOMeta.apply(
        context.seo
      );

    } else {

      warn(
        "UBnuxSEOMeta is not loaded."
      );

    }


    /*
      schema.js
    */

    if (
      window.UBNUX_SCHEMA &&
      typeof window.UBNUX_SCHEMA.renderFromSEO ===
        "function"
    ) {

      window.UBNUX_SCHEMA.renderFromSEO(
        state.response
      );

    } else {

      warn(
        "UBNUX_SCHEMA is not loaded."
      );

    }

  }


  /* =======================================================
     TEMPLATE INITIALIZER
  ====================================================== */

  function initializeTemplate(
    context
  ) {

    if (
      state.templateInitialized
    ) {

      return;

    }


    /*
      Preferred API.
    */

    if (
      window.UBnuxBusinessSite
    ) {

      if (
        typeof window.UBnuxBusinessSite.init ===
          "function"
      ) {

        window.UBnuxBusinessSite.init(
          context
        );


        state.templateInitialized =
          true;


        return;

      }


      if (
        typeof window.UBnuxBusinessSite.initialize ===
          "function"
      ) {

        window.UBnuxBusinessSite.initialize(
          context
        );


        state.templateInitialized =
          true;


        return;

      }

    }


    /*
      Compatibility initializer.
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
      Template may be
      data-attribute driven only.
    */

    state.templateInitialized =
      true;

  }


  /* =======================================================
     BODY CLASSES
  ====================================================== */

  function applyBodyClasses(
    context
  ) {

    if (!document.body) {

      return;

    }


    document.body.classList.add(
      "ubnux-business-page"
    );


    if (
      context.categorySlug
    ) {

      document.body.classList.add(
        "ubnux-category-" +
        normalizeSlug(
          context.categorySlug
        )
      );

    }


    if (
      state.template
    ) {

      document.body.classList.add(
        "ubnux-template-" +
        normalizeSlug(
          state.template
        )
      );

    }

  }


  /* =======================================================
     EXPOSE PAGE DATA
  ====================================================== */

  function exposePageData(
    context
  ) {

    window.UBnuxBusinessPageData = {

      version:
        CONFIG.VERSION,

      route:
        state.route,

      business:
        state.business,

      seo:
        state.seo,

      schema:
        state.schema,

      category:
        state.category,

      location:
        state.location,

      indexability:
        state.response &&
        state.response.indexability,

      template:
        state.template,

      canonical:
        context.canonical

    };

  }


  /* =======================================================
     READY EVENT
  ====================================================== */

  function dispatchReady() {

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

    } catch (error) {

      /*
        Safe fallback for older browsers.
      */

      try {

        var event =
          document.createEvent(
            "CustomEvent"
          );


        event.initCustomEvent(
          "ubnux:business-page-ready",
          false,
          false,
          window.UBnuxBusinessPageData
        );


        document.dispatchEvent(
          event
        );

      } catch (fallbackError) {

        /* Ignore */

      }

    }

  }


  /* =======================================================
     MAIN INITIALIZER
  ====================================================== */

  async function initialize(
    options
  ) {

    if (
      state.loading
    ) {

      return;

    }


    if (
      state.initialized &&
      !(
        options &&
        options.force
      )
    ) {

      return;

    }


    state.loading =
      true;


    showLoader();


    try {

      /* ===================================================
         1. ROUTE
      ================================================== */

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


      /*
        IMPORTANT:

        No redirect.
        SEO URL remains untouched.
      */


      /* ===================================================
         2. API
      ================================================== */

      log(
        "Loading business:",
        route
      );


      var rawResponse =
        await loadBusiness(
          route
        );


      /* ===================================================
         3. NORMALIZE
      ================================================== */

      var response =
        normalizeResponse(
          rawResponse
        );


      state.response =
        response;


      state.business =
        response.business;


      state.seo =
        response.seo;


      state.schema =
        response.schema;


      state.category =
        response.category;


      state.location =
        response.location;


      /* ===================================================
         4. CONTEXT
      ================================================== */

      var context =
        buildContext(
          response,
          route
        );


      /* ===================================================
         5. SEO
      ================================================== */

      applySEO(
        context
      );


      /* ===================================================
         6. TEMPLATE
      ================================================== */

      var template =
        resolveTemplate(
          response,
          route
        );


      log(
        "Business template:",
        template
      );


      /*
        Load CSS first.
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
        Load HTML.
      */

      var actualTemplate =
        await loadTemplateHTML(
          template
        );


      state.template =
        actualTemplate;


      /*
        Load JS.
      */

      try {

        await loadTemplateJS(
          actualTemplate
        );

      } catch (jsError) {

        warn(
          "Template JS failed:",
          jsError
        );

      }


      /* ===================================================
         7. DATA BINDING
      ================================================== */

      bindBusinessData(
        context
      );


      /* ===================================================
         8. BREADCRUMBS
      ================================================== */

      renderBreadcrumbs(
        context
      );


      /* ===================================================
         9. BODY
      ================================================== */

      applyBodyClasses(
        context
      );


      /* ===================================================
         10. TEMPLATE INIT
      ================================================== */

      initializeTemplate(
        context
      );


      /* ===================================================
         11. GLOBAL DATA
      ================================================== */

      exposePageData(
        context
      );


      /* ===================================================
         12. STATE
      ================================================== */

      state.loaded =
        true;


      state.initialized =
        true;


      hideLoader();


      dispatchReady();


      log(
        "Business page loaded:",
        context.businessName
      );


    } catch (error) {

      state.loaded =
        false;


      logError(
        "Business page failed:",
        error
      );


      showError(
        error.message ||
        "Unable to load business page."
      );

    } finally {

      state.loading =
        false;

    }

  }


  /* =======================================================
     PUBLIC API
  ====================================================== */

  var BusinessPage = {

    version:
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

          category:
            state.category,

          location:
            state.location,

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
     GLOBAL EXPORT
  ====================================================== */

  window.UBnuxBusinessPage =
    BusinessPage;


  window.UBNUX_BUSINESS_PAGE =
    BusinessPage;


  App.businessPage =
    BusinessPage;


  /* =======================================================
     AUTO INIT
  ====================================================== */

  function boot() {

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

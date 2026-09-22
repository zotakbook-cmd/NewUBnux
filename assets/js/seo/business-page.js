/* =========================================================
   UBnux Business Page Controller
   File:
   assets/js/seo/business-page.js

   Version:
   5.0.0

   NEW ARCHITECTURE
   ---------------------------------------------------------
   Business page = category-specific mini website

   Example:

   /in/bihar/siwan/clothing-and-fashion/siwan-fashion-house/

                     ↓

   Business API
                     ↓
   Category / BusinessTemplate
                     ↓
   /assets/business-sites/clothing/
                     ↓
   index.html
   style.css
   script.js

   Responsibilities:
   - Detect SEO business route
   - Load business data
   - Resolve business category template
   - Load category HTML
   - Load category CSS
   - Load category JavaScript
   - Bind business data
   - Initialize category website
   - SEO metadata
   - Canonical URL
   - Open Graph
   - Twitter metadata
   - Basic JSON-LD
   - Loading / error handling
   - No redirects
   - Preserve permanent SEO URL
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

    VERSION: "5.0.0",

    TEMPLATE_ROOT:
      "/assets/business-sites/",

    DEFAULT_TEMPLATE:
      "default",

    API_TIMEOUT:
      15000

  };


  /* =======================================================
     STATE
  ======================================================= */

  var state = {

    initialized: false,

    loading: false,

    loaded: false,

    business: null,

    seo: null,

    route: null,

    template: null,

    templateHTML: "",

    templateCSS: null,

    templateScript: null

  };


  /* =======================================================
     LOG
  ======================================================= */

  function log() {

    if (
      window.console &&
      typeof console.log === "function"
    ) {

      console.log.apply(
        console,
        [
          "[UBnux Business Page]"
        ].concat(
          Array.prototype.slice.call(arguments)
        )
      );

    }

  }


  /* =======================================================
     WARN
  ======================================================= */

  function warn() {

    if (
      window.console &&
      typeof console.warn === "function"
    ) {

      console.warn.apply(
        console,
        [
          "[UBnux Business Page]"
        ].concat(
          Array.prototype.slice.call(arguments)
        )
      );

    }

  }


  /* =======================================================
     ERROR
  ======================================================= */

  function errorLog() {

    if (
      window.console &&
      typeof console.error === "function"
    ) {

      console.error.apply(
        console,
        [
          "[UBnux Business Page]"
        ].concat(
          Array.prototype.slice.call(arguments)
        )
      );

    }

  }


  /* =======================================================
     DOM HELPERS
     ======================================================= */

  function get(id) {

    return document.getElementById(id);

  }


  function qs(selector, parent) {

    return (
      parent ||
      document
    ).querySelector(selector);

  }


  function qsa(selector, parent) {

    return Array.prototype.slice.call(
      (
        parent ||
        document
      ).querySelectorAll(selector)
    );

  }


  /* =======================================================
     PAGE ELEMENTS
     ======================================================= */

  function getPageElement() {

    return get("businessPage");

  }


  function getContentElement() {

    return get(
      "businessPageContent"
    );

  }


  function getErrorElement() {

    return get(
      "businessPageError"
    );

  }


  function getLoaderElement() {

    return get(
      "businessPageLoader"
    );

  }


  /* =======================================================
     SHOW LOADER
     ======================================================= */

  function showLoader() {

    var loader =
      getLoaderElement();

    if (!loader) {
      return;
    }

    loader.hidden = false;

    loader.removeAttribute(
      "hidden"
    );

    loader.style.display =
      "";

  }


  /* =======================================================
     HIDE LOADER
     ======================================================= */

  function hideLoader() {

    var loader =
      getLoaderElement();

    if (!loader) {
      return;
    }

    loader.hidden = true;

    loader.setAttribute(
      "hidden",
      ""
    );

    loader.style.display =
      "none";

  }


  /* =======================================================
     SHOW BUSINESS PAGE
     ======================================================= */

  function showBusinessPage() {

    var page =
      getPageElement();

    var content =
      getContentElement();

    if (page) {

      page.hidden = false;

      page.removeAttribute(
        "hidden"
      );

      page.style.display =
        "";

    }

    if (content) {

      content.hidden = false;

      content.removeAttribute(
        "hidden"
      );

      content.style.display =
        "block";

    }

  }


  /* =======================================================
     HIDE BUSINESS PAGE
     ======================================================= */

  function hideBusinessPage() {

    var page =
      getPageElement();

    if (!page) {
      return;
    }

    page.hidden = true;

    page.setAttribute(
      "hidden",
      ""
    );

  }


  /* =======================================================
     SHOW ERROR
     ======================================================= */

  function showError(message) {

    hideLoader();

    var page =
      getPageElement();

    var content =
      getContentElement();

    var errorBox =
      getErrorElement();

    var errorMessage =
      get("businessErrorMessage");


    if (page) {

      page.hidden = false;

      page.removeAttribute(
        "hidden"
      );

      page.style.display =
        "";

    }


    if (content) {

      content.innerHTML =
        "";

      content.hidden = true;

      content.setAttribute(
        "hidden",
        ""
      );

      content.style.display =
        "none";

    }


    if (errorMessage) {

      errorMessage.textContent =
        message ||
        "We could not find the business you are looking for.";

    }


    if (errorBox) {

      errorBox.hidden = false;

      errorBox.removeAttribute(
        "hidden"
      );

      errorBox.style.display =
        "";

    }

  }


  /* =======================================================
     HIDE ERROR
     ======================================================= */

  function hideError() {

    var errorBox =
      getErrorElement();

    if (!errorBox) {
      return;
    }

    errorBox.hidden = true;

    errorBox.setAttribute(
      "hidden",
      ""
    );

    errorBox.style.display =
      "none";

  }


  /* =======================================================
     GET CURRENT ROUTE
     ======================================================= */

  function getCurrentRoute() {

    var route = null;


    /*
      Primary router
    */

    if (
      App.router &&
      typeof App.router.getCurrentRoute ===
        "function"
    ) {

      try {

        route =
          App.router.getCurrentRoute();

      } catch (err) {

        warn(
          "App.router.getCurrentRoute failed",
          err
        );

      }

    }


    /*
      Alternative router API
    */

    if (
      !route &&
      window.UBNUX_SEO_ROUTER &&
      typeof window.UBNUX_SEO_ROUTER.getRoute ===
        "function"
    ) {

      try {

        route =
          window.UBNUX_SEO_ROUTER.getRoute();

      } catch (err2) {

        warn(
          "SEO router getRoute failed",
          err2
        );

      }

    }


    /*
      Parse directly as fallback
    */

    if (
      !route &&
      window.UBNUX_SEO_ROUTER &&
      typeof window.UBNUX_SEO_ROUTER.parse ===
        "function"
    ) {

      try {

        route =
          window.UBNUX_SEO_ROUTER.parse(
            window.location.pathname
          );

      } catch (err3) {

        warn(
          "SEO router parse failed",
          err3
        );

      }

    }


    /*
      Final direct parser
    */

    if (!route) {

      route =
        parseBusinessPath(
          window.location.pathname
        );

    }


    return route;

  }


  /* =======================================================
     DIRECT BUSINESS PATH PARSER
     ======================================================= */

  function parseBusinessPath(pathname) {

    var path =
      String(
        pathname ||
        ""
      ).trim();


    /*
      Remove query/hash
    */

    path =
      path.split("?")[0];

    path =
      path.split("#")[0];


    /*
      Normalize
    */

    path =
      path
        .replace(/^\/+/, "")
        .replace(/\/+$/, "");


    var parts =
      path
        ? path.split("/")
        : [];


    /*
      Expected:

      in
      state
      district
      category
      business
    */

    if (
      parts.length !== 5 ||
      parts[0].toLowerCase() !== "in"
    ) {

      return null;

    }


    return {

      type:
        "business",

      isBusinessPage:
        true,

      isSEOPage:
        true,

      stateSlug:
        decodeURIComponent(
          parts[1]
        ),

      districtSlug:
        decodeURIComponent(
          parts[2]
        ),

      categorySlug:
        decodeURIComponent(
          parts[3]
        ),

      businessSlug:
        decodeURIComponent(
          parts[4]
        ),

      canonicalPath:
        "/in/" +
        parts[1] +
        "/" +
        parts[2] +
        "/" +
        parts[3] +
        "/" +
        parts[4] +
        "/"

    };

  }


  /* =======================================================
     VALIDATE ROUTE
     ======================================================= */

  function isValidBusinessRoute(route) {

    if (!route) {
      return false;
    }


    var stateSlug =
      String(
        route.stateSlug ||
        ""
      ).trim();

    var districtSlug =
      String(
        route.districtSlug ||
        ""
      ).trim();

    var categorySlug =
      String(
        route.categorySlug ||
        ""
      ).trim();

    var businessSlug =
      String(
        route.businessSlug ||
        ""
      ).trim();


    return (
      !!stateSlug &&
      !!districtSlug &&
      !!categorySlug &&
      !!businessSlug
    );

  }


  /* =======================================================
     BUILD CANONICAL URL
     ======================================================= */

  function buildCanonicalURL(route) {

    if (
      !route ||
      !route.stateSlug ||
      !route.districtSlug ||
      !route.categorySlug ||
      !route.businessSlug
    ) {

      return "";

    }


    var origin =
      window.location.origin;


    /*
      Production canonical domain
    */

    if (
      window.UBNUX_CONFIG &&
      window.UBNUX_CONFIG.SITE_URL
    ) {

      origin =
        String(
          window.UBNUX_CONFIG.SITE_URL
        ).replace(
          /\/+$/,
          ""
        );

    } else {

      origin =
        "https://ubnux.com";

    }


    return (
      origin +
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
      "/"
    );

  }


  /* =======================================================
     GET BUSINESS FROM API
     ======================================================= */

  async function fetchBusiness(route) {

    if (
      !window.UBnuxAPI
    ) {

      throw new Error(
        "UBnuxAPI is not available."
      );

    }


    if (
      typeof window.UBnuxAPI.getBusiness !==
      "function"
    ) {

      throw new Error(
        "UBnuxAPI.getBusiness() is not available."
      );

    }


    log(
      "Loading business:",
      route
    );


    var result =
      await window.UBnuxAPI.getBusiness({

        state:
          route.stateSlug,

        district:
          route.districtSlug,

        category:
          route.categorySlug,

        slug:
          route.businessSlug

      });


    if (!result) {

      throw new Error(
        "Empty business API response."
      );

    }


    /*
      Accept common response structures
    */

    var business =
      result.business ||
      result.data ||
      result.Business ||
      null;


    var seo =
      result.seo ||
      result.SEO ||
      null;


    /*
      Some APIs may return data directly
    */

    if (
      !business &&
      (
        result.BusinessID ||
        result.BusinessName ||
        result.businessName
      )
    ) {

      business =
        result;

    }


    if (!business) {

      throw new Error(
        result.message ||
        "Business not found."
      );

    }


    return {

      business:
        business,

      seo:
        seo,

      raw:
        result

    };

  }


  /* =======================================================
     NORMALIZE BUSINESS DATA
     ======================================================= */

  function normalizeBusiness(
    business,
    route
  ) {

    business =
      business ||
      {};


    /*
      Clone so API object is not modified
    */

    var normalized =
      Object.assign(
        {},
        business
      );


    /*
      Canonical route information
    */

    normalized.StateSlug =
      normalized.StateSlug ||
      normalized.stateSlug ||
      route.stateSlug ||
      "";

    normalized.DistrictSlug =
      normalized.DistrictSlug ||
      normalized.districtSlug ||
      route.districtSlug ||
      "";

    normalized.CategorySlug =
      normalized.CategorySlug ||
      normalized.categorySlug ||
      route.categorySlug ||
      "";

    normalized.Slug =
      normalized.Slug ||
      normalized.slug ||
      route.businessSlug ||
      "";


    /*
      Business name
    */

    normalized.BusinessName =
      normalized.BusinessName ||
      normalized.businessName ||
      normalized.Name ||
      normalized.name ||
      "";


    /*
      Description
    */

    normalized.Description =
      normalized.Description ||
      normalized.description ||
      "";


    normalized.ShortDescription =
      normalized.ShortDescription ||
      normalized.shortDescription ||
      normalized.Description ||
      "";


    normalized.LongDescription =
      normalized.LongDescription ||
      normalized.longDescription ||
      normalized.Description ||
      "";


    /*
      Images
    */

    normalized.LogoURL =
      normalized.LogoURL ||
      normalized.logoURL ||
      normalized.logoUrl ||
      normalized.logo ||
      "";

    normalized.CoverURL =
      normalized.CoverURL ||
      normalized.coverURL ||
      normalized.coverUrl ||
      normalized.cover ||
      "";


    /*
      Contact
    */

    normalized.Mobile =
      normalized.Mobile ||
      normalized.mobile ||
      normalized.Phone ||
      normalized.phone ||
      "";

    normalized.WhatsApp =
      normalized.WhatsApp ||
      normalized.whatsapp ||
      normalized.Mobile ||
      normalized.mobile ||
      "";


    normalized.Email =
      normalized.Email ||
      normalized.email ||
      "";


    normalized.WebsiteURL =
      normalized.WebsiteURL ||
      normalized.websiteURL ||
      normalized.websiteUrl ||
      normalized.website ||
      "";


    /*
      Location
    */

    normalized.Address =
      normalized.Address ||
      normalized.address ||
      "";

    normalized.Area =
      normalized.Area ||
      normalized.area ||
      "";

    normalized.Pincode =
      normalized.Pincode ||
      normalized.pincode ||
      "";


    /*
      Business template
    */

    normalized.BusinessTemplate =
      normalized.BusinessTemplate ||
      normalized.businessTemplate ||
      normalized.Template ||
      normalized.template ||
      "";


    return normalized;

  }


  /* =======================================================
     RESOLVE TEMPLATE
     ======================================================= */

  function resolveTemplate(
    business,
    route
  ) {

    var explicit =
      String(
        business.BusinessTemplate ||
        business.businessTemplate ||
        ""
      )
        .trim()
        .toLowerCase();


    if (explicit) {

      return normalizeTemplateName(
        explicit
      );

    }


    var category =
      String(
        business.CategorySlug ||
        business.categorySlug ||
        route.categorySlug ||
        ""
      )
        .trim()
        .toLowerCase();


    /*
      Category aliases
    */

    var aliases = {

      "clothing-and-fashion":
        "clothing",

      "clothing":
        "clothing",

      "fashion":
        "clothing",

      "restaurants":
        "restaurant",

      "restaurant":
        "restaurant",

      "food-and-restaurants":
        "restaurant",

      "hotels":
        "hotel",

      "hotel":
        "hotel",

      "salons":
        "salon",

      "salon":
        "salon",

      "beauty-and-salon":
        "salon",

      "hospitals":
        "hospital",

      "hospital":
        "hospital",

      "healthcare":
        "hospital",

      "coaching":
        "coaching",

      "coaching-institute":
        "coaching",

      "education":
        "coaching",

      "real-estate":
        "realestate",

      "property":
        "realestate",

      "property-dealers":
        "realestate",

      "automobile":
        "automobile",

      "automobiles":
        "automobile",

      "car-and-bike":
        "automobile",

      "electronics":
        "electronics",

      "electronics-and-mobile":
        "electronics",

      "mobile-shops":
        "electronics",

      "grocery":
        "grocery",

      "grocery-stores":
        "grocery",

      "general-store":
        "grocery",

      "services":
        "service",

      "professional-services":
        "service"

    };


    return (
      aliases[category] ||
      normalizeTemplateName(
        category
      ) ||
      CONFIG.DEFAULT_TEMPLATE
    );

  }


  /* =======================================================
     NORMALIZE TEMPLATE NAME
     ======================================================= */

  function normalizeTemplateName(
    name
  ) {

    var value =
      String(
        name ||
        ""
      )
        .trim()
        .toLowerCase();


    /*
      Remove dangerous characters
    */

    value =
      value.replace(
        /[^a-z0-9_-]/g,
        ""
      );


    /*
      Empty fallback
    */

    return (
      value ||
      CONFIG.DEFAULT_TEMPLATE
    );

  }


  /* =======================================================
     TEMPLATE PATH
     ======================================================= */

  function getTemplatePath(
    templateName
  ) {

    return (
      CONFIG.TEMPLATE_ROOT +
      encodeURIComponent(
        templateName
      ) +
      "/"
    );

  }


  /* =======================================================
     FETCH TEMPLATE HTML
     ======================================================= */

  async function fetchTemplateHTML(
    templateName
  ) {

    var path =
      getTemplatePath(
        templateName
      );


    var url =
      path +
      "index.html";


    log(
      "Loading template HTML:",
      url
    );


    var response =
      await fetch(
        url,
        {
          method:
            "GET",

          cache:
            "no-cache"
        }
      );


    if (!response.ok) {

      throw new Error(
        "Template HTML could not be loaded: " +
        templateName +
        " (" +
        response.status +
        ")"
      );

    }


    return await response.text();

  }


  /* =======================================================
     LOAD TEMPLATE CSS
     ======================================================= */

  function loadTemplateCSS(
    templateName
  ) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        var href =
          getTemplatePath(
            templateName
          ) +
          "style.css";


        /*
          Already loaded?
        */

        var existing =
          document.querySelector(
            'link[data-ubnux-business-template-css="' +
            CSS.escape(templateName) +
            '"]'
          );


        if (existing) {

          state.templateCSS =
            existing;

          resolve(
            existing
          );

          return;

        }


        var link =
          document.createElement(
            "link"
          );


        link.rel =
          "stylesheet";


        link.href =
          href;


        link.dataset.ubnuxBusinessTemplateCss =
          templateName;


        link.onload =
          function () {

            state.templateCSS =
              link;

            resolve(
              link
            );

          };


        link.onerror =
          function () {

            reject(
              new Error(
                "Template CSS could not be loaded: " +
                templateName
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
     REMOVE OLD TEMPLATE CSS
     ======================================================= */

  function removeOldTemplateCSS(
    keepTemplate
  ) {

    qsa(
      "link[data-ubnux-business-template-css]"
    ).forEach(
      function (link) {

        var name =
          link.dataset
            .ubnuxBusinessTemplateCss;


        if (
          name !==
          keepTemplate
        ) {

          link.parentNode.removeChild(
            link
          );

        }

      }
    );

  }


  /* =======================================================
     LOAD TEMPLATE JAVASCRIPT
     ======================================================= */

  function loadTemplateScript(
    templateName
  ) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        var src =
          getTemplatePath(
            templateName
          ) +
          "script.js";


        /*
          Already loaded?
        */

        var existing =
          document.querySelector(
            'script[data-ubnux-business-template-js="' +
            CSS.escape(templateName) +
            '"]'
          );


        if (existing) {

          state.templateScript =
            existing;

          resolve(
            existing
          );

          return;

        }


        var script =
          document.createElement(
            "script"
          );


        script.src =
          src;


        script.async =
          false;


        script.dataset.ubnuxBusinessTemplateJs =
          templateName;


        script.onload =
          function () {

            state.templateScript =
              script;

            resolve(
              script
            );

          };


        script.onerror =
          function () {

            reject(
              new Error(
                "Template JavaScript could not be loaded: " +
                templateName
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
     NORMALIZE TEMPLATE HTML
     ======================================================= */

  function normalizeTemplateHTML(
    html
  ) {

    var value =
      String(
        html ||
        ""
      );


    /*
      If template contains full HTML document,
      extract body content.
    */

    if (
      /<html[\s>]/i.test(value)
    ) {

      try {

        var parser =
          new DOMParser();

        var parsed =
          parser.parseFromString(
            value,
            "text/html"
          );


        if (
          parsed &&
          parsed.body
        ) {

          return parsed.body.innerHTML;

        }

      } catch (err) {

        warn(
          "Could not parse template document.",
          err
        );

      }

    }


    return value;

  }


  /* =======================================================
     RENDER TEMPLATE HTML
     ======================================================= */

  function renderTemplateHTML(
    html,
    templateName
  ) {

    var content =
      getContentElement();


    if (!content) {

      throw new Error(
        "#businessPageContent not found."
      );

    }


    var normalized =
      normalizeTemplateHTML(
        html
      );


    content.innerHTML =
      normalized;


    content.dataset.businessTemplate =
      templateName;


    content.setAttribute(
      "data-business-template",
      templateName
    );


    state.templateHTML =
      normalized;


    /*
      Give page category information
    */

    var page =
      getPageElement();


    if (page) {

      page.dataset.businessTemplate =
        templateName;

      page.setAttribute(
        "data-business-template",
        templateName
      );

    }


    /*
      Remove previous category CSS
    */

    removeOldTemplateCSS(
      templateName
    );


    return content;

  }


  /* =======================================================
     BIND COMMON BUSINESS DATA
     ======================================================= */

  function bindCommonBusinessData(
    root,
    business,
    route
  ) {

    if (!root) {
      return;
    }


    /*
      Generic text binding:

      data-business-name
      data-business-description
      etc.
    */

    var bindings = {

      "business-name":
        business.BusinessName,

      "business-description":
        business.Description,

      "business-short-description":
        business.ShortDescription,

      "business-long-description":
        business.LongDescription,

      "business-category":
        business.CategoryName ||
        business.Category ||
        route.categorySlug,

      "business-address":
        business.Address,

      "business-area":
        business.Area,

      "business-pincode":
        business.Pincode,

      "business-mobile":
        business.Mobile,

      "business-whatsapp":
        business.WhatsApp,

      "business-email":
        business.Email,

      "business-website":
        business.WebsiteURL,

      "business-opening-time":
        business.OpeningTime,

      "business-closing-time":
        business.ClosingTime,

      "business-working-days":
        business.WorkingDays,

      "business-rating":
        business.Rating,

      "business-review-count":
        business.ReviewCount,

      "business-owner":
        business.OwnerName,

      "business-established-year":
        business.EstablishedYear

    };


    Object.keys(
      bindings
    ).forEach(
      function (key) {

        var value =
          bindings[key];


        qsa(
          "[data-" +
          key +
          "]",
          root
        ).forEach(
          function (element) {

            if (
              value ===
              undefined ||
              value ===
              null
            ) {

              return;

            }


            element.textContent =
              String(
                value
              );

          }
        );

      }
    );


    /*
      Logo
    */

    qsa(
      "[data-business-logo]",
      root
    ).forEach(
      function (img) {

        if (
          business.LogoURL
        ) {

          img.src =
            business.LogoURL;

          img.alt =
            business.BusinessName ||
            "Business Logo";

        }

      }
    );


    /*
      Cover
    */

    qsa(
      "[data-business-cover]",
      root
    ).forEach(
      function (element) {

        if (
          business.CoverURL
        ) {

          if (
            element.tagName ===
            "IMG"
          ) {

            element.src =
              business.CoverURL;

            element.alt =
              business.BusinessName ||
              "Business";

          } else {

            element.style.backgroundImage =
              "url('" +
              String(
                business.CoverURL
              ).replace(
                /'/g,
                "%27"
              ) +
              "')";

          }

        }

      }
    );


    /*
      Call links
    */

    qsa(
      "[data-call]",
      root
    ).forEach(
      function (element) {

        if (
          business.Mobile
        ) {

          var mobile =
            String(
              business.Mobile
            )
              .replace(
                /[^\d+]/g,
                ""
              );


          element.href =
            "tel:" +
            mobile;

        } else {

          element.removeAttribute(
            "href"
          );

        }

      }
    );


    /*
      WhatsApp links
    */

    qsa(
      "[data-whatsapp]",
      root
    ).forEach(
      function (element) {

        if (
          business.WhatsApp
        ) {

          var number =
            String(
              business.WhatsApp
            )
              .replace(
                /\D/g,
                ""
              );


          /*
            India fallback
          */

          if (
            number.length === 10
          ) {

            number =
              "91" +
              number;

          }


          element.href =
            "https://wa.me/" +
            number;


          element.target =
            "_blank";


          element.rel =
            "noopener noreferrer";

        } else {

          element.removeAttribute(
            "href"
          );

        }

      }
    );


    /*
      Website
    */

    qsa(
      "[data-website]",
      root
    ).forEach(
      function (element) {

        if (
          business.WebsiteURL
        ) {

          element.href =
            business.WebsiteURL;


          element.target =
            "_blank";


          element.rel =
            "noopener noreferrer";

        } else {

          element.removeAttribute(
            "href"
          );

        }

      }
    );


    /*
      Google location
    */

    qsa(
      "[data-google-place]",
      root
    ).forEach(
      function (element) {

        if (
          business.GooglePlaceURL
        ) {

          element.href =
            business.GooglePlaceURL;


          element.target =
            "_blank";


          element.rel =
            "noopener noreferrer";

        }

      }
    );

  }


  /* =======================================================
     TEMPLATE INITIALIZER
     ======================================================= */

  async function initializeTemplate(
    templateName,
    business,
    route,
    seo
  ) {

    /*
      Load CSS
    */

    await loadTemplateCSS(
      templateName
    );


    /*
      Load JS
    */

    await loadTemplateScript(
      templateName
    );


    /*
      Find category script API
    */

    var templateAPI =
      window.UBnuxBusinessSite;


    /*
      Alternative namespace
    */

    if (
      !templateAPI &&
      window.UBnuxBusinessTemplates
    ) {

      templateAPI =
        window.UBnuxBusinessTemplates[
          templateName
        ];

    }


    /*
      Common data binding
      works even if category script
      doesn't expose an initializer.
    */

    var content =
      getContentElement();


    bindCommonBusinessData(
      content,
      business,
      route
    );


    /*
      Category-specific initializer
    */

    if (
      templateAPI &&
      typeof templateAPI.init ===
        "function"
    ) {

      await templateAPI.init({

        business:
          business,

        route:
          route,

        seo:
          seo,

        root:
          content,

        template:
          templateName

      });

      return;

    }


    /*
      Alternative function name
    */

    if (
      templateAPI &&
      typeof templateAPI.initialize ===
        "function"
    ) {

      await templateAPI.initialize({

        business:
          business,

        route:
          route,

        seo:
          seo,

        root:
          content,

        template:
          templateName

      });

    }

  }


  /* =======================================================
     META HELPER
     ======================================================= */

  function setMeta(
    selector,
    value
  ) {

    if (
      !value
    ) {

      return;

    }


    var element =
      qs(selector);


    if (element) {

      element.setAttribute(
        "content",
        String(value)
      );

    }

  }


  /* =======================================================
     SET META TAGS
     ======================================================= */

  function updateSEO(
    business,
    seo,
    route
  ) {

    business =
      business ||
      {};

    seo =
      seo ||
      {};


    var name =
      business.BusinessName ||
      business.businessName ||
      "Business";


    var description =
      seo.description ||
      seo.Description ||
      business.SEO_Description ||
      business.SEODescription ||
      business.ShortDescription ||
      business.Description ||
      (
        "Find " +
        name +
        " on UBnux."
      );


    var title =
      seo.title ||
      seo.Title ||
      business.SEO_Title ||
      business.SEOTitle ||
      (
        name +
        " | UBnux"
      );


    var image =
      business.CoverURL ||
      business.LogoURL ||
      seo.image ||
      seo.Image ||
      "https://ubnux.com/assets/images/default-business.jpg";


    var canonical =
      buildCanonicalURL(
        route
      );


    /*
      Document title
    */

    document.title =
      title;


    /*
      Description
    */

    setMeta(
      'meta[name="description"]',
      description
    );


    /*
      Robots
    */

    setMeta(
      'meta[name="robots"]',
      "index,follow,max-image-preview:large"
    );


    /*
      Canonical
    */

    var canonicalElement =
      qs(
        'link[rel="canonical"]'
      );


    if (
      canonicalElement
    ) {

      canonicalElement.href =
        canonical;

    } else if (
      canonical
    ) {

      canonicalElement =
        document.createElement(
          "link"
        );


      canonicalElement.rel =
        "canonical";


      canonicalElement.href =
        canonical;


      document.head.appendChild(
        canonicalElement
      );

    }


    /*
      Open Graph
    */

    setMeta(
      'meta[property="og:title"]',
      title
    );

    setMeta(
      'meta[property="og:description"]',
      description
    );

    setMeta(
      'meta[property="og:url"]',
      canonical
    );

    setMeta(
      'meta[property="og:image"]',
      image
    );


    /*
      Twitter
    */

    setMeta(
      'meta[name="twitter:title"]',
      title
    );

    setMeta(
      'meta[name="twitter:description"]',
      description
    );

    setMeta(
      'meta[name="twitter:image"]',
      image
    );


    return {

      title:
        title,

      description:
        description,

      image:
        image,

      canonical:
        canonical

    };

  }


  /* =======================================================
     JSON-LD
     ======================================================= */

  function updateSchema(
    business,
    route,
    seoData
  ) {

    if (!business) {
      return;
    }


    var name =
      business.BusinessName ||
      "Business";


    var description =
      business.Description ||
      business.ShortDescription ||
      "";


    var image =
      business.CoverURL ||
      business.LogoURL ||
      "";


    var address = {

      "@type":
        "PostalAddress",

      streetAddress:
        business.Address ||
        "",

      addressLocality:
        business.Area ||
        "",

      postalCode:
        business.Pincode ||
        "",

      addressCountry:
        "IN"

    };


    var schema = {

      "@context":
        "https://schema.org",

      "@type":
        "LocalBusiness",

      name:
        name,

      description:
        description,

      url:
        seoData &&
        seoData.canonical
          ? seoData.canonical
          : buildCanonicalURL(
              route
            ),

      address:
        address

    };


    if (image) {

      schema.image =
        image;

    }


    if (
      business.Mobile
    ) {

      schema.telephone =
        business.Mobile;

    }


    if (
      business.Email
    ) {

      schema.email =
        business.Email;

    }


    if (
      business.Rating &&
      business.ReviewCount
    ) {

      schema.aggregateRating = {

        "@type":
          "AggregateRating",

        ratingValue:
          String(
            business.Rating
          ),

        reviewCount:
          String(
            business.ReviewCount
          )

      };

    }


    /*
      Remove our previous schema
    */

    var old =
      qs(
        'script[data-ubnux-business-schema]'
      );


    if (old) {

      old.parentNode.removeChild(
        old
      );

    }


    var script =
      document.createElement(
        "script"
      );


    script.type =
      "application/ld+json";


    script.dataset.ubnuxBusinessSchema =
      "true";


    script.textContent =
      JSON.stringify(
        schema
      );


    document.head.appendChild(
      script
    );

  }


  /* =======================================================
     REMOVE OLD BUSINESS TEMPLATE SCRIPT
     ======================================================= */

  function cleanupOldTemplateScripts(
    keepTemplate
  ) {

    qsa(
      "script[data-ubnux-business-template-js]"
    ).forEach(
      function (script) {

        var name =
          script.dataset
            .ubnuxBusinessTemplateJs;


        if (
          name !==
          keepTemplate
        ) {

          try {

            script.parentNode.removeChild(
              script
            );

          } catch (err) {}

        }

      }
    );

  }


  /* =======================================================
     MAIN LOAD
     ======================================================= */

  async function loadBusinessPage() {

    if (
      state.loading
    ) {

      return;

    }


    state.loading =
      true;


    showLoader();

    hideError();


    try {

      /*
        Get route
      */

      var route =
        getCurrentRoute();


      if (
        !isValidBusinessRoute(
          route
        )
      ) {

        throw new Error(
          "Invalid business SEO URL."
        );

      }


      state.route =
        route;


      log(
        "Business route:",
        route
      );


      /*
        Load API data
      */

      var result =
        await fetchBusiness(
          route
        );


      var business =
        normalizeBusiness(
          result.business,
          route
        );


      var seo =
        result.seo ||
        {};


      state.business =
        business;


      state.seo =
        seo;


      /*
        Resolve category template
      */

      var templateName =
        resolveTemplate(
          business,
          route
        );


      state.template =
        templateName;


      log(
        "Resolved template:",
        templateName
      );


      /*
        Update SEO before rendering
      */

      var seoData =
        updateSEO(
          business,
          seo,
          route
        );


      /*
        JSON-LD
      */

      updateSchema(
        business,
        route,
        seoData
      );


      /*
        Fetch category HTML
      */

      var html;

      try {

        html =
          await fetchTemplateHTML(
            templateName
          );

      } catch (templateError) {

        /*
          If category template is missing,
          fallback to default.
        */

        warn(
          "Template failed. Trying default template.",
          templateError
        );


        if (
          templateName !==
          CONFIG.DEFAULT_TEMPLATE
        ) {

          templateName =
            CONFIG.DEFAULT_TEMPLATE;


          state.template =
            templateName;


          html =
            await fetchTemplateHTML(
              templateName
            );

        } else {

          throw templateError;

        }

      }


      /*
        Render HTML
      */

      renderTemplateHTML(
        html,
        templateName
      );


      /*
        Make page visible
      */

      showBusinessPage();


      /*
        Clean previous template resources
      */

      cleanupOldTemplateScripts(
        templateName
      );


      /*
        Initialize category site
      */

      await initializeTemplate(
        templateName,
        business,
        route,
        seo
      );


      /*
        Re-bind common data after
        category script execution
      */

      bindCommonBusinessData(
        getContentElement(),
        business,
        route
      );


      /*
        Final state
      */

      state.loaded =
        true;


      state.loading =
        false;


      hideLoader();

      hideError();


      log(
        "Business page loaded successfully.",
        {
          business:
            business.BusinessName,

          template:
            templateName,

          canonical:
            seoData &&
            seoData.canonical
        }
      );


    } catch (err) {

      state.loading =
        false;

      state.loaded =
        false;


      hideLoader();


      errorLog(
        "Business page failed:",
        err
      );


      showError(
        err &&
        err.message
          ? err.message
          : "We could not load this business."
      );

    }

  }


  /* =======================================================
     INITIALIZATION
     ======================================================= */

  function initialize() {

    if (
      state.initialized
    ) {

      return;

    }


    state.initialized =
      true;


    /*
      Only run on business page
    */

    var route =
      getCurrentRoute();


    if (
      !isValidBusinessRoute(
        route
      )
    ) {

      log(
        "Not a business SEO page. Controller skipped."
      );

      return;

    }


    log(
      "Initializing UBnux Business Page Controller v" +
      CONFIG.VERSION
    );


    loadBusinessPage();

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  window.UBnuxBusinessPage = {

    version:
      CONFIG.VERSION,

    init:
      initialize,

    load:
      loadBusinessPage,

    getState:
      function () {

        return Object.assign(
          {},
          state
        );

      },

    getBusiness:
      function () {

        return state.business;

      },

    getRoute:
      function () {

        return state.route;

      },

    getTemplate:
      function () {

        return state.template;

      }

  };


  /*
    Compatibility
  */

  App.BusinessPage =
    window.UBnuxBusinessPage;


  /* =======================================================
     AUTO INITIALIZE
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {
        once: true
      }
    );

  } else {

    initialize();

  }


})(window, document);

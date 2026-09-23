/* =========================================================
   UBnux - Business SEO Page Controller
   File: assets/js/seo/business-page.js

   Version:
   9.0.0

   Responsibilities:
   ---------------------------------------------------------
   - Detect permanent Business SEO route
   - Support direct /in/... business URLs
   - Load business through centralized UBnux API
   - Consume BusinessSEO backend response
   - Apply backend SEO metadata
   - Render backend JSON-LD
   - Resolve BusinessTemplate
   - Safely load template HTML / CSS / JS
   - Auto-create Business Page shell when missing
   - Bind common business data
   - Render breadcrumbs
   - Protect against stale async responses
   - Clean old template state before reload
   - Expose current business page context
   - Never redirect permanent SEO URLs
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
     GLOBAL CONFIG
  ======================================================= */

  var GLOBAL_CONFIG =
    window.UBNUX_CONFIG ||
    window.ZilaBizConfig ||
    {};


  /* =======================================================
     CONFIG
  ======================================================= */

  var CONFIG = {

    VERSION:
      "9.0.0",

    SITE_NAME:
      GLOBAL_CONFIG.SITE_NAME ||
      "UBnux",

    SITE_ORIGIN:
      cleanOrigin(
        GLOBAL_CONFIG.PUBLIC_ORIGIN ||
        GLOBAL_CONFIG.SITE_URL ||
        "https://ubnux.com"
      ),

    TEMPLATE_ROOT:
      "/assets/business-sites/",

    DEFAULT_TEMPLATE:
      "default",

    ROOT_SELECTOR:
      "#businessPageRoot",

    CONTENT_SELECTOR:
      "#businessPageContent",

    LOADER_SELECTOR:
      "#businessPageLoader",

    ERROR_SELECTOR:
      "#businessPageError",

    SHELL_STYLE_ID:
      "ubnux-business-page-shell-style",

    REQUEST_TIMEOUT:
      Number(
        GLOBAL_CONFIG.REQUEST_TIMEOUT ||
        25000
      ),

    DEFAULT_IMAGE:
      (
        GLOBAL_CONFIG.SEO &&
        GLOBAL_CONFIG.SEO.DEFAULT_IMAGE
      ) ||
      "/assets/images/default-business.jpg",

    DEFAULT_ROBOTS:
      (
        GLOBAL_CONFIG.SEO &&
        GLOBAL_CONFIG.SEO.DEFAULT_ROBOTS
      ) ||
      "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"

  };


  /* =======================================================
     STATE
  ======================================================= */

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

    context:
      null,

    template:
      null,

    templateInitialized:
      false,

    requestId:
      0,

    activeRequestId:
      0,

    lastPathname:
      ""

  };


  /* =======================================================
     LOGGING
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


  function logError() {

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
     BASIC HELPERS
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


  function cleanOrigin(value) {

    var origin =
      clean(value);

    if (!origin) {

      return "https://ubnux.com";

    }

    try {

      var url =
        new URL(origin);

      if (
        url.protocol !== "http:" &&
        url.protocol !== "https:"
      ) {

        return "https://ubnux.com";

      }

      return url.origin;

    } catch (error) {

      return "https://ubnux.com";

    }

  }


  function firstValue() {

    var values =
      Array.prototype.slice.call(arguments);

    for (
      var i = 0;
      i < values.length;
      i++
    ) {

      var value =
        clean(values[i]);

      if (value) {

        return value;

      }

    }

    return "";

  }


  function toBoolean(
    value,
    defaultValue
  ) {

    if (
      value === true ||
      value === false
    ) {

      return value;

    }

    var normalized =
      clean(value).toLowerCase();

    if (
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "1"
    ) {

      return true;

    }

    if (
      normalized === "false" ||
      normalized === "no" ||
      normalized === "0"
    ) {

      return false;

    }

    return Boolean(defaultValue);

  }


  function normalizeSlug(value) {

    return clean(value)
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  }


  function normalizeTemplateName(value) {

    return normalizeSlug(value)
      .replace(/\.\./g, "")
      .replace(/[^a-z0-9_-]/g, "");

  }


  function escapeHTML(value) {

    return clean(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function safeHTTPURL(
    value,
    allowRelative
  ) {

    var raw =
      clean(value);

    if (!raw) {

      return "";

    }

    try {

      var url =
        new URL(
          raw,
          CONFIG.SITE_ORIGIN
        );

      if (
        url.protocol !== "http:" &&
        url.protocol !== "https:"
      ) {

        return "";

      }

      if (
        allowRelative === true &&
        raw.charAt(0) === "/"
      ) {

        return raw;

      }

      return url.href;

    } catch (error) {

      return "";

    }

  }


  function safeImageURL(value) {

    return (
      safeHTTPURL(value, true) ||
      safeHTTPURL(CONFIG.DEFAULT_IMAGE, true) ||
      ""
    );

  }


  function normalizePhone(value) {

    return clean(value)
      .replace(/[^0-9+]/g, "");

  }


  function normalizeWhatsApp(value) {

    return clean(value)
      .replace(/[^0-9]/g, "");

  }


  function isCurrentRequest(requestId) {

    return (
      requestId ===
      state.activeRequestId
    );

  }


  /* =======================================================
     ROUTE FALLBACK PARSER
  ======================================================= */

  function parseDirectBusinessRoute() {

    var pathname =
      clean(
        window.location &&
        window.location.pathname
      );

    pathname =
      pathname
        .split("?")[0]
        .split("#")[0];

    var parts =
      pathname
        .split("/")
        .filter(Boolean);

    /*
     * Permanent business URL:
     *
     * /in/{state}/{district}/{category}/{business}/
     */

    if (
      parts.length !== 5 ||
      parts[0].toLowerCase() !== "in"
    ) {

      return null;

    }

    var stateSlug =
      normalizeSlug(parts[1]);

    var districtSlug =
      normalizeSlug(parts[2]);

    var categorySlug =
      normalizeSlug(parts[3]);

    var businessSlug =
      normalizeSlug(parts[4]);

    if (
      !stateSlug ||
      !districtSlug ||
      !categorySlug ||
      !businessSlug
    ) {

      return null;

    }

    return normalizeRoute({

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
        businessSlug

    });

  }


  /* =======================================================
     ROUTE NORMALIZATION
  ======================================================= */

  function normalizeRoute(route) {

    if (!route) {

      return null;

    }

    var stateSlug =
      normalizeSlug(
        route.stateSlug ||
        route.state
      );

    var districtSlug =
      normalizeSlug(
        route.districtSlug ||
        route.district
      );

    var categorySlug =
      normalizeSlug(
        route.categorySlug ||
        route.category
      );

    var businessSlug =
      normalizeSlug(
        route.businessSlug ||
        route.slug ||
        route.business
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
     ROUTE RESOLVER
  ======================================================= */

  function getRoute() {

    /*
     * 1. Dedicated SEO Router
     */

    try {

      var seoRouter =
        window.UBNUX_SEO_ROUTER ||
        window.UBnuxSEORouter;

      if (seoRouter) {

        var seoRoute =
          null;

        if (
          typeof seoRouter.getCurrentRoute ===
          "function"
        ) {

          seoRoute =
            seoRouter.getCurrentRoute();

        } else if (
          typeof seoRouter.parse ===
          "function"
        ) {

          seoRoute =
            seoRouter.parse();

        }

        if (
          seoRoute &&
          seoRoute.isBusinessPage === true
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
     * 2. Main Router
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
          mainRoute.isBusinessPage === true
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


    /*
     * 3. Direct browser pathname fallback
     */

    return parseDirectBusinessRoute();

  }


  /* =======================================================
     BUSINESS PAGE DETECTION
  ======================================================= */

  function isBusinessPage() {

    var route =
      getRoute();

    return Boolean(
      route &&
      route.isBusinessPage === true
    );

  }


  /* =======================================================
     SHELL STYLE
  ======================================================= */

  function ensureShellStyles() {

    if (
      document.getElementById(
        CONFIG.SHELL_STYLE_ID
      )
    ) {

      return;

    }

    var style =
      document.createElement("style");

    style.id =
      CONFIG.SHELL_STYLE_ID;

    style.textContent = `

      body.ubnux-business-page-active {
        margin: 0;
        padding: 0;
      }

      body.ubnux-business-page-active
      > :not(#businessPageRoot):not(script):not(style):not(link) {
        display: none !important;
      }

      #businessPageRoot {
        display: block;
        min-height: 100vh;
        width: 100%;
      }

      #businessPageRoot[hidden] {
        display: none !important;
      }

      #businessPageLoader {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 20px;
        box-sizing: border-box;
        background: #ffffff;
      }

      #businessPageLoader[hidden] {
        display: none !important;
      }

      .ubnux-business-loader-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 18px;
        text-align: center;
      }

      .ubnux-business-loader-spinner {
        width: 42px;
        height: 42px;
        border: 3px solid rgba(0,0,0,.10);
        border-top-color: rgba(0,0,0,.75);
        border-radius: 50%;
        animation: ubnuxBusinessSpin .75s linear infinite;
      }

      .ubnux-business-loader-text {
        margin: 0;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #555555;
      }

      @keyframes ubnuxBusinessSpin {
        to {
          transform: rotate(360deg);
        }
      }

      #businessPageError {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: 40px 20px;
        background: #f7f7f7;
      }

      #businessPageError[hidden] {
        display: none !important;
      }

      .business-page-error-inner {
        width: min(560px, 100%);
        padding: 38px 30px;
        border-radius: 20px;
        box-sizing: border-box;
        background: #ffffff;
        box-shadow:
          0 18px 60px rgba(0,0,0,.08);
        text-align: center;
        font-family: Arial, sans-serif;
      }

      .business-page-error-inner h2 {
        margin: 0 0 12px;
        font-size: 28px;
        line-height: 1.2;
        color: #171717;
      }

      .business-page-error-inner p {
        margin: 0 0 22px;
        color: #666666;
        font-size: 15px;
        line-height: 1.7;
      }

      .business-page-error-link,
      .business-page-retry-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 20px;
        margin: 5px;
        border: 0;
        border-radius: 10px;
        background: #111111;
        color: #ffffff;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }

      #businessPageContent {
        width: 100%;
        min-height: 100vh;
      }

      #businessPageContent:empty {
        min-height: 0;
      }

    `;

    document.head.appendChild(
      style
    );

  }


  /* =======================================================
     ENSURE SHELL
  ======================================================= */

  function ensureShell() {

    ensureShellStyles();

    var root =
      document.querySelector(
        CONFIG.ROOT_SELECTOR
      );

    if (!root) {

      root =
        document.createElement(
          "div"
        );

      root.id =
        "businessPageRoot";

      root.hidden =
        true;

      root.innerHTML = `

        <div
          id="businessPageLoader"
          aria-live="polite"
        >
          <div class="ubnux-business-loader-inner">

            <div
              class="ubnux-business-loader-spinner"
              aria-hidden="true"
            ></div>

            <p class="ubnux-business-loader-text">
              Loading business...
            </p>

          </div>
        </div>

        <div
          id="businessPageError"
          hidden
        ></div>

        <main
          id="businessPageContent"
        ></main>

      `;

      document.body.appendChild(
        root
      );

    }


    /*
     * Repair incomplete shell if user later adds
     * only some containers manually.
     */

    if (
      !root.querySelector(
        CONFIG.LOADER_SELECTOR
      )
    ) {

      var loader =
        document.createElement("div");

      loader.id =
        "businessPageLoader";

      loader.innerHTML = `
        <div class="ubnux-business-loader-inner">
          <div
            class="ubnux-business-loader-spinner"
            aria-hidden="true"
          ></div>
          <p class="ubnux-business-loader-text">
            Loading business...
          </p>
        </div>
      `;

      root.appendChild(loader);

    }


    if (
      !root.querySelector(
        CONFIG.ERROR_SELECTOR
      )
    ) {

      var error =
        document.createElement("div");

      error.id =
        "businessPageError";

      error.hidden =
        true;

      root.appendChild(error);

    }


    if (
      !root.querySelector(
        CONFIG.CONTENT_SELECTOR
      )
    ) {

      var content =
        document.createElement("main");

      content.id =
        "businessPageContent";

      root.appendChild(content);

    }

    return root;

  }


  /* =======================================================
     DOM HELPERS
  ======================================================= */

  function getRoot() {

    return document.querySelector(
      CONFIG.ROOT_SELECTOR
    );

  }


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


  function getErrorContainer() {

    return document.querySelector(
      CONFIG.ERROR_SELECTOR
    );

  }


  /* =======================================================
     BUSINESS PAGE MODE
  ======================================================= */

  function activateBusinessMode() {

    ensureShell();

    if (document.body) {

      document.body.classList.add(
        "ubnux-business-page-active"
      );

    }

    var root =
      getRoot();

    if (root) {

      root.hidden =
        false;

    }

  }


  function deactivateBusinessMode() {

    if (document.body) {

      document.body.classList.remove(
        "ubnux-business-page-active"
      );

    }

    var root =
      getRoot();

    if (root) {

      root.hidden =
        true;

    }

  }


  /* =======================================================
     LOADER
  ======================================================= */

  function showLoader() {

    activateBusinessMode();

    var loader =
      getLoader();

    var error =
      getErrorContainer();

    var content =
      getContent();

    if (loader) {

      loader.hidden =
        false;

      loader.style.display =
        "";

    }

    if (error) {

      error.hidden =
        true;

      error.style.display =
        "none";

      error.innerHTML =
        "";

    }

    if (content) {

      content.style.visibility =
        "hidden";

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

    var content =
      getContent();

    if (content) {

      content.style.visibility =
        "";

    }

  }


  /* =======================================================
     ERROR VIEW
  ======================================================= */

  function showError(message) {

    activateBusinessMode();

    hideLoader();

    var error =
      getErrorContainer();

    var content =
      getContent();

    if (content) {

      content.innerHTML =
        "";

    }

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

        '<button ' +
          'type="button" ' +
          'class="business-page-retry-button" ' +
          'data-ubnux-business-retry' +
        ">" +
          "Try again" +
        "</button>" +

        '<a ' +
          'href="/" ' +
          'class="business-page-error-link"' +
        ">" +
          "Go to UBnux" +
        "</a>" +

      "</div>";


    var retry =
      error.querySelector(
        "[data-ubnux-business-retry]"
      );

    if (retry) {

      retry.addEventListener(
        "click",
        function () {

          reload();

        },
        {
          once:
            true
        }
      );

    }

  }


  /* =======================================================
     API
  ======================================================= */

  async function loadBusiness(route) {

    var API =
      window.UBnuxAPI ||
      window.ZilaBizAPI;

    if (!API) {

      throw new Error(
        "UBnux API client is not loaded."
      );

    }


    /*
     * Preferred canonical API
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
     * Compatibility
     */

    if (
      typeof API.getBusinessBySEO ===
      "function"
    ) {

      return await API.getBusinessBySEO({

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
     * Older compatibility API
     */

    if (
      typeof API.getBusinessBySlug ===
      "function"
    ) {

      try {

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

      } catch (objectStyleError) {

        return await API.getBusinessBySlug(

          route.stateSlug,
          route.districtSlug,
          route.categorySlug,
          route.businessSlug

        );

      }

    }

    throw new Error(
      "UBnux API does not provide a business lookup method."
    );

  }


  /* =======================================================
     RESPONSE NORMALIZATION
  ======================================================= */

  function normalizeResponse(response) {

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
     * Support direct business object response.
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

      version:
        response.version ||
        "",

      business:
        business,

      seo:
        response.seo ||
        {},

      schema:
        response.schema ||
        null,

      category:
        response.category ||
        {},

      location:
        response.location ||
        {},

      indexability:
        response.indexability ||
        null,

      source:
        response.source ||
        null

    };

  }


  /* =======================================================
     BUSINESS VALUE HELPERS
  ======================================================= */

  function getBusinessName(business) {

    return firstValue(
      business.BusinessName,
      business.businessName,
      business.Business,
      business.name,
      business.Name
    );

  }


  function getBusinessSlug(
    business,
    route
  ) {

    return normalizeSlug(
      firstValue(
        business.Slug,
        business.slug,
        business.BusinessSlug,
        route.businessSlug
      )
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

    return normalizeSlug(
      firstValue(

        response.business &&
          response.business.CategorySlug,

        response.category &&
          response.category.Slug,

        response.category &&
          response.category.slug,

        route.categorySlug

      )
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

    return normalizeSlug(
      firstValue(

        response.business &&
          response.business.DistrictSlug,

        response.location &&
          response.location.DistrictSlug,

        response.location &&
          response.location.districtSlug,

        response.location &&
          response.location.Slug,

        route.districtSlug

      )
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

      route.stateName,

      route.stateSlug

    );

  }


  function getStateSlug(
    response,
    route
  ) {

    return normalizeSlug(
      firstValue(

        response.business &&
          response.business.StateSlug,

        response.location &&
          response.location.StateSlug,

        response.location &&
          response.location.stateSlug,

        route.stateSlug

      )
    );

  }


  function getDescription(business) {

    return firstValue(
      business.LongDescription,
      business.Description,
      business.ShortDescription,
      business.description
    );

  }


  function getShortDescription(business) {

    return firstValue(
      business.ShortDescription,
      business.Description,
      business.description
    );

  }


  function getImage(business) {

    return safeImageURL(
      firstValue(
        business.CoverURL,
        business.coverURL,
        business.LogoURL,
        business.logoURL,
        business.cover,
        business.logo,
        CONFIG.DEFAULT_IMAGE
      )
    );

  }


  function getLogo(business) {

    return safeImageURL(
      firstValue(
        business.LogoURL,
        business.logoURL,
        business.logo,
        business.CoverURL,
        CONFIG.DEFAULT_IMAGE
      )
    );

  }


  function getPhone(business) {

    return firstValue(
      business.Mobile,
      business.Phone,
      business.Telephone,
      business.phone
    );

  }


  function getWhatsApp(business) {

    return firstValue(
      business.WhatsApp,
      business.whatsapp,
      getPhone(business)
    );

  }


  function getEmail(business) {

    return firstValue(
      business.Email,
      business.email
    );

  }


  function getWebsite(business) {

    return firstValue(
      business.WebsiteURL,
      business.Website,
      business.website
    );

  }


  /* =======================================================
     INDEXABILITY
  ======================================================= */

  function resolveIndexable(response) {

    if (
      response.indexability &&
      typeof response.indexability.indexable !==
        "undefined"
    ) {

      return toBoolean(
        response.indexability.indexable,
        true
      );

    }

    if (
      response.seo &&
      typeof response.seo.indexable !==
        "undefined"
    ) {

      return toBoolean(
        response.seo.indexable,
        true
      );

    }

    if (
      response.business &&
      typeof response.business.Indexable !==
        "undefined"
    ) {

      return toBoolean(
        response.business.Indexable,
        true
      );

    }

    return true;

  }


  /* =======================================================
     CONTEXT
  ======================================================= */

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

    var businessName =
      getBusinessName(
        business
      );

    var stateSlug =
      getStateSlug(
        response,
        route
      );

    var districtSlug =
      getDistrictSlug(
        response,
        route
      );

    var categorySlug =
      getCategorySlug(
        response,
        route
      );

    var businessSlug =
      getBusinessSlug(
        business,
        route
      );

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

    var canonical =
      firstValue(
        seo.canonicalURL,
        seo.canonical,
        CONFIG.SITE_ORIGIN +
          canonicalPath
      );

    var indexable =
      resolveIndexable(
        response
      );


    return {

      version:
        CONFIG.VERSION,

      business:
        business,

      seo:
        seo,

      schema:
        response.schema ||
        null,

      category:
        category,

      location:
        location,

      indexability:
        response.indexability ||
        null,

      source:
        response.source ||
        null,

      route:
        route,

      businessName:
        businessName,

      businessSlug:
        businessSlug,

      categoryName:
        getCategoryName(
          response,
          route
        ),

      categorySlug:
        categorySlug,

      districtName:
        getDistrictName(
          response,
          route
        ),

      districtSlug:
        districtSlug,

      stateName:
        getStateName(
          response,
          route
        ),

      stateSlug:
        stateSlug,

      description:
        getDescription(
          business
        ),

      shortDescription:
        getShortDescription(
          business
        ),

      image:
        getImage(
          business
        ),

      logo:
        getLogo(
          business
        ),

      phone:
        getPhone(
          business
        ),

      whatsapp:
        getWhatsApp(
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

      address:
        firstValue(
          business.Address,
          business.address
        ),

      area:
        firstValue(
          business.Area,
          business.area
        ),

      pincode:
        firstValue(
          business.Pincode,
          business.PinCode,
          business.pincode
        ),

      openingTime:
        firstValue(
          business.OpeningTime,
          business.openingTime
        ),

      closingTime:
        firstValue(
          business.ClosingTime,
          business.closingTime
        ),

      workingDays:
        firstValue(
          business.WorkingDays,
          business.workingDays
        ),

      rating:
        firstValue(
          business.Rating,
          business.rating
        ),

      reviewCount:
        firstValue(
          business.ReviewCount,
          business.reviewCount
        ),

      establishedYear:
        firstValue(
          business.EstablishedYear,
          business.establishedYear
        ),

      facebook:
        firstValue(
          business.FacebookURL,
          business.facebook
        ),

      instagram:
        firstValue(
          business.InstagramURL,
          business.instagram
        ),

      youtube:
        firstValue(
          business.YoutubeURL,
          business.youtube
        ),

      googlePlace:
        firstValue(
          business.GooglePlaceURL,
          business.googlePlaceURL
        ),

      canonicalPath:
        canonicalPath,

      canonical:
        canonical,

      indexable:
        indexable

    };

  }


  /* =======================================================
     TEMPLATE RESOLUTION
  ======================================================= */

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
     * 1. Business-level template
     */

    var template =
      firstValue(
        business.BusinessTemplate,
        business.businessTemplate,
        business.Template,
        business.template
      );

    if (template) {

      return (
        normalizeTemplateName(
          template
        ) ||
        CONFIG.DEFAULT_TEMPLATE
      );

    }


    /*
     * 2. Category-level template
     */

    template =
      firstValue(
        category.BusinessTemplate,
        category.businessTemplate,
        category.Template,
        category.template
      );

    if (template) {

      return (
        normalizeTemplateName(
          template
        ) ||
        CONFIG.DEFAULT_TEMPLATE
      );

    }


    /*
     * 3. Compatibility category aliases
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

      return aliases[
        categorySlug
      ];

    }

    return CONFIG.DEFAULT_TEMPLATE;

  }


  /* =======================================================
     TEMPLATE URL
  ======================================================= */

  function getTemplateURL(
    template,
    file
  ) {

    template =
      normalizeTemplateName(
        template
      );

    if (!template) {

      template =
        CONFIG.DEFAULT_TEMPLATE;

    }

    var safeFile =
      clean(file)
        .replace(/\.\./g, "")
        .replace(/^\/+/, "");

    return (
      CONFIG.TEMPLATE_ROOT +
      template +
      "/" +
      safeFile
    );

  }


  /* =======================================================
     FETCH TEXT
  ======================================================= */

  async function fetchText(url) {

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
              "default",

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
     TEMPLATE BUNDLE PREFLIGHT
  ======================================================= */

  async function resolveTemplateBundle(
    preferredTemplate
  ) {

    var template =
      normalizeTemplateName(
        preferredTemplate
      ) ||
      CONFIG.DEFAULT_TEMPLATE;

    try {

      var html =
        await fetchText(
          getTemplateURL(
            template,
            "index.html"
          )
        );

      return {

        template:
          template,

        html:
          html

      };

    } catch (error) {

      if (
        template ===
        CONFIG.DEFAULT_TEMPLATE
      ) {

        throw error;

      }

      warn(
        "Template HTML not available:",
        template,
        "→ falling back to default."
      );

      var fallbackHTML =
        await fetchText(
          getTemplateURL(
            CONFIG.DEFAULT_TEMPLATE,
            "index.html"
          )
        );

      return {

        template:
          CONFIG.DEFAULT_TEMPLATE,

        html:
          fallbackHTML

      };

    }

  }


  /* =======================================================
     TEMPLATE DESTROY
  ======================================================= */

  function destroyCurrentTemplate() {

    try {

      if (
        window.UBnuxBusinessSite &&
        typeof window.UBnuxBusinessSite.destroy ===
          "function"
      ) {

        window.UBnuxBusinessSite.destroy();

      }

    } catch (error) {

      warn(
        "Template destroy failed:",
        error
      );

    }

    try {

      if (
        typeof window.destroyBusinessSite ===
        "function"
      ) {

        window.destroyBusinessSite();

      }

    } catch (error2) {

      warn(
        "Compatibility template destroy failed:",
        error2
      );

    }

    state.templateInitialized =
      false;

  }


  /* =======================================================
     TEMPLATE CSS
  ======================================================= */

  function removeTemplateCSS() {

    document
      .querySelectorAll(
        "link[data-ubnux-business-template-style]"
      )
      .forEach(
        function (link) {

          link.remove();

        }
      );

  }


  function loadTemplateCSS(template) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

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

        link.dataset
          .ubnuxBusinessTemplateStyle =
            template;

        link.onload =
          function () {

            resolve();

          };

        link.onerror =
          function () {

            link.remove();

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
  ======================================================= */

  function removeTemplateJS() {

    document
      .querySelectorAll(
        "script[data-ubnux-business-template-script]"
      )
      .forEach(
        function (script) {

          script.remove();

        }
      );

  }


  function clearTemplateGlobals() {

    try {

      delete window.UBnuxBusinessSite;

    } catch (error) {

      window.UBnuxBusinessSite =
        undefined;

    }

    try {

      delete window.initBusinessSite;

    } catch (error2) {

      window.initBusinessSite =
        undefined;

    }

    try {

      delete window.destroyBusinessSite;

    } catch (error3) {

      window.destroyBusinessSite =
        undefined;

    }

  }


  function loadTemplateJS(template) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        removeTemplateJS();

        clearTemplateGlobals();

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

        script.dataset
          .ubnuxBusinessTemplateScript =
            template;

        script.onload =
          function () {

            resolve();

          };

        script.onerror =
          function () {

            script.remove();

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
     INSERT TEMPLATE HTML
  ======================================================= */

  function renderTemplateHTML(html) {

    var content =
      getContent();

    if (!content) {

      throw new Error(
        "Missing #businessPageContent."
      );

    }

    content.innerHTML =
      html;

  }


  /* =======================================================
     NESTED VALUES
  ======================================================= */

  function getNestedValue(
    object,
    path
  ) {

    var value =
      object;

    var parts =
      clean(path)
        .split(".")
        .filter(Boolean);

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


  /* =======================================================
     GENERIC DATA BINDING
  ======================================================= */

  function bindGenericData(context) {

    document
      .querySelectorAll(
        "[data-business-bind]"
      )
      .forEach(
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
     SIMPLE TEXT BINDERS
  ======================================================= */

  function bindText(
    selector,
    value
  ) {

    document
      .querySelectorAll(
        selector
      )
      .forEach(
        function (element) {

          element.textContent =
            value || "";

        }
      );

  }


  function bindBusinessName(context) {

    bindText(
      "[data-business-name]",
      context.businessName
    );

  }


  function bindDescription(context) {

    bindText(
      "[data-business-description]",
      context.description
    );

    bindText(
      "[data-business-short-description]",
      context.shortDescription
    );

  }


  function bindLocation(context) {

    bindText(
      "[data-business-address]",
      context.address
    );

    bindText(
      "[data-business-area]",
      context.area
    );

    bindText(
      "[data-business-pincode]",
      context.pincode
    );

    bindText(
      "[data-business-district]",
      context.districtName
    );

    bindText(
      "[data-business-state]",
      context.stateName
    );

    bindText(
      "[data-business-category]",
      context.categoryName
    );

  }


  function bindHours(context) {

    bindText(
      "[data-business-opening-time]",
      context.openingTime
    );

    bindText(
      "[data-business-closing-time]",
      context.closingTime
    );

    bindText(
      "[data-business-working-days]",
      context.workingDays
    );

  }


  function bindRating(context) {

    bindText(
      "[data-business-rating]",
      context.rating
    );

    bindText(
      "[data-business-review-count]",
      context.reviewCount
    );

  }


  /* =======================================================
     IMAGES
  ======================================================= */

  function bindImages(context) {

    document
      .querySelectorAll(
        "[data-business-image]"
      )
      .forEach(
        function (element) {

          if (!context.image) {

            return;

          }

          if (
            element.tagName ===
            "IMG"
          ) {

            element.src =
              context.image;

            if (
              !clean(element.alt)
            ) {

              element.alt =
                context.businessName;

            }

          } else {

            element.style.backgroundImage =
              'url("' +
              context.image.replace(
                /"/g,
                "%22"
              ) +
              '")';

          }

        }
      );


    document
      .querySelectorAll(
        "[data-business-logo]"
      )
      .forEach(
        function (element) {

          if (!context.logo) {

            return;

          }

          if (
            element.tagName ===
            "IMG"
          ) {

            element.src =
              context.logo;

            if (
              !clean(element.alt)
            ) {

              element.alt =
                context.businessName +
                " logo";

            }

          } else {

            element.style.backgroundImage =
              'url("' +
              context.logo.replace(
                /"/g,
                "%22"
              ) +
              '")';

          }

        }
      );

  }


  /* =======================================================
     PHONE
  ======================================================= */

  function bindPhone(context) {

    var phone =
      normalizePhone(
        context.phone
      );

    document
      .querySelectorAll(
        "[data-business-phone]"
      )
      .forEach(
        function (element) {

          if (
            !clean(
              element.textContent
            )
          ) {

            element.textContent =
              context.phone;

          }

          if (
            element.tagName ===
              "A" &&
            phone
          ) {

            element.href =
              "tel:" +
              phone;

          }

          if (!context.phone) {

            element.hidden =
              true;

          }

        }
      );

  }


  /* =======================================================
     EMAIL
  ======================================================= */

  function bindEmail(context) {

    document
      .querySelectorAll(
        "[data-business-email]"
      )
      .forEach(
        function (element) {

          if (
            !clean(
              element.textContent
            )
          ) {

            element.textContent =
              context.email;

          }

          if (
            element.tagName ===
              "A" &&
            context.email
          ) {

            element.href =
              "mailto:" +
              context.email;

          }

          if (!context.email) {

            element.hidden =
              true;

          }

        }
      );

  }


  /* =======================================================
     WEBSITE
  ======================================================= */

  function bindWebsite(context) {

    var website =
      safeHTTPURL(
        context.website
      );

    document
      .querySelectorAll(
        "[data-business-website]"
      )
      .forEach(
        function (element) {

          if (!website) {

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
              website;

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
  ======================================================= */

  function bindWhatsApp(context) {

    var number =
      normalizeWhatsApp(
        context.whatsapp
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
     SOCIAL LINKS
  ======================================================= */

  function bindExternalLink(
    selector,
    value
  ) {

    var url =
      safeHTTPURL(value);

    document
      .querySelectorAll(
        selector
      )
      .forEach(
        function (element) {

          if (!url) {

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
              url;

            element.target =
              "_blank";

            element.rel =
              "noopener noreferrer";

          }

        }
      );

  }


  function bindSocialLinks(context) {

    bindExternalLink(
      "[data-business-facebook]",
      context.facebook
    );

    bindExternalLink(
      "[data-business-instagram]",
      context.instagram
    );

    bindExternalLink(
      "[data-business-youtube]",
      context.youtube
    );

    bindExternalLink(
      "[data-business-google-place]",
      context.googlePlace
    );

  }


  /* =======================================================
     BIND ALL
  ======================================================= */

  function bindBusinessData(context) {

    bindGenericData(
      context
    );

    bindBusinessName(
      context
    );

    bindDescription(
      context
    );

    bindLocation(
      context
    );

    bindHours(
      context
    );

    bindRating(
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

    bindSocialLinks(
      context
    );

  }


  /* =======================================================
     BREADCRUMBS
  ======================================================= */

  function buildFallbackBreadcrumbs(
    context
  ) {

    return [

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

  }


  function getBreadcrumbItems(context) {

    var backendItems =
      context.seo &&
      Array.isArray(
        context.seo.breadcrumbs
      )
        ? context.seo.breadcrumbs
        : null;

    if (
      backendItems &&
      backendItems.length
    ) {

      return backendItems
        .map(
          function (item) {

            return {

              name:
                firstValue(
                  item.name,
                  item.label,
                  item.title
                ),

              url:
                firstValue(
                  item.url,
                  item.href,
                  item.item
                )

            };

          }
        )
        .filter(
          function (item) {

            return Boolean(
              item.name
            );

          }
        );

    }

    return buildFallbackBreadcrumbs(
      context
    );

  }


  function renderBreadcrumbs(context) {

    var containers =
      document.querySelectorAll(
        "[data-business-breadcrumbs]"
      );

    if (!containers.length) {

      return;

    }

    var items =
      getBreadcrumbItems(
        context
      );

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
                item.url ||
                "#";

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

              separator.setAttribute(
                "aria-hidden",
                "true"
              );

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
     SEO FALLBACK
  ======================================================= */

  function buildSEOFallback(context) {

    var title =
      context.businessName +
      " - " +
      context.categoryName +
      " in " +
      context.districtName +
      ", " +
      context.stateName +
      " | " +
      CONFIG.SITE_NAME;

    var description =
      firstValue(
        context.shortDescription,
        context.description,
        "Find information, contact details and services for " +
          context.businessName +
          " in " +
          context.districtName +
          "."
      );

    return {

      title:
        title,

      description:
        description,

      canonical:
        context.canonical,

      canonicalURL:
        context.canonical,

      image:
        context.image,

      indexable:
        context.indexable,

      robots:
        context.indexable
          ? CONFIG.DEFAULT_ROBOTS
          : "noindex,follow"

    };

  }


  /* =======================================================
     APPLY SEO + SCHEMA
  ======================================================= */

  function applySEO(context) {

    var seoPayload =
      Object.assign(
        {},
        buildSEOFallback(context),
        context.seo || {}
      );


    /*
     * Always preserve canonical business URL if backend
     * returned no canonical.
     */

    if (
      !seoPayload.canonical &&
      !seoPayload.canonicalURL
    ) {

      seoPayload.canonical =
        context.canonical;

      seoPayload.canonicalURL =
        context.canonical;

    }


    /*
     * Backend indexability remains authoritative.
     */

    seoPayload.indexable =
      context.indexable;

    if (
      context.indexable === false
    ) {

      seoPayload.robots =
        "noindex,follow";

    }


    if (
      window.UBnuxSEOMeta &&
      typeof window.UBnuxSEOMeta.apply ===
        "function"
    ) {

      window.UBnuxSEOMeta.apply(
        seoPayload
      );

    } else {

      warn(
        "UBnuxSEOMeta is not loaded."
      );

    }


    /*
     * Schema must come from backend.
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
     BODY CLASSES
  ======================================================= */

  function removeBusinessBodyClasses() {

    if (!document.body) {

      return;

    }

    Array.prototype
      .slice.call(
        document.body.classList
      )
      .forEach(
        function (className) {

          if (
            className ===
              "ubnux-business-page" ||
            className.indexOf(
              "ubnux-state-"
            ) === 0 ||
            className.indexOf(
              "ubnux-district-"
            ) === 0 ||
            className.indexOf(
              "ubnux-category-"
            ) === 0 ||
            className.indexOf(
              "ubnux-template-"
            ) === 0
          ) {

            document.body.classList.remove(
              className
            );

          }

        }
      );

  }


  function applyBodyClasses(context) {

    if (!document.body) {

      return;

    }

    removeBusinessBodyClasses();

    document.body.classList.add(
      "ubnux-business-page"
    );

    if (context.stateSlug) {

      document.body.classList.add(
        "ubnux-state-" +
        normalizeSlug(
          context.stateSlug
        )
      );

    }

    if (context.districtSlug) {

      document.body.classList.add(
        "ubnux-district-" +
        normalizeSlug(
          context.districtSlug
        )
      );

    }

    if (context.categorySlug) {

      document.body.classList.add(
        "ubnux-category-" +
        normalizeSlug(
          context.categorySlug
        )
      );

    }

    if (state.template) {

      document.body.classList.add(
        "ubnux-template-" +
        normalizeTemplateName(
          state.template
        )
      );

    }

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
     * Preferred modern template API
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
     * Compatibility initializer
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
     * Pure data-attribute template:
     * no JS initializer required.
     */

    state.templateInitialized =
      true;

  }


  /* =======================================================
     EXPOSE PAGE DATA
  ======================================================= */

  function exposePageData(context) {

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
        context.canonical,

      context:
        context

    };

  }


  /* =======================================================
     READY EVENT
  ======================================================= */

  function dispatchReady() {

    var detail =
      window.UBnuxBusinessPageData;

    try {

      document.dispatchEvent(
        new CustomEvent(
          "ubnux:business-page-ready",
          {

            detail:
              detail

          }
        )
      );

    } catch (error) {

      try {

        var event =
          document.createEvent(
            "CustomEvent"
          );

        event.initCustomEvent(
          "ubnux:business-page-ready",
          false,
          false,
          detail
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
     STATE RESET
  ======================================================= */

  function clearDataState() {

    state.response =
      null;

    state.business =
      null;

    state.seo =
      null;

    state.schema =
      null;

    state.category =
      null;

    state.location =
      null;

    state.context =
      null;

    state.template =
      null;

    state.loaded =
      false;

    state.templateInitialized =
      false;

  }


  /* =======================================================
     CLEAN CURRENT PAGE
  ======================================================= */

  function cleanup(options) {

    options =
      options ||
      {};

    destroyCurrentTemplate();

    removeTemplateCSS();

    removeTemplateJS();

    clearTemplateGlobals();

    removeBusinessBodyClasses();

    var content =
      getContent();

    var error =
      getErrorContainer();

    if (content) {

      content.innerHTML =
        "";

      content.style.visibility =
        "";

    }

    if (error) {

      error.innerHTML =
        "";

      error.hidden =
        true;

    }

    if (
      window.UBNUX_SCHEMA &&
      typeof window.UBNUX_SCHEMA.clear ===
        "function"
    ) {

      try {

        window.UBNUX_SCHEMA.clear();

      } catch (error2) {

        /* Ignore */

      }

    }

    clearDataState();

    if (
      options.keepBusinessMode !==
      true
    ) {

      deactivateBusinessMode();

    }

  }


  /* =======================================================
     MAIN INITIALIZER
  ======================================================= */

  async function initialize(options) {

    options =
      options ||
      {};

    var force =
      options.force === true;


    /*
     * Resolve route before doing anything.
     */

    var route =
      getRoute();


    /*
     * Not a business page.
     */

    if (
      !route ||
      route.isBusinessPage !==
        true
    ) {

      if (
        state.loaded ||
        state.initialized
      ) {

        cleanup();

      }

      state.initialized =
        false;

      state.loading =
        false;

      return null;

    }


    /*
     * Same route already loaded.
     */

    if (
      state.initialized &&
      state.loaded &&
      !force &&
      state.route &&
      state.route.canonicalPath ===
        route.canonicalPath
    ) {

      return state.context;

    }


    /*
     * Same route currently loading.
     */

    if (
      state.loading &&
      !force &&
      state.route &&
      state.route.canonicalPath ===
        route.canonicalPath
    ) {

      return null;

    }


    /*
     * Start new request generation.
     */

    var requestId =
      ++state.requestId;

    state.activeRequestId =
      requestId;

    state.loading =
      true;

    state.initialized =
      true;

    state.route =
      route;

    state.lastPathname =
      window.location.pathname;


    activateBusinessMode();

    showLoader();


    /*
     * Clear old template before loading new business.
     */

    destroyCurrentTemplate();

    removeTemplateCSS();

    removeTemplateJS();

    clearTemplateGlobals();

    removeBusinessBodyClasses();


    var oldContent =
      getContent();

    if (oldContent) {

      oldContent.innerHTML =
        "";

    }


    try {

      log(
        "Loading business:",
        route.canonicalPath
      );


      /* ===================================================
         1. LOAD API
      ================================================== */

      var rawResponse =
        await loadBusiness(
          route
        );


      /*
       * Ignore stale response.
       */

      if (
        !isCurrentRequest(
          requestId
        )
      ) {

        return null;

      }


      /* ===================================================
         2. NORMALIZE RESPONSE
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
         3. CONTEXT
      ================================================== */

      var context =
        buildContext(
          response,
          route
        );

      state.context =
        context;


      if (
        !context.businessName
      ) {

        throw new Error(
          "Business name is missing."
        );

      }


      /* ===================================================
         4. SEO
      ================================================== */

      applySEO(
        context
      );


      /* ===================================================
         5. RESOLVE TEMPLATE
      ================================================== */

      var preferredTemplate =
        resolveTemplate(
          response,
          route
        );

      log(
        "Requested template:",
        preferredTemplate
      );


      /*
       * Fetch HTML first without touching DOM so that
       * fallback template CSS/JS always match its HTML.
       */

      var bundle =
        await resolveTemplateBundle(
          preferredTemplate
        );


      if (
        !isCurrentRequest(
          requestId
        )
      ) {

        return null;

      }

      state.template =
        bundle.template;


      /* ===================================================
         6. TEMPLATE CSS
      ================================================== */

      try {

        await loadTemplateCSS(
          bundle.template
        );

      } catch (cssError) {

        warn(
          "Template CSS failed:",
          cssError
        );

      }


      if (
        !isCurrentRequest(
          requestId
        )
      ) {

        return null;

      }


      /* ===================================================
         7. TEMPLATE HTML
      ================================================== */

      renderTemplateHTML(
        bundle.html
      );


      /* ===================================================
         8. TEMPLATE JS
      ================================================== */

      try {

        await loadTemplateJS(
          bundle.template
        );

      } catch (jsError) {

        warn(
          "Template JS failed:",
          jsError
        );

      }


      if (
        !isCurrentRequest(
          requestId
        )
      ) {

        return null;

      }


      /* ===================================================
         9. DATA BINDING
      ================================================== */

      bindBusinessData(
        context
      );


      /* ===================================================
         10. BREADCRUMBS
      ================================================== */

      renderBreadcrumbs(
        context
      );


      /* ===================================================
         11. BODY CLASSES
      ================================================== */

      applyBodyClasses(
        context
      );


      /* ===================================================
         12. TEMPLATE INIT
      ================================================== */

      state.templateInitialized =
        false;

      initializeTemplate(
        context
      );


      /* ===================================================
         13. EXPOSE GLOBAL DATA
      ================================================== */

      exposePageData(
        context
      );


      /* ===================================================
         14. COMPLETE
      ================================================== */

      state.loaded =
        true;

      state.initialized =
        true;

      hideLoader();

      dispatchReady();


      log(
        "Business page loaded:",
        context.businessName,
        "| Template:",
        state.template
      );

      return context;

    } catch (error) {

      /*
       * Ignore errors belonging to an old request.
       */

      if (
        !isCurrentRequest(
          requestId
        )
      ) {

        return null;

      }

      state.loaded =
        false;

      logError(
        "Business page failed:",
        error
      );

      showError(
        error &&
        error.message
          ? error.message
          : "Unable to load business page."
      );

      return null;

    } finally {

      if (
        isCurrentRequest(
          requestId
        )
      ) {

        state.loading =
          false;

      }

    }

  }


  /* =======================================================
     RELOAD
  ======================================================= */

  function reload() {

    state.initialized =
      false;

    state.loaded =
      false;

    state.loading =
      false;

    state.templateInitialized =
      false;

    return initialize({

      force:
        true

    });

  }


  /* =======================================================
     ROUTE CHANGE HANDLER
  ======================================================= */

  function handleRouteChange() {

    var pathname =
      window.location.pathname;

    if (
      pathname ===
      state.lastPathname &&
      state.loaded
    ) {

      return;

    }

    state.lastPathname =
      pathname;

    var route =
      getRoute();

    if (
      route &&
      route.isBusinessPage ===
        true
    ) {

      initialize({

        force:
          true

      });

      return;

    }


    /*
     * Leaving business page.
     */

    cleanup();

    state.initialized =
      false;

    state.loading =
      false;

  }


  /* =======================================================
     PUBLIC STATE
  ======================================================= */

  function getPublicState() {

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

      context:
        state.context,

      template:
        state.template,

      requestId:
        state.activeRequestId

    };

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  var BusinessPage = {

    version:
      CONFIG.VERSION,


    init:
      initialize,


    initialize:
      initialize,


    reload:
      reload,


    cleanup:
      cleanup,


    isBusinessPage:
      isBusinessPage,


    getRoute:
      getRoute,


    getState:
      getPublicState,


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


    getContext:
      function () {

        return state.context;

      },


    getTemplate:
      function () {

        return state.template;

      }

  };


  /* =======================================================
     GLOBAL EXPORT
  ======================================================= */

  window.UBnuxBusinessPage =
    BusinessPage;

  window.UBNUX_BUSINESS_PAGE =
    BusinessPage;

  App.businessPage =
    BusinessPage;


  /* =======================================================
     HISTORY / ROUTE EVENTS
  ======================================================= */

  window.addEventListener(
    "popstate",
    handleRouteChange
  );


  document.addEventListener(
    "ubnux:routechange",
    handleRouteChange
  );


  /* =======================================================
     AUTO INIT
  ======================================================= */

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

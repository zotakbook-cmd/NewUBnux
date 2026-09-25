/* =========================================================
   UBnux - Business SEO Page Controller

   File:
   assets/js/seo/business-page.js

   Version:
   10.3.0

   RESPONSIBILITIES
   ---------------------------------------------------------
   - Detect permanent Business SEO URL
   - Direct /in/... business route support
   - Centralized UBnux API lookup
   - Normalize BusinessSEO response
   - Build safe business context
   - Apply SEO metadata
   - Render backend JSON-LD
   - Resolve BusinessTemplate
   - Preflight template HTML
   - Load matching CSS
   - Inject template HTML
   - Load matching JS
   - Bind common business data
   - Render breadcrumbs
   - Protect against stale requests
   - Destroy previous template safely
   - Handle route changes
   - Handle template fallback
   - Handle invalid business pages
   - Expose business page state
   - NEVER redirect permanent SEO URLs

   IMPORTANT
   ---------------------------------------------------------
   Permanent URL:

   /in/{state}/{district}/{category}/{business}/

   Example:

   /in/bihar/siwan/clothing-and-fashion/
   siwan-fashion-house/
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
      "10.5.0",

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

    ROOT_ID:
      "businessPageRoot",

    LOADER_ID:
      "businessPageLoader",

    ERROR_ID:
      "businessPageError",

    CONTENT_ID:
      "businessPageContent",

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
     INTERNAL STATE
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

    pathname:
      "",

    lastCanonical:
      "",

    previousTemplate:
      "",

    templateBodyClasses:
      []

  };


  /* =======================================================
     LOGGING
  ======================================================= */

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
        clean(values[i]);

      if (value) {

        return value;

      }

    }

    return "";

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


  function normalizeSlug(value) {

    return clean(value)
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "")
      .replace(/[_\s]+/g, "-")
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

      if (
        allowRelative === true &&
        raw.charAt(0) === "/"
      ) {

        return raw;

      }

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

      return url.href;

    } catch (error) {

      return "";

    }

  }


  function safeImageURL(value) {

    return (
      safeHTTPURL(
        value,
        true
      ) ||
      safeHTTPURL(
        CONFIG.DEFAULT_IMAGE,
        true
      ) ||
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
      clean(value)
        .toLowerCase();

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

    return Boolean(
      defaultValue
    );

  }


  /* =======================================================
     DOM
  ======================================================= */

  function getElement(id) {

    return document.getElementById(id);

  }


  function getRoot() {

    return getElement(
      CONFIG.ROOT_ID
    );

  }


  function getLoader() {

    return getElement(
      CONFIG.LOADER_ID
    );

  }


  function getError() {

    return getElement(
      CONFIG.ERROR_ID
    );

  }


  function getContent() {

    return getElement(
      CONFIG.CONTENT_ID
    );

  }


  /* =======================================================
     NORMALIZE CONTENT CONTAINER
     -------------------------------------------------------
     The UBnux homepage shell historically used <main> as
     #businessPageContent. Business templates are complete
     documents and may themselves contain a <main> element.
     Setting templateBody.innerHTML directly inside a <main>
     context can trigger HTML parser rules that close/rebuild
     the main element, resulting in a rendered template with
     children but zero layout height.

     Use a neutral <div> as the dynamic template mount.
     This preserves the template's own <main> element and
     prevents invalid nested-main parsing.
  ======================================================= */

  function normalizeContentContainer() {

    var content =
      getContent();

    if (!content || !document.body) {

      return content;

    }

    if (
      String(content.tagName || "").toUpperCase() !==
      "MAIN"
    ) {

      return content;

    }

    var replacement =
      document.createElement("div");

    Array.prototype.slice.call(
      content.attributes || []
    ).forEach(function(attribute) {

      replacement.setAttribute(
        attribute.name,
        attribute.value
      );

    });

    content.parentNode.replaceChild(
      replacement,
      content
    );

    log(
      "Template content container normalized from <main> to <div>."
    );

    return replacement;

  }


  /* =======================================================
     ROUTE
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
        CONFIG.SITE_ORIGIN +
        canonicalPath

    };

  }


  function parseDirectRoute() {

    var pathname =
      (
        window.location &&
        window.location.pathname
      ) || "/";

    pathname =
      pathname
        .split("?")[0]
        .split("#")[0];

    var parts =
      pathname
        .split("/")
        .filter(Boolean);

    if (
      parts.length !== 5 ||
      String(parts[0])
        .toLowerCase() !== "in"
    ) {

      return null;

    }

    return normalizeRoute({

      stateSlug:
        parts[1],

      districtSlug:
        parts[2],

      categorySlug:
        parts[3],

      businessSlug:
        parts[4]

    });

  }


  function getRoute() {

    /*
     * 1. Dedicated SEO router
     */

    try {

      var seoRouter =
        window.UBNUX_SEO_ROUTER ||
        window.UBnuxSEORouter;

      if (seoRouter) {

        var route = null;

        if (
          typeof seoRouter.getCurrentRoute ===
          "function"
        ) {

          route =
            seoRouter.getCurrentRoute();

        } else if (
          typeof seoRouter.parse ===
          "function"
        ) {

          route =
            seoRouter.parse();

        }

        if (
          route &&
          route.isBusinessPage === true
        ) {

          return normalizeRoute(
            route
          );

        }

      }

    } catch (error) {

      warn(
        "SEO router failed.",
        error
      );

    }


    /*
     * 2. Main router
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
        "Main router failed.",
        error2
      );

    }


    /*
     * 3. Browser URL
     */

    return parseDirectRoute();

  }


  function isBusinessRoute(route) {

    return Boolean(
      route &&
      route.isBusinessPage === true &&
      route.stateSlug &&
      route.districtSlug &&
      route.categorySlug &&
      route.businessSlug
    );

  }


  /* =======================================================
     SHELL
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
      document.createElement(
        "style"
      );

    style.id =
      CONFIG.SHELL_STYLE_ID;

    style.textContent = `

      body.ubnux-business-page-active {
        margin: 0;
        padding: 0;
      }

      /*
       * Do not hide arbitrary body descendants here.
       * businessPageRoot may be mounted inside the existing
       * page shell rather than as a direct body child.
       */

      #businessPageRoot {
        display: block;
        width: 100%;
        min-height: 100vh;
      }

      #businessPageRoot[hidden] {
        display: none !important;
      }

      #businessPageLoader {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: 40px 20px;
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
        gap: 16px;
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
        font: 14px/1.5 Arial, sans-serif;
        color: #555;
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
        box-sizing: border-box;
        padding: 38px 30px;
        background: #fff;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 18px 60px rgba(0,0,0,.08);
        font-family: Arial, sans-serif;
      }

      .business-page-error-inner h1 {
        margin: 0 0 12px;
        font-size: 28px;
        line-height: 1.2;
      }

      .business-page-error-inner p {
        margin: 0 0 24px;
        color: #666;
        line-height: 1.7;
      }

      .business-page-error-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
      }

      .business-page-error-actions a,
      .business-page-error-actions button {
        min-height: 44px;
        padding: 0 20px;
        border: 0;
        border-radius: 10px;
        background: #111;
        color: #fff;
        text-decoration: none;
        font: 700 14px/44px Arial, sans-serif;
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


  function ensureShell() {

    ensureShellStyles();

    var root =
      getRoot();

    if (!root) {

      root =
        document.createElement(
          "div"
        );

      root.id =
        CONFIG.ROOT_ID;

      root.hidden =
        true;

      root.innerHTML = `

        <div
          id="businessPageLoader"
          hidden
          aria-live="polite"
          aria-busy="true"
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
          role="alert"
        ></div>

        <main
          id="businessPageContent"
        ></main>

      `;

      document.body.appendChild(
        root
      );

    }

    return root;

  }


  /* =======================================================
     BUSINESS MODE
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
      getError();

    var content =
      getContent();

    if (loader) {

      loader.hidden =
        false;

      loader.setAttribute(
        "aria-busy",
        "true"
      );

    }

    if (error) {

      error.hidden =
        true;

      error.innerHTML =
        "";

    }

    if (content) {

      content.style.visibility =
        "hidden";

    }

  }


  function hideLoader() {

    var root = getRoot();
    var loader = getLoader();
    var content = getContent();

    if (root) {
      root.hidden = false;
      root.style.display = "block";
      root.style.visibility = "visible";
      root.style.opacity = "1";
    }

    if (loader) {
      loader.hidden = true;
      loader.setAttribute("aria-busy", "false");
      loader.style.display = "none";
    }

    if (content) {
      content.hidden = false;
      content.style.display = "block";
      content.style.visibility = "visible";
      content.style.opacity = "1";
      content.style.width = "100%";
      content.style.minHeight = "100vh";
    }

  }


  /* =======================================================
     ERROR
  ======================================================= */

  function showError(message) {

    activateBusinessMode();

    hideLoader();

    var content =
      getContent();

    var error =
      getError();

    if (content) {

      content.innerHTML =
        "";

      content.style.visibility =
        "";

    }

    if (!error) {

      return;

    }

    var safeMessage =
      escapeHTML(
        message ||
        "The requested business page could not be loaded."
      );

    error.innerHTML = `

      <div class="business-page-error-inner">

        <h1>
          Business Not Found
        </h1>

        <p>
          ${safeMessage}
        </p>

        <div class="business-page-error-actions">

          <button
            type="button"
            data-ubnux-business-retry
          >
            Try Again
          </button>

          <a href="/">
            Go to UBnux
          </a>

        </div>

      </div>

    `;

    error.hidden =
      false;

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
          once: true
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


    var params = {

      state:
        route.stateSlug,

      district:
        route.districtSlug,

      category:
        route.categorySlug,

      slug:
        route.businessSlug

    };


    if (
      typeof API.getBusiness ===
      "function"
    ) {

      return await API.getBusiness(
        params
      );

    }


    if (
      typeof API.getBusinessBySEO ===
      "function"
    ) {

      return await API.getBusinessBySEO(
        params
      );

    }


    if (
      typeof API.getBusinessBySlug ===
      "function"
    ) {

      try {

        return await API.getBusinessBySlug(
          params
        );

      } catch (objectError) {

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
     * Support direct business object.
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
     BUSINESS HELPERS
  ======================================================= */

  function getBusinessName(
    business
  ) {

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


  function getShortDescription(
    business
  ) {

    return firstValue(
      business.ShortDescription,
      business.Description,
      business.description
    );

  }


  function getImage(
    business
  ) {

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


  function getLogo(
    business
  ) {

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


  function getWhatsApp(
    business
  ) {

    return firstValue(
      business.WhatsApp,
      business.whatsapp,
      getPhone(business)
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
     INDEXABILITY
  ======================================================= */

  function resolveIndexable(
    response
  ) {

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


    /*
     * Always build canonical from the
     * permanent public business route.
     */

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


    var fallbackCanonical =
      CONFIG.SITE_ORIGIN +
      canonicalPath;


    var canonical =
      firstValue(
        seo.canonicalURL,
        seo.canonical,
        fallbackCanonical
      );


    /*
     * Only allow HTTP/HTTPS canonical URLs.
     */

    canonical =
      safeHTTPURL(
        canonical
      ) ||
      fallbackCanonical;


    return {

      version:
        CONFIG.VERSION,

      business:
        business,

      seo:
        seo,

      schema:
        response.schema,

      category:
        response.category,

      location:
        response.location,

      indexability:
        response.indexability,

      route:
        route,

      businessName:
        getBusinessName(
          business
        ),

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
        resolveIndexable(
          response
        )

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

    var template =
      firstValue(

        business.BusinessTemplate,
        business.businessTemplate,
        business.Template,
        business.template,

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


    return (
      aliases[categorySlug] ||
      CONFIG.DEFAULT_TEMPLATE
    );

  }


  /* =======================================================
     TEMPLATE URL
  ======================================================= */

  function templateURL(
    template,
    file
  ) {

    var safeTemplate =
      normalizeTemplateName(
        template
      ) ||
      CONFIG.DEFAULT_TEMPLATE;

    var safeFile =
      clean(file)
        .replace(/\.\./g, "")
        .replace(/^\/+/g, "");

    return (
      CONFIG.TEMPLATE_ROOT +
      safeTemplate +
      "/" +
      safeFile
    );

  }


  /* =======================================================
     FETCH TEXT
  ======================================================= */

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
              "no-store",

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
     TEMPLATE HTML PREFLIGHT
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
          templateURL(
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
        "Template HTML failed. Falling back:",
        template
      );


      var fallbackHTML =
        await fetchText(
          templateURL(
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
     TEMPLATE CLEANUP
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
        "Template destroy failed.",
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
        "Compatibility destroy failed.",
        error2
      );

    }


    state.templateInitialized =
      false;

  }


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


  function cleanupTemplate() {

    destroyCurrentTemplate();

    removeTemplateCSS();

    removeTemplateJS();

    removeTemplateHeadAssets();

    clearTemplateGlobals();

    if (document.body) {

      state.templateBodyClasses.forEach(
        function (className) {

          document.body.classList.remove(
            className
          );

        }
      );

    }

    state.templateBodyClasses = [];

    var content =
      getContent();

    if (content) {

      content.innerHTML =
        "";

    }

  }


  /* =======================================================
     TEMPLATE CSS
  ======================================================= */

  function loadTemplateCSS(
    template
  ) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        var link =
          document.createElement(
            "link"
          );

        link.rel =
          "stylesheet";

        link.href =
          templateURL(
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
     TEMPLATE HTML
  ======================================================= */

  function removeTemplateHeadAssets() {

    document
      .querySelectorAll(
        "link[data-ubnux-business-template-head]"
      )
      .forEach(function (element) {

        element.remove();

      });

  }


  function applyTemplateBodyClasses(
    templateBody
  ) {

    if (!document.body || !templateBody) {
      return;
    }

    state.templateBodyClasses = [];

    var className =
      clean(
        templateBody.getAttribute("class")
      );

    if (!className) {
      return;
    }

    className
      .split(/\s+/)
      .filter(Boolean)
      .forEach(function (classNameItem) {

        if (
          !document.body.classList.contains(
            classNameItem
          )
        ) {

          document.body.classList.add(
            classNameItem
          );

          state.templateBodyClasses.push(
            classNameItem
          );

        }

      });

  }


  function loadTemplateHeadAssets(
    templateDocument
  ) {

    if (
      !templateDocument ||
      !templateDocument.head
    ) {
      return;
    }

    removeTemplateHeadAssets();

    Array.prototype.slice.call(
      templateDocument.head.querySelectorAll(
        "link"
      )
    ).forEach(function (sourceLink) {

      var rel =
        clean(
          sourceLink.getAttribute("rel")
        ).toLowerCase();

      if (
        rel !== "stylesheet" &&
        rel !== "preconnect" &&
        rel !== "preload"
      ) {
        return;
      }

      var href =
        sourceLink.getAttribute("href");

      if (!href) {
        return;
      }

      var link =
        document.createElement("link");

      link.rel = rel;
      link.href = href;

      if (
        sourceLink.hasAttribute(
          "crossorigin"
        )
      ) {

        link.setAttribute(
          "crossorigin",
          ""
        );

      }

      if (rel === "preload") {

        var asValue =
          sourceLink.getAttribute("as");

        if (asValue) {

          link.setAttribute(
            "as",
            asValue
          );

        }

      }

      link.dataset.ubnuxBusinessTemplateHead =
        state.template || "business";

      document.head.appendChild(
        link
      );

    });

  }


  function renderTemplateHTML(
    html
  ) {

    var content =
      normalizeContentContainer();

    if (!content) {

      throw new Error(
        "Missing #businessPageContent."
      );

    }

    var parser =
      new DOMParser();

    var templateDocument =
      parser.parseFromString(
        String(html || ""),
        "text/html"
      );

    var templateBody =
      templateDocument.body;

    if (!templateBody) {

      throw new Error(
        "Template HTML does not contain a body."
      );

    }

    /*
     * Business templates are complete HTML documents.
     * Never mount a nested html/head/body document
     * inside #businessPageContent.
     */

    loadTemplateHeadAssets(
      templateDocument
    );

    applyTemplateBodyClasses(
      templateBody
    );

    content.innerHTML =
      templateBody.innerHTML;

    /*
     * Do not let inherited homepage state hide the
     * newly-mounted business template.
     */
    content.hidden =
      false;

    content.style.display =
      "block";

    content.style.visibility =
      "visible";

    content.style.opacity =
      "1";

    content.style.width =
      "100%";

    content.style.minHeight =
      "100vh";

    var renderedChildren =
      content.children.length;

    log(
      "Template DOM rendered:",
      {
        template: state.template || "pending",
        contentChildren: renderedChildren,
        contentHTMLLength: content.innerHTML.length,
        bodyClass: document.body
          ? document.body.className
          : ""
      }
    );

  }


  /* =======================================================
     TEMPLATE JS
  ======================================================= */

  function loadTemplateJS(
    template
  ) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        var script =
          document.createElement(
            "script"
          );

        script.src =
          templateURL(
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
     TEMPLATE PIPELINE
  ======================================================= */

  async function loadTemplate(
    preferredTemplate,
    requestId
  ) {

    /*
     * First resolve HTML.
     *
     * This prevents a situation where CSS/JS from
     * one template is loaded while HTML comes from
     * another template.
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


    var actualTemplate =
      bundle.template;


    /*
     * Clean previous template completely.
     */

    cleanupTemplate();


    if (
      !isCurrentRequest(
        requestId
      )
    ) {

      return null;

    }


    /*
     * Load CSS.
     */

    try {

      await loadTemplateCSS(
        actualTemplate
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


    /*
     * Insert HTML.
     */

    renderTemplateHTML(
      bundle.html
    );


    /*
     * Load JS after HTML exists.
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


    state.template =
      actualTemplate;

    state.previousTemplate =
      actualTemplate;


    return actualTemplate;

  }


  /* =======================================================
     NESTED VALUE
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

  function bindGenericData(
    context
  ) {

    document
      .querySelectorAll(
        "#businessPageContent [data-business-bind]"
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


  function bindText(
    selector,
    value
  ) {

    document
      .querySelectorAll(
        "#businessPageContent " +
        selector
      )
      .forEach(
        function (element) {

          element.textContent =
            clean(value);

        }
      );

  }


  /* =======================================================
     COMMON BUSINESS BINDINGS
  ======================================================= */

  function bindBusinessData(
    context
  ) {

    bindGenericData(
      context
    );


    bindText(
      "[data-business-name]",
      context.businessName
    );


    bindText(
      "[data-business-description]",
      context.description
    );


    bindText(
      "[data-business-short-description]",
      context.shortDescription
    );


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


    bindText(
      "[data-business-rating]",
      context.rating
    );


    bindText(
      "[data-business-review-count]",
      context.reviewCount
    );


    bindText(
      "[data-business-established-year]",
      context.establishedYear
    );


    bindImages(
      context
    );


    bindLogo(
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
     IMAGE
  ======================================================= */

  function bindImages(
    context
  ) {

    document
      .querySelectorAll(
        "#businessPageContent [data-business-image]"
      )
      .forEach(
        function (element) {

          if (!context.image) {

            element.hidden =
              true;

            return;

          }

          element.hidden =
            false;


          if (
            element.tagName ===
            "IMG"
          ) {

            element.src =
              context.image;

            if (
              !clean(
                element.alt
              )
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

  }


  /* =======================================================
     LOGO
  ======================================================= */

  function bindLogo(
    context
  ) {

    document
      .querySelectorAll(
        "#businessPageContent [data-business-logo]"
      )
      .forEach(
        function (element) {

          if (!context.logo) {

            element.hidden =
              true;

            return;

          }

          element.hidden =
            false;


          if (
            element.tagName ===
            "IMG"
          ) {

            element.src =
              context.logo;

            if (
              !clean(
                element.alt
              )
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

  function bindPhone(
    context
  ) {

    var phone =
      normalizePhone(
        context.phone
      );


    document
      .querySelectorAll(
        "#businessPageContent [data-business-phone]"
      )
      .forEach(
        function (element) {

          if (!context.phone) {

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
              "tel:" +
              phone;

          }

          if (
            !clean(
              element.textContent
            )
          ) {

            element.textContent =
              context.phone;

          }

        }
      );

  }


  /* =======================================================
     EMAIL
  ======================================================= */

  function bindEmail(
    context
  ) {

    document
      .querySelectorAll(
        "#businessPageContent [data-business-email]"
      )
      .forEach(
        function (element) {

          if (!context.email) {

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
              "mailto:" +
              context.email;

          }

          if (
            !clean(
              element.textContent
            )
          ) {

            element.textContent =
              context.email;

          }

        }
      );

  }


  /* =======================================================
     WEBSITE
  ======================================================= */

  function bindWebsite(
    context
  ) {

    var website =
      safeHTTPURL(
        context.website
      );


    document
      .querySelectorAll(
        "#businessPageContent [data-business-website]"
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

  function bindWhatsApp(
    context
  ) {

    var number =
      normalizeWhatsApp(
        context.whatsapp
      );


    document
      .querySelectorAll(
        "#businessPageContent [data-business-whatsapp]"
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
      safeHTTPURL(
        value
      );


    document
      .querySelectorAll(
        "#businessPageContent " +
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


  function bindSocialLinks(
    context
  ) {

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


  function renderBreadcrumbs(
    context
  ) {

    var containers =
      document.querySelectorAll(
        "#businessPageContent [data-business-breadcrumb], " +
        "#businessPageContent .business-breadcrumb, " +
        "#businessPageContent #businessBreadcrumb"
      );


    if (!containers.length) {

      return;

    }


    var backendBreadcrumbs =
      context.seo &&
      Array.isArray(
        context.seo.breadcrumbs
      )
        ? context.seo.breadcrumbs
        : null;


    var items =
      backendBreadcrumbs &&
      backendBreadcrumbs.length
        ? backendBreadcrumbs
        : buildFallbackBreadcrumbs(
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

            var name =
              firstValue(
                item.name,
                item.title
              );

            var url =
              safeHTTPURL(
                item.url,
                true
              );


            var wrapper =
              document.createElement(
                "span"
              );

            wrapper.className =
              "ubnux-breadcrumb-item";


            if (
              index <
              items.length - 1 &&
              url
            ) {

              var link =
                document.createElement(
                  "a"
                );

              link.href =
                url;

              link.textContent =
                name;

              wrapper.appendChild(
                link
              );

            } else {

              wrapper.textContent =
                name;

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

              separator.setAttribute(
                "aria-hidden",
                "true"
              );

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

  function buildSEOFallback(
    context
  ) {

    var businessName =
      context.businessName ||
      "Business";

    var categoryName =
      context.categoryName ||
      "Business";

    var districtName =
      context.districtName ||
      "";

    var stateName =
      context.stateName ||
      "";


    var title =
      businessName +
      " - " +
      categoryName +
      (
        districtName
          ? " in " + districtName
          : ""
      ) +
      (
        stateName
          ? ", " + stateName
          : ""
      ) +
      " | " +
      CONFIG.SITE_NAME;


    var description =
      context.shortDescription ||
      context.description ||
      (
        "Find " +
        businessName +
        ", a " +
        categoryName +
        (
          districtName
            ? " in " + districtName
            : ""
        ) +
        (
          stateName
            ? ", " + stateName
            : ""
        ) +
        " on " +
        CONFIG.SITE_NAME +
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

      robots:
        context.indexable === false
          ? "noindex,follow"
          : CONFIG.DEFAULT_ROBOTS,

      image:
        context.image,

      indexable:
        context.indexable

    };

  }


  /* =======================================================
     APPLY SEO + SCHEMA
  ======================================================= */

  function applySEO(
    context
  ) {

    var seoPayload =
      Object.assign(
        {},
        buildSEOFallback(
          context
        ),
        context.seo ||
        {}
      );


    /*
     * Canonical is always the permanent
     * business URL.
     */

    seoPayload.canonical =
      context.canonical;

    seoPayload.canonicalURL =
      context.canonical;


    /*
     * Backend indexability is authoritative.
     */

    seoPayload.indexable =
      context.indexable;


    if (
      context.indexable === false
    ) {

      seoPayload.robots =
        "noindex,follow";

    }


    /*
     * Meta.
     */

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
     * Backend JSON-LD only.
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


    state.lastCanonical =
      context.canonical;

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
            "ubnux-business-page-active" ||

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


  function applyBodyClasses(
    context
  ) {

    if (!document.body) {

      return;

    }


    removeBusinessBodyClasses();


    document.body.classList.add(
      "ubnux-business-page"
    );


    if (
      context.stateSlug
    ) {

      document.body.classList.add(
        "ubnux-state-" +
        normalizeSlug(
          context.stateSlug
        )
      );

    }


    if (
      context.districtSlug
    ) {

      document.body.classList.add(
        "ubnux-district-" +
        normalizeSlug(
          context.districtSlug
        )
      );

    }


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
        normalizeTemplateName(
          state.template
        )
      );

    }

  }


  /* =======================================================
     TEMPLATE INITIALIZER
  ======================================================= */

  function initializeTemplate(
    context
  ) {

    if (
      state.templateInitialized
    ) {

      return;

    }


    /*
     * Modern API.
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
     * Compatibility API.
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
     * Data-attribute-only template.
     */

    state.templateInitialized =
      true;

  }


  /* =======================================================
     VISUAL RECOVERY
     -------------------------------------------------------
     Template CSS/JS may intentionally keep sections hidden
     until an observer fires. Because the template is mounted
     dynamically, force the first paint to a visible state.
  ======================================================= */

  function recoverTemplateVisibility() {

    var root =
      getRoot();

    var content =
      getContent();

    if (!content) {
      return;
    }

    /*
     * The shell root starts with the HTML hidden attribute.
     * Remove it BEFORE measuring or recovering children.
     * Otherwise getBoundingClientRect() correctly reports
     * zero even though the template itself has rendered.
     */
    if (root) {
      root.hidden = false;
      root.removeAttribute("hidden");
      root.style.display = "block";
      root.style.visibility = "visible";
      root.style.opacity = "1";
      root.style.width = "100%";
      root.style.minHeight = "100vh";
    }

    content.hidden = false;
    content.style.display = "block";
    content.style.visibility = "visible";
    content.style.opacity = "1";

    /*
     * Ensure the hero has an active slide.
     */
    var heroSlides =
      content.querySelectorAll(
        ".lux-hero-slide"
      );

    if (
      heroSlides.length &&
      !content.querySelector(
        ".lux-hero-slide.active"
      )
    ) {

      heroSlides[0].classList.add(
        "active"
      );

    }

    /*
     * Scroll-reveal elements are safe to reveal after
     * dynamic mounting. The observer can still add the
     * class later, but the page must never remain blank.
     */
    content.querySelectorAll(
      ".lux-section-heading, .lux-collection-card, .lux-about-visual, .lux-about-content, .lux-experience-item, .lux-gallery-item, .lux-review-quote, .lux-info-card, .lux-contact-content"
    ).forEach(
      function (element) {

        element.classList.add(
          "is-visible"
        );

        element.style.opacity = "1";
        element.style.visibility = "visible";
        element.style.transform = "none";

      }
    );

    /*
     * The template has its own loader. It must never cover
     * the business page after initialization.
     */
    content.querySelectorAll(
      ".lux-loader"
    ).forEach(
      function (loader) {

        loader.classList.add(
          "is-hidden"
        );

        loader.style.opacity = "0";
        loader.style.visibility = "hidden";
        loader.style.pointerEvents = "none";

      }
    );

    var rootRect =
      root
        ? root.getBoundingClientRect()
        : null;

    var contentRect =
      content.getBoundingClientRect();

    log(
      "Template visual recovery applied.",
      {
        visible:
          contentRect.height > 0,
        rootDisplay:
          root
            ? getComputedStyle(root).display
            : "missing",
        rootHeight:
          rootRect
            ? rootRect.height
            : 0,
        contentHeight:
          contentRect.height,
        heroSlides:
          heroSlides.length,
        activeHero:
          Boolean(
            content.querySelector(
              ".lux-hero-slide.active"
            )
          )
      }
    );

  }


  /* =======================================================
     EXPOSE DATA
  ======================================================= */

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
        context.canonical,

      context:
        context

    };

  }


  /* =======================================================
     READY EVENT
  ======================================================= */

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
     REQUEST SAFETY
  ======================================================= */

  function beginRequest() {

    state.requestId += 1;

    state.activeRequestId =
      state.requestId;

    return state.activeRequestId;

  }


  function isCurrentRequest(
    requestId
  ) {

    return (
      requestId ===
      state.activeRequestId
    );

  }


  /* =======================================================
     MAIN INITIALIZER
  ======================================================= */

  async function initialize(
    options
  ) {

    options =
      options || {};


    var route =
      getRoute();


    /*
     * Not a business page.
     */

    if (
      !isBusinessRoute(
        route
      )
    ) {

      if (
        state.initialized ||
        state.loading
      ) {

        cleanupTemplate();

        state.initialized =
          false;

        state.loaded =
          false;

        state.loading =
          false;

        state.route =
          null;

        state.business =
          null;

        state.response =
          null;

        state.context =
          null;

        deactivateBusinessMode();

      }

      return;

    }


    /*
     * Avoid unnecessary duplicate initialization
     * when the same URL is already loaded.
     */

    var pathname =
      (
        window.location &&
        window.location.pathname
      ) || "";


    if (
      state.initialized &&
      !options.force &&
      state.pathname === pathname
    ) {

      return;

    }


    var requestId =
      beginRequest();


    state.loading =
      true;

    state.loaded =
      false;

    state.initialized =
      false;

    state.pathname =
      pathname;

    state.route =
      route;


    activateBusinessMode();

    showLoader();


    try {

      /* ===================================================
         API
      ================================================== */

      log(
        "Loading business:",
        route
      );


      var rawResponse =
        await loadBusiness(
          route
        );


      if (
        !isCurrentRequest(
          requestId
        )
      ) {

        return;

      }


      /* ===================================================
         NORMALIZE
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
         CONTEXT
      ================================================== */

      var context =
        buildContext(
          response,
          route
        );


      state.context =
        context;


      /* ===================================================
         SEO
      ================================================== */

      applySEO(
        context
      );


      /* ===================================================
         TEMPLATE
      ================================================== */

      var preferredTemplate =
        resolveTemplate(
          response,
          route
        );


      log(
        "Preferred template:",
        preferredTemplate
      );


      await loadTemplate(
        preferredTemplate,
        requestId
      );


      if (
        !isCurrentRequest(
          requestId
        )
      ) {

        return;

      }


      /* ===================================================
         BODY CLASSES
      ================================================== */

      applyBodyClasses(
        context
      );

      /* Re-assert business mode after template CSS loads. */
      activateBusinessMode();


      /* ===================================================
         DATA BINDING
      ================================================== */

      bindBusinessData(
        context
      );


      /* ===================================================
         BREADCRUMBS
      ================================================== */

      renderBreadcrumbs(
        context
      );


      /* ===================================================
         TEMPLATE INIT
      ================================================== */

      initializeTemplate(
        context
      );


      /* ===================================================
         VISUAL RECOVERY
      ================================================== */

      recoverTemplateVisibility();


      /* ===================================================
         GLOBAL DATA
      ================================================== */

      exposePageData(
        context
      );


      /* ===================================================
         FINAL STATE
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

      if (
        !isCurrentRequest(
          requestId
        )
      ) {

        return;

      }


      state.loaded =
        false;

      state.initialized =
        false;


      logError(
        "Business page failed:",
        error
      );


      showError(
        error &&
        error.message
          ? error.message
          : "Unable to load this business page."
      );


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
     ROUTE CHANGE WATCHER
     -------------------------------------------------------
     Useful when navigation changes pathname without
     a full page reload.
  ======================================================= */

  function checkRouteChange() {

    var currentPath =
      (
        window.location &&
        window.location.pathname
      ) || "";


    if (
      currentPath ===
      state.pathname
    ) {

      return;

    }


    var route =
      getRoute();


    if (
      isBusinessRoute(
        route
      )
    ) {

      initialize({

        force:
          true

      });

    } else {

      cleanupTemplate();

      deactivateBusinessMode();

      state.initialized =
        false;

      state.loaded =
        false;

      state.route =
        null;

      state.business =
        null;

      state.response =
        null;

      state.context =
        null;

      state.pathname =
        currentPath;

    }

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

          context:
            state.context,

          template:
            state.template,

          canonical:
            state.lastCanonical

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

      },

    getContext:
      function () {

        return state.context;

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
     AUTO BOOT
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


  /* =======================================================
     HISTORY / POPSTATE
  ======================================================= */

  window.addEventListener(
    "popstate",
    function () {

      checkRouteChange();

    }
  );


  window.addEventListener(
    "hashchange",
    function () {

      checkRouteChange();

    }
  );


})(window, document);
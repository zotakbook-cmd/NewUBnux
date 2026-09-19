/* =========================================================
   UBnux Business SEO Page
   File: assets/js/seo/business-page.js

   Responsibilities:
   - Parse SEO URL
   - Fetch business
   - Render business
   - Render SEO metadata
   - Render schema
   - Render breadcrumbs
   - Render business images
   - Render contact actions
   - Render location
   - Render business hours
   - Handle errors
   - Prevent invalid SEO pages
========================================================= */

(function (
  window,
  document
) {

  "use strict";


  /* =======================================================
     STATE
  ====================================================== */

  let currentBusiness =
    null;

  let currentSEO =
    null;


  /* =======================================================
     DOM HELPER
  ====================================================== */

  function $(id) {

    return document.getElementById(
      id
    );

  }


  /* =======================================================
     ESCAPE HTML
  ====================================================== */

  function escapeHTML(
    value
  ) {

    return String(
      value === undefined ||
      value === null
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


  /* =======================================================
     CLEAN VALUE
  ====================================================== */

  function cleanValue(
    value
  ) {

    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    )
      .trim();

  }


  /* =======================================================
     SAFE URL
  ====================================================== */

  function safeURL(
    value
  ) {

    const url =
      cleanValue(
        value
      );


    if (!url) {

      return "";

    }


    try {

      const parsed =
        new URL(
          url,
          window.location.origin
        );


      if (
        parsed.protocol !== "http:" &&
        parsed.protocol !== "https:"
      ) {

        return "";

      }


      return parsed.href;

    } catch (
      error
    ) {

      return "";

    }

  }


  /* =======================================================
     SHOW
  ====================================================== */

  function show(
    element
  ) {

    if (!element) {

      return;

    }


    element.hidden =
      false;

  }


  /* =======================================================
     HIDE
  ====================================================== */

  function hide(
    element
  ) {

    if (!element) {

      return;

    }


    element.hidden =
      true;

  }


  /* =======================================================
     SET TEXT
  ====================================================== */

  function setText(
    id,
    value
  ) {

    const element =
      $(id);


    if (!element) {

      return;

    }


    element.textContent =
      cleanValue(
        value
      );

  }


  /* =======================================================
     SET ARIA BUSY
  ====================================================== */

  function setLoaderBusy(
    value
  ) {

    const loader =
      $("businessPageLoader");


    if (!loader) {

      return;

    }


    loader.setAttribute(
      "aria-busy",
      value
        ? "true"
        : "false"
    );

  }


  /* =======================================================
     PAGE LOADER
  ====================================================== */

  function showLoader() {

    const loader =
      $("businessPageLoader");


    const page =
      $("businessPage");


    const error =
      $("businessPageError");


    show(
      loader
    );


    hide(
      page
    );


    hide(
      error
    );


    setLoaderBusy(
      true
    );

  }


  /* =======================================================
     HIDE LOADER
  ====================================================== */

  function hideLoader() {

    const loader =
      $("businessPageLoader");


    hide(
      loader
    );


    setLoaderBusy(
      false
    );

  }


  /* =======================================================
     ERROR
  ====================================================== */

  function showError(
    message
  ) {

    const loader =
      $("businessPageLoader");


    const page =
      $("businessPage");


    const error =
      $("businessPageError");


    hide(
      loader
    );


    hide(
      page
    );


    setLoaderBusy(
      false
    );


    if (!error) {

      return;

    }


    error.innerHTML = `

      <div class="business-error-inner">

        <div
          class="business-error-icon"
          aria-hidden="true"
        >
          🔎
        </div>


        <h1>
          Business Not Found
        </h1>


        <p>
          ${escapeHTML(
            message ||
            "The business page you requested could not be found."
          )}
        </p>


        <a
          href="/"
          class="business-error-button"
        >
          Go to UBnux Home
        </a>

      </div>

    `;


    show(
      error
    );

  }


  /* =======================================================
     RENDER BREADCRUMB
  ====================================================== */

  function renderBreadcrumb(
    seo
  ) {

    const container =
      $("businessBreadcrumb");


    if (!container) {

      return;

    }


    const breadcrumbs =
      seo &&
      Array.isArray(
        seo.breadcrumbs
      )
        ? seo.breadcrumbs
        : [];


    if (
      !breadcrumbs.length
    ) {

      hide(
        container
      );

      return;

    }


    container.innerHTML =
      breadcrumbs
        .map(
          function (
            item,
            index
          ) {

            const name =
              escapeHTML(
                item &&
                item.name
                  ? item.name
                  : ""
              );


            const url =
              safeURL(
                item &&
                item.url
                  ? item.url
                  : ""
              );


            const isLast =
              index ===
              breadcrumbs.length - 1;


            if (
              isLast ||
              !url
            ) {

              return `

                <span
                  class="breadcrumb-current"
                  aria-current="page"
                >
                  ${name}
                </span>

              `;

            }


            return `

              <a
                href="${escapeHTML(url)}"
              >
                ${name}
              </a>

              <span
                class="breadcrumb-separator"
                aria-hidden="true"
              >
                /
              </span>

            `;

          }
        )
        .join("");


    show(
      container
    );

  }


  /* =======================================================
     RENDER IMAGE
  ====================================================== */

  function renderImage(
    imageURL,
    alt,
    fallbackClass
  ) {

    const url =
      safeURL(
        imageURL
      );


    if (!url) {

      return `

        <div
          class="${
            fallbackClass ||
            "business-image-fallback"
          }"
          aria-hidden="true"
        >
          🏪
        </div>

      `;

    }


    return `

      <img
        src="${escapeHTML(url)}"
        alt="${escapeHTML(alt)}"
        loading="eager"
        decoding="async"
        referrerpolicy="no-referrer"
      >

    `;

  }


  /* =======================================================
     RENDER RATING
  ====================================================== */

  function renderRating(
    rating,
    reviewCount
  ) {

    const ratingValue =
      Number(
        rating
      );


    const reviews =
      Number(
        reviewCount
      );


    if (
      !isFinite(
        ratingValue
      ) ||
      ratingValue <= 0
    ) {

      return "";

    }


    const formatted =
      Math.min(
        ratingValue,
        5
      ).toFixed(
        1
      );


    return `

      <div
        class="business-rating-inner"
        aria-label="Rating ${escapeHTML(formatted)} out of 5"
      >

        <span
          class="business-rating-stars"
          aria-hidden="true"
        >
          ★
        </span>


        <strong>
          ${escapeHTML(formatted)}
        </strong>


        ${
          reviews > 0
            ? `
              <span class="business-review-count">
                (${escapeHTML(reviews)} reviews)
              </span>
            `
            : ""
        }

      </div>

    `;

  }


  /* =======================================================
     RENDER STATUS / BADGES
  ====================================================== */

  function renderStatus(
    business
  ) {

    const parts =
      [];


    if (
      business &&
      business.verified
    ) {

      parts.push(`

        <span
          id="verifiedBadge"
          class="verified-badge business-badge-verified"
        >
          ✓ Verified
        </span>

      `);

    }


    if (
      business &&
      business.featured
    ) {

      parts.push(`

        <span
          id="featuredBadge"
          class="featured-badge business-badge-featured"
        >
          Featured
        </span>

      `);

    }


    if (
      business &&
      business.businessStatus
    ) {

      parts.push(`

        <span
          class="business-badge business-badge-status"
        >
          ${escapeHTML(
            business.businessStatus
          )}
        </span>

      `);

    }


    return parts.join("");

  }


  /* =======================================================
     BUILD LOCATION
  ====================================================== */

  function buildLocation(
    business,
    seo
  ) {

    const parts =
      [];


    function addUnique(
      value
    ) {

      const clean =
        cleanValue(
          value
        );


      if (
        !clean
      ) {

        return;

      }


      const exists =
        parts.some(
          function (
            item
          ) {

            return (
              item.toLowerCase() ===
              clean.toLowerCase()
            );

          }
        );


      if (!exists) {

        parts.push(
          clean
        );

      }

    }


    addUnique(
      business &&
      business.address
    );


    addUnique(
      business &&
      business.area
    );


    if (
      seo &&
      seo.location
    ) {

      addUnique(
        seo.location.district
      );


      addUnique(
        seo.location.state
      );

    }


    addUnique(
      business &&
      business.pincode
    );


    return parts.join(
      ", "
    );

  }


  /* =======================================================
     RENDER LOCATIONS
  ====================================================== */

  function renderLocations(
    business,
    seo
  ) {

    const locationText =
      buildLocation(
        business,
        seo
      );


    /* =====================================================
       HERO LOCATION
    ==================================================== */

    const heroLocation =
      $("businessAddress");


    if (
      heroLocation
    ) {

      heroLocation.textContent =
        locationText;

    }


    /* =====================================================
       FULL ADDRESS
    ==================================================== */

    const fullAddress =
      $("businessFullAddress");


    if (
      fullAddress
    ) {

      fullAddress.textContent =
        locationText;


      if (
        locationText
      ) {

        show(
          fullAddress
        );

      } else {

        hide(
          fullAddress
        );

      }

    }


    /* =====================================================
       SIDEBAR LOCATION
    ==================================================== */

    const sidebarLocation =
      $("sidebarLocation");


    if (
      sidebarLocation
    ) {

      sidebarLocation.textContent =
        locationText;


      if (
        locationText
      ) {

        show(
          sidebarLocation
        );

      }

    }


    /* =====================================================
       ADDRESS SECTION
    ==================================================== */

    const addressSection =
      $("businessAddressSection");


    if (
      addressSection
    ) {

      if (
        locationText
      ) {

        show(
          addressSection
        );

      } else {

        hide(
          addressSection
        );

      }

    }

  }


  /* =======================================================
     RENDER LOGO
  ====================================================== */

  function renderLogo(
    business
  ) {

    const container =
      $("businessLogo");


    if (!container) {

      return;

    }


    const name =
      cleanValue(
        business &&
        business.name
      ) ||
      "Business";


    container.innerHTML =
      renderImage(
        business &&
        business.logoURL,
        name + " logo",
        "business-logo-fallback"
      );

  }


  /* =======================================================
     RENDER COVER
  ====================================================== */

  function renderCover(
    business
  ) {

    const cover =
      $("businessCover");


    if (!cover) {

      return;

    }


    const coverURL =
      safeURL(
        business &&
        business.coverURL
      );


    cover.classList.remove(
      "has-cover"
    );


    cover.style.backgroundImage =
      "";


    if (
      coverURL
    ) {

      cover.style.backgroundImage =
        `url("${coverURL}")`;


      cover.classList.add(
        "has-cover"
      );


      cover.setAttribute(
        "aria-label",
        (
          cleanValue(
            business &&
            business.name
          ) ||
          "Business"
        ) +
        " cover image"
      );

    } else {

      cover.removeAttribute(
        "aria-label"
      );

    }

  }


  /* =======================================================
     RENDER ABOUT HEADING
  ====================================================== */

  function renderAboutHeading(
    business
  ) {

    const element =
      $("aboutBusinessName");


    if (!element) {

      return;

    }


    element.textContent =
      cleanValue(
        business &&
        business.name
      ) ||
      "this business";

  }


  /* =======================================================
     RENDER DESCRIPTION
  ====================================================== */

  function renderDescription(
    business,
    seo
  ) {

    const element =
      $("businessDescription");


    if (!element) {

      return;

    }


    const description =
      cleanValue(
        business &&
        business.longDescription
      ) ||
      cleanValue(
        business &&
        business.description
      ) ||
      cleanValue(
        business &&
        business.shortDescription
      ) ||
      cleanValue(
        seo &&
        seo.description
      );


    element.textContent =
      description;


    const section =
      $("aboutBusinessSection");


    if (
      section
    ) {

      if (
        description
      ) {

        show(
          section
        );

      } else {

        hide(
          section
        );

      }

    }

  }


  /* =======================================================
     RENDER HOURS
  ====================================================== */

  function renderHours(
    business
  ) {

    const section =
      $("businessHoursSection");


    const hours =
      $("businessHours");


    const workingDays =
      $("businessWorkingDays");


    const openingTime =
      cleanValue(
        business &&
        business.openingTime
      );


    const closingTime =
      cleanValue(
        business &&
        business.closingTime
      );


    const days =
      cleanValue(
        business &&
        business.workingDays
      );


    const hasHours =
      Boolean(
        openingTime ||
        closingTime
      );


    const hasDays =
      Boolean(
        days
      );


    if (
      !hasHours &&
      !hasDays
    ) {

      if (
        section
      ) {

        hide(
          section
        );

      }


      return;

    }


    if (
      hours
    ) {

      if (
        openingTime ||
        closingTime
      ) {

        const timeParts =
          [];


        if (
          openingTime
        ) {

          timeParts.push(
            openingTime
          );

        }


        if (
          closingTime
        ) {

          timeParts.push(
            closingTime
          );

        }


        hours.textContent =
          timeParts.join(
            " - "
          );

        show(
          hours
        );

      } else {

        hours.textContent =
          "";

        hide(
          hours
        );

      }

    }


    if (
      workingDays
    ) {

      workingDays.textContent =
        days;


      if (
        days
      ) {

        show(
          workingDays
        );

      } else {

        hide(
          workingDays
        );

      }

    }


    if (
      section
    ) {

      show(
        section
      );

    }

  }


  /* =======================================================
     RENDER CONTACT BUTTON
  ====================================================== */

  function renderContactButton(
    element,
    href,
    text,
    options
  ) {

    if (!element) {

      return;

    }


    const url =
      cleanValue(
        href
      );


    if (!url) {

      hide(
        element
      );

      element.removeAttribute(
        "href"
      );

      return;

    }


    element.href =
      url;


    element.textContent =
      text;


    if (
      options &&
      options.external
    ) {

      element.target =
        "_blank";

      element.rel =
        "noopener noreferrer";

    } else {

      element.removeAttribute(
        "target"
      );

      element.removeAttribute(
        "rel"
      );

    }


    show(
      element
    );

  }


  /* =======================================================
     NORMALIZE PHONE
  ====================================================== */

  function normalizePhone(
    value
  ) {

    return cleanValue(
      value
    )
      .replace(
        /[^\d+]/g,
        ""
      );

  }


  /* =======================================================
     NORMALIZE WHATSAPP
  ====================================================== */

  function normalizeWhatsApp(
    value
  ) {

    let number =
      cleanValue(
        value
      )
        .replace(
          /\D/g,
          ""
        );


    if (!number) {

      return "";

    }


    /*
      India default:

      If a 10-digit number is stored,
      automatically use +91.
    */

    if (
      number.length === 10
    ) {

      number =
        "91" +
        number;

    }


    return number;

  }


  /* =======================================================
     RENDER CONTACT
  ====================================================== */

  function renderContact(
    business
  ) {

    const mobile =
      normalizePhone(
        business &&
        business.mobile
      );


    const whatsappNumber =
      normalizeWhatsApp(
        business &&
        (
          business.whatsapp ||
          business.mobile
        )
      );


    const website =
      safeURL(
        business &&
        business.websiteURL
      );


    /* =====================================================
       CALL
    ==================================================== */

    const callButton =
      $("callBusiness");


    if (
      mobile
    ) {

      renderContactButton(
        callButton,
        "tel:" + mobile,
        "Call Business"
      );

    } else {

      hide(
        callButton
      );

    }


    /* =====================================================
       WHATSAPP
    ==================================================== */

    const whatsappButton =
      $("whatsappBusiness");


    if (
      whatsappNumber
    ) {

      renderContactButton(
        whatsappButton,
        "https://wa.me/" +
        whatsappNumber,
        "WhatsApp",
        {
          external:
            true
        }
      );

    } else {

      hide(
        whatsappButton
      );

    }


    /* =====================================================
       WEBSITE
    ==================================================== */

    const websiteButton =
      $("websiteBusiness");


    if (
      website
    ) {

      renderContactButton(
        websiteButton,
        website,
        "Visit Website",
        {
          external:
            true
        }
      );

    } else {

      hide(
        websiteButton
      );

    }


    /* =====================================================
       CONTACT CONTAINER
    ==================================================== */

    const container =
      $("businessContactActions");


    if (
      container
    ) {

      const visibleButtons =
        container.querySelectorAll(
          "a:not([hidden])"
        );


      if (
        visibleButtons.length
      ) {

        show(
          container
        );

      }

    }

  }


  /* =======================================================
     RENDER BADGES
  ====================================================== */

  function renderBadges(
    business
  ) {

    const container =
      $("businessBadges");


    if (!container) {

      return;

    }


    container.innerHTML =
      renderStatus(
        business
      );


    if (
      container.innerHTML.trim()
    ) {

      show(
        container
      );

    } else {

      hide(
        container
      );

    }

  }


  /* =======================================================
     RENDER RATING
  ====================================================== */

  function renderBusinessRating(
    business
  ) {

    const container =
      $("businessRating");


    if (!container) {

      return;

    }


    container.innerHTML =
      renderRating(
        business &&
        business.rating,
        business &&
        business.reviewCount
      );


    if (
      container.innerHTML.trim()
    ) {

      show(
        container
      );

    } else {

      hide(
        container
      );

    }

  }


  /* =======================================================
     RENDER BUSINESS
  ====================================================== */

  function renderBusiness(
    business,
    seo
  ) {

    currentBusiness =
      business;

    currentSEO =
      seo;


    /* =====================================================
       BUSINESS NAME
    ==================================================== */

    const name =
      cleanValue(
        business &&
        business.name
      ) ||
      "Business";


    setText(
      "businessName",
      name
    );


    /* =====================================================
       ABOUT HEADING
    ==================================================== */

    renderAboutHeading(
      business
    );


    /* =====================================================
       DESCRIPTION
    ==================================================== */

    renderDescription(
      business,
      seo
    );


    /* =====================================================
       LOCATION
    ==================================================== */

    renderLocations(
      business,
      seo
    );


    /* =====================================================
       LOGO
    ==================================================== */

    renderLogo(
      business
    );


    /* =====================================================
       COVER
    ==================================================== */

    renderCover(
      business
    );


    /* =====================================================
       BADGES
    ==================================================== */

    renderBadges(
      business
    );


    /* =====================================================
       RATING
    ==================================================== */

    renderBusinessRating(
      business
    );


    /* =====================================================
       HOURS
    ==================================================== */

    renderHours(
      business
    );


    /* =====================================================
       CONTACT
    ==================================================== */

    renderContact(
      business
    );


    /* =====================================================
       SHOW PAGE
    ==================================================== */

    hideLoader();


    const page =
      $("businessPage");


    if (
      page
    ) {

      show(
        page
      );

    }

  }


  /* =======================================================
     VALIDATE SEO ROUTE
  ====================================================== */

  function validateRoute(
    route
  ) {

    if (
      !route
    ) {

      throw new Error(
        "Invalid business URL."
      );

    }


    if (
      !route.isBusinessPage
    ) {

      throw new Error(
        "Invalid business URL."
      );

    }


    if (
      !route.stateSlug
    ) {

      throw new Error(
        "State information is missing from the URL."
      );

    }


    if (
      !route.districtSlug
    ) {

      throw new Error(
        "District information is missing from the URL."
      );

    }


    if (
      !route.categorySlug
    ) {

      throw new Error(
        "Category information is missing from the URL."
      );

    }


    if (
      !route.businessSlug
    ) {

      throw new Error(
        "Business information is missing from the URL."
      );

    }


    return true;

  }


  /* =======================================================
     LOAD PAGE
  ====================================================== */

  async function loadBusinessPage() {

    showLoader();


    try {

      /* ===================================================
         SEO ROUTER
      ================================================== */

      if (
        !window.UBnuxSEORouter ||
        typeof
        window.UBnuxSEORouter.parse !==
        "function"
      ) {

        throw new Error(
          "SEO router is not available."
        );

      }


      const route =
        window
          .UBnuxSEORouter
          .parse(
            window.location.pathname
          );


      validateRoute(
        route
      );


      /* ===================================================
         API
      ================================================== */

      if (
        !window.UBnuxAPI ||
        typeof
        window.UBnuxAPI.getBusinessBySlug !==
        "function"
      ) {

        throw new Error(
          "UBnux API is not available."
        );

      }


      /* ===================================================
         FETCH BUSINESS
      ================================================== */

      const response =
        await
        window
          .UBnuxAPI
          .getBusinessBySlug(

            route.stateSlug,

            route.districtSlug,

            route.categorySlug,

            route.businessSlug

          );


      /* ===================================================
         RESPONSE VALIDATION
      ================================================== */

      if (
        !response
      ) {

        throw new Error(
          "Empty response received from UBnux API."
        );

      }


      if (
        response.success !== true
      ) {

        throw new Error(
          response.message ||
          "Business not found."
        );

      }


      /* ===================================================
         SEO DATA
      ================================================== */

      const seo =
        response.seo ||
        {};


      /* ===================================================
         FRONTEND BUSINESS
         
         IMPORTANT:

         Use normalized SEO business data.
      ================================================== */

      const business =
        seo.business ||
        null;


      if (
        !business
      ) {

        throw new Error(
          "Business data is incomplete."
        );

      }


      /* ===================================================
         META
      ================================================== */

      if (
        window.UBnuxSEOMeta &&
        typeof
        window.UBnuxSEOMeta.apply ===
        "function"
      ) {

        window
          .UBnuxSEOMeta
          .apply(
            seo
          );

      }


      /* ===================================================
         SCHEMA
      ================================================== */

      if (
        window.UBnuxSchema &&
        typeof
        window.UBnuxSchema.renderBusinessSchema ===
        "function"
      ) {

        window
          .UBnuxSchema
          .renderBusinessSchema(
            business,
            seo
          );

      }


      /* ===================================================
         BREADCRUMB
      ================================================== */

      renderBreadcrumb(
        seo
      );


      /* ===================================================
         BUSINESS
      ================================================== */

      renderBusiness(
        business,
        seo
      );


    } catch (
      error
    ) {

      console.error(
        "UBnux Business Page Error:",
        error
      );


      showError(
        error &&
        error.message
          ? error.message
          : "Unable to load this business."
      );

    }

  }


  /* =======================================================
     INITIALIZE
  ====================================================== */

  function initialize() {

    loadBusinessPage();

  }


  /* =======================================================
     DOM READY
  ====================================================== */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {
        once:
          true
      }
    );

  } else {

    initialize();

  }


  /* =======================================================
     PUBLIC API
  ====================================================== */

  window.UBnuxBusinessPage = {

    load:
      loadBusinessPage,

    getBusiness:
      function () {

        return currentBusiness;

      },

    getSEO:
      function () {

        return currentSEO;

      }

  };


})(
  window,
  document
);

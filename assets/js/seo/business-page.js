/* =========================================================
   UBnux - Business SEO Page
   File:
   assets/js/seo/business-page.js

   Version:
   3.0.0

   Responsibilities:
   - Read permanent SEO URL
   - Validate route
   - Fetch business by slug
   - Render business data
   - Render SEO metadata
   - Render LocalBusiness schema
   - Render breadcrumbs
   - Render logo
   - Render cover
   - Render rating
   - Render address
   - Render hours
   - Render contact buttons
   - Handle invalid business
   - NEVER change browser URL
   - NEVER redirect
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
     DOM
  ====================================================== */

  function $(id) {

    return document.getElementById(
      id
    );

  }


  /* =======================================================
     VALUE HELPERS
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

    for (
      let i = 0;
      i < arguments.length;
      i++
    ) {

      const value =
        clean(
          arguments[i]
        );

      if (value) {

        return value;

      }

    }

    return "";

  }


  function numberValue(
    value,
    fallback
  ) {

    const number =
      Number(
        value
      );

    return Number.isFinite(
      number
    )
      ? number
      : (
          fallback === undefined
            ? 0
            : fallback
        );

  }


  /* =======================================================
     ESCAPE HTML
  ====================================================== */

  function escapeHTML(
    value
  ) {

    return String(
      value === null ||
      value === undefined
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
     SAFE URL
  ====================================================== */

  function safeURL(
    value
  ) {

    const url =
      clean(
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
        parsed.protocol !==
          "http:" &&
        parsed.protocol !==
          "https:"
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
      clean(
        value
      );

  }


  /* =======================================================
     PAGE LOADER
  ====================================================== */

  function showLoader() {

    const loader =
      $(
        "businessPageLoader"
      );

    const page =
      $(
        "businessPage"
      );

    const error =
      $(
        "businessPageError"
      );


    show(
      loader
    );

    hide(
      page
    );

    hide(
      error
    );


    if (loader) {

      loader.setAttribute(
        "aria-busy",
        "true"
      );

    }

  }


  function hideLoader() {

    const loader =
      $(
        "businessPageLoader"
      );

    hide(
      loader
    );


    if (loader) {

      loader.setAttribute(
        "aria-busy",
        "false"
      );

    }

  }


  /* =======================================================
     ERROR
  ====================================================== */

  function showError(
    message
  ) {

    hideLoader();


    hide(
      $(
        "businessPage"
      )
    );


    const error =
      $(
        "businessPageError"
      );


    if (!error) {

      return;

    }


    const errorMessage =
      $(
        "businessErrorMessage"
      );


    if (errorMessage) {

      errorMessage.textContent =
        clean(
          message
        ) ||
        "Business not found.";

    }


    show(
      error
    );

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


    function add(
      value
    ) {

      const text =
        clean(
          value
        );

      if (!text) {

        return;

      }


      const exists =
        parts.some(
          function (
            item
          ) {

            return (
              item.toLowerCase() ===
              text.toLowerCase()
            );

          }
        );


      if (!exists) {

        parts.push(
          text
        );

      }

    }


    add(
      business.address
    );

    add(
      business.area
    );


    if (
      seo &&
      seo.location
    ) {

      add(
        seo.location.district
      );

      add(
        seo.location.state
      );

    }


    add(
      business.pincode
    );


    return parts.join(
      ", "
    );

  }


  /* =======================================================
     RENDER BREADCRUMB
  ====================================================== */

  function renderBreadcrumb(
    seo
  ) {

    const container =
      $(
        "businessBreadcrumb"
      );


    if (!container) {

      return;

    }


    const items =
      [];


    items.push({

      name:
        "Home",

      url:
        "/"

    });


    if (
      seo &&
      seo.location
    ) {

      if (
        seo.location.state &&
        seo.location.stateSlug
      ) {

        items.push({

          name:
            seo.location.state,

          url:
            "/in/" +
            encodeURIComponent(
              seo.location.stateSlug
            ) +
            "/"

        });

      }


      if (
        seo.location.district &&
        seo.location.districtSlug
      ) {

        items.push({

          name:
            seo.location.district,

          url:
            "/in/" +
            encodeURIComponent(
              seo.location.stateSlug
            ) +
            "/" +
            encodeURIComponent(
              seo.location.districtSlug
            ) +
            "/"

        });

      }

    }


    if (
      seo &&
      seo.category
    ) {

      const categoryName =
        firstValue(
          seo.category.name,
          seo.category.categoryName
        );


      const categorySlug =
        firstValue(
          seo.category.slug,
          seo.category.categorySlug
        );


      if (
        categoryName &&
        categorySlug
      ) {

        items.push({

          name:
            categoryName,

          url:
            "/in/" +
            encodeURIComponent(
              seo.location.stateSlug ||
              ""
            ) +
            "/" +
            encodeURIComponent(
              seo.location.districtSlug ||
              ""
            ) +
            "/" +
            encodeURIComponent(
              categorySlug
            ) +
            "/"

        });

      }

    }


    const businessName =
      firstValue(
        seo &&
        seo.business &&
        seo.business.name,
        currentBusiness &&
        currentBusiness.name
      );


    if (businessName) {

      items.push({

        name:
          businessName,

        url:
          ""

      });

    }


    container.innerHTML =
      items
        .map(
          function (
            item,
            index
          ) {

            const isLast =
              index ===
              items.length - 1;


            if (isLast) {

              return `
                <span
                  class="breadcrumb-current"
                  aria-current="page"
                >
                  ${escapeHTML(item.name)}
                </span>
              `;

            }


            return `
              <a
                href="${escapeHTML(item.url)}"
              >
                ${escapeHTML(item.name)}
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

  }


  /* =======================================================
     RENDER BADGES
  ====================================================== */

  function renderBadges(
    business
  ) {

    const container =
      $(
        "businessBadges"
      );


    if (!container) {

      return;

    }


    const badges =
      [];


    const verified =
      business.verified === true ||
      String(
        business.verified
      ).toLowerCase() ===
        "true" ||
      String(
        business.verified
      ).toLowerCase() ===
        "yes";


    const featured =
      business.featured === true ||
      String(
        business.featured
      ).toLowerCase() ===
        "true" ||
      String(
        business.featured
      ).toLowerCase() ===
        "yes";


    const status =
      firstValue(
        business.businessStatus,
        business.status
      );


    if (verified) {

      badges.push(`
        <span
          class="business-badge business-badge-verified"
        >
          ✓ Verified
        </span>
      `);

    }


    if (featured) {

      badges.push(`
        <span
          class="business-badge business-badge-featured"
        >
          Featured
        </span>
      `);

    }


    if (status) {

      badges.push(`
        <span
          class="business-badge business-badge-status"
        >
          ${escapeHTML(status)}
        </span>
      `);

    }


    container.innerHTML =
      badges.join("");


    if (
      badges.length
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

  function renderRating(
    business
  ) {

    const container =
      $(
        "businessRating"
      );


    if (!container) {

      return;

    }


    const rating =
      numberValue(
        firstValue(
          business.rating,
          business.Rating
        ),
        0
      );


    const reviews =
      numberValue(
        firstValue(
          business.reviewCount,
          business.ReviewCount
        ),
        0
      );


    if (
      rating <= 0
    ) {

      container.innerHTML =
        `
          <span class="rating-star">
            ★
          </span>

          <span>
            No rating
          </span>
        `;

      return;

    }


    container.innerHTML =
      `
        <span class="rating-star">
          ★
        </span>

        <strong>
          ${rating.toFixed(1)}
        </strong>

        ${
          reviews > 0
            ? `
              <span>
                (${reviews})
              </span>
            `
            : ""
        }
      `;

  }


  /* =======================================================
     RENDER DESCRIPTION
  ====================================================== */

  function renderDescription(
    business,
    seo
  ) {

    const container =
      $(
        "businessDescription"
      );


    if (!container) {

      return;

    }


    const description =
      firstValue(

        business.longDescription,

        business.description,

        business.ShortDescription,

        business.Description,

        seo &&
        seo.description

      );


    if (!description) {

      container.innerHTML =
        `
          <p>
            ${escapeHTML(
              business.name ||
              "This business"
            )}
            is listed on UBnux.
          </p>
        `;

      return;

    }


    /*
     * Keep description as text.
     * This prevents raw HTML from business data.
     */

    const paragraphs =
      description
        .split(/\n+/)
        .map(
          function (
            paragraph
          ) {

            const text =
              clean(
                paragraph
              );

            if (!text) {

              return "";

            }

            return `
              <p>
                ${escapeHTML(text)}
              </p>
            `;

          }
        )
        .join("");


    container.innerHTML =
      paragraphs;

  }


  /* =======================================================
     RENDER LOCATION
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


    setText(
      "businessAddress",
      locationText
    );


    setText(
      "businessFullAddress",
      locationText
    );


    setText(
      "sidebarLocation",
      locationText
    );


    const section =
      $(
        "businessAddressSection"
      );


    if (
      section
    ) {

      if (
        locationText
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
     RENDER LOGO
  ====================================================== */

  function renderLogo(
    business
  ) {

    const container =
      $(
        "businessLogo"
      );


    if (!container) {

      return;

    }


    const name =
      firstValue(
        business.name,
        "Business"
      );


    const logo =
      safeURL(
        firstValue(
          business.logoURL,
          business.LogoURL,
          business.logo
        )
      );


    if (logo) {

      container.innerHTML =
        `
          <img
            src="${escapeHTML(logo)}"
            alt="${escapeHTML(name)} logo"
            loading="eager"
            decoding="async"
          >
        `;

    } else {

      container.innerHTML =
        `
          <div
            class="business-logo-fallback"
            aria-label="${escapeHTML(name)}"
          >
            ${escapeHTML(
              name.charAt(0)
            )}
          </div>
        `;

    }

  }


  /* =======================================================
     RENDER COVER
  ====================================================== */

  function renderCover(
    business
  ) {

    const container =
      $(
        "businessCover"
      );


    if (!container) {

      return;

    }


    const cover =
      safeURL(
        firstValue(
          business.coverURL,
          business.CoverURL,
          business.cover
        )
      );


    if (cover) {

      container.innerHTML =
        `
          <img
            src="${escapeHTML(cover)}"
            alt=""
            loading="eager"
            decoding="async"
          >
        `;

    } else {

      container.innerHTML =
        "";

    }

  }


  /* =======================================================
     RENDER HOURS
  ====================================================== */

  function renderHours(
    business
  ) {

    const section =
      $(
        "businessHoursSection"
      );


    const hours =
      $(
        "businessHours"
      );


    const workingDays =
      $(
        "businessWorkingDays"
      );


    const openingTime =
      firstValue(
        business.openingTime,
        business.OpeningTime
      );


    const closingTime =
      firstValue(
        business.closingTime,
        business.ClosingTime
      );


    const days =
      firstValue(
        business.workingDays,
        business.WorkingDays
      );


    if (
      hours
    ) {

      if (
        openingTime ||
        closingTime
      ) {

        hours.innerHTML =
          `
            <div
              class="business-hours-row"
            >
              <strong>
                Open
              </strong>

              <span>
                ${
                  escapeHTML(
                    openingTime ||
                    ""
                  )
                }

                ${
                  openingTime &&
                  closingTime
                    ? " - "
                    : ""
                }

                ${
                  escapeHTML(
                    closingTime ||
                    ""
                  )
                }
              </span>
            </div>
          `;

      } else {

        hours.innerHTML =
          "";

      }

    }


    if (
      workingDays
    ) {

      workingDays.textContent =
        days;

    }


    if (
      section
    ) {

      if (
        openingTime ||
        closingTime ||
        days
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
     PHONE
  ====================================================== */

  function normalizePhone(
    value
  ) {

    return clean(
      value
    )
      .replace(
        /[^\d+]/g,
        ""
      );

  }


  /* =======================================================
     WHATSAPP
  ====================================================== */

  function buildWhatsAppURL(
    value
  ) {

    let phone =
      normalizePhone(
        value
      );


    if (!phone) {

      return "";

    }


    /*
     * India default.
     */

    if (
      phone.startsWith(
        "0"
      )
    ) {

      phone =
        "91" +
        phone.substring(
          1
        );

    }


    phone =
      phone.replace(
        /^\+/,
        ""
      );


    return (
      "https://wa.me/" +
      encodeURIComponent(
        phone
      )
    );

  }


  /* =======================================================
     RENDER CONTACT
  ====================================================== */

  function renderContact(
    business
  ) {

    const call =
      $(
        "callBusiness"
      );

    const whatsapp =
      $(
        "whatsappBusiness"
      );

    const website =
      $(
        "websiteBusiness"
      );


    const mobile =
      firstValue(
        business.mobile,
        business.Mobile,
        business.phone,
        business.Phone
      );


    const whatsappNumber =
      firstValue(
        business.whatsapp,
        business.WhatsApp,
        mobile
      );


    const websiteURL =
      safeURL(
        firstValue(
          business.websiteURL,
          business.WebsiteURL,
          business.website
        )
      );


    /* =====================================================
       CALL
    ==================================================== */

    if (
      call &&
      mobile
    ) {

      call.href =
        "tel:" +
        normalizePhone(
          mobile
        );

      show(
        call
      );

    } else {

      hide(
        call
      );

    }


    /* =====================================================
       WHATSAPP
    ==================================================== */

    const whatsappURL =
      buildWhatsAppURL(
        whatsappNumber
      );


    if (
      whatsapp &&
      whatsappURL
    ) {

      whatsapp.href =
        whatsappURL;

      show(
        whatsapp
      );

    } else {

      hide(
        whatsapp
      );

    }


    /* =====================================================
       WEBSITE
    ==================================================== */

    if (
      website &&
      websiteURL
    ) {

      website.href =
        websiteURL;

      show(
        website
      );

    } else {

      hide(
        website
      );

    }

  }


  /* =======================================================
     UPDATE PAGE TITLE FALLBACK
  ====================================================== */

  function updateBasicTitle(
    business,
    seo
  ) {

    const name =
      firstValue(
        business.name,
        "Business"
      );


    const category =
      firstValue(
        seo &&
        seo.category &&
        seo.category.name
      );


    const district =
      firstValue(
        seo &&
        seo.location &&
        seo.location.district
      );


    let title =
      name;


    if (category) {

      title +=
        " - " +
        category;

    }


    if (district) {

      title +=
        " in " +
        district;

    }


    title +=
      " | UBnux";


    document.title =
      title;

  }


  /* =======================================================
     CANONICAL FALLBACK
  ====================================================== */

  function updateCanonical(
    seo
  ) {

    let canonical =
      "";


    if (
      seo &&
      seo.canonical
    ) {

      canonical =
        safeURL(
          seo.canonical
        );

    }


    if (!canonical) {

      const pathname =
        window.location.pathname;


      const normalizedPath =
        pathname === "/"
          ? "/"
          : (
              pathname.endsWith("/")
                ? pathname
                : pathname + "/"
            );


      canonical =
        window.location.origin +
        normalizedPath;

    }


    let link =
      $(
        "canonicalLink"
      );


    if (!link) {

      link =
        document.createElement(
          "link"
        );

      link.id =
        "canonicalLink";

      link.rel =
        "canonical";

      document.head.appendChild(
        link
      );

    }


    link.href =
      canonical;


    const ogURL =
      document.querySelector(
        'meta[property="og:url"]'
      );


    if (ogURL) {

      ogURL.setAttribute(
        "content",
        canonical
      );

    }

  }


  /* =======================================================
     APPLY BASIC META FALLBACK
  ====================================================== */

  function applyBasicMeta(
    business,
    seo
  ) {

    updateBasicTitle(
      business,
      seo
    );


    updateCanonical(
      seo
    );


    const description =
      firstValue(
        seo &&
        seo.description,

        business.longDescription,

        business.description,

        business.ShortDescription,

        business.Description
      );


    const meta =
      document.querySelector(
        'meta[name="description"]'
      );


    if (
      meta &&
      description
    ) {

      meta.setAttribute(
        "content",
        description
          .substring(
            0,
            160
          )
      );

    }


    const ogTitle =
      document.querySelector(
        'meta[property="og:title"]'
      );


    if (ogTitle) {

      ogTitle.setAttribute(
        "content",
        document.title
      );

    }


    const ogDescription =
      document.querySelector(
        'meta[property="og:description"]'
      );


    if (
      ogDescription &&
      description
    ) {

      ogDescription.setAttribute(
        "content",
        description
          .substring(
            0,
            160
          )
      );

    }


    const image =
      safeURL(
        firstValue(
          business.coverURL,
          business.CoverURL,
          business.logoURL,
          business.LogoURL
        )
      );


    if (image) {

      const ogImage =
        document.querySelector(
          'meta[property="og:image"]'
        );


      if (ogImage) {

        ogImage.setAttribute(
          "content",
          image
        );

      }


      const twitterImage =
        document.querySelector(
          'meta[name="twitter:image"]'
        );


      if (twitterImage) {

        twitterImage.setAttribute(
          "content",
          image
        );

      }

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


    const name =
      firstValue(
        business.name,
        business.BusinessName,
        "Business"
      );


    /* =====================================================
       NAME
    ==================================================== */

    setText(
      "businessName",
      name
    );


    setText(
      "aboutBusinessName",
      name
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

    renderRating(
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
       SEO FALLBACK
    ==================================================== */

    applyBasicMeta(
      business,
      seo
    );


    /* =====================================================
       SHOW
    ==================================================== */

    hideLoader();


    show(
      $(
        "businessPage"
      )
    );

  }


  /* =======================================================
     VALIDATE ROUTE
  ====================================================== */

  function validateRoute(
    route
  ) {

    if (!route) {

      throw new Error(
        "Invalid business URL."
      );

    }


    if (
      route.type !==
        "business" ||
      route.isBusinessPage !==
        true
    ) {

      throw new Error(
        "This is not a valid UBnux business URL."
      );

    }


    if (!route.stateSlug) {

      throw new Error(
        "State is missing from the business URL."
      );

    }


    if (!route.districtSlug) {

      throw new Error(
        "District is missing from the business URL."
      );

    }


    if (!route.categorySlug) {

      throw new Error(
        "Category is missing from the business URL."
      );

    }


    if (!route.businessSlug) {

      throw new Error(
        "Business slug is missing from the business URL."
      );

    }


    return true;

  }


  /* =======================================================
     GET ROUTE
  ====================================================== */

  function getBusinessRoute() {

    const pathname =
      window.location.pathname ||
      "/";


    /*
     * Prefer dedicated SEO router.
     */

    if (
      window.UBnuxSEORouter &&
      typeof
      window.UBnuxSEORouter.parse ===
        "function"
    ) {

      return window
        .UBnuxSEORouter
        .parse(
          pathname
        );

    }


    /*
     * Fallback to central router.
     */

    if (
      window.UBnux &&
      window.UBnux.router &&
      typeof
      window.UBnux.router.parseRoute ===
        "function"
    ) {

      return window
        .UBnux
        .router
        .parseRoute(
          pathname
        );

    }


    throw new Error(
      "UBnux SEO router is not available."
    );

  }


  /* =======================================================
     LOAD BUSINESS
  ====================================================== */

  async function loadBusinessPage() {

    showLoader();


    try {

      /* ===================================================
         ROUTE
      ================================================== */

      const route =
        getBusinessRoute();


      validateRoute(
        route
      );


      /*
       * IMPORTANT:
       *
       * No:
       * location.href
       * location.replace
       * location.assign
       * history.pushState
       * history.replaceState
       *
       * This page NEVER changes the public URL.
       */


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
          "UBnux Business API is not available."
        );

      }


      /* ===================================================
         FETCH
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


      if (!response) {

        throw new Error(
          "Empty response received from UBnux API."
        );

      }


      if (
        response.success !==
          true
      ) {

        throw new Error(
          response.message ||
          "Business not found."
        );

      }


      /* ===================================================
         SEO
      ================================================== */

      const seo =
        response.seo ||
        {};


      const business =
        seo.business ||
        response.business ||
        null;


      if (!business) {

        throw new Error(
          "Business data was not returned by the API."
        );

      }


      /* ===================================================
         SEO META MODULE
      ================================================== */

      if (
        window.UBnuxSEOMeta &&
        typeof
        window.UBnuxSEOMeta.apply ===
          "function"
      ) {

        try {

          window
            .UBnuxSEOMeta
            .apply(
              seo
            );

        } catch (
          metaError
        ) {

          console.warn(
            "UBnux SEO meta module failed:",
            metaError
          );

        }

      }


      /* ===================================================
         SCHEMA
      ================================================== */

      if (
        window.UBnuxSchema &&
        typeof
        window.UBnuxSchema
          .renderBusinessSchema ===
          "function"
      ) {

        try {

          window
            .UBnuxSchema
            .renderBusinessSchema(
              business,
              seo
            );

        } catch (
          schemaError
        ) {

          console.warn(
            "UBnux business schema failed:",
            schemaError
          );

        }

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
     PUBLIC API
  ====================================================== */

  window.UBnuxBusinessPage = {

    version:
      "3.0.0",

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


  /* =======================================================
     INITIALIZE
  ====================================================== */

  function initialize() {

    /*
     * Run only on DOM ready.
     */

    if (
      document.readyState ===
        "loading"
    ) {

      document.addEventListener(
        "DOMContentLoaded",
        loadBusinessPage,
        {
          once: true
        }
      );

    } else {

      loadBusinessPage();

    }

  }


  initialize();


  /* =======================================================
     DEBUG
  ====================================================== */

  if (
    window.console &&
    typeof
    window.console.debug ===
      "function"
  ) {

    console.debug(
      "UBnux Business Page 3.0.0 initialized."
    );

  }


})(window);

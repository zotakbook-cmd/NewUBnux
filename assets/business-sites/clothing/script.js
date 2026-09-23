/* =========================================================
   UBNUX CLOTHING BUSINESS SITE
   PREMIUM BUSINESS WEBSITE SCRIPT

   File:
   assets/business-sites/clothing/script.js

   Version:
   3.0.0

   Compatible with:
   UBnux Business Page v10
========================================================= */

(function (window, document) {

  "use strict";


  /* =======================================================
     CONFIG
  ======================================================== */

  const CONFIG = {

    NAME: "clothing",

    VERSION: "3.0.0",

    SLIDE_INTERVAL: 5000,

    SWIPE_THRESHOLD: 45,

    MAX_GALLERY_IMAGES: 12

  };


  /* =======================================================
     STATE
  ======================================================== */

  let business = null;

  let slides = [];

  let currentSlide = 0;

  let sliderTimer = null;

  let touchStartX = 0;

  let touchEndX = 0;

  let isInitialized = false;

  /* =======================================================
   V10 LIFECYCLE STATE
======================================================== */

let visibilityHandler = null;

let heroMouseEnterHandler = null;

let heroMouseLeaveHandler = null;


  /* =======================================================
     FALLBACK IMAGES
  ======================================================== */

  const FALLBACKS = {

    hero:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=85",

    men:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1000&q=85",

    women:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",

    kids:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1000&q=85",

    accessories:
      "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1000&q=85"

  };


  /* =======================================================
     HELPERS
  ======================================================== */

  function value() {

    const args = Array.from(arguments);

    for (let i = 0; i < args.length; i++) {

      const item = args[i];

      if (
        item !== undefined &&
        item !== null &&
        String(item).trim() !== ""
      ) {

        return item;

      }

    }

    return "";

  }


  function text(value, fallback) {

    const result = String(
      value ?? ""
    ).trim();

    return result || fallback || "";

  }


  function normalizeURL(url) {

    const value = String(
      url || ""
    ).trim();

    if (!value) {
      return "";
    }

    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("tel:") ||
      value.startsWith("mailto:") ||
      value.startsWith("javascript:")
    ) {

      return value;

    }

    return "https://" + value;

  }


  function escapeHTML(value) {

    return String(
      value ?? ""
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function firstLetter(name) {

    const clean = String(
      name || "B"
    ).trim();

    return clean
      ? clean.charAt(0).toUpperCase()
      : "B";

  }


  function cleanPhone(phone) {

    return String(
      phone || ""
    ).replace(/[^\d+]/g, "");

  }


  function whatsappNumber(phone) {

    let number = cleanPhone(phone);

    if (!number) {
      return "";
    }

    /*
      Indian numbers commonly come without +91.
    */

    if (
      number.length === 10 &&
      /^[6-9]\d{9}$/.test(number)
    ) {

      number = "91" + number;

    }

    number = number.replace(/^\+/, "");

    return number;

  }


  /* =======================================================
     GET BUSINESS DATA
  ======================================================== */

  function getBusinessData() {

    if (business) {
      return business;
    }


    /*
      Preferred source:
      business-page.js exposes current business data.
    */

    const pageState =
      window.UBnuxBusinessPage;


    if (
      pageState &&
      typeof pageState.getBusiness === "function"
    ) {

      try {

        const result =
          pageState.getBusiness();

        if (result) {

          business = result;

          return business;

        }

      } catch (error) {

        console.warn(
          "[UBnux Clothing] Could not read business:",
          error
        );

      }

    }


    /*
      Alternative state locations.
    */

    const candidates = [

      window.UBNUX_BUSINESS,

      window.UBnuxBusiness,

      window.businessData,

      window.currentBusiness,

      window.business

    ];


    for (
      let i = 0;
      i < candidates.length;
      i++
    ) {

      if (
        candidates[i] &&
        typeof candidates[i] === "object"
      ) {

        business = candidates[i];

        return business;

      }

    }


    return {};

  }


  /* =======================================================
     NORMALIZE BUSINESS
  ======================================================== */

  function normalizeBusiness() {

    const raw =
      getBusinessData() || {};


    business = {

      ...raw,

      BusinessID: value(
        raw.BusinessID,
        raw.businessID,
        raw.id
      ),

      BusinessName: text(
        value(
          raw.BusinessName,
          raw.businessName,
          raw.Name,
          raw.name
        ),
        "Business"
      ),

      Slug: text(
        value(
          raw.Slug,
          raw.slug
        )
      ),

      CategoryName: text(
        value(
          raw.CategoryName,
          raw.categoryName,
          raw.Category
        ),
        "Clothing & Fashion"
      ),

      LogoURL: text(
        value(
          raw.LogoURL,
          raw.logoURL,
          raw.logo
        )
      ),

      CoverURL: text(
        value(
          raw.CoverURL,
          raw.coverURL,
          raw.cover,
          raw.image,
          raw.ImageURL
        )
      ),

      Address: text(
        value(
          raw.Address,
          raw.address
        ),
        "Visit our store"
      ),

      Area: text(
        value(
          raw.Area,
          raw.area
        )
      ),

      Pincode: text(
        value(
          raw.Pincode,
          raw.pincode
        )
      ),

      Mobile: text(
        value(
          raw.Mobile,
          raw.mobile,
          raw.Phone,
          raw.phone
        )
      ),

      WhatsApp: text(
        value(
          raw.WhatsApp,
          raw.Whatsapp,
          raw.whatsapp
        )
      ),

      Email: text(
        value(
          raw.Email,
          raw.email
        )
      ),

      OwnerName: text(
        value(
          raw.OwnerName,
          raw.ownerName,
          raw.owner
        )
      ),

      OpeningTime: text(
        value(
          raw.OpeningTime,
          raw.openingTime
        )
      ),

      ClosingTime: text(
        value(
          raw.ClosingTime,
          raw.closingTime
        )
      ),

      WorkingDays: text(
        value(
          raw.WorkingDays,
          raw.workingDays
        )
      ),

      Rating: text(
        value(
          raw.Rating,
          raw.rating
        ),
        "5.0"
      ),

      ReviewCount: text(
        value(
          raw.ReviewCount,
          raw.reviewCount,
          raw.Reviews
        ),
        "0"
      ),

      EstablishedYear: text(
        value(
          raw.EstablishedYear,
          raw.establishedYear
        )
      ),

      Description: text(
        value(
          raw.Description,
          raw.description
        )
      ),

      ShortDescription: text(
        value(
          raw.ShortDescription,
          raw.shortDescription,
          raw.Description,
          raw.description
        ),
        "Discover premium fashion, timeless style and carefully selected collections."
      ),

      LongDescription: text(
        value(
          raw.LongDescription,
          raw.longDescription,
          raw.Description,
          raw.description
        ),
        "We believe great style begins with quality, confidence and attention to detail."
      ),

      WebsiteURL: text(
        value(
          raw.WebsiteURL,
          raw.websiteURL,
          raw.Website
        )
      ),

      FacebookURL: text(
        value(
          raw.FacebookURL,
          raw.facebookURL,
          raw.Facebook
        )
      ),

      InstagramURL: text(
        value(
          raw.InstagramURL,
          raw.instagramURL,
          raw.Instagram
        )
      ),

      YoutubeURL: text(
        value(
          raw.YoutubeURL,
          raw.youtubeURL,
          raw.YouTube
        )
      ),

      GooglePlaceURL: text(
        value(
          raw.GooglePlaceURL,
          raw.googlePlaceURL,
          raw.GoogleMapsURL,
          raw.GoogleURL
        )
      )

    };


    return business;

  }


  /* =======================================================
     GENERIC DATA BINDING
  ======================================================== */

  function bind(selector, value, options) {

    const elements =
      document.querySelectorAll(selector);

    if (!elements.length) {
      return;
    }


    const config =
      options || {};


    elements.forEach(function (element) {

      if (
        config.attribute
      ) {

        if (value) {

          element.setAttribute(
            config.attribute,
            value
          );

        }

        return;

      }


      if (
        config.html
      ) {

        element.innerHTML =
          value || "";

      } else {

        element.textContent =
          value || "";

      }

    });

  }


  /* =======================================================
     IMAGE BINDING
  ======================================================== */

  function bindImage(selector, url, alt) {

    const elements =
      document.querySelectorAll(selector);

    if (!elements.length) {
      return;
    }


    elements.forEach(function (img) {

      if (url) {

        img.src = url;

      }

      if (alt) {

        img.alt = alt;

      }

      img.loading =
        img.loading || "lazy";


      img.addEventListener(
        "error",
        function () {

          img.style.display = "none";

        },
        {
          once: true
        }
      );

    });

  }


  /* =======================================================
     INITIAL DATA BINDING
  ======================================================== */

  function bindBusinessData() {

    normalizeBusiness();


    const b = business;


    /* -----------------------------------------------
       TEXT
    ------------------------------------------------ */

    bind(
      "[data-business-name]",
      b.BusinessName
    );


    bind(
      "[data-business-category]",
      b.CategoryName
    );


    bind(
      "[data-business-short-description]",
      b.ShortDescription
    );


    bind(
      "[data-business-long-description]",
      b.LongDescription
    );


    bind(
      "[data-business-address]",
      b.Address
    );


    bind(
      "[data-business-area]",
      b.Area
    );


    bind(
      "[data-business-mobile]",
      b.Mobile
    );


    bind(
      "[data-business-owner]",
      b.OwnerName
    );


    bind(
      "[data-business-opening-time]",
      b.OpeningTime
    );


    bind(
      "[data-business-closing-time]",
      b.ClosingTime
    );


    bind(
      "[data-business-working-days]",
      b.WorkingDays
    );


    bind(
      "[data-business-rating]",
      b.Rating
    );


    bind(
      "[data-business-review-count]",
      b.ReviewCount
    );


    bind(
      "[data-business-established-year]",
      b.EstablishedYear || "—"
    );


    /* -----------------------------------------------
       INITIAL
    ------------------------------------------------ */

    bind(
      "[data-business-initial]",
      firstLetter(b.BusinessName)
    );


    /* -----------------------------------------------
       LOGO
    ------------------------------------------------ */

    bindImage(
      "[data-business-logo]",
      b.LogoURL,
      b.BusinessName
    );


    /* -----------------------------------------------
       ABOUT IMAGE
    ------------------------------------------------ */

    bindImage(
      "[data-about-image]",
      b.CoverURL || FALLBACKS.hero,
      b.BusinessName
    );


    /* -----------------------------------------------
       CONTACT IMAGE
    ------------------------------------------------ */

    bindImage(
      "[data-contact-image]",
      b.CoverURL || FALLBACKS.hero,
      b.BusinessName
    );


    /* -----------------------------------------------
       HERO
    ------------------------------------------------ */

    setupHeroImages();


    /* -----------------------------------------------
       COLLECTIONS
    ------------------------------------------------ */

    setupCollectionImages();


    /* -----------------------------------------------
       CONTACT LINKS
    ------------------------------------------------ */

    setupContactLinks();


    /* -----------------------------------------------
       SOCIAL LINKS
    ------------------------------------------------ */

    setupSocialLinks();


    /* -----------------------------------------------
       MISSING DATA
    ------------------------------------------------ */

    cleanMissingData();

  }


  /* =======================================================
     HERO IMAGE SOURCE COLLECTION
  ======================================================== */

  function getImageList() {

    const result = [];


    function push(url) {

      const clean =
        String(url || "").trim();

      if (!clean) {
        return;
      }

      if (
        result.indexOf(clean) === -1
      ) {

        result.push(clean);

      }

    }


    push(business.CoverURL);


    /*
      Try common gallery fields.
    */

    const possibleGalleryFields = [

      business.Gallery,

      business.gallery,

      business.GalleryURL,

      business.GalleryURLs,

      business.Images,

      business.images,

      business.ImageURLs,

      business.imageURLs,

      business.Photos,

      business.photos

    ];


    possibleGalleryFields.forEach(
      function (field) {

        parseImageSource(field)
          .forEach(push);

      }
    );


    /*
      Also inspect arbitrary image-like fields.
    */

    Object.keys(business || {})
      .forEach(function (key) {

        if (
          /gallery|images|photos/i.test(key)
        ) {

          parseImageSource(
            business[key]
          ).forEach(push);

        }

      });


    return result;

  }


  /* =======================================================
     PARSE IMAGE SOURCE
  ======================================================== */

  function parseImageSource(source) {

    if (!source) {
      return [];
    }


    if (Array.isArray(source)) {

      return source
        .map(function (item) {

          if (
            typeof item === "string"
          ) {

            return item.trim();

          }

          if (
            item &&
            typeof item === "object"
          ) {

            return value(
              item.url,
              item.URL,
              item.image,
              item.ImageURL,
              item.src
            );

          }

          return "";

        })
        .filter(Boolean);

    }


    const raw =
      String(source).trim();


    if (!raw) {
      return [];
    }


    /*
      JSON array
    */

    if (
      raw.charAt(0) === "[" &&
      raw.charAt(raw.length - 1) === "]"
    ) {

      try {

        const parsed =
          JSON.parse(raw);

        return parseImageSource(parsed);

      } catch (error) {

        /* ignore */

      }

    }


    /*
      Comma / newline / pipe separated.
    */

    return raw
      .split(/[\n,|]+/)
      .map(function (item) {

        return item.trim();

      })
      .filter(Boolean);

  }


  /* =======================================================
     HERO SETUP
  ======================================================== */

  function setupHeroImages() {

    slides =
      Array.from(
        document.querySelectorAll(
          ".lux-hero-slide"
        )
      );


    if (!slides.length) {
      return;
    }


    const images =
      getImageList();


    /*
      Always have at least one image.
    */

    if (!images.length) {

      images.push(
        FALLBACKS.hero
      );

    }


    slides.forEach(
      function (slide, index) {

        const image =
          slide.querySelector(
            "[data-hero-image]"
          );

        if (!image) {
          return;
        }


        let src =
          images[index];


        /*
          If fewer than 3 images,
          reuse available images.
        */

        if (!src) {

          src =
            images[
              index % images.length
            ];

        }


        if (!src) {

          src =
            FALLBACKS.hero;

        }


        image.src = src;

        image.alt =
          business.BusinessName +
          " fashion collection";


        image.loading =
          index === 0
            ? "eager"
            : "lazy";


        image.addEventListener(
          "error",
          function () {

            if (
              image.src !==
              FALLBACKS.hero
            ) {

              image.src =
                FALLBACKS.hero;

            }

          },
          {
            once:true
          }
        );

      }
    );


    /*
      Start from first slide.
    */

    showSlide(0);


    /*
      Auto slider only when
      there is more than one image.
    */

    if (
      slides.length > 1
    ) {

      startSlider();

    }


    setupSliderControls();

    setupSliderTouch();

  }


  /* =======================================================
     SHOW SLIDE
  ======================================================== */

  function showSlide(index) {

    if (!slides.length) {
      return;
    }


    if (index < 0) {

      index =
        slides.length - 1;

    }


    if (
      index >= slides.length
    ) {

      index = 0;

    }


    currentSlide = index;


    slides.forEach(
      function (slide, slideIndex) {

        slide.classList.toggle(
          "active",
          slideIndex === currentSlide
        );

      }
    );


    const counter =
      document.getElementById(
        "luxCurrentSlide"
      );


    if (counter) {

      counter.textContent =
        String(
          currentSlide + 1
        ).padStart(2, "0");

    }

  }


  /* =======================================================
     NEXT SLIDE
  ======================================================== */

  function nextSlide() {

    showSlide(
      currentSlide + 1
    );

  }


  /* =======================================================
     PREVIOUS SLIDE
  ======================================================== */

  function previousSlide() {

    showSlide(
      currentSlide - 1
    );

  }


  /* =======================================================
     START SLIDER
  ======================================================== */

  function startSlider() {

    stopSlider();


    sliderTimer =
      window.setInterval(
        function () {

          nextSlide();

        },
        CONFIG.SLIDE_INTERVAL
      );

  }


  /* =======================================================
     STOP SLIDER
  ======================================================== */

  function stopSlider() {

    if (sliderTimer) {

      clearInterval(
        sliderTimer
      );

      sliderTimer = null;

    }

  }


  /* =======================================================
     SLIDER CONTROLS
  ======================================================== */

  function setupSliderControls() {

    const next =
      document.getElementById(
        "luxNext"
      );

    const prev =
      document.getElementById(
        "luxPrev"
      );


    if (next) {

      next.addEventListener(
        "click",
        function () {

          nextSlide();

          startSlider();

        }
      );

    }


    if (prev) {

      prev.addEventListener(
        "click",
        function () {

          previousSlide();

          startSlider();

        }
      );

    }


    const slider =
      document.getElementById(
        "luxHeroSlider"
      );


    if (!slider) {
      return;
    }


    slider.addEventListener(
      "mouseenter",
      stopSlider
    );


    slider.addEventListener(
      "mouseleave",
      startSlider
    );

  }


  /* =======================================================
     TOUCH / SWIPE
  ======================================================== */

  function setupSliderTouch() {

    const slider =
      document.getElementById(
        "luxHeroSlider"
      );


    if (!slider) {
      return;
    }


    slider.addEventListener(
      "touchstart",
      function (event) {

        if (
          !event.touches ||
          !event.touches.length
        ) {

          return;

        }

        touchStartX =
          event.touches[0].clientX;

      },
      {
        passive:true
      }
    );


    slider.addEventListener(
      "touchend",
      function (event) {

        if (
          !event.changedTouches ||
          !event.changedTouches.length
        ) {

          return;

        }


        touchEndX =
          event.changedTouches[0].clientX;


        const distance =
          touchStartX -
          touchEndX;


        if (
          Math.abs(distance) <
          CONFIG.SWIPE_THRESHOLD
        ) {

          return;

        }


        if (distance > 0) {

          nextSlide();

        } else {

          previousSlide();

        }


        startSlider();

      },
      {
        passive:true
      }
    );

  }


  /* =======================================================
     COLLECTION IMAGES
  ======================================================== */

  function setupCollectionImages() {

    const collectionMap = {

      men:
        FALLBACKS.men,

      women:
        FALLBACKS.women,

      kids:
        FALLBACKS.kids,

      accessories:
        FALLBACKS.accessories

    };


    /*
      Use gallery images where available.
    */

    const gallery =
      getImageList();


    const available =
      gallery.length
        ? gallery
        : [];


    const elements =
      document.querySelectorAll(
        "[data-collection-image]"
      );


    elements.forEach(
      function (img, index) {

        const key =
          String(
            img.dataset.collectionImage ||
            ""
          ).toLowerCase();


        let src =
          available[
            (index + 1) %
            Math.max(
              available.length,
              1
            )
          ];


        if (!src) {

          src =
            collectionMap[key];

        }


        img.src =
          src || FALLBACKS.hero;


        img.alt =
          key +
          " clothing collection";


        img.loading =
          "lazy";

      }
    );

  }


  /* =======================================================
     CONTACT LINKS
  ======================================================== */

  function setupContactLinks() {

    const phone =
      cleanPhone(
        business.Mobile
      );


    const whatsapp =
      whatsappNumber(
        business.WhatsApp ||
        business.Mobile
      );


    /*
      CALL
    */

    document
      .querySelectorAll(
        "[data-call]"
      )
      .forEach(
        function (element) {

          if (phone) {

            element.href =
              "tel:" + phone;

          } else {

            element.removeAttribute(
              "href"
            );

            element.classList.add(
              "is-disabled"
            );

          }

        }
      );


    /*
      WHATSAPP
    */

    document
      .querySelectorAll(
        "[data-whatsapp]"
      )
      .forEach(
        function (element) {

          if (whatsapp) {

            const message =
              encodeURIComponent(
                "Hello, I would like to know more about " +
                business.BusinessName +
                " and your clothing collection."
              );


            element.href =
              "https://wa.me/" +
              whatsapp +
              "?text=" +
              message;

          } else {

            element.removeAttribute(
              "href"
            );

            element.classList.add(
              "is-disabled"
            );

          }

        }
      );


    /*
      WEBSITE
    */

    document
      .querySelectorAll(
        "[data-website]"
      )
      .forEach(
        function (element) {

          const url =
            normalizeURL(
              business.WebsiteURL
            );


          if (url) {

            element.href =
              url;

          } else {

            element.removeAttribute(
              "href"
            );

            element.classList.add(
              "is-disabled"
            );

          }

        }
      );


    /*
      GOOGLE PLACE / MAP
    */

    document
      .querySelectorAll(
        "[data-google-place]"
      )
      .forEach(
        function (element) {

          let url =
            normalizeURL(
              business.GooglePlaceURL
            );


          if (!url) {

            const query =
              [
                business.BusinessName,
                business.Address,
                business.Area
              ]
                .filter(Boolean)
                .join(", ");


            if (query) {

              url =
                "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent(query);

            }

          }


          if (url) {

            element.href =
              url;

          } else {

            element.removeAttribute(
              "href"
            );

            element.classList.add(
              "is-disabled"
            );

          }

        }
      );

  }


  /* =======================================================
     SOCIAL LINKS
  ======================================================== */

  function setupSocialLinks() {

    const socialMap = {

      "[data-instagram]":
        business.InstagramURL,

      "[data-facebook]":
        business.FacebookURL,

      "[data-youtube]":
        business.YoutubeURL

    };


    Object.keys(socialMap)
      .forEach(
        function (selector) {

          const url =
            normalizeURL(
              socialMap[selector]
            );


          document
            .querySelectorAll(selector)
            .forEach(
              function (element) {

                if (url) {

                  element.href =
                    url;

                } else {

                  element.removeAttribute(
                    "href"
                  );

                  element.classList.add(
                    "is-disabled"
                  );

                }

              }
            );

        }
      );

  }


  /* =======================================================
     GALLERY
  ======================================================== */

  function setupGallery() {

    const container =
      document.getElementById(
        "luxGallery"
      );


    if (!container) {
      return;
    }


    const images =
      getImageList();


    /*
      Remove duplicate cover
      from gallery when possible.
    */

    const unique =
      images.filter(
        function (url, index) {

          return (
            images.indexOf(url) ===
            index
          );

        }
      )
      .slice(
        0,
        CONFIG.MAX_GALLERY_IMAGES
      );


    if (!unique.length) {

      return;

    }


    container.innerHTML =
      unique
        .map(
          function (url, index) {

            return `
              <div class="lux-gallery-item">

                <img
                  src="${escapeHTML(url)}"
                  alt="${escapeHTML(
                    business.BusinessName
                  )} fashion image ${index + 1}"
                  loading="lazy"
                >

              </div>
            `;

          }
        )
        .join("");


    /*
      Image error handling.
    */

    container
      .querySelectorAll("img")
      .forEach(
        function (img) {

          img.addEventListener(
            "error",
            function () {

              const parent =
                img.parentElement;

              if (parent) {

                parent.remove();

              }

            },
            {
              once:true
            }
          );

        }
      );

  }


  /* =======================================================
     COLLECTION BUTTONS
  ======================================================== */

  function setupCollectionButtons() {

    document
      .querySelectorAll(
        "[data-collection-button]"
      )
      .forEach(
        function (button) {

          button.addEventListener(
            "click",
            function (event) {

              event.preventDefault();

              const collection =
                button.dataset.collectionButton ||
                "collection";


              const number =
                whatsappNumber(
                  business.WhatsApp ||
                  business.Mobile
                );


              if (!number) {

                document
                  .getElementById(
                    "contact"
                  )
                  ?.scrollIntoView({
                    behavior:"smooth"
                  });

                return;

              }


              const message =
                encodeURIComponent(
                  "Hello, I am interested in the " +
                  collection +
                  " collection at " +
                  business.BusinessName +
                  ". Please share more details."
                );


              window.open(
                "https://wa.me/" +
                number +
                "?text=" +
                message,
                "_blank",
                "noopener"
              );

            }
          );

        }
      );

  }


  /* =======================================================
     MOBILE MENU
  ======================================================== */

  function setupMobileMenu() {

    const button =
      document.getElementById(
        "luxMenuBtn"
      );

    const menu =
      document.getElementById(
        "luxMobileMenu"
      );


    if (!button || !menu) {
      return;
    }


    button.addEventListener(
      "click",
      function () {

        const open =
          menu.classList.toggle(
            "open"
          );


        button.classList.toggle(
          "open",
          open
        );


        button.setAttribute(
          "aria-expanded",
          String(open)
        );

      }
    );


    menu
      .querySelectorAll("a")
      .forEach(
        function (link) {

          link.addEventListener(
            "click",
            function () {

              menu.classList.remove(
                "open"
              );

              button.classList.remove(
                "open"
              );

              button.setAttribute(
                "aria-expanded",
                "false"
              );

            }
          );

        }
      );

  }


  /* =======================================================
     STICKY HEADER
  ======================================================== */

  function setupHeader() {

    const header =
      document.getElementById(
        "luxHeader"
      );


    if (!header) {
      return;
    }


    function update() {

      header.classList.toggle(
        "scrolled",
        window.scrollY > 45
      );

    }


    update();


    window.addEventListener(
      "scroll",
      update,
      {
        passive:true
      }
    );

  }


  /* =======================================================
     ACTIVE NAVIGATION
  ======================================================== */

  function setupActiveNavigation() {

    const links =
      Array.from(
        document.querySelectorAll(
          ".lux-nav-link"
        )
      );


    const sections =
      Array.from(
        document.querySelectorAll(
          "main section[id]"
        )
      );


    if (!links.length) {
      return;
    }


    function update() {

      const position =
        window.scrollY + 180;


      let current =
        "home";


      sections.forEach(
        function (section) {

          if (
            position >=
            section.offsetTop
          ) {

            current =
              section.id;

          }

        }
      );


      links.forEach(
        function (link) {

          const href =
            link.getAttribute("href") ||
            "";


          link.classList.toggle(
            "active",
            href ===
              "#" + current
          );

        }
      );

    }


    update();


    window.addEventListener(
      "scroll",
      update,
      {
        passive:true
      }
    );

  }


  /* =======================================================
     SMOOTH NAVIGATION
  ======================================================== */

  function setupSmoothNavigation() {

    document
      .querySelectorAll(
        'a[href^="#"]'
      )
      .forEach(
        function (link) {

          link.addEventListener(
            "click",
            function (event) {

              const href =
                link.getAttribute(
                  "href"
                );


              if (
                !href ||
                href === "#"
              ) {

                return;

              }


              const target =
                document.querySelector(
                  href
                );


              if (!target) {
                return;
              }


              event.preventDefault();


              target.scrollIntoView({
                behavior:"smooth",
                block:"start"
              });

            }
          );

        }
      );

  }


  /* =======================================================
     SCROLL REVEAL
  ======================================================== */

  function setupScrollReveal() {

    const elements =
      document.querySelectorAll(
        [
          ".lux-section-heading",
          ".lux-collection-card",
          ".lux-about-visual",
          ".lux-about-content",
          ".lux-experience-item",
          ".lux-gallery-item",
          ".lux-review-quote",
          ".lux-info-card",
          ".lux-contact-content"
        ].join(",")
      );


    if (!elements.length) {
      return;
    }


    /*
      IntersectionObserver support.
    */

    if (
      !("IntersectionObserver" in window)
    ) {

      elements.forEach(
        function (element) {

          element.classList.add(
            "is-visible"
          );

        }
      );

      return;

    }


    const observer =
      new IntersectionObserver(
        function (entries, obs) {

          entries.forEach(
            function (entry) {

              if (
                !entry.isIntersecting
              ) {

                return;

              }


              entry.target.classList.add(
                "is-visible"
              );


              obs.unobserve(
                entry.target
              );

            }
          );

        },
        {
          threshold:.12,
          rootMargin:"0px 0px -50px 0px"
        }
      );


    elements.forEach(
      function (element) {

        observer.observe(
          element
        );

      }
    );

  }


  /* =======================================================
     ADD REVEAL CSS CLASSES
  ======================================================== */

  function setupRevealStyles() {

    const style =
      document.createElement(
        "style"
      );


    style.setAttribute(
      "data-ubnux-clothing-reveal",
      "true"
    );


    style.textContent = `

      .lux-section-heading,
      .lux-collection-card,
      .lux-about-visual,
      .lux-about-content,
      .lux-experience-item,
      .lux-gallery-item,
      .lux-review-quote,
      .lux-info-card,
      .lux-contact-content{

        opacity:0;

        transform:translateY(30px);

        transition:
          opacity .85s cubic-bezier(.22,1,.36,1),
          transform .85s cubic-bezier(.22,1,.36,1);

      }


      .lux-collection-card:nth-child(2),
      .lux-experience-item:nth-child(2),
      .lux-gallery-item:nth-child(2),
      .lux-info-card:nth-child(2){

        transition-delay:.08s;

      }


      .lux-collection-card:nth-child(3),
      .lux-experience-item:nth-child(3),
      .lux-gallery-item:nth-child(3),
      .lux-info-card:nth-child(3){

        transition-delay:.16s;

      }


      .lux-collection-card:nth-child(4),
      .lux-experience-item:nth-child(4),
      .lux-gallery-item:nth-child(4),
      .lux-info-card:nth-child(4){

        transition-delay:.24s;

      }


      .lux-section-heading.is-visible,
      .lux-collection-card.is-visible,
      .lux-about-visual.is-visible,
      .lux-about-content.is-visible,
      .lux-experience-item.is-visible,
      .lux-gallery-item.is-visible,
      .lux-review-quote.is-visible,
      .lux-info-card.is-visible,
      .lux-contact-content.is-visible{

        opacity:1;

        transform:translateY(0);

      }


      .is-disabled{

        opacity:.4 !important;

        cursor:not-allowed !important;

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =======================================================
     BACK TO TOP
  ======================================================== */

  function setupBackToTop() {

    const button =
      document.getElementById(
        "luxBackTop"
      );


    if (!button) {
      return;
    }


    function update() {

      button.classList.toggle(
        "visible",
        window.scrollY > 500
      );

    }


    update();


    window.addEventListener(
      "scroll",
      update,
      {
        passive:true
      }
    );


    button.addEventListener(
      "click",
      function () {

        window.scrollTo({

          top:0,

          behavior:"smooth"

        });

      }
    );

  }


  /* =======================================================
     HOME LINKS
  ======================================================== */

  function setupHomeLinks() {

    document
      .querySelectorAll(
        "[data-home-link]"
      )
      .forEach(
        function (link) {

          link.href = "#home";

        }
      );

  }


  /* =======================================================
     CURRENT YEAR
  ======================================================== */

  function setupYear() {

    const element =
      document.getElementById(
        "luxYear"
      );


    if (element) {

      element.textContent =
        String(
          new Date().getFullYear()
        );

    }

  }


  /* =======================================================
     RATING STARS
  ======================================================== */

  function setupRating() {

    const rating =
      parseFloat(
        business.Rating
      );


    if (
      Number.isNaN(rating)
    ) {

      return;

    }


    const rounded =
      Math.max(
        0,
        Math.min(
          5,
          Math.round(rating)
        )
      );


    document
      .querySelectorAll(
        ".lux-stars"
      )
      .forEach(
        function (element) {

          let output = "";

          for (
            let i = 1;
            i <= 5;
            i++
          ) {

            output +=
              i <= rounded
                ? "★"
                : "☆";

          }

          element.textContent =
            output;

        }
      );

  }


  /* =======================================================
     CLEAN MISSING DATA
  ======================================================== */

  function cleanMissingData() {

    const rules = [

      {
        selector:
          "[data-business-owner]",
        value:
          business.OwnerName
      },

      {
        selector:
          "[data-business-established-year]",
        value:
          business.EstablishedYear
      },

      {
        selector:
          "[data-instagram]",
        value:
          business.InstagramURL
      },

      {
        selector:
          "[data-facebook]",
        value:
          business.FacebookURL
      },

      {
        selector:
          "[data-youtube]",
        value:
          business.YoutubeURL
      }

    ];


    rules.forEach(
      function (rule) {

        if (
          rule.value
        ) {

          return;

        }


        document
          .querySelectorAll(
            rule.selector
          )
          .forEach(
            function (element) {

              /*
                Do not remove complete cards.
                Only visually soften unavailable
                data where appropriate.
              */

              element.classList.add(
                "is-empty"
              );

            }
          );

      }
    );

  }


  /* =======================================================
     LAZY IMAGE FALLBACK
  ======================================================== */

  function setupLazyImages() {

    document
      .querySelectorAll(
        "img"
      )
      .forEach(
        function (img) {

          if (
            !img.loading
          ) {

            img.loading =
              "lazy";

          }


          img.addEventListener(
            "error",
            function () {

              img.classList.add(
                "image-error"
              );

            },
            {
              once:true
            }
          );

        }
      );

  }


  /* =======================================================
     HERO PARALLAX
  ======================================================== */

  function setupHeroParallax() {

    const hero =
      document.querySelector(
        ".lux-hero"
      );


    if (!hero) {
      return;
    }


    /*
      Disable for touch / reduced motion.
    */

    if (
      window.matchMedia &&
      (
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches ||
        window.matchMedia(
          "(pointer: coarse)"
        ).matches
      )
    ) {

      return;

    }


    let ticking = false;


    function update() {

      const rect =
        hero.getBoundingClientRect();


      const viewport =
        window.innerHeight;


      if (
        rect.bottom < 0 ||
        rect.top > viewport
      ) {

        ticking = false;

        return;

      }


      const progress =
        Math.max(
          -1,
          Math.min(
            1,
            -rect.top / hero.offsetHeight
          )
        );


      const images =
        hero.querySelectorAll(
          ".lux-hero-image img"
        );


      images.forEach(
        function (img) {

          img.style.transform =
            "scale(1.02) translateY(" +
            (progress * 18) +
            "px)";

        }
      );


      ticking = false;

    }


    window.addEventListener(
      "scroll",
      function () {

        if (ticking) {
          return;
        }


        ticking = true;


        window.requestAnimationFrame(
          update
        );

      },
      {
        passive:true
      }
    );

  }


  /* =======================================================
     HOVER PAUSE FOR DESKTOP
  ======================================================== */

  function setupHeroHover() {

    const hero =
      document.querySelector(
        ".lux-hero"
      );


    if (!hero) {
      return;
    }


    /*
      Remove any previous handlers first.
      This makes re-initialization safe.
    */

    if (heroMouseEnterHandler) {

      hero.removeEventListener(
        "mouseenter",
        heroMouseEnterHandler
      );

    }


    if (heroMouseLeaveHandler) {

      hero.removeEventListener(
        "mouseleave",
        heroMouseLeaveHandler
      );

    }


    /*
      Keep named handlers so destroy()
      can remove them later.
    */

    heroMouseEnterHandler =
      function () {

        if (
          window.matchMedia &&
          window.matchMedia(
            "(pointer: fine)"
          ).matches
        ) {

          stopSlider();

        }

      };


    heroMouseLeaveHandler =
      function () {

        if (
          slides.length > 1 &&
          !document.hidden
        ) {

          startSlider();

        }

      };


    hero.addEventListener(
      "mouseenter",
      heroMouseEnterHandler
    );


    hero.addEventListener(
      "mouseleave",
      heroMouseLeaveHandler
    );

  }


  /* =======================================================
     PAGE VISIBILITY
  ======================================================== */

  function setupVisibilityHandling() {

    /*
      Remove previous handler first.
      The visibility listener is attached to
      document, so it must be explicitly cleaned.
    */

    if (visibilityHandler) {

      document.removeEventListener(
        "visibilitychange",
        visibilityHandler
      );

    }


    visibilityHandler =
      function () {

        if (
          document.hidden
        ) {

          stopSlider();

        } else if (
          slides.length > 1
        ) {

          startSlider();

        }

      };


    document.addEventListener(
      "visibilitychange",
      visibilityHandler
    );

  }


  /* =======================================================
     LOADER
  ======================================================== */

  function hideLoader() {

    const loader =
      document.getElementById(
        "luxLoader"
      );


    if (!loader) {
      return;
    }


    window.setTimeout(
      function () {

        loader.classList.add(
          "is-hidden"
        );

      },
      350
    );

  }


  /* =======================================================
     TEMPLATE STATE
  ======================================================== */

  function getState() {

    return {

      name:
        CONFIG.NAME,

      version:
        CONFIG.VERSION,

      initialized:
        isInitialized,

      business:
        business,

      currentSlide:
        currentSlide,

      slideCount:
        slides.length

    };

  }

  /* =======================================================
     INITIALIZE
     -------------------------------------------------------
     Controlled by business-page.js
     Supports:
     - Re-initialization
     - Business data injection
     - Proper lifecycle cleanup
     - No duplicate initialization
     - Safe template switching
  ======================================================== */

  function init(options) {

    options =
      options || {};


    /* -----------------------------------------------------
       PREVENT DUPLICATE INITIALIZATION
    ----------------------------------------------------- */

    if (isInitialized) {

      return getState();

    }


    /*
      Optional business object from loader.

      business-page.js v10 passes:

        {
          business: {...}
        }
    */

    if (
      options &&
      options.business
    ) {

      business =
        options.business;

    }


    try {

      /*
        Normalize business data.
      */

      normalizeBusiness();


      /*
        Inject reveal styles
        before observers.
      */

      setupRevealStyles();


      /*
        Bind all business information.
      */

      bindBusinessData();


      /*
        Gallery.
      */

      setupGallery();


      /*
        Rating.
      */

      setupRating();


      /*
        Collection actions.
      */

      setupCollectionButtons();


      /*
        Navigation.
      */

      setupMobileMenu();

      setupHeader();

      setupActiveNavigation();

      setupSmoothNavigation();

      setupHomeLinks();


      /*
        Visual effects.
      */

      setupScrollReveal();

      setupBackToTop();

      setupLazyImages();

      setupHeroParallax();

      setupHeroHover();

      setupVisibilityHandling();


      /*
        Footer.
      */

      setupYear();


      /*
        Mark initialized.
      */

      isInitialized =
        true;


      /*
        Expose current template state.
      */

      window.UBNUX_CLOTHING_STATE = {

        business:
          business,

        initialized:
          true,

        template:
          "clothing",

        version:
          CONFIG.VERSION

      };


      /*
        Hide loader after
        everything is ready.
      */

      hideLoader();


      /*
        Return current state.
      */

      return getState();

    } catch (error) {

      console.error(
        "[UBnux Clothing] Initialization error:",
        error
      );


      /*
        Even if one optional
        visual component fails,
        don't leave the page
        stuck on loader.
      */

      hideLoader();


      return getState();

    }

  }


  /* =======================================================
     DESTROY
     -------------------------------------------------------
     Called by business-page.js before another template
     or another business is initialized.
  ======================================================== */

  function destroy() {

    /*
      Mark template as inactive
      immediately.
    */

    isInitialized =
      false;


    /*
      Stop hero slider if the
      function exists.
    */

    try {

      if (
        typeof stopSlider ===
        "function"
      ) {

        stopSlider();

      }

    } catch (error) {

      console.warn(
        "[UBnux Clothing] Slider cleanup error:",
        error
      );

    }


    /*
      Remove visibility listener
      when the named handler exists.
    */

    try {

      if (
        typeof visibilityHandler !==
        "undefined" &&
        visibilityHandler
      ) {

        document.removeEventListener(
          "visibilitychange",
          visibilityHandler
        );

      }

    } catch (error) {

      console.warn(
        "[UBnux Clothing] Visibility cleanup error:",
        error
      );

    }


    /*
      Remove hero hover listeners
      when named handlers exist.
    */

    try {

      const hero =
        document.querySelector(
          ".lux-hero"
        );


      if (hero) {

        if (
          typeof heroMouseEnterHandler !==
          "undefined" &&
          heroMouseEnterHandler
        ) {

          hero.removeEventListener(
            "mouseenter",
            heroMouseEnterHandler
          );

        }


        if (
          typeof heroMouseLeaveHandler !==
          "undefined" &&
          heroMouseLeaveHandler
        ) {

          hero.removeEventListener(
            "mouseleave",
            heroMouseLeaveHandler
          );

        }

      }

    } catch (error) {

      console.warn(
        "[UBnux Clothing] Hero hover cleanup error:",
        error
      );

    }


    /*
      Reset lifecycle references.
    */

    visibilityHandler = null;
    heroMouseEnterHandler = null;
    heroMouseLeaveHandler = null;
    documentClickHandler = null;
    slides = [];
    currentSlide = 0;
    sliderTimer = null;


    /*
      Clear exposed clothing state.
    */

    try {

      if (
        window.UBNUX_CLOTHING_STATE
      ) {

        delete window.UBNUX_CLOTHING_STATE;

      }

    } catch (error) {

      console.warn(
        "[UBnux Clothing] State cleanup error:",
        error
      );

    }

  }


  /* =======================================================
     PUBLIC API
  ======================================================== */

  window.UBnuxBusinessSite = {

    name:
      CONFIG.NAME,

    version:
      CONFIG.VERSION,

    init:
      init,

    initialize:
      init,

    destroy:
      destroy,

    getState:
      getState,

    getBusiness:
      function () {

        return business;

      },

    nextSlide:
      nextSlide,

    previousSlide:
      previousSlide,

    showSlide:
      showSlide

  };


  /* =======================================================
     AUTO INIT
     -------------------------------------------------------
     DISABLED
     -------------------------------------------------------
     business-page.js v10.0.0 is now the single
     lifecycle controller.

     This prevents:
     - double initialization
     - duplicate event listeners
     - duplicate sliders
     - duplicate API/template lifecycle
     ======================================================== */

  /*
    IMPORTANT:

    Do NOT add DOMContentLoaded auto-init here.

    business-page.js will call:

      UBnuxBusinessSite.init({
        business: businessData
      });

    when the correct business page has been loaded.
  */


})(window, document);
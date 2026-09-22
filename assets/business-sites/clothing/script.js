/* =========================================================
   UBnux Clothing Business Website
   File:
   assets/business-sites/clothing/script.js

   Version:
   1.0.0

   Responsibilities:
   - Business data binding
   - Logo fallback
   - Cover fallback
   - Mobile menu
   - Sticky header
   - Smooth navigation
   - Collection interactions
   - Gallery handling
   - Contact actions
   - Rating display
   - Current year
   - Missing data handling
   - Category-specific initialization

   Loaded by:
   assets/js/seo/business-page.js
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


  /* =======================================================
     STATE
  ======================================================= */

  var state = {

    initialized: false,

    business: null,

    route: null,

    seo: null,

    root: null,

    menuOpen: false

  };


  /* =======================================================
     HELPERS
     ======================================================= */

  function qs(
    selector,
    parent
  ) {

    return (
      parent ||
      document
    ).querySelector(
      selector
    );

  }


  function qsa(
    selector,
    parent
  ) {

    return Array.prototype.slice.call(
      (
        parent ||
        document
      ).querySelectorAll(
        selector
      )
    );

  }


  function safe(
    value,
    fallback
  ) {

    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {

      return (
        fallback !== undefined
          ? fallback
          : ""
      );

    }

    return String(value).trim();

  }


  function normalizePhone(
    value
  ) {

    return String(
      value || ""
    ).replace(
      /[^\d+]/g,
      ""
    );

  }


  function normalizeWhatsApp(
    value
  ) {

    var number =
      String(
        value || ""
      ).replace(
        /\D/g,
        ""
      );


    /*
      Indian 10 digit number
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
     FIND BUSINESS ROOT
     ======================================================= */

  function getRoot() {

    if (
      state.root
    ) {

      return state.root;

    }


    state.root =
      qs(
        ".clothing-site"
      );


    return state.root;

  }


  /* =======================================================
     DATA VALUE
     ======================================================= */

  function getBusinessValue(
    business,
    keys
  ) {

    if (!business) {
      return "";
    }


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


  /* =======================================================
     BUSINESS NORMALIZATION
     ======================================================= */

  function normalizeBusiness(
    business
  ) {

    business =
      business ||
      {};


    return {

      name:
        getBusinessValue(
          business,
          [
            "BusinessName",
            "businessName",
            "Name",
            "name"
          ]
        ),

      logo:
        getBusinessValue(
          business,
          [
            "LogoURL",
            "logoURL",
            "logoUrl",
            "logo"
          ]
        ),

      cover:
        getBusinessValue(
          business,
          [
            "CoverURL",
            "coverURL",
            "coverUrl",
            "cover"
          ]
        ),

      description:
        getBusinessValue(
          business,
          [
            "Description",
            "description"
          ]
        ),

      shortDescription:
        getBusinessValue(
          business,
          [
            "ShortDescription",
            "shortDescription",
            "Description",
            "description"
          ]
        ),

      longDescription:
        getBusinessValue(
          business,
          [
            "LongDescription",
            "longDescription",
            "Description",
            "description"
          ]
        ),

      mobile:
        getBusinessValue(
          business,
          [
            "Mobile",
            "mobile",
            "Phone",
            "phone"
          ]
        ),

      whatsapp:
        getBusinessValue(
          business,
          [
            "WhatsApp",
            "whatsapp",
            "Whatsapp",
            "Mobile",
            "mobile"
          ]
        ),

      email:
        getBusinessValue(
          business,
          [
            "Email",
            "email"
          ]
        ),

      website:
        getBusinessValue(
          business,
          [
            "WebsiteURL",
            "websiteURL",
            "websiteUrl",
            "Website",
            "website"
          ]
        ),

      address:
        getBusinessValue(
          business,
          [
            "Address",
            "address"
          ]
        ),

      area:
        getBusinessValue(
          business,
          [
            "Area",
            "area"
          ]
        ),

      pincode:
        getBusinessValue(
          business,
          [
            "Pincode",
            "pincode"
          ]
        ),

      openingTime:
        getBusinessValue(
          business,
          [
            "OpeningTime",
            "openingTime"
          ]
        ),

      closingTime:
        getBusinessValue(
          business,
          [
            "ClosingTime",
            "closingTime"
          ]
        ),

      workingDays:
        getBusinessValue(
          business,
          [
            "WorkingDays",
            "workingDays"
          ]
        ),

      rating:
        getBusinessValue(
          business,
          [
            "Rating",
            "rating"
          ]
        ),

      reviewCount:
        getBusinessValue(
          business,
          [
            "ReviewCount",
            "reviewCount"
          ]
        ),

      owner:
        getBusinessValue(
          business,
          [
            "OwnerName",
            "ownerName",
            "Owner",
            "owner"
          ]
        ),

      establishedYear:
        getBusinessValue(
          business,
          [
            "EstablishedYear",
            "establishedYear"
          ]
        ),

      googlePlace:
        getBusinessValue(
          business,
          [
            "GooglePlaceURL",
            "googlePlaceURL",
            "googlePlaceUrl",
            "GooglePlace",
            "googlePlace"
          ]
        ),

      gallery:
        getBusinessValue(
          business,
          [
            "Gallery",
            "gallery",
            "GalleryURLs",
            "galleryURLs",
            "Images",
            "images"
          ]
        )

    };

  }


  /* =======================================================
     BIND TEXT
     ======================================================= */

  function bindText(
    selector,
    value
  ) {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    qsa(
      selector,
      root
    ).forEach(
      function (element) {

        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {

          element.textContent =
            String(value);

        }

      }
    );

  }


  /* =======================================================
     BIND BUSINESS INFORMATION
     ======================================================= */

  function bindBusinessData() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    var business =
      normalizeBusiness(
        state.business
      );


    /*
      Name
    */

    bindText(
      "[data-business-name]",
      business.name ||
      "Your Fashion Store"
    );


    /*
      Description
    */

    bindText(
      "[data-business-description]",
      business.description
    );


    bindText(
      "[data-business-short-description]",
      business.shortDescription
    );


    bindText(
      "[data-business-long-description]",
      business.longDescription
    );


    /*
      Category

      The category is clothing,
      but API category name can override it.
    */

    var categoryName =
      getBusinessValue(
        state.business,
        [
          "CategoryName",
          "categoryName",
          "Category",
          "category"
        ]
      );


    bindText(
      "[data-business-category]",
      categoryName ||
      "Clothing & Fashion"
    );


    /*
      Contact
    */

    bindText(
      "[data-business-mobile]",
      business.mobile
    );


    bindText(
      "[data-business-whatsapp]",
      business.whatsapp
    );


    bindText(
      "[data-business-email]",
      business.email
    );


    /*
      Location
    */

    bindText(
      "[data-business-address]",
      business.address ||
      "Address not available"
    );


    bindText(
      "[data-business-area]",
      business.area
    );


    bindText(
      "[data-business-pincode]",
      business.pincode
    );


    /*
      Hours
    */

    bindText(
      "[data-business-opening-time]",
      business.openingTime ||
      "Opening time"
    );


    bindText(
      "[data-business-closing-time]",
      business.closingTime ||
      "Closing time"
    );


    bindText(
      "[data-business-working-days]",
      business.workingDays ||
      "Working days"
    );


    /*
      Rating
    */

    bindText(
      "[data-business-rating]",
      business.rating ||
      "—"
    );


    bindText(
      "[data-business-review-count]",
      business.reviewCount ||
      "0"
    );


    /*
      Owner
    */

    bindText(
      "[data-business-owner]",
      business.owner ||
      "Business Owner"
    );


    /*
      Established
    */

    bindText(
      "[data-business-established-year]",
      business.establishedYear ||
      "—"
    );

  }


  /* =======================================================
     LOGO HANDLING
     ======================================================= */

  function initializeLogos() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    var business =
      normalizeBusiness(
        state.business
      );


    var logos =
      qsa(
        "[data-business-logo]",
        root
      );


    logos.forEach(
      function (img) {

        var placeholder =
          img.parentElement
            ? qs(
                ".clothing-brand-logo-placeholder",
                img.parentElement
              )
            : null;


        /*
          No logo
        */

        if (
          !business.logo
        ) {

          img.style.display =
            "none";


          if (placeholder) {

            placeholder.style.display =
              "flex";

          }

          return;

        }


        img.alt =
          business.name ||
          "Business Logo";


        img.src =
          business.logo;


        img.onload =
          function () {

            img.style.display =
              "block";


            if (placeholder) {

              placeholder.style.display =
                "none";

            }

          };


        img.onerror =
          function () {

            img.style.display =
              "none";


            if (placeholder) {

              placeholder.style.display =
                "flex";

            }

          };

      }
    );

  }


  /* =======================================================
     COVER IMAGE HANDLING
     ======================================================= */

  function initializeCovers() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    var business =
      normalizeBusiness(
        state.business
      );


    var covers =
      qsa(
        "[data-business-cover]",
        root
      );


    covers.forEach(
      function (image) {

        if (
          !business.cover
        ) {

          image.style.display =
            "none";


          if (
            image.classList.contains(
              "clothing-hero-image"
            )
          ) {

            var parent =
              image.parentElement;


            if (parent) {

              parent.classList.add(
                "clothing-cover-fallback"
              );

            }

          }

          return;

        }


        image.alt =
          business.name ||
          "Business";


        image.src =
          business.cover;


        image.onload =
          function () {

            image.style.display =
              "block";

          };


        image.onerror =
          function () {

            image.style.display =
              "none";

          };

      }
    );

  }


  /* =======================================================
     CONTACT LINKS
     ======================================================= */

  function initializeContactLinks() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    var business =
      normalizeBusiness(
        state.business
      );


    /*
      CALL
    */

    var phone =
      normalizePhone(
        business.mobile
      );


    qsa(
      "[data-call]",
      root
    ).forEach(
      function (element) {

        if (!phone) {

          element.removeAttribute(
            "href"
          );

          element.classList.add(
            "is-disabled"
          );

          return;

        }


        element.href =
          "tel:" +
          phone;


        element.classList.remove(
          "is-disabled"
        );

      }
    );


    /*
      WHATSAPP
    */

    var whatsapp =
      normalizeWhatsApp(
        business.whatsapp
      );


    qsa(
      "[data-whatsapp]",
      root
    ).forEach(
      function (element) {

        if (!whatsapp) {

          element.removeAttribute(
            "href"
          );

          element.classList.add(
            "is-disabled"
          );

          return;

        }


        element.href =
          "https://wa.me/" +
          whatsapp;


        element.target =
          "_blank";


        element.rel =
          "noopener noreferrer";


        element.classList.remove(
          "is-disabled"
        );

      }
    );


    /*
      WEBSITE
    */

    qsa(
      "[data-website]",
      root
    ).forEach(
      function (element) {

        if (!business.website) {

          element.removeAttribute(
            "href"
          );

          element.classList.add(
            "is-disabled"
          );

          return;

        }


        var website =
          String(
            business.website
          ).trim();


        /*
          Add protocol when missing
        */

        if (
          !/^https?:\/\//i.test(
            website
          )
        ) {

          website =
            "https://" +
            website;

        }


        element.href =
          website;


        element.target =
          "_blank";


        element.rel =
          "noopener noreferrer";


        element.classList.remove(
          "is-disabled"
        );

      }
    );


    /*
      GOOGLE PLACE
    */

    qsa(
      "[data-google-place]",
      root
    ).forEach(
      function (element) {

        if (!business.googlePlace) {

          element.removeAttribute(
            "href"
          );

          element.classList.add(
            "is-disabled"
          );

          return;

        }


        element.href =
          business.googlePlace;


        element.target =
          "_blank";


        element.rel =
          "noopener noreferrer";


        element.classList.remove(
          "is-disabled"
        );

      }
    );

  }


  /* =======================================================
     MOBILE MENU
     ======================================================= */

  function initializeMobileMenu() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    var button =
      qs(
        "#clothingMenuButton",
        root
      );


    var menu =
      qs(
        "#clothingMobileMenu",
        root
      );


    if (
      !button ||
      !menu
    ) {

      return;

    }


    function closeMenu() {

      state.menuOpen =
        false;


      button.classList.remove(
        "active"
      );


      button.setAttribute(
        "aria-expanded",
        "false"
      );


      menu.hidden =
        true;

    }


    function openMenu() {

      state.menuOpen =
        true;


      button.classList.add(
        "active"
      );


      button.setAttribute(
        "aria-expanded",
        "true"
      );


      menu.hidden =
        false;

    }


    button.addEventListener(
      "click",
      function () {

        if (
          state.menuOpen
        ) {

          closeMenu();

        } else {

          openMenu();

        }

      }
    );


    /*
      Close after clicking a link
    */

    qsa(
      "a",
      menu
    ).forEach(
      function (link) {

        link.addEventListener(
          "click",
          function () {

            closeMenu();

          }
        );

      }
    );


    /*
      Close on outside click
    */

    document.addEventListener(
      "click",
      function (event) {

        if (
          !state.menuOpen
        ) {

          return;

        }


        if (
          button.contains(
            event.target
          ) ||
          menu.contains(
            event.target
          )
        ) {

          return;

        }


        closeMenu();

      }
    );


    /*
      Close on Escape
    */

    document.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key ===
          "Escape"
        ) {

          closeMenu();

        }

      }
    );


    /*
      Reset when resizing to desktop
    */

    window.addEventListener(
      "resize",
      function () {

        if (
          window.innerWidth >
          900
        ) {

          closeMenu();

        }

      }
    );

  }


  /* =======================================================
     STICKY HEADER
     ======================================================= */

  function initializeHeader() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    var header =
      qs(
        "#clothingHeader",
        root
      );


    if (!header) {
      return;
    }


    function updateHeader() {

      if (
        window.scrollY >
        20
      ) {

        header.classList.add(
          "scrolled"
        );

      } else {

        header.classList.remove(
          "scrolled"
        );

      }

    }


    updateHeader();


    window.addEventListener(
      "scroll",
      updateHeader,
      {
        passive:
          true
      }
    );

  }


  /* =======================================================
     SMOOTH NAVIGATION
     ======================================================= */

  function initializeSmoothNavigation() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    qsa(
      'a[href^="#"]',
      root
    ).forEach(
      function (link) {

        link.addEventListener(
          "click",
          function (event) {

            var href =
              link.getAttribute(
                "href"
              );


            if (
              !href ||
              href === "#"
            ) {

              return;

            }


            var target;


            try {

              target =
                document.querySelector(
                  href
                );

            } catch (err) {

              return;

            }


            if (!target) {
              return;
            }


            event.preventDefault();


            var header =
              qs(
                "#clothingHeader",
                root
              );


            var offset =
              header
                ? header.offsetHeight
                : 0;


            var position =
              target.getBoundingClientRect()
                .top +
              window.pageYOffset -
              offset;


            window.scrollTo({

              top:
                Math.max(
                  position,
                  0
                ),

              behavior:
                "smooth"

            });


          }
        );

      }
    );

  }


  /* =======================================================
     COLLECTION INTERACTIONS
     ======================================================= */

  function initializeCollections() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    qsa(
      "[data-collection]",
      root
    ).forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            var collection =
              button.getAttribute(
                "data-collection"
              );


            /*
              At present there is no
              product API attached.

              So we provide a useful
              WhatsApp enquiry instead.
            */

            var business =
              normalizeBusiness(
                state.business
              );


            var whatsapp =
              normalizeWhatsApp(
                business.whatsapp
              );


            if (!whatsapp) {

              return;

            }


            var label =
              collection
                ? collection
                    .charAt(0)
                    .toUpperCase() +
                  collection.slice(1)
                : "collection";


            var message =
              "Hello, I would like to know more about your " +
              label +
              " collection at " +
              business.name +
              ".";


            var url =
              "https://wa.me/" +
              whatsapp +
              "?text=" +
              encodeURIComponent(
                message
              );


            window.open(
              url,
              "_blank",
              "noopener,noreferrer"
            );

          }
        );

      }
    );

  }


  /* =======================================================
     GALLERY
     ======================================================= */

  function parseGallery(
    gallery
  ) {

    if (!gallery) {

      return [];

    }


    /*
      Already array
    */

    if (
      Array.isArray(
        gallery
      )
    ) {

      return gallery
        .filter(
          function (item) {

            return (
              item &&
              String(item).trim()
            );

          }
        )
        .map(
          function (item) {

            return String(
              item
            ).trim();

          }
        );

    }


    var value =
      String(
        gallery
      ).trim();


    if (!value) {

      return [];

    }


    /*
      JSON array
    */

    if (
      value.charAt(0) === "[" &&
      value.charAt(
        value.length - 1
      ) === "]"
    ) {

      try {

        var parsed =
          JSON.parse(
            value
          );


        if (
          Array.isArray(
            parsed
          )
        ) {

          return parsed
            .map(
              function (item) {

                if (
                  typeof item ===
                  "string"
                ) {

                  return item;

                }


                if (
                  item &&
                  item.url
                ) {

                  return item.url;

                }


                if (
                  item &&
                  item.image
                ) {

                  return item.image;

                }


                return "";

              }
            )
            .filter(
              function (item) {

                return !!item;

              }
            );

        }

      } catch (err) {}

    }


    /*
      Comma separated
    */

    return value
      .split(
        /[\n,|]+/
      )
      .map(
        function (item) {

          return item.trim();

        }
      )
      .filter(
        function (item) {

          return !!item;

        }
      );

  }


  function initializeGallery() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    var business =
      normalizeBusiness(
        state.business
      );


    var gallery =
      parseGallery(
        business.gallery
      );


    /*
      If gallery data exists,
      replace placeholders.
    */

    if (
      gallery.length === 0
    ) {

      return;

    }


    var galleryContainer =
      qs(
        "[data-gallery]",
        root
      );


    if (!galleryContainer) {

      return;

    }


    galleryContainer.innerHTML =
      "";


    gallery.forEach(
      function (
        imageURL,
        index
      ) {

        var item =
          document.createElement(
            "div"
          );


        item.className =
          "gallery-item";


        /*
          Keep large first image
        */

        if (
          index === 0
        ) {

          item.classList.add(
            "gallery-item-large"
          );

        }


        var image =
          document.createElement(
            "img"
          );


        image.src =
          imageURL;


        image.alt =
          (
            business.name ||
            "Business"
          ) +
          " - Gallery " +
          (
            index + 1
          );


        image.loading =
          index < 2
            ? "eager"
            : "lazy";


        image.style.width =
          "100%";


        image.style.height =
          "100%";


        image.style.objectFit =
          "cover";


        image.onerror =
          function () {

            item.remove();

          };


        item.appendChild(
          image
        );


        galleryContainer.appendChild(
          item
        );

      }
    );

  }


  /* =======================================================
     RATING
     ======================================================= */

  function initializeRating() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    var business =
      normalizeBusiness(
        state.business
      );


    var rating =
      parseFloat(
        business.rating
      );


    if (
      !Number.isFinite(
        rating
      )
    ) {

      rating =
        0;

    }


    rating =
      Math.max(
        0,
        Math.min(
          5,
          rating
        )
      );


    /*
      Hero stars
    */

    qsa(
      ".clothing-stars",
      root
    ).forEach(
      function (stars) {

        var rounded =
          Math.round(
            rating
          );


        var result =
          "";


        for (
          var i = 1;
          i <= 5;
          i++
        ) {

          result +=
            i <= rounded
              ? "★"
              : "☆";

        }


        stars.textContent =
          result;

      }
    );


    /*
      Info rating stars
    */

    qsa(
      ".info-rating span",
      root
    ).forEach(
      function (stars) {

        var rounded =
          Math.round(
            rating
          );


        var result =
          "";


        for (
          var i = 1;
          i <= 5;
          i++
        ) {

          result +=
            i <= rounded
              ? "★"
              : "☆";

        }


        stars.textContent =
          result;

      }
    );

  }


  /* =======================================================
     HIDE EMPTY DATA SECTIONS
     ======================================================= */

  function handleMissingData() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    var business =
      normalizeBusiness(
        state.business
      );


    /*
      Established year badge
    */

    if (
      !business.establishedYear
    ) {

      qsa(
        ".about-badge",
        root
      ).forEach(
        function (element) {

          element.style.display =
            "none";

        }
      );

    }


    /*
      Owner block
    */

    if (
      !business.owner
    ) {

      qsa(
        ".about-owner",
        root
      ).forEach(
        function (element) {

          element.style.display =
            "none";

        }
      );

    }


    /*
      Website links
    */

    if (
      !business.website
    ) {

      qsa(
        "[data-website]",
        root
      ).forEach(
        function (element) {

          element.style.display =
            "none";

        }
      );

    }


    /*
      Google place
    */

    if (
      !business.googlePlace
    ) {

      qsa(
        "[data-google-place]",
        root
      ).forEach(
        function (element) {

          element.style.display =
            "none";

        }
      );

    }


    /*
      WhatsApp
    */

    if (
      !business.whatsapp
    ) {

      qsa(
        "[data-whatsapp]",
        root
      ).forEach(
        function (element) {

          element.style.display =
            "none";

        }
      );

    }


    /*
      Phone
    */

    if (
      !business.mobile
    ) {

      qsa(
        "[data-call]",
        root
      ).forEach(
        function (element) {

          element.style.display =
            "none";

        }
      );

    }

  }


  /* =======================================================
     CURRENT YEAR
     ======================================================= */

  function initializeYear() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    var year =
      new Date()
        .getFullYear();


    qsa(
      "#clothingCurrentYear",
      root
    ).forEach(
      function (element) {

        element.textContent =
          String(
            year
          );

      }
    );

  }


  /* =======================================================
     IMAGE LAZY LOADING
     ======================================================= */

  function initializeImages() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    qsa(
      "img",
      root
    ).forEach(
      function (image) {

        /*
          Do not override eager images.
        */

        if (
          !image.hasAttribute(
            "loading"
          )
        ) {

          image.loading =
            "lazy";

        }

      }
    );

  }


  /* =======================================================
     ACTIVE NAVIGATION
     ======================================================= */

  function initializeActiveNavigation() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    var links =
      qsa(
        '.clothing-navigation a[href^="#"]',
        root
      );


    var sections =
      qsa(
        "main section[id]",
        root
      );


    if (
      !links.length ||
      !sections.length
    ) {

      return;

    }


    function updateActive() {

      var scrollPosition =
        window.scrollY +
        180;


      var current =
        "";


      sections.forEach(
        function (section) {

          if (
            scrollPosition >=
            section.offsetTop
          ) {

            current =
              section.id;

          }

        }
      );


      links.forEach(
        function (link) {

          var href =
            link.getAttribute(
              "href"
            );


          if (
            href ===
            "#" +
            current
          ) {

            link.classList.add(
              "active"
            );

          } else {

            link.classList.remove(
              "active"
            );

          }

        }
      );

    }


    updateActive();


    window.addEventListener(
      "scroll",
      updateActive,
      {
        passive:
          true
      }
    );

  }


  /* =======================================================
     PREVENT DISABLED LINKS
     ======================================================= */

  function initializeDisabledLinks() {

    var root =
      getRoot();


    if (!root) {
      return;
    }


    root.addEventListener(
      "click",
      function (event) {

        var link =
          event.target.closest(
            "a.is-disabled"
          );


        if (!link) {
          return;
        }


        event.preventDefault();

      }
    );

  }


  /* =======================================================
     MAIN INITIALIZER
     ======================================================= */

  async function init(
    options
  ) {

    /*
      Prevent duplicate initialization
    */

    if (
      state.initialized
    ) {

      /*
        If new business data is
        supplied, refresh bindings.
      */

      if (
        options &&
        options.business
      ) {

        state.business =
          options.business;


        state.route =
          options.route ||
          state.route;


        state.seo =
          options.seo ||
          state.seo;


        bindBusinessData();

        initializeLogos();

        initializeCovers();

        initializeContactLinks();

        initializeRating();

        handleMissingData();

        initializeGallery();

      }


      return;

    }


    state.initialized =
      true;


    state.business =
      (
        options &&
        options.business
      ) ||
      {};


    state.route =
      (
        options &&
        options.route
      ) ||
      null;


    state.seo =
      (
        options &&
        options.seo
      ) ||
      null;


    state.root =
      (
        options &&
        options.root
      ) ||
      qs(
        ".clothing-site"
      );


    if (!state.root) {

      console.warn(
        "[UBnux Clothing] Root element not found."
      );

      return;

    }


    /*
      Bind data
    */

    bindBusinessData();


    /*
      Images
    */

    initializeLogos();

    initializeCovers();


    /*
      Contact
    */

    initializeContactLinks();


    /*
      Navigation
    */

    initializeMobileMenu();

    initializeHeader();

    initializeSmoothNavigation();

    initializeActiveNavigation();


    /*
      Clothing interactions
    */

    initializeCollections();


    /*
      Gallery
    */

    initializeGallery();


    /*
      Rating
    */

    initializeRating();


    /*
      Missing data
    */

    handleMissingData();


    /*
      Footer
    */

    initializeYear();


    /*
      Images
    */

    initializeImages();


    /*
      Disabled links
    */

    initializeDisabledLinks();


    /*
      Ready event
    */

    try {

      window.dispatchEvent(
        new CustomEvent(
          "ubnux:clothing-ready",
          {
            detail: {

              business:
                state.business,

              route:
                state.route,

              seo:
                state.seo

            }

          }
        )
      );

    } catch (err) {}


    console.log(
      "[UBnux Clothing] Business website initialized.",
      state.business
    );

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  window.UBnuxBusinessSite = {

    name:
      "clothing",

    version:
      "1.0.0",

    init:
      init,

    initialize:
      init,

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

      }

  };


})(window, document);

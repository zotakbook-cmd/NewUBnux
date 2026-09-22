/* =========================================================
   UBnux Business Manager
   File: custom-url.js
   Version: 1.0.0

   Responsibilities:
   - Generate clean business slug
   - Check slug availability
   - Show public URL
   - Copy URL
   - Open URL
   ========================================================= */

(function (window, document) {

  "use strict";


  const Config =
    window.UBnuxManagerConfig;

  const API =
    window.UBnuxManagerAPI;

  const Auth =
    window.UBnuxManagerAuth;


  if (!Config || !API) {

    console.error(
      "UBnux Custom URL: Config/API unavailable."
    );

    return;

  }


  const CustomURL = {};


  let state = {

    slug:
      "",

    available:
      null,

    checkedSlug:
      "",

    businessId:
      ""

  };


  /* =======================================================
     DOM
  ======================================================= */

  function el(id) {

    return document.getElementById(id);

  }


  /* =======================================================
     SLUGIFY
  ======================================================= */

  function slugify(value) {

    return String(
      value || ""
    )
      .normalize("NFKD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim()
      .replace(
        /&/g,
        " and "
      )
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .replace(
        /-{2,}/g,
        "-"
      );

  }


  /* =======================================================
     PUBLIC ORIGIN
  ======================================================= */

  function getPublicOrigin() {

    return String(
      Config.PUBLIC_ORIGIN ||
      "https://ubnux.com"
    )
      .replace(
        /\/+$/,
        ""
      );

  }


  /* =======================================================
     PUBLIC URL
  ======================================================= */

  function buildPublicURL(
    slug
  ) {

    slug =
      slugify(
        slug
      );


    if (!slug) {

      return "";

    }


    return (
      getPublicOrigin() +
      "/" +
      encodeURIComponent(
        slug
      ) +
      "/"
    );

  }


  /* =======================================================
     STATUS
  ======================================================= */

  function setStatus(
    message,
    type
  ) {

    const box =
      el(
        "slugStatus"
      );


    if (!box) {

      return;

    }


    box.textContent =
      message || "";


    box.className =
      "slug-status " +
      (
        type ||
        "neutral"
      );

  }


  /* =======================================================
     SHOW CURRENT URL
  ======================================================= */

  function updateCurrentURL(
    slug
  ) {

    const box =
      el(
        "currentUrlBox"
      );

    const link =
      el(
        "currentUrl"
      );


    const url =
      buildPublicURL(
        slug
      );


    if (
      !box ||
      !link
    ) {

      return;

    }


    if (!url) {

      box.hidden =
        true;

      link.textContent =
        "";

      link.removeAttribute(
        "href"
      );

      return;

    }


    box.hidden =
      false;


    link.href =
      url;

    link.textContent =
      url;

  }


  /* =======================================================
     GENERATE FROM BUSINESS NAME
  ======================================================= */

  function generateSlug() {

    const nameInput =
      el(
        "businessName"
      );

    const slugInput =
      el(
        "customSlug"
      );


    if (!slugInput) {

      return "";

    }


    const slug =
      slugify(
        nameInput
          ? nameInput.value
          : ""
      );


    slugInput.value =
      slug;


    state.slug =
      slug;

    state.available =
      null;

    state.checkedSlug =
      "";


    updateCurrentURL(
      slug
    );


    if (slug) {

      setStatus(
        "Slug generated. Check availability.",
        "neutral"
      );

    } else {

      setStatus(
        "Enter a business name first.",
        "error"
      );

    }


    return slug;

  }


  /* =======================================================
     GET CURRENT BUSINESS ID
  ======================================================= */

  function getBusinessId() {

    const input =
      el(
        "businessId"
      );


    return String(
      input
        ? input.value
        : ""
    ).trim();

  }


  /* =======================================================
     CHECK AVAILABILITY
  ======================================================= */

  async function checkAvailability(
    slugValue
  ) {

    const slugInput =
      el(
        "customSlug"
      );


    let slug =
      slugify(
        slugValue !== undefined
          ? slugValue
          : (
              slugInput
                ? slugInput.value
                : ""
            )
      );


    if (!slug) {

      setStatus(
        "Enter or generate a slug first.",
        "error"
      );


      return {

        success:
          false,

        available:
          false,

        message:
          "Slug is required."

      };

    }


    if (slugInput) {

      slugInput.value =
        slug;

    }


    state.slug =
      slug;


    updateCurrentURL(
      slug
    );


    const token =
      Auth &&
      typeof Auth.getToken ===
      "function"
        ? Auth.getToken()
        : "";


    if (!token) {

      setStatus(
        "Session expired. Please login again.",
        "error"
      );


      return {

        success:
          false,

        available:
          false,

        message:
          "Authentication required."

      };

    }


    setStatus(
      "Checking availability...",
      "checking"
    );


    const checkButton =
      el(
        "checkSlugBtn"
      );


    if (checkButton) {

      checkButton.disabled =
        true;

    }


    try {

      const result =
        await API.checkSlug(
          token,
          slug,
          getBusinessId()
        );


      console.log(
        "UBnux slug check:",
        result
      );


      if (
        !result ||
        result.success !== true
      ) {

        state.available =
          false;

        state.checkedSlug =
          "";


        setStatus(
          result &&
          result.message
            ? result.message
            : "Unable to check slug.",
          "error"
        );


        return result || {

          success:
            false,

          available:
            false

        };

      }


      const available =
        result.available === true ||
        result.isAvailable === true;


      state.available =
        available;

      state.checkedSlug =
        slug;


      if (available) {

        setStatus(
          "Available — this URL can be used.",
          "success"
        );

      } else {

        setStatus(
          result.message ||
          "This URL is already in use.",
          "error"
        );

      }


      return Object.assign(
        {},
        result,
        {
          available:
            available
        }
      );


    } catch (error) {

      console.error(
        "Slug availability error:",
        error
      );


      state.available =
        false;

      state.checkedSlug =
        "";


      setStatus(
        "Unable to check slug availability.",
        "error"
      );


      return {

        success:
          false,

        available:
          false,

        message:
          error.message ||
          "Unable to check slug."

      };


    } finally {

      if (checkButton) {

        checkButton.disabled =
          false;

      }

    }

  }


  /* =======================================================
     COPY URL
  ======================================================= */

  async function copyURL() {

    const slugInput =
      el(
        "customSlug"
      );


    const url =
      buildPublicURL(
        slugInput
          ? slugInput.value
          : ""
      );


    if (!url) {

      setStatus(
        "No URL available to copy.",
        "error"
      );

      return false;

    }


    try {

      await navigator.clipboard.writeText(
        url
      );


      setStatus(
        "URL copied.",
        "success"
      );


      return true;

    } catch (error) {

      console.warn(
        "Clipboard API failed:",
        error
      );


      try {

        const temp =
          document.createElement(
            "textarea"
          );


        temp.value =
          url;

        temp.style.position =
          "fixed";

        temp.style.opacity =
          "0";


        document.body.appendChild(
          temp
        );


        temp.select();


        const copied =
          document.execCommand(
            "copy"
          );


        temp.remove();


        if (copied) {

          setStatus(
            "URL copied.",
            "success"
          );

        }


        return copied;

      } catch (fallbackError) {

        setStatus(
          "Unable to copy URL.",
          "error"
        );


        return false;

      }

    }

  }


  /* =======================================================
     OPEN URL
  ======================================================= */

  function openURL() {

    const slugInput =
      el(
        "customSlug"
      );


    const url =
      buildPublicURL(
        slugInput
          ? slugInput.value
          : ""
      );


    if (!url) {

      return;

    }


    window.open(
      url,
      "_blank",
      "noopener"
    );

  }


  /* =======================================================
     SET SLUG
  ======================================================= */

  function setSlug(
    slug,
    available
  ) {

    const normalized =
      slugify(
        slug
      );


    const input =
      el(
        "customSlug"
      );


    if (input) {

      input.value =
        normalized;

    }


    state.slug =
      normalized;


    if (
      typeof available ===
      "boolean"
    ) {

      state.available =
        available;

      state.checkedSlug =
        normalized;

    } else {

      state.available =
        null;

      state.checkedSlug =
        "";

    }


    updateCurrentURL(
      normalized
    );


    if (normalized) {

      setStatus(
        "Current business URL.",
        "neutral"
      );

    } else {

      setStatus(
        "Generate or enter a slug.",
        "neutral"
      );

    }

  }


  /* =======================================================
     VALIDATE BEFORE SAVE
  ======================================================= */

  function validateBeforeSave() {

    const input =
      el(
        "customSlug"
      );


    const slug =
      slugify(
        input
          ? input.value
          : ""
      );


    if (!slug) {

      return {

        valid:
          false,

        message:
          "Custom URL slug is required."

      };

    }


    if (
      state.checkedSlug ===
      slug &&
      state.available ===
      false
    ) {

      return {

        valid:
          false,

        message:
          "This custom URL is not available."

      };

    }


    return {

      valid:
        true,

      slug:
        slug

    };

  }


  /* =======================================================
     BIND
  ======================================================= */

  function bind() {

    const generateButton =
      el(
        "generateSlugBtn"
      );

    const checkButton =
      el(
        "checkSlugBtn"
      );

    const copyButton =
      el(
        "copyUrlBtn"
      );

    const openButton =
      el(
        "openUrlBtn"
      );

    const slugInput =
      el(
        "customSlug"
      );


    if (generateButton) {

      generateButton.addEventListener(
        "click",
        generateSlug
      );

    }


    if (checkButton) {

      checkButton.addEventListener(
        "click",
        function () {

          checkAvailability();

        }
      );

    }


    if (copyButton) {

      copyButton.addEventListener(
        "click",
        copyURL
      );

    }


    if (openButton) {

      openButton.addEventListener(
        "click",
        openURL
      );

    }


    if (slugInput) {

      slugInput.addEventListener(
        "input",
        function () {

          const normalized =
            slugify(
              slugInput.value
            );


          state.slug =
            normalized;

          state.available =
            null;

          state.checkedSlug =
            "";


          updateCurrentURL(
            normalized
          );


          setStatus(
            normalized
              ? "Check availability before saving."
              : "Generate or enter a slug.",
            "neutral"
          );

        }
      );


      slugInput.addEventListener(
        "blur",
        function () {

          const normalized =
            slugify(
              slugInput.value
            );


          slugInput.value =
            normalized;


          updateCurrentURL(
            normalized
          );

        }
      );

    }

  }


  /* =======================================================
     EXPORT
  ======================================================= */

  CustomURL.slugify =
    slugify;

  CustomURL.generateSlug =
    generateSlug;

  CustomURL.checkAvailability =
    checkAvailability;

  CustomURL.buildPublicURL =
    buildPublicURL;

  CustomURL.setSlug =
    setSlug;

  CustomURL.updateCurrentURL =
    updateCurrentURL;

  CustomURL.validateBeforeSave =
    validateBeforeSave;

  CustomURL.getState =
    function () {

      return Object.assign(
        {},
        state
      );

    };


  window.UBnuxCustomURL =
    CustomURL;


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      bind
    );

  } else {

    bind();

  }


  console.log(
    "UBnux Custom URL v1.0.0 initialized."
  );


})(window, document);

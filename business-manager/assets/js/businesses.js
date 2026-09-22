/* =========================================================
   UBnux Business Manager
   File: businesses.js
   Version: 1.0.0

   Responsibilities:
   - Load businesses
   - Search/filter
   - Render business table
   - Open editor
   - Populate business form
   - Collect form data
   - Save business
   - Delete business
   ========================================================= */

(function (window, document) {

  "use strict";


  const API =
    window.UBnuxManagerAPI;

  const Auth =
    window.UBnuxManagerAuth;

  const CustomURL =
    window.UBnuxCustomURL;


  if (!API || !Auth) {

    console.error(
      "UBnux Businesses: API/Auth unavailable."
    );

    return;

  }


  const Businesses = {};


  let state = {

    items:
      [],

    filtered:
      [],

    districts:
      [],

    categories:
      [],

    currentBusiness:
      null,

    loading:
      false

  };


  /* =======================================================
     DOM
  ======================================================= */

  function el(id) {

    return document.getElementById(id);

  }


  /* =======================================================
     UTILITIES
  ======================================================= */

  function text(
    value
  ) {

    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    );

  }


  function escapeHTML(
    value
  ) {

    return text(
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


  function truthy(
    value
  ) {

    if (
      value === true ||
      value === 1
    ) {

      return true;

    }


    const v =
      text(
        value
      )
        .trim()
        .toLowerCase();


    return (
      v === "true" ||
      v === "yes" ||
      v === "1" ||
      v === "active"
    );

  }


  function getToken() {

    return Auth.getToken();

  }


  /* =======================================================
     NORMALIZE BUSINESS
  ======================================================= */

  function normalizeBusiness(
    raw
  ) {

    raw =
      raw || {};


    return {

      BusinessID:
        text(
          raw.BusinessID ||
          raw.businessId ||
          raw.businessID ||
          raw.id
        ),

      DistrictID:
        text(
          raw.DistrictID ||
          raw.districtId ||
          raw.districtID
        ),

      DistrictName:
        text(
          raw.DistrictName ||
          raw.districtName
        ),

      CategoryID:
        text(
          raw.CategoryID ||
          raw.categoryId ||
          raw.categoryID
        ),

      CategoryName:
        text(
          raw.CategoryName ||
          raw.categoryName
        ),

      BusinessName:
        text(
          raw.BusinessName ||
          raw.businessName ||
          raw.name
        ),

      Slug:
        text(
          raw.Slug ||
          raw.slug
        ),

      OwnerName:
        text(
          raw.OwnerName
        ),

      Mobile:
        text(
          raw.Mobile
        ),

      WhatsApp:
        text(
          raw.WhatsApp
        ),

      Email:
        text(
          raw.Email
        ),

      Address:
        text(
          raw.Address
        ),

      Area:
        text(
          raw.Area
        ),

      Pincode:
        text(
          raw.Pincode
        ),

      ShortDescription:
        text(
          raw.ShortDescription
        ),

      LongDescription:
        text(
          raw.LongDescription ||
          raw.Description
        ),

      LogoURL:
        text(
          raw.LogoURL
        ),

      CoverURL:
        text(
          raw.CoverURL
        ),

      OpeningTime:
        text(
          raw.OpeningTime
        ),

      ClosingTime:
        text(
          raw.ClosingTime
        ),

      WorkingDays:
        text(
          raw.WorkingDays
        ),

      BusinessStatus:
        text(
          raw.BusinessStatus ||
          "Active"
        ),

      Verified:
        truthy(
          raw.Verified
        ),

      Featured:
        truthy(
          raw.Featured
        ),

      WebsiteURL:
        text(
          raw.WebsiteURL
        ),

      InstagramURL:
        text(
          raw.InstagramURL
        ),

      FacebookURL:
        text(
          raw.FacebookURL
        ),

      YoutubeURL:
        text(
          raw.YoutubeURL
        ),

      EstablishedYear:
        text(
          raw.EstablishedYear
        ),

      GooglePlaceURL:
        text(
          raw.GooglePlaceURL
        ),

      SEO_Title:
        text(
          raw.SEO_Title
        ),

      SEO_Description:
        text(
          raw.SEO_Description
        ),

      CreatedAt:
        text(
          raw.CreatedAt
        ),

      UpdatedAt:
        text(
          raw.UpdatedAt
        )

    };

  }


  /* =======================================================
     RESPONSE DATA EXTRACTOR
  ======================================================= */

  function extractItems(
    response
  ) {

    if (!response) {

      return [];

    }


    if (
      Array.isArray(
        response
      )
    ) {

      return response;

    }


    const candidates = [

      response.businesses,
      response.items,
      response.data,
      response.results,
      response.rows

    ];


    for (
      let i = 0;
      i < candidates.length;
      i++
    ) {

      if (
        Array.isArray(
          candidates[i]
        )
      ) {

        return candidates[i];

      }

    }


    if (
      response.data &&
      typeof response.data ===
      "object"
    ) {

      const nested = [

        response.data.businesses,
        response.data.items,
        response.data.results

      ];


      for (
        let i = 0;
        i < nested.length;
        i++
      ) {

        if (
          Array.isArray(
            nested[i]
          )
        ) {

          return nested[i];

        }

      }

    }


    return [];

  }


  /* =======================================================
     LOAD BUSINESS LIST
  ======================================================= */

  async function loadBusinesses(
    params
  ) {

    const token =
      getToken();


    if (!token) {

      return {

        success:
          false,

        message:
          "Authentication required."

      };

    }


    state.loading =
      true;


    renderLoading();


    try {

      const response =
        await API.getBusinesses(
          token,
          params || {}
        );


      console.log(
        "Manager businesses response:",
        response
      );


      if (
        !response ||
        response.success !== true
      ) {

        state.items =
          [];

        state.filtered =
          [];


        renderError(
          response &&
          response.message
            ? response.message
            : "Unable to load businesses."
        );


        return response;

      }


      state.items =
        extractItems(
          response
        )
          .map(
            normalizeBusiness
          );


      loadMetaFromResponse(
        response
      );


      applyFilters();


      window.dispatchEvent(

        new CustomEvent(
          "ubnux:businesses-loaded",
          {

            detail: {

              items:
                state.items.slice(),

              response:
                response

            }

          }
        )

      );


      return response;


    } catch (error) {

      console.error(
        "Load businesses error:",
        error
      );


      renderError(
        error.message ||
        "Unable to load businesses."
      );


      return {

        success:
          false,

        message:
          error.message

      };


    } finally {

      state.loading =
        false;

    }

  }


  /* =======================================================
     LOAD META
  ======================================================= */

  function loadMetaFromResponse(
    response
  ) {

    const districts =
      response.districts ||
      (
        response.data &&
        response.data.districts
      ) ||
      [];


    const categories =
      response.categories ||
      (
        response.data &&
        response.data.categories
      ) ||
      [];


    if (
      Array.isArray(
        districts
      ) &&
      districts.length
    ) {

      state.districts =
        districts;

      renderDistrictOptions();

    }


    if (
      Array.isArray(
        categories
      ) &&
      categories.length
    ) {

      state.categories =
        categories;

      renderCategoryOptions();

    }

  }


  /* =======================================================
     DISTRICT OPTIONS
  ======================================================= */

  function renderDistrictOptions() {

    const selects = [

      el(
        "filterDistrict"
      ),

      el(
        "districtId"
      )

    ];


    selects.forEach(
      function (
        select,
        index
      ) {

        if (!select) {

          return;

        }


        const first =
          index === 0
            ? '<option value="">All districts</option>'
            : '<option value="">Select District</option>';


        select.innerHTML =
          first +
          state.districts
            .map(
              function (d) {

                const id =
                  text(
                    d.DistrictID ||
                    d.id ||
                    d.code
                  );

                const name =
                  text(
                    d.DistrictName ||
                    d.name ||
                    id
                  );


                return (
                  '<option value="' +
                  escapeHTML(id) +
                  '">' +
                  escapeHTML(name) +
                  "</option>"
                );

              }
            )
            .join("");

      }
    );

  }


  /* =======================================================
     CATEGORY OPTIONS
  ======================================================= */

  function renderCategoryOptions() {

    const selects = [

      el(
        "filterCategory"
      ),

      el(
        "categoryId"
      )

    ];


    selects.forEach(
      function (
        select,
        index
      ) {

        if (!select) {

          return;

        }


        const first =
          index === 0
            ? '<option value="">All categories</option>'
            : '<option value="">Select Category</option>';


        select.innerHTML =
          first +
          state.categories
            .map(
              function (c) {

                const id =
                  text(
                    c.CategoryID ||
                    c.id ||
                    c.slug
                  );

                const name =
                  text(
                    c.CategoryName ||
                    c.name ||
                    id
                  );


                return (
                  '<option value="' +
                  escapeHTML(id) +
                  '">' +
                  escapeHTML(name) +
                  "</option>"
                );

              }
            )
            .join("");

      }
    );

  }


  /* =======================================================
     FILTERS
  ======================================================= */

  function applyFilters() {

    const search =
      text(
        el(
          "searchBox"
        )
          ? el(
              "searchBox"
            ).value
          : ""
      )
        .trim()
        .toLowerCase();


    const district =
      text(
        el(
          "filterDistrict"
        )
          ? el(
              "filterDistrict"
            ).value
          : ""
      );


    const category =
      text(
        el(
          "filterCategory"
        )
          ? el(
              "filterCategory"
            ).value
          : ""
      );


    state.filtered =
      state.items.filter(
        function (item) {

          if (
            district &&
            item.DistrictID !==
            district
          ) {

            return false;

          }


          if (
            category &&
            item.CategoryID !==
            category
          ) {

            return false;

          }


          if (search) {

            const haystack =
              [

                item.BusinessID,
                item.BusinessName,
                item.OwnerName,
                item.Mobile,
                item.WhatsApp,
                item.Email,
                item.Area,
                item.Address,
                item.Slug

              ]
                .join(" ")
                .toLowerCase();


            if (
              !haystack.includes(
                search
              )
            ) {

              return false;

            }

          }


          return true;

        }
      );


    renderTable();

  }


  /* =======================================================
     TABLE
  ======================================================= */

  function renderTable() {

    const host =
      el(
        "businessTable"
      );


    if (!host) {

      return;

    }


    if (
      !state.filtered.length
    ) {

      host.innerHTML =
        '<div class="empty-state">' +
        "<strong>No businesses found.</strong>" +
        "<p>Add a business or change the filters.</p>" +
        "</div>";

      return;

    }


    let html =

      '<div class="table-wrap">' +

      '<table class="data-table">' +

      "<thead>" +

      "<tr>" +

      "<th>Business</th>" +

      "<th>District</th>" +

      "<th>Category</th>" +

      "<th>Status</th>" +

      "<th>URL</th>" +

      "<th>Actions</th>" +

      "</tr>" +

      "</thead>" +

      "<tbody>";


    state.filtered.forEach(
      function (item) {

        const publicURL =
          item.Slug &&
          CustomURL
            ? CustomURL.buildPublicURL(
                item.Slug
              )
            : "";


        html +=

          "<tr>" +

          "<td>" +

          '<div class="business-cell">' +

          "<strong>" +
          escapeHTML(
            item.BusinessName ||
            "Untitled Business"
          ) +
          "</strong>" +

          "<small>" +
          escapeHTML(
            item.BusinessID
          ) +
          "</small>" +

          "</div>" +

          "</td>" +

          "<td>" +
          escapeHTML(
            item.DistrictName ||
            item.DistrictID
          ) +
          "</td>" +

          "<td>" +
          escapeHTML(
            item.CategoryName ||
            item.CategoryID
          ) +
          "</td>" +

          "<td>" +
          '<span class="status-pill">' +
          escapeHTML(
            item.BusinessStatus ||
            "Active"
          ) +
          "</span>" +
          "</td>" +

          "<td>" +

          (
            publicURL
              ? '<a href="' +
                escapeHTML(
                  publicURL
                ) +
                '" target="_blank" rel="noopener">Open</a>'
              : "—"
          ) +

          "</td>" +

          "<td>" +

          '<div class="row-actions zero">' +

          '<button type="button" class="btn light" data-edit-business="' +
          escapeHTML(
            item.BusinessID
          ) +
          '">Edit</button>' +

          '<button type="button" class="btn ghost" data-delete-business="' +
          escapeHTML(
            item.BusinessID
          ) +
          '">Delete</button>' +

          "</div>" +

          "</td>" +

          "</tr>";

      }
    );


    html +=

      "</tbody>" +

      "</table>" +

      "</div>";


    host.innerHTML =
      html;

  }


  /* =======================================================
     STATES
  ======================================================= */

  function renderLoading() {

    const host =
      el(
        "businessTable"
      );


    if (host) {

      host.innerHTML =
        '<div class="empty-state"><p>Loading businesses...</p></div>';

    }

  }


  function renderError(
    message
  ) {

    const host =
      el(
        "businessTable"
      );


    if (host) {

      host.innerHTML =
        '<div class="empty-state">' +
        "<strong>Unable to load businesses</strong>" +
        "<p>" +
        escapeHTML(
          message
        ) +
        "</p>" +
        "</div>";

    }

  }


  /* =======================================================
     FORM HELPERS
  ======================================================= */

  function setValue(
    id,
    value
  ) {

    const node =
      el(
        id
      );


    if (node) {

      node.value =
        value === undefined ||
        value === null
          ? ""
          : value;

    }

  }


  function setChecked(
    id,
    value
  ) {

    const node =
      el(
        id
      );


    if (node) {

      node.checked =
        truthy(
          value
        );

    }

  }


  /* =======================================================
     RESET FORM
  ======================================================= */

  function resetForm() {

    const form =
      el(
        "businessForm"
      );


    if (form) {

      form.reset();

    }


    setValue(
      "businessId",
      ""
    );


    setValue(
      "businessStatus",
      "Active"
    );


    setChecked(
      "verified",
      false
    );


    setChecked(
      "featured",
      false
    );


    const title =
      el(
        "formTitle"
      );


    if (title) {

      title.textContent =
        "Add Business";

    }


    state.currentBusiness =
      null;


    if (CustomURL) {

      CustomURL.setSlug(
        ""
      );

    }

  }


  /* =======================================================
     POPULATE FORM
  ======================================================= */

  function populateForm(
    business
  ) {

    const item =
      normalizeBusiness(
        business
      );


    state.currentBusiness =
      item;


    setValue(
      "businessId",
      item.BusinessID
    );

    setValue(
      "businessName",
      item.BusinessName
    );

    setValue(
      "districtId",
      item.DistrictID
    );

    setValue(
      "categoryId",
      item.CategoryID
    );

    setValue(
      "ownerName",
      item.OwnerName
    );

    setValue(
      "mobile",
      item.Mobile
    );

    setValue(
      "whatsapp",
      item.WhatsApp
    );

    setValue(
      "email",
      item.Email
    );

    setValue(
      "address",
      item.Address
    );

    setValue(
      "area",
      item.Area
    );

    setValue(
      "pincode",
      item.Pincode
    );

    setValue(
      "shortDescription",
      item.ShortDescription
    );

    setValue(
      "longDescription",
      item.LongDescription
    );

    setValue(
      "logoUrl",
      item.LogoURL
    );

    setValue(
      "coverUrl",
      item.CoverURL
    );

    setValue(
      "openingTime",
      item.OpeningTime
    );

    setValue(
      "closingTime",
      item.ClosingTime
    );

    setValue(
      "workingDays",
      item.WorkingDays
    );

    setValue(
      "businessStatus",
      item.BusinessStatus ||
      "Active"
    );

    setValue(
      "establishedYear",
      item.EstablishedYear
    );

    setValue(
      "websiteUrl",
      item.WebsiteURL
    );

    setValue(
      "instagramUrl",
      item.InstagramURL
    );

    setValue(
      "facebookUrl",
      item.FacebookURL
    );

    setValue(
      "youtubeUrl",
      item.YoutubeURL
    );

    setValue(
      "googlePlaceUrl",
      item.GooglePlaceURL
    );

    setValue(
      "seoTitle",
      item.SEO_Title
    );

    setValue(
      "seoDescription",
      item.SEO_Description
    );


    setChecked(
      "verified",
      item.Verified
    );

    setChecked(
      "featured",
      item.Featured
    );


    const title =
      el(
        "formTitle"
      );


    if (title) {

      title.textContent =
        "Edit Business";

    }


    if (CustomURL) {

      CustomURL.setSlug(
        item.Slug
      );

    }

  }


  /* =======================================================
     COLLECT FORM
  ======================================================= */

  function getInputValue(
    id
  ) {

    const node =
      el(
        id
      );


    return node
      ? text(
          node.value
        ).trim()
      : "";

  }


  function collectFormData() {

    return {

      BusinessID:
        getInputValue(
          "businessId"
        ),

      BusinessName:
        getInputValue(
          "businessName"
        ),

      DistrictID:
        getInputValue(
          "districtId"
        ),

      CategoryID:
        getInputValue(
          "categoryId"
        ),

      OwnerName:
        getInputValue(
          "ownerName"
        ),

      Mobile:
        getInputValue(
          "mobile"
        ),

      WhatsApp:
        getInputValue(
          "whatsapp"
        ),

      Email:
        getInputValue(
          "email"
        ),

      Address:
        getInputValue(
          "address"
        ),

      Area:
        getInputValue(
          "area"
        ),

      Pincode:
        getInputValue(
          "pincode"
        ),

      ShortDescription:
        getInputValue(
          "shortDescription"
        ),

      LongDescription:
        getInputValue(
          "longDescription"
        ),

      LogoURL:
        getInputValue(
          "logoUrl"
        ),

      CoverURL:
        getInputValue(
          "coverUrl"
        ),

      OpeningTime:
        getInputValue(
          "openingTime"
        ),

      ClosingTime:
        getInputValue(
          "closingTime"
        ),

      WorkingDays:
        getInputValue(
          "workingDays"
        ),

      BusinessStatus:
        getInputValue(
          "businessStatus"
        ) ||
        "Active",

      EstablishedYear:
        getInputValue(
          "establishedYear"
        ),

      Verified:
        !!(
          el(
            "verified"
          ) &&
          el(
            "verified"
          ).checked
        ),

      Featured:
        !!(
          el(
            "featured"
          ) &&
          el(
            "featured"
          ).checked
        ),

      WebsiteURL:
        getInputValue(
          "websiteUrl"
        ),

      InstagramURL:
        getInputValue(
          "instagramUrl"
        ),

      FacebookURL:
        getInputValue(
          "facebookUrl"
        ),

      YoutubeURL:
        getInputValue(
          "youtubeUrl"
        ),

      GooglePlaceURL:
        getInputValue(
          "googlePlaceUrl"
        ),

      SEO_Title:
        getInputValue(
          "seoTitle"
        ),

      SEO_Description:
        getInputValue(
          "seoDescription"
        ),

      Slug:
        CustomURL
          ? CustomURL.slugify(
              getInputValue(
                "customSlug"
              )
            )
          : getInputValue(
              "customSlug"
            )

    };

  }


  /* =======================================================
     VALIDATE
  ======================================================= */

  function validateBusiness(
    business
  ) {

    if (
      !business.BusinessName
    ) {

      return {
        valid:
          false,
        message:
          "Business name is required."
      };

    }


    if (
      !business.DistrictID
    ) {

      return {
        valid:
          false,
        message:
          "District is required."
      };

    }


    if (
      !business.CategoryID
    ) {

      return {
        valid:
          false,
        message:
          "Category is required."
      };

    }


    if (
      !business.Slug
    ) {

      return {
        valid:
          false,
        message:
          "Custom business URL is required."
      };

    }


    return {
      valid:
        true
    };

  }


  /* =======================================================
     SAVE
  ======================================================= */

  async function saveBusiness() {

    const token =
      getToken();


    if (!token) {

      return {

        success:
          false,

        message:
          "Authentication required."

      };

    }


    const business =
      collectFormData();


    const validation =
      validateBusiness(
        business
      );


    if (
      !validation.valid
    ) {

      notify(
        validation.message,
        "error"
      );


      return {

        success:
          false,

        message:
          validation.message

      };

    }


    const saveButton =
      el(
        "saveBtn"
      );


    if (saveButton) {

      saveButton.disabled =
        true;

      saveButton.textContent =
        "Saving...";

    }


    try {

      const response =
        await API.saveBusiness(
          token,
          business
        );


      console.log(
        "Save business response:",
        response
      );


      if (
        !response ||
        response.success !== true
      ) {

        notify(
          response &&
          response.message
            ? response.message
            : "Unable to save business.",
          "error"
        );


        return response;

      }


      notify(
        response.message ||
        "Business saved successfully.",
        "success"
      );


      await loadBusinesses();


      if (
        window.UBnuxManagerApp &&
        typeof window.UBnuxManagerApp.showView ===
        "function"
      ) {

        window.UBnuxManagerApp.showView(
          "businesses"
        );

      }


      return response;


    } catch (error) {

      console.error(
        "Save business error:",
        error
      );


      notify(
        error.message ||
        "Unable to save business.",
        "error"
      );


      return {

        success:
          false,

        message:
          error.message

      };


    } finally {

      if (saveButton) {

        saveButton.disabled =
          false;

        saveButton.textContent =
          "Save Business";

      }

    }

  }


  /* =======================================================
     EDIT
  ======================================================= */

  async function editBusiness(
    businessId
  ) {

    businessId =
      text(
        businessId
      ).trim();


    if (!businessId) {

      return;

    }


    let item =
      state.items.find(
        function (business) {

          return (
            business.BusinessID ===
            businessId
          );

        }
      );


    if (!item) {

      const response =
        await API.getBusiness(
          getToken(),
          businessId
        );


      if (
        response &&
        response.success === true
      ) {

        item =
          normalizeBusiness(
            response.business ||
            response.data ||
            response
          );

      }

    }


    if (!item) {

      notify(
        "Business could not be loaded.",
        "error"
      );

      return;

    }


    populateForm(
      item
    );


    if (
      window.UBnuxManagerApp &&
      typeof window.UBnuxManagerApp.showView ===
      "function"
    ) {

      window.UBnuxManagerApp.showView(
        "editor"
      );

    }

  }


  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteBusiness(
    businessId
  ) {

    businessId =
      text(
        businessId
      ).trim();


    if (!businessId) {

      return;

    }


    const item =
      state.items.find(
        function (business) {

          return (
            business.BusinessID ===
            businessId
          );

        }
      );


    const confirmed =
      window.confirm(
        "Delete " +
        (
          item
            ? item.BusinessName
            : businessId
        ) +
        "?"
      );


    if (!confirmed) {

      return;

    }


    const response =
      await API.deleteBusiness(
        getToken(),
        businessId
      );


    if (
      !response ||
      response.success !== true
    ) {

      notify(
        response &&
        response.message
          ? response.message
          : "Unable to delete business.",
        "error"
      );

      return;

    }


    notify(
      response.message ||
      "Business deleted.",
      "success"
    );


    await loadBusinesses();

  }


  /* =======================================================
     TOAST
  ======================================================= */

  function notify(
    message,
    type
  ) {

    const host =
      el(
        "toastHost"
      );


    if (!host) {

      console.log(
        message
      );

      return;

    }


    const toast =
      document.createElement(
        "div"
      );


    toast.className =
      "toast " +
      (
        type ||
        "info"
      );


    toast.textContent =
      message;


    host.appendChild(
      toast
    );


    setTimeout(
      function () {

        toast.classList.add(
          "show"
        );

      },
      10
    );


    setTimeout(
      function () {

        toast.classList.remove(
          "show"
        );


        setTimeout(
          function () {

            toast.remove();

          },
          250
        );

      },
      3500
    );

  }


  /* =======================================================
     BIND
  ======================================================= */

  function bind() {

    const search =
      el(
        "searchBox"
      );

    const district =
      el(
        "filterDistrict"
      );

    const category =
      el(
        "filterCategory"
      );

    const form =
      el(
        "businessForm"
      );

    const cancel =
      el(
        "cancelBtn"
      );

    const table =
      el(
        "businessTable"
      );


    if (search) {

      search.addEventListener(
        "input",
        applyFilters
      );

    }


    if (district) {

      district.addEventListener(
        "change",
        applyFilters
      );

    }


    if (category) {

      category.addEventListener(
        "change",
        applyFilters
      );

    }


    if (form) {

      form.addEventListener(
        "submit",
        function (
          event
        ) {

          event.preventDefault();

          saveBusiness();

        }
      );

    }


    if (cancel) {

      cancel.addEventListener(
        "click",
        function () {

          resetForm();


          if (
            window.UBnuxManagerApp &&
            typeof window.UBnuxManagerApp.showView ===
            "function"
          ) {

            window.UBnuxManagerApp.showView(
              "businesses"
            );

          }

        }
      );

    }


    if (table) {

      table.addEventListener(
        "click",
        function (
          event
        ) {

          const editButton =
            event.target.closest(
              "[data-edit-business]"
            );


          if (editButton) {

            editBusiness(
              editButton.getAttribute(
                "data-edit-business"
              )
            );

            return;

          }


          const deleteButton =
            event.target.closest(
              "[data-delete-business]"
            );


          if (deleteButton) {

            deleteBusiness(
              deleteButton.getAttribute(
                "data-delete-business"
              )
            );

          }

        }
      );

    }

  }


  /* =======================================================
     EXPORT
  ======================================================= */

  Businesses.load =
    loadBusinesses;

  Businesses.loadBusinesses =
    loadBusinesses;

  Businesses.applyFilters =
    applyFilters;

  Businesses.resetForm =
    resetForm;

  Businesses.populateForm =
    populateForm;

  Businesses.collectFormData =
    collectFormData;

  Businesses.save =
    saveBusiness;

  Businesses.saveBusiness =
    saveBusiness;

  Businesses.edit =
    editBusiness;

  Businesses.delete =
    deleteBusiness;

  Businesses.getItems =
    function () {

      return state.items.slice();

    };

  Businesses.getFiltered =
    function () {

      return state.filtered.slice();

    };

  Businesses.getState =
    function () {

      return state;

    };

  Businesses.notify =
    notify;


  window.UBnuxBusinesses =
    Businesses;


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
    "UBnux Businesses v1.0.0 initialized."
  );


})(window, document);

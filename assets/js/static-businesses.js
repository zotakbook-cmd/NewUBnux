/* =========================================================
   UBnux Static Business Data Loader
   VERSION: 2.1.0
   ARCHITECTURE: Secure Static-First / API Contact
   =========================================================
   Public JSON:
   - Never exposes contact fields to application code
   - Browser revalidation: no-cache
   - Contact data is API-only and no-store
   - Supports index / district / category / slug lookup
   - Resilient JSON parsing and cache handling
   ========================================================= */

(function (window) {
  "use strict";

  var CONFIG = window.UBnuxConfig || window.UBNUX_CONFIG || {};

  var BASE = String(
    CONFIG.STATIC_DATA_BASE || "/assets/data"
  ).replace(/\/+$/, "");

  var INDEX_URL =
    CONFIG.BUSINESS_INDEX_JSON_URL ||
    (BASE + "/business-index.json");

  var DISTRICT_INDEX_URL =
    CONFIG.DISTRICT_INDEX_JSON_URL ||
    (BASE + "/district-index.json");

  var cache = Object.create(null);
  var inflight = Object.create(null);

  /* ---------------------------------------------------------
     BASIC HELPERS
  --------------------------------------------------------- */

  function clean(v) {
    return String(v == null ? "" : v).trim();
  }

  function lower(v) {
    return clean(v).toLowerCase();
  }

  function isObject(v) {
    return v &&
      typeof v === "object" &&
      !Array.isArray(v);
  }

  /* ---------------------------------------------------------
     PUBLIC CONTACT FIELD PROTECTION
  --------------------------------------------------------- */

  var PRIVATE_FIELDS = {
    mobile: true,
    phone: true,
    telephone: true,
    whatsapp: true,
    whatsappnumber: true,
    email: true,
    owner: true,
    ownername: true,
    ownerphone: true,
    ownermobile: true,
    owneremail: true,
    contact: true,
    contactnumber: true,
    contactphone: true,
    contactmobile: true,
    contactemail: true,
    alternatephone: true,
    alternatemobile: true,
    personalphone: true,
    personalmobile: true
  };

  function sanitizeBusiness(business) {
    if (!isObject(business)) {
      return business;
    }

    var safe = {};

    Object.keys(business).forEach(function (key) {
      var normalized = lower(key).replace(/[\s_-]+/g, "");

      if (PRIVATE_FIELDS[normalized]) {
        return;
      }

      safe[key] = business[key];
    });

    return safe;
  }

  function sanitizeRows(rows) {
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows.map(sanitizeBusiness);
  }

  /* ---------------------------------------------------------
     PAYLOAD NORMALIZATION
  --------------------------------------------------------- */

  function normalizePayload(payload) {
    if (Array.isArray(payload)) {
      return sanitizeRows(payload);
    }

    if (!isObject(payload)) {
      return [];
    }

    if (Array.isArray(payload.businesses)) {
      return sanitizeRows(payload.businesses);
    }

    if (Array.isArray(payload.results)) {
      return sanitizeRows(payload.results);
    }

    if (Array.isArray(payload.data)) {
      return sanitizeRows(payload.data);
    }

    if (Array.isArray(payload.items)) {
      return sanitizeRows(payload.items);
    }

    return [];
  }

  /* ---------------------------------------------------------
     SAFE JSON FETCH
  --------------------------------------------------------- */

  function fetchJSON(url) {
    var target = String(url || "").trim();

    if (!target) {
      return Promise.reject(
        new Error("Static JSON URL is empty.")
      );
    }

    return fetch(target, {
      method: "GET",
      credentials: "same-origin",

      /*
       * Always revalidate public static data.
       */
      cache: "no-cache",

      headers: {
        "Accept": "application/json"
      }
    }).then(function (response) {

      if (!response.ok) {
        throw new Error(
          "Static business JSON failed: " +
          response.status +
          " " +
          response.statusText
        );
      }

      /*
       * Detect HTML responses early.
       * Prevents confusing:
       * Unexpected token '<'
       */
      var contentType = String(
        response.headers.get("content-type") || ""
      ).toLowerCase();

      if (
        contentType &&
        contentType.indexOf("application/json") === -1 &&
        contentType.indexOf("+json") === -1
      ) {
        return response.text().then(function (text) {
          var preview = clean(text).slice(0, 80);

          throw new Error(
            "Static JSON endpoint returned non-JSON content" +
            (preview ? ": " + preview : ".")
          );
        });
      }

      return response.text().then(function (text) {
        var raw = clean(text);

        if (!raw) {
          return [];
        }

        try {
          return JSON.parse(raw);
        } catch (error) {
          throw new Error(
            "Invalid JSON from static endpoint: " +
            error.message
          );
        }
      });
    });
  }

  /* ---------------------------------------------------------
     URL HELPERS
  --------------------------------------------------------- */

  function districtFile(districtSlug) {
    var slug = lower(districtSlug);

    if (!slug) {
      return "";
    }

    return (
      BASE +
      "/businesses/" +
      encodeURIComponent(slug) +
      ".json"
    );
  }

  function buildAPIURL(action, params) {
    var apiURL = clean(CONFIG.API_URL || "/api");

    if (!apiURL) {
      apiURL = "/api";
    }

    var separator =
      apiURL.indexOf("?") >= 0 ? "&" : "?";

    var query = [];

    if (action) {
      query.push(
        "action=" +
        encodeURIComponent(action)
      );
    }

    Object.keys(params || {}).forEach(function (key) {
      var value = clean(params[key]);

      if (!value) {
        return;
      }

      query.push(
        encodeURIComponent(key) +
        "=" +
        encodeURIComponent(value)
      );
    });

    return apiURL +
      (query.length ? separator + query.join("&") : "");
  }

  /* ---------------------------------------------------------
     CACHE
  --------------------------------------------------------- */

  function loadOnce(key, url) {
    if (!key || !url) {
      return Promise.reject(
        new Error("Invalid static data cache request.")
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(cache, key)
    ) {
      return Promise.resolve(cache[key]);
    }

    if (inflight[key]) {
      return inflight[key];
    }

    inflight[key] = fetchJSON(url)
      .then(function (payload) {
        cache[key] = payload;
        delete inflight[key];
        return payload;
      })
      .catch(function (error) {
        delete inflight[key];
        throw error;
      });

    return inflight[key];
  }

  /* ---------------------------------------------------------
     DISTRICT DATA
  --------------------------------------------------------- */

  function loadDistrict(districtSlug) {
    var key = lower(districtSlug);

    if (!key) {
      return Promise.resolve([]);
    }

    return loadOnce(
      "district:" + key,
      districtFile(key)
    ).then(normalizePayload);
  }

  /* ---------------------------------------------------------
     GLOBAL INDEX
  --------------------------------------------------------- */

  function loadIndex() {
    return loadOnce(
      "__index",
      INDEX_URL
    ).then(normalizePayload);
  }

  /* ---------------------------------------------------------
     DISTRICT INDEX
  --------------------------------------------------------- */

  function loadDistrictIndex() {
    return loadOnce(
      "__districtIndex",
      DISTRICT_INDEX_URL
    ).then(normalizePayload);
  }

  /* ---------------------------------------------------------
     CATEGORY
  --------------------------------------------------------- */

  function loadCategory(categorySlug) {
    var wanted = lower(categorySlug);

    if (!wanted) {
      return Promise.resolve([]);
    }

    return loadIndex().then(function (rows) {

      return rows.filter(function (business) {
        if (!business) {
          return false;
        }

        return (
          lower(business.category) === wanted ||
          lower(business.categorySlug) === wanted ||
          lower(business.Category) === wanted ||
          lower(business.CategorySlug) === wanted ||
          lower(business.categoryId) === wanted ||
          lower(business.CategoryID) === wanted
        );
      });
    });
  }

  /* ---------------------------------------------------------
     FIND BUSINESS BY SLUG
  --------------------------------------------------------- */

  function findBySlug(slug, districtSlug) {
    var wanted = lower(slug);

    if (!wanted) {
      return Promise.resolve(null);
    }

    var source = districtSlug
      ? loadDistrict(districtSlug)
      : loadIndex();

    return source.then(function (rows) {

      for (var i = 0; i < rows.length; i++) {
        var business = rows[i];

        if (
          lower(
            business &&
            (
              business.slug ||
              business.Slug ||
              business.businessSlug ||
              business.BusinessSlug
            )
          ) === wanted
        ) {
          return business;
        }
      }

      return null;
    });
  }

  /* ---------------------------------------------------------
     CONTACT API
     IMPORTANT:
     Contact data NEVER enters static cache.
  --------------------------------------------------------- */

  function loadContact(businessId, businessSlug) {
    var id = clean(businessId);
    var slug = clean(businessSlug);

    if (!id && !slug) {
      return Promise.reject(
        new Error(
          "Business ID or slug is required."
        )
      );
    }

    var url = buildAPIURL(
      "business-contact",
      {
        id: id,
        slug: slug
      }
    );

    return fetch(url, {
      method: "GET",
      credentials: "same-origin",

      /*
       * Contact data must never be browser cached.
       */
      cache: "no-store",

      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache"
      }
    }).then(function (response) {

      if (!response.ok) {
        throw new Error(
          "Business contact API failed: " +
          response.status +
          " " +
          response.statusText
        );
      }

      var contentType = String(
        response.headers.get("content-type") || ""
      ).toLowerCase();

      if (
        contentType &&
        contentType.indexOf("application/json") === -1 &&
        contentType.indexOf("+json") === -1
      ) {
        throw new Error(
          "Business contact API returned non-JSON content."
        );
      }

      return response.text();
    }).then(function (text) {

      var raw = clean(text);

      if (!raw) {
        throw new Error(
          "Business contact API returned empty response."
        );
      }

      var payload;

      try {
        payload = JSON.parse(raw);
      } catch (error) {
        throw new Error(
          "Invalid business contact JSON: " +
          error.message
        );
      }

      if (
        !payload ||
        payload.success !== true
      ) {
        throw new Error(
          payload &&
          payload.message
            ? payload.message
            : "Business contact unavailable."
        );
      }

      return payload;
    });
  }

  /* ---------------------------------------------------------
     CACHE CLEAR
  --------------------------------------------------------- */

  function clearCache(key) {
    if (key) {
      delete cache[key];
      delete inflight[key];
      return;
    }

    cache = Object.create(null);
    inflight = Object.create(null);
  }

  /* ---------------------------------------------------------
     PUBLIC API
  --------------------------------------------------------- */

  window.UBnuxStaticBusinesses = {

    version: "2.1.0",

    loadDistrict: loadDistrict,

    loadIndex: loadIndex,

    loadDistrictIndex: loadDistrictIndex,

    loadCategory: loadCategory,

    findBySlug: findBySlug,

    loadContact: loadContact,

    clearCache: clearCache,

    sanitizeBusiness: sanitizeBusiness,

    getConfig: function () {
      return {
        base: BASE,
        indexUrl: INDEX_URL,
        districtIndexUrl: DISTRICT_INDEX_URL,
        publicJSONCache: "no-cache",
        contactCache: "no-store",
        contactMode: "api-only",
        privateFieldsRemoved: true
      };
    }

  };

})(window);

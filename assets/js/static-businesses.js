/* =========================================================
   UBnux Static Business Data Loader
   VERSION: 2.0.0
   ARCHITECTURE: Secure Static-First
   =========================================================
   Public JSON must NOT contain Mobile / WhatsApp / Email /
   Phone / Owner contact data. Contact is API-only.
   Public JSON uses browser revalidation (no-cache).
   ========================================================= */
(function (window) {
  "use strict";

  var CONFIG = window.UBnuxConfig || window.UBNUX_CONFIG || {};
  var BASE = CONFIG.STATIC_DATA_BASE || "/assets/data";
  var INDEX_URL = CONFIG.BUSINESS_INDEX_JSON_URL || (BASE + "/business-index.json");
  var DISTRICT_INDEX_URL = CONFIG.DISTRICT_INDEX_JSON_URL || (BASE + "/district-index.json");
  var cache = Object.create(null);
  var inflight = Object.create(null);

  function fetchJSON(url) {
    return fetch(String(url || ""), {
      method: "GET",
      credentials: "same-origin",
      cache: "no-cache",
      headers: { "Accept": "application/json" }
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Static business JSON failed: " + response.status + " " + response.statusText);
      }
      return response.json();
    });
  }

  function normalizePayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.businesses)) return payload.businesses;
    if (payload && Array.isArray(payload.results)) return payload.results;
    return [];
  }

  function districtFile(districtSlug) {
    var slug = String(districtSlug || "").toLowerCase().trim();
    return BASE + "/businesses/" + encodeURIComponent(slug) + ".json";
  }

  function loadOnce(key, url) {
    if (cache[key]) return Promise.resolve(cache[key]);
    if (inflight[key]) return inflight[key];

    inflight[key] = fetchJSON(url).then(function (payload) {
      cache[key] = payload;
      delete inflight[key];
      return payload;
    }).catch(function (error) {
      delete inflight[key];
      throw error;
    });

    return inflight[key];
  }

  function loadDistrict(districtSlug) {
    var key = String(districtSlug || "").toLowerCase().trim();
    if (!key) return Promise.resolve([]);
    return loadOnce("district:" + key, districtFile(key)).then(normalizePayload);
  }

  function loadIndex() {
    return loadOnce("__index", INDEX_URL);
  }

  function loadDistrictIndex() {
    return loadOnce("__districtIndex", DISTRICT_INDEX_URL);
  }

  function loadCategory(categorySlug) {
    var wanted = String(categorySlug || "").toLowerCase().trim();
    if (!wanted) return Promise.resolve([]);

    return loadIndex().then(function (payload) {
      return normalizePayload(payload).filter(function (business) {
        if (!business) return false;
        return String(business.category || business.categorySlug || "").toLowerCase().trim() === wanted;
      });
    });
  }

  function findBySlug(slug, districtSlug) {
    var wanted = String(slug || "").toLowerCase().trim();
    if (!wanted) return Promise.resolve(null);

    var source = districtSlug ? loadDistrict(districtSlug) : loadIndex().then(normalizePayload);
    return source.then(function (rows) {
      return rows.find(function (business) {
        return String(business && (business.slug || business.Slug) || "").toLowerCase().trim() === wanted;
      }) || null;
    });
  }

  function loadContact(businessId, businessSlug) {
    var id = String(businessId || "").trim();
    var slug = String(businessSlug || "").trim();
    if (!id && !slug) return Promise.reject(new Error("Business ID or slug is required."));

    var apiURL = CONFIG.API_URL || "/api";
    var params = [];
    if (id) params.push("id=" + encodeURIComponent(id));
    if (slug) params.push("slug=" + encodeURIComponent(slug));

    return fetch(apiURL + "?action=business-contact&" + params.join("&"), {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache"
      }
    }).then(function (response) {
      if (!response.ok) throw new Error("Business contact API failed: " + response.status);
      return response.json();
    }).then(function (payload) {
      if (!payload || payload.success !== true) {
        throw new Error(payload && payload.message ? payload.message : "Business contact unavailable.");
      }
      return payload;
    });
  }

  function clearCache(key) {
    if (key) {
      delete cache[key];
      delete inflight[key];
      return;
    }
    cache = Object.create(null);
    inflight = Object.create(null);
  }

  window.UBnuxStaticBusinesses = {
    version: "2.0.0",
    loadDistrict: loadDistrict,
    loadIndex: loadIndex,
    loadDistrictIndex: loadDistrictIndex,
    loadCategory: loadCategory,
    findBySlug: findBySlug,
    loadContact: loadContact,
    clearCache: clearCache,
    getConfig: function () {
      return {
        base: BASE,
        indexUrl: INDEX_URL,
        districtIndexUrl: DISTRICT_INDEX_URL,
        publicJSONCache: "no-cache",
        contactCache: "no-store"
      };
    }
  };
})(window);

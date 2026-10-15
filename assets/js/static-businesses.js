/* UBnux Static Business Data Loader v1.0.0 */
(function (window) {
  "use strict";
  var BASE = "/assets/data";
  var cache = Object.create(null);

  function fetchJSON(url) {
    return fetch(url, { cache: "force-cache", credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("Static business JSON failed: " + r.status);
        return r.json();
      });
  }

  function districtFile(districtSlug) {
    return BASE + "/businesses/" + encodeURIComponent(String(districtSlug || "").toLowerCase()) + ".json";
  }

  function loadDistrict(districtSlug) {
    var key = String(districtSlug || "").toLowerCase().trim();
    if (!key) return Promise.resolve([]);
    if (cache[key]) return Promise.resolve(cache[key]);
    return fetchJSON(districtFile(key)).then(function (payload) {
      var rows = Array.isArray(payload) ? payload :
        (payload && Array.isArray(payload.businesses) ? payload.businesses : []);
      cache[key] = rows;
      return rows;
    });
  }

  function loadIndex() {
    if (cache.__index) return Promise.resolve(cache.__index);
    return fetchJSON(BASE + "/business-index.json").then(function (payload) {
      cache.__index = payload;
      return payload;
    });
  }

  function loadCategory(categorySlug) {
    return loadIndex().then(function (payload) {
      var ids = ((payload && payload.businesses) || []).filter(function (b) {
        return String(b.category || "").toLowerCase() === String(categorySlug || "").toLowerCase();
      });
      return ids;
    });
  }

  window.UBnuxStaticBusinesses = {
    version: "1.0.0",
    loadDistrict: loadDistrict,
    loadIndex: loadIndex,
    loadCategory: loadCategory,
    clearCache: function () { cache = Object.create(null); }
  };
})(window);

/* =========================================================
   UBnux District Manager
   File: assets/js/districts.js
   Version: 3.1.0

   Responsibilities
   ---------------------------------------------------------
   - Load districts by state
   - Support DistrictCode / DistrictID / DistrictName / Slug
   - Keep dropdown value compatible with existing app flow
   - Expose district lookup helpers globally
   - Safe API response normalization
   ========================================================= */
(function (window, document) {
  "use strict";

  var VERSION = "3.1.0";
  var config = window.UBNUX_CONFIG || {};
  var districtFilter = document.getElementById("districtFilter");
  var stateFilter = document.getElementById("stateFilter");
  var cache = new Map();
  var districts = [];

  function clean(value) {
    return value === null || value === undefined ? "" : String(value).trim();
  }

  function slugify(value) {
    return clean(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function identity(value) {
    return clean(value).toLowerCase().replace(/[\s_-]+/g, "");
  }

  function getDistrictCode(item) {
    return clean(item && (
      item.DistrictCode || item.districtCode || item.Code || item.code
    ));
  }

  function getDistrictID(item) {
    return clean(item && (
      item.DistrictID || item.districtID || item.id
    ));
  }

  function getDistrictName(item) {
    return clean(item && (
      item.DistrictName || item.districtName || item.Name || item.name
    ));
  }

  function getDistrictSlug(item) {
    return slugify(item && (
      item.Slug || item.DistrictSlug || item.districtSlug || getDistrictName(item)
    ));
  }

  function normalizeItem(item) {
    item = item || {};
    return Object.assign({}, item, {
      DistrictID: getDistrictID(item),
      DistrictName: getDistrictName(item),
      DistrictCode: getDistrictCode(item),
      Slug: getDistrictSlug(item),
      DistrictSlug: getDistrictSlug(item),
      StateCode: clean(item.StateCode || item.stateCode || "").toUpperCase(),
      State: clean(item.State || item.StateName || item.state || "")
    });
  }

  function extractRows(response) {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.data)) return response.data;
    if (response && response.data && Array.isArray(response.data.districts)) return response.data.districts;
    if (response && Array.isArray(response.districts)) return response.districts;
    return [];
  }

  function isSameState(item, stateInput) {
    var target = clean(stateInput);
    if (!target) return true;
    var candidates = [item.StateCode, item.State, item.StateName, item.StateSlug];
    return candidates.some(function (candidate) {
      return clean(candidate) && (
        slugify(candidate) === slugify(target) ||
        identity(candidate) === identity(target)
      );
    });
  }

  function findDistrict(input) {
    var target = clean(input);
    if (!target) return null;
    var targetSlug = slugify(target);
    var targetIdentity = identity(target);

    return districts.find(function (item) {
      var candidates = [
        getDistrictCode(item),
        getDistrictID(item),
        getDistrictName(item),
        getDistrictSlug(item),
        item.DistrictSlug,
        item.Code,
        item.Name
      ];
      return candidates.some(function (candidate) {
        return clean(candidate) && (
          slugify(candidate) === targetSlug ||
          identity(candidate) === targetIdentity
        );
      });
    }) || null;
  }

  function render(list, stateCode) {
    if (!districtFilter) return;
    var current = clean(districtFilter.value);
    districtFilter.innerHTML = "";

    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select District";
    districtFilter.appendChild(placeholder);

    list.forEach(function (raw) {
      var item = normalizeItem(raw);
      var option = document.createElement("option");
      option.value = getDistrictCode(item) || getDistrictID(item) || getDistrictSlug(item);
      option.textContent = getDistrictName(item) || getDistrictCode(item);
      option.dataset.districtCode = getDistrictCode(item);
      option.dataset.districtId = getDistrictID(item);
      option.dataset.districtName = getDistrictName(item);
      option.dataset.slug = getDistrictSlug(item);
      option.dataset.stateCode = clean(item.StateCode || stateCode).toUpperCase();
      districtFilter.appendChild(option);
    });

    if (current) {
      var match = findDistrict(current);
      if (match) districtFilter.value = getDistrictCode(match) || getDistrictID(match) || getDistrictSlug(match);
    }

    districtFilter.disabled = list.length === 0;
  }

  async function loadDistricts(stateCode) {
    var key = identity(stateCode);
    if (!key) {
      clearDistricts();
      return [];
    }

    if (cache.has(key)) {
      districts = cache.get(key).slice();
      render(districts, stateCode);
      return districts.slice();
    }

    if (!window.UBnuxAPI || typeof window.UBnuxAPI.getDistricts !== "function") {
      throw new Error("UBnux API district method is not available.");
    }

    var response = await window.UBnuxAPI.getDistricts(stateCode);
    var rows = extractRows(response)
      .map(normalizeItem)
      .filter(function (item) { return isSameState(item, stateCode); });

    rows.sort(function (a, b) {
      var ao = Number(a.SortOrder || 999999);
      var bo = Number(b.SortOrder || 999999);
      if (ao !== bo) return ao - bo;
      return getDistrictName(a).localeCompare(getDistrictName(b));
    });

    districts = rows;
    cache.set(key, rows.slice());
    render(rows, stateCode);
    return rows.slice();
  }

  function clearDistricts() {
    districts = [];
    if (!districtFilter) return;
    districtFilter.innerHTML = "<option value=\"\">Select District</option>";
    districtFilter.value = "";
    districtFilter.disabled = true;
  }

  function getSelectedDistrict() {
    if (!districtFilter) return null;
    return findDistrict(districtFilter.value);
  }

  function getSelectedState() {
    return stateFilter ? clean(stateFilter.value) : "";
  }

  window.UBnuxDistricts = {
    VERSION: VERSION,
    state: { get districts() { return districts.slice(); } },
    loadDistricts: loadDistricts,
    clearDistricts: clearDistricts,
    findDistrict: findDistrict,
    getDistrict: findDistrict,
    getDistrictCode: function (input) {
      var item = typeof input === "object" ? input : findDistrict(input);
      return item ? getDistrictCode(item) : "";
    },
    getDistrictID: function (input) {
      var item = typeof input === "object" ? input : findDistrict(input);
      return item ? getDistrictID(item) : "";
    },
    getDistrictName: function (input) {
      var item = typeof input === "object" ? input : findDistrict(input);
      return item ? getDistrictName(item) : "";
    },
    getDistrictSlug: function (input) {
      var item = typeof input === "object" ? input : findDistrict(input);
      return item ? getDistrictSlug(item) : "";
    },
    getSelectedDistrict: getSelectedDistrict,
    getSelectedState: getSelectedState,
    getAll: function () { return districts.slice(); }
  };
})(window, document);

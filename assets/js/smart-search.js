/* UBnux Smart Search v5.2.0 - district/category/business aware search */
(function (window, document) {
  "use strict";

  var C = window.UBNUX_CONFIG || {};
  var districtIndexPromise = null;
  var districtChunkCache = Object.create(null);

  var st = {
    active: false,
    q: "",
    matches: [],
    page: 1,
    pageSize: Number(C.BUSINESS_PAGE_SIZE || 18),
    index: []
  };

  function text(v) { return String(v == null ? "" : v).trim(); }
  function norm(v) {
    return text(v).toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\u0900-\u097f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function tokens(v) { return norm(v).split(" ").filter(Boolean); }
  function slug(v) {
    return norm(v).replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }
  function first(b, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = b && b[keys[i]];
      if (v !== undefined && v !== null && text(v) !== "") return v;
    }
    return "";
  }
  function arr(x) {
    if (Array.isArray(x)) return x;
    if (!x || typeof x !== "object") return [];
    var keys = ["businesses", "results", "items", "data", "records", "list"];
    for (var i = 0; i < keys.length; i++) if (Array.isArray(x[keys[i]])) return x[keys[i]];
    return [];
  }
  function unique(list) {
    var seen = Object.create(null), out = [];
    (Array.isArray(list) ? list : []).forEach(function (b, i) {
      if (!b || typeof b !== "object") return;
      var k = text(first(b, ["BusinessID", "businessId", "id", "Slug", "slug", "seoPath"]));
      if (!k) k = norm(first(b, ["BusinessName", "name", "Name"])) + "|" + norm(first(b, ["DistrictID", "district", "District", "DistrictName"])) + "|" + i;
      k = k.toLowerCase();
      if (seen[k]) return;
      seen[k] = true;
      out.push(b);
    });
    return out;
  }
  function hay(b) {
    return [
      first(b, ["name", "Name", "BusinessName"]),
      first(b, ["slug", "Slug", "businessSlug", "BusinessSlug"]),
      first(b, ["state", "State", "stateName", "StateName", "stateSlug", "StateSlug", "StateCode"]),
      first(b, ["district", "District", "districtName", "DistrictName", "districtSlug", "DistrictSlug", "DistrictID", "DistrictCode"]),
      first(b, ["category", "Category", "categoryName", "CategoryName", "categorySlug", "CategorySlug", "categoryId", "CategoryID"]),
      first(b, ["short", "Short", "shortDescription", "ShortDescription", "description", "Description"]),
      first(b, ["area", "Area"]),
      first(b, ["pincode", "Pincode", "PINCode"]),
      first(b, ["address", "Address"])
    ].map(norm).join(" ");
  }
  function fields(b) {
    return {
      name: norm(first(b, ["name", "Name", "BusinessName"])),
      category: norm(first(b, ["category", "Category", "categoryName", "CategoryName", "categorySlug", "CategorySlug"])),
      district: norm(first(b, ["district", "District", "districtName", "DistrictName", "districtSlug", "DistrictSlug"])),
      state: norm(first(b, ["state", "State", "stateName", "StateName", "stateSlug", "StateSlug", "StateCode"]))
    };
  }
  function score(b, q) {
    var f = fields(b), h = hay(b), ts = tokens(q), s = 0;
    if (!ts.length) return 0;
    var all = true;
    ts.forEach(function (t) {
      var matched = h.indexOf(t) >= 0;
      if (!matched) all = false;
      if (f.name === t) s += 1000;
      else if (f.name.indexOf(t) === 0) s += 260;
      else if (f.name.indexOf(t) >= 0) s += 170;
      if (f.category === t) s += 550;
      else if (f.category.indexOf(t) >= 0) s += 140;
      if (f.district === t) s += 500;
      else if (f.district.indexOf(t) >= 0) s += 120;
      if (f.state === t) s += 450;
      else if (f.state.indexOf(t) >= 0) s += 100;
      if (h.indexOf(t) >= 0) s += 30;
    });
    if (!all) return 0;
    if (norm(q) && h.indexOf(norm(q)) >= 0) s += 180;
    if (b.featured === true || norm(b.featured) === "true" || norm(b.Featured) === "true") s += 5;
    if (b.verified === true || norm(b.verified) === "true" || norm(b.Verified) === "true") s += 3;
    return s;
  }
  function fetchJSON(url) {
    return fetch(url, { method: "GET", cache: "no-cache", headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status + " for " + url); return r.text(); })
      .then(function (t) { if (!t || /^\s*</.test(t)) throw new Error("HTML/non-JSON response from " + url); try { return JSON.parse(t); } catch (e) { throw new Error("Invalid JSON from " + url); } });
  }
  function getJSON(url) {
    if (window.UBnuxStaticCache && typeof window.UBnuxStaticCache.getJSON === "function") {
      try { return window.UBnuxStaticCache.getJSON(url); } catch (e) {}
    }
    return fetchJSON(url);
  }
  function indexURL() { return C.BUSINESS_INDEX_JSON_URL || "/assets/data/business-index.json"; }
  function loadIndex() {
    return getJSON(indexURL()).then(function (x) {
      var a = unique(arr(x));
      if (!a.length) throw new Error("Business index is empty");
      st.index = a;
      return a;
    }).catch(function (e) {
      console.warn("UBnux Smart Search index retry:", e);
      return fetchJSON(indexURL()).then(function (x) {
        var a = unique(arr(x));
        st.index = a;
        return a;
      });
    });
  }
  function districtIndexURL() { return C.DISTRICT_INDEX_JSON_URL || "/assets/data/district-index.json"; }
  function loadDistrictIndex() {
    if (!districtIndexPromise) {
      districtIndexPromise = getJSON(districtIndexURL()).then(function (x) {
        var list = arr(x);
        if (!list.length && x && x.data && typeof x.data === "object") list = arr(x.data);
        return list;
      });
    }
    return districtIndexPromise;
  }
  function districtFile(d) { return d && (d.file || d.File || d.url || d.URL || d.dataFile || d.DataFile || d.businessFile || d.BusinessFile || ""); }
  function districtText(d) { return norm([d && d.DistrictName, d && d.District, d && d.slug, d && d.Slug, d && d.districtSlug, d && d.DistrictSlug, d && d.DistrictID].filter(Boolean).join(" ")); }
  function findDistrictForQuery(q) {
    var ts = tokens(q);
    if (!ts.length) return Promise.resolve(null);
    return loadDistrictIndex().then(function (list) {
      var best = null, bestScore = -1;
      list.forEach(function (d) {
        var dh = districtText(d), scoreValue = 0;
        ts.forEach(function (t) {
          if (dh === t) scoreValue += 100;
          else if (dh.indexOf(t) >= 0) scoreValue += 30;
        });
        if (scoreValue > bestScore) { bestScore = scoreValue; best = d; }
      });
      return bestScore > 0 ? best : null;
    }).catch(function () { return null; });
  }
  function loadDistrictChunk(d) {
    var file = districtFile(d);
    if (!file) return Promise.resolve([]);
    if (districtChunkCache[file]) return districtChunkCache[file];
    districtChunkCache[file] = getJSON(file).then(function (x) { return unique(arr(x)); });
    return districtChunkCache[file];
  }
  function render() {
    if (!window.UBnuxBusinesses || typeof window.UBnuxBusinesses.render !== "function") {
      setMessage("Business display module is not ready.");
      return;
    }
    window.UBnuxBusinesses.render(st.matches, st.matches.length);
    var title = document.getElementById("businessSectionTitle");
    if (title) title.textContent = st.q ? 'Search results for "' + st.q + '"' : "Local businesses";
  }
  function setMessage(v) { var m = document.getElementById("selectionMessage"); if (m) m.textContent = v || ""; }
  function updateUrl(q) {
    var p = "/" + slug(q) + "/";
    try { if (history && typeof history.pushState === "function") history.pushState({ ubnuxSearch: q }, "", p); } catch (e) {}
  }
  function search(q, opts) {
    opts = opts || {};
    q = text(q);
    if (!q) {
      st.active = false; st.q = ""; st.matches = []; st.page = 1;
      if (window.UBnuxBusinesses && typeof window.UBnuxBusinesses.render === "function") window.UBnuxBusinesses.render([], 0);
      setMessage("");
      return Promise.resolve([]);
    }
    st.active = true; st.q = q; st.page = 1;
    return findDistrictForQuery(q).then(function (district) {
      var sourcePromise = district ? loadDistrictChunk(district) : loadIndex();
      return sourcePromise.then(function (source) {
        source = unique(source);
        st.matches = source.map(function (b) { return { b: b, s: score(b, q) }; })
          .filter(function (x) { return x.s > 0; })
          .sort(function (a, b) { return b.s - a.s || norm(first(a.b, ["name", "Name", "BusinessName"])).localeCompare(norm(first(b.b, ["name", "Name", "BusinessName"]))); })
          .map(function (x) { return x.b; });
        render();
        setMessage(st.matches.length ? st.matches.length + " business" + (st.matches.length === 1 ? "" : "es") + " found" : 'No businesses found for "' + q + '"');
        if (!opts.noHistory) updateUrl(q);
        return st.matches;
      });
    }).catch(function (e) {
      console.error("UBnux Smart Search failed:", e);
      st.matches = [];
      if (window.UBnuxBusinesses && typeof window.UBnuxBusinesses.render === "function") window.UBnuxBusinesses.render([], 0);
      setMessage("Search data could not load. Please try again.");
      return [];
    });
  }
  function init() {
    var form = document.getElementById("ubnuxSmartSearchForm");
    var input = document.getElementById("ubnuxSmartSearchInput");
    if (form && input && !form.dataset.ubnuxSearchBound) {
      form.dataset.ubnuxSearchBound = "1";
      form.addEventListener("submit", function (e) { e.preventDefault(); search(input.value); });
    }

    document.querySelectorAll("[data-smart-query]").forEach(function (button) {
      if (button.dataset.ubnuxSmartQueryBound) return;
      button.dataset.ubnuxSmartQueryBound = "1";
      button.addEventListener("click", function () {
        var q = text(button.getAttribute("data-smart-query") || "");
        if (input) input.value = q;
        if (q) search(q);
      });
    });

    if (!init._popstate) {
      init._popstate = true;
      window.addEventListener("popstate", function () {
        if (window.UBnuxRouter && typeof window.UBnuxRouter.isSearchRoute === "function" && window.UBnuxRouter.isSearchRoute()) {
          var q = window.UBnuxRouter.searchQuery();
          if (input) input.value = q.replace(/-/g, " ");
          search(q.replace(/-/g, " "), { noHistory: true });
        }
      });
    }
    if (window.UBnuxRouter && typeof window.UBnuxRouter.isSearchRoute === "function" && window.UBnuxRouter.isSearchRoute()) {
      var q0 = window.UBnuxRouter.searchQuery();
      if (input) input.value = q0.replace(/-/g, " ");
      search(q0.replace(/-/g, " "), { noHistory: true });
    }
  }
  window.UBnuxSmartSearch = { version: "5.2.0", state: st, search: search, init: init, loadIndex: loadIndex, getIndex: loadIndex };
})(window, document);

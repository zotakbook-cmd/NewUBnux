/* UBnux Smart Search v5.0.4 - robust static index + direct fetch fallback + pagination */
(function (window, document) {
  "use strict";

  var C = window.UBNUX_CONFIG || {};

  var st = {
    active: false,
    q: "",
    matches: [],
    page: 1,
    pageSize: Number(C.BUSINESS_PAGE_SIZE || 18),
    index: []
  };

  function clean(v) {
    return String(v == null ? "" : v).trim().toLowerCase();
  }

  function text(v) {
    return String(v == null ? "" : v).trim();
  }

  function slug(v) {
    return clean(v)
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function first(b, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = b && b[keys[i]];
      if (v !== undefined && v !== null && text(v) !== "") {
        return v;
      }
    }
    return "";
  }

  function payloadArray(x) {
    if (Array.isArray(x)) return x;
    if (!x || typeof x !== "object") return [];

    var keys = [
      "businesses",
      "results",
      "items",
      "data",
      "records",
      "list"
    ];

    for (var i = 0; i < keys.length; i++) {
      if (Array.isArray(x[keys[i]])) {
        return x[keys[i]];
      }
    }

    return [];
  }

  function unique(list) {
    var seen = Object.create(null);
    var out = [];

    (Array.isArray(list) ? list : []).forEach(function (b, i) {
      if (!b || typeof b !== "object") return;

      var k = text(first(b, [
        "BusinessID",
        "businessId",
        "id",
        "Slug",
        "slug",
        "seoPath"
      ]));

      if (!k) {
        k =
          text(first(b, [
            "BusinessName",
            "name",
            "Name"
          ])).toLowerCase() +
          "|" +
          text(first(b, [
            "DistrictID",
            "district",
            "District",
            "DistrictName"
          ])).toLowerCase() +
          "|" +
          i;
      }

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
      first(b, ["state", "State", "stateName", "StateName", "stateSlug", "StateSlug"]),
      first(b, ["district", "District", "districtName", "DistrictName", "districtSlug", "DistrictSlug"]),
      first(b, ["category", "Category", "categoryName", "CategoryName", "categorySlug", "CategorySlug", "categoryId", "CategoryID"]),
      first(b, ["short", "Short", "shortDescription", "ShortDescription", "description", "Description"]),
      first(b, ["area", "Area"]),
      first(b, ["pincode", "Pincode", "PINCode"]),
      first(b, ["address", "Address"])
    ].map(clean).join(" ");
  }

  function score(b, q) {
    var name = clean(first(b, ["name", "Name", "BusinessName"]));
    var category = clean(first(b, [
      "category",
      "Category",
      "categoryName",
      "CategoryName",
      "categorySlug",
      "CategorySlug"
    ]));
    var district = clean(first(b, [
      "district",
      "District",
      "districtName",
      "DistrictName",
      "districtSlug",
      "DistrictSlug"
    ]));
    var state = clean(first(b, [
      "state",
      "State",
      "stateName",
      "StateName",
      "stateSlug",
      "StateSlug"
    ]));

    var h = hay(b);
    var s = 0;

    if (name === q) s += 1000;
    if (name.indexOf(q) === 0) s += 250;
    else if (name.indexOf(q) >= 0) s += 150;

    if (category === q) s += 500;
    else if (category.indexOf(q) >= 0) s += 100;

    if (district === q) s += 450;
    else if (district.indexOf(q) >= 0) s += 90;

    if (state === q) s += 400;
    else if (state.indexOf(q) >= 0) s += 80;

    if (h.indexOf(q) >= 0) s += 25;

    if (
      b.featured === true ||
      clean(b.featured) === "true" ||
      clean(b.Featured) === "true"
    ) {
      s += 3;
    }

    if (
      b.verified === true ||
      clean(b.verified) === "true" ||
      clean(b.Verified) === "true"
    ) {
      s += 2;
    }

    return s;
  }

  function fetchJSON(url) {
    return fetch(url, {
      method: "GET",
      cache: "no-cache",
      headers: {
        Accept: "application/json"
      }
    }).then(function (r) {
      if (!r.ok) {
        throw new Error("HTTP " + r.status + " for " + url);
      }

      return r.text();
    }).then(function (t) {
      if (!t || /^\s*</.test(t)) {
        throw new Error("HTML/non-JSON response from " + url);
      }

      try {
        return JSON.parse(t);
      } catch (e) {
        throw new Error("Invalid JSON from " + url);
      }
    });
  }

  function getIndexURL() {
    return (
      C.BUSINESS_INDEX_JSON_URL ||
      C.BUSINESS_MANIFEST_JSON_URL ||
      "/assets/data/business-index.json"
    );
  }

  function getIndex() {
    var url = getIndexURL();

    /*
      First use the project's cache module when available.
      If it fails, use direct fetch so Smart Search does not
      become completely dependent on another JS module.
    */
    var cachedPromise = null;

    if (
      window.UBnuxStaticCache &&
      typeof window.UBnuxStaticCache.getJSON === "function"
    ) {
      try {
        cachedPromise = window.UBnuxStaticCache.getJSON(url);
      } catch (e) {
        cachedPromise = null;
      }
    }

    var p = cachedPromise || fetchJSON(url);

    return p.then(function (x) {
      var arr = unique(payloadArray(x));

      if (!arr.length && p !== null) {
        throw new Error("Business index is empty");
      }

      st.index = arr;
      return arr;
    }).catch(function (firstError) {
      console.warn(
        "UBnux Smart Search: cached/static index failed, trying direct fetch.",
        firstError
      );

      return fetchJSON(url).then(function (x) {
        var arr = unique(payloadArray(x));
        st.index = arr;
        return arr;
      });
    });
  }

  function render() {
    if (
      !window.UBnuxBusinesses ||
      typeof window.UBnuxBusinesses.render !== "function"
    ) {
      console.error(
        "UBnux Smart Search: UBnuxBusinesses.render unavailable"
      );
      setMessage("Business display module is not ready.");
      return;
    }

    /*
      Pass every matching business.
      businesses.js decides how many are visible initially.
    */
    window.UBnuxBusinesses.render(
      st.matches,
      st.matches.length
    );

    var title = document.getElementById("businessSectionTitle");

    if (title) {
      title.textContent = st.q
        ? 'Search results for "' + st.q + '"'
        : "Local businesses";
    }
  }

  function setMessage(textValue) {
    var msg = document.getElementById("selectionMessage");

    if (msg) {
      msg.textContent = textValue || "";
    }
  }

  function updateUrl(q) {
    /*
      Do not change the URL to "/" for an empty query.
      Search URLs are only updated after a real query.
    */
    var path = "/" + slug(q) + "/";

    try {
      if (
        window.history &&
        typeof window.history.pushState === "function"
      ) {
        window.history.pushState(
          { ubnuxSearch: q },
          "",
          path
        );
      }
    } catch (e) {
      console.warn(
        "UBnux Smart Search history update failed:",
        e
      );
    }
  }

  function search(q, opts) {
    opts = opts || {};
    q = text(q);

    if (!q) {
      st.active = false;
      st.q = "";
      st.matches = [];
      st.page = 1;

      if (
        window.UBnuxBusinesses &&
        typeof window.UBnuxBusinesses.render === "function"
      ) {
        window.UBnuxBusinesses.render([], 0);
      }

      var emptyTitle = document.getElementById(
        "businessSectionTitle"
      );

      if (emptyTitle) {
        emptyTitle.textContent = "Local businesses";
      }

      setMessage("");
      return Promise.resolve([]);
    }

    st.active = true;
    st.q = q;
    st.page = 1;

    return getIndex()
      .then(function (index) {
        index = unique(index);
        var n = clean(q);

        st.matches = index
          .map(function (b) {
            return {
              b: b,
              s: score(b, n)
            };
          })
          .filter(function (x) {
            return x.s > 0;
          })
          .sort(function (a, b) {
            return (
              b.s - a.s ||
              clean(first(a.b, [
                "name",
                "Name",
                "BusinessName"
              ])).localeCompare(
                clean(first(b.b, [
                  "name",
                  "Name",
                  "BusinessName"
                ]))
              )
            );
          })
          .map(function (x) {
            return x.b;
          });

        render();

        if (st.matches.length) {
          setMessage(
            st.matches.length +
            " business" +
            (st.matches.length === 1 ? "" : "es") +
            " found"
          );
        } else {
          setMessage(
            'No businesses found for "' + q + '"'
          );
        }

        if (!opts.noHistory) {
          updateUrl(q);
        }

        return st.matches;
      })
      .catch(function (e) {
        console.error(
          "UBnux Smart Search failed:",
          e
        );

        st.matches = [];
        st.page = 1;

        if (
          window.UBnuxBusinesses &&
          typeof window.UBnuxBusinesses.render === "function"
        ) {
          window.UBnuxBusinesses.render([], 0);
        }

        setMessage(
          "Search data could not load. Please check business-index.json."
        );

        return [];
      });
  }

  function init() {
    var form = document.getElementById(
      "ubnuxSmartSearchForm"
    );

    var input = document.getElementById(
      "ubnuxSmartSearchInput"
    );

    if (
      form &&
      input &&
      !form.dataset.ubnuxSearchBound
    ) {
      form.dataset.ubnuxSearchBound = "1";

      form.addEventListener(
        "submit",
        function (e) {
          e.preventDefault();
          search(input.value);
        }
      );
    }

    /*
      IMPORTANT:
      Do NOT attach another click handler to Load More.
      businesses.js owns the button.
    */

    window.addEventListener(
      "popstate",
      function () {
        var p = (location.pathname || "/")
          .split("/")
          .filter(Boolean);

        if (
          p.length === 1 &&
          p[0] &&
          p[0] !== "index.html"
        ) {
          search(
            decodeURIComponent(
              p[0].replace(/-/g, " ")
            ),
            { noHistory: true }
          );
        }
      }
    );
  }

  window.UBnuxSmartSearch = {
    version: "5.0.4",
    state: st,
    search: search,
    init: init,
    loadIndex: getIndex,
    getIndex: getIndex
  };

})(window, document);

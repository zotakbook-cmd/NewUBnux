/* UBnux Businesses v5.0.5 - fixed Load More */
(function (window, document) {
  "use strict";

  var PAGE_SIZE = 18;

  var st = {
    items: [],
    allItems: [],
    total: 0,
    shown: 0,
    hasMore: false
  };

  /* ---------------------------------------
     Helpers
  --------------------------------------- */

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function clean(v) {
    return String(v == null ? "" : v).trim();
  }

  function lower(v) {
    return clean(v).toLowerCase();
  }

  function first(obj, keys, fallback) {
    for (var i = 0; i < keys.length; i++) {
      var v = obj ? obj[keys[i]] : "";
      if (v !== undefined && v !== null && clean(v) !== "") {
        return v;
      }
    }
    return fallback == null ? "" : fallback;
  }

  function key(b) {
    return lower(
      first(
        b,
        ["BusinessID", "businessId", "id", "seoPath", "slug"],
        ""
      )
    );
  }

  /* ---------------------------------------
     Safe URL builder
  --------------------------------------- */

  function slugify(v) {
    return clean(v)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function safePath(v) {
    v = clean(v);

    if (!v) return "";

    /*
      Already an internal path
    */
    if (v.charAt(0) === "/") {
      return v;
    }

    /*
      Absolute URL - only allow http/https
    */
    if (/^https?:\/\//i.test(v)) {
      return v;
    }

    return "";
  }

  function pathFor(b) {
    if (!b) return "";

    /*
      1. Existing SEO path
    */
    var existing = safePath(
      first(b, ["seoPath", "SeoPath", "SEOPath"], "")
    );

    if (existing) {
      return existing;
    }

    /*
      2. Build SEO path
    */
    var state = first(
      b,
      ["stateSlug", "StateSlug", "state", "State", "StateName"],
      ""
    );

    var district = first(
      b,
      [
        "districtSlug",
        "DistrictSlug",
        "district",
        "District",
        "DistrictName"
      ],
      ""
    );

    var category = first(
      b,
      [
        "categorySlug",
        "CategorySlug",
        "category",
        "Category",
        "CategoryName"
      ],
      ""
    );

    var slug = first(
      b,
      ["slug", "Slug", "businessSlug", "BusinessSlug"],
      ""
    );

    /*
      If slug is missing, create it from business name
    */
    if (!slug) {
      slug = first(
        b,
        ["name", "Name", "BusinessName"],
        ""
      );
    }

    state = slugify(state);
    district = slugify(district);
    category = slugify(category);
    slug = slugify(slug);

    if (!state || !district || !category || !slug) {
      return "";
    }

    return (
      "/in/" +
      encodeURIComponent(state) +
      "/" +
      encodeURIComponent(district) +
      "/" +
      encodeURIComponent(category) +
      "/" +
      encodeURIComponent(slug) +
      "/"
    );
  }

  /* ---------------------------------------
     Duplicate protection
  --------------------------------------- */

  function unique(list) {
    if (!Array.isArray(list)) return [];

    var seen = Object.create(null);
    var out = [];

    list.forEach(function (b, index) {
      if (!b || typeof b !== "object") return;

      var k = key(b);

      /*
        If no ID/slug exists, use fallback index.
        This prevents unrelated records from being merged.
      */
      if (!k) {
        k = "__index_" + index;
      }

      if (seen[k]) return;

      seen[k] = true;
      out.push(b);
    });

    return out;
  }

  /* ---------------------------------------
     Business card
  --------------------------------------- */

  function card(b) {
    var a = document.createElement("a");

    a.className = "business-card";

    var path = pathFor(b);

    /*
      Never use href="#".
      This was causing the previous card-click problem.
    */
    if (path) {
      a.href = path;

      /*
        Internal navigation
      */
      if (path.charAt(0) === "/") {
        a.setAttribute("data-business-path", path);
      }
    } else {
      a.removeAttribute("href");
      a.setAttribute("aria-disabled", "true");
      a.classList.add("business-card-disabled");
    }

    var name = first(
      b,
      ["name", "Name", "BusinessName"],
      "Business"
    );

    var short = first(
      b,
      [
        "short",
        "Short",
        "shortDescription",
        "ShortDescription",
        "description",
        "Description"
      ],
      ""
    );

    var rating = first(
      b,
      ["rating", "Rating"],
      "0"
    );

    var district = first(
      b,
      ["district", "District", "DistrictName"],
      ""
    );

    var area = first(
      b,
      ["area", "Area"],
      ""
    );

    var verified =
      b.verified === true ||
      b.Verified === true ||
      lower(b.verified) === "true" ||
      lower(b.Verified) === "true";

    var badge = verified ? "Verified" : "Local";

    a.innerHTML =
      '<div class="business-card-body">' +

        '<div class="business-card-top">' +
          '<span class="business-badge">' +
            esc(badge) +
          '</span>' +
        '</div>' +

        '<h3>' +
          esc(name) +
        '</h3>' +

        (short
          ? '<p>' + esc(short) + '</p>'
          : '') +

        '<div class="business-card-meta">' +

          '<span>' +
            '★ ' +
            esc(rating) +
          '</span>' +

          (district
            ? '<span>' + esc(district) + '</span>'
            : '') +

          (area
            ? '<span>' + esc(area) + '</span>'
            : '') +

        '</div>' +

      '</div>';

    /*
      Prevent accidental # navigation
    */
    if (!path) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
      });
    }

    return a;
  }

  /* ---------------------------------------
     Pagination UI
  --------------------------------------- */

  function syncMore() {
    var more = document.getElementById("loadMoreWrapper");
    var button = document.getElementById("loadMoreButton");

    /* Show Load More only when more records are actually loaded. */
    var visible = st.shown < st.allItems.length;
    st.hasMore = visible;

    if (more) {
      more.hidden = !visible;
      more.classList.toggle("hidden", !visible);
      more.style.display = visible ? "" : "none";
    }

    if (button) {
      button.disabled = !visible;
      button.hidden = !visible;
      button.classList.toggle("hidden", !visible);
      button.style.display = visible ? "" : "none";
      button.setAttribute("aria-hidden", visible ? "false" : "true");
    }
  }

  /* ---------------------------------------
     Summary
  --------------------------------------- */

  function updateSummary() {
    var sum = document.getElementById("businessSummary");

    if (!sum) return;

    if (st.total <= 0) {
      sum.textContent = "0 businesses found";
      return;
    }

    if (st.hasMore) {
      sum.textContent =
        "Showing " +
        st.shown +
        " of " +
        st.total +
        " businesses";
    } else {
      sum.textContent =
        st.total +
        (st.total === 1
          ? " business found"
          : " businesses found");
    }
  }

  /* ---------------------------------------
     Render
  --------------------------------------- */

  function render(list, total) {
    var grid = document.getElementById("businessGrid");
    var empty = document.getElementById("emptyState");

    if (!grid) {
      console.warn(
        "UBnuxBusinesses: #businessGrid not found"
      );
      return;
    }

    var incoming = Array.isArray(list)
      ? list.slice()
      : [];

    /*
      Remove duplicates
    */
    incoming = unique(incoming);

    st.allItems = incoming;

    /*
      Total should never be smaller than loaded data.
    */
    var suppliedTotal = Number(total);

    if (!isFinite(suppliedTotal) || suppliedTotal < 0) {
      suppliedTotal = incoming.length;
    }

    st.total = Math.max(
      suppliedTotal,
      incoming.length
    );

    st.shown = Math.min(
      PAGE_SIZE,
      st.allItems.length
    );

    st.items = st.allItems.slice(
      0,
      st.shown
    );

    /*
      Local pagination: if more than PAGE_SIZE records are loaded,
      Load More must be available.
    */
    st.hasMore = st.shown < st.allItems.length;

    grid.innerHTML = "";

    st.items.forEach(function (b) {
      grid.appendChild(card(b));
    });

    if (empty) {
      empty.classList.toggle(
        "hidden",
        st.items.length > 0
      );
    }

    updateSummary();
    syncMore();
  }

  /* ---------------------------------------
     Append More
  --------------------------------------- */

  function appendMore(count) {
    var grid =
      document.getElementById("businessGrid");

    if (!grid) return;

    count = Number(count) || PAGE_SIZE;

    if (count < 1) {
      count = PAGE_SIZE;
    }

    /*
      Only append records which are already loaded.
    */
    var next = Math.min(
      st.allItems.length,
      st.shown + count
    );

    if (next <= st.shown) {
      st.hasMore = false;
      syncMore();
      updateSummary();
      return;
    }

    var fragment =
      document.createDocumentFragment();

    st.allItems
      .slice(st.shown, next)
      .forEach(function (b) {
        fragment.appendChild(card(b));
      });

    grid.appendChild(fragment);

    st.shown = next;

    st.items =
      st.allItems.slice(0, st.shown);

    /*
      This local Load More button can append only records
      already loaded into allItems.
    */
    st.hasMore = st.shown < st.allItems.length;

    updateSummary();
    syncMore();
  }

  /* ---------------------------------------
     Replace all data
  --------------------------------------- */

  function setItems(list, total) {
    render(list, total);
  }

  /* ---------------------------------------
     Reset
  --------------------------------------- */

  function clear() {
    st.items = [];
    st.allItems = [];
    st.total = 0;
    st.shown = 0;
    st.hasMore = false;

    var grid =
      document.getElementById("businessGrid");

    if (grid) {
      grid.innerHTML = "";
    }

    updateSummary();
    syncMore();
  }

  /* ---------------------------------------
     Public API
  --------------------------------------- */

  window.UBnuxBusinesses = {

    state: st,

    render: render,

    renderBusinesses: function () {
      render(
        st.allItems,
        st.total
      );
    },

    appendMore: appendMore,

    setItems: setItems,

    clear: clear,

    getKey: key,

    getPath: pathFor,

    getCount: function () {
      return st.allItems.length;
    },

    getShown: function () {
      return st.shown;
    },

    hasMore: function () {
      return st.hasMore;
    }

  };

})(window, document);
